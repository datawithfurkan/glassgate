import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Globe2,
  LineChart,
  LockKeyhole,
  Plus,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import { activityTimeline, recentAudits, trackedSites } from "../demoData.js";
import { goToAppPage } from "../navigation.js";
import {
  AreaChart,
  FadeIn,
  HealthGauge,
  MetricTile,
  PremiumPanel,
  ScoreRing,
  StatusDot,
} from "../components/Visuals.jsx";

export function OverviewPage() {
  return (
    <AppShell
      activePage="overview"
      title="Workspace Overview"
      subtitle="Monitor AI readiness and content accessibility across all your websites."
      actions={
        <>
          <button type="button" className="outline-button premium-outline">
            <CalendarDays size={16} /> May 12 – May 19, 2026
          </button>
          <button type="button" className="primary-button shimmer-btn" onClick={() => goToAppPage("audit")}>
            <Plus size={17} /> Add Site
          </button>
        </>
      }
    >
      <div className="dash-metrics-row">
        <MetricTile icon={Sparkles} label="AI Readiness Score" value="83 / 100" delta="+12 pts vs May 5" delay={0} highlight />
        <MetricTile icon={LockKeyhole} label="Content Access" value="92%" delta="+8% vs May 5" delay={60} chart={<AreaChart className="metric-chart" />} />
        <MetricTile icon={Target} label="Discoverability" value="78%" delta="+9% vs May 5" delay={120} />
        <MetricTile icon={LineChart} label="Token Savings" value="24.6%" delta="+3.4% vs May 5" delay={180} />
      </div>

      <div className="overview-main-grid">
        <PremiumPanel className="dash-sites-panel app-wide-panel" delay={200}>
          <div className="app-panel-head">
            <h2>Tracked Sites</h2>
            <div className="dash-filters">
              <label className="search-box dash-search compact">
                <Search size={16} />
                <input placeholder="Search sites..." />
              </label>
              <button type="button" className="outline-button premium-outline">All Sites</button>
              <button type="button" className="outline-button premium-outline">Filters</button>
            </div>
          </div>
          <div className="app-table dash-sites-table premium-table">
            <div className="app-table-head">
              <span>Site</span>
              <span>AI Readiness</span>
              <span>Content Access</span>
              <span>Discoverability</span>
              <span>Token Savings</span>
              <span>Last Audit</span>
              <span />
            </div>
            {trackedSites.map((site, index) => (
              <FadeIn
                as="div"
                className="app-table-row premium-table-row"
                key={site.url}
                delay={240 + index * 40}
              >
                <span className="site-cell">
                  <span className="site-icon"><Globe2 size={18} /></span>
                  <span>
                    <strong>{site.name}</strong>
                    <small>{site.url}</small>
                  </span>
                </span>
                <span className="score-cell">
                  <ScoreRing value={site.readiness} />
                  <span><strong>{site.readiness}%</strong><small className="metric-delta positive">+4%</small></span>
                </span>
                <span className="score-cell">
                  <ScoreRing value={site.access} />
                  <span><strong>{site.access}%</strong></span>
                </span>
                <span className="score-cell">
                  <ScoreRing value={site.discover} />
                  <span><strong>{site.discover}%</strong></span>
                </span>
                <span><strong>{site.savings}%</strong></span>
                <span className="audit-time-cell">
                  <StatusDot />
                  {site.lastAudit}
                </span>
                <span className="row-menu">⋯</span>
              </FadeIn>
            ))}
          </div>
          <p className="app-muted dash-table-foot">
            Showing 1 to 5 of 8 sites · <button type="button" className="text-link">View all sites <ArrowRight size={14} /></button>
          </p>
        </PremiumPanel>

        <div className="overview-side-stack">
          <PremiumPanel delay={280}>
            <div className="app-panel-head">
              <h2>Recent Activity</h2>
            </div>
            <div className="activity-timeline premium-timeline">
              {activityTimeline.map((item, i) => (
                <div className={`timeline-item ${item.type}`} key={item.text} style={{ "--i": i }}>
                  <span className="timeline-dot" />
                  <div>
                    <span>{item.text}</span>
                    <small>{item.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </PremiumPanel>

          <PremiumPanel className="health-panel" delay={340}>
            <HealthGauge value={86} />
            <button type="button" className="text-link">View details →</button>
          </PremiumPanel>
        </div>
      </div>

      <PremiumPanel className="recent-audits-panel" delay={400}>
        <div className="app-panel-head">
          <h2>Recent Audits</h2>
          <button type="button" className="text-link">View all audits <ArrowUpRight size={14} /></button>
        </div>
        <div className="recent-audit-list">
          {recentAudits.map((item, i) => (
            <FadeIn className="recent-audit-row" key={`${item.site}-${item.time}`} delay={420 + i * 50}>
              <span className="site-icon sm"><Globe2 size={16} /></span>
              <div>
                <strong>{item.site}</strong>
                <small>{item.time}</small>
              </div>
              <span className="status-pill success">{item.status}</span>
              <strong className="audit-score">{item.score}/100</strong>
              <span className="app-muted">{item.size}</span>
            </FadeIn>
          ))}
        </div>
      </PremiumPanel>
    </AppShell>
  );
}
