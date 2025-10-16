import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<any>(null);
  const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false);
  const [showAllSales, setShowAllSales] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [purchasedTestIds, setPurchasedTestIds] = useState<string[]>([]);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  // Display data: use search results when searching, otherwise use sales history
  const displayData = useMemo(() => {
    return salesSearchTerm.trim() ? searchResults : salesHistory;
  }, [salesHistory, searchResults, salesSearchTerm]);

  // Reset showAllSales when searching
  useEffect(() => {
    if (salesSearchTerm.trim()) {
      setShowAllSales(false);
    }
  }, [salesSearchTerm]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (salesSearchTerm.trim()) {
        searchSales(salesSearchTerm);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500); // รอ 500ms หลังจากหยุดพิมพ์

    return () => clearTimeout(timeoutId);
  }, [salesSearchTerm]);

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
    
    // Show loading toast with progress
    const loadingToast = showInfoToast({
      title: "กำลังโหลดประวัติการขาย",
      description: "กรุณารอสักครู่...",
    });
    
    try {
      // Load only 5 latest sales data from orders collection
      const startTime = Date.now();
      console.log('🔄 Loading sales history with params:', {
        limit: 5,
        sortBy: 'orderDate',
        sortOrder: 'desc'
      });
      
      const orders = await apiService.getOrders({
        limit: 5,
        sortBy: 'orderDate',
        sortOrder: 'desc'
      });
      const loadTime = Date.now() - startTime;
      
      console.log('✅ Loaded orders:', {
        count: orders.length,
        loadTime: `${(loadTime / 1000).toFixed(1)}s`,
        firstOrder: orders[0] ? {
          id: orders[0]._id,
          visitNumber: orders[0].visitData?.visitNumber,
          orderDate: orders[0].orderDate
        } : null
      });
      
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
      
      // Sort by date (newest first) for better performance
      salesData.sort((a, b) => new Date(b.orderData.orderDate).getTime() - new Date(a.orderData.orderDate).getTime());
      
      setSalesHistory(salesData);
      
      // Show success message with performance info
      showSuccessToast({
        title: "โหลดประวัติการขายสำเร็จ",
        description: `โหลด ${salesData.length} รายการล่าสุด ใช้เวลา ${(loadTime / 1000).toFixed(1)} วินาที`,
      });
      
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

  // Search sales from API
  const searchSales = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching sales with params:', {
        search: searchTerm,
        limit: 50,
        sortBy: 'orderDate',
        sortOrder: 'desc'
      });
      
      const orders = await apiService.getOrders({
        search: searchTerm,
        limit: 50, // จำกัดผลการค้นหาไม่เกิน 50 รายการ
        sortBy: 'orderDate',
        sortOrder: 'desc'
      });
      
      console.log('🔍 Search results:', {
        searchTerm,
        count: orders.length,
        firstResult: orders[0] ? {
          id: orders[0]._id,
          visitNumber: orders[0].visitData?.visitNumber,
          patientName: orders[0].visitData?.patientName
        } : null
      });

      // Transform search results
      const searchData = orders.map((order: any) => ({
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
          testDetails: labOrder.testDetails,
          groupDetails: labOrder.groupDetails,
          individualTests: labOrder.individualTests
        })) || [],
        status: order.status,
        orderData: order
      }));

      setSearchResults(searchData);
    } catch (error) {
      console.error('Error searching sales:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาดในการค้นหา",
        description: "ไม่สามารถค้นหาประวัติการขายได้",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Load existing orders for current visit to prevent duplicate purchases
  const loadExistingOrdersForVisit = async (visitId: string) => {
    if (!visitId) {
      setExistingOrders([]);
      setPurchasedTestIds([]);
      return;
    }

    try {
      console.log('🔍 Loading existing orders for visit:', visitId);
      
      // Get all orders and filter by visitId (more reliable than search)
      const orders = await apiService.getOrders({
        limit: 1000 // Get more orders to ensure we find all for this visit
      });

      // Filter orders that match this visitId exactly and are not cancelled
      const visitOrders = orders.filter(order => {
        // Check multiple possible ID formats
        const orderVisitId = order.visitId;
        const orderVisitNumber = order.visitData?.visitNumber;
        const currentVisitNumber = patientInfo?.visitNumber;
        
        const matchesVisit = orderVisitId === visitId || 
                            orderVisitId === visitId.toString() ||
                            (orderVisitNumber && currentVisitNumber && orderVisitNumber === currentVisitNumber);
        
        // Only include orders that are not cancelled
        const isNotCancelled = order.status !== 'cancelled';
        
        return matchesVisit && isNotCancelled;
      });

      console.log('📋 Found existing orders for visit:', {
        visitId,
        visitNumber: patientInfo?.visitNumber,
        ordersCount: visitOrders.length,
        orders: visitOrders
      });

      setExistingOrders(visitOrders);

      // Extract all purchased test IDs (both individual tests and groups)
      const purchasedIds: string[] = [];
      visitOrders.forEach(order => {
        if (order.labOrders && Array.isArray(order.labOrders)) {
          order.labOrders.forEach((labOrder: any) => {
            if (labOrder.testId) {
              purchasedIds.push(labOrder.testId);
            }
          });
        }
      });

      setPurchasedTestIds(purchasedIds);
      
      if (purchasedIds.length > 0) {
        showInfoToast({
          title: "พบรายการที่เคยซื้อแล้ว",
          description: `Visit นี้เคยซื้อรายการตรวจไปแล้ว ${purchasedIds.length} รายการ (จะแสดงเป็นสีเทา)`,
        });
      }

    } catch (error) {
      console.error('Error loading existing orders:', error);
      setExistingOrders([]);
      setPurchasedTestIds([]);
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

  const viewSaleDetails = async (sale: any) => {
    console.log('Sale details:', sale); // Debug: ดูโครงสร้างข้อมูล
    console.log('Order data:', sale.orderData); // Debug: ดู orderData
    
    // ลองดึงข้อมูลผู้ป่วยเพิ่มเติมจาก visitId
    if (sale.orderData?.visitId) {
      try {
        const visitData = await apiService.getVisitByNumber(sale.visitNumber);
        console.log('Visit data:', visitData); // Debug: ดูข้อมูล visit
        
        // เพิ่มข้อมูลผู้ป่วยเข้าไปใน sale object
        const enhancedSale = {
          ...sale,
          patient: visitData?.patientData || null
        };
        
        setSelectedSaleForDetails(enhancedSale);
      } catch (error) {
        console.error('Failed to fetch visit data:', error);
        setSelectedSaleForDetails(sale);
      }
    } else {
      setSelectedSaleForDetails(sale);
    }
    
    setShowSaleDetailsModal(true);
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
      // Prevent multiple clicks
      if (isCancelling) {
        console.log('Cancel already in progress, ignoring...');
        return;
      }
      
      // Show confirmation dialog
      const confirmed = window.confirm(`ต้องการยกเลิกใบเสร็จ Visit: ${sale.visitNumber} หรือไม่?`);
      
      if (!confirmed) return;

      setIsCancelling(true);
      
      // Show loading toast
      showInfoToast({
        title: "กำลังยกเลิกใบเสร็จ",
        description: "กรุณารอสักครู่...",
      });

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
      console.log('🔄 Updating order status to cancelled...');
      await apiService.updateOrderStatus(orderId, 'cancelled');
      console.log('✅ Order status updated successfully');
      
      // Reload sales history to reflect changes
      console.log('🔄 Reloading sales history...');
      await loadSalesHistory();
      console.log('✅ Sales history reloaded');
      
      // Reload existing orders for current visit to update purchasedTestIds
      if (patientInfo && patientInfo._id) {
        console.log('🔄 Reloading existing orders for current visit...');
        await loadExistingOrdersForVisit(patientInfo._id);
        console.log('✅ Existing orders reloaded');
      }
      
      showSuccessToast({
        title: "ยกเลิกใบเสร็จสำเร็จ",
        description: `ยกเลิกใบเสร็จ Visit: ${sale.visitNumber} เรียบร้อยแล้ว - สามารถเลือกรายการใหม่ได้แล้ว`,
      });
      
    } catch (error) {
      console.error('Cancel receipt error:', error);
      showErrorToast({
        title: "การยกเลิกใบเสร็จล้มเหลว",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการยกเลิกใบเสร็จ",
      });
    } finally {
      setIsCancelling(false);
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
      
      // Show loading toast
      toast({
        title: "กำลังพิมพ์ใบเสร็จ",
        description: "กรุณารอสักครู่...",
      });
      
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
        paymentMethod: paymentMethod === 'cash' ? 'เงินสด' : 
                      paymentMethod === 'transfer' ? 'โอนเงิน' : 
                      paymentMethod === 'credit' ? 'เครดิต' : 
                      paymentMethod === 'free' ? 'ฟรี' : 'เงินสด'
      };

      if (window.electronAPI && (window.electronAPI as any).printReceipt) {
        // Add timeout wrapper to prevent hanging
        const printPromise = (window.electronAPI as any).printReceipt(selectedReceiptPrinter, receiptData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('การพิมพ์ใบเสร็จหมดเวลา')), 20000)
        );
        
        const result = await Promise.race([printPromise, timeoutPromise]);
        
        if (result && result.success) {
          toast({
            title: "พิมพ์ใบเสร็จสำเร็จ",
            description: result.message || `พิมพ์ใบเสร็จด้วยเครื่องพิมพ์ ${selectedReceiptPrinter}`,
          });
        } else {
          throw new Error(result?.message || 'การพิมพ์ใบเสร็จล้มเหลว');
        }
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
      
      // Determine error type and show appropriate message
      let errorMessage = "ไม่สามารถพิมพ์ใบเสร็จได้";
      let errorDescription = (error as Error).message;
      
      if (errorDescription.includes('หมดเวลา') || errorDescription.includes('Timeout')) {
        errorMessage = "การพิมพ์หมดเวลา";
        errorDescription = "การพิมพ์ใช้เวลานานเกินไป กรุณาตรวจสอบเครื่องพิมพ์และลองใหม่";
      } else if (errorDescription.includes('ไม่พบเครื่องพิมพ์') || errorDescription.includes('printer')) {
        errorMessage = "ปัญหาเครื่องพิมพ์";
        errorDescription = "ไม่สามารถเชื่อมต่อเครื่องพิมพ์ได้ กรุณาตรวจสอบการเชื่อมต่อ";
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitNumberChange = (value: string) => {
    setVisitNumber(value);
    
    // Reset purchased test IDs when changing visit number
    if (value !== patientInfo?.visitNumber) {
      setPurchasedTestIds([]);
      setExistingOrders([]);
    }
    
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

  const selectVisitSuggestion = async (visit: any) => {
    setVisitNumber(visit.visitNumber);
    setPatientInfo(visit);
    setShowSuggestions(false);
    setVisitSuggestions([]);
    
    // Load existing orders for this visit
    await loadExistingOrdersForVisit(visit._id);
    
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
        
        // Load existing orders for this visit
        await loadExistingOrdersForVisit(visit._id);
        
        toast({
          title: "พบข้อมูลคนไข้",
          description: `พบ Visit ${visitNumber}`,
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
    // Check if this test was already purchased
    if (purchasedTestIds.includes(testId)) {
      toast({
        title: "รายการนี้เคยซื้อแล้ว",
        description: "Visit นี้เคยซื้อรายการตรวจนี้ไปแล้ว ไม่สามารถซื้อซ้ำได้",
        variant: "destructive",
      });
      return;
    }

    if (checked) {
      setSelectedTests([...selectedTests, testId]);
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    }
  };

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    // Check if this group was already purchased
    if (purchasedTestIds.includes(groupId)) {
      toast({
        title: "แพ็กเกจนี้เคยซื้อแล้ว",
        description: "Visit นี้เคยซื้อแพ็กเกจตรวจนี้ไปแล้ว ไม่สามารถซื้อซ้ำได้",
        variant: "destructive",
      });
      return;
    }

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
                      paymentMethod === 'credit' ? 'เครดิต' : 
                      paymentMethod === 'free' ? 'ฟรี' : 'เงินสด',
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

      // Scroll to top after successful checkout
      window.scrollTo({ top: 0, behavior: 'smooth' });

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
        // Add timeout wrapper to prevent hanging
        const printPromise = (window.electronAPI as any).printReceipt(selectedReceiptPrinter, receiptData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('การพิมพ์ใบเสร็จหมดเวลา')), 20000)
        );
        
        const result = await Promise.race([printPromise, timeoutPromise]);
        
        if (!result || !result.success) {
          throw new Error(result?.message || 'การพิมพ์ใบเสร็จล้มเหลว');
        }
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
      
      // Show a subtle warning for auto-print failure
      toast({
        title: "การพิมพ์อัตโนมัติล้มเหลว",
        description: "บันทึกข้อมูลสำเร็จแล้ว แต่ไม่สามารถพิมพ์ใบเสร็จอัตโนมัติได้",
        variant: "destructive",
      });
    }
  };

  // ฟังก์ชันกำหนดสีสำหรับประเภทรายการตรวจ
  const getTestCategoryColor = (category: string) => {
    const categoryLower = category.toLowerCase();
    
    if (categoryLower.includes('outlab')) {
      return {
        border: 'border-orange-300 dark:border-orange-600',
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        selectedBg: 'bg-orange-100 dark:bg-orange-900/30',
        selectedBorder: 'border-orange-500 dark:border-orange-400',
        hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/20',
        hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-500',
        text: 'text-orange-600 dark:text-orange-400',
        label: 'text-orange-700 dark:text-orange-300',
        ring: 'ring-orange-200 dark:ring-orange-700'
      };
    } else if (categoryLower.includes('clinical')) {
      return {
        border: 'border-blue-300 dark:border-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        selectedBg: 'bg-blue-100 dark:bg-blue-900/30',
        selectedBorder: 'border-blue-500 dark:border-blue-400',
        hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/20',
        hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        label: 'text-blue-700 dark:text-blue-300',
        ring: 'ring-blue-200 dark:ring-blue-700'
      };
    } else if (categoryLower.includes('nhso')) {
      return {
        border: 'border-green-300 dark:border-green-600',
        bg: 'bg-green-50 dark:bg-green-900/10',
        selectedBg: 'bg-green-100 dark:bg-green-900/30',
        selectedBorder: 'border-green-500 dark:border-green-400',
        hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/20',
        hoverBorder: 'hover:border-green-300 dark:hover:border-green-500',
        text: 'text-green-600 dark:text-green-400',
        label: 'text-green-700 dark:text-green-300',
        ring: 'ring-green-200 dark:ring-green-700'
      };
    } else {
      // สีเริ่มต้นสำหรับประเภทอื่นๆ
      return {
        border: 'border-gray-300 dark:border-gray-600',
        bg: 'bg-gray-50 dark:bg-gray-900/10',
        selectedBg: 'bg-gray-100 dark:bg-gray-900/30',
        selectedBorder: 'border-gray-500 dark:border-gray-400',
        hoverBg: 'hover:bg-gray-100 dark:hover:bg-gray-900/20',
        hoverBorder: 'hover:border-gray-300 dark:hover:border-gray-500',
        text: 'text-gray-600 dark:text-gray-400',
        label: 'text-gray-700 dark:text-gray-300',
        ring: 'ring-gray-200 dark:ring-gray-700'
      };
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "transfer":
        return <CreditCard className="h-4 w-4" />;
      case "credit":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "free":
        return <Building className="h-4 w-4 text-green-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card-custom border border-primary/20 dark:border-primary/30 dark:bg-card/50">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 rounded-full bg-primary/20 dark:bg-primary/30">
                <ShoppingCart className="h-4 w-4 text-primary dark:text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground dark:text-foreground">ซื้อรายการตรวจ</h1>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">เลือกรายการตรวจและชำระเงิน</p>
              </div>
            </div>
            
            {/* Printer Connection Controls */}
            <div className="flex items-center gap-2">
              {selectedReceiptPrinter && (
                <div className="text-xs text-muted-foreground bg-muted dark:bg-muted/80 dark:text-muted-foreground px-2 py-1 rounded">
                  {selectedReceiptPrinter}
                </div>
              )}
              
              <Button
                onClick={connectPrinter}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10 dark:border-primary dark:text-primary dark:hover:bg-primary/20"
              >
                <Printer className={`h-4 w-4 mr-2 ${isPrinterConnected ? 'text-green-600' : 'text-primary'}`} />
                {isPrinterConnected ? 'เชื่อมต่อแล้ว' : 'เชื่อมต่อเครื่องพิมพ์'}
              </Button>
              
              {availablePrinters.length > 0 && (
                <select
                  value={selectedReceiptPrinter}
                  onChange={(e) => selectReceiptPrinter(e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-background dark:text-foreground rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Lab Tests Selection */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {/* Patient Info */}
          <Card className="shadow-card-custom border-l-4 border-l-primary dark:bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20">
                    <User className="h-3 w-3 text-primary dark:text-primary" />
                  </div>
                  <span className="dark:text-foreground">ข้อมูลคนไข้</span>
                </div>
                {patientInfo && (
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 text-xs">
                    <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full mr-1"></div>
                    เชื่อมต่อแล้ว
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                {/* Enhanced Search Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="visit-number" className="text-xs font-medium flex items-center gap-1.5">
                    <Search className="h-2.5 w-2.5" />
                    ค้นหาด้วยหมายเลข Visit
                  </Label>
                  <div className="flex gap-2 relative">
                    <div className="flex-1 relative">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                          id="visit-number"
                          placeholder="กรอกหมายเลข Visit (เช่น 24010001) หรือชื่อคนไข้"
                          value={visitNumber}
                          onChange={(e) => handleVisitNumberChange(e.target.value)}
                          onFocus={() => {
                            if (visitNumber.length >= 2 && visitSuggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          className="pl-8 pr-3 h-8 text-sm border focus:border-primary transition-colors"
                        />
                        {isLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced Suggestions Dropdown */}
                      {showSuggestions && visitSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-primary/30 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                          <div className="p-2 bg-primary/5 dark:bg-primary/10 border-b border-primary/10 dark:border-primary/20">
                            <p className="text-xs text-primary dark:text-primary font-medium">
                              พบ {visitSuggestions.length} รายการ
                            </p>
                          </div>
                          {visitSuggestions.map((visit, index) => (
                            <div
                              key={visit._id || index}
                              className="px-4 py-3 hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                              onClick={() => selectVisitSuggestion(visit)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {visit.visitNumber}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(visit.visitDate).toLocaleDateString('th-TH')}
                                    </span>
                                  </div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {visit.patientData?.title} {visit.patientData?.firstName} {visit.patientData?.lastName}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      อายุ {visit.patientData?.age} ปี
                                    </span>
                                    {visit.patientData?.ln && (
                                      <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                                        LN: {visit.patientData.ln}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={searchVisit}
                      disabled={isLoading || !visitNumber.trim()}
                      size="sm"
                      className="px-4 h-8 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Enhanced Patient Info Display */}
                {patientInfo ? (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-full bg-green-100 dark:bg-green-800">
                          <User className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-400">ข้อมูลคนไข้</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPatientInfo(null);
                          setVisitNumber("");
                        }}
                        className="h-6 w-6 p-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ-นามสกุล:</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-5">
                          {patientInfo.patientData?.title} {patientInfo.patientData?.firstName} {patientInfo.patientData?.lastName}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">อายุ:</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-5">
                          {patientInfo.patientData?.age} ปี
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Visit Number:</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 ml-5 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded inline-block">
                          {patientInfo.visitNumber}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">วันที่เข้ารับบริการ:</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-5">
                          {new Date(patientInfo.visitDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      
                      {patientInfo.patientData?.ln && (
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center gap-2">
                            <Badge className="h-3 w-3 rounded-full p-0 bg-blue-500 dark:bg-blue-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LN:</span>
                          </div>
                          <p className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 ml-5 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded inline-block">
                            {patientInfo.patientData.ln}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                    <div className="text-center">
                      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 w-fit mx-auto mb-3">
                        <Search className="h-6 w-6 text-gray-400 dark:text-gray-300" />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">ยังไม่ได้เลือกคนไข้</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        กรุณาค้นหาและเลือกข้อมูลคนไข้ก่อนเลือกรายการตรวจ
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lab Tests */}
          <Card className="shadow-card-custom dark:bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm dark:text-foreground">
                <ShoppingCart className="h-4 w-4 text-primary dark:text-primary" />
                เลือกรายการตรวจ
              </CardTitle>
              <CardDescription className="text-xs dark:text-muted-foreground">
                เลือกรายการตรวจที่ต้องการ ({selectedTests.length + selectedGroups.length} รายการ)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="ค้นหารายการตรวจ..."
                    className="pl-8 h-8 text-sm"
                    value={testSearchTerm}
                    onChange={(e) => setTestSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {/* Search indicator */}
                  {testSearchTerm.trim() && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Search className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                          กำลังค้นหา: "{testSearchTerm}"
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/50 px-1.5 py-0.5 rounded">
                          แสดงเฉพาะรายการตรวจแต่ละรายการ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lab Groups - Hide when searching */}
                  {labGroups.length > 0 && !testSearchTerm.trim() && (
                    <div>
                      <Label className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 mb-2">
                        <TestTube className="h-3 w-3" />
                        แพ็กเกจตรวจ
                      </Label>
                      <div className="space-y-1.5">
                        {labGroups.map((group) => {
                          const isPurchased = purchasedTestIds.includes(group._id!);
                          return (
                          <div
                            key={group._id}
                            className={`p-2 border rounded-md transition-all ${
                              isPurchased 
                                ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                                : selectedGroups.includes(group._id!)
                                  ? 'border-purple-500 dark:border-purple-400 bg-purple-100 dark:bg-purple-900/30 shadow-sm ring-1 ring-purple-200 dark:ring-purple-700 cursor-pointer'
                                  : 'border-purple-200 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-500 cursor-pointer'
                            }`}
                            onClick={() => !isPurchased && handleGroupSelection(group._id!, !selectedGroups.includes(group._id!))}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                <Checkbox
                                  id={group._id}
                                  checked={selectedGroups.includes(group._id!)}
                                  disabled={isPurchased}
                                  onCheckedChange={(checked) => !isPurchased && handleGroupSelection(group._id!, checked as boolean)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-3.5 w-3.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={group._id} className="text-sm font-medium text-foreground cursor-pointer">
                                      {group.name}
                                    </Label>
                                    <span className="text-xs text-muted-foreground">รหัส: {group.code}</span>
                                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                                      {group.labTests?.length || 0} รายการ
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-purple-600 dark:text-purple-400 text-sm">฿{group.price.toLocaleString()}</span>
                              </div>
                            </div>
                            {isPurchased && (
                              <div className="mt-1">
                                <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                                  เคยซื้อแล้ว
                                </Badge>
                              </div>
                            )}
                          </div>
                          );
                        })}
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
                  ).map(([category, tests]) => {
                    const categoryColors = getTestCategoryColor(category);
                    return (
                    <div key={category}>
                      <Label className={`text-sm font-semibold mb-2 block flex items-center gap-2 ${categoryColors.label}`}>
                        <div className={`w-3 h-3 rounded-full ${categoryColors.selectedBg} ${categoryColors.selectedBorder} border`}></div>
                        {category}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors.selectedBg} ${categoryColors.text}`}>
                          {tests.length} รายการ
                        </span>
                      </Label>
                      <div className="space-y-1.5">
                        {tests.map((test) => {
                          const isPurchased = purchasedTestIds.includes(test._id!);
                          const isSelected = selectedTests.includes(test._id!);
                          return (
                          <div
                            key={test._id}
                            className={`p-2 border rounded-md transition-all ${
                              isPurchased 
                                ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                                : isSelected
                                  ? `${categoryColors.selectedBorder} ${categoryColors.selectedBg} shadow-sm ring-1 ${categoryColors.ring} cursor-pointer`
                                  : `${categoryColors.border} ${categoryColors.bg} ${categoryColors.hoverBg} ${categoryColors.hoverBorder} cursor-pointer`
                            }`}
                            onClick={() => !isPurchased && handleTestSelection(test._id!, !selectedTests.includes(test._id!))}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                <Checkbox
                                  id={test._id}
                                  checked={selectedTests.includes(test._id!)}
                                  disabled={isPurchased}
                                  onCheckedChange={(checked) => !isPurchased && handleTestSelection(test._id!, checked as boolean)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-3.5 w-3.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor={test._id} className="text-sm font-medium text-foreground cursor-pointer">
                                      {test.name}
                                    </Label>
                                    <span className="text-xs text-muted-foreground">รหัส: {test.code}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`font-semibold text-sm ${isSelected ? categoryColors.text : 'text-primary'}`}>
                                  ฿{test.price.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {isPurchased && (
                              <div className="mt-1">
                                <Badge variant="secondary" className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  เคยซื้อแล้ว
                                </Badge>
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Payment */}
        <div className="space-y-3 sm:space-y-4">
          {/* Order Summary */}
          <Card className="shadow-card-custom">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calculator className="h-4 w-4 text-primary" />
                สรุปคำสั่งซื้อ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              {/* Show existing orders info */}
              {existingOrders.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs font-medium text-yellow-800">
                      Visit นี้เคยซื้อรายการตรวจไปแล้ว
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 ml-4">
                    พบ {purchasedTestIds.length} รายการที่เคยซื้อแล้ว (แสดงเป็นสีเทาและไม่สามารถเลือกได้)
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {selectedTests.length === 0 && selectedGroups.length === 0 ? (
                  <p className="text-muted-foreground text-center py-3 text-xs">
                    ยังไม่ได้เลือกรายการตรวจ
                  </p>
                ) : (
                  <>
                    {/* Selected Groups */}
                    {selectedGroups.map((groupId) => {
                      const group = labGroups.find(g => g._id === groupId);
                      return group ? (
                        <div key={groupId} className="flex items-center justify-between text-xs bg-purple-50 p-1.5 rounded">
                          <span className="text-foreground font-medium">{group.name}</span>
                          <span className="font-medium text-purple-600">฿{group.price.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                    
                    {/* Selected Individual Tests */}
                    {selectedTests.map((testId) => {
                      const test = labTests.find(t => t._id === testId);
                      return test ? (
                        <div key={testId} className="flex items-center justify-between text-xs">
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
                <div className="flex items-center space-x-2 p-2 sm:p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-4 w-4 text-success" />
                    เงินสด
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 sm:p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                    โอนเงิน
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 sm:p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    เครดิต
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 sm:p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="free" id="free" />
                  <Label htmlFor="free" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building className="h-4 w-4 text-green-600" />
                    ฟรี
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "credit" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="credit-note">หมายเหตุเครดิต</Label>
                  <Input 
                    id="credit-note"
                    placeholder="ระบุหมายเหตุ (ถ้ามี)"
                  />
                </div>
              )}

              {paymentMethod === "free" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="free-reason">เหตุผลที่ให้ฟรี</Label>
                  <Input 
                    id="free-reason"
                    placeholder="ระบุเหตุผล (เช่น โปรโมชั่น, พนักงาน)"
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
                    {isLoading ? "กำลังดำเนินการ..." : 
                      paymentMethod === 'free' ? `บันทึกรายการฟรี ฿${getTotalPrice().toLocaleString()}` :
                      paymentMethod === 'credit' ? `บันทึกเครดิต ฿${getTotalPrice().toLocaleString()}` :
                      `ชำระเงิน ฿${getTotalPrice().toLocaleString()}`
                    }
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
                    {isLoading ? 
                      "กำลังพิมพ์..." : 
                      receiptPrinterConfigured ? 
                        `พิมพ์ใบเสร็จ (${configuredReceiptPrinter})` : 
                        'ตั้งค่าเครื่องพิมพ์ก่อน'
                    }
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sales History Section */}
          <Card className="mt-6 dark:bg-card/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 dark:text-foreground">
                    <div className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20">
                      <History className="h-4 w-4 text-primary dark:text-primary" />
                    </div>
                    ประวัติการขาย
                  </CardTitle>
                  <CardDescription className="mt-1 dark:text-muted-foreground">
                    รายการขายล่าสุด ({salesHistory.length} รายการ{salesSearchTerm ? `, พบ ${displayData.length} รายการ` : showAllSales ? ', แสดงทั้งหมด' : ', แสดง 5 รายการ'})
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadSalesHistory()}
                  disabled={isLoadingSales}
                  className="shrink-0 dark:border-gray-600 dark:text-foreground dark:hover:bg-gray-800"
                >
                  <History className="h-3 w-3 mr-1" />
                  รีเฟรช
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSales ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-muted-foreground dark:text-muted-foreground">กำลังโหลดประวัติการขาย</p>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">กรุณารอสักครู่ กำลังดึงข้อมูลจากฐานข้อมูล...</p>
                    <div className="flex items-center justify-center gap-1 mt-4">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              ) : salesHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>ยังไม่มีประวัติการขาย</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Enhanced Search Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="ค้นหาด้วยเลข Visit, ชื่อผู้ป่วย, หรือรายการตรวจ..."
                        className="pl-10 h-10"
                        value={salesSearchTerm}
                        onChange={(e) => setSalesSearchTerm(e.target.value)}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                    {salesSearchTerm && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSalesSearchTerm("")}
                        className="px-3 dark:text-foreground dark:hover:bg-gray-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Compact Sales History */}
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {displayData
                      .slice(0, showAllSales || salesSearchTerm ? displayData.length : 5) // แสดง 5 รายการ หรือทั้งหมด
                      .map((sale) => (
                        <div key={sale.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-sm transition-all duration-200 hover:border-primary/30 dark:hover:border-primary/50">
                          {/* Simplified Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                <Receipt className="h-4 w-4 text-primary dark:text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  {sale.patient?.name || sale.patientName || 'ไม่ระบุชื่อ'}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-mono">{sale.visitNumber}</span>
                                  <span>•</span>
                                  <span>{sale.date}</span>
                                </div>
                                {/* แสดงรายการตรวจ (สำหรับการค้นหา) */}
                                {sale.items && sale.items.length > 0 && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                    {sale.items.slice(0, 2).map((item: any, index: number) => (
                                      <span key={index}>
                                        {item.testName || item.name || item.code}
                                        {index < Math.min(sale.items.length, 2) - 1 && ', '}
                                      </span>
                                    ))}
                                    {sale.items.length > 2 && ` และอีก ${sale.items.length - 2} รายการ`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600 dark:text-green-400">
                                ฿{sale.total.toLocaleString()}
                              </div>
                              <Badge variant={
                                sale.status === 'completed' ? 'default' : 
                                sale.status === 'cancelled' ? 'destructive' : 'secondary'
                              } className="text-xs mt-1">
                                {sale.status === 'completed' ? 'เสร็จสิ้น' : 
                                 sale.status === 'cancelled' ? 'ยกเลิก' : 'รอดำเนินการ'}
                              </Badge>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">                        
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => printA4ReceiptFromHistory(sale)}
                              className="flex-1 h-7 text-xs border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              disabled={sale.status === 'cancelled' || !receiptPrinterConfigured}
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              พิมพ์
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewSaleDetails(sale)}
                              className="flex-1 h-7 text-xs border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              รายละเอียด
                            </Button>
                            {sale.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelReceiptFromHistory(sale)}
                                className="h-7 px-2 text-xs border-red-200 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                  ))}
                  
                  {/* No Results Message */}
                  {displayData.length === 0 && salesSearchTerm.trim() && (
                    <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>ไม่พบผลการค้นหาสำหรับ "{salesSearchTerm}"</p>
                      <p className="text-sm mt-2">ลองค้นหาด้วยเลข Visit, ชื่อผู้ป่วย, หรือรายการตรวจ</p>
                    </div>
                  )}
                  </div>
                  
                  {/* Show More/Less Button */}
                  {!salesSearchTerm && salesHistory.length > 5 && (
                    <div className="text-center pt-4 border-t dark:border-gray-700">
                      <Button
                        variant="ghost"
                        onClick={() => setShowAllSales(!showAllSales)}
                        className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80"
                      >
                        {showAllSales ? (
                          <>
                            <Minus className="h-4 w-4 mr-2" />
                            ดูน้อยลง (แสดง 5 รายการ)
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            ดูทั้งหมด ({salesHistory.length} รายการ)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sale Details Modal */}
      <Dialog open={showSaleDetailsModal} onOpenChange={setShowSaleDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="sale-details-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              รายละเอียดใบเสร็จ - Visit: {selectedSaleForDetails?.visitNumber}
            </DialogTitle>
          </DialogHeader>
          <div id="sale-details-description" className="sr-only">
            รายละเอียดของใบเสร็จรายการตรวจ
          </div>
          
          {selectedSaleForDetails && (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลผู้ป่วย</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">ชื่อ-นามสกุล:</span>
                    <p className="font-medium">
                      {selectedSaleForDetails.patient?.name || 
                       selectedSaleForDetails.patientName || 
                       'ไม่ระบุชื่อ'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">อายุ:</span>
                    <p className="font-medium">
                      {(() => {
                        // ลองหาอายุจากหลายที่
                        const age = selectedSaleForDetails.patient?.age || 
                                   selectedSaleForDetails.patientAge ||
                                   selectedSaleForDetails.age ||
                                   selectedSaleForDetails.orderData?.patientAge ||
                                   selectedSaleForDetails.orderData?.age;
                        return age ? `${age} ปี` : 'ไม่ระบุ';
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">LN Number:</span>
                    <p className="font-medium font-mono">{selectedSaleForDetails.patient?.ln}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">วันที่:</span>
                    <p className="font-medium">{selectedSaleForDetails.date} {selectedSaleForDetails.time}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">รายการตรวจ ({selectedSaleForDetails.items.length} รายการ)</h3>
                <div className="space-y-2">
                  {selectedSaleForDetails.items.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{item.testName || item.name}</h4>
                            {item.type === 'package' && (
                              <Badge variant="secondary" className="text-xs">แพ็กเกจ</Badge>
                            )}
                          </div>
                          {item.code && (
                            <p className="text-sm text-gray-600">รหัส: {item.code}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">฿{(item.price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {/* Show individual tests for packages */}
                      {item.type === 'package' && item.individualTests && item.individualTests.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">รายการตรวจในแพ็กเกจ:</p>
                          <div className="space-y-1">
                            {item.individualTests.map((test: any, testIndex: number) => (
                              <div key={testIndex} className="flex items-center gap-2 text-xs text-gray-600">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                <span>{test?.name || 'ไม่ระบุชื่อ'}</span>
                                {test?.code && (
                                  <span className="text-gray-500">({test.code})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">รวมทั้งสิ้น:</span>
                  <span className="text-xl font-bold text-green-600">฿{selectedSaleForDetails.total.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">วิธีชำระเงิน:</span>
                    <span className="font-medium">{selectedSaleForDetails.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">สถานะ:</span>
                    <Badge variant={
                      selectedSaleForDetails.status === 'completed' ? 'default' : 
                      selectedSaleForDetails.status === 'cancelled' ? 'destructive' : 'secondary'
                    } className="ml-2">
                      {selectedSaleForDetails.status === 'completed' ? 'เสร็จสิ้น' : 
                       selectedSaleForDetails.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'รอดำเนินการ'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => printA4ReceiptFromHistory(selectedSaleForDetails)}
                  disabled={selectedSaleForDetails.status === 'cancelled' || !receiptPrinterConfigured}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  พิมพ์ใบเสร็จ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSaleDetailsModal(false)}
                  className="flex-1"
                >
                  ปิด
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}