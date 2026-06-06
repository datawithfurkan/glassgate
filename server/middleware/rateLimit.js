/**
 * Simple in-memory rate limiter.
 * Limits requests per IP within a sliding window.
 * In production, use Redis-backed rate limiting (e.g. express-rate-limit + ioredis).
 */

const windows = new Map();

/**
 * Create a rate limit middleware.
 * @param {Object} options
 * @param {number} options.windowMs  - Window in milliseconds (default: 60_000)
 * @param {number} options.max       - Max requests per window (default: 30)
 * @param {string} options.message   - Error message
 */
export function rateLimit({ windowMs = 60_000, max = 30, message = "Too many requests" } = {}) {
  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();

    if (!windows.has(key)) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const w = windows.get(key);

    if (now > w.resetAt) {
      w.count = 1;
      w.resetAt = now + windowMs;
      return next();
    }

    w.count++;

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - w.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(w.resetAt / 1000));

    if (w.count > max) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message,
        retryAfter: Math.ceil((w.resetAt - now) / 1000),
      });
    }

    next();
  };
}

/** Periodically clean up old windows */
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of windows.entries()) {
    if (now > w.resetAt) windows.delete(key);
  }
}, 60_000);
