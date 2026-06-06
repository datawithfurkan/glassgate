/**
 * Generate llms-full.txt — concatenated Markdown of all pages.
 * Used when an agent wants the full site corpus in one request.
 */

export function generateLlmsFullTxt(pages, siteUrl) {
  const now = new Date().toISOString();
  const lines = [];

  // Header
  lines.push("---");
  lines.push(`source: ${siteUrl}`);
  lines.push(`generated: ${now}`);
  lines.push(`generator: glasgate.ai`);
  lines.push(`pages: ${pages.length}`);
  lines.push("---");
  lines.push("");

  for (const page of pages) {
    lines.push(`# ${page.title || page.url}`);
    lines.push(`source: ${page.url}`);
    lines.push("");

    if (page.description) {
      lines.push(`> ${page.description}`);
      lines.push("");
    }

    if (page.bodyText) {
      lines.push(page.bodyText.slice(0, 3000));
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
