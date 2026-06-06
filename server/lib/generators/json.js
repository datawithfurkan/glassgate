import crypto from "crypto";

/**
 * Generate a structured JSON representation of a single page.
 */

export function generatePageJson(pageData, siteId, slug) {
  const now = new Date().toISOString();
  const contentHash = crypto
    .createHash("sha256")
    .update(pageData.bodyText || "")
    .digest("hex")
    .slice(0, 16);

  return {
    url: pageData.url,
    canonicalUrl: pageData.canonicalUrl,
    title: pageData.title,
    description: pageData.description,
    language: pageData.language || "en",
    lastCrawledAt: now,
    contentHash,
    wordCount: pageData.wordCount,
    headings: pageData.headings,
    bodyText: (pageData.bodyText || "").slice(0, 2000),
    internalLinks: pageData.internalLinks,
    structuredData: pageData.structuredData,
    openGraph: pageData.openGraph,
    checks: {
      hasH1: pageData.hasH1,
      hasMeta: pageData.hasMeta,
      hasCanonical: pageData.hasCanonical,
      hasStructuredData: pageData.hasStructuredData,
    },
    agentRepresentation: {
      markdownUrl: `/generated/${siteId}/pages/${slug}.md`,
      jsonUrl: `/generated/${siteId}/pages/${slug}.json`,
    },
    generator: "glasgate.ai",
    generatorVersion: "0.1.0",
  };
}
