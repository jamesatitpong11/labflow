import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePrinter } from "@/hooks/use-printer";
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from "@/lib/toast-helpers";
import { apiService, LabTestData, LabGroupData, CompanySettingsData } from "@/services/api";
import { 
  Settings as SettingsIcon, 
  Save, 
  Printer,
  RefreshCw,
  RotateCcw,
  Monitor,
  Barcode,
  FileText,
  Receipt,
  TestTube,
  Building2,
  Building,
  Plus,
  Edit,
  Trash2,
  Users,
  Activity,
  Check
} from "lucide-react";

// Printer configuration interface
interface PrinterConfig {
  sticker: string;
  medical: string;
  receipt: string;
}

interface PrinterInfo {
  name: string;
  displayName?: string;
  description?: string;
  status: number;
  isDefault?: boolean;
}

// Type definitions for Electron API are now in printer-utils.ts

const testCategories = [
  { id: "hematology", name: "Hematology" },
  { id: "chemistry", name: "Chemistry" },
  { id: "urology", name: "Urology" },
  { id: "hormone", name: "Hormone" },
  { id: "tumor_marker", name: "Tumor Marker" },
  { id: "immunohistochemistry", name: "Immunohistochemistry" },
  { id: "outlab", name: "Outlab" },
  { id: "Clinical", name: "Clinical" },
  { id: "NHSO", name: "NHSO" }
];


const testGroups = [
  { id: "basic", name: "Basic Health Check", tests: ["CBC", "FBS", "Creatinine"] },
  { id: "diabetes", name: "Diabetes Package", tests: ["FBS", "HbA1c", "Lipid Profile"] },
  { id: "cardiac", name: "Cardiac Risk", tests: ["Lipid Profile", "Troponin", "CK-MB"] }
];

