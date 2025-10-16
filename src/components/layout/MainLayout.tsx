import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { MedicalSidebar } from "./MedicalSidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Monitor authentication state and redirect if logged out
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    console.log('Logout button clicked');
    logout();
    console.log('Logout function called');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <MedicalSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border/20 bg-gradient-card/30 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-primary/10 transition-colors duration-200" />
              <h1 className="text-xl font-bold text-foreground">คลินิกเทคนิคการแพทย์ โปร อินเตอร์ แลบ ไชยา</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-primary/10 transition-all duration-200 px-3 py-2 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-gradient-medical flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="hidden sm:inline font-medium">{user?.firstName} {user?.lastName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-200">
                    <LogOut className="h-4 w-4 mr-2" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="flex-1 p-8 bg-gray-50/30 dark:bg-background">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}