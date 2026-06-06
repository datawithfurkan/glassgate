/**
 * Generate ai-index.json — the full structured site index for AI agents.
 */

export function generateAiIndex(siteData, pages, scoreResult, siteId, metrics, crawlMs = 0) {
  const now = new Date().toISOString();

  return {
    site: {
      url: siteData.url,
      title: siteData.title,
      description: siteData.description,
      language: siteData.language || "en",
      lastIndexedAt: now,
    },
    agentReadinessScore: scoreResult.score,
    checks: scoreResult.checks,
    artifacts: {
      llmsTxt: `/generated/${siteId}/llms.txt`,
      llmsFullTxt: `/generated/${siteId}/llms-full.txt`,
      aiIndex: `/generated/${siteId}/ai-index.json`,
    },
    pages: pages.map((p, i) => ({
      url: p.url,
      title: p.title,
      description: p.description,
      language: p.language,
      bodyText: p.bodyText || "",
      markdownUrl: `/generated/${siteId}/pages/${siteData.pageSlugs[i]?.slug || i}.md`,
      jsonUrl: `/generated/${siteId}/pages/${siteData.pageSlugs[i]?.slug || i}.json`,
      wordCount: p.wordCount,
      hasH1: p.hasH1,
      hasMeta: p.hasMeta,
    })),
    metrics: {
      totalPages: pages.length,
      totalWords: pages.reduce((s, p) => s + (p.wordCount || 0), 0),
      htmlTokensEstimate: metrics.htmlEstimate,
      markdownTokensEstimate: metrics.markdownEstimate,
      estimatedSavingsPercent: metrics.estimatedSavingsPercent,
      crawlMs,
    },
    issues: scoreResult.issues,
    generator: "glasgate.ai",
    generatorVersion: "0.1.0",
  };
}
