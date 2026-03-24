import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, toOptionalNumber } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerLeadgenTools(server: McpServer, client: MetaApiClient): void {
  // ── get_lead_forms ───────────────────────────────────────────────────
  server.tool(
    'get_lead_forms',
    'List lead generation forms for a Facebook Page. Returns form IDs, names, statuses, creation times, and lead counts. Lead forms are used with Lead Generation campaign objectives to collect user information (name, email, phone, etc.) directly within Facebook/Instagram ads.',
    {
      page_id: z
        .string()
        .describe(
          'Facebook Page ID that owns the lead forms. Use get_account_pages to find your page IDs. Example: "123456789".',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,status,created_time,leads_count. Other available fields include: locale, page, qualifiers_enabled, question_page_custom_headline, questions, thank_you_page.',
        ),
    },
    async ({ page_id, fields }) => {
      const result = await client.get(`/${page_id}/leadgen_forms`, {
        fields: fields ?? DEFAULT_FIELDS.LEADFORM_LIST,
      });
      return okResult(result);
    },
  );

  // ── get_leads ────────────────────────────────────────────────────────
  server.tool(
    'get_leads',
    'Retrieve leads collected from a specific lead generation form. Returns lead IDs, submission timestamps, and field data (name, email, phone, etc.) as submitted by users. Use this to export or process leads from your Lead Generation campaigns. Requires leads_retrieval permission on the Page access token.',
    {
      form_id: z
        .string()
        .describe(
          'Lead form ID to retrieve leads from. Use get_lead_forms to find form IDs. Example: "987654321".',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return per lead. Defaults to id,created_time,field_data. Other available fields include: ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name, form_id, platform, retailer_item_id.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of leads to return per page (default 25, max 100). Use pagination cursors in the response to retrieve additional pages.',
        ),
    },
    async ({ form_id, fields, limit }) => {
      const result = await client.get(`/${form_id}/leads`, {
        fields: fields ?? DEFAULT_FIELDS.LEAD_LIST,
        limit: toOptionalNumber(limit),
      });
      return okResult(result);
    },
  );
}
