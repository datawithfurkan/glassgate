# GlassGate

**The Agent Delivery Network for the web.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org)
[![API](https://img.shields.io/badge/API-REST-orange)](docs/API.md)

---

## What is GlassGate?

Websites were built for browsers and search crawlers. The next users of the internet are AI agents — and they read through noisy HTML, waste tokens on navigation and boilerplate, and have no reliable way to find canonical, structured source data.

**GlassGate turns any website into structured, verified, low-latency endpoints for AI agents.**

> Cloudflare accelerates and protects websites for browsers.  
> GlassGate structures and delivers websites for AI agents.

---

## How It Works

```
  Your Website
       │
       ▼
  ┌─────────────────────────────────────────┐
  │            GlassGate Pipeline           │
  │                                         │
  │  Crawl → Extract → Normalize → Score   │
  │       → Generate → Store → Serve       │
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

# Frontend deps
npm install

# Backend deps
cd server && npm install && cd ..
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

---

## End-to-End Process

This section describes the complete flow from URL input to AI-ready artifacts.

### Step 1 — Submit a URL

```bash
curl -X POST http://localhost:3001/api/audit/sync \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stripe.com"}'
```

### Step 2 — GlassGate crawls the site

```
→ Fetch robots.txt          check crawl permissions
→ Fetch /llms.txt           check if site is already agent-ready
→ Fetch sitemap.xml         discover pages
→ Build crawl queue         up to 5 pages
→ Fetch each page           8s timeout, with GlassGateBot UA
→ Extract content           title, description, H1–H6, body text,
                            internal links, JSON-LD, Open Graph
→ Normalize                 remove boilerplate, collapse whitespace
```

### Step 3 — Score the site

GlassGate computes an **AI Readiness Score** (0–100):

```
+15  sitemap.xml found
+10  robots.txt found
+10  /llms.txt exists
+15  all pages have canonical URL
+15  all pages have H1
+10  all pages have meta description
+10  any page has JSON-LD structured data
 +5  low boilerplate ratio
 +5  Open Graph tags present
-10  no meta description
-10  no canonical URLs
 -5  very low text content
```

### Step 4 — Generate AI-readable artifacts

For a site at `example.com`, GlassGate writes to `/generated/example-com/`:

| File | Format | Description |
|---|---|---|
| `llms.txt` | Markdown | Curated site index (llmstxt.org spec) |
| `llms-full.txt` | Markdown | Full content corpus, all pages concatenated |
| `ai-index.json` | JSON | Score, checks, metrics, page list |
| `pages/home.md` | Markdown | Single page mirror with YAML frontmatter |
| `pages/home.json` | JSON | Structured page: headings, links, facts, hash |

### Step 5 — Serve as static endpoints

All artifacts are immediately accessible:

```
GET /generated/example-com/llms.txt
GET /generated/example-com/ai-index.json
GET /generated/example-com/pages/home.md
GET /generated/example-com/pages/home.json
```

### Step 6 — View results

```json
{
  "status":          "completed",
  "siteId":          "example-com",
  "score":           82,
  "pagesProcessed":  3,
  "metrics": {
    "htmlTokensEstimate":      18400,
    "markdownTokensEstimate":  6200,
    "estimatedSavingsPercent": 66,
    "crawlMs":                 2840
  },
  "checks": {
    "robotsTxt":       true,
    "sitemapXml":      true,
    "canonicalUrls":   true,
    "h1Structure":     true,
    "metaDescription": true,
    "structuredData":  false,
    "llmsTxtExists":   false
  },
  "issues": [
    { "severity": "warning", "message": "No llms.txt found — GlassGate will generate one" },
    { "severity": "info",    "message": "No JSON-LD structured data found" }
  ]
}
```

---

## API Overview

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/audit` | Start async audit → returns `jobId` |
| `POST` | `/api/audit/sync` | Synchronous audit → returns full result |
| `GET` | `/api/jobs/:id` | Poll job status, logs, and result |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/sites` | List all indexed sites |
| `GET` | `/api/sites/:id` | Full audit result for a site |
| `GET` | `/api/sites/:id/score` | Score and checks only |
| `GET` | `/api/sites/:id/metrics` | Token savings and performance |
| `GET` | `/api/search?q=` | Search across all indexed sites |
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/metrics` | Operational metrics |
| `GET` | `/generated/:id/*` | Static artifact files |

Full reference → [docs/API.md](docs/API.md)

---

## Architecture

```
server/
├── index.js              Entry point + middleware stack
├── config.js             Environment-driven settings
├── middleware/
│   ├── requestId.js      X-Request-ID tracing
│   ├── requestLogger.js  HTTP access logs
│   ├── rateLimit.js      Per-IP sliding window limiter
│   └── apiKey.js         Optional Bearer token auth
├── routes/
│   ├── audit.js          Async + sync audit endpoints
│   ├── jobs.js           Job queue API
│   ├── sites.js          Indexed sites API
│   ├── search.js         Full-text search
│   └── health.js         Health + metrics
└── lib/
    ├── validator.js       URL validation
    ├── fetcher.js         HTTP fetch with timeout
    ├── robots.js          robots.txt parsing
    ├── sitemap.js         sitemap.xml parsing
    ├── extractor.js       HTML → structured PageData
    ├── normalizer.js      Content cleanup
    ├── scorer.js          AI Readiness Score 0–100
    ├── tokenEstimator.js  Token count comparison
    ├── logger.js          Structured logging (JSON/pretty)
    ├── jobStore.js        In-memory async job queue
    ├── cache.js           In-memory TTL cache
    ├── store.js           Disk read/write
    └── generators/
        ├── markdown.js    → page.md
        ├── json.js        → page.json
        ├── llmsTxt.js     → llms.txt
        ├── llmsFullTxt.js → llms-full.txt
        └── aiIndex.js     → ai-index.json
```

Full architecture → [docs/BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md)

---

## Enterprise Features

| Feature | Implementation |
|---|---|
| Async job queue | In-memory, `pending → running → completed/failed` |
| Job logs | Per-step crawl log accessible via API |
| Result caching | 10-minute TTL, bypassable with `force: true` |
| Rate limiting | 10 req/min (audit), 60 req/min (global), per IP |
| Request tracing | `X-Request-ID` on every request and response |
| Structured logging | Pretty in dev, JSON lines in production |
| API key auth | Optional, via `GLASGATE_API_KEY` env var |
| Graceful errors | All failures return structured JSON, server never crashes |

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | `production` → JSON logs |
| `GLASGATE_API_KEY` | — | Enable API key auth |
| `CRAWL_TIMEOUT` | `8000` | Per-page timeout (ms) |
| `MAX_PAGES` | `5` | Max pages per audit |
| `CACHE_TTL_MS` | `600000` | Cache TTL (10 min) |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |

---

## What This Is Not

GlassGate is **not** AI SEO manipulation, hidden content, or cloaking.

The human-facing website remains canonical. GlassGate generates public, alternate representations of the same visible content so AI systems can parse it more reliably. All generated content matches what human users see.

We do not promise:
- Guaranteed AI ranking improvements
- Hidden pages visible only to bots
- Fake backlinks or misleading content

---

## Roadmap

| Feature | Status |
|---|---|
| Core crawler + 5 generators | ✅ Done |
| Async job queue | ✅ Done |
| Rate limiting + auth + logging | ✅ Done |
| Search API | ✅ Done |
| Frontend (Vite + React) | ✅ Done |
| Frontend ↔ Backend wiring | 🔄 In progress (Codex) |
| End-to-end tests | ✅ Done |
| Playwright (JS-heavy sites) | ⬜ Planned |
| PostgreSQL persistence | ⬜ Planned |
| Redis (jobs + cache) | ⬜ Planned |
| Webhook on job completion | ⬜ Planned |
| Multi-tenant / user accounts | ⬜ Planned |

---

## Documentation

- [API Reference](docs/API.md) — all endpoints, schemas, error codes
- [Setup Guide](docs/SETUP.md) — install, run, deploy
- [Architecture](docs/BACKEND_ARCHITECTURE.md) — system design, data flow, upgrade path

---

## Team

- **Muhammet Acar** — Product & Backend
- **Furkan** ([@datawithfurkan](https://github.com/datawithfurkan)) — Frontend & Strategy

---

## License

MIT — see [LICENSE](LICENSE)
