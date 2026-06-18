import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SCREENSHOT_DIR } from "./store.mjs";

const ROOT = process.cwd();
const SUPPORTED_PLATFORMS = new Set(["taobao", "tmall"]);

function normalizeWhitespace(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function buildSearchUrl(template, keyword) {
  return template.replace("{keyword}", encodeURIComponent(keyword));
}

function resolveUrl(url, baseUrl) {
  if (!url) return "";
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

async function loadSelectorConfig(platform) {
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    throw new Error("当前平台暂不支持。");
  }

  const configPath = path.join(
    ROOT,
    "scripts",
    "market-crawler",
    "config",
    `${platform}-selectors.json`,
  );
  const raw = await readFile(configPath, "utf8");
  return JSON.parse(raw);
}

async function randomWait(page, min = 1200, max = 2600) {
  await page.waitForTimeout(randomInt(min, max + 1));
}

async function dismissKnownPopups(page, config) {
  for (const selector of config.popupCloseSelectors || []) {
    const locator = page.locator(selector).first();
    try {
      if (await locator.isVisible({ timeout: 500 })) {
        await locator.click({ timeout: 1000 });
        await page.waitForTimeout(400);
      }
    } catch {
      // Ignore popups that are absent or cannot be closed safely.
    }
  }
}

async function detectChallenge(page, config) {
  const content =
    (await page.textContent("body").catch(() => ""))?.toLowerCase() || "";
  const matchedText = (config.challengeTexts || []).find((item) =>
    content.includes(String(item).toLowerCase()),
  );

  return matchedText
    ? `检测到${config.platformLabel}登录页或人机验证：${matchedText}`
    : null;
}

async function saveFailureScreenshot(page, taskId) {
  const fileName = `${taskId}-${Date.now()}.png`;
  const absolutePath = path.join(SCREENSHOT_DIR, fileName);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return absolutePath;
}

async function autoScroll(page) {
  for (let index = 0; index < 5; index += 1) {
    await page.mouse.wheel(0, randomInt(900, 1600));
    await randomWait(page, 1500, 3200);
  }
}

function safePattern(source) {
  return String(source).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCategoryMatchers() {
  const groups = {
    material: [
      "雪尼尔",
      "羊羔绒",
      "凉感",
      "冰丝",
      "棉麻",
      "防滑",
      "纯棉",
      "亚麻",
      "涤纶",
      "毛绒",
      "chenille",
      "fleece",
      "cotton",
      "linen",
      "non-slip",
      "polyester"
    ],
    color: [
      "奶油白",
      "摩卡",
      "雾霾蓝",
      "焦糖",
      "灰色",
      "绿色",
      "米白",
      "卡其",
      "咖色",
      "黑色",
      "cream",
      "mocha",
      "blue",
      "caramel",
      "grey",
      "gray",
      "green",
      "beige"
    ],
    style: [
      "中古",
      "奶油风",
      "法式",
      "复古",
      "简约",
      "现代",
      "轻奢",
      "北欧",
      "ins",
      "vintage",
      "french",
      "retro",
      "minimalist",
      "modern"
    ],
    scene: [
      "客厅",
      "卧室",
      "沙发",
      "椅子",
      "家纺",
      "飘窗",
      "办公室",
      "餐厅",
      "living room",
      "bedroom",
      "sofa",
      "couch",
      "chair",
      "home textile"
    ],
    promotion: [
      "买一送一",
      "工厂直发",
      "可定制",
      "爆款",
      "新品",
      "包邮",
      "限时",
      "特价",
      "满减",
      "优惠",
      "buy 1 get 1",
      "factory direct",
      "custom",
      "bestseller",
      "new arrival",
      "free shipping",
      "discount"
    ]
  };

  return Object.fromEntries(
    Object.entries(groups).map(([key, values]) => [
      key,
      values.map((value) => ({
        label: value,
        regex: /[\u4e00-\u9fff]/.test(value)
          ? new RegExp(safePattern(value), "i")
          : new RegExp(`\\b${safePattern(value)}\\b`, "i"),
      })),
    ]),
  );
}

const CATEGORY_MATCHERS = buildCategoryMatchers();

export function extractCategoryMatches(rawText) {
  const text = String(rawText || "").toLowerCase();
  return Object.fromEntries(
    Object.entries(CATEGORY_MATCHERS).map(([key, items]) => [
      key,
      items.filter((item) => item.regex.test(text)).map((item) => item.label),
    ]),
  );
}

function createChallengeError(message, screenshotPath) {
  const error = new Error(message);
  error.code = "MANUAL_VERIFICATION_REQUIRED";
  error.screenshotPath = screenshotPath || "";
  return error;
}

async function extractResultsFromPage({
  page,
  selectorConfig,
  keyword,
  platform,
}) {
  const results = await page.evaluate(
    ({ config, keywordValue, crawlAt, platformValue }) => {
      const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
      const toAbsoluteUrl = (value) => {
        if (!value) return "";
        try {
          return new URL(value, config.baseUrl).toString();
        } catch {
          return value;
        }
      };
      const regexNumber = /(\d+(?:[.,]\d+)?)/;
      const regexPrice = /([¥￥]\s?\d+(?:[.,]\d{1,2})?)/g;

      const textFromSelectors = (root, selectors) => {
        for (const selector of selectors || []) {
          const node = root.matches?.(selector)
            ? root
            : root.querySelector(selector);
          const candidate =
            node?.getAttribute?.("content") ||
            node?.getAttribute?.("aria-label") ||
            node?.getAttribute?.("title") ||
            node?.getAttribute?.("alt") ||
            node?.textContent;
          if (candidate && normalize(candidate)) return normalize(candidate);
        }
        return "";
      };

      const linkFromSelectors = (root, selectors) => {
        for (const selector of selectors || []) {
          const node = root.matches?.(selector)
            ? root
            : root.querySelector(selector);
          const href = node?.getAttribute?.("href");
          if (href) return toAbsoluteUrl(href);
        }
        return "";
      };

      const imageFromSelectors = (root, selectors) => {
        for (const selector of selectors || []) {
          const node = root.matches?.(selector)
            ? root
            : root.querySelector(selector);
          const src =
            node?.getAttribute?.("src") ||
            node?.getAttribute?.("data-src") ||
            node?.getAttribute?.("data-ks-lazyload") ||
            node?.getAttribute?.("srcset")?.split(" ")[0];
          if (src) return toAbsoluteUrl(src);
        }
        return "";
      };

      const findCards = () => {
        for (const selector of config.productCardSelectors || []) {
          const found = Array.from(document.querySelectorAll(selector));
          if (found.length >= 4) return found;
        }

        return Array.from(
          document.querySelectorAll(
            "a[href*='item.taobao.com/item.htm'], a[href*='detail.tmall.com/item.htm']",
          ),
        ).map((anchor) => anchor.closest("div,article,li") || anchor);
      };

      const unique = new Map();
      for (const [index, card] of findCards().entries()) {
        const rawText = normalize(card.textContent || "");
        const title =
          textFromSelectors(card, config.titleSelectors) ||
          rawText.slice(0, 180);
        const productUrl = linkFromSelectors(card, config.linkSelectors);
        const imageUrl = imageFromSelectors(card, config.imageSelectors);
        const priceText =
          textFromSelectors(card, config.priceSelectors) || rawText;
        const priceMatches =
          priceText.match(regexPrice) || rawText.match(regexPrice) || [];
        const ratingText = textFromSelectors(card, config.ratingSelectors);
        const reviewText =
          textFromSelectors(card, config.reviewSelectors) || rawText;
        const salesText =
          textFromSelectors(card, config.salesSelectors) || rawText;
        const shopName = textFromSelectors(card, config.shopSelectors);

        if (!title || !productUrl) continue;

        const dedupeKey = productUrl.split("#")[0];
        if (unique.has(dedupeKey)) continue;

        unique.set(dedupeKey, {
          id: `${platformValue}-${Date.now()}-${index}`,
          platform: platformValue,
          keyword: keywordValue,
          title,
          price: priceMatches[0] || "",
          discountPrice: priceMatches[0] || "",
          originalPrice:
            textFromSelectors(card, config.originalPriceSelectors) ||
            priceMatches[1] ||
            "",
          rating: (ratingText.match(regexNumber) || [])[1] || "",
          reviewCount: (reviewText.match(regexNumber) || [])[1] || "",
          sales: normalize(salesText),
          shopName,
          imageUrl,
          productUrl,
          rank: unique.size + 1,
          crawlTime: crawlAt,
          rawText,
        });
      }

      return Array.from(unique.values());
    },
    {
      config: selectorConfig,
      keywordValue: keyword,
      crawlAt: new Date().toISOString(),
      platformValue: platform,
    },
  );

  if (!results.length) {
    throw new Error(
      `未在${selectorConfig.platformLabel}搜索结果第一页提取到商品卡片，请检查登录状态或页面选择器。`,
    );
  }

  return results;
}

async function launchTaskSession({ taskId, keyword, platform, manualMode }) {
  process.env.PLAYWRIGHT_BROWSERS_PATH =
    process.env.PLAYWRIGHT_BROWSERS_PATH || "0";
  const { chromium } = await import("playwright");
  const headed =
    manualMode || process.env.MARKET_CRAWLER_HEADED === "1";
  const browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 160 : 0,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    locale: "zh-CN",
  });
  const page = await context.newPage();
  return { browser, context, page, taskId, keyword, platform };
}

