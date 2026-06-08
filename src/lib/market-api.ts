export type MarketTaskStatus = "pending" | "running" | "success" | "failed";

export type MarketTask = {
  id: string;
  platform: string;
  keyword: string;
  status: MarketTaskStatus;
  createdAt: string;
  startedAt: string;
  finishedAt: string;
  errorMessage: string;
  screenshotPath: string;
  resultCount: number;
};

export type MarketResult = {
  id: string;
  taskId?: string;
  platform: string;
  keyword: string;
  title: string;
  price: string;
  discountPrice: string;
  originalPrice: string;
  rating: string;
  reviewCount: string;
  sales: string;
  shopName: string;
  imageUrl: string;
  productUrl: string;
  rank: number;
  crawlTime: string;
  rawText: string;
  numericPrice?: number;
  numericRating?: number;
  numericReviews?: number;
  numericSales?: number;
};

export type FrequencyBucket = {
  label: string;
  count: number;
};

export type MarketAnalysis = {
  totalProducts: number;
  latestCrawlTime: string | null;
  materialFrequency: FrequencyBucket[];
  colorFrequency: FrequencyBucket[];
  styleFrequency: FrequencyBucket[];
  sceneFrequency: FrequencyBucket[];
  promotionFrequency: FrequencyBucket[];
  titleWordFrequency: FrequencyBucket[];
  priceBandDistribution: Array<{ range: string; count: number }>;
  topReviewedProducts: MarketResult[];
  topRatedProducts: MarketResult[];
  topSalesProducts: MarketResult[];
};

const runtimeDefaultBase =
  typeof window !== "undefined" &&
  ["127.0.0.1", "localhost"].includes(window.location.hostname)
    ? "http://127.0.0.1:8787"
    : "";

const API_BASE = (import.meta.env.VITE_MARKET_API_BASE || runtimeDefaultBase).replace(
  /\/$/,
  "",
);

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    throw new Error(`Market API request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchMarketHealth() {
  return requestJson<{
    ok: boolean;
    platform: string;
    dataDir: string;
    resultsFile: string;
    screenshotDir: string;
    supportedPlatforms: string[];
  }>("/api/market/health");
}

export async function fetchMarketTasks() {
  return requestJson<MarketTask[]>("/api/market/tasks");
}

export async function createMarketTask(payload: { keyword: string; platform: string }) {
  return requestJson<MarketTask>("/api/market/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchMarketResults(params?: { platform?: string; keyword?: string }) {
  const search = new URLSearchParams();
  if (params?.platform) search.set("platform", params.platform);
  if (params?.keyword) search.set("keyword", params.keyword);
  const query = search.toString();
  return requestJson<MarketResult[]>(`/api/market/results${query ? `?${query}` : ""}`);
}

export async function fetchMarketAnalysis(params?: { platform?: string; keyword?: string }) {
  const search = new URLSearchParams();
  if (params?.platform) search.set("platform", params.platform);
  if (params?.keyword) search.set("keyword", params.keyword);
  const query = search.toString();
  return requestJson<MarketAnalysis>(`/api/market/analysis${query ? `?${query}` : ""}`);
}
