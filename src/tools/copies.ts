import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';

export function registerCopyTools(server: McpServer, client: MetaApiClient): void {
  // ── copy_campaign ────────────────────────────────────────────────────
  server.tool(
    'copy_campaign',
    'Create a copy of an existing campaign using the Meta Copies API. By default only the campaign shell is copied. Set deep_copy to "true" to also duplicate all ad sets and ads within the campaign. The copy is created in PAUSED status by default to allow review before launching. Returns the ID of the newly created campaign.',
    {
      campaign_id: z
        .string()
        .describe(
          'The ID of the source campaign to copy (e.g. "123456789"). The campaign must exist and be accessible in your ad account.',
        ),
      rename_options: z
        .string()
        .optional()
        .describe(
          'JSON string controlling how the copied campaign (and its children if deep_copy) are renamed. Keys: "rename_strategy" (DEEP_RENAME to rename all levels, NO_RENAME to keep original names), "rename_prefix" (prepended to the name), "rename_suffix" (appended to the name). Example: {"rename_strategy":"DEEP_RENAME","rename_prefix":"Copy of ","rename_suffix":" - Q2"}. Defaults to Meta\'s standard behavior (prepends "Copy of").',
        ),
      status_option: z
        .string()
        .optional()
        .describe(
          'Status for the copied campaign. Valid values: "PAUSED" (copy is created paused regardless of source status — recommended for review), "INHERITED" (copy inherits the source campaign\'s status). Defaults to PAUSED if not specified.',
        ),
      deep_copy: z
        .string()
        .optional()
        .describe(
          'Whether to deep-copy the entire campaign structure including all ad sets and ads. Pass "true" to copy everything, "false" to copy only the campaign shell. Defaults to "false". Deep copy is useful for duplicating a full campaign for A/B testing or seasonal relaunches.',
        ),
    },
    async ({ campaign_id, rename_options, status_option, deep_copy }) => {
      const data: Record<string, unknown> = {};
      if (rename_options) {
        const parsed = parseJsonParam(rename_options, 'rename_options');
        if (!parsed.ok) return parsed.result;
        data.rename_options = parsed.value;
      }
      if (status_option) data.status_option = status_option;
      if (deep_copy) data.deep_copy = deep_copy === 'true';
      const result = await client.post(`/${campaign_id}/copies`, data);
      return okResult(result);
    },
  );

  // ── copy_adset ───────────────────────────────────────────────────────
  server.tool(
    'copy_adset',
    'Create a copy of an existing ad set using the Meta Copies API. Optionally copy it into a different campaign by providing campaign_id. Set deep_copy to "true" to also duplicate all ads within the ad set. The copy is created in PAUSED status by default. Returns the ID of the newly created ad set.',
    {
      adset_id: z
        .string()
        .describe(
          'The ID of the source ad set to copy (e.g. "123456789"). The ad set must exist and be accessible in your ad account.',
        ),
      rename_options: z
        .string()
        .optional()
        .describe(
          'JSON string controlling how the copied ad set (and its ads if deep_copy) are renamed. Keys: "rename_strategy" (DEEP_RENAME to rename all levels, NO_RENAME to keep original names), "rename_prefix" (prepended to the name), "rename_suffix" (appended to the name). Example: {"rename_strategy":"DEEP_RENAME","rename_prefix":"Test - "}.',
        ),
      status_option: z
        .string()
        .optional()
        .describe(
          'Status for the copied ad set. Valid values: "PAUSED" (copy is created paused regardless of source status), "INHERITED" (copy inherits the source ad set\'s status). Defaults to PAUSED if not specified.',
        ),
      campaign_id: z
        .string()
        .optional()
        .describe(
          'The ID of the target campaign to copy the ad set into (e.g. "123456789"). If not provided, the ad set is copied within the same campaign. Useful for reorganizing ad sets across campaigns or duplicating winning ad sets into new campaigns.',
        ),
      deep_copy: z
        .string()
        .optional()
        .describe(
          'Whether to deep-copy the ad set including all its ads. Pass "true" to copy the ad set with all ads, "false" to copy only the ad set shell. Defaults to "false". Deep copy is useful for duplicating a complete ad set for audience testing.',
        ),
    },
    async ({ adset_id, rename_options, status_option, campaign_id, deep_copy }) => {
      const data: Record<string, unknown> = {};
      if (rename_options) {
        const parsed = parseJsonParam(rename_options, 'rename_options');
        if (!parsed.ok) return parsed.result;
        data.rename_options = parsed.value;
      }
      if (status_option) data.status_option = status_option;
      if (campaign_id) data.campaign_id = campaign_id;
      if (deep_copy) data.deep_copy = deep_copy === 'true';
      const result = await client.post(`/${adset_id}/copies`, data);
      return okResult(result);
    },
  );

  // ── copy_ad ──────────────────────────────────────────────────────────
  server.tool(
    'copy_ad',
    'Create a copy of an existing ad using the Meta Copies API. Optionally copy it into a different ad set by providing adset_id. The copy is created in PAUSED status by default to allow creative review before launching. Returns the ID of the newly created ad.',
    {
      ad_id: z
        .string()
        .describe(
          'The ID of the source ad to copy (e.g. "123456789"). The ad must exist and be accessible in your ad account.',
        ),
      rename_options: z
        .string()
        .optional()
        .describe(
          'JSON string controlling how the copied ad is renamed. Keys: "rename_strategy" (DEEP_RENAME or NO_RENAME), "rename_prefix" (prepended to the name), "rename_suffix" (appended to the name). Example: {"rename_strategy":"DEEP_RENAME","rename_prefix":"V2 - "}.',
        ),
      status_option: z
        .string()
        .optional()
        .describe(
          'Status for the copied ad. Valid values: "PAUSED" (copy is created paused regardless of source status), "INHERITED" (copy inherits the source ad\'s status). Defaults to PAUSED if not specified.',
        ),
      adset_id: z
        .string()
        .optional()
        .describe(
          'The ID of the target ad set to copy the ad into (e.g. "123456789"). If not provided, the ad is copied within the same ad set. Useful for testing the same creative across different audiences or moving winning ads to new ad sets.',
        ),
    },
    async ({ ad_id, rename_options, status_option, adset_id }) => {
      const data: Record<string, unknown> = {};
      if (rename_options) {
        const parsed = parseJsonParam(rename_options, 'rename_options');
        if (!parsed.ok) return parsed.result;
        data.rename_options = parsed.value;
      }
      if (status_option) data.status_option = status_option;
      if (adset_id) data.adset_id = adset_id;
      const result = await client.post(`/${ad_id}/copies`, data);
      return okResult(result);
    },
  );
}
