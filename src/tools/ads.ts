import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, errResult, parseJsonParam, normalizeEffectiveStatus } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerAdTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'list_ads',
    'List ads for an ad account. Returns ads with their creative references, status, and tracking configuration. Supports filtering by effective status, ad set, campaign, and custom field selection.',
    {
      account_id: z
        .string()
        .optional()
        .describe('Ad account ID (with or without "act_" prefix). Falls back to the default account if omitted.'),
      fields: z
        .string()
        .optional()
        .describe(
          `Comma-separated list of fields to return. Defaults to: ${DEFAULT_FIELDS.AD_LIST}`,
        ),
      filtering: z
        .string()
        .optional()
        .describe(
          'JSON array of filter objects, e.g. [{"field":"adset_id","operator":"EQUAL","value":"123"}]. Supports fields like name, adset_id, campaign_id, and more.',
        ),
      effective_status: z
        .string()
        .optional()
        .describe(
          'Comma-separated effective statuses to filter by, e.g. "ACTIVE,PAUSED". Valid values: ACTIVE, PAUSED, DELETED, ARCHIVED, IN_PROCESS, WITH_ISSUES, CAMPAIGN_PAUSED, ADSET_PAUSED, DISAPPROVED, PENDING_REVIEW, PREAPPROVED.',
        ),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of ads to return per page (1-100). Default is 25.'),
    },
    async ({ account_id, fields, filtering, effective_status, limit }) => {
      const actId = client.resolveAccountId(account_id);
      const params: Record<string, string | number | undefined> = {
        fields: fields ?? DEFAULT_FIELDS.AD_LIST,
        limit,
      };

      if (filtering) params.filtering = filtering;
      if (effective_status) {
        params.effective_status = normalizeEffectiveStatus(effective_status);
      }

      const result = await client.get(`/${actId}/ads`, params);
      return okResult(result);
    },
  );

  server.tool(
    'get_ad',
    'Get detailed information about a single ad by its ID. Returns the full ad configuration including its creative reference, tracking specs, conversion specs, and delivery status.',
    {
      ad_id: z.string().describe('The ID of the ad to retrieve.'),
      fields: z
        .string()
        .optional()
        .describe(
          `Comma-separated list of fields to return. Defaults to: ${DEFAULT_FIELDS.AD_LIST}`,
        ),
    },
    async ({ ad_id, fields }) => {
      const result = await client.get(`/${ad_id}`, {
        fields: fields ?? DEFAULT_FIELDS.AD_LIST,
      });
      return okResult(result);
    },
  );

  server.tool(
    'create_ad',
    'Create a new ad within an ad set. An ad combines a creative (image/video/carousel) with an ad set (targeting and budget). The creative parameter accepts either a reference to an existing creative by ID or an inline creative spec as a JSON string.',
    {
      account_id: z
        .string()
        .optional()
        .describe('Ad account ID (with or without "act_" prefix). Falls back to the default account if omitted.'),
      name: z.string().describe('Name of the ad.'),
      adset_id: z.string().describe('The ID of the ad set this ad belongs to.'),
      creative: z
        .string()
        .describe(
          'JSON string specifying the ad creative. Use {"creative_id":"<id>"} to reference an existing creative, or provide an inline spec like {"title":"My Ad","body":"Ad text","image_hash":"abc123","link_url":"https://example.com","object_story_spec":{...}}.',
        ),
      status: z
        .string()
        .optional()
        .describe('Initial status of the ad. Values: ACTIVE, PAUSED. Default is PAUSED if omitted.'),
      tracking_specs: z
        .string()
        .optional()
        .describe(
          'JSON string of tracking specs array. Defines conversion tracking for the ad. Example: \'[{"action.type":["offsite_conversion"],"fb_pixel":["123456789"]}]\'.',
        ),
    },
    async ({ account_id, name, adset_id, creative, status, tracking_specs }) => {
      const actId = client.resolveAccountId(account_id);

      const parsedCreative = parseJsonParam(creative, 'creative');
      if (!parsedCreative.ok) return parsedCreative.result;

      const data: Record<string, any> = {
        name,
        adset_id,
        creative: parsedCreative.value,
      };

      if (status) data.status = status;

      if (tracking_specs) {
        const parsedTrackingSpecs = parseJsonParam(tracking_specs, 'tracking_specs');
        if (!parsedTrackingSpecs.ok) return parsedTrackingSpecs.result;
        data.tracking_specs = parsedTrackingSpecs.value;
      }

      const result = await client.post(`/${actId}/ads`, data);
      return okResult(result);
    },
  );

  server.tool(
    'update_ad',
    'Update an existing ad. Allows modifying the name, status, creative, and tracking specs. Only the fields you provide will be updated; omitted fields remain unchanged.',
    {
      ad_id: z.string().describe('The ID of the ad to update.'),
      name: z.string().optional().describe('New name for the ad.'),
      status: z
        .string()
        .optional()
        .describe('Updated status. Values: ACTIVE, PAUSED, DELETED, ARCHIVED.'),
      creative: z
        .string()
        .optional()
        .describe(
          'JSON string specifying the updated creative. Use {"creative_id":"<id>"} to swap to a different creative, or provide an inline spec.',
        ),
      tracking_specs: z
        .string()
        .optional()
        .describe('JSON string of updated tracking specs array.'),
    },
    async ({ ad_id, name, status, creative, tracking_specs }) => {
      const data: Record<string, any> = {};

      if (name) data.name = name;
      if (status) data.status = status;

      if (creative) {
        const parsedCreative = parseJsonParam(creative, 'creative');
        if (!parsedCreative.ok) return parsedCreative.result;
        data.creative = parsedCreative.value;
      }

      if (tracking_specs) {
        const parsedTrackingSpecs = parseJsonParam(tracking_specs, 'tracking_specs');
        if (!parsedTrackingSpecs.ok) return parsedTrackingSpecs.result;
        data.tracking_specs = parsedTrackingSpecs.value;
      }

      const result = await client.post(`/${ad_id}`, data);
      return okResult(result);
    },
  );

  server.tool(
    'delete_ad',
    'Delete an ad by its ID. This action is irreversible. Consider updating the status to ARCHIVED instead if you may need to reference it later.',
    {
      ad_id: z.string().describe('The ID of the ad to delete.'),
    },
    async ({ ad_id }) => {
      const result = await client.del(`/${ad_id}`);
      return okResult(result);
    },
  );
}
