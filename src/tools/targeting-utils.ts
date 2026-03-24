import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';

export function registerTargetingUtilTools(server: McpServer, client: MetaApiClient): void {
  // ── get_targeting_suggestions ─────────────────────────────────────────
  server.tool(
    'get_targeting_suggestions',
    'Get targeting suggestions based on a list of existing interest or behavior IDs. Returns similar and related targeting options that you can add to expand your audience. Useful for discovering new targeting ideas — for example, if you are targeting "Running" and "Marathon", this endpoint might suggest "Trail Running", "5K Races", or "Athletic Apparel". Use the returned IDs in ad set targeting_spec.interests or targeting_spec.behaviors.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      targeting_list: z
        .string()
        .describe(
          'JSON string containing an array of targeting objects to get suggestions for. Each object must have "id" (the interest or behavior ID) and "type" (either "interests" or "behaviors"). Example: [{"id":"6003139266461","type":"interests"},{"id":"6003020834693","type":"interests"}]. You can obtain these IDs from search_interests, search_behaviors, or from an existing ad set\'s targeting_spec.',
        ),
    },
    async ({ account_id, targeting_list }) => {
      const actId = client.resolveAccountId(account_id);

      const parsed = parseJsonParam(targeting_list, 'targeting_list');
      if (!parsed.ok) return parsed.result;

      const result = await client.get(`/${actId}/targetingsuggestions`, {
        targeting_list: JSON.stringify(parsed.value),
      });
      return okResult(result);
    },
  );

  // ── validate_targeting ────────────────────────────────────────────────
  server.tool(
    'validate_targeting',
    'Validate a targeting specification before using it in an ad set. Checks whether the targeting spec is well-formed and deliverable — for example, it verifies that interest IDs exist, geo-locations are valid, age ranges are acceptable, and the overall combination is not too narrow. Returns validation status and detailed error messages for any issues found. Always validate targeting specs before creating or updating ad sets to catch problems early.',
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
          'JSON string of the full targeting specification to validate. This should be the same format used in ad set targeting_spec. Must include at least geo_locations. Example: {"geo_locations":{"countries":["US"]},"age_min":25,"age_max":45,"interests":[{"id":"6003139266461","name":"Yoga"}],"genders":[1]}. The API will check all fields for validity, supported values, and deliverability.',
        ),
    },
    async ({ account_id, targeting_spec }) => {
      const actId = client.resolveAccountId(account_id);

      const parsed = parseJsonParam(targeting_spec, 'targeting_spec');
      if (!parsed.ok) return parsed.result;

      const result = await client.get(`/${actId}/targetingvalidation`, {
        targeting_spec: JSON.stringify(parsed.value),
      });
      return okResult(result);
    },
  );

  // ── get_targeting_sentence ────────────────────────────────────────────
  server.tool(
    'get_targeting_sentence',
    'Convert a targeting specification into a human-readable sentence. Returns a natural-language description of who the targeting will reach — for example, "People aged 25-45 in United States who like Finance and are interested in Investing". This is useful for reviewing targeting configurations at a glance, generating reports, or confirming that the targeting spec matches your intent before creating an ad set.',
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
          'JSON string of the full targeting specification to describe. This should be the same format used in ad set targeting_spec. Example: {"geo_locations":{"countries":["US","GB"]},"age_min":18,"age_max":65,"interests":[{"id":"6003139266461","name":"Yoga"}],"behaviors":[{"id":"6002714895372","name":"Frequent Travelers"}]}. The API converts all targeting parameters (location, demographics, interests, behaviors, custom audiences, etc.) into readable sentence lines.',
        ),
    },
    async ({ account_id, targeting_spec }) => {
      const actId = client.resolveAccountId(account_id);

      const parsed = parseJsonParam(targeting_spec, 'targeting_spec');
      if (!parsed.ok) return parsed.result;

      const result = await client.get(`/${actId}/targetingsentencelines`, {
        targeting_spec: JSON.stringify(parsed.value),
      });
      return okResult(result);
    },
  );
}
