/**
 * Generate a clean Markdown file for a single page.
 */

export function generateMarkdown(pageData) {
  const now = new Date().toISOString();
  const lines = [];

  // Frontmatter
  lines.push("---");
  lines.push(`title: "${escape(pageData.title)}"`);
  lines.push(`url: ${pageData.url}`);
  lines.push(`canonical: ${pageData.canonicalUrl}`);
  if (pageData.description) lines.push(`description: "${escape(pageData.description)}"`);
  lines.push(`language: ${pageData.language || "en"}`);
  lines.push(`crawledAt: ${now}`);
  lines.push(`generator: glasgate.ai`);
  lines.push("---");
  lines.push("");

  // H1 / title
  if (pageData.h1) {
    lines.push(`# ${pageData.h1}`);
    lines.push("");
  }

  // Description as intro
  if (pageData.description && pageData.description !== pageData.h1) {
    lines.push(`> ${pageData.description}`);
    lines.push("");
  }

  // Body text — wrap into paragraphs by sentence groups
  if (pageData.bodyText) {
    const paragraphs = splitIntoParagraphs(pageData.bodyText);
    for (const para of paragraphs) {
      lines.push(para);
      lines.push("");
    }
  }

  // Headings outline (if more than just H1)
  const subHeadings = pageData.headings.filter((h) => h.level > 1);
  if (subHeadings.length > 0) {
    lines.push("## Page Structure");
    lines.push("");
    for (const h of subHeadings) {
      const indent = "  ".repeat(h.level - 2);
      lines.push(`${indent}- ${h.text}`);
    }
    lines.push("");
  }

  // Internal links
  if (pageData.internalLinks.length > 0) {
    lines.push("## Links");
    lines.push("");
    for (const link of pageData.internalLinks.slice(0, 15)) {
      lines.push(`- [${link.label}](${link.url})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function escape(str) {
  return (str || "").replace(/"/g, '\\"');
}

function splitIntoParagraphs(text) {
  // Split long text into ~200 char paragraphs at sentence boundaries
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
