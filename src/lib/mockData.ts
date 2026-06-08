export const platforms = ["淘宝", "天猫", "京东", "拼多多", "抖音"] as const;
export type Platform = typeof platforms[number];

export const dashboardStats = {
  todayPending: 128,
  todaySuccess: 342,
  todayFailed: 17,
  marketCollected: 5820,
  abnormal: 9,
};

export const trendData = [
  { date: "06-01", 上架: 220, 成功: 198, 失败: 22 },
  { date: "06-02", 上架: 280, 成功: 256, 失败: 24 },
  { date: "06-03", 上架: 310, 成功: 290, 失败: 20 },
  { date: "06-04", 上架: 260, 成功: 240, 失败: 20 },
  { date: "06-05", 上架: 380, 成功: 360, 失败: 20 },
  { date: "06-06", 上架: 420, 成功: 395, 失败: 25 },
  { date: "06-07", 上架: 360, 成功: 342, 失败: 17 },
];

export const platformDistribution = [
  { name: "淘宝", value: 320 },
  { name: "天猫", value: 210 },
  { name: "京东", value: 180 },
  { name: "拼多多", value: 260 },
  { name: "抖音", value: 140 },
];

export const hotCategories = [
  { name: "家纺-沙发垫", 销量: 12400 },
  { name: "家纺-沙发巾", 销量: 9800 },
  { name: "家纺-飘窗垫", 销量: 8600 },
  { name: "潮玩-凉豆豆", 销量: 7200 },
  { name: "家居-中古风", 销量: 6400 },
  { name: "家居-摩卡风", 销量: 5800 },
];

export type TaskStatus = "待执行" | "执行中" | "成功" | "失败" | "需人工处理";

export const listingTasks = Array.from({ length: 28 }).map((_, i) => {
  const statuses: TaskStatus[] = ["待执行", "执行中", "成功", "失败", "需人工处理"];
  const status = statuses[i % statuses.length];
  return {
    id: `TASK-${10240 + i}`,
    code: `SPU-${20250000 + i}`,
    platform: platforms[i % platforms.length],
    store: ["庄园家居旗舰店", "摩卡生活馆", "中古风工作室"][i % 3],
    title: ["北欧风沙发垫四季通用", "复古庄园风沙发巾", "高端飘窗垫定制", "凉豆豆潮玩公仔", "摩卡色羊毛地毯"][i % 5],
    category: ["家纺/沙发垫", "家纺/沙发巾", "家纺/飘窗垫", "潮玩/公仔", "家居/地毯"][i % 5],
    price: 89 + i * 7,
    stock: 100 + i * 3,
    status,
    failReason: status === "失败" ? "标题包含违禁词「最」" : status === "需人工处理" ? "需补充类目资质" : "",
    createdAt: `2026-06-0${(i % 7) + 1} 10:${10 + (i % 50)}`,
  };
});

export const marketTasks = Array.from({ length: 10 }).map((_, i) => ({
  id: `MKT-${1000 + i}`,
  platform: platforms[i % platforms.length],
  keyword: ["沙发垫", "沙发巾", "飘窗垫", "凉豆豆", "中古风装饰", "摩卡色窗帘"][i % 6],
  category: "家居家纺",
  priceRange: "50-300",
  saleRange: "100-10000",
  pages: 5,
  freq: ["每小时", "每日", "每周"][i % 3],
  lastRun: `2026-06-07 ${8 + i}:00`,
  status: i % 4 === 0 ? "运行中" : "已完成",
}));

export const marketProducts = Array.from({ length: 24 }).map((_, i) => ({
  id: `P-${i + 1}`,
  title: ["北欧轻奢沙发垫", "复古庄园风沙发巾", "ins风飘窗垫", "凉豆豆毛绒公仔", "摩卡色绒布抱枕", "中古风蕾丝桌布"][i % 6],
  price: (59 + i * 11).toFixed(2),
  sales: 320 + i * 87,
  reviews: 120 + i * 23,
  store: ["庄园家居旗舰店", "摩卡生活馆", "中古风工作室", "豆豆潮玩官方"][i % 4],
  platform: platforms[i % platforms.length],
  image: `https://picsum.photos/seed/${i + 1}/200/200`,
  link: "https://example.com/item/" + i,
  collectedAt: `2026-06-07 ${(i % 12) + 8}:30`,
}));

