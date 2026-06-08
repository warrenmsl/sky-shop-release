import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SCREENSHOT_DIR } from "./store.mjs";

const ROOT = process.cwd();
const SELECTOR_CONFIG_PATH = path.join(
  ROOT,
  "scripts",
  "market-crawler",
  "config",
  "temu-selectors.json",
);

function normalizeWhitespace(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function buildSearchUrl(template, keyword) {
  return template.replace("{keyword}", encodeURIComponent(keyword));
}

function resolveUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://www.temu.com${url}`;
  return url;
}

async function loadSelectorConfig() {
  const raw = await readFile(SELECTOR_CONFIG_PATH, "utf8");
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
      // Ignore popups that are not present or cannot be closed safely.
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
    ? `检测到 Temu 验证墙或人机验证：${matchedText}`
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
      "chenille",
      "fleece",
      "cooling",
      "ice silk",
      "cotton",
      "linen",
      "non-slip",
      "slipcover",
      "plush",
      "velvet",
      "polyester",
      "jacquard",
    ],
    color: [
      "cream",
      "cream white",
      "mocha",
      "haze blue",
      "caramel",
      "grey",
      "gray",
      "green",
      "black",
      "beige",
      "brown",
      "white",
    ],
    style: [
      "vintage",
      "cream",
      "french",
      "retro",
      "ins",
      "minimalist",
      "modern",
      "boho",
      "luxury",
    ],
    scene: [
      "living room",
      "bedroom",
      "office",
      "patio",
      "home textile",
      "sofa",
      "couch",
      "chair",
      "loveseat",
    ],
    promotion: [
      "buy 1 get 1",
      "factory direct",
      "custom",
      "bestseller",
      "new arrival",
      "hot sale",
      "free shipping",
      "discount",
    ],
  };

  return Object.fromEntries(
    Object.entries(groups).map(([key, values]) => [
      key,
      values.map((value) => ({
        label: value,
        regex: new RegExp(`\\b${safePattern(value)}\\b`, "i"),
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

function isChallengeMessage(message) {
  return typeof message === "string" && message.includes("验证墙");
}

function createChallengeError(message, screenshotPath) {
  const error = new Error(message);
  error.code = "MANUAL_VERIFICATION_REQUIRED";
  error.screenshotPath = screenshotPath || "";
  return error;
}

async function extractResultsFromPage({ page, selectorConfig, keyword, platform }) {
  const results = await page.evaluate(
    ({ config, keywordValue, crawlAt, platformValue }) => {
      const normalize = (value) => (value || "").replace(/\s+/g, " ").trim();
      const toAbsoluteUrl = (value) => {
        if (!value) return "";
        if (value.startsWith("http://") || value.startsWith("https://")) return value;
        if (value.startsWith("//")) return `https:${value}`;
        if (value.startsWith("/")) return `https://www.temu.com${value}`;
        return value;
      };
      const regexNumber = /(\d+(?:[.,]\d+)?)/;
      const regexPrice = /([$€£¥]\s?\d+(?:[.,]\d{1,2})?)/g;

      const textFromSelectors = (root, selectors) => {
        for (const selector of selectors || []) {
          const node = root.querySelector(selector);
          const candidate =
            node?.getAttribute?.("content") ||
            node?.getAttribute?.("aria-label") ||
            node?.getAttribute?.("alt") ||
            node?.textContent;
          if (candidate && normalize(candidate)) return normalize(candidate);
        }
        return "";
      };

      const linkFromSelectors = (root, selectors) => {
        for (const selector of selectors || []) {
          const node = root.querySelector(selector);
          const href = node?.getAttribute?.("href");
          if (href) return toAbsoluteUrl(href);
        }
        return "";
      };

      const imageFromSelectors = (root, selectors) => {
        for (const selector of selectors || []) {
          const node = root.querySelector(selector);
          const src =
            node?.getAttribute?.("src") ||
            node?.getAttribute?.("data-src") ||
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

        return Array.from(document.querySelectorAll("a[href*='-g-']")).map(
          (anchor) => anchor.closest("div,article,li") || anchor,
        );
      };

      return findCards()
        .map((card, index) => {
          const rawText = normalize(card.textContent || "");
          const title =
            textFromSelectors(card, config.titleSelectors) || rawText.slice(0, 180);
          const link = linkFromSelectors(card, config.linkSelectors);
          const imageUrl = imageFromSelectors(card, config.imageSelectors);
          const priceText = textFromSelectors(card, config.priceSelectors) || rawText;
          const priceMatches =
            priceText.match(regexPrice) || rawText.match(regexPrice) || [];
          const ratingText = textFromSelectors(card, config.ratingSelectors);
          const reviewText = textFromSelectors(card, config.reviewSelectors) || rawText;
          const salesText = textFromSelectors(card, config.salesSelectors) || rawText;
          const shopName = textFromSelectors(card, config.shopSelectors);

          if (!title && !link && !rawText) return null;

          return {
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
            productUrl: link,
            rank: index + 1,
            crawlTime: crawlAt,
            rawText,
          };
        })
        .filter(Boolean);
    },
    {
      config: selectorConfig,
      keywordValue: keyword,
      crawlAt: new Date().toISOString(),
      platformValue: platform,
    },
  );

  if (!results.length) {
    throw new Error("未在 Temu 搜索结果第一页提取到商品卡片。");
  }

  return results;
}

async function launchTaskSession({ taskId, keyword, manualMode }) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || "0";
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: manualMode ? false : process.env.TEMU_CRAWLER_HEADED === "1" ? false : true,
    slowMo: manualMode || process.env.TEMU_CRAWLER_HEADED === "1" ? 160 : 0,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    locale: "en-US",
  });
  const page = await context.newPage();
  return { browser, context, page, taskId, keyword };
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
    const searchUrl = buildSearchUrl(selectorConfig.searchUrlTemplate, keyword);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
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

export async function crawlTemuKeyword({
  taskId,
  keyword,
  platform = "temu",
  manualMode = false,
  existingSession = null,
}) {
  const selectorConfig = await loadSelectorConfig();
  const session =
    existingSession || (await launchTaskSession({ taskId, keyword, manualMode }));

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
        productUrl: resolveUrl(result.productUrl),
        imageUrl: resolveUrl(result.imageUrl),
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
      error.screenshotPath = await saveFailureScreenshot(session.page, taskId).catch(
        () => "",
      );
    }
    await closeTaskSession(session);
    throw error;
  }
}

export async function disposeTemuSession(session) {
  await closeTaskSession(session);
}

export function isTemuChallengeMessage(message) {
  return isChallengeMessage(message);
}
