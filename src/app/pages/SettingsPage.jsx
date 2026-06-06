import { useState } from "react";
import { AppShell } from "../AppShell.jsx";

export function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [maxPages, setMaxPages] = useState("5");
  const [crawlTimeout, setCrawlTimeout] = useState("8000");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave(event) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <AppShell activePage="settings" title="Settings" subtitle="Workspace preferences, API access, and crawler defaults.">
      <form className="app-settings-grid" onSubmit={handleSave}>
        <article className="audit-panel">
          <h2>Profile</h2>
          <label className="app-field">
            <span>Display name</span>
            <input defaultValue="AK" />
          </label>
          <label className="app-field">
            <span>Workspace</span>
            <input defaultValue="glasgate.ai" />
          </label>
          <label className="app-field">
            <span>Email</span>
            <input defaultValue="team@glasgate.ai" type="email" />
          </label>
        </article>

        <article className="audit-panel">
          <h2>API Access</h2>
          <label className="app-field">
            <span>API key</span>
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="GLASGATE_API_KEY (optional for local dev)"
              type="password"
            />
          </label>
          <p className="app-muted">Used for authenticated requests to `/api/*` when backend auth is enabled.</p>
        </article>

        <article className="audit-panel">
          <h2>Crawler Defaults</h2>
          <label className="app-field">
            <span>Max pages</span>
            <input value={maxPages} onChange={(event) => setMaxPages(event.target.value)} />
          </label>
          <label className="app-field">
            <span>Crawl timeout (ms)</span>
            <input value={crawlTimeout} onChange={(event) => setCrawlTimeout(event.target.value)} />
          </label>
          <label className="app-toggle">
            <input checked={notifications} onChange={(event) => setNotifications(event.target.checked)} type="checkbox" />
            <span>Email me when audits complete</span>
          </label>
        </article>

        <div className="app-settings-actions">
          <button className="primary-button" type="submit">Save settings</button>
          {saved && <span className="app-chip">Saved</span>}
        </div>
      </form>
    </AppShell>
  );
}
