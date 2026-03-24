import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, errResult, parseJsonParam, normalizeEffectiveStatus } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerAdsetTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'list_adsets',
    'List ad sets for an ad account. Returns ad sets with their configuration including targeting, budget, schedule, and optimization settings. Supports filtering by effective status and custom field selection.',
    {
      account_id: z
        .string()
        .optional()
        .describe('Ad account ID (with or without "act_" prefix). Falls back to the default account if omitted.'),
      fields: z
        .string()
        .optional()
        .describe(
          `Comma-separated list of fields to return. Defaults to: ${DEFAULT_FIELDS.ADSET_LIST}`,
        ),
      filtering: z
        .string()
        .optional()
        .describe(
          'JSON array of filter objects, e.g. [{"field":"name","operator":"CONTAIN","value":"Brand"}]. Supports fields like name, campaign_id, and more.',
        ),
      effective_status: z
        .string()
        .optional()
        .describe(
          'Comma-separated effective statuses to filter by, e.g. "ACTIVE,PAUSED". Valid values: ACTIVE, PAUSED, DELETED, ARCHIVED, IN_PROCESS, WITH_ISSUES, CAMPAIGN_PAUSED, DISAPPROVED, PENDING_REVIEW, PREAPPROVED.',
        ),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of ad sets to return per page (1-100). Default is 25.'),
    },
    async ({ account_id, fields, filtering, effective_status, limit }) => {
      const actId = client.resolveAccountId(account_id);
      const params: Record<string, string | number | undefined> = {
        fields: fields ?? DEFAULT_FIELDS.ADSET_LIST,
        limit,
      };

      if (filtering) params.filtering = filtering;
      if (effective_status) {
        params.effective_status = normalizeEffectiveStatus(effective_status);
      }

      const result = await client.get(`/${actId}/adsets`, params);
      return okResult(result);
    },
  );

  server.tool(
    'get_adset',
    'Get detailed information about a single ad set by its ID. Returns the full ad set configuration including targeting spec, budget, schedule, optimization goal, and delivery status.',
    {
      adset_id: z.string().describe('The ID of the ad set to retrieve.'),
      fields: z
        .string()
        .optional()
        .describe(
          `Comma-separated list of fields to return. Defaults to: ${DEFAULT_FIELDS.ADSET_LIST}`,
        ),
    },
    async ({ adset_id, fields }) => {
      const result = await client.get(`/${adset_id}`, {
        fields: fields ?? DEFAULT_FIELDS.ADSET_LIST,
      });
      return okResult(result);
    },
  );

  server.tool(
    'create_adset',
    'Create a new ad set within a campaign. An ad set defines the audience targeting, budget, schedule, optimization goal, and billing event. The targeting parameter accepts a JSON string matching the Meta Targeting Spec (geo_locations, age_min, age_max, genders, interests, behaviors, custom_audiences, etc.).',
    {
      account_id: z
        .string()
        .optional()
        .describe('Ad account ID (with or without "act_" prefix). Falls back to the default account if omitted.'),
      name: z.string().describe('Name of the ad set.'),
      campaign_id: z.string().describe('The ID of the parent campaign this ad set belongs to.'),
      targeting: z
        .string()
        .describe(
          'JSON string of the targeting spec object. Example: \'{"geo_locations":{"countries":["US"]},"age_min":18,"age_max":65,"genders":[1]}\'.',
        ),
      billing_event: z
        .string()
        .describe(
          'The event that triggers billing. Common values: IMPRESSIONS, LINK_CLICKS, POST_ENGAGEMENT, PAGE_LIKES, VIDEO_VIEWS, APP_INSTALLS, THRUPLAY.',
        ),
      optimization_goal: z
        .string()
        .describe(
          'What the ad delivery is optimized for. Common values: REACH, IMPRESSIONS, LINK_CLICKS, LANDING_PAGE_VIEWS, POST_ENGAGEMENT, VIDEO_VIEWS, LEAD_GENERATION, CONVERSIONS, VALUE, APP_INSTALLS, OFFSITE_CONVERSIONS.',
        ),
      bid_amount: z
        .number()
        .optional()
        .describe('Bid amount in cents (integer) for the ad set. E.g. 500 = $5.00. Required for some bid strategies.'),
      daily_budget: z
        .number()
        .optional()
        .describe('Daily budget in cents (integer). E.g. 2000 = $20.00. Either daily_budget or lifetime_budget is typically required.'),
      lifetime_budget: z
        .number()
        .optional()
        .describe('Lifetime budget in cents (integer). E.g. 100000 = $1000.00. Either daily_budget or lifetime_budget is typically required.'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ISO 8601 format, e.g. "2025-06-01T00:00:00-0400". Required if lifetime_budget is set.'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ISO 8601 format, e.g. "2025-06-30T23:59:59-0400". Required if lifetime_budget is set.'),
      status: z
        .string()
        .optional()
        .describe('Initial status of the ad set. Values: ACTIVE, PAUSED. Default is PAUSED if omitted.'),
      promoted_object: z
        .string()
        .optional()
        .describe(
          'JSON string of the promoted object. Required for certain optimization goals. Example: \'{"page_id":"123456789"}\' or \'{"pixel_id":"123","custom_event_type":"PURCHASE"}\'.',
        ),
    },
    async ({
      account_id,
      name,
      campaign_id,
      targeting,
      billing_event,
      optimization_goal,
      bid_amount,
      daily_budget,
      lifetime_budget,
      start_time,
      end_time,
      status,
      promoted_object,
    }) => {
      const actId = client.resolveAccountId(account_id);

      const parsedTargeting = parseJsonParam(targeting, 'targeting');
      if (!parsedTargeting.ok) return parsedTargeting.result;

      const data: Record<string, any> = {
        name,
        campaign_id,
        targeting: parsedTargeting.value,
        billing_event,
        optimization_goal,
      };

      if (bid_amount !== undefined) data.bid_amount = bid_amount;
      if (daily_budget !== undefined) data.daily_budget = daily_budget;
      if (lifetime_budget !== undefined) data.lifetime_budget = lifetime_budget;
      if (start_time) data.start_time = start_time;
      if (end_time) data.end_time = end_time;
      if (status) data.status = status;

      if (promoted_object) {
        const parsedPromotedObject = parseJsonParam(promoted_object, 'promoted_object');
        if (!parsedPromotedObject.ok) return parsedPromotedObject.result;
        data.promoted_object = parsedPromotedObject.value;
      }

      const result = await client.post(`/${actId}/adsets`, data);
      return okResult(result);
    },
  );

  server.tool(
    'update_adset',
    'Update an existing ad set. Allows modifying the name, targeting, budget, schedule, optimization, and status. Only the fields you provide will be updated; omitted fields remain unchanged.',
    {
      adset_id: z.string().describe('The ID of the ad set to update.'),
      name: z.string().optional().describe('New name for the ad set.'),
      targeting: z
        .string()
        .optional()
        .describe(
          'JSON string of the updated targeting spec. Replaces the entire targeting spec. Example: \'{"geo_locations":{"countries":["US","CA"]},"age_min":25}\'.',
        ),
      billing_event: z
        .string()
        .optional()
        .describe('Updated billing event. Common values: IMPRESSIONS, LINK_CLICKS, POST_ENGAGEMENT.'),
      optimization_goal: z
        .string()
        .optional()
        .describe('Updated optimization goal. Common values: REACH, LINK_CLICKS, CONVERSIONS, VALUE.'),
      bid_amount: z
        .number()
        .optional()
        .describe('Updated bid amount in cents (integer).'),
      daily_budget: z
        .number()
        .optional()
        .describe('Updated daily budget in cents (integer).'),
      lifetime_budget: z
        .number()
        .optional()
        .describe('Updated lifetime budget in cents (integer).'),
      start_time: z
        .string()
        .optional()
        .describe('Updated start time in ISO 8601 format.'),
      end_time: z
        .string()
        .optional()
        .describe('Updated end time in ISO 8601 format.'),
      status: z
        .string()
        .optional()
        .describe('Updated status. Values: ACTIVE, PAUSED, DELETED, ARCHIVED.'),
    },
    async ({
      adset_id,
      name,
      targeting,
      billing_event,
      optimization_goal,
      bid_amount,
      daily_budget,
      lifetime_budget,
      start_time,
      end_time,
      status,
    }) => {
      const data: Record<string, any> = {};

      if (name) data.name = name;
      if (billing_event) data.billing_event = billing_event;
      if (optimization_goal) data.optimization_goal = optimization_goal;
      if (bid_amount !== undefined) data.bid_amount = bid_amount;
      if (daily_budget !== undefined) data.daily_budget = daily_budget;
      if (lifetime_budget !== undefined) data.lifetime_budget = lifetime_budget;
      if (start_time) data.start_time = start_time;
      if (end_time) data.end_time = end_time;
      if (status) data.status = status;

      if (targeting) {
        const parsedTargeting = parseJsonParam(targeting, 'targeting');
        if (!parsedTargeting.ok) return parsedTargeting.result;
        data.targeting = parsedTargeting.value;
      }

      const result = await client.post(`/${adset_id}`, data);
      return okResult(result);
    },
  );

  server.tool(
    'delete_adset',
    'Delete an ad set by its ID. This action is irreversible. The ad set and all its ads will be deleted. Consider updating the status to ARCHIVED instead if you may need to reference it later.',
    {
      adset_id: z.string().describe('The ID of the ad set to delete.'),
    },
    async ({ adset_id }) => {
      const result = await client.del(`/${adset_id}`);
      return okResult(result);
    },
  );
}
