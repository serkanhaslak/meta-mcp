import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, toOptionalNumber } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerCampaignTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'list_campaigns',
    'List campaigns for an ad account with optional filtering by status. Returns campaign IDs, names, objectives, statuses, budgets, and other configuration. Supports pagination via limit parameter.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining,buying_type,bid_strategy,special_ad_categories,created_time,updated_time. See Meta API docs for all available Campaign fields.',
        ),
      effective_status: z
        .string()
        .optional()
        .describe(
          'JSON array of effective statuses to filter by. Example: ["ACTIVE","PAUSED"]. Valid values: ACTIVE, PAUSED, DELETED, ARCHIVED, IN_PROCESS, WITH_ISSUES, CAMPAIGN_PAUSED, DISAPPROVED.',
        ),
      filtering: z
        .string()
        .optional()
        .describe(
          'JSON array of filter objects. Each object has field, operator, and value. Example: [{"field":"name","operator":"CONTAIN","value":"Spring"}]. Operators: EQUAL, NOT_EQUAL, GREATER_THAN, LESS_THAN, CONTAIN, NOT_CONTAIN, IN, NOT_IN.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of campaigns to return per page (default 25, max 100).',
        ),
    },
    async ({ account_id, fields, effective_status, filtering, limit }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/campaigns`, {
        fields: fields ?? DEFAULT_FIELDS.CAMPAIGN_LIST,
        effective_status,
        filtering,
        limit: toOptionalNumber(limit),
      });
      return okResult(result);
    },
  );

  server.tool(
    'get_campaign',
    'Get detailed information about a specific campaign by its ID. Returns the full campaign configuration including objective, status, budget, bid strategy, and special ad categories.',
    {
      campaign_id: z
        .string()
        .describe('The campaign ID to retrieve (e.g. "123456789").'),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining,buying_type,bid_strategy,special_ad_categories,spend_cap,start_time,stop_time,created_time,updated_time. See Meta API docs for all available Campaign fields.',
        ),
    },
    async ({ campaign_id, fields }) => {
      const result = await client.get(`/${campaign_id}`, {
        fields: fields ?? DEFAULT_FIELDS.CAMPAIGN_GET,
      });
      return okResult(result);
    },
  );

  server.tool(
    'create_campaign',
    'Create a new campaign in the specified ad account. Requires at minimum a name and objective. The campaign is created in PAUSED status by default so you can configure ad sets and ads before launching. Returns the new campaign ID.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      name: z.string().describe('The name of the campaign.'),
      objective: z
        .string()
        .describe(
          'Campaign objective. Valid values: OUTCOME_AWARENESS, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_TRAFFIC, OUTCOME_APP_PROMOTION.',
        ),
      status: z
        .string()
        .optional()
        .describe(
          'Initial campaign status. Defaults to PAUSED. Valid values: ACTIVE, PAUSED.',
        ),
      special_ad_categories: z
        .string()
        .optional()
        .describe(
          'JSON array of special ad categories. Required by Meta -- pass "[]" if none apply. Valid values: NONE, EMPLOYMENT, HOUSING, CREDIT, ISSUES_ELECTIONS_POLITICS. Example: ["CREDIT"].',
        ),
      daily_budget: z
        .string()
        .optional()
        .describe(
          'Daily budget in account currency cents (e.g. "5000" for $50.00 USD). Mutually exclusive with lifetime_budget.',
        ),
      lifetime_budget: z
        .string()
        .optional()
        .describe(
          'Lifetime budget in account currency cents (e.g. "100000" for $1000.00 USD). Mutually exclusive with daily_budget. Requires stop_time on ad sets.',
        ),
      bid_strategy: z
        .string()
        .optional()
        .describe(
          'Bid strategy for the campaign. Valid values: LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP, LOWEST_COST_WITH_MIN_ROAS.',
        ),
      buying_type: z
        .string()
        .optional()
        .describe(
          'Buying type. Defaults to AUCTION. Valid values: AUCTION, RESERVED.',
        ),
      is_campaign_budget_optimization: z
        .string()
        .optional()
        .describe(
          'Enable Advantage Campaign Budget (formerly CBO). Set to "true" to let Meta automatically distribute budget across ad sets. When enabled, budget is set at campaign level and Meta optimizes distribution.',
        ),
      smart_promotion_type: z
        .string()
        .optional()
        .describe(
          'For Advantage+ campaigns. Valid values: GUIDED_CREATION. Enables Meta automation features for audience, placement, and creative optimization.',
        ),
      special_ad_category_country: z
        .string()
        .optional()
        .describe(
          'JSON array of country codes for special ad category enforcement. Required when special_ad_categories includes EMPLOYMENT, HOUSING, or CREDIT. Example: ["US","CA"].',
        ),
    },
    async ({
      account_id,
      name,
      objective,
      status,
      special_ad_categories,
      daily_budget,
      lifetime_budget,
      bid_strategy,
      buying_type,
      is_campaign_budget_optimization,
      smart_promotion_type,
      special_ad_category_country,
    }) => {
      const actId = client.resolveAccountId(account_id);

      const data: Record<string, any> = {
        name,
        objective,
        status: status ?? 'PAUSED',
        special_ad_categories: special_ad_categories ?? '[]',
      };

      if (daily_budget) data.daily_budget = daily_budget;
      if (lifetime_budget) data.lifetime_budget = lifetime_budget;
      if (bid_strategy) data.bid_strategy = bid_strategy;
      if (buying_type) data.buying_type = buying_type;
      if (is_campaign_budget_optimization) data.is_campaign_budget_optimization = is_campaign_budget_optimization === 'true';
      if (smart_promotion_type) data.smart_promotion_type = smart_promotion_type;
      if (special_ad_category_country) data.special_ad_category_country = special_ad_category_country;

      const result = await client.post(`/${actId}/campaigns`, data);
      return okResult(result);
    },
  );

  server.tool(
    'update_campaign',
    'Update an existing campaign. You can modify the name, status, budget, and bid strategy. Only the fields you provide will be updated; others remain unchanged. Use this to pause/activate campaigns or adjust budgets.',
    {
      campaign_id: z
        .string()
        .describe('The campaign ID to update (e.g. "123456789").'),
      name: z.string().optional().describe('New name for the campaign.'),
      status: z
        .string()
        .optional()
        .describe(
          'New campaign status. Valid values: ACTIVE, PAUSED, DELETED, ARCHIVED.',
        ),
      daily_budget: z
        .string()
        .optional()
        .describe(
          'New daily budget in account currency cents (e.g. "5000" for $50.00 USD). Mutually exclusive with lifetime_budget.',
        ),
      lifetime_budget: z
        .string()
        .optional()
        .describe(
          'New lifetime budget in account currency cents (e.g. "100000" for $1000.00 USD). Mutually exclusive with daily_budget.',
        ),
      bid_strategy: z
        .string()
        .optional()
        .describe(
          'New bid strategy. Valid values: LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP, LOWEST_COST_WITH_MIN_ROAS.',
        ),
    },
    async ({ campaign_id, name, status, daily_budget, lifetime_budget, bid_strategy }) => {
      const data: Record<string, any> = {};

      if (name) data.name = name;
      if (status) data.status = status;
      if (daily_budget) data.daily_budget = daily_budget;
      if (lifetime_budget) data.lifetime_budget = lifetime_budget;
      if (bid_strategy) data.bid_strategy = bid_strategy;

      const result = await client.post(`/${campaign_id}`, data);
      return okResult(result);
    },
  );

  server.tool(
    'delete_campaign',
    'Delete a campaign by its ID. This sets the campaign status to DELETED. Deleted campaigns can still be viewed but cannot be reactivated. All ad sets and ads under the campaign will also stop delivering.',
    {
      campaign_id: z
        .string()
        .describe('The campaign ID to delete (e.g. "123456789").'),
    },
    async ({ campaign_id }) => {
      const result = await client.del(`/${campaign_id}`);
      return okResult(result);
    },
  );
}
