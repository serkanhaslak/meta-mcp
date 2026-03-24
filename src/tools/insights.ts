import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, toOptionalNumber } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

interface InsightsRawParams {
  fields?: string;
  time_range?: string;
  date_preset?: string;
  breakdowns?: string;
  level?: string;
  filtering?: string;
  time_increment?: string;
  limit?: string;
}

function buildInsightsParams(raw: InsightsRawParams): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {
    fields: raw.fields ?? DEFAULT_FIELDS.INSIGHTS,
    limit: toOptionalNumber(raw.limit),
  };
  if (raw.time_range) params.time_range = raw.time_range;
  if (raw.date_preset) params.date_preset = raw.date_preset;
  if (raw.breakdowns) params.breakdowns = raw.breakdowns;
  if (raw.level) params.level = raw.level;
  if (raw.filtering) params.filtering = raw.filtering;
  if (raw.time_increment) params.time_increment = raw.time_increment;
  return params;
}

export function registerInsightsTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'get_insights',
    'Get performance insights (metrics) for a specific campaign, ad set, or ad. Returns metrics like impressions, clicks, spend, CTR, CPC, CPM, and conversion actions. You can break down results by time, demographics, placement, and more. Use this for detailed performance analysis of individual ad objects.',
    {
      object_id: z
        .string()
        .describe(
          'The ID of the campaign, ad set, or ad to get insights for. You can get these IDs from list_campaigns, list_adsets, or list_ads.',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of metrics to return. Defaults to impressions,clicks,spend,cpc,cpm,ctr,actions. Common fields: impressions, clicks, spend, cpc, cpm, ctr, reach, frequency, actions, cost_per_action_type, conversions, cost_per_conversion, video_p25_watched_actions, video_p50_watched_actions, video_p75_watched_actions, video_p100_watched_actions. See Meta Ads Insights API docs for the full list.',
        ),
      time_range: z
        .string()
        .optional()
        .describe(
          'JSON string specifying a custom date range. Format: {"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}. Example: {"since":"2024-01-01","until":"2024-01-31"}. Cannot be used together with date_preset.',
        ),
      date_preset: z
        .string()
        .optional()
        .describe(
          'Predefined date range instead of a custom time_range. Valid values: today, yesterday, this_month, last_month, this_quarter, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year. Cannot be used together with time_range.',
        ),
      breakdowns: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of breakdowns to segment results. Common values: age, gender, country, region, dma, impression_device, publisher_platform, platform_position, device_platform. Example: "age,gender" to see results broken down by age and gender. Some breakdowns cannot be combined — see Meta API docs for valid combinations.',
        ),
      level: z
        .string()
        .optional()
        .describe(
          'Aggregation level for the results. Valid values: campaign, adset, ad. When querying a campaign, use level=adset to see per-adset breakdown, or level=ad for per-ad breakdown.',
        ),
      filtering: z
        .string()
        .optional()
        .describe(
          'JSON string of filters to apply to results. Format: [{"field":"<field>","operator":"<op>","value":"<val>"}]. Operators: EQUAL, NOT_EQUAL, GREATER_THAN, LESS_THAN, IN, NOT_IN, CONTAIN, NOT_CONTAIN. Example: [{"field":"action_type","operator":"IN","value":["link_click","post_engagement"]}]',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of result rows to return per page (default 25, max 100). Use pagination for large result sets.',
        ),
    },
    async ({ object_id, fields, time_range, date_preset, breakdowns, level, filtering, limit }) => {
      const params = buildInsightsParams({ fields, time_range, date_preset, breakdowns, level, filtering, limit });
      const result = await client.get(`/${object_id}/insights`, params);
      return okResult(result);
    },
  );

  server.tool(
    'get_account_insights',
    'Get aggregated performance insights for an entire ad account. Returns account-level metrics like total impressions, clicks, spend, CTR, CPC, and CPM across all campaigns. Supports the same breakdowns, date ranges, and filters as get_insights but scoped to the whole account. Use this for high-level reporting and account performance overview.',
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
          'Comma-separated list of metrics to return. Defaults to impressions,clicks,spend,cpc,cpm,ctr,actions. Common fields: impressions, clicks, spend, cpc, cpm, ctr, reach, frequency, actions, cost_per_action_type, conversions, cost_per_conversion. See Meta Ads Insights API docs for the full list.',
        ),
      time_range: z
        .string()
        .optional()
        .describe(
          'JSON string specifying a custom date range. Format: {"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}. Example: {"since":"2024-01-01","until":"2024-01-31"}. Cannot be used together with date_preset.',
        ),
      date_preset: z
        .string()
        .optional()
        .describe(
          'Predefined date range instead of a custom time_range. Valid values: today, yesterday, this_month, last_month, this_quarter, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year. Cannot be used together with time_range.',
        ),
      breakdowns: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of breakdowns to segment results. Common values: age, gender, country, region, dma, impression_device, publisher_platform, platform_position, device_platform. Example: "age,gender" to see results broken down by age and gender.',
        ),
      level: z
        .string()
        .optional()
        .describe(
          'Aggregation level for the results. Valid values: campaign, adset, ad. Use level=campaign to see per-campaign breakdown within the account.',
        ),
      filtering: z
        .string()
        .optional()
        .describe(
          'JSON string of filters to apply to results. Format: [{"field":"<field>","operator":"<op>","value":"<val>"}]. Operators: EQUAL, NOT_EQUAL, GREATER_THAN, LESS_THAN, IN, NOT_IN, CONTAIN, NOT_CONTAIN.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of result rows to return per page (default 25, max 100).',
        ),
    },
    async ({ account_id, fields, time_range, date_preset, breakdowns, level, filtering, limit }) => {
      const actId = client.resolveAccountId(account_id);
      const params = buildInsightsParams({ fields, time_range, date_preset, breakdowns, level, filtering, limit });
      const result = await client.get(`/${actId}/insights`, params);
      return okResult(result);
    },
  );

  server.tool(
    'create_async_report',
    'Create an asynchronous insights report for a campaign, ad set, ad, or account. Use this for large or complex queries that may time out with synchronous get_insights. Returns a report_run_id that you can poll using get_insights with the report run ID to check completion status and retrieve results. Async reports support an additional time_increment parameter for daily/weekly/monthly breakdowns.',
    {
      object_id: z
        .string()
        .describe(
          'The ID of the campaign, ad set, ad, or ad account (act_XXX) to generate the report for.',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of metrics to include in the report. Defaults to impressions,clicks,spend,cpc,cpm,ctr,actions. See Meta Ads Insights API docs for the full list of available fields.',
        ),
      time_range: z
        .string()
        .optional()
        .describe(
          'JSON string specifying a custom date range. Format: {"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}. Example: {"since":"2024-01-01","until":"2024-03-31"}. Cannot be used together with date_preset.',
        ),
      date_preset: z
        .string()
        .optional()
        .describe(
          'Predefined date range. Valid values: today, yesterday, this_month, last_month, this_quarter, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year. Cannot be used together with time_range.',
        ),
      breakdowns: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of breakdowns. Common values: age, gender, country, region, publisher_platform, platform_position, device_platform.',
        ),
      level: z
        .string()
        .optional()
        .describe(
          'Aggregation level. Valid values: campaign, adset, ad. Determines the granularity of the returned rows.',
        ),
      filtering: z
        .string()
        .optional()
        .describe(
          'JSON string of filters. Format: [{"field":"<field>","operator":"<op>","value":"<val>"}].',
        ),
      time_increment: z
        .string()
        .optional()
        .describe(
          'How to break down results over time. Use "1" for daily, "7" for weekly, "monthly" for monthly, or "all_days" for the entire period as a single row. This is especially useful for trend analysis over a date range.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of result rows to return per page (default 25, max 100).',
        ),
    },
    async ({ object_id, fields, time_range, date_preset, breakdowns, level, filtering, time_increment, limit }) => {
      const data = buildInsightsParams({ fields, time_range, date_preset, breakdowns, level, filtering, time_increment, limit });
      const result = await client.post(`/${object_id}/insights`, data);
      return okResult(result);
    },
  );
}