export const assets = Array.from({ length: 18 }).map((_, i) => ({
  id: `A-${i + 1}`,
  url: `https://picsum.photos/seed/asset${i}/400/400`,
  name: ["主图01", "场景图02", "详情图03"][i % 3] + `-${i}`,
  tags: [["沙发垫", "中古风"], ["沙发巾", "庄园"], ["飘窗垫", "摩卡"], ["凉豆豆", "潮玩"]][i % 4],
}));

export const automationLogs = Array.from({ length: 30 }).map((_, i) => ({
  time: `2026-06-07 ${10 + (i % 12)}:${10 + (i % 50)}:05`,
  taskId: `TASK-${10240 + (i % 28)}`,
  platform: platforms[i % platforms.length],
  code: `SPU-${20250000 + (i % 28)}`,
  type: ["上架", "采集", "回调"][i % 3],
  status: ["成功", "失败", "重试"][i % 3],
  reason: i % 3 === 1 ? "登录态失效，请重新扫码" : "",
}));

export const stores = [
  { id: 1, name: "庄园家居旗舰店", platform: "天猫", loggedIn: true, agent: "agent-001" },
  { id: 2, name: "摩卡生活馆", platform: "淘宝", loggedIn: true, agent: "agent-001" },
  { id: 3, name: "中古风工作室", platform: "抖音", loggedIn: false, agent: "agent-002" },
  { id: 4, name: "豆豆潮玩官方", platform: "拼多多", loggedIn: true, agent: "agent-002" },
  { id: 5, name: "云端家纺", platform: "京东", loggedIn: false, agent: "agent-003" },
];

export const users = [
  { id: 1, name: "admin", role: "管理员", email: "admin@shop.com", active: true },
  { id: 2, name: "运营小李", role: "运营人员", email: "li@shop.com", active: true },
  { id: 3, name: "数据小王", role: "只读人员", email: "wang@shop.com", active: true },
  { id: 4, name: "运营小张", role: "运营人员", email: "zhang@shop.com", active: false },
];

// ---------- 本地浏览器自动化执行器 ----------
export const executors = [
  {
    id: "agent-001", name: "运营机-01（办公室 Mac）",
    host: "MacBook-Pro-Wang", os: "macOS 14.5",
    browser: "Chromium 124 · 有头模式",
    status: "在线" as "在线" | "离线" | "忙碌",
    currentTask: "TASK-10245 · 天猫上架中",
    todayDone: 86, successRate: 94.2,
    heartbeat: "2026-06-07 11:42:18",
    token: "agt_3f9c****a21b",
    lastShot: "https://picsum.photos/seed/shot1/640/360",
  },
  {
    id: "agent-002", name: "采集机-02（家里 Windows）",
    host: "DESKTOP-LXY9", os: "Windows 11",
    browser: "Chromium 124 · 无头模式",
    status: "忙碌" as const,
    currentTask: "MKT-1003 · 淘宝关键词采集",
    todayDone: 142, successRate: 88.6,
    heartbeat: "2026-06-07 11:42:32",
    token: "agt_7b21****ff03",
    lastShot: "https://picsum.photos/seed/shot2/640/360",
  },
  {
    id: "agent-003", name: "监控机-03（云服务器）",
    host: "aliyun-bj-04", os: "Ubuntu 22.04",
    browser: "Chromium 124 · 无头模式",
    status: "离线" as const,
    currentTask: "—",
    todayDone: 0, successRate: 0,
    heartbeat: "2026-06-07 09:13:05",
    token: "agt_55ab****c8d1",
    lastShot: "https://picsum.photos/seed/shot3/640/360",
  },
];

