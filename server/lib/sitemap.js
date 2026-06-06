import { fetchText } from "./fetcher.js";
import { extractSitemapFromRobots } from "./robots.js";
import { filterDiscoveredUrls } from "./urlFilter.js";
import { selectCrawlQueue } from "./urlRanker.js";
import config from "../config.js";

/**
 * Attempt to fetch and parse sitemap.xml for a base URL.
 * Tries /sitemap.xml, then robots.txt Sitemap directive.
 */
export async function fetchSitemap(baseUrl, robotsRaw = null) {
  const candidates = [new URL("/sitemap.xml", baseUrl).href];

  if (robotsRaw) {
    const fromRobots = extractSitemapFromRobots(robotsRaw);
    if (fromRobots && !candidates.includes(fromRobots)) {
      candidates.unshift(fromRobots);
    }
  }

  for (const url of candidates) {
    const xml = await fetchText(url);
    if (!xml) continue;

    const urls = parseSitemapXml(xml, baseUrl);
    if (urls.length > 0) {
      return { exists: true, urls: urls.slice(0, config.maxSitemapUrls), count: urls.length };
    }
  }

  return { exists: false, urls: [] };
}

function isPageUrl(loc) {
  try {
    const pathname = new URL(loc).pathname.toLowerCase();
    return !pathname.includes("sitemap");
  } catch {
    return false;
  }
}

/**
 * Parse sitemap XML and return array of page URLs.
 * Handles both sitemap index and URL set.
 */
function parseSitemapXml(xml, baseUrl) {
  const urls = [];
  const locMatches = xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/gi);

  for (const match of locMatches) {
    const loc = match[1].trim();
    if (!loc) continue;

    try {
      const parsed = new URL(loc);
      const base = new URL(baseUrl);
      if (parsed.hostname === base.hostname && isPageUrl(loc)) {
        urls.push(loc);
      }
    } catch {
      // skip invalid URLs
    }
  }

  return [...new Set(urls)];
}

/**
 * Build a value-ranked crawl queue from sitemap + navigation link candidates.
 */
export function buildCrawlQueue(baseUrl, sitemapUrls = [], navLinks = [], maxPages = config.maxPages) {
  const homepage = baseUrl.replace(/\/$/, "");
  const rawCandidates = [
    homepage,
    ...sitemapUrls.filter((u) => u.replace(/\/$/, "") !== homepage),
    ...navLinks,
  ];

  const filtered = filterDiscoveredUrls(rawCandidates, baseUrl);
  return selectCrawlQueue(filtered, baseUrl, maxPages);
}
