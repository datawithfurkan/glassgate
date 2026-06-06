import {
  BarChart3,
  Bell,
  CircleHelp,
  FileJson,
  LineChart,
  Settings,
  Sparkles
} from "lucide-react";
import { appPages, goToAppPage } from "./navigation.js";

function LogoMark({ small = false }) {
  return (
    <span className={`logo-mark ${small ? "small" : ""}`} aria-hidden="true">
      <i />
      <b />
    </span>
  );
}

function AppLogo() {
  return (
    <button className="logo" onClick={() => goToAppPage("audit")}>
      <LogoMark />
      <span>glasgate.ai</span>
    </button>
  );
}

const sidebarIcons = {
  audit: Sparkles,
  overview: BarChart3,
  artifacts: FileJson,
  logs: LineChart,
  recommendations: CircleHelp,
  settings: Settings
};

export function AppShell({ activePage, title, subtitle, children }) {
  return (
    <section className="audit-shell">
      <aside className="audit-sidebar">
        <AppLogo />
        {appPages.map(({ id, label }) => {
          const Icon = sidebarIcons[id];
          return (
            <button
              className={activePage === id ? "active" : ""}
              key={id}
              onClick={() => goToAppPage(id)}
            >
              <Icon size={18} /> {label}
            </button>
          );
        })}
      </aside>
      <main className="audit-main">
        <div className="audit-top">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="audit-subtitle">{subtitle}</p>}
          </div>
          <div>
            <Bell size={20} />
            <CircleHelp size={20} />
            <span>AK</span>
          </div>
        </div>
        {children}
      </main>
      <nav className="app-mobile-nav" aria-label="App navigation">
        {appPages.map(({ id, label }) => {
          const Icon = sidebarIcons[id];
          const shortLabel = label === "Recommendations" ? "Tips" : label;
          return (
            <button
              className={activePage === id ? "active" : ""}
              key={id}
              onClick={() => goToAppPage(id)}
              aria-current={activePage === id ? "page" : undefined}
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
