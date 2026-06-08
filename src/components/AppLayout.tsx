import { Link, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AlertTriangle, Bell, UserCircle2 } from "lucide-react";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-1.5 flex items-center gap-2 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
            <span className="text-destructive font-medium">演示模式</span>
            <span className="text-muted-foreground">
              未连接真实执行器，页面数据均为模拟数据，不会真实操作任何电商平台。
            </span>
            <Link to="/verify" className="ml-auto text-primary hover:underline">前往真实性检测 →</Link>
          </div>
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/40 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="text-sm text-muted-foreground">控制台</div>
            </div>
            <div className="flex items-center gap-4">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 text-sm">
                <UserCircle2 className="h-5 w-5 text-primary" />
                <span>admin</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/15 text-primary">管理员</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}