async function closeTaskSession(session) {
  await session.page?.close().catch(() => undefined);
  await session.context?.close().catch(() => undefined);
  await session.browser?.close().catch(() => undefined);
}

async function preparePageForExtraction({
  session,
  selectorConfig,
  keyword,
  manualMode,
  resume = false,
}) {
  const { page, taskId } = session;

  if (!resume) {
    const searchUrl = buildSearchUrl(
      selectorConfig.searchUrlTemplate,
      keyword,
    );
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  }

  await randomWait(page, 2200, 4200);
  await dismissKnownPopups(page, selectorConfig);

  const challenge = await detectChallenge(page, selectorConfig);
  if (challenge) {
    const screenshotPath = await saveFailureScreenshot(page, taskId);
    if (manualMode) {
      throw createChallengeError(challenge, screenshotPath);
    }
    const error = new Error(challenge);
    error.screenshotPath = screenshotPath;
    throw error;
  }

  await autoScroll(page);

  const secondChallenge = await detectChallenge(page, selectorConfig);
  if (secondChallenge) {
    const screenshotPath = await saveFailureScreenshot(page, taskId);
    if (manualMode) {
      throw createChallengeError(secondChallenge, screenshotPath);
    }
    const error = new Error(secondChallenge);
    error.screenshotPath = screenshotPath;
    throw error;
  }
}

