/**
 * Value-based URL filtering — exclude login, cart, search, tracking, and duplicate URLs.
 */

const BLOCKED_PATH_RE = [
  /\/login\b/i,
  /\/signin\b/i,
  /\/sign-up\b/i,
  /\/signup\b/i,
  /\/register\b/i,
  /\/auth\b/i,
  /\/account\b/i,
  /\/my-account\b/i,
  /\/cart\b/i,
  /\/checkout\b/i,
  /\/basket\b/i,
  /\/warenkorb\b/i,
  /\/search\b/i,
  /\/wp-admin\b/i,
  /\/wp-login\b/i,
  /\/admin\b/i,
  /\/cgi-bin\b/i,
];

const BLOCKED_QUERY_KEYS = new Set([
  "filter",
  "sort",
  "orderby",
  "session",
  "token",
  "sid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
  "page",
  "offset",
  "limit",
  "p",
]);

const BLOCKED_EXTENSIONS = /\.(pdf|jpg|jpeg|png|gif|webp|svg|css|js|zip|gz|mp4|mp3|woff2?|ttf|eot|xml|json)$/i;

const PAGINATION_PATH_RE = /\/page\/\d+\/?$/i;

function hasBlockedQuery(url, baseUrl) {
  try {
    const parsed = new URL(url, baseUrl);
    if (!parsed.search) return false;
    for (const key of parsed.searchParams.keys()) {
      if (BLOCKED_QUERY_KEYS.has(key.toLowerCase())) return true;
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Normalize a candidate URL for deduplication (strip hash, trailing slash).
 */
export function normalizeCandidateUrl(url, baseUrl) {
  try {
    const parsed = new URL(url, baseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (hasBlockedQuery(url, baseUrl)) return null;

    parsed.hash = "";
    return parsed.href.replace(/\/$/, "") || `${parsed.origin}/`;
  } catch {
    return null;
  }
}

/**
 * Whether a URL should be considered for crawling and AI artifacts.
 */
export function isCrawlableUrl(url, baseUrl) {
  if (hasBlockedQuery(url, baseUrl)) return false;

  const normalized = normalizeCandidateUrl(url, baseUrl);
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized);
    const site = new URL(baseUrl);

    if (parsed.hostname !== site.hostname) return false;

    const path = parsed.pathname.toLowerCase();
    if (path.includes("sitemap")) return false;
    if (BLOCKED_EXTENSIONS.test(path)) return false;
    if (PAGINATION_PATH_RE.test(path)) return false;
    if (BLOCKED_PATH_RE.some((re) => re.test(path))) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Filter and deduplicate discovered URLs.
 */
export function filterDiscoveredUrls(urls, baseUrl) {
  const seen = new Set();
  const result = [];

  for (const url of urls) {
    if (!url) continue;
    if (!isCrawlableUrl(url, baseUrl)) continue;

    const normalized = normalizeCandidateUrl(url, baseUrl);
    if (!normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}
