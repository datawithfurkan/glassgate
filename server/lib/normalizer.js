/**
 * Clean and normalize extracted page data.
 */

export function normalizePage(pageData) {
  return {
    ...pageData,
    title: clean(pageData.title),
    description: clean(pageData.description),
    h1: clean(pageData.h1),
    bodyText: normalizeBodyText(pageData.bodyText),
    headings: pageData.headings.map((h) => ({ ...h, text: clean(h.text) })).filter((h) => h.text),
    internalLinks: pageData.internalLinks
      .map((l) => ({ ...l, label: clean(l.label) }))
      .filter((l) => l.label && l.url),
  };
}

function clean(str) {
  if (!str) return "";
  return str.replace(/\s+/g, " ").trim();
}

function normalizeBodyText(text) {
  if (!text) return "";

  return text
    // collapse whitespace
    .replace(/\s+/g, " ")
    // remove repeated punctuation
    .replace(/([.!?])\1+/g, "$1")
    .trim()
    .slice(0, 5000);
}
