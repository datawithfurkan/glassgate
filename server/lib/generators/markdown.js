import { contentHash } from "../contentHash.js";
import { detectPageType } from "../urlRanker.js";

/**
 * Generate a clean Markdown mirror for a single canonical page.
 */

export function generateMarkdown(pageData) {
  const now = new Date().toISOString();
  const lines = [];

  lines.push("---");
  lines.push(`title: "${escape(pageData.title)}"`);
  lines.push(`url: "${pageData.url}"`);
  lines.push(`canonicalUrl: "${pageData.canonicalUrl || pageData.url}"`);
  if (pageData.description) lines.push(`description: "${escape(pageData.description)}"`);
  lines.push(`language: ${pageData.language || "en"}`);
  lines.push(`lastCrawledAt: "${now}"`);
  lines.push(`contentHash: "${contentHash(pageData.bodyText || "")}"`);
  lines.push(`generator: glasgate.ai`);
  lines.push("---");
  lines.push("");

  if (pageData.h1) {
    lines.push(`# ${pageData.h1}`);
    lines.push("");
  }

  if (pageData.description && pageData.description !== pageData.h1) {
    lines.push(`> ${pageData.description}`);
    lines.push("");
  }

  if (pageData.bodyText) {
    const paragraphs = splitIntoParagraphs(pageData.bodyText);
    for (const para of paragraphs) {
      lines.push(para);
      lines.push("");
    }
  }

  const subHeadings = pageData.headings.filter((h) => h.level > 1);
  if (subHeadings.length > 0) {
    for (const h of subHeadings.slice(0, 12)) {
      const prefix = "#".repeat(Math.min(h.level, 6));
      lines.push(`${prefix} ${h.text}`);
      lines.push("");
    }
  }

  lines.push("## Source");
  lines.push("");
  lines.push(`Canonical page: ${pageData.canonicalUrl || pageData.url}`);
  lines.push("");

  return lines.join("\n");
}

function escape(str) {
  return (str || "").replace(/"/g, '\\"');
}

function splitIntoParagraphs(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const paragraphs = [];
  let current = "";

  for (const sentence of sentences) {
    current += sentence.trim() + " ";
    if (current.length > 200) {
      paragraphs.push(current.trim());
      current = "";
    }
  }

  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs.slice(0, 20);
}

export { detectPageType };
