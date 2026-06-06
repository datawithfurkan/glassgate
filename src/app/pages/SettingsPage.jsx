import { useState } from "react";
import { AppShell } from "../AppShell.jsx";
import { getSessionUser } from "../../auth/auth.js";

function Toggle({ defaultChecked = true, label }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="app-toggle dash-toggle">
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
      <span className="toggle-ui" />
      <span>{label}</span>
    </label>
  );
}

export function SettingsPage() {
  const user = getSessionUser();

  return (
    <AppShell
      activePage="settings"
      title="Site Settings & Access Control"
      subtitle="Configure how glasgate.ai crawls, indexes, and accesses your site data."
      actions={<button type="button" className="primary-button">Save Changes</button>}
    >
      <div className="settings-grid">
        <article className="audit-panel">
          <h2>Domain Settings</h2>
          <label className="app-field">
            <span>Primary Domain</span>
            <div className="field-with-badge">
              <input defaultValue="https://example.com" />
              <span className="app-chip app-chip-live">Verified</span>
            </div>
          </label>
          <div className="protocol-toggle">
            <span>Preferred Protocol</span>
            <div className="seg-control">
              <button type="button" className="active">HTTPS</button>
              <button type="button">HTTP</button>
            </div>
          </div>
        </article>

        <article className="audit-panel">
          <h2>Crawl Scope</h2>
          <label className="app-toggle dash-toggle">
            <input type="radio" name="scope" defaultChecked />
            <span>Crawl Entire Site</span>
          </label>
          <label className="app-toggle dash-toggle">
            <input type="radio" name="scope" />
            <span>Restrict to Subfolders</span>
          </label>
          <p className="app-muted">Included: <code>/</code> · Excluded: <code>/admin/*</code>, <code>/private/*</code></p>
          <button type="button" className="outline-button">Edit Scope</button>
        </article>

        <article className="audit-panel">
          <h2>robots.txt Status</h2>
          <p><span className="status-success">Accessible</span> · 200 OK</p>
          <p className="app-muted">Last checked: May 19, 2026 9:40 AM</p>
          <button type="button" className="outline-button">View robots.txt</button>
        </article>

        <article className="audit-panel">
          <h2>sitemap.xml Status</h2>
          <p><span className="status-success">Accessible</span> · 126 URLs discovered</p>
          <p className="app-muted">Last checked: May 19, 2026 9:40 AM</p>
          <button type="button" className="outline-button">View sitemap.xml</button>
        </article>

        <article className="audit-panel">
          <h2>Recrawl Frequency</h2>
          <label className="app-field">
            <span>Schedule</span>
            <select defaultValue="7">
              <option value="1">Every day</option>
              <option value="7">Every 7 days</option>
              <option value="30">Every 30 days</option>
            </select>
          </label>
          <p className="app-muted">Next crawl: May 26, 2026</p>
        </article>

        <article className="audit-panel">
          <h2>AI Crawler Permissions</h2>
          <Toggle label="Allow AI Crawling" />
          <Toggle label="Respect robots.txt" />
          <Toggle label="Follow Internal Links" />
          <Toggle label="Crawl Subdomains" defaultChecked={false} />
        </article>

        <article className="audit-panel">
          <h2>Artifact Publishing</h2>
          <Toggle label="Generate Structured Data (JSON-LD)" />
          <Toggle label="Generate Cleaned Content (Markdown)" />
          <Toggle label="Generate FAQ Schema" />
          <Toggle label="Generate Sitemap.xml" />
          <Toggle label="Store Artifacts" />
        </article>

        <article className="audit-panel">
          <h2>Alert Settings</h2>
          <Toggle label="Audit Completed" />
          <Toggle label="Crawl Issues Detected" />
          <Toggle label="Content Changes Detected" defaultChecked={false} />
          <Toggle label="Weekly Summary" />
          <hr />
          <Toggle label={`Email: ${user?.email || "admin@glasgate.ai"}`} />
          <Toggle label="In-App Notifications" />
          <Toggle label="Webhook (Optional)" defaultChecked={false} />
        </article>
      </div>

      <article className="audit-panel settings-banner">
        <div>
          <h2>You&apos;re in Control</h2>
          <p>glasgate.ai respects your settings and only accesses data you allow.</p>
        </div>
      </article>
    </AppShell>
  );
}
