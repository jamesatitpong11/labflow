import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserPlus, 
  Save,
  Calendar,
  Phone,
  MapPin,
  User
} from "lucide-react";

export default function PatientRegistration() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement patient registration logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ลงทะเบียนคนไข้</h1>
          <p className="text-muted-foreground mt-1">เพิ่มข้อมูลคนไข้ใหม่เข้าสู่ระบบ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card-custom">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  ข้อมูลส่วนตัว
                </CardTitle>
                <CardDescription>
                  กรอกข้อมูลพื้นฐานของคนไข้
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">คำนำหน้า *</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกคำนำหน้า" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">นาย</SelectItem>
                        <SelectItem value="mrs">นาง</SelectItem>
                        <SelectItem value="ms">นางสาว</SelectItem>
                        <SelectItem value="master">เด็กชาย</SelectItem>
                        <SelectItem value="miss">เด็กหญิง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">เพศ *</Label>
                    <RadioGroup defaultValue="male" className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">ชาย</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">หญิง</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">ชื่อ *</Label>
                    <Input id="firstName" placeholder="กรอกชื่อ" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">นามสกุล *</Label>
                    <Input id="lastName" placeholder="กรอกนามสกุล" required />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">วันเกิด *</Label>
                    <Input id="birthDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idCard">เลขบัตรประชาชน</Label>
                    <Input id="idCard" placeholder="1-3456-78901-23-4" maxLength={17} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">สัญชาติ</Label>
                    <Input id="nationality" placeholder="ไทย" defaultValue="ไทย" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-card-custom">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  ข้อมูลติดต่อ
                </CardTitle>
                <CardDescription>
                  ข้อมูลสำหรับติดต่อและที่อยู่
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                    <Input id="phone" placeholder="081-234-5678" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input id="email" type="email" placeholder="example@email.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">ที่อยู่ปัจจุบัน *</Label>
                  <Textarea 
                    id="address" 
                    placeholder="กรอกที่อยู่เต็ม รวมถึงตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">ผู้ติดต่อฉุกเฉิน</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="ชื่อ-นามสกุล" />
                    <Input placeholder="เบอร์โทรศัพท์" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <Card className="shadow-card-custom">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  ข้อมูลเพิ่มเติม
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">อาชีพ</Label>
                  <Input id="occupation" placeholder="กรอกอาชีพ" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">สถานภาพ</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานภาพ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">โสด</SelectItem>
                      <SelectItem value="married">สมรส</SelectItem>
                      <SelectItem value="divorced">หย่าร้าง</SelectItem>
                      <SelectItem value="widowed">หม้าย</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">หมู่เลือด</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหมู่เลือด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ประวัติแพ้ยา/อาหาร</Label>
                  <Textarea 
                    placeholder="กรอกประวัติแพ้ยาหรืออาหาร (ถ้ามี)"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>โรคประจำตัว</Label>
                  <Textarea 
                    placeholder="กรอกโรคประจำตัว (ถ้ามี)"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="consent" />
                  <Label htmlFor="consent" className="text-sm">
                    ยินยอมให้ใช้ข้อมูลเพื่อการรักษา
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-gradient-medical hover:opacity-90"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
              <Button type="button" variant="outline" className="w-full">
                ล้างข้อมูล
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}