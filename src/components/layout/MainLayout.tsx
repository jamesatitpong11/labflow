import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { MedicalSidebar } from "./MedicalSidebar"
import { ThemeToggle } from "@/components/ThemeToggle"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <MedicalSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground">ระบบจัดการห้องปฏิบัติการ</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}