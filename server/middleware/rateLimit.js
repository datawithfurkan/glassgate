/**
 * Simple in-memory rate limiter.
 * Limits requests per IP within a sliding window.
 * Each rateLimit() call creates an isolated counter store.
 */

/**
 * Create a rate limit middleware.
 */
export function rateLimit({ windowMs = 60_000, max = 30, message = "Too many requests" } = {}) {
  const windows = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, w] of windows.entries()) {
      if (now > w.resetAt) windows.delete(key);
    }
  }, 60_000);

  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();

    if (!windows.has(key)) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      const w = windows.get(key);
      if (now > w.resetAt) {
        w.count = 1;
        w.resetAt = now + windowMs;
      } else {
        w.count += 1;
      }
    }

    const w = windows.get(key);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - w.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(w.resetAt / 1000));

    if (w.count > max) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message,
        retryAfter: Math.ceil((w.resetAt - now) / 1000),
        reqId: req.requestId,
      });
    }

    next();
  };
}
