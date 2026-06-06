import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import config from "./config.js";
import { logger } from "./lib/logger.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLoggerMiddleware } from "./middleware/requestLogger.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { apiKeyAuth } from "./middleware/apiKey.js";

import healthRouter, { metricsHandler } from "./routes/health.js";
import auditRouter from "./routes/audit.js";
import sitesRouter from "./routes/sites.js";
import jobsRouter from "./routes/jobs.js";
import searchRouter from "./routes/search.js";

const app = express();

app.set("trust proxy", 1);
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(cors({ origin: config.allowedOrigins, exposedHeaders: ["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"] }));
app.use(express.json({ limit: "1mb" }));

app.use("/generated", express.static(config.generatedDir));

app.use("/api", healthRouter);

const apiLimiter = rateLimit({ windowMs: 60_000, max: 60 });

app.use("/api", apiKeyAuth);
app.use("/api", apiLimiter);
app.get("/api/metrics", metricsHandler);
app.use("/api/sites",  sitesRouter);
app.use("/api/jobs",   jobsRouter);
app.use("/api/search", searchRouter);
app.use("/api", auditRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    reqId: req.requestId,
  });
});

app.use((err, req, res, _next) => {
  logger.error("Unhandled error", { error: err.message, reqId: req.requestId });
  res.status(500).json({
    error: "Internal server error",
    message: config.nodeEnv === "production" ? "An unexpected error occurred" : err.message,
    reqId: req.requestId,
  });
});

async function ensureGeneratedDir() {
  await fs.mkdir(config.generatedDir, { recursive: true });
  const probe = path.join(config.generatedDir, ".write-test");
  await fs.writeFile(probe, "ok", "utf8");
  await fs.unlink(probe);
}

async function start() {
  await ensureGeneratedDir();

  const server = app.listen(config.port, "127.0.0.1", () => {
    logger.info("glasgate.ai backend started", { port: config.port, host: "127.0.0.1" });
    console.log(`
  ┌─────────────────────────────────────────┐
  │  🟢  glasgate.ai API  v0.1.0            │
  │                                         │
  │  http://127.0.0.1:${config.port}              │
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

  const shutdown = (signal) => {
    logger.info("Shutting down", { signal });
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  start().catch((err) => {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  });
}

export { app, start };
