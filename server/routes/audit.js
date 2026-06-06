import { Router } from "express";
import { validateUrl, siteIdFromUrl, pageSlugFromUrl } from "../lib/validator.js";
import { fetchPage, fetchText } from "../lib/fetcher.js";
import { fetchRobots } from "../lib/robots.js";
import { fetchSitemap, buildCrawlQueue } from "../lib/sitemap.js";
import { extractPage } from "../lib/extractor.js";
import { normalizePage } from "../lib/normalizer.js";
import { scoreSite } from "../lib/scorer.js";
import { compareTokens } from "../lib/tokenEstimator.js";
import { saveSiteArtifacts } from "../lib/store.js";
import { generateMarkdown } from "../lib/generators/markdown.js";
import { generatePageJson } from "../lib/generators/json.js";
import { generateLlmsTxt } from "../lib/generators/llmsTxt.js";
import { generateLlmsFullTxt } from "../lib/generators/llmsFullTxt.js";
import { generateAiIndex } from "../lib/generators/aiIndex.js";
import {
  createJob, markRunning, markCompleted, markFailed,
  appendLog, generateJobId,
} from "../lib/jobStore.js";
import { cacheGet, cacheSet } from "../lib/cache.js";
import { logger } from "../lib/logger.js";
import config from "../config.js";

const router = Router();

/**
 * POST /api/audit
 *
 * Start an async audit job. Returns immediately with a jobId.
 * Poll GET /api/jobs/:jobId for status and result.
 *
 * Body: { url: string, force?: boolean }
 *   force — bypass cache and re-crawl even if result exists
 */
router.post("/audit", async (req, res) => {
  const { url, force = false } = req.body;
  const reqLog = logger.child({ reqId: req.requestId });

  // 1. Validate
  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({
      error: "Invalid URL",
      message: validation.error,
      reqId: req.requestId,
    });
  }

  const { normalized: baseUrl } = validation;
  const siteId = siteIdFromUrl(baseUrl);

  // 2. Check cache
  if (!force) {
    const cached = cacheGet(siteId);
    if (cached) {
      reqLog.info("Cache hit", { siteId });
      return res.json({ ...cached, cached: true });
    }
  }

  // 3. Create job
  const jobId = generateJobId();
  createJob(jobId, baseUrl, siteId);

  // 4. Return immediately with jobId
  res.status(202).json({
    status: "accepted",
    jobId,
    siteId,
    url: baseUrl,
    pollUrl: `/api/jobs/${jobId}`,
    message: "Audit started. Poll pollUrl for status and result.",
  });

  // 5. Run audit asynchronously (fire and forget)
  runAudit(jobId, baseUrl, siteId, reqLog).catch((err) => {
    reqLog.error("Unhandled audit error", { jobId, error: err.message });
    markFailed(jobId, err);
  });
});

/**
 * POST /api/audit/sync
 *
 * Synchronous audit — waits for completion and returns the full result.
 * Useful for quick testing. Not recommended for production (can be slow).
 *
 * Body: { url: string, force?: boolean }
 */
router.post("/audit/sync", async (req, res) => {
  const { url, force = false } = req.body;
  const reqLog = logger.child({ reqId: req.requestId });

  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({
      error: "Invalid URL",
      message: validation.error,
    });
  }

  const { normalized: baseUrl } = validation;
  const siteId = siteIdFromUrl(baseUrl);

  if (!force) {
    const cached = cacheGet(siteId);
    if (cached) return res.json({ ...cached, cached: true });
  }

  const jobId = generateJobId();
  createJob(jobId, baseUrl, siteId);

  try {
    const result = await runAudit(jobId, baseUrl, siteId, reqLog);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Audit failed", message: err.message, jobId });
  }
});

/**
 * Core audit logic — shared by both sync and async routes.
 * @returns {Promise<Object>} Full audit result
 */
