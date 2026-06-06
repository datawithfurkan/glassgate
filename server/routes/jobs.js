import { Router } from "express";
import { getJob, listJobs } from "../lib/jobStore.js";

const router = Router();

/**
 * GET /api/jobs
 * List all jobs with optional filtering and pagination.
 *
 * Query params:
 *   status  — filter by status (pending|running|completed|failed)
 *   limit   — max results (default 20, max 100)
 *   offset  — pagination offset (default 0)
 */
router.get("/", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const { status } = req.query;

  const result = listJobs({ limit, offset, status });

  res.json({
    ...result,
    limit,
    offset,
  });
});

/**
 * GET /api/jobs/:jobId
 * Get a single job by ID.
 */
router.get("/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      error: "Job not found",
      jobId: req.params.jobId,
    });
  }

  res.json(job);
});

export default router;