// ---------- Locator / 元素定位库 ----------
export const locators = [
  { id: 1, platform: "淘宝", page: "商品发布页", element: "标题输入框", locator: 'input[name="title"]', backup: '[data-id="goods-title"] input', status: "通过", lastOk: "2026-06-07 09:32", note: "" },
  { id: 2, platform: "淘宝", page: "商品发布页", element: "类目选择按钮", locator: 'button.cat-select', backup: '//button[contains(.,"选择类目")]', status: "通过", lastOk: "2026-06-07 09:33", note: "" },
  { id: 3, platform: "天猫", page: "商品发布页", element: "上传主图按钮", locator: '.upload-main input[type="file"]', backup: '#mainImgUpload', status: "通过", lastOk: "2026-06-07 10:15", note: "" },
  { id: 4, platform: "天猫", page: "商品发布页", element: "提交按钮", locator: 'button.submit-publish', backup: '//button[text()="发布"]', status: "失败", lastOk: "2026-06-06 21:08", note: "页面改版，待更新" },
  { id: 5, platform: "京东", page: "商家后台", element: "登录按钮", locator: 'a.login-entry', backup: '//a[contains(.,"登录")]', status: "通过", lastOk: "2026-06-07 08:01", note: "" },
  { id: 6, platform: "京东", page: "商品列表", element: "搜索框", locator: 'input[placeholder="商品名称"]', backup: '#searchInput', status: "通过", lastOk: "2026-06-07 11:02", note: "" },
  { id: 7, platform: "拼多多", page: "商品发布页", element: "SKU 表格", locator: '.sku-table', backup: '[role="table"].sku', status: "待测试", lastOk: "—", note: "新增" },
  { id: 8, platform: "抖音", page: "精选联盟选品", element: "采集列表项", locator: '.product-card', backup: '.list .item', status: "通过", lastOk: "2026-06-07 10:45", note: "" },
  { id: 9, platform: "小红书", page: "搜索结果页", element: "笔记卡片", locator: 'section.note-item', backup: 'a[href*="/explore/"]', status: "通过", lastOk: "2026-06-07 11:30", note: "" },
  { id: 10, platform: "天猫", page: "生意参谋", element: "访客数值", locator: '.visitor-num', backup: '[data-metric="visitor"]', status: "通过", lastOk: "2026-06-07 11:35", note: "店铺监控用" },
];

export const recentScreenshots = Array.from({ length: 8 }).map((_, i) => ({
  id: i,
  url: `https://picsum.photos/seed/run${i}/400/250`,
  taskId: `TASK-${10240 + i}`,
  time: `2026-06-07 ${10 + (i % 3)}:${20 + i}`,
  ok: i % 3 !== 1,
}));

// ---------- 我的店铺链接监控 ----------
export type MonitorLink = {
  id: string;
  itemId: string;
  title: string;
  image: string;
  store: string;
  platform: Platform;
  visitors: number;
  exposure: number;
  ctr: number;       // 点击率
  cvr: number;       // 转化率
  favAdd: number;    // 收藏加购
  sales: number;
  refund: number;    // 退款率
  profit: number;
  stock: number;
  adCost: number;
  roi: number;
  alerts: string[];
};

const titlePool = [
  "北欧轻奢沙发垫四季通用防滑", "复古庄园风沙发巾全包盖布",
  "ins风飘窗垫加厚海绵定制", "纯棉色织床品四件套裸睡",
  "摩卡色绒布抱枕靠垫", "中古风蕾丝桌布茶几布",
  "高端真皮沙发坐垫不易移", "凉感冰丝沙发垫夏季款",
  "天丝床笠席梦思保护套", "美式复古印花沙发巾",
  "极简素色飘窗坐垫", "羊羔绒沙发盖布秋冬款",
];

