# glasgate.ai API Reference

**Base URL:** `http://localhost:3001`  
**Version:** `0.1.0`  
**Updated:** 2026-06-06  
**Content-Type:** `application/json`

---

## Authentication

Disabled by default. Enable by setting `GLASGATE_API_KEY` environment variable.

```http
Authorization: Bearer <api-key>
```
or
```http
X-API-Key: <api-key>
```

**Response when missing / invalid (401):**
```json
{
  "error":   "Unauthorized",
  "message": "Valid API key required. Send: Authorization: Bearer <key>"
}
```

---

## Rate Limits

| Route group | Limit |
|---|---|
| `POST /api/audit*` | 10 requests / minute / IP |
| All other `/api/*` | 60 requests / minute / IP |

**Response headers on rate-limited routes** (`/api/*` except `/api/health*`):
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
X-RateLimit-Reset: 1717675260
```

**Response on limit exceeded (429):**
```json
{ "error": "Rate limit exceeded", "retryAfter": 42 }
```

---

## Request Tracing

Every response carries:
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

Supply your own ID for distributed tracing:
```
X-Request-ID: my-trace-id-123
```

---

## Endpoint Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | ❌ | Liveness check |
| GET | `/api/health/detailed` | ❌ | Subsystem status |
| GET | `/api/metrics` | ✅ | Operational metrics |
| POST | `/api/audit` | ✅ | Start async audit job |
| POST | `/api/audit/sync` | ✅ | Synchronous audit (wait for result) |
| GET | `/api/jobs` | ✅ | List all jobs |
| GET | `/api/jobs/:jobId` | ✅ | Get job status + result + logs |
| GET | `/api/sites` | ✅ | List all indexed sites |
| GET | `/api/sites/:siteId` | ✅ | Full audit result for a site |
| GET | `/api/sites/:siteId/score` | ✅ | Score + checks only |
| GET | `/api/sites/:siteId/metrics` | ✅ | Token savings + perf metrics |
| GET | `/api/sites/:siteId/artifacts` | ✅ | Artifact paths only |
| GET | `/api/search?q=` | ✅ | Full-text search across sites |
| GET | `/generated/:siteId/*` | ❌ | Static artifact files |

---

## Health

### `GET /api/health`

Liveness check. No auth required.

**Response 200:**
```json
{
  "status":    "ok",
  "version":   "0.1.0",
  "uptime":    3600,
  "timestamp": "2026-06-06T12:00:00.000Z"
}
```

---

### `GET /api/health/detailed`

Subsystem status including job store and cache.

**Response 200:**
```json
{
  "status":    "ok",
  "version":   "0.1.0",
  "uptime":    3600,
  "timestamp": "2026-06-06T12:00:00.000Z",
  "subsystems": {
    "jobStore": { "status": "ok", "totalJobs": 42 },
    "cache":    { "status": "ok", "total": 10, "active": 8, "expired": 2 }
  }
}
```

---

### `GET /api/metrics`

Operational metrics for monitoring dashboards.

**Response 200:**
```json
{
  "uptime": 3600,
  "jobs": {
    "total": 42,
    "byStatus": { "pending": 0, "running": 1, "completed": 38, "failed": 3 }
  },
  "cache":    { "total": 10, "active": 8, "expired": 2 },
  "averages": { "score": 74, "crawlMs": 2840 },
  "memory":   { "rss": 52428800, "heapUsed": 24000000, "external": 1000000 }
}
```

---

## Audit

### `POST /api/audit` — Async ⚡

Start an audit job. Returns a `jobId` immediately — the crawl runs in the background. Poll `/api/jobs/:jobId` for the result.

**Request body:**
```json
{
  "url":   "https://example.com",
  "force": false
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | ✅ | — | Website URL (http or https) |
| `force` | boolean | ❌ | `false` | Bypass 10-min cache and re-crawl |

**Response 202:**
```json
{
  "status":  "accepted",
  "jobId":   "job_lx3k2_abc12",
  "siteId":  "example-com",
  "url":     "https://example.com",
  "pollUrl": "/api/jobs/job_lx3k2_abc12",
  "message": "Audit started. Poll pollUrl for status and result."
}
```

**Polling pattern:**
```js
// Start
const { jobId } = await POST('/api/audit', { url })

// Poll every 2s
const job = await GET(`/api/jobs/${jobId}`)
if (job.status === 'completed') use(job.result)
if (job.status === 'failed')    handle(job.error)
```

**Error responses:**

| Status | Condition |
|---|---|
| 400 | Invalid or malformed URL |
| 403 | robots.txt disallows crawler bot (checked before job creation) |
| 429 | Rate limit exceeded |

**Cache hit (200):** If a cached result exists and `force` is not set, returns the full audit result immediately with `"cached": true` instead of creating a new job.

---

### `POST /api/audit/sync` — Synchronous 🔄

Same logic as async, but waits for the crawl to complete before responding. Response time: 1–15 seconds.

**Request:** Same as `POST /api/audit`

**Response 200 — completed:**
```json
{
  "status":          "completed",
  "jobId":           "job_lx3k2_abc12",
  "siteId":          "example-com",
  "url":             "https://example.com",
  "score":           82,
  "pagesFound":      7,
  "pagesProcessed":  3,
  "cached":          false,
  "artifacts": {
    "llmsTxt":     "/generated/example-com/llms.txt",
    "llmsFullTxt": "/generated/example-com/llms-full.txt",
    "aiIndex":     "/generated/example-com/ai-index.json",
    "pages": [
      {
        "url":      "https://example.com/",
        "markdown": "/generated/example-com/pages/home.md",
        "json":     "/generated/example-com/pages/home.json"
      }
    ]
  },
  "metrics": {
    "htmlTokensEstimate":      18400,
    "markdownTokensEstimate":  6200,
    "estimatedSavingsPercent": 66,
    "crawlMs":                 2840
  },
  "checks": {
    "robotsTxt":       true,
    "sitemapXml":      true,
    "llmsTxtExists":   false,
    "canonicalUrls":   true,
    "h1Structure":     true,
    "metaDescription": true,
    "structuredData":  false,
    "openGraph":       true
  },
  "issues": [
    { "severity": "warning", "message": "No llms.txt found on target site — glasgate.ai will generate one" },
    { "severity": "info",    "message": "No JSON-LD structured data found" }
  ]
}
```

If the result was from cache: `"cached": true`

**Response 500 — all pages failed:**
```json
{
  "error":   "Audit failed",
  "message": "All page fetches failed. The site may be blocking automated access.",
  "jobId":   "job_lx3k2_abc12"
}
```

---

## Jobs

### `GET /api/jobs`

List all audit jobs, newest first.

**Query parameters:**

| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `status` | string | — | — | Filter: `pending`, `running`, `completed`, `failed` |
| `limit` | number | `20` | `100` | Results per page |
| `offset` | number | `0` | — | Pagination offset |

**Response 200:**
```json
{
  "total":  42,
  "limit":  20,
  "offset": 0,
  "jobs": [
    {
      "id":          "job_lx3k2_abc12",
      "status":      "completed",
      "url":         "https://example.com",
      "siteId":      "example-com",
      "createdAt":   1717675200000,
      "startedAt":   1717675201000,
      "completedAt": 1717675204000,
      "result":      { "score": 82, "..." },
      "error":       null,
      "logs":        ["[2026-06-06T12:00:01Z] Starting audit..."]
    }
  ]
}
```

---

### `GET /api/jobs/:jobId`

Get full status, logs, and result for a single job.

**Response 200:**
```json
{
  "id":          "job_lx3k2_abc12",
  "status":      "completed",
  "url":         "https://example.com",
  "siteId":      "example-com",
  "createdAt":   1717675200000,
  "startedAt":   1717675201000,
  "completedAt": 1717675204000,
  "result": { "...full audit result..." },
  "error":  null,
  "logs": [
    "[2026-06-06T12:00:01Z] Starting audit for https://example.com",
    "[2026-06-06T12:00:01Z] Fetching robots.txt",
    "[2026-06-06T12:00:01Z] Checking for existing llms.txt",
    "[2026-06-06T12:00:01Z] Fetching sitemap.xml",
    "[2026-06-06T12:00:01Z] Crawl queue: 3 URL(s)",
    "[2026-06-06T12:00:02Z] Crawling https://example.com/",
    "[2026-06-06T12:00:03Z]   ↳ OK: \"Example Domain\" (31 words)",
    "[2026-06-06T12:00:03Z] Scoring site",
    "[2026-06-06T12:00:03Z] Generating artifacts",
    "[2026-06-06T12:00:03Z] Saving artifacts to disk",
    "[2026-06-06T12:00:03Z] Done in 2840ms. Score: 82/100"
  ]
}
```

**Job status values:**

| Status | Description |
|---|---|
| `pending` | Created, not yet started |
| `running` | Crawl in progress |
| `completed` | Done — `result` populated |
| `failed` | Error — `error` populated |

**Response 404:**
```json
{ "error": "Job not found", "jobId": "job_lx3k2_abc12" }
```

---

## Sites

### `GET /api/sites`

List all indexed sites. Reads from `generated/` directory.

**Query parameters:** `limit` (default 20, max 100), `offset` (default 0)

**Response 200:**
```json
{
  "total":  15,
  "limit":  20,
  "offset": 0,
  "sites": [
    {
      "siteId":        "example-com",
      "url":           "https://example.com",
      "title":         "Example Domain",
      "score":         82,
      "pages":         3,
      "lastIndexedAt": "2026-06-06T12:00:00.000Z",
      "aiIndex":       "/generated/example-com/ai-index.json",
      "llmsTxt":       "/generated/example-com/llms.txt"
    }
  ]
}
```

---

### `GET /api/sites/:siteId`

Full site index for a site (reads `ai-index.json`).

**Response 200:** `ai-index.json` v1.0 schema with `version`, `site`, `crawl`, `pages[]` (importance, type, contentHash), `artifacts`, `agentReadinessScore`, `metrics`, `checks`, and `issues`.

**Response 404:**
```json
{ "error": "Site not found", "siteId": "example-com" }
```

---

### `GET /api/sites/:siteId/score`

Score breakdown and issue list only.

**Response 200:**
```json
{
  "siteId": "example-com",
  "score":  82,
  "checks": {
    "robotsTxt": true, "sitemapXml": true, "llmsTxtExists": false,
    "canonicalUrls": true, "h1Structure": true, "metaDescription": true,
    "structuredData": false, "openGraph": true
  },
  "issues": [
    { "severity": "warning", "message": "No llms.txt found on target site — glasgate.ai will generate one" }
  ]
}
```

---

### `GET /api/sites/:siteId/metrics`

Token savings and crawl performance metrics only.

**Response 200:**
```json
{
  "siteId": "example-com",
  "metrics": {
    "htmlTokensEstimate":      18400,
    "markdownTokensEstimate":  6200,
    "estimatedSavingsPercent": 66,
    "crawlMs":                 2840
  }
}
```

---

### `GET /api/sites/:siteId/artifacts`

Artifact file paths only.

**Response 200:**
```json
{
  "siteId": "example-com",
  "artifacts": {
    "llmsTxt":     "/generated/example-com/llms.txt",
    "llmsFullTxt": "/generated/example-com/llms-full.txt",
    "aiIndex":     "/generated/example-com/ai-index.json"
  },
  "pages": [
    {
      "url":         "https://example.com/",
      "title":       "Example Domain",
      "markdownUrl": "/generated/example-com/pages/home.md",
      "jsonUrl":     "/generated/example-com/pages/home.json"
    }
  ]
}
```

---

## Search

### `GET /api/search?q=keyword`

Full-text search across all indexed sites. Searches site titles, descriptions, and page titles.

**Query parameters:**

| Param | Type | Required | Default | Max | Description |
|---|---|---|---|---|---|
| `q` | string | ✅ | — | — | Search query (min 2 chars) |
| `limit` | number | ❌ | `10` | `50` | Max results |

**Response 200:**
```json
{
  "query":   "logistics",
  "total":   3,
  "results": [
    {
      "siteId":          "example-com",
      "siteUrl":         "https://example.com",
      "siteTitle":       "Example Domain",
      "siteDescription": "Global logistics platform.",
      "score":           82,
      "matchedPages": [
        {
          "url":         "https://example.com/product",
          "title":       "Logistics Platform",
          "description": "Automate shipment planning.",
          "markdownUrl": "/generated/example-com/pages/product.md"
        }
      ],
      "aiIndex": "/generated/example-com/ai-index.json",
      "llmsTxt": "/generated/example-com/llms.txt"
    }
  ]
}
```

**Response 400:**
```json
{ "error": "Invalid query", "message": "Query param 'q' must be at least 2 characters" }
```

---

## Static Files

Served directly from `generated/` — no auth required.

| Path | Description |
|---|---|
| `GET /generated/:siteId/llms.txt` | AI site index (Markdown, llmstxt.org) |
| `GET /generated/:siteId/llms-full.txt` | Full content corpus (Markdown) |
| `GET /generated/:siteId/ai-index.json` | Structured site index (JSON) |
| `GET /generated/:siteId/pages/:slug.md` | Single page Markdown mirror |
| `GET /generated/:siteId/pages/:slug.json` | Single page structured JSON |

---

## AI Readiness Score

Score (0–100) — how well a site is optimized for AI agent consumption.

| Check | Points | Condition |
|---|---|---|
| `sitemapXml` | +15 | sitemap.xml found |
| `robotsTxt` | +10 | robots.txt found |
| `llmsTxtExists` | +10 | /llms.txt present on target site |
| `canonicalUrls` | +15 | all crawled pages have `<link rel="canonical">` |
| `h1Structure` | +15 | all crawled pages have H1 |
| `metaDescription` | +10 | all crawled pages have meta description |
| `structuredData` | +10 | any page has JSON-LD |
| Low boilerplate | +5 | average word count > 100 |
| `openGraph` | +5 | any page has OG tags |

Partial credit (+5 to +8) is awarded when checks pass on some pages but not all. Issues are reported in the `issues` array.

---

## Error Reference

| HTTP | `error` | When |
|---|---|---|
| 400 | `Invalid URL` | Malformed or non-http(s) URL |
| 400 | `Invalid query` | Search query shorter than 2 chars |
| 401 | `Unauthorized` | API key missing or wrong |
| 403 | `Crawl not allowed` | robots.txt disallows GlassGateBot (checked before job start) |
| 404 | `Site not found` | siteId not in `generated/` |
| 404 | `Job not found` | jobId not in memory |
| 429 | `Rate limit exceeded` | Too many requests; see `retryAfter` |
| 500 | `Audit failed` | All page fetches failed |
| 500 | `Internal server error` | Unexpected server error |

All errors include `reqId` for tracing.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | `production` enables JSON logs |
| `GLASGATE_API_KEY` | — | Enable API key auth (disabled if unset) |
| `CRAWL_TIMEOUT` | `8000` | Per-page fetch timeout (ms) |
| `MAX_PAGES` | `10` | Max canonical pages per audit (value-ranked) |
| `MAX_SITEMAP_URLS` | `100` | Max URLs read from sitemap for discovery |
| `MAX_LLMS_TXT_PAGES` | `8` | Max pages in curated llms.txt |
| `MAX_SITEMAP_URLS` | `20` | Max URLs read from sitemap |
| `CACHE_TTL_MS` | `600000` | Result cache TTL (10 min) |
| `GENERATED_DIR` | `./generated` | Artifact output directory |
| `LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `BOT_USER_AGENT` | `GlassGateBot/0.1 (+https://glasgate.ai/bot)` | Crawler User-Agent header |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS origins (dev defaults added automatically) |

---

## Frontend Integration

Add to `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api':       'http://localhost:3001',
      '/generated': 'http://localhost:3001'
    }
  }
})
```

**Recommended async audit flow:**
```js
// 1. Start job
const { jobId } = await fetch('/api/audit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url })
}).then(r => r.json())

// 2. Poll
const poll = setInterval(async () => {
  const job = await fetch(`/api/jobs/${jobId}`).then(r => r.json())
  if (job.status === 'completed') {
    clearInterval(poll)
    renderResult(job.result)
  }
  if (job.status === 'failed') {
    clearInterval(poll)
    showError(job.error)
  }
}, 2000)
```
