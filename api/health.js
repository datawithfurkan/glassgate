const startedAt = Date.now();

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.status(200).json({
    status: "ok",
    version: "0.1.0-vercel",
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    runtime: "vercel",
  });
}
