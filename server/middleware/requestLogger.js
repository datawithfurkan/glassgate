import { logger } from "../lib/logger.js";

/**
 * Logs every incoming request and its response time.
 */
export function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level](`${req.method} ${req.path}`, {
      status: res.statusCode,
      ms,
      reqId: req.requestId,
      ip: req.ip,
    });
  });

  next();
}
