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

/**
 * Validate a filesystem-safe site ID.
 */
export function validateSiteId(siteId) {
  if (!siteId || typeof siteId !== "string") {
    return { valid: false, error: "siteId is required" };
  }

  if (siteId.includes("..") || siteId.includes("/") || siteId.includes("\\")) {
    return { valid: false, error: "Invalid siteId" };
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(siteId)) {
    return { valid: false, error: "Invalid siteId format" };
  }

  return { valid: true };
}

/**
 * Parse and clamp pagination query params.
 */
export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

/**
 * Validate optional job status filter.
 */
export function validateJobStatus(status) {
  if (!status) return { valid: true };
  const allowed = new Set(["pending", "running", "completed", "failed"]);
  if (!allowed.has(status)) {
    return { valid: false, error: "Invalid status filter" };
  }
  return { valid: true };
}
