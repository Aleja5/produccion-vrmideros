import React from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart3,
  Factory,
  Home,
  LayoutDashboard,
  Server,
  Package,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "../components/SidebarAdmin";

export function AppLayout({ children }) {
  const location = useLocation();

  const menuItems = [
    {
      title: "Inicio",
      icon: Home,
      href: "/",
    },
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin-dashboard",
    },
    {
      title: "Áreas de Producción",
      icon: Factory,
      href: "/admin/areas",
    },
    {
      title: "Maquinas",
      icon: Server,
      href: "/admin/maquinas",
    },
    {
      title: "Proceso",
      icon: Package,
      href: "/admin/proceso",
    },
    {
      title: "Operarios",
      icon: Users,
      href: "/admin/operarios",
    },
    {
      title: "Reportes",
      icon: BarChart3,
      href: "/admin/reportes",
    },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-gray-900 p-1">
                <Factory className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Sistema de Producción
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navegación</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.href}
                        tooltip={item.title}
                      >
                        <a href={item.href} className="flex items-center">
                          <item.icon className="mr-2 h-5 w-5" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Configuración</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Configuración">
                      <a href="/configuracion" className="flex items-center">
                        <Settings className="mr-2 h-5 w-5" />
                        <span>Configuración</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Usuario Admin</p>
                <p className="text-xs text-gray-500">admin@empresa.com</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1">
          <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-gray-500 hover:text-gray-900" />
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Gestión de Producción
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
