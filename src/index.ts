import 'dotenv/config';
import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { MetaApiClient } from './client.js';
import { registerAllTools } from './tools/index.js';
import { registerRestRoutes } from './rest/proxy.js';
import { HealthResponseSchema } from './rest/schemas.js';
import { renderLandingPage } from './landing.js';
import { swaggerDarkCss } from './swagger-theme.js';

const token = process.env.META_ACCESS_TOKEN;
if (!token) {
  console.error('ERROR: META_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

const API_KEY = process.env.MCP_API_KEY;
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// MCP client (uses server-side token from env)
const mcpClient = new MetaApiClient(token, {
  accountId: process.env.META_AD_ACCOUNT_ID,
  apiVersion: process.env.META_API_VERSION,
});

// Track active MCP sessions with TTL
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const sessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport; lastSeen: number }>();

// Sweep expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sid, s] of sessions) {
    if (now - s.lastSeen > SESSION_TTL_MS) {
      sessions.delete(sid);
      console.log(`Session expired: ${sid}`);
    }
  }
}, 5 * 60 * 1000).unref();

function createMcpSession(): { server: McpServer; transport: StreamableHTTPServerTransport } {
  const server = new McpServer({ name: 'meta-mcp', version: '1.0.0' });
  registerAllTools(server, mcpClient);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: false,
  });
  return { server, transport };
}

async function main() {
  const fastify = Fastify({ logger: false });

  // ═══════════════════════════════════════════════════════════════════════
  //  OPENAPI / SWAGGER
  // ═══════════════════════════════════════════════════════════════════════
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(fastifySwagger, {
    transform: jsonSchemaTransform,
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Meta Ads MCP Server — REST API',
        description:
          'RESTful API for Meta (Facebook) Ads management. Proxy to the Meta Marketing API with convenience endpoints for campaigns, ad sets, ads, creatives, audiences, insights, and more.',
        version: '1.0.0',
      },
      servers: [
        { url: 'https://meta-mcp.pragmaticgrowth.com', description: 'Production' },
        { url: `http://localhost:${PORT}`, description: 'Local development' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            description: 'MCP API Key — required for all /mcp and /api/* endpoints. Set via MCP_API_KEY env var on the server.',
          },
          metaToken: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Meta-Token',
            description: 'Meta/Facebook access token. Required for all /api/* routes.',
          },
        },
      },
      security: [{ bearerAuth: [] }, { metaToken: [] }],
      tags: [
        { name: 'Health', description: 'Server health check' },
        { name: 'Accounts', description: 'Ad account management' },
        { name: 'Campaigns', description: 'Campaign CRUD operations' },
        { name: 'Ad Sets', description: 'Ad set CRUD operations' },
        { name: 'Ads', description: 'Ad CRUD operations' },
        { name: 'Creatives', description: 'Ad creative management' },
        { name: 'Insights', description: 'Performance reporting and analytics' },
        { name: 'Images', description: 'Ad image management' },
        { name: 'Audiences', description: 'Custom audience management' },
        { name: 'Pixels', description: 'Facebook pixel management' },
        { name: 'Conversions', description: 'Conversions API' },
        { name: 'Proxy', description: 'Generic Meta Graph API proxy' },
        { name: 'MCP Protocol', description: 'Model Context Protocol endpoints (for AI clients)' },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    theme: {
      title: 'meta-mcp API',
      css: [{ filename: 'dark-theme.css', content: swaggerDarkCss }],
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  API KEY AUTH HOOK — applies to /mcp and /api/*
  // ═══════════════════════════════════════════════════════════════════════
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for public pages
    if (request.url === '/' || request.url === '/health' || request.url.startsWith('/docs')) return;

    if (!API_KEY) return; // No key configured — allow all

    const authHeader = request.headers.authorization;
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const queryKey = (request.query as Record<string, string>)?.api_key;
    const providedKey = bearer ?? queryKey;

    if (!providedKey || providedKey !== API_KEY) {
      reply.status(401).send({ error: 'Unauthorized — invalid or missing API key' });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  LANDING PAGE
  // ═══════════════════════════════════════════════════════════════════════
  fastify.get('/', { schema: { hide: true } }, async (_request, reply) => {
    reply.type('text/html').send(renderLandingPage(process.uptime()));
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════════
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Returns server status, tool count, available modes, and uptime.',
      response: { 200: HealthResponseSchema },
    },
  }, async () => ({
    status: 'ok' as const,
    name: 'meta-mcp',
    version: '1.0.0',
    tools: 77,
    modes: ['mcp', 'rest'],
    uptime: process.uptime(),
  }));

  // ═══════════════════════════════════════════════════════════════════════
  //  MCP PROTOCOL ENDPOINT — for Claude / MCP clients
  // ═══════════════════════════════════════════════════════════════════════

  // MCP POST — initialize or send requests
  fastify.post('/mcp', {
    schema: {
      tags: ['MCP Protocol'],
      summary: 'MCP JSON-RPC request',
      description: 'Send MCP JSON-RPC requests. Used by MCP clients (Claude, etc.) to invoke tools.',
    },
  }, async (request, reply) => {
    try {
      const sessionId = request.headers['mcp-session-id'] as string | undefined;

      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        session.lastSeen = Date.now();
        reply.hijack();
        await session.transport.handleRequest(request.raw, reply.raw, request.body);
      } else if (!sessionId) {
        const { server, transport } = createMcpSession();
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) { sessions.delete(sid); console.log(`Session closed: ${sid}`); }
        };
        await server.connect(transport);
        reply.hijack();
        await transport.handleRequest(request.raw, reply.raw, request.body);
        if (transport.sessionId) {
          sessions.set(transport.sessionId, { server, transport, lastSeen: Date.now() });
          console.log(`Session created: ${transport.sessionId}`);
        }
      } else {
        reply.status(404).send({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Session not found. Send request without mcp-session-id to create a new session.' },
          id: null,
        });
      }
    } catch (error) {
      console.error('MCP request error:', error);
      if (!reply.sent) {
        reply.status(500).send({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
      }
    }
  });

  // MCP GET — SSE stream for notifications
  fastify.get('/mcp', {
    schema: {
      tags: ['MCP Protocol'],
      summary: 'MCP SSE stream',
      description: 'Server-Sent Events stream for MCP notifications. Requires mcp-session-id header.',
    },
  }, async (request, reply) => {
    const sessionId = request.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      reply.status(404).send({ error: 'Session not found' });
      return;
    }
    const session = sessions.get(sessionId)!;
    session.lastSeen = Date.now();
    reply.hijack();
    await session.transport.handleRequest(request.raw, reply.raw);
  });

  // MCP DELETE — session termination
  fastify.delete('/mcp', {
    schema: {
      tags: ['MCP Protocol'],
      summary: 'Terminate MCP session',
      description: 'Close an active MCP session. Requires mcp-session-id header.',
    },
  }, async (request, reply) => {
    const sessionId = request.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      reply.status(404).send({ error: 'Session not found' });
      return;
    }
    const { transport } = sessions.get(sessionId)!;
    sessions.delete(sessionId);
    reply.hijack();
    await transport.handleRequest(request.raw, reply.raw);
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  REST API — for HTTP clients (n8n, Postman, curl, any app)
  // ═══════════════════════════════════════════════════════════════════════
  registerRestRoutes(fastify);

  // ═══════════════════════════════════════════════════════════════════════
  //  START SERVER
  // ═══════════════════════════════════════════════════════════════════════
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`meta-mcp server running at http://0.0.0.0:${PORT}`);
  console.log(`  MCP endpoint:  http://0.0.0.0:${PORT}/mcp`);
  console.log(`  REST API:      http://0.0.0.0:${PORT}/api/v1/*`);
  console.log(`  REST proxy:    http://0.0.0.0:${PORT}/api/v1/meta/{graph_api_path}`);
  console.log(`  Health check:  http://0.0.0.0:${PORT}/health`);
  console.log(`  API docs:      http://0.0.0.0:${PORT}/docs`);
  console.log(`  API key auth:  ${API_KEY ? 'enabled' : 'disabled'}`);
  console.log(`  MCP account:   ${process.env.META_AD_ACCOUNT_ID ?? 'none'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
