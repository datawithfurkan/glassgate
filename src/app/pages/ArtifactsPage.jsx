import { useState } from "react";
import { Copy, Download, FileJson, FileText, Plus, RefreshCw, Search } from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import { artifactLibrary, llmsPreview } from "../demoData.js";
import { FadeIn, PremiumPanel, StatusDot } from "../components/Visuals.jsx";

const quickTabs = ["llms.txt", "llms-full.txt", "ai-index.json", "pages.md", "pages.json"];

export function ArtifactsPage() {
  const [activeTab, setActiveTab] = useState("llms.txt");
  const [preview] = useState(llmsPreview);

  return (
    <AppShell
      activePage="artifacts"
      title="Generated Artifacts Library"
      subtitle="Browse and manage all AI-generated artifacts for your website."
      actions={
        <>
          <button type="button" className="icon-btn" aria-label="Refresh"><RefreshCw size={18} /></button>
          <button type="button" className="outline-button">Regenerate All</button>
          <button type="button" className="primary-button shimmer-btn"><Plus size={16} /> Generate Artifacts</button>
        </>
      }
    >
      <FadeIn delay={0}>
        <div className="artifact-quick-tabs premium-tabs">
          {quickTabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="dash-toolbar">
          <label className="search-box dash-search">
            <Search size={18} />
            <input placeholder="Search artifacts..." />
          </label>
          <div className="dash-filters">
            <button type="button" className="outline-button premium-outline">All Status</button>
            <button type="button" className="outline-button premium-outline">All Freshness</button>
          </div>
        </div>
      </FadeIn>

      <PremiumPanel className="app-wide-panel table-panel" delay={80}>
        <div className="app-table app-table-artifacts dash-artifacts-table">
          <div className="app-table-head">
            <span>Artifact</span>
            <span>Status</span>
            <span>Freshness</span>
            <span>Size</span>
            <span>Last Generated</span>
            <span />
          </div>
          {artifactLibrary.map((row) => (
            <div className="app-table-row" key={row.name}>
              <span className="app-file-cell">
                <span className="icon-tile">{row.name.endsWith(".json") ? <FileJson size={18} /> : <FileText size={18} />}</span>
                <span><strong>{row.name}</strong><small>{row.desc}</small></span>
              </span>
              <span className="status-pill success"><StatusDot /> {row.status}</span>
              <span>{row.freshness}</span>
              <span>{row.size}</span>
              <span>{row.generated}</span>
              <span>⋯</span>
            </div>
          ))}
        </div>
      </PremiumPanel>

      <PremiumPanel className="preview-panel artifact-preview-panel" delay={160}>
        <div className="app-panel-head">
          <div>
            <h2>{activeTab}</h2>
            <p className="app-muted">Success · May 19, 2026 · 12.4 KB</p>
          </div>
          <div className="dash-filters">
            <button type="button" className="outline-button"><Download size={16} /> Download</button>
            <button type="button" className="outline-button"><Copy size={16} /> Copy</button>
            <button type="button" className="outline-button">Regenerate</button>
          </div>
        </div>
        <pre className="code-preview">{preview}</pre>
      </PremiumPanel>
    </AppShell>
  );
}
