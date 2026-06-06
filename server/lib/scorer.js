/**
 * Compute the AI Readiness Score (0–100) for a crawled site.
 */

export function scoreSite(pages, siteChecks) {
  let score = 0;
  const issues = [];

  // +15 sitemap found
  if (siteChecks.sitemapXml) {
    score += 15;
  } else {
    issues.push({ severity: "warning", message: "No sitemap.xml found — agents may miss pages" });
  }

  // +10 robots.txt found
  if (siteChecks.robotsTxt) {
    score += 10;
  } else {
    issues.push({ severity: "info", message: "No robots.txt found" });
  }

  // +10 llms.txt exists on site
  if (siteChecks.llmsTxtExists) {
    score += 10;
  } else {
    issues.push({ severity: "warning", message: "No llms.txt found on target site — GlassGate will generate one" });
  }

  if (pages.length === 0) {
    return { score: 0, checks: siteChecks, issues };
  }

  const pagesWithCanonical = pages.filter((p) => p.hasCanonical).length;
  const pagesWithH1 = pages.filter((p) => p.hasH1).length;
  const pagesWithMeta = pages.filter((p) => p.hasMeta).length;
  const pagesWithStructuredData = pages.filter((p) => p.hasStructuredData).length;

  // +15 canonical URLs present on all pages
  if (pagesWithCanonical === pages.length) {
    score += 15;
  } else if (pagesWithCanonical > 0) {
    score += 8;
    issues.push({ severity: "warning", message: `${pages.length - pagesWithCanonical} page(s) missing canonical URL` });
  } else {
    issues.push({ severity: "warning", message: "No canonical URLs found" });
  }

  // +15 H1 on all pages
  if (pagesWithH1 === pages.length) {
    score += 15;
  } else if (pagesWithH1 > 0) {
    score += 8;
    issues.push({ severity: "warning", message: `${pages.length - pagesWithH1} page(s) missing H1` });
  } else {
    issues.push({ severity: "warning", message: "No H1 headings found" });
  }

  // +10 meta description on all pages
  if (pagesWithMeta === pages.length) {
    score += 10;
  } else if (pagesWithMeta > 0) {
    score += 5;
    issues.push({ severity: "info", message: `${pages.length - pagesWithMeta} page(s) missing meta description` });
  } else {
    issues.push({ severity: "warning", message: "No meta descriptions found" });
  }

  // +10 structured data (JSON-LD)
  if (pagesWithStructuredData > 0) {
    score += 10;
  } else {
    issues.push({ severity: "info", message: "No JSON-LD structured data found" });
  }

  // +5 low boilerplate: average word count > 100
  const avgWords = pages.reduce((s, p) => s + (p.wordCount || 0), 0) / pages.length;
  if (avgWords > 100) {
    score += 5;
  } else {
    issues.push({ severity: "info", message: "Pages appear to have low text content" });
  }

  // +5 open graph
  const pagesWithOG = pages.filter((p) => p.openGraph && p.openGraph.title).length;
  if (pagesWithOG > 0) score += 5;

  const finalScore = Math.min(100, Math.max(0, score));

  const checks = {
    ...siteChecks,
    canonicalUrls: pagesWithCanonical === pages.length,
    h1Structure: pagesWithH1 === pages.length,
    metaDescription: pagesWithMeta === pages.length,
    structuredData: pagesWithStructuredData > 0,
    openGraph: pagesWithOG > 0,
  };

  return { score: finalScore, checks, issues };
}
