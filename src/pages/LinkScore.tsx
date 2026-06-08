import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkScores, suggestions } from "@/lib/mockData";
import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, ResponsiveContainer,
} from "recharts";
import { Search } from "lucide-react";

const gradeColor: Record<string, string> = {
  S: "bg-gradient-to-br from-primary to-accent text-primary-foreground",
  A: "bg-success/20 text-success border-success/40",
  B: "bg-primary/15 text-primary border-primary/40",
  C: "bg-warning/15 text-warning border-warning/40",
  D: "bg-destructive/15 text-destructive border-destructive/40",
};

export default function LinkScore() {
  const [active, setActive] = useState(linkScores[0].id);
  const [q, setQ] = useState("");
  const filtered = linkScores.filter((s) => s.title.includes(q) || s.linkId.includes(q));
  const current = linkScores.find((s) => s.id === active)!;
  const radarData = Object.entries(current.dims).map(([k, v]) => ({ dim: k, value: v }));
  const linked = suggestions.filter((s) => s.linkId === current.linkId);

  return (
    <div>
      <PageHeader title="链接评分系统" description="10 维度综合评分 · 自动输出问题标签与下一步动作" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-card/60 border-border/60 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">链接评分榜</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索" className="pl-8 h-8 text-sm" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[640px] overflow-y-auto">
            {filtered
              .sort((a, b) => b.total - a.total)
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition ${
                    active === s.id ? "bg-primary/10 border border-primary/40" : "hover:bg-secondary/60"
                  }`}
                >
                  <img src={s.image} className="h-10 w-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{s.title}</div>
                    <div className="text-[10px] text-muted-foreground">{s.platform} · {s.store}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded border ${gradeColor[s.grade]}`}>{s.grade}</span>
                    <span className="text-xs font-bold text-primary">{s.total}</span>
                  </div>
                </button>
              ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <img src={current.image} className="h-14 w-14 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{current.title}</div>
                  <div className="text-xs text-muted-foreground">{current.linkId} · {current.platform} · {current.store}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gradient">{current.total}</div>
                  <div className={`text-xs px-2 py-0.5 rounded border inline-block mt-1 ${gradeColor[current.grade]}`}>
                    等级 {current.grade}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="dim" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} stroke="hsl(var(--border))" />
                    <Radar dataKey="value" stroke="hsl(199 92% 56%)" fill="hsl(199 92% 56%)" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {radarData.map((d) => (
                    <div key={d.dim} className="flex items-center gap-3">
                      <span className="text-xs w-20 text-muted-foreground">{d.dim}</span>
                      <div className="flex-1 h-1.5 bg-secondary rounded overflow-hidden">
                        <div
                          className={`h-full ${d.value >= 70 ? "bg-success" : d.value >= 50 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${d.value}%` }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground mr-1">问题标签：</span>
                {current.tags.map((t) => (
                  <Badge key={t} className="bg-destructive/15 text-destructive">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/60">
            <CardHeader><CardTitle className="text-base">下一步操作建议</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {linked.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                  <Badge className={
                    s.priority === "立即处理" ? "bg-destructive/15 text-destructive" :
                    s.priority === "本周优化" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                  }>{s.priority}</Badge>
                  <Badge variant="outline" className="border-primary/40 text-primary">{s.type}</Badge>
                  <div className="flex-1 text-sm">
                    <div>{s.reason}</div>
                    <div className="text-xs text-success mt-0.5">{s.expect}</div>
                  </div>
                  <Button size="sm" variant="ghost">执行</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}