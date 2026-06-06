import { Download, Play, Search } from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import { logEvents } from "../demoData.js";
import { goToAppPage } from "../navigation.js";

const summaryCards = [
  ["Audit Runs", "24", "+26%"],
  ["Crawl Events", "3,842", "+18%"],
  ["Content Changes", "342", "+14%"],
  ["Freshness Alerts", "28", "-12%"],
  ["Bot Access Events", "192", "+8%"],
];

export function LogsPage() {
  return (
    <AppShell
      activePage="logs"
      title="Activity Logs & Monitoring"
      subtitle="Real-time visibility into audits, crawls, content changes, and system activity."
      actions={
        <>
          <button type="button" className="outline-button"><Download size={16} /> Export Logs</button>
          <button type="button" className="primary-button" onClick={() => goToAppPage("audit")}>
            <Play size={16} /> Run Audit
          </button>
        </>
      }
    >
      <div className="dash-filter-bar">
        <button type="button" className="outline-button">May 12, 2026 – May 19, 2026</button>
        <button type="button" className="outline-button">All Event Types</button>
        <button type="button" className="outline-button">All Statuses</button>
        <button type="button" className="outline-button">All Sources</button>
        <button type="button" className="outline-button">All Severity</button>
        <button type="button" className="text-link">Clear</button>
        <button type="button" className="text-link">Save View</button>
      </div>

      <div className="audit-metrics dash-metrics-5">
        {summaryCards.map(([label, value, delta]) => (
          <article className="metric-card dash-metric-card" key={label}>
            <strong>{value}</strong>
            <p>{label}</p>
            <small className={`metric-delta ${delta.startsWith("-") ? "negative" : "positive"}`}>{delta} vs previous period</small>
          </article>
        ))}
      </div>

      <div className="audit-panels">
        <article className="audit-panel">
          <h2>Crawl Volume</h2>
          <div className="mini-dashboard app-chart-wide">
            <div className="chart-card">
              <svg viewBox="0 0 190 110" aria-hidden="true">
                <polyline points="8,72 34,58 58,68 83,44 108,52 132,28 160,42 184,20" />
              </svg>
            </div>
          </div>
        </article>
        <article className="audit-panel">
          <h2>Artifact Freshness</h2>
          <div className="freshness-bars">
            {[91, 89, 92, 90, 91, 93, 91].map((v, i) => (
              <div key={i} className="freshness-bar" style={{ "--h": `${v}%` }} title={`${v}%`} />
            ))}
          </div>
        </article>
      </div>

      <article className="audit-panel app-wide-panel">
        <div className="dash-toolbar">
          <label className="search-box dash-search">
            <Search size={18} />
            <input placeholder="Search events..." />
          </label>
          <button type="button" className="outline-button">Filters</button>
        </div>
        <div className="app-table dash-logs-table">
          <div className="app-table-head">
            <span>Time</span>
            <span>Event</span>
            <span>Source</span>
            <span>Details</span>
            <span>Status</span>
            <span>Severity</span>
          </div>
          {logEvents.map((row) => (
            <div className="app-table-row" key={`${row.time}-${row.event}`}>
              <span>{row.time}</span>
              <strong>{row.event}</strong>
              <span>{row.source}</span>
              <span className="app-muted">{row.details}</span>
              <span className={row.status === "Warning" ? "status-warn" : "status-success"}>{row.status}</span>
              <span>{row.severity}</span>
            </div>
          ))}
        </div>
        <p className="app-muted dash-table-foot">Showing 1 to 7 of 156 events</p>
      </article>
    </AppShell>
  );
}
