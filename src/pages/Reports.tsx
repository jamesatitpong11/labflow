import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  FileText,
  Calendar,
  Download,
  Filter,
  TrendingUp,
  Users,
  Activity,
  DollarSign
} from "lucide-react";

const reportTypes = [
  { id: "daily", name: "รายงานประจำวัน", description: "สรุปข้อมูลรายวัน" },
  { id: "monthly", name: "รายงานประจำเดือน", description: "สรุปข้อมูลรายเดือน" },
  { id: "patient", name: "รายงานคนไข้", description: "ข้อมูลการเข้ารับบริการ" },
  { id: "revenue", name: "รายงานรายได้", description: "สรุปรายได้และค่าใช้จ่าย" },
  { id: "test", name: "รายงานการตรวจ", description: "สถิติการตรวจต่างๆ" }
];

const mockReportData = [
  {
    date: "2024-01-15",
    patients: 24,
    tests: 67,
    revenue: 25750,
    status: "completed"
  },
  {
    date: "2024-01-14", 
    patients: 18,
    tests: 45,
    revenue: 18900,
    status: "completed"
  },
  {
    date: "2024-01-13",
    patients: 22,
    tests: 58,
    revenue: 23400,
    status: "completed"
  }
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // TODO: Implement report generation logic
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const handleExportExcel = async () => {
    // TODO: Implement Excel export logic
    console.log("Exporting to Excel...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">รายงาน</h1>
          <p className="text-muted-foreground mt-1">สร้างและส่งออกรายงานต่างๆ</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Report Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                ตั้งค่ารายงาน
              </CardTitle>
              <CardDescription>
                เลือกประเภทรายงานและช่วงวันที่
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">ประเภทรายงาน</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทรายงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-from">วันที่เริ่มต้น</Label>
                <Input 
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">วันที่สิ้นสุด</Label>
                <Input 
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-4">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={!selectedReport || isGenerating}
                  className="w-full bg-gradient-medical hover:opacity-90"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {isGenerating ? "กำลังสร้าง..." : "สร้างรายงาน"}
                </Button>
                
                <Button 
                  onClick={handleExportExcel}
                  disabled={!selectedReport}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  ส่งออก Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Types */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle>ประเภทรายงาน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-muted/30 ${
                    selectedReport === type.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  }`}
                  onClick={() => setSelectedReport(type.id)}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-medium text-foreground">{type.name}</span>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Report Display */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <>
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-card-custom">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">คนไข้วันนี้</p>
                        <p className="text-2xl font-bold text-foreground">24</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-card-custom">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">รายการตรวจ</p>
                        <p className="text-2xl font-bold text-foreground">67</p>
                      </div>
                      <Activity className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card-custom">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">รายได้วันนี้</p>
                        <p className="text-2xl font-bold text-foreground">25,750</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-warning" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card-custom">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">เติบโต</p>
                        <p className="text-2xl font-bold text-success">+12%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-success" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Report Table */}
              <Card className="shadow-card-custom">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {reportTypes.find(r => r.id === selectedReport)?.name}
                  </CardTitle>
                  <CardDescription>
                    ข้อมูลย้อนหลัง 3 วัน
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-medium text-muted-foreground">วันที่</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">คนไข้</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">รายการตรวจ</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">รายได้</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockReportData.map((row, index) => (
                          <tr key={index} className="border-b border-border hover:bg-muted/30">
                            <td className="p-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {row.date}
                              </span>
                            </td>
                            <td className="p-3">{row.patients} คน</td>
                            <td className="p-3">{row.tests} รายการ</td>
                            <td className="p-3 font-medium">฿{row.revenue.toLocaleString()}</td>
                            <td className="p-3">
                              <Badge className="bg-success/10 text-success hover:bg-success/20">
                                เสร็จแล้ว
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      แสดง 3 รายการ จากทั้งหมด 3 รายการ
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        พิมพ์รายงาน
                      </Button>
                      <Button size="sm" className="bg-gradient-success hover:opacity-90">
                        <Download className="h-4 w-4 mr-2" />
                        ดาวน์โหลด PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-card-custom">
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">เลือกประเภทรายงาน</h3>
                <p className="text-muted-foreground">
                  กรุณาเลือกประเภทรายงานจากด้านซ้ายเพื่อเริ่มสร้างรายงาน
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}