/**
 * API client — resolves base URL for dev proxy and production (VITE_API_URL).
 */

export function getApiBase() {
  const base = import.meta.env.VITE_API_URL || "";
  return String(base).replace(/\/$/, "");
}

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalized}`;
}

function authHeaders(existing = {}) {
  const headers = new Headers(existing);
  const apiKey = typeof sessionStorage !== "undefined"
    ? sessionStorage.getItem("glasgate_api_key")
    : null;
  if (apiKey && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }
  if (!headers.has("Content-Type") && !(existing instanceof Headers)) {
    // caller sets Content-Type when needed
  }
  return headers;
}

export async function apiFetch(path, options = {}) {
  const headers = authHeaders(options.headers);
  return fetch(apiUrl(path), { ...options, headers });
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
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
  return response.json();
}

export async function checkApiHealth() {
  const started = performance.now();
  const data = await apiJson("/api/health");
  const latencyMs = Math.round(performance.now() - started);
  return {
    connected: data.status === "ok",
    latencyMs,
    version: data.version || "0.1.0",
    uptime: data.uptime,
  };
}
