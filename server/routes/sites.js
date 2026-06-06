import { Router } from "express";
import { loadSiteResult, siteExists, listSites } from "../lib/store.js";

const router = Router();

/**
 * GET /api/sites
 * List all indexed sites with pagination.
 *
 * Query: limit (default 20), offset (default 0)
 */
router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await listSites({ limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to list sites", message: err.message });
  }
});

/**
 * GET /api/sites/:siteId
 * Get the full audit result for a site.
 */
router.get("/:siteId", async (req, res) => {
  const { siteId } = req.params;

  if (!(await siteExists(siteId))) {
    return res.status(404).json({ error: "Site not found", siteId });
  }

  const result = await loadSiteResult(siteId);
  if (!result) {
    return res.status(404).json({ error: "Audit result not found", siteId });
  }

  res.json(result);
});

/**
 * GET /api/sites/:siteId/artifacts
 * Returns only artifact paths for a site.
 */
router.get("/:siteId/artifacts", async (req, res) => {
  const { siteId } = req.params;
  const result = await loadSiteResult(siteId);

  if (!result) {
    return res.status(404).json({ error: "Site not found", siteId });
  }

  res.json({
    siteId,
    artifacts: result.artifacts,
    pages: result.pages,
  });
});

/**
 * GET /api/sites/:siteId/score
 * Returns score and checks only.
 */
router.get("/:siteId/score", async (req, res) => {
  const { siteId } = req.params;
  const result = await loadSiteResult(siteId);

  if (!result) {
    return res.status(404).json({ error: "Site not found", siteId });
  }

  res.json({
    siteId,
    score: result.agentReadinessScore,
    checks: result.checks,
    issues: result.issues,
  });
});

/**
 * GET /api/sites/:siteId/metrics
 * Returns token savings and performance metrics.
 */
router.get("/:siteId/metrics", async (req, res) => {
  const { siteId } = req.params;
  const result = await loadSiteResult(siteId);

  if (!result) {
    return res.status(404).json({ error: "Site not found", siteId });
  }

  res.json({
    siteId,
    metrics: result.metrics,
  });
});

export default router;
