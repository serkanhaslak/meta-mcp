import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, errResult } from '../utils/tool-response.js';
import { DEFAULT_FIELDS } from '../utils/default-fields.js';

export function registerVideoTools(server: McpServer, client: MetaApiClient): void {
  // ── upload_video ─────────────────────────────────────────────────────
  server.tool(
    'upload_video',
    'Upload a video to the ad account\'s video library for use in ad creatives. Supports three upload methods: "file_url" (recommended for large files — Meta downloads directly from a public URL), "source" (base64-encoded video data for small files under 10MB), or "file_path" (local filesystem path — server reads and uploads via multipart). Provide exactly one upload method. Supported formats: MP4, MOV, AVI, and others. Max size varies by method (file_url supports up to 4GB).',
    {
      account_id: z
        .string()
        .optional()
        .describe(
          'Ad account ID (e.g. "123456789" or "act_123456789"). Falls back to the default account from META_AD_ACCOUNT_ID env var if not provided.',
        ),
      file_url: z
        .string()
        .optional()
        .describe(
          'Publicly accessible URL of the video file. Meta will download the video directly. Recommended for large files as it avoids transferring data through the server. Provide exactly one of: file_url, source, or file_path.',
        ),
      source: z
        .string()
        .optional()
        .describe(
          'Base64-encoded video data. Best for small files under 10MB. Provide exactly one of: file_url, source, or file_path.',
        ),
      file_path: z
        .string()
        .optional()
        .describe(
          'Absolute path to a video file on the local filesystem. The server will read the file and upload it via multipart form data. Provide exactly one of: file_url, source, or file_path.',
        ),
      title: z
        .string()
        .optional()
        .describe(
          'Title for the video. Displayed in the video library and can be used in ad creatives.',
        ),
      description: z
        .string()
        .optional()
        .describe(
          'Description for the video. Stored as metadata in the video library.',
        ),
    },
    async ({ account_id, file_url, source, file_path, title, description }) => {
      const provided = [file_url, source, file_path].filter(Boolean).length;
      if (provided === 0) {
        return errResult('You must provide exactly one upload method: "file_url" (public URL), "source" (base64 data), or "file_path" (local file path).');
      }
      if (provided > 1) {
        return errResult('Provide only one upload method. Use "file_url" for public URLs, "source" for base64 data, or "file_path" for local files.');
      }

      const actId = client.resolveAccountId(account_id);
      const endpoint = `/${actId}/advideos`;

      // Local file upload via multipart
      if (file_path) {
        const result = await client.uploadFromPath(file_path, endpoint, 'source');
        return okResult(result);
      }

      // URL or base64 upload via POST
      const data: Record<string, any> = {};
      if (file_url) data.file_url = file_url;
      if (source) data.source = source;
      if (title) data.title = title;
      if (description) data.description = description;

      const result = await client.post(endpoint, data);
      return okResult(result);
    },
  );

  // ── list_videos ──────────────────────────────────────────────────────
  server.tool(
    'list_videos',
    'List videos in the ad account\'s video library. Returns video metadata including IDs, titles, thumbnails, duration, and upload status. Use this to find video IDs needed for creating video ad creatives.',
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
          'Comma-separated list of fields to return. Defaults to id,title,description,length,created_time,updated_time,status,thumbnails,permalink_url. See Meta API docs for all available AdVideo fields.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of videos to return per page (default 25, max 100).',
        ),
    },
    async ({ account_id, fields, limit }) => {
      const actId = client.resolveAccountId(account_id);
      const result = await client.get(`/${actId}/advideos`, {
        fields: fields ?? DEFAULT_FIELDS.VIDEO_LIST,
        limit: limit ? Number(limit) : undefined,
      });
      return okResult(result);
    },
  );

  // ── get_video ────────────────────────────────────────────────────────
  server.tool(
    'get_video',
    'Get detailed information about a specific video by its ID. Returns the full video metadata including title, description, duration, source URL, encoding status, and available thumbnails. Use this to check video processing status or retrieve details before creating video ad creatives.',
    {
      video_id: z
        .string()
        .describe(
          'The ID of the video to retrieve.',
        ),
      fields: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of fields to return. Defaults to id,title,description,length,source,created_time,updated_time,status,thumbnails,permalink_url,embeddable,format. See Meta API docs for all available AdVideo fields.',
        ),
    },
    async ({ video_id, fields }) => {
      const result = await client.get(`/${video_id}`, {
        fields: fields ?? DEFAULT_FIELDS.VIDEO_GET,
      });
      return okResult(result);
    },
  );

  // ── get_video_thumbnails ─────────────────────────────────────────────
  server.tool(
    'get_video_thumbnails',
    'Get available thumbnails for a specific video. Returns a list of thumbnail images at various sizes that can be used when creating video ad creatives. Each thumbnail includes its URI, width, height, and whether it is the preferred thumbnail.',
    {
      video_id: z
        .string()
        .describe(
          'The ID of the video to retrieve thumbnails for.',
        ),
    },
    async ({ video_id }) => {
      const result = await client.get(`/${video_id}/thumbnails`);
      return okResult(result);
    },
  );
}
