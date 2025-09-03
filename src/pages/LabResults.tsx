import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardList, 
  Search, 
  Upload,
  FileText,
  Image,
  Download,
  Save,
  Eye,
  Calendar
} from "lucide-react";

const pendingResults = [
  {
    orderId: "O001",
    patientName: "นางสาว สมใจ รักดี",
    patientId: "P001",
    visitId: "V001",
    tests: [
      { id: "CBC", name: "Complete Blood Count", status: "pending" },
      { id: "LDL", name: "Lipid Profile", status: "completed" }
    ],
    orderDate: "2024-01-15",
    dueDate: "2024-01-16"
  },
  {
    orderId: "O002", 
    patientName: "นาย ใจดี มากใจ",
    patientId: "P002",
    visitId: "V002",
    tests: [
      { id: "BS", name: "Blood Sugar", status: "pending" },
      { id: "HBA1C", name: "HbA1c", status: "pending" }
    ],
    orderDate: "2024-01-15",
    dueDate: "2024-01-16"
  }
];

export default function LabResults() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filteredOrders = pendingResults.filter(order =>
    order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement save results logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getStatusBadge = (status: string) => {
    return status === "completed" 
      ? <Badge className="bg-success/10 text-success hover:bg-success/20">เสร็จแล้ว</Badge>
      : <Badge variant="secondary">รอผล</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ลงผลการตรวจ</h1>
          <p className="text-muted-foreground mt-1">บันทึกผลการตรวจและแนบไฟล์รายงาน</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                รายการรอผล
              </CardTitle>
              <CardDescription>
                เลือกรายการที่ต้องการลงผล
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหารายการ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/30 ${
                        selectedOrder === order.orderId 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                      onClick={() => setSelectedOrder(order.orderId)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{order.patientName}</span>
                          <Badge variant="outline" className="text-xs">{order.orderId}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>รหัส: {order.patientId} | Visit: {order.visitId}</p>
                          <p className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            กำหนดส่ง: {order.dueDate}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {order.tests.map((test, index) => (
                            <Badge 
                              key={index} 
                              variant={test.status === "completed" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {test.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrder ? (
            <>
              {/* Selected Order Info */}
              <Card className="shadow-card-custom">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    ลงผลการตรวจ - {selectedOrder}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const order = pendingResults.find(o => o.orderId === selectedOrder);
                    return order ? (
                      <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">คนไข้:</span>
                              <span className="ml-2">{order.patientName}</span>
                            </div>
                            <div>
                              <span className="font-medium">รหัส:</span>
                              <span className="ml-2">{order.patientId}</span>
                            </div>
                            <div>
                              <span className="font-medium">Visit ID:</span>
                              <span className="ml-2">{order.visitId}</span>
                            </div>
                            <div>
                              <span className="font-medium">วันที่สั่ง:</span>
                              <span className="ml-2">{order.orderDate}</span>
                            </div>
                          </div>
                        </div>

                        <form onSubmit={handleSaveResults} className="space-y-6">
                          {/* Test Results */}
                          <div className="space-y-4">
                            <Label className="text-lg font-semibold">ผลการตรวจ</Label>
                            {order.tests.map((test, index) => (
                              <Card key={index} className="border-border/50">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{test.name}</CardTitle>
                                    {getStatusBadge(test.status)}
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`result-${test.id}`}>ผลการตรวจ</Label>
                                    <Textarea
                                      id={`result-${test.id}`}
                                      placeholder="กรอกผลการตรวจ..."
                                      className="min-h-[100px]"
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`reference-${test.id}`}>ค่าอ้างอิง</Label>
                                    <Input
                                      id={`reference-${test.id}`}
                                      placeholder="ค่าปกติ/ช่วงอ้างอิง"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`comment-${test.id}`}>หมายเหตุ</Label>
                                    <Textarea
                                      id={`comment-${test.id}`}
                                      placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                                      className="min-h-[80px]"
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {/* File Upload */}
                          <Card className="shadow-card-custom">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-primary" />
                                แนบไฟล์ผลการตรวจ
                              </CardTitle>
                              <CardDescription>
                                แนบไฟล์รูปภาพหรือ PDF ของผลการตรวจ
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                                <div className="space-y-2">
                                  <Label htmlFor="file-upload" className="cursor-pointer">
                                    <span className="font-medium text-primary">คลิกเพื่อเลือกไฟล์</span>
                                    <span className="text-muted-foreground"> หรือลากไฟล์มาวาง</span>
                                  </Label>
                                  <Input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    รองรับไฟล์: JPG, PNG, PDF (สูงสุด 10MB ต่อไฟล์)
                                  </p>
                                </div>
                              </div>

                              {uploadedFiles.length > 0 && (
                                <div className="space-y-2">
                                  <Label>ไฟล์ที่แนบ:</Label>
                                  <div className="space-y-2">
                                    {uploadedFiles.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 border border-border rounded">
                                        <div className="flex items-center gap-2">
                                          {file.type.includes('image') ? (
                                            <Image className="h-4 w-4 text-primary" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-primary" />
                                          )}
                                          <span className="text-sm">{file.name}</span>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Actions */}
                          <div className="flex gap-3 justify-end">
                            <Button type="button" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              ดาวน์โหลดแบบฟอร์ม
                            </Button>
                            <Button 
                              type="submit"
                              className="bg-gradient-medical hover:opacity-90"
                              disabled={isLoading}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {isLoading ? "กำลังบันทึก..." : "บันทึกผลการตรวจ"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-card-custom">
              <CardContent className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">เลือกรายการที่ต้องการลงผล</h3>
                <p className="text-muted-foreground">
                  กรุณาเลือกรายการจากด้านซ้ายเพื่อเริ่มลงผลการตรวจ
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}