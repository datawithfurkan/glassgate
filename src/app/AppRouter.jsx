import { useEffect, useState } from "react";
import { useAudit } from "./useAudit.js";
import { parseAppRoute } from "./navigation.js";
import { AuditPage } from "./pages/AuditPage.jsx";
import { OverviewPage } from "./pages/OverviewPage.jsx";
import { ArtifactsPage } from "./pages/ArtifactsPage.jsx";
import { LogsPage } from "./pages/LogsPage.jsx";
import { RecommendationsPage } from "./pages/RecommendationsPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";

const pageComponents = {
  audit: AuditPage,
  overview: OverviewPage,
  artifacts: ArtifactsPage,
  logs: LogsPage,
  recommendations: RecommendationsPage,
  settings: SettingsPage
};

export function AppRouter() {
  const [activePage, setActivePage] = useState(() => parseAppRoute());
  const auditState = useAudit();

  useEffect(() => {
    const updateRoute = () => setActivePage(parseAppRoute());
    window.addEventListener("popstate", updateRoute);
    window.addEventListener("routechange", updateRoute);
    return () => {
      window.removeEventListener("popstate", updateRoute);
      window.removeEventListener("routechange", updateRoute);
    };
  }, []);

  const Page = pageComponents[activePage] || AuditPage;
  return <Page auditState={auditState} />;
}

export function isAppRoute(pathname = window.location.pathname) {
  return pathname.startsWith("/audit");
}
