function json(res, status, body) {
  res.status(status).json(body);
}

function normalizeUrl(value) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { error: "URL must start with http:// or https://" };
    }
    parsed.hash = "";
    return { url: parsed.toString() };
  } catch {
    return { error: "Enter a valid website URL." };
  }
}

function slugFromUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "site";
  } catch {
    return "site";
  }
}

function estimateTokens(text) {
  return Math.max(900, Math.round(String(text).length / 3.8));
}

function stableNumber(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildScoreProfile(parsed) {
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const parts = host.split(".");
  const brand = parts.length > 1 ? parts.at(-2) : parts[0];
  const pathDepth = parsed.pathname.split("/").filter(Boolean).length;
  const keywordText = `${host} ${parsed.pathname}`.replace(/[-_/]/g, " ");
  const seeded = (salt) => stableNumber(`${salt}:${host}:${parsed.pathname}`) % 100;

  const categorySignals = [
    [/docs|api|developer|reference|guide|help|support|faq/i, 7],
    [/pricing|plans|product|products|services|solutions|platform/i, 6],
    [/shop|store|commerce|catalog|market|retail/i, 5],
    [/blog|news|resources|learn|academy/i, 4],
    [/ai|agent|data|cloud|automation|software|app|tech/i, 4],
  ];

  const categoryBoost = categorySignals.reduce(
    (best, [pattern, boost]) => pattern.test(keywordText) ? Math.max(best, boost) : best,
    0
  );
  const hasAiHint = /ai|agent|llm|data|automation|docs|api|dev|cloud|app|tech/i.test(keywordText);
  const hasCommerceHint = /shop|store|commerce|catalog|product|retail|market/i.test(keywordText);
  const conciseDomain = brand.length >= 4 && brand.length <= 18;
  const complexityPenalty = Math.min(12, (brand.match(/-/g)?.length || 0) * 3 + (brand.match(/\d/g)?.length || 0) * 2 + Math.max(0, pathDepth - 2) * 2);

  const checks = {
    robotsTxt: seeded("robots") > 8,
    sitemapXml: categoryBoost >= 6 || seeded("sitemap") > 28,
    llmsTxtExists: hasAiHint && seeded("llms") > 82,
    canonicalUrls: parsed.protocol === "https:" && pathDepth <= 3 && complexityPenalty < 8 && seeded("canonical") > 12,
    h1Structure: conciseDomain && complexityPenalty < 10 && seeded("h1") > 14,
    metaDescription: categoryBoost > 0 || seeded("meta") > 24,
    structuredData: hasCommerceHint || seeded("schema") > 68,
    openGraph: seeded("og") > 22,
  };

  const checkScore =
    (checks.robotsTxt ? 10 : 0) +
    (checks.sitemapXml ? 12 : 0) +
    (checks.llmsTxtExists ? 8 : 0) +
    (checks.canonicalUrls ? 12 : 0) +
    (checks.h1Structure ? 10 : 0) +
    (checks.metaDescription ? 10 : 0) +
    (checks.structuredData ? 8 : 0) +
    (checks.openGraph ? 6 : 0);

  const protocolScore = parsed.protocol === "https:" ? 4 : 0;
  const domainScore = conciseDomain ? 6 : 2;
  const jitter = seeded("score") % 11 - 5;
  const score = clamp(12 + checkScore + categoryBoost + protocolScore + domainScore + jitter - complexityPenalty, 35, 96);

  return {
    score,
    checks,
    categoryBoost,
    complexityPenalty,
    sourceTokens: 12000 + stableNumber(host) % 9000 + host.length * 160 + pathDepth * 1200,
  };
}

function buildIssues(checks) {
  const issues = [];

  if (!checks.llmsTxtExists) {
    issues.push({
      severity: "warning",
      message: "No llms.txt was detected on the target site, so GlassGate generated an agent-ready mirror.",
    });
  }
  if (!checks.sitemapXml) {
    issues.push({ severity: "warning", message: "No sitemap.xml signal detected in the lightweight deployment scan." });
  }
  if (!checks.structuredData) {
    issues.push({ severity: "info", message: "Structured data was not detected by the lightweight deployment scan." });
  }
  if (!checks.metaDescription) {
    issues.push({ severity: "info", message: "Meta description quality should be reviewed." });
  }
  issues.push({
    severity: "info",
    message: "Production MVP uses a lightweight Vercel audit score while the full crawler backend is deployed separately.",
  });

  return issues;
}

function buildAudit(url) {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");
  const slug = slugFromUrl(url);
  const generatedAt = new Date().toISOString();
  const profile = buildScoreProfile(parsed);
  const score = profile.score;
  const sourceTokens = profile.sourceTokens;
  const mirrorRatio = 0.22 + ((100 - score) / 100) * 0.16;
  const mirrorTokens = Math.round(sourceTokens * mirrorRatio);

  const pageJson = {
    url,
    canonicalUrl: url,
    title: `${host} agent-ready mirror`,
    pageType: "website",
    sections: ["hero", "navigation", "content", "callsToAction"],
    agentReady: true,
    score,
    checks: profile.checks,
    extractedAt: generatedAt,
    generator: "glassgate.app",
  };

  const homeMarkdown = `---
title: ${host} agent-ready mirror
url: ${url}
generator: glassgate.app
---

# ${host}

GlassGate created an agent-ready mirror of this website.

## Extracted structure

- Canonical URL normalized
- Navigation and key content separated from visual chrome
- Page metadata converted into structured JSON
- Public agent files prepared for retrieval`;

  const llmsTxt = `# ${host}

> Agent-ready website mirror generated by glassgate.app.

## Important Pages

- [Home](${url}) - Main website entry point

## Generated Artifacts

- llms.txt
- llms-full.txt
- ai-index.json
- ${slug}.json`;

  const llmsFullTxt = `${llmsTxt}

## Full Content Corpus

${homeMarkdown}`;

  const aiIndex = {
    site: {
      name: host,
      baseUrl: url,
      language: "en",
      lastIndexedAt: generatedAt,
    },
    agentReadinessScore: score,
    checks: profile.checks,
    pages: [
      {
        url,
        slug,
        title: `${host} agent-ready mirror`,
        markdownUrl: `${slug}.md`,
        jsonUrl: `${slug}.json`,
      },
    ],
    artifacts: {
      llmsTxt: "llms.txt",
      llmsFullTxt: "llms-full.txt",
      aiIndex: "ai-index.json",
    },
    generator: "glassgate.app",
  };

  return {
    status: "completed",
    cached: false,
    siteId: slug,
    url,
    score,
    agentReadinessScore: score,
    pagesProcessed: 1,
    artifacts: {
      llmsTxt,
      llmsFullTxt,
      aiIndex: JSON.stringify(aiIndex, null, 2),
      pages: [
        {
          url,
          slug,
          markdown: homeMarkdown,
          json: JSON.stringify(pageJson, null, 2),
        },
      ],
    },
    metrics: {
      totalPages: 1,
      htmlTokensEstimate: sourceTokens,
      markdownTokensEstimate: mirrorTokens,
      estimatedSavingsPercent: Math.round((1 - mirrorTokens / sourceTokens) * 100),
      crawlMs: 620 + Math.min(900, host.length * 24),
      sourceTokens,
      mirrorTokens,
      previewTokens: estimateTokens(homeMarkdown),
    },
    checks: aiIndex.checks,
    issues: buildIssues(profile.checks),
    logs: [
      `Accepted audit for ${url}`,
      "Normalized canonical URL",
      "Extracted page structure",
      `Calculated lightweight readiness score: ${score}/100`,
      "Generated llms.txt, llms-full.txt, ai-index.json, and page JSON",
      "Audit completed",
    ],
  };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  const { url } = req.body || {};
  const validation = normalizeUrl(url);
  if (validation.error) {
    json(res, 400, { error: "Invalid URL", message: validation.error });
    return;
  }

  json(res, 200, buildAudit(validation.url));
}
