import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { MetaApiClient, MetaApiError } from '../client.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';
import {
  CommonHeadersSchema,
  IdParamSchema,
  MetaErrorResponseSchema,
  successResponse,
  // Accounts
  ListAccountsQuerySchema,
  GetAccountQuerySchema,
  // Campaigns
  ListCampaignsQuerySchema,
  CreateCampaignBodySchema,
  UpdateCampaignBodySchema,
  // Ad Sets
  ListAdsetsQuerySchema,
  CreateAdsetBodySchema,
  UpdateAdsetBodySchema,
  // Ads
  ListAdsQuerySchema,
  CreateAdBodySchema,
  UpdateAdBodySchema,
  // Creatives
  ListCreativesQuerySchema,
  CreateCreativeBodySchema,
  // Insights
  ObjectIdParamSchema,
  GetInsightsQuerySchema,
  // Images
  ListImagesQuerySchema,
  UploadImageBodySchema,
  // Audiences
  ListAudiencesQuerySchema,
  CreateAudienceBodySchema,
  // Pixels
  ListPixelsQuerySchema,
  // Conversions
  PixelIdParamSchema,
  SendConversionBodySchema,
  // Proxy
  ProxyParamsSchema,
  ProxyQuerySchema,
  ProxyBodySchema,
} from './schemas.js';

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

const responses = {
  200: successResponse(),
  201: successResponse(),
  400: MetaErrorResponseSchema,
};

