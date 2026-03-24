import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MetaApiClient, MetaApiError } from '../client.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

interface ProxyHeaders {
  'x-meta-token'?: string;
  'x-meta-account-id'?: string;
  authorization?: string;
}

// Cache clients by token so rate limiter state persists across requests
const CLIENT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const clientCache = new Map<string, { client: MetaApiClient; lastSeen: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of clientCache) {
    if (now - entry.lastSeen > CLIENT_TTL_MS) clientCache.delete(token);
  }
}, 2 * 60 * 1000).unref();

function getClient(request: FastifyRequest): MetaApiClient {
  const headers = request.headers as ProxyHeaders;
  const metaToken = headers['x-meta-token'];
  if (!metaToken) {
    throw { statusCode: 400, message: 'Missing X-Meta-Token header. Provide your Meta/Facebook access token.' };
  }

  const requestedAccountId = headers['x-meta-account-id'];

  const cached = clientCache.get(metaToken);
  if (cached) {
    cached.lastSeen = Date.now();
    // If caller requests a different account than the cached default, create a fresh client
    if (requestedAccountId && cached.client.defaultAccountId !== requestedAccountId) {
      return new MetaApiClient(metaToken, { accountId: requestedAccountId });
    }
    return cached.client;
  }

  const client = new MetaApiClient(metaToken, { accountId: requestedAccountId });
  clientCache.set(metaToken, { client, lastSeen: Date.now() });
  return client;
}

async function handleMetaError(reply: FastifyReply, error: unknown): Promise<void> {
  if (error instanceof MetaApiError) {
    reply.status(400).send({
      success: false,
      error: { message: error.message, code: error.code, type: error.type, subcode: error.subcode, fbtrace_id: error.fbtraceId },
    });
    return;
  }
  const err = error as any;
  if (err?.statusCode) {
    reply.status(err.statusCode).send({ success: false, error: { message: err.message } });
    return;
  }
  reply.status(500).send({ success: false, error: { message: (error as Error).message ?? 'Internal server error' } });
}

