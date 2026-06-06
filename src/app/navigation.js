export const appPages = [
  { id: "audit", label: "Audit", path: "/audit" },
  { id: "overview", label: "Overview", path: "/audit/overview" },
  { id: "artifacts", label: "Artifacts", path: "/audit/artifacts" },
  { id: "logs", label: "Logs", path: "/audit/logs" },
  { id: "recommendations", label: "Recommendations", path: "/audit/recommendations" },
  { id: "settings", label: "Settings", path: "/audit/settings" }
];

export function parseAppRoute(pathname = window.location.pathname) {
  if (!pathname.startsWith("/audit")) return null;
  if (pathname === "/audit" || pathname === "/audit/") return "audit";
  const sub = pathname.replace(/^\/audit\/?/, "").split("/")[0];
  return appPages.some((page) => page.id === sub) ? sub : "audit";
}

export function goToAppPage(pageId) {
  const target = appPages.find((page) => page.id === pageId);
  const path = target?.path || "/audit";
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("routechange"));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function goToAudit() {
  goToAppPage("audit");
}

export function goHome() {
  if (window.location.pathname !== "/") {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new Event("routechange"));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}
