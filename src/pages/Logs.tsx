import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { automationLogs } from "@/lib/mockData";

export default function Logs() {
  return (
    <div>
      <PageHeader title="日志中心" description="自动上架、采集、回调统一日志" />
      <Card className="p-4 bg-card/60 border-border/60">
        <Table>
          <TableHeader><TableRow>
            <TableHead>时间</TableHead><TableHead>任务ID</TableHead><TableHead>平台</TableHead>
            <TableHead>商品编码</TableHead><TableHead>类型</TableHead><TableHead>状态</TableHead><TableHead>异常原因</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {automationLogs.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-mono">{l.time}</TableCell>
                <TableCell className="text-xs font-mono">{l.taskId}</TableCell>
                <TableCell>{l.platform}</TableCell>
                <TableCell className="text-xs font-mono">{l.code}</TableCell>
                <TableCell>{l.type}</TableCell>
                <TableCell>
                  <Badge className={l.status === "成功" ? "bg-success/15 text-success" : l.status === "失败" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}>
                    {l.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-destructive">{l.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}