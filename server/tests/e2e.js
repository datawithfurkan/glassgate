/**
 * glasgate.ai — End-to-End Test Suite
 *
 * Tests the full audit pipeline against a live backend.
 * Run: node server/tests/e2e.js
 *
 * Requirements: server must be running on PORT (default 3001)
 */

const BASE_URL = `http://localhost:${process.env.PORT || 3001}`;
const TEST_URL  = process.env.TEST_URL || "https://example.com";
const TIMEOUT   = 30_000; // 30s max per test

let passed = 0;
let failed = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(emoji, label, detail = "") {
  console.log(`  ${emoji}  ${label}${detail ? `  →  ${detail}` : ""}`);
}

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

async function post(path, data) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { status: res.status, body };
}

function assert(label, condition, detail = "") {
  if (condition) {
    log("✅", label, detail);
    passed++;
  } else {
    log("❌", label, detail);
    failed++;
  }
}

async function poll(jobId, timeoutMs = TIMEOUT) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { body } = await get(`/api/jobs/${jobId}`);
    if (body.status === "completed") return body;
    if (body.status === "failed") return body;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

async function testHealth() {
  console.log("\n── Health ──────────────────────────────────────");

  const { status, body } = await get("/api/health");
  assert("GET /api/health returns 200", status === 200);
  assert("status is ok", body.status === "ok");
  assert("version present", !!body.version, body.version);
  assert("uptime is a number", typeof body.uptime === "number");

  const { status: ds, body: db } = await get("/api/health/detailed");
  assert("GET /api/health/detailed returns 200", ds === 200);
  assert("subsystems.jobStore present", !!db.subsystems?.jobStore);
  assert("subsystems.cache present", !!db.subsystems?.cache);
}

async function testMetrics() {
  console.log("\n── Metrics ─────────────────────────────────────");

  const { status, body } = await get("/api/metrics");
  assert("GET /api/metrics returns 200", status === 200);
  assert("jobs object present", !!body.jobs);
  assert("cache object present", !!body.cache);
  assert("memory object present", !!body.memory);
}

async function testValidation() {
  console.log("\n── Input Validation ────────────────────────────");

  const { status: s1 } = await post("/api/audit/sync", { url: "" });
  assert("Empty URL returns 400", s1 === 400);

  const { status: s2 } = await post("/api/audit/sync", { url: "not-a-url" });
  assert("Invalid URL returns 400", s2 === 400);

  const { status: s3 } = await post("/api/audit/sync", { url: "ftp://example.com" });
  assert("Non-http URL returns 400", s3 === 400);

  const { status: s4 } = await post("/api/audit/sync", {});
  assert("Missing URL returns 400", s4 === 400);
}

async function testSyncAudit() {
  console.log(`\n── Sync Audit (${TEST_URL}) ──────────────────────`);

  const { status, body } = await post("/api/audit/sync", { url: TEST_URL });

  assert("POST /api/audit/sync returns 200", status === 200, `got ${status}`);
  assert("status is completed", body.status === "completed");
  assert("siteId present", !!body.siteId, body.siteId);
  assert("score is 0–100", typeof body.score === "number" && body.score >= 0 && body.score <= 100, `${body.score}/100`);
  assert("pagesProcessed >= 1", body.pagesProcessed >= 1, `${body.pagesProcessed} pages`);
  assert("artifacts.llmsTxt present", !!body.artifacts?.llmsTxt);
  assert("artifacts.llmsFullTxt present", !!body.artifacts?.llmsFullTxt);
  assert("artifacts.aiIndex present", !!body.artifacts?.aiIndex);
  assert("artifacts.pages is array", Array.isArray(body.artifacts?.pages));
  assert("metrics.htmlTokensEstimate > 0", body.metrics?.htmlTokensEstimate > 0);
  assert("metrics.markdownTokensEstimate > 0", body.metrics?.markdownTokensEstimate > 0);
  assert("metrics.estimatedSavingsPercent >= 0", body.metrics?.estimatedSavingsPercent >= 0);
  assert("checks object present", !!body.checks);
  assert("issues is array", Array.isArray(body.issues));
  assert("crawlMs > 0", body.metrics?.crawlMs > 0, `${body.metrics?.crawlMs}ms`);

  return body;
}

