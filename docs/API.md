# GlassGate API Reference

**Base URL:** `http://localhost:3001`  
**Version:** `0.1.0`  
**Content-Type:** `application/json`

---

## Authentication

Authentication is optional in development. Set `GLASGATE_API_KEY` environment variable to enable.

```
Authorization: Bearer <api-key>
# or
X-API-Key: <api-key>
```

---

## Rate Limits

| Endpoint group | Limit |
|---|---|
| `/api/audit*` | 10 requests / minute per IP |
| All other `/api/*` | 60 requests / minute per IP |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1717675200
```

On limit exceeded:
```json
{ "error": "Rate limit exceeded", "retryAfter": 42 }
```

---

## Request Tracing

Every response includes:
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

You can supply your own ID:
```
X-Request-ID: my-trace-id-123
```

---

## Endpoints

### Health

---

#### `GET /api/health`

Basic liveness check.

**Response 200:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 3600,
  "timestamp": "2026-06-06T12:00:00.000Z"
}
```

---

#### `GET /api/health/detailed`

Detailed health check including subsystem status.

**Response 200:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 3600,
  "timestamp": "2026-06-06T12:00:00.000Z",
  "subsystems": {
    "jobStore": { "status": "ok", "totalJobs": 42 },
    "cache":    { "status": "ok", "total": 10, "active": 8, "expired": 2 }
  }
}
```

---

#### `GET /api/metrics`

Operational metrics for monitoring.

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
  "memory":   { "rss": 52428800, "heapUsed": 24000000 }
}
```

---

### Audit

---

#### `POST /api/audit` ⚡ Async

Start an audit job. Returns immediately with a `jobId`. Poll `/api/jobs/:jobId` for the result.

**Request:**
```json
{
  "url":   "https://example.com",
  "force": false
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | ✅ | Website URL to audit (http or https) |
| `force` | boolean | ❌ | Bypass cache and re-crawl (default: false) |

**Response 202:**
```json
{
  "status":   "accepted",
  "jobId":    "job_lx3k2_abc12",
  "siteId":   "example-com",
  "url":      "https://example.com",
  "pollUrl":  "/api/jobs/job_lx3k2_abc12",
  "message":  "Audit started. Poll pollUrl for status and result."
}
```

**Response 400 — invalid URL:**
```json
{
  "error":   "Invalid URL",
  "message": "URL must start with http:// or https://"
}
```

**Response 429 — rate limited:**
```json
{
  "error":       "Rate limit exceeded",
  "retryAfter":  42
}
```

---

#### `POST /api/audit/sync` 🔄 Synchronous

Same as `/api/audit` but waits for the crawl to finish and returns the full result directly. Response can take 2–15 seconds depending on the site.

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
    "robotsTxt":     true,
    "sitemapXml":    true,
    "llmsTxtExists": false,
    "canonicalUrls": true,
    "h1Structure":   true,
    "metaDescription": true,
    "structuredData":  false,
    "openGraph":       true
  },
  "issues": [
    { "severity": "warning", "message": "No llms.txt found on target site — GlassGate will generate one" },
    { "severity": "info",    "message": "No JSON-LD structured data found" }
  ]
}
```

**Cached response** (same shape, with `"cached": true`)

**Response 500 — crawl failed:**
```json
{
  "error":   "Audit failed",
  "message": "All page fetches failed. The site may be blocking automated access.",
  "jobId":   "job_lx3k2_abc12"
}
```

---

### Jobs

---

#### `GET /api/jobs`

List all audit jobs with pagination.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter: `pending`, `running`, `completed`, `failed` |
| `limit` | number | 20 | Max results (max 100) |
| `offset` | number | 0 | Pagination offset |

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
      "result":      { ... },
      "error":       null,
      "logs":        ["[2026-06-06T12:00:01Z] Starting audit...", "..."]
    }
  ]
}
```

---

#### `GET /api/jobs/:jobId`

Get a single job by ID.

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
  "result":      { ... full audit result ... },
  "error":       null,
  "logs": [
    "[2026-06-06T12:00:01Z] Starting audit for https://example.com",
    "[2026-06-06T12:00:01Z] Fetching robots.txt",
    "[2026-06-06T12:00:02Z] Crawling https://example.com/",
    "[2026-06-06T12:00:04Z] Done in 2840ms. Score: 82/100"
  ]
}
```

**Response 404:**
```json
{ "error": "Job not found", "jobId": "job_lx3k2_abc12" }
```

**Job status values:**

