import { createMarketCrawlerApp } from "./market-crawler-app.mjs";
import { ensureStore } from "./market-crawler/store.mjs";

const PORT = Number(process.env.MARKET_CRAWLER_PORT || 8787);
await ensureStore();
const { app } = createMarketCrawlerApp();
app.listen(PORT, () => {
  console.log(`Temu market crawler listening on http://127.0.0.1:${PORT}`);
});
