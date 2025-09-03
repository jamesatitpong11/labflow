import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  TestTube,
  Building,
  Printer,
  FileText,
  Receipt,
  Barcode,
  Save,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

const testCategories = [
  { id: "hematology", name: "Hematology", tests: 12 },
  { id: "chemistry", name: "Chemistry", tests: 25 },
  { id: "urology", name: "Urology", tests: 8 },
  { id: "hormone", name: "Hormone", tests: 15 }
];

const testGroups = [
  { id: "basic", name: "Basic Health Check", tests: ["CBC", "FBS", "Creatinine"] },
  { id: "diabetes", name: "Diabetes Package", tests: ["FBS", "HbA1c", "Lipid Profile"] },
  { id: "cardiac", name: "Cardiac Risk", tests: ["Lipid Profile", "Troponin", "CK-MB"] }
];

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: Implement save settings logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ตั้งค่าระบบ</h1>
          <p className="text-muted-foreground mt-1">จัดการการตั้งค่าต่างๆ ของระบบ</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-medical hover:opacity-90"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </Button>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            การตรวจ
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            บริษัท
          </TabsTrigger>
          <TabsTrigger value="printer" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            เครื่องพิมพ์
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            รายงาน
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            ใบเสร็จ
          </TabsTrigger>
          <TabsTrigger value="barcode" className="flex items-center gap-2">
            <Barcode className="h-4 w-4" />
            บาร์โค้ด
          </TabsTrigger>
        </TabsList>

        {/* Tests Settings */}
        <TabsContent value="tests" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Test Categories */}
            <Card className="shadow-card-custom">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-primary" />
                  หมวดหมู่การตรวจ
                </CardTitle>
                <CardDescription>
                  จัดการหมวดหมู่ของการตรวจต่างๆ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="ชื่อหมวดหมู่ใหม่" className="flex-1" />
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <span className="font-medium text-foreground">{category.name}</span>
                        <p className="text-sm text-muted-foreground">{category.tests} รายการ</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Test Groups */}
            <Card className="shadow-card-custom">
              <CardHeader>
                <CardTitle>กลุ่มการตรวจ (Packages)</CardTitle>
                <CardDescription>
                  สร้างแพ็กเกจการตรวจสำหรับจำหน่าย
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="ชื่อแพ็กเกจใหม่" className="flex-1" />
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testGroups.map((group) => (
                    <div key={group.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{group.name}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.tests.map((test, index) => (
                          <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                ข้อมูลบริษัท
              </CardTitle>
              <CardDescription>
                ข้อมูลสำหรับแสดงในรายงานและใบเสร็จ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">ชื่อบริษัท/ห้องแล็บ</Label>
                  <Input id="company-name" placeholder="ชื่อบริษัท" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name-en">ชื่อภาษาอังกฤษ</Label>
                  <Input id="company-name-en" placeholder="Company Name" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-address">ที่อยู่</Label>
                <Textarea 
                  id="company-address" 
                  placeholder="ที่อยู่เต็ม รวมถึงรหัสไปรษณีย์"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-phone">เบอร์โทรศัพท์</Label>
                  <Input id="company-phone" placeholder="02-xxx-xxxx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">อีเมล</Label>
                  <Input id="company-email" type="email" placeholder="info@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">เลขประจำตัวผู้เสียภาษี</Label>
                  <Input id="tax-id" placeholder="1234567890123" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license-no">เลขที่ใบอนุญาต</Label>
                  <Input id="license-no" placeholder="เลขที่ใบอนุญาตประกอบกิจการ" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">เว็บไซต์</Label>
                  <Input id="website" placeholder="www.company.com" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Printer Settings */}
        <TabsContent value="printer" className="space-y-6">
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                ตั้งค่าเครื่องพิมพ์
              </CardTitle>
              <CardDescription>
                กำหนดเครื่องพิมพ์สำหรับรายงานและใบเสร็จ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">เครื่องพิมพ์รายงาน</Label>
                    <p className="text-sm text-muted-foreground">เครื่องพิมพ์สำหรับพิมพ์รายงานผลตรวจ</p>
                  </div>
                  <Switch />
                </div>
                <Input placeholder="ชื่อเครื่องพิมพ์รายงาน" />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">เครื่องพิมพ์ใบเสร็จ</Label>
                    <p className="text-sm text-muted-foreground">เครื่องพิมพ์สำหรับพิมพ์ใบเสร็จรับเงิน</p>
                  </div>
                  <Switch />
                </div>
                <Input placeholder="ชื่อเครื่องพิมพ์ใบเสร็จ" />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">เครื่องพิมพ์บาร์โค้ด</Label>
                    <p className="text-sm text-muted-foreground">เครื่องพิมพ์สติ๊กเกอร์บาร์โค้ด</p>
                  </div>
                  <Switch />
                </div>
                <Input placeholder="ชื่อเครื่องพิมพ์บาร์โค้ด" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Settings */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                ตั้งค่ารายงาน
              </CardTitle>
              <CardDescription>
                กำหนดรูปแบบและเค้าโครงของรายงาน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">แสดงโลโก้บริษัท</Label>
                    <p className="text-sm text-muted-foreground">แสดงโลโก้ในหัวรายงาน</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">แสดงค่าอ้างอิง</Label>
                    <p className="text-sm text-muted-foreground">แสดงช่วงค่าปกติในรายงาน</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">ลายเซ็นแพทย์</Label>
                    <p className="text-sm text-muted-foreground">แสดงพื้นที่สำหรับลายเซ็นแพทย์</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>หมายเหตุท้ายรายงาน</Label>
                <Textarea 
                  placeholder="ข้อความที่ต้องการแสดงท้ายรายงาน..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt" className="space-y-6">
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                ตั้งค่าใบเสร็จ
              </CardTitle>
              <CardDescription>
                กำหนดรูปแบบและข้อมูลในใบเสร็จ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">พิมพ์ใบเสร็จอัตโนมัติ</Label>
                    <p className="text-sm text-muted-foreground">พิมพ์ใบเสร็จทันทีหลังชำระเงิน</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">แสดงรายละเอียดการตรวจ</Label>
                    <p className="text-sm text-muted-foreground">แสดงรายการตรวจที่สั่งในใบเสร็จ</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>ข้อความท้ายใบเสร็จ</Label>
                <Textarea 
                  placeholder="ขอบคุณที่ใช้บริการ..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-footer1">บรรทัดที่ 1</Label>
                  <Input id="receipt-footer1" placeholder="ข้อความบรรทัดที่ 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt-footer2">บรรทัดที่ 2</Label>
                  <Input id="receipt-footer2" placeholder="ข้อความบรรทัดที่ 2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Barcode Settings */}
        <TabsContent value="barcode" className="space-y-6">
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5 text-primary" />
                ตั้งค่าบาร์โค้ด
              </CardTitle>
              <CardDescription>
                กำหนดรูปแบบและข้อมูลในสติ๊กเกอร์บาร์โค้ด
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">พิมพ์บาร์โค้ดอัตโนมัติ</Label>
                    <p className="text-sm text-muted-foreground">พิมพ์บาร์โค้ดทันทีเมื่อเปิด Visit</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">แสดงชื่อคนไข้</Label>
                    <p className="text-sm text-muted-foreground">แสดงชื่อคนไข้บนสติ๊กเกอร์</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">แสดงวันที่เก็บ</Label>
                    <p className="text-sm text-muted-foreground">แสดงวันที่และเวลาเก็บตัวอย่าง</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode-prefix">รูปแบบรหัส</Label>
                  <Input id="barcode-prefix" placeholder="LAB-" />
                  <p className="text-xs text-muted-foreground">
                    ตัวอย่าง: LAB-240115-001
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode-length">ความยาวตัวเลข</Label>
                  <Input id="barcode-length" type="number" placeholder="3" min="1" max="10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}