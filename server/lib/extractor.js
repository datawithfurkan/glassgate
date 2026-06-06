/**
 * Extract structured content from raw HTML.
 * Uses regex + string parsing only (no external DOM dependencies).
 */

export function extractPage(html, url) {
  const title = extractTitle(html);
  const description = extractMeta(html, "description");
  const canonicalUrl = extractCanonical(html) || url;
  const language = extractLang(html);
  const headings = extractHeadings(html);
  const h1 = headings.find((h) => h.level === 1)?.text || title;
  const bodyText = extractBodyText(html);
  const internalLinks = extractInternalLinks(html, url);
  const structuredData = extractStructuredData(html);
  const openGraph = extractOpenGraph(html);
  const rawHtmlBytes = Buffer.byteLength(html, "utf8");
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  return {
    url,
    canonicalUrl,
    title,
    description,
    language,
    h1,
    headings,
    bodyText,
    wordCount,
    internalLinks,
    structuredData,
    openGraph,
    hasH1: headings.some((h) => h.level === 1),
    hasMeta: !!description,
    hasCanonical: !!extractCanonical(html),
    hasStructuredData: structuredData.length > 0,
    rawHtmlBytes,
  };
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : "";
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return decodeHtmlEntities(m[1].trim());
  }
  return "";
}

function extractCanonical(html) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return match ? match[1].trim() : null;
}

function extractLang(html) {
  const match = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  return match ? match[1].split("-")[0].toLowerCase() : "en";
}

function extractHeadings(html) {
  const headings = [];
  const pattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const text = stripTags(match[2]).trim();
    if (text) headings.push({ level: parseInt(match[1]), text: decodeHtmlEntities(text) });
  }
  return headings.slice(0, 30);
}

function extractBodyText(html) {
  // Remove script, style, nav, footer, header blocks
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Try to focus on main content area
  const mainMatch = cleaned.match(/<main[\s\S]*?<\/main>/i)
    || cleaned.match(/<article[\s\S]*?<\/article>/i)
    || cleaned.match(/<div[^>]+(?:class|id)=["'][^"']*(?:content|main|body|post)[^"']*["'][\s\S]*?<\/div>/i);

  if (mainMatch) cleaned = mainMatch[0];

  const text = stripTags(cleaned)
    .replace(/\s+/g, " ")
    .trim();

  // Limit to 5000 chars for token control
  return text.slice(0, 5000);
}

function extractInternalLinks(html, pageUrl) {
  const links = [];
  const base = new URL(pageUrl);
  const pattern = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const href = match[1].trim();
    const label = stripTags(match[2]).trim().slice(0, 80);

    try {
      const parsed = new URL(href, pageUrl);
      if (parsed.hostname === base.hostname && label) {
        links.push({ label: decodeHtmlEntities(label), url: parsed.href });
      }
    } catch {}
  }

  // Deduplicate by URL
  const seen = new Set();
  return links.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  }).slice(0, 20);
}

function extractStructuredData(html) {
  const results = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      results.push(data);
    } catch {}
  }

  return results.slice(0, 5);
}

function extractOpenGraph(html) {
  const props = ["title", "description", "image", "url", "type"];
  const og = {};

  for (const prop of props) {
    const pattern = new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i");
    const match = html.match(pattern);
    if (match) og[prop] = decodeHtmlEntities(match[1].trim());
  }

  return og;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}