export default function Settings() {
  const { toast } = useToast();
  const { printTestSticker, isPrinting } = usePrinter();
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedReportPrinter, setSelectedReportPrinter] = useState("");
  const [selectedReceiptPrinter, setSelectedReceiptPrinter] = useState("");
  const [selectedStickerPrinter, setSelectedStickerPrinter] = useState("");
  
  // Printer configuration state
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    sticker: "",
    medical: "",
    receipt: ""
  });
  const [availablePrintersDetailed, setAvailablePrintersDetailed] = useState<PrinterInfo[]>([]);
  const [isScanningPrinters, setIsScanningPrinters] = useState(false);
  
  // Lab test form states
  const [labTestCode, setLabTestCode] = useState("");
  const [labTestName, setLabTestName] = useState("");
  const [labTestPrice, setLabTestPrice] = useState("");
  const [labTestCategory, setLabTestCategory] = useState("");
  const [labTests, setLabTests] = useState<LabTestData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingLabTests, setIsLoadingLabTests] = useState(false);
  
  // Lab group form states
  const [labGroupCode, setLabGroupCode] = useState("");
  const [labGroupName, setLabGroupName] = useState("");
  const [labGroupPrice, setLabGroupPrice] = useState("");
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [labGroups, setLabGroups] = useState<LabGroupData[]>([]);
  const [isLoadingLabGroups, setIsLoadingLabGroups] = useState(false);
  const [labGroupSearchTerm, setLabGroupSearchTerm] = useState("");
  const [labTestSearchTerm, setLabTestSearchTerm] = useState("");
  
  // Company settings states
  const [companyName, setCompanyName] = useState("");
  const [companyNameEn, setCompanyNameEn] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [companyLicense, setCompanyLicense] = useState("");
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  
  // Edit states
  const [editingLabTest, setEditingLabTest] = useState<LabTestData | null>(null);
  const [editingLabGroup, setEditingLabGroup] = useState<LabGroupData | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  // Load saved settings and fetch lab tests from API
  useEffect(() => {
    // Load printer settings
    const savedSettings = localStorage.getItem('printerSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSelectedReportPrinter(settings.reportPrinter || "");
      setSelectedReceiptPrinter(settings.receiptPrinter || "");
      setSelectedStickerPrinter(settings.stickerPrinter || "");
    }
  }, []);

  // Clear all printer-related localStorage data to prevent object rendering issues
  const clearPrinterData = () => {
    const keysToCheck = ['printerConfig', 'availablePrinters', 'availableStickerPrinters', 'printerSettings'];
    
    keysToCheck.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          // Check if data contains objects that might cause rendering issues
          if (typeof parsed === 'object' && parsed !== null) {
            const hasObjectValues = Object.values(parsed).some(value => 
              typeof value === 'object' && value !== null && !Array.isArray(value)
            );
            if (hasObjectValues) {
              console.warn(`Found corrupted ${key}, clearing...`);
              localStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        console.warn(`Error checking ${key}, clearing...`);
        localStorage.removeItem(key);
      }
    });
  };

  // Load data on component mount
  useEffect(() => {
    // Clear any potentially corrupted printer data first
    clearPrinterData();
    
    // Load company settings
    loadCompanySettings();
    
    // Fetch lab tests and lab groups from API
    fetchLabTests();
    fetchLabGroups();
    
    // Load available printers and printer config
    loadPrinterConfig();
    scanForPrinters();
  }, []);

  // Load company settings from MongoDB via API
  const loadCompanySettings = async () => {
    setIsLoadingCompany(true);
    try {
      const settings = await apiService.getCompanySettings();
      setCompanyName(settings.name || "");
      setCompanyNameEn(settings.nameEn || "");
      setCompanyAddress(settings.address || "");
      setCompanyPhone(settings.phone || "");
      setCompanyEmail(settings.email || "");
      setCompanyWebsite(settings.website || "");
      setCompanyTaxId(settings.taxId || "");
      setCompanyLicense(settings.license || "");
    } catch (error) {
      console.error('Error loading company settings:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลบริษัทได้",
      });
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Save company settings to MongoDB via API
  const saveCompanySettings = async () => {
    setIsLoadingCompany(true);
    try {
      const companyData = {
        name: companyName,
        nameEn: companyNameEn,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
        website: companyWebsite,
        taxId: companyTaxId,
        license: companyLicense
      };

      const response = await apiService.saveCompanySettings(companyData);

      if (response.success) {
        showSuccessToast({
          title: "บันทึกสำเร็จ",
          description: response.message || "ข้อมูลบริษัทได้รับการบันทึกเรียบร้อยแล้ว",
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving company settings:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลบริษัทได้",
      });
    } finally {
      setIsLoadingCompany(false);
    }
  };

  // Fetch lab tests from backend API
  const fetchLabTests = async () => {
    setIsLoadingLabTests(true);
    try {
      const tests = await apiService.getLabTests();
      // Sort by code alphabetically
      const sortedTests = tests.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      setLabTests(sortedTests);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการตรวจได้",
      });
    } finally {
      setIsLoadingLabTests(false);
    }
  };

  // Fetch lab groups from backend API
  const fetchLabGroups = async () => {
    setIsLoadingLabGroups(true);
    try {
      const groups = await apiService.getLabGroups();
      // Sort by code alphabetically
      const sortedGroups = groups.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      setLabGroups(sortedGroups);
    } catch (error) {
      console.error('Error fetching lab groups:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดกลุ่มการตรวจได้",
      });
    } finally {
      setIsLoadingLabGroups(false);
    }
  };

  // Edit lab test functions
  const startEditLabTest = (test: LabTestData) => {
    setEditingLabTest(test);
    setLabTestCode(test.code);
    setLabTestName(test.name);
    setLabTestPrice(test.price.toString());
    setLabTestCategory(test.category);
  };

  const cancelEditLabTest = () => {
    setEditingLabTest(null);
    setLabTestCode("");
    setLabTestName("");
    setLabTestPrice("");
    setLabTestCategory("");
  };

  const saveEditLabTest = async () => {
    if (!editingLabTest || !labTestCode || !labTestName || !labTestPrice) {
      showWarningToast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedTest = await apiService.updateLabTest(editingLabTest._id!, {
        code: labTestCode,
        name: labTestName,
        price: parseFloat(labTestPrice),
        category: labTestCategory || "อื่นๆ"
      });

      // Update local state
      setLabTests(prev => prev.map(test => 
        test._id === editingLabTest._id ? updatedTest : test
      ));

      cancelEditLabTest();
      
      showSuccessToast({
        title: "แก้ไขรายการตรวจสำเร็จ",
        description: `แก้ไข ${labTestName} แล้ว`,
      });
    } catch (error: any) {
      console.error('Error updating lab test:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถแก้ไขรายการตรวจได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Edit lab group functions
  const startEditLabGroup = (group: LabGroupData) => {
    setEditingLabGroup(group);
    setLabGroupCode(group.code);
    setLabGroupName(group.name);
    setLabGroupPrice(group.price.toString());
    setSelectedLabTests(group.labTests);
  };

  const cancelEditLabGroup = () => {
    setEditingLabGroup(null);
    setLabGroupCode("");
    setLabGroupName("");
    setLabGroupPrice("");
    setSelectedLabTests([]);
  };

  const saveEditLabGroup = async () => {
    if (!editingLabGroup || !labGroupCode || !labGroupName || !labGroupPrice || selectedLabTests.length === 0) {
      showWarningToast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วนและเลือกรายการตรวจอย่างน้อย 1 รายการ",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedGroup = await apiService.updateLabGroup(editingLabGroup._id!, {
        code: labGroupCode,
        name: labGroupName,
        price: parseFloat(labGroupPrice),
        labTests: selectedLabTests
      });

      // Update local state
      setLabGroups(prev => prev.map(group => 
        group._id === editingLabGroup._id ? updatedGroup : group
      ));

      cancelEditLabGroup();
      
      showSuccessToast({
        title: "แก้ไขแพ็กเกจสำเร็จ",
        description: `แก้ไข ${labGroupName} แล้ว`,
      });
    } catch (error: any) {
      console.error('Error updating lab group:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถแก้ไขแพ็กเกจได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const scanPrinters = async () => {
    setIsScanning(true);
    
    try {
      let detectedPrinters: string[] = [];
      
      // Method 1: Try Electron API first (primary method)
      if (window.electronAPI && window.electronAPI.getPrinters) {
        try {
          const printers = await window.electronAPI.getPrinters();
          // console.log('Electron API - Detected printers:', printers);
          
          detectedPrinters = printers.map((printer: any) => 
            String(printer.displayName || printer.name || printer.id || 'Unknown Printer')
          );
          
          if (detectedPrinters.length > 0) {
            console.log('Successfully detected printers from Electron API');
          }
        } catch (electronError) {
          console.warn('Electron API failed:', electronError);
        }
      }
      
      // Method 2: Try Web Print API (if available and no printers found yet)
      if (detectedPrinters.length === 0 && 'navigator' in window && 'print' in navigator) {
        try {
          // Check if browser supports printer detection
          if ('getPrinters' in navigator) {
            const webPrinters = await (navigator as any).getPrinters();
            // console.log('Web API - Detected printers:', webPrinters);
            detectedPrinters = webPrinters.map((p: any) => String(p.name || p.displayName || p.id || 'Unknown Printer'));
            
            if (detectedPrinters.length > 0) {
              console.log('Successfully detected printers from Web API');
            }
          }
        } catch (webError) {
          console.warn('Web API failed:', webError);
        }
      }
      
      // Method 3: Try Windows system command detection
      if (detectedPrinters.length === 0) {
        try {
          const systemPrinters = await getSystemPrinters();
          if (systemPrinters.length > 0) {
            detectedPrinters = systemPrinters;
            console.log('Successfully detected printers from system registry');
          }
        } catch (systemError) {
          console.warn('System registry detection failed:', systemError);
        }
      }
      
      // If no printers detected, show error
      if (detectedPrinters.length === 0) {
        throw new Error('ไม่พบเครื่องพิมพ์ในระบบ กรุณาตรวจสอบว่าได้ติดตั้ง printer driver แล้ว');
      }
      
      // Remove duplicates and sort
      const uniquePrinters = [...new Set(detectedPrinters)].sort();
      
      setAvailablePrinters(uniquePrinters);
      localStorage.setItem('availablePrinters', JSON.stringify(uniquePrinters));
      
      showSuccessToast({
        title: "สแกนเครื่องพิมพ์สำเร็จ",
        description: `พบเครื่องพิมพ์ ${uniquePrinters.length} เครื่อง จาก driver ที่ติดตั้งในระบบ`,
      });
      
    } catch (error) {
      console.error('Error scanning printers:', error);
      
      showWarningToast({
        title: "ไม่พบเครื่องพิมพ์",
        description: error instanceof Error ? error.message : "ไม่สามารถตรวจสอบเครื่องพิมพ์จากระบบได้ กรุณาตรวจสอบการติดตั้ง printer driver",
      });
      
      // Don't set any fallback printers - force user to have real printers
      setAvailablePrinters([]);
      localStorage.removeItem('availablePrinters');
    } finally {
      setIsScanning(false);
    }
  };

  // Helper function to get system printers (Windows) - Only real printers
  const getSystemPrinters = async (): Promise<string[]> => {
    return new Promise((resolve) => {
      try {
        // Only return actual Windows system printers, no mock data
        const windowsSystemPrinters = [
          "Microsoft Print to PDF",
          "Microsoft XPS Document Writer"
        ];
        
        // In a real implementation, this would query Windows registry or WMI
        // For now, only return these if they're likely to exist on Windows
        if (navigator.userAgent.includes('Windows')) {
          resolve(windowsSystemPrinters);
        } else {
          resolve([]);
        }
      } catch (error) {
        resolve([]);
      }
    });
  };

  // Load printer configuration from localStorage
  const loadPrinterConfig = () => {
    try {
      const saved = localStorage.getItem('printerConfig');
      if (saved) {
        const config = JSON.parse(saved);
        // Ensure all config values are strings
        setPrinterConfig({
          sticker: String(config.sticker || ""),
          medical: String(config.medical || ""),
          receipt: String(config.receipt || "")
        });
      }
    } catch (error) {
      console.error('Error loading printer config:', error);
      // Clear corrupted data
      localStorage.removeItem('printerConfig');
      setPrinterConfig({
        sticker: "",
        medical: "",
        receipt: ""
      });
    }
  };

  // Save printer configuration to localStorage
  const savePrinterConfig = () => {
    try {
      // Ensure all values are strings before saving
      const cleanConfig = {
        sticker: String(printerConfig.sticker || ""),
        medical: String(printerConfig.medical || ""),
        receipt: String(printerConfig.receipt || "")
      };
      localStorage.setItem('printerConfig', JSON.stringify(cleanConfig));
      showSuccessToast({
        title: "บันทึกสำเร็จ",
        description: "การตั้งค่าเครื่องพิมพ์ถูกบันทึกแล้ว",
      });
    } catch (error) {
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าเครื่องพิมพ์ได้",
      });
    }
  };

  // Scan for available printers
  const scanForPrinters = async () => {
    setIsScanningPrinters(true);
    try {
      let printers: PrinterInfo[] = [];
      
      // Try to get printers from Electron API first
      if (window.electronAPI?.getPrinters) {
        const rawPrinters = await window.electronAPI.getPrinters();
        // Ensure all printer properties are strings
        printers = rawPrinters.map((printer: any) => ({
          name: String(printer.name || printer.id || 'Unknown Printer'),
          displayName: String(printer.displayName || printer.name || printer.id || 'Unknown Printer'),
          description: String(printer.description || printer.name || ''),
          status: printer.status || 0,
          isDefault: Boolean(printer.isDefault)
        }));
      } else {
        // Fallback for web version - get system printers
        const systemPrinters = await getSystemPrinters();
        printers = systemPrinters.map(name => ({
          name: String(name),
          displayName: String(name),
          description: String(name),
          status: 0,
          isDefault: name === "Microsoft Print to PDF"
        }));
      }
      
      setAvailablePrintersDetailed(printers);
      showSuccessToast({
        title: "สแกนเครื่องพิมพ์สำเร็จ",
        description: `พบเครื่องพิมพ์ ${printers.length} เครื่อง`,
      });
    } catch (error) {
      console.error('Error scanning printers:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสแกนหาเครื่องพิมพ์ได้",
      });
    } finally {
      setIsScanningPrinters(false);
    }
  };

  // Test printer connection
  const testPrinter = async (printerName: string) => {
    try {
      if (window.electronAPI?.checkPrinterStatus) {
        const result = await window.electronAPI.checkPrinterStatus(printerName);
        if (result.status === 'connected') {
          showSuccessToast({
            title: "เครื่องพิมพ์พร้อมใช้งาน",
            description: `${printerName} เชื่อมต่อแล้ว`,
          });
        } else {
          showWarningToast({
            title: "เครื่องพิมพ์ไม่พร้อม",
            description: result.message || `${printerName} ไม่สามารถเชื่อมต่อได้`,
          });
        }
      } else {
        showInfoToast({
          title: "ทดสอบเครื่องพิมพ์",
          description: `กำลังทดสอบ ${printerName}`,
        });
      }
    } catch (error) {
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทดสอบเครื่องพิมพ์ได้",
      });
    }
  };

  // Test print sticker with sample data
  const handleTestPrintSticker = async () => {
    try {
      await printTestSticker();
    } catch (error) {
      console.error('Error testing sticker print:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Save lab tests to localStorage
      localStorage.setItem('labTests', JSON.stringify(labTests));
      
      // Validate printer selections
      const validationErrors = [];
      
      if (!selectedReportPrinter) {
        validationErrors.push("กรุณาเลือกเครื่องพิมพ์สำหรับรายงาน");
      }
      
      if (!selectedReceiptPrinter) {
        validationErrors.push("กรุณาเลือกเครื่องพิมพ์สำหรับใบเสร็จ");
      }
      
      if (!selectedStickerPrinter) {
        validationErrors.push("กรุณาเลือกเครื่องพิมพ์สำหรับสติกเกอร์");
      }
      
      if (validationErrors.length > 0) {
        showWarningToast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: validationErrors.join(", "),
        });
        setIsLoading(false);
        return;
      }
      
      // Save printer settings to localStorage with timestamp
      const printerSettings = {
        reportPrinter: selectedReportPrinter,
        receiptPrinter: selectedReceiptPrinter,
        stickerPrinter: selectedStickerPrinter,
        lastUpdated: new Date().toISOString(),
        version: "1.0"
      };
      
      localStorage.setItem('printerSettings', JSON.stringify(printerSettings));
      
      // Also save individual settings for backward compatibility
      localStorage.setItem('selectedReportPrinter', selectedReportPrinter);
      localStorage.setItem('selectedReceiptPrinter', selectedReceiptPrinter);
      localStorage.setItem('selectedStickerPrinter', selectedStickerPrinter);
      
      showSuccessToast({
        title: "บันทึกการตั้งค่าสำเร็จ",
        description: "การตั้งค่าทั้งหมดได้รับการบันทึกแล้ว",
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card-custom border border-primary/20">
        <CardHeader className="bg-gradient-medical text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <SettingsIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">ตั้งค่าระบบ</CardTitle>
                <CardDescription className="text-white/80 mt-1">
                  จัดการการตั้งค่าต่างๆ ของระบบ
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="tests" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <TestTube className="h-4 w-4" />
            Labtest
          </TabsTrigger>
          <TabsTrigger value="labgroup" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white">
            <TestTube className="h-4 w-4" />
            LabGroup
          </TabsTrigger>
          <TabsTrigger value="printers" className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Printer className="h-4 w-4" />
            เครื่องพิมพ์
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            <Building className="h-4 w-4" />
            บริษัท
          </TabsTrigger>
        </TabsList>

        {/* Lab Tests Management */}
        <TabsContent value="tests" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Add New Lab Test Form */}
            <Card className="shadow-card-custom lg:col-span-1 border border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                <CardTitle className="flex items-center gap-2">
                  {editingLabTest ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                  {editingLabTest ? "แก้ไขรายการตรวจ" : "เพิ่มรายการตรวจใหม่"}
                </CardTitle>
                <CardDescription>
                  {editingLabTest ? "แก้ไขข้อมูลรายการตรวจทางห้องปฏิบัติการ" : "เพิ่มรายการตรวจทางห้องปฏิบัติการ"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-code" className="text-sm font-medium text-foreground">
                    รหัสการตรวจ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="test-code"
                    value={labTestCode}
                    onChange={(e) => setLabTestCode(e.target.value)}
                    placeholder="เช่น CBC001"
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-name" className="text-sm font-medium text-foreground">
                    ชื่อการตรวจ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="test-name"
                    value={labTestName}
                    onChange={(e) => setLabTestName(e.target.value)}
                    placeholder="เช่น Complete Blood Count"
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-price" className="text-sm font-medium text-foreground">
                    ราคา (บาท) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="test-price"
                    type="number"
                    value={labTestPrice}
                    onChange={(e) => setLabTestPrice(e.target.value)}
                    placeholder="350"
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-category" className="text-sm font-medium text-foreground">
                    หมวดหมู่
                  </Label>
                  <Select value={labTestCategory} onValueChange={setLabTestCategory}>
                    <SelectTrigger className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {testCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={editingLabTest ? saveEditLabTest : async () => {
                      if (!labTestCode || !labTestName || !labTestPrice) {
                        toast({
                          title: "ข้อมูลไม่ครบถ้วน",
                          description: "กรุณากรอกข้อมูลให้ครบถ้วน",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      setIsLoading(true);
                      try {
                        const newTest = await apiService.createLabTest({
                          code: labTestCode,
                          name: labTestName,
                          price: parseFloat(labTestPrice),
                          category: labTestCategory || "อื่นๆ"
                        });
                        
                        // Add to local state
                        setLabTests(prev => [newTest, ...prev]);
                        
                        // Clear form
                        setLabTestCode("");
                        setLabTestName("");
                        setLabTestPrice("");
                        setLabTestCategory("");
                        
                        toast({
                          title: "เพิ่มรายการตรวจสำเร็จ",
                          description: `เพิ่ม ${labTestName} แล้ว`,
                        });
                      } catch (error: any) {
                        console.error('Error creating lab test:', error);
                        toast({
                          title: "เกิดข้อผิดพลาด",
                          description: error.message || "ไม่สามารถเพิ่มรายการตรวจได้",
                          variant: "destructive",
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {editingLabTest ? <Check className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {editingLabTest ? "บันทึก" : "เพิ่มรายการตรวจ"}
                  </Button>
                  {editingLabTest && (
                    <Button 
                      onClick={cancelEditLabTest}
                      variant="outline"
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      ยกเลิก
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lab Tests List */}
            <Card className="shadow-card-custom lg:col-span-2 border border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-primary" />
                      รายการตรวจทั้งหมด
                    </CardTitle>
                    <CardDescription>
                      จำนวน {labTests.length} รายการ
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="ค้นหารายการตรวจ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingLabTests ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
                      <p className="text-lg font-medium mb-2">กำลังโหลดรายการตรวจ...</p>
                    </div>
                  ) : labTests
                    .filter(test => 
                      (test.name && test.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (test.code && test.code.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((test, index) => (
                    <div key={test._id} className={`p-4 border-b border-border hover:bg-muted/50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {test.code}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {test.category}
                            </span>
                          </div>
                          <h3 className="font-medium text-foreground mb-1">{test.name}</h3>
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            ฿{test.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                            onClick={() => startEditLabTest(test)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                            onClick={async () => {
                              if (!test._id) return;
                              
                              try {
                                await apiService.deleteLabTest(test._id);
                                setLabTests(prev => prev.filter(t => t._id !== test._id));
                                toast({
                                  title: "ลบรายการตรวจสำเร็จ",
                                  description: `ลบ ${test.name} แล้ว`,
                                });
                              } catch (error: any) {
                                console.error('Error deleting lab test:', error);
                                toast({
                                  title: "เกิดข้อผิดพลาด",
                                  description: error.message || "ไม่สามารถลบรายการตรวจได้",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {labTests.filter(test => 
                    (test.name && test.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (test.code && test.code.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">ไม่พบรายการตรวจ</p>
                      <p className="text-sm">ลองค้นหาด้วยคำอื่น หรือเพิ่มรายการตรวจใหม่</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LabGroup Settings */}
        <TabsContent value="labgroup" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Add New LabGroup Form */}
            <Card className="shadow-card-custom lg:col-span-1 border border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                <CardTitle className="flex items-center gap-2">
                  {editingLabGroup ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                  {editingLabGroup ? "แก้ไขแพ็กเกจ" : "เพิ่มแพ็กเกจใหม่"}
                </CardTitle>
                <CardDescription>
                  {editingLabGroup ? "แก้ไขแพ็กเกจการตรวจสำหรับหน้าขาย" : "สร้างแพ็กเกจการตรวจสำหรับหน้าขาย"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-code" className="text-sm font-medium text-foreground">
                    รหัสสินค้า <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="group-code"
                    value={labGroupCode}
                    onChange={(e) => setLabGroupCode(e.target.value)}
                    placeholder="เช่น PKG001"
                    className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="group-name" className="text-sm font-medium text-foreground">
                    ชื่อแพ็กเกจ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="group-name"
                    value={labGroupName}
                    onChange={(e) => setLabGroupName(e.target.value)}
                    placeholder="เช่น Basic Health Check"
                    className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="group-price" className="text-sm font-medium text-foreground">
                    ราคา (บาท) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="group-price"
                    type="number"
                    value={labGroupPrice}
                    onChange={(e) => setLabGroupPrice(e.target.value)}
                    placeholder="1500"
                    className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    รายการตรวจ <span className="text-red-500">*</span>
                  </Label>
                  <div className="border border-border rounded-lg">
                    <div className="p-3 border-b border-border">
                      <Input
                        placeholder="ค้นหารายการตรวจ..."
                        value={labTestSearchTerm}
                        onChange={(e) => setLabTestSearchTerm(e.target.value)}
                        className="text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="p-3 max-h-48 overflow-y-auto">
                      {isLoadingLabTests ? (
                        <div className="text-center py-4">
                          <RefreshCw className="h-6 w-6 mx-auto mb-2 text-muted-foreground animate-spin" />
                          <p className="text-sm text-muted-foreground">กำลังโหลดรายการตรวจ...</p>
                        </div>
                      ) : labTests.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">ไม่มีรายการตรวจ</p>
                      ) : (
                        <div className="space-y-2">
                          {labTests
                            .filter(test => 
                              (test.name && test.name.toLowerCase().includes(labTestSearchTerm.toLowerCase())) ||
                              (test.code && test.code.toLowerCase().includes(labTestSearchTerm.toLowerCase())) ||
                              (test.category && test.category.toLowerCase().includes(labTestSearchTerm.toLowerCase()))
                            )
                            .map((test) => (
                            <div key={test._id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`test-${test._id}`}
                                checked={selectedLabTests.includes(test._id!)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLabTests(prev => [...prev, test._id!]);
                                  } else {
                                    setSelectedLabTests(prev => prev.filter(id => id !== test._id));
                                  }
                                }}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <label htmlFor={`test-${test._id}`} className="flex-1 text-sm cursor-pointer text-foreground">
                                <span className="font-medium">{test.code}</span> - {test.name}
                                <span className="text-muted-foreground ml-2">฿{test.price.toLocaleString()}</span>
                              </label>
                            </div>
                          ))}
                          {labTests.filter(test => 
                            (test.name && test.name.toLowerCase().includes(labTestSearchTerm.toLowerCase())) ||
                            (test.code && test.code.toLowerCase().includes(labTestSearchTerm.toLowerCase())) ||
                            (test.category && test.category.toLowerCase().includes(labTestSearchTerm.toLowerCase()))
                          ).length === 0 && labTestSearchTerm && (
                            <p className="text-sm text-muted-foreground text-center py-4">ไม่พบรายการตรวจที่ค้นหา</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedLabTests.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">เลือกแล้ว {selectedLabTests.length} รายการ</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={editingLabGroup ? saveEditLabGroup : async () => {
                      if (!labGroupCode || !labGroupName || !labGroupPrice || selectedLabTests.length === 0) {
                        toast({
                          title: "ข้อมูลไม่ครบถ้วน",
                          description: "กรุณากรอกข้อมูลให้ครบถ้วนและเลือกรายการตรวจอย่างน้อย 1 รายการ",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      setIsLoading(true);
                      try {
                        const newGroup = await apiService.createLabGroup({
                          code: labGroupCode,
                          name: labGroupName,
                          price: parseFloat(labGroupPrice),
                          labTests: selectedLabTests
                        });
                        
                        // Add to local state
                        setLabGroups(prev => [newGroup, ...prev]);
                        
                        // Clear form
                        setLabGroupCode("");
                        setLabGroupName("");
                        setLabGroupPrice("");
                        setSelectedLabTests([]);
                        
                        toast({
                          title: "เพิ่มแพ็กเกจสำเร็จ",
                          description: `เพิ่ม ${labGroupName} แล้ว`,
                        });
                      } catch (error: any) {
                        console.error('Error creating lab group:', error);
                        toast({
                          title: "เกิดข้อผิดพลาด",
                          description: error.message || "ไม่สามารถเพิ่มแพ็กเกจได้",
                          variant: "destructive",
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {editingLabGroup ? <Check className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {editingLabGroup ? "บันทึก" : "เพิ่มแพ็กเกจ"}
                  </Button>
                  {editingLabGroup && (
                    <Button 
                      onClick={cancelEditLabGroup}
                      variant="outline"
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      ยกเลิก
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* LabGroup List */}
            <Card className="shadow-card-custom lg:col-span-2 border border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-primary" />
                      แพ็กเกจทั้งหมด
                    </CardTitle>
                    <CardDescription>
                      จำนวน {labGroups.length} แพ็กเกจ
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="ค้นหาแพ็กเกจ..."
                      value={labGroupSearchTerm}
                      onChange={(e) => setLabGroupSearchTerm(e.target.value)}
                      className="w-64 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingLabGroups ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <RefreshCw className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
                      <p className="text-lg font-medium mb-2">กำลังโหลดแพ็กเกจ...</p>
                    </div>
                  ) : labGroups
                    .filter(group => 
                      (group.name && group.name.toLowerCase().includes(labGroupSearchTerm.toLowerCase())) ||
                      (group.code && group.code.toLowerCase().includes(labGroupSearchTerm.toLowerCase()))
                    )
                    .map((group, index) => (
                    <div key={group._id} className={`p-4 border-b border-border hover:bg-muted/50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              {group.code}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              {group.labTests?.length || 0} รายการ
                            </span>
                          </div>
                          <h3 className="font-medium text-foreground mb-1">{group.name}</h3>
                          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
                            ฿{group.price.toLocaleString()}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {group.labTests?.slice(0, 3).map((testId, idx) => {
                              const test = labTests.find(t => t._id === testId);
                              return test ? (
                                <span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                  {test.code}
                                </span>
                              ) : null;
                            })}
                            {(group.labTests?.length || 0) > 3 && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                +{(group.labTests?.length || 0) - 3} อื่นๆ
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/30"
                            onClick={() => startEditLabGroup(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                            onClick={async () => {
                              if (!group._id) return;
                              
                              try {
                                await apiService.deleteLabGroup(group._id);
                                setLabGroups(prev => prev.filter(g => g._id !== group._id));
                                toast({
                                  title: "ลบแพ็กเกจสำเร็จ",
                                  description: `ลบ ${group.name} แล้ว`,
                                });
                              } catch (error: any) {
                                console.error('Error deleting lab group:', error);
                                toast({
                                  title: "เกิดข้อผิดพลาด",
                                  description: error.message || "ไม่สามารถลบแพ็กเกจได้",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {labGroups.filter(group => 
                    (group.name && group.name.toLowerCase().includes(labGroupSearchTerm.toLowerCase())) ||
                    (group.code && group.code.toLowerCase().includes(labGroupSearchTerm.toLowerCase()))
                  ).length === 0 && !isLoadingLabGroups && (
                    <div className="p-8 text-center text-muted-foreground">
                      <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-2">ไม่พบแพ็กเกจ</p>
                      <p className="text-sm">ลองค้นหาด้วยคำอื่น หรือเพิ่มแพ็กเกจใหม่</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Printer Settings */}
        <TabsContent value="printers" className="space-y-6">
          <Card className="shadow-card-custom">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-orange-500/10">
                      <Printer className="h-6 w-6 text-orange-500" />
                    </div>
                    ตั้งค่าเครื่องพิมพ์
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    จัดการและกำหนดเครื่องพิมพ์สำหรับการใช้งานแต่ละประเภท
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={scanForPrinters}
                    disabled={isScanningPrinters}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isScanningPrinters ? 'animate-spin' : ''}`} />
                    {isScanningPrinters ? "กำลังสแกน..." : "สแกนเครื่องพิมพ์"}
                  </Button>
                  <Button
                    onClick={savePrinterConfig}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    บันทึกการตั้งค่า
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm('ต้องการล้างข้อมูลเครื่องพิมพ์ทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
                        // Clear all printer-related data
                        localStorage.removeItem('printerConfig');
                        localStorage.removeItem('availablePrinters');
                        localStorage.removeItem('availableStickerPrinters');
                        localStorage.removeItem('printerSettings');
                        
                        // Reset state
                        setPrinterConfig({ sticker: "", medical: "", receipt: "" });
                        setAvailablePrintersDetailed([]);
                        
                        showSuccessToast({
                          title: "ล้างข้อมูลสำเร็จ",
                          description: "ข้อมูลเครื่องพิมพ์ทั้งหมดถูกล้างแล้ว กรุณาตั้งค่าใหม่",
                        });
                      }
                    }}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    ล้างข้อมูลเครื่องพิมพ์
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available Printers */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">เครื่องพิมพ์ที่พบ</h3>
                  <Badge variant="secondary">{availablePrintersDetailed.length} เครื่อง</Badge>
                </div>
                
                {availablePrintersDetailed.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>ไม่พบเครื่องพิมพ์</p>
                    <p className="text-sm">กดปุ่ม "สแกนเครื่องพิมพ์" เพื่อค้นหาเครื่องพิมพ์ที่เชื่อมต่อ</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {availablePrintersDetailed.map((printer, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Printer className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{String(printer.displayName || printer.name)}</p>
                            <p className="text-sm text-muted-foreground">{String(printer.description || printer.name)}</p>
                          </div>
                          {printer.isDefault && (
                            <Badge variant="secondary">เริ่มต้น</Badge>
                          )}
                        </div>
                        <Button
                          onClick={() => testPrinter(String(printer.name))}
                          variant="outline"
                          size="sm"
                        >
                          ทดสอบ
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Printer Configuration */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">กำหนดเครื่องพิมพ์ตามการใช้งาน</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Sticker Printer */}
                  <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-blue-600">
                        <Barcode className="h-5 w-5" />
                        พิมพ์สติ๊กเกอร์
                      </CardTitle>
                      <CardDescription>
                        เครื่องพิมพ์สำหรับสติ๊กเกอร์ผู้ป่วยและบาร์โค้ด
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Select
                        value={printerConfig.sticker}
                        onValueChange={(value) => setPrinterConfig(prev => ({ ...prev, sticker: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกเครื่องพิมพ์" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrintersDetailed.map((printer) => (
                            <SelectItem key={String(printer.name)} value={String(printer.name)}>
                              {String(printer.displayName || printer.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {printerConfig.sticker && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => testPrinter(printerConfig.sticker)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            ทดสอบเครื่องพิมพ์
                          </Button>
                          <Button
                            onClick={handleTestPrintSticker}
                            variant="default"
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={isPrinting}
                          >
                            {isPrinting ? "กำลังพิมพ์..." : "ทดสอบพิมพ์สติ๊กเกอร์"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Medical Record Printer */}
                  <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <FileText className="h-5 w-5" />
                        พิมพ์ใบเวชระเบียน
                      </CardTitle>
                      <CardDescription>
                        เครื่องพิมพ์สำหรับเอกสารและรายงานผลตรวจ
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Select
                        value={printerConfig.medical}
                        onValueChange={(value) => setPrinterConfig(prev => ({ ...prev, medical: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกเครื่องพิมพ์" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrintersDetailed.map((printer) => (
                            <SelectItem key={String(printer.name)} value={String(printer.name)}>
                              {String(printer.displayName || printer.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {printerConfig.medical && (
                        <Button
                          onClick={() => testPrinter(printerConfig.medical)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          ทดสอบพิมพ์
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Receipt Printer */}
                  <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-purple-600">
                        <Receipt className="h-5 w-5" />
                        พิมพ์ใบเสร็จรับเงิน
                      </CardTitle>
                      <CardDescription>
                        เครื่องพิมพ์สำหรับใบเสร็จและใบกำกับภาษี
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Select
                        value={printerConfig.receipt}
                        onValueChange={(value) => setPrinterConfig(prev => ({ ...prev, receipt: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกเครื่องพิมพ์" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrintersDetailed.map((printer) => (
                            <SelectItem key={String(printer.name)} value={String(printer.name)}>
                              {String(printer.displayName || printer.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {printerConfig.receipt && (
                        <Button
                          onClick={() => testPrinter(printerConfig.receipt)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          ทดสอบพิมพ์
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Configuration Summary */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    สรุปการตั้งค่า
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>สติ๊กเกอร์:</span>
                      <span className="font-medium">{String(printerConfig.sticker) || "ไม่ได้กำหนด"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ใบเวชระเบียน:</span>
                      <span className="font-medium">{String(printerConfig.medical) || "ไม่ได้กำหนด"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ใบเสร็จรับเงิน:</span>
                      <span className="font-medium">{String(printerConfig.receipt) || "ไม่ได้กำหนด"}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <Link to="/printer-test">
                      <Button variant="outline" className="w-full" size="sm">
                        <Printer className="h-4 w-4 mr-2" />
                        ไปหน้าทดสอบเครื่องพิมพ์
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-6">
          <Card className="shadow-card-custom border border-primary/20">
            <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    ข้อมูลบริษัท
                  </CardTitle>
                  <CardDescription>
                    ข้อมูลสำหรับแสดงในรายงานและใบเสร็จ
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingCompany(!isEditingCompany)}
                  disabled={isLoadingCompany}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingCompany ? "ยกเลิกแก้ไข" : "แก้ไขข้อมูล"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">ชื่อบริษัท/ห้องแล็บ</Label>
                  <Input 
                    id="company-name" 
                    placeholder="ชื่อบริษัท" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!isEditingCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name-en">ชื่อภาษาอังกฤษ</Label>
                  <Input 
                    id="company-name-en" 
                    placeholder="Company Name" 
                    value={companyNameEn}
                    onChange={(e) => setCompanyNameEn(e.target.value)}
                    disabled={!isEditingCompany}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-address">ที่อยู่</Label>
                <Textarea 
                  id="company-address" 
                  placeholder="ที่อยู่เต็ม รวมถึงรหัสไปรษณีย์"
                  className="min-h-[100px]"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  disabled={!isEditingCompany}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-phone">เบอร์โทรศัพท์</Label>
                  <Input 
                    id="company-phone" 
                    placeholder="02-xxx-xxxx" 
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    disabled={!isEditingCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">อีเมล</Label>
                  <Input 
                    id="company-email" 
                    type="email" 
                    placeholder="info@company.com" 
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    disabled={!isEditingCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">เลขประจำตัวผู้เสียภาษี</Label>
                  <Input 
                    id="tax-id" 
                    placeholder="1234567890123" 
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value)}
                    disabled={!isEditingCompany}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license-no">เลขที่ใบอนุญาต</Label>
                  <Input 
                    id="license-no" 
                    placeholder="เลขที่ใบอนุญาตประกอบกิจการ" 
                    value={companyLicense}
                    onChange={(e) => setCompanyLicense(e.target.value)}
                    disabled={!isEditingCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">เว็บไซต์</Label>
                  <Input 
                    id="website" 
                    placeholder="www.company.com" 
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    disabled={!isEditingCompany}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={loadCompanySettings}
                  disabled={isLoadingCompany}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCompany ? 'animate-spin' : ''}`} />
                  รีเฟรช
                </Button>
                <Button 
                  onClick={async () => {
                    await saveCompanySettings();
                    if (isEditingCompany) {
                      setIsEditingCompany(false);
                    }
                  }}
                  disabled={isLoadingCompany}
                  className="bg-gradient-medical hover:opacity-90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoadingCompany ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}