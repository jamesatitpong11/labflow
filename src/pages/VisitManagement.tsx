import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock,
  User,
  FileText,
  Edit,
  CheckCircle2
} from "lucide-react";

const mockVisits = [
  {
    id: "V001",
    patientName: "นางสาว สมใจ รักดี",
    patientId: "P001", 
    visitDate: "2024-01-15",
    visitTime: "09:30",
    chief_complaint: "ตรวจสุขภาพประจำปี",
    status: "completed",
    doctorNote: "ผลตรวจปกติ"
  },
  {
    id: "V002",
    patientName: "นาย ใจดี มากใจ", 
    patientId: "P002",
    visitDate: "2024-01-15", 
    visitTime: "10:15",
    chief_complaint: "ตรวจเบาหวาน",
    status: "in-progress",
    doctorNote: ""
  },
  {
    id: "V003",
    patientName: "นางสาว มีสุข ความสุข",
    patientId: "P003",
    visitDate: "2024-01-15",
    visitTime: "11:00", 
    chief_complaint: "ตรวจปัสสาวะ",
    status: "pending",
    doctorNote: ""
  }
];

export default function VisitManagement() {
  const [showNewVisitForm, setShowNewVisitForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredVisits = mockVisits.filter(visit =>
    visit.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement visit creation logic
    setTimeout(() => {
      setIsLoading(false);
      setShowNewVisitForm(false);
    }, 1000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success hover:bg-success/20">เสร็จแล้ว</Badge>;
      case "in-progress":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">กำลังดำเนินการ</Badge>;
      case "pending":
        return <Badge variant="secondary">รอดำเนินการ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการ Visit</h1>
          <p className="text-muted-foreground mt-1">เปิด Visit ใหม่และจัดการการเข้ารับบริการ</p>
        </div>
        <Button 
          onClick={() => setShowNewVisitForm(true)}
          className="bg-gradient-medical hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          เปิด Visit ใหม่
        </Button>
      </div>

      {/* New Visit Form */}
      {showNewVisitForm && (
        <Card className="shadow-medical border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              เปิด Visit ใหม่
            </CardTitle>
            <CardDescription>
              กรอกข้อมูลสำหรับเปิด Visit ใหม่
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVisit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-search">ค้นหาคนไข้ *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="patient-search"
                      placeholder="พิมพ์ชื่อหรือรหัสคนไข้"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit-date">วันที่ Visit *</Label>
                  <Input 
                    id="visit-date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visit-time">เวลา *</Label>
                  <Input 
                    id="visit-time"
                    type="time"
                    defaultValue={new Date().toTimeString().slice(0, 5)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit-type">ประเภท Visit</Label>
                  <Input 
                    id="visit-type"
                    placeholder="ตรวจสุขภาพ, ตรวจเฉพาะ, ฯลฯ"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chief-complaint">อาการสำคัญ / วัตถุประสงค์ *</Label>
                <Textarea 
                  id="chief-complaint"
                  placeholder="กรอกอาการสำคัญหรือวัตถุประสงค์ของการมารับบริการ"
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-note">หมายเหตุแพทย์</Label>
                <Textarea 
                  id="doctor-note"
                  placeholder="หมายเหตุเพิ่มเติมจากแพทย์ (ถ้ามี)"
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowNewVisitForm(false)}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-medical hover:opacity-90"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? "กำลังสร้าง..." : "เปิด Visit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            ค้นหา Visit
          </CardTitle>
          <CardDescription>
            ค้นหาด้วยชื่อคนไข้ รหัสคนไข้ หรือรหัส Visit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหา Visit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              กรองตามวันที่
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visit List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Visit วันนี้ ({filteredVisits.length} รายการ)
          </h2>
        </div>

        <div className="grid gap-4">
          {filteredVisits.map((visit) => (
            <Card key={visit.id} className="shadow-card-custom hover:shadow-medical transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{visit.patientName}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {visit.patientId}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Visit ID: {visit.id}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(visit.status)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">วันเวลา</Label>
                        <p className="text-sm text-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-4 w-4" />
                          {visit.visitDate} เวลา {visit.visitTime}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">อาการสำคัญ</Label>
                        <p className="text-sm text-foreground mt-1">{visit.chief_complaint}</p>
                      </div>
                    </div>

                    {visit.doctorNote && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">หมายเหตุแพทย์</Label>
                        <p className="text-sm text-foreground mt-1">{visit.doctorNote}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        แก้ไข
                      </Button>
                      <Button size="sm" className="bg-gradient-success hover:opacity-90">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        อัพเดทสถานะ
                      </Button>
                      <Button size="sm" className="bg-gradient-medical hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มรายการตรวจ
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVisits.length === 0 && (
          <Card className="shadow-card-custom">
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">ไม่พบข้อมูล</h3>
              <p className="text-muted-foreground mb-4">
                ไม่พบ Visit ที่ตรงกับคำค้นหา
              </p>
              <Button 
                onClick={() => setShowNewVisitForm(true)}
                className="bg-gradient-medical hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                เปิด Visit แรก
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}