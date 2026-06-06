import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Boxes,
  Braces,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Cloud,
  Code2,
  Database,
  FileJson,
  FileText,
  Globe2,
  Layers3,
  LineChart,
  LockKeyhole,
  Menu,
  PackageCheck,
  Play,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Zap
} from "lucide-react";
import "./styles.css";

const pages = ["Platform", "How it works", "Solutions", "Pricing", "Docs", "Company"];

const pipeline = [
  { icon: Bot, title: "Crawl", text: "Discover pages" },
  { icon: Sparkles, title: "Clean", text: "Remove noise" },
  { icon: Boxes, title: "Structure", text: "Create schemas" },
  { icon: Rocket, title: "Deliver", text: "APIs and files" },
  { icon: LineChart, title: "Monitor", text: "Track freshness" }
];

const outputs = [
  ["pages.json", "Structured", Braces],
  ["content.md", "Cleaned", FileText],
  ["faqs.json", "Structured", FileJson],
  ["products.json", "Structured", PackageCheck],
  ["llms.txt", "Generated", ClipboardList]
];

const cards = [
  [Target, "Accurate", "High precision extraction agents can trust."],
  [Zap, "Fresh", "Smart recrawling keeps sources up to date."],
  [LockKeyhole, "Secure", "Policy controls for enterprise teams."],
  [BarChart3, "Observable", "Pipelines, quality, and access in one place."],
  [Sparkles, "AI-Optimized", "Structured for retrieval and agent use."]
];

const solutionCards = [
  [Cloud, "SaaS", "Docs, pricing, changelog, support."],
  [Store, "Commerce", "Products, offers, reviews, inventory."],
  [BriefcaseBusiness, "Agencies", "Client pipelines at scale."],
  [Globe2, "Local", "Hours, services, FAQs, locations."]
];

const plans = [
  ["Starter", "$29", "1 pipeline", "10k pages", "Standard connectors"],
  ["Growth", "$99", "5 pipelines", "100k pages", "All connectors"],
  ["Business", "$299", "Unlimited pipelines", "1M pages", "Priority support"],
  ["Enterprise", "Custom", "Unlimited", "Custom connectors", "SLA and compliance"]
];

const demoArtifacts = {
  llmsTxt: "/generated/demo-glasgate/llms.txt",
  llmsFullTxt: "/generated/demo-glasgate/llms.txt",
  aiIndex: "/generated/demo-glasgate/ai-index.json",
  pages: [{ url: "https://glassgate.app", markdown: "/generated/demo-glasgate/pages/home.md" }]
};

