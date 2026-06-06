import { isAuthenticated } from "../auth/auth.js";

export const appPages = [
  { id: "overview", label: "Overview", path: "/audit/overview" },
  { id: "audit", label: "Audit", path: "/audit" },
  { id: "artifacts", label: "Artifacts", path: "/audit/artifacts" },
  { id: "logs", label: "Logs", path: "/audit/logs" },
  { id: "recommendations", label: "Recommendations", path: "/audit/recommendations" },
  { id: "settings", label: "Settings", path: "/audit/settings" },
];

export const teamPage = { id: "team", label: "Team & Billing", path: "/audit/team" };

const authPaths = {
  "/login": "login",
  "/signup": "signup",
  "/reset-password": "reset",
};

export function parseAuthRoute(pathname = window.location.pathname) {
  if (pathname === "/login" || pathname === "/login/") return "login";
  if (pathname === "/signup" || pathname === "/signup/") return "signup";
  if (pathname === "/reset-password" || pathname === "/reset-password/") return "reset";
  return null;
}

export function parseAppRoute(pathname = window.location.pathname) {
  if (!pathname.startsWith("/audit")) return null;
  if (pathname === "/audit" || pathname === "/audit/") return "audit";
  const sub = pathname.replace(/^\/audit\/?/, "").split("/")[0];
  if (sub === "team") return "team";
  return appPages.some((page) => page.id === sub) ? sub : "audit";
}

export function navigate(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("routechange"));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function goToAppPage(pageId) {
  const target = pageId === "team" ? teamPage : appPages.find((page) => page.id === pageId);
  navigate(target?.path || "/audit");
}

export function goToLogin() {
  navigate("/login");
}

export function goToSignUp() {
  navigate("/signup");
}

export function goToResetPassword() {
  navigate("/reset-password");
}

export function goToHome() {
  navigate("/");
}

export function goToAudit() {
  if (isAuthenticated()) goToAppPage("audit");
  else goToLogin();
}

export { authPaths };
