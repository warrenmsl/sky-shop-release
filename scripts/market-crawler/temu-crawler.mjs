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
  const content = (await page.textContent("body").catch(() => ""))?.toLowerCase() || "";
  const matchedText = (config.challengeTexts || []).find((item) =>
    content.includes(String(item).toLowerCase()),
  );

  return matchedText ? `Detected challenge or verification wall: ${matchedText}` : null;
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
      "雪尼尔",
      "羊羔绒",
      "凉感",
      "冰丝",
      "棉麻",
      "防滑"
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
      "奶油白",
      "摩卡",
      "雾霾蓝",
      "焦糖",
      "灰色",
      "绿色"
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
      "中古",
      "奶油风",
      "法式",
      "复古",
      "简约"
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
      "客厅",
      "卧室",
      "沙发",
      "椅子",
      "家纺"
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
      "买一送一",
      "工厂直发",
      "可定制",
      "爆款",
      "新品"
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

export async function crawlTemuKeyword({ taskId, keyword, platform = "temu" }) {
  process.env.PLAYWRIGHT_BROWSERS_PATH =
    process.env.PLAYWRIGHT_BROWSERS_PATH || "0";

  const { chromium } = await import("playwright");
  const selectorConfig = await loadSelectorConfig();
  const browser = await chromium.launch({
    headless: process.env.TEMU_CRAWLER_HEADED === "1" ? false : true,
    slowMo: process.env.TEMU_CRAWLER_HEADED === "1" ? 160 : 0,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    locale: "en-US",
  });
  const page = await context.newPage();

  try {
    const searchUrl = buildSearchUrl(selectorConfig.searchUrlTemplate, keyword);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await randomWait(page, 2200, 4200);
    await dismissKnownPopups(page, selectorConfig);

    const challenge = await detectChallenge(page, selectorConfig);
    if (challenge) {
      const error = new Error(challenge);
      error.screenshotPath = await saveFailureScreenshot(page, taskId);
      throw error;
    }

    await autoScroll(page);

    const secondChallenge = await detectChallenge(page, selectorConfig);
    if (secondChallenge) {
      const error = new Error(secondChallenge);
      error.screenshotPath = await saveFailureScreenshot(page, taskId);
      throw error;
    }

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
        const regexPrice = /([$€£]?\s?\d+(?:[.,]\d{1,2})?)/g;

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

          return Array.from(document.querySelectorAll("a[href*='-g-']")).map((anchor) =>
            anchor.closest("div,article,li") || anchor,
          );
        };

        return findCards()
          .map((card, index) => {
            const rawText = normalize(card.textContent || "");
            const title = textFromSelectors(card, config.titleSelectors) || rawText.slice(0, 180);
            const link = linkFromSelectors(card, config.linkSelectors);
            const imageUrl = imageFromSelectors(card, config.imageSelectors);
            const priceText = textFromSelectors(card, config.priceSelectors) || rawText;
            const priceMatches = priceText.match(regexPrice) || rawText.match(regexPrice) || [];
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
      const error = new Error("No Temu product cards were extracted from the first results page.");
      error.screenshotPath = await saveFailureScreenshot(page, taskId);
      throw error;
    }

    return {
      screenshotPath: null,
      products: results.map((result, index) => ({
        ...result,
        id: `${taskId}-${index + 1}`,
        productUrl: resolveUrl(result.productUrl),
        imageUrl: resolveUrl(result.imageUrl),
      })),
    };
  } catch (error) {
    if (!error.screenshotPath) {
      error.screenshotPath = await saveFailureScreenshot(page, taskId).catch(() => null);
    }
    throw error;
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}
