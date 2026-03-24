# meta-mcp

**Comprehensive Meta Ads MCP Server — 77 tools for full campaign lifecycle management**

A production-ready [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives AI assistants like Claude complete control over Meta (Facebook & Instagram) advertising operations. Manage campaigns, ad sets, ads, creatives, audiences, conversions, pixels, and more — all through natural language.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Complete Tool Reference (77 Tools)](#complete-tool-reference-77-tools)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Claude Code Setup](#claude-code-setup)
- [Usage Examples](#usage-examples)
- [REST API](#rest-api)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Configuration Reference](#configuration-reference)
- [Rate Limiting](#rate-limiting)
- [License](#license)

---

## Overview

**meta-mcp** bridges the gap between AI assistants and the Meta Marketing API. It exposes 77 tools across 24 modules, covering the entire ad campaign lifecycle — from account discovery and campaign creation to performance analytics and automated optimization rules.

### Dual Interface

The server provides two access modes:

| Interface | Endpoint | Use Case |
|-----------|----------|----------|
| **MCP Protocol** | `/mcp` | Claude Code, Claude Desktop, any MCP client |
| **REST API** | `/api/v1/*` | n8n, Postman, curl, custom apps, webhooks |

Both interfaces share the same underlying Meta API client with built-in rate limiting, retry logic, and error handling.

---

## Features

### Campaign Management
- Full CRUD for campaigns, ad sets, ads, and creatives
- Copy campaigns, ad sets, and ads with all their settings
- Budget scheduling and automated rules
- Ad preview generation

### Audience & Targeting
- Custom audience creation (website, app, customer list, engagement, offline)
- Lookalike audience generation
- Saved audience management
- Interest, behavior, demographic, and geo-location search
- Targeting validation and reach estimation

### Analytics & Tracking
- Performance insights at account, campaign, ad set, and ad levels
- Async report generation for large datasets
- Meta Pixel management
- Server-side conversion tracking (Conversions API)
- Custom conversion rules
- Activity audit logs

### Media & Creative
- Image upload and management
- Video upload with thumbnail extraction
- Ad creative creation with Object Story Spec
- Ad preview rendering

### Automation & Operations
- Automated rules (pause low performers, adjust budgets, send notifications)
- Batch API (up to 50 sub-requests per call)
- Label management for organization
- Lead generation form access

### Enterprise-Ready
- BUC (Business Use Case) rate limiting with adaptive throttling
- Automatic retry with exponential backoff
- Session management with 30-minute TTL
- Optional API key authentication
- Docker containerization

---

## Complete Tool Reference (77 Tools)

### Account Management (4 tools)

| Tool | Description |
|------|-------------|
| `get_ad_accounts` | List all accessible ad accounts for the authenticated user |
| `get_account_info` | Get detailed information about a specific ad account |
| `get_account_pages` | List Facebook Pages associated with an ad account |
| `get_delivery_estimate` | Estimate delivery reach for a given targeting specification |

### Campaigns (5 tools)

| Tool | Description |
|------|-------------|
| `list_campaigns` | List campaigns with filtering by status, objective, date range |
| `get_campaign` | Get full details of a single campaign |
| `create_campaign` | Create a new campaign with objective, budget, and settings |
| `update_campaign` | Modify campaign properties (name, status, budget, bid strategy) |
| `delete_campaign` | Permanently delete a campaign |

### Ad Sets (5 tools)

| Tool | Description |
|------|-------------|
| `list_adsets` | List ad sets with filtering by campaign, status, date range |
| `get_adset` | Get full details of a single ad set including targeting |
| `create_adset` | Create a new ad set with targeting, budget, schedule, and placement |
| `update_adset` | Modify ad set properties (targeting, budget, bid, schedule) |
| `delete_adset` | Permanently delete an ad set |

### Ads (5 tools)

| Tool | Description |
|------|-------------|
| `list_ads` | List ads with filtering by ad set, campaign, status |
| `get_ad` | Get full details of a single ad including creative reference |
| `create_ad` | Create a new ad linking to an existing creative and ad set |
| `update_ad` | Modify ad properties (name, status, creative, tracking) |
| `delete_ad` | Permanently delete an ad |

### Creatives (5 tools)

| Tool | Description |
|------|-------------|
| `list_creatives` | List ad creatives with filtering options |
| `get_creative` | Get full details of a single creative including asset URLs |
| `create_creative` | Create a new ad creative with Object Story Spec |
| `update_creative` | Modify creative properties |
| `delete_creative` | Permanently delete a creative |

### Images (3 tools)

| Tool | Description |
|------|-------------|
| `upload_image` | Upload an image file to the ad account's image library |
| `list_images` | List all images in the ad account's library |
| `delete_image` | Delete an image from the library by hash |

### Videos (4 tools)

| Tool | Description |
|------|-------------|
| `upload_video` | Upload a video file to the ad account |
| `list_videos` | List all videos in the ad account |
| `get_video` | Get details of a specific video |
| `get_video_thumbnails` | Retrieve auto-generated thumbnails for a video |

### Custom Audiences (6 tools)

| Tool | Description |
|------|-------------|
| `list_custom_audiences` | List custom audiences in the ad account |
| `create_custom_audience` | Create a custom audience (website, app, customer list, engagement, offline) |
| `add_audience_users` | Upload hashed PII (email, phone, etc.) to a custom audience |
| `remove_audience_users` | Remove users from a custom audience by hashed PII |
| `create_lookalike_audience` | Create a lookalike audience from a source audience |
| `delete_audience` | Permanently delete a custom audience |

### Saved Audiences (3 tools)

| Tool | Description |
|------|-------------|
| `list_saved_audiences` | List saved audience segments |
| `create_saved_audience` | Create a reusable saved audience with targeting spec |
| `delete_saved_audience` | Delete a saved audience |

### Insights & Analytics (3 tools)

| Tool | Description |
|------|-------------|
| `get_insights` | Get performance metrics for campaigns, ad sets, or ads with breakdowns |
| `get_account_insights` | Get account-level aggregated performance metrics |
| `create_async_report` | Create an async report job for large data exports |

### Targeting Search (4 tools)

| Tool | Description |
|------|-------------|
| `search_interests` | Search for interest-based targeting options by keyword |
| `search_behaviors` | Search for behavior-based targeting options |
| `search_geo_locations` | Search for geographic targeting (countries, cities, regions, zips) |
| `search_demographics` | Search for demographic targeting options |

### Targeting Utilities (3 tools)

| Tool | Description |
|------|-------------|
| `get_targeting_suggestions` | Get AI-suggested targeting options based on your input |
| `validate_targeting` | Validate a targeting spec before using it |
| `get_targeting_sentence` | Convert a targeting spec to human-readable description |

### Conversions API (1 tool)

| Tool | Description |
|------|-------------|
| `send_conversion_event` | Send server-side conversion events via the Conversions API |

### Custom Conversions (4 tools)

| Tool | Description |
|------|-------------|
| `list_custom_conversions` | List URL-based custom conversion rules |
| `create_custom_conversion` | Create a custom conversion rule (URL contains, equals, regex) |
| `get_custom_conversion` | Get details of a specific custom conversion |
| `delete_custom_conversion` | Delete a custom conversion rule |

### Meta Pixels (2 tools)

| Tool | Description |
|------|-------------|
| `list_pixels` | List Meta Pixels in the ad account |
| `get_pixel` | Get details and stats for a specific pixel |

### Lead Generation (2 tools)

| Tool | Description |
|------|-------------|
| `get_lead_forms` | List lead generation forms for a Facebook Page |
| `get_leads` | Retrieve submitted leads from a lead gen form |

### Automated Rules (5 tools)

| Tool | Description |
|------|-------------|
| `list_ad_rules` | List automated rules in the ad account |
| `create_ad_rule` | Create an automation rule (pause ads, adjust budget, send notifications) |
| `get_ad_rule` | Get details of a specific rule |
| `update_ad_rule` | Modify an existing rule's conditions, actions, or schedule |
| `delete_ad_rule` | Delete an automated rule |

### Ad Previews (2 tools)

| Tool | Description |
|------|-------------|
| `get_ad_previews` | Get preview renders for an existing ad |
| `generate_ad_preview` | Generate a preview from a creative spec (without creating an ad) |

### Copy Operations (3 tools)

| Tool | Description |
|------|-------------|
| `copy_campaign` | Duplicate a campaign with all its settings |
| `copy_adset` | Duplicate an ad set with targeting and budget |
| `copy_ad` | Duplicate an ad with its creative reference |

### Batch Operations (1 tool)

| Tool | Description |
|------|-------------|
| `batch_request` | Execute up to 50 Graph API sub-requests in a single call |

### Labels (3 tools)

| Tool | Description |
|------|-------------|
| `list_ad_labels` | List labels used for organizing campaigns/ads |
| `create_ad_label` | Create a new organizational label |
| `delete_ad_label` | Delete a label |

### Budget Schedules (2 tools)

| Tool | Description |
|------|-------------|
| `get_budget_schedules` | List budget schedules for a campaign |
| `create_budget_schedule` | Create a time-based budget schedule |

### Activities (1 tool)

| Tool | Description |
|------|-------------|
| `get_account_activities` | Get the audit log of actions taken on the ad account |

### Reach Estimation (1 tool)

| Tool | Description |
|------|-------------|
| `get_reach_estimate` | Estimate potential reach and frequency for a targeting spec |

---

## Prerequisites

1. **Node.js 22+** — [Download](https://nodejs.org/)
2. **Meta Developer Account** — [developers.facebook.com](https://developers.facebook.com/)
3. **Meta Access Token** — System User token or long-lived User token with `ads_management` and `ads_read` permissions
4. **Ad Account ID** — Your Meta ad account ID (format: `act_123456789`)

### Getting a Meta Access Token

1. Go to [Meta Business Suite](https://business.facebook.com/settings/system-users) > System Users
2. Create a System User (or use existing)
3. Assign the System User to your ad account with **Admin** role
4. Generate a token with these permissions:
   - `ads_management` — Create and manage ads
   - `ads_read` — Read ad account data
   - `pages_read_engagement` — Access Page data (for creatives)
   - `leads_retrieval` — Access lead gen form data (optional)

---

## Installation

### Local Development

```bash
# Clone the repository
git clone https://github.com/serkanhaslak/meta-mcp.git
cd meta-mcp

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Meta credentials

# Run in development mode (with hot reload)
npm run dev

# Or build and run production
npm run build
npm start
```

### Docker

```bash
# Build the image
docker build -t meta-mcp .

# Run the container
docker run -p 3000:3000 \
  -e META_ACCESS_TOKEN=your_token \
  -e META_AD_ACCOUNT_ID=act_123456789 \
  meta-mcp
```

The server starts at `https://meta-mcp.pragmaticgrowth.com` (or `http://localhost:3000` locally) with:
- MCP endpoint: `https://meta-mcp.pragmaticgrowth.com/mcp`
- REST API: `https://meta-mcp.pragmaticgrowth.com/api/v1/*`
- Health check: `https://meta-mcp.pragmaticgrowth.com/health`
- API docs: `https://meta-mcp.pragmaticgrowth.com/docs`

---

## Claude Code Setup

### Option 1: Remote Server (Recommended)

Connect Claude Code directly to the remote endpoint.

1. Add your server URL and API key to `.env` (gitignored, never committed):

```bash
META_MCP_URL=https://your-deployment-url.up.railway.app/mcp
MCP_API_KEY=your_api_key_here
```

2. Create or edit `.mcp.json` in your project root (or `~/.claude/.mcp.json` for global access):

```json
{
  "mcpServers": {
    "meta-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${META_MCP_URL}",
        "--header",
        "Authorization: Bearer ${MCP_API_KEY}"
      ]
    }
  }
}
```

The `${META_MCP_URL}` and `${MCP_API_KEY}` are resolved from your `.env` file — no secrets in `.mcp.json`.

### Option 2: Local Server (stdio)

Run the MCP server locally as a subprocess:

```json
{
  "mcpServers": {
    "meta-mcp": {
      "command": "node",
      "args": ["/path/to/meta-mcp/dist/index.js"],
      "env": {
        "META_ACCESS_TOKEN": "your_meta_access_token",
        "META_AD_ACCOUNT_ID": "act_123456789"
      }
    }
  }
}
```

> **Note:** For the local stdio option, build first with `npm run build`.

### Option 3: Development Mode (stdio with tsx)

For active development with TypeScript source:

```json
{
  "mcpServers": {
    "meta-mcp": {
      "command": "npx",
      "args": ["tsx", "/path/to/meta-mcp/src/index.ts"],
      "env": {
        "META_ACCESS_TOKEN": "your_meta_access_token",
        "META_AD_ACCOUNT_ID": "act_123456789"
      }
    }
  }
}
```

### Claude Code Permissions

To auto-allow all meta-mcp tools, add to your `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__meta-mcp__*"
    ]
  }
}
```

Or allow specific tool categories:

```json
{
  "permissions": {
    "allow": [
      "mcp__meta-mcp__list_*",
      "mcp__meta-mcp__get_*",
      "mcp__meta-mcp__search_*"
    ],
    "deny": [
      "mcp__meta-mcp__delete_*"
    ]
  }
}
```

### Claude Desktop Setup

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "meta-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-deployment-url.up.railway.app/mcp",
        "--header",
        "Authorization: Bearer YOUR_MCP_API_KEY"
      ]
    }
  }
}
```

> **Note:** Claude Desktop doesn't support `${ENV_VAR}` syntax, so you must paste the actual values.

### Verifying the Connection

After configuring, start Claude Code and ask:

```
What Meta Ads tools do you have access to?
```

Claude should list all 77 tools organized by category.

---

## Usage Examples

### Create a Complete Campaign

```
Create a new Meta Ads campaign:
- Objective: OUTCOME_LEADS
- Name: "Spring Sale 2025"
- Daily budget: $50
- Target: US, ages 25-45, interested in "Online Shopping"
- Use my Page for the creative with headline "50% Off Everything"
- Start running immediately
```

Claude will use `create_campaign`, `create_adset`, `create_creative`, and `create_ad` in sequence.

### Analyze Performance

```
Show me the performance of all active campaigns for the last 7 days.
Break down by age and gender. Include spend, impressions, clicks, CPC, and ROAS.
```

Claude will use `get_insights` with the appropriate date range and breakdowns.

### Audience Management

```
Create a lookalike audience based on my "High Value Customers" custom audience.
Target the US with 1% similarity. Then create an ad set using this audience.
```

Claude will use `create_lookalike_audience` followed by `create_adset`.

### Automated Optimization

```
Create a rule that pauses any ad with CPC above $5 and more than 1000 impressions.
Check every 30 minutes. Send me a notification when it triggers.
```

Claude will use `create_ad_rule` with the appropriate conditions and actions.

### Batch Operations

```
Get the status and spend of all 25 campaigns in my account using a single batch request.
```

Claude will use `batch_request` to execute multiple API calls efficiently.

### Copy and Iterate

```
Copy my best performing campaign "Summer Promo" and create a variant
with a different headline for A/B testing.
```

Claude will use `copy_campaign` and then modify the creative.

---

## REST API

The server also exposes a REST API for non-MCP clients (n8n, Postman, curl, custom apps).

### Authentication

All REST requests require the `X-Meta-Token` header with your Meta access token:

```bash
curl -H "X-Meta-Token: YOUR_META_TOKEN" \
     -H "X-Meta-Account-Id: act_123456789" \
     https://meta-mcp.pragmaticgrowth.com/api/v1/campaigns
```

If `MCP_API_KEY` is set on the server, you also need:
```bash
-H "Authorization: Bearer YOUR_MCP_API_KEY"
```

### Convenience Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/accounts` | List ad accounts |
| GET | `/api/v1/campaigns` | List campaigns |
| POST | `/api/v1/campaigns` | Create campaign |
| GET | `/api/v1/campaigns/:id` | Get campaign |
| PUT | `/api/v1/campaigns/:id` | Update campaign |
| DELETE | `/api/v1/campaigns/:id` | Delete campaign |
| GET | `/api/v1/adsets` | List ad sets |
| POST | `/api/v1/adsets` | Create ad set |
| GET | `/api/v1/ads` | List ads |
| POST | `/api/v1/ads` | Create ad |
| GET | `/api/v1/creatives` | List creatives |
| GET | `/api/v1/insights` | Get insights |
| ... | ... | Full CRUD for all resources |

### Generic Graph API Proxy

Access any Meta Graph API endpoint directly:

```bash
# Get user's ad accounts
curl -H "X-Meta-Token: TOKEN" \
     https://meta-mcp.pragmaticgrowth.com/api/v1/meta/me/adaccounts?fields=id,name&limit=5

# Get campaign insights
curl -H "X-Meta-Token: TOKEN" \
     "https://meta-mcp.pragmaticgrowth.com/api/v1/meta/act_123/insights?fields=spend,impressions&date_preset=last_7d"
```

### Health Check

```bash
curl https://meta-mcp.pragmaticgrowth.com/health
```

Returns:
```json
{
  "status": "ok",
  "name": "meta-mcp",
  "version": "1.0.0",
  "tools": 77,
  "modes": ["mcp", "rest"],
  "uptime": 3600.5
}
```

---

## Architecture

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 22 |
| Language | TypeScript 5.9 (strict mode) |
| HTTP Server | Fastify 5 |
| MCP Protocol | @modelcontextprotocol/sdk 1.27 |
| Validation | Zod 3.25 |
| Meta API | Graph API v21.0 |

### Project Structure

```
meta-mcp/
├── src/
│   ├── index.ts              # Server entry — Fastify setup, MCP endpoint, session management
│   ├── client.ts             # MetaApiClient — Graph API wrapper with retries and rate limiting
│   ├── types.ts              # TypeScript interfaces for API responses
│   ├── tools/                # 24 tool modules (77 total tools)
│   │   ├── index.ts          # Tool registration hub
│   │   ├── account.ts        # Account management tools
│   │   ├── campaigns.ts      # Campaign CRUD
│   │   ├── adsets.ts         # Ad set management
│   │   ├── ads.ts            # Ad management
│   │   ├── creatives.ts      # Creative assets
│   │   ├── images.ts         # Image upload/management
│   │   ├── videos.ts         # Video upload/management
│   │   ├── audiences.ts      # Custom & lookalike audiences
│   │   ├── saved-audiences.ts# Saved audience segments
│   │   ├── insights.ts       # Performance analytics
│   │   ├── targeting.ts      # Interest/behavior/geo/demo search
│   │   ├── targeting-utils.ts# Targeting validation & suggestions
│   │   ├── conversions.ts    # Conversions API (server-side tracking)
│   │   ├── custom-conversions.ts # URL-based conversion rules
│   │   ├── pixel.ts          # Meta Pixel management
│   │   ├── leadgen.ts        # Lead generation forms
│   │   ├── rules.ts          # Automated rules
│   │   ├── previews.ts       # Ad preview rendering
│   │   ├── copies.ts         # Campaign/adset/ad duplication
│   │   ├── batch.ts          # Batch API operations
│   │   ├── labels.ts         # Label management
│   │   ├── budget-schedules.ts # Budget scheduling
│   │   ├── activities.ts     # Audit activity logs
│   │   └── reach-estimate.ts # Reach/frequency estimation
│   ├── rest/
│   │   └── proxy.ts          # REST API routes and Graph API proxy
│   └── utils/
│       ├── default-fields.ts # Pre-configured API field selections
│       ├── rate-limiter.ts   # BUC-based adaptive rate limiting
│       ├── pagination.ts     # Cursor-based pagination helper
│       ├── sleep.ts          # Async delay utility
│       └── tool-response.ts  # Response formatting helpers
├── .env.example              # Environment variable template
├── .mcp.json.example         # MCP client configuration template
├── Dockerfile                # Docker containerization
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

### How It Works

```
┌─────────────┐     MCP Protocol      ┌──────────────┐     Graph API     ┌──────────────┐
│ Claude Code  │◄────── /mcp ────────►│   meta-mcp   │◄───────────────►│  Meta API    │
│ Claude Desktop│   (Streamable HTTP)  │   (Fastify)  │   (Rate-limited) │ graph.fb.com │
└─────────────┘                        └──────────────┘                  └──────────────┘
                                             ▲
┌─────────────┐     REST API           │
│ n8n / curl  │◄── /api/v1/* ─────────┘
│ Postman     │   (JSON over HTTP)
└─────────────┘
```

1. **Claude** sends a tool call (e.g., `list_campaigns`) via the MCP protocol
2. **meta-mcp** validates parameters with Zod, constructs the Graph API request
3. **MetaApiClient** applies rate limiting, sends the request, handles retries
4. Response is formatted and returned to Claude via MCP

---

## Deployment

### Railway (One-Click)

1. Fork this repository
2. Connect your GitHub repo to [Railway](https://railway.app)
3. Add environment variables:
   - `META_ACCESS_TOKEN` — Your Meta API token
   - `META_AD_ACCOUNT_ID` — Default ad account (optional)
   - `MCP_API_KEY` — Protect the endpoint with an API key (recommended)
4. Deploy — Railway will auto-detect the Dockerfile

### Docker Compose

```yaml
version: "3.8"
services:
  meta-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - META_ACCESS_TOKEN=${META_ACCESS_TOKEN}
      - META_AD_ACCOUNT_ID=${META_AD_ACCOUNT_ID}
      - MCP_API_KEY=${MCP_API_KEY}
      - PORT=3000
    restart: unless-stopped
```

### Environment Variables

```bash
# Start with env vars directly
META_ACCESS_TOKEN=your_token \
META_AD_ACCOUNT_ID=act_123456789 \
MCP_API_KEY=your_secret_key \
PORT=3000 \
node dist/index.js
```

---

## Configuration Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `META_ACCESS_TOKEN` | Yes | — | Meta API System User or long-lived user token |
| `META_AD_ACCOUNT_ID` | No | — | Default ad account ID (e.g., `act_123456789`). If not set, must be passed per tool call |
| `META_API_VERSION` | No | `v28.0` | Meta Graph API version override |
| `MCP_API_KEY` | No | — | API key for authenticating HTTP requests. If not set, auth is disabled |
| `PORT` | No | `3000` | Server listening port |

---

## Rate Limiting

meta-mcp implements intelligent rate limiting based on Meta's **Business Use Case (BUC)** system:

- **Parses BUC headers** from every Meta API response (`x-business-use-case-usage`)
- **Monitors three metrics**: call count, CPU time, total time
- **Adaptive throttling**: Automatically slows down when any metric exceeds 75% of the limit
- **Minimum delay**: 200ms between requests to avoid burst patterns
- **Automatic retry**: Failed requests retry with exponential backoff (1s, 2s, 4s) up to 3 times
- **Transient error handling**: Automatically retries on 429 (rate limit), 500, 502, 503 errors

This means you can issue many tool calls without worrying about hitting Meta's rate limits — the server handles throttling transparently.

---

## License

ISC
