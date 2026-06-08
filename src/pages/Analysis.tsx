import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchMarketAnalysis, fetchMarketHealth, MarketAnalysis } from "@/lib/market-api";

function FrequencySection({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  return (
    <Card className="bg-card/60 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline" className="text-[10px]">
            Top {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无真实 Temu 采集数据</div>
        ) : (
          items.map((item, index) => (
            <div key={`${title}-${item.label}`} className="flex items-center gap-3">
              <span className="text-xs w-5 text-muted-foreground">#{index + 1}</span>
              <span className="text-sm w-28 truncate">{item.label}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${Math.min(item.count * 12, 100)}%` }}
                />
              </div>
              <span className="text-xs w-8 text-right">{item.count}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ProductList({
  title,
  items,
  metric,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    imageUrl: string;
    productUrl: string;
    [key: string]: unknown;
  }>;
  metric: { key: string; label: string };
}) {
  return (
    <Card className="bg-card/60 border-border/60">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无真实 Temu 采集数据</div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs w-5 text-primary font-bold">#{index + 1}</span>
                {item.imageUrl ? (
                  <img src={item.imageUrl} className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted/40" />
                )}
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm hover:underline"
                >
                  {item.title}
                </a>
              </div>
              <div className="text-xs text-muted-foreground">
                {metric.label} {String(item[metric.key] ?? "—")}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function Analysis() {
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof fetchMarketHealth>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [analysisValue, healthValue] = await Promise.all([
          fetchMarketAnalysis({ platform: "temu" }),
          fetchMarketHealth(),
        ]);
        if (!active) return;
        setAnalysis(analysisValue);
        setHealth(healthValue);
        setError("");
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "无法读取 Temu 分析数据",
        );
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

  const hasRealData = (analysis?.totalProducts || 0) > 0;

  return (
    <div>
      <PageHeader
        title="爆款元素分析"
        description="保留原有深色图表布局，但分析结果已切换为基于真实 Temu 采集数据的关键词统计，不再显示假数据。"
      />

      <Card className="mb-4 border-destructive/40 bg-destructive/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <div className="font-medium text-destructive">演示模式提示仍保留</div>
            <div className="text-muted-foreground">
              页面视觉仍为演示版，但 Temu 分析区已优先读取真实采集结果；若采集器未启动或暂无结果，就明确显示“暂无真实 Temu 采集数据”。
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">真实 Temu 商品数</div>
            <div className="text-2xl font-bold mt-1">{analysis?.totalProducts ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">最近采集时间</div>
            <div className="text-sm font-medium mt-1">
              {analysis?.latestCrawlTime
                ? new Date(analysis.latestCrawlTime).toLocaleString("zh-CN")
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">平台</div>
            <div className="text-2xl font-bold mt-1">Temu</div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">采集器状态</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>{error ? "未连接" : health?.platform ? "已连接" : loading ? "读取中" : "未连接"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {!loading && !hasRealData ? (
        <Card className="mb-4 bg-card/60 border-border/60">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {error
              ? `${error}。请先启动 Temu 采集器并完成一次采集。`
              : "暂无真实 Temu 采集数据"}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FrequencySection title="材质词频率" items={analysis?.materialFrequency || []} />
        <FrequencySection title="颜色词频率" items={analysis?.colorFrequency || []} />
        <FrequencySection title="风格词频率" items={analysis?.styleFrequency || []} />
        <FrequencySection title="场景词频率" items={analysis?.sceneFrequency || []} />
        <FrequencySection title="促销词频率" items={analysis?.promotionFrequency || []} />
        <FrequencySection title="高频标题词" items={analysis?.titleWordFrequency || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="bg-card/60 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">价格带分布</CardTitle>
          </CardHeader>
          <CardContent>
            {hasRealData ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analysis?.priceBandDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(199 92% 56%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground">暂无真实 Temu 采集数据</div>
            )}
          </CardContent>
        </Card>

        <ProductList
          title="高评论商品"
          items={analysis?.topReviewedProducts || []}
          metric={{ key: "reviewCount", label: "评论" }}
        />
        <ProductList
          title="高评分商品"
          items={analysis?.topRatedProducts || []}
          metric={{ key: "rating", label: "评分" }}
        />
        <ProductList
          title="高销量文本商品"
          items={analysis?.topSalesProducts || []}
          metric={{ key: "sales", label: "销量文本" }}
        />
      </div>
    </div>
  );
}
