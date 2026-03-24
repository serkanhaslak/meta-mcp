import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, errResult } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerImageTools(server: McpServer, client: MetaApiClient): void {
  // ── upload_image ─────────────────────────────────────────────────────
  server.tool(
    'upload_image',
    'Upload an image to the ad account\'s image library for use in ad creatives. Supports two upload methods: provide base64-encoded image data via "bytes", or a publicly accessible URL via "url" (Meta will download the image). Returns the image hash needed for creating ad creatives. Supported formats: JPG, PNG, BMP, TIFF, GIF (non-animated). Max size: 30MB.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      bytes: z
        .string()
        .optional()
        .describe(
          'Base64-encoded image data. Use this method when you have the image content available directly. Provide either "bytes" or "url", not both.',
        ),
      url: z
        .string()
        .optional()
        .describe(
          'Publicly accessible URL of the image. Meta will download the image from this URL. Use this method for images already hosted online. Provide either "bytes" or "url", not both.',
        ),
      name: z
        .string()
        .optional()
        .describe(
          'Optional name for the image. If not provided, Meta will auto-generate a name.',
        ),
    },
    async ({ account_id, bytes, url, name }) => {
      if (!bytes && !url) {
        return errResult('You must provide either "bytes" (base64-encoded image data) or "url" (public image URL).');
      }

      const actId = client.resolveAccountId(account_id);
      const data: Record<string, any> = {};
      if (bytes) data.bytes = bytes;
      if (url) data.url = url;
      if (name) data.name = name;

      const result = await client.post(`/${actId}/adimages`, data);
      return okResult(result);
    },
  );

  // ── list_images ──────────────────────────────────────────────────────
  server.tool(
    'list_images',
    'List images in the ad account\'s image library. Optionally filter by specific image hashes to retrieve details for known images. Returns image metadata including hash, name, URL, dimensions, and creation time. Use this to find image hashes needed for creating ad creatives.',
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
          'Comma-separated list of fields to return. Defaults to id,hash,name,url,url_128,width,height,created_time,status. See Meta API docs for all available AdImage fields.',
        ),
      hashes: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of image hashes to filter by. Only images matching these hashes will be returned. Use this to look up specific images you already know the hash for.',
        ),
    },
    async ({ account_id, fields, hashes }) => {
      const actId = client.resolveAccountId(account_id);
      const params: Record<string, string | number | undefined> = {
        fields: fields ?? DEFAULT_FIELDS.IMAGE_LIST,
      };
      if (hashes) {
        params.hashes = `[${hashes.split(',').map(h => `"${h.trim()}"`).join(',')}]`;
      }

      const result = await client.get(`/${actId}/adimages`, params);
      return okResult(result);
    },
  );

  // ── delete_image ─────────────────────────────────────────────────────
  server.tool(
    'delete_image',
    'Delete an image from the ad account\'s image library by its hash. This is a permanent action. The image must not be actively used by any running ad creatives. If the image is in use, update or delete the associated creatives first.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      hash: z
        .string()
        .describe(
          'The hash of the image to delete. You can find image hashes using the list_images tool.',
        ),
    },
    async ({ account_id, hash }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.del(`/${actId}/adimages`, { hash });
      return okResult(result);
    },
  );
}
