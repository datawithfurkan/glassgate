import { pageSlugFromUrl } from "../validator.js";
import { detectPageType } from "../urlRanker.js";
import { contentHash } from "../contentHash.js";
import { scoreUrl } from "../urlRanker.js";

/**
 * Generate ai-index.json — machine-readable content graph for AI agents.
 */

export function generateAiIndex(siteData, pages, scoreResult, siteId, metrics, crawlMeta = {}) {
  const now = new Date().toISOString();
  const baseUrl = siteData.url.replace(/\/$/, "");

  return {
    version: "1.0",
    site: {
      name: siteData.title || new URL(baseUrl).hostname,
      baseUrl,
      language: siteData.language || "en",
      generatedAt: now,
    },
    crawl: {
      strategy: "value-based",
      source: crawlMeta.source || "sitemap+xml+internal_links",
      pagesDiscovered: crawlMeta.discovered ?? pages.length,
      pagesSelected: crawlMeta.selected ?? pages.length,
      pagesProcessed: pages.length,
      robotsTxtStatus: crawlMeta.robotsTxtStatus || (scoreResult.checks.robotsTxt ? "found" : "missing"),
      sitemapStatus: crawlMeta.sitemapStatus || (scoreResult.checks.sitemapXml ? "found" : "missing"),
      crawlMs: metrics.crawlMs || crawlMeta.crawlMs || 0,
    },
    agentReadinessScore: scoreResult.score,
    checks: scoreResult.checks,
    pages: pages.map((p, i) => {
      const slug = siteData.pageSlugs[i]?.slug || pageSlugFromUrl(p.url);
      return {
        id: slug,
        url: p.url,
        canonicalUrl: p.canonicalUrl || p.url,
        title: p.title,
        description: p.description || "",
        type: detectPageType(p.url, baseUrl),
        language: p.language || "en",
        lastModified: now.split("T")[0],
        contentHash: contentHash(p.bodyText || ""),
        markdownUrl: `${baseUrl}/pages/${slug}.md`,
        jsonUrl: `${baseUrl}/pages/${slug}.json`,
        hostedMarkdownUrl: `/generated/${siteId}/pages/${slug}.md`,
        hostedJsonUrl: `/generated/${siteId}/pages/${slug}.json`,
        schemaTypes: extractSchemaTypes(p.structuredData),
        importance: Math.round((scoreUrl(p.url, baseUrl) / 150) * 100) / 100,
        wordCount: p.wordCount || 0,
        status: "ready",
      };
    }),
    artifacts: {
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
      hostedLlmsTxt: `/generated/${siteId}/llms.txt`,
      hostedLlmsFullTxt: `/generated/${siteId}/llms-full.txt`,
      aiIndex: `${baseUrl}/ai-index.json`,
      hostedAiIndex: `/generated/${siteId}/ai-index.json`,
    },
    metrics: {
      totalPages: pages.length,
      totalWords: pages.reduce((s, p) => s + (p.wordCount || 0), 0),
      htmlTokensEstimate: metrics.htmlEstimate,
      markdownTokensEstimate: metrics.markdownEstimate,
      estimatedSavingsPercent: metrics.estimatedSavingsPercent,
    },
    issues: scoreResult.issues,
    generator: "glasgate.ai",
    generatorVersion: "0.2.0",
  };
}

function extractSchemaTypes(structuredData = []) {
  const types = new Set();
  for (const item of structuredData) {
    if (item?.["@type"]) {
      const t = item["@type"];
      if (Array.isArray(t)) t.forEach((x) => types.add(x));
      else types.add(t);
    }
  }
  return [...types];
}