export const monitorLinks: MonitorLink[] = Array.from({ length: 12 }).map((_, i) => {
  const visitors = 600 + Math.round(Math.random() * 2400);
  const exposure = visitors * (8 + Math.round(Math.random() * 12));
  const ctr = +((visitors / exposure) * 100).toFixed(2);
  const sales = Math.round(visitors * (0.01 + Math.random() * 0.05));
  const cvr = +((sales / visitors) * 100).toFixed(2);
  const refund = +(Math.random() * 6).toFixed(2);
  const adCost = Math.round(200 + Math.random() * 1800);
  const profit = Math.round(sales * (30 + Math.random() * 80) - adCost);
  const roi = +((profit + adCost) / Math.max(adCost, 1)).toFixed(2);
  const stock = Math.round(20 + Math.random() * 480);
  const alerts: string[] = [];
  if (refund > 4) alerts.push("退款率偏高");
  if (stock < 80) alerts.push("库存预警");
  if (cvr < 1.5) alerts.push("转化偏低");
  if (roi < 1.2) alerts.push("推广亏损");
  return {
    id: `LINK-${1000 + i}`,
    itemId: `SPU-${30250000 + i}`,
    title: titlePool[i % titlePool.length],
    image: `https://picsum.photos/seed/link${i}/200/200`,
    store: ["庄园家居旗舰店", "摩卡生活馆", "中古风工作室", "云端家纺"][i % 4],
    platform: platforms[i % platforms.length],
    visitors,
    exposure,
    ctr,
    cvr,
    favAdd: Math.round(visitors * 0.08),
    sales,
    refund,
    profit,
    stock,
    adCost,
    roi,
    alerts,
  };
});

// ---------- 链接评分系统 ----------
export type LinkScore = {
  id: string;
  linkId: string;
  title: string;
  image: string;
  platform: Platform;
  store: string;
  total: number;
  grade: "S" | "A" | "B" | "C" | "D";
  dims: {
    流量: number; 转化: number; 利润: number; 退款率: number;
    库存健康: number; 价格竞争力: number; 图片质量: number;
    标题关键词: number; 竞品压力: number; 增长趋势: number;
  };
  tags: string[];
};

const gradeOf = (s: number) =>
  s >= 90 ? "S" : s >= 80 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : "D";

const tagPool = [
  "标题缺核心词", "主图同质化", "价格偏高", "退款率高",
  "库存紧张", "转化短板", "推广亏损", "增长乏力",
  "竞品挤压", "评论积累不足",
];

export const linkScores: LinkScore[] = monitorLinks.map((l, i) => {
  const dims = {
    流量: 50 + Math.round(Math.random() * 50),
    转化: 40 + Math.round(Math.random() * 55),
    利润: 40 + Math.round(Math.random() * 55),
    退款率: 100 - Math.round(l.refund * 12),
    库存健康: l.stock > 200 ? 90 : l.stock > 80 ? 70 : 45,
    价格竞争力: 50 + Math.round(Math.random() * 45),
    图片质量: 60 + Math.round(Math.random() * 35),
    标题关键词: 55 + Math.round(Math.random() * 40),
    竞品压力: 45 + Math.round(Math.random() * 45),
    增长趋势: 40 + Math.round(Math.random() * 55),
  };
  const total = Math.round(
    Object.values(dims).reduce((s, v) => s + v, 0) / Object.keys(dims).length,
  );
  const sortedDim = Object.entries(dims).sort((a, b) => a[1] - b[1]).slice(0, 3);
  const tags = sortedDim.map(([, ], idx) => tagPool[(i + idx) % tagPool.length]);
  return {
    id: `SC-${l.id}`,
    linkId: l.id,
    title: l.title,
    image: l.image,
    platform: l.platform,
    store: l.store,
    total,
    grade: gradeOf(total) as LinkScore["grade"],
    dims,
    tags,
  };
});

// ---------- 操作建议 ----------
export type Suggestion = {
  id: string;
  linkId: string;
  title: string;
  image: string;
  priority: "立即处理" | "本周优化" | "继续观察";
  type:
    | "优化主图" | "优化标题" | "调整价格" | "补库存" | "降低推广"
    | "增加场景图" | "测试新颜色" | "清理滞销SKU" | "对标竞品";
  reason: string;
  expect: string;
};

const sugTypes: Suggestion["type"][] = [
  "优化主图", "优化标题", "调整价格", "补库存", "降低推广",
  "增加场景图", "测试新颜色", "清理滞销SKU", "对标竞品",
];

