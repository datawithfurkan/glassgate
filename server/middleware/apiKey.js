/**
 * Optional API key authentication middleware.
 * Reads GLASGATE_API_KEY from environment.
 * If not set, auth is disabled (open access for hackathon/dev).
 */

const CONFIGURED_KEY = process.env.GLASGATE_API_KEY;

export function apiKeyAuth(req, res, next) {
  if (!CONFIGURED_KEY) return next();

  const authHeader = req.headers["authorization"];
  const apiKeyHeader = req.headers["x-api-key"];

  let provided = null;

  if (authHeader?.startsWith("Bearer ")) {
    provided = authHeader.slice(7).trim();
  } else if (apiKeyHeader) {
    provided = apiKeyHeader.trim();
  }

  if (!provided || provided !== CONFIGURED_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid API key required. Send: Authorization: Bearer <key>",
      reqId: req.requestId,
    });
  }

  next();
}
