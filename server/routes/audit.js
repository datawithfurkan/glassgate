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
import config from "../config.js";

const router = Router();

router.post("/audit", async (req, res) => {
  const { url } = req.body;

  // 1. Validate URL
  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ status: "error", error: "Invalid URL", message: validation.error });
  }

  const { normalized: baseUrl, hostname } = validation;
  const siteId = siteIdFromUrl(baseUrl);
  const startTime = Date.now();

  try {
    // 2. Check robots.txt
    const robots = await fetchRobots(baseUrl);
    const siteChecks = {
      robotsTxt: robots.exists,
      sitemapXml: false,
      llmsTxtExists: false,
    };

    if (!robots.allowsGlassGate) {
      return res.status(403).json({
        status: "error",
        error: "Crawl not allowed",
        message: "robots.txt disallows GlassGateBot for this site",
      });
    }

    // 3. Check for existing llms.txt on the target site
    const existingLlms = await fetchText(new URL("/llms.txt", baseUrl).href);
    siteChecks.llmsTxtExists = !!existingLlms;

    // 4. Fetch sitemap
    const sitemap = await fetchSitemap(baseUrl, robots.raw);
    siteChecks.sitemapXml = sitemap.exists;

    // 5. Build crawl queue (homepage + up to 4 from sitemap)
    const queue = buildCrawlQueue(baseUrl, sitemap.urls, config.maxPages);

    // 6. Crawl pages
    const crawledPages = [];
    let totalHtmlChars = 0;

    for (const pageUrl of queue) {
      const result = await fetchPage(pageUrl);
      if (!result.ok) continue;

      totalHtmlChars += result.html.length;
      const raw = extractPage(result.html, result.finalUrl || pageUrl);
      const normalized = normalizePage(raw);
      crawledPages.push(normalized);
    }

    if (crawledPages.length === 0) {
      return res.status(200).json({
        status: "error",
        error: "Could not crawl site",
        message: "All page fetches failed. The site may be blocking automated access.",
        siteId,
        url: baseUrl,
      });
    }

    // 7. Score
    const scoreResult = scoreSite(crawledPages, siteChecks);

    // 8. Build page slugs
    const pageSlugs = crawledPages.map((p) => ({
      url: p.url,
      slug: pageSlugFromUrl(p.url),
      title: p.title,
      description: p.description,
    }));

    // 9. Generate all artifacts
    const siteData = {
      url: baseUrl,
      title: crawledPages[0]?.title || hostname,
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
    const metrics = compareTokens(
      "x".repeat(totalHtmlChars), // approximate html size
      allMarkdown
    );

    const llmsTxt = generateLlmsTxt(siteData, siteId);
    const llmsFullTxt = generateLlmsFullTxt(crawledPages, baseUrl);
    const aiIndex = generateAiIndex(siteData, crawledPages, scoreResult, siteId, metrics);

    // 10. Save to disk
    await saveSiteArtifacts(siteId, {
      llmsTxt,
      llmsFullTxt,
      aiIndex,
      pages: pageArtifacts,
    });

    const crawlMs = Date.now() - startTime;

    // 11. Respond
    res.json({
      status: "completed",
      siteId,
      url: baseUrl,
      score: scoreResult.score,
      pagesFound: sitemap.urls.length + 1,
      pagesProcessed: crawledPages.length,
      artifacts: {
        llmsTxt: `/generated/${siteId}/llms.txt`,
        llmsFullTxt: `/generated/${siteId}/llms-full.txt`,
        aiIndex: `/generated/${siteId}/ai-index.json`,
        pages: pageSlugs.map(({ url: u, slug }) => ({
          url: u,
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
    });
  } catch (err) {
    console.error("[audit] Unexpected error:", err);
    res.status(500).json({
      status: "error",
      error: "Internal server error",
      message: err.message,
      siteId,
      url: baseUrl,
    });
  }
});

export default router;
