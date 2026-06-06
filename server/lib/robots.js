import { fetchText } from "./fetcher.js";

/**
 * Fetch and parse robots.txt for a given base URL.
 */
export async function fetchRobots(baseUrl) {
  const url = new URL("/robots.txt", baseUrl).href;
  const raw = await fetchText(url);

  if (!raw) return { exists: false, allowsGlassGate: true, raw: null };

  const allowsGlassGate = isAllowed(raw, baseUrl, "GlassGateBot");

  return { exists: true, allowsGlassGate, raw };
}

/**
 * Simple robots.txt parser.
 * Checks if a given user-agent is allowed to crawl the given URL.
 */
export function isAllowed(robotsTxt, url, userAgent) {
  if (!robotsTxt) return true;

  const lines = robotsTxt.split("\n").map((l) => l.trim());
  let currentAgents = [];
  let applies = false;
  let disallowed = [];
  let allowed = [];

  for (const line of lines) {
    if (line.startsWith("#") || line === "") {
      if (currentAgents.length > 0 && line === "") {
        // End of block — check if our agent matched
        if (currentAgents.some((a) => a === "*" || a.toLowerCase() === userAgent.toLowerCase())) {
          applies = true;
        }
        currentAgents = [];
      }
      continue;
    }

    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();

    if (key.toLowerCase() === "user-agent") {
      currentAgents.push(value);
    } else if (key.toLowerCase() === "disallow") {
      if (applies) disallowed.push(value);
    } else if (key.toLowerCase() === "allow") {
      if (applies) allowed.push(value);
    }
  }

  // Handle last block
  if (currentAgents.some((a) => a === "*" || a.toLowerCase() === userAgent.toLowerCase())) {
    applies = true;
  }

  if (!applies) return true;

  let path = "/";
  try {
    path = new URL(url).pathname;
  } catch {}

  for (const a of allowed) {
    if (a && path.startsWith(a)) return true;
  }

  for (const d of disallowed) {
    if (d && path.startsWith(d)) return false;
  }

  return true;
}

/**
 * Extract Sitemap: directive from robots.txt
 */
export function extractSitemapFromRobots(raw) {
  if (!raw) return null;
  const match = raw.match(/^sitemap:\s*(.+)$/im);
  return match ? match[1].trim() : null;
}
