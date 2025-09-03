import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Phone,
  MapPin,
  Clock,
  Eye
} from "lucide-react";

const mockRecords = [
  {
    id: "MR001",
    patientName: "นางสาว สมใจ รักดี",
    patientId: "P001",
    phone: "081-234-5678",
    address: "123 ถ.รัชดาภิเษก กรุงเทพฯ 10400",
    lastVisit: "2024-01-15",
    totalVisits: 5,
    recentTests: ["CBC", "Lipid Profile", "Blood Sugar"],
    status: "active"
  },
  {
    id: "MR002", 
    patientName: "นาย ใจดี มากใจ",
    patientId: "P002",
    phone: "082-345-6789",
    address: "456 ถ.สุขุมวิท กรุงเทพฯ 10110",
    lastVisit: "2024-01-10",
    totalVisits: 3,
    recentTests: ["HbA1c", "Kidney Function"],
    status: "active"
  },
  {
    id: "MR003",
    patientName: "นางสาว มีสุข ความสุข", 
    patientId: "P003",
    phone: "083-456-7890",
    address: "789 ถ.พหลโยธิน กรุงเทพฯ 10220",
    lastVisit: "2023-12-20",
    totalVisits: 8,
    recentTests: ["Urine Analysis", "CBC"],
    status: "inactive"
  }
];

export default function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState(mockRecords);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = mockRecords.filter(record =>
      record.patientName.toLowerCase().includes(value.toLowerCase()) ||
      record.patientId.toLowerCase().includes(value.toLowerCase()) ||
      record.phone.includes(value)
    );
    setFilteredRecords(filtered);
  };

  const getStatusBadge = (status: string) => {
    return status === "active" 
      ? <Badge className="bg-success/10 text-success hover:bg-success/20">กำลังใช้งาน</Badge>
      : <Badge variant="secondary">ไม่ได้ใช้งาน</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">เวชระเบียน</h1>
          <p className="text-muted-foreground mt-1">ค้นหาและจัดการประวัติการเข้ารับบริการ</p>
        </div>
        <Button className="bg-gradient-medical hover:opacity-90">
          <FileText className="h-4 w-4 mr-2" />
          สร้างเวชระเบียนใหม่
        </Button>
      </div>

      {/* Search Section */}
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            ค้นหาเวชระเบียน
          </CardTitle>
          <CardDescription>
            ค้นหาด้วยชื่อ-นามสกุล รหัสคนไข้ หรือเบอร์โทรศัพท์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">ค้นหา</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="พิมพ์ชื่อ รหัสคนไข้ หรือเบอร์โทรศัพท์"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                กรองตามวันที่
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            ผลการค้นหา ({filteredRecords.length} รายการ)
          </h2>
        </div>

        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="shadow-card-custom hover:shadow-medical transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{record.patientName}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            รหัส: {record.patientId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {record.phone}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(record.status)}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">ที่อยู่</Label>
                        <p className="text-sm text-foreground flex items-start gap-1 mt-1">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          {record.address}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">การตรวจล่าสุด</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {record.recentTests.map((test, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {test}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          เข้ารับบริการล่าสุด: {record.lastVisit}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          จำนวนครั้งทั้งหมด: {record.totalVisits} ครั้ง
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          ดูรายละเอียด
                        </Button>
                        <Button size="sm" className="bg-gradient-medical hover:opacity-90">
                          <Calendar className="h-4 w-4 mr-2" />
                          เปิด Visit ใหม่
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <Card className="shadow-card-custom">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">ไม่พบข้อมูล</h3>
              <p className="text-muted-foreground mb-4">
                ไม่พบเวชระเบียนที่ตรงกับคำค้นหา "{searchTerm}"
              </p>
              <Button variant="outline" onClick={() => handleSearch("")}>
                แสดงทั้งหมด
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}