import { apiFetch, apiJson, apiUrl } from "./api.js";

export const demoArtifacts = {
  llmsTxt: "/generated/demo-glasgate/llms.txt",
  llmsFullTxt: "/generated/demo-glasgate/llms-full.txt",
  aiIndex: "/generated/demo-glasgate/ai-index.json",
  pages: [{ url: "https://glassgate.app", slug: "home", markdown: "/generated/demo-glasgate/pages/home.md", json: "/generated/demo-glasgate/pages/home.json" }]
};

export const embeddedDemoIndex = {
  site: {
    url: "https://glassgate.app",
    title: "glassgate.app",
    description: "AI-ready data pipelines for the web.",
    language: "en",
    lastIndexedAt: "2026-06-06T12:00:00.000Z"
  },
  agentReadinessScore: 82,
  checks: {
    robotsTxt: true,
    sitemapXml: true,
    llmsTxtExists: false,
    canonicalUrls: true,
    h1Structure: true,
    metaDescription: true,
    structuredData: false,
    openGraph: true
  },
  artifacts: {
    llmsTxt: "inline:llms.txt",
    llmsFullTxt: "inline:llms-full.txt"
  },
  pages: [
    {
      url: "https://glassgate.app/",
      title: "glassgate.app — AI-ready data pipelines",
      description: "Turn any website into clean, structured, AI-ready data.",
      language: "en",
      markdownUrl: "inline:home.md",
      jsonUrl: "inline:home.json",
      wordCount: 412,
      hasH1: true,
      hasMeta: true
    }
  ],
  metrics: {
    totalPages: 2,
    totalWords: 730,
    htmlTokensEstimate: 18400,
    markdownTokensEstimate: 6200,
    estimatedSavingsPercent: 66,
    crawlMs: 1240
  },
  issues: [
    { severity: "warning", message: "No llms.txt found on target site — glassgate.app will generate one." },
    { severity: "info", message: "No JSON-LD structured data found." }
  ]
};

export const embeddedDemoFiles = {
  "inline:llms.txt": `# glassgate.app

> AI-ready data pipelines for the web.

## Important Pages

- [Home](https://glassgate.app/) - Overview
- [Platform](https://glassgate.app/platform) - Pipeline
- [Docs](https://glassgate.app/docs) - API reference`,
  "inline:llms-full.txt": `# glassgate.app Full Agent Corpus

Turn any website into clean, structured, AI-ready data for agents and automations.`,
  "inline:home.md": `---
title: glassgate.app — AI-ready data pipelines
url: https://glassgate.app/
generator: glassgate.app
---

# glassgate.app

Turn any website into clean, structured, AI-ready data.`,
  "inline:home.json": JSON.stringify({
    url: "https://glassgate.app/",
    title: "glassgate.app",
    generator: "glassgate.app"
  }, null, 2)
};

embeddedDemoFiles["inline:ai-index.json"] = JSON.stringify(embeddedDemoIndex, null, 2);

export const demoAudit = {
  siteId: "demo-glasgate",
  status: "demo",
  score: 82,
  pagesProcessed: 12,
  url: "https://example.com",
  artifacts: demoArtifacts,
  metrics: {
    htmlTokensEstimate: 18420,
    markdownTokensEstimate: 4620,
    estimatedSavingsPercent: 74.9,
    crawlMs: 1240
  },
  checks: {
    robotsTxt: true,
    sitemapXml: true,
    canonicalUrls: true,
    h1Structure: true,
    structuredData: false,
    llmsTxtExists: false
  },
  issues: [
    { severity: "medium", message: "Add structured data for key product pages." },
    { severity: "low", message: "Publish llms.txt for faster agent discovery." }
  ]
};

export const formatNumber = (value) =>
  Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-US").format(Number(value)) : "0";

export function artifactHref(value) {
  if (!value || typeof value !== "string") return "";
  if (embeddedDemoFiles[value]) {
    const mime = value.endsWith(".json") ? "application/json" : "text/plain";
    return `data:${mime};charset=utf-8,${encodeURIComponent(embeddedDemoFiles[value])}`;
  }
  if (value.includes("\n") || value.trim().startsWith("#") || value.trim().startsWith("{")) {
    return `data:text/plain;charset=utf-8,${encodeURIComponent(value)}`;
  }
  if (value.startsWith("http") || value.startsWith("/")) return apiUrl(value);
  return `/${value}`;
}

export async function requestJson(url, options) {
  const path = url.startsWith("http") ? url.replace(getApiBaseFromUrl(url), "") || url : url;
  if (url.startsWith("http")) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  }
  return apiJson(path, options);
}

function getApiBaseFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return "";
  }
}

export function normalizeAuditResult(result) {
  const live = result.status === "completed" || result.cached === true;
  const pages = result.artifacts?.pages || result.pages?.map((page) => ({
    url: page.url,
    slug: page.slug,
    markdown: page.markdown || page.markdownUrl,
    json: page.json || page.jsonUrl
  })) || (live ? [] : demoArtifacts.pages);

  const base = live
    ? {
        status: result.cached ? "cached" : "completed",
        score: 0,
        pagesProcessed: 0,
        artifacts: { pages: [] },
        metrics: {},
        checks: {},
        issues: [],
      }
    : demoAudit;

  return {
    ...base,
    ...result,
    score: result.score ?? result.agentReadinessScore ?? base.score,
    pagesProcessed:
      result.pagesProcessed ??
      result.metrics?.totalPages ??
      result.pages?.length ??
      base.pagesProcessed,
    artifacts: {
      ...(live ? {} : demoArtifacts),
      ...(result.artifacts || {}),
      aiIndex: result.artifacts?.aiIndex || (live ? null : demoArtifacts.aiIndex),
      pages,
    },
    metrics: { ...(live ? {} : demoAudit.metrics), ...(result.metrics || {}) },
    checks: { ...(live ? {} : demoAudit.checks), ...(result.checks || {}) },
    issues: Array.isArray(result.issues) ? result.issues : [],
  };
}

