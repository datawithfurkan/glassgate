import { Router } from "express";
import { loadSiteResult, siteExists, listSites } from "../lib/store.js";
import { validateSiteId, parsePagination } from "../lib/validator.js";

const router = Router();

/**
 * GET /api/sites
 * List all indexed sites with pagination.
 */
router.get("/", async (req, res) => {
  const { limit, offset } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  try {
    const result = await listSites({ limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: "Failed to list sites",
      message: err.message,
      reqId: req.requestId,
    });
  }
});

/**
 * GET /api/sites/:siteId
 * Get the full ai-index.json result for a site.
 */
router.get("/:siteId", async (req, res) => {
  const validation = validateSiteId(req.params.siteId);
  if (!validation.valid) {
    return res.status(400).json({
      error: "Invalid siteId",
      message: validation.error,
      reqId: req.requestId,
    });
  }

  const { siteId } = req.params;

  if (!(await siteExists(siteId))) {
    return res.status(404).json({
      error: "Site not found",
      siteId,
      reqId: req.requestId,
    });
  }

  const result = await loadSiteResult(siteId);
  if (!result) {
    return res.status(404).json({
      error: "Audit result not found",
      siteId,
      reqId: req.requestId,
    });
  }

  res.json(result);
});

/**
 * GET /api/sites/:siteId/artifacts
 * Returns only artifact paths for a site.
 */
router.get("/:siteId/artifacts", async (req, res) => {
  const validation = validateSiteId(req.params.siteId);
  if (!validation.valid) {
    return res.status(400).json({
      error: "Invalid siteId",
      message: validation.error,
      reqId: req.requestId,
    });
  }

  const { siteId } = req.params;
  const result = await loadSiteResult(siteId);

  if (!result) {
    return res.status(404).json({
      error: "Site not found",
      siteId,
      reqId: req.requestId,
    });
  }

  res.json({
    siteId,
    artifacts: result.artifacts,
    pages: result.pages,
    reqId: req.requestId,
  });
});

/**
 * GET /api/sites/:siteId/score
 * Returns score and checks only.
 */
router.get("/:siteId/score", async (req, res) => {
  const validation = validateSiteId(req.params.siteId);
  if (!validation.valid) {
    return res.status(400).json({
      error: "Invalid siteId",
      message: validation.error,
      reqId: req.requestId,
    });
  }

  const { siteId } = req.params;
  const result = await loadSiteResult(siteId);

  if (!result) {
    return res.status(404).json({
      error: "Site not found",
      siteId,
      reqId: req.requestId,
    });
  }

  res.json({
    siteId,
    score: result.agentReadinessScore,
    checks: result.checks,
    issues: result.issues,
    reqId: req.requestId,
  });
});

/**
 * GET /api/sites/:siteId/metrics
 * Returns token savings and performance metrics.
 */
router.get("/:siteId/metrics", async (req, res) => {
  const validation = validateSiteId(req.params.siteId);
  if (!validation.valid) {
    return res.status(400).json({
      error: "Invalid siteId",
      message: validation.error,
      reqId: req.requestId,
    });
  }

  const { siteId } = req.params;
  const result = await loadSiteResult(siteId);

  if (!result) {
    return res.status(404).json({
      error: "Site not found",
      siteId,
      reqId: req.requestId,
    });
  }

  res.json({
    siteId,
    metrics: result.metrics,
    reqId: req.requestId,
  });
});

export default router;
