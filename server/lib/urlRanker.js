import { normalizeCandidateUrl } from "./urlFilter.js";

const PRIORITY_PATHS = [
  { re: /^\/$|^\/home\/?$/i, boost: 50, type: "homepage" },
  { re: /\/(about|ueber-uns|company)\b/i, boost: 35, type: "about" },
  { re: /\/(pricing|preise|plans)\b/i, boost: 40, type: "pricing" },
  { re: /\/(contact|kontakt)\b/i, boost: 35, type: "contact" },
  { re: /\/(faq|help|support)\b/i, boost: 32, type: "faq" },
  { re: /\/(docs|documentation|api)\b/i, boost: 30, type: "docs" },
  { re: /\/(products|services|solutions|platform)\b/i, boost: 28, type: "product" },
  { re: /\/(blog|news|changelog|guides)\b/i, boost: 18, type: "blog" },
  { re: /\/(privacy|terms|legal|impressum)\b/i, boost: 8, type: "policy" },
];

/**
 * Infer page type from URL path for structured artifacts.
 */
export function detectPageType(url, baseUrl) {
  try {
    const path = new URL(url, baseUrl).pathname.toLowerCase();
    for (const { re, type } of PRIORITY_PATHS) {
      if (re.test(path)) return type;
    }
    return "page";
  } catch {
    return "page";
  }
}

/**
 * Score URL importance for value-based crawl selection (higher = more important).
 */
export function scoreUrl(url, baseUrl) {
  let score = 40;

  try {
    const parsed = new URL(url, baseUrl);
    const path = parsed.pathname.toLowerCase();
    const depth = path.split("/").filter(Boolean).length;

    score -= Math.max(0, depth - 1) * 8;

    if (parsed.search) score -= 25;

    const homepage = new URL(baseUrl).origin.replace(/\/$/, "");
    const normalized = normalizeCandidateUrl(url, baseUrl);
    if (normalized === homepage || normalized === `${homepage}/` || path === "" || path === "/") {
      score += 100;
    }

    for (const { re, boost } of PRIORITY_PATHS) {
      if (re.test(path)) {
        score += boost;
        break;
      }
    }

    if (/\d{4,}/.test(path)) score -= 10;
  } catch {
    score = 0;
  }

  return Math.max(0, Math.round(score));
}

/**
 * Select the highest-value URLs for crawling, always including the homepage.
 */
export function selectCrawlQueue(urls, baseUrl, maxPages) {
  const homepage = normalizeCandidateUrl(baseUrl, baseUrl);
  const ranked = urls
    .map((url) => ({
      url,
      score: scoreUrl(url, baseUrl),
      type: detectPageType(url, baseUrl),
    }))
    .sort((a, b) => b.score - a.score);

  const selected = [];
  const seen = new Set();

  if (homepage && !seen.has(homepage)) {
    selected.push(homepage);
    seen.add(homepage);
  }

  for (const entry of ranked) {
    if (selected.length >= maxPages) break;
    const normalized = normalizeCandidateUrl(entry.url, baseUrl);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    selected.push(normalized);
  }

  return {
    queue: selected,
    discovered: urls.length,
    selected: selected.length,
    rankings: ranked,
  };
}

/**
 * Top pages for curated llms.txt (not every crawled URL).
 */
export function selectCuratedPages(pages, baseUrl, maxPages = 8) {
  return [...pages]
    .map((page) => ({
      ...page,
      importance: scoreUrl(page.url, baseUrl) / 100,
      type: detectPageType(page.url, baseUrl),
    }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, maxPages);
}
