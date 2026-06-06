# GlassGate — Backend Architecture

**Version:** 1.0  
**Date:** 2026-06-06  
**Owner:** Claude (Product Architect)  
**Scope:** MVP Backend — Node.js + Express  
**Frontend:** Vite + React (handled separately by Codex)

---

## 1. Overview

The backend accepts a website URL, crawls it, extracts structured content, generates agent-readable artifacts, scores the site, and stores results on disk. The frontend reads these results via REST API.

```
POST /api/audit
        │
        ▼
   [ Validator ]       → rejects bad URLs
        │
        ▼
   [ Fetcher ]         → fetch HTML via node fetch
        │
        ├──► [ Robots Checker ]   → read robots.txt
        ├──► [ Sitemap Parser ]   → parse sitemap.xml
        │
        ▼
   [ Extractor ]       → title, description, headings, text, links, canonical
        │
        ▼
   [ Normalizer ]      → clean text, remove noise, deduplicate
        │
        ▼
   [ Scorer ]          → compute AI Readiness Score (0–100)
        │
        ▼
   [ Generators ]
        ├── llmsTxt.js       → /generated/{id}/llms.txt
        ├── llmsFullTxt.js   → /generated/{id}/llms-full.txt
        ├── markdown.js      → /generated/{id}/pages/*.md
        ├── json.js          → /generated/{id}/pages/*.json
        └── aiIndex.js       → /generated/{id}/ai-index.json
        │
        ▼
   [ Artifact Store ]  → write files to disk at /generated/{siteId}/
        │
        ▼
   [ Response ]        → JSON to frontend
```

---

## 2. Folder Structure

```
glasgate/
├── server/
│   ├── index.js                  ← Express entry point
│   ├── routes/
│   │   ├── audit.js              ← POST /api/audit
│   │   ├── sites.js              ← GET /api/sites/:id/...
│   │   └── health.js             ← GET /api/health
│   └── lib/
│       ├── validator.js          ← URL validation
│       ├── fetcher.js            ← HTML fetch with timeout + UA
│       ├── robots.js             ← robots.txt fetch + parse
│       ├── sitemap.js            ← sitemap.xml fetch + parse
│       ├── extractor.js          ← HTML → structured data
│       ├── normalizer.js         ← clean and deduplicate content
│       ├── scorer.js             ← AI Readiness Score
│       ├── tokenEstimator.js     ← estimate token counts
│       ├── store.js              ← write/read /generated/ files
│       └── generators/
│           ├── llmsTxt.js        ← generate llms.txt
│           ├── llmsFullTxt.js    ← generate llms-full.txt
│           ├── markdown.js       ← generate page.md per page
│           ├── json.js           ← generate page.json per page
│           └── aiIndex.js        ← generate ai-index.json
├── generated/                    ← output files (gitignored except demo)
│   └── demo-glasgate/            ← pre-built demo fixture
│       ├── llms.txt
│       ├── llms-full.txt
│       ├── ai-index.json
│       └── pages/
│           ├── home.md
│           └── home.json
├── tests/
│   ├── extractor.test.js
│   ├── scorer.test.js
│   ├── generators.test.js
│   └── api.test.js
└── server.package.json           ← separate package.json for backend
```

> **Note for Codex:** The frontend (Vite + React) lives in `src/`. The backend lives in `server/`. They share the same repo root. Run both simultaneously: `npm run dev` starts both.

---

## 3. API Design

### `POST /api/audit`

Starts a crawl and returns generated artifacts.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response (success):**
```json
{
  "siteId": "example-com",
  "status": "completed",
  "url": "https://example.com",
  "score": 82,
  "pagesFound": 7,
  "pagesProcessed": 3,
  "artifacts": {
    "llmsTxt": "/generated/example-com/llms.txt",
    "llmsFullTxt": "/generated/example-com/llms-full.txt",
    "aiIndex": "/generated/example-com/ai-index.json",
    "pages": [
      {
        "url": "https://example.com",
        "markdown": "/generated/example-com/pages/home.md",
        "json": "/generated/example-com/pages/home.json"
      }
    ]
  },
  "metrics": {
    "htmlTokensEstimate": 18400,
    "markdownTokensEstimate": 6200,
    "estimatedSavingsPercent": 66,
    "crawlMs": 1240
  },
  "checks": {
    "robotsTxt": true,
    "sitemapXml": true,
    "canonicalUrls": true,
    "metaDescription": true,
    "h1Structure": true,
    "structuredData": false,
    "llmsTxtExists": false
  },
  "issues": [
    { "severity": "warning", "message": "No llms.txt found on target site" },
    { "severity": "info",    "message": "robots.txt allows common crawlers" }
  ]
}
```

