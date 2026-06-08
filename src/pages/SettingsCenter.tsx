import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { executors, platforms, stores } from "@/lib/mockData";
import { toast } from "sonner";
import { QrCode, RefreshCw, Cookie } from "lucide-react";

export default function SettingsCenter() {
  return (
    <div>
      <PageHeader
        title="配置中心"
        description="纯网页自动化模式 · 不依赖任何官方 API，所有操作由本地浏览器执行器完成"
      />
      <Tabs defaultValue="executor">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="executor">浏览器自动化执行器</TabsTrigger>
          <TabsTrigger value="platform">平台网页入口</TabsTrigger>
          <TabsTrigger value="store">店铺登录状态</TabsTrigger>
          <TabsTrigger value="cookie">Cookie / 会话</TabsTrigger>
          <TabsTrigger value="rule">任务执行规则</TabsTrigger>
          <TabsTrigger value="collect">采集频率</TabsTrigger>
          <TabsTrigger value="alert">异常 & 截图规则</TabsTrigger>
        </TabsList>

        {/* —— 执行器 —— */}
        <TabsContent value="executor">
          <Card className="bg-card/60 border-border/60">
            <CardHeader><CardTitle className="text-base">已注册执行器</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>名称</TableHead><TableHead>主机</TableHead><TableHead>浏览器</TableHead>
                  <TableHead>状态</TableHead><TableHead>心跳</TableHead><TableHead className="text-right">操作</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {executors.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.name}</TableCell>
                      <TableCell className="text-xs">{e.host} · {e.os}</TableCell>
                      <TableCell className="text-xs">{e.browser}</TableCell>
                      <TableCell>
                        <Badge className={e.status === "在线" ? "bg-success/15 text-success"
                          : e.status === "忙碌" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{e.heartbeat}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => toast.success("已重置 Token")}>重置密钥</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">
                执行器在你的本地运行 Playwright，通过 <b>本地执行器回传接口</b> 与后台通信。需要查看启动命令请到「执行器控制台 → 启动说明」。
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* —— 平台网页入口（不是 API） —— */}
        <TabsContent value="platform">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((p) => (
              <Card key={p} className="bg-card/60 border-border/60">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{p}</CardTitle>
                  <Badge className="bg-success/15 text-success">已启用</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-xs">商家后台登录页 URL</Label><Input defaultValue={`https://login.${p}.com`} /></div>
                  <div><Label className="text-xs">商品发布页 URL</Label><Input defaultValue={`https://seller.${p}.com/publish`} /></div>
                  <div><Label className="text-xs">搜索结果页 URL 模板</Label><Input defaultValue={`https://s.${p}.com?q={keyword}&page={page}`} /></div>
                  <div className="flex items-center justify-between text-xs">
                    <span>启用此平台的自动化</span><Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* —— 店铺登录状态 —— */}
        <TabsContent value="store">
          <Card className="p-4 bg-card/60 border-border/60">
            <Table>
              <TableHeader><TableRow>
                <TableHead>店铺</TableHead><TableHead>平台</TableHead>
                <TableHead>登录状态</TableHead><TableHead>会话有效期</TableHead>
                <TableHead>所属执行器</TableHead><TableHead className="text-right">操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {stores.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.platform}</TableCell>
                    <TableCell>
                      <Badge className={s.loggedIn ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
                        {s.loggedIn ? "已登录" : "需手动登录"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{s.loggedIn ? "剩余 6 天" : "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{s.agent}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => toast.success("已在本地执行器打开浏览器，请扫码登录")}>
                        <QrCode className="h-3.5 w-3.5 mr-1" />本地扫码登录
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toast.success("已刷新会话")}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3">
              登录方式：点击"本地扫码登录"会通知对应执行器打开真实浏览器进入店铺登录页，你手动扫码后会话会被加密保存在<b>你本机</b>，后台只保存"是否登录"与有效期。
            </p>
          </Card>
        </TabsContent>

        {/* —— Cookie / 会话 —— */}
        <TabsContent value="cookie">
          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Cookie className="h-4 w-4" /> Cookie / 登录会话</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">会话存储位置</Label>
                  <Input defaultValue="~/.your-agent/sessions/" />
                </div>
                <div>
                  <Label className="text-xs">会话过期前自动续期（小时）</Label>
                  <Input type="number" defaultValue={24} />
                </div>
                <div className="md:col-span-2 flex items-center justify-between border border-border/50 rounded p-3">
                  <span className="text-sm">使用浏览器持久化用户目录（UserDataDir）</span>
                  <Switch defaultChecked />
                </div>
                <div className="md:col-span-2 flex items-center justify-between border border-border/50 rounded p-3">
                  <span className="text-sm">会话失效时自动通知运营人员重新扫码</span>
                  <Switch defaultChecked />
                </div>
              </div>
              <div>
                <Label className="text-xs">手动粘贴 Cookie（可选，仅本机保存）</Label>
                <Textarea placeholder="格式：name=value; name2=value2 ..." className="font-mono text-xs h-24" />
              </div>
              <div className="flex justify-end"><Button onClick={() => toast.success("已保存")}>保存</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* —— 任务执行规则 —— */}
        <TabsContent value="rule">
          <Card className="bg-card/60 border-border/60">
            <CardHeader><CardTitle className="text-base">任务执行规则（模拟真人行为）</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>两次操作最小间隔（秒）</Label><Input type="number" defaultValue={3} /></div>
              <div><Label>两次操作最大间隔（秒）</Label><Input type="number" defaultValue={9} /></div>
              <div><Label>每店铺每小时最大任务数</Label><Input type="number" defaultValue={40} /></div>
              <div><Label>失败自动重试次数</Label><Input type="number" defaultValue={3} /></div>
              <div className="flex items-center justify-between border border-border/50 rounded p-3"><span>启用随机鼠标轨迹</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between border border-border/50 rounded p-3"><span>启用随机滚动</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between border border-border/50 rounded p-3"><span>夜间暂停（00:00–07:00）</span><Switch /></div>
              <div className="flex items-center justify-between border border-border/50 rounded p-3"><span>失败后转人工接管</span><Switch defaultChecked /></div>
              <div className="md:col-span-2 flex justify-end"><Button onClick={() => toast.success("已保存")}>保存</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* —— 采集频率 —— */}
        <TabsContent value="collect">
          <Card className="bg-card/60 border-border/60">
            <CardHeader><CardTitle className="text-base">市场采集频率</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>关键词采集频率</Label><Input defaultValue="每 30 分钟" /></div>
              <div><Label>竞品链接采集频率</Label><Input defaultValue="每 2 小时" /></div>
              <div><Label>店铺监控采集频率</Label><Input defaultValue="每 15 分钟" /></div>
              <div><Label>单任务采集页数</Label><Input type="number" defaultValue={5} /></div>
              <div className="flex items-center justify-between border border-border/50 rounded p-3"><span>命中验证码时自动暂停 30 分钟</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between border border-border/50 rounded p-3"><span>同 IP 采集超过阈值切换执行器</span><Switch defaultChecked /></div>
              <div className="md:col-span-2 flex justify-end"><Button onClick={() => toast.success("已保存")}>保存</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* —— 异常 & 截图 —— */}
        <TabsContent value="alert">
          <Card className="bg-card/60 border-border/60">
            <CardHeader><CardTitle className="text-base">异常处理 & 截图保存</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border border-border/50 rounded p-3"><span>失败时自动截图</span><Switch defaultChecked /></div>
              <div className="flex items-center justify-between border border-border/50 rounded p-3"><span>每一步成功也保留截图（调试模式）</span><Switch /></div>
              <div><Label>截图保留天数</Label><Input type="number" defaultValue={30} /></div>
              <div><Label>预警通知方式</Label><Input defaultValue="网页 + 飞书 Webhook" /></div>
              <div><Label>连续失败次数后告警</Label><Input type="number" defaultValue={3} /></div>
              <div><Label>Locator 失效后自动尝试备用次数</Label><Input type="number" defaultValue={2} /></div>
              <div className="md:col-span-2 flex justify-end"><Button onClick={() => toast.success("已保存")}>保存</Button></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground mt-6">
        说明：本系统不调用任何平台的官方接口，所有动作通过你本机的 Playwright 执行器模拟真人在网页上完成。请遵守对应平台规则与法律法规，控制频率与并发，避免对平台造成压力。
      </p>
    </div>
  );
}