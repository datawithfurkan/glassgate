export default {
  port: process.env.PORT || 3001,
  crawlTimeout: 8000,
  maxPages: 5,
  maxSitemapUrls: 20,
  userAgent: "GlassGateBot/0.1 (+https://glasgate.ai/bot)",
  generatedDir: "./generated",
  allowedOrigins: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ],
};
