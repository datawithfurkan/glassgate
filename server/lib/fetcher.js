import config from "../config.js";

/**
 * Fetch a URL and return HTML string + metadata.
 * Returns null on failure (timeout, non-200, network error).
 */
export async function fetchPage(url, options = {}) {
  const timeout = options.timeout ?? config.crawlTimeout;
  const userAgent = options.userAgent ?? config.userAgent;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en,de;q=0.9",
      },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (!response.ok) {
      return { ok: false, status: response.status, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { ok: false, error: "Not an HTML page", contentType };
    }

    const html = await response.text();
    return {
      ok: true,
      html,
      status: response.status,
      finalUrl: response.url,
      contentType,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      return { ok: false, error: "Request timed out" };
    }
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch a plain text resource (robots.txt, sitemap.xml).
 * Returns null on failure.
 */
export async function fetchText(url, options = {}) {
  const timeout = options.timeout ?? 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": config.userAgent },
      redirect: "follow",
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    const text = await response.text();
    return text;
  } catch {
    clearTimeout(timer);
    return null;
  }
}
