import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { suggestions } from "@/lib/mockData";
import { toast } from "sonner";
import { CheckCircle2, AlertOctagon, Clock } from "lucide-react";

const groups = [
  { key: "立即处理", icon: AlertOctagon, color: "text-destructive", chip: "bg-destructive/15 text-destructive" },
  { key: "本周优化", icon: Clock, color: "text-warning", chip: "bg-warning/15 text-warning" },
  { key: "继续观察", icon: CheckCircle2, color: "text-muted-foreground", chip: "bg-muted text-muted-foreground" },
] as const;

const typeChip: Record<string, string> = {
  优化主图: "bg-primary/15 text-primary",
  优化标题: "bg-primary/15 text-primary",
  调整价格: "bg-accent/15 text-accent",
  补库存: "bg-success/15 text-success",
  降低推广: "bg-warning/15 text-warning",
  增加场景图: "bg-primary/15 text-primary",
  测试新颜色: "bg-accent/15 text-accent",
  清理滞销SKU: "bg-destructive/15 text-destructive",
  对标竞品: "bg-warning/15 text-warning",
};

export default function Suggestions() {
  const [done, setDone] = useState<Set<string>>(new Set());

  return (
    <div>
      <PageHeader title="操作建议" description="按优先级分组的可执行运营动作清单" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {groups.map((g) => {
          const list = suggestions.filter((s) => s.priority === g.key && !done.has(s.id));
          return (
            <Card key={g.key} className="bg-card/60 border-border/60">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <g.icon className={`h-4 w-4 ${g.color}`} />
                    {g.key}
                  </span>
                  <Badge className={g.chip}>{list.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[640px] overflow-y-auto">
                {list.map((s) => (
                  <div key={s.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={s.image} className="h-9 w-9 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-mono text-muted-foreground">{s.linkId}</div>
                        <div className="text-sm truncate">{s.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={typeChip[s.type] || "bg-secondary"}>{s.type}</Badge>
                      <span className="text-xs text-muted-foreground">{s.reason}</span>
                    </div>
                    <div className="text-xs text-success">{s.expect}</div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost"
                        onClick={() => { setDone(new Set([...done, s.id])); toast.success("已忽略"); }}>
                        忽略
                      </Button>
                      <Button size="sm"
                        onClick={() => { setDone(new Set([...done, s.id])); toast.success("已派发到执行队列"); }}>
                        执行
                      </Button>
                    </div>
                  </div>
                ))}
                {list.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">暂无待处理</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}