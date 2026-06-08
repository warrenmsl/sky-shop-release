import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  elementCategories, elementKeywords, elementTrend, marketProducts, priceBandData,
} from "@/lib/mockData";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function Analysis() {
  const top = [...marketProducts].sort((a, b) => b.sales - a.sales).slice(0, 8);
  return (
    <div>
      <PageHeader
        title="爆款元素分析"
        description="家居布艺·沙发垫/沙发巾/飘窗垫/床品 — 多维度元素热度与趋势"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {elementCategories.map((cat) => (
          <Card key={cat.name} className="bg-card/60 border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{cat.name} · 热度榜</span>
                <Badge variant="outline" className="text-[10px]">Top {cat.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cat.items.map((it, i) => (
                <div key={it.label} className="flex items-center gap-3">
                  <span className="text-xs w-5 text-muted-foreground">#{i + 1}</span>
                  <span className="text-sm w-20 truncate">{it.label}</span>
                  <div className="flex-1 h-1.5 bg-secondary rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${it.heat}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{it.heat}</span>
                  <span
                    className={`text-xs flex items-center gap-0.5 w-12 justify-end ${
                      it.trend >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {it.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(it.trend)}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">价格带分布（成交件数 / GMV万）</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={priceBandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="count" name="成交件数" fill="hsl(199 92% 56%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gmv" name="GMV(万)" fill="hsl(265 85% 65%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">爆款元素趋势</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={elementTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="雪尼尔" stroke="hsl(199 92% 56%)" strokeWidth={2} />
                <Line type="monotone" dataKey="中古风" stroke="hsl(265 85% 65%)" strokeWidth={2} />
                <Line type="monotone" dataKey="摩卡棕" stroke="hsl(38 95% 58%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">关键词高频榜</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {elementKeywords.map(k => (
              <Badge key={k.word} variant="outline"
                style={{ fontSize: 12 + Math.min(k.freq / 40, 10) }}
                className="bg-primary/10 border-primary/30 text-primary">
                {k.word} · {k.freq}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">爆款商品 Top 8</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {top.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs w-5 text-primary font-bold">#{i + 1}</span>
                  <img src={p.image} className="h-8 w-8 rounded object-cover" />
                  <span className="truncate text-sm">{p.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-primary">¥{p.price}</span>
                  <span className="text-muted-foreground">销量 {p.sales}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}