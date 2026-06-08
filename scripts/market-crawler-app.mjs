import cors from "cors";
import express from "express";
import {
  crawlTemuKeyword,
  extractCategoryMatches,
} from "./market-crawler/temu-crawler.mjs";
import {
  DATA_DIR,
  RESULTS_FILE,
  SCREENSHOT_DIR,
  appendResults,
  ensureStore,
  readResults,
  readTasks,
  writeTasks,
} from "./market-crawler/store.mjs";

const supportedPlatforms = ["temu"];

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value) {
  const match = String(value || "")
    .replace(/,/g, "")
    .match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function buildFrequency(items) {
  return Object.entries(items)
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 12);
}

function incrementBucket(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function tokenizeTitle(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3);
}

function computeAnalysis(products) {
  const material = {};
  const color = {};
  const style = {};
  const scene = {};
  const promotion = {};
  const titleWords = {};
  const priceBands = {
    "0-10": 0,
    "10-20": 0,
    "20-40": 0,
    "40-80": 0,
    "80+": 0,
  };

  for (const product of products) {
    const rawSource = `${product.title} ${product.rawText}`.trim();
    const categories = extractCategoryMatches(rawSource);
    for (const item of categories.material) incrementBucket(material, item);
    for (const item of categories.color) incrementBucket(color, item);
    for (const item of categories.style) incrementBucket(style, item);
    for (const item of categories.scene) incrementBucket(scene, item);
    for (const item of categories.promotion) incrementBucket(promotion, item);

    for (const token of tokenizeTitle(product.title)) {
      incrementBucket(titleWords, token);
    }

    const numericPrice =
      toNumber(product.discountPrice || product.price || "") ||
      toNumber(product.originalPrice || "");
    if (numericPrice <= 10) priceBands["0-10"] += 1;
    else if (numericPrice <= 20) priceBands["10-20"] += 1;
    else if (numericPrice <= 40) priceBands["20-40"] += 1;
    else if (numericPrice <= 80) priceBands["40-80"] += 1;
    else priceBands["80+"] += 1;
  }

  const enriched = products.map((product) => ({
    ...product,
    numericPrice:
      toNumber(product.discountPrice || product.price || "") ||
      toNumber(product.originalPrice || ""),
    numericRating: toNumber(product.rating),
    numericReviews: toNumber(product.reviewCount),
    numericSales: toNumber(product.sales),
  }));

  return {
    totalProducts: products.length,
    latestCrawlTime: products[0]?.crawlTime || null,
    materialFrequency: buildFrequency(material),
    colorFrequency: buildFrequency(color),
    styleFrequency: buildFrequency(style),
    sceneFrequency: buildFrequency(scene),
    promotionFrequency: buildFrequency(promotion),
    titleWordFrequency: buildFrequency(titleWords),
    priceBandDistribution: Object.entries(priceBands).map(([range, count]) => ({
      range,
      count,
    })),
    topReviewedProducts: [...enriched]
      .sort((left, right) => right.numericReviews - left.numericReviews)
      .slice(0, 8),
    topRatedProducts: [...enriched]
      .sort((left, right) => right.numericRating - left.numericRating)
      .slice(0, 8),
    topSalesProducts: [...enriched]
      .sort((left, right) => right.numericSales - left.numericSales)
      .slice(0, 8),
  };
}

async function getFilteredResults({ platform, keyword }) {
  const allResults = await readResults();
  return allResults.filter((item) => {
    if (platform && item.platform !== platform) return false;
    if (keyword && item.keyword !== keyword) return false;
    return true;
  });
}

async function updateTask(taskId, patch) {
  const tasks = await readTasks();
  const nextTasks = tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...patch,
        }
      : task,
  );
  await writeTasks(nextTasks);
  return nextTasks.find((task) => task.id === taskId);
}

export function createMarketCrawlerApp() {
  const app = express();
  let taskQueueRunning = false;

  async function processNextTask() {
    if (taskQueueRunning) return;
    taskQueueRunning = true;
    try {
      while (true) {
        const tasks = await readTasks();
        const nextTask = tasks.find((task) => task.status === "pending");
        if (!nextTask) break;

        await updateTask(nextTask.id, {
          status: "running",
          startedAt: new Date().toISOString(),
          errorMessage: "",
          screenshotPath: "",
        });

        try {
          const result = await crawlTemuKeyword({
            taskId: nextTask.id,
            keyword: nextTask.keyword,
            platform: nextTask.platform,
          });
          const savedProducts = result.products.map((product) => ({
            ...product,
            taskId: nextTask.id,
          }));
          await appendResults(savedProducts);
          await updateTask(nextTask.id, {
            status: "success",
            finishedAt: new Date().toISOString(),
            resultCount: savedProducts.length,
            screenshotPath: result.screenshotPath || "",
          });
        } catch (error) {
          await updateTask(nextTask.id, {
            status: "failed",
            finishedAt: new Date().toISOString(),
            errorMessage: error?.message || "Unknown Temu crawl failure.",
            screenshotPath: error?.screenshotPath || "",
            resultCount: 0,
          });
        }
      }
    } finally {
      taskQueueRunning = false;
    }
  }

  app.use(cors());
  app.use(express.json());

  app.get("/api/market/health", async (_request, response) => {
    await ensureStore();
    response.json({
      ok: true,
      platform: "temu",
      dataDir: DATA_DIR,
      resultsFile: RESULTS_FILE,
      screenshotDir: SCREENSHOT_DIR,
      supportedPlatforms,
    });
  });

  app.get("/api/market/tasks", async (_request, response) => {
    const tasks = await readTasks();
    response.json(
      tasks.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    );
  });

  app.post("/api/market/tasks", async (request, response) => {
    const keyword = String(request.body?.keyword || "").trim();
    const platform = String(request.body?.platform || "temu").toLowerCase();

    if (!keyword) {
      response.status(400).json({ error: "keyword is required" });
      return;
    }

    if (!supportedPlatforms.includes(platform)) {
      response.status(400).json({ error: "unsupported platform" });
      return;
    }

    const tasks = await readTasks();
    const task = {
      id: randomId("MKT"),
      platform,
      keyword,
      status: "pending",
      createdAt: new Date().toISOString(),
      startedAt: "",
      finishedAt: "",
      errorMessage: "",
      screenshotPath: "",
      resultCount: 0,
    };

    await writeTasks([task, ...tasks]);
    processNextTask().catch(() => undefined);
    response.status(201).json(task);
  });

  app.get("/api/market/results", async (request, response) => {
    const platform = request.query.platform
      ? String(request.query.platform)
      : undefined;
    const keyword = request.query.keyword
      ? String(request.query.keyword)
      : undefined;
    const results = await getFilteredResults({ platform, keyword });
    response.json(results);
  });

  app.get("/api/market/analysis", async (request, response) => {
    const platform = request.query.platform
      ? String(request.query.platform)
      : "temu";
    const keyword = request.query.keyword
      ? String(request.query.keyword)
      : undefined;
    const products = await getFilteredResults({ platform, keyword });
    response.json(computeAnalysis(products));
  });

  return { app, processNextTask };
}
