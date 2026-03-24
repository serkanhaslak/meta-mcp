import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════
//  SHARED SCHEMAS
// ═══════════════════════════════════════════════════════════════════════

export const MetaErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.number().optional(),
    type: z.string().optional(),
    subcode: z.number().optional(),
    fbtrace_id: z.string().optional(),
  }),
});

export function successResponse(dataSchema: z.ZodTypeAny = z.any()) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

export const CommonHeadersSchema = z.object({
  'x-meta-token': z.string().optional().describe('Meta/Facebook access token (required for /api/* routes)'),
  'x-meta-account-id': z.string().optional().describe('Override default ad account ID'),
});

export const IdParamSchema = z.object({
  id: z.string().describe('Resource ID'),
});

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  name: z.string(),
  version: z.string(),
  tools: z.number(),
  modes: z.array(z.string()),
  uptime: z.number(),
});

// ═══════════════════════════════════════════════════════════════════════
//  ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════

export const ListAccountsQuerySchema = z.object({
  fields: z.string().optional().describe('Comma-separated fields to return'),
  limit: z.string().optional().describe('Max results per page'),
});

export const GetAccountQuerySchema = z.object({
  fields: z.string().optional().describe('Comma-separated fields to return'),
});

// ═══════════════════════════════════════════════════════════════════════
//  CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════

export const ListCampaignsQuerySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID (e.g. "act_123456789")'),
  fields: z.string().optional().describe('Comma-separated fields to return'),
  limit: z.string().optional().describe('Max results per page (default 25, max 100)'),
  effective_status: z.string().optional().describe('Filter by status, e.g. ACTIVE,PAUSED'),
});

export const CreateCampaignBodySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  name: z.string().describe('Campaign name'),
  objective: z.string().describe('Campaign objective: OUTCOME_AWARENESS, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_TRAFFIC, OUTCOME_APP_PROMOTION'),
  status: z.string().optional().describe('Initial status: ACTIVE or PAUSED (default)'),
  special_ad_categories: z.string().optional().describe('JSON array of special categories, e.g. "[]"'),
  daily_budget: z.string().optional().describe('Daily budget in currency cents'),
  lifetime_budget: z.string().optional().describe('Lifetime budget in currency cents'),
  bid_strategy: z.string().optional().describe('Bid strategy: LOWEST_COST_WITHOUT_CAP, COST_CAP, etc.'),
  buying_type: z.string().optional().describe('AUCTION (default) or RESERVED'),
}).passthrough();

export const UpdateCampaignBodySchema = z.object({
  name: z.string().optional().describe('New campaign name'),
  status: z.string().optional().describe('New status: ACTIVE, PAUSED, DELETED, ARCHIVED'),
  daily_budget: z.string().optional().describe('New daily budget in currency cents'),
  lifetime_budget: z.string().optional().describe('New lifetime budget in currency cents'),
  bid_strategy: z.string().optional().describe('New bid strategy'),
}).passthrough();

// ═══════════════════════════════════════════════════════════════════════
//  AD SETS
// ═══════════════════════════════════════════════════════════════════════

export const ListAdsetsQuerySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  fields: z.string().optional().describe('Comma-separated fields to return'),
  limit: z.string().optional().describe('Max results per page'),
  effective_status: z.string().optional().describe('Filter by status, e.g. ACTIVE,PAUSED'),
});

export const CreateAdsetBodySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  name: z.string().describe('Ad set name'),
  campaign_id: z.string().describe('Parent campaign ID'),
  targeting: z.any().describe('Targeting spec object (geo_locations, age_min, age_max, genders, interests, etc.)'),
  billing_event: z.string().describe('Billing event: IMPRESSIONS, LINK_CLICKS, etc.'),
  optimization_goal: z.string().describe('Optimization goal: REACH, LINK_CLICKS, CONVERSIONS, etc.'),
  bid_amount: z.number().optional().describe('Bid amount in cents'),
  daily_budget: z.number().optional().describe('Daily budget in cents'),
  lifetime_budget: z.number().optional().describe('Lifetime budget in cents'),
  start_time: z.string().optional().describe('Start time in ISO 8601 format'),
  end_time: z.string().optional().describe('End time in ISO 8601 format'),
  status: z.string().optional().describe('Initial status: ACTIVE or PAUSED'),
  promoted_object: z.any().optional().describe('Promoted object for conversion optimization'),
}).passthrough();

export const UpdateAdsetBodySchema = z.object({
  name: z.string().optional().describe('New ad set name'),
  targeting: z.any().optional().describe('Updated targeting spec'),
  billing_event: z.string().optional().describe('Updated billing event'),
  optimization_goal: z.string().optional().describe('Updated optimization goal'),
  bid_amount: z.number().optional().describe('Updated bid amount in cents'),
  daily_budget: z.number().optional().describe('Updated daily budget in cents'),
  lifetime_budget: z.number().optional().describe('Updated lifetime budget in cents'),
  start_time: z.string().optional().describe('Updated start time'),
  end_time: z.string().optional().describe('Updated end time'),
  status: z.string().optional().describe('Updated status: ACTIVE, PAUSED, DELETED, ARCHIVED'),
}).passthrough();

// ═══════════════════════════════════════════════════════════════════════
//  ADS
// ═══════════════════════════════════════════════════════════════════════

export const ListAdsQuerySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  fields: z.string().optional().describe('Comma-separated fields to return'),
  limit: z.string().optional().describe('Max results per page'),
  effective_status: z.string().optional().describe('Filter by status, e.g. ACTIVE,PAUSED'),
});

