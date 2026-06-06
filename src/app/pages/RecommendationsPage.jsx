import { Check, CircleHelp } from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import { formatNumber, recommendationActions } from "../auditUtils.js";
import { goToAppPage } from "../navigation.js";

export function RecommendationsPage({ auditState }) {
  const { issues, checks, metrics, audit } = auditState;

  const failedChecks = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([key]) => ({
      key,
      title: key,
      action: recommendationActions[key] || `Improve ${key} to increase AI readiness.`
    }));

  const allRecommendations = [
    ...issues.map((issue) => ({
      severity: issue.severity,
      title: issue.message,
      action: "Review the affected pages and re-run the audit after publishing fixes."
    })),
    ...failedChecks.map((item) => ({
      severity: "warning",
      title: `${item.title} needs attention`,
      action: item.action
    }))
  ];

  const items = allRecommendations.length
    ? allRecommendations
    : [{ severity: "success", title: "No blocking issues detected.", action: "Your site looks agent-ready. Keep content fresh and re-audit regularly." }];

  return (
    <AppShell activePage="recommendations" title="Recommendations" subtitle="Actionable improvements based on checks and audit issues.">
      <div className="audit-metrics">
        {[
          [CircleHelp, "Open Issues", issues.length, ""],
          [Check, "Checks Passed", Object.values(checks).filter(Boolean).length, ""],
          [Check, "Checks Review", Object.values(checks).filter((v) => !v).length, ""],
          [CircleHelp, "Readiness", audit.score ?? 0, "/100"]
        ].map(([Icon, label, value, suffix]) => (
          <article className="metric-card" key={label}>
            <span className="gradient-icon"><Icon size={26} /></span>
            <strong>{value}<small>{suffix}</small></strong>
            <p>{label}</p>
          </article>
        ))}
      </div>

      <article className="audit-panel app-wide-panel">
        <div className="app-panel-head">
          <h2>Top Recommendations</h2>
          <button className="text-link" onClick={() => goToAppPage("audit")}>Re-run audit</button>
        </div>
        <div className="app-recommendation-list">
          {items.map((item, index) => (
            <article className="app-recommendation-card" key={`${item.title}-${index}`}>
              <div className="app-rec-head">
                <strong className={`severity-${item.severity}`}>{item.severity}</strong>
                <h3>{item.title}</h3>
              </div>
              <p>{item.action}</p>
            </article>
          ))}
        </div>
      </article>

      <div className="audit-panels">
        <article className="audit-panel">
          <h2>Checks</h2>
          {Object.entries(checks).map(([key, passed]) => (
            <div className="activity-row" key={key}>
              <i className={passed ? "" : "warn"} />
              <span>{key}</span>
                <small>{passed ? "Pass" : "Review"}</small>
            </div>
          ))}
        </article>
        <article className="audit-panel">
          <h2>Impact Summary</h2>
          <div className="token-summary">
            <span>Markdown tokens</span>
            <strong>{formatNumber(metrics.markdownTokensEstimate)}</strong>
            <span>Estimated savings</span>
            <strong>{metrics.estimatedSavingsPercent ?? 0}%</strong>
            <span>Pages processed</span>
            <strong>{audit.pagesProcessed ?? 0}</strong>
            <span>Crawl time</span>
            <strong>{formatNumber(metrics.crawlMs)} ms</strong>
          </div>
        </article>
      </div>
    </AppShell>
  );
}
