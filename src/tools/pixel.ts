import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerPixelTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'list_pixels',
    'List all Meta Pixels (datasets) associated with an ad account. Returns pixel IDs, names, creation times, and last fired times. Pixels are used for website event tracking, conversion optimization, and building custom audiences from website visitors. You need the pixel ID to send server-side conversion events via the Conversions API.',
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
          'Comma-separated list of fields to return. Defaults to id,name,code,creation_time,last_fired_time. Other available fields include: owner_ad_account, owner_business, data_use_setting, is_unavailable, automatic_matching_fields.',
        ),
    },
    async ({ account_id, fields }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/adspixels`, {
        fields: fields ?? DEFAULT_FIELDS.PIXEL_LIST,
      });
      return okResult(result);
    },
  );

  server.tool(
    'get_pixel',
    'Get detailed information about a specific Meta Pixel (dataset) including its configuration, code snippet, owner, and firing status. Use this to inspect pixel setup, retrieve the pixel base code for installation, or check when events were last received.',
    {
      pixel_id: z
        .string()
        .describe(
          'Meta Pixel ID to retrieve details for. Use list_pixels to find pixel IDs. Example: "123456789012345".',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,name,code,creation_time,last_fired_time,owner_ad_account,owner_business,data_use_setting,is_unavailable,automatic_matching_fields. See Meta API docs for all available AdsPixel fields.',
        ),
    },
    async ({ pixel_id, fields }) => {
      const result = await client.get(`/${pixel_id}`, {
        fields: fields ?? DEFAULT_FIELDS.PIXEL_GET,
      });
      return okResult(result);
    },
  );
}
