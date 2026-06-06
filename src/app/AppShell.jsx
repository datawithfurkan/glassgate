import { useState } from "react";
import {
  BarChart3,
  Bell,
  CircleHelp,
  ChevronDown,
  FileJson,
  LineChart,
  Menu,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { getSessionUser, logout } from "../auth/auth.js";
import { appPages, goToAppPage, goToLogin, goToHome, teamPage } from "./navigation.js";

function LogoMark({ small = false }) {
  return (
    <span className={`logo-mark ${small ? "small" : ""}`} aria-hidden="true">
      <i />
      <b />
    </span>
  );
}

const sidebarIcons = {
  overview: BarChart3,
  audit: Sparkles,
  artifacts: FileJson,
  logs: LineChart,
  recommendations: CircleHelp,
  settings: Settings,
};

export function AppShell({
  activePage,
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
}) {
  const user = getSessionUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    goToLogin();
  }

  return (
    <section className={`audit-shell premium-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        onClick={() => setSidebarOpen((v) => !v)}
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {sidebarOpen && (
        <button type="button" className="sidebar-backdrop" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className="audit-sidebar premium-sidebar">
        <button type="button" className="logo" onClick={() => { goToAppPage("overview"); setSidebarOpen(false); }}>
          <LogoMark />
          <span>glasgate.ai</span>
        </button>

        <nav className="audit-sidebar-nav">
          {appPages.map(({ id, label }) => {
            const Icon = sidebarIcons[id];
            return (
              <button
                type="button"
                className={activePage === id ? "active" : ""}
                key={id}
                onClick={() => { goToAppPage(id); setSidebarOpen(false); }}
              >
                <Icon size={18} /> {label}
              </button>
            );
          })}
        </nav>

        <div className="audit-sidebar-footer">
          <article className="sidebar-plan-card premium-glass">
            <strong>{user?.plan || "Enterprise Plan"}</strong>
            <span>Unlimited audits</span>
            <span>Team instance</span>
            <button type="button" className="text-link" onClick={() => goToAppPage("team")}>
              Manage Plan
            </button>
          </article>
          <div className="sidebar-user premium-glass">
            <span className="sidebar-avatar">{user?.initials || "AK"}</span>
            <div>
              <strong>{user?.name || "Alex Kim"}</strong>
              <small>{user?.email || "admin@glasgate.ai"}</small>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="audit-main premium-main">
        <div className="audit-top premium-top">
          <div className="audit-top-copy">
            {breadcrumb && <p className="app-breadcrumb">{breadcrumb}</p>}
            <h1>{title}</h1>
            {subtitle && <p className="audit-subtitle">{subtitle}</p>}
          </div>
          <div className="audit-top-actions">
            {actions}
            <button type="button" className="icon-btn hover-lift" aria-label="Notifications">
              <Bell size={20} />
              <em>3</em>
            </button>
            <button type="button" className="icon-btn hover-lift" aria-label="Help">
              <CircleHelp size={20} />
            </button>
            <div className="user-menu">
              <button type="button" className="user-menu-trigger hover-lift" onClick={() => setMenuOpen((v) => !v)}>
                <span>{user?.initials || "AK"}</span>
                <ChevronDown size={14} />
              </button>
              {menuOpen && (
                <div className="user-menu-dropdown premium-glass">
                  <button type="button" onClick={() => goToAppPage("settings")}>Settings</button>
                  <button type="button" onClick={() => goToAppPage("team")}>Team & Billing</button>
                  <button type="button" onClick={goToHome}>Back to website</button>
                  <button type="button" onClick={handleLogout}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="premium-content">{children}</div>
      </main>

      <nav className="app-mobile-nav premium-mobile-nav" aria-label="App navigation">
        {[...appPages, teamPage].slice(0, 6).map(({ id, label }) => {
          const Icon = sidebarIcons[id] || Settings;
          const shortLabel = label === "Recommendations" ? "Tips" : label.split(" ")[0];
          return (
            <button
              type="button"
              className={activePage === id ? "active" : ""}
              key={id}
              onClick={() => goToAppPage(id)}
            >
              <Icon size={18} />
              <span>{shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </section>
  );
}

export { LogoMark };
