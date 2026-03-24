const BASE_URL = 'https://meta-mcp.pragmaticgrowth.com';

// Pragmatic Growth logo SVG (white fill for dark backgrounds)
const PG_LOGO_WHITE = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="24" fill="none"><path fill="#ffffff" fill-rule="evenodd" d="M0 12C0 5.373 5.285 0 11.805 0h20.39C38.715 0 44 5.373 44 12s-5.285 12-11.805 12h-20.39C5.285 24 0 18.627 0 12zm20.39 0a8.83 8.83 0 0 0-1.447-4.849 8.618 8.618 0 0 0-3.853-3.214 8.456 8.456 0 0 0-4.96-.497 8.543 8.543 0 0 0-4.396 2.39 8.773 8.773 0 0 0-2.35 4.468 8.861 8.861 0 0 0 .489 5.043 8.698 8.698 0 0 0 3.162 3.916 8.487 8.487 0 0 0 4.77 1.471V12h8.585zm18.944 4.849A8.83 8.83 0 0 0 40.78 12h-8.586V3.273a8.487 8.487 0 0 0-4.77 1.47 8.698 8.698 0 0 0-3.162 3.917 8.862 8.862 0 0 0-.488 5.043 8.774 8.774 0 0 0 2.35 4.468 8.544 8.544 0 0 0 4.395 2.389 8.457 8.457 0 0 0 4.96-.497 8.618 8.618 0 0 0 3.854-3.214z" clip-rule="evenodd"/></svg>`;

// Favicon SVG (served at /favicon.svg route)
export const FAVICON_SVG_CONTENT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 24" width="44" height="24" fill="none"><path fill="#020617" fill-rule="evenodd" d="M0 12C0 5.373 5.285 0 11.805 0h20.39C38.715 0 44 5.373 44 12s-5.285 12-11.805 12h-20.39C5.285 24 0 18.627 0 12zm20.39 0a8.83 8.83 0 0 0-1.447-4.849 8.618 8.618 0 0 0-3.853-3.214 8.456 8.456 0 0 0-4.96-.497 8.543 8.543 0 0 0-4.396 2.39 8.773 8.773 0 0 0-2.35 4.468 8.861 8.861 0 0 0 .489 5.043 8.698 8.698 0 0 0 3.162 3.916 8.487 8.487 0 0 0 4.77 1.471V12h8.585zm18.944 4.849A8.83 8.83 0 0 0 40.78 12h-8.586V3.273a8.487 8.487 0 0 0-4.77 1.47 8.698 8.698 0 0 0-3.162 3.917 8.862 8.862 0 0 0-.488 5.043 8.774 8.774 0 0 0 2.35 4.468 8.544 8.544 0 0 0 4.395 2.389 8.457 8.457 0 0 0 4.96-.497 8.618 8.618 0 0 0 3.854-3.214z" clip-rule="evenodd"/></svg>';

export function renderLandingPage(uptimeSec: number): string {
  const d = Math.floor(uptimeSec / 86400);
  const h = Math.floor((uptimeSec % 86400) / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  const uptimeStr = parts.join(' ');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Meta Ads MCP &mdash; by Pragmatic Growth</title>
<meta name="description" content="77 MCP tools for full Meta (Facebook & Instagram) Ads campaign lifecycle management"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<style>
:root {
  --bg: #09090b;
  --surface: #131316;
  --surface-hover: #1a1a1f;
  --border: #27272a;
  --border-light: #3f3f46;
  --text: #fafafa;
  --text-muted: #a1a1aa;
  --text-dim: #71717a;
  --blue: #3b82f6;
  --blue-hover: #2563eb;
  --blue-glow: #3b82f620;
  --green: #22c55e;
  --green-glow: #22c55e30;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ── Gradient backdrop ── */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}
.backdrop::before {
  content: '';
  position: absolute;
  top: -40%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 600px;
  background: radial-gradient(ellipse, var(--blue-glow) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Layout ── */
.page { display: flex; flex-direction: column; align-items: center; padding: 3rem 1.25rem 2rem; }
.container { max-width: 760px; width: 100%; }

/* ── Header ── */
.header { text-align: center; margin-bottom: 2.5rem; }
.header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.header-logo svg { width: 52px; height: 28px; flex-shrink: 0; }
.header-title {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text);
}
.header-title span { color: var(--blue); }
.tagline { color: var(--text-muted); font-size: 1rem; line-height: 1.5; max-width: 480px; margin: 0 auto; }

/* ── Status ── */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 0.5rem 1.25rem;
  margin: 0 auto 2rem;
  width: fit-content;
  font-size: 0.85rem;
}
.pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 0 var(--green-glow);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--green-glow); }
  50% { box-shadow: 0 0 0 6px transparent; }
}
.status-text { color: var(--text-muted); }
.status-text strong { color: var(--green); font-weight: 600; }

/* ── Stats grid ── */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem 1rem;
  text-align: center;
  transition: border-color 0.2s, background 0.2s;
}
.stat-card:hover { border-color: var(--border-light); background: var(--surface-hover); }
.stat-num { font-size: 2rem; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
.stat-label { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 0.2rem; }

/* ── CTA buttons ── */
.cta-row {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  padding: 0.65rem 1.5rem;
  border-radius: 10px;
  transition: all 0.15s ease;
}
.btn-primary {
  background: var(--blue);
  color: #fff;
  border: 1px solid var(--blue);
  box-shadow: 0 1px 2px #0003, 0 0 20px var(--blue-glow);
}
.btn-primary:hover { background: var(--blue-hover); border-color: var(--blue-hover); transform: translateY(-1px); }
.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.btn-ghost:hover { color: var(--text); border-color: var(--border-light); background: var(--surface); }
.btn svg { width: 16px; height: 16px; }

/* ── Section titles ── */
.section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  margin-bottom: 1rem;
  padding-left: 0.125rem;
}

/* ── Cards ── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.5rem;
  margin-bottom: 0.75rem;
  transition: border-color 0.2s;
}
.card:hover { border-color: var(--border-light); }
.card-header { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.75rem; }
.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.card-icon.blue { background: #3b82f618; color: var(--blue); }
.card-icon.purple { background: #a855f718; color: #a855f7; }
.card-icon.amber { background: #f59e0b18; color: #f59e0b; }
.card-title { font-size: 0.95rem; font-weight: 650; }
.card p { font-size: 0.84rem; color: var(--text-muted); line-height: 1.55; margin-bottom: 0.85rem; }
.card p:last-child { margin-bottom: 0; }

/* ── Code blocks ── */
pre {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1rem 1.15rem;
  font-family: var(--mono);
  font-size: 0.78rem;
  line-height: 1.65;
  overflow-x: auto;
  color: #d4d4d8;
  -webkit-overflow-scrolling: touch;
}
pre .kw { color: #c084fc; }
pre .str { color: #86efac; }
pre .comment { color: #52525b; }

/* ── Endpoint table ── */
.endpoints {
  display: grid;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  margin-bottom: 0.75rem;
}
.ep-row {
  display: grid;
  grid-template-columns: 72px 1fr auto;
  align-items: center;
  padding: 0.6rem 1.15rem;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.1s;
}
.ep-row:last-child { border-bottom: none; }
.ep-row:hover { background: var(--surface-hover); }
.ep-method {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  text-align: center;
  width: fit-content;
}
.ep-method.get { background: #22c55e18; color: #4ade80; }
.ep-method.post { background: #3b82f618; color: #60a5fa; }
.ep-method.put { background: #f59e0b18; color: #fbbf24; }
.ep-method.del { background: #ef444418; color: #f87171; }
.ep-method.any { background: #a855f718; color: #c084fc; }
.ep-path { font-family: var(--mono); color: var(--text); font-size: 0.8rem; }
.ep-desc { color: var(--text-dim); font-size: 0.75rem; text-align: right; }

/* ── Footer ── */
.footer {
  text-align: center;
  padding: 2.5rem 0 1rem;
  font-size: 0.75rem;
  color: var(--text-dim);
}
.footer a { color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
.footer a:hover { color: var(--text); text-decoration: underline; }
.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.footer-brand svg { width: 28px; height: 15px; opacity: 0.5; transition: opacity 0.15s; }
.footer-brand:hover svg { opacity: 0.8; }
.footer-links { margin-top: 0.35rem; }
.footer-links a { color: var(--blue); }

/* ── Mobile ── */
@media (max-width: 560px) {
  .page { padding: 2rem 1rem; }
  .header-title { font-size: 1.8rem; }
  .header-logo svg { width: 40px; height: 22px; }
  .stats { grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .stat-card { padding: 1rem 0.5rem; }
  .stat-num { font-size: 1.5rem; }
  .ep-row { grid-template-columns: 60px 1fr; }
  .ep-desc { display: none; }
  .cta-row { flex-direction: column; align-items: stretch; }
}
</style>
</head>
<body>
<div class="backdrop"></div>
<div class="page">
<div class="container">

  <div class="header">
    <div class="header-logo">
      ${PG_LOGO_WHITE}
      <div class="header-title"><span>Meta Ads</span> MCP</div>
    </div>
    <p class="tagline">77 MCP tools for complete Meta Ads campaign lifecycle management.<br/>Built for Claude Code, REST clients, and the Meta Graph API.</p>
  </div>

  <div class="status-bar">
    <div class="pulse"></div>
    <span class="status-text"><strong>Operational</strong> &nbsp;&middot;&nbsp; uptime ${uptimeStr}</span>
  </div>

  <div class="stats">
    <div class="stat-card"><div class="stat-num">77</div><div class="stat-label">Tools</div></div>
    <div class="stat-card"><div class="stat-num">24</div><div class="stat-label">Modules</div></div>
    <div class="stat-card"><div class="stat-num">2</div><div class="stat-label">Modes</div></div>
  </div>

  <div class="cta-row">
    <a href="/docs" class="btn btn-primary">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      API Documentation
    </a>
    <a href="/health" class="btn btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      Health
    </a>
    <a href="/docs/json" class="btn btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      OpenAPI Spec
    </a>
    <a href="https://github.com/serkanhaslak/meta-mcp" class="btn btn-ghost" target="_blank">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
      GitHub
    </a>
  </div>

  <div class="section-title">Quick Start</div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon blue">1</div>
      <div class="card-title">Connect with Claude Code</div>
    </div>
    <p>Add secrets to <code>.env</code> (gitignored), then reference them in <code>.mcp.json</code>:</p>
    <pre><code><span class="comment"># .env</span>
<span class="kw">META_MCP_URL</span>=<span class="str">${BASE_URL}/mcp</span>
<span class="kw">MCP_API_KEY</span>=<span class="str">your_api_key</span></code></pre>
    <pre><code><span class="comment">// .mcp.json</span>
{
  <span class="str">"mcpServers"</span>: {
    <span class="str">"meta-mcp"</span>: {
      <span class="str">"command"</span>: <span class="str">"npx"</span>,
      <span class="str">"args"</span>: [
        <span class="str">"mcp-remote"</span>,
        <span class="str">"\${META_MCP_URL}"</span>,
        <span class="str">"--header"</span>,
        <span class="str">"Authorization: Bearer \${MCP_API_KEY}"</span>
      ]
    }
  }
}</code></pre>
    <p>Environment variables are resolved automatically &mdash; no secrets in <code>.mcp.json</code>.</p>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon purple">2</div>
      <div class="card-title">REST API</div>
    </div>
    <p>Call any endpoint directly. Requires <code>Authorization</code> (API key) and <code>X-Meta-Token</code> (Meta access token).</p>
    <pre><code><span class="kw">curl</span> -H <span class="str">"Authorization: Bearer YOUR_API_KEY"</span> \\
     -H <span class="str">"X-Meta-Token: YOUR_META_TOKEN"</span> \\
     ${BASE_URL}/api/v1/campaigns</code></pre>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-icon amber">3</div>
      <div class="card-title">Graph API Proxy</div>
    </div>
    <p>Access any Meta Graph API endpoint. The path after <code>/api/v1/meta/</code> maps directly to the Graph API.</p>
    <pre><code><span class="kw">curl</span> -H <span class="str">"Authorization: Bearer YOUR_API_KEY"</span> \\
     -H <span class="str">"X-Meta-Token: YOUR_META_TOKEN"</span> \\
     ${BASE_URL}/api/v1/meta/me/adaccounts?fields=id,name</code></pre>
  </div>

  <div class="section-title" style="margin-top:2.25rem">Endpoints</div>

  <div class="endpoints">
    <div class="ep-row"><span class="ep-method get">GET</span><span class="ep-path">/api/v1/accounts</span><span class="ep-desc">Ad accounts</span></div>
    <div class="ep-row"><span class="ep-method any">CRUD</span><span class="ep-path">/api/v1/campaigns</span><span class="ep-desc">Campaigns</span></div>
    <div class="ep-row"><span class="ep-method any">CRUD</span><span class="ep-path">/api/v1/adsets</span><span class="ep-desc">Ad sets</span></div>
    <div class="ep-row"><span class="ep-method any">CRUD</span><span class="ep-path">/api/v1/ads</span><span class="ep-desc">Ads</span></div>
    <div class="ep-row"><span class="ep-method get">GET</span><span class="ep-path">/api/v1/creatives</span><span class="ep-desc">Creatives</span></div>
    <div class="ep-row"><span class="ep-method get">GET</span><span class="ep-path">/api/v1/insights/:id</span><span class="ep-desc">Insights</span></div>
    <div class="ep-row"><span class="ep-method get">GET</span><span class="ep-path">/api/v1/images</span><span class="ep-desc">Images</span></div>
    <div class="ep-row"><span class="ep-method get">GET</span><span class="ep-path">/api/v1/audiences</span><span class="ep-desc">Audiences</span></div>
    <div class="ep-row"><span class="ep-method get">GET</span><span class="ep-path">/api/v1/pixels</span><span class="ep-desc">Pixels</span></div>
    <div class="ep-row"><span class="ep-method post">POST</span><span class="ep-path">/api/v1/conversions/:pixelId</span><span class="ep-desc">Conversions API</span></div>
    <div class="ep-row"><span class="ep-method any">ANY</span><span class="ep-path">/api/v1/meta/*</span><span class="ep-desc">Graph API proxy</span></div>
    <div class="ep-row"><span class="ep-method post">POST</span><span class="ep-path">/mcp</span><span class="ep-desc">MCP protocol</span></div>
  </div>

  <div class="footer">
    <a href="https://pragmaticgrowth.com" target="_blank" class="footer-brand">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="15" fill="none" viewBox="0 0 44 24"><path fill="currentColor" fill-rule="evenodd" d="M0 12C0 5.373 5.285 0 11.805 0h20.39C38.715 0 44 5.373 44 12s-5.285 12-11.805 12h-20.39C5.285 24 0 18.627 0 12zm20.39 0a8.83 8.83 0 0 0-1.447-4.849 8.618 8.618 0 0 0-3.853-3.214 8.456 8.456 0 0 0-4.96-.497 8.543 8.543 0 0 0-4.396 2.39 8.773 8.773 0 0 0-2.35 4.468 8.861 8.861 0 0 0 .489 5.043 8.698 8.698 0 0 0 3.162 3.916 8.487 8.487 0 0 0 4.77 1.471V12h8.585zm18.944 4.849A8.83 8.83 0 0 0 40.78 12h-8.586V3.273a8.487 8.487 0 0 0-4.77 1.47 8.698 8.698 0 0 0-3.162 3.917 8.862 8.862 0 0 0-.488 5.043 8.774 8.774 0 0 0 2.35 4.468 8.544 8.544 0 0 0 4.395 2.389 8.457 8.457 0 0 0 4.96-.497 8.618 8.618 0 0 0 3.854-3.214z" clip-rule="evenodd"/></svg>
      Built by Pragmatic Growth
    </a>
    <div class="footer-links">
      <a href="/docs">API Docs</a> &nbsp;&middot;&nbsp; <a href="/docs/json">OpenAPI Spec</a> &nbsp;&middot;&nbsp; <a href="https://github.com/serkanhaslak/meta-mcp" target="_blank">GitHub</a>
    </div>
  </div>

</div>
</div>
</body>
</html>`;
}
