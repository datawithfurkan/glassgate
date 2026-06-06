import { Router } from "express";
import { getJob, listJobs } from "../lib/jobStore.js";
import { parsePagination, validateJobStatus } from "../lib/validator.js";

const router = Router();

/**
 * GET /api/jobs
 * List all jobs with optional filtering and pagination.
 */
router.get("/", (req, res) => {
  const { limit, offset } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const { status } = req.query;

  const statusValidation = validateJobStatus(status);
  if (!statusValidation.valid) {
    return res.status(400).json({
      error: "Invalid status",
      message: statusValidation.error,
      reqId: req.requestId,
    });
  }

  const result = listJobs({ limit, offset, status });

  res.json({
    ...result,
    limit,
    offset,
    reqId: req.requestId,
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
      reqId: req.requestId,
    });
  }

  res.json({ ...job, reqId: req.requestId });
});

export default router;
