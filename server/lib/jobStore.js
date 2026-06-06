/**
 * In-memory job store for async audit jobs.
 * In production, replace with Redis + BullMQ.
 *
 * Job lifecycle: pending → running → completed | failed
 */

import { logger } from "./logger.js";

/** @type {Map<string, Job>} */
const jobs = new Map();

/** Max jobs to keep in memory (oldest are evicted) */
const MAX_JOBS = 500;

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {"pending"|"running"|"completed"|"failed"} status
 * @property {string} url
 * @property {string} siteId
 * @property {number} createdAt
 * @property {number|null} startedAt
 * @property {number|null} completedAt
 * @property {Object|null} result
 * @property {string|null} error
 * @property {string[]} logs
 */

export function createJob(id, url, siteId) {
  const job = {
    id,
    status: "pending",
    url,
    siteId,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
    logs: [],
  };

  // Evict oldest jobs if at capacity
  if (jobs.size >= MAX_JOBS) {
    const oldest = [...jobs.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) jobs.delete(oldest[0]);
  }

  jobs.set(id, job);
  logger.info("Job created", { jobId: id, url, siteId });
  return job;
}

export function getJob(id) {
  return jobs.get(id) ?? null;
}

export function listJobs({ limit = 20, offset = 0, status } = {}) {
  let all = [...jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
  if (status) all = all.filter((j) => j.status === status);
  return {
    total: all.length,
    jobs: all.slice(offset, offset + limit),
  };
}

export function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, patch);
  return job;
}

export function markRunning(id) {
  return updateJob(id, { status: "running", startedAt: Date.now() });
}

export function markCompleted(id, result) {
  logger.info("Job completed", { jobId: id });
  return updateJob(id, { status: "completed", completedAt: Date.now(), result });
}

export function markFailed(id, error) {
  logger.error("Job failed", { jobId: id, error });
  return updateJob(id, { status: "failed", completedAt: Date.now(), error: error?.message ?? String(error) });
}

export function appendLog(id, message) {
  const job = jobs.get(id);
  if (!job) return;
  job.logs.push(`[${new Date().toISOString()}] ${message}`);
}

/** Generate a short unique job ID */
export function generateJobId() {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
