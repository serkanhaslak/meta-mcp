import 'dotenv/config';
import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { MetaApiClient } from './client.js';
import { registerAllTools } from './tools/index.js';
import { registerRestRoutes } from './rest/proxy.js';

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

const fastify = Fastify({ logger: false });

// ═══════════════════════════════════════════════════════════════════════
//  API KEY AUTH HOOK — applies to /mcp and /api/*
// ═══════════════════════════════════════════════════════════════════════
fastify.addHook('onRequest', async (request, reply) => {
  // Skip auth for health endpoint
  if (request.url === '/health') return;

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
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════
fastify.get('/health', async () => ({
  status: 'ok',
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
fastify.post('/mcp', async (request, reply) => {
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
fastify.get('/mcp', async (request, reply) => {
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
fastify.delete('/mcp', async (request, reply) => {
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
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`meta-mcp server running at ${address}`);
  console.log(`  MCP endpoint:  ${address}/mcp`);
  console.log(`  REST API:      ${address}/api/v1/*`);
  console.log(`  REST proxy:    ${address}/api/v1/meta/{graph_api_path}`);
  console.log(`  Health check:  ${address}/health`);
  console.log(`  API key auth:  ${API_KEY ? 'enabled' : 'disabled'}`);
  console.log(`  MCP account:   ${process.env.META_AD_ACCOUNT_ID ?? 'none'}`);
});