export async function crawlPlatformKeyword({
  taskId,
  keyword,
  platform,
  manualMode = false,
  existingSession = null,
}) {
  const selectorConfig = await loadSelectorConfig(platform);
  const session =
    existingSession ||
    (await launchTaskSession({ taskId, keyword, platform, manualMode }));

  try {
    await preparePageForExtraction({
      session,
      selectorConfig,
      keyword,
      manualMode,
      resume: Boolean(existingSession),
    });

    const rawResults = await extractResultsFromPage({
      page: session.page,
      selectorConfig,
      keyword,
      platform,
    });

    await closeTaskSession(session);

    return {
      status: "success",
      screenshotPath: null,
      products: rawResults.map((result, index) => ({
        ...result,
        id: `${taskId}-${index + 1}`,
        productUrl: resolveUrl(result.productUrl, selectorConfig.baseUrl),
        imageUrl: resolveUrl(result.imageUrl, selectorConfig.baseUrl),
      })),
    };
  } catch (error) {
    if (error?.code === "MANUAL_VERIFICATION_REQUIRED") {
      return {
        status: "manual_required",
        message: error.message,
        screenshotPath: error.screenshotPath || "",
        session,
      };
    }

    if (!error?.screenshotPath) {
      error.screenshotPath = await saveFailureScreenshot(
        session.page,
        taskId,
      ).catch(() => "");
    }
    await closeTaskSession(session);
    throw error;
  }
}

export async function disposePlatformSession(session) {
  await closeTaskSession(session);
}
