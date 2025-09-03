import { useState } from "react"
import { 
  Activity, 
  FileText, 
  Users, 
  Plus, 
  ShoppingCart, 
  ClipboardList, 
  BarChart3, 
  Settings,
  LogOut,
  Microscope
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"

const menuItems = [
  { title: "แดชบอร์ด", url: "/dashboard", icon: Activity },
  { title: "เวชระเบียน", url: "/medical-records", icon: FileText },
  { title: "ลงทะเบียนคนไข้", url: "/patient-registration", icon: Users },
  { title: "เปิด Visit", url: "/visit-management", icon: Plus },
  { title: "ซื้อรายการตรวจ", url: "/lab-orders", icon: ShoppingCart },
  { title: "ลงผลการตรวจ", url: "/lab-results", icon: ClipboardList },
  { title: "รายงาน", url: "/reports", icon: BarChart3 },
  { title: "ตั้งค่า", url: "/settings", icon: Settings },
]

export function MedicalSidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium hover:bg-primary/15" 
      : "hover:bg-muted/50"

  return (
    <Sidebar
      className="w-64"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-medical">
            <Microscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-semibold text-foreground">Lab System</h2>
            <p className="text-xs text-muted-foreground">ระบบห้องปฏิบัติการ</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนูหลัก</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass}>
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

      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="group-data-[collapsible=icon]:hidden flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}