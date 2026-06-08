import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createMarketCrawlerApp } from "./scripts/market-crawler-app.mjs";
import { ensureStore } from "./scripts/market-crawler/store.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 10000);
const HOST = "0.0.0.0";
const distDir = path.join(__dirname, "dist");
const indexFile = path.join(distDir, "index.html");

await ensureStore();

const { app } = createMarketCrawlerApp();

if (existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.use((request, response, next) => {
  if (request.path.startsWith("/api/")) {
    next();
    return;
  }

  if (!existsSync(indexFile)) {
    response
      .status(503)
      .send("Frontend build not found. Run `npm run build` before starting server.");
    return;
  }

  response.sendFile(indexFile);
});

app.listen(PORT, HOST, () => {
  console.log(`Sky Shop web service listening on http://${HOST}:${PORT}`);
});
