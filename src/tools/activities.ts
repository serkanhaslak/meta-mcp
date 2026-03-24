import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, toOptionalNumber } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerActivityTools(server: McpServer, client: MetaApiClient): void {
  // ── get_account_activities ─────────────────────────────────────────────
  server.tool(
    'get_account_activities',
    'Retrieve the activity log (audit trail) for an ad account. Returns a chronological record of changes made to the account and its objects — campaigns, ad sets, ads, audiences, budgets, targeting, and more. Each activity entry includes who made the change, what was changed, and when. Use this to audit recent modifications, investigate unexpected performance shifts, track team member actions, or review changes before/after a specific date.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      since: z
        .string()
        .optional()
        .describe(
          'Unix timestamp (seconds since epoch) for the start of the time range. Only activities on or after this time are returned. Example: "1700000000" for Nov 14 2023. Use together with "until" to define a precise window.',
        ),
      until: z
        .string()
        .optional()
        .describe(
          'Unix timestamp (seconds since epoch) for the end of the time range. Only activities on or before this time are returned. Example: "1700086400". Use together with "since" to define a precise window.',
        ),
      uid: z
        .string()
        .optional()
        .describe(
          'Filter activities by the Facebook user ID of the actor who performed the action. Use this to see only changes made by a specific team member or API integration.',
        ),
      category: z
        .enum([
          'ACCOUNT',
          'AD',
          'AD_SET',
          'CAMPAIGN',
          'AUDIENCE',
          'BID',
          'BUDGET',
          'TARGETING',
        ])
        .optional()
        .describe(
          'Filter activities by category to narrow down to a specific object type or action domain. ACCOUNT: account-level settings changes. AD: ad creation, edits, status changes. AD_SET: ad set configuration changes. CAMPAIGN: campaign-level changes. AUDIENCE: custom/lookalike audience modifications. BID: bid strategy and amount changes. BUDGET: budget amount and schedule changes. TARGETING: targeting specification changes.',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return for each activity entry. Defaults to "event_type,event_time,actor_name,actor_id,object_id,object_type,extra_data,translated_event_type". Other available fields include date_time_in_timezone, application_name. See Meta API docs for all available Activity fields.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of activity entries to return per page (default 25, max 100). Use pagination cursors in the response to fetch additional pages.',
        ),
    },
    async ({ account_id, since, until, uid, category, fields, limit }) => {
      const actId = client.resolveAccountId(account_id);
      const params: Record<string, string | number | undefined> = {
        fields: fields ?? DEFAULT_FIELDS.ACTIVITY_LIST,
      };
      if (since) params.since = since;
      if (until) params.until = until;
      if (uid) params.uid = uid;
      if (category) params.category = category;
      if (limit) params.limit = toOptionalNumber(limit);

      const result = await client.get(`/${actId}/activities`, params);
      return okResult(result);
    },
  );
}
