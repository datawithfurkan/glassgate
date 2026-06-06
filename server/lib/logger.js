/**
 * Structured logger for GlassGate backend.
 * Outputs JSON in production, human-readable in development.
 */

const IS_DEV = process.env.NODE_ENV !== "production";

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL ?? "info"] ?? 1;

function log(level, message, meta = {}) {
  if (LEVELS[level] < MIN_LEVEL) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta,
  };

  const out = level === "error" ? process.stderr : process.stdout;

  if (IS_DEV) {
    const color = { debug: "\x1b[90m", info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m" }[level];
    const reset = "\x1b[0m";
    const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
    out.write(`${color}[${entry.ts}] ${level.toUpperCase()} ${message}${reset}${metaStr}\n`);
  } else {
    out.write(JSON.stringify(entry) + "\n");
  }
}

export const logger = {
  debug: (msg, meta) => log("debug", msg, meta),
  info:  (msg, meta) => log("info",  msg, meta),
  warn:  (msg, meta) => log("warn",  msg, meta),
  error: (msg, meta) => log("error", msg, meta),
  child: (defaultMeta) => ({
    debug: (msg, meta) => log("debug", msg, { ...defaultMeta, ...meta }),
    info:  (msg, meta) => log("info",  msg, { ...defaultMeta, ...meta }),
    warn:  (msg, meta) => log("warn",  msg, { ...defaultMeta, ...meta }),
    error: (msg, meta) => log("error", msg, { ...defaultMeta, ...meta }),
  }),
};
