import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Microscope, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement authentication logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement registration logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-medical flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-medical">
              <Microscope className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground">Lab System</h1>
          <p className="text-primary-foreground/80 mt-2">ระบบจัดการห้องปฏิบัติการ</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-medical border-0 bg-card/95 backdrop-blur">
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
                    <Label htmlFor="login-email">อีเมล</Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="your@email.com" 
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
                    className="w-full bg-gradient-medical hover:opacity-90 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">ชื่อ-นามสกุล</Label>
                    <Input 
                      id="register-name" 
                      type="text" 
                      placeholder="ชื่อ นามสกุล" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">อีเมล</Label>
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="your@email.com" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">รหัสผ่าน</Label>
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">ยืนยันรหัสผ่าน</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-medical hover:opacity-90 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
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