import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Activity, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
  Stethoscope,
  Settings,
  Printer,
  TestTube,
  Eye,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/toast-helpers";


export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Date selection state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // Format date for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  // Parse display date back to ISO format (YYYY-MM-DD)
  const parseDateFromDisplay = (displayDate: string) => {
    const [day, month, year] = displayDate.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };
  
  // Display date state for DD/MM/YYYY format
  const [displayDate, setDisplayDate] = useState(() => {
    const today = new Date();
    return formatDateForDisplay(today.toISOString().split('T')[0]);
  });
  
  // State for dashboard data
  const [stats, setStats] = useState({
    todayPatients: 0,
    todayTests: 0,
    pendingResults: 0,
    todayRevenue: 0,
    yesterdayPatients: 0,
    yesterdayTests: 0,
    yesterdayPendingResults: 0,
    yesterdayRevenue: 0,
    newPatientsToday: 0,
    newPatientsYesterday: 0,
  });
  
  const [monthlyRevenue, setMonthlyRevenue] = useState<Array<{
    month: string;
    revenue: number;
    monthName: string;
  }>>([]);

  // Revenue breakdown popup state
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = useState(false);
  const [revenueBreakdown, setRevenueBreakdown] = useState<{
    cash: number;
    creditCard: number;
    bankTransfer: number;
    insurance: number;
    other: number;
    total: number;
    cancelled: number;
  }>({
    cash: 0,
    creditCard: 0,
    bankTransfer: 0,
    insurance: 0,
    other: 0,
    total: 0,
    cancelled: 0
  });
  
  const [systemStatus, setSystemStatus] = useState({
    database: 'online' as 'online' | 'offline',
    reportPrinter: 'online' as 'online' | 'offline' | 'warning',
    barcodePrinter: 'online' as 'online' | 'offline' | 'warning',
  });
  
  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [isLoadingSystem, setIsLoadingSystem] = useState(true);

  // Load dashboard data on component mount and when date changes
  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  const loadDashboardData = async () => {
    try {
      // Load stats
      setIsLoadingStats(true);
      try {
        const statsData = await apiService.getDashboardStats(selectedDate);
        // Ensure new fields have default values if not provided by API
        setStats({
          ...statsData,
          newPatientsToday: statsData.newPatientsToday || 0,
          newPatientsYesterday: statsData.newPatientsYesterday || 0,
        });
      } catch (statsError) {
        console.error('Failed to load stats:', statsError);
        showErrorToast({
          title: "ไม่สามารถโหลดสถิติได้",
          description: "กรุณาตรวจสอบการเชื่อมต่อ API",
        });
        // Reset to zero values instead of mock data
        setStats({
          todayPatients: 0,
          todayTests: 0,
          pendingResults: 0,
          todayRevenue: 0,
          yesterdayPatients: 0,
          yesterdayTests: 0,
          yesterdayPendingResults: 0,
          yesterdayRevenue: 0,
          newPatientsToday: 0,
          newPatientsYesterday: 0,
        });
      }
      setIsLoadingStats(false);

      // Load monthly revenue data
      setIsLoadingRevenue(true);
      try {
        const revenueData = await apiService.getMonthlyRevenue(6);
        setMonthlyRevenue(revenueData);
      } catch (revenueError) {
        console.error('Failed to load monthly revenue:', revenueError);
        showErrorToast({
          title: "ไม่สามารถโหลดข้อมูลรายได้รายเดือนได้",
          description: "กรุณาตรวจสอบการเชื่อมต่อ API",
        });
        // Reset to empty array instead of mock data
        setMonthlyRevenue([]);
      }
      setIsLoadingRevenue(false);

      // Load system status
      setIsLoadingSystem(true);
      try {
        const systemData = await apiService.getSystemStatus();
        setSystemStatus(systemData);
      } catch (systemError) {
        console.error('Failed to load system status:', systemError);
        showErrorToast({
          title: "ไม่สามารถตรวจสอบสถานะระบบได้",
          description: "กรุณาตรวจสอบการเชื่อมต่อ API",
        });
        // Set to offline status instead of mock data
        setSystemStatus({
          database: 'offline',
          reportPrinter: 'offline',
          barcodePrinter: 'offline',
        });
      }
      setIsLoadingSystem(false);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        description: "กรุณาตรวจสอบการเชื่อมต่อ API และลองใหม่อีกครั้ง",
      });
      
      // Set loading states to false even on error
      setIsLoadingStats(false);
      setIsLoadingRevenue(false);
      setIsLoadingSystem(false);
    }
  };

  const calculatePercentageChange = (today: number, yesterday: number): string => {
    if (yesterday === 0) return "+0%";
    const change = ((today - yesterday) / yesterday) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH').format(amount);
  };

  // Function to load revenue breakdown
  const loadRevenueBreakdown = async (date: string) => {
    try {
      const breakdown = await apiService.getRevenueBreakdown(date);
      setRevenueBreakdown(breakdown);
      setIsRevenueDialogOpen(true);
    } catch (error) {
      console.error('Failed to load revenue breakdown:', error);
      showErrorToast({
        title: "ไม่สามารถโหลดข้อมูลได้",
        description: "กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success hover:bg-success/20">เสร็จแล้ว</Badge>;
      case "pending":
        return <Badge variant="secondary">รอดำเนินการ</Badge>;
      case "in-progress":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">กำลังตรวจ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSystemStatusBadge = (status: 'online' | 'offline' | 'warning', label: string) => {
    switch (status) {
      case 'online':
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-success">{label} - ออนไลน์</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-warning">{label} - มีปัญหา</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive">{label} - ออฟไลน์</span>
          </div>
        );
    }
  };

  // Dynamic stats data
  const statsCards = [
    {
      title: "ผู้ป่วยใหม่",
      value: isLoadingStats ? "..." : (stats.newPatientsToday || 0).toString(),
      change: isLoadingStats ? "..." : calculatePercentageChange(stats.newPatientsToday || 0, stats.newPatientsYesterday || 0),
      icon: Users,
      color: "text-primary"
    },
    {
      title: "จำนวน visit วันนี้",
      value: isLoadingStats ? "..." : stats.todayPatients.toString(),
      change: isLoadingStats ? "..." : calculatePercentageChange(stats.todayPatients, stats.yesterdayPatients),
      icon: Activity,
      color: "text-success"
    },
    {
      title: "จำนวนการขาย",
      value: isLoadingStats ? "..." : stats.pendingResults.toString(),
      change: isLoadingStats ? "..." : calculatePercentageChange(stats.pendingResults, stats.yesterdayPendingResults),
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "รายได้วันนี้",
      value: isLoadingStats ? "..." : formatCurrency(stats.todayRevenue),
      change: isLoadingStats ? "..." : calculatePercentageChange(stats.todayRevenue, stats.yesterdayRevenue),
      icon: TrendingUp,
      color: "text-primary",
      clickable: true,
      onClick: () => loadRevenueBreakdown(selectedDate)
    }
  ];

  const quickActions = [
    {
      title: "เปิด Visit ใหม่",
      description: "สร้าง Visit สำหรับคนไข้",
      href: "/visit-management",
      icon: Calendar,
      color: "bg-gradient-medical"
    },
    {
      title: "ลงทะเบียนคนไข้",
      description: "เพิ่มข้อมูลคนไข้ใหม่",
      href: "/patient-registration", 
      icon: Users,
      color: "bg-gradient-success"
    },
    {
      title: "ลงผลการตรวจ",
      description: "บันทึกผลตรวจของคนไข้",
      href: "/lab-results",
      icon: FileText,
      color: "bg-primary"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-muted-foreground mt-1 text-sm">ภาพรวมของระบบห้องปฏิบัติการ</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="วว/ดด/ปปปป"
              value={displayDate}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and forward slashes
                const cleanValue = value.replace(/[^0-9/]/g, '');
                
                // Auto-format as user types
                let formattedValue = cleanValue;
                if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
                  formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
                }
                if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
                  const parts = cleanValue.split('/');
                  formattedValue = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
                }
                
                setDisplayDate(formattedValue);
                
                // If complete date format, update selectedDate
                if (formattedValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                  try {
                    const isoDate = parseDateFromDisplay(formattedValue);
                    const testDate = new Date(isoDate);
                    if (!isNaN(testDate.getTime())) {
                      setSelectedDate(isoDate);
                    }
                  } catch (error) {
                    // Invalid date format, ignore
                  }
                }
              }}
              onBlur={() => {
                // Validate and correct date on blur
                if (displayDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                  try {
                    const isoDate = parseDateFromDisplay(displayDate);
                    const testDate = new Date(isoDate);
                    if (!isNaN(testDate.getTime())) {
                      setSelectedDate(isoDate);
                      setDisplayDate(formatDateForDisplay(isoDate));
                    } else {
                      // Reset to current selectedDate if invalid
                      setDisplayDate(formatDateForDisplay(selectedDate));
                    }
                  } catch (error) {
                    // Reset to current selectedDate if invalid
                    setDisplayDate(formatDateForDisplay(selectedDate));
                  }
                } else if (displayDate.trim() === '') {
                  // If empty, reset to today
                  const today = new Date().toISOString().split('T')[0];
                  setSelectedDate(today);
                  setDisplayDate(formatDateForDisplay(today));
                }
              }}
              className="w-28 sm:w-32 text-center text-sm"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setSelectedDate(today);
              setDisplayDate(formatDateForDisplay(today));
            }}
          >
            วันนี้
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => loadDashboardData()}
            disabled={isLoadingStats || isLoadingRevenue || isLoadingSystem}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${(isLoadingStats || isLoadingRevenue || isLoadingSystem) ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card 
            key={index}
            className={`shadow-card-custom ${stat.clickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300' : ''}`}
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
                {stat.clickable && (
                  <span className="ml-2 text-xs text-primary opacity-70">
                    (คลิกเพื่อดูรายละเอียด)
                  </span>
                )}
              </CardTitle>
              <div className="p-2 rounded-xl bg-primary/10">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
                {isLoadingStats && <Loader2 className="h-4 w-4 animate-spin" />}
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-success font-semibold" : "text-destructive font-semibold"}>
                  {stat.change}
                </span>
                {" "}จากเมื่อวาน
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                <Activity className="h-4 w-4 text-white" />
              </div>
              การดำเนินการด่วน
            </CardTitle>
            <CardDescription className="text-sm">
              เข้าถึงฟังก์ชันหลักของระบบได้อย่างรวดเร็ว
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <Button 
              className="h-14 flex-col gap-1 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              onClick={() => navigate('/patient-registration')}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-sm font-medium">เพิ่มผู้ป่วยใหม่</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-14 flex-col gap-1 border-primary/20 hover:bg-primary/5 hover:border-primary/40 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => navigate('/visit-management')}
            >
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">เปิดรายตรวจใหม่</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-14 flex-col gap-1 border-success/20 hover:bg-success/5 hover:border-success/40 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">ดูรายงาน</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-14 flex-col gap-1 border-warning/20 hover:bg-warning/5 hover:border-warning/40 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium text-warning">ตั้งค่าระบบ</span>
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Revenue Chart */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-xl bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              รายได้รายเดือน
            </CardTitle>
            <CardDescription className="text-sm">
              แสดงรายได้ของ 6 เดือนที่ผ่านมา
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
              </div>
            ) : monthlyRevenue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ไม่มีข้อมูลรายได้
              </div>
            ) : (
              <div className="h-48 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="monthName" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${formatCurrency(value)} บาท`, 'รายได้']}
                      labelFormatter={(label) => `เดือน: ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <Line 
                      type="monotone"
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ 
                        fill: 'hsl(var(--primary))', 
                        strokeWidth: 2, 
                        r: 6 
                      }}
                      activeDot={{ 
                        r: 8, 
                        fill: 'hsl(var(--primary))',
                        stroke: 'hsl(var(--background))',
                        strokeWidth: 2
                      }}
                      className="drop-shadow-sm"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-card border border-border/30 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 dark:bg-card dark:border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="p-2 rounded-xl bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            สถานะระบบ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {isLoadingSystem ? (
              <div className="col-span-1 sm:col-span-2 md:col-span-3 flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">กำลังตรวจสอบสถานะระบบ...</span>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-card border border-border/20 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 dark:bg-card">
                  {getSystemStatusBadge(systemStatus.database, 'ฐานข้อมูล')}
                </div>
                <div className="p-4 rounded-lg bg-card border border-border/20 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 dark:bg-card">
                  {getSystemStatusBadge(systemStatus.reportPrinter, 'เครื่องพิมพ์รายงาน')}
                </div>
                <div className="p-4 rounded-lg bg-card border border-border/20 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 dark:bg-card">
                  {getSystemStatusBadge(systemStatus.barcodePrinter, 'เครื่องพิมพ์บาร์โค้ด')}
                </div>
              </>
            )}
          </div>
          
          <div className="pt-4 border-t border-border/20">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => navigate('/printer-test')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                ทดสอบเครื่องพิมพ์
              </Button>
              <Button
                onClick={() => navigate('/settings')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                ตั้งค่าระบบ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown Dialog */}
      <Dialog open={isRevenueDialogOpen} onOpenChange={setIsRevenueDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              รายละเอียดรายได้วันนี้
            </DialogTitle>
            <DialogDescription>
              แยกตามประเภทการชำระเงิน - วันที่ {formatDateForDisplay(selectedDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <span className="font-medium text-green-800 dark:text-green-200">💵 เงินสด</span>
                <span className="font-bold text-green-800 dark:text-green-200">
                  {formatCurrency(revenueBreakdown.cash)} บาท
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <span className="font-medium text-blue-800 dark:text-blue-200">💳 บัตรเครดิต</span>
                <span className="font-bold text-blue-800 dark:text-blue-200">
                  {formatCurrency(revenueBreakdown.creditCard)} บาท
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <span className="font-medium text-purple-800 dark:text-purple-200">🏦 โอนเงิน</span>
                <span className="font-bold text-purple-800 dark:text-purple-200">
                  {formatCurrency(revenueBreakdown.bankTransfer)} บาท
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <span className="font-medium text-orange-800 dark:text-orange-200">🏥 สปสช.</span>
                <span className="font-bold text-orange-800 dark:text-orange-200">
                  {formatCurrency(revenueBreakdown.insurance)} บาท
                </span>
              </div>
              
              {revenueBreakdown.other > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                  <span className="font-medium text-gray-800 dark:text-gray-200">📄 อื่นๆ</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrency(revenueBreakdown.other)} บาท
                  </span>
                </div>
              )}
              
              {revenueBreakdown.cancelled > 0 && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <span className="font-medium text-red-800 dark:text-red-200">❌ ยกเลิก</span>
                  <span className="font-bold text-red-800 dark:text-red-200">
                    {formatCurrency(revenueBreakdown.cancelled)} บาท
                  </span>
                </div>
              )}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center p-4 rounded-lg bg-primary/10">
                <span className="font-bold text-primary text-lg">รวมทั้งหมด</span>
                <span className="font-bold text-primary text-xl">
                  {formatCurrency(revenueBreakdown.total)} บาท
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}