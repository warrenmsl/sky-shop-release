import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Search,
  BarChart3,
  Images,
  Settings,
  ScrollText,
  Users,
  Rocket,
  Activity,
  Award,
  Lightbulb,
  MonitorCog,
  Crosshair,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "仪表盘", url: "/", icon: LayoutDashboard },
  { title: "上架任务", url: "/listing", icon: Upload },
  { title: "市场采集", url: "/market", icon: Search },
  { title: "爆款元素分析", url: "/analysis", icon: BarChart3 },
  { title: "店铺监控", url: "/monitor", icon: Activity },
  { title: "链接评分", url: "/score", icon: Award },
  { title: "操作建议", url: "/suggestions", icon: Lightbulb },
  { title: "素材库", url: "/assets", icon: Images },
  { title: "执行器控制台", url: "/executors", icon: MonitorCog },
  { title: "Locator 管理", url: "/locators", icon: Crosshair },
  { title: "真实性检测", url: "/verify", icon: ShieldCheck },
  { title: "配置中心", url: "/settings", icon: Settings },
  { title: "日志中心", url: "/logs", icon: ScrollText },
  { title: "账号权限", url: "/users", icon: Users },
  { title: "执行器回传接口", url: "/api-docs", icon: Rocket },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="font-bold text-sm text-gradient">电商运营自动化</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}