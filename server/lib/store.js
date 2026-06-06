import fs from "fs/promises";
import path from "path";
import config from "../config.js";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

export async function saveSiteArtifacts(siteId, artifacts) {
  const base = path.join(config.generatedDir, siteId);

  const writes = [
    writeFile(path.join(base, "llms.txt"),       artifacts.llmsTxt),
    writeFile(path.join(base, "llms-full.txt"),  artifacts.llmsFullTxt),
    writeFile(path.join(base, "ai-index.json"),  JSON.stringify(artifacts.aiIndex, null, 2)),
  ];

  for (const page of artifacts.pages) {
    writes.push(writeFile(path.join(base, "pages", `${page.slug}.md`),   page.markdown));
    writes.push(writeFile(path.join(base, "pages", `${page.slug}.json`), JSON.stringify(page.json, null, 2)));
  }

  await Promise.all(writes);
}

export async function loadSiteResult(siteId) {
  const filePath = path.join(config.generatedDir, siteId, "ai-index.json");
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function siteExists(siteId) {
  try {
    await fs.access(path.join(config.generatedDir, siteId, "ai-index.json"));
    return true;
  } catch {
    return false;
  }
}

/**
 * List all indexed sites from the generated directory.
 */
export async function listSites({ limit = 20, offset = 0 } = {}) {
  const generatedDir = path.resolve(config.generatedDir);
  let siteIds = [];

  try {
    const entries = await fs.readdir(generatedDir, { withFileTypes: true });
    siteIds = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return { total: 0, sites: [] };
  }

  const paginated = siteIds.slice(offset, offset + limit);

  const sites = await Promise.all(
    paginated.map(async (siteId) => {
      const index = await loadSiteResult(siteId);
      if (!index) return null;
      return {
        siteId,
        url: index.site?.url,
        title: index.site?.title,
        score: index.agentReadinessScore,
        pages: index.pages?.length ?? 0,
        lastIndexedAt: index.site?.lastIndexedAt,
        aiIndex: `/generated/${siteId}/ai-index.json`,
        llmsTxt: `/generated/${siteId}/llms.txt`,
      };
    })
  );

  return {
    total: siteIds.length,
    sites: sites.filter(Boolean),
    limit,
    offset,
  };
}
