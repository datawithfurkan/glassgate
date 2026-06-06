/**
 * glasgate.ai — Unit Tests
 *
 * Tests individual modules in isolation.
 * Run: node server/tests/unit.js
 */

import { validateUrl, siteIdFromUrl, pageSlugFromUrl, validateSiteId } from "../lib/validator.js";
import { isAllowed, botNameFromUserAgent } from "../lib/robots.js";
import { scoreSite } from "../lib/scorer.js";
import { estimateTokens, compareTokens } from "../lib/tokenEstimator.js";
import { generateLlmsTxt } from "../lib/generators/llmsTxt.js";
import { generateMarkdown } from "../lib/generators/markdown.js";
import { generatePageJson } from "../lib/generators/json.js";
import { normalizePage } from "../lib/normalizer.js";

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅  ${label}${detail ? `  →  ${detail}` : ""}`);
    passed++;
  } else {
    console.log(`  ❌  ${label}${detail ? `  →  ${detail}` : ""}`);
    failed++;
  }
}

// ─── validator ────────────────────────────────────────────────────────────────

console.log("\n── validator.js ─────────────────────────────────");

assert("valid https URL", validateUrl("https://example.com").valid === true);
assert("valid http URL", validateUrl("http://example.com").valid === true);
assert("trailing slash stripped", validateUrl("https://example.com/").normalized === "https://example.com");
assert("empty string invalid", validateUrl("").valid === false);
assert("no protocol invalid", validateUrl("example.com").valid === false);
assert("ftp invalid", validateUrl("ftp://example.com").valid === false);
assert("null invalid", validateUrl(null).valid === false);
assert("whitespace trimmed", validateUrl("  https://example.com  ").valid === true);

assert("siteId from url", siteIdFromUrl("https://example.com") === "example-com");
assert("siteId dots replaced", siteIdFromUrl("https://stripe.com") === "stripe-com");
assert("siteId subdomain", siteIdFromUrl("https://docs.example.com") === "docs-example-com");

assert("slug from root", pageSlugFromUrl("https://example.com/") === "home");
assert("slug from path", pageSlugFromUrl("https://example.com/about") === "about");
assert("slug from nested", pageSlugFromUrl("https://example.com/blog/post-1") === "blog-post-1");

assert("valid siteId", validateSiteId("example-com").valid === true);
assert("invalid siteId with slash", validateSiteId("../etc").valid === false);
assert("invalid siteId with dots", validateSiteId("..").valid === false);

// ─── robots ───────────────────────────────────────────────────────────────────

console.log("\n── robots.js ────────────────────────────────────");

const robots1 = `User-agent: *\nDisallow: /admin\n\nUser-agent: GlassGateBot\nDisallow: /`;
assert("* disallow /admin blocks /admin", isAllowed(robots1, "https://x.com/admin", "*") === false);
assert("* disallow /admin allows /page", isAllowed(robots1, "https://x.com/page", "*") === true);
assert("GlassGateBot blocked when Disallow: /", isAllowed(robots1, "https://x.com/", "GlassGateBot") === false);

const robots2 = `User-agent: *\nAllow: /\n`;
assert("Allow: / allows everything", isAllowed(robots2, "https://x.com/anything", "*") === true);

assert("empty robots.txt allows all", isAllowed("", "https://x.com/", "*") === true);
assert("null robots.txt allows all", isAllowed(null, "https://x.com/", "*") === true);
assert("bot name parsed from UA", botNameFromUserAgent("GlassGateBot/0.1 (+https://glasgate.ai/bot)") === "GlassGateBot");

// ─── scorer ───────────────────────────────────────────────────────────────────

console.log("\n── scorer.js ────────────────────────────────────");

const fullPage = {
  hasH1: true, hasMeta: true, hasCanonical: true,
  hasStructuredData: true, wordCount: 300,
  openGraph: { title: "Test" },
};
const checks1 = { robotsTxt: true, sitemapXml: true, llmsTxtExists: true };
const { score: s1 } = scoreSite([fullPage], checks1);
assert("perfect site scores high (≥80)", s1 >= 80, `score: ${s1}`);

const emptyPage = {
  hasH1: false, hasMeta: false, hasCanonical: false,
  hasStructuredData: false, wordCount: 30, openGraph: {},
};
const checks2 = { robotsTxt: false, sitemapXml: false, llmsTxtExists: false };
const { score: s2 } = scoreSite([emptyPage], checks2);
assert("poor site scores low (<30)", s2 < 30, `score: ${s2}`);

assert("score is capped at 100", s1 <= 100);
assert("score is at least 0", s2 >= 0);

const { issues } = scoreSite([emptyPage], checks2);
assert("issues array populated", issues.length > 0, `${issues.length} issues`);
assert("issues have severity", issues.every((i) => ["warning", "info"].includes(i.severity)));

// ─── tokenEstimator ───────────────────────────────────────────────────────────

console.log("\n── tokenEstimator.js ────────────────────────────");

assert("empty string = 0 tokens", estimateTokens("") === 0);
assert("4 chars ≈ 1 token", estimateTokens("test") === 1);
assert("8 chars ≈ 2 tokens", estimateTokens("testtest") === 2);

const { htmlEstimate, markdownEstimate, estimatedSavingsPercent } = compareTokens(
  "x".repeat(10000),
  "x".repeat(4000)
);
assert("html estimate > markdown estimate", htmlEstimate > markdownEstimate);
assert("savings percent is 60", estimatedSavingsPercent === 60, `${estimatedSavingsPercent}%`);

// ─── normalizer ───────────────────────────────────────────────────────────────

console.log("\n── normalizer.js ────────────────────────────────");

const raw = {
  title: "  Hello  World  ",
  description: "  Test  ",
  h1: "  Heading  ",
  bodyText: "  Too   many   spaces  ",
  headings: [{ level: 1, text: "  H1  " }, { level: 2, text: "" }],
  internalLinks: [{ label: "  Link  ", url: "https://example.com" }, { label: "", url: "https://x.com" }],
};
const norm = normalizePage(raw);
assert("title trimmed", norm.title === "Hello World");
assert("description trimmed", norm.description === "Test");
assert("empty heading removed", norm.headings.length === 1);
assert("empty link removed", norm.internalLinks.length === 1);
assert("link label trimmed", norm.internalLinks[0].label === "Link");

// ─── generators ───────────────────────────────────────────────────────────────

console.log("\n── generators ───────────────────────────────────");

const page = {
  url: "https://example.com/",
  canonicalUrl: "https://example.com/",
  title: "Example",
  description: "An example site.",
  language: "en",
  h1: "Example Domain",
  headings: [{ level: 1, text: "Example Domain" }, { level: 2, text: "About" }],
  bodyText: "This domain is for illustrative examples.",
  wordCount: 8,
  internalLinks: [{ label: "More info", url: "https://example.com/about" }],
  structuredData: [],
  openGraph: {},
};

const md = generateMarkdown(page);
assert("markdown has frontmatter", md.startsWith("---"));
assert("markdown has title field", md.includes("title:"));
assert("markdown has url field", md.includes("url:"));
assert("markdown has H1", md.includes("# Example Domain"));
assert("markdown has links section", md.includes("## Links"));

const json = generatePageJson(page, "example-com", "home");
assert("page.json has url", json.url === "https://example.com/");
assert("page.json has contentHash", typeof json.contentHash === "string" && json.contentHash.length > 0);
assert("page.json has agentRepresentation", !!json.agentRepresentation?.markdownUrl);
assert("page.json has generator field", json.generator === "glasgate.ai");

const siteData = {
  url: "https://example.com",
  title: "Example",
  description: "An example site.",
  pages: [{ url: "https://example.com/", title: "Home", description: "Homepage" }],
  pageSlugs: [{ url: "https://example.com/", slug: "home", title: "Home" }],
};
const llms = generateLlmsTxt(siteData, "example-com");
assert("llms.txt starts with #", llms.trim().startsWith("#"));
assert("llms.txt has Core Pages section", llms.includes("## Core Pages"));
assert("llms.txt has Agent-readable Mirrors", llms.includes("## Agent-readable Mirrors"));
assert("llms.txt references glasgate.ai", llms.includes("glasgate.ai"));

// ─── Results ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${"═".repeat(52)}`);
console.log(`  Results: ${passed}/${total} passed  ${failed > 0 ? `❌ ${failed} failed` : "✅ all passed"}`);
console.log(`${"═".repeat(52)}\n`);

process.exit(failed > 0 ? 1 : 0);
