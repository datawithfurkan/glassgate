import { Router } from "express";
import { rateLimit } from "../middleware/rateLimit.js";
import { validateUrl, siteIdFromUrl, pageSlugFromUrl } from "../lib/validator.js";
import { fetchPage, fetchText } from "../lib/fetcher.js";
import { fetchRobots, isAllowed } from "../lib/robots.js";
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
import { selectCuratedPages } from "../lib/urlRanker.js";
import {
  createJob, markRunning, markCompleted, markFailed,
  appendLog, generateJobId,
} from "../lib/jobStore.js";
import { cacheGet, cacheSet } from "../lib/cache.js";
import { logger } from "../lib/logger.js";
import config from "../config.js";

const router = Router();
const auditLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: "Audit rate limit: 10 requests/minute",
});

function auditErrorResponse(err, req, jobId) {
  if (err.code === "ROBOTS_DISALLOWED") {
    return {
      status: 403,
      body: {
        error: "Crawl not allowed",
        message: err.message,
        jobId,
        reqId: req.requestId,
      },
    };
  }

  if (err.code === "NO_PAGES_CRAWLED") {
    return {
      status: 500,
      body: {
        error: "Audit failed",
        message: err.message,
        jobId,
        reqId: req.requestId,
      },
    };
  }

  return {
    status: 500,
    body: {
      error: "Audit failed",
      message: err.message,
      jobId,
      reqId: req.requestId,
    },
  };
}

router.post("/audit", auditLimiter, async (req, res) => {
  const { url, force = false } = req.body;
  const reqLog = logger.child({ reqId: req.requestId });

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

  if (!force) {
    const cached = cacheGet(siteId);
    if (cached) {
      reqLog.info("Cache hit", { siteId });
      return res.json({ ...cached, cached: true });
    }
  }

  const robots = await fetchRobots(baseUrl);
  if (!robots.allowsGlassGate) {
    return res.status(403).json({
      error: "Crawl not allowed",
      message: `robots.txt disallows ${robots.botName} for this site`,
      reqId: req.requestId,
    });
  }

  const jobId = generateJobId();
  createJob(jobId, baseUrl, siteId);

  res.status(202).json({
    status: "accepted",
    jobId,
    siteId,
    url: baseUrl,
    pollUrl: `/api/jobs/${jobId}`,
    message: "Audit started. Poll pollUrl for status and result.",
    reqId: req.requestId,
  });

  runAudit(jobId, baseUrl, siteId, reqLog).catch((err) => {
    reqLog.error("Unhandled audit error", { jobId, error: err.message });
    markFailed(jobId, err);
  });
});

router.post("/audit/sync", auditLimiter, async (req, res) => {
  const { url, force = false } = req.body;
  const reqLog = logger.child({ reqId: req.requestId });

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

  if (!force) {
    const cached = cacheGet(siteId);
    if (cached) return res.json({ ...cached, cached: true });
  }

  const robots = await fetchRobots(baseUrl);
  if (!robots.allowsGlassGate) {
    return res.status(403).json({
      error: "Crawl not allowed",
      message: `robots.txt disallows ${robots.botName} for this site`,
      reqId: req.requestId,
    });
  }

  const jobId = generateJobId();
  createJob(jobId, baseUrl, siteId);

  try {
    const result = await runAudit(jobId, baseUrl, siteId, reqLog);
    res.json(result);
  } catch (err) {
    const { status, body } = auditErrorResponse(err, req, jobId);
    res.status(status).json(body);
  }
});