async function testAsyncAudit() {
  console.log(`\n── Async Audit (${TEST_URL}) ─────────────────────`);

  const { status, body } = await post("/api/audit", { url: TEST_URL, force: true });

  assert("POST /api/audit returns 202", status === 202, `got ${status}`);
  assert("jobId present", !!body.jobId, body.jobId);
  assert("pollUrl present", !!body.pollUrl);
  assert("status is accepted", body.status === "accepted");

  console.log(`     ⏳ Polling job ${body.jobId}...`);
  const job = await poll(body.jobId);

  assert("job completed", job.status === "completed", `got: ${job.status}`);
  assert("job.result present", !!job.result);
  assert("job.logs is array", Array.isArray(job.logs));
  assert("job.logs not empty", job.logs.length > 0, `${job.logs.length} log entries`);
  assert("completedAt set", !!job.completedAt);

  return job;
}

async function testCaching() {
  console.log("\n── Caching ──────────────────────────────────────");

  // Second request without force should be cached
  const { body } = await post("/api/audit/sync", { url: TEST_URL });
  assert("Second request returns cached result", body.cached === true, `cached: ${body.cached}`);

  // Force bypass
  const { body: forced } = await post("/api/audit/sync", { url: TEST_URL, force: true });
  assert("force:true bypasses cache", forced.cached !== true);
}

async function testGeneratedFiles(auditResult) {
  console.log("\n── Generated Files ──────────────────────────────");

  if (!auditResult?.siteId) return;

  const siteId = auditResult.siteId;

  const llms = await fetch(`${BASE_URL}/generated/${siteId}/llms.txt`);
  assert("llms.txt is accessible", llms.status === 200, `HTTP ${llms.status}`);

  const llmsText = await llms.text();
  assert("llms.txt starts with #", llmsText.trim().startsWith("#"));
  assert("llms.txt contains generator line", llmsText.includes("glasgate.ai"));

  const aiIndex = await fetch(`${BASE_URL}/generated/${siteId}/ai-index.json`);
  assert("ai-index.json is accessible", aiIndex.status === 200);

  const index = await aiIndex.json();
  assert("ai-index.json has site object", !!index.site);
  assert("ai-index.json has agentReadinessScore", typeof index.agentReadinessScore === "number");
  assert("ai-index.json has pages array", Array.isArray(index.pages));
  assert("ai-index.json has metrics", !!index.metrics);

  if (auditResult.artifacts?.pages?.[0]) {
    const mdPath = auditResult.artifacts.pages[0].markdown;
    const mdRes = await fetch(`${BASE_URL}${mdPath}`);
    assert("page.md is accessible", mdRes.status === 200);

    const md = await mdRes.text();
    assert("page.md has frontmatter", md.includes("---"));
    assert("page.md has title", md.includes("title:"));

    const jsonPath = auditResult.artifacts.pages[0].json;
    const jsonRes = await fetch(`${BASE_URL}${jsonPath}`);
    assert("page.json is accessible", jsonRes.status === 200);

    const pageJson = await jsonRes.json();
    assert("page.json has url", !!pageJson.url);
    assert("page.json has headings array", Array.isArray(pageJson.headings));
    assert("page.json has metadata.contentHash", !!pageJson.metadata?.contentHash);
    assert("page.json has content.markdownUrl", !!pageJson.content?.markdownUrl);
  }
}

