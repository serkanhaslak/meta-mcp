import type { BucUsageEntry, RateLimitState } from '../types.js';
import { sleep } from './sleep.js';

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export class RateLimiter {
  private state: Map<string, RateLimitState> = new Map();
  private minDelay: number;
  private throttleThreshold: number;
  private lastCallTime = 0;
  private queue: Promise<void> = Promise.resolve();

  constructor(minDelayMs = 200, throttleThreshold = 75) {
    this.minDelay = minDelayMs;
    this.throttleThreshold = throttleThreshold;
  }

  parseBucHeader(header: string | null): void {
    if (!header) return;

    try {
      const parsed = JSON.parse(header);
      for (const [accountId, entries] of Object.entries(parsed)) {
        const usageEntries = entries as BucUsageEntry[];
        for (const entry of usageEntries) {
          this.state.set(accountId, {
            callCount: entry.call_count,
            totalCputime: entry.total_cputime,
            totalTime: entry.total_time,
            estimatedRecovery: entry.estimated_time_to_regain_access,
            lastUpdated: Date.now(),
          });
        }
      }
    } catch {
      // Silently ignore parse errors
    }
  }

  waitIfNeeded(): Promise<void> {
    // Serialize concurrent callers to enforce min-delay guarantee
    const next = this.queue.then(() => this.doWait());
    this.queue = next.catch(() => {});
    return next;
  }

  private async doWait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minDelay) {
      await sleep(this.minDelay - elapsed);
    }

    // Check BUC utilization — skip stale entries
    for (const [accountId, state] of this.state) {
      if (now - state.lastUpdated > STALE_THRESHOLD_MS) {
        this.state.delete(accountId);
        continue;
      }
      const maxUsage = Math.max(state.callCount, state.totalCputime, state.totalTime);
      if (maxUsage >= this.throttleThreshold) {
        // estimatedRecovery is in seconds per Meta docs
        const waitTime = Math.max(state.estimatedRecovery * 1000, 1000);
        await sleep(Math.min(waitTime, 30000));
      }
    }

    this.lastCallTime = Date.now();
  }

  isThrottled(): boolean {
    const now = Date.now();
    for (const [, state] of this.state) {
      if (now - state.lastUpdated > STALE_THRESHOLD_MS) continue;
      const maxUsage = Math.max(state.callCount, state.totalCputime, state.totalTime);
      if (maxUsage >= this.throttleThreshold) return true;
    }
    return false;
  }

  getStatus(): Record<string, RateLimitState> {
    return Object.fromEntries(this.state);
  }
}
