import { ArrowUpRight, Globe2, LineChart, Sparkles, Target } from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import { formatNumber } from "../auditUtils.js";
import { goToAppPage } from "../navigation.js";

const recentAudits = [
  { url: "https://example.com", score: 82, pages: 5, status: "completed" },
  { url: "https://glassgate.app", score: 82, pages: 2, status: "completed" },
  { url: "https://hamburg.de", score: 55, pages: 1, status: "completed" }
];

export function OverviewPage({ auditState }) {
  const { audit, metrics, url } = auditState;
  const avgScore = Math.round((recentAudits.reduce((sum, item) => sum + item.score, 0) + (audit.score ?? 0)) / (recentAudits.length + 1));

  return (
    <AppShell activePage="overview" title="Overview" subtitle="Pipeline health, recent audits, and savings at a glance.">
      <div className="audit-metrics">
        {[
          [Sparkles, "Avg. Readiness", avgScore, "/100"],
          [Globe2, "Sites Indexed", recentAudits.length + 1, ""],
          [Globe2, "Pages Processed", audit.pagesProcessed ?? 0, ""],
          [LineChart, "Token Savings", metrics.estimatedSavingsPercent ?? 0, "%"]
        ].map(([Icon, label, value, suffix]) => (
          <article className="metric-card" key={label}>
            <span className="gradient-icon"><Icon size={26} /></span>
            <strong>{value}<small>{suffix}</small></strong>
            <p>{label}</p>
          </article>
        ))}
      </div>

      <div className="audit-panels app-panels-single">
        <article className="audit-panel app-wide-panel">
          <div className="app-panel-head">
            <h2>Score Trend</h2>
            <span className="app-chip">Last 7 days</span>
          </div>
          <div className="mini-dashboard app-chart-wide">
            <div className="chart-card">
              <svg viewBox="0 0 190 110" aria-hidden="true">
                <polyline points="8,72 34,58 58,68 83,44 108,52 132,28 160,42 184,20" />
                {[22, 38, 56, 74, 48, 62, 40].map((height, index) => (
                  <rect key={index} x={18 + index * 24} y={94 - height} width="14" height={height} rx="3" />
                ))}
              </svg>
            </div>
          </div>
        </article>
      </div>

      <article className="audit-panel app-wide-panel">
        <div className="app-panel-head">
          <h2>Recent Audits</h2>
          <button className="text-link" onClick={() => goToAppPage("audit")}>Run new audit <ArrowUpRight size={16} /></button>
        </div>
        <div className="app-table">
          <div className="app-table-head">
            <span>URL</span>
            <span>Score</span>
            <span>Pages</span>
            <span>Status</span>
          </div>
          {[...recentAudits, { url, score: audit.score ?? 0, pages: audit.pagesProcessed ?? 0, status: audit.status || "completed" }]
            .slice(-4)
            .reverse()
            .map((item) => (
              <div className="app-table-row" key={item.url}>
                <strong>{item.url}</strong>
                <span>{item.score}/100</span>
                <span>{item.pages}</span>
                <em>{item.status}</em>
              </div>
            ))}
        </div>
      </article>

      <div className="app-quick-actions">
        {[
          ["Audit", "audit"],
          ["Artifacts", "artifacts"],
          ["Recommendations", "recommendations"]
        ].map(([label, pageId]) => (
          <button className="outline-button" key={pageId} onClick={() => goToAppPage(pageId)}>
            Open {label}
          </button>
        ))}
      </div>
    </AppShell>
  );
}
