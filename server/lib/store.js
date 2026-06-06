import fs from "fs/promises";
import path from "path";
import config from "../config.js";

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Write a string to a file, creating parent dirs as needed.
 */
async function writeFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

/**
 * Save all generated artifacts for a site to disk.
 */
export async function saveSiteArtifacts(siteId, artifacts) {
  const base = path.join(config.generatedDir, siteId);

  const writes = [
    writeFile(path.join(base, "llms.txt"), artifacts.llmsTxt),
    writeFile(path.join(base, "llms-full.txt"), artifacts.llmsFullTxt),
    writeFile(path.join(base, "ai-index.json"), JSON.stringify(artifacts.aiIndex, null, 2)),
  ];

  for (const page of artifacts.pages) {
    writes.push(writeFile(path.join(base, "pages", `${page.slug}.md`), page.markdown));
    writes.push(writeFile(path.join(base, "pages", `${page.slug}.json`), JSON.stringify(page.json, null, 2)));
  }

  await Promise.all(writes);
}

/**
 * Load a previously saved audit result (ai-index.json).
 * Returns null if not found.
 */
export async function loadSiteResult(siteId) {
  const filePath = path.join(config.generatedDir, siteId, "ai-index.json");
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if a siteId has already been audited.
 */
export async function siteExists(siteId) {
  const filePath = path.join(config.generatedDir, siteId, "ai-index.json");
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