export const suggestions: Suggestion[] = monitorLinks.flatMap((l, i) => {
  const prios: Suggestion["priority"][] = ["立即处理", "本周优化", "继续观察"];
  return [0, 1].map((k) => ({
    id: `SUG-${l.id}-${k}`,
    linkId: l.id,
    title: l.title,
    image: l.image,
    priority: prios[(i + k) % 3],
    type: sugTypes[(i + k) % sugTypes.length],
    reason: [
      "点击率低于类目均值 30%",
      "近 7 日转化下滑 18%",
      "退款率高于同行 1.8%",
      "竞品同款价低 ¥12",
      "库存仅够售 6 天",
    ][(i + k) % 5],
    expect: ["预计点击率 +25%", "预计转化 +12%", "预计利润 +¥800/日", "预计退款率 -1.2%"][(i + k) % 4],
  }));
});

// ---------- 爆款元素分析（家居布艺方向） ----------
export const elementCategories = [
  {
    name: "颜色", items: [
      { label: "摩卡棕", heat: 92, trend: 18 },
      { label: "奶油白", heat: 88, trend: 12 },
      { label: "雾霾蓝", heat: 76, trend: -4 },
      { label: "焦糖橘", heat: 71, trend: 22 },
      { label: "苔藓绿", heat: 65, trend: 9 },
      { label: "藕粉", heat: 58, trend: -8 },
    ],
  },
  {
    name: "材质", items: [
      { label: "雪尼尔", heat: 95, trend: 24 },
      { label: "羊羔绒", heat: 82, trend: 16 },
      { label: "提花棉麻", heat: 78, trend: 6 },
      { label: "冰丝凉感", heat: 70, trend: 32 },
      { label: "真皮防滑", heat: 64, trend: 4 },
    ],
  },
  {
    name: "风格", items: [
      { label: "中古风", heat: 94, trend: 28 },
      { label: "庄园复古", heat: 86, trend: 19 },
      { label: "侘寂风", heat: 72, trend: 14 },
      { label: "美拉德", heat: 68, trend: 35 },
      { label: "ins极简", heat: 60, trend: -6 },
    ],
  },
  {
    name: "图案", items: [
      { label: "格纹", heat: 88, trend: 12 },
      { label: "花卉刺绣", heat: 80, trend: 22 },
      { label: "几何拼接", heat: 70, trend: 5 },
      { label: "纯色素面", heat: 65, trend: -2 },
    ],
  },
  {
    name: "场景", items: [
      { label: "客厅大沙发", heat: 90, trend: 10 },
      { label: "飘窗榻榻米", heat: 76, trend: 18 },
      { label: "卧室飘窗", heat: 68, trend: 8 },
      { label: "出租房改造", heat: 60, trend: 25 },
    ],
  },
  {
    name: "促销词", items: [
      { label: "工厂直发", heat: 84, trend: 14 },
      { label: "买一送一", heat: 78, trend: 6 },
      { label: "可定制尺寸", heat: 88, trend: 20 },
      { label: "新品上市", heat: 60, trend: -4 },
    ],
  },
];

export const priceBandData = [
  { range: "0-79", count: 18, gmv: 16 },
  { range: "79-129", count: 36, gmv: 38 },
  { range: "129-199", count: 42, gmv: 52 },
  { range: "199-299", count: 28, gmv: 41 },
  { range: "299-499", count: 16, gmv: 28 },
  { range: "499+", count: 8, gmv: 19 },
];

export const elementKeywords = [
  { word: "沙发垫", freq: 320 }, { word: "防滑", freq: 240 },
  { word: "四季通用", freq: 198 }, { word: "中古风", freq: 186 },
  { word: "雪尼尔", freq: 172 }, { word: "可定制", freq: 158 },
  { word: "摩卡", freq: 142 }, { word: "庄园", freq: 128 },
  { word: "美拉德", freq: 110 }, { word: "盖布", freq: 96 },
  { word: "飘窗", freq: 88 }, { word: "羊羔绒", freq: 74 },
];

export const elementTrend = Array.from({ length: 14 }).map((_, i) => ({
  day: `06-${(i + 1).toString().padStart(2, "0")}`,
  雪尼尔: 80 + Math.round(Math.sin(i / 2) * 12 + i * 4),
  中古风: 70 + Math.round(Math.cos(i / 3) * 10 + i * 5),
  摩卡棕: 60 + Math.round(Math.sin(i / 2.5) * 14 + i * 3),
}));