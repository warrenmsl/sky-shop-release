import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download } from "lucide-react";
import { marketProducts, marketTasks } from "@/lib/mockData";
import { toast } from "sonner";

function exportCSV() {
  const headers = ["标题", "价格", "销量", "评价", "店铺", "平台", "链接", "采集时间"];
  const rows = marketProducts.map(p => [p.title, p.price, p.sales, p.reviews, p.store, p.platform, p.link, p.collectedAt]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "market.csv"; a.click();
  toast.success("已导出 CSV");
}

export default function MarketCollect() {
  return (
    <div>
      <PageHeader title="市场数据采集"
        description="通过执行器在前端搜索/类目/竞品链接页采集 · 支持任务排队、限速、随机等待、失败重试与反爬风险提示"
        actions={<>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />导出 CSV</Button>
          <Button onClick={() => toast.success("新建采集任务（示例）")}><Plus className="h-4 w-4 mr-1" />新建任务</Button>
        </>}
      />
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">采集任务</TabsTrigger>
          <TabsTrigger value="results">采集结果</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <Card className="p-4 bg-card/60 border-border/60">
            <Table>
              <TableHeader><TableRow>
                <TableHead>任务ID</TableHead><TableHead>平台</TableHead><TableHead>关键词</TableHead>
                <TableHead>类目</TableHead><TableHead>价格区间</TableHead><TableHead>销量区间</TableHead>
                <TableHead>页数</TableHead><TableHead>频率</TableHead><TableHead>最近执行</TableHead><TableHead>状态</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {marketTasks.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell>{t.platform}</TableCell>
                    <TableCell>{t.keyword}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>¥{t.priceRange}</TableCell>
                    <TableCell>{t.saleRange}</TableCell>
                    <TableCell>{t.pages}</TableCell>
                    <TableCell>{t.freq}</TableCell>
                    <TableCell className="text-xs">{t.lastRun}</TableCell>
                    <TableCell>
                      <Badge className={t.status === "运行中" ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}>{t.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="results">
          <Card className="p-4 bg-card/60 border-border/60">
            <Table>
              <TableHeader><TableRow>
                <TableHead>主图</TableHead><TableHead>标题</TableHead><TableHead>价格</TableHead>
                <TableHead>销量</TableHead><TableHead>评价</TableHead><TableHead>店铺</TableHead>
                <TableHead>平台</TableHead><TableHead>采集时间</TableHead><TableHead>链接</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {marketProducts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell><img src={p.image} className="h-12 w-12 rounded object-cover" /></TableCell>
                    <TableCell className="max-w-[220px] truncate">{p.title}</TableCell>
                    <TableCell className="text-primary font-medium">¥{p.price}</TableCell>
                    <TableCell>{p.sales}</TableCell>
                    <TableCell>{p.reviews}</TableCell>
                    <TableCell>{p.store}</TableCell>
                    <TableCell>{p.platform}</TableCell>
                    <TableCell className="text-xs">{p.collectedAt}</TableCell>
                    <TableCell><a href={p.link} className="text-primary text-xs" target="_blank">查看</a></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}