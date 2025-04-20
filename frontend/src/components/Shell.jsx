import React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "../ui/Sidebar";
import { ModeToggle } from "../ui/ModeToggle";
import { UserNav } from "../ui/UserNav";
import { Database, Factory, FileBarChart, Home, Settings, Users } from "lucide-react";
import Link from "next/link";

export function DashboardShell({ children }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2 md:hidden">
              <SidebarTrigger />
              <Link href="/" className="flex items-center space-x-2">
                <Factory className="h-6 w-6" />
                <span className="font-bold">Production Admin</span>
              </Link>
            </div>
            <div className="hidden md:flex md:grow">
              <Link href="/" className="flex items-center space-x-2">
                <Factory className="h-6 w-6" />
                <span className="hidden font-bold sm:inline-block">Production Admin</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <UserNav />
            </div>
          </div>
        </header>
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <Sidebar>
            <SidebarHeader className="flex h-14 items-center border-b px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
                <Factory className="h-6 w-6" />
                <span>Production Admin</span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive>
                      <Link href="/dashboard">
                        <Database className="mr-2 h-4 w-4" />
                        <span>Production Records</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard/reports">
                        <FileBarChart className="mr-2 h-4 w-4" />
                        <span>Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard/users">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Users</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t p-4">
              <div className="text-xs text-muted-foreground">
                <p>© 2025 Production Admin</p>
                <p>Version 1.0.0</p>
              </div>
            </SidebarFooter>
          </Sidebar>
          <main className="flex w-full flex-col overflow-hidden p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
