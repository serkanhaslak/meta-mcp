import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, toOptionalNumber } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerAccountTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'get_ad_accounts',
    'List all ad accounts accessible by the current access token. Returns account IDs, names, statuses, and other metadata. Use this to discover which ad accounts you can manage before performing operations on a specific account.',
    {
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,account_id,account_status,currency,timezone_name,business_name. See Meta API docs for all available AdAccount fields.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of ad accounts to return per page (default 25, max 100).',
        ),
    },
    async ({ fields, limit }) => {
      try {
        const result = await client.get('/me/adaccounts', {
          fields: fields ?? DEFAULT_FIELDS.ACCOUNT_LIST,
          limit: toOptionalNumber(limit),
        });
        return okResult(result);
      } catch {
        // /me endpoint fails with System User tokens — fall back to default account info
        const actId = client.resolveAccountId();
        const result = await client.get(`/${actId}`, {
          fields: fields ?? DEFAULT_FIELDS.ACCOUNT_LIST,
        });
        return okResult({ data: [result] });
      }
    },
  );

  server.tool(
    'get_account_info',
    'Get detailed information about a specific ad account including its status, spending limits, currency, timezone, business info, and funding source. Useful for verifying account configuration before creating campaigns.',
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
          'Comma-separated list of fields to return. Defaults to id,name,account_id,account_status,age,currency,timezone_name,timezone_offset_hours_utc,business_name,business_city,business_country_code,spend_cap,amount_spent,balance,owner,funding_source_details,disable_reason,created_time. See Meta API docs for all available AdAccount fields.',
        ),
    },
    async ({ account_id, fields }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}`, {
        fields: fields ?? DEFAULT_FIELDS.ACCOUNT_INFO,
      });
      return okResult(result);
    },
  );

  server.tool(
    'get_account_pages',
    'List Facebook Pages managed by the current user/token. Pages are required when creating ad creatives (for page-backed ads) or working with lead generation forms. Returns page IDs, names, access tokens, and categories.',
    {
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,access_token,category,followers_count,fan_count. See Meta API docs for all available Page fields.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of pages to return per page (default 25, max 100).',
        ),
    },
    async ({ fields, limit }) => {
      try {
        const result = await client.get('/me/accounts', {
          fields:
            fields ??
            'id,name,access_token,category,followers_count,fan_count',
          limit: toOptionalNumber(limit),
        });
        return okResult(result);
      } catch {
        // /me endpoint fails with System User tokens — fall back to default account's promoted pages
        const actId = client.resolveAccountId();
        const result = await client.get(`/${actId}/promote_pages`, {
          fields:
            fields ??
            'id,name,access_token,category,followers_count,fan_count',
          limit: toOptionalNumber(limit),
        });
        return okResult(result);
      }
    },
  );

  server.tool(
    'get_delivery_estimate',
    'Get a delivery estimate for a given targeting specification and optimization goal. Returns estimated daily reach, impressions, and other delivery metrics. Use this to evaluate audience size and expected performance before creating ad sets.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      targeting_spec: z
        .string()
        .describe(
          'JSON string of the targeting specification object. Must include at least geo_locations. Example: {"geo_locations":{"countries":["US"]},"age_min":25,"age_max":45,"genders":[1]}',
        ),
      optimization_goal: z
        .string()
        .describe(
          'The optimization goal for the delivery estimate. Common values: REACH, IMPRESSIONS, LINK_CLICKS, LANDING_PAGE_VIEWS, OFFSITE_CONVERSIONS, LEAD_GENERATION, APP_INSTALLS, VIDEO_VIEWS.',
        ),
    },
    async ({ account_id, targeting_spec, optimization_goal }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/delivery_estimate`, {
        targeting_spec,
        optimization_goal,
      });
      return okResult(result);
    },
  );
}