export const CreateAdBodySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  name: z.string().describe('Ad name'),
  adset_id: z.string().describe('Parent ad set ID'),
  creative: z.any().describe('Creative spec: {"creative_id":"<id>"} or inline creative object'),
  status: z.string().optional().describe('Initial status: ACTIVE or PAUSED'),
  tracking_specs: z.any().optional().describe('Tracking specs array for conversion tracking'),
}).passthrough();

export const UpdateAdBodySchema = z.object({
  name: z.string().optional().describe('New ad name'),
  status: z.string().optional().describe('Updated status: ACTIVE, PAUSED, DELETED, ARCHIVED'),
  creative: z.any().optional().describe('Updated creative spec'),
  tracking_specs: z.any().optional().describe('Updated tracking specs'),
}).passthrough();

// ═══════════════════════════════════════════════════════════════════════
//  CREATIVES
// ═══════════════════════════════════════════════════════════════════════

export const ListCreativesQuerySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  fields: z.string().optional().describe('Comma-separated fields to return'),
  limit: z.string().optional().describe('Max results per page'),
});

export const CreateCreativeBodySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  name: z.string().describe('Creative name'),
  object_story_spec: z.any().describe('Creative content: page_id + link_data/video_data/photo_data'),
  asset_feed_spec: z.any().optional().describe('Dynamic creative assets for A/B testing'),
  url_tags: z.string().optional().describe('UTM parameters appended to all links'),
}).passthrough();

// ═══════════════════════════════════════════════════════════════════════
//  INSIGHTS
// ═══════════════════════════════════════════════════════════════════════

export const ObjectIdParamSchema = z.object({
  objectId: z.string().describe('Campaign, ad set, or ad ID'),
});

export const GetInsightsQuerySchema = z.object({
  fields: z.string().optional().describe('Comma-separated metrics: impressions, clicks, spend, cpc, cpm, ctr, actions, etc.'),
  date_preset: z.string().optional().describe('Predefined date range: last_7d, last_30d, this_month, etc.'),
  time_range: z.string().optional().describe('JSON: {"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}'),
  breakdowns: z.string().optional().describe('Breakdown dimensions: age, gender, country, publisher_platform, etc.'),
  level: z.string().optional().describe('Aggregation level: campaign, adset, ad'),
});

// ═══════════════════════════════════════════════════════════════════════
//  IMAGES
// ═══════════════════════════════════════════════════════════════════════

export const ListImagesQuerySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  fields: z.string().optional().describe('Comma-separated fields to return'),
});

export const UploadImageBodySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  bytes: z.string().optional().describe('Base64-encoded image data'),
  url: z.string().optional().describe('Public URL of the image'),
  name: z.string().optional().describe('Optional image name'),
}).passthrough();

// ═══════════════════════════════════════════════════════════════════════
//  AUDIENCES
// ═══════════════════════════════════════════════════════════════════════

export const ListAudiencesQuerySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  fields: z.string().optional().describe('Comma-separated fields to return'),
  limit: z.string().optional().describe('Max results per page'),
});

export const CreateAudienceBodySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  name: z.string().describe('Audience name'),
  subtype: z.string().describe('CUSTOM, WEBSITE, APP, OFFLINE, or ENGAGEMENT'),
  description: z.string().optional().describe('Audience description'),
  customer_file_source: z.string().optional().describe('Source: USER_PROVIDED_ONLY, PARTNER_PROVIDED_ONLY, BOTH_USER_AND_PARTNER_PROVIDED'),
  rule: z.any().optional().describe('Audience rules for WEBSITE/APP subtypes'),
}).passthrough();

// ═══════════════════════════════════════════════════════════════════════
//  PIXELS
// ═══════════════════════════════════════════════════════════════════════

export const ListPixelsQuerySchema = z.object({
  account_id: z.string().optional().describe('Ad account ID'),
  fields: z.string().optional().describe('Comma-separated fields to return'),
});

// ═══════════════════════════════════════════════════════════════════════
//  CONVERSIONS
// ═══════════════════════════════════════════════════════════════════════

export const PixelIdParamSchema = z.object({
  pixelId: z.string().describe('Meta Pixel ID'),
});

export const SendConversionBodySchema = z.object({
  data: z.array(z.object({
    event_name: z.string().describe('Event name: Purchase, Lead, ViewContent, AddToCart, etc.'),
    event_time: z.number().describe('Unix timestamp (seconds)'),
    action_source: z.string().describe('Event origin: website, app, email, phone_call, etc.'),
    user_data: z.any().describe('User matching data with SHA-256 hashed PII'),
    custom_data: z.any().optional().describe('Event-specific data: value, currency, content_ids, etc.'),
    event_source_url: z.string().optional().describe('URL where the event occurred'),
    event_id: z.string().optional().describe('Unique ID for deduplication'),
  }).passthrough()).describe('Array of conversion events'),
  test_event_code: z.string().optional().describe('Test event code from Events Manager'),
}).passthrough();

// ═══════════════════════════════════════════════════════════════════════
//  PROXY
// ═══════════════════════════════════════════════════════════════════════

export const ProxyParamsSchema = z.object({
  '*': z.string().describe('Graph API path, e.g. "me/adaccounts" or "act_123/campaigns"'),
});

export const ProxyQuerySchema = z.record(z.string(), z.string()).describe('Any Graph API query parameters');
export const ProxyBodySchema = z.record(z.string(), z.any()).describe('Any Graph API POST body');
