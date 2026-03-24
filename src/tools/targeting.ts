import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MetaApiClient } from '../client.js';
import { okResult, toOptionalNumber } from '../utils/tool-response.js';

export function registerTargetingTools(server: McpServer, client: MetaApiClient): void {
  server.tool(
    'search_interests',
    'Search for interest-based targeting options. Returns interest IDs, names, audience sizes, and paths that can be used in ad set targeting_spec.interests. Use this to discover targetable interests for building audience segments (e.g. "yoga", "photography", "electric vehicles").',
    {
      q: z
        .string()
        .describe(
          'Search query string to find matching interests. Examples: "yoga", "digital marketing", "Tesla". The API matches against interest names and related terms.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of results to return (default 25, max 1000). Use higher values for broad queries to see all available options.',
        ),
    },
    async ({ q, limit }) => {
      const result = await client.get('/search', {
        type: 'adinterest',
        q,
        limit: toOptionalNumber(limit),
      });
      return okResult(result);
    },
  );

  server.tool(
    'search_behaviors',
    'Search for behavior-based targeting options. Returns behavior IDs, names, audience sizes, and descriptions. Behaviors represent user actions and purchase patterns (e.g. "frequent travelers", "small business owners", "engaged shoppers"). Use these in ad set targeting_spec.behaviors.',
    {
      q: z
        .string()
        .describe(
          'Search query string to find matching behaviors. Examples: "travel", "business owner", "mobile". The API matches against behavior names and descriptions.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of results to return (default 25, max 1000).',
        ),
    },
    async ({ q, limit }) => {
      const result = await client.get('/search', {
        type: 'adTargetingCategory',
        class: 'behaviors',
        q,
        limit: toOptionalNumber(limit),
      });
      return okResult(result);
    },
  );

  server.tool(
    'search_geo_locations',
    'Search for geographic targeting locations including countries, regions, cities, zip codes, DMAs, and electoral districts. Returns location keys, names, country codes, and population data. Use these in ad set targeting_spec.geo_locations to define where ads will be shown.',
    {
      q: z
        .string()
        .describe(
          'Search query string to find matching locations. Examples: "New York", "Turkey", "90210", "London". Matches against location names and codes.',
        ),
      location_types: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of location types to search. Valid types: country, region, city, zip, geo_market, electoral_district. If omitted, all types are searched. Example: "city,region" to only return cities and regions.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of results to return (default 25, max 1000).',
        ),
    },
    async ({ q, location_types, limit }) => {
      const result = await client.get('/search', {
        type: 'adgeolocation',
        q,
        location_types: location_types ?? undefined,
        limit: toOptionalNumber(limit),
      });
      return okResult(result);
    },
  );

  server.tool(
    'search_demographics',
    'Search for demographic targeting options including education level, job titles, relationship status, life events, and more. Returns demographic IDs, names, audience sizes, and paths. Use these in ad set targeting_spec for refined audience demographic filtering.',
    {
      q: z
        .string()
        .describe(
          'Search query string to find matching demographics. Examples: "college", "married", "new job", "engineer". Matches against demographic names and descriptions.',
        ),
      limit: z
        .string()
        .optional()
        .describe(
          'Maximum number of results to return (default 25, max 1000).',
        ),
    },
    async ({ q, limit }) => {
      const result = await client.get('/search', {
        type: 'adTargetingCategory',
        class: 'demographics',
        q,
        limit: toOptionalNumber(limit),
      });
      return okResult(result);
    },
  );
}
