/**
 * Validate and normalize a URL string.
 */
export function validateUrl(raw) {
  if (!raw || typeof raw !== "string") {
    return { valid: false, error: "URL is required" };
  }

  const trimmed = raw.trim();

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return { valid: false, error: "URL must start with http:// or https://" };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (!parsed.hostname || parsed.hostname.length < 3) {
    return { valid: false, error: "URL must have a valid hostname" };
  }

  // Remove trailing slash for consistency
  const normalized = trimmed.replace(/\/$/, "");

  return { valid: true, normalized, hostname: parsed.hostname };
}

/**
 * Derive a safe filesystem ID from a URL.
 * "https://example.com/path" → "example-com"
 */
export function siteIdFromUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/\./g, "-").replace(/[^a-z0-9-]/gi, "").toLowerCase();
  } catch {
    return "unknown-site";
  }
}

/**
 * Derive a safe page slug from a URL path.
 * "https://example.com/about/team" → "about-team"
 */
export function pageSlugFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    const slug = pathname.replace(/^\//, "").replace(/\//g, "-").replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return slug || "home";
  } catch {
    return "page";
  }
}
