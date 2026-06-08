import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

const endpoints = [
  {
    method: "GET", path: "/api/agent/tasks/next",
    desc: "本地执行器拉取下一个待执行任务（上架 / 采集 / 监控）",
    res: `{
  "id": "TASK-10240",
  "type": "listing" | "collect" | "monitor",
  "platform": "天猫",
  "store": "庄园家居旗舰店",
  "payload": { /* 任务参数：商品数据 / 关键词 / 链接 */ }
}`,
  },
  {
    method: "POST", path: "/api/agent/tasks/:id/status",
    desc: "执行器回传任务执行结果与截图（成功/失败/需人工）",
    req: `{
  "status": "success" | "failed" | "manual",
  "reason": "可选错误原因，如 Locator 未命中",
  "screenshot_url": "https://...",
  "duration_ms": 8421
}`,
  },
  {
    method: "POST", path: "/api/agent/market/products",
    desc: "执行器批量回传从网页解析到的市场商品数据",
  },
  {
    method: "POST", path: "/api/agent/monitor/metrics",
    desc: "执行器回传从店铺后台页面读取的链接监控数据（访客/转化/退款/库存等）",
  },
  {
    method: "POST", path: "/api/agent/heartbeat",
    desc: "执行器心跳：上报在线状态、当前任务、浏览器状态、登录态有效性",
  },
  {
    method: "POST", path: "/api/agent/login-status",
    desc: "执行器上报店铺登录态变化（已登录 / 失效，需要重新扫码）",
  },
  {
    method: "POST", path: "/api/agent/captcha",
    desc: "执行器遇到验证码时上报，前台通知运营人员介入",
  },
];

const tables = [
  "users", "platforms", "stores", "store_sessions",
  "executors", "executor_heartbeats", "locators",
  "listing_tasks", "listing_items", "task_screenshots",
  "market_collect_tasks", "market_products",
  "monitor_metrics", "alerts",
  "link_scores", "operation_suggestions",
  "assets", "automation_logs",
];

const methodColor: Record<string, string> = {
  GET: "bg-success/15 text-success",
  POST: "bg-primary/15 text-primary",
};

export default function ApiDocs() {
  return (
    <div>
      <PageHeader
        title="本地执行器回传接口"
        description="供你本机的 Playwright 自动化执行器与后台通信 · 非任何平台官方 API"
      />
      <Card className="bg-warning/5 border-warning/40 mb-4">
        <CardContent className="p-3 flex items-start gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            本系统<b>不调用</b>淘宝/天猫/京东/拼多多/抖音等任何官方 API。
            下面列出的接口只在<b>你的本地执行器 ↔ 本网页后台</b>之间使用，认证方式为 <code>Bearer &lt;Agent Token&gt;</code>。
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {endpoints.map((e) => (
            <Card key={e.path} className="bg-card/60 border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Badge className={methodColor[e.method]}>{e.method}</Badge>
                  <code className="font-mono text-sm">{e.path}</code>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
              </CardHeader>
              {(e.req || e.res) && (
                <CardContent className="space-y-2">
                  {e.req && (<>
                    <div className="text-xs text-muted-foreground">请求体示例</div>
                    <pre className="bg-background/60 border border-border/50 rounded p-3 text-xs overflow-x-auto">{e.req}</pre>
                  </>)}
                  {e.res && (<>
                    <div className="text-xs text-muted-foreground">响应示例</div>
                    <pre className="bg-background/60 border border-border/50 rounded p-3 text-xs overflow-x-auto">{e.res}</pre>
                  </>)}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        <Card className="bg-card/60 border-border/60 h-fit">
          <CardHeader><CardTitle className="text-base">数据表设计</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {tables.map((t) => (
              <div key={t} className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0">
                <code className="text-xs font-mono">{t}</code>
                <span className="text-[10px] text-muted-foreground">待接入 Cloud</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-3">
              说明：当前为原型，数据表结构已设计好，启用 Lovable Cloud 后可一键创建并加 RLS。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}