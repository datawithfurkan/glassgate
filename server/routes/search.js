import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import config from "../config.js";
import { parsePagination } from "../lib/validator.js";

const router = Router();

/**
 * GET /api/search?q=keyword
 * Search across all indexed sites and pages.
 */
router.get("/", async (req, res) => {
  const { q } = req.query;
  const { limit } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 50 });

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      error: "Invalid query",
      message: "Query param 'q' must be at least 2 characters",
      reqId: req.requestId,
    });
  }

  const query = q.trim().toLowerCase();

  try {
    const generatedDir = config.generatedDir;
    let siteIds = [];

    try {
      const entries = await fs.readdir(generatedDir, { withFileTypes: true });
      siteIds = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return res.json({ query: q, results: [], total: 0, reqId: req.requestId });
    }

    const results = [];

    for (const siteId of siteIds) {
      const indexPath = path.join(generatedDir, siteId, "ai-index.json");

      try {
        const raw = await fs.readFile(indexPath, "utf8");
        const index = JSON.parse(raw);

        const siteText = [index.site?.title, index.site?.description].join(" ").toLowerCase();
        const siteMatch = siteText.includes(query);

        const matchedPages = (index.pages || []).filter((p) => {
          const pageText = [p.title, p.description, p.bodyText].join(" ").toLowerCase();
          return pageText.includes(query);
        });

        if (siteMatch || matchedPages.length > 0) {
          results.push({
            siteId,
            siteUrl: index.site?.url,
            siteTitle: index.site?.title,
            siteDescription: index.site?.description,
            score: index.agentReadinessScore,
            matchedPages: matchedPages.slice(0, 5).map((p) => ({
              url: p.url,
              title: p.title,
              description: p.description,
              markdownUrl: p.markdownUrl,
            })),
            aiIndex: `/generated/${siteId}/ai-index.json`,
            llmsTxt: `/generated/${siteId}/llms.txt`,
          });
        }
      } catch {
        // skip unreadable indexes
      }

      if (results.length >= limit) break;
    }

    res.json({
      query: q,
      results,
      total: results.length,
      reqId: req.requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: "Search failed",
      message: err.message,
      reqId: req.requestId,
    });
  }
});

export default router;
