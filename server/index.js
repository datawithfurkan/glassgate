import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import config from "./config.js";
import { logger } from "./lib/logger.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLoggerMiddleware } from "./middleware/requestLogger.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { apiKeyAuth } from "./middleware/apiKey.js";

import healthRouter from "./routes/health.js";
import auditRouter from "./routes/audit.js";
import sitesRouter from "./routes/sites.js";
import jobsRouter from "./routes/jobs.js";
import searchRouter from "./routes/search.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.set("trust proxy", 1);
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(cors({ origin: config.allowedOrigins, exposedHeaders: ["X-Request-ID"] }));
app.use(express.json({ limit: "1mb" }));

// ─── Static: generated artifacts ─────────────────────────────────────────────

const generatedDir = path.resolve(__dirname, "..", config.generatedDir);
app.use("/generated", express.static(generatedDir));

// ─── Public Routes (no auth) ──────────────────────────────────────────────────

app.use("/api", healthRouter);

// ─── Rate-limited + Auth Routes ───────────────────────────────────────────────

const auditLimiter = rateLimit({ windowMs: 60_000, max: 10, message: "Audit rate limit: 10 requests/minute" });
const apiLimiter   = rateLimit({ windowMs: 60_000, max: 60 });

app.use("/api", apiKeyAuth);
app.use("/api", apiLimiter);
app.use("/api", auditLimiter, auditRouter);
app.use("/api/sites",  sitesRouter);
app.use("/api/jobs",   jobsRouter);
app.use("/api/search", searchRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    reqId: req.requestId,
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use((err, req, res, _next) => {
  logger.error("Unhandled error", { error: err.message, reqId: req.requestId });
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    reqId: req.requestId,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(config.port, () => {
  logger.info(`GlassGate backend started`, { port: config.port });
  console.log(`
  ┌─────────────────────────────────────────┐
  │  🟢  GlassGate API  v0.1.0              │
  │                                         │
  │  http://localhost:${config.port}                │
  │                                         │
  │  POST /api/audit                        │
  │  POST /api/audit/sync                   │
  │  GET  /api/jobs/:id                     │
  │  GET  /api/sites                        │
  │  GET  /api/search?q=...                 │
  │  GET  /api/health                       │
  │  GET  /api/metrics                      │
  └─────────────────────────────────────────┘
`);
});
