export default {
  port:            parseInt(process.env.PORT)    || 3001,
  nodeEnv:         process.env.NODE_ENV          || "development",
  crawlTimeout:    parseInt(process.env.CRAWL_TIMEOUT) || 8000,
  maxPages:        parseInt(process.env.MAX_PAGES)     || 5,
  maxSitemapUrls:  parseInt(process.env.MAX_SITEMAP_URLS) || 20,
  cacheTtlMs:      parseInt(process.env.CACHE_TTL_MS)  || 10 * 60 * 1000,
  userAgent:       process.env.BOT_USER_AGENT || "GlassGateBot/0.1 (+https://glasgate.ai/bot)",
  generatedDir:    process.env.GENERATED_DIR  || "./generated",
  allowedOrigins:  (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean).concat([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ]),
};
