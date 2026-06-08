import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  continueMarketTask,
  createMarketTask,
  fetchMarketHealth,
  fetchMarketManualLink,
  fetchMarketResults,
  fetchMarketTasks,
  MarketResult,
  MarketTask,
} from "@/lib/market-api";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  MonitorSmartphone,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
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
  manual_required: "bg-amber-500/15 text-amber-300",
  success: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<MarketTask["status"], string> = {
  pending: "待执行",
  running: "执行中",
  manual_required: "等待人工验证",
  success: "成功",
  failed: "失败",
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
    headers.map((header) =>
      JSON.stringify(String(item[header as keyof MarketResult] ?? "")),
    ),
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

function formatTaskError(task: MarketTask) {
  const message = task.errorMessage?.trim();
  if (!message) {
    return task.screenshotPath ? `截图：${task.screenshotPath}` : "—";
  }
  return message;
}

export default function MarketCollect() {
  const [platform, setPlatform] = useState("temu");
  const [keyword, setKeyword] = useState(DEFAULT_KEYWORDS[0]);
  const [manualMode, setManualMode] = useState(false);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof fetchMarketHealth>> | null>(null);
  const [tasks, setTasks] = useState<MarketTask[]>([]);
  const [results, setResults] = useState<MarketResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [continuingTaskId, setContinuingTaskId] = useState("");
  const [error, setError] = useState("");
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualDialogTaskId, setManualDialogTaskId] = useState("");
  const [manualDialogUrl, setManualDialogUrl] = useState("");
  const [manualDialogScreenshot, setManualDialogScreenshot] = useState("");
  const [loadingManualLink, setLoadingManualLink] = useState(false);
  const seenManualDialogRef = useRef<string>("");

  const load = async () => {
    const [healthValue, tasksValue, resultsValue] = await Promise.all([
      fetchMarketHealth(),
      fetchMarketTasks(),
      fetchMarketResults({ platform: "temu" }),
    ]);
    setHealth(healthValue);
    setTasks(tasksValue);
    setResults(resultsValue);
    return { healthValue, tasksValue };
  };

  const openManualDialog = async (taskId: string) => {
    try {
      setLoadingManualLink(true);
      const payload = await fetchMarketManualLink(taskId);
      setManualDialogTaskId(taskId);
      setManualDialogUrl(payload.url || "");
      setManualDialogScreenshot(payload.screenshotPath || "");
      setManualDialogOpen(true);
    } catch (dialogError) {
      toast.error(
        dialogError instanceof Error
          ? dialogError.message
          : "无法读取人工验证链接",
      );
    } finally {
      setLoadingManualLink(false);
    }
  };

  const refreshData = async () => {
    try {
      await load();
      setError("");
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "刷新采集数据失败",
      );
    }
  };

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const { healthValue, tasksValue } = await load();
        if (!active) return;
        if (healthValue.manualTakeoverSupported) {
          setManualMode((current) => current || true);
        }
        setError("");

        const manualTask = tasksValue.find((task) => task.status === "manual_required");
        if (
          manualTask &&
          manualTask.id !== seenManualDialogRef.current &&
          healthValue.manualTakeoverSupported
        ) {
          seenManualDialogRef.current = manualTask.id;
          await openManualDialog(manualTask.id);
        }
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "无法连接 Temu 采集服务",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredResults = useMemo(
    () =>
      results.filter(
        (item) => item.platform === "temu" && (!keyword || item.keyword === keyword),
      ),
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
      await createMarketTask({
        keyword: nextKeyword,
        platform,
        manualMode,
      });
      await refreshData();
      toast.success(`已创建 Temu 采集任务：${nextKeyword}`);
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "创建采集任务失败",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const continueTask = async (taskId: string) => {
    try {
      setContinuingTaskId(taskId);
      await continueMarketTask(taskId);
      await refreshData();
      setManualDialogOpen(false);
      toast.success("已继续采集，请在本地浏览器完成验证后等待结果返回。");
    } catch (continueError) {
      toast.error(
        continueError instanceof Error
          ? continueError.message
          : "继续采集失败",
      );
    } finally {
      setContinuingTaskId("");
    }
  };

  return (
    <div>
      <PageHeader
        title="市场数据采集"
        description="保留页面演示风格，真实数据改为来自 Temu Playwright 采集器。第一阶段仅采集 Temu 搜索结果第一页。"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => exportCSV(results)}
              disabled={results.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              导出 CSV
            </Button>
            <Button onClick={() => void createTask()} disabled={submitting}>
              {submitting ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-1" />
              )}
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

      {!health?.manualTakeoverSupported ? (
        <Card className="mb-4 border-primary/30 bg-primary/10">
          <CardContent className="p-4 flex items-start gap-3">
            <MonitorSmartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <div className="font-medium text-primary">最稳妥方案：本地人工接管，线上只做展示</div>
              <div className="text-muted-foreground">
                当前这个服务不支持人工过验证，所以不会弹出验证窗口，也不会出现继续按钮。要使用人工接管，请在你自己的电脑本地启动带界面采集器。
              </div>
              <div className="font-mono text-xs text-foreground/80">
                1. npm install
                <br />
                2. npm run playwright:install
                <br />
                3. npm run crawler:headed
                <br />
                4. 另开一个终端执行 npm run dev
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="例如：sofa cover"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {DEFAULT_KEYWORDS.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setKeyword(item)}
                >
                  {item}
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">本地人工接管验证</div>
                <div className="text-xs text-muted-foreground">
                  {health?.manualTakeoverHint ||
                    "开启后，遇到 Temu 验证时会等待你在本地浏览器手动处理，再继续采集。"}
                </div>
              </div>
              <Switch
                checked={manualMode}
                onCheckedChange={setManualMode}
                disabled={!health?.manualTakeoverSupported}
              />
            </div>

            <div className="rounded-lg border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">
              采集器会慢速打开 Temu 搜索结果页，自动滚动一次页面，并提取标题、价格、评分、评论数、销量文本、链接、主图等字段。若开启本地人工接管，遇到验证时会暂停任务，等待你在本地浏览器完成验证后继续。
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
              <Badge
                className={
                  error
                    ? "bg-destructive/15 text-destructive"
                    : "bg-success/15 text-success"
                }
              >
                {error ? "未连接" : "已连接"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">支持平台</span>
              <span>{health?.supportedPlatforms.join(", ") || "Temu"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">人工接管</span>
              <span>{health?.manualTakeoverSupported ? "已启用" : "未启用"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">数据文件</span>
              <span className="text-xs font-mono">
                {health?.resultsFile || "等待采集器启动"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">截图目录</span>
              <span className="text-xs font-mono">
                {health?.screenshotDir || "等待采集器启动"}
              </span>
            </div>
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}。请先启动 Temu 采集服务，再返回刷新本页。
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
                  <TableHead>任务 ID</TableHead>
                  <TableHead>平台</TableHead>
                  <TableHead>关键词</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>结果数</TableHead>
                  <TableHead>失败原因 / 截图</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                        <Badge className={STATUS_STYLES[task.status]}>
                          {STATUS_LABELS[task.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.resultCount}</TableCell>
                      <TableCell className="text-xs max-w-[320px]">
                        {formatTaskError(task)}
                      </TableCell>
                      <TableCell className="space-x-2">
                        {task.status === "manual_required" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void openManualDialog(task.id)}
                              disabled={loadingManualLink}
                            >
                              查看验证
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => void continueTask(task.id)}
                              disabled={continuingTaskId === task.id}
                            >
                              {continuingTaskId === task.id ? "继续中..." : "继续采集"}
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
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
              <div className="text-sm text-muted-foreground">
                正在读取真实 Temu 采集结果...
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                暂无真实 Temu 采集数据
              </div>
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
                          <img
                            src={item.imageUrl}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-muted/40" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <a
                          href={item.productUrl}
                          className="line-clamp-2 text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.title || "未识别标题"}
                        </a>
                      </TableCell>
                      <TableCell>{item.price || "—"}</TableCell>
                      <TableCell className="text-xs">
                        <div>{item.discountPrice || "—"}</div>
                        <div className="text-muted-foreground">
                          {item.originalPrice || "—"}
                        </div>
                      </TableCell>
                      <TableCell>{item.rating || "—"}</TableCell>
                      <TableCell>{item.reviewCount || "—"}</TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {item.sales || "—"}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">
                        {item.shopName || "—"}
                      </TableCell>
                      <TableCell>{item.rank}</TableCell>
                      <TableCell>{item.keyword}</TableCell>
                      <TableCell className="text-xs">
                        {formatTime(item.crawlTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>等待人工验证</DialogTitle>
            <DialogDescription>
              当前任务已暂停在 Temu 验证页。请优先在本地已弹出的 Playwright 浏览器窗口完成拼图或验证，再点击“继续采集”。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100">
              新打开的链接主要用于辅助跳转和确认页面；真正能续跑当前任务的，是本地已经打开的那个浏览器窗口。
            </div>
            <div>
              <div className="text-xs text-muted-foreground">当前任务</div>
              <div className="font-mono text-sm">{manualDialogTaskId || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">验证链接</div>
              {manualDialogUrl ? (
                <a
                  href={manualDialogUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline break-all inline-flex items-center gap-1"
                >
                  打开 Temu 验证页
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <div className="text-muted-foreground">
                  当前未读取到可跳转链接，请直接查看本地弹出的浏览器窗口。
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">截图路径</div>
              <div className="font-mono text-xs break-all">
                {manualDialogScreenshot || "—"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
              稍后处理
            </Button>
            <Button
              onClick={() => void continueTask(manualDialogTaskId)}
              disabled={!manualDialogTaskId || continuingTaskId === manualDialogTaskId}
            >
              {continuingTaskId === manualDialogTaskId ? "继续中..." : "继续采集"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
