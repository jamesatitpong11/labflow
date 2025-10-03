import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { showSuccessToast, showErrorToast, showWarningToast } from "@/lib/toast-helpers";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    firstName: '', 
    lastName: '',
    phone: '',
    username: '', 
    password: '', 
    confirmPassword: '' 
  });

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(loginForm.username, loginForm.password);
      if (success) {
        showSuccessToast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: "ยินดีต้อนรับเข้าสู่ระบบ LabFlow Clinic",
        });
        navigate('/dashboard');
      } else {
        showErrorToast({
          title: "เข้าสู่ระบบไม่สำเร็จ",
          description: "กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน",
        });
      }
    } catch (error) {
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 REGISTER BUTTON CLICKED!');
    setIsLoading(true);
    
    if (registerForm.password !== registerForm.confirmPassword) {
      showWarningToast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่าน",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Debug environment detection
      console.log('=== REGISTER ENVIRONMENT DEBUG ===');
      console.log('window.electronAPI:', window.electronAPI);
      console.log('window.ELECTRON_API_BASE_URL:', (window as any).ELECTRON_API_BASE_URL);
      console.log('navigator.userAgent:', navigator.userAgent);
      console.log('window.location.protocol:', window.location.protocol);
      console.log('window.location.href:', window.location.href);
      
      // Force use localhost URL - always use localhost in Electron
      const apiUrl = 'http://localhost:3001/api/auth/register';
      console.log('🎯 FORCING API URL TO:', apiUrl);
      
      // Call registration API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
          phone: registerForm.phone,
          username: registerForm.username,
          password: registerForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessToast({
          title: "สร้างบัญชีสำเร็จ",
          description: "กรุณาเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านที่สร้างไว้",
        });
        // Reset form and switch to login tab
        setRegisterForm({
          firstName: '',
          lastName: '',
          phone: '',
          username: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        showErrorToast({
          title: "ไม่สามารถสร้างบัญชีได้",
          description: data.error || "เกิดข้อผิดพลาดในการสร้างบัญชี",
        });
      }
    } catch (error) {
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative animate-fade-in">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-lg">
        {/* Logo Section */}
        <div className="text-center mb-10 animate-slide-up">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-card shadow-medical animate-scale-in">
            <img src="https://img2.pic.in.th/pic/logo9a23fce12053a876.png" alt="Microscope" className="h-20 w-20 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">LabFlow</h1>
          <p className="text-white/90 text-lg font-medium">ระบบจัดการห้องปฏิบัติการทางการแพทย์</p>
        </div>

        {/* Auth Card */}
        <Card className="glass-effect shadow-medical border-0 animate-scale-in">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl text-foreground">ยินดีต้อนรับ</CardTitle>
            <CardDescription>เข้าสู่ระบบหรือสร้างบัญชีใหม่</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">เข้าสู่ระบบ</TabsTrigger>
                <TabsTrigger value="register">สมัครสมาชิก</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">ชื่อผู้ใช้</Label>
                    <Input 
                      id="login-username" 
                      type="text" 
                      placeholder="username" 
                      value={loginForm.username}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">รหัสผ่าน</Label>
                    <div className="relative">
                      <Input 
                        id="login-password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        required 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full btn-medical hover:scale-[1.02] transform transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-firstName">ชื่อ</Label>
                    <Input 
                      id="register-firstName" 
                      type="text" 
                      placeholder="ชื่อ" 
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-lastName">นามสกุล</Label>
                    <Input 
                      id="register-lastName" 
                      type="text" 
                      placeholder="นามสกุล" 
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-phone">เบอร์โทร</Label>
                    <Input 
                      id="register-phone" 
                      type="tel" 
                      placeholder="0812345678" 
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-username">ชื่อผู้ใช้</Label>
                    <Input 
                      id="register-username" 
                      type="text" 
                      placeholder="username" 
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">รหัสผ่าน</Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">ยืนยันรหัสผ่าน</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full btn-success hover:scale-[1.02] transform transition-all duration-200"
                    disabled={isLoading}
                    onClick={(e) => {
                      console.log('🔥 BUTTON ONCLICK FIRED!');
                      handleRegister(e);
                    }}
                  >
                    {isLoading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}