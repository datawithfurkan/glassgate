import { contentHash } from "../contentHash.js";
import { detectPageType } from "../urlRanker.js";

/**
 * Generate structured JSON for a single page mirror.
 */

export function generatePageJson(pageData, siteId, slug) {
  const now = new Date().toISOString();
  const hash = contentHash(pageData.bodyText || "");
  const baseUrl = new URL(pageData.url).origin;
  const type = detectPageType(pageData.url, baseUrl);

  return {
    url: pageData.url,
    canonicalUrl: pageData.canonicalUrl || pageData.url,
    title: pageData.title,
    description: pageData.description || "",
    language: pageData.language || "en",
    type,
    summary: pageData.description || summarizeBody(pageData.bodyText),
    headings: pageData.headings,
    content: {
      markdownUrl: `${baseUrl}/pages/${slug}.md`,
      hostedMarkdownUrl: `/generated/${siteId}/pages/${slug}.md`,
      plainText: (pageData.bodyText || "").slice(0, 1200),
    },
    facts: extractFacts(pageData, type),
    links: (pageData.internalLinks || []).slice(0, 15).map((link) => ({
      label: link.label,
      url: link.url,
    })),
    structuredData: pageData.structuredData || [],
    openGraph: pageData.openGraph || {},
    checks: {
      hasH1: pageData.hasH1,
      hasMeta: pageData.hasMeta,
      hasCanonical: pageData.hasCanonical,
      hasStructuredData: pageData.hasStructuredData,
    },
    metadata: {
      lastCrawledAt: now,
      contentHash: hash,
      wordCount: pageData.wordCount || 0,
    },
    generator: "glasgate.ai",
    generatorVersion: "0.2.0",
  };
}

function summarizeBody(text = "") {
  const sentence = text.match(/[^.!?]+[.!?]+/)?.[0]?.trim();
  return sentence || "";
}

function extractFacts(pageData, type) {
  const facts = [];

  if (type === "pricing" && pageData.bodyText) {
    const priceMatch = pageData.bodyText.match(/\$[\d,.]+(?:\/\w+)?|\d+[,.]?\d*\s*(?:EUR|USD|€|\$)/i);
    if (priceMatch) {
      facts.push({
        type: "pricing_hint",
        value: priceMatch[0],
        sourceText: priceMatch[0],
      });
    }
  }

  for (const item of pageData.structuredData || []) {
    if (item?.["@type"] === "Product" && item.name) {
      facts.push({
        type: "product",
        name: item.name,
        price: item.offers?.price || null,
        currency: item.offers?.priceCurrency || null,
        sourceText: item.name,
      });
    }
    if (item?.["@type"] === "Organization" && item.name) {
      facts.push({
        type: "organization",
        name: item.name,
        sourceText: item.name,
      });
    }
  }

  return facts;
}
