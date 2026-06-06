import path from "path";
import { fileURLToPath } from "url";

// Always resolve generatedDir relative to the project root (one level above server/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

export default {
  port:            parseInt(process.env.PORT)    || 3001,
  nodeEnv:         process.env.NODE_ENV          || "development",
  crawlTimeout:    parseInt(process.env.CRAWL_TIMEOUT) || 8000,
  maxPages:        parseInt(process.env.MAX_PAGES)     || 10,
  maxSitemapUrls:  parseInt(process.env.MAX_SITEMAP_URLS) || 100,
  maxLlmsTxtPages: parseInt(process.env.MAX_LLMS_TXT_PAGES) || 8,
  cacheTtlMs:      parseInt(process.env.CACHE_TTL_MS)  || 10 * 60 * 1000,
  userAgent:       process.env.BOT_USER_AGENT || "GlassGateBot/0.1 (+https://glasgate.ai/bot)",
  generatedDir:    process.env.GENERATED_DIR  || path.join(PROJECT_ROOT, "generated"),
  allowedOrigins:  (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean).concat([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ]),
};
