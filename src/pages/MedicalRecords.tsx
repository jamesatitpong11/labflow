import { useState, useEffect } from "react";
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
  Eye,
  ChevronDown,
  ChevronUp,
  TestTube,
  FileCheck,
  AlertCircle,
  Download,
  FileImage,
  FileText as FileTextIcon,
  Paperclip
} from "lucide-react";
import { apiService, VisitData } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/toast-helpers";
import { FileViewer } from "@/components/FileViewer";

interface MedicalRecord {
  id: string;
  patientName: string;
  patientId: string;
  idCardNumber: string;
  phone: string;
  address: string;
  lastVisit: string;
  totalVisits: number;
  recentTests: string[];
  status: 'active' | 'inactive';
  visits: VisitDetail[];
}

interface VisitDetail {
  visitId: string;
  visitNumber: string;
  visitDate: string;
  visitTime: string;
  department: string;
  orders: OrderDetail[];
  results: ResultDetail[];
}

interface OrderDetail {
  orderId: string;
  testName: string;
  testCode: string;
  price: number;
  status: string;
}

interface ResultDetail {
  resultId: string;
  testName: string;
  result: string;
  normalRange?: string;
  status: 'normal' | 'abnormal' | 'pending';
  attachedFiles?: AttachedFile[];
}

interface AttachedFile {
  fileName: string;
  fileData: string; // Base64 encoded
  fileType: string;
  uploadDate: string;
}

