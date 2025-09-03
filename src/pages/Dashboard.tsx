import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const stats = [
  {
    title: "คนไข้วันนี้",
    value: "24",
    change: "+12%",
    icon: Users,
    color: "text-primary"
  },
  {
    title: "รายการตรวจวันนี้",
    value: "67",
    change: "+8%", 
    icon: Activity,
    color: "text-success"
  },
  {
    title: "รอผลตรวจ",
    value: "15",
    change: "-5%",
    icon: Clock,
    color: "text-warning"
  },
  {
    title: "รายได้วันนี้",
    value: "25,750",
    change: "+15%",
    icon: TrendingUp,
    color: "text-primary"
  }
];

const recentVisits = [
  {
    id: "V001",
    patientName: "นางสาว สมใจ รักดี",
    tests: ["CBC", "Lipid Profile"],
    status: "completed",
    time: "09:30"
  },
  {
    id: "V002", 
    patientName: "นาย ใจดี มากใจ",
    tests: ["Blood Sugar", "HbA1c"],
    status: "pending",
    time: "10:15"
  },
  {
    id: "V003",
    patientName: "นางสาว มีสุข ความสุข",
    tests: ["Urine Analysis"],
    status: "in-progress",
    time: "11:00"
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

export default function Dashboard() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-muted-foreground mt-1">ภาพรวมของระบบห้องปฏิบัติการ</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            วันนี้
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card-custom hover:shadow-medical transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-success" : "text-destructive"}>
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
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              การดำเนินการด่วน
            </CardTitle>
            <CardDescription>
              เข้าถึงฟังก์ชันหลักของระบบได้อย่างรวดเร็ว
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="ghost"
                className="w-full justify-start gap-3 h-auto p-4 hover:bg-muted/50"
                asChild
              >
                <a href={action.href}>
                  <div className={`p-2 rounded-md ${action.color}`}>
                    <action.icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">{action.description}</div>
                  </div>
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Visits */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Visit ล่าสุด
            </CardTitle>
            <CardDescription>
              รายการ Visit ที่เกิดขึ้นในวันนี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentVisits.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{visit.patientName}</span>
                    <Badge variant="outline" className="text-xs">{visit.id}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {visit.tests.join(", ")} • เวลา {visit.time}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(visit.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            สถานะระบบ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-success"></div>
              <span className="text-sm">เครื่องพิมพ์ใบรายงาน</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-success"></div>
              <span className="text-sm">ระบบฐานข้อมูล</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-warning"></div>
              <span className="text-sm">เครื่องพิมพ์บาร์โค้ด</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}