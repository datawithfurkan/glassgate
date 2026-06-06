import { AppShell } from "../AppShell.jsx";

export function LogsPage({ auditState }) {
  const { jobLogs, isLoading, audit } = auditState;
  const logs = jobLogs.length ? jobLogs : ["No logs yet. Run an audit to populate this view."];

  return (
    <AppShell activePage="logs" title="Logs" subtitle="Full crawl and generation timeline for the active audit.">
      <div className="app-toolbar">
        <div className="app-chip">{logs.length} entries</div>
        <div className="app-chip">Status: {isLoading ? "running" : audit.status || "idle"}</div>
      </div>

      <article className="audit-panel app-wide-panel">
        <div className="app-panel-head">
          <h2>Activity Log</h2>
          <span className="app-muted">Newest entries last</span>
        </div>
        <div className="app-scroll-panel app-scroll-panel-tall">
          {logs.map((log, index) => (
            <div className="activity-row app-log-row" key={`${log}-${index}`}>
              <i className={isLoading && index === logs.length - 1 ? "pulse" : ""} />
              <span>{log}</span>
              <small>{index === logs.length - 1 && isLoading ? "Now" : `#${index + 1}`}</small>
            </div>
          ))}
        </div>
      </article>

      <div className="audit-panels">
        <article className="audit-panel">
          <h2>Pipeline Steps</h2>
          {["Fetch robots.txt", "Check llms.txt", "Parse sitemap", "Crawl pages", "Score site", "Generate artifacts", "Save to disk"].map((step) => (
            <div className="activity-row" key={step}>
              <i />
                <span>{step}</span>
                <small>Ready</small>
            </div>
          ))}
        </article>
        <article className="audit-panel">
          <h2>Latest Job</h2>
          <div className="token-summary">
            <span>Site ID</span>
            <strong>{audit.siteId || "—"}</strong>
            <span>Pages processed</span>
            <strong>{audit.pagesProcessed ?? 0}</strong>
            <span>Crawl time</span>
            <strong>{audit.metrics?.crawlMs ?? 0} ms</strong>
            <span>Result</span>
            <strong>{audit.status || "idle"}</strong>
          </div>
        </article>
      </div>
    </AppShell>
  );
}
