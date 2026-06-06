import { useEffect, useState } from "react";
import {
  demoAudit,
  demoArtifacts,
  loadFallbackDemoAudit,
  normalizeAuditResult,
  runAuditRequest
} from "./auditUtils.js";

export function useAudit() {
  const [url, setUrl] = useState("https://example.com");
  const [audit, setAudit] = useState(demoAudit);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobLogs, setJobLogs] = useState(["Demo data loaded."]);

  useEffect(() => {
    loadFallbackDemoAudit()
      .then((fallback) => setAudit(fallback))
      .catch(() => setAudit(demoAudit));
  }, []);

  async function runAudit() {
    setIsLoading(true);
    setError("");
    setJobLogs(["Starting audit..."]);
    try {
      const result = await runAuditRequest(url, (job) => {
        if (Array.isArray(job.logs)) {
          setJobLogs(job.logs.map((log) => (typeof log === "string" ? log : log.message || JSON.stringify(log))));
        } else if (job.message) {
          setJobLogs((current) => [...current, job.message]);
        }
      });
      setAudit(normalizeAuditResult({ ...result, url }));
      setJobLogs((current) => [...current, "Audit completed."]);
    } catch {
      try {
        const fallback = await loadFallbackDemoAudit();
        setAudit({ ...fallback, url });
        setJobLogs(["Live API unavailable.", "Loaded demo fallback."]);
        setError("Live API unavailable. Showing demo data.");
      } catch {
        setAudit({ ...demoAudit, url });
        setJobLogs(["Live API unavailable.", "Loaded embedded demo fallback."]);
        setError("Live API unavailable. Showing bundled demo data.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const artifacts = audit?.artifacts || demoArtifacts;
  const metrics = audit.metrics || demoAudit.metrics;
  const checks = audit.checks || demoAudit.checks;
  const issues = Array.isArray(audit.issues) ? audit.issues : [];

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
    issues
  };
}
