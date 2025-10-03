import { useState, useEffect } from "react";
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
  Calendar,
  X
} from "lucide-react";
import { apiService, OrderData, ResultData } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { showSuccessToast, showErrorToast, showWarningToast } from "@/lib/toast-helpers";


export default function LabResults() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { result: string; referenceRange: string; comment: string }>>({});
  const { toast } = useToast();

  // Load orders with 'process' status
  const loadProcessOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const allOrders = await apiService.getOrders();
      // Filter orders with 'process' status
      const processOrders = allOrders.filter(order => order.status === 'process');
      setOrders(processOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการรอผลได้",
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadProcessOrders();
  }, []);

  const filteredOrders = orders.filter(order =>
    (order.visitData?.patientName && order.visitData.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.visitData?.visitNumber && order.visitData.visitNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const validFiles: File[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxFileSize) {
        showErrorToast({
          title: "ไฟล์ใหญ่เกินไป",
          description: `ไฟล์ ${file.name} มีขนาด ${(file.size / 1024 / 1024).toFixed(2)}MB เกินขีดจำกัด 10MB`,
        });
        continue;
      }

      // Check file type
      if (!file.type || !allowedTypes.includes(file.type)) {
        showErrorToast({
          title: "ประเภทไฟล์ไม่รองรับ",
          description: `ไฟล์ ${file.name} ประเภท ${file.type} ไม่รองรับ กรุณาใช้ไฟล์ JPG, PNG, GIF, WEBP หรือ PDF`,
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => {
        const newFiles = [...prev, ...validFiles];
        
        // Calculate total file size and warn if it might be too large
        const totalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
        const estimatedBase64Size = totalSize * 1.33; // Base64 encoding increases size by ~33%
        const maxRecommendedSize = 30 * 1024 * 1024; // 30MB recommended limit
        
        if (estimatedBase64Size > maxRecommendedSize) {
          showWarningToast({
            title: "คำเตือน: ไฟล์มีขนาดใหญ่",
            description: `ไฟล์ทั้งหมดมีขนาดรวม ${(totalSize / 1024 / 1024).toFixed(1)}MB อาจทำให้การบันทึกล้มเหลว กรุณาพิจารณาลดขนาดไฟล์`,
          });
        }
        
        return newFiles;
      });
      
      showSuccessToast({
        title: "อัปโหลดไฟล์สำเร็จ",
        description: `อัปโหลด ${validFiles.length} ไฟล์เรียบร้อยแล้ว`,
      });
    }

    // Reset input value to allow re-uploading same file
    event.target.value = '';
  };

  // Remove uploaded file
  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    showSuccessToast({
      title: "ลบไฟล์สำเร็จ",
      description: "ลบไฟล์ออกจากรายการแล้ว",
    });
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a fake event to reuse handleFileUpload logic
      const fakeEvent = {
        target: { files, value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileUpload(fakeEvent);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleTestResultChange = (testId: string, field: string, value: string) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value
      }
    }));
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsLoading(true);
    try {
      const selectedOrderData = orders.find(o => o._id === selectedOrder);
      if (!selectedOrderData) {
        throw new Error('ไม่พบข้อมูล Order');
      }

      console.log('Selected order data:', selectedOrderData);
      console.log('Lab orders:', selectedOrderData.labOrders);

      if (!selectedOrderData.labOrders || !Array.isArray(selectedOrderData.labOrders) || selectedOrderData.labOrders.length === 0) {
        throw new Error('ไม่พบรายการตรวจในคำสั่งนี้');
      }

      // Prepare test results data
      const testResultsData = selectedOrderData.labOrders.map(labOrder => {
        const testResult = testResults[labOrder.testId] || { result: '', referenceRange: '', comment: '' };
        return {
          testId: labOrder.testId || '',
          testName: labOrder.testName || '',
          result: testResult.result || '',
          referenceRange: testResult.referenceRange || '',
          comment: testResult.comment || '',
          status: 'completed' as const
        };
      });

      console.log('Prepared test results data:', testResultsData);

      // Process uploaded files
      const attachedFiles = [];
      for (const file of uploadedFiles) {
        try {
          const fileData = await fileToBase64(file);
          attachedFiles.push({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: fileData
          });
        } catch (error) {
          console.error('Error processing file:', file.name, error);
        }
      }

      // Create result data
      const resultData: Omit<ResultData, '_id' | 'createdAt' | 'updatedAt'> = {
        orderId: selectedOrder,
        testResults: testResultsData,
        attachedFiles: attachedFiles,
        technician: 'Current User', // TODO: Get from user context
        notes: '',
        resultDate: new Date()
      };

      console.log('Sending result data:', {
        orderId: selectedOrder,
        testResultsCount: testResultsData.length,
        attachedFilesCount: attachedFiles.length,
        testResults: testResultsData,
        attachedFiles: attachedFiles.map(f => ({ fileName: f.fileName, fileType: f.fileType, fileSize: f.fileSize }))
      });

      // Save to database
      await apiService.createResult(resultData);

      showSuccessToast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกผลการตรวจเรียบร้อยแล้ว",
      });

      // Reset form and reload orders
      setSelectedOrder(null);
      setTestResults({});
      setUploadedFiles([]);
      await loadProcessOrders();

    } catch (error) {
      console.error('Error saving results:', error);
      
      let errorMessage = "ไม่สามารถบันทึกผลการตรวจได้";
      
      if (error instanceof Error) {
        if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
          errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ";
        } else if (error.message && error.message.includes('500')) {
          errorMessage = "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาตรวจสอบ console สำหรับรายละเอียด";
        } else if (error.message && (error.message.includes('PayloadTooLargeError') || error.message.includes('request entity too large'))) {
          errorMessage = "ไฟล์ที่แนบมีขนาดใหญ่เกินไป กรุณาลดขนาดไฟล์หรือแนบไฟล์น้อยลง";
        } else {
          errorMessage = error.message;
        }
      }
      
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "completed" 
      ? <Badge className="bg-success/10 text-success hover:bg-success/20">เสร็จแล้ว</Badge>
      : <Badge variant="secondary">รอผล</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card-custom border border-primary/20">
        <CardHeader className="bg-gradient-medical text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">ลงผลการตรวจ</CardTitle>
              <CardDescription className="text-white/80 mt-1">
                บันทึกผลการตรวจและแนบไฟล์รายงาน
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-card-custom border border-primary/20">
            <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
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
                  {isLoadingOrders ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">กำลังโหลดรายการ...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">ไม่มีรายการรอผล</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div
                        key={order._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/30 ${
                          selectedOrder === order._id 
                            ? "border-primary bg-primary/5" 
                            : "border-border"
                        }`}
                        onClick={() => setSelectedOrder(order._id!)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">
                              {order.visitData?.patientName || 'ไม่ระบุชื่อ'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {order._id?.slice(-6) || 'N/A'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Visit: {order.visitData?.visitNumber || 'N/A'}</p>
                            <p className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              วันที่สั่ง: {new Date(order.orderDate).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {order.labOrders.map((labOrder, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary"
                                className="text-xs"
                              >
                                {labOrder.testName}
                                {labOrder.type === 'package' && (
                                  <span className="ml-1 text-blue-600">📦</span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
              <Card className="shadow-card-custom border border-primary/20">
                <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    ลงผลการตรวจ - {selectedOrder}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const order = orders.find(o => o._id === selectedOrder);
                    return order ? (
                      <div className="space-y-4">
                        <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">คนไข้:</span>
                              <span className="ml-2">{order.visitData?.patientName || 'ไม่ระบุชื่อ'}</span>
                            </div>
                            <div>
                              <span className="font-medium">Visit Number:</span>
                              <span className="ml-2">{order.visitData?.visitNumber || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium">Order ID:</span>
                              <span className="ml-2">{order._id?.slice(-8) || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="font-medium">วันที่สั่ง:</span>
                              <span className="ml-2">{new Date(order.orderDate).toLocaleDateString('th-TH')}</span>
                            </div>
                            <div>
                              <span className="font-medium">สถานะ:</span>
                              <Badge className="ml-2" variant="secondary">
                                {order.status === 'process' ? 'กำลังดำเนินการ' : order.status}
                              </Badge>
                            </div>
                            <div>
                              <span className="font-medium">ยอดรวม:</span>
                              <span className="ml-2">฿{order.totalAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <form onSubmit={handleSaveResults} className="space-y-6">
                          {/* Test Results */}
                          <div className="space-y-4">
                            <Label className="text-lg font-semibold">ผลการตรวจ</Label>
                            {order.labOrders.map((labOrder, index) => (
                              <Card key={index} className="border border-primary/20">
                                <CardHeader className="pb-3 bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      {labOrder.testName}
                                      {labOrder.type === 'package' && (
                                        <Badge variant="outline" className="text-xs">แพ็กเกจ</Badge>
                                      )}
                                    </CardTitle>
                                    <Badge variant="secondary">รอผล</Badge>
                                  </div>
                                  {labOrder.code && (
                                    <p className="text-sm text-muted-foreground">รหัส: {labOrder.code}</p>
                                  )}
                                  
                                  {/* Show individual tests for packages */}
                                  {labOrder.type === 'package' && labOrder.individualTests && labOrder.individualTests.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-sm font-medium mb-1">รายการตรวจในแพ็กเกจ:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {labOrder.individualTests.map((test, testIndex) => (
                                          <Badge key={testIndex} variant="outline" className="text-xs">
                                            {test?.name || 'ไม่ระบุชื่อ'}
                                            {test?.code && ` (${test.code})`}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`result-${labOrder.testId}`}>ผลการตรวจ</Label>
                                    <Textarea
                                      id={`result-${labOrder.testId}`}
                                      placeholder="กรอกผลการตรวจ..."
                                      className="min-h-[100px]"
                                      value={testResults[labOrder.testId]?.result || ''}
                                      onChange={(e) => handleTestResultChange(labOrder.testId, 'result', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`reference-${labOrder.testId}`}>ค่าอ้างอิง</Label>
                                    <Input
                                      id={`reference-${labOrder.testId}`}
                                      placeholder="ค่าปกติ/ช่วงอ้างอิง"
                                      value={testResults[labOrder.testId]?.referenceRange || ''}
                                      onChange={(e) => handleTestResultChange(labOrder.testId, 'referenceRange', e.target.value)}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`comment-${labOrder.testId}`}>หมายเหตุ</Label>
                                    <Textarea
                                      id={`comment-${labOrder.testId}`}
                                      placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                                      className="min-h-[80px]"
                                      value={testResults[labOrder.testId]?.comment || ''}
                                      onChange={(e) => handleTestResultChange(labOrder.testId, 'comment', e.target.value)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {/* File Upload */}
                          <Card className="shadow-card-custom border border-primary/20">
                            <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                              <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-primary" />
                                แนบไฟล์ผลการตรวจ
                              </CardTitle>
                              <CardDescription>
                                แนบไฟล์รูปภาพหรือ PDF ของผลการตรวจ
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div 
                                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                              >
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
                                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    รองรับไฟล์: JPG, JPEG, PNG, GIF, WEBP, PDF (สูงสุด 10MB ต่อไฟล์)
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
                                          {file.type && file.type.includes('image') ? (
                                            <Image className="h-4 w-4 text-primary" />
                                          ) : (
                                            <FileText className="h-4 w-4 text-primary" />
                                          )}
                                          <span className="text-sm">{file.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button variant="ghost" size="sm" title="ดูไฟล์">
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => removeUploadedFile(index)}
                                            className="text-destructive hover:text-destructive"
                                            title="ลบไฟล์"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
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
            <Card className="shadow-card-custom border border-primary/20">
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