/**
 * API client — resolves base URL for dev proxy and production (VITE_API_URL).
 */

const API_PROXY_TARGET = "127.0.0.1:3001";

export function getApiBase() {
  const base = import.meta.env.VITE_API_URL || "";
  return String(base).replace(/\/$/, "");
}

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalized}`;
}

function authHeaders(existing = {}, { skipAuth = false } = {}) {
  const headers = new Headers(existing);
  if (!skipAuth) {
    const apiKey = typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("glasgate_api_key")
      : null;
    if (apiKey && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${apiKey}`);
    }
  }
  return headers;
}

export async function apiFetch(path, options = {}) {
  const skipAuth = path.startsWith("/api/health");
  const headers = authHeaders(options.headers, { skipAuth });
  return fetch(apiUrl(path), { ...options, headers, cache: "no-store" });
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      "API returned HTML instead of JSON. Start the backend with npm run dev:server or npm run dev:all."
    );
  }

  return response.json();
}

export async function checkApiHealth() {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const data = await apiJson("/api/health");
  const latencyMs = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - started
  );

  if (data.status !== "ok") {
    throw new Error("API health check returned unexpected status");
  }

  return {
    connected: true,
    latencyMs,
    version: data.version || "0.1.0",
    uptime: data.uptime,
  };
}

export { API_PROXY_TARGET };
