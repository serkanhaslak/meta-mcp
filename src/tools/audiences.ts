import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, errResult, parseJsonParam } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerAudienceTools(server: McpServer, client: MetaApiClient): void {
  // ── list_custom_audiences ────────────────────────────────────────────
  server.tool(
    'list_custom_audiences',
    'List all custom audiences for an ad account. Returns audience IDs, names, subtypes, approximate sizes, and delivery status. Use this to discover existing audiences before creating new ones or to find audience IDs for use in ad set targeting.',
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
          'Comma-separated list of fields to return. Defaults to id,name,subtype,description,approximate_count,delivery_status,operation_status,time_created,time_updated. See Meta API docs for all available CustomAudience fields.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of audiences to return per page (default 25, max 100).',
        ),
    },
    async ({ account_id, fields, limit }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/customaudiences`, {
        fields: fields ?? DEFAULT_FIELDS.AUDIENCE_LIST,
        limit: limit ? Number(limit) : undefined,
      });
      return okResult(result);
    },
  );

  // ── create_custom_audience ───────────────────────────────────────────
  server.tool(
    'create_custom_audience',
    'Create a new custom audience in an ad account. Custom audiences let you target ads to a specific set of people based on customer data, website activity, app activity, or engagement. After creation, you can populate the audience using add_audience_users or set up rules for automatic population.',
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
          'Name of the custom audience. Must be unique within the ad account. Use a descriptive name for easy identification (e.g. "High-Value Purchasers Q1 2024").',
        ),
      subtype: z
        .string()
        .describe(
          'Type of custom audience to create. Valid values: CUSTOM (uploaded customer list), WEBSITE (based on pixel events), APP (based on app events), OFFLINE (offline conversions), ENGAGEMENT (people who engaged with your content on Meta).',
        ),
      description: z
        .string()
        .optional()
        .describe(
          'Description of the audience for internal reference. Not shown to users.',
        ),
      customer_file_source: z
        .string()
        .optional()
        .describe(
          'Source of customer data for CUSTOM subtype audiences. Valid values: USER_PROVIDED_ONLY (data collected directly from customers), PARTNER_PROVIDED_ONLY (data from partners), BOTH_USER_AND_PARTNER_PROVIDED (mix of both sources).',
        ),
      rule: z
        .string()
        .optional()
        .describe(
          'JSON string defining audience rules for WEBSITE or APP subtypes. Example for website visitors in last 30 days: {"inclusions":{"operator":"or","rules":[{"event_sources":[{"id":"<pixel_id>","type":"pixel"}],"retention_seconds":2592000,"filter":{"operator":"and","filters":[{"field":"url","operator":"i_contains","value":""}]}}]}}',
        ),
    },
    async ({ account_id, name, subtype, description, customer_file_source, rule }) => {
      const actId = client.resolveAccountId(account_id);
      const data: Record<string, any> = { name, subtype };
      if (description) data.description = description;
      if (customer_file_source) data.customer_file_source = customer_file_source;
      if (rule) {
        const parsed = parseJsonParam(rule, 'rule');
        if (!parsed.ok) return parsed.result;
        data.rule = parsed.value;
      }
      const result = await client.post(`/${actId}/customaudiences`, data);
      return okResult(result);
    },
  );

  // ── add_audience_users ───────────────────────────────────────────────
  server.tool(
    'add_audience_users',
    'Add users to an existing custom audience by uploading hashed PII data. All personally identifiable information (emails, phone numbers, etc.) MUST be SHA256 hashed before sending. The payload defines the schema (types of data) and the corresponding data rows. Meta will match the hashed data against their user database to populate the audience.',
    {
      audience_id: z
        .string()
        .describe(
          'The ID of the custom audience to add users to. Get this from list_custom_audiences or create_custom_audience.',
        ),
      payload: z
        .string()
        .describe(
          'JSON string containing the user data payload. Must include "schema" (array of PII types) and "data" (array of arrays with hashed values). All PII values must be lowercase and SHA256 hashed. Example: {"schema":["EMAIL","PHONE"],"data":[["a1b2c3...hash...","d4e5f6...hash..."],["g7h8i9...hash...","j0k1l2...hash..."]]}. Valid schema types: EMAIL, PHONE, FN (first name), LN (last name), GEN (gender), DOB (date of birth YYYYMMDD), CT (city), ST (state), ZIP, COUNTRY, MADID (mobile advertiser ID), EXTERN_ID (external ID).',
        ),
    },
    async ({ audience_id, payload }) => {
      const parsed = parseJsonParam(payload, 'payload');
      if (!parsed.ok) return parsed.result;
      const result = await client.post(`/${audience_id}/users`, {
        payload: parsed.value,
      });
      return okResult(result);
    },
  );

  // ── remove_audience_users ────────────────────────────────────────────
  server.tool(
    'remove_audience_users',
    'Remove users from an existing custom audience by providing hashed PII data. The payload format is identical to add_audience_users — all PII values must be lowercase and SHA256 hashed. Meta will match and remove the specified users from the audience.',
    {
      audience_id: z
        .string()
        .describe(
          'The ID of the custom audience to remove users from. Get this from list_custom_audiences.',
        ),
      payload: z
        .string()
        .describe(
          'JSON string containing the user data payload. Must include "schema" (array of PII types) and "data" (array of arrays with hashed values). All PII values must be lowercase and SHA256 hashed. Format is identical to add_audience_users. Example: {"schema":["EMAIL"],"data":[["a1b2c3...hash..."]]}',
        ),
    },
    async ({ audience_id, payload }) => {
      const parsed = parseJsonParam(payload, 'payload');
      if (!parsed.ok) return parsed.result;
      const result = await client.del(`/${audience_id}/users`, {
        payload: JSON.stringify(parsed.value),
      });
      return okResult(result);
    },
  );

  // ── create_lookalike_audience ────────────────────────────────────────
  server.tool(
    'create_lookalike_audience',
    'Create a lookalike audience based on an existing custom audience. Lookalike audiences find new people who share similar characteristics with your source audience. The ratio controls audience size vs. similarity — smaller ratios (e.g. 0.01 = top 1%) are more similar to your source, while larger ratios (e.g. 0.10 = top 10%) reach more people but with less similarity.',
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
          'Name for the lookalike audience. Use a descriptive name including the source and ratio (e.g. "LAL - High-Value Customers - US 1%").',
        ),
      origin_audience_id: z
        .string()
        .describe(
          'The ID of the source custom audience to base the lookalike on. The source audience should have at least 100 people from a single country for best results. Get this from list_custom_audiences.',
        ),
      lookalike_spec: z
        .string()
        .describe(
          'JSON string defining the lookalike configuration. Must include "country" (ISO country code) and "ratio" (0.01 to 0.20, where 0.01 = top 1% most similar). Example: {"country":"US","ratio":0.01} for top 1% in the US. For multi-country: {"country":"US,GB","ratio":0.05}. You can also specify "starting_ratio" and "ratio" for a range (e.g. {"country":"US","starting_ratio":0.03,"ratio":0.06} for 3-6% band).',
        ),
    },
    async ({ account_id, name, origin_audience_id, lookalike_spec }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/customaudiences`, {
        name,
        subtype: 'LOOKALIKE',
        origin_audience_id,
        lookalike_spec,
      });
      return okResult(result);
    },
  );

  // ── delete_audience ──────────────────────────────────────────────────
  server.tool(
    'delete_audience',
    'Permanently delete a custom audience. This action cannot be undone. Any ad sets currently targeting this audience will stop delivering. Make sure to update or pause affected ad sets before deleting an audience.',
    {
      audience_id: z
        .string()
        .describe(
          'The ID of the custom audience to delete. Get this from list_custom_audiences. WARNING: This action is irreversible.',
        ),
    },
    async ({ audience_id }) => {
      const result = await client.del(`/${audience_id}`);
      return okResult(result);
    },
  );
}