| Status | Description |
|---|---|
| `pending` | Job created, not yet started |
| `running` | Crawl in progress |
| `completed` | Crawl done, `result` is populated |
| `failed` | Crawl failed, `error` is populated |

---

### Sites

---

#### `GET /api/sites`

List all indexed sites.

**Query params:** `limit` (default 20), `offset` (default 0)

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

#### `GET /api/sites/:siteId`

Full audit result for a site.

**Response 200:** Full `ai-index.json` object (same as audit result).

**Response 404:**
```json
{ "error": "Site not found", "siteId": "example-com" }
```

---

#### `GET /api/sites/:siteId/artifacts`

Artifact paths only.

**Response 200:**
```json
{
  "siteId":    "example-com",
  "artifacts": { "llmsTxt": "...", "llmsFullTxt": "...", "aiIndex": "..." },
  "pages":     [{ "url": "...", "markdownUrl": "...", "jsonUrl": "..." }]
}
```

---

#### `GET /api/sites/:siteId/score`

Score and checks only.

**Response 200:**
```json
{
  "siteId": "example-com",
  "score":  82,
  "checks": { "robotsTxt": true, "sitemapXml": true, ... },
  "issues": [{ "severity": "warning", "message": "..." }]
}
```

---

#### `GET /api/sites/:siteId/metrics`

Token savings and performance metrics only.

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

### Search

---

#### `GET /api/search?q=keyword`

Search across all indexed sites.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Search query (min 2 chars) |
| `limit` | number | ❌ | Max results (default 10, max 50) |

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
      "siteDescription": "...",
      "score":           82,
      "matchedPages": [
        {
          "url":         "https://example.com/product",
          "title":       "Logistics Platform",
          "description": "...",
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

### Generated Files (Static)

These are served directly as static files:

| Path | Description |
|---|---|
| `GET /generated/:siteId/llms.txt` | AI-readable site index (Markdown) |
| `GET /generated/:siteId/llms-full.txt` | Full content corpus (Markdown) |
| `GET /generated/:siteId/ai-index.json` | Structured site index (JSON) |
| `GET /generated/:siteId/pages/:slug.md` | Single page Markdown mirror |
| `GET /generated/:siteId/pages/:slug.json` | Single page structured JSON |

---

## AI Readiness Score

The score (0–100) measures how well a site is optimized for AI agent consumption.

| Check | Points |
|---|---|
| `sitemapXml` | +15 |
| `robotsTxt` | +10 |
| `llmsTxtExists` | +10 |
| `canonicalUrls` (all pages) | +15 |
| `h1Structure` (all pages) | +15 |
| `metaDescription` (all pages) | +10 |
| `structuredData` (any page) | +10 |
| Low boilerplate ratio | +5 |
| `openGraph` | +5 |
| Missing meta description | -10 |
| No canonical URLs | -10 |
| Very low text content | -5 |

---

## Error Codes

| HTTP | `error` | Description |
|---|---|---|
| 400 | `Invalid URL` | Malformed or non-http URL |
| 400 | `Invalid query` | Search query too short |
| 401 | `Unauthorized` | Missing or invalid API key |
| 403 | `Crawl not allowed` | robots.txt blocks GlassGateBot |
| 404 | `Site not found` | siteId not in generated/ |
| 404 | `Job not found` | jobId not in memory |
| 429 | `Rate limit exceeded` | Too many requests |
| 500 | `Audit failed` | All pages failed to crawl |
| 500 | `Internal server error` | Unexpected error |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment |
| `GLASGATE_API_KEY` | — | Enable API key auth |
| `CRAWL_TIMEOUT` | `8000` | Page fetch timeout (ms) |
| `MAX_PAGES` | `5` | Max pages per audit |
| `MAX_SITEMAP_URLS` | `20` | Max URLs from sitemap |
| `CACHE_TTL_MS` | `600000` | Cache TTL (10 min) |
| `GENERATED_DIR` | `./generated` | Artifact output directory |
| `LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `BOT_USER_AGENT` | `GlassGateBot/0.1` | Crawler user agent |

---

## Quick Start

```bash
cd server
npm install
node index.js
```

Test:
```bash
# Health check
curl http://localhost:3001/api/health

# Async audit (recommended)
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url":"https://stripe.com"}'
# → returns jobId

# Poll for result
curl http://localhost:3001/api/jobs/<jobId>

# Sync audit (simple, slower)
curl -X POST http://localhost:3001/api/audit/sync \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Search indexed sites
curl "http://localhost:3001/api/search?q=payments"

# List all sites
curl http://localhost:3001/api/sites

# Metrics
curl http://localhost:3001/api/metrics
```
