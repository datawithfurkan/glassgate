import {
  ArrowRight,
  Braces,
  CalendarDays,
  ExternalLink,
  FileJson,
  FileText,
  Globe2,
  LockKeyhole,
  MoreHorizontal,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import {
  artifactHref,
  firstMarkdownSource,
  firstPagePreviewLabel,
} from "../auditUtils.js";
import {
  readinessChecks,
  siteArtifacts,
  topRecommendations,
} from "../demoData.js";
import {
  DonutGauge,
  FadeIn,
  MetricTile,
  PremiumPanel,
  StatusDot,
} from "../components/Visuals.jsx";

export function AuditPage({ auditState }) {
  const {
    url,
    setUrl,
    audit,
    isLoading,
    error,
    jobLogs,
    runAudit,
    artifacts,
    metrics,
    apiStatus,
    refreshApiStatus,
    isLive,
  } = auditState;

  const score = isLive ? (audit.score ?? 82) : 82;
  const savings = isLive ? (metrics.estimatedSavingsPercent ?? 24.3) : 24.3;

  const artifactRows = isLive
    ? [
        ["llms.txt", artifacts.llmsTxt, FileText, "Generated Index"],
        ["ai-index.json", artifacts.aiIndex, FileJson, "Structured Index"],
        [firstPagePreviewLabel(artifacts), firstMarkdownSource(artifacts), FileText, "Page Mirror"],
      ]
    : siteArtifacts.map((a) => [a.name, "#", Braces, a.type]);

  return (
    <AppShell
      activePage="audit"
      breadcrumb="Audit › Site Detail"
      title="example.com"
      subtitle=""
      actions={
        <>
          <button type="button" className="outline-button premium-outline">
            <CalendarDays size={16} /> May 12 – May 19, 2026
          </button>
          <button type="button" className="primary-button shimmer-btn" onClick={runAudit} disabled={isLoading}>
            <Play size={16} /> {isLoading ? "Running..." : "Run Audit"} <ArrowRight size={16} />
          </button>
        </>
      }
    >
      <FadeIn className="site-detail-hero premium-glass">
        <div className="site-thumb animated-thumb" />
        <div className="site-detail-copy">
          <h2 className="site-domain">example.com</h2>
          <a href={url} target="_blank" rel="noreferrer" className="site-url-link">
            {url} <ExternalLink size={14} />
          </a>
          <p className="app-muted">Last audit: May 19, 2026, 9:42 AM · <button type="button" className="text-link">View full report</button></p>
        </div>
        <div className="site-detail-actions">
          <span className={`app-api-status ${apiStatus.state}`}>
            {apiStatus.state === "connected" ? "● Live API" : "○ API offline"}
          </span>
          {apiStatus.state !== "connected" && (
            <button type="button" className="outline-button app-api-retry" onClick={refreshApiStatus}>Retry</button>
          )}
        </div>
      </FadeIn>

      {error && <div className="audit-alert">{error}</div>}

      <div className="audit-controls site-url-control premium-glass">
        <label>
          <Globe2 size={19} />
          <input value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Website URL" />
        </label>
      </div>

      <div className="dash-metrics-row metrics-5">
        <MetricTile icon={Sparkles} label="AI Readiness Score" value={`${score}/100`} delta="+12 pts vs May 3" highlight delay={0} />
        <MetricTile icon={LockKeyhole} label="Content Access" value="91%" delta="+8% vs May 3" delay={50} />
        <MetricTile icon={Target} label="Discoverability" value="76%" delta="+9% vs May 3" delay={100} />
        <MetricTile icon={Sparkles} label="Token Savings" value={`${savings}%`} delta="+6.7% vs May 3" delay={150} />
        <MetricTile icon={Globe2} label="Accessibility" value="88%" delta="+7% vs May 3" delay={200} />
      </div>

      <div className="audit-panels audit-detail-panels">
        <PremiumPanel className="table-panel" delay={250}>
          <h2>Generated Artifacts</h2>
          <div className="app-table premium-table artifact-detail-table">
            <div className="app-table-head">
              <span>Artifact</span>
              <span>Type</span>
              <span>Generated</span>
              <span>Status</span>
              <span>Size</span>
              <span />
            </div>
            {artifactRows.map(([name, href, Icon, type], i) => (
              <FadeIn as="div" className="app-table-row premium-table-row" key={name} delay={280 + i * 40}>
                <span className="app-file-cell">
                  <span className="icon-tile"><Icon size={18} /></span>
                  <strong>
                    {typeof href === "string" && href.startsWith("/")
                      ? <a href={artifactHref(href)} target="_blank" rel="noreferrer">{name}</a>
                      : name}
                  </strong>
                </span>
                <span className="app-muted">{type}</span>
                <span>May 19, 9:42 AM</span>
                <span className="status-pill success"><StatusDot /> Success</span>
                <span>12 KB</span>
                <span className="row-menu"><MoreHorizontal size={16} /></span>
              </FadeIn>
            ))}
          </div>
          <p className="app-muted">5 artifacts generated · <button type="button" className="text-link">View all artifacts</button></p>
        </PremiumPanel>

        <PremiumPanel className="readiness-panel" delay={300}>
          <h2>Readiness Summary</h2>
          <DonutGauge value={score} size={148} stroke={14} sublabel="/100" />
          {readinessChecks.map(({ label, status }) => (
            <div className="readiness-check-row" key={label}>
              <StatusDot status={status === "Needs Work" ? "warn" : "success"} />
              <span>{label}</span>
              <small className={status === "Needs Work" ? "status-warn" : "status-success"}>{status}</small>
            </div>
          ))}
          <div className="readiness-note">
            Your site is well-structured for AI consumption. Improve internal linking to boost discoverability.
          </div>
        </PremiumPanel>
      </div>

      <section className="dash-rec-cards">
        <h2>Top Recommendations</h2>
        <div className="rec-card-grid">
          {topRecommendations.map((rec, i) => (
            <FadeIn className="rec-card premium-glass hover-lift" key={rec.title} delay={360 + i * 60}>
              <Sparkles size={20} />
              <h3>{rec.title}</h3>
              <p>{rec.desc}</p>
              <span className={`impact-badge ${rec.impact.includes("High") ? "high" : "medium"}`}>{rec.impact}</span>
            </FadeIn>
          ))}
        </div>
      </section>

      <FadeIn className="audit-panel dash-cta-banner premium-glass" delay={500}>
        <div>
          <h2>Make your content AI-ready</h2>
          <p>Run regular audits to stay ahead and maximize your visibility in AI systems.</p>
        </div>
        <div className="dash-cta-actions">
          <button type="button" className="primary-button shimmer-btn">Schedule Recurring Audit</button>
          <button type="button" className="outline-button premium-outline">Export Report</button>
        </div>
      </FadeIn>

      <PremiumPanel delay={540}>
        <h2>Progress Log</h2>
        <div className="app-scroll-panel premium-log">
          {(jobLogs.length ? jobLogs : ["Enter a URL and run audit to see live progress."]).map((log, index) => (
            <div className="activity-row" key={`${log}-${index}`}>
              <i className={index === jobLogs.length - 1 && isLoading ? "pulse" : ""} />
              <span>{log}</span>
            </div>
          ))}
        </div>
      </PremiumPanel>
    </AppShell>
  );
}
