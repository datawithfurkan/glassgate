/**
 * Simple in-memory TTL cache.
 * Used to cache audit results so the same URL is not re-crawled within TTL.
 * In production, replace with Redis.
 */

const store = new Map();

/** Default TTL: 10 minutes */
const DEFAULT_TTL_MS = 10 * 60 * 1000;

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDel(key) {
  store.delete(key);
}

export function cacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  for (const entry of store.values()) {
    if (now > entry.expiresAt) expired++;
    else active++;
  }
  return { total: store.size, active, expired };
}

/** Periodically evict expired entries */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 60_000);
