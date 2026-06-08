import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createMarketTask,
  fetchMarketHealth,
  fetchMarketResults,
  fetchMarketTasks,
  MarketResult,
  MarketTask,
} from "@/lib/market-api";
import { AlertTriangle, Download, PlayCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_KEYWORDS = [
  "sofa cover",
  "sofa cushion",
  "couch cover",
  "chair cushion",
  "home textile",
];

const STATUS_STYLES: Record<MarketTask["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
};

function exportCSV(rows: MarketResult[]) {
  const headers = [
    "title",
    "price",
    "discountPrice",
    "originalPrice",
    "rating",
    "reviewCount",
    "sales",
    "shopName",
    "platform",
    "keyword",
    "productUrl",
    "imageUrl",
    "rank",
    "crawlTime",
    "rawText",
  ];
  const values = rows.map((item) =>
    headers.map((header) => JSON.stringify(String(item[header as keyof MarketResult] ?? ""))),
  );
  const csv = [headers, ...values].map((row) => row.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "temu-market-results.csv";
  anchor.click();
}

function formatTime(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN");
}

export default function MarketCollect() {
  const [platform, setPlatform] = useState("temu");
  const [keyword, setKeyword] = useState(DEFAULT_KEYWORDS[0]);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof fetchMarketHealth>> | null>(null);
  const [tasks, setTasks] = useState<MarketTask[]>([]);
  const [results, setResults] = useState<MarketResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [healthValue, tasksValue, resultsValue] = await Promise.all([
          fetchMarketHealth(),
          fetchMarketTasks(),
          fetchMarketResults({ platform: "temu" }),
        ]);

        if (!active) return;
        setHealth(healthValue);
        setTasks(tasksValue);
        setResults(resultsValue);
        setError("");
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "无法连接 Temu 采集服务");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredResults = useMemo(
    () => results.filter((item) => item.platform === "temu" && (!keyword || item.keyword === keyword)),
    [keyword, results],
  );

  const createTask = async () => {
    const nextKeyword = keyword.trim();
    if (!nextKeyword) {
      toast.error("请输入采集关键词");
      return;
    }

    try {
      setSubmitting(true);
      await createMarketTask({ keyword: nextKeyword, platform });
      const [tasksValue, resultsValue] = await Promise.all([
        fetchMarketTasks(),
        fetchMarketResults({ platform: "temu" }),
      ]);
      setTasks(tasksValue);
      setResults(resultsValue);
      toast.success(`已创建 Temu 采集任务：${nextKeyword}`);
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "创建采集任务失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="市场数据采集"
        description="保留页面演示风格，真实数据改为来自本地 Temu Playwright 采集器。第一阶段仅采集 Temu 搜索结果第一页。"
        actions={
          <>
            <Button variant="outline" onClick={() => exportCSV(results)} disabled={results.length === 0}>
              <Download className="h-4 w-4 mr-1" />导出 CSV
            </Button>
            <Button onClick={() => void createTask()} disabled={submitting}>
              {submitting ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1" />}
              开始采集
            </Button>
          </>
        }
      />

      <Card className="mb-4 border-destructive/40 bg-destructive/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <div className="font-medium text-destructive">演示模式提示仍保留</div>
            <div className="text-muted-foreground">
              当前页面样式仍是演示版，但 Temu 结果区优先显示真实采集结果；如果没有真实数据，就显示“暂无真实 Temu 采集数据”。
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 mb-4">
        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">创建 Temu 关键词采集任务</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">平台</div>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temu">Temu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">关键词</div>
                <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="例如：sofa cover" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {DEFAULT_KEYWORDS.map((item) => (
                <Button key={item} type="button" variant="outline" size="sm" onClick={() => setKeyword(item)}>
                  {item}
                </Button>
              ))}
            </div>

            <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">
              采集器会慢速打开 Temu 搜索结果页，自动滚动一次页面，并提取标题、价格、评分、评论数、销量文本、链接、主图等字段。遇到验证墙或验证码时，会记录失败原因并截图，不会继续硬闯。
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">真实采集状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">API 状态</span>
              <Badge className={error ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}>
                {error ? "未连接" : "已连接"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">支持平台</span>
              <span>{health?.supportedPlatforms.join(", ") || "Temu"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">数据文件</span>
              <span className="text-xs font-mono">{health?.resultsFile || "等待采集器启动"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">截图目录</span>
              <span className="text-xs font-mono">{health?.screenshotDir || "等待采集器启动"}</span>
            </div>
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}。请先执行 `npm run crawler:server`，再返回刷新本页。
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">采集任务</TabsTrigger>
          <TabsTrigger value="results">采集结果</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card className="p-4 bg-card/60 border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务ID</TableHead>
                  <TableHead>平台</TableHead>
                  <TableHead>关键词</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>结果数</TableHead>
                  <TableHead>失败原因 / 截图</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      暂无真实 Temu 采集任务
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-xs">{task.id}</TableCell>
                      <TableCell>{task.platform}</TableCell>
                      <TableCell>{task.keyword}</TableCell>
                      <TableCell className="text-xs">{formatTime(task.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_STYLES[task.status]}>{task.status}</Badge>
                      </TableCell>
                      <TableCell>{task.resultCount}</TableCell>
                      <TableCell className="text-xs max-w-[320px]">
                        {task.errorMessage || (task.screenshotPath ? task.screenshotPath : "—")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card className="p-4 bg-card/60 border-border/60">
            {loading ? (
              <div className="text-sm text-muted-foreground">正在读取真实 Temu 采集结果...</div>
            ) : filteredResults.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无真实 Temu 采集数据</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>主图</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>折扣 / 原价</TableHead>
                    <TableHead>评分</TableHead>
                    <TableHead>评论数</TableHead>
                    <TableHead>销量文本</TableHead>
                    <TableHead>店铺</TableHead>
                    <TableHead>排名</TableHead>
                    <TableHead>关键词</TableHead>
                    <TableHead>采集时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="h-12 w-12 rounded object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded bg-muted/40" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <a href={item.productUrl} className="line-clamp-2 text-primary hover:underline" target="_blank" rel="noreferrer">
                          {item.title || "未识别标题"}
                        </a>
                      </TableCell>
                      <TableCell>{item.price || "—"}</TableCell>
                      <TableCell className="text-xs">
                        <div>{item.discountPrice || "—"}</div>
                        <div className="text-muted-foreground">{item.originalPrice || "—"}</div>
                      </TableCell>
                      <TableCell>{item.rating || "—"}</TableCell>
                      <TableCell>{item.reviewCount || "—"}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{item.sales || "—"}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{item.shopName || "—"}</TableCell>
                      <TableCell>{item.rank}</TableCell>
                      <TableCell>{item.keyword}</TableCell>
                      <TableCell className="text-xs">{formatTime(item.crawlTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
