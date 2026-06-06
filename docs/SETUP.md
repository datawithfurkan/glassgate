# glasgate.ai — Setup Guide

**Last updated:** 2026-06-06

---

## Requirements

- Node.js 20+
- npm 9+
- Git

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/datawithfurkan/glassgate.git
cd glassgate

# 2. Install dependencies
npm install
npm run install:server

# 3. Configure (optional)
cp .env.example .env

# 4. Start backend (Terminal 1)
npm run dev:server
# → http://localhost:3001

# 5. Start frontend (Terminal 2)
npm run dev
# → http://127.0.0.1:5173
```

---

## Test the API

```bash
# Health (no auth)
curl http://localhost:3001/api/health

# Async audit (recommended)
curl -X POST http://localhost:3001/api/audit \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
# → { "jobId": "job_abc123", "pollUrl": "/api/jobs/job_abc123" }

# Poll for result
curl http://localhost:3001/api/jobs/job_abc123

# Sync audit (simpler for testing)
curl -X POST http://localhost:3001/api/audit/sync \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Search indexed sites
curl "http://localhost:3001/api/search?q=example"

# List all sites
curl http://localhost:3001/api/sites

# Metrics (requires auth when GLASGATE_API_KEY is set)
curl http://localhost:3001/api/metrics
```

---

## Run Tests

```bash
# Unit tests — no server required
npm run test:unit

# E2E tests — server must be running on port 3001
npm run test:e2e

# All tests
npm test
```

---

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```env
PORT=3001
NODE_ENV=development
GLASGATE_API_KEY=
ALLOWED_ORIGINS=
CRAWL_TIMEOUT=8000
MAX_PAGES=5
MAX_SITEMAP_URLS=20
BOT_USER_AGENT=GlassGateBot/0.1 (+https://glasgate.ai/bot)
CACHE_TTL_MS=600000
GENERATED_DIR=./generated
LOG_LEVEL=info
```

---

## npm Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite --host 127.0.0.1` | Start frontend dev server |
| `npm run dev:server` | `node --watch server/index.js` | Start backend with hot reload |
| `npm run build` | `vite build` | Build frontend for production |
| `npm run start:server` | `node server/index.js` | Start backend (production) |
| `npm run install:server` | `cd server && npm install` | Install backend deps |
| `npm run test:unit` | `node server/tests/unit.js` | Run unit tests |
| `npm run test:e2e` | `node server/tests/e2e.js` | Run E2E tests (server required) |
| `npm test` | unit + e2e | Run all tests |

---

## Project Structure

```
glassgate/
├── src/                          Frontend (Vite + React)
├── server/                       Backend (Express + ESM)
│   ├── index.js                  Entry point
│   ├── config.js                 All settings (env-var driven)
│   ├── middleware/               Auth, rate limit, logging, tracing
│   ├── routes/                   audit, jobs, sites, search, health
│   ├── lib/                      Crawler pipeline + generators
│   └── tests/                    Unit + E2E test suites
├── generated/                    Output artifacts (gitignored)
│   └── demo-glasgate/            Pre-built demo fixture (committed)
├── docs/                         API, setup, architecture
├── .env.example                  Backend configuration template
├── index.html                    Vite entry
├── package.json                  Root package (frontend + scripts)
└── vite.config.js                Vite config + API proxy
```

---

## Generated Artifacts

After a successful audit of `example.com`, files appear at:

```
generated/
└── example-com/
    ├── llms.txt
    ├── llms-full.txt
    ├── ai-index.json
    └── pages/
        ├── home.md
        ├── home.json
        └── ...
```

Served as static files:
```
GET http://localhost:3001/generated/example-com/llms.txt
GET http://localhost:3001/generated/example-com/ai-index.json
```

**Note:** All runtime artifacts are written to `{projectRoot}/generated/`, not `server/generated/`.

---

## Demo Fixture

`generated/demo-glasgate/` is committed to git and pre-populated. It lets the frontend demo work without running a real crawl.

Contents:
- `llms.txt`, `llms-full.txt`, `ai-index.json`
- `pages/home.md`, `pages/home.json`
- `pages/platform.md`, `pages/platform.json`

---

## Deployment

### Backend (Railway / Render / Fly.io)

```bash
# Start command
node server/index.js

# Environment
NODE_ENV=production
PORT=3001
GLASGATE_API_KEY=your-secret-key
```

### Frontend (Vercel)

Frontend deploys as a static SPA. Configure the Vite proxy in development; in production, point API calls to your deployed backend URL.

`vercel.json` only handles the frontend — the Express backend must be deployed separately.

---

## See Also

- [API Reference](./API.md) — all endpoints, schemas, error codes
- [Architecture](./BACKEND_ARCHITECTURE.md) — system design, data flow, upgrade path