export function registerRestRoutes(fastify: FastifyInstance): void {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  // ═══════════════════════════════════════════════════════════════════════
  //  GENERIC META API PROXY — full Graph API access
  // ═══════════════════════════════════════════════════════════════════════

  app.get('/api/v1/meta/*', {
    schema: {
      tags: ['Proxy'],
      summary: 'GET proxy to Meta Graph API',
      description: 'Forward any GET request to the Meta Graph API. The path after /api/v1/meta/ becomes the Graph API path. Example: /api/v1/meta/me/adaccounts?fields=id,name',
      headers: CommonHeadersSchema,
      params: ProxyParamsSchema,
      querystring: ProxyQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const path = '/' + request.params['*'];
      const result = await client.get(path, request.query);
      reply.send({ success: true, data: result });
    } catch (error) {
      await handleMetaError(reply, error);
    }
  });

  app.post('/api/v1/meta/*', {
    schema: {
      tags: ['Proxy'],
      summary: 'POST proxy to Meta Graph API',
      description: 'Forward any POST request to the Meta Graph API. Example: /api/v1/meta/act_123/campaigns with body { name, objective, ... }',
      headers: CommonHeadersSchema,
      params: ProxyParamsSchema,
      body: ProxyBodySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const path = '/' + request.params['*'];
      const result = await client.post(path, request.body ?? {});
      reply.send({ success: true, data: result });
    } catch (error) {
      await handleMetaError(reply, error);
    }
  });

  app.delete('/api/v1/meta/*', {
    schema: {
      tags: ['Proxy'],
      summary: 'DELETE proxy to Meta Graph API',
      description: 'Forward any DELETE request to the Meta Graph API. Example: /api/v1/meta/123456789',
      headers: CommonHeadersSchema,
      params: ProxyParamsSchema,
      querystring: ProxyQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const path = '/' + request.params['*'];
      const result = await client.del(path, request.query);
      reply.send({ success: true, data: result });
    } catch (error) {
      await handleMetaError(reply, error);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  CONVENIENCE RESTful ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  // --- Accounts ---
  app.get('/api/v1/accounts', {
    schema: {
      tags: ['Accounts'],
      summary: 'List ad accounts',
      description: 'List all accessible ad accounts for the authenticated user.',
      headers: CommonHeadersSchema,
      querystring: ListAccountsQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get('/me/adaccounts', {
        fields: request.query.fields ?? DEFAULT_FIELDS.ACCOUNT_LIST,
        limit: request.query.limit,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.get('/api/v1/accounts/:id', {
    schema: {
      tags: ['Accounts'],
      summary: 'Get account details',
      description: 'Get detailed information about a specific ad account.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      querystring: GetAccountQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
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
  app.get('/api/v1/campaigns', {
    schema: {
      tags: ['Campaigns'],
      summary: 'List campaigns',
      description: 'List campaigns for an ad account with optional filtering by status.',
      headers: CommonHeadersSchema,
      querystring: ListCampaignsQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
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

  app.get('/api/v1/campaigns/:id', {
    schema: {
      tags: ['Campaigns'],
      summary: 'Get campaign',
      description: 'Get detailed information about a specific campaign.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      querystring: GetAccountQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get(`/${request.params.id}`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.CAMPAIGN_GET,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.post('/api/v1/campaigns', {
    schema: {
      tags: ['Campaigns'],
      summary: 'Create campaign',
      description: 'Create a new campaign. Created in PAUSED status by default.',
      headers: CommonHeadersSchema,
      body: CreateCampaignBodySchema,
      response: { 201: responses[201], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/campaigns`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.put('/api/v1/campaigns/:id', {
    schema: {
      tags: ['Campaigns'],
      summary: 'Update campaign',
      description: 'Update an existing campaign. Only provided fields are modified.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      body: UpdateCampaignBodySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.post(`/${request.params.id}`, request.body);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.delete('/api/v1/campaigns/:id', {
    schema: {
      tags: ['Campaigns'],
      summary: 'Delete campaign',
      description: 'Delete a campaign. Sets status to DELETED. All child ad sets and ads stop delivering.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.del(`/${request.params.id}`);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Ad Sets ---
  app.get('/api/v1/adsets', {
    schema: {
      tags: ['Ad Sets'],
      summary: 'List ad sets',
      description: 'List ad sets for an ad account with optional filtering.',
      headers: CommonHeadersSchema,
      querystring: ListAdsetsQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
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

  app.get('/api/v1/adsets/:id', {
    schema: {
      tags: ['Ad Sets'],
      summary: 'Get ad set',
      description: 'Get detailed information about a specific ad set.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      querystring: GetAccountQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get(`/${request.params.id}`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.ADSET_LIST,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.post('/api/v1/adsets', {
    schema: {
      tags: ['Ad Sets'],
      summary: 'Create ad set',
      description: 'Create a new ad set within a campaign. Defines audience targeting, budget, schedule, and optimization.',
      headers: CommonHeadersSchema,
      body: CreateAdsetBodySchema,
      response: { 201: responses[201], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/adsets`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.put('/api/v1/adsets/:id', {
    schema: {
      tags: ['Ad Sets'],
      summary: 'Update ad set',
      description: 'Update an existing ad set. Only provided fields are modified.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      body: UpdateAdsetBodySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.post(`/${request.params.id}`, request.body);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.delete('/api/v1/adsets/:id', {
    schema: {
      tags: ['Ad Sets'],
      summary: 'Delete ad set',
      description: 'Delete an ad set. This is irreversible — all child ads will also be deleted.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.del(`/${request.params.id}`);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Ads ---
  app.get('/api/v1/ads', {
    schema: {
      tags: ['Ads'],
      summary: 'List ads',
      description: 'List ads for an ad account with optional filtering.',
      headers: CommonHeadersSchema,
      querystring: ListAdsQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
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

  app.get('/api/v1/ads/:id', {
    schema: {
      tags: ['Ads'],
      summary: 'Get ad',
      description: 'Get detailed information about a specific ad.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      querystring: GetAccountQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.get(`/${request.params.id}`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.AD_LIST,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.post('/api/v1/ads', {
    schema: {
      tags: ['Ads'],
      summary: 'Create ad',
      description: 'Create a new ad within an ad set. Combines a creative with targeting and budget from the ad set.',
      headers: CommonHeadersSchema,
      body: CreateAdBodySchema,
      response: { 201: responses[201], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/ads`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.put('/api/v1/ads/:id', {
    schema: {
      tags: ['Ads'],
      summary: 'Update ad',
      description: 'Update an existing ad. Only provided fields are modified.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      body: UpdateAdBodySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.post(`/${request.params.id}`, request.body);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.delete('/api/v1/ads/:id', {
    schema: {
      tags: ['Ads'],
      summary: 'Delete ad',
      description: 'Delete an ad. This is irreversible.',
      headers: CommonHeadersSchema,
      params: IdParamSchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.del(`/${request.params.id}`);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Creatives ---
  app.get('/api/v1/creatives', {
    schema: {
      tags: ['Creatives'],
      summary: 'List creatives',
      description: 'List ad creatives for an ad account.',
      headers: CommonHeadersSchema,
      querystring: ListCreativesQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
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

  app.post('/api/v1/creatives', {
    schema: {
      tags: ['Creatives'],
      summary: 'Create creative',
      description: 'Create a new ad creative with images, videos, text, links, and call-to-action buttons.',
      headers: CommonHeadersSchema,
      body: CreateCreativeBodySchema,
      response: { 201: responses[201], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/adcreatives`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Insights ---
  app.get('/api/v1/insights/:objectId', {
    schema: {
      tags: ['Insights'],
      summary: 'Get insights',
      description: 'Get performance insights (impressions, clicks, spend, etc.) for a campaign, ad set, or ad.',
      headers: CommonHeadersSchema,
      params: ObjectIdParamSchema,
      querystring: GetInsightsQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
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
  app.get('/api/v1/images', {
    schema: {
      tags: ['Images'],
      summary: 'List images',
      description: 'List images in the ad account image library.',
      headers: CommonHeadersSchema,
      querystring: ListImagesQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const actId = client.resolveAccountId(request.query.account_id);
      const result = await client.get(`/${actId}/adimages`, {
        fields: request.query.fields ?? DEFAULT_FIELDS.IMAGE_LIST,
      });
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  app.post('/api/v1/images', {
    schema: {
      tags: ['Images'],
      summary: 'Upload image',
      description: 'Upload an image to the ad account library via base64 bytes or public URL.',
      headers: CommonHeadersSchema,
      body: UploadImageBodySchema,
      response: { 201: responses[201], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/adimages`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Audiences ---
  app.get('/api/v1/audiences', {
    schema: {
      tags: ['Audiences'],
      summary: 'List custom audiences',
      description: 'List all custom audiences for an ad account.',
      headers: CommonHeadersSchema,
      querystring: ListAudiencesQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
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

  app.post('/api/v1/audiences', {
    schema: {
      tags: ['Audiences'],
      summary: 'Create custom audience',
      description: 'Create a new custom audience from customer data, website activity, app events, or engagement.',
      headers: CommonHeadersSchema,
      body: CreateAudienceBodySchema,
      response: { 201: responses[201], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const { account_id, ...data } = request.body;
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/customaudiences`, data);
      reply.status(201).send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });

  // --- Pixels ---
  app.get('/api/v1/pixels', {
    schema: {
      tags: ['Pixels'],
      summary: 'List pixels',
      description: 'List Meta Pixels for an ad account.',
      headers: CommonHeadersSchema,
      querystring: ListPixelsQuerySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
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
  app.post('/api/v1/conversions/:pixelId', {
    schema: {
      tags: ['Conversions'],
      summary: 'Send conversion event',
      description: 'Send server-side conversion events to the Meta Conversions API. Hash all PII with SHA-256 before sending.',
      headers: CommonHeadersSchema,
      params: PixelIdParamSchema,
      body: SendConversionBodySchema,
      response: { 200: responses[200], 400: responses[400] },
    },
  }, async (request, reply) => {
    try {
      const client = getClient(request);
      const result = await client.post(`/${request.params.pixelId}/events`, request.body);
      reply.send({ success: true, data: result });
    } catch (error) { await handleMetaError(reply, error); }
  });
}
