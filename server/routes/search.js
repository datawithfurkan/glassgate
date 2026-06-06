import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import config from "../config.js";

const router = Router();

/**
 * GET /api/search?q=keyword
 * Search across all indexed sites and pages.
 * Searches titles, descriptions and bodyText in ai-index.json files.
 *
 * Query params:
 *   q       — search query (required, min 2 chars)
 *   limit   — max results (default 10, max 50)
 */
router.get("/", async (req, res) => {
  const { q, limit: rawLimit } = req.query;
  const limit = Math.min(parseInt(rawLimit) || 10, 50);

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      error: "Invalid query",
      message: "Query param 'q' must be at least 2 characters",
    });
  }

  const query = q.trim().toLowerCase();

  try {
    const generatedDir = path.resolve(config.generatedDir);
    let siteIds = [];

    try {
      const entries = await fs.readdir(generatedDir, { withFileTypes: true });
      siteIds = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return res.json({ query: q, results: [], total: 0 });
    }

    const results = [];

    for (const siteId of siteIds) {
      const indexPath = path.join(generatedDir, siteId, "ai-index.json");

      try {
        const raw = await fs.readFile(indexPath, "utf8");
        const index = JSON.parse(raw);

        // Check site-level match
        const siteText = [index.site?.title, index.site?.description].join(" ").toLowerCase();
        const siteMatch = siteText.includes(query);

        // Check page-level matches
        const matchedPages = (index.pages || []).filter((p) => {
          const pageText = [p.title, p.description].join(" ").toLowerCase();
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
    });
  } catch (err) {
    res.status(500).json({ error: "Search failed", message: err.message });
  }
});

export default router;
