# glasgate.ai — Backend Architecture

**Version:** 2.1  
**Updated:** 2026-06-06  
**Stack:** Node.js 20+ · Express 4 · ESM · No database

---

## Overview

The glasgate.ai backend is a stateless REST API that accepts a website URL, crawls it, extracts structured content, generates AI-readable artifacts, and stores them on disk. Jobs are processed asynchronously with an in-memory queue.

```
Client
  │
  ▼
POST /api/audit
  │
  ▼
┌─────────────────────────────────────────────────────┐
│  Middleware Stack                                   │
│  requestId → requestLogger → cors → json             │
│  → [public /api/health*]                           │
│  → apiKey → rateLimit → routes                     │
└─────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────┐
│  Job Store      │  createJob() → status: pending
│  (in-memory)    │
└─────────────────┘
  │
  ▼  (async, fire-and-forget)
┌─────────────────────────────────────────────────────┐
│  Audit Pipeline                                     │
│                                                     │
│  Validator → RobotsChecker (403 if blocked)        │
│           → Fetcher → SitemapParser → CrawlQueue   │
│           → [for each URL]                         │
│             Fetcher → Extractor → Normalizer       │
│           → Scorer                                 │
│           → Generators (5x)                        │
│           → Store (disk write)                     │
│           → Cache (configurable TTL)               │
└─────────────────────────────────────────────────────┘
  │
  ▼
GET /api/jobs/:jobId  ← client polls for result
```

---

## File Structure

```
server/
├── index.js                    Entry point, middleware, graceful shutdown
├── config.js                   All settings, env-var driven
├── middleware/
│   ├── requestId.js            Attach UUID to every request (X-Request-ID)
│   ├── requestLogger.js        Log method, path, status, latency per request
│   ├── rateLimit.js            In-memory sliding-window rate limiter
│   └── apiKey.js               Optional Bearer / X-API-Key auth
├── routes/
│   ├── audit.js                POST /api/audit (async) + POST /api/audit/sync
│   ├── jobs.js                 GET /api/jobs + GET /api/jobs/:id
│   ├── sites.js                GET /api/sites + sub-resources
│   ├── search.js               GET /api/search?q=
│   └── health.js               GET /api/health + /detailed + metricsHandler
└── lib/
    ├── validator.js            URL + siteId validation, pagination helpers
    ├── fetcher.js              HTTP fetch with timeout + user-agent
    ├── robots.js               robots.txt fetch + block-based parser
    ├── sitemap.js              sitemap.xml fetch + parse + crawl queue
    ├── extractor.js            HTML → PageData
    ├── normalizer.js           Clean and trim extracted content
    ├── scorer.js               AI Readiness Score 0–100 (additive)
    ├── tokenEstimator.js       Estimate token counts, compute savings %
    ├── logger.js               Structured JSON logger
    ├── jobStore.js             In-memory job queue
    ├── cache.js                In-memory TTL cache (keyed by siteId)
    ├── store.js                Disk read/write for generated artifacts
    └── generators/
        ├── markdown.js         page.md
        ├── json.js             page.json
        ├── llmsTxt.js          llms.txt
        ├── llmsFullTxt.js      llms-full.txt
        └── aiIndex.js          ai-index.json
```

---

## Middleware Stack

Order matters. Applied in `server/index.js`:

```
requestIdMiddleware       → adds X-Request-ID to req and res
requestLoggerMiddleware   → logs after response finishes
cors                      → allows configured origins
express.json              → parse request body
[public] healthRouter     → /api/health, /api/health/detailed (no auth)
apiKeyAuth                → 401 if GLASGATE_API_KEY is set and key is wrong
apiLimiter                → 60 req/min per IP + rate limit headers
metricsHandler            → GET /api/metrics (auth-protected)
auditLimiter + auditRouter→ 10 req/min on /api/audit*
sites / jobs / search     → auth + rate limited
```

---

## Audit Flow

