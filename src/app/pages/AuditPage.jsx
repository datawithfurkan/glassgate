import { useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  FileJson,
  FileText,
  Globe2,
  LineChart,
  LockKeyhole,
  Play,
  Sparkles,
  Target
} from "lucide-react";
import { AppShell } from "../AppShell.jsx";
import {
  artifactHref,
  fetchTextPreview,
  firstMarkdownSource,
  firstPagePreviewLabel,
  firstPageJsonSource,
  formatNumber
} from "../auditUtils.js";

export function AuditPage({ auditState }) {
  const {
    url,
    setUrl,
    audit,
    isLoading,
    error,
    jobLogs,
    runAudit,
    artifacts,
    metrics,
    checks
  } = auditState;

  const [previewTab, setPreviewTab] = useState("llms.txt");
  const [previewText, setPreviewText] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const previewTabs = [
    ["llms.txt", artifacts.llmsTxt],
    ["ai-index.json", artifacts.aiIndex],
    [firstPagePreviewLabel(artifacts), firstMarkdownSource(artifacts)],
    [`${firstPagePreviewLabel(artifacts).replace(".md", ".json")}`, firstPageJsonSource(artifacts)]
  ];

  useEffect(() => {
    let ignore = false;
    const activeSource = previewTabs.find(([label]) => label === previewTab)?.[1];

    async function loadPreview() {
      setIsPreviewLoading(true);
      try {
        const text = await fetchTextPreview(activeSource);
        if (!ignore) setPreviewText(text);
      } catch {
        try {
          const fallbackSource = previewTab === "ai-index.json"
            ? "inline:ai-index.json"
            : previewTab.endsWith(".md")
              ? "inline:home.md"
              : "inline:llms.txt";
          const text = await fetchTextPreview(fallbackSource);
          if (!ignore) setPreviewText(text);
        } catch {
          if (!ignore) setPreviewText("Preview unavailable.");
        }
      } finally {
        if (!ignore) setIsPreviewLoading(false);
      }
    }

    loadPreview();
    return () => {
      ignore = true;
    };
  }, [audit, previewTab, artifacts]);

  return (
    <AppShell activePage="audit" title="Audit Dashboard" subtitle="Run audits and inspect AI-ready outputs.">
      <div className="audit-controls">
        <label>
          <Globe2 size={19} />
          <input value={url} onChange={(event) => setUrl(event.target.value)} aria-label="Website URL" />
        </label>
        <label><CalendarDays size={19} /> May 12, 2026 - May 19, 2026</label>
        <button className="primary-button" onClick={runAudit} disabled={isLoading}>
          <Play size={17} /> {isLoading ? "Running..." : "Run Audit"}
        </button>
      </div>
      {error && <div className="audit-alert">{error}</div>}
      <div className="audit-metrics">
        {[
          [Sparkles, "AI Readiness", audit.score ?? 0, "/100"],
          [LockKeyhole, "Pages Processed", audit.pagesProcessed ?? 0, ""],
          [Target, "HTML Tokens", formatNumber(metrics.htmlTokensEstimate), ""],
          [LineChart, "Token Savings", metrics.estimatedSavingsPercent ?? 0, "%"]
        ].map(([Icon, label, value, suffix]) => (
          <article className="metric-card" key={label}>
            <span className="gradient-icon"><Icon size={26} /></span>
            <strong>{value}<small>{suffix}</small></strong>
            <p>{label}</p>
          </article>
        ))}
      </div>
      <div className="audit-panels">
        <article className="audit-panel table-panel">
          <h2>Generated Artifacts</h2>
          {[
            ["llms.txt", artifacts.llmsTxt, FileText],
            ["llms-full.txt", artifacts.llmsFullTxt, ClipboardList],
            ["ai-index.json", artifacts.aiIndex, FileJson],
            [firstPagePreviewLabel(artifacts), firstMarkdownSource(artifacts), FileText],
            [`${firstPagePreviewLabel(artifacts).replace(".md", ".json")}`, firstPageJsonSource(artifacts), FileJson]
          ].map(([name, href, Icon]) => (
            <div className="table-row" key={name}>
              <span className="icon-tile"><Icon size={18} /></span>
              <strong><a href={artifactHref(href)} target="_blank" rel="noreferrer">{name}</a></strong>
              <small>{audit.status || "completed"}</small>
              <em>Success</em>
            </div>
          ))}
        </article>
        <article className="audit-panel">
          <h2>Progress Log</h2>
          <div className="app-scroll-panel">
            {(jobLogs.length ? jobLogs : ["Waiting for audit..."]).map((log, index) => (
              <div className="activity-row" key={`${log}-${index}`}>
                <i />
                <span>{log}</span>
                <small>{isLoading && index === jobLogs.length - 1 ? "Now" : ""}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
      <div className="audit-panels">
        <article className="audit-panel">
          <h2>Checks</h2>
          {Object.entries(checks).map(([key, passed]) => (
            <div className="activity-row" key={key}>
              <i className={passed ? "" : "warn"} />
              <span>{key}</span>
                <small>{passed ? "Pass" : "Review"}</small>
            </div>
          ))}
        </article>
        <article className="audit-panel preview-panel">
          <h2>Generated Page Preview</h2>
          <div className="preview-tabs">
            {previewTabs.map(([label]) => (
              <button className={previewTab === label ? "active" : ""} key={label} onClick={() => setPreviewTab(label)}>
                {label}
              </button>
            ))}
          </div>
          <pre>{isPreviewLoading ? "Loading preview..." : previewText}</pre>
        </article>
      </div>
    </AppShell>
  );
}
