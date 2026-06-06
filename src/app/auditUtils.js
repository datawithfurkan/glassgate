export const demoArtifacts = {
  llmsTxt: "/generated/demo-glasgate/llms.txt",
  llmsFullTxt: "/generated/demo-glasgate/llms-full.txt",
  aiIndex: "/generated/demo-glasgate/ai-index.json",
  pages: [{ url: "https://glasgate.ai", slug: "home", markdown: "/generated/demo-glasgate/pages/home.md", json: "/generated/demo-glasgate/pages/home.json" }]
};

export const embeddedDemoIndex = {
  site: {
    url: "https://glasgate.ai",
    title: "glasgate.ai",
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
      url: "https://glasgate.ai/",
      title: "glasgate.ai — AI-ready data pipelines",
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
    { severity: "warning", message: "No llms.txt found on target site — glasgate.ai will generate one." },
    { severity: "info", message: "No JSON-LD structured data found." }
  ]
};

export const embeddedDemoFiles = {
  "inline:llms.txt": `# glasgate.ai

> AI-ready data pipelines for the web.

## Important Pages

- [Home](https://glasgate.ai/) - Overview
- [Platform](https://glasgate.ai/platform) - Pipeline
- [Docs](https://glasgate.ai/docs) - API reference`,
  "inline:llms-full.txt": `# glasgate.ai Full Agent Corpus

Turn any website into clean, structured, AI-ready data for agents and automations.`,
  "inline:home.md": `---
title: glasgate.ai — AI-ready data pipelines
url: https://glasgate.ai/
generator: glasgate.ai
---

# glasgate.ai

Turn any website into clean, structured, AI-ready data.`,
  "inline:home.json": JSON.stringify({
    url: "https://glasgate.ai/",
    title: "glasgate.ai",
    generator: "glasgate.ai"
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
  if (value.startsWith("http") || value.startsWith("/")) return value;
  return `/${value}`;
}

export async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export function normalizeAuditResult(result) {
  const pages = result.artifacts?.pages || result.pages?.map((page) => ({
    url: page.url,
    markdown: page.markdown || page.markdownUrl,
    json: page.json || page.jsonUrl
  })) || demoArtifacts.pages;

  return {
    ...demoAudit,
    ...result,
    score: result.score ?? result.agentReadinessScore ?? demoAudit.score,
    pagesProcessed: result.pagesProcessed ?? result.metrics?.totalPages ?? result.pages?.length ?? demoAudit.pagesProcessed,
    artifacts: {
      ...demoArtifacts,
      ...(result.artifacts || {}),
      aiIndex: result.artifacts?.aiIndex || demoArtifacts.aiIndex,
      pages
    },
    metrics: { ...demoAudit.metrics, ...(result.metrics || {}) },
    checks: { ...demoAudit.checks, ...(result.checks || {}) },
    issues: Array.isArray(result.issues) ? result.issues : []
  };
}

export async function loadFallbackDemoAudit() {
  let demoIndex = embeddedDemoIndex;
  try {
    demoIndex = await requestJson("/generated/demo-glasgate/ai-index.json");
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
  for (let attempt = 0; attempt < 45; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const job = await requestJson(pollUrl);
    onJobUpdate?.(job);
    if (job.status === "completed") return job.result || job;
    if (job.status === "failed" || job.error) throw new Error(job.message || job.error || "Audit failed");
  }
  throw new Error("Audit timed out");
}

export async function runAuditRequest(url, onJobUpdate) {
  const result = await requestJson("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  onJobUpdate?.(result);
  if (result.jobId || result.pollUrl) {
    return pollAuditResult(result.pollUrl || `/api/jobs/${result.jobId}`, onJobUpdate);
  }
  return result.result || result;
}

export async function fetchTextPreview(source) {
  if (!source) return "";
  if (embeddedDemoFiles[source]) return embeddedDemoFiles[source];
  if (typeof source === "string" && (source.includes("\n") || source.trim().startsWith("#") || source.trim().startsWith("{"))) {
    return source;
  }
  const response = await fetch(artifactHref(source));
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
  llmsTxtExists: "Publish an llms.txt file or let glasgate.ai generate one automatically.",
  sitemapXml: "Add a sitemap.xml so agents can discover all public pages.",
  robotsTxt: "Publish robots.txt and allow GlassGateBot for reliable crawling.",
  canonicalUrls: "Add canonical URLs to prevent duplicate content in agent indexes.",
  h1Structure: "Ensure every page has a single descriptive H1 heading.",
  metaDescription: "Add meta descriptions to improve agent summarization quality.",
  openGraph: "Add Open Graph tags for richer social and agent previews."
};
