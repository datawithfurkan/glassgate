# GlassGate — Setup Guide

## Requirements

- Node.js 20+
- npm 9+

## Local Development

### 1. Clone

```bash
git clone https://github.com/datawithfurkan/glassgate.git
cd glassgate
```

### 2. Install frontend deps

```bash
npm install
```

### 3. Install backend deps

```bash
cd server && npm install && cd ..
```

### 4. Start both

**Terminal 1 — Backend:**
```bash
npm run dev:server
# → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# → http://localhost:5173
```

### 5. Test the API

```bash
# Health
curl http://localhost:3001/api/health

# Sync audit
curl -X POST http://localhost:3001/api/audit/sync \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

---

## Environment Variables

Create `.env` in the project root (optional):

```env
PORT=3001
NODE_ENV=development
GLASGATE_API_KEY=
CRAWL_TIMEOUT=8000
MAX_PAGES=5
LOG_LEVEL=info
```

---

## Project Structure

```
glassgate/
├── src/                    ← Vite + React frontend
│   ├── main.jsx
│   └── styles.css
├── server/                 ← Express backend
│   ├── index.js            ← Entry point
│   ├── config.js           ← All settings
│   ├── middleware/
│   │   ├── requestId.js
│   │   ├── requestLogger.js
│   │   ├── rateLimit.js
│   │   └── apiKey.js
│   ├── routes/
│   │   ├── audit.js        ← POST /api/audit
│   │   ├── jobs.js         ← GET /api/jobs
│   │   ├── sites.js        ← GET /api/sites
│   │   ├── search.js       ← GET /api/search
│   │   └── health.js       ← GET /api/health
│   └── lib/
│       ├── validator.js
│       ├── fetcher.js
│       ├── robots.js
│       ├── sitemap.js
│       ├── extractor.js
│       ├── normalizer.js
│       ├── scorer.js
│       ├── tokenEstimator.js
│       ├── logger.js
│       ├── jobStore.js
│       ├── cache.js
│       ├── store.js
│       └── generators/
│           ├── markdown.js
│           ├── json.js
│           ├── llmsTxt.js
│           ├── llmsFullTxt.js
│           └── aiIndex.js
├── generated/              ← Output artifacts (gitignored)
│   └── demo-glasgate/      ← Pre-built demo fixture
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   └── BACKEND_ARCHITECTURE.md
├── index.html
├── package.json
└── vite.config.js          ← (Codex adds this)
```

---

## API Overview

See [API.md](./API.md) for full reference.

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/health/detailed` | Subsystem status |
| GET | `/api/metrics` | Operational metrics |
| POST | `/api/audit` | Start async audit |
| POST | `/api/audit/sync` | Synchronous audit |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:id` | Job status + result |
| GET | `/api/sites` | List indexed sites |
| GET | `/api/sites/:id` | Full audit result |
| GET | `/api/sites/:id/score` | Score only |
| GET | `/api/sites/:id/metrics` | Metrics only |
| GET | `/api/search?q=` | Search sites |
| GET | `/generated/:id/llms.txt` | Generated llms.txt |
| GET | `/generated/:id/ai-index.json` | AI index JSON |
