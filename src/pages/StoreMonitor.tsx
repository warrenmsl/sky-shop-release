import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { monitorLinks } from "@/lib/mockData";
import {
  AlertTriangle, Eye, MousePointerClick, Search,
  ShoppingCart, TrendingUp, Wallet,
} from "lucide-react";

export default function StoreMonitor() {
  const [q, setQ] = useState("");
  const filtered = monitorLinks.filter(
    (l) => l.title.includes(q) || l.itemId.includes(q),
  );

  const totals = monitorLinks.reduce(
    (acc, l) => {
      acc.visitors += l.visitors;
      acc.sales += l.sales;
      acc.profit += l.profit;
      acc.adCost += l.adCost;
      acc.alerts += l.alerts.length;
      return acc;
    },
    { visitors: 0, sales: 0, profit: 0, adCost: 0, alerts: 0 },
  );
  const avgRoi = (
    monitorLinks.reduce((s, l) => s + l.roi, 0) / monitorLinks.length
  ).toFixed(2);

  const overviewCards = [
    { label: "今日访客", value: totals.visitors.toLocaleString(), icon: Eye },
    { label: "今日成交", value: totals.sales.toLocaleString(), icon: ShoppingCart },
    { label: "今日利润", value: "¥" + totals.profit.toLocaleString(), icon: Wallet },
    { label: "广告消耗", value: "¥" + totals.adCost.toLocaleString(), icon: MousePointerClick },
    { label: "平均 ROI", value: avgRoi, icon: TrendingUp },
    { label: "异常预警", value: totals.alerts, icon: AlertTriangle, warn: true },
  ];

  return (
    <div>
      <PageHeader
        title="我的店铺监控"
        description="通过登录后的店铺后台页面读取链接数据 · 不依赖官方接口 · 定时采集 + 异常预警"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {overviewCards.map((c) => (
          <Card key={c.label} className="bg-card/60 border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className={`h-4 w-4 ${c.warn ? "text-warning" : "text-primary"}`} />
              </div>
              <div className="text-xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-card/60 border-border/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="按编码 / 标题搜索" className="pl-8"
            />
          </div>
          <div className="ml-auto flex gap-2">
            <Badge className="bg-warning/15 text-warning">
              <AlertTriangle className="h-3 w-3 mr-1" /> {totals.alerts} 条预警
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品</TableHead>
                <TableHead>店铺/平台</TableHead>
                <TableHead className="text-right">访客</TableHead>
                <TableHead className="text-right">曝光</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CVR</TableHead>
                <TableHead className="text-right">收藏加购</TableHead>
                <TableHead className="text-right">销量</TableHead>
                <TableHead className="text-right">退款率</TableHead>
                <TableHead className="text-right">利润</TableHead>
                <TableHead className="text-right">库存</TableHead>
                <TableHead className="text-right">广告/ROI</TableHead>
                <TableHead>异常</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={l.image} className="h-10 w-10 rounded object-cover" />
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-muted-foreground">{l.itemId}</div>
                        <div className="text-sm truncate max-w-[180px]">{l.title}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{l.store}</div>
                    <div className="text-muted-foreground">{l.platform}</div>
                  </TableCell>
                  <TableCell className="text-right">{l.visitors}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{l.exposure.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{l.ctr}%</TableCell>
                  <TableCell className={`text-right ${l.cvr < 1.5 ? "text-warning" : ""}`}>{l.cvr}%</TableCell>
                  <TableCell className="text-right">{l.favAdd}</TableCell>
                  <TableCell className="text-right font-medium">{l.sales}</TableCell>
                  <TableCell className={`text-right ${l.refund > 4 ? "text-destructive" : ""}`}>{l.refund}%</TableCell>
                  <TableCell className={`text-right ${l.profit < 0 ? "text-destructive" : "text-success"}`}>
                    ¥{l.profit}
                  </TableCell>
                  <TableCell className={`text-right ${l.stock < 80 ? "text-warning" : ""}`}>{l.stock}</TableCell>
                  <TableCell className="text-right text-xs">
                    <div>¥{l.adCost}</div>
                    <div className={l.roi < 1.2 ? "text-destructive" : "text-success"}>ROI {l.roi}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {l.alerts.length === 0
                        ? <span className="text-xs text-success">正常</span>
                        : l.alerts.map((a) => (
                            <Badge key={a} className="bg-warning/15 text-warning text-[10px]">{a}</Badge>
                          ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}