const demoAudit = {
  siteId: "demo-glasgate",
  status: "demo",
  score: 82,
  pagesProcessed: 12,
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

const formatNumber = (value) =>
  Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-US").format(Number(value)) : "0";

const artifactHref = (value) => {
  if (!value || typeof value !== "string") return "";
  if (value.startsWith("http") || value.startsWith("/")) return value;
  return `/${value}`;
};

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function normalizeAuditResult(result) {
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

async function loadFallbackDemoAudit() {
  const demoIndex = await requestJson("/generated/demo-glasgate/ai-index.json");
  return normalizeAuditResult({
    ...demoIndex,
    status: "demo",
    artifacts: {
      ...demoArtifacts,
      ...(demoIndex.artifacts || {}),
      aiIndex: "/generated/demo-glasgate/ai-index.json",
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

async function runAuditRequest(url, onJobUpdate) {
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

async function fetchTextPreview(source) {
  if (!source) return "";
  if (typeof source === "string" && (source.includes("\n") || source.trim().startsWith("#") || source.trim().startsWith("{"))) {
    return source;
  }
  const response = await fetch(artifactHref(source));
  if (!response.ok) throw new Error(`Preview failed: ${response.status}`);
  const text = await response.text();
  if (artifactHref(source).endsWith(".json")) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }
  return text;
}

function firstMarkdownSource(artifacts) {
  const firstPage = artifacts?.pages?.[0];
  if (!firstPage) return "/generated/demo-glasgate/pages/home.md";
  return firstPage.markdown || firstPage.md || firstPage.url || "/generated/demo-glasgate/pages/home.md";
}

function Logo() {
  return (
    <button className="logo" onClick={() => window.dispatchEvent(new CustomEvent("goto", { detail: "Platform" }))}>
      <LogoMark />
      <span>glassgate.app</span>
    </button>
  );
}

function LogoMark({ small = false }) {
  return (
    <span className={`logo-mark ${small ? "small" : ""}`} aria-hidden="true">
      <i />
      <b />
    </span>
  );
}

function Header({ page, setPage }) {
  return (
    <header className="header">
      <Logo />
      <nav>
        {pages.map((item) => (
          <button className={page === item ? "active" : ""} key={item} onClick={() => setPage(item)}>
            {item}
            {(item === "Solutions" || item === "Company") && <ChevronDown size={14} />}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button className="signin">Sign in</button>
        <button className="primary-button" onClick={() => setPage("Audit")}>
          Book a demo <ArrowRight size={17} />
        </button>
        <button className="mobile-menu" aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}

function HeroVisual({ mode = "website" }) {
  return (
    <div className="hero-visual" aria-label="AI-ready pipeline visualization">
      <SourceCard mode={mode} />
      <Connector side="left" />
      <Processor />
      <Connector side="right" />
      <OutputStack mode={mode} />
    </div>
  );
}

function SourceCard({ mode }) {
  const isCommerce = mode === "commerce";
  return (
    <div className="source-card float-a">
      <div className="mini-browser">
        <span />
        <span />
        <span />
      </div>
      <div className={`source-art ${isCommerce ? "commerce" : ""}`}>
        {isCommerce ? <PackageCheck size={54} /> : <Globe2 size={54} />}
      </div>
      <strong>{isCommerce ? "Product page" : "Any website"}</strong>
      <small>https://example.com</small>
    </div>
  );
}

function Processor() {
  return (
    <div className="processor float-b">
      <div className="dot-field" />
      <LogoMark />
      <strong>glassgate.app</strong>
      <span>
        <i /> Processing
      </span>
    </div>
  );
}

function OutputStack({ mode }) {
  const rows = mode === "commerce"
    ? [["Product", "Structured", PackageCheck], ["Offer", "Structured", FileJson], ["Reviews", "Structured", Sparkles], ["Shipping", "Structured", Rocket], ["FAQPage", "Structured", CircleHelp]]
    : outputs;

  return (
    <div className="output-stack">
      {rows.map(([name, status, Icon], index) => (
        <div className="output-row float-c" style={{ "--d": `${index * 0.08}s` }} key={name}>
          <span className="icon-tile">
            <Icon size={20} />
          </span>
          <div>
            <strong>{name}</strong>
            <small>{status}</small>
          </div>
          <Check size={18} />
        </div>
      ))}
    </div>
  );
}

function Connector({ side }) {
  const reverse = side === "right";
  return (
    <svg className={`connector ${side}`} viewBox="0 0 240 290" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((line) => (
        <path
          key={line}
          className="dash-line"
          style={{ "--i": line }}
          d={
            reverse
              ? `M 10 145 C 78 145, 92 ${42 + line * 52}, 226 ${42 + line * 52}`
              : `M 18 145 C 96 145, 128 ${145}, 224 ${145}`
          }
        />
      ))}
      <circle className="pulse-dot" cx={reverse ? 10 : 224} cy="145" r="6" />
    </svg>
  );
}

function Platform() {
  return (
    <>
      <section className="hero page-shell">
        <div className="hero-copy">
          <div className="pill">
            <Sparkles size={15} /> AI-ready data pipeline
          </div>
          <h1>
            Turn any website into <span>AI-ready</span> data.
          </h1>
          <p>We crawl, clean, and structure web content for agents and automations.</p>
          <div className="hero-actions">
            <button className="primary-button">Book a demo <ArrowRight size={18} /></button>
            <button className="secondary-button"><Play size={18} /> See how it works</button>
          </div>
          <div className="trust-row">
            <span><Check size={15} /> No credit card</span>
            <span><Check size={15} /> Set up in minutes</span>
            <span><Check size={15} /> Enterprise ready</span>
          </div>
        </div>
        <HeroVisual />
      </section>
      <PipelineRail />
      <FeatureCards />
      <DemoBand />
    </>
  );
}

function PipelineRail() {
  return (
    <section className="pipeline-rail page-shell">
      {pipeline.map(({ icon: Icon, title, text }, index) => (
        <div className="pipeline-step" key={title}>
          <span className="round-icon">
            <Icon size={26} />
            <b>{index + 1}</b>
          </span>
          <div>
            <strong>{title}</strong>
            <small>{text}</small>
          </div>
          {index < pipeline.length - 1 && <ArrowRight className="step-arrow" size={26} />}
        </div>
      ))}
    </section>
  );
}

function FeatureCards() {
  return (
    <section className="feature-grid page-shell">
      {cards.map(([Icon, title, text]) => (
        <article className="feature-card" key={title}>
          <span className="gradient-icon"><Icon size={25} /></span>
          <div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function DemoBand({ compact = false }) {
  return (
    <section className={`demo-band page-shell ${compact ? "compact" : ""}`}>
      <div>
        <h2>{compact ? "Ready to build AI-ready pipelines?" : "See GlassGate in action."}</h2>
        <p>{compact ? "Simple setup. Structured output. Enterprise control." : "Book a personalized demo with our team."}</p>
      </div>
      <button className="primary-button">Book a demo <ArrowRight size={18} /></button>
      <MiniDashboard />
    </section>
  );
}

function MiniDashboard() {
  return (
    <div className="mini-dashboard">
      <div className="chart-card">
        <svg viewBox="0 0 190 110">
          <polyline points="8,72 34,58 58,68 83,44 108,52 132,28 160,42 184,20" />
          {[22, 38, 56, 74, 48].map((height, index) => (
            <rect key={index} x={18 + index * 28} y={94 - height} width="14" height={height} rx="3" />
          ))}
        </svg>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <>
      <section className="simple-hero page-shell">
        <div>
          <div className="pill"><Sparkles size={15} /> How it works</div>
          <h1>From website to structured agent data.</h1>
          <p>Five steps. One clean pipeline.</p>
        </div>
        <FlowBoard />
      </section>
      <PipelineRail />
      <ArchitectureStrip />
      <DemoBand compact />
    </>
  );
}

function FlowBoard() {
  return (
    <div className="flow-board">
      <div className="flow-track" />
      {pipeline.map(({ icon: Icon, title }, index) => (
        <div className="flow-node" style={{ "--n": index }} key={title}>
          <Icon size={30} />
          <strong>{title}</strong>
        </div>
      ))}
    </div>
  );
}

function ArchitectureStrip() {
  return (
    <section className="architecture page-shell">
      <h2>Built for scale. Designed for AI.</h2>
      <div className="arch-row">
        {["Data sources", "Crawl", "Clean", "Structure", "Deliver", "Monitor", "Destinations"].map((item, index) => (
          <div className="arch-box" key={item}>
            {index === 0 ? <Database /> : index === 6 ? <Cloud /> : React.createElement(pipeline[Math.max(0, Math.min(index - 1, 4))].icon)}
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="arch-tags">
        {["Security & Compliance", "Scalable Infrastructure", "Data Lineage", "Access & Permissions"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function Solutions() {
  return (
    <>
      <section className="solutions-hero page-shell">
        <div>
          <div className="pill"><Sparkles size={15} /> AI-ready solutions</div>
          <h1>Solutions built for <span>every team.</span></h1>
          <p>Clean, structured data for real workflows.</p>
          <button className="primary-button">Book a demo <ArrowRight size={18} /></button>
        </div>
        <div className="solution-orbit">
          <Processor />
          {solutionCards.map(([Icon, title, text], index) => (
            <article className="solution-card" style={{ "--n": index }} key={title}>
              <span className="gradient-icon"><Icon size={26} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              <a>Learn more <ArrowRight size={15} /></a>
            </article>
          ))}
        </div>
      </section>
      <FeatureCards />
      <DemoBand compact />
    </>
  );
}

function Pricing() {
  return (
    <>
      <section className="pricing page-shell">
        <div className="center-heading">
          <div className="pill"><Sparkles size={15} /> Pricing</div>
          <h1>Plans that <span>scale</span> with you.</h1>
          <p>Simple pricing for every team size.</p>
        </div>
        <div className="plan-grid">
          {plans.map((plan, index) => (
            <article className={`plan-card ${index === 1 ? "popular" : ""}`} key={plan[0]}>
              {index === 1 && <b className="popular-label">Most popular</b>}
              <span className="gradient-icon">
                {index === 0 ? <Rocket /> : index === 1 ? <LineChart /> : index === 2 ? <BriefcaseBusiness /> : <Boxes />}
              </span>
              <h3>{plan[0]}</h3>
              <div className="price">{plan[1]}{plan[1].startsWith("$") && <small>/month</small>}</div>
              <button className={index === 1 ? "primary-button" : "outline-button"}>
                {index === 3 ? "Contact sales" : "Start free trial"}
              </button>
              {plan.slice(2).map((item) => (
                <p key={item}><Check size={16} /> {item}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
      <DemoBand compact />
    </>
  );
}

function Docs() {
  return (
    <>
      <section className="docs page-shell">
        <div className="docs-copy">
          <div className="pill"><Sparkles size={15} /> Docs</div>
          <h1>Docs</h1>
          <p>Build, integrate, and scale with GlassGate.</p>
          <label className="search-box">
            <Search size={25} />
            <input placeholder="Search the documentation..." />
            <kbd>⌘ K</kbd>
          </label>
        </div>
        <DocsVisual />
      </section>
      <section className="docs-grid page-shell">
        {[
          [Rocket, "Quickstart", "Get running in minutes."],
          [Braces, "API Reference", "Endpoints, objects, schemas."],
          [BookOpen, "Guides", "Best practices and tutorials."],
          [Code2, "Examples", "Real workflow snippets."],
          [ClipboardList, "Changelog", "What shipped recently."]
        ].map(([Icon, title, text]) => (
          <article className="feature-card" key={title}>
            <span className="gradient-icon"><Icon size={25} /></span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <ArrowRight size={20} />
          </article>
        ))}
      </section>
      <DemoBand compact />
    </>
  );
}

function DocsVisual() {
  return (
    <div className="docs-visual">
      <div className="code-card float-a">
        <div className="mini-browser"><span /><span /><span /></div>
        <pre>{["const gate = new GlassGate()", "await gate.audit(url)", "gate.publish('/llms.txt')"].join("\n")}</pre>
      </div>
      <div className="doc-bubble float-b"><BookOpen size={42} /></div>
      <div className="doc-bubble small float-c"><Braces size={34} /></div>
      <MiniDashboard />
    </div>
  );
}

function Company() {
  return (
    <>
      <section className="simple-hero page-shell">
        <div>
          <div className="pill"><Sparkles size={15} /> Company</div>
          <h1>The agentic web needs a delivery layer.</h1>
          <p>We make business data readable, reliable, and ready for AI systems.</p>
        </div>
        <HeroVisual />
      </section>
      <FeatureCards />
      <DemoBand compact />
    </>
  );
}

function AuditDashboard() {
  const [url, setUrl] = useState("https://example.com");
  const [audit, setAudit] = useState(demoAudit);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobLogs, setJobLogs] = useState(["Demo data loaded."]);
  const [previewTab, setPreviewTab] = useState("llms.txt");
  const [previewText, setPreviewText] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const artifacts = audit?.artifacts || demoArtifacts;
  const previewTabs = [
    ["llms.txt", artifacts.llmsTxt || demoArtifacts.llmsTxt],
    ["ai-index.json", artifacts.aiIndex || demoArtifacts.aiIndex],
    ["first page.md", firstMarkdownSource(artifacts)]
  ];

  React.useEffect(() => {
    let ignore = false;
    const activeSource = previewTabs.find(([label]) => label === previewTab)?.[1];

    async function loadPreview() {
      setIsPreviewLoading(true);
      try {
        const text = await fetchTextPreview(activeSource);
        if (!ignore) setPreviewText(text);
      } catch {
        try {
          const fallbackSource = previewTab === "ai-index.json"
            ? demoArtifacts.aiIndex
            : previewTab === "first page.md"
              ? demoArtifacts.pages[0].markdown
              : demoArtifacts.llmsTxt;
          const text = await fetchTextPreview(fallbackSource);
          if (!ignore) setPreviewText(text);
        } catch {
          if (!ignore) setPreviewText("Preview unavailable.");
        }
      } finally {
        if (!ignore) setIsPreviewLoading(false);
      }
    }

    loadPreview();
    return () => {
      ignore = true;
    };
  }, [audit, previewTab]);

  async function handleRunAudit() {
    setIsLoading(true);
    setError("");
    setJobLogs(["Starting audit..."]);
    try {
      const result = await runAuditRequest(url, (job) => {
        if (Array.isArray(job.logs)) {
          setJobLogs(job.logs.map((log) => typeof log === "string" ? log : log.message || JSON.stringify(log)));
        } else if (job.message) {
          setJobLogs((current) => [...current, job.message]);
        }
      });
      setAudit(normalizeAuditResult(result));
      setJobLogs((current) => [...current, "Audit completed."]);
    } catch (err) {
      try {
        const fallback = await loadFallbackDemoAudit();
        setAudit(fallback);
        setJobLogs(["Live API unavailable.", "Loaded /generated/demo-glasgate/ai-index.json"]);
        setError("Live API unavailable. Showing demo data.");
      } catch {
        setAudit(demoAudit);
        setJobLogs(["Live API unavailable.", "Demo fallback unavailable."]);
        setError("Live API unavailable. Showing bundled demo data.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const metrics = audit.metrics || demoAudit.metrics;
  const checks = audit.checks || demoAudit.checks;
  const issues = Array.isArray(audit.issues) ? audit.issues : [];

  return (
    <section className="audit-shell">
      <aside className="audit-sidebar">
        <Logo />
        {[
          [Sparkles, "Audit"],
          [BarChart3, "Overview"],
          [FileJson, "Artifacts"],
          [LineChart, "Logs"],
          [CircleHelp, "Recommendations"],
          [Settings, "Settings"]
        ].map(([Icon, label], index) => (
          <button className={index === 0 ? "active" : ""} key={label}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </aside>
      <main className="audit-main">
        <div className="audit-top">
          <h1>Audit Dashboard</h1>
          <div>
            <Bell size={20} />
            <CircleHelp size={20} />
            <span>AK</span>
          </div>
        </div>
        <div className="audit-controls">
          <label>
            <Globe2 size={19} />
            <input value={url} onChange={(event) => setUrl(event.target.value)} aria-label="Website URL" />
          </label>
          <label><CalendarDays size={19} /> May 12, 2026 - May 19, 2026</label>
          <button className="primary-button" onClick={handleRunAudit} disabled={isLoading}>
            <Play size={17} /> {isLoading ? "Running..." : "Run Audit"}
          </button>
        </div>
        {error && <div className="audit-alert">{error}</div>}
        <div className="audit-metrics">
          {[
            [Sparkles, "AI Readiness", audit.score ?? 0, "/100"],
            [LockKeyhole, "Pages Processed", audit.pagesProcessed ?? 0, ""],
            [Target, "HTML Tokens", formatNumber(metrics.htmlTokensEstimate), ""],
            [LineChart, "Token Savings", metrics.estimatedSavingsPercent ?? 0, "%"]
          ].map(([Icon, label, value, suffix]) => (
            <article className="metric-card" key={label}>
              <span className="gradient-icon"><Icon size={26} /></span>
              <strong>{value}<small>{suffix}</small></strong>
              <p>{label}</p>
            </article>
          ))}
        </div>
        <div className="audit-panels">
          <article className="audit-panel table-panel">
            <h2>Generated Artifacts</h2>
            {[
              ["llms.txt", artifacts.llmsTxt, FileText],
              ["llms-full.txt", artifacts.llmsFullTxt, ClipboardList],
              ["ai-index.json", artifacts.aiIndex, FileJson],
              ["first page.md", firstMarkdownSource(artifacts), FileText]
            ].map(([name, href, Icon]) => (
              <div className="table-row" key={name}>
                <span className="icon-tile"><Icon size={18} /></span>
                <strong><a href={artifactHref(href)} target="_blank" rel="noreferrer">{name}</a></strong>
                <small>{audit.status || "ready"}</small>
                <em>Success</em>
              </div>
            ))}
          </article>
          <article className="audit-panel">
            <h2>Progress Log</h2>
            {(jobLogs.length ? jobLogs : ["Waiting for audit..."]).slice(-8).map((log, index) => (
              <div className="activity-row" key={`${log}-${index}`}>
                <i /> <span>{log}</span> <small>{isLoading && index === jobLogs.length - 1 ? "Now" : ""}</small>
              </div>
            ))}
          </article>
        </div>
        <div className="audit-panels">
          <article className="audit-panel">
            <h2>Checks</h2>
            {Object.entries(checks).map(([key, passed]) => (
              <div className="activity-row" key={key}>
                <i className={passed ? "" : "warn"} /> <span>{key}</span> <small>{passed ? "Pass" : "Review"}</small>
              </div>
            ))}
          </article>
          <article className="audit-panel preview-panel">
            <h2>File Preview</h2>
            <div className="preview-tabs">
              {previewTabs.map(([label]) => (
                <button className={previewTab === label ? "active" : ""} key={label} onClick={() => setPreviewTab(label)}>
                  {label}
                </button>
              ))}
            </div>
            <pre>{isPreviewLoading ? "Loading preview..." : previewText}</pre>
          </article>
          <article className="audit-panel">
            <h2>Issues</h2>
            {(issues.length ? issues : [{ severity: "none", message: "No blocking issues detected." }]).map((issue, index) => (
              <div className="issue-row" key={`${issue.severity}-${index}`}>
                <strong>{issue.severity}</strong>
                <span>{issue.message}</span>
              </div>
            ))}
            <div className="token-summary">
              <span>Markdown tokens</span>
              <strong>{formatNumber(metrics.markdownTokensEstimate)}</strong>
              <span>Crawl time</span>
              <strong>{formatNumber(metrics.crawlMs)} ms</strong>
            </div>
          </article>
        </div>
      </main>
    </section>
  );
}

function App() {
  const [page, setPage] = useState("Platform");

  React.useEffect(() => {
    const handler = (event) => setPage(event.detail);
    window.addEventListener("goto", handler);
    return () => window.removeEventListener("goto", handler);
  }, []);

  const Page = useMemo(() => ({
    Platform,
    "How it works": HowItWorks,
    Solutions,
    Pricing,
    Docs,
    Company,
    Audit: AuditDashboard
  })[page], [page]);

  if (page === "Audit") {
    return <AuditDashboard />;
  }

  return (
    <>
      <Header page={page} setPage={setPage} />
      <main>
        <Page />
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