**Response (error):**
```json
{
  "status": "error",
  "error": "Invalid URL",
  "message": "Please provide a valid https:// URL"
}
```

---

### `GET /api/sites/:siteId/artifacts`

Returns list of generated files for a site.

```json
{
  "siteId": "example-com",
  "files": [
    { "path": "/generated/example-com/llms.txt",        "type": "llmsTxt"     },
    { "path": "/generated/example-com/llms-full.txt",   "type": "llmsFullTxt" },
    { "path": "/generated/example-com/ai-index.json",   "type": "aiIndex"     },
    { "path": "/generated/example-com/pages/home.md",   "type": "markdown"    },
    { "path": "/generated/example-com/pages/home.json", "type": "pageJson"    }
  ]
}
```

---

### `GET /api/sites/:siteId/score`

Returns the score breakdown only.

```json
{
  "siteId": "example-com",
  "score": 82,
  "checks": { ... }
}
```

---

### `GET /api/health`

```json
{ "status": "ok", "version": "0.1.0" }
```

---

### Static file serving

```
GET /generated/:siteId/llms.txt
GET /generated/:siteId/llms-full.txt
GET /generated/:siteId/ai-index.json
GET /generated/:siteId/pages/:pageSlug.md
GET /generated/:siteId/pages/:pageSlug.json
```

Express serves `/generated/` as a static directory.

---

## 4. Module Specifications

### `validator.js`

```js
validateUrl(url)
// → { valid: true, normalized: "https://example.com" }
// → { valid: false, error: "URL must start with https://" }
```

Rules:
- must be a string
- must start with `http://` or `https://`
- must have a valid hostname
- no localhost, no IP addresses in production mode
- normalize: trim whitespace, strip trailing slash

---

### `fetcher.js`

```js
fetchPage(url, options)
// options: { timeout: 8000, userAgent: "GlassGateBot/0.1" }
// → { html: "...", status: 200, finalUrl: "...", headers: {...} }
// → throws FetchError on timeout / non-200
```

