import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerCustomConversionTools(server: McpServer, client: MetaApiClient): void {
  // ── list_custom_conversions ──────────────────────────────────────────
  server.tool(
    'list_custom_conversions',
    'List all custom conversions for an ad account. Custom conversions let you track and optimize for specific URL-based conversion events without modifying your pixel code. They work by applying URL rules to standard pixel events — for example, tracking a "Purchase" event only when the URL contains "/thank-you". Returns conversion IDs, names, rules, associated pixels, and firing status. Use this to audit existing custom conversions or find IDs for reporting and optimization.',
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
          'Comma-separated list of fields to return. Defaults to id,name,pixel,custom_event_type,rule,default_conversion_value,creation_time,last_fired_time,is_archived. Other available fields include: account_id, aggregation_rule, business, data_sources, description, event_source_type, first_fired_time, is_unavailable, offline_conversion_data_set, retention_days.',
        ),
    },
    async ({ account_id, fields }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/customconversions`, {
        fields: fields ?? DEFAULT_FIELDS.CUSTOM_CONVERSION_LIST,
      });
      return okResult(result);
    },
  );

  // ── create_custom_conversion ─────────────────────────────────────────
  server.tool(
    'create_custom_conversion',
    'Create a new custom conversion for an ad account. Custom conversions define URL-based rules that refine when a standard pixel event counts as a conversion. For example, you can create a custom conversion that only fires a "Purchase" event when the page URL contains "/checkout/success". This lets you optimize ad delivery and track conversions for specific pages or funnels without adding extra pixel event code. The conversion is associated with a specific pixel and event type.',
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
          'Name of the custom conversion. Use a descriptive name that identifies the conversion action and page (e.g. "Purchase - Thank You Page", "Lead - Contact Form Submitted"). Must be unique within the ad account.',
        ),
      pixel_id: z
        .string()
        .describe(
          'The Meta Pixel ID to base this custom conversion on. The pixel must be installed on the website where the conversion occurs. Use list_pixels to find available pixel IDs. Example: "123456789012345".',
        ),
      custom_event_type: z
        .string()
        .describe(
          'The standard pixel event type this custom conversion is based on. The custom conversion will only fire when this event type occurs AND the URL rule matches. Valid values: "PURCHASE", "LEAD", "COMPLETE_REGISTRATION", "ADD_TO_CART", "INITIATED_CHECKOUT", "SEARCH", "VIEW_CONTENT", "CONTACT", "OTHER". Use "OTHER" for custom events or general page views.',
        ),
      rule: z
        .string()
        .describe(
          'JSON string defining the URL matching rule for this custom conversion. The rule determines which page URLs trigger the conversion. Common patterns: URL contains — {"and":[{"url":{"i_contains":"thank-you"}}]}, URL equals — {"and":[{"url":{"eq":"https://example.com/success"}}]}, URL regex — {"and":[{"url":{"regex":"checkout\\/confirm"}}]}, Multiple conditions — {"and":[{"url":{"i_contains":"purchase"}},{"url":{"i_not_contains":"cancel"}}]}. The "i_contains" operator is case-insensitive.',
        ),
      default_conversion_value: z
        .number()
        .optional()
        .describe(
          'Default monetary value assigned to each conversion event. Used for ROAS (Return on Ad Spend) calculations when no dynamic value is passed with the pixel event. Example: 49.99 for a product that typically costs $49.99. Set to 0 or omit if conversions have varying values sent via the pixel.',
        ),
    },
    async ({ account_id, name, pixel_id, custom_event_type, rule, default_conversion_value }) => {
      const actId = client.resolveAccountId(account_id);

      const parsed = parseJsonParam(rule, 'rule');
      if (!parsed.ok) return parsed.result;

      const data: Record<string, unknown> = {
        name,
        pixel: pixel_id,
        custom_event_type,
        rule: JSON.stringify(parsed.value),
      };
      if (default_conversion_value !== undefined) {
        data.default_conversion_value = default_conversion_value;
      }

      const result = await client.post(`/${actId}/customconversions`, data);
      return okResult(result);
    },
  );

  // ── get_custom_conversion ────────────────────────────────────────────
  server.tool(
    'get_custom_conversion',
    'Get detailed information about a specific custom conversion including its URL rule, associated pixel, event type, default value, and firing history. Use this to inspect a custom conversion configuration, verify its rule is matching correctly, or check when it last fired. The last_fired_time field is particularly useful for debugging whether the conversion is actively tracking.',
    {
      custom_conversion_id: z
        .string()
        .describe(
          'The ID of the custom conversion to retrieve. Use list_custom_conversions to find available IDs. Example: "123456789012345".',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,pixel,custom_event_type,rule,default_conversion_value,creation_time,last_fired_time,first_fired_time,is_archived,account_id,description,event_source_type. See Meta API docs for all available CustomConversion fields.',
        ),
    },
    async ({ custom_conversion_id, fields }) => {
      const result = await client.get(`/${custom_conversion_id}`, {
        fields: fields ?? DEFAULT_FIELDS.CUSTOM_CONVERSION_GET,
      });
      return okResult(result);
    },
  );

  // ── delete_custom_conversion ─────────────────────────────────────────
  server.tool(
    'delete_custom_conversion',
    'Permanently delete a custom conversion. This action cannot be undone. Any ad sets optimizing for this custom conversion will lose their optimization target, which may affect delivery. Any historical reporting data associated with this custom conversion will also become inaccessible. Make sure to update affected ad sets to use a different optimization event before deleting.',
    {
      custom_conversion_id: z
        .string()
        .describe(
          'The ID of the custom conversion to delete. Use list_custom_conversions to find the ID. WARNING: This action is irreversible and will affect any ad sets optimizing for this conversion.',
        ),
    },
    async ({ custom_conversion_id }) => {
      const result = await client.del(`/${custom_conversion_id}`);
      return okResult(result);
    },
  );
}
