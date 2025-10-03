import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Printer
} from "lucide-react";
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
  
  const [recentVisits, setRecentVisits] = useState<Array<{
    visitId: string;
    visitNumber: string;
    patientName: string;
    tests: string[];
    status: string;
    time: string;
  }>>([]);
  
  const [systemStatus, setSystemStatus] = useState({
    database: 'online' as 'online' | 'offline',
    reportPrinter: 'online' as 'online' | 'offline' | 'warning',
    barcodePrinter: 'online' as 'online' | 'offline' | 'warning',
  });
  
  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
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
        console.warn('Failed to load stats, using fallback data:', statsError);
        // Fallback mock data for stats
        setStats({
          todayPatients: 24,
          todayTests: 67,
          pendingResults: 15,
          todayRevenue: 25750,
          yesterdayPatients: 21,
          yesterdayTests: 62,
          yesterdayPendingResults: 18,
          yesterdayRevenue: 22400,
          newPatientsToday: 8,
          newPatientsYesterday: 6,
        });
      }
      setIsLoadingStats(false);

      // Load recent visits
      setIsLoadingVisits(true);
      try {
        const visitsData = await apiService.getRecentVisits(10);
        setRecentVisits(visitsData);
      } catch (visitsError) {
        console.warn('Failed to load visits, using fallback data:', visitsError);
        // Fallback mock data for recent visits
        setRecentVisits([
          {
            visitId: "V001",
            visitNumber: "V001",
            patientName: "นางสาว สมใจ รักดี",
            tests: ["CBC", "Lipid Profile"],
            status: "completed",
            time: "09:30"
          },
          {
            visitId: "V002",
            visitNumber: "V002", 
            patientName: "นาย ใจดี มากใจ",
            tests: ["Blood Sugar", "HbA1c"],
            status: "pending",
            time: "10:15"
          },
          {
            visitId: "V003",
            visitNumber: "V003",
            patientName: "นางสาว มีสุข ความสุข",
            tests: ["Urine Analysis"],
            status: "in-progress",
            time: "11:00"
          }
        ]);
      }
      setIsLoadingVisits(false);

      // Load system status
      setIsLoadingSystem(true);
      try {
        const systemData = await apiService.getSystemStatus();
        setSystemStatus(systemData);
      } catch (systemError) {
        console.warn('Failed to load system status, using fallback data:', systemError);
        // Fallback mock data for system status
        setSystemStatus({
          database: 'online',
          reportPrinter: 'online',
          barcodePrinter: 'warning',
        });
      }
      setIsLoadingSystem(false);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ใช้ข้อมูลตัวอย่างแทน - กรุณาตรวจสอบการเชื่อมต่อ API",
      });
      
      // Set loading states to false even on error
      setIsLoadingStats(false);
      setIsLoadingVisits(false);
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
      title: "รอผลตรวจ",
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
      color: "text-primary"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-muted-foreground mt-1 text-sm">ภาพรวมของระบบห้องปฏิบัติการ</p>
        </div>
        <div className="flex items-center gap-2">
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
              className="w-32 text-center"
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card className="shadow-card-custom">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
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

      <div className="grid gap-6 lg:grid-cols-2">
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
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button 
              className="h-14 flex-col gap-1 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              onClick={() => navigate('/patients/new')}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-sm font-medium">เพิ่มผู้ป่วยใหม่</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-14 flex-col gap-1 border-primary/20 hover:bg-primary/5 hover:border-primary/40 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => navigate('/checkups/new')}
            >
              <Stethoscope className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">ตรวจสุขภาพใหม่</span>
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

        {/* Recent Visits */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-xl bg-success/10">
                <Clock className="h-4 w-4 text-success" />
              </div>
              Visit ล่าสุด
            </CardTitle>
            <CardDescription className="text-sm">
              รายการ Visit ที่เกิดขึ้นในวันนี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingVisits ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
              </div>
            ) : recentVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ไม่มีข้อมูล Visit ในวันนี้
              </div>
            ) : (
              recentVisits.map((visit) => (
                <div
                  key={visit.visitId}
                  className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/20 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 dark:bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">{visit.patientName}</span>
                      <Badge variant="outline" className="text-xs font-medium">{visit.visitNumber}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {visit.tests.join(", ")} • เวลา {visit.time}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(visit.status)}
                  </div>
                </div>
              ))
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
          <div className="grid gap-4 md:grid-cols-3">
            {isLoadingSystem ? (
              <div className="col-span-3 flex items-center justify-center py-6">
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
            <div className="flex gap-3">
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
    </div>
  );
}