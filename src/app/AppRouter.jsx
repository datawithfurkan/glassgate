import { useEffect, useState, createElement } from "react";
import { isAuthenticated } from "../auth/auth.js";
import { goToLogin, parseAppRoute } from "./navigation.js";
import { useAudit } from "./useAudit.js";
import { AuditPage } from "./pages/AuditPage.jsx";
import { OverviewPage } from "./pages/OverviewPage.jsx";
import { ArtifactsPage } from "./pages/ArtifactsPage.jsx";
import { LogsPage } from "./pages/LogsPage.jsx";
import { RecommendationsPage } from "./pages/RecommendationsPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { TeamPage } from "./pages/TeamPage.jsx";

const pageComponents = {
  audit: AuditPage,
  overview: OverviewPage,
  artifacts: ArtifactsPage,
  logs: LogsPage,
  recommendations: RecommendationsPage,
  settings: SettingsPage,
  team: TeamPage,
};

export function AppRouter() {
  const [activePage, setActivePage] = useState(() => parseAppRoute());
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const auditState = useAudit();

  useEffect(() => {
    const updateRoute = () => {
      setActivePage(parseAppRoute());
      setAuthed(isAuthenticated());
    };
    window.addEventListener("popstate", updateRoute);
    window.addEventListener("routechange", updateRoute);
    return () => {
      window.removeEventListener("popstate", updateRoute);
      window.removeEventListener("routechange", updateRoute);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) goToLogin();
  }, [authed]);

  if (!authed) return null;

  const Page = pageComponents[activePage] || OverviewPage;
  return createElement(Page, { auditState });
}

export function isAppRoute(pathname = window.location.pathname) {
  return pathname.startsWith("/audit");
}
