import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from "@/lib/toast-helpers";
import { apiService, PatientData, VisitData, CompanySettingsData } from "@/services/api";
import { generateMedicalRecordFormHTML, printMedicalRecordForm, MedicalRecordFormData } from "@/utils/medicalRecordForm";
import { usePrinter } from "@/hooks/use-printer";
import { DoctorSelector } from "@/components/DoctorSelector";
// PrinterConnectionTest component removed from VisitManagement page
import {
  FileText,
  Save,
  RotateCcw,
  User,
  Search,
  Calendar,
  Clock,
  Stethoscope,
  Activity,
  Printer,
  Edit,
  Trash2,
  ArrowUp
} from "lucide-react";


export default function VisitManagement() {
  const { toast } = useToast();
  const { printSticker: handlePrintStickerUtil, isPrinterConfigured } = usePrinter();
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [visitHistory, setVisitHistory] = useState<VisitData[]>([]);
  const [visitSearchTerm, setVisitSearchTerm] = useState("");
  const [visitData, setVisitData] = useState<Partial<VisitData>>({
    visitNumber: "",
    patientId: "",
    patientName: "",
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toTimeString().slice(0, 5),
    patientRights: "",
    insuranceNumber: "",
    department: "",
    referringOrganization: "",
    weight: '',
    height: '',
    bloodPressure: "",
    pulse: '',
    chronicDiseases: "",
    drugAllergies: "",
    chiefComplaint: "",
    referringDoctor: "",
    doctorLicenseNumber: "",
    orderDate: new Date().toISOString().split('T')[0],
    resultDeliveryMethod: "รับผลที่คลินิก",
    status: "pending" as const
  });
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [isPrintingConnected, setIsPrintingConnected] = useState(false);
  const [availableStickerPrinters, setAvailableStickerPrinters] = useState<string[]>([]);
  const [selectedStickerPrinter, setSelectedStickerPrinter] = useState<string>("");
  const [isStickerPrintingConnected, setIsStickerPrintingConnected] = useState(false);
  
  // Check if printers are configured
  const { isPrinterConfigured: checkPrinterConfigured, getPrinterName } = usePrinter();
  const [stickerPrinterConfigured, setStickerPrinterConfigured] = useState(false);
  const [configuredStickerPrinter, setConfiguredStickerPrinter] = useState<string>("");
  const [medicalPrinterConfigured, setMedicalPrinterConfigured] = useState(false);
  const [configuredMedicalPrinter, setConfiguredMedicalPrinter] = useState<string>("");
  const [companySettings, setCompanySettings] = useState<CompanySettingsData | null>(null);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Check printer configuration on component mount
  useEffect(() => {
    const checkPrinterConfig = async () => {
      try {
        // Check sticker printer
        const stickerConfigured = await checkPrinterConfigured('sticker');
        setStickerPrinterConfigured(stickerConfigured);
        if (stickerConfigured) {
          const stickerPrinter = await getPrinterName('sticker');
          setConfiguredStickerPrinter(stickerPrinter);
          console.log('Sticker printer configured:', stickerPrinter);
        }

        // Check medical printer
        const medicalConfigured = await checkPrinterConfigured('medical');
        setMedicalPrinterConfigured(medicalConfigured);
        if (medicalConfigured) {
          const medicalPrinter = await getPrinterName('medical');
          setConfiguredMedicalPrinter(medicalPrinter);
          console.log('Medical printer configured:', medicalPrinter);
        }
      } catch (error) {
        console.error('Error checking printer configuration:', error);
      }
    };

    checkPrinterConfig();
  }, [checkPrinterConfigured, getPrinterName]);

  // Reset form function
  const resetForm = () => {
    setVisitData({
      visitNumber: "",
      patientId: "",
      patientName: "",
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: new Date().toTimeString().slice(0, 5),
      patientRights: "",
      insuranceNumber: "",
      department: "",
      referringOrganization: "",
      weight: '',
      height: '',
      bloodPressure: "",
      pulse: '',
      chronicDiseases: "",
      drugAllergies: "",
      chiefComplaint: "",
      referringDoctor: "",
      doctorLicenseNumber: "",
      orderDate: new Date().toISOString().split('T')[0],
      resultDeliveryMethod: "pickup",
      status: "pending" as const
    });
    setSelectedPatient(null);
    setPatientSearchTerm("");

    showInfoToast({
      title: "รีเซ็ตฟอร์มสำเร็จ",
      description: "ข้อมูลในฟอร์มถูกล้างแล้ว",
    });
  };

  // Load patients and visit history on component mount
  useEffect(() => {
    loadPatients();
    loadVisitHistory();
    loadPrinterSettings(); // Now async but we don't need to await here
    loadCompanySettings();
  }, []);

  // Generate visit number when patient is selected
  useEffect(() => {
    if (selectedPatient && !visitData.visitNumber) {
      generateVisitNumber();
    }
  }, [selectedPatient]);

  // Convert Buddhist Era date to display format
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "-";
    
    // Handle different date formats
    let date: Date;
    
    // If it's already a valid date string
    if (dateStr && (dateStr.includes('T') || dateStr.includes('-'))) {
      date = new Date(dateStr);
    } else {
      // If it's in DD/MM/YYYY format, convert it
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateStr);
      }
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    // Convert to Buddhist Era (add 543 years)
    let buddhistYear = date.getFullYear() + 543;
    
    // If the original year is already in Buddhist Era (> 2500), don't add 543
    if (date.getFullYear() > 2500) {
      buddhistYear = date.getFullYear();
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}/${buddhistYear}`;
  };

  const loadPatients = async () => {
    try {
      const patientsData = await apiService.getPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลคนไข้ได้",
      });
    }
  };

  const loadVisitHistory = async () => {
    try {
      const visits = await apiService.getVisits();
      setVisitHistory(visits);
    } catch (error) {
      console.error('Error loading visit history:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดประวัติการเปิด visit ได้",
      });
    }
  };

  const loadPrinterSettings = async () => {
    try {
      // Load printer settings from localStorage
      const savedSettings = localStorage.getItem('printerSettings');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Set selected printers from saved settings
        if (settings.reportPrinter) {
          setSelectedPrinter(settings.reportPrinter);
        }
        if (settings.stickerPrinter) {
          setSelectedStickerPrinter(settings.stickerPrinter);
        }
        
        // Auto-load available printers if settings exist
        if (settings.reportPrinter || settings.stickerPrinter) {
          await loadAvailablePrintersFromSystem();
        }
      }
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
  };

  // Load available printers from system and set connection status
  const loadAvailablePrintersFromSystem = async () => {
    try {
      // Check if running in Electron environment
      const isElectron = typeof window !== 'undefined' && window.electronAPI;

      if (isElectron) {
        // Use Electron API to get real system printers
        try {
          const printers = await window.electronAPI.getPrinters();
          if (printers && printers.length > 0) {
            const printerNames = printers.map((p: any) => {
              if (typeof p === 'string') return p;
              return p.name || p.displayName || String(p);
            });
            
            // Set both regular and sticker printers (same list)
            setAvailablePrinters(printerNames);
            setAvailableStickerPrinters(printerNames);
            
            // Save to localStorage
            localStorage.setItem('availablePrinters', JSON.stringify(printerNames));
            localStorage.setItem('availableStickerPrinters', JSON.stringify(printerNames));
            
            // Set connection status
            setIsPrintingConnected(true);
            setIsStickerPrintingConnected(true);
            
            console.log(`Auto-loaded ${printers.length} printers from system`);
          }
        } catch (electronError) {
          console.error('Electron printer detection failed:', electronError);
        }
      } else {
        // Web environment fallback
        const defaultPrinters = ["เครื่องพิมพ์เริ่มต้นของระบบ", "Microsoft Print to PDF"];
        setAvailablePrinters(defaultPrinters);
        setAvailableStickerPrinters(defaultPrinters);
        localStorage.setItem('availablePrinters', JSON.stringify(defaultPrinters));
        localStorage.setItem('availableStickerPrinters', JSON.stringify(defaultPrinters));
        setIsPrintingConnected(true);
        setIsStickerPrintingConnected(true);
      }
    } catch (error) {
      console.error('Error loading available printers:', error);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const settings = await apiService.getCompanySettings();
      setCompanySettings(settings);
    } catch (error) {
      console.error('Error loading company settings:', error);
      // Use default settings if API fails
      setCompanySettings({
        name: 'คลินิกเทคนิคการแพทย์ โปร อินเตอร์ แลบ ไชยา',
        nameEn: 'Pro inter lab Chaiya',
        address: '99/5 หมู่ที่ 1 ตำบล เวียง อำเภอ ไชยา จังหวัด สุราษฎร์ธานี 84110',
        phone: '094-945-6579',
        email: '',
        website: '',
        taxId: '',
        license: ''
      });
    }
  };

  const generateVisitNumber = async () => {
    try {
      const response = await apiService.generateNextVisitNumber();
      setVisitData(prev => ({
        ...prev,
        visitNumber: response.visitNumber
      }));
    } catch (error) {
      console.error('Error generating visit number:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างเลข visit ได้",
      });
    }
  };

  const handlePatientSelect = (patient: PatientData) => {
    setSelectedPatient(patient);
    setVisitData(prev => ({
      ...prev,
      patientId: patient._id || "",
      patientName: `${patient.title}${patient.firstName} ${patient.lastName}`
    }));

    showInfoToast({
      title: "เลือกคนไข้แล้ว",
      description: `เลือกคนไข้ ${patient.title}${patient.firstName} ${patient.lastName} (LN: ${patient.ln})`,
    });
  };

  const convertBuddhistToGregorian = (buddhistDate: string): string => {
    if (!buddhistDate) return "";
    const parts = buddhistDate.split('/');
    if (parts.length !== 3) return "";

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const gregorianYear = (parseInt(parts[2]) - 543).toString();

    return `${gregorianYear}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      showWarningToast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาเลือกคนไข้ก่อนเปิด visit",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert Buddhist dates to Gregorian for storage
      const visitDataToSubmit = {
        ...visitData,
        visitDate: visitData.visitDate || new Date().toISOString().split('T')[0],
        visitTime: visitData.visitTime || new Date().toTimeString().slice(0, 5),
        orderDate: visitData.orderDate || new Date().toISOString().split('T')[0],
        patientData: selectedPatient
      } as Omit<VisitData, '_id' | 'createdAt' | 'updatedAt'>;

      let result: VisitData;
      let isUpdate = false;

      // Check if visit number exists (update mode)
      if (visitData.visitNumber && visitData.visitNumber.trim() !== '') {
        // Find existing visit by visitNumber to get its _id
        const existingVisit = visitHistory.find(visit => visit.visitNumber === visitData.visitNumber);
        
        if (existingVisit && existingVisit._id) {
          // Update existing visit using _id
          result = await apiService.updateVisit(existingVisit._id, visitDataToSubmit);
          isUpdate = true;
          
          // Update visit in history
          setVisitHistory(prev => prev.map(visit => 
            visit.visitNumber === visitData.visitNumber ? result : visit
          ));
        } else {
          // Visit not found in local history, create new visit
          result = await apiService.createVisit(visitDataToSubmit);
          isUpdate = false;
          
          // Add to visit history
          setVisitHistory(prev => [result, ...prev]);
        }
      } else {
        // Create new visit
        result = await apiService.createVisit(visitDataToSubmit);
        
        // Add to visit history
        setVisitHistory(prev => [result, ...prev]);
      }

      showSuccessToast({
        title: isUpdate ? "อัปเดต Visit สำเร็จ" : "บันทึก Visit สำเร็จ",
        description: `${isUpdate ? 'อัปเดต' : 'บันทึก'} Visit ${result.visitNumber} สำหรับคนไข้ ${selectedPatient.title}${selectedPatient.firstName} ${selectedPatient.lastName} แล้ว`,
      });

      // Update visit data with the visit number for printing
      setVisitData(prev => ({ ...prev, visitNumber: result.visitNumber }));

      // Auto print sticker if sticker printer is connected (only for new visits)
      if (!isUpdate && isStickerPrintingConnected && selectedStickerPrinter) {
        setTimeout(() => {
          handlePrintSticker();
        }, 500); // Small delay to ensure state is updated
      }

      // Clear form but keep selected patient (only for new visits)
      if (!isUpdate) {
        handleClearForm();
      }
    } catch (error) {
      console.error('Error saving visit:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถบันทึก visit ได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = () => {
    setVisitData({
      visitNumber: "",
      patientId: selectedPatient?._id || "",
      patientName: selectedPatient ? `${selectedPatient.title}${selectedPatient.firstName} ${selectedPatient.lastName}` : "",
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: new Date().toTimeString().slice(0, 5),
      patientRights: "30 บาท",
      insuranceNumber: "",
      department: "ตรวจสุขภาพทั่วไป",
      referringOrganization: "",
      weight: '',
      height: '',
      bloodPressure: "",
      pulse: '',
      chronicDiseases: "",
      drugAllergies: "",
      chiefComplaint: "",
      referringDoctor: "",
      doctorLicenseNumber: "",
      orderDate: new Date().toISOString().split('T')[0],
      resultDeliveryMethod: "รับผลที่คลินิก",
      status: "pending" as const
    });

    // Generate new visit number
    if (selectedPatient) {
      generateVisitNumber();
    }
  };

  const handleVisitDataChange = (field: keyof VisitData, value: string | number) => {
    setVisitData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const searchPatients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setPatients(await apiService.getPatients());
      return;
    }

    try {
      const results = await apiService.searchPatients(searchTerm);
      setPatients(results);
    } catch (error) {
      console.error('Error searching patients:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถค้นหาคนไข้ได้",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "รอดำเนินการ", variant: "secondary" as const },
      "in-progress": { label: "กำลังดำเนินการ", variant: "default" as const },
      completed: { label: "เสร็จสิ้น", variant: "outline" as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const connectToPrinter = async () => {
    try {
      setIsLoading(true);

      // Check if running in Electron environment
      const isElectron = typeof window !== 'undefined' && window.electronAPI;

      if (isElectron) {
        // Use Electron API to get real system printers
        try {
          const printers = await window.electronAPI.getPrinters();
          if (printers && printers.length > 0) {
            const printerNames = printers.map((p: any) => {
              if (typeof p === 'string') return p;
              return p.name || p.displayName || String(p);
            });
            setAvailablePrinters(printerNames);

            // Save to localStorage
            localStorage.setItem('availablePrinters', JSON.stringify(printerNames));

            toast({
              title: "เชื่อมต่อเครื่องพิมพ์สำเร็จ",
              description: `พบเครื่องพิมพ์ ${printers.length} เครื่อง`,
            });
          } else {
            throw new Error('ไม่พบเครื่องพิมพ์ในระบบ');
          }
        } catch (electronError) {
          console.error('Electron printer detection failed:', electronError);
          throw new Error('ไม่สามารถเข้าถึงเครื่องพิมพ์ผ่าน Electron API ได้');
        }
      } else {
        // Web environment - try to detect real printers using Web APIs
        try {
          // Try using the experimental Web Print API if available
          if ('navigator' in window && 'printing' in navigator) {
            // @ts-ignore - experimental API
            const printers = await navigator.printing.getPrinters();
            if (printers && printers.length > 0) {
              const printerNames = printers.map((p: any) => {
                if (typeof p === 'string') return p;
                return p.name || p.id || p.displayName || String(p);
              });
              setAvailablePrinters(printerNames);
              localStorage.setItem('availablePrinters', JSON.stringify(printerNames));

              toast({
                title: "เชื่อมต่อเครื่องพิมพ์สำเร็จ",
                description: `พบเครื่องพิมพ์ ${printers.length} เครื่อง`,
              });
            } else {
              throw new Error('ไม่พบเครื่องพิมพ์');
            }
          } else {
            // Fallback: Try to detect printers through print dialog
            const printTest = window.open('', '_blank', 'width=1,height=1');
            if (printTest) {
              printTest.document.write('<html><body></body></html>');
              printTest.document.close();

              // Get media devices as a proxy for system capabilities
              if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                printTest.close();

                // Use system default printer detection
                const systemPrinters = [
                  "ระบบเครื่องพิมพ์เริ่มต้น",
                  "Microsoft Print to PDF"
                ];

                setAvailablePrinters(systemPrinters);
                localStorage.setItem('availablePrinters', JSON.stringify(systemPrinters));

                toast({
                  title: "เชื่อมต่อเครื่องพิมพ์สำเร็จ",
                  description: `พบเครื่องพิมพ์ ${systemPrinters.length} เครื่อง (ระบบเริ่มต้น)`,
                });
              } else {
                printTest.close();
                throw new Error('ไม่สามารถเข้าถึงอุปกรณ์ระบบได้');
              }
            } else {
              throw new Error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้');
            }
          }
        } catch (webError) {
          console.error('Web printer detection failed:', webError);

          // Ultimate fallback - try to get printer info from browser
          const defaultPrinters = ["เครื่องพิมพ์เริ่มต้นของระบบ"];
          setAvailablePrinters(defaultPrinters);
          localStorage.setItem('availablePrinters', JSON.stringify(defaultPrinters));

          toast({
            title: "เชื่อมต่อเครื่องพิมพ์",
            description: "ใช้เครื่องพิมพ์เริ่มต้นของระบบ",
          });
        }
      }

      setIsPrintingConnected(true);
    } catch (error) {
      console.error('Error connecting to printers:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถเชื่อมต่อเครื่องพิมพ์ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };




  const printMedicalRecord = async () => {
    if (!selectedPatient || !visitData.visitNumber) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาเลือกคนไข้และสร้าง visit ก่อนพิมพ์ใบเวชระเบียน",
        variant: "destructive",
      });
      return;
    }

    // Check if medical printer is configured
    if (!isPrinterConfigured('medical')) {
      toast({
        title: "ไม่ได้กำหนดเครื่องพิมพ์",
        description: "กรุณาไปที่หน้าตั้งค่า > เครื่องพิมพ์ เพื่อกำหนดเครื่องพิมพ์ใบเวชระเบียน",
        variant: "destructive",
      });
      return;
    }

    if (!companySettings) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลคลินิกได้",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare medical record data with complete visit information
      const medicalRecordData: MedicalRecordFormData = {
        // Company info
        companyInfo: companySettings,

        // Patient info
        patientln: selectedPatient.ln || selectedPatient.idCard,
        patientTitle: selectedPatient.title,
        patientFirstName: selectedPatient.firstName,
        patientLastName: selectedPatient.lastName,
        patientBirthDate: selectedPatient.birthDate,
        patientAge: selectedPatient.age,
        patientGender: selectedPatient.gender,
        patientIdCard: selectedPatient.idCard,
        patientPhone: selectedPatient.phoneNumber,
        patientAddress: selectedPatient.address,

        // Visit info
        visitNumber: visitData.visitNumber,
        visitDate: formatDateForDisplay(visitData.visitDate || ""),

        // Medical info from visit
        weight: visitData.weight ? parseFloat(visitData.weight.toString()) || undefined : undefined,
        height: visitData.height ? parseFloat(visitData.height.toString()) || undefined : undefined,
        bloodPressure: visitData.bloodPressure || undefined,
        temperature: undefined, // Not collected in current visit form
        pulse: visitData.pulse ? visitData.pulse.toString() : undefined,
        chronicDiseases: visitData.chronicDiseases || undefined,
        drugAllergies: visitData.drugAllergies || undefined,

        // Insurance info
        insuranceType: visitData.patientRights || undefined,
        insuranceNumber: visitData.insuranceNumber || undefined,

        // Service info
        serviceType: visitData.department || undefined,
        serviceCost: undefined, // Not available in visit data

        // Contact preferences - use result delivery method
        lineId: visitData.resultDeliveryMethod === 'Line ID' ? selectedPatient.phoneNumber : undefined,
        email: visitData.resultDeliveryMethod === 'E-mail' ? selectedPatient.phoneNumber : undefined,
        tel: visitData.resultDeliveryMethod === 'Tel.' ? selectedPatient.phoneNumber : undefined,
        receiveResults: visitData.resultDeliveryMethod === 'รับผลที่คลินิก',
        resultDeliveryMethod: visitData.resultDeliveryMethod,
        resultDeliveryDetails: visitData.resultDeliveryDetails
      };

      // Print using the medical record form utility with configured printer
      await printMedicalRecordForm(medicalRecordData);

      toast({
        title: "ส่งพิมพ์ใบเวชระเบียนสำเร็จ",
        description: `ส่งใบเวชระเบียน Visit ${visitData.visitNumber} ไปยังเครื่องพิมพ์แล้ว`,
      });
    } catch (error) {
      console.error('Error printing medical record:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการพิมพ์",
        description: error instanceof Error ? error.message : "ไม่สามารถพิมพ์ใบเวชระเบียนได้",
        variant: "destructive",
      });
    }
  };

  const handlePrintSticker = async () => {
    if (!selectedPatient || !visitData.visitNumber) {
      toast({
        title: "ไม่สามารถพิมพ์ได้",
        description: "กรุณาเลือกคนไข้และสร้าง visit number ก่อน",
        variant: "destructive",
      });
      return;
    }

    // Check if sticker printer is configured
    if (!isPrinterConfigured('sticker')) {
      toast({
        title: "ไม่ได้กำหนดเครื่องพิมพ์",
        description: "กรุณาไปที่หน้าตั้งค่า > เครื่องพิมพ์ เพื่อกำหนดเครื่องพิมพ์สติ๊กเกอร์",
        variant: "destructive",
      });
      return;
    }

    console.log('Creating sticker content for:', {
      visitNumber: visitData.visitNumber,
      patientName: `${selectedPatient.title}${selectedPatient.firstName} ${selectedPatient.lastName}`,
      age: selectedPatient.age
    });

    // ใช้เทมเพลตใหม่ 50x25mm แบบเดียวกับหน้า PatientRegistration
    const { createSticker50x25HTML } = await import('@/utils/stickerbarcode50x25');
    const visitDateDisplay = visitData.visitDate
      ? new Date(visitData.visitDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
      : new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const visitTimeDisplay = visitData.visitTime && visitData.visitTime.trim().length > 0
      ? visitData.visitTime
      : new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    const stickerHtml = createSticker50x25HTML({
      title: selectedPatient.title || '',
      firstName: selectedPatient.firstName,
      lastName: selectedPatient.lastName,
      ln: selectedPatient.ln || 'N/A',
      age: String(selectedPatient.age || ''),
      visitNumber: String(visitData.visitNumber || ''),
      visitDate: visitDateDisplay,
      visitTime: visitTimeDisplay,
    });

    console.log('Final stickerHtml length:', stickerHtml.length);
    console.log('Calling handlePrintStickerUtil with 50x25 template...');

    // ใช้ printer hook ในการพิมพ์สติ๊กเกอร์
    const result = await handlePrintStickerUtil(stickerHtml);
    console.log('Print result:', result);
  };

  // Handle patient search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients(patientSearchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [patientSearchTerm]);

  const filteredPatients = patients.filter(patient =>
    (patient.firstName && patient.firstName.toLowerCase().includes(patientSearchTerm.toLowerCase())) ||
    (patient.lastName && patient.lastName.toLowerCase().includes(patientSearchTerm.toLowerCase())) ||
    (patient.idCard && patient.idCard.includes(patientSearchTerm)) ||
    (patient.ln && patient.ln.toLowerCase().includes(patientSearchTerm.toLowerCase()))
  );

  // Filter visits based on search term
  const filteredVisits = visitHistory.filter(visit =>
    (visit.visitNumber && visit.visitNumber.toLowerCase().includes(visitSearchTerm.toLowerCase())) ||
    (visit.patientName && visit.patientName.toLowerCase().includes(visitSearchTerm.toLowerCase())) ||
    (visit.department && visit.department.toLowerCase().includes(visitSearchTerm.toLowerCase())) ||
    (visit.chiefComplaint && visit.chiefComplaint.toLowerCase().includes(visitSearchTerm.toLowerCase()))
  );
  
  const recentVisits = filteredVisits.slice(0, 20); // Show filtered visits, max 20

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-auto lg:h-[calc(100vh-120px)]">
      {/* Patient Search Sidebar - Full width on mobile, smaller width on desktop */}
      <div className="w-full lg:w-72 space-y-3 sm:space-y-4">
        {/* Printer Connection Test removed - use Settings page instead */}
        
        <Card className="shadow-card-custom border border-border/50 bg-red-100">
          <CardHeader className="bg-red-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-b border-border/20 pb-3">
            <CardTitle className="flex items-center gap-2 text-foreground text-sm">
              <Search className="h-4 w-4 text-primary" />
              ค้นหาคนไข้
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              เลือกคนไข้เพื่อเปิด visit
            </CardDescription>

            {/* Patient Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ, เลขบัตร, LN..."
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm bg-background border-border/50 focus:border-primary dark:bg-background/50"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[350px] lg:max-h-[550px] overflow-y-auto pt-3">
            {filteredPatients.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>ไม่พบคนไข้</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <Card
                  key={patient._id}
                  className={`p-2 cursor-pointer transition-all hover:shadow-md border border-border/50 bg-card hover:bg-accent/50 ${selectedPatient?._id === patient._id ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10 border-primary/50' : ''
                    }`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-xs text-foreground">
                      {patient.title}{patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>LN: <span className="text-foreground/80">{patient.ln}</span></div>
                      {patient.idCard && !patient.idCard.toUpperCase().startsWith('NO_ID') && (
                        <div>บัตรประชาชน: <span className="text-foreground/80">{patient.idCard}</span></div>
                      )}
                      <div>อายุ: <span className="text-foreground/80">{patient.age} ปี</span></div>
                      <div>วันเกิด: <span className="text-foreground/80">{formatDateForDisplay(patient.birthDate)}</span></div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Visit Form - Full width on mobile, 3/4 width on desktop */}
      <div className="flex-1 space-y-4 sm:space-y-6">
        {/* Header with Visit Management */}
        <Card className="shadow-card-custom border border-border/50 bg-card">
          <CardContent className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-primary/20">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-foreground">จัดการ Visit</h1>
                  <p className="text-xs text-muted-foreground">เปิด Visit ใหม่และจัดการข้อมูลการตรวจ</p>
                </div>
              </div>

              {/* Printer Controls */}
              <div className="flex flex-col gap-2 w-full lg:w-auto">
                {/* Medical Record Printer Row - Simplified */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${medicalPrinterConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">เครื่องพิมพ์ใบเวชระเบียน</span>
                      {medicalPrinterConfigured && (
                        <span className="text-xs text-muted-foreground">({configuredMedicalPrinter})</span>
                      )}
                    </div>
                    
                    {visitData.visitNumber && (
                      <Button
                        onClick={printMedicalRecord}
                        size="sm"
                        disabled={!medicalPrinterConfigured}
                        className="bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        พิมพ์เวชระเบียน
                      </Button>
                    )}
                  </div>
                  
                  {!medicalPrinterConfigured && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ กรุณาไปที่หน้า "ตั้งค่า &gt; เครื่องพิมพ์" เพื่อกำหนดเครื่องพิมพ์ใบเวชระเบียน
                    </div>
                  )}
                </div>

                {/* Sticker Printer Row - Simplified */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stickerPrinterConfigured ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">เครื่องพิมพ์สติ๊กเกอร์</span>
                      {stickerPrinterConfigured && (
                        <span className="text-xs text-muted-foreground">({configuredStickerPrinter})</span>
                      )}
                    </div>
                    
                    {visitData.visitNumber && (
                      <Button
                        onClick={handlePrintSticker}
                        size="sm"
                        disabled={!stickerPrinterConfigured}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        พิมพ์สติ๊กเกอร์
                      </Button>
                    )}
                  </div>
                  
                  {!stickerPrinterConfigured && (
                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      ⚠️ กรุณาไปที่หน้า "ตั้งค่า &gt; เครื่องพิมพ์" เพื่อกำหนดเครื่องพิมพ์สติ๊กเกอร์
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visit Form */}
        {selectedPatient ? (
          <div className="space-y-6">
            {/* Patient Info Card */}
            <Card className="shadow-card-custom border border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  ข้อมูลคนไข้
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <Label className="text-muted-foreground">ชื่อ-นามสกุล</Label>
                    <p className="font-medium">{selectedPatient.title}{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">LN</Label>
                    <p className="font-medium">{selectedPatient.ln}</p>
                  </div>
                  {selectedPatient.idCard && !selectedPatient.idCard.toUpperCase().startsWith('NO_ID') && (
                    <div>
                      <Label className="text-muted-foreground">เลขบัตรประชาชน</Label>
                      <p className="font-medium">{selectedPatient.idCard}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">อายุ</Label>
                    <p className="font-medium">{selectedPatient.age} ปี</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visit Form */}
            <Card className="shadow-card-custom border border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  เปิด Visit ใหม่
                </CardTitle>
                <CardDescription className="text-xs">
                  กรอกข้อมูลสำหรับการเปิด visit
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Visit Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitNumber">เลข Visit</Label>
                      <Input
                        id="visitNumber"
                        value={visitData.visitNumber}
                        readOnly
                        className="bg-muted"
                        placeholder="สร้างอัตโนมัติ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visitDate">วันที่ Visit</Label>
                      <Input
                        id="visitDate"
                        type="date"
                        value={visitData.visitDate}
                        onChange={(e) => handleVisitDataChange('visitDate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visitTime">เวลา Visit</Label>
                      <Input
                        id="visitTime"
                        type="time"
                        value={visitData.visitTime}
                        onChange={(e) => handleVisitDataChange('visitTime', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Patient Rights */}
                  <Card>
                    <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 pb-2">
                      <CardTitle className="text-sm">สิทธิการรักษา</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="patientRights">สิทธิ</Label>
                          <Select
                            value={visitData.patientRights}
                            onValueChange={(value) => handleVisitDataChange('patientRights', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกสิทธิ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ชำระเงินเอง">ชำระเงินเอง</SelectItem>
                              <SelectItem value="สปสช.">สปสช.</SelectItem>
                              <SelectItem value="ประกันสังคม">ประกันสังคม</SelectItem>
                              <SelectItem value="ข้าราชการ">ข้าราชการ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="insuranceNumber">เลขประกัน</Label>
                          <Input
                            id="insuranceNumber"
                            value={visitData.insuranceNumber}
                            onChange={(e) => handleVisitDataChange('insuranceNumber', e.target.value)}
                            placeholder="กรอกเลขประกัน (ถ้ามี)"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Department */}
                  <Card>
                    <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 pb-2">
                      <CardTitle className="text-sm">หน่วยงาน</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department">หน่วยงาน</Label>
                          <Input
                            id="department"
                            value={visitData.department}
                            onChange={(e) => handleVisitDataChange('department', e.target.value)}
                            placeholder="หน่วยงานที่ตรวจ"
                            list="department-options"
                          />
                          <datalist id="department-options">
                            <option value="คลินิกเทคนิคการแพทย์ โปร อินเตอร์ แลบ ไชยา" />
                            <option value="คลินิกเวชกรรมไชยารวมแพทย์" />
                            <option value="สปสช." />
                          </datalist>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="referringOrganization">หน่วยงานที่ส่งตัว</Label>
                          <Input
                            id="referringOrganization"
                            value={visitData.referringOrganization}
                            onChange={(e) => handleVisitDataChange('referringOrganization', e.target.value)}
                            placeholder="หน่วยงานที่ส่งตัว (ถ้ามี)"
                            list="referringOrganization-options"
                          />
                          <datalist id="referringOrganization-options">
                            <option value="คลินิกเวชกรรมไชยารวมแพทย์" />
                            <option value="โรงพยาบาลไชยา" />
                            <option value="โรงพยาบาลท่าฉาง" />
                            <option value="โรงพยาบาลท่าชนะ" />
                          </datalist>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vital Signs */}
                  <Card>
                    <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        สัญญาณชีพ
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="weight">น้ำหนัก (กก.)</Label>
                          <Input
                            id="weight"
                            type="text"
                            value={visitData.weight?.toString() || ''}
                            onChange={(e) => handleVisitDataChange('weight', e.target.value)}
                            placeholder="เช่น 65, 70.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">ส่วนสูง (ซม.)</Label>
                          <Input
                            id="height"
                            type="text"
                            value={visitData.height?.toString() || ''}
                            onChange={(e) => handleVisitDataChange('height', e.target.value)}
                            placeholder="เช่น 170, 165.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bloodPressure">ความดันโลหิต</Label>
                          <Input
                            id="bloodPressure"
                            value={visitData.bloodPressure}
                            onChange={(e) => handleVisitDataChange('bloodPressure', e.target.value)}
                            placeholder="120/80"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pulse">ชีพจร (ครั้ง/นาที)</Label>
                          <Input
                            id="pulse"
                            type="text"
                            value={visitData.pulse?.toString() || ''}
                            onChange={(e) => handleVisitDataChange('pulse', e.target.value)}
                            placeholder="เช่น 72, 80-90"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Medical History */}
                  <Card>
                    <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        ประวัติการแพทย์
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="chronicDiseases">โรคประจำตัว</Label>
                          <Textarea
                            id="chronicDiseases"
                            value={visitData.chronicDiseases}
                            onChange={(e) => handleVisitDataChange('chronicDiseases', e.target.value)}
                            placeholder="ระบุโรคประจำตัว (ถ้ามี)"
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ประวัติแพ้ยา</Label>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="no-allergy"
                                name="drugAllergies"
                                value="ไม่แพ้"
                                checked={visitData.drugAllergies === 'ไม่แพ้'}
                                onChange={(e) => handleVisitDataChange('drugAllergies', e.target.value)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                              />
                              <Label htmlFor="no-allergy" className="text-sm font-normal">ไม่แพ้</Label>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="has-allergy"
                                  name="drugAllergies"
                                  value="แพ้"
                                  checked={visitData.drugAllergies?.startsWith('แพ้') || false}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleVisitDataChange('drugAllergies', 'แพ้: ');
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                />
                                <Label htmlFor="has-allergy" className="text-sm font-normal">แพ้ โปรดระบุ</Label>
                              </div>
                              {visitData.drugAllergies?.startsWith('แพ้') && (
                                <Input
                                  placeholder="ระบุยาที่แพ้"
                                  value={visitData.drugAllergies?.replace('แพ้: ', '') || ''}
                                  onChange={(e) => handleVisitDataChange('drugAllergies', `แพ้: ${e.target.value}`)}
                                  className="ml-6"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Visit Details */}
                  <Card>
                    <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        รายละเอียด Visit
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="chiefComplaint">อาการสำคัญ/เหตุผลที่มา *</Label>
                          <Textarea
                            id="chiefComplaint"
                            value={visitData.chiefComplaint}
                            onChange={(e) => handleVisitDataChange('chiefComplaint', e.target.value)}
                            placeholder="ระบุอาการสำคัญหรือเหตุผลที่มาตรวจ"
                            className="min-h-[100px]"
                          />
                        </div>
                        <DoctorSelector
                          value={{
                            name: visitData.referringDoctor || '',
                            licenseNumber: visitData.doctorLicenseNumber || ''
                          }}
                          onChange={(doctor) => {
                            handleVisitDataChange('referringDoctor', doctor.name);
                            handleVisitDataChange('doctorLicenseNumber', doctor.licenseNumber);
                          }}
                          nameLabel="แพทย์ที่ส่งตัว"
                          licenseLabel="เลขใบอนุญาตแพทย์"
                          namePlaceholder="ชื่อแพทย์ที่ส่งตัว (ถ้ามี)"
                          licensePlaceholder="เลขใบอนุญาต (ถ้ามี)"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="orderDate">วันที่สั่งตรวจ</Label>
                            <Input
                              id="orderDate"
                              type="date"
                              value={visitData.orderDate}
                              onChange={(e) => handleVisitDataChange('orderDate', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="resultDeliveryMethod">วิธีรับผล</Label>
                            <Select
                              value={visitData.resultDeliveryMethod}
                              onValueChange={(value) => handleVisitDataChange('resultDeliveryMethod', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกวิธีรับผล" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="รับผลที่คลินิก">รับผลที่คลินิก</SelectItem>
                                <SelectItem value="Line ID">Line ID</SelectItem>
                                <SelectItem value="Tel.">Tel.</SelectItem>
                                <SelectItem value="E-mail">E-mail</SelectItem>
                              </SelectContent>
                            </Select>
                            {visitData.resultDeliveryMethod && visitData.resultDeliveryMethod !== 'รับผลที่คลินิก' && (
                              <div className="mt-2">
                                <Input
                                  placeholder={
                                    visitData.resultDeliveryMethod === 'Line ID' ? 'ระบุ Line ID' :
                                    visitData.resultDeliveryMethod === 'Tel.' ? 'ระบุเบอร์โทรศัพท์' :
                                    visitData.resultDeliveryMethod === 'E-mail' ? 'ระบุอีเมล' : 'ระบุรายละเอียด'
                                  }
                                  value={visitData.resultDeliveryDetails || ''}
                                  onChange={(e) => handleVisitDataChange('resultDeliveryDetails', e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !selectedPatient}
                      className="flex-1 bg-gradient-medical hover:opacity-90"
                    >
                      {isLoading ? (
                        <>
                          <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                          {visitData.visitNumber && visitData.visitNumber.trim() !== '' ? 'กำลังอัปเดต...' : 'กำลังบันทึก...'}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {visitData.visitNumber && visitData.visitNumber.trim() !== '' ? 'อัปเดตข้อมูล Visit' : 'บันทึกข้อมูล Visit'}
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="flex-1"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      รีเซ็ตฟอร์ม
                    </Button>

                    <Button
                      onClick={scrollToTop}
                      variant="outline"
                      className="px-4 border-blue-500 text-blue-600 hover:bg-blue-50"
                      title="กลับไปด้านบน"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="shadow-card-custom">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">เลือกคนไข้เพื่อเปิด Visit</h3>
              <p className="text-muted-foreground text-center">
                กรุณาค้นหาและเลือกคนไข้จากรายการด้านซ้าย<br />
                เพื่อเริ่มการเปิด visit ใหม่
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visit History Sidebar - Responsive layout */}
      <div className="w-full lg:w-80 space-y-3 sm:space-y-4">
        <Card className="shadow-card-custom border border-border/50 bg-green-50">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-b border-border/20">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              ประวัติ Visit ล่าสุด
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              รายการ visit ที่เปิดล่าสุด ({filteredVisits.length} รายการ)
            </CardDescription>
            {/* Search Input */}
            <div className="pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="ค้นหา visit, ชื่อผู้ป่วย, แผนก..."
                  value={visitSearchTerm}
                  onChange={(e) => setVisitSearchTerm(e.target.value)}
                  className="pl-10 pr-10 text-sm bg-background border-border/50 focus:border-primary dark:bg-background/50"
                />
                {visitSearchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => setVisitSearchTerm("")}
                    title="ล้างการค้นหา"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
            {recentVisits.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                {visitSearchTerm ? (
                  <div>
                    <p>ไม่พบผลการค้นหา</p>
                    <p className="text-xs mt-1">ลองค้นหาด้วยคำอื่น</p>
                  </div>
                ) : (
                  <p>ยังไม่มีประวัติ Visit</p>
                )}
              </div>
            ) : (
              recentVisits.map((visit) => (
                <Card key={visit._id} className="p-3 hover:shadow-md transition-shadow border border-border/50 bg-card hover:bg-accent/30">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-foreground">
                        Visit: {visit.visitNumber}
                      </div>
                      {getStatusBadge(visit.status)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>คนไข้: <span className="text-foreground/80">{visit.patientName}</span></div>
                      <div>วันที่: <span className="text-foreground/80">{formatDateForDisplay(visit.visitDate)}</span></div>
                      <div>แผนก: <span className="text-foreground/80">{visit.department}</span></div>
                      <div className="truncate">อาการ: <span className="text-foreground/80">{visit.chiefComplaint}</span></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        onClick={() => {
                          // Load visit data for editing
                          setVisitData(visit);
                          const patient = patients.find(p => p._id === visit.patientId);
                          if (patient) {
                            setSelectedPatient(patient);
                          }
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        แก้ไข
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={async () => {
                          if (confirm(`ต้องการลบ Visit ${visit.visitNumber} หรือไม่?`)) {
                            try {
                              await apiService.deleteVisit(visit._id!);
                              setVisitHistory(prev => prev.filter(v => v._id !== visit._id));
                              toast({
                                title: "ลบ Visit สำเร็จ",
                                description: `ลบ Visit ${visit.visitNumber} แล้ว`,
                              });
                            } catch (error) {
                              toast({
                                title: "เกิดข้อผิดพลาด",
                                description: "ไม่สามารถลบ Visit ได้",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        ลบ
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Floating Back to Top Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={scrollToTop}
            size="sm"
            className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            title="กลับไปด้านบน"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}