async function testJobsAPI() {
  console.log("\n── Jobs API ─────────────────────────────────────");

  const { status, body } = await get("/api/jobs");
  assert("GET /api/jobs returns 200", status === 200);
  assert("jobs array present", Array.isArray(body.jobs));
  assert("total is number", typeof body.total === "number");
  assert("has at least 1 job", body.total >= 1, `total: ${body.total}`);

  // Filter by status
  const { body: completed } = await get("/api/jobs?status=completed");
  assert("Filter by status=completed works", Array.isArray(completed.jobs));
  assert("All returned jobs are completed",
    completed.jobs.every((j) => j.status === "completed"),
    `count: ${completed.jobs.length}`
  );

  // Pagination
  const { body: paged } = await get("/api/jobs?limit=1&offset=0");
  assert("Pagination limit works", paged.jobs.length <= 1);

  // 404 for unknown job
  const { status: s404 } = await get("/api/jobs/job_does_not_exist");
  assert("Unknown jobId returns 404", s404 === 404);
}

async function testSitesAPI(auditResult) {
  console.log("\n── Sites API ────────────────────────────────────");

  const { status, body } = await get("/api/sites");
  assert("GET /api/sites returns 200", status === 200);
  assert("sites array present", Array.isArray(body.sites));
  assert("has at least 1 site", body.total >= 1);

  if (!auditResult?.siteId) return;
  const siteId = auditResult.siteId;

  const { status: ss, body: site } = await get(`/api/sites/${siteId}`);
  assert(`GET /api/sites/${siteId} returns 200`, ss === 200);
  assert("site has agentReadinessScore", typeof site.agentReadinessScore === "number");

  const { body: score } = await get(`/api/sites/${siteId}/score`);
  assert("score endpoint returns score", typeof score.score === "number");
  assert("score endpoint returns checks", !!score.checks);

  const { body: metrics } = await get(`/api/sites/${siteId}/metrics`);
  assert("metrics endpoint returns metrics", !!metrics.metrics);

  const { body: artifacts } = await get(`/api/sites/${siteId}/artifacts`);
  assert("artifacts endpoint returns artifacts", !!artifacts.artifacts);

  const { status: s404 } = await get("/api/sites/does-not-exist");
  assert("Unknown siteId returns 404", s404 === 404);
}

async function testSearchAPI() {
  console.log("\n── Search API ───────────────────────────────────");

  const { status, body } = await get("/api/search?q=example");
  assert("GET /api/search returns 200", status === 200);
  assert("results array present", Array.isArray(body.results));
  assert("query echoed back", body.query === "example");
  assert("total is number", typeof body.total === "number");

  const { status: s400 } = await get("/api/search?q=x");
  assert("Single char query returns 400", s400 === 400);

  const { status: s400b } = await get("/api/search");
  assert("Missing query returns 400", s400b === 400);
}

async function testRateLimiting() {
  console.log("\n── Rate Limit Headers ───────────────────────────");

  const res = await fetch(`${BASE_URL}/api/sites`);
  assert("X-RateLimit-Limit header present", res.headers.has("x-ratelimit-limit"));
  assert("X-RateLimit-Remaining header present", res.headers.has("x-ratelimit-remaining"));
  assert("X-Request-ID header present", res.headers.has("x-request-id"));
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${"═".repeat(52)}`);
  console.log(`  glasgate.ai E2E Test Suite`);
  console.log(`  Backend: ${BASE_URL}`);
  console.log(`  Target:  ${TEST_URL}`);
  console.log(`${"═".repeat(52)}`);

  try {
    await testHealth();
    await testMetrics();
    await testValidation();
    await testRateLimiting();

    const syncResult = await testSyncAudit();
    await testCaching();
    await testGeneratedFiles(syncResult);
    await testSitesAPI(syncResult);

    await testAsyncAudit();
    await testJobsAPI();
    await testSearchAPI();

  } catch (err) {
    log("💥", "Unexpected error", err.message);
    failed++;
  }

  const total = passed + failed;
  console.log(`\n${"═".repeat(52)}`);
  console.log(`  Results: ${passed}/${total} passed  ${failed > 0 ? `❌ ${failed} failed` : "✅ all passed"}`);
  console.log(`${"═".repeat(52)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
