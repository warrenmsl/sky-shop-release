import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { locators } from "@/lib/mockData";
import { Plus, Play, Search } from "lucide-react";
import { toast } from "sonner";

const chip: Record<string, string> = {
  通过: "bg-success/15 text-success",
  失败: "bg-destructive/15 text-destructive",
  待测试: "bg-warning/15 text-warning",
};

export default function Locators() {
  const [q, setQ] = useState("");
  const filtered = locators.filter(
    (l) => l.platform.includes(q) || l.page.includes(q) || l.element.includes(q),
  );
  return (
    <div>
      <PageHeader
        title="Locator 管理"
        description="集中管理京东 / 淘宝 / 天猫 / 拼多多 / 抖音等网页按钮与输入框的定位规则"
        actions={
          <Button onClick={() => toast.success("新建 Locator")}>
            <Plus className="h-4 w-4 mr-1" />新建 Locator
          </Button>
        }
      />
      <Card className="p-4 bg-card/60 border-border/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="按平台 / 页面 / 元素搜索" className="pl-8" />
          </div>
          <div className="text-xs text-muted-foreground">共 {filtered.length} 条</div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>平台</TableHead>
              <TableHead>页面</TableHead>
              <TableHead>元素</TableHead>
              <TableHead>主 Locator</TableHead>
              <TableHead>备用 Locator</TableHead>
              <TableHead>测试状态</TableHead>
              <TableHead>最近成功</TableHead>
              <TableHead>备注</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.platform}</TableCell>
                  <TableCell>{l.page}</TableCell>
                  <TableCell>{l.element}</TableCell>
                  <TableCell><code className="text-xs font-mono">{l.locator}</code></TableCell>
                  <TableCell><code className="text-xs font-mono text-muted-foreground">{l.backup}</code></TableCell>
                  <TableCell><Badge className={chip[l.status]}>{l.status}</Badge></TableCell>
                  <TableCell className="text-xs">{l.lastOk}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.note}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => toast.success("已下发执行器进行真实点击测试")}>
                      <Play className="h-3.5 w-3.5 mr-1" />测试
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          说明：所有 Locator 会被执行器在真实浏览器中调用；当主 Locator 失效时自动回退到备用 Locator，并把失败 Locator 标记为"失败"状态，方便人工更新。
        </p>
      </Card>
    </div>
  );
}