async function runAudit(jobId, baseUrl, siteId, log) {
  markRunning(jobId);
  appendLog(jobId, `Starting audit for ${baseUrl}`);

  const startTime = Date.now();

  // Step 1: robots.txt
  appendLog(jobId, "Fetching robots.txt");
  const robots = await fetchRobots(baseUrl);
  const siteChecks = {
    robotsTxt: robots.exists,
    sitemapXml: false,
    llmsTxtExists: false,
  };

  if (!robots.allowsGlassGate) {
    const err = new Error("robots.txt disallows GlassGateBot for this site");
    err.code = "ROBOTS_DISALLOWED";
    markFailed(jobId, err);
    throw err;
  }

  // Step 2: llms.txt check
  appendLog(jobId, "Checking for existing llms.txt");
  const existingLlms = await fetchText(new URL("/llms.txt", baseUrl).href);
  siteChecks.llmsTxtExists = !!existingLlms;

  // Step 3: sitemap
  appendLog(jobId, "Fetching sitemap.xml");
  const sitemap = await fetchSitemap(baseUrl, robots.raw);
  siteChecks.sitemapXml = sitemap.exists;

  // Step 4: build queue
  const queue = buildCrawlQueue(baseUrl, sitemap.urls, config.maxPages);
  appendLog(jobId, `Crawl queue: ${queue.length} URL(s)`);

  // Step 5: crawl
  const crawledPages = [];
  let totalHtmlChars = 0;

  for (const pageUrl of queue) {
    appendLog(jobId, `Crawling ${pageUrl}`);
    const result = await fetchPage(pageUrl);
    if (!result.ok) {
      appendLog(jobId, `  ↳ Failed: ${result.error}`);
      continue;
    }
    totalHtmlChars += result.html.length;
    const raw = extractPage(result.html, result.finalUrl || pageUrl);
    const normalized = normalizePage(raw);
    crawledPages.push(normalized);
    appendLog(jobId, `  ↳ OK: "${normalized.title}" (${normalized.wordCount} words)`);
  }

  if (crawledPages.length === 0) {
    const err = new Error("All page fetches failed. The site may be blocking automated access.");
    err.code = "NO_PAGES_CRAWLED";
    markFailed(jobId, err);
    throw err;
  }

  // Step 6: score
  appendLog(jobId, "Scoring site");
  const scoreResult = scoreSite(crawledPages, siteChecks);

  // Step 7: slugs
  const pageSlugs = crawledPages.map((p) => ({
    url: p.url,
    slug: pageSlugFromUrl(p.url),
    title: p.title,
    description: p.description,
  }));

  // Step 8: generate artifacts
  appendLog(jobId, "Generating artifacts");
  const siteData = {
    url: baseUrl,
    title: crawledPages[0]?.title || new URL(baseUrl).hostname,
    description: crawledPages[0]?.description || "",
    language: crawledPages[0]?.language || "en",
    pages: pageSlugs,
    pageSlugs,
  };

  const pageArtifacts = crawledPages.map((page, i) => {
    const slug = pageSlugs[i].slug;
    return {
      slug,
      markdown: generateMarkdown(page),
      json: generatePageJson(page, siteId, slug),
    };
  });

  const allMarkdown = pageArtifacts.map((p) => p.markdown).join("\n\n");
  const metrics = compareTokens("x".repeat(totalHtmlChars), allMarkdown);

  const llmsTxt     = generateLlmsTxt(siteData, siteId);
  const llmsFullTxt = generateLlmsFullTxt(crawledPages, baseUrl);
  const aiIndex     = generateAiIndex(siteData, crawledPages, scoreResult, siteId, metrics);

  // Step 9: save
  appendLog(jobId, "Saving artifacts to disk");
  await saveSiteArtifacts(siteId, { llmsTxt, llmsFullTxt, aiIndex, pages: pageArtifacts });

  const crawlMs = Date.now() - startTime;

  const result = {
    status: "completed",
    jobId,
    siteId,
    url: baseUrl,
    score: scoreResult.score,
    pagesFound: sitemap.urls.length + 1,
    pagesProcessed: crawledPages.length,
    artifacts: {
      llmsTxt:     `/generated/${siteId}/llms.txt`,
      llmsFullTxt: `/generated/${siteId}/llms-full.txt`,
      aiIndex:     `/generated/${siteId}/ai-index.json`,
      pages: pageSlugs.map(({ url: u, slug }) => ({
        url: u,
        markdown: `/generated/${siteId}/pages/${slug}.md`,
        json:     `/generated/${siteId}/pages/${slug}.json`,
      })),
    },
    metrics: {
      htmlTokensEstimate:      metrics.htmlEstimate,
      markdownTokensEstimate:  metrics.markdownEstimate,
      estimatedSavingsPercent: metrics.estimatedSavingsPercent,
      crawlMs,
    },
    checks: scoreResult.checks,
    issues: scoreResult.issues,
  };

  // Step 10: cache + complete
  cacheSet(siteId, result);
  markCompleted(jobId, result);
  appendLog(jobId, `Done in ${crawlMs}ms. Score: ${scoreResult.score}/100`);

  log.info("Audit complete", { jobId, siteId, score: scoreResult.score, crawlMs });

  return result;
}

export default router;
