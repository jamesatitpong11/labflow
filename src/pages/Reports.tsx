import { useState, useEffect, useMemo, useCallback } from "react";
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
  DollarSign,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const reportTypes = [
  { id: "vts", name: "รายงานผู้เข้ารับบริการ (VTS)", description: "รายละเอียดผู้เข้ารับบริการ" },
  { id: "salelab", name: "รายงานการขาย (SaleLab)", description: "รายละเอียดการขาย" },
  { id: "lab", name: "รายงานการตรวจ (Lab)", description: "รายละเอียดการตรวจ" },
];

export default function Reports() {
  const { toast } = useToast();
  
  const [selectedReport, setSelectedReport] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Memoized report type for better performance
  const currentReportType = useMemo(() => {
    return reportTypes.find(r => r.id === selectedReport);
  }, [selectedReport]);
  
  // Display dates in Thai format
  const [dateFromDisplay, setDateFromDisplay] = useState("");
  const [dateToDisplay, setDateToDisplay] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Get today's date functions for Buddhist Era (พ.ศ.)
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getTodayThaiFormat = () => {
    const todayDate = new Date();
    const day = todayDate.getDate().toString().padStart(2, '0');
    const month = (todayDate.getMonth() + 1).toString().padStart(2, '0');
    const year = todayDate.getFullYear() + 543; // Convert to Buddhist Era (พ.ศ.)
    return `${day}/${month}/${year}`;
  };

  // Departments state
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([
    { id: "all", name: "ทุกหน่วยงาน" }
  ]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  
  // Report data state
  const [reportStats, setReportStats] = useState({
    todayPatients: 0,
    todayTests: 0,
    todayRevenue: 0,
    growth: 0,
  });
  
  const [reportData, setReportData] = useState<Array<{
    date: string;
    patients: number;
    tests: number;
    revenue: number;
    department?: string;
    status: string;
  }>>([]);
  const [visitorData, setVisitorData] = useState<Array<{
    visitNumber?: string;
    referenceNumber?: string;
    ln: string;
    idCard: string;
    title?: string;
    prefix?: string;
    firstName: string;
    lastName: string;
    age: number;
    birthdate: string;
    gender: string;
    phoneNumber?: string;
    phone?: string;
    weight: string;
    height: string;
    bloodPressure: string;
    pulse: string;
    address: string;
    department: string;
    referringOrganization?: string;
    organization?: string;
    patientRights?: string;
    rights?: string;
    patientCreatedAt: string;
    visitDate: string;
  }>>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [itemColumns, setItemColumns] = useState<string[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Load departments and initialize dates on component mount
  useEffect(() => {
    loadDepartments();
    
    // Set default date range to today only
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    
    setDateFrom(todayISO);
    setDateTo(todayISO);
    setDateFromDisplay(convertFromInputDate(todayISO));
    setDateToDisplay(convertFromInputDate(todayISO));
  }, []);

  const loadDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const departmentsData = await apiService.getDepartments();
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลหน่วยงานได้",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast({
        title: "กรุณาเลือกประเภทรายงาน",
        description: "โปรดเลือกประเภทรายงานก่อนสร้างรายงาน",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIsLoadingReport(true);

    try {
      console.log('Generating report with params:', {
        reportType: selectedReport,
        dateFrom,
        dateTo,
        department: selectedDepartment
      });

      const response = await apiService.getReportData({
        reportType: selectedReport,
        dateFrom,
        dateTo,
        department: selectedDepartment
      });
      
      console.log('API response:', response);
      
      setReportStats(response.stats);
      
      if (selectedReport === 'vts') {
        console.log('Setting visitor data:', response.data);
        setVisitorData(response.data || []);
        setReportData([]);
        setSalesData([]);
        setItemColumns([]);
      } else if (selectedReport === 'salelab') {
        setSalesData(response.data || []);
        setItemColumns((response as any).itemColumns || []);
        setReportData([]);
        setVisitorData([]);
      } else if (selectedReport === 'lab') {
        console.log('Setting lab data:', response.data);
        setVisitorData(response.data || []);
        setReportData([]);
        setSalesData([]);
        setItemColumns([]);
      } else {
        setReportData(response.data || []);
        setVisitorData([]);
        setSalesData([]);
        setItemColumns([]);
      }
      
      toast({
        title: "สร้างรายงานสำเร็จ",
        description: `ได้สร้างรายงาน${reportTypes.find(r => r.id === selectedReport)?.name}แล้ว`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างรายงานได้",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsLoadingReport(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedReport) {
      toast({
        title: "กรุณาเลือกประเภทรายงาน",
        description: "โปรดเลือกประเภทรายงานก่อนส่งออก",
        variant: "destructive",
      });
      return;
    }

    // Show loading state
    setIsGenerating(true);

    try {
      toast({
        title: "กำลังสร้างไฟล์ Excel",
        description: "กรุณารอสักครู่...",
      });

      const blob = await apiService.exportReportExcel({
        reportType: selectedReport,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        department: selectedDepartment || undefined,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create descriptive filename
      const reportName = reportTypes.find(r => r.id === selectedReport)?.name || selectedReport;
      const dateRange = dateFrom && dateTo 
        ? `${dateFrom}_${dateTo}` 
        : new Date().toISOString().split('T')[0];
      const departmentSuffix = selectedDepartment && selectedDepartment !== 'all' 
        ? `_${selectedDepartment}` 
        : '';
      
      link.download = `${reportName}_${dateRange}${departmentSuffix}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "ส่งออกสำเร็จ",
        description: `ไฟล์ Excel "${reportName}" ได้ถูกดาวน์โหลดแล้ว`,
      });

    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      
      // More detailed error handling
      let errorMessage = "ไม่สามารถส่งออกไฟล์ Excel ได้";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedReport) {
      toast({
        title: "กรุณาเลือกประเภทรายงาน",
        description: "โปรดเลือกประเภทรายงานก่อนส่งออก",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await apiService.exportReportPDF({
        reportType: selectedReport,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        department: selectedDepartment || undefined,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${selectedReport}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "ส่งออกสำเร็จ",
        description: "ไฟล์ PDF ได้ถูกดาวน์โหลดแล้ว",
      });

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกไฟล์ PDF ได้",
        variant: "destructive",
      });
    }
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('th-TH');
  };

  // Format date to DD/MM/YYYY (Buddhist Era - พ.ศ.)
  const formatDateThai = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // ตรวจสอบว่า date ถูกต้องหรือไม่
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return dateString; // ส่งคืน string เดิมถ้า parse ไม่ได้
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    return `${day}/${month}/${year}`;
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for input value
  const convertToInputDate = (thaiDate: string) => {
    if (!thaiDate) return '';
    const [day, month, year] = thaiDate.split('/');
    if (!day || !month || !year) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const convertFromInputDate = (inputDate: string) => {
    if (!inputDate) return '';
    const [year, month, day] = inputDate.split('-');
    if (!year || !month || !day) return '';
    return `${day}/${month}/${year}`;
  };

  // Calculate total revenue from report data (excluding free items for saleslab)
  const calculateTotalRevenue = useCallback(() => {
    if (selectedReport === 'salelab') {
      return salesData
        .filter(sale => sale.paymentMethod !== 'ฟรี') // Exclude free items
        .reduce((total, sale) => total + (sale.totalAmount || 0), 0);
    } else if (selectedReport === 'vts' || selectedReport === 'lab') {
      // For VTS and Lab reports, we don't have revenue data
      return 0;
    } else {
      return reportData.reduce((total, row) => total + (row.revenue || 0), 0);
    }
  }, [selectedReport, salesData, reportData, visitorData]);

  // Optimized date change handlers
  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setDateFromDisplay(convertFromInputDate(value));
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setDateToDisplay(convertFromInputDate(value));
  }, []);

  return (
    <div className="space-y-3 p-2">
      {/* Compact Header */}
      <Card className="shadow-sm border border-primary/20">
        <CardHeader className="bg-gradient-medical text-white p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">รายงาน</CardTitle>
              <CardDescription className="text-white/80 text-xs">
                สร้างและส่งออกรายงานต่างๆ
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Report Configuration */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="shadow-sm border border-primary/20">
            <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 p-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="h-4 w-4 text-primary" />
                ตั้งค่ารายงาน
              </CardTitle>
              <CardDescription className="text-xs">
                เลือกประเภทรายงาน ช่วงวันที่ และหน่วยงาน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-1">
                <Label htmlFor="report-type" className="text-xs">ประเภทรายงาน</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger className="h-8 text-xs">
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

              <div className="space-y-1">
                <Label htmlFor="date-from" className="text-xs">วันที่เริ่มต้น</Label>
                <div className="relative">
                  <Input 
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="text-transparent h-8"
                  />
                  <div className="absolute inset-0 flex items-center px-3 pointer-events-none bg-transparent">
                    <span className="text-foreground text-xs">
                      {dateFromDisplay || 'เลือกวันที่'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="date-to" className="text-xs">วันที่สิ้นสุด</Label>
                <div className="relative">
                  <Input 
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="text-transparent h-8"
                  />
                  <div className="absolute inset-0 flex items-center px-3 pointer-events-none bg-transparent">
                    <span className="text-foreground text-xs">
                      {dateToDisplay || 'เลือกวันที่'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="department" className="text-xs">หน่วยงาน</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={isLoadingDepartments ? "กำลังโหลด..." : "เลือกหน่วยงาน"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-3">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={!selectedReport || isGenerating}
                  className="w-full bg-gradient-medical hover:opacity-90 h-8 text-xs"
                  size="sm"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {isGenerating ? "กำลังสร้าง..." : "สร้างรายงาน"}
                </Button>
                
                <Button 
                  onClick={handleExportExcel}
                  disabled={!selectedReport || isGenerating}
                  variant="outline"
                  className="w-full h-8 text-xs"
                  size="sm"
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                  )}
                  {isGenerating ? "กำลังสร้าง..." : "ส่งออก Excel"}
                </Button>
              </div>
            </CardContent>
          </Card>          
        </div>

        {/* Report Display */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <>
              {/* Compact Stats Cards */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Card className="shadow-sm border border-primary/20">
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">คนไข้วันนี้</p>
                        <p className="text-lg font-bold text-foreground">
                          {selectedReport === 'vts' || selectedReport === 'lab' ? visitorData.length : 
                           selectedReport === 'salelab' ? salesData.filter(sale => sale.paymentMethod !== 'ฟรี').length : 
                           reportData.length}
                        </p>
                      </div>
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>


                <Card className="shadow-sm border border-primary/20">
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">รายได้วันนี้</p>
                        <p className="text-lg font-bold text-foreground">฿{formatCurrency(calculateTotalRevenue())}</p>
                      </div>
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Report Table */}
              <Card className="shadow-sm border border-primary/20">
                <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 p-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {currentReportType?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="overflow-x-auto">
                    {selectedReport === 'vts' ? (
                      // Visitor Report Table
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">เลข visit</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">LN</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[100px]">เลขบัตรประชาชน</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">คำนำหน้า</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">ชื่อ</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">นามสกุล</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">อายุ</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">วันเกิด</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">เพศ</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">เบอร์โทร</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">น้ำหนัก</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">ส่วนสูง</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">ความดันโลหิต</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">ชีพจร</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[120px]">ที่อยู่</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[100px]">หน่วยงาน</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[100px]">ส่งตรวจจาก</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">สิทธิ</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[100px]">วันที่ลงทะเบียน</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[100px]">วันที่มาตรวจ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingReport ? (
                            <tr>
                              <td colSpan={20} className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  <span className="text-muted-foreground text-xs">กำลังโหลดข้อมูลรายงาน...</span>
                                </div>
                              </td>
                            </tr>
                          ) : visitorData.length === 0 ? (
                            <tr>
                              <td colSpan={20} className="p-4 text-center text-muted-foreground text-xs">
                                ไม่มีข้อมูลผู้เข้ารับบริการในช่วงวันที่ที่เลือก
                              </td>
                            </tr>
                          ) : (
                            visitorData.map((visitor, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/30">
                                <td className="p-2 text-xs font-medium">{visitor.referenceNumber || visitor.visitNumber || '-'}</td>
                                <td className="p-2 text-xs">{visitor.ln || '-'}</td>
                                <td className="p-2 text-xs">{visitor.idCard && !visitor.idCard.startsWith('NO_ID') ? visitor.idCard : ''}</td>
                                <td className="p-2 text-xs">{visitor.title || visitor.prefix || '-'}</td>
                                <td className="p-2 text-xs">{visitor.firstName || '-'}</td>
                                <td className="p-2 text-xs">{visitor.lastName || '-'}</td>
                                <td className="p-2 text-xs text-center">{visitor.age || '-'}</td>
                                <td className="p-2 text-xs">{visitor.birthdate || '-'}</td>
                                <td className="p-2 text-xs text-center">{visitor.gender || '-'}</td>
                                <td className="p-2 text-xs">{visitor.phoneNumber || visitor.phone || '-'}</td>
                                <td className="p-2 text-xs text-center">{visitor.weight || '-'}</td>
                                <td className="p-2 text-xs text-center">{visitor.height || '-'}</td>
                                <td className="p-2 text-xs text-center">{visitor.bloodPressure || '-'}</td>
                                <td className="p-2 text-xs text-center">{visitor.pulse || '-'}</td>
                                <td className="p-2 text-xs max-w-[150px] truncate" title={visitor.address}>{visitor.address || '-'}</td>
                                <td className="p-2 text-xs">{visitor.department || '-'}</td>
                                <td className="p-2 text-xs">{visitor.referringOrganization || visitor.organization || '-'}</td>
                                <td className="p-2 text-xs">{visitor.patientRights || visitor.rights || '-'}</td>
                                <td className="p-2 text-xs">{visitor.patientCreatedAt ? formatDateThai(visitor.patientCreatedAt) : '-'}</td>
                                <td className="p-2 text-xs">{visitor.visitDate ? formatDateThai(visitor.visitDate) : '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    ) : selectedReport === 'lab' ? (
                      // Lab Report Table
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">LN</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">HN</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">คำนำหน้า</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">ชื่อ</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">นามสกุล</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">เพศ</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">อายุ</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">ส่วนสูง</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">สิทธิ์</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">CBC</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">ABO</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">BUN</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Creatinine</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">AST</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">ALT</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">ALP</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">eGFR</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">FBS</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">HDL</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">LDL</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Triglyceride</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Cholesterol</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Uric acid</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">AFP</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Anti HAV</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Anti HCV</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Anti HBs</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Anti HIV screening</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">CA125</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">CA15-3</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">CA19-9</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">CEA</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">FT3</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">FT4</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">HBs Ag</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">PSA</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">TSH</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Influenza A</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Influenza B</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">RSV</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[70px]">SARS-COV-2</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Dengue IgM</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Dengue IgG</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[70px]">Dengue Ns1 Ag</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[70px]">Leptospira IgG</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[70px]">Leptospira IgM</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[90px]">Methamphetamine</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Pregnancy test</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">Albumin</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">Amylase</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">Calcium</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Cholinesterase</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">CK-MB</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">CPK</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Cystatin-C</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Direct Bilirubin</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">GGT</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">Globulin</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">HbA1C</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Homocysteine</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">hs-CRP</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">CRP</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">LDH</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Magnesium</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Phosphorus</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Total Bilirubin</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Total Protein</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Microalbumin</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Beta - HCG</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">NSE</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">VDRL (RPR)</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[70px]">Progesterone</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[90px]">Rheumatoid Factor</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">D-dimer</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Hb typing</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">HPV DNA</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">FOB Test</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Urine Analysis</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[60px]">Rh Type</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[100px]">ตรวจการแข็งตัวของเลือด Prothrombin Time (PT)</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">PTT</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[100px]">ตรวจระยะเวลาการแข็งตัวของเลือด (INR)</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">DTX</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Stool Culture</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[70px]">Chest X-ray</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[80px]">Stool Examination</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[40px]">FSH</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[50px]">Prolactin</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[70px]">Testosterone</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[100px]">Pharmacogenetics</th>
                            <th className="text-left p-2 font-medium text-foreground text-xs min-w-[70px]">Vitamin D</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingReport ? (
                            <tr>
                              <td colSpan={95} className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  <span className="text-muted-foreground text-xs">กำลังโหลดข้อมูลรายงาน...</span>
                                </div>
                              </td>
                            </tr>
                          ) : visitorData.length === 0 ? (
                            <tr>
                              <td colSpan={95} className="p-4 text-center text-muted-foreground text-xs">
                                ไม่มีข้อมูลการตรวจในช่วงวันที่ที่เลือก
                              </td>
                            </tr>
                          ) : (
                            visitorData.map((visitor, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/30">
                                <td className="p-2 text-xs">{visitor.visitNumber || '-'}</td>
                                <td className="p-2 text-xs">{visitor.ln || '-'}</td>
                                <td className="p-2 text-xs">{visitor.title || '-'}</td>
                                <td className="p-2 text-xs">{visitor.firstName || '-'}</td>
                                <td className="p-2 text-xs">{visitor.lastName || '-'}</td>
                                <td className="p-2 text-xs">{visitor.gender || '-'}</td>
                                <td className="p-2 text-xs">{visitor.age || '-'}</td>
                                <td className="p-2 text-xs">{visitor.height || '-'}</td>
                                <td className="p-2 text-xs">{visitor.rights || '-'}</td>
                                {/* Lab test columns - populated from Orders data */}
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.CBC ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.ABO ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.BUN ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Creatinine ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.AST ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.ALT ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.ALP ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.eGFR ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.FBS ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.HDL ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.LDL ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Triglyceride ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Cholesterol ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Uric acid'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.AFP ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Anti HAV'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Anti HCV'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Anti HBs'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Anti HIV'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.CA125 ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['CA15-3'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['CA19-9'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.CEA ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.FT3 ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.FT4 ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['HBs Ag'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.PSA ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.TSH ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Influenza A'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Influenza B'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.RSV ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['SARS-COV-2'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Dengue IgM'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Dengue IgG'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Dengue Ns1 Ag'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Leptospira IgG'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Leptospira IgM'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Methamphetamine ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Pregnancy test'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Albumin ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Amylase ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Calcium ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Cholinesterase ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['CK-MB'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.CPK ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Cystatin-C'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Direct Bilirubin'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.GGT ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Globulin ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.HbA1C ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Homocysteine ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['hs-CRP'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.CRP ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.LDH ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Magnesium ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Phosphorus ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Total Bilirubin'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Total Protein'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Microalbumin ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Beta - HCG'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.NSE ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['VDRL (RPR)'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Progesterone ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Rheumatoid Factor'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['D-dimer'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Hb typing'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['HPV DNA'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['FOB Test'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Urine Analysis'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Rh Type'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.PT ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.PTT ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.INR ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.DTX ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Stool Culture'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Chest X-ray'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Stool Examination'] ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.FSH ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Prolactin ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Testosterone ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.Pharmacogenetics ? '1' : '-'}</td>
                                <td className="p-2 text-xs text-center">{(visitor as any).labTests?.['Vitamin D'] ? '1' : '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    ) : selectedReport === 'salelab' ? (
                      // Sales Report Table with Dynamic Columns
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">เลขอ้างอิง</th>
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">LN</th>
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">คำนำหน้า</th>
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">ชื่อ</th>
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">นามสกุล</th>
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">อายุ</th>
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">สิทธิ</th>
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">วันที่</th>
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">วิธีการชำระเงิน</th>
                            {itemColumns.map((columnName, index) => (
                              <th key={index} className="text-left p-2 font-medium text-muted-foreground text-xs">
                                {columnName}
                              </th>
                            ))}
                            <th className="text-left p-2 font-medium text-muted-foreground text-xs">รวมเงิน</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingReport ? (
                            <tr>
                              <td colSpan={10 + itemColumns.length} className="p-8 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  <span className="text-muted-foreground">กำลังโหลดข้อมูลรายงาน...</span>
                                </div>
                              </td>
                            </tr>
                          ) : salesData.length === 0 ? (
                            <tr>
                              <td colSpan={10 + itemColumns.length} className="p-8 text-center text-muted-foreground">
                                ไม่มีข้อมูลการขายในช่วงวันที่ที่เลือก
                              </td>
                            </tr>
                          ) : (
                            salesData.map((sale, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/30">
                                <td className="p-2 text-xs">{sale.visitNumber || '-'}</td>
                                <td className="p-2 text-xs">{sale.ln || '-'}</td>
                                <td className="p-2 text-xs">{sale.title || '-'}</td>
                                <td className="p-2 text-xs">{sale.firstName || '-'}</td>
                                <td className="p-2 text-xs">{sale.lastName || '-'}</td>
                                <td className="p-2 text-xs">{sale.age || '-'}</td>
                                <td className="p-2 text-xs">{sale.patientRights || '-'}</td>
                                <td className="p-2 text-xs">{sale.orderDate ? formatDateThai(sale.orderDate) : '-'}</td>
                                <td className="p-2 text-xs">{sale.paymentMethod || '-'}</td>
                                {itemColumns.map((columnName, colIndex) => (
                                  <td key={colIndex} className="p-2 text-xs text-center">
                                    {sale[`item_${columnName}`] > 0 ? `฿${sale[`item_${columnName}`].toLocaleString()}` : '-'}
                                  </td>
                                ))}
                                <td className="p-2 text-xs font-medium">฿{sale.totalAmount?.toLocaleString() || '0'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    ) : (
                      // Regular Report Table
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-primary/20 bg-primary/5 dark:bg-primary/10">
                            <th className="text-left p-3 font-medium text-muted-foreground">วันที่</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">คนไข้</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">รายการตรวจ</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">รายได้</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingReport ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                  <span className="text-muted-foreground">กำลังโหลดข้อมูลรายงาน...</span>
                                </div>
                              </td>
                            </tr>
                          ) : reportData.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                ไม่มีข้อมูลรายงานในช่วงวันที่ที่เลือก
                              </td>
                            </tr>
                          ) : (
                            reportData.map((row, index) => (
                              <tr key={index} className="border-b border-border hover:bg-muted/30">
                                <td className="p-3">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {formatDateThai(row.date)}
                                  </span>
                                </td>
                                <td className="p-3">{row.patients} คน</td>
                                <td className="p-3">{row.tests} รายการ</td>
                                <td className="p-3 font-medium">฿{formatCurrency(row.revenue)}</td>
                                <td className="p-3">
                                  <Badge className="bg-success/10 text-success hover:bg-success/20">
                                    {row.status === 'completed' ? 'เสร็จแล้ว' : row.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      แสดง {selectedReport === 'vts' ? visitorData.length : selectedReport === 'salelab' ? salesData.filter(sale => sale.paymentMethod !== 'ฟรี').length : reportData.length} รายการ จากทั้งหมด {selectedReport === 'vts' ? visitorData.length : selectedReport === 'salelab' ? salesData.filter(sale => sale.paymentMethod !== 'ฟรี').length : reportData.length} รายการ
                      {selectedDepartment && selectedDepartment !== 'all' && (
                        <span className="ml-2">
                          • หน่วยงาน: {departments.find(d => d.id === selectedDepartment)?.name}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => window.print()}
                        disabled={(selectedReport === 'vts' ? visitorData.length : selectedReport === 'salelab' ? salesData.filter(sale => sale.paymentMethod !== 'ฟรี').length : reportData.length) === 0}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        พิมพ์รายงาน
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-gradient-success hover:opacity-90 h-8 text-xs"
                        onClick={handleExportPDF}
                        disabled={(selectedReport === 'vts' ? visitorData.length : selectedReport === 'salelab' ? salesData.filter(sale => sale.paymentMethod !== 'ฟรี').length : reportData.length) === 0}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        ดาวน์โหลด PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-sm border border-primary/20">
              <CardContent className="text-center py-8">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">เลือกประเภทรายงาน</h3>
                <p className="text-muted-foreground text-xs">
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