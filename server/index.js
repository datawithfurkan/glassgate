import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";
import healthRouter from "./routes/health.js";
import auditRouter from "./routes/audit.js";
import sitesRouter from "./routes/sites.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// CORS
app.use(cors({ origin: config.allowedOrigins }));

// Body parsing
app.use(express.json({ limit: "1mb" }));

// Serve generated artifacts as static files
const generatedDir = path.resolve(__dirname, "..", config.generatedDir);
app.use("/generated", express.static(generatedDir));

// Routes
app.use("/api", healthRouter);
app.use("/api", auditRouter);
app.use("/api/sites", sitesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("[server] Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

app.listen(config.port, () => {
  console.log(`\n  🟢 GlassGate backend running at http://localhost:${config.port}`);
  console.log(`     GET  http://localhost:${config.port}/api/health`);
  console.log(`     POST http://localhost:${config.port}/api/audit\n`);
});
