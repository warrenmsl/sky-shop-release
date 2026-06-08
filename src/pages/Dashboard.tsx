import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  XCircle,
  Clock,
} from "lucide-react";
import {
  dashboardStats,
  hotCategories,
  platformDistribution,
  trendData,
  monitorLinks,
  linkScores,
} from "@/lib/mockData";

const COLORS = ["hsl(199 92% 56%)", "hsl(265 85% 65%)", "hsl(152 70% 45%)", "hsl(38 95% 58%)", "hsl(330 80% 60%)"];

export default function Dashboard() {
  const alertCount = monitorLinks.reduce((s, l) => s + l.alerts.length, 0);
  const avgScore = Math.round(linkScores.reduce((s, l) => s + l.total, 0) / linkScores.length);

  const stats = [
    { label: "今日待上架", value: dashboardStats.todayPending, icon: Clock, color: "text-primary" },
    { label: "上架失败", value: dashboardStats.todayFailed, icon: XCircle, color: "text-destructive" },
    { label: "市场采集", value: dashboardStats.marketCollected, icon: Database, color: "text-accent" },
    { label: "店铺预警", value: alertCount, icon: AlertTriangle, color: "text-warning" },
    { label: "链接平均分", value: avgScore, icon: CheckCircle2, color: "text-success" },
    { label: "在线执行器", value: 3, icon: Activity, color: "text-primary" },
  ];

  const salesProfitTrend = trendData.map((d, i) => ({
    date: d.date,
    销售额: 12000 + i * 2400 + Math.round(Math.random() * 3000),
    利润: 3200 + i * 700 + Math.round(Math.random() * 1200),
  }));

  return (
    <div>
      <PageHeader title="仪表盘" description="今日运营全景数据" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card/60 backdrop-blur border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">销售 & 利润趋势</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={salesProfitTrend}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="销售额" stroke="hsl(199 92% 56%)" strokeWidth={2} />
                <Line type="monotone" dataKey="利润" stroke="hsl(152 70% 45%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">平台分布</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={platformDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {platformDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 bg-card/60 border-border/60">
          <CardHeader><CardTitle className="text-base">类目表现</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hotCategories}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="销量" fill="hsl(199 92% 56%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}