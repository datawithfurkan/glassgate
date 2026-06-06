import { Braces, ClipboardList, Download, FileJson, FileText } from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import { artifactHref, getArtifactRows } from "../auditUtils.js";

const typeIcons = {
  "llms.txt": FileText,
  "llms-full.txt": ClipboardList,
  "ai-index.json": FileJson
};

function iconForName(name) {
  if (name.endsWith(".json")) return Braces;
  if (name.endsWith(".md")) return FileText;
  return typeIcons[name] || FileText;
}

export function ArtifactsPage({ auditState }) {
  const { audit, artifacts } = auditState;
  const rows = getArtifactRows(artifacts, audit.status || "completed");

  return (
    <AppShell activePage="artifacts" title="Artifacts" subtitle="All generated files for the current site audit.">
      <div className="app-toolbar">
        <div className="app-chip">Site: {audit.siteId || "demo-glasgate"}</div>
        <div className="app-chip">{rows.length} files</div>
      </div>

      <article className="audit-panel table-panel app-wide-panel">
        <div className="app-panel-head">
          <h2>Generated Artifacts</h2>
          <span className="app-muted">Download or open in a new tab</span>
        </div>
        <div className="app-table app-table-artifacts">
          <div className="app-table-head">
            <span>File</span>
            <span>Description</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {rows.map(({ name, href, detail, status }) => {
            const Icon = iconForName(name);
            return (
              <div className="app-table-row" key={name}>
                <span className="app-file-cell">
                  <span className="icon-tile"><Icon size={18} /></span>
                  <strong>{name}</strong>
                </span>
                <span className="app-muted">{detail}</span>
                <em>{status}</em>
                <a className="app-download" href={artifactHref(href)} target="_blank" rel="noreferrer">
                  <Download size={16} /> Open
                </a>
              </div>
            );
          })}
        </div>
      </article>

      <div className="audit-panels">
        <article className="audit-panel">
          <h2>Output Types</h2>
          {[
            ["llms.txt", "Curated AI site index"],
            ["llms-full.txt", "Full Markdown corpus"],
            ["ai-index.json", "Machine-readable site index"],
            ["page.md / page.json", "Per-page mirrors"]
          ].map(([title, text]) => (
            <div className="activity-row" key={title}>
              <i />
                <span><strong>{title}</strong> — {text}</span>
            </div>
          ))}
        </article>
        <article className="audit-panel">
          <h2>Delivery Paths</h2>
          {[
            `/generated/${audit.siteId || "demo-glasgate"}/llms.txt`,
            `/generated/${audit.siteId || "demo-glasgate"}/ai-index.json`,
            `/generated/${audit.siteId || "demo-glasgate"}/pages/home.md`
          ].map((path) => (
            <div className="activity-row" key={path}>
              <i />
                <span>{path}</span>
            </div>
          ))}
        </article>
      </div>
    </AppShell>
  );
}
