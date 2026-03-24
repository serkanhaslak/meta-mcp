import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, errResult, parseJsonParam } from '../utils/tool-response.js';

export function registerBatchTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'batch_request',
    'Execute multiple Meta API calls in a single HTTP request using the Batch API. Supports up to 50 sub-requests per call. Each sub-request can be a GET, POST, or DELETE with its own endpoint and parameters. Responses are returned in the same order as requests. Use this to efficiently fetch data from multiple objects (e.g. get insights for 10 campaigns at once) or perform bulk operations (e.g. pause multiple ad sets).',
    {
      requests: z
        .string()
        .describe(
          'JSON string containing an array of sub-request objects. Each object must have: "method" (GET, POST, or DELETE), "relative_url" (API endpoint path with query params, e.g. "123456/insights?fields=impressions,spend&date_preset=last_7d"). Optional: "body" (URL-encoded form data for POST requests, e.g. "status=PAUSED&name=Updated+Name"). Maximum 50 sub-requests. Example: [{"method":"GET","relative_url":"act_123/campaigns?fields=id,name"},{"method":"GET","relative_url":"act_123/adsets?fields=id,name"}]',
        ),
    },
    async ({ requests }) => {
      const parsed = parseJsonParam<Array<{ method: string; relative_url: string; body?: string }>>(requests, 'requests');
      if (!parsed.ok) return parsed.result;

      const parsedRequests = parsed.value;

      if (!Array.isArray(parsedRequests)) {
        return errResult('requests must be a JSON array of sub-request objects, not a single object.');
      }

      if (parsedRequests.length === 0) {
        return errResult('requests array must contain at least one sub-request.');
      }

      if (parsedRequests.length > 50) {
        return errResult(`Batch API supports a maximum of 50 sub-requests per call. You provided ${parsedRequests.length}. Split into multiple batch_request calls.`);
      }

      for (let i = 0; i < parsedRequests.length; i++) {
        const req = parsedRequests[i];
        if (!req.method || !req.relative_url) {
          return errResult(`Sub-request at index ${i} is missing required "method" or "relative_url" property.`);
        }
        if (!['GET', 'POST', 'DELETE'].includes(req.method.toUpperCase())) {
          return errResult(`Sub-request at index ${i} has invalid method "${req.method}". Must be GET, POST, or DELETE.`);
        }
      }

      const result = await client.batch(
        parsedRequests.map((r) => ({
          method: r.method.toUpperCase() as 'GET' | 'POST' | 'DELETE',
          relative_url: r.relative_url,
          body: r.body,
        })),
      );

      return okResult(result);
    },
  );
}