export async function loadFallbackDemoAudit() {
  let demoIndex = embeddedDemoIndex;
  try {
    demoIndex = await apiJson("/generated/demo-glasgate/ai-index.json");
  } catch {
    demoIndex = embeddedDemoIndex;
  }

  return normalizeAuditResult({
    ...demoIndex,
    status: "demo",
    artifacts: {
      ...demoArtifacts,
      ...(demoIndex.artifacts || {}),
      llmsFullTxt: demoIndex === embeddedDemoIndex ? "inline:llms-full.txt" : demoArtifacts.llmsFullTxt,
      aiIndex: demoIndex === embeddedDemoIndex ? "inline:ai-index.json" : "/generated/demo-glasgate/ai-index.json",
      pages: demoIndex.pages?.map((page) => ({
        url: page.url,
        markdown: page.markdownUrl || page.markdown,
        json: page.jsonUrl || page.json
      }))
    }
  });
}

async function pollAuditResult(pollUrl, onJobUpdate) {
  const path = pollUrl.startsWith("http") ? pollUrl : pollUrl;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 500 : 2000));
    const job = await apiJson(path.startsWith("/") ? path : `/api/jobs/${path}`);
    onJobUpdate?.(job);
    if (job.status === "completed") return job.result || job;
    if (job.status === "failed" || job.error) {
      throw new Error(job.error || job.message || "Audit failed");
    }
  }
  throw new Error("Audit timed out after 90 seconds");
}

export async function runAuditRequest(url, onJobUpdate) {
  const result = await apiJson("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, force: true }),
  });

  onJobUpdate?.(result);

  if (result.cached && result.status === "completed") {
    return result;
  }

  if (result.jobId || result.pollUrl) {
    const pollPath = result.pollUrl || `/api/jobs/${result.jobId}`;
    return pollAuditResult(pollPath, onJobUpdate);
  }

  return result.result || result;
}

export async function fetchTextPreview(source) {
  if (!source) return "";
  if (embeddedDemoFiles[source]) return embeddedDemoFiles[source];
  if (typeof source === "string" && (source.includes("\n") || source.trim().startsWith("#") || source.trim().startsWith("{"))) {
    return source;
  }
  const response = await apiFetch(source.startsWith("/") || source.startsWith("http") ? source : `/${source}`);
  if (!response.ok) throw new Error(`Preview failed: ${response.status}`);
  const text = await response.text();
  if (artifactHref(source).includes(".json")) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }
  return text;
}

export function firstMarkdownSource(artifacts) {
  const firstPage = artifacts?.pages?.[0];
  if (!firstPage) return "/generated/demo-glasgate/pages/home.md";
  return firstPage.markdown || firstPage.md || firstPage.url || "/generated/demo-glasgate/pages/home.md";
}

export function firstPagePreviewLabel(artifacts) {
  const firstPage = artifacts?.pages?.[0];
  const slug = firstPage?.slug || "home";
  return `${slug}.md`;
}

export function firstPageJsonSource(artifacts) {
  const firstPage = artifacts?.pages?.[0];
  if (!firstPage) return "/generated/demo-glasgate/pages/home.json";
  return firstPage.json || firstPage.jsonUrl || `/generated/demo-glasgate/pages/home.json`;
}

export function getArtifactRows(artifacts, status = "completed") {
  return [
    ["llms.txt", artifacts.llmsTxt, "Markdown index"],
    ["llms-full.txt", artifacts.llmsFullTxt, "Full corpus"],
    ["ai-index.json", artifacts.aiIndex, "Structured index"],
    ["Page preview (.md)", firstMarkdownSource(artifacts), "Page mirror"],
    ...(artifacts.pages || []).slice(1).flatMap((page, index) => [
      [`page ${index + 2}.md`, page.markdown || page.markdownUrl, page.url || "Page mirror"],
      [`page ${index + 2}.json`, page.json || page.jsonUrl, "Structured JSON"]
    ])
  ].map(([name, href, detail]) => ({ name, href, detail, status }));
}

export const recommendationActions = {
  structuredData: "Add JSON-LD schema markup for key pages (Product, Organization, FAQPage).",
  llmsTxtExists: "Publish an llms.txt file or let glassgate.app generate one automatically.",
  sitemapXml: "Add a sitemap.xml so agents can discover all public pages.",
  robotsTxt: "Publish robots.txt and allow GlassGateBot for reliable crawling.",
  canonicalUrls: "Add canonical URLs to prevent duplicate content in agent indexes.",
  h1Structure: "Ensure every page has a single descriptive H1 heading.",
  metaDescription: "Add meta descriptions to improve agent summarization quality.",
  openGraph: "Add Open Graph tags for richer social and agent previews."
};