```
1.  POST /api/audit { url, force? }
2.  validateUrl(url)             → 400 if invalid
3.  cacheGet(siteId)             → 200 with cached result if force=false
4.  fetchRobots(baseUrl)         → 403 if bot disallowed (before job creation)
5.  createJob(jobId, url, siteId)
6.  Return 202 { jobId, pollUrl, reqId }
7.  [async] runAudit(jobId, ...)
    a. markRunning(jobId)
    b. fetchRobots → siteChecks.robotsTxt
    c. fetchText("/llms.txt") → siteChecks.llmsTxtExists
    d. fetchSitemap → siteChecks.sitemapXml, urls[]
    e. buildCrawlQueue → max N URLs (config.maxPages)
    f. for each URL: fetchPage → extractPage → normalizePage
    g. scoreSite(pages, checks) → { score, checks, issues }
    h. generate artifacts (llms.txt, llms-full.txt, ai-index.json, pages)
    i. saveSiteArtifacts → write to {projectRoot}/generated/{siteId}/
    j. cacheSet(siteId, result, config.cacheTtlMs)
    k. markCompleted(jobId, result)
```

---

## AI Readiness Score

Computed by `scorer.js`. Maximum 100 points (additive model with partial credit).

| Check | Points | Condition |
|---|---|---|
| `sitemapXml` | +15 | sitemap.xml found |
| `robotsTxt` | +10 | robots.txt found |
| `llmsTxtExists` | +10 | /llms.txt exists on target site |
| `canonicalUrls` | +15 | all pages have canonical URL |
| `h1Structure` | +15 | all pages have H1 |
| `metaDescription` | +10 | all pages have meta description |
| `structuredData` | +10 | any page has JSON-LD |
| Low boilerplate | +5 | average word count > 100 |
| `openGraph` | +5 | any page has OG tags |

Partial credit (+5 to +8) is awarded when checks pass on some pages. Issues are reported in the `issues` array.

---

## Generated Artifacts

All artifacts are written to `{projectRoot}/generated/{siteId}/` and served at `/generated/{siteId}/...`.

| File | Description |
|---|---|
| `llms.txt` | Curated AI site index (llmstxt.org format) |
| `llms-full.txt` | Full content corpus |
| `ai-index.json` | Machine-readable site index (persistent audit record) |
| `pages/{slug}.md` | Single-page Markdown mirror |
| `pages/{slug}.json` | Structured page JSON |

The `generator` field in all artifacts is `glasgate.ai`. The crawler bot is `GlassGateBot`.

---

## Cache

`lib/cache.js` — in-memory TTL cache.

- Key: `siteId`
- TTL: `config.cacheTtlMs` (default 10 minutes)
- Bypass: `POST /api/audit { force: true }`
- Cache hit returns `200` with `"cached": true` (no new job created)

---

## Rate Limiting

| Route group | Limit |
|---|---|
| `/api/audit*` | 10 req/min |
| All other protected `/api/*` | 60 req/min |
| `/api/health*` | No rate limit |

Headers on all rate-limited responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Configuration

All settings in `server/config.js`. See `.env.example` for the full list.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP server port |
| `GLASGATE_API_KEY` | — | Enable API key auth |
| `CACHE_TTL_MS` | `600000` | Cache TTL (10 min) |
| `GENERATED_DIR` | `{projectRoot}/generated` | Output directory |
| `BOT_USER_AGENT` | `GlassGateBot/0.1 (+https://glasgate.ai/bot)` | Crawler UA |
| `ALLOWED_ORIGINS` | dev defaults | CORS origins |

---

## Testing

```bash
npm run test:unit    # validator, robots, scorer, generators
npm run test:e2e     # full API against running server
```

E2E tests cover: health, metrics, validation, sync/async audit, caching, generated files, sites API, jobs API, search, rate limit headers.

---

## Production Upgrade Path

| Current (MVP) | Production |
|---|---|
| In-memory job store | Redis + BullMQ |
| In-memory cache | Redis |
| In-memory rate limiter | express-rate-limit + Redis |
| Disk storage | S3 / Cloudflare R2 |
| Plain HTTP fetch | Playwright (JS-heavy sites) |
| Single process | Worker threads / separate crawler service |