async function runAudit(jobId, baseUrl, siteId, log) {
  markRunning(jobId);
  appendLog(jobId, `Starting value-based audit for ${baseUrl}`);

  const startTime = Date.now();

  appendLog(jobId, "Fetching robots.txt");
  const robots = await fetchRobots(baseUrl);
  const siteChecks = {
    robotsTxt: robots.exists,
    sitemapXml: false,
    llmsTxtExists: false,
  };

  if (!robots.allowsGlassGate) {
    const err = new Error(`robots.txt disallows ${robots.botName} for this site`);
    err.code = "ROBOTS_DISALLOWED";
    markFailed(jobId, err);
    throw err;
  }

  appendLog(jobId, "Checking for existing llms.txt");
  const existingLlms = await fetchText(new URL("/llms.txt", baseUrl).href);
  siteChecks.llmsTxtExists = !!existingLlms;

  appendLog(jobId, "Fetching sitemap.xml");
  const sitemap = await fetchSitemap(baseUrl, robots.raw);
  siteChecks.sitemapXml = sitemap.exists;

  let navLinks = [];
  appendLog(jobId, "Crawling homepage for navigation links");
  const homepageResult = await fetchPage(baseUrl);
  if (homepageResult.ok) {
    const homepageRaw = extractPage(homepageResult.html, homepageResult.finalUrl || baseUrl);
    navLinks = homepageRaw.internalLinks.map((link) => link.url).slice(0, 20);
    appendLog(jobId, `  ↳ Found ${navLinks.length} internal link candidate(s)`);
  } else {
    appendLog(jobId, `  ↳ Homepage prefetch failed: ${homepageResult.error}`);
  }

  const queueResult = buildCrawlQueue(baseUrl, sitemap.urls, navLinks, config.maxPages);
  const queue = queueResult.queue;
  appendLog(
    jobId,
    `Crawl queue: ${queue.length} selected from ${queueResult.discovered} discovered URL(s)`
  );

  const crawledPages = [];
  const htmlSamples = [];
  const fetchedUrls = new Set();

  for (const pageUrl of queue) {
    if (!isAllowed(robots.raw, pageUrl, robots.botName)) {
      appendLog(jobId, `Skipping ${pageUrl} (robots.txt)`);
      continue;
    }

    appendLog(jobId, `Crawling ${pageUrl}`);

    let result;
    if (
      homepageResult.ok &&
      !fetchedUrls.has(pageUrl) &&
      (pageUrl.replace(/\/$/, "") === baseUrl.replace(/\/$/, ""))
    ) {
      result = homepageResult;
    } else {
      result = await fetchPage(pageUrl);
    }

    fetchedUrls.add(pageUrl);

    if (!result.ok) {
      appendLog(jobId, `  ↳ Failed: ${result.error}`);
      continue;
    }

    htmlSamples.push(result.html);
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

  appendLog(jobId, "Scoring site");
  const scoreResult = scoreSite(crawledPages, siteChecks);

  const pageSlugs = crawledPages.map((p) => ({
    url: p.url,
    slug: pageSlugFromUrl(p.url),
    title: p.title,
    description: p.description,
  }));

  appendLog(jobId, "Generating artifacts");
  const curatedPages = selectCuratedPages(crawledPages, baseUrl, config.maxLlmsTxtPages);

  const siteData = {
    url: baseUrl,
    title: crawledPages[0]?.title || new URL(baseUrl).hostname,
    description: crawledPages[0]?.description || "",
    language: crawledPages[0]?.language || "en",
    pages: curatedPages.map((p) => ({
      url: p.url,
      title: p.title,
      description: p.description,
    })),
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
  const allHtml = htmlSamples.join("\n");
  const metrics = compareTokens(allHtml, allMarkdown);
  const crawlMs = Date.now() - startTime;

  const crawlMeta = {
    discovered: queueResult.discovered,
    selected: queueResult.selected,
    source: sitemap.exists ? "sitemap+xml+internal_links" : "homepage+internal_links",
    robotsTxtStatus: robots.exists ? "found" : "missing",
    sitemapStatus: sitemap.exists ? "found" : "missing",
    crawlMs,
  };

  const llmsTxt = generateLlmsTxt(siteData, siteId, { curatedPages });
  const llmsFullTxt = generateLlmsFullTxt(crawledPages, baseUrl);
  const aiIndex = generateAiIndex(siteData, crawledPages, scoreResult, siteId, metrics, crawlMeta);

  appendLog(jobId, "Saving artifacts to disk");
  await saveSiteArtifacts(siteId, { llmsTxt, llmsFullTxt, aiIndex, pages: pageArtifacts });

  const result = {
    status: "completed",
    jobId,
    siteId,
    url: baseUrl,
    score: scoreResult.score,
    crawlStrategy: "value-based",
    pagesDiscovered: queueResult.discovered,
    pagesSelected: queueResult.selected,
    pagesFound: queueResult.discovered,
    pagesProcessed: crawledPages.length,
    artifacts: {
      llmsTxt: `/generated/${siteId}/llms.txt`,
      llmsFullTxt: `/generated/${siteId}/llms-full.txt`,
      aiIndex: `/generated/${siteId}/ai-index.json`,
      pages: pageSlugs.map(({ url: u, slug }) => ({
        url: u,
        slug,
        markdown: `/generated/${siteId}/pages/${slug}.md`,
        json: `/generated/${siteId}/pages/${slug}.json`,
      })),
    },
    metrics: {
      htmlTokensEstimate: metrics.htmlEstimate,
      markdownTokensEstimate: metrics.markdownEstimate,
      estimatedSavingsPercent: metrics.estimatedSavingsPercent,
      crawlMs,
    },
    checks: scoreResult.checks,
    issues: scoreResult.issues,
  };

  cacheSet(siteId, result, config.cacheTtlMs);
  markCompleted(jobId, result);
  appendLog(jobId, `Done in ${crawlMs}ms. Score: ${scoreResult.score}/100`);

  log.info("Audit complete", { jobId, siteId, score: scoreResult.score, crawlMs });

  return result;
}

export default router;
