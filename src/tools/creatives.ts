import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, parseJsonParam } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerCreativeTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'list_creatives',
    'List ad creatives for an ad account. Returns creative IDs, names, object story specs, and other configuration. Use this to browse existing creatives before associating them with ads or to audit creative assets in the account.',
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
          `Comma-separated list of fields to return. Defaults to: ${DEFAULT_FIELDS.CREATIVE_LIST}. See Meta API docs for all available AdCreative fields.`,
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of creatives to return per page (default 25, max 100).',
        ),
    },
    async ({ account_id, fields, limit }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/adcreatives`, {
        fields: fields ?? DEFAULT_FIELDS.CREATIVE_LIST,
        limit: limit ? Number(limit) : undefined,
      });
      return okResult(result);
    },
  );

  server.tool(
    'get_creative',
    'Get detailed information about a specific ad creative by its ID. Returns the full creative configuration including object story spec, image/video references, URL tags, and asset feed spec. Use this to inspect a creative before cloning or modifying it.',
    {
      creative_id: z
        .string()
        .describe('The ID of the ad creative to retrieve.'),
      fields: z
        .string()
        .optional()
        .describe(
          `Comma-separated list of fields to return. Defaults to: ${DEFAULT_FIELDS.CREATIVE_GET}. See Meta API docs for all available AdCreative fields.`,
        ),
    },
    async ({ creative_id, fields }) => {
      const result = await client.get(`/${creative_id}`, {
        fields: fields ?? DEFAULT_FIELDS.CREATIVE_GET,
      });
      return okResult(result);
    },
  );

  server.tool(
    'create_creative',
    'Create a new ad creative in the specified ad account. The creative defines the visual and textual content of an ad, including images, videos, text, links, and call-to-action buttons. After creation, associate the creative with an ad using the ads tools.',
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
          'A descriptive name for the creative. Used for internal identification in the Ads Manager.',
        ),
      object_story_spec: z
        .string()
        .describe(
          'JSON string defining the creative content. Must include "page_id" and one of: "link_data" (for link/image ads with fields like link, message, name, description, image_hash, call_to_action), "video_data" (for video ads with video_id, title, message, thumbnail_url, call_to_action), or "photo_data" (for photo post ads with image_hash, caption). Example: {"page_id":"123","link_data":{"link":"https://example.com","message":"Check this out","image_hash":"abc123","call_to_action":{"type":"LEARN_MORE"}}}',
        ),
      asset_feed_spec: z
        .string()
        .optional()
        .describe(
          'JSON string for Dynamic Creative assets. Provide multiple text/image/video variations and Meta will automatically test combinations. Structure: {"images":[{"hash":"..."}],"bodies":[{"text":"..."}],"titles":[{"text":"..."}],"descriptions":[{"text":"..."}],"call_to_action_types":["LEARN_MORE"]}. Only used with Dynamic Creative ad sets.',
        ),
      url_tags: z
        .string()
        .optional()
        .describe(
          'URL query parameters appended to all links in the creative for tracking. Example: "utm_source=facebook&utm_medium=cpc&utm_campaign=spring_sale". Do not include the leading "?".',
        ),
      degrees_of_freedom_spec: z
        .string()
        .optional()
        .describe(
          'JSON string to enable Meta Generative AI creative features (text generation, image expansion, background generation). Example: {"creative_features_spec":{"standard_enhancements":{"enroll_status":"OPT_IN"}}} to enable all AI enhancements. Use "OPT_OUT" to disable specific features.',
        ),
    },
    async ({ account_id, name, object_story_spec, asset_feed_spec, url_tags, degrees_of_freedom_spec }) => {
      const actId = client.resolveAccountId(account_id);
      const data: Record<string, any> = {
        name,
        object_story_spec,
      };
      if (asset_feed_spec) data.asset_feed_spec = asset_feed_spec;
      if (url_tags) data.url_tags = url_tags;
      if (degrees_of_freedom_spec) data.degrees_of_freedom_spec = degrees_of_freedom_spec;

      const result = await client.post(`/${actId}/adcreatives`, data);
      return okResult(result);
    },
  );

  server.tool(
    'update_creative',
    'Update an existing ad creative. Only the provided fields will be modified; omitted fields remain unchanged. Note: not all fields are updatable after creation -- name, url_tags, and object_story_spec are the most commonly updated fields.',
    {
      creative_id: z
        .string()
        .describe('The ID of the ad creative to update.'),
      name: z
        .string()
        .optional()
        .describe('Updated name for the creative.'),
      object_story_spec: z
        .string()
        .optional()
        .describe(
          'Updated JSON string defining the creative content. Same structure as create_creative: must include "page_id" and one of "link_data", "video_data", or "photo_data".',
        ),
      url_tags: z
        .string()
        .optional()
        .describe(
          'Updated URL query parameters appended to all links in the creative for tracking. Example: "utm_source=facebook&utm_medium=cpc". Do not include the leading "?".',
        ),
    },
    async ({ creative_id, name, object_story_spec, url_tags }) => {
      const data: Record<string, any> = {};
      if (name) data.name = name;
      if (object_story_spec) data.object_story_spec = object_story_spec;
      if (url_tags) data.url_tags = url_tags;

      const result = await client.post(`/${creative_id}`, data);
      return okResult(result);
    },
  );

  server.tool(
    'delete_creative',
    'Delete an ad creative by its ID. This is a permanent action. The creative must not be actively used by any running ads. If the creative is in use, pause or delete the associated ads first.',
    {
      creative_id: z
        .string()
        .describe('The ID of the ad creative to delete.'),
    },
    async ({ creative_id }) => {
      const result = await client.del(`/${creative_id}`);
      return okResult(result);
    },
  );
}
