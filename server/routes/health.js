import { Router } from "express";
import { cacheStats } from "../lib/cache.js";
import { listJobs } from "../lib/jobStore.js";

const router = Router();
const startTime = Date.now();

/**
 * GET /api/health
 * Basic health check — returns 200 if server is running.
 */
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/detailed
 * Detailed health check with subsystem status.
 */
router.get("/health/detailed", (_req, res) => {
  const jobs = listJobs({ limit: 1000 });
  const cache = cacheStats();

  res.json({
    status: "ok",
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    subsystems: {
      jobStore: {
        status: "ok",
        totalJobs: jobs.total,
      },
      cache: {
        status: "ok",
        ...cache,
      },
    },
  });
});

/**
 * GET /api/metrics
 * Basic operational metrics.
 */
router.get("/metrics", (_req, res) => {
  const jobs = listJobs({ limit: 1000 });
  const byStatus = { pending: 0, running: 0, completed: 0, failed: 0 };
  for (const job of jobs.jobs) byStatus[job.status] = (byStatus[job.status] || 0) + 1;

  const completedJobs = jobs.jobs.filter((j) => j.status === "completed" && j.result);
  const avgScore = completedJobs.length
    ? Math.round(completedJobs.reduce((s, j) => s + (j.result?.score || 0), 0) / completedJobs.length)
    : null;
  const avgCrawlMs = completedJobs.length
    ? Math.round(completedJobs.reduce((s, j) => s + (j.result?.metrics?.crawlMs || 0), 0) / completedJobs.length)
    : null;

  res.json({
    uptime: Math.floor((Date.now() - startTime) / 1000),
    jobs: { total: jobs.total, byStatus },
    cache: cacheStats(),
    averages: { score: avgScore, crawlMs: avgCrawlMs },
    memory: process.memoryUsage(),
  });
});

export default router;
