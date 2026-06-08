import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { users } from "@/lib/mockData";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const roleColor: Record<string, string> = {
  管理员: "bg-primary/15 text-primary",
  运营人员: "bg-accent/15 text-accent",
  只读人员: "bg-muted text-muted-foreground",
};

export default function UsersPage() {
  return (
    <div>
      <PageHeader title="账号权限" description="管理员可配置执行器与删除数据"
        actions={<Button onClick={() => toast.success("新建账号（示例）")}><Plus className="h-4 w-4 mr-1" />新建账号</Button>} />
      <Card className="p-4 bg-card/60 border-border/60">
        <Table>
          <TableHeader><TableRow>
            <TableHead>账号</TableHead><TableHead>邮箱</TableHead><TableHead>角色</TableHead>
            <TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell className="text-xs">{u.email}</TableCell>
                <TableCell><Badge className={roleColor[u.role]}>{u.role}</Badge></TableCell>
                <TableCell>
                  <Badge className={u.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
                    {u.active ? "启用" : "禁用"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => toast.success("已重置密码")}>重置密码</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => toast.success("已禁用账号")}>禁用</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}