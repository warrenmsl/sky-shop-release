import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, RefreshCw, Trash2, Search } from "lucide-react";
import { listingTasks, TaskStatus } from "@/lib/mockData";
import { toast } from "sonner";

const statusColor: Record<TaskStatus, string> = {
  待执行: "bg-muted text-muted-foreground",
  执行中: "bg-primary/15 text-primary",
  成功: "bg-success/15 text-success",
  失败: "bg-destructive/15 text-destructive",
  需人工处理: "bg-warning/15 text-warning",
};

export default function ListingTasks() {
  const [q, setQ] = useState("");
  const [data, setData] = useState(listingTasks);

  const filtered = data.filter((t) => t.code.includes(q) || t.title.includes(q));

  return (
    <div>
      <PageHeader
        title="商品上架任务"
        description="通过本地 Playwright 执行器在真实浏览器中模拟人工上架 · 支持手动登录、平台可配置、批量导入、失败截图、人工接管"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("已触发 Excel/CSV 导入流程（示例）")}>
              <Upload className="h-4 w-4 mr-1" /> 批量导入
            </Button>
            <Button onClick={() => toast.success("新建任务（示例）")}>
              <Plus className="h-4 w-4 mr-1" /> 新建任务
            </Button>
          </>
        }
      />
      <Card className="p-4 bg-card/60 border-border/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="按商品编码 / 标题模糊搜索" className="pl-8" />
          </div>
          <div className="text-xs text-muted-foreground">共 {filtered.length} 条</div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>任务ID</TableHead>
                <TableHead>商品编码</TableHead>
                <TableHead>平台</TableHead>
                <TableHead>店铺</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>类目</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>库存</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>失败原因</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="font-mono text-xs">{t.code}</TableCell>
                  <TableCell>{t.platform}</TableCell>
                  <TableCell>{t.store}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{t.title}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>¥{t.price}</TableCell>
                  <TableCell>{t.stock}</TableCell>
                  <TableCell><Badge className={statusColor[t.status]}>{t.status}</Badge></TableCell>
                  <TableCell className="text-xs text-destructive max-w-[180px] truncate">{t.failReason}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => toast.success(`已重试 ${t.id}`)}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => { setData(data.filter(x => x.id !== t.id)); toast.success(`已删除编码 ${t.code}`); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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