# meta-mcp

Comprehensive Meta Ads MCP Server with 77 tools for full campaign lifecycle management.

## Architecture

- **Runtime**: Node.js 22, TypeScript 5.9 (strict), ES modules
- **HTTP Server**: Fastify 5 — dual interface: MCP protocol (`/mcp`) + REST API (`/api/v1/*`)
- **MCP SDK**: `@modelcontextprotocol/sdk` for Streamable HTTP transport with session management
- **Validation**: Zod for all tool parameter schemas
- **Meta API Client**: `src/client.ts` — wraps Graph API with rate limiting, retries, pagination

## Build & Run

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Run from source with tsx (hot reload)
npm start            # Run compiled dist/index.js
```

## Project Structure

- `src/index.ts` — Server entry point, Fastify setup, Swagger, auth hook, MCP session management
- `src/client.ts` — MetaApiClient class (Graph API wrapper with rate limiting and retries)
- `src/types.ts` — TypeScript interfaces
- `src/landing.ts` — Landing page HTML (served at /)
- `src/swagger-theme.ts` — Dark theme CSS for Swagger UI
- `src/tools/` — 24 tool modules registering 77 MCP tools
- `src/tools/index.ts` — Tool registration hub (imports and calls all registerXxxTools functions)
- `src/rest/proxy.ts` — REST API routes with Zod type provider and Graph API proxy
- `src/rest/schemas.ts` — Zod schemas for all REST endpoints (OpenAPI docs)
- `src/utils/` — Rate limiter, pagination, default field sets, helpers

## Key Conventions

- All tools use Zod schemas for parameter validation
- Tool registration pattern: `registerXxxTools(server: McpServer, client: MetaApiClient)`
- MetaApiClient methods: `get()`, `post()`, `del()`, `postMultipart()`, `batch()`, `getAllPages()`
- Account IDs auto-prefix with `act_` if missing
- Default API fields defined in `src/utils/default-fields.ts`

## Authentication

Both MCP and REST use the same per-caller auth model:

| Header | Purpose |
|--------|---------|
| `Authorization: Bearer <key>` | Server API key (gates access to all /mcp and /api/* endpoints) |
| `X-Meta-Token: <token>` | Per-caller Meta access token (authenticates with Graph API) |
| `X-Meta-Account-Id: <id>` | Per-caller default ad account (optional) |

For MCP, headers are read at session creation (initial POST /mcp). For REST, headers are read per request.
If `X-Meta-Token` is not provided, falls back to `META_ACCESS_TOKEN` env var.

## Environment

- `META_ACCESS_TOKEN` (optional) — Fallback Meta API token; callers can override via `X-Meta-Token` header
- `META_AD_ACCOUNT_ID` (optional) — Fallback default ad account; callers can override via `X-Meta-Account-Id` header
- `META_API_VERSION` (optional) — API version override (default: v28.0)
- `MCP_API_KEY` (recommended) — API key protecting all /mcp and /api/* endpoints
- `PORT` (optional) — Server port (default: 3000)
- `META_MCP_URL` (optional) — Server URL for .mcp.json env var interpolation

## Deployment (Railway)

- **Project**: Pragmatic Growth (production)
- **Service**: meta-mcp
- **Domain**: `meta-mcp.pragmaticgrowth.com` (Cloudflare proxied, port 3000)
- **Region**: us-east4 (Virginia)
- **Builder**: Dockerfile
- **Source**: GitHub `serkanhaslak/meta-mcp` (main branch, auto-deploy)
- **Volume**: `meta-mcp-volume` mounted at `/data`
- **Critical**: `PORT=3000` must be set on Railway to match the domain routing

### Railway Environment Variables (production)

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `3000` | Must match domain port routing |
| `MCP_API_KEY` | (set) | Secures /mcp and /api/* endpoints |
| `META_API_VERSION` | `v28.0` | Graph API version |
| `META_MCP_URL` | `https://meta-mcp.pragmaticgrowth.com/mcp` | For .mcp.json interpolation |
| `META_ACCESS_TOKEN` | (not set) | Per-session via X-Meta-Token header |
| `META_AD_ACCOUNT_ID` | (not set) | Per-session via X-Meta-Account-Id header |

## Tool Categories (77 tools)

Account (4) | Campaigns (5) | Ad Sets (5) | Ads (5) | Creatives (5) | Images (3) | Videos (4) | Audiences (6) | Saved Audiences (3) | Insights (3) | Targeting Search (4) | Targeting Utils (3) | Conversions (1) | Custom Conversions (4) | Pixels (2) | Lead Gen (2) | Rules (5) | Previews (2) | Copies (3) | Batch (1) | Labels (3) | Budget Schedules (2) | Activities (1) | Reach Estimate (1)
