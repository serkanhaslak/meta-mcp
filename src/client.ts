import { RateLimiter } from './utils/rate-limiter.js';
import { getNextCursor } from './utils/pagination.js';
import { sleep } from './utils/sleep.js';
import type { MetaApiResponse, BatchSubRequest, BatchSubResponse } from './types.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export class MetaApiError extends Error {
  code: number;
  type: string;
  subcode?: number;
  fbtraceId?: string;
  isTransient: boolean;

  constructor(err: { message: string; type: string; code: number; error_subcode?: number; fbtrace_id?: string; is_transient?: boolean }) {
    super(err.message);
    this.name = 'MetaApiError';
    this.code = err.code;
    this.type = err.type;
    this.subcode = err.error_subcode;
    this.fbtraceId = err.fbtrace_id;
    this.isTransient = err.is_transient ?? false;
  }
}

export class MetaApiClient {
  readonly baseUrl: string;
  readonly token: string;
  readonly defaultAccountId?: string;
  private rateLimiter: RateLimiter;
  private maxRetries = 3;

  constructor(token: string, options?: { accountId?: string; apiVersion?: string; minDelayMs?: number }) {
    this.token = token;
    this.defaultAccountId = options?.accountId;
    const version = options?.apiVersion ?? 'v22.0';
    this.baseUrl = `https://graph.facebook.com/${version}`;
    this.rateLimiter = new RateLimiter(options?.minDelayMs ?? 200);
  }

  resolveAccountId(accountId?: string): string {
    const id = accountId ?? this.defaultAccountId;
    if (!id) throw new Error('No ad account ID provided. Pass account_id or set META_AD_ACCOUNT_ID env var.');
    return id.startsWith('act_') ? id : `act_${id}`;
  }

  async get<T = any>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = any>(path: string, data?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(path);
    const body = new URLSearchParams();
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      }
    }
    return this.request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }

  async del<T = any>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: 'DELETE' });
  }

  async postMultipart<T = any>(path: string, formData: FormData): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, { method: 'POST', body: formData });
  }

  async uploadFromPath(path: string, endpoint: string, fieldName: string): Promise<any> {
    const filePath = resolve(path);
    const fileBuffer = readFileSync(filePath);
    const fileName = filePath.split('/').pop() ?? 'file';
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append(fieldName, blob, fileName);
    return this.postMultipart(endpoint, formData);
  }

  async getAllPages<T = any>(path: string, params?: Record<string, string | number | undefined>, maxPages = 10): Promise<T[]> {
    const allData: T[] = [];
    let after: string | undefined;
    let pages = 0;

    do {
      const queryParams = { ...params, ...(after ? { after } : {}) };
      const response = await this.get<MetaApiResponse<T>>(path, queryParams);

      if (response.data) {
        allData.push(...(response.data as T[]));
      }

      after = getNextCursor(response as MetaApiResponse);
      pages++;
    } while (after && pages <= maxPages);

    return allData;
  }

  async batch(requests: BatchSubRequest[]): Promise<BatchSubResponse[]> {
    if (requests.length > 50) {
      throw new Error('Batch API supports max 50 sub-requests per call');
    }
    return this.post<BatchSubResponse[]>('/', {
      batch: requests,
      include_headers: true,
    });
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      await this.rateLimiter.waitIfNeeded();

      try {
        const headers = new Headers(init.headers as HeadersInit ?? {});
        headers.set('Authorization', `Bearer ${this.token}`);

        const response = await fetch(url, { ...init, headers });

        const bucHeader = response.headers.get('x-business-use-case-usage');
        this.rateLimiter.parseBucHeader(bucHeader);

        if (response.ok) {
          const text = await response.text();
          try {
            return JSON.parse(text) as T;
          } catch {
            return text as unknown as T;
          }
        }

        const errorBody = await response.text();
        let errorData: any;
        try {
          errorData = JSON.parse(errorBody);
        } catch {
          errorData = { error: { message: errorBody, type: 'UnknownError', code: response.status } };
        }

        const apiError = errorData.error as { message: string; type: string; code: number; error_subcode?: number; fbtrace_id?: string; is_transient?: boolean };

        if (this.isRetryable(response.status, apiError) && attempt < this.maxRetries) {
          await sleep(Math.pow(2, attempt) * 1000); // 1s, 2s, 4s
          lastError = new MetaApiError(apiError);
          continue;
        }

        throw new MetaApiError(apiError);
      } catch (error) {
        if (error instanceof MetaApiError) throw error;

        if (attempt < this.maxRetries) {
          await sleep(Math.pow(2, attempt) * 1000);
          lastError = error as Error;
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error('Request failed after max retries');
  }

  private isRetryable(status: number, error?: any): boolean {
    if ([429, 500, 502, 503].includes(status)) return true;
    if (error?.is_transient) return true;
    if (error?.code === 2) return true;
    return false;
  }
}
