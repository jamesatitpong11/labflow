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
  IdCard,
  CreditCard,
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
  idCardNumber?: string;
  idCard?: string; // Alternative field name
  phone?: string;
  phoneNumber?: string; // Alternative field name
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
      // Debug: Log search query
      console.log('🔍 Searching for:', searchQuery);
      
      // Use optimized API endpoint that does server-side filtering and joining
      const rawData = await apiService.searchMedicalRecords(searchQuery);
      
      // Debug: Log the structure of returned data
      console.log('🔍 Medical Records API Response:', rawData);
      console.log('📊 Response length:', rawData.length);
      
      if (rawData.length > 0) {
        console.log('📋 First record structure:', rawData[0]);
        console.log('🔑 Available fields:', Object.keys(rawData[0]));
      } else {
        console.log('❌ No records found for query:', searchQuery);
        console.log('💡 Try searching with:');
        console.log('   - Patient name (ชื่อคนไข้)');
        console.log('   - Visit number (หมายเลข visit)');
        console.log('   - Phone number (เบอร์โทร)');
      }
      
      // Transform data according to backend structure
      const medicalRecords = rawData.map((record: any) => ({
        id: record.id || record._id?.toString() || '',
        patientName: record.patientName || 'ไม่ระบุชื่อ',
        patientId: record.patientId || '',
        idCardNumber: record.idCardNumber && record.idCardNumber !== 'ไม่ระบุ' ? record.idCardNumber : null,
        idCard: record.idCardNumber && record.idCardNumber !== 'ไม่ระบุ' ? record.idCardNumber : null,
        phone: record.phone && record.phone !== 'ไม่ระบุ' ? record.phone : null,
        phoneNumber: record.phone && record.phone !== 'ไม่ระบุ' ? record.phone : null,
        address: record.address || 'ไม่ระบุที่อยู่',
        lastVisit: record.lastVisit || 'ไม่ระบุ',
        totalVisits: record.totalVisits || 0,
        recentTests: record.recentTests || [],
        status: record.status || 'active',
        visits: record.visits || []
      }));
      
      console.log('✅ Transformed medical records:', medicalRecords);
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
              <Card key={record.id} className="shadow-sm hover:shadow-md transition-all duration-200 border border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">{record.patientName}</h3>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <IdCard className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{record.patientId}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{record.idCardNumber || record.idCard || 'ไม่ระบุ'}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{record.phone || record.phoneNumber || 'ไม่ระบุ'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">ล่าสุด: {record.lastVisit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileCheck className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">รวม: </span>
                          <span className="font-medium text-primary">{record.totalVisits} ครั้ง</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">{getStatusBadge(record.status)}</div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                      className="text-primary hover:bg-primary/5 h-8 px-3 text-sm"
                    >
                      {expandedRecord === record.id ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {expandedRecord === record.id ? 'ซ่อน' : 'ดูประวัติ'}
                    </Button>
                  </div>

                  {/* Visit History - Expandable */}
                  {expandedRecord === record.id && (
                    <div className="mt-4 space-y-3">
                      <Separator />
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          ประวัติการมาตรวจ ({record.visits.length} ครั้ง)
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        {record.visits.map((visit) => (
                          <Card key={visit.visitId} className="border-l-2 border-l-primary">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h5 className="font-medium text-foreground text-sm mb-1">
                                    Visit #{visit.visitNumber}
                                  </h5>
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(visit.visitDate).toLocaleDateString('th-TH')}
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {visit.visitTime}
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      {visit.department}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Lab Orders */}
                              {visit.orders.length > 0 && (
                                <div className="mb-3">
                                  <h6 className="font-medium text-foreground flex items-center gap-1 mb-2 text-xs">
                                    <TestTube className="h-3 w-3 text-primary" />
                                    รายการตรวจ ({visit.orders.length})
                                  </h6>
                                  <div className="grid gap-2">
                                    {visit.orders.map((order) => (
                                      <div key={order.orderId} className="flex items-center justify-between p-2 bg-muted/20 rounded border">
                                        <div className="flex-1">
                                          <span className="font-medium text-foreground text-xs">{order.testName}</span>
                                          <span className="text-xs text-muted-foreground ml-1">({order.testCode})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-primary">฿{order.price.toLocaleString()}</span>
                                          {getOrderStatusBadge(order.status)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Test Results */}
                              {visit.results.length > 0 && (
                                <div className="mb-3">
                                  <h6 className="font-medium text-foreground flex items-center gap-1 mb-2 text-xs">
                                    <FileCheck className="h-3 w-3 text-primary" />
                                    ผลการตรวจ ({visit.results.length})
                                  </h6>
                                  <div className="grid gap-2">
                                    {visit.results.map((result) => (
                                      <div key={result.resultId} className="flex items-center justify-between p-2 bg-muted/20 rounded border">
                                        <div className="flex-1">
                                          <span className="font-medium text-foreground text-xs">{result.testName}</span>
                                          <div className="text-sm font-medium text-foreground mt-1">
                                            {result.result}
                                          </div>
                                          {result.normalRange && (
                                            <span className="text-xs text-muted-foreground">({result.normalRange})</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {getResultStatusBadge(result.status)}
                                          {result.status === 'abnormal' && (
                                            <AlertCircle className="h-3 w-3 text-destructive" />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* No orders or results */}
                              {visit.orders.length === 0 && visit.results.length === 0 && (
                                <div className="text-center py-3 text-muted-foreground">
                                  <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                  <p className="text-xs">ไม่มีข้อมูลการตรวจในครั้งนี้</p>
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
        <div className="text-center py-8">
          <div className="max-w-sm mx-auto">
            <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              ค้นหาเวชระเบียนผู้ป่วย
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              กรอกข้อมูลในช่องค้นหาแล้วกดปุ่ม "ค้นหา" หรือกดปุ่ม "แสดงทั้งหมด"
            </p>
            <div className="bg-muted/20 p-3 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground">
                💡 ค้นหาได้ด้วยชื่อ-นามสกุล เลขบัตรประชาชน รหัสคนไข้ หรือเบอร์โทรศัพท์
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}