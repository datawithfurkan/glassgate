import { contentHash } from "../contentHash.js";

/**
 * Generate llms-full.txt — compact full-text corpus of curated pages.
 */

function pageSummary(page) {
  if (page.description) return page.description;
  const text = page.bodyText || "";
  const sentence = text.match(/[^.!?]+[.!?]+/)?.[0]?.trim();
  return sentence || "Summary unavailable.";
}

export function generateLlmsFullTxt(pages, siteUrl) {
  const now = new Date().toISOString().split("T")[0];
  const lines = [];

  lines.push("# Full AI-readable Content Export");
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push(`Source: ${siteUrl}`);
  lines.push("Canonical content only.");
  lines.push("");

  for (const page of pages) {
    lines.push("---");
    lines.push("");
    lines.push(`## Page: ${page.title || page.url}`);
    lines.push("");
    lines.push(`URL: ${page.url}`);
    lines.push(`Canonical: ${page.canonicalUrl || page.url}`);
    lines.push(`Last updated: ${now}`);
    lines.push(`Content hash: ${contentHash(page.bodyText || "")}`);
    lines.push("");
    lines.push("### Summary");
    lines.push("");
    lines.push(pageSummary(page));
    lines.push("");
    lines.push("### Content");
    lines.push("");

    if (page.bodyText) {
      lines.push(page.bodyText.slice(0, 3000));
      lines.push("");
    }
  }

  return lines.join("\n");
}
