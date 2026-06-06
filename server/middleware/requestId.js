import { randomUUID } from "crypto";

/**
 * Attaches a unique request ID to every incoming request.
 * Reads X-Request-ID header if provided, otherwise generates one.
 * Adds X-Request-ID to the response for client correlation.
 */
export function requestIdMiddleware(req, res, next) {
  const id = req.headers["x-request-id"] || randomUUID();
  req.requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
}
