# glasgate.ai

**AI-ready data pipelines for the web.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![API](https://img.shields.io/badge/API-REST-orange)](docs/API.md)

---

## What is glasgate.ai?

Websites were built for browsers and search crawlers. The next users of the internet are AI agents — and they read through noisy HTML, waste tokens on navigation and boilerplate, and have no reliable way to find canonical, structured source data.

**glasgate.ai turns any website into clean, structured, AI-ready data for agents, LLMs, RAG systems, and automations.**

> Turn any website into AI-ready data.

---

## How It Works

```
  Your Website
       │
       ▼
  ┌─────────────────────────────────────────┐
  │         glasgate.ai Pipeline            │
  │                                         │
  │  Crawl → Clean → Structure → Deliver   │
  │       → Score → Generate → Serve       │
  └─────────────────────────────────────────┘
       │
       ▼
  Agent-Ready Artifacts

  /llms.txt          AI site index (llmstxt.org)
  /llms-full.txt     Full content corpus
  /ai-index.json     Structured machine-readable index
  /pages/home.md     Clean Markdown mirror per page
  /pages/home.json   Structured JSON per page
```

---

## Quick Start

### Requirements

- Node.js 20+
- npm 9+

### Install

```bash
git clone https://github.com/datawithfurkan/glassgate.git
cd glassgate

npm install
npm run install:server
```

### Run

```bash
# Terminal 1 — Backend (port 3001)
npm run dev:server

# Terminal 2 — Frontend (port 5173)
npm run dev
```

### Test

```bash
# Unit tests (no server required)
npm run test:unit

# E2E tests (server must be running)
npm run test:e2e

# Both
npm test
```

Copy `.env.example` to `.env` to customize backend settings.

---

## End-to-End Process

### Step 1 — Submit a URL

```bash
curl -X POST http://localhost:3001/api/audit/sync \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Step 2 — glasgate.ai crawls the site

```
→ Fetch robots.txt          check crawl permissions (403 if blocked)
→ Fetch /llms.txt           check if site is already agent-ready
→ Fetch sitemap.xml         discover page candidates
→ Filter + rank URLs      exclude login/cart/filter/search/tracking
→ Build crawl queue       up to 10 canonical pages (value-based)
→ Fetch each page         8s timeout, per-URL robots check
→ Extract content           title, description, H1–H6, body text,
                            internal links, JSON-LD, Open Graph
→ Normalize                 remove boilerplate, collapse whitespace
```

### Step 3 — Score the site

glasgate.ai computes an **AI Readiness Score** (0–100) using additive checks:

```
+15  sitemap.xml found
+10  robots.txt found
+10  /llms.txt exists
+15  all pages have canonical URL
+15  all pages have H1
+10  all pages have meta description
+10  any page has JSON-LD structured data
 +5  low boilerplate ratio (avg words > 100)
 +5  Open Graph tags present
```

Partial credit is awarded when checks pass on some pages but not all.

### Step 4 — Generate AI-readable artifacts

For a site at `example.com`, glasgate.ai writes to `/generated/example-com/`:

| File | Format | Description |
|---|---|---|
| `llms.txt` | Markdown | Curated site index (llmstxt.org spec) |
| `llms-full.txt` | Markdown | Full content corpus, all pages concatenated |
| `ai-index.json` | JSON | v1.0 content graph: crawl stats, page types, hashes |
| `pages/home.md` | Markdown | Single page mirror with YAML frontmatter |
| `pages/home.json` | JSON | Structured page: headings, links, facts, hash |

### Step 5 — Serve as static endpoints

```
GET /generated/example-com/llms.txt
GET /generated/example-com/ai-index.json
GET /generated/example-com/pages/home.md
GET /generated/example-com/pages/home.json
```

### Step 6 — View results

```json
{
  "status": "completed",
  "siteId": "example-com",
  "score": 82,
  "pagesProcessed": 3,
  "metrics": {
    "htmlTokensEstimate": 18400,
    "markdownTokensEstimate": 6200,
    "estimatedSavingsPercent": 66,
    "crawlMs": 2840
  },
  "artifacts": {
    "llmsTxt": "/generated/example-com/llms.txt",
    "llmsFullTxt": "/generated/example-com/llms-full.txt",
    "aiIndex": "/generated/example-com/ai-index.json"
  }
}
```

---

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/audit` | ✅ | Start async audit → returns `jobId` |
| `POST` | `/api/audit/sync` | ✅ | Synchronous audit → returns full result |
| `GET` | `/api/jobs/:id` | ✅ | Poll job status, logs, and result |
| `GET` | `/api/jobs` | ✅ | List all jobs |
| `GET` | `/api/sites` | ✅ | List all indexed sites |
| `GET` | `/api/sites/:id` | ✅ | Full `ai-index.json` for a site |
| `GET` | `/api/sites/:id/score` | ✅ | Score and checks only |
| `GET` | `/api/sites/:id/metrics` | ✅ | Token savings and performance |
| `GET` | `/api/search?q=` | ✅ | Search across indexed sites |
| `GET` | `/api/health` | ❌ | Liveness check |
| `GET` | `/api/health/detailed` | ❌ | Subsystem status |
| `GET` | `/api/metrics` | ✅ | Operational metrics |
| `GET` | `/generated/:id/*` | ❌ | Static artifact files |

Full reference → [docs/API.md](docs/API.md)

---

## Backend Features

| Feature | Implementation |
|---|---|
| Async job queue | In-memory, `pending → running → completed/failed` |
| Job logs | Per-step crawl log accessible via API |
| Result caching | Configurable TTL (`CACHE_TTL_MS`), bypass with `force: true` |
| Rate limiting | 10 req/min (audit), 60 req/min (global), per IP |
| Request tracing | `X-Request-ID` + `reqId` on every error response |
| Structured logging | Pretty in dev, JSON lines in production |
| API key auth | Optional, via `GLASGATE_API_KEY` env var |
| robots.txt compliance | 403 before crawl if bot is disallowed |
| Graceful shutdown | SIGTERM / SIGINT handlers |
| Demo fixture | `generated/demo-glasgate/` for offline frontend demo |

---

## Configuration

See [`.env.example`](.env.example) for all variables.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | `production` → JSON logs, sanitized errors |
| `GLASGATE_API_KEY` | — | Enable API key auth |
| `CRAWL_TIMEOUT` | `8000` | Per-page timeout (ms) |
| `MAX_PAGES` | `10` | Max canonical pages per audit (value-ranked) |
| `MAX_SITEMAP_URLS` | `100` | Max URLs read from sitemap for discovery |
| `MAX_LLMS_TXT_PAGES` | `8` | Max pages listed in curated llms.txt |
| `CACHE_TTL_MS` | `600000` | Cache TTL (10 min) |
| `GENERATED_DIR` | `./generated` | Artifact output directory |
| `BOT_USER_AGENT` | `GlassGateBot/0.1 (+https://glasgate.ai/bot)` | Crawler UA |

---

## What This Is Not

glasgate.ai is **not** AI SEO manipulation, hidden content, or cloaking.

The human-facing website remains canonical. glasgate.ai generates public, alternate representations of the same visible content so AI systems can parse it more reliably.

We do not promise guaranteed AI ranking improvements, hidden bot-only pages, or fake backlinks.

---

## Documentation

- [API Reference](docs/API.md) — all endpoints, schemas, error codes
- [Setup Guide](docs/SETUP.md) — install, run, deploy
- [Architecture](docs/BACKEND_ARCHITECTURE.md) — system design, data flow, upgrade path
- [Agent Rules](AGENTS.md) — crawl policy, artifact formats, dev conventions

---

## Team

- **Muhammet Acar** — Product & Backend
- **Furkan** ([@datawithfurkan](https://github.com/datawithfurkan)) — Frontend & Strategy

---

## License

MIT — see [LICENSE](LICENSE)
