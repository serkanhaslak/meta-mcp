import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerLabelTools(server: McpServer, client: MetaApiClient): void {
  // ── list_ad_labels ───────────────────────────────────────────────────
  server.tool(
    'list_ad_labels',
    'List all ad labels for an ad account. Ad labels are tags you can attach to campaigns, ad sets, and ads for organization and filtering. Use labels to group related objects (e.g. "Q1 Promo", "Brand Awareness", "Retargeting") and then filter by label in list endpoints. Returns label IDs, names, and timestamps.',
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
          'Comma-separated list of fields to return. Defaults to id,name,created_time,updated_time. See Meta API docs for all available AdLabel fields.',
        ),
    },
    async ({ account_id, fields }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/adlabels`, {
        fields: fields ?? DEFAULT_FIELDS.LABEL_LIST,
      });
      return okResult(result);
    },
  );

  // ── create_ad_label ──────────────────────────────────────────────────
  server.tool(
    'create_ad_label',
    'Create a new ad label in an ad account. Ad labels are reusable tags for organizing campaigns, ad sets, and ads. After creating a label, you can attach it to ad objects via their update endpoints. Use descriptive names that reflect your organizational scheme (e.g. "Holiday 2024", "A/B Test - Creative V2", "High Priority"). Returns the new label ID.',
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
          'Name of the ad label. Must be unique within the ad account. Use a descriptive, consistent naming convention (e.g. "Campaign Type: Retargeting", "Region: EMEA").',
        ),
    },
    async ({ account_id, name }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/adlabels`, { name });
      return okResult(result);
    },
  );

  // ── delete_ad_label ──────────────────────────────────────────────────
  server.tool(
    'delete_ad_label',
    'Permanently delete an ad label. This action cannot be undone. The label will be removed from all campaigns, ad sets, and ads it was attached to. Those ad objects will continue to function normally — only the label association is removed.',
    {
      label_id: z
        .string()
        .describe(
          'The ad label ID to delete (e.g. "123456789"). Get this from list_ad_labels. WARNING: This action is irreversible and will detach the label from all associated ad objects.',
        ),
    },
    async ({ label_id }) => {
      const result = await client.del(`/${label_id}`);
      return okResult(result);
    },
  );
}
