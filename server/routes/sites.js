import { Router } from "express";
import { loadSiteResult, siteExists } from "../lib/store.js";

const router = Router();

// GET /api/sites/:siteId/artifacts
router.get("/:siteId/artifacts", async (req, res) => {
  const { siteId } = req.params;

  if (!(await siteExists(siteId))) {
    return res.status(404).json({ error: "Site not found", siteId });
  }

  const result = await loadSiteResult(siteId);
  if (!result) {
    return res.status(404).json({ error: "Artifacts not found", siteId });
  }

  res.json({
    siteId,
    artifacts: result.artifacts,
    pages: result.pages,
  });
});

// GET /api/sites/:siteId/score
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

export default router;
