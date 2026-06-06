import { useCallback, useEffect, useState } from "react";
import { checkApiHealth } from "./api.js";
import {
  normalizeAuditResult,
  runAuditRequest
} from "./auditUtils.js";

const idleAudit = {
  status: "idle",
  siteId: null,
  score: null,
  pagesProcessed: 0,
  url: "",
  artifacts: { llmsTxt: null, llmsFullTxt: null, aiIndex: null, pages: [] },
  metrics: {
    htmlTokensEstimate: 0,
    markdownTokensEstimate: 0,
    estimatedSavingsPercent: 0,
    crawlMs: 0,
  },
  checks: {},
  issues: [],
};

export function useAudit() {
  const [url, setUrl] = useState("https://example.com");
  const [audit, setAudit] = useState(idleAudit);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobLogs, setJobLogs] = useState(["Checking API connection..."]);
  const [apiStatus, setApiStatus] = useState({
    state: "checking",
    message: "Connecting to backend...",
    latencyMs: null,
    version: null,
  });

  const refreshApiStatus = useCallback(async () => {
    setApiStatus((current) => ({ ...current, state: "checking", message: "Connecting..." }));
    try {
      const health = await checkApiHealth();
      setApiStatus({
        state: "connected",
        message: `Live API · v${health.version} · ${health.latencyMs}ms`,
        latencyMs: health.latencyMs,
        version: health.version,
      });
      setJobLogs((current) =>
        current.some((line) => line.includes("Live API connected"))
          ? current
          : ["Live API connected.", "Enter a URL and click Run Audit."]
      );
      return true;
    } catch (err) {
      const detail = err?.message || "Connection failed";
      setApiStatus({
        state: "offline",
        message: `API offline — ${detail}`,
        latencyMs: null,
        version: null,
      });
      setJobLogs([
        "Backend not reachable at /api/health.",
        "Run: npm run dev:all  (starts API + frontend)",
        detail,
      ]);
      return false;
    }
  }, []);

  useEffect(() => {
    refreshApiStatus();
  }, [refreshApiStatus]);

  useEffect(() => {
    if (apiStatus.state !== "offline") return undefined;

    const retryTimer = window.setInterval(() => {
      refreshApiStatus();
    }, 5000);

    const onFocus = () => refreshApiStatus();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(retryTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, [apiStatus.state, refreshApiStatus]);

  async function runAudit() {
    if (apiStatus.state !== "connected") {
      const ok = await refreshApiStatus();
      if (!ok) {
        setError("Cannot run audit — backend API is offline.");
        return;
      }
    }

    setIsLoading(true);
    setError("");
    setJobLogs(["Starting live audit...", `Target: ${url}`]);

    try {
      const result = await runAuditRequest(url, (job) => {
        if (Array.isArray(job.logs) && job.logs.length > 0) {
          setJobLogs(job.logs);
        } else if (job.status === "accepted") {
          setJobLogs((current) => [...current, `Job accepted: ${job.jobId}`]);
        } else if (job.message) {
          setJobLogs((current) => [...current, job.message]);
        }
      });

      setAudit(normalizeAuditResult({ ...result, url }));
      setJobLogs((current) => [...current, "Audit completed via live API."]);
    } catch (err) {
      setError(err?.message || "Audit failed. Is the backend running on port 3001?");
      setJobLogs((current) => [...current, `Error: ${err?.message || "Audit failed"}`]);
    } finally {
      setIsLoading(false);
    }
  }

  const isLive = ["completed", "cached"].includes(audit.status);
  const artifacts = isLive && audit.artifacts?.llmsTxt ? audit.artifacts : idleAudit.artifacts;
  const metrics = isLive ? audit.metrics : idleAudit.metrics;
  const checks = isLive ? audit.checks : idleAudit.checks;
  const issues = isLive && Array.isArray(audit.issues) ? audit.issues : [];

  return {
    url,
    setUrl,
    audit,
    isLoading,
    error,
    jobLogs,
    runAudit,
    artifacts,
    metrics,
    checks,
    issues,
    apiStatus,
    refreshApiStatus,
    isLive,
  };
}
