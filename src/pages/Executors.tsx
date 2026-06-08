import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { executors, recentScreenshots, automationLogs } from "@/lib/mockData";
import { Copy, Cpu, MonitorPlay, Power, Wifi } from "lucide-react";
import { toast } from "sonner";

const statusChip: Record<string, string> = {
  在线: "bg-success/15 text-success",
  忙碌: "bg-primary/15 text-primary",
  离线: "bg-muted text-muted-foreground",
};

const startCmd = `# 在你的电脑/服务器运行（需要预先安装 Node 与 Playwright）
npx @your-org/agent start \\
  --server https://your-domain.com \\
  --token agt_3f9c****a21b \\
  --headed                 # 调试时显示真实浏览器
`;

export default function Executors() {
  return (
    <div>
      <PageHeader
        title="执行器控制台"
        description="本地浏览器自动化执行器 · 不依赖任何官方 API，完全通过真实浏览器操作"
      />

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">执行器列表</TabsTrigger>
          <TabsTrigger value="shots">最近截图</TabsTrigger>
          <TabsTrigger value="errors">错误日志</TabsTrigger>
          <TabsTrigger value="howto">启动说明</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {executors.map((e) => (
              <Card key={e.id} className="bg-card/60 border-border/60 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-primary" /> {e.name}
                    </span>
                    <Badge className={statusChip[e.status]}>
                      <Wifi className="h-3 w-3 mr-1" />{e.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="aspect-video rounded-lg overflow-hidden border border-border/40">
                    <img src={e.lastShot} className="w-full h-full object-cover" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Stat label="运行主机" value={e.host} />
                    <Stat label="系统" value={e.os} />
                    <Stat label="浏览器" value={e.browser} />
                    <Stat label="心跳时间" value={e.heartbeat} mono />
                    <Stat label="今日执行" value={String(e.todayDone)} />
                    <Stat label="成功率" value={e.successRate + "%"} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">当前任务</div>
                    <div className="text-xs font-mono px-2 py-1 rounded bg-secondary/60">{e.currentTask}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1">连接密钥</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono px-2 py-1 rounded bg-secondary/60 flex-1 truncate">{e.token}</code>
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => { navigator.clipboard.writeText(e.token); toast.success("已复制"); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={() => toast.success("已发送重启指令")}>
                      <Power className="h-3 w-3 mr-1" />重启
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toast.success("打开远程画面")}>
                      <MonitorPlay className="h-3 w-3 mr-1" />观看实时
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shots">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentScreenshots.map((s) => (
              <Card key={s.id} className="bg-card/60 border-border/60 overflow-hidden">
                <img src={s.url} className="w-full aspect-video object-cover" />
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono">{s.taskId}</span>
                    <Badge className={s.ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}>
                      {s.ok ? "成功" : "失败截图"}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{s.time}</div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <Card className="p-4 bg-card/60 border-border/60 space-y-2">
            {automationLogs.filter((l) => l.status === "失败").map((l, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded border border-destructive/20 bg-destructive/5">
                <div className="text-xs font-mono text-muted-foreground w-36">{l.time}</div>
                <div className="flex-1 text-sm">
                  <div className="flex gap-2 items-center mb-1">
                    <Badge className="bg-destructive/15 text-destructive">{l.type}</Badge>
                    <span className="font-mono text-xs">{l.taskId}</span>
                    <span className="text-xs text-muted-foreground">{l.platform}</span>
                  </div>
                  <div className="text-destructive">{l.reason || "页面元素未找到，已触发备用 Locator"}</div>
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="howto">
          <Card className="bg-card/60 border-border/60">
            <CardHeader><CardTitle className="text-base">本地执行器启动说明</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>在自己的电脑或服务器上安装 Node.js 18+ 与 Playwright（npx playwright install chromium）。</li>
                <li>在"执行器控制台"复制对应机器的 <b>连接密钥</b>。</li>
                <li>运行下面的命令启动 Agent；首次使用请加 <code>--headed</code> 手动扫码登录店铺，登录态会自动保存。</li>
                <li>Agent 与本网页通过 <b>本地执行器回传接口</b> 通信（HTTPS + Token），无需任何官方平台 API。</li>
              </ol>
              <pre className="bg-background/60 border border-border/50 rounded p-3 text-xs overflow-x-auto whitespace-pre">{startCmd}</pre>
              <p className="text-xs text-muted-foreground">
                所有上架、采集、监控动作都由 Playwright 在真实浏览器中模拟人工完成；任何敏感操作（登录/支付）只在你本机进行，网页后台不存储你的密码。
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value}</div>
    </div>
  );
}