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
            description: 'MCP API Key (optional, if MCP_API_KEY env var is set)',
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
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const uptimeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

    reply.type('text/html').send(/* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>meta-mcp</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0a0a0a;color:#e5e5e5;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2rem 1rem}
  .container{max-width:720px;width:100%}
  h1{font-size:2rem;font-weight:700;margin-bottom:.25rem}
  h1 span{color:#1877f2}
  .tagline{color:#888;font-size:.95rem;margin-bottom:2rem}
  .status-card{background:#141414;border:1px solid #262626;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:1rem}
  .dot{width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e80;flex-shrink:0}
  .status-info{flex:1}
  .status-label{font-size:.8rem;color:#888;text-transform:uppercase;letter-spacing:.05em}
  .status-value{font-size:1.1rem;font-weight:600}
  .stats{display:flex;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap}
  .stat{background:#141414;border:1px solid #262626;border-radius:10px;padding:.85rem 1rem;flex:1;min-width:100px;text-align:center}
  .stat-num{font-size:1.5rem;font-weight:700;color:#1877f2}
  .stat-label{font-size:.75rem;color:#888;margin-top:.15rem}
  h2{font-size:1.15rem;font-weight:600;margin:1.75rem 0 .75rem;color:#ccc}
  .card{background:#141414;border:1px solid #262626;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1rem}
  .card h3{font-size:.95rem;font-weight:600;margin-bottom:.5rem}
  .card p{font-size:.85rem;color:#999;line-height:1.5;margin-bottom:.75rem}
  pre{background:#0d0d0d;border:1px solid #262626;border-radius:8px;padding:1rem;font-size:.8rem;overflow-x:auto;line-height:1.6;color:#d4d4d4;margin-bottom:.5rem}
  code{font-family:"SF Mono",Menlo,Consolas,monospace}
  .link-row{display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:1.5rem}
  .link-row a{display:inline-flex;align-items:center;gap:.4rem;background:#1877f2;color:#fff;text-decoration:none;font-size:.85rem;font-weight:500;padding:.55rem 1rem;border-radius:8px;transition:background .15s}
  .link-row a:hover{background:#1565c0}
  .link-row a.secondary{background:transparent;border:1px solid #333;color:#ccc}
  .link-row a.secondary:hover{border-color:#1877f2;color:#fff}
  .footer{margin-top:2rem;text-align:center;font-size:.75rem;color:#555}
  .footer a{color:#1877f2;text-decoration:none}
</style>
</head>
<body>
<div class="container">
  <h1><span>meta</span>-mcp</h1>
  <p class="tagline">Meta Ads MCP Server &mdash; 77 tools for full campaign lifecycle management</p>

  <div class="status-card">
    <div class="dot"></div>
    <div class="status-info">
      <div class="status-label">Server Status</div>
      <div class="status-value">Operational &middot; uptime ${uptimeStr}</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-num">77</div><div class="stat-label">MCP Tools</div></div>
    <div class="stat"><div class="stat-num">24</div><div class="stat-label">Modules</div></div>
    <div class="stat"><div class="stat-num">2</div><div class="stat-label">Modes</div></div>
  </div>

  <div class="link-row">
    <a href="/docs">API Documentation</a>
    <a href="/health" class="secondary">Health JSON</a>
  </div>

  <h2>Quick Start</h2>

  <div class="card">
    <h3>1. Connect with Claude Code</h3>
    <p>Add to <code>.mcp.json</code> in your project root or <code>~/.claude/.mcp.json</code> for global access:</p>
    <pre><code>{
  "mcpServers": {
    "meta-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://meta-mcp.pragmaticgrowth.com/mcp"
      ]
    }
  }
}</code></pre>
  </div>

  <div class="card">
    <h3>2. REST API</h3>
    <p>Use the REST endpoints directly with any HTTP client. Requires <code>X-Meta-Token</code> header.</p>
    <pre><code>curl -H "X-Meta-Token: YOUR_TOKEN" \\
     https://meta-mcp.pragmaticgrowth.com/api/v1/campaigns</code></pre>
  </div>

  <div class="card">
    <h3>3. Graph API Proxy</h3>
    <p>Access any Meta Graph API endpoint through the proxy:</p>
    <pre><code>curl -H "X-Meta-Token: YOUR_TOKEN" \\
     https://meta-mcp.pragmaticgrowth.com/api/v1/meta/me/adaccounts?fields=id,name</code></pre>
  </div>

  <h2>Available Endpoints</h2>
  <div class="card">
    <pre><code>MCP Protocol   POST /mcp            Claude &amp; MCP clients
REST API       /api/v1/campaigns    campaigns CRUD
               /api/v1/adsets       ad sets CRUD
               /api/v1/ads          ads CRUD
               /api/v1/creatives    creative management
               /api/v1/audiences    audience management
               /api/v1/insights/:id performance metrics
               /api/v1/images       image library
               /api/v1/pixels       pixel management
               /api/v1/conversions  conversions API
Graph Proxy    /api/v1/meta/*       any Graph API path
Docs           /docs                Swagger UI</code></pre>
  </div>

  <div class="footer">meta-mcp v1.0.0 &middot; Powered by Fastify &middot; <a href="/docs">Full API Docs</a></div>
</div>
</body>
</html>`);
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
