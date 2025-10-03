import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Search, 
  CreditCard,
  Banknote,
  Building,
  Plus,
  Minus,
  Calculator,
  TestTube,
  Printer,
  History,
  Calendar,
  User,
  Receipt,
  Edit,
  Trash2,
  X
} from "lucide-react";
import { apiService, LabTestData, LabGroupData, CompanySettingsData, OrderData } from "@/services/api";
import { printA4Receipt, A4ReceiptData } from "@/utils/receiptA4";
import { useToast } from "@/hooks/use-toast";
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from "@/lib/toast-helpers";
import { useAuth } from "@/contexts/AuthContext";
import { usePrinter } from "@/hooks/use-printer";


export default function LabOrders() {
  const { user } = useAuth();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoading, setIsLoading] = useState(false);
  const [labTests, setLabTests] = useState<LabTestData[]>([]);
  const [labGroups, setLabGroups] = useState<LabGroupData[]>([]);
  const [visitNumber, setVisitNumber] = useState("");
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [testSearchTerm, setTestSearchTerm] = useState("");
  const [visitSuggestions, setVisitSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allVisits, setAllVisits] = useState<any[]>([]);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedReceiptPrinter, setSelectedReceiptPrinter] = useState<string>("");
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  
  // Use the new printer system
  const {
    isPrinterConfigured
  } = usePrinter();
  
  const [receiptPrinterConfigured, setReceiptPrinterConfigured] = useState(false);
  const [configuredReceiptPrinter, setConfiguredReceiptPrinter] = useState<string>("");
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettingsData | null>(null);
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadLabTests();
    loadLabGroups();
    loadAllVisits();
    loadPrinterSettings();
    loadSalesHistory();
    loadCompanySettings();
    checkReceiptPrinterConfig();
  }, []);
  
  // Check receipt printer configuration
  const checkReceiptPrinterConfig = async () => {
    try {
      const configured = isPrinterConfigured('receipt');
      setReceiptPrinterConfigured(configured);
      if (configured) {
        // Import getPrinterByType from printer-utils
        const { getPrinterByType } = await import('@/lib/printer-utils');
        const printerName = getPrinterByType('receipt');
        if (printerName) {
          setConfiguredReceiptPrinter(printerName);
          setSelectedReceiptPrinter(printerName);
          console.log('Receipt printer configured:', printerName);
        }
      }
    } catch (error) {
      console.error('Error checking receipt printer configuration:', error);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const settings = await apiService.getCompanySettings();
      setCompanySettings(settings);
    } catch (error) {
      console.error('Error loading company settings:', error);
      // Use default company info if API fails
      setCompanySettings({
        name: 'LabFlow Clinic',
        nameEn: 'LabFlow Clinic',
        address: '',
        phone: '',
        email: '',
        website: '',
        taxId: '',
        license: ''
      });
    }
  };

  const loadLabTests = async () => {
    try {
      const tests = await apiService.getLabTests();
      // Sort by code alphabetically
      const sortedTests = tests.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      setLabTests(sortedTests);
    } catch (error) {
      console.error('Error loading lab tests:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการตรวจได้",
      });
    }
  };

  const loadLabGroups = async () => {
    try {
      const groups = await apiService.getLabGroups();
      // Sort by code alphabetically
      const sortedGroups = groups.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
      setLabGroups(sortedGroups);
    } catch (error) {
      console.error('Error loading lab groups:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดแพ็กเกจตรวจได้",
      });
    }
  };

  const loadAllVisits = async () => {
    try {
      const visits = await apiService.getVisits();
      console.log('Loaded visits:', visits);
      console.log('First visit patientData:', visits[0]?.patientData);
      setAllVisits(visits);
    } catch (error) {
      console.error('Error loading visits:', error);
    }
  };

  const loadPrinterSettings = () => {
    try {
      // Load printer settings from localStorage
      const printerSettings = localStorage.getItem('printerSettings');
      const availablePrintersData = localStorage.getItem('availablePrinters');
      
      if (printerSettings) {
        const settings = JSON.parse(printerSettings);
        setSelectedReceiptPrinter(settings.receipt || '');
      }
      
      if (availablePrintersData) {
        const printers = JSON.parse(availablePrintersData);
        setAvailablePrinters(printers);
      } else {
        // Fallback printers if no settings saved
        setAvailablePrinters([
          'Microsoft Print to PDF',
          'Canon PIXMA Printer',
          'HP LaserJet Pro',
          'Epson Receipt Printer'
        ]);
      }
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
  };

  const loadSalesHistory = async () => {
    setIsLoadingSales(true);
    try {
      // Load sales data from orders collection
      const orders = await apiService.getOrders();
      
      // Transform orders data for display
      const salesData = orders.map((order: any) => ({
        id: order._id,
        visitNumber: order.visitData?.visitNumber || 'N/A',
        patientName: order.visitData?.patientName || 'ไม่ระบุ',
        date: new Date(order.orderDate).toLocaleDateString('th-TH'),
        time: new Date(order.orderDate).toLocaleTimeString('th-TH', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        total: order.totalAmount,
        paymentMethod: order.paymentMethod,
        items: order.labOrders?.map((labOrder: any) => ({
          ...labOrder,
          // Include detailed test information
          testDetails: labOrder.testDetails,
          groupDetails: labOrder.groupDetails,
          individualTests: labOrder.individualTests
        })) || [],
        status: order.status,
        orderData: order
      }));
      setSalesHistory(salesData);
    } catch (error) {
      console.error('Error loading sales history:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดประวัติการขายได้",
      });
    } finally {
      setIsLoadingSales(false);
    }
  };

  const printSaleReceipt = async (sale: any) => {
    if (!selectedReceiptPrinter) {
      showWarningToast({
        title: "ไม่พบเครื่องพิมพ์",
        description: "กรุณาเลือกเครื่องพิมพ์ใบเสร็จก่อน",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Fix: Ensure patient fields are present
      const receiptData = {
        clinicName: "LabFlow Clinic",
        clinicAddress: "123 หมู่ 1 ตำบลในเมือง อำเภอเมือง จังหวัดนครราชสีมา 30000",
        clinicPhone: "044-123456",
        visitNumber: sale.visitNumber || "",
        patientName: sale.patient?.name || "",
        patientAge: sale.patient?.age || "",
        patientId: sale.patient?.idCard || "",
        date: sale.date || "",
        time: sale.time || "",
        items: (sale.items || []).map((item: any) => ({
          name: item.testName || item.name || "",
          code: item.code || "",
          price: item.price || 0,
          quantity: 1
        })),
        subtotal: sale.total || 0,
        discount: 0,
        total: sale.total || 0,
        paymentMethod: sale.paymentMethod || "",
        department: sale.department || ""
      };

      if (window.electronAPI && (window.electronAPI as any).printReceipt) {
        await (window.electronAPI as any).printReceipt(selectedReceiptPrinter, receiptData);
        showSuccessToast({
          title: "พิมพ์ใบเสร็จสำเร็จ",
          description: `พิมพ์ใบเสร็จ Visit: ${sale.visitNumber} เรียบร้อยแล้ว`,
        });
      } else if (window.electronAPI && window.electronAPI.printDocument) {
        // Fallback to generic print
        const printOptions = {
          printerName: selectedReceiptPrinter,
          content: `
            <div style="font-family: 'Sarabun', Arial, sans-serif; width: 58mm; font-size: 12px;">
              <div style="text-align: center; margin-bottom: 10px;">
                <h3>${receiptData.clinicName}</h3>
                <p>${receiptData.clinicAddress}</p>
                <p>โทร: ${receiptData.clinicPhone}</p>
              </div>
              <hr>
              <p>Visit: ${receiptData.visitNumber}</p>
              <p>ผู้ป่วย: ${receiptData.patientName}</p>
              <p>วันที่: ${receiptData.date} ${receiptData.time}</p>
              <hr>
              ${receiptData.items.map(item => `
                <div style="display: flex; justify-content: space-between;">
                  <span>${item.name}</span>
                  <span>฿${item.price.toLocaleString()}</span>
                </div>
              `).join('')}
              <hr>
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>รวม</span>
                <span>฿${receiptData.total.toLocaleString()}</span>
              </div>
              <p>ชำระโดย: ${receiptData.paymentMethod}</p>
            </div>
          `
        };
        await window.electronAPI.printDocument(printOptions);
        showSuccessToast({
          title: "พิมพ์ใบเสร็จสำเร็จ",
          description: `พิมพ์ใบเสร็จ Visit: ${sale.visitNumber} เรียบร้อยแล้ว`,
        });
      } else {
        // Web fallback - open print dialog
        window.print();
        showInfoToast({
          title: "เปิดหน้าต่างพิมพ์",
          description: "กรุณาเลือกเครื่องพิมพ์และดำเนินการพิมพ์",
        });
      }
    } catch (error) {
      console.error('Print error:', error);
      showErrorToast({
        title: "การพิมพ์ล้มเหลว",
        description: "เกิดข้อผิดพลาดในการพิมพ์ใบเสร็จ",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewSaleDetails = (sale: any) => {
    // Show detailed view of the sale in a toast or modal
    const itemsList = sale.items.map((item: any) => 
      `• ${item.testName || item.name} (${item.code || 'N/A'}) - ฿${(item.price || 0).toLocaleString()}`
    ).join('\n');

    toast({
      title: `รายละเอียดการขาย - Visit: ${sale.visitNumber}`,
      description: `
ผู้ป่วย: ${sale.patient.name}
วันที่: ${sale.date} ${sale.time}
แผนก: ${sale.department || 'ไม่ระบุ'}

รายการตรวจ:
${itemsList}

รวมทั้งสิ้น: ฿${sale.total.toLocaleString()}
ชำระโดย: ${sale.paymentMethod}
สถานะ: ${sale.status === 'completed' ? 'เสร็จสิ้น' : 'รอดำเนินการ'}
      `,
      duration: 10000,
    });
  };

  const printA4ReceiptAfterCheckout = async (order: any) => {
    if (!companySettings) {
      toast({
        title: "ไม่พบข้อมูลบริษัท",
        description: "กรุณาตั้งค่าข้อมูลบริษัทในหน้า Settings ก่อน",
        variant: "destructive",
      });
      return;
    }

    // Debug: Check printer selection
    console.log('Current selectedReceiptPrinter:', selectedReceiptPrinter);
    
    if (!selectedReceiptPrinter) {
      toast({
        title: "ไม่ได้เลือกเครื่องพิมพ์",
        description: "กรุณาเลือกเครื่องพิมพ์ใบเสร็จก่อนพิมพ์ A4",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch visit data by visitNumber to get complete patient information
      let visitData = null;
      if (order.visitNumber) {
        try {
          visitData = await apiService.getVisitByNumber(order.visitNumber);
          console.log('Fetched visit data:', visitData);
        } catch (error) {
          console.error('Failed to fetch visit data:', error);
        }
      }

      // Use visit data if available, otherwise fallback to order data
      const patient = visitData?.patientData || order.patient;
      
      const receiptData: A4ReceiptData = {
        companyInfo: companySettings,
        receiptNumber: order.visitNumber || "",
        visitNumber: order.visitNumber || "",
        date: visitData?.date || order.date || new Date().toLocaleDateString('th-TH'),
        time: visitData?.time || order.time || new Date().toLocaleTimeString('th-TH'),
        patientLn: patient?.ln || patient?.idCard || "",
        patientIdCard: patient?.idCard || patient?.nationalId || "",
        patientTitle: patient?.title || "",
        patientFirstName: patient?.firstName || "",
        patientLastName: patient?.lastName || "",
        patientAge: patient?.age || 0,
        patientPhone: patient?.phoneNumber || patient?.phone || "",
        staffName: user ? `${user.firstName} ${user.lastName}` : "เจ้าหน้าที่",
        staffPhone: user?.phone || "",
        items: (order.items || []).map((item: any) => ({
          name: item.testName || item.name || "",
          code: item.code || "",
          price: item.price || 0,
          quantity: 1
        })),
        subtotal: order.total || 0,
        discount: 0,
        total: order.total || 0,
        paymentMethod: order.paymentMethod || ""
      };

      console.log('Direct printing A4 receipt to saved printer:', selectedReceiptPrinter);
      await printA4Receipt(receiptData, selectedReceiptPrinter);
      
      toast({
        title: "พิมพ์ใบเสร็จ A4 สำเร็จ",
        description: `ส่งพิมพ์ใบเสร็จ Visit: ${order.visitNumber} ไปยัง ${selectedReceiptPrinter} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('A4 receipt print error:', error);
      toast({
        title: "การพิมพ์ใบเสร็จ A4 ล้มเหลว",
        description: `ไม่สามารถพิมพ์ไปยัง ${selectedReceiptPrinter} ได้: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const cancelReceiptFromHistory = async (sale: any) => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm(`ต้องการยกเลิกใบเสร็จ Visit: ${sale.visitNumber} หรือไม่?`);
      
      if (!confirmed) return;

      // Debug: Log sale object to check ID format
      console.log('Sale object for cancellation:', sale);
      console.log('Sale ID:', sale._id);
      console.log('Sale id:', sale.id);
      
      // Use the correct ID field - try both _id and id
      const orderId = sale._id || sale.id;
      
      if (!orderId) {
        throw new Error('ไม่พบ ID ของใบเสร็จ');
      }

      // Update order status to cancelled
      await apiService.updateOrderStatus(orderId, 'cancelled');
      
      // Reload sales history to reflect changes
      await loadSalesHistory();
      
      toast({
        title: "ยกเลิกใบเสร็จสำเร็จ",
        description: `ยกเลิกใบเสร็จ Visit: ${sale.visitNumber} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Cancel receipt error:', error);
      toast({
        title: "การยกเลิกใบเสร็จล้มเหลว",
        description: "เกิดข้อผิดพลาดในการยกเลิกใบเสร็จ",
        variant: "destructive",
      });
    }
  };

  const printA4ReceiptFromHistory = async (sale: any) => {
    if (!companySettings) {
      toast({
        title: "ไม่พบข้อมูลบริษัท",
        description: "กรุณาตั้งค่าข้อมูลบริษัทในหน้า Settings ก่อน",
        variant: "destructive",
      });
      return;
    }

    if (!receiptPrinterConfigured) {
      toast({
        title: "ไม่ได้กำหนดเครื่องพิมพ์",
        description: "กรุณาไปที่หน้า 'ตั้งค่า > เครื่องพิมพ์' เพื่อกำหนดเครื่องพิมพ์ใบเสร็จ",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch visit data by visitNumber to get complete patient information
      let visitData = null;
      if (sale.visitNumber) {
        try {
          visitData = await apiService.getVisitByNumber(sale.visitNumber);
          console.log('Fetched visit data for history:', visitData);
        } catch (error) {
          console.error('Failed to fetch visit data for history:', error);
        }
      }

      // Use visit data if available, otherwise fallback to sale data
      const patient = visitData?.patientData || sale.patientData || sale.patient;
      
      const receiptData: A4ReceiptData = {
        companyInfo: companySettings,
        receiptNumber: sale.visitNumber || "",
        visitNumber: sale.visitNumber || "",
        date: visitData?.date || sale.date || new Date().toLocaleDateString('th-TH'),
        time: visitData?.time || sale.time || new Date().toLocaleTimeString('th-TH'),
        patientLn: patient?.ln || patient?.idCard || "",
        patientIdCard: patient?.idCard || patient?.nationalId || "",
        patientTitle: patient?.title || "",
        patientFirstName: patient?.firstName || "",
        patientLastName: patient?.lastName || "",
        patientAge: patient?.age || 0,
        patientPhone: patient?.phoneNumber || patient?.phone || "",
        staffName: user ? `${user.firstName} ${user.lastName}` : "เจ้าหน้าที่",
        staffPhone: user?.phone || "",
        items: (sale.items || []).map((item: any) => ({
          name: item.testName || item.name || "",
          code: item.code || "",
          price: item.price || 0,
          quantity: 1
        })),
        subtotal: sale.total || 0,
        discount: 0,
        total: sale.total || 0,
        paymentMethod: sale.paymentMethod || ""
      };

      console.log('Printing A4 receipt to configured printer:', configuredReceiptPrinter);
      await printA4Receipt(receiptData, configuredReceiptPrinter);
      
      toast({
        title: "พิมพ์ใบเสร็จสำเร็จ",
        description: `ส่งใบเสร็จ Visit: ${sale.visitNumber} ไปยัง ${configuredReceiptPrinter} แล้ว`,
      });
    } catch (error) {
      console.error('A4 receipt print error:', error);
      toast({
        title: "การพิมพ์ใบเสร็จล้มเหลว",
        description: `ไม่สามารถพิมพ์ไปยัง ${configuredReceiptPrinter} ได้: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectPrinter = async () => {
    setIsLoading(true);
    try {
      // Check if we're in Electron environment
      if (window.electronAPI && window.electronAPI.getPrinters) {
        const printers = await window.electronAPI.getPrinters();
        
        // Filter and categorize printers - include all printers for A4 printing
        const receiptPrinters = printers.filter((p: any) => 
          (p.name && p.name.toLowerCase().includes('receipt')) ||
          (p.name && p.name.toLowerCase().includes('pos')) ||
          (p.name && p.name.toLowerCase().includes('thermal')) ||
          (p.name && p.name.toLowerCase().includes('epson')) ||
          (p.name && p.name.toLowerCase().includes('star')) ||
          (p.name && p.name.toLowerCase().includes('l3250')) ||
          (p.name && p.name.toLowerCase().includes('ttp-244')) ||
          (p.description && p.description.toLowerCase().includes('receipt')) ||
          (p.description && p.description.toLowerCase().includes('epson')) ||
          (p.description && p.description.toLowerCase().includes('tsc'))
        );
        
        const allPrinterNames = printers.map((p: any) => ({
          name: p.name,
          displayName: p.displayName || p.name,
          description: p.description || '',
          status: p.status || 'unknown',
          isDefault: p.isDefault || false,
          options: p.options || {}
        }));
        
        setAvailablePrinters(allPrinterNames.map(p => p.name));
        
        console.log('Available printers:', printers);
        console.log('Receipt printers:', receiptPrinters);
        
        // Store printer details in localStorage
        localStorage.setItem('availablePrinters', JSON.stringify(allPrinterNames.map(p => p.name)));
        localStorage.setItem('printerDetails', JSON.stringify(allPrinterNames));
        
        // Auto-select first available printer if none selected
        if (allPrinterNames.length > 0 && !selectedReceiptPrinter) {
          // Prefer Epson L3250 for A4 printing, then PDF, then any other
          let autoSelectedPrinter = allPrinterNames.find(p => 
            p.name && p.name.toLowerCase().includes('l3250')
          )?.name;
          
          if (!autoSelectedPrinter) {
            autoSelectedPrinter = allPrinterNames.find(p => 
              p.name && p.name.toLowerCase().includes('pdf')
            )?.name;
          }
          
          if (!autoSelectedPrinter) {
            autoSelectedPrinter = allPrinterNames[0].name;
          }
          
          setSelectedReceiptPrinter(autoSelectedPrinter);
          selectReceiptPrinter(autoSelectedPrinter);
        }
        
        toast({
          title: "สแกนเครื่องพิมพ์สำเร็จ",
          description: `พบเครื่องพิมพ์ ${printers.length} เครื่อง${receiptPrinters.length > 0 ? ` (เครื่องพิมพ์ใบเสร็จ ${receiptPrinters.length} เครื่อง)` : ''}`,
        });
        
        console.log('Available printers:', allPrinterNames);
        console.log('Receipt printers:', receiptPrinters);
        
      } else {
        // Web fallback - try to detect system printers
        try {
          // Try to use Web API if available
          if ('navigator' in window && 'permissions' in navigator) {
            // This is a fallback for web environments
            const fallbackPrinters = [
              'Microsoft Print to PDF',
              'Microsoft XPS Document Writer',
              'Fax',
              'OneNote (Desktop)'
            ];
            
            setAvailablePrinters(fallbackPrinters);
            localStorage.setItem('availablePrinters', JSON.stringify(fallbackPrinters));
            
            toast({
              title: "ใช้เครื่องพิมพ์เริ่มต้น",
              description: "กำลังใช้รายการเครื่องพิมพ์เริ่มต้นของระบบ",
            });
          }
        } catch (webError) {
          console.error('Web printer detection failed:', webError);
          toast({
            title: "ไม่สามารถตรวจจับเครื่องพิมพ์",
            description: "กรุณาใช้แอปพลิเคชัน Desktop เพื่อเชื่อมต่อเครื่องพิมพ์จริง",
            variant: "destructive",
          });
        }
      }
      
      setIsPrinterConnected(true);
    } catch (error) {
      console.error('Error connecting printer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อเครื่องพิมพ์ได้: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectReceiptPrinter = (printerName: string) => {
    setSelectedReceiptPrinter(printerName);
    
    // Save to localStorage
    const currentSettings = JSON.parse(localStorage.getItem('printerSettings') || '{}');
    currentSettings.receipt = printerName;
    localStorage.setItem('printerSettings', JSON.stringify(currentSettings));
    
    // Test printer connection
    testPrinterConnection(printerName);
    
    toast({
      title: "เลือกเครื่องพิมพ์ใบเสร็จ",
      description: `เลือก ${printerName} สำหรับพิมพ์ใบเสร็จ`,
    });
  };

  const testPrinterConnection = async (printerName: string) => {
    try {
      if (window.electronAPI && (window.electronAPI as any).testPrint) {
        // Test print a simple receipt
        const testReceipt = {
          title: "ทดสอบการพิมพ์",
          content: [
            "LabFlow Clinic",
            "ทดสอบเครื่องพิมพ์ใบเสร็จ",
            `เครื่องพิมพ์: ${printerName}`,
            `วันที่: ${new Date().toLocaleDateString('th-TH')}`,
            `เวลา: ${new Date().toLocaleTimeString('th-TH')}`,
            "--------------------------------",
            "การทดสอบสำเร็จ"
          ]
        };
        
        await (window.electronAPI as any).testPrint(printerName, testReceipt);
        
        toast({
          title: "ทดสอบการพิมพ์สำเร็จ",
          description: `เครื่องพิมพ์ ${printerName} พร้อมใช้งาน`,
        });
      } else if (window.electronAPI && window.electronAPI.checkPrinterStatus) {
        // Use checkPrinterStatus as fallback
        const status = await window.electronAPI.checkPrinterStatus(printerName);
        if (status.status === 'connected') {
          toast({
            title: "เครื่องพิมพ์พร้อมใช้งาน",
            description: `เครื่องพิมพ์ ${printerName} เชื่อมต่อแล้ว`,
          });
        } else {
          toast({
            title: "เครื่องพิมพ์ไม่พร้อม",
            description: status.message || `เครื่องพิมพ์ ${printerName} ไม่พร้อมใช้งาน`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Printer test failed:', error);
      toast({
        title: "การทดสอบล้มเหลว",
        description: `ไม่สามารถทดสอบเครื่องพิมพ์ ${printerName} ได้`,
        variant: "destructive",
      });
    }
  };

  const printReceipt = async () => {
    if (!selectedReceiptPrinter) {
      toast({
        title: "ไม่ได้เลือกเครื่องพิมพ์",
        description: "กรุณาเลือกเครื่องพิมพ์ใบเสร็จก่อน",
        variant: "destructive",
      });
      return;
    }
    if (!patientInfo || !patientInfo.visitNumber) {
      toast({
        title: "ไม่มีข้อมูลคนไข้",
        description: "กรุณาค้นหาข้อมูลคนไข้ก่อน",
        variant: "destructive",
      });
      return;
    }
    if (selectedTests.length === 0 && selectedGroups.length === 0) {
      toast({
        title: "ไม่ได้เลือกรายการตรวจ",
        description: "กรุณาเลือกรายการตรวจก่อน",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsLoading(true);
      // Fix: Ensure patient fields are present
      const receiptData = {
        clinic: "LabFlow Clinic",
        visitNumber: patientInfo.visitNumber || "",
        patient: {
          name: `${patientInfo.patientData?.title || patientInfo.title || ""} ${patientInfo.patientData?.firstName || patientInfo.firstName || ""} ${patientInfo.patientData?.lastName || patientInfo.lastName || ""}`.trim(),
          age: patientInfo.patientData?.age || patientInfo.age || "",
        },
        date: new Date().toLocaleDateString('th-TH'),
        time: new Date().toLocaleTimeString('th-TH'),
        items: [...selectedGroups.map(groupId => {
          const group = labGroups.find(g => g._id === groupId);
          return group ? { name: group.name, price: group.price, code: group.code, type: 'package' } : null;
        }).filter(Boolean), ...selectedTests.map(testId => {
          const test = labTests.find(t => t._id === testId);
          return test ? { name: test.name, price: test.price, code: test.code } : null;
        }).filter(Boolean)],
        total: getTotalPrice(),
        paymentMethod: paymentMethod === 'cash' ? 'เงินสด' : paymentMethod === 'transfer' ? 'โอนเงิน' : 'ใช้สิทธิ'
      };

      if (window.electronAPI && (window.electronAPI as any).printReceipt) {
        await (window.electronAPI as any).printReceipt(selectedReceiptPrinter, receiptData);
        
        toast({
          title: "พิมพ์ใบเสร็จสำเร็จ",
          description: `พิมพ์ใบเสร็จด้วยเครื่องพิมพ์ ${selectedReceiptPrinter}`,
        });
      } else if (window.electronAPI && window.electronAPI.printDocument) {
        // Use printDocument as fallback with proper Thai encoding
        const receiptText = [
          receiptData.clinic,
          `Visit: ${receiptData.visitNumber}`,
          `Patient: ${receiptData.patient.name}`, // Use English for printer compatibility
          `Date: ${receiptData.date} ${receiptData.time}`,
          '================================',
          ...receiptData.items.map((item: any) => `${item.name} - ${item.price.toLocaleString()} THB`),
          '================================',
          `Total: ${receiptData.total.toLocaleString()} THB`,
          `Payment: ${receiptData.paymentMethod}`,
          '================================',
          'Thank you for your service'
        ].join('\n');
        
        await window.electronAPI.printDocument({
          printerName: selectedReceiptPrinter,
          content: receiptText,
          type: 'receipt'
        });
        
        toast({
          title: "พิมพ์ใบเสร็จสำเร็จ",
          description: `พิมพ์ใบเสร็จด้วยเครื่องพิมพ์ ${selectedReceiptPrinter}`,
        });
      } else {
        // Fallback for web environment
        window.print();
        toast({
          title: "เปิดหน้าต่างพิมพ์",
          description: "กรุณาเลือกเครื่องพิมพ์จากหน้าต่างที่เปิดขึ้น",
        });
      }
    } catch (error) {
      console.error('Print failed:', error);
      toast({
        title: "การพิมพ์ล้มเหลว",
        description: "ไม่สามารถพิมพ์ใบเสร็จได้: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitNumberChange = (value: string) => {
    setVisitNumber(value);
    
    // Show suggestions when user types 2 or more digits
    if (value.length >= 2) {
      const suggestions = allVisits.filter(visit => 
        visit.visitNumber && typeof visit.visitNumber === 'string' && visit.visitNumber.includes(value)
      ).slice(0, 5); // Limit to 5 suggestions
      
      setVisitSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setVisitSuggestions([]);
    }
  };

  const selectVisitSuggestion = (visit: any) => {
    setVisitNumber(visit.visitNumber);
    setPatientInfo(visit);
    setShowSuggestions(false);
    setVisitSuggestions([]);
    
    toast({
      title: "เลือกข้อมูลคนไข้",
      description: `เลือก Visit ${visit.visitNumber}`,
    });
  };

  const searchVisit = async () => {
    if (!visitNumber.trim()) {
      toast({
        title: "กรุณากรอกหมายเลข Visit",
        description: "กรุณากรอกหมายเลข Visit เพื่อค้นหาข้อมูลคนไข้",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Search for visit by visit number
      const visit = allVisits.find(v => v.visitNumber === visitNumber);
      
      if (visit) {
        setPatientInfo(visit);
        setShowSuggestions(false);
        toast({
          title: "พบข้อมูลคนไข้",
          description: `พบข้อมูล Visit ${visitNumber}`,
        });
      } else {
        setPatientInfo(null);
        toast({
          title: "ไม่พบข้อมูล",
          description: `ไม่พบ Visit ${visitNumber} ในระบบ`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching visit:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถค้นหาข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSelection = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTests([...selectedTests, testId]);
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    }
  };

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups([...selectedGroups, groupId]);
    } else {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    }
  };

  const getTotalPrice = () => {
    const testsTotal = selectedTests.reduce((total, testId) => {
      const test = labTests.find(t => t._id === testId);
      return total + (test?.price || 0);
    }, 0);
    
    const groupsTotal = selectedGroups.reduce((total, groupId) => {
      const group = labGroups.find(g => g._id === groupId);
      return total + (group?.price || 0);
    }, 0);
    
    return testsTotal + groupsTotal;
  };

  const filteredLabTests = labTests.filter(test => 
    (test.name && test.name.toLowerCase().includes(testSearchTerm.toLowerCase())) ||
    (test.code && test.code.toLowerCase().includes(testSearchTerm.toLowerCase()))
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    // Fix: Ensure patientInfo and visitNumber are present
    if (!patientInfo || !patientInfo.visitNumber) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกผู้ป่วยก่อนทำการชำระเงิน",
        variant: "destructive",
      });
      return;
    }

    if (selectedTests.length === 0 && selectedGroups.length === 0) {
      toast({
        title: "ไม่มีรายการตรวจ",
        description: "กรุณาเลือกรายการตรวจก่อนทำการชำระเงิน",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare lab orders data
      const selectedTestObjects = labTests.filter(test => selectedTests.includes(test._id));
      const selectedGroupObjects = labGroups.filter(group => selectedGroups.includes(group._id));
      
      const labOrders = [
        ...selectedTestObjects.map(test => ({
          testId: test._id,
          testName: test.name,
          code: test.code,
          price: test.price,
          type: 'individual' as const
        })),
        ...selectedGroupObjects.map(group => ({
          testId: group._id,
          testName: group.name,
          code: group.code,
          price: group.price,
          type: 'package' as const
        }))
      ];

      // Create order data
      const orderData = {
        visitId: patientInfo._id || "",
        labOrders: labOrders,
        totalAmount: getTotalPrice(),
        paymentMethod: paymentMethod === 'cash' ? 'เงินสด' : 
                      paymentMethod === 'transfer' ? 'โอนเงิน' : 
                      paymentMethod === 'insurance' ? 'สปสช.' : 'เงินสด',
        status: 'pending' as const,
        orderDate: new Date()
      };

      // Save order to database
      const savedOrder = await apiService.createOrder(orderData);
      
      // Update status from pending to process
      await apiService.updateOrderStatus(savedOrder._id!, 'process');

      // Prepare display data for order history
      const displayOrderData = {
        id: savedOrder._id,
        visitNumber: patientInfo.visitNumber || "",
        patient: {
          name: `${patientInfo.patientData?.title || patientInfo.title || ""} ${patientInfo.patientData?.firstName || patientInfo.firstName || ""} ${patientInfo.patientData?.lastName || patientInfo.lastName || ""}`.trim(),
          age: patientInfo.patientData?.age || patientInfo.age || "",
          idCard: patientInfo.patientData?.idCard || patientInfo.idCard || "",
          phone: patientInfo.patientData?.phoneNumber || patientInfo.phoneNumber || "",
        },
        date: new Date().toLocaleDateString('th-TH'),
        time: new Date().toLocaleTimeString('th-TH'),
        items: labOrders,
        total: getTotalPrice(),
        paymentMethod: orderData.paymentMethod,
        status: 'process' as const
      };

      // Reload sales history from database
      await loadSalesHistory();

      // Print A4 receipt automatically after successful checkout
      await printA4ReceiptAfterCheckout(displayOrderData);

      // Reset form
      setSelectedTests([]);
      setSelectedGroups([]);
      setPatientInfo(null);
      setVisitNumber('');
      setPaymentMethod('cash');

      showSuccessToast({
        title: "ชำระเงินสำเร็จ",
        description: `บันทึกรายการตรวจและพิมพ์ใบเสร็จ A4 สำหรับ Visit: ${patientInfo.visitNumber} เรียบร้อยแล้ว`,
      });

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const printReceiptAfterCheckout = async (order: any) => {
    try {
      // Fix: Ensure patient fields are present
      const receiptData = {
        clinicName: "LabFlow Clinic",
        clinicAddress: "123 หมู่ 1 ตำบลในเมือง อำเภอเมือง จังหวัดนครราชสีมา 30000",
        clinicPhone: "044-123456",
        visitNumber: order.visitNumber || "",
        patientName: order.patient?.name || "",
        patientAge: order.patient?.age || "",
        patientId: order.patient?.idCard || "",
        date: order.date || "",
        time: order.time || "",
        items: (order.items || []).map((item: any) => ({
          name: item.testName || item.name || "",
          code: item.code || "",
          price: item.price || 0,
          quantity: 1
        })),
        subtotal: order.total || 0,
        discount: 0,
        total: order.total || 0,
        paymentMethod: order.paymentMethod || "",
        department: 'Laboratory'
      };

      if (window.electronAPI && (window.electronAPI as any).printReceipt) {
        await (window.electronAPI as any).printReceipt(selectedReceiptPrinter, receiptData);
      } else if (window.electronAPI && window.electronAPI.printDocument) {
        const printOptions = {
          printerName: selectedReceiptPrinter,
          content: `
            <div style="font-family: 'Sarabun', Arial, sans-serif; width: 58mm; font-size: 12px;">
              <div style="text-align: center; margin-bottom: 10px;">
                <h3>${receiptData.clinicName}</h3>
                <p>${receiptData.clinicAddress}</p>
                <p>โทร: ${receiptData.clinicPhone}</p>
              </div>
              <hr>
              <p>Visit: ${receiptData.visitNumber}</p>
              <p>ผู้ป่วย: ${receiptData.patientName}</p>
              <p>วันที่: ${receiptData.date} ${receiptData.time}</p>
              <hr>
              ${receiptData.items.map(item => `
                <div style="display: flex; justify-content: space-between;">
                  <span>${item.name}</span>
                  <span>฿${item.price.toLocaleString()}</span>
                </div>
              `).join('')}
              <hr>
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>รวม</span>
                <span>฿${receiptData.total.toLocaleString()}</span>
              </div>
              <p>ชำระโดย: ${receiptData.paymentMethod}</p>
            </div>
          `
        };
        await window.electronAPI.printDocument(printOptions);
      }
    } catch (error) {
      console.error('Auto-print receipt error:', error);
      // Don't show error toast for auto-print failure, as main transaction succeeded
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "transfer":
        return <CreditCard className="h-4 w-4" />;
      case "insurance":
        return <Building className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card-custom border border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-primary/20">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">ซื้อรายการตรวจ</h1>
                <p className="text-sm text-muted-foreground">เลือกรายการตรวจและชำระเงิน</p>
              </div>
            </div>
            
            {/* Printer Connection Controls */}
            <div className="flex items-center gap-2">
              {selectedReceiptPrinter && (
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {selectedReceiptPrinter}
                </div>
              )}
              
              <Button
                onClick={connectPrinter}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Printer className={`h-4 w-4 mr-2 ${isPrinterConnected ? 'text-green-600' : 'text-primary'}`} />
                {isPrinterConnected ? 'เชื่อมต่อแล้ว' : 'เชื่อมต่อเครื่องพิมพ์'}
              </Button>
              
              {availablePrinters.length > 0 && (
                <select
                  value={selectedReceiptPrinter}
                  onChange={(e) => selectReceiptPrinter(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">เลือกเครื่องพิมพ์</option>
                  {availablePrinters.map((printer) => (
                    <option key={printer} value={printer}>
                      {printer}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lab Tests Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                ข้อมูลคนไข้
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="visit-number">หมายเลข Visit</Label>
                    <div className="flex gap-2 relative">
                      <div className="flex-1 relative">
                        <Input 
                          id="visit-number"
                          placeholder="กรอกหมายเลข Visit (เช่น 24010001)"
                          value={visitNumber}
                          onChange={(e) => handleVisitNumberChange(e.target.value)}
                          onFocus={() => {
                            if (visitNumber.length >= 2 && visitSuggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding suggestions to allow clicking on them
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                        />
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && visitSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {visitSuggestions.map((visit, index) => (
                              <div
                                key={visit._id || index}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => selectVisitSuggestion(visit)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Visit: {visit.visitNumber}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {visit.patientData?.title} {visit.patientData?.firstName} {visit.patientData?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(visit.visitDate).toLocaleDateString('th-TH')}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {visit.patientData?.age} ปี
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={searchVisit}
                        disabled={isLoading}
                        variant="outline"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Selected Patient Info */}
                {patientInfo ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-foreground">คนไข้:</span>
                        <span className="ml-2 text-muted-foreground">
                          {patientInfo.patientData?.title} {patientInfo.patientData?.firstName} {patientInfo.patientData?.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">อายุ:</span>
                        <span className="ml-2 text-muted-foreground">{patientInfo.patientData?.age} ปี</span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Visit:</span>
                        <span className="ml-2 text-muted-foreground">{patientInfo.visitNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">วันที่:</span>
                        <span className="ml-2 text-muted-foreground">
                          {new Date(patientInfo.visitDate).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-center text-muted-foreground">
                      กรุณาค้นหาข้อมูลคนไข้ด้วยหมายเลข Visit
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lab Tests */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                เลือกรายการตรวจ
              </CardTitle>
              <CardDescription>
                เลือกรายการตรวจที่ต้องการ ({selectedTests.length + selectedGroups.length} รายการ)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="ค้นหารายการตรวจ..."
                    className="pl-10"
                    value={testSearchTerm}
                    onChange={(e) => setTestSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Lab Groups */}
                  {labGroups.length > 0 && (
                    <div>
                      <Label className="font-semibold text-purple-600 flex items-center gap-2 mb-3">
                        <TestTube className="h-4 w-4" />
                        แพ็กเกจตรวจ
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {labGroups.map((group) => (
                          <div
                            key={group._id}
                            className={`p-3 border rounded-lg transition-all cursor-pointer ${
                              selectedGroups.includes(group._id!)
                                ? 'border-purple-500 bg-purple-100 shadow-md ring-2 ring-purple-200'
                                : 'border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300'
                            }`}
                            onClick={() => handleGroupSelection(group._id!, !selectedGroups.includes(group._id!))}
                          >
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={group._id}
                                checked={selectedGroups.includes(group._id!)}
                                onCheckedChange={(checked) => handleGroupSelection(group._id!, checked as boolean)}
                                className="mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={group._id} className="font-medium text-foreground cursor-pointer block">
                                  {group.name}
                                </Label>
                                <p className="text-sm text-muted-foreground truncate">รหัส: {group.code}</p>
                                <p className="text-xs text-purple-600">{group.labTests?.length || 0} รายการตรวจ</p>
                                <div className="mt-2">
                                  <span className="font-semibold text-purple-600">฿{group.price.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual Lab Tests */}
                  {Object.entries(
                    filteredLabTests.reduce((acc, test) => {
                      if (!acc[test.category]) acc[test.category] = [];
                      acc[test.category].push(test);
                      return acc;
                    }, {} as Record<string, LabTestData[]>)
                  ).map(([category, tests]) => (
                    <div key={category}>
                      <Label className="font-semibold text-primary mb-3 block">{category}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tests.map((test) => (
                          <div
                            key={test._id}
                            className={`p-3 border rounded-lg transition-all cursor-pointer ${
                              selectedTests.includes(test._id!)
                                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                : 'border-border bg-background hover:bg-muted/30 hover:border-blue-300'
                            }`}
                            onClick={() => handleTestSelection(test._id!, !selectedTests.includes(test._id!))}
                          >
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={test._id}
                                checked={selectedTests.includes(test._id!)}
                                onCheckedChange={(checked) => handleTestSelection(test._id!, checked as boolean)}
                                className="mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={test._id} className="font-medium text-foreground cursor-pointer block">
                                  {test.name}
                                </Label>
                                <p className="text-sm text-muted-foreground truncate">รหัส: {test.code}</p>
                                <div className="mt-2">
                                  <span className="font-semibold text-primary">฿{test.price.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Payment */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                สรุปคำสั่งซื้อ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {selectedTests.length === 0 && selectedGroups.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    ยังไม่ได้เลือกรายการตรวจ
                  </p>
                ) : (
                  <>
                    {/* Selected Groups */}
                    {selectedGroups.map((groupId) => {
                      const group = labGroups.find(g => g._id === groupId);
                      return group ? (
                        <div key={groupId} className="flex items-center justify-between text-sm bg-purple-50 p-2 rounded">
                          <span className="text-foreground font-medium">{group.name}</span>
                          <span className="font-medium text-purple-600">฿{group.price.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                    
                    {/* Selected Individual Tests */}
                    {selectedTests.map((testId) => {
                      const test = labTests.find(t => t._id === testId);
                      return test ? (
                        <div key={testId} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{test.name}</span>
                          <span className="font-medium">฿{test.price.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                  </>
                )}
              </div>
              
              {(selectedTests.length > 0 || selectedGroups.length > 0) && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>รวมทั้งสิ้น</span>
                    <span className="text-primary">฿{getTotalPrice().toLocaleString()}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                วิธีการชำระเงิน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-4 w-4 text-success" />
                    เงินสด
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                    โอนเงิน
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="insurance" id="insurance" />
                  <Label htmlFor="insurance" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building className="h-4 w-4 text-warning" />
                    ใช้สิทธิ
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "insurance" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="insurance-number">เลขบัตร สปสช.</Label>
                  <Input 
                    id="insurance-number"
                    placeholder="กรอกเลขบัตร สปสช."
                  />
                </div>
              )}

              {/* Receipt Printer Status */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${receiptPrinterConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">เครื่องพิมพ์ใบเสร็จ</span>
                    {receiptPrinterConfigured && (
                      <span className="text-xs text-muted-foreground">({configuredReceiptPrinter})</span>
                    )}
                  </div>
                </div>
                
                {!receiptPrinterConfigured && (
                  <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    ⚠️ กรุณาไปที่หน้า "ตั้งค่า &gt; เครื่องพิมพ์" เพื่อกำหนดเครื่องพิมพ์ใบเสร็จ
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-6">
                <Button 
                  onClick={handleCheckout}
                  disabled={(selectedTests.length === 0 && selectedGroups.length === 0) || !patientInfo || isLoading}
                  className="w-full bg-gradient-medical hover:opacity-90"
                >
                  {getPaymentIcon(paymentMethod)}
                  <span className="ml-2">
                    {isLoading ? "กำลังดำเนินการ..." : `ชำระเงิน ฿${getTotalPrice().toLocaleString()}`}
                  </span>
                </Button>
                
                {/* Improved Print Receipt Button */}
                {(selectedTests.length > 0 || selectedGroups.length > 0) && patientInfo && (
                  <Button 
                    onClick={printReceipt}
                    disabled={isLoading || !receiptPrinterConfigured}
                    variant="outline"
                    className="w-full"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    {receiptPrinterConfigured ? 
                      `พิมพ์ใบเสร็จ (${configuredReceiptPrinter})` : 
                      'ตั้งค่าเครื่องพิมพ์ก่อน'
                    }
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sales History Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                ประวัติการขาย
              </CardTitle>
              <CardDescription>
                รายการขายที่ดำเนินการแล้วจากฐานข้อมูล
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSales ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">กำลังโหลดประวัติการขาย...</p>
                </div>
              ) : salesHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีประวัติการขาย</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="ค้นหาด้วยเลข Visit หรือชื่อผู้ป่วย..."
                      className="pl-10"
                      value={salesSearchTerm}
                      onChange={(e) => setSalesSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Filtered Sales History */}
                  {salesHistory
                    .filter(sale => {
                      if (!salesSearchTerm.trim()) return true;
                      const searchTerm = salesSearchTerm.toLowerCase();
                      return (
                        (sale.visitNumber && sale.visitNumber.toLowerCase().includes(searchTerm)) ||
                        (sale.patient && sale.patient.name && sale.patient.name.toLowerCase().includes(searchTerm))
                      );
                    })
                    .map((sale) => (
                    <div key={sale.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Visit: {sale.visitNumber}
                            </Badge>
                            <Badge variant={
                              sale.status === 'completed' ? 'default' : 
                              sale.status === 'cancelled' ? 'destructive' : 'secondary'
                            } className="text-xs">
                              {sale.status === 'completed' ? 'เสร็จสิ้น' : 
                               sale.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'รอดำเนินการ'}
                            </Badge>
                            {sale.department && (
                              <Badge variant="secondary" className="text-xs">
                                {sale.department}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{sale.patient?.name || sale.patientName || 'ไม่ระบุชื่อ'}</p>
                            {sale.patient?.age && (
                              <span className="text-sm text-muted-foreground">
                                (อายุ {sale.patient.age} ปี)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{sale.date} {sale.time}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">฿{sale.total.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{sale.paymentMethod}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">รายการตรวจ:</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {sale.items.map((item: any, index: number) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm bg-muted/20 rounded p-2">
                                <span className="flex items-center gap-2">
                                  <TestTube className="h-3 w-3 text-blue-500" />
                                  <span className="font-medium">{item.testName || item.name}</span>
                                  {item.code && (
                                    <span className="text-xs text-muted-foreground">({item.code})</span>
                                  )}
                                  {item.type === 'package' && (
                                    <Badge variant="secondary" className="text-xs">แพ็กเกจ</Badge>
                                  )}
                                </span>
                                <span className="font-medium">฿{(item.price || 0).toLocaleString()}</span>
                              </div>
                              
                              {/* Show individual tests for packages */}
                              {item.type === 'package' && item.individualTests && item.individualTests.length > 0 && (
                                <div className="ml-6 space-y-1">
                                  {item.individualTests.map((test: any, testIndex: number) => (
                                    <div key={testIndex} className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 rounded px-2 py-1">
                                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                      <span>{test?.name || 'ไม่ระบุชื่อ'}</span>
                                      {test?.code && (
                                        <span className="text-xs">({test.code})</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex gap-2">                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printA4ReceiptFromHistory(sale)}
                          className="flex-1"
                          disabled={sale.status === 'cancelled' || !receiptPrinterConfigured}
                          title={!receiptPrinterConfigured ? 'กรุณาตั้งค่าเครื่องพิมพ์ก่อน' : ''}
                        >
                          <Receipt className="h-3 w-3 mr-1" />
                          {receiptPrinterConfigured ? 'พิมพ์ใบเสร็จ' : 'ตั้งค่าเครื่องพิมพ์'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelReceiptFromHistory(sale)}
                          className="flex-1"
                          disabled={sale.status === 'cancelled'}
                        >
                          <X className="h-3 w-3 mr-1" />
                          ยกเลิกใบเสร็จ
                        </Button>                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadSalesHistory()}
                          className="flex-1"
                        >
                          <History className="h-3 w-3 mr-1" />
                          รีเฟรช
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* No Results Message */}
                  {salesHistory.filter(sale => {
                    if (!salesSearchTerm.trim()) return true;
                    const searchTerm = salesSearchTerm.toLowerCase();
                    return (
                      (sale.visitNumber && sale.visitNumber.toLowerCase().includes(searchTerm)) ||
                      (sale.patient && sale.patient.name && sale.patient.name.toLowerCase().includes(searchTerm))
                    );
                  }).length === 0 && salesSearchTerm.trim() && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>ไม่พบผลการค้นหาสำหรับ "{salesSearchTerm}"</p>
                      <p className="text-sm mt-2">ลองค้นหาด้วยเลข Visit หรือชื่อผู้ป่วย</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}