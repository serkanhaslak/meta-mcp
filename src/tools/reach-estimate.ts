import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';

export function registerReachEstimateTools(server: McpServer, client: MetaApiClient): void {
  // ── get_reach_estimate ───────────────────────────────────────────────
  server.tool(
    'get_reach_estimate',
    'Get an estimated audience reach and daily outcomes for a given targeting specification. This is the same data shown in the "Audience Definition" gauge in Meta Ads Manager when setting up ad set targeting. Returns estimated daily reach, impressions, and the total addressable audience size. Use this to evaluate targeting options before creating ad sets — for example, to compare audience sizes across different interest combinations, check if a geo+demographic combination is too narrow, or estimate potential reach for budget planning. The targeting_spec format is identical to what you would use when creating an ad set.',
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
          'JSON string of the targeting specification to estimate reach for. Uses the same format as ad set targeting. Example — target 25-45 year old women in Turkey interested in finance: {"geo_locations":{"countries":["TR"]},"age_min":25,"age_max":45,"genders":[2],"interests":[{"id":"6003139266461","name":"Finance"}]}. You can include any valid targeting fields: geo_locations (countries, regions, cities, zips), age_min/age_max (13-65, where 65 means 65+), genders (1=male, 2=female), interests, behaviors, custom_audiences, excluded_custom_audiences, publisher_platforms, device_platforms, flexible_spec (OR logic), exclusions. Use search_interests, search_behaviors, and search_geo_locations to find valid targeting IDs.',
        ),
      optimize_for: z
        .string()
        .optional()
        .describe(
          'The optimization goal that affects the estimated outcomes. This changes which daily estimates are returned (e.g. estimated clicks vs. impressions). Valid values: "NONE" (no optimization, raw reach), "IMPRESSIONS" (maximize impressions), "REACH" (maximize unique reach), "LINK_CLICKS" (maximize clicks to destination), "OFFSITE_CONVERSIONS" (maximize conversions), "LANDING_PAGE_VIEWS" (maximize page views), "POST_ENGAGEMENT" (maximize post engagement), "THRUPLAY" (maximize video views), "LEAD_GENERATION" (maximize leads), "APP_INSTALLS" (maximize installs), "VALUE" (maximize purchase value). Defaults to NONE if not specified.',
        ),
      currency: z
        .string()
        .optional()
        .describe(
          'Three-letter ISO 4217 currency code for cost estimates in the response. Examples: "USD", "EUR", "GBP", "TRY" (Turkish Lira), "BRL". If not specified, uses the ad account default currency.',
        ),
    },
    async ({ account_id, targeting_spec, optimize_for, currency }) => {
      const actId = client.resolveAccountId(account_id);

      const parsed = parseJsonParam<Record<string, unknown>>(targeting_spec, 'targeting_spec');
      if (!parsed.ok) return parsed.result;

      const params: Record<string, string | number | undefined> = {
        targeting_spec: JSON.stringify(parsed.value),
      };
      if (optimize_for) {
        params.optimize_for = optimize_for;
      }
      if (currency) {
        params.currency = currency;
      }

      const result = await client.get(`/${actId}/reachestimate`, params);
      return okResult(result);
    },
  );
}
