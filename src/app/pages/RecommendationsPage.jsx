import { useState } from "react";
import { MoreVertical, Play, Sparkles } from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import { recommendations } from "../demoData.js";
import { goToAppPage } from "../navigation.js";

const filterTabs = [
  ["All Recommendations", 28],
  ["Schema", 7],
  ["Internal Links", 6],
  ["Crawl Access", 5],
  ["Canonical", 5],
  ["Content Structure", 5],
];

const impactGroups = ["High", "Medium", "Low"];

export function RecommendationsPage() {
  const [activeFilter, setActiveFilter] = useState("All Recommendations");

  const filtered = activeFilter === "All Recommendations"
    ? recommendations
    : recommendations.filter((r) => r.category === activeFilter);

  return (
    <AppShell
      activePage="recommendations"
      title="Recommendations"
      subtitle="Prioritized optimization tasks to improve AI readiness."
    >
      <div className="rec-filter-tabs">
        {filterTabs.map(([label, count]) => (
          <button
            type="button"
            key={label}
            className={activeFilter === label ? "active" : ""}
            onClick={() => setActiveFilter(label)}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="dash-filter-bar">
        <button type="button" className="outline-button">Impact: All</button>
        <button type="button" className="outline-button">Status: All</button>
        <button type="button" className="outline-button">Assignee: All</button>
        <button type="button" className="outline-button">Sort by: Impact</button>
      </div>

      <div className="rec-layout">
        <div className="rec-main">
          {impactGroups.map((impact) => {
            const items = filtered.filter((r) => r.impact === impact);
            if (!items.length) return null;
            return (
              <section key={impact} className="rec-impact-group">
                <h3 className={`impact-heading impact-${impact.toLowerCase()}`}>{impact} Impact</h3>
                {items.map((item) => (
                  <article className="rec-task-card" key={item.title}>
                    <Sparkles size={20} />
                    <div className="rec-task-body">
                      <h4>{item.title}</h4>
                      <span className="app-chip">{item.category}</span>
                      <div className="rec-progress">
                        <div className="rec-progress-bar" style={{ "--p": `${(() => { const [d, t] = item.progress.split("/").map((s) => parseInt(s.trim(), 10)); return (d / t) * 100; })()}%` }} />
                        <small>{item.progress}</small>
                      </div>
                    </div>
                    <span className="rec-assignee">{item.initials}</span>
                    <button type="button" className="icon-btn" aria-label="More"><MoreVertical size={16} /></button>
                  </article>
                ))}
              </section>
            );
          })}
          <p className="app-muted">Showing {filtered.length} of 28 recommendations</p>
        </div>

        <aside className="rec-sidebar">
          <article className="audit-panel">
            <h2>Optimization Summary</h2>
            <div className="rec-summary-grid">
              {[["28", "Total Tasks"], ["78%", "AI Readiness"], ["14", "High Impact"], ["6", "In Progress"]].map(([v, l]) => (
                <div key={l}><strong>{v}</strong><span>{l}</span></div>
              ))}
            </div>
          </article>
          <article className="audit-panel rec-audit-cta">
            <Sparkles size={28} />
            <p>Run an audit to see how these improvements affect your AI readiness score.</p>
            <button type="button" className="primary-button" onClick={() => goToAppPage("audit")}>
              <Play size={16} /> Run Audit
            </button>
          </article>
        </aside>
      </div>
    </AppShell>
  );
}
