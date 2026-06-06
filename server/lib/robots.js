import { fetchText } from "./fetcher.js";
import config from "../config.js";

/** Extract bot name from configured User-Agent string. */
export function botNameFromUserAgent(userAgent = config.userAgent) {
  const match = String(userAgent).match(/^([^\s(+/]+)/);
  return match ? match[1] : "GlassGateBot";
}

/**
 * Fetch and parse robots.txt for a given base URL.
 */
export async function fetchRobots(baseUrl) {
  const url = new URL("/robots.txt", baseUrl).href;
  const raw = await fetchText(url);
  const botName = botNameFromUserAgent();

  if (!raw) return { exists: false, allowsGlassGate: true, raw: null, botName };

  const allowsGlassGate = isAllowed(raw, baseUrl, botName);

  return { exists: true, allowsGlassGate, raw, botName };
}

/**
 * Parse robots.txt into user-agent blocks.
 */
function parseBlocks(robotsTxt) {
  const lines = robotsTxt
    .split(/\r?\n/)
    .map((line) => line.split("#")[0].trim())
    .filter(Boolean);

  const blocks = [];
  let current = { agents: [], disallow: [], allow: [] };

  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;

    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      if (current.agents.length > 0) {
        blocks.push(current);
        current = { agents: [], disallow: [], allow: [] };
      }
      current.agents.push(value);
    } else if (key === "disallow") {
      current.disallow.push(value);
    } else if (key === "allow") {
      current.allow.push(value);
    }
  }

  if (current.agents.length > 0) blocks.push(current);
  return blocks;
}

function pathMatches(rule, path) {
  if (rule === "" || rule === undefined) return false;
  if (rule === "/") return true;
  return path.startsWith(rule);
}

function isPathAllowedInBlock(block, path) {
  for (const allowRule of block.allow) {
    if (pathMatches(allowRule, path)) return true;
  }

  for (const disallowRule of block.disallow) {
    if (pathMatches(disallowRule, path)) return false;
  }

  return true;
}

/**
 * Simple robots.txt parser.
 * Uses the last matching user-agent block (Google-style precedence).
 */
export function isAllowed(robotsTxt, url, userAgent) {
  if (!robotsTxt) return true;

  let path = "/";
  try {
    path = new URL(url).pathname || "/";
  } catch {
    return true;
  }

  const ua = userAgent.toLowerCase();
  const blocks = parseBlocks(robotsTxt);

  let matchedBlock = null;
  for (const block of blocks) {
    if (block.agents.some((agent) => agent === "*" || agent.toLowerCase() === ua)) {
      matchedBlock = block;
    }
  }

  if (!matchedBlock) return true;
  return isPathAllowedInBlock(matchedBlock, path);
}

/**
 * Extract Sitemap: directive from robots.txt
 */
export function extractSitemapFromRobots(raw) {
  if (!raw) return null;
  const match = raw.match(/^sitemap:\s*(.+)$/im);
  return match ? match[1].trim() : null;
}
