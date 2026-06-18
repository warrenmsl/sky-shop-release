import cors from "cors";
import express from "express";
import {
  crawlPlatformKeyword,
  disposePlatformSession,
  extractCategoryMatches,
} from "./market-crawler/platform-crawler.mjs";
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

const supportedPlatforms = ["taobao", "tmall"];

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
    if (!supportedPlatforms.includes(item.platform)) return false;
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

function isManualTakeoverSupported() {
  return process.env.MARKET_CRAWLER_HEADED === "1";
}

export function createMarketCrawlerApp() {
  const app = express();
  let taskQueueRunning = false;
  const manualSessions = new Map();

  async function finalizeTaskSuccess(task, result, tasksPatch = {}) {
    const savedProducts = result.products.map((product) => ({
      ...product,
      taskId: task.id,
    }));
    await appendResults(savedProducts);
    await updateTask(task.id, {
      status: "success",
      finishedAt: new Date().toISOString(),
      resultCount: savedProducts.length,
      screenshotPath: result.screenshotPath || "",
      errorMessage: "",
      ...tasksPatch,
    });
  }

  async function runTask(task, options = {}) {
    const result = await crawlPlatformKeyword({
      taskId: task.id,
      keyword: task.keyword,
      platform: task.platform,
      manualMode: Boolean(task.manualMode),
      existingSession: options.existingSession || null,
    });

    if (result.status === "manual_required") {
      manualSessions.set(task.id, result.session);
      await updateTask(task.id, {
        status: "manual_required",
        errorMessage: result.message || "等待人工验证后继续。",
        screenshotPath: result.screenshotPath || "",
        finishedAt: "",
      });
      return;
    }

    manualSessions.delete(task.id);
    await finalizeTaskSuccess(task, result);
  }

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
          startedAt: nextTask.startedAt || new Date().toISOString(),
          finishedAt: "",
          errorMessage: "",
          screenshotPath: "",
        });

        try {
          await runTask(nextTask);
        } catch (error) {
          await updateTask(nextTask.id, {
            status: "failed",
            finishedAt: new Date().toISOString(),
            errorMessage: error?.message || "市场采集任务执行失败。",
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
      platform: "taobao",
      dataDir: DATA_DIR,
      resultsFile: RESULTS_FILE,
      screenshotDir: SCREENSHOT_DIR,
      supportedPlatforms,
      manualTakeoverSupported: isManualTakeoverSupported(),
      manualTakeoverHint: isManualTakeoverSupported()
        ? "当前服务已启用本地人工接管模式，遇到淘宝 / 天猫登录或验证时可在本地浏览器处理后继续采集。"
        : "人工接管模式需要在本地使用 npm run local:market 启动。",
    });
  });

  app.get("/api/market/tasks", async (_request, response) => {
    const tasks = await readTasks();
    response.json(
      tasks
        .filter((task) => supportedPlatforms.includes(task.platform))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    );
  });

  app.post("/api/market/tasks", async (request, response) => {
    const keyword = String(request.body?.keyword || "").trim();
    const platform = String(request.body?.platform || "taobao").toLowerCase();
    const manualMode = Boolean(request.body?.manualMode);

    if (!keyword) {
      response.status(400).json({ error: "请输入采集关键词。" });
      return;
    }

    if (!supportedPlatforms.includes(platform)) {
      response.status(400).json({ error: "当前平台暂不支持。" });
      return;
    }

    if (manualMode && !isManualTakeoverSupported()) {
      response.status(400).json({
        error:
          "当前服务未启用人工接管模式。请在本地使用 npm run local:market 启动。",
      });
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
      manualMode,
    };

    await writeTasks([task, ...tasks]);
    processNextTask().catch(() => undefined);
    response.status(201).json(task);
  });

  app.post("/api/market/tasks/:taskId/continue", async (request, response) => {
    const taskId = String(request.params.taskId || "");
    const tasks = await readTasks();
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      response.status(404).json({ error: "未找到采集任务。" });
      return;
    }

    if (task.status !== "manual_required") {
      response.status(400).json({ error: "当前任务不处于等待人工验证状态。" });
      return;
    }

    const session = manualSessions.get(taskId);
    if (!session) {
      response.status(410).json({
        error: "人工接管会话已失效，请重新创建一次采集任务。",
      });
      return;
    }

    await updateTask(taskId, {
      status: "running",
      errorMessage: "已收到继续采集请求，正在检查验证结果。",
      screenshotPath: task.screenshotPath || "",
    });

    runTask(task, { existingSession: session })
      .catch(async (error) => {
        manualSessions.delete(taskId);
        await disposePlatformSession(session);
        await updateTask(taskId, {
          status: "failed",
          finishedAt: new Date().toISOString(),
          errorMessage: error?.message || "人工接管后的继续采集失败。",
          screenshotPath: error?.screenshotPath || task.screenshotPath || "",
          resultCount: 0,
        });
      });

    response.json({
      ...task,
      status: "running",
      errorMessage: "已收到继续采集请求，正在检查验证结果。",
    });
  });

  app.get("/api/market/tasks/:taskId/manual-link", async (request, response) => {
    const taskId = String(request.params.taskId || "");
    const tasks = await readTasks();
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      response.status(404).json({ error: "未找到采集任务。" });
      return;
    }

    const session = manualSessions.get(taskId);
    response.json({
      taskId,
      url: session?.page?.url?.() || "",
      screenshotPath: task.screenshotPath || "",
    });
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
      : undefined;
    const keyword = request.query.keyword
      ? String(request.query.keyword)
      : undefined;
    const products = await getFilteredResults({ platform, keyword });
    response.json(computeAnalysis(products));
  });

  return { app, processNextTask };
}