Config:
- User-Agent: `GlassGateBot/0.1 (+https://glasgate.ai/bot)`
- Timeout: 8 seconds
- Follow up to 3 redirects
- Do not crawl if robots.txt disallows GlassGateBot
- Respect `Retry-After` headers (skip, don't block)

---

### `robots.js`

```js
fetchRobots(baseUrl)
// → { exists: true, allowsGlassGate: true, raw: "..." }
// → { exists: false }
```

```js
isAllowed(robotsTxt, url, userAgent)
// → true / false
```

Uses: `robots-parser` npm package  
User-agent to check: `GlassGateBot`, `*`

---

### `sitemap.js`

```js
fetchSitemap(baseUrl)
// → { exists: true, urls: ["https://example.com/", "https://example.com/about"], count: 2 }
// → { exists: false, urls: [] }
```

Strategy:
1. Try `{baseUrl}/sitemap.xml`
2. Try reading `Sitemap:` line from robots.txt
3. Parse XML with `fast-xml-parser`
4. Flatten sitemap index if needed
5. Return up to 20 URLs (cap for MVP)

---

### `extractor.js`

```js
extractPage(html, url)
// → PageData object
```

**PageData:**
```js
{
  url: "https://example.com/product",
  canonicalUrl: "https://example.com/product",  // from <link rel="canonical">
  title: "Product Page",
  description: "Meta description text",
  language: "en",
  h1: "Main heading",
  headings: [
    { level: 1, text: "Main heading" },
    { level: 2, text: "Sub section" }
  ],
  bodyText: "Clean visible text...",
  wordCount: 412,
  internalLinks: [
    { label: "Contact", url: "https://example.com/contact" }
  ],
  externalLinks: [...],
  structuredData: [],       // JSON-LD objects found
  openGraph: {
    title: "...",
    description: "...",
    image: "..."
  },
  hasH1: true,
  hasMeta: true,
  hasCanonical: true,
  hasStructuredData: false,
  rawHtmlBytes: 48200
}
```

Libraries:
- `cheerio` for HTML parsing
- `@mozilla/readability` + `jsdom` for clean article extraction
- Fallback to cheerio if readability returns empty

Extraction steps:
1. Parse with jsdom
2. Run Readability → get clean `textContent`
3. Parse with cheerio for structural elements (headings, links, meta, canonical, JSON-LD)
4. Merge both results

---

### `normalizer.js`

```js
normalizePage(pageData)
// → cleaned PageData
```

Steps:
- Trim all strings
- Collapse whitespace in bodyText
- Remove navigation / footer text patterns (heuristic)
- Limit bodyText to 5000 chars for token control
- Deduplicate headings
- Normalize link labels

---

### `scorer.js`

```js
scorePages(pages, siteChecks)
// → { score: 82, checks: {...}, issues: [...] }
```

**Scoring table:**

| Check | Points |
|---|---|
| sitemap.xml found | +15 |
| robots.txt found and readable | +10 |
| All pages have canonical URL | +15 |
| All pages have H1 | +15 |
| All pages have meta description | +10 |
| Structured data (JSON-LD) found on any page | +10 |
| Clean body text (low noise ratio) | +10 |
| Open Graph tags present | +5 |
| llms.txt exists on target site | +10 |
| **Deductions** | |
| No meta description | -10 |
| Conflicting canonicals | -10 |
| Very high boilerplate ratio (text < 100 words) | -5 |

Max: 100 (capped)

---

### `tokenEstimator.js`

```js
estimateTokens(text)
// → number (approximate GPT-4 token count)
```

Simple approach: `Math.ceil(text.length / 4)`  
(accurate enough for demo — 1 token ≈ 4 chars in English)

```js
compareTokens(htmlBytes, markdownText)
// → { htmlEstimate, markdownEstimate, savingsPercent }
```

---

### `store.js`

```js
saveSiteArtifacts(siteId, artifacts)
// artifacts: { llmsTxt, llmsFullTxt, aiIndex, pages: [{slug, md, json}] }
// → writes all files to /generated/{siteId}/

loadSiteResult(siteId)
// → JSON audit result if it exists, null otherwise

siteIdFromUrl(url)
// → "example-com" (hostname slug)
```

---

## 5. Generator Specifications

### `generators/llmsTxt.js`

```js
generateLlmsTxt(siteData)
// siteData: { url, title, description, pages: [PageData] }
// → string (llms.txt content)
```

**Output format:**
```markdown
# {Site Title}

> {Site Description}

## Core Pages

- [{Page Title}]({Page URL}) — {Page Description}
- ...

## Agent-readable Mirrors

- [Full Markdown Corpus](/generated/{siteId}/llms-full.txt)
- [AI Index JSON](/generated/{siteId}/ai-index.json)

## Usage Notes

This file is generated by glasgate.ai. It points to public,
canonical-aware representations of the visible website content.
Last updated: {ISO date}
```

---

### `generators/llmsFullTxt.js`

```js
generateLlmsFullTxt(pages)
// → string (concatenated Markdown of all pages)
```

**Output format:**
```markdown
---
source: https://example.com
generated: 2026-06-06T12:00:00Z
generator: glasgate.ai
---

# {Page 1 Title}
source: {url}

{Page 1 content in Markdown}

---

# {Page 2 Title}
...
```

---

### `generators/markdown.js`

```js
generateMarkdown(pageData)
// → string (clean Markdown for one page)
```

**Output format:**
```markdown
---
title: {title}
url: {url}
canonical: {canonicalUrl}
description: {description}
language: {language}
crawledAt: {ISO date}
generator: glasgate.ai
---

# {h1}

{bodyText converted to Markdown paragraphs}

## Links

- [{label}]({url})
```

Use `turndown` library for HTML-to-Markdown conversion where needed.

---

### `generators/json.js`

```js
generatePageJson(pageData, siteId)
// → object (structured JSON for one page)
```

**Output schema:**
```json
{
  "url": "string",
  "canonicalUrl": "string",
  "title": "string",
  "description": "string",
  "language": "string",
  "lastCrawledAt": "ISO string",
  "contentHash": "sha256 of bodyText",
  "wordCount": "number",
  "headings": [{ "level": 1, "text": "string" }],
  "bodyText": "string (first 2000 chars)",
  "internalLinks": [{ "label": "string", "url": "string" }],
  "structuredData": [],
  "openGraph": {},
  "agentRepresentation": {
    "markdownUrl": "/generated/{siteId}/pages/{slug}.md",
    "jsonUrl": "/generated/{siteId}/pages/{slug}.json"
  },
  "generator": "glasgate.ai"
}
```

---

### `generators/aiIndex.js`

```js
generateAiIndex(siteData, pages, score)
// → object (full site index JSON)
```

**Output schema:**
```json
{
  "site": {
    "url": "string",
    "title": "string",
    "description": "string",
    "language": "string",
    "lastIndexedAt": "ISO string"
  },
  "agentReadinessScore": 82,
  "artifacts": {
    "llmsTxt": "/generated/{id}/llms.txt",
    "llmsFullTxt": "/generated/{id}/llms-full.txt"
  },
  "pages": [
    {
      "url": "string",
      "title": "string",
      "description": "string",
      "markdownUrl": "string",
      "jsonUrl": "string",
      "wordCount": 0
    }
  ],
  "metrics": {
    "totalPages": 3,
    "totalWords": 1240,
    "htmlTokensEstimate": 18400,
    "markdownTokensEstimate": 6200,
    "estimatedSavingsPercent": 66
  },
  "generator": "glasgate.ai",
  "generatorVersion": "0.1.0"
}
```

---

## 6. Crawl Flow (step by step)

```
1. Receive URL from POST /api/audit

2. Validate URL
   → 400 if invalid

3. Derive siteId from hostname
   → "example-com"

4. Fetch robots.txt
   → store result in siteChecks.robotsTxt
   → check if GlassGateBot is allowed

5. Fetch sitemap.xml
   → store result in siteChecks.sitemapXml
   → collect up to 20 candidate URLs

6. Build crawl queue
   → [homepage URL] + up to 4 URLs from sitemap
   → deduplicate
   → max 5 pages total for MVP

7. For each URL in queue:
   a. Fetch HTML (with 8s timeout)
   b. Extract PageData
   c. Normalize PageData
   d. Estimate tokens

8. Score all pages + checks

9. Generate artifacts:
   a. llms.txt
   b. llms-full.txt
   c. page.md per page
   d. page.json per page
   e. ai-index.json

10. Write all files to /generated/{siteId}/

11. Return JSON response
```

---

## 7. Error Handling

| Error | HTTP Code | Behavior |
|---|---|---|
| Invalid URL | 400 | Return error message |
| Fetch timeout | 200 | Mark page as failed, continue with others |
| robots.txt blocks | 200 | Mark as blocked in issues, skip crawl |
| Sitemap not found | 200 | Issue warning, crawl homepage only |
| All pages failed | 500 | Return error status |
| Generator throws | 500 | Log error, return partial results if possible |

Never crash the server. Always return a JSON response.

---

## 8. Tech Stack

| Component | Package | Version |
|---|---|---|
| HTTP server | `express` | ^4.18 |
| HTML fetch | `node-fetch` or native fetch (Node 22+) | built-in |
| HTML parsing | `cheerio` | ^1.0 |
| Article extraction | `@mozilla/readability` + `jsdom` | latest |
| HTML → Markdown | `turndown` | ^7.1 |
| XML parsing | `fast-xml-parser` | ^4.3 |
| robots.txt | `robots-parser` | ^3.0 |
| URL utilities | `URL` (built-in) | — |
| File system | `fs/promises` (built-in) | — |
| Content hash | `crypto` (built-in) | — |
| CORS | `cors` | ^2.8 |

**No database required for MVP.** All state is on disk in `/generated/`.

---

## 9. Configuration

`server/config.js`:
```js
export default {
  port: process.env.PORT || 3001,
  crawlTimeout: 8000,          // ms per page fetch
  maxPages: 5,                 // max pages per audit
  maxSitemapUrls: 20,          // max URLs to read from sitemap
  userAgent: "GlassGateBot/0.1 (+https://glasgate.ai/bot)",
  generatedDir: "./generated",
  allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"]
}
```

---

## 10. package.json (server)

```json
{
  "name": "glassgate-server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "start": "node server/index.js",
    "dev:server": "node --watch server/index.js",
    "test": "node --test tests/"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "cheerio": "^1.0.0",
    "@mozilla/readability": "^0.5.0",
    "jsdom": "^25.0.0",
    "turndown": "^7.1.3",
    "fast-xml-parser": "^4.3.6",
    "robots-parser": "^3.0.1"
  }
}
```

---

## 11. Frontend ↔ Backend Contract

The Vite frontend (port 5173) proxies `/api` and `/generated` to the Express server (port 3001).

**vite.config.js** (Codex must add this):
```js
server: {
  proxy: {
    '/api': 'http://localhost:3001',
    '/generated': 'http://localhost:3001'
  }
}
```

The frontend calls:
- `POST /api/audit` → start audit
- `GET /generated/{siteId}/llms.txt` → display file content
- `GET /generated/{siteId}/ai-index.json` → display index

---

## 12. Demo Fixture

Pre-built fixture for offline demo fallback at `/generated/demo-glasgate/`.

This is committed to git so the demo works without running a real crawl.  
The fixture simulates an audit of `https://glasgate.ai` itself.

---

## 13. Constraints

- No authentication in MVP
- No database
- No queue (synchronous crawl per request)
- No multi-tenant
- No rate limiting (add in production)
- No real-time streaming (respond when done)
- Max 5 pages per audit to keep response time under 15 seconds
- No crawling behind login walls
- No JavaScript rendering (plain HTML fetch only — no Playwright in MVP)

---

## 14. Division of Work

| What | Who |
|---|---|
| `server/` — all backend code | **Claude** (this session) |
| `src/` — Vite + React frontend | **Codex** |
| `vite.config.js` + proxy setup | **Codex** |
| `tests/` — unit tests | Claude writes stubs, Codex fills |
| `generated/demo-glasgate/` fixture | **Claude** creates |
| `README.md` updates | Claude updates after backend is done |

---

## 15. Codex Handoff Prompt

```
You are the frontend engineer for glasgate.ai.

The backend is already implemented by Claude in server/.
It runs on port 3001.

Your tasks:

1. Add vite.config.js with proxy for /api and /generated → http://localhost:3001

2. Update src/main.jsx to wire the Audit page to the real backend:
   - POST /api/audit with { url }
   - Show loading state while waiting
   - On success: display score, metrics, artifact links, issue list
   - On error: show error message

3. Add file preview tabs in the Audit Dashboard:
   - Fetch /generated/{siteId}/llms.txt and display raw text
   - Fetch /generated/{siteId}/ai-index.json and display formatted JSON
   - Fetch first .md page and display Markdown

4. The backend response shape is:
{
  siteId, status, score, pagesProcessed, pagesFound,
  artifacts: { llmsTxt, llmsFullTxt, aiIndex, pages: [{url, markdown, json}] },
  metrics: { htmlTokensEstimate, markdownTokensEstimate, estimatedSavingsPercent, crawlMs },
  checks: { robotsTxt, sitemapXml, canonicalUrls, metaDescription, h1Structure, structuredData, llmsTxtExists },
  issues: [{ severity, message }]
}

5. If /api/audit fails or returns an error, fall back to showing
   the pre-built demo fixture at /generated/demo-glasgate/

Do not modify server/ files.
Do not change the overall page structure or navigation.
Keep the existing design system (CSS variables, component names).
```

---

*This document is the single source of truth for the backend.*  
*Frontend contract is in section 11. Codex prompt is in section 15.*