export default function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<MedicalRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();


  // Search medical records from API based on search term - OPTIMIZED
  const searchMedicalRecords = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Use optimized API endpoint that does server-side filtering and joining
      const medicalRecords = await apiService.searchMedicalRecords(searchQuery);
      setSearchResults(medicalRecords);
      
    } catch (error) {
      console.error('Error searching medical records:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถค้นหาข้อมูลเวชระเบียนได้",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // ลบ useEffect ออกเพื่อไม่ให้โหลดข้อมูลทันทีเมื่อเปิดหน้า
  // useEffect(() => {
  //   loadMedicalRecords();
  // }, []);

  // Handle search button click
  const handleSearchClick = () => {
    searchMedicalRecords(searchTerm);
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setHasSearched(false);
  };

  // Load all medical records - OPTIMIZED
  const loadAllRecords = async () => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchTerm(""); // Clear search term when showing all
    
    try {
      // Use optimized API endpoint that does server-side processing
      const medicalRecords = await apiService.getAllMedicalRecords();
      setSearchResults(medicalRecords);
      
    } catch (error) {
      console.error('Error loading all medical records:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลเวชระเบียนทั้งหมดได้",
      });
    } finally {
      setIsSearching(false);
    }
  };


  const getStatusBadge = (status: string) => {
    return status === "active" 
      ? <Badge className="bg-success/10 text-success hover:bg-success/20">กำลังใช้งาน</Badge>
      : <Badge variant="secondary">ไม่ได้ใช้งาน</Badge>;
  };

  const getResultStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-800">ปกติ</Badge>;
      case 'abnormal':
        return <Badge className="bg-red-100 text-red-800">ผิดปกติ</Badge>;
      default:
        return <Badge variant="outline">รอผล</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">เสร็จสิ้น</Badge>;
      case 'process':
        return <Badge className="bg-blue-100 text-blue-800">กำลังดำเนินการ</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">รอดำเนินการ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const downloadFile = (file: AttachedFile) => {
    try {
      const byteCharacters = atob(file.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.fileType });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดาวน์โหลดไฟล์ได้",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="h-4 w-4" />;
    }
    return <FileTextIcon className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="shadow-card-custom">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            เวชระเบียน
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            ค้นหาด้วยชื่อ-นามสกุล เลขบัตรประชาชน รหัสคนไข้ หรือเบอร์โทรศัพท์
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-foreground mb-2 block">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                  id="search"
                  placeholder="พิมพ์ชื่อ เลขบัตรประชาชน รหัสคนไข้ หรือเบอร์โทรศัพท์"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 h-12 text-base border-2 border-border/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearchClick}
                disabled={isSearching || !searchTerm.trim()}
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSearching && searchTerm ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังค้นหา...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    ค้นหา
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={loadAllRecords}
                disabled={isSearching}
                className="h-12 px-6 border-primary/30 text-primary hover:bg-primary/10"
              >
                {isSearching && !searchTerm ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-primary mr-2"></div>
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    แสดงทั้งหมด
                  </>
                )}
              </Button>
              {hasSearched && (
                <Button 
                  variant="outline"
                  onClick={clearSearch}
                  className="h-12 px-4 border-primary/30 text-primary hover:bg-primary/10"
                >
                  ล้างผลลัพธ์
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              {searchTerm ? `ผลการค้นหา "${searchTerm}" (${searchResults.length} รายการ)` : `เวชระเบียนทั้งหมด (${searchResults.length} รายการ)`}
            </h2>
          </div>

          <div className="space-y-4">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  {searchTerm ? 'กำลังค้นหาข้อมูล...' : 'กำลังโหลดข้อมูลทั้งหมด...'}
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {searchTerm ? (
                  <>
                    <p className="text-muted-foreground">
                      ไม่พบข้อมูลที่ค้นหา "{searchTerm}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      ลองใช้คำค้นหาอื่น เช่น ชื่อ-นามสกุล เลขบัตรประชาชน หรือเบอร์โทรศัพท์
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">ยังไม่มีข้อมูลเวชระเบียนในระบบ</p>
                )}
              </div>
            ) : (
            searchResults.map((record) => (
              <Card key={record.id} className="shadow-card-custom hover:shadow-medical transition-all duration-300 border border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/20">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">{record.patientName}</h3>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            {record.idCardNumber && !record.idCardNumber.toUpperCase().startsWith('NO_ID') && (
                              <span className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                                <User className="h-4 w-4" />
                                บัตรประชาชน: {record.idCardNumber}
                              </span>
                            )}
                            <span className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                              <Phone className="h-4 w-4" />
                              {record.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <TestTube className="h-4 w-4 text-primary" />
                            การตรวจล่าสุด
                          </Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {record.recentTests.map((test, index) => (
                              <Badge key={index} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                                {test}
                              </Badge>
                            ))}
                            {record.recentTests.length === 0 && (
                              <span className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">ยังไม่มีการตรวจ</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/20 p-4 rounded-lg border border-primary/10">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        สถิติการมาใช้บริการ
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">ครั้งล่าสุด:</span>
                          <span className="font-medium text-foreground">{record.lastVisit}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileCheck className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">รวม:</span>
                          <span className="font-bold text-primary">{record.totalVisits} ครั้ง</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                      className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200"
                    >
                      {expandedRecord === record.id ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                      {expandedRecord === record.id ? 'ซ่อนประวัติ' : 'ดูประวัติการมาตรวจ'}
                    </Button>
                  </div>

                  {/* Visit History - Expandable */}
                  {expandedRecord === record.id && (
                    <div className="mt-6 space-y-4">
                      <Separator />
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                        <h4 className="text-lg font-bold text-foreground flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-primary/20">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          ประวัติการมาตรวจ ({record.visits.length} ครั้ง)
                        </h4>
                      </div>
                      
                      <div className="space-y-4">
                        {record.visits.map((visit) => (
                          <Card key={visit.visitId} className="shadow-card-custom border-l-4 border-l-primary">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h5 className="font-bold text-foreground text-lg mb-2">
                                    Visit #{visit.visitNumber}
                                  </h5>
                                  <div className="flex items-center gap-6 text-sm">
                                    <span className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-primary">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(visit.visitDate).toLocaleDateString('th-TH')}
                                    </span>
                                    <span className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-primary">
                                      <Clock className="h-4 w-4" />
                                      {visit.visitTime}
                                    </span>
                                    <span className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full text-primary">
                                      <User className="h-4 w-4" />
                                      {visit.department}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Lab Orders */}
                              {visit.orders.length > 0 && (
                                <div className="mb-6">
                                  <h6 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-base">
                                    <TestTube className="h-5 w-5 text-primary" />
                                    รายการตรวจ ({visit.orders.length} รายการ)
                                  </h6>
                                  <div className="grid gap-3">
                                    {visit.orders.map((order) => (
                                      <div key={order.orderId} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-primary/10 hover:bg-muted/30 transition-colors">
                                        <div className="flex-1">
                                          <span className="font-semibold text-foreground">{order.testName}</span>
                                          <span className="text-sm text-muted-foreground ml-2 bg-muted/50 px-2 py-1 rounded">({order.testCode})</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-lg font-bold text-primary">฿{order.price.toLocaleString()}</span>
                                          {getOrderStatusBadge(order.status)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Test Results */}
                              {visit.results.length > 0 && (
                                <div>
                                  <h6 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-base">
                                    <FileCheck className="h-5 w-5 text-success" />
                                    ผลการตรวจ ({visit.results.length} รายการ)
                                  </h6>
                                  <div className="grid gap-3">
                                    {visit.results.map((result) => (
                                      <div key={result.resultId} className="flex items-center justify-between p-4 bg-success/5 rounded-lg border border-success/20 hover:bg-success/10 transition-colors">
                                        <div className="flex-1">
                                          <span className="font-semibold text-foreground">{result.testName}</span>
                                          <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span>ผลตรวจ:</span>
                                              <span className="font-bold text-foreground bg-muted/50 px-2 py-1 rounded">{result.result}</span>
                                            </div>
                                            {result.normalRange && (
                                              <div className="flex items-center gap-2">
                                                <span>ค่าปกติ:</span>
                                                <span className="text-muted-foreground">{result.normalRange}</span>
                                              </div>
                                            )}
                                          </div>
                                          
                                          {/* Attached Files */}
                                          {result.attachedFiles && result.attachedFiles.length > 0 && (
                                            <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-muted/30">
                                              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                                <Paperclip className="h-4 w-4 text-primary" />
                                                ไฟล์แนบ ({result.attachedFiles.length} ไฟล์)
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                {result.attachedFiles.map((file, fileIndex) => (
                                                  <div key={fileIndex} className="flex gap-2">
                                                    <FileViewer file={file} />
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className="h-8 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                                      onClick={() => downloadFile(file)}
                                                    >
                                                      <Download className="h-3 w-3 mr-1" />
                                                      ดาวน์โหลด
                                                    </Button>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {getResultStatusBadge(result.status)}
                                          {result.status === 'abnormal' && (
                                            <div className="p-1 rounded-full bg-destructive/20">
                                              <AlertCircle className="h-5 w-5 text-destructive" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* No orders or results */}
                              {visit.orders.length === 0 && visit.results.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">ไม่มีข้อมูลการตรวจในครั้งนี้</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </div>
      )}

      {/* Initial State - ยังไม่ได้ค้นหา */}
      {!hasSearched && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="p-6 rounded-full bg-primary/10 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Search className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              ค้นหาเวชระเบียนผู้ป่วย
            </h3>
            <p className="text-muted-foreground mb-6">
              กรอกข้อมูลในช่องค้นหาแล้วกดปุ่ม "ค้นหา" เพื่อค้นหาเวชระเบียนของผู้ป่วย<br />
              หรือกดปุ่ม "แสดงทั้งหมด" เพื่อดูเวชระเบียนทั้งหมดในระบบ
            </p>
            <div className="bg-muted/20 p-4 rounded-lg border border-primary/10">
              <p className="text-sm text-muted-foreground">
                💡 <strong>คำแนะนำ:</strong> ค้นหาได้ด้วยชื่อ-นามสกุล เลขบัตรประชาชน รหัสคนไข้ หรือเบอร์โทรศัพท์
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-foreground">ตัวอย่างการค้นหา:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-xs">สมชาย ใจดี</Badge>
                <Badge variant="outline" className="text-xs">1234567890123</Badge>
                <Badge variant="outline" className="text-xs">P001</Badge>
                <Badge variant="outline" className="text-xs">081-234-5678</Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}