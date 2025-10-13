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
  Microscope,
  Printer
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
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
  //{ title: "เปิด Visit", url: "/visit-management", icon: Plus },
  { title: "ซื้อรายการตรวจ", url: "/lab-orders", icon: ShoppingCart },
  { title: "ลงผลการตรวจ", url: "/lab-results", icon: ClipboardList },
  { title: "รายงาน", url: "/reports", icon: BarChart3 },
  { title: "ทดสอบเครื่องพิมพ์", url: "/printer-test", icon: Printer },
  { title: "ตั้งค่า", url: "/settings", icon: Settings },
]

export function MedicalSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const currentPath = location.pathname

  const handleLogout = () => {
    console.log('Sidebar logout button clicked');
    logout();
    console.log('Sidebar logout function called');
  };

  const isActive = (path: string) => currentPath === path
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-medical/20 text-primary font-semibold hover:bg-gradient-medical/30 shadow-sm" 
      : "hover:bg-muted/60 hover:text-foreground transition-all duration-200"

  return (
    <Sidebar
      className="w-64"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border/20 p-6 bg-gradient-card/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-medical">
          <img src="https://img2.pic.in.th/pic/logo9a23fce12053a876.png" alt="Microscope" className="h-10 w-10 text-primary" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold text-foreground">LabFlow</h2>
            <p className="text-xs text-muted-foreground font-medium">Clinic System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">เมนูหลัก</SidebarGroupLabel>
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

      <SidebarFooter className="border-t border-border/20 p-4 bg-gradient-card/20">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="group-data-[collapsible=icon]:hidden flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
          {/* Icon-only logout button for collapsed sidebar */}
          <div className="group-data-[collapsible=icon]:block hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              onClick={handleLogout}
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}