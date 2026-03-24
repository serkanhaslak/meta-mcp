import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerSavedAudienceTools(server: McpServer, client: MetaApiClient): void {
  // ── list_saved_audiences ─────────────────────────────────────────────
  server.tool(
    'list_saved_audiences',
    'List all saved audiences for an ad account. Saved audiences are reusable targeting specs (demographics, interests, behaviors, locations) that can be applied to ad sets. Returns audience names, targeting details, approximate reach, and run status. Use this to discover existing saved audiences before creating new ones or to review targeting configurations.',
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
          'Comma-separated list of fields to return. Defaults to id,name,description,targeting,approximate_count,run_status,sentence_lines. See Meta API docs for all available SavedAudience fields.',
        ),
    },
    async ({ account_id, fields }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/saved_audiences`, {
        fields: fields ?? DEFAULT_FIELDS.SAVED_AUDIENCE_LIST,
      });
      return okResult(result);
    },
  );

  // ── create_saved_audience ────────────────────────────────────────────
  server.tool(
    'create_saved_audience',
    'Create a new saved audience in an ad account. Saved audiences store a reusable targeting specification — including demographics, interests, behaviors, and geo-targeting — so you can quickly apply the same targeting to multiple ad sets without re-entering it each time. The targeting parameter uses the same format as ad set targeting.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      name: z
        .string()
        .describe(
          'Name for the saved audience. Must be unique within the ad account. Use a descriptive name for easy identification (e.g. "TR Males 25-44 Finance Interest").',
        ),
      targeting: z
        .string()
        .describe(
          'JSON string of the targeting spec — same format used in ad set targeting. Must include at least geo_locations. Example: {"geo_locations":{"countries":["TR"]},"age_min":25,"age_max":44,"genders":[1],"interests":[{"id":"6003139266461","name":"Finance"}]}. Use search_interests, search_geo_locations, search_behaviors, and search_demographics tools to discover valid targeting values.',
        ),
      description: z
        .string()
        .optional()
        .describe(
          'Description of the saved audience for internal reference. Useful for documenting the intent or campaign context for this targeting configuration.',
        ),
    },
    async ({ account_id, name, targeting, description }) => {
      const actId = client.resolveAccountId(account_id);

      const parsed = parseJsonParam(targeting, 'targeting');
      if (!parsed.ok) return parsed.result;

      const data: Record<string, unknown> = {
        name,
        targeting: parsed.value,
      };
      if (description) data.description = description;
      const result = await client.post(`/${actId}/saved_audiences`, data);
      return okResult(result);
    },
  );

  // ── delete_saved_audience ────────────────────────────────────────────
  server.tool(
    'delete_saved_audience',
    'Permanently delete a saved audience by its ID. This removes the reusable targeting spec from the ad account. Existing ad sets that were created using this saved audience are NOT affected — they retain their own copy of the targeting. This action cannot be undone.',
    {
      saved_audience_id: z
        .string()
        .describe(
          'The ID of the saved audience to delete. Get this from list_saved_audiences. WARNING: This action is irreversible.',
        ),
    },
    async ({ saved_audience_id }) => {
      const result = await client.del(`/${saved_audience_id}`);
      return okResult(result);
    },
  );
}