export function registerRestRoutes(fastify: FastifyInstance): void {

  // ═══════════════════════════════════════════════════════════════════════
  //  GENERIC META API PROXY — full Graph API access
  // ═══════════════════════════════════════════════════════════════════════

  // GET proxy: /api/v1/meta/me/adaccounts?fields=id,name&limit=5
  fastify.get<{ Params: { '*': string }; Querystring: Record<string, string> }>(
    '/api/v1/meta/*',
    async (request, reply) => {
      try {
        const client = getClient(request);
        const path = '/' + request.params['*'];
        const result = await client.get(path, request.query);
        reply.send({ success: true, data: result });
      } catch (error) {
        await handleMetaError(reply, error);
      }
    },
  );

  // POST proxy: /api/v1/meta/act_123/campaigns  body: { name, objective, ... }
  fastify.post<{ Params: { '*': string }; Body: Record<string, any> }>(
    '/api/v1/meta/*',
    async (request, reply) => {
      try {
        const client = getClient(request);
        const path = '/' + request.params['*'];
        const result = await client.post(path, request.body ?? {});
        reply.send({ success: true, data: result });
      } catch (error) {
        await handleMetaError(reply, error);
      }
    },
  );

  // DELETE proxy: /api/v1/meta/123456789
  fastify.delete<{ Params: { '*': string }; Querystring: Record<string, string> }>(
    '/api/v1/meta/*',
    async (request, reply) => {
      try {
        const client = getClient(request);
        const path = '/' + request.params['*'];
        const result = await client.del(path, request.query);
        reply.send({ success: true, data: result });
      } catch (error) {
        await handleMetaError(reply, error);
      }
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  //  CONVENIENCE RESTful ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  // --- Accounts ---
  fastify.get<{ Querystring: Record<string, string> }>('/api/v1/accounts', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get('/me/adaccounts', {
        fields: request.query.fields ?? DEFAULT_FIELDS.ACCOUNT_LIST,
        limit: request.query.limit,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/api/v1/accounts/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.params.id);
      const result = await client.get(`/${actId}`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.ACCOUNT_INFO,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Campaigns ---
  fastify.get<{ Querystring: Record<string, string> }>('/api/v1/campaigns', async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.query.account_id);
      const result = await client.get(`/${actId}/campaigns`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.CAMPAIGN_LIST,
        limit: request.query.limit,
        effective_status: request.query.effective_status,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/api/v1/campaigns/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get(`/${request.params.id}`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.CAMPAIGN_GET,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.post<{ Body: Record<string, any> }>('/api/v1/campaigns', async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/campaigns`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.put<{ Params: { id: string }; Body: Record<string, any> }>('/api/v1/campaigns/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.post(`/${request.params.id}`, request.body);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.delete<{ Params: { id: string } }>('/api/v1/campaigns/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.del(`/${request.params.id}`);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Ad Sets ---
  fastify.get<{ Querystring: Record<string, string> }>('/api/v1/adsets', async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.query.account_id);
      const result = await client.get(`/${actId}/adsets`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.ADSET_LIST,
        limit: request.query.limit,
        effective_status: request.query.effective_status,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/api/v1/adsets/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get(`/${request.params.id}`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.ADSET_LIST,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.post<{ Body: Record<string, any> }>('/api/v1/adsets', async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/adsets`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.put<{ Params: { id: string }; Body: Record<string, any> }>('/api/v1/adsets/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.post(`/${request.params.id}`, request.body);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.delete<{ Params: { id: string } }>('/api/v1/adsets/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.del(`/${request.params.id}`);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Ads ---
  fastify.get<{ Querystring: Record<string, string> }>('/api/v1/ads', async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.query.account_id);
      const result = await client.get(`/${actId}/ads`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.AD_LIST,
        limit: request.query.limit,
        effective_status: request.query.effective_status,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/api/v1/ads/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get(`/${request.params.id}`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.AD_LIST,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.post<{ Body: Record<string, any> }>('/api/v1/ads', async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/ads`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.put<{ Params: { id: string }; Body: Record<string, any> }>('/api/v1/ads/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.post(`/${request.params.id}`, request.body);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.delete<{ Params: { id: string } }>('/api/v1/ads/:id', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.del(`/${request.params.id}`);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Creatives ---
  fastify.get<{ Querystring: Record<string, string> }>('/api/v1/creatives', async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.query.account_id);
      const result = await client.get(`/${actId}/adcreatives`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.CREATIVE_LIST,
        limit: request.query.limit,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.post<{ Body: Record<string, any> }>('/api/v1/creatives', async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/adcreatives`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Insights ---
  fastify.get<{ Params: { objectId: string }; Querystring: Record<string, string> }>('/api/v1/insights/:objectId', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get(`/${request.params.objectId}/insights`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.INSIGHTS,
        date_preset: request.query.date_preset,
        time_range: request.query.time_range,
        breakdowns: request.query.breakdowns,
        level: request.query.level,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Images ---
  fastify.get<{ Querystring: Record<string, string> }>('/api/v1/images', async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.query.account_id);
      const result = await client.get(`/${actId}/adimages`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.IMAGE_LIST,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.post<{ Body: Record<string, any> }>('/api/v1/images', async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/adimages`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Audiences ---
  fastify.get<{ Querystring: Record<string, string> }>('/api/v1/audiences', async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.query.account_id);
      const result = await client.get(`/${actId}/customaudiences`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.AUDIENCE_LIST,
        limit: request.query.limit,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  fastify.post<{ Body: Record<string, any> }>('/api/v1/audiences', async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/customaudiences`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Pixels ---
  fastify.get<{ Querystring: Record<string, string> }>('/api/v1/pixels', async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.query.account_id);
      const result = await client.get(`/${actId}/adspixels`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.PIXEL_LIST,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Conversions API ---
  fastify.post<{ Params: { pixelId: string }; Body: Record<string, any> }>('/api/v1/conversions/:pixelId', async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.post(`/${request.params.pixelId}/events`, request.body);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });
}
