import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult } from '../utils/tool-response.js';

export function registerPreviewTools(server: McpServer, client: MetaApiClient): void {
  // ── get_ad_previews ──────────────────────────────────────────────────
  server.tool(
    'get_ad_previews',
    'Get rendered HTML preview(s) of an existing ad creative. Returns an iframe-ready HTML snippet that shows how the creative looks in the specified ad format/placement. Use this to visually verify a creative before it goes live or to share previews with stakeholders for approval.',
    {
      creative_id: z
        .string()
        .describe(
          'The ID of the ad creative to preview. You can obtain this from list_creatives or get_creative.',
        ),
      ad_format: z
        .enum([
          'DESKTOP_FEED_STANDARD',
          'MOBILE_FEED_STANDARD',
          'INSTAGRAM_STANDARD',
          'INSTAGRAM_STORY',
          'INSTAGRAM_REELS',
          'RIGHT_COLUMN',
          'MARKETPLACE_MOBILE',
          'AUDIENCE_NETWORK_INSTREAM_VIDEO',
        ])
        .describe(
          'The ad placement format to render the preview for. Each format simulates how the ad appears in that specific placement: DESKTOP_FEED_STANDARD (Facebook desktop News Feed), MOBILE_FEED_STANDARD (Facebook mobile News Feed), INSTAGRAM_STANDARD (Instagram feed post), INSTAGRAM_STORY (Instagram Stories full-screen), INSTAGRAM_REELS (Instagram Reels), RIGHT_COLUMN (Facebook right-hand column), MARKETPLACE_MOBILE (Facebook Marketplace on mobile), AUDIENCE_NETWORK_INSTREAM_VIDEO (in-stream video on Audience Network partner apps).',
        ),
    },
    async ({ creative_id, ad_format }) => {
      const result = await client.get(`/${creative_id}/previews`, {
        ad_format,
      });
      return okResult(result);
    },
  );

  // ── generate_ad_preview ────────────────────────────────────────────────
  server.tool(
    'generate_ad_preview',
    'Generate an ad preview from a creative specification without creating a persistent creative object. This is useful for previewing ad designs during the creative development process — you can iterate on the object_story_spec and see rendered output before committing to a final creative. Returns iframe-ready HTML showing how the ad would look in the specified placement.',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      creative: z
        .string()
        .describe(
          'JSON string of the creative specification object. Must contain an "object_story_spec" with "page_id" and one of: "link_data" (for link/image ads), "video_data" (for video ads), or "photo_data" (for photo ads). Example: {"object_story_spec":{"page_id":"123456","link_data":{"link":"https://example.com","message":"Check this out!","image_hash":"abc123","call_to_action":{"type":"LEARN_MORE"}}}}',
        ),
      ad_format: z
        .enum([
          'DESKTOP_FEED_STANDARD',
          'MOBILE_FEED_STANDARD',
          'INSTAGRAM_STANDARD',
          'INSTAGRAM_STORY',
          'INSTAGRAM_REELS',
          'RIGHT_COLUMN',
          'MARKETPLACE_MOBILE',
          'AUDIENCE_NETWORK_INSTREAM_VIDEO',
        ])
        .describe(
          'The ad placement format to render the preview for. Each format simulates how the ad appears in that specific placement: DESKTOP_FEED_STANDARD (Facebook desktop News Feed), MOBILE_FEED_STANDARD (Facebook mobile News Feed), INSTAGRAM_STANDARD (Instagram feed post), INSTAGRAM_STORY (Instagram Stories full-screen), INSTAGRAM_REELS (Instagram Reels), RIGHT_COLUMN (Facebook right-hand column), MARKETPLACE_MOBILE (Facebook Marketplace on mobile), AUDIENCE_NETWORK_INSTREAM_VIDEO (in-stream video on Audience Network partner apps).',
        ),
    },
    async ({ account_id, creative, ad_format }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.post(`/${actId}/generatepreviews`, {
        creative,
        ad_format,
      });
      return okResult(result);
    },
  );
}
