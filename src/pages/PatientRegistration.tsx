import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from "@/lib/toast-helpers";
import { apiService, PatientData, VisitData } from "@/services/api";
import { DoctorSelector } from "@/components/DoctorSelector";
import {
  UserPlus,
  Save,
  RotateCcw,
  User,
  Search,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Edit,
  Trash2,
  FileText,
  Stethoscope,
  Printer,
  Plus,
  ChevronUp,
  ChevronDown,
  Tag,
  QrCode,
  ScanLine
} from "lucide-react";

export default function PatientRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingCard, setIsReadingCard] = useState(false);
  const [registrationHistory, setRegistrationHistory] = useState<PatientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<PatientData | null>(null);
  const [editFormData, setEditFormData] = useState<PatientData>({
    _id: "",
    ln: "",
    idCard: "",
    title: "",
    firstName: "",
    lastName: "",
    gender: "male",
    birthDate: "",
    age: 0,
    phoneNumber: "",
    address: ""
  });
  
  // New states for enhanced form fields
  const [hasChronicDiseases, setHasChronicDiseases] = useState(false);
  const [hasDrugAllergies, setHasDrugAllergies] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [originalAges, setOriginalAges] = useState<{[key: string]: number}>({});
  const [useManualAge, setUseManualAge] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [visitHistory, setVisitHistory] = useState<VisitData[]>([]);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [newPatientForVisit, setNewPatientForVisit] = useState<PatientData | null>(null);
  const [visitData, setVisitData] = useState<any>({
    patientId: "",
    patientName: "",
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toTimeString().slice(0, 5),
    patientRights: "",
    insuranceNumber: "",
    department: "",
    referringOrganization: "",
    weight: "",
    height: "",
    bloodPressure: "",
    pulse: "",
    chronicDiseases: "",
    drugAllergies: "",
    chiefComplaint: "",
    referringDoctor: "",
    doctorLicenseNumber: "",
    orderDate: new Date().toISOString().split('T')[0],
    resultDeliveryMethod: "รับผลที่คลินิก",
    resultDeliveryDetails: "",
    status: "pending"
  });
  
  // Additional missing states
  const [showVisitDeleteDialog, setShowVisitDeleteDialog] = useState(false);
  const [deleteVisitId, setDeleteVisitId] = useState<string | null>(null);
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);
  const [deleteCredentials, setDeleteCredentials] = useState({ firstName: "", lastName: "", username: "", password: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toggle states for collapsible sections
  const [showRegistrationHistory, setShowRegistrationHistory] = useState(true);
  const [showVisitHistory, setShowVisitHistory] = useState(true);
  
  // Visit search state
  const [visitSearchTerm, setVisitSearchTerm] = useState("");
  const [isSearchingVisits, setIsSearchingVisits] = useState(false);
  const [searchedVisits, setSearchedVisits] = useState<VisitData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [formData, setFormData] = useState<PatientData>({
    _id: "",
    ln: "",
    idCard: "",
    title: "",
    firstName: "",
    lastName: "",
    gender: "male",
    birthDate: "",
    age: 0,
    phoneNumber: "",
    address: ""
  });
  const { toast } = useToast();



  // Load registration history on component mount
  useEffect(() => {
    loadRegistrationHistory();
    loadVisitHistory();
    loadDoctors();
  }, []);

  // Debounced search effect สำหรับค้นหา Visit
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (visitSearchTerm.trim()) {
        searchVisitsFromDatabase(visitSearchTerm);
      } else {
        setSearchedVisits([]);
        setShowSearchResults(false);
      }
    }, 500); // รอ 500ms หลังจากหยุดพิมพ์

    return () => clearTimeout(timeoutId);
  }, [visitSearchTerm]);

  // Calculate age when birthdate changes (only if not using manual age)
  useEffect(() => {
    if (formData.birthDate && !useManualAge) {
      const age = calculateAgeFromBuddhistDate(formData.birthDate);
      if (age !== null) {
        setFormData(prev => ({ ...prev, age: Math.max(0, age) }));
      }
    }
  }, [formData.birthDate, useManualAge]);

  const calculateAgeFromBuddhistDate = (dateStr: string): number | null => {
    // Parse Buddhist date format: DD/MM/YYYY (Buddhist Era)
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const buddhistYear = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(buddhistYear)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    
    // Convert Buddhist year to Christian year
    const christianYear = buddhistYear - 543;
    
    const birthDate = new Date(christianYear, month - 1, day);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const loadRegistrationHistory = async () => {
    try {
      const patients = await apiService.getPatients();
      setRegistrationHistory(patients);
      
      // Store original ages for comparison
      const ages: {[key: string]: number} = {};
      patients.forEach(patient => {
        if (patient._id) {
          ages[patient._id] = patient.age;
        }
      });
      setOriginalAges(ages);
    } catch (error) {
      console.error('Error loading registration history:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดประวัติการลงทะเบียนได้",
      });
    }
  };

  const loadVisitHistory = async () => {
    try {
      const visits = await apiService.getVisits();
      console.log('Loaded visit history:', visits);
      setVisitHistory(visits);
    } catch (error) {
      console.error('Error loading visit history:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดประวัติ Visit ได้",
      });
    }
  };

  // ฟังก์ชันค้นหา Visit จากฐานข้อมูล
  const searchVisitsFromDatabase = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchedVisits([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearchingVisits(true);
    try {
      console.log('🔍 Searching visits from database:', searchTerm);
      
      // เรียก API เพื่อค้นหา Visit จากฐานข้อมูล (โหลดทั้งหมดแล้วกรอง)
      const allVisits = await apiService.getVisits();
      
      // กรองผลการค้นหาจากข้อมูลทั้งหมด
      const searchResults = allVisits.filter(visit => {
        const searchLower = searchTerm.toLowerCase();
        return (
          visit.visitNumber?.toLowerCase().includes(searchLower) ||
          visit.patientName?.toLowerCase().includes(searchLower) ||
          visit.department?.toLowerCase().includes(searchLower) ||
          visit.chiefComplaint?.toLowerCase().includes(searchLower) ||
          visit.patientData?.firstName?.toLowerCase().includes(searchLower) ||
          visit.patientData?.lastName?.toLowerCase().includes(searchLower) ||
          visit.patientData?.idCard?.includes(searchTerm) ||
          visit.patientData?.ln?.toLowerCase().includes(searchLower)
        );
      }).slice(0, 50); // จำกัดผลการค้นหาไม่เกิน 50 รายการ
      
      console.log('📋 Visit search results:', {
        searchTerm,
        count: searchResults.length,
        results: searchResults
      });
      
      setSearchedVisits(searchResults);
      setShowSearchResults(true);
      
      if (searchResults.length === 0) {
        showInfoToast({
          title: "ไม่พบผลการค้นหา",
          description: `ไม่พบ Visit ที่ตรงกับ "${searchTerm}"`
        });
      }
      
    } catch (error) {
      console.error('Error searching visits:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาดในการค้นหา",
        description: "ไม่สามารถค้นหาประวัติ Visit ได้"
      });
      setSearchedVisits([]);
      setShowSearchResults(false);
    } finally {
      setIsSearchingVisits(false);
    }
  };

  const loadDoctors = async () => {
    setIsLoadingDoctors(true);
    try {
      console.log('Loading doctors...');
      const doctorsList = await apiService.getDoctors();
      console.log('Doctors loaded:', doctorsList);
      setDoctors(doctorsList || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Don't show error toast as this is not critical
      setDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  const readSmartCard = async () => {
    setIsReadingCard(true);
    try {
      const response = await fetch('http://localhost:9200/v1/readSmartCard');
      if (!response.ok) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเครื่องอ่านบัตรได้');
      }

      const responseData = await response.json();
      
      // Handle the actual API response format
      if (responseData.status !== "success") {
        throw new Error(responseData.message || 'ไม่สามารถอ่านบัตรได้');
      }
      
      const cardData = responseData.personInfo;
      const idCard = cardData.cid || "";

      if (!idCard) {
        throw new Error('ไม่พบเลขบัตรประชาชนในบัตร');
      }

      // Check if patient already exists in database
      const existingPatient = await apiService.checkPatientByIdCard(idCard);
      
      if (existingPatient) {
        showWarningToast({
          title: "พบข้อมูลในระบบแล้ว",
          description: `คนไข้ ${existingPatient.title}${existingPatient.firstName} ${existingPatient.lastName} (LN: ${existingPatient.ln}) มีข้อมูลในระบบแล้ว`,
        });
        
        // Load existing patient data to form for editing
        setFormData({
          ...existingPatient,
          birthDate: existingPatient.birthDate || ""
        });
        setIsUpdateMode(true);
        return;
      }

      // Generate new LN for new patient
      const newLN = await apiService.generateNextLN();

      // Map smart card data to form
      setFormData({
        ln: newLN,
        idCard: idCard,
        title: cardData.titlenameTH || "",
        firstName: cardData.firstnameTH || "",
        lastName: cardData.lastnameTH || "",
        gender: cardData.genderId === "1" ? "male" : "female",
        birthDate: formatBirthDate(cardData.dateOfBirth) || "",
        age: 0, // Will be calculated by useEffect
        phoneNumber: "",
        address: cardData.address || ""
      });
      setIsUpdateMode(false);

      showSuccessToast({
        title: "อ่านบัตรสำเร็จ",
        description: `ข้อมูลจากบัตรประชาชนถูกโหลดแล้ว (LN: ${newLN})`,
      });
    } catch (error) {
      console.error('Error reading smart card:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถอ่านบัตรประชาชนได้",
      });
    } finally {
      setIsReadingCard(false);
    }
  };

  const generateLN = async (): Promise<string> => {
    return await apiService.generateNextLN();
  };

  const formatBirthDate = (dateStr: string): string => {
    if (!dateStr) return "";
    
    // Handle smart card format: YYYYMMDD (Buddhist year)
    if (dateStr && dateStr.length === 8 && !dateStr.includes('/') && !dateStr.includes('-')) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${day}/${month}/${year}`;
    }
    
    // Handle manual input format: DDMMYYYY (Buddhist year)
    if (dateStr && dateStr.length === 8 && !dateStr.includes('/') && !dateStr.includes('-')) {
      // This case is handled above, but keeping for clarity
      const day = dateStr.substring(0, 2);
      const month = dateStr.substring(2, 4);
      const buddhistYear = dateStr.substring(4, 8);
      return `${day}/${month}/${buddhistYear}`;
    }
    
    // If dateStr is in YYYY-MM-DD format (Christian year), convert to Buddhist
    if (dateStr && dateStr.includes('-') && dateStr.length === 10) {
      const [year, month, day] = dateStr.split('-');
      const buddhistYear = (parseInt(year) + 543).toString();
      return `${day}/${month}/${buddhistYear}`;
    }
    
    return dateStr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check for duplicate ID card before creating new patient
      if (!isUpdateMode && formData.idCard && formData.idCard.trim()) {
        const existingPatient = await apiService.checkPatientByIdCard(formData.idCard.trim());
        
        if (existingPatient) {
          showWarningToast({
            title: "พบข้อมูลในระบบแล้ว",
            description: `คนไข้ ${existingPatient.title}${existingPatient.firstName} ${existingPatient.lastName} (LN: ${existingPatient.ln}) ใช้เลขบัตรประชาชนนี้แล้ว`,
          });
          
          // Load existing patient data to form for editing
          setFormData({
            ...existingPatient,
            birthDate: existingPatient.birthDate || ""
          });
          setIsUpdateMode(true);
          setIsLoading(false);
          return;
        }
      }

      if (isUpdateMode && formData._id) {
        
        // Validate required fields
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          throw new Error('กรุณากรอกชื่อและนามสกุล');
        }
        
        // Validate Patient ID format
        if (!formData._id || formData._id.length !== 24) {
          throw new Error('รหัสผู้ป่วยไม่ถูกต้อง กรุณาลองใหม่');
        }
        
        // Prepare update data with validation
        const updateData = {
          ln: formData.ln?.trim() || '',
          idCard: formData.idCard?.trim() || null,
          title: formData.title || '',
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          gender: formData.gender || 'male',
          birthDate: formData.birthDate || '',
          age: Math.max(0, Math.min(150, Number(formData.age) || 0)),
          phoneNumber: formData.phoneNumber?.trim() || '',
          address: formData.address?.trim() || ''
        };
        
        
        
        // Update existing patient
        const updatedPatient = await apiService.updatePatient(formData._id, updateData);

        // Update in history
        setRegistrationHistory(prev => 
          prev.map(p => p._id === formData._id ? updatedPatient : p)
        );

        showSuccessToast({
          title: "อัปเดตข้อมูลสำเร็จ",
          description: `อัปเดตข้อมูลคนไข้ ${formData.firstName} ${formData.lastName} แล้ว`,
        });

        // Scroll to top after successful update
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        
        // Validate required fields
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          throw new Error('กรุณากรอกชื่อและนามสกุล');
        }
        
        // Create new patient
        const newPatient = await apiService.createPatient({
          ln: formData.ln,
          idCard: formData.idCard || null, // Convert empty string to null
          title: formData.title,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          gender: formData.gender,
          birthDate: formData.birthDate,
          age: Number(formData.age) || 0, // Ensure age is number
          phoneNumber: formData.phoneNumber,
          address: formData.address
        });

        // Add to history
        setRegistrationHistory(prev => [newPatient, ...prev]);

        showSuccessToast({
          title: "บันทึกข้อมูลสำเร็จ",
          description: `บันทึกข้อมูลคนไข้ ${formData.firstName} ${formData.lastName} แล้ว`,
        });

        // Scroll to top after successful registration
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Ask if user wants to create a visit for the new patient
        setNewPatientForVisit(newPatient);
        setShowVisitDialog(true);
      }

      // Clear form for update mode
      if (isUpdateMode) {
        handleClearForm();
      }
    } catch (error) {
      
      let errorMessage = 'ไม่สามารถดำเนินการได้';
      
      if (error instanceof Error) {
        if (error.message.includes('500')) {
          errorMessage = 'เซิร์เวอร์มีปัญหา กรุณาตรวจสอบข้อมูลและลองใหม่';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์เวอร์ได้ ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
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

  // Visit Dialog Functions
  const handleCreateVisit = async () => {
    if (!newPatientForVisit) return;

    setIsLoading(true);
    try {
      let result;
      
      if (visitData._id) {
        // Update existing visit
        result = await apiService.updateVisit(visitData._id, {
          patientId: newPatientForVisit._id!,
          patientName: `${newPatientForVisit.title}${newPatientForVisit.firstName} ${newPatientForVisit.lastName}`,
          visitDate: visitData.visitDate || new Date().toISOString().split('T')[0],
          visitTime: visitData.visitTime || new Date().toTimeString().slice(0, 5),
          patientRights: visitData.patientRights || "",
          insuranceNumber: visitData.insuranceNumber || "",
          department: visitData.department || "ทั่วไป",
          referringOrganization: visitData.referringOrganization || "",
          weight: visitData.weight || "",
          height: visitData.height || "",
          bloodPressure: visitData.bloodPressure || "",
          pulse: visitData.pulse || "",
          chronicDiseases: visitData.chronicDiseases || "",
          drugAllergies: visitData.drugAllergies || "",
          chiefComplaint: visitData.chiefComplaint || "",
          referringDoctor: visitData.referringDoctor || "",
          doctorLicenseNumber: visitData.doctorLicenseNumber || "",
          orderDate: visitData.orderDate || new Date().toISOString().split('T')[0],
          resultDeliveryMethod: visitData.resultDeliveryMethod || "รับที่คลินิก",
          resultDeliveryDetails: visitData.resultDeliveryDetails || "",
          status: visitData.status || "pending"
        } as any);

        showSuccessToast({
          title: "อัปเดต Visit สำเร็จ",
          description: `อัปเดต Visit ${visitData.visitNumber} สำหรับ ${newPatientForVisit.firstName} ${newPatientForVisit.lastName} แล้ว`,
        });

        // Scroll to top after successful visit update
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Generate visit number for new visit
        const visitNumberResponse = await apiService.generateNextVisitNumber(visitData.visitDate);
        
        // Create new visit
        result = await apiService.createVisit({
          visitNumber: visitNumberResponse.visitNumber,
          patientId: newPatientForVisit._id!,
          patientName: `${newPatientForVisit.title}${newPatientForVisit.firstName} ${newPatientForVisit.lastName}`,
          visitDate: visitData.visitDate || new Date().toISOString().split('T')[0],
          visitTime: visitData.visitTime || new Date().toTimeString().slice(0, 5),
          patientRights: visitData.patientRights || "",
          insuranceNumber: visitData.insuranceNumber || "",
          department: visitData.department || "ทั่วไป",
          referringOrganization: visitData.referringOrganization || "",
          weight: visitData.weight || "",
          height: visitData.height || "",
          bloodPressure: visitData.bloodPressure || "",
          pulse: visitData.pulse || "",
          chronicDiseases: visitData.chronicDiseases || "",
          drugAllergies: visitData.drugAllergies || "",
          chiefComplaint: visitData.chiefComplaint || "",
          referringDoctor: visitData.referringDoctor || "",
          doctorLicenseNumber: visitData.doctorLicenseNumber || "",
          orderDate: visitData.orderDate || new Date().toISOString().split('T')[0],
          resultDeliveryMethod: visitData.resultDeliveryMethod || "รับที่คลินิก",
          resultDeliveryDetails: visitData.resultDeliveryDetails || "",
          status: "pending"
        } as any);

        showSuccessToast({
          title: "เปิด Visit สำเร็จ",
          description: `เปิด Visit ${result.visitNumber} สำหรับ ${newPatientForVisit.firstName} ${newPatientForVisit.lastName} แล้ว`,
        });

        // Scroll to top after successful visit creation
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Refresh visit history
      loadVisitHistory();

      // Close dialog and clear form
      setShowVisitDialog(false);
      setNewPatientForVisit(null);
      
      // Reset visit data
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
        weight: "",
        height: "",
        bloodPressure: "",
        pulse: "",
        chronicDiseases: "",
        drugAllergies: "",
        chiefComplaint: "",
        referringDoctor: "",
        doctorLicenseNumber: "",
        orderDate: new Date().toISOString().split('T')[0],
        resultDeliveryMethod: "รับผลที่คลินิก",
        resultDeliveryDetails: "",
        status: "pending"
      });
      
      // Reset medical history states
      setHasChronicDiseases(false);
      setHasDrugAllergies(false);

      // Clear form only if it was a new patient registration
      if (!visitData._id) {
        handleClearForm();
      }
      
    } catch (error) {
      console.error('Error creating/updating visit:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: visitData._id ? "ไม่สามารถอัปเดต Visit ได้" : "ไม่สามารถเปิด Visit ได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipVisit = () => {
    setShowVisitDialog(false);
    setNewPatientForVisit(null);
    
    // Reset visit data
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
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      chronicDiseases: "",
      drugAllergies: "",
      chiefComplaint: "",
      referringDoctor: "",
      doctorLicenseNumber: "",
      orderDate: new Date().toISOString().split('T')[0],
      resultDeliveryMethod: "รับผลที่คลินิก",
      resultDeliveryDetails: "",
      status: "pending"
    });
    
    // Reset medical history states
    setHasChronicDiseases(false);
    setHasDrugAllergies(false);
    
    // Only clear patient form if it was from new patient registration
    if (!visitData._id) {
      handleClearForm();
    }
  };

  const handleVisitDataChange = (field: string, value: string) => {
    setVisitData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle doctor selection and creation
  const handleDoctorSelect = async (doctorName: string) => {
    // Always update the referringDoctor field to allow editing
    setVisitData(prev => ({
      ...prev,
      referringDoctor: doctorName
    }));
    
    // If the input is empty, clear the license number
    if (!doctorName.trim()) {
      setVisitData(prev => ({
        ...prev,
        doctorLicenseNumber: ''
      }));
      return;
    }
    
    // Check if doctor exists in the list
    const existingDoctor = doctors.find(doc => 
      doc.name === doctorName.trim()
    );
    
    if (existingDoctor) {
      // Use existing doctor and auto-fill license number
      setVisitData(prev => ({
        ...prev,
        doctorLicenseNumber: existingDoctor.licenseNumber || ''
      }));
    } else {
      // Clear license number for new doctor name
      setVisitData(prev => ({
        ...prev,
        doctorLicenseNumber: ''
      }));
    }
  };
  
  // Handle doctor creation when user clicks save or blur
  const handleDoctorSave = async () => {
    const doctorName = visitData.referringDoctor?.trim();
    const licenseNumber = visitData.doctorLicenseNumber?.trim();
    
    console.log('=== DOCTOR SAVE DEBUG ===');
    console.log('Doctor name:', doctorName);
    console.log('License number:', licenseNumber);
    console.log('Existing doctors:', doctors);
    
    // Check if both fields are empty - do nothing
    if (!doctorName && !licenseNumber) {
      console.log('Both fields empty - no action needed');
      return;
    }
    
    // Check if doctor already exists
    if (doctorName) {
      const existingDoctor = doctors.find(doc => doc.name === doctorName);
      if (existingDoctor) {
        console.log('Doctor already exists:', existingDoctor);
        showInfoToast({
          title: "แพทย์มีอยู่แล้ว",
          description: `แพทย์ ${doctorName} มีอยู่ในระบบแล้ว`,
        });
        return;
      }
    }
    
    // Validate required fields - only show warning if user has started filling
    if (!doctorName || !licenseNumber) {
      let missingFields = [];
      if (!doctorName) missingFields.push('ชื่อแพทย์');
      if (!licenseNumber) missingFields.push('เลขใบอนุญาต');
      
      console.log('Validation failed - missing:', missingFields);
      showWarningToast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: `กรุณากรอก ${missingFields.join('และ')} ให้ครบถ้วนก่อนบันทึก`,
      });
      
      // Focus on the first empty field
      if (!doctorName) {
        document.getElementById('referring-doctor')?.focus();
      } else if (!licenseNumber) {
        document.getElementById('doctor-license')?.focus();
      }
      
      return;
    }
    
    console.log('Validation passed - creating new doctor...');
    
    // Create new doctor if both name and license number are provided
    try {
      const doctorData = {
        name: doctorName,
        licenseNumber: licenseNumber
      };
      
      console.log('Doctor data to create:', doctorData);
      
      const newDoctor = await apiService.createDoctor(doctorData);
      
      console.log('New doctor created successfully:', newDoctor);
      
      // Add to doctors list
      setDoctors(prev => {
        const updated = [...prev, newDoctor];
        console.log('Updated doctors list:', updated);
        return updated;
      });
      
      showSuccessToast({
        title: "เพิ่มแพทย์ใหม่สำเร็จ",
        description: `เพิ่มแพทย์ ${doctorName} (ใบอนุญาต: ${licenseNumber}) เข้าฐานข้อมูลแล้ว`,
      });
    } catch (error) {
      console.error('Error creating doctor:', error);
      
      // Check if it's a duplicate name error
      if (error instanceof Error && error.message.includes('400')) {
        showInfoToast({
          title: "แพทย์มีอยู่แล้ว",
          description: `แพทย์ ${doctorName} หรือเลขใบอนุญาตนี้มีอยู่ในระบบแล้ว`,
        });
        
        // Reload doctors list to make sure we have the latest data
        loadDoctors();
      } else {
        showErrorToast({
          title: "เกิดข้อผิดพลาด",
          description: `ไม่สามารถเพิ่มแพทย์ ${doctorName} ได้: ${error instanceof Error ? error.message : 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`,
        });
      }
    }
  };
  
  // Handle blur event for doctor fields
  const handleDoctorBlur = () => {
    // Only trigger save if both fields have content
    const doctorName = visitData.referringDoctor?.trim();
    const licenseNumber = visitData.doctorLicenseNumber?.trim();
    
    if (doctorName && licenseNumber) {
      handleDoctorSave();
    }
  };

  // Handle chronic diseases toggle
  const handleChronicDiseasesToggle = (hasDisease: boolean) => {
    setHasChronicDiseases(hasDisease);
    if (!hasDisease) {
      setVisitData(prev => ({ ...prev, chronicDiseases: '' }));
    }
  };

  // Handle drug allergies toggle
  const handleDrugAllergiesToggle = (hasAllergy: boolean) => {
    setHasDrugAllergies(hasAllergy);
    if (!hasAllergy) {
      setVisitData(prev => ({ ...prev, drugAllergies: '' }));
    }
  };

  // Handle edit patient button click
  const handleEditPatient = (patient: PatientData) => {
    // Load patient data into main form
    setFormData({
      _id: patient._id || "",
      ln: patient.ln,
      idCard: patient.idCard || "",
      title: patient.title,
      firstName: patient.firstName,
      lastName: patient.lastName,
      gender: patient.gender,
      birthDate: patient.birthDate || "",
      age: patient.age,
      phoneNumber: patient.phoneNumber || "",
      address: patient.address || ""
    });
    
    // Set to update mode
    setIsUpdateMode(true);
    setUseManualAge(!patient.birthDate && patient.age > 0);
    
    // Scroll to main form
    const mainForm = document.querySelector('.main-form');
    if (mainForm) {
      mainForm.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
    
    showInfoToast({
      title: "โหลดข้อมูลแล้ว",
      description: `โหลดข้อมูล ${patient.firstName} ${patient.lastName} ในฟอร์มสำหรับแก้ไข`,
    });
  };

  // Handle edit form data change
  const handleEditFormChange = (field: keyof PatientData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save edited patient
  const handleSaveEditedPatient = async () => {
    if (!editFormData._id) return;
    
    setIsLoading(true);
    try {
      console.log('=== UPDATING PATIENT FROM DIALOG ===');
      console.log('Patient ID:', editFormData._id);
      console.log('Edit Form Data:', editFormData);
      
      // Validate required fields
      if (!editFormData.firstName.trim() || !editFormData.lastName.trim()) {
        throw new Error('กรุณากรอกชื่อและนามสกุล');
      }
      
      const updatedPatient = await apiService.updatePatient(editFormData._id, {
        ln: editFormData.ln,
        idCard: editFormData.idCard || null,
        title: editFormData.title,
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        gender: editFormData.gender,
        birthDate: editFormData.birthDate,
        age: Number(editFormData.age) || 0,
        phoneNumber: editFormData.phoneNumber,
        address: editFormData.address
      });
      
      console.log('Updated patient result:', updatedPatient);
      
      // Update in registration history
      setRegistrationHistory(prev => 
        prev.map(p => p._id === editFormData._id ? updatedPatient : p)
      );
      
      showSuccessToast({
        title: "อัปเดตข้อมูลสำเร็จ",
        description: `อัปเดตข้อมูลคนไข้ ${editFormData.firstName} ${editFormData.lastName} แล้ว`,
      });
      
      // Close dialog
      setShowEditDialog(false);
      setPatientToEdit(null);
    } catch (error) {
      console.error('Error updating patient:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : `ไม่สามารถอัปเดตข้อมูลได้`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setShowEditDialog(false);
    setPatientToEdit(null);
  };

  // Handle patient age update
  const handlePatientAgeUpdate = async (patientId: string, newAge: number) => {
    console.log('=== UPDATING PATIENT AGE ===');
    console.log('Patient ID:', patientId);
    console.log('New Age:', newAge);
    console.log('API Base URL:', 'http://localhost:8080/api');
    
    try {
      // Validate age before sending
      if (newAge < 0 || newAge > 150) {
        throw new Error('อายุต้องอยู่ระหว่าง 0-150 ปี');
      }
      
      const result = await apiService.updatePatient(patientId, { age: newAge });
      console.log('Update result:', result);
      
      // Update the patient in registration history immediately
      setRegistrationHistory(prev => 
        prev.map(p => p._id === patientId ? { ...p, age: newAge } : p)
      );
      
      showSuccessToast({
        title: "อัปเดตอายุสำเร็จ",
        description: `อัปเดตอายุเป็น ${newAge} ปีแล้ว`,
      });
    } catch (error) {
      console.error('Error updating patient age:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถอัปเดตอายุได้: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      // Revert the change in UI
      loadRegistrationHistory();
    }
  };

  // Visit Management Functions
  const handlePrintVisit = async (visit: VisitData) => {
    try {
      showInfoToast({
        title: "กำลังพิมพ์เวชระเบียน",
        description: `กำลังเตรียมข้อมูลสำหรับ Visit ${visit.visitNumber}`,
      });

      // Get company settings
      const companySettings = await apiService.getCompanySettings();
      
      // Get patient data
      const patientData = visit.patientData || registrationHistory.find(p => p._id === visit.patientId);
      
      if (!patientData) {
        throw new Error('ไม่พบข้อมูลผู้ป่วย');
      }

      // Prepare medical record form data
      const { printMedicalRecordForm } = await import('@/utils/medicalRecordForm');
      
      const formData = {
        // Company info
        companyInfo: companySettings,
        
        // Patient info
        patientln: patientData.ln,
        patientTitle: patientData.title || '',
        patientFirstName: patientData.firstName,
        patientLastName: patientData.lastName,
        patientBirthDate: patientData.birthDate,
        patientAge: patientData.age,
        patientGender: patientData.gender,
        patientIdCard: patientData.idCard || '',
        patientPhone: patientData.phoneNumber || '',
        patientAddress: patientData.address || '',
        
        // Visit info
        visitNumber: visit.visitNumber,
        visitDate: visit.visitDate,
        
        // Medical info
        weight: visit.weight ? parseFloat(String(visit.weight)) : undefined,
        height: visit.height ? parseFloat(String(visit.height)) : undefined,
        bloodPressure: String(visit.bloodPressure || ''),
        pulse: String(visit.pulse || ''),
        chronicDiseases: String(visit.chronicDiseases || ''),
        drugAllergies: String(visit.drugAllergies || ''),
        
        // Insurance info
        insuranceType: visit.patientRights,
        insuranceNumber: visit.insuranceNumber,
        
        // Result delivery
        resultDeliveryMethod: visit.resultDeliveryMethod,
        resultDeliveryDetails: visit.resultDeliveryDetails
      };

      // Get saved printer from localStorage
      const savedPrinter = localStorage.getItem('selectedPrinter');
      
      // Print the medical record form
      await printMedicalRecordForm(formData, savedPrinter || undefined);
      
      showSuccessToast({
        title: "พิมพ์เวชระเบียนสำเร็จ",
        description: `พิมพ์เวชระเบียน Visit ${visit.visitNumber} เรียบร้อยแล้ว`,
      });
      
    } catch (error) {
      console.error('Error printing medical record:', error);
      showErrorToast({
        title: "ไม่สามารถพิมพ์เวชระเบียนได้",
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการพิมพ์',
      });
    }
  };

  // Debug function to test sticker printing
  const handleTestSticker = async () => {
    try {
      showInfoToast({
        title: "ทดสอบการพิมพ์สติ๊กเกอร์",
        description: "กำลังทดสอบระบบพิมพ์สติ๊กเกอร์",
      });

      // Get sticker printer from settings
      const { getPrinterByType } = await import('@/lib/printer-utils');
      const stickerPrinterName = getPrinterByType('sticker');
      
      console.log('🧪 Test - Sticker printer configuration:', stickerPrinterName);
      
      if (!stickerPrinterName) {
        showWarningToast({
          title: "ไม่พบเครื่องพิมพ์สติ๊กเกอร์",
          description: "กรุณาไปที่หน้า 'ตั้งค่า > เครื่องพิมพ์' เพื่อกำหนดเครื่องพิมพ์สติ๊กเกอร์",
        });
        return;
      }

      // Create test data
      const testStickerData = {
        idCard: '1234567890123',
        title: 'นาย',
        firstName: 'ทดสอบ',
        lastName: 'ระบบ',
        visitNumber: 'V' + Date.now().toString().slice(-6),
        ln: '67001',
        age: '35',
        visitDate: new Date().toLocaleDateString('th-TH', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }),
        visitTime: new Date().toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        printerName: stickerPrinterName
      };

      console.log('🧪 Test sticker data:', testStickerData);

      // พิมพ์สติ๊กเกอร์ด้วยเทมเพลตใหม่ 50x25mm
      const { createSticker50x25HTML } = await import('@/utils/stickerbarcode50x25');
      const { printSticker } = await import('@/lib/printer-utils');
      const testHtml = createSticker50x25HTML({
        title: testStickerData.title,
        firstName: testStickerData.firstName,
        lastName: testStickerData.lastName,
        ln: testStickerData.ln,
        age: testStickerData.age,
        visitNumber: testStickerData.visitNumber,
        visitDate: testStickerData.visitDate,
        visitTime: testStickerData.visitTime,
      });
      await printSticker(testHtml);
      
      showSuccessToast({
        title: "ทดสอบพิมพ์สติ๊กเกอร์สำเร็จ",
        description: `ส่งสติ๊กเกอร์ทดสอบไปยัง ${stickerPrinterName} เรียบร้อยแล้ว`,
      });
      
    } catch (error) {
      console.error('🧪 Test sticker error:', error);
      showErrorToast({
        title: "ทดสอบการพิมพ์สติ๊กเกอร์ล้มเหลว",
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการทดสอบ',
      });
    }
  };

  const handlePrintSticker = async (visit: VisitData) => {
    try {
      showInfoToast({
        title: "กำลังพิมพ์สติ๊กเกอร์",
        description: `กำลังเตรียมสติ๊กเกอร์สำหรับ ${visit.patientName}`,
      });

      // Get patient data
      const patientData = visit.patientData || registrationHistory.find(p => p._id === visit.patientId);
      
      if (!patientData) {
        throw new Error('ไม่พบข้อมูลผู้ป่วย');
      }

      // Get sticker printer from settings
      const { getPrinterByType } = await import('@/lib/printer-utils');
      const stickerPrinterName = getPrinterByType('sticker');
      
      console.log('🖨️ Sticker printer configuration:', stickerPrinterName);
      
      if (!stickerPrinterName) {
        showWarningToast({
          title: "ไม่พบเครื่องพิมพ์สติ๊กเกอร์",
          description: "กรุณาไปที่หน้า 'ตั้งค่า > เครื่องพิมพ์' เพื่อกำหนดเครื่องพิมพ์สติ๊กเกอร์",
        });
        return;
      }

      console.log(`🎯 Using configured sticker printer: ${stickerPrinterName}`);

      // สร้าง HTML สติ๊กเกอร์ด้วยเทมเพลตใหม่ และสั่งพิมพ์
      const { createSticker50x25HTML } = await import('@/utils/stickerbarcode50x25');
      const { printSticker } = await import('@/lib/printer-utils');
      const visitDateDisplay = visit.visitDate
        ? new Date(visit.visitDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
        : new Date().toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const visitTimeDisplay = visit.visitTime && visit.visitTime.trim().length > 0
        ? visit.visitTime
        : new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      const stickerHtml = createSticker50x25HTML({
        title: patientData.title || '',
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        visitNumber: visit.visitNumber,
        ln: patientData.ln || '',
        age: String(patientData.age || ''),
        visitDate: visitDateDisplay,
        visitTime: visitTimeDisplay,
      });

      await printSticker(stickerHtml);
      
      showSuccessToast({
        title: "พิมพ์สติ๊กเกอร์สำเร็จ",
        description: `ส่งสติ๊กเกอร์ ${visit.patientName} ไปยัง ${stickerPrinterName} เรียบร้อยแล้ว`,
      });
      
    } catch (error) {
      console.error('Error printing sticker:', error);
      showErrorToast({
        title: "ไม่สามารถพิมพ์สติ๊กเกอร์ได้",
        description: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการพิมพ์สติ๊กเกอร์',
      });
    }
  };

  const handleEditVisit = (visit: VisitData) => {
    // Set visit data for editing
    setVisitData({
      ...visit,
      visitDate: visit.visitDate,
      visitTime: visit.visitTime,
    });
    
    // Set medical history states based on existing data
    setHasChronicDiseases(!!visit.chronicDiseases && visit.chronicDiseases.trim() !== '');
    setHasDrugAllergies(!!visit.drugAllergies && visit.drugAllergies.trim() !== '');
    
    setNewPatientForVisit({
      _id: visit.patientId,
      firstName: visit.patientName.split(' ')[0] || '',
      lastName: visit.patientName.split(' ').slice(1).join(' ') || '',
      title: '',
      ln: '',
      idCard: '',
      gender: 'male',
      birthDate: '',
      age: 0,
      phoneNumber: '',
      address: ''
    });
    setShowVisitDialog(true);
    
    showInfoToast({
      title: "แก้ไข Visit",
      description: `เปิดฟอร์มแก้ไข Visit ${visit.visitNumber}`,
    });
  };

  const handleDeleteVisit = (visitId: string) => {
    setDeleteVisitId(visitId);
    setShowVisitDeleteDialog(true);
  };

  const confirmDeleteVisit = async () => {
    if (!deleteVisitId) return;

    setIsDeletingVisit(true);
    try {
      await apiService.deleteVisit(deleteVisitId);
      
      // Remove from visit history
      setVisitHistory(prev => prev.filter(visit => visit._id !== deleteVisitId));
      
      showSuccessToast({
        title: "ลบ Visit สำเร็จ",
        description: "ลบข้อมูล Visit แล้ว",
      });
      
      setShowVisitDeleteDialog(false);
      setDeleteVisitId("");
    } catch (error) {
      console.error('Error deleting visit:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบ Visit ได้",
      });
    } finally {
      setIsDeletingVisit(false);
    }
  };

  const cancelDeleteVisit = () => {
    setShowVisitDeleteDialog(false);
    setDeleteVisitId("");
  };

  // Function to create visit for existing patient
  const handleCreateVisitForPatient = (patient: PatientData) => {
    // Set patient data for visit creation
    setNewPatientForVisit(patient);
    
    // Reset visit data to default values
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
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      chronicDiseases: "",
      drugAllergies: "",
      chiefComplaint: "",
      referringDoctor: "",
      doctorLicenseNumber: "",
      orderDate: new Date().toISOString().split('T')[0],
      resultDeliveryMethod: "รับผลที่คลินิก",
      resultDeliveryDetails: "",
      status: "pending"
    });
    
    // Reset medical history states
    setHasChronicDiseases(false);
    setHasDrugAllergies(false);
    
    // Open visit dialog
    setShowVisitDialog(true);
    
    showInfoToast({
      title: "เปิด Visit",
      description: `เปิดฟอร์มสร้าง Visit สำหรับ ${patient.firstName} ${patient.lastName}`,
    });
  };

  const handleClearForm = () => {
    setFormData({
      ln: "",
      idCard: "",
      title: "",
      firstName: "",
      lastName: "",
      gender: "male",
      birthDate: "",
      age: 0,
      phoneNumber: "",
      address: ""
    });
    setIsUpdateMode(false);
    setUseManualAge(false);
  };

  const handleInputChange = (field: keyof PatientData, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-detect gender based on title
      if (field === 'title') {
        const title = value.trim();
        if (title === 'นาย' || title === 'ด.ช.' || title === 'พระ') {
          updated.gender = 'male';
        } else if (title === 'นาง' || title === 'นางสาว' || title === 'ด.ญ.') {
          updated.gender = 'female';
        }
      }

      return updated;
    });
  };

  // Check for duplicate ID card when user types
  const handleIdCardChange = async (value: string) => {
    handleInputChange('idCard', value);
    
    // Only check if we have a complete ID card and not in update mode
    if (!isUpdateMode && value.length >= 13) {
      try {
        const existingPatient = await apiService.checkPatientByIdCard(value.trim());
        
        if (existingPatient) {
          showWarningToast({
            title: "พบข้อมูลในระบบแล้ว",
            description: `เลขบัตรประชาชนนี้ถูกใช้โดย ${existingPatient.title}${existingPatient.firstName} ${existingPatient.lastName} (LN: ${existingPatient.ln}) แล้ว`,
          });
        }
      } catch (error) {
        // Silently ignore errors during typing
      }
    }
  };

  const handleBirthDateChange = (value: string) => {
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '');
    
    // Format with automatic slash insertion
    let formattedValue = '';
    
    if (digitsOnly.length >= 1) {
      formattedValue = digitsOnly.substring(0, 2);
    }
    if (digitsOnly.length >= 3) {
      formattedValue += '/' + digitsOnly.substring(2, 4);
    }
    if (digitsOnly.length >= 5) {
      formattedValue += '/' + digitsOnly.substring(4, 8);
    }
    
    // Store the formatted Buddhist Era format
    setFormData(prev => ({
      ...prev,
      birthDate: formattedValue
    }));
  };

  const handleEdit = (patient: PatientData) => {
    setFormData(patient);
    setIsUpdateMode(true);
    // Set manual age mode if patient has age but no birth date
    setUseManualAge(!patient.birthDate && patient.age > 0);
    showInfoToast({
      title: "โหลดข้อมูลแล้ว",
      description: "ข้อมูลถูกโหลดในฟอร์มสำหรับแก้ไข",
    });
  };

  const handleDelete = (patientId: string) => {
    setDeletePatientId(patientId);
    setShowDeleteDialog(true);
    setDeleteCredentials({ firstName: "", lastName: "", username: "", password: "" });
  };

  const confirmDelete = async () => {
    // ตรวจสอบ username และ password
    if (!deleteCredentials.username || !deleteCredentials.password) {
      showErrorToast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอก Username และ Password",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // ใช้ API login เพื่อตรวจสอบ username และ password
      console.log('=== DELETE AUTHENTICATION DEBUG ===');
      console.log('Input username:', deleteCredentials.username);
      console.log('Input password:', deleteCredentials.password);
      
      const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: deleteCredentials.username,
          password: deleteCredentials.password
        }),
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (!loginResponse.ok) {
        showErrorToast({
          title: "การยืนยันตัวตนล้มเหลว",
          description: loginData.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง",
        });
        return;
      }

      const authenticatedUser = loginData.user;
      console.log('Authenticated user:', authenticatedUser);

      // แสดงข้อความยืนยันการเข้าสู่ระบบสำเร็จ
      const displayName = authenticatedUser.fullName || 
                         authenticatedUser.firstName || 
                         authenticatedUser.username;
      
      showInfoToast({
        title: "ยืนยันตัวตนสำเร็จ",
        description: `ยินดีต้อนรับ ${displayName}`,
      });

      // ดำเนินการลบข้อมูลคนไข้
      await apiService.deletePatient(deletePatientId);
      setRegistrationHistory(prev => prev.filter(p => p._id !== deletePatientId));

      const operatorName = authenticatedUser.fullName || 
                          authenticatedUser.firstName || 
                          authenticatedUser.username;
      
      showSuccessToast({
        title: "ลบข้อมูลคนไข้สำเร็จ",
        description: `ข้อมูลถูกลบเรียบร้อยแล้วโดย ${operatorName}`,
      });
      
      setShowDeleteDialog(false);
      setDeletePatientId("");
      setDeleteCredentials({ firstName: "", lastName: "", username: "", password: "" });
    } catch (error) {
      console.error('Error during delete process:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลได้",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setDeletePatientId("");
    setDeleteCredentials({ firstName: "", lastName: "", username: "", password: "" });
  };

  const handleNoIdCard = async () => {
    try {
      setIsLoading(true);
      
      // Generate next LN number
      const newLN = await apiService.generateNextLN();
      
      // Clear form and set only LN
      setFormData({
        ln: newLN,
        idCard: "",
        title: "",
        firstName: "",
        lastName: "",
        gender: "male",
        birthDate: "",
        age: 0,
        phoneNumber: "",
        address: ""
      });
      setIsUpdateMode(false);
      setUseManualAge(false);

      showInfoToast({
        title: "เตรียมฟอร์มสำเร็จ",
        description: `เตรียมฟอร์มสำหรับคนไข้ไม่มีบัตรประชาชน (LN: ${newLN})`,
      });
    } catch (error) {
      console.error('Error generating LN:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างเลข LN ได้",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = registrationHistory.filter(patient =>
    (patient.firstName && patient.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (patient.lastName && patient.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (patient.idCard && patient.idCard.includes(searchTerm)) ||
    (patient.ln && patient.ln.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 h-auto xl:h-[calc(100vh-120px)]">
      {/* Left Sidebar - History Sections */}
      <div className="w-full xl:w-80 space-y-3">
        {/* Registration History - Top */}
        <Card className="shadow-sm border border-border">
          <CardHeader className="bg-green-100 dark:bg-black/10 border-b p-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <UserPlus className="h-3 w-3 text-primary" />
                  ประวัติการลงทะเบียน
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  รายการคนไข้ที่ลงทะเบียนล่าสุด
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRegistrationHistory(!showRegistrationHistory)}
                className="h-6 w-6 p-0 hover:bg-primary/10"
                title={showRegistrationHistory ? "ซ่อนประวัติ" : "แสดงประวัติ"}
              >
                {showRegistrationHistory ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Search - Only show when history is visible */}
            {showRegistrationHistory && (
              <div className="relative mt-3">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-primary" />
                <Input
                  placeholder="ค้นหาชื่อ, เลขบัตร, Ln..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm border border-border/50 focus:border-primary transition-colors"
                />
              </div>
            )}
          </CardHeader>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showRegistrationHistory ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <CardContent className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
              {filteredHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <div className="p-2 rounded-full bg-muted/30 w-fit mx-auto mb-2">
                  <User className="h-6 w-6 opacity-50" />
                </div>
                <p className="text-xs">ยังไม่มีประวัติการลงทะเบียน</p>
              </div>
            ) : (
              filteredHistory.slice(0, 5).map((patient) => (
                <Card key={patient._id} className="shadow-sm border border-border hover:border-primary/20 transition-all duration-200">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-foreground text-xs mb-1">
                            {patient.title}{patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Ln:</span> {patient.ln}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">อายุ:</span>
                              <Input
                                type="number"
                                value={patient.age}
                                onChange={(e) => {
                                  const newAge = parseInt(e.target.value) || 0;
                                  // Update patient age in the list immediately for UI responsiveness
                                  setRegistrationHistory(prev => 
                                    prev.map(p => 
                                      p._id === patient._id 
                                        ? { ...p, age: newAge }
                                        : p
                                    )
                                  );
                                }}
                                onBlur={(e) => {
                                  const newAge = parseInt(e.target.value) || 0;
                                  const originalAge = originalAges[patient._id || ''] || patient.age;
                                  // Save to database when user finishes editing
                                  if (patient._id && newAge !== originalAge) {
                                    handlePatientAgeUpdate(patient._id, newAge);
                                    // Update original age after successful save
                                    setOriginalAges(prev => ({
                                      ...prev,
                                      [patient._id!]: newAge
                                    }));
                                  }
                                }}
                                className="h-5 w-12 text-xs px-1 border-0 bg-transparent focus:bg-white focus:border focus:border-primary transition-all"
                                min="0"
                                max="150"
                              />
                              <span className="text-xs">ปี</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCreateVisitForPatient(patient)}
                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                            title="เปิด Visit"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPatient(patient)}
                            className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                            title="แก้ไข"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(patient._id!)}
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            title="ลบ"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            </CardContent>
          </div>
        </Card>

        {/* Visit History - Bottom */}
        <Card className="shadow-sm border border-border">
          <CardHeader className="bg-purple-100 dark:bg-black/10 border-b p-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Stethoscope className="h-3 w-3 text-primary" />
                  ประวัติเปิด Visit
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  รายการ Visit ที่เปิดล่าสุด
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVisitHistory(!showVisitHistory)}
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                  title={showVisitHistory ? "ซ่อนประวัติ Visit" : "แสดงประวัติ Visit"}
                >
                  {showVisitHistory ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showVisitHistory ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <CardContent className="p-3 space-y-3">
              {/* Visit Search */}
              {showVisitHistory && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="ค้นหา Visit (หมายเลข Visit, ชื่อผู้ป่วย, แผนก...)"
                    className="pl-8 h-8 text-sm"
                    value={visitSearchTerm}
                    onChange={(e) => setVisitSearchTerm(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {/* แสดงสถานะการค้นหา */}
              {visitSearchTerm.trim() && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isSearchingVisits ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                    ) : (
                      <Search className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    )}
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                      {isSearchingVisits ? 
                        `กำลังค้นหา \"${visitSearchTerm}\" จากฐานข้อมูล...` : 
                        `ผลการค้นหา \"${visitSearchTerm}\": ${showSearchResults ? searchedVisits.length : 0} รายการ`
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* แสดงผลการค้นหาหรือประวัติปกติ */}
              {visitSearchTerm.trim() && showSearchResults ? (
                // แสดงผลการค้นหาจากฐานข้อมูล
                searchedVisits.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <div className="p-2 rounded-full bg-muted/30 w-fit mx-auto mb-2">
                      <Search className="h-6 w-6 opacity-50" />
                    </div>
                    <p className="text-xs">ไม่พบ Visit ที่ตรงกับการค้นหา</p>
                  </div>
                ) : (
                  searchedVisits.map((visit) => (
                <Card key={visit._id} className="shadow-sm border border-border hover:border-primary/20 transition-all duration-200">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-xs mb-1">
                            {visit.patientName}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Visit:</span> {visit.visitNumber}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">วันที่:</span> {
                                visit.visitDate ? 
                                  new Date(visit.visitDate).toLocaleDateString('th-TH', {
                                    day: '2-digit',
                                    month: '2-digit', 
                                    year: 'numeric'
                                  }) : 
                                  'ไม่ระบุ'
                              }
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">แผนก:</span> {visit.department}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">สถานะ:</span> 
                              <Badge 
                                variant={visit.status === 'completed' ? 'default' : visit.status === 'in-progress' ? 'secondary' : 'outline'}
                                className="text-xs h-4"
                              >
                                {visit.status === 'completed' ? 'เสร็จสิ้น' : 
                                 visit.status === 'in-progress' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintVisit(visit)}
                            className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                            title="พิมพ์"
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintSticker(visit)}
                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                            title="พิมพ์สติ๊กเกอร์บาร์โค้ด"
                          >
                            <ScanLine className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditVisit(visit)}
                            className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                            title="แก้ไข"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteVisit(visit._id!)}
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            title="ลบ"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {visit.chiefComplaint && (
                        <div className="text-xs text-muted-foreground bg-muted/20 p-1 rounded border mt-1">
                          <div className="truncate">
                            <span className="font-medium">อาการ:</span> {visit.chiefComplaint}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
                )
              ) : (
                // แสดงประวัติ Visit ปกติ (ไม่มีการค้นหา)
                visitHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <div className="p-2 rounded-full bg-muted/30 w-fit mx-auto mb-2">
                      <FileText className="h-6 w-6 opacity-50" />
                    </div>
                    <p className="text-xs">ยังไม่มีประวัติ Visit</p>
                  </div>
                ) : (
                  visitHistory.map((visit) => (
                <Card key={visit._id} className="shadow-sm border border-border hover:border-primary/20 transition-all duration-200">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-xs mb-1">
                            {visit.patientName}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Visit:</span> {visit.visitNumber}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">วันที่:</span> {
                                visit.visitDate ? 
                                  new Date(visit.visitDate).toLocaleDateString('th-TH', {
                                    day: '2-digit',
                                    month: '2-digit', 
                                    year: 'numeric'
                                  }) : 
                                  'ไม่ระบุ'
                              }
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">แผนก:</span> {visit.department}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">สถานะ:</span> 
                              <Badge 
                                variant={visit.status === 'completed' ? 'default' : visit.status === 'in-progress' ? 'secondary' : 'outline'}
                                className="text-xs h-4"
                              >
                                {visit.status === 'completed' ? 'เสร็จสิ้น' : 
                                 visit.status === 'in-progress' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintVisit(visit)}
                            className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                            title="พิมพ์"
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePrintSticker(visit)}
                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                            title="พิมพ์สติ๊กเกอร์บาร์โค้ด"
                          >
                            <ScanLine className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditVisit(visit)}
                            className="h-6 w-6 p-0 text-primary hover:bg-primary/10"
                            title="แก้ไข"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteVisit(visit._id!)}
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                            title="ลบ"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {visit.chiefComplaint && (
                        <div className="text-xs text-muted-foreground bg-muted/20 p-1 rounded border mt-1">
                          <div className="truncate">
                            <span className="font-medium">อาการ:</span> {visit.chiefComplaint}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
                )
              )}
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Right Side - Main Form */}
      <div className="flex-1 space-y-3 sm:space-y-4">
        {/* Header with Smart Card Reader */}
        <div className="relative overflow-hidden">
          <Card className="bg-blue-100 dark:bg-black/10 shadow-sm border border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                      ลงทะเบียนคนไข้
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      เพิ่มข้อมูลคนไข้ใหม่เข้าสู่ระบบ
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={readSmartCard}
                    disabled={isReadingCard}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3"
                  >
                    <CreditCard className="h-3 w-3 mr-2" />
                    {isReadingCard ? "กำลังอ่านบัตร..." : "อ่านบัตรประชาชน"}
                  </Button>
                  <Button
                    onClick={handleNoIdCard}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="border border-primary/30 text-primary hover:bg-primary/10 h-8 px-3"
                  >
                    <User className="h-5 w-5 mr-3" />
                    ไม่มีบัตรประชาชน
                  </Button>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-success/10 to-transparent rounded-full blur-xl"></div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        <Card className={`shadow-sm border main-form transition-all duration-300 ${
          isUpdateMode || formData.firstName || formData.lastName || formData.idCard
            ? 'border-primary bg-primary/5 shadow-primary/20 shadow-lg'
            : 'border-border bg-card'
        }`}>
          <CardHeader className={`border-b transition-all duration-300 ${
            isUpdateMode || formData.firstName || formData.lastName || formData.idCard
              ? 'bg-primary/10 border-primary/20'
              : 'bg-blue-50 dark:bg-black/10'
          }`}>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                {isUpdateMode ? (
                  <>
                    <Edit className="h-4 w-4 text-primary" />
                    แก้ไขข้อมูลคนไข้
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-primary" />
                    ลงทะเบียนคนไข้ใหม่
                  </>
                )}
              </div>
              
              {/* Status Indicator */}
              {(isUpdateMode || formData.firstName || formData.lastName || formData.idCard) && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-xs text-primary font-medium">
                    {isUpdateMode ? 'โหมดแก้ไข' : 'กำลังกรอกข้อมูล'}
                  </span>
                </div>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {isUpdateMode 
                ? `แก้ไขข้อมูลคนไข้ ${formData.firstName} ${formData.lastName}` 
                : "กรอกข้อมูลคนไข้หรือใช้เครื่องอ่านบัตรประชาชน"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Patient Information */}
              <div className="bg-muted/20 p-3 rounded border">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="h-3 w-3 text-primary" />
                  ข้อมูลประจำตัว
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ln" className="text-xs font-medium text-foreground">เลข Ln *</Label>
                    <Input
                      id="ln"
                      placeholder="สร้างอัตโนมัติ"
                      value={formData.ln}
                      onChange={(e) => handleInputChange('ln', e.target.value)}
                      required
                      className="h-8 text-sm border border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="idCard" className="text-xs font-medium text-foreground">เลขบัตรประชาชน (ไม่บังคับ)</Label>
                    <Input
                      id="idCard"
                      placeholder="1234567890123 (ไม่บังคับ)"
                      value={formData.idCard}
                      onChange={(e) => handleIdCardChange(e.target.value)}
                      maxLength={17}
                      className="h-8 text-sm border border-border/50 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 p-3 rounded border">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <User className="h-3 w-3 text-primary" />
                  ข้อมูลส่วนตัว
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="title" className="text-xs font-medium text-foreground">คำนำหน้า *</Label>
                    <div className="relative">
                      <Input
                        id="title"
                        placeholder="เลือกหรือกรอกคำนำหน้า"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                        list="title-options"
                        className="h-8 text-sm border border-border/50 focus:border-primary transition-colors"
                      />
                      <datalist id="title-options">
                        <option value="นาย" />
                        <option value="นาง" />
                        <option value="นางสาว" />
                        <option value="ด.ช." />
                        <option value="ด.ญ." />
                        <option value="พระ" />
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="firstName" className="text-xs font-medium text-foreground">ชื่อ *</Label>
                    <Input
                      id="firstName"
                      placeholder="กรอกชื่อ"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="h-8 text-sm border border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastName" className="text-xs font-medium text-foreground">นามสกุล *</Label>
                    <Input
                      id="lastName"
                      placeholder="กรอกนามสกุล"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      className="h-8 text-sm border border-border/50 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 p-6 rounded-lg border border-primary/10">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  ข้อมูลทั่วไป
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">เพศ *</Label>
                      <RadioGroup
                        value={formData.gender}
                        onValueChange={(value) => handleInputChange('gender', value)}
                        className="flex gap-6 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" className="border-primary text-primary" />
                          <Label htmlFor="male" className="text-foreground font-medium">ชาย</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" className="border-primary text-primary" />
                          <Label htmlFor="female" className="text-foreground font-medium">หญิง</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-sm font-medium text-foreground">
                        วันเดือนปีเกิด (พ.ศ.) {!useManualAge && '*'}
                      </Label>
                      <Input
                        id="birthDate"
                        type="text"
                        placeholder="วัน/เดือน/ปีเกิด"
                        value={formData.birthDate}
                        onChange={(e) => handleBirthDateChange(e.target.value)}
                        maxLength={10}
                        required={!useManualAge}
                        disabled={useManualAge}
                        className={`h-11 border-2 transition-colors ${
                          useManualAge 
                            ? 'bg-muted/50 border-muted text-muted-foreground' 
                            : 'border-border/50 focus:border-primary'
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm font-medium text-foreground">
                        อายุ {useManualAge && '*'}
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="กรอกอายุ"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        readOnly={!useManualAge}
                        required={useManualAge}
                        min="0"
                        max="150"
                        className={`h-11 border-2 transition-colors ${
                          useManualAge 
                            ? 'border-border/50 focus:border-primary' 
                            : 'bg-muted/50 border-muted'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Toggle for manual age input */}
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg border border-primary/10">
                    <Checkbox
                      id="useManualAge"
                      checked={useManualAge}
                      onCheckedChange={(checked) => {
                        setUseManualAge(checked as boolean);
                        if (checked) {
                          // Clear birth date when switching to manual age
                          setFormData(prev => ({ ...prev, birthDate: "" }));
                        } else {
                          // Clear age when switching back to birth date
                          setFormData(prev => ({ ...prev, age: 0 }));
                        }
                      }}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label 
                      htmlFor="useManualAge" 
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      กรอกอายุเองหากไม่ทราบวันเกิด
                    </Label>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 p-3 rounded border">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Phone className="h-3 w-3 text-primary" />
                  ข้อมูลติดต่อ
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="phoneNumber" className="text-xs font-medium text-foreground">เบอร์โทรศัพท์</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="กรอกเบอร์โทรศัพท์"
                      value={formData.phoneNumber}
                      required
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="h-8 text-sm border border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="address" className="text-xs font-medium text-foreground">ที่อยู่ *</Label>
                    <Textarea
                      id="address"
                      placeholder="กรอกที่อยู่เต็ม รวมถึงตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="min-h-[80px] text-sm border border-border/50 focus:border-primary transition-colors resize-none"
                      
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-3 pt-4 border-t transition-all duration-300 ${
                isUpdateMode || formData.firstName || formData.lastName || formData.idCard
                  ? 'border-primary/20 bg-primary/5 -mx-4 -mb-4 px-4 pb-4 mt-4'
                  : 'border-border'
              }`}>
                <Button
                  type="submit"
                  className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                  disabled={isLoading}
                >
                  <Save className="h-3 w-3 mr-2" />
                  {isLoading 
                    ? (isUpdateMode ? "กำลังอัปเดต..." : "กำลังบันทึก...") 
                    : (isUpdateMode ? "อัปเดตข้อมูล" : "บันทึกข้อมูล")
                  }
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                  className="flex-1 h-9 border border-primary/30 text-primary hover:bg-primary/10 text-sm"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  {isUpdateMode ? "ยกเลิกการแก้ไข" : "ล้างข้อมูล"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>


      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              ยืนยันการลบข้อมูล
            </DialogTitle>
            <DialogDescription>
              เพื่อความปลอดภัย กรุณายืนยันตัวตนด้วยบัญชีผู้ใช้ที่เข้าใช้งานระบบก่อนดำเนินการลบข้อมูลคนไข้
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="delete-username"
                type="text"
                placeholder="ชื่อผู้ใช้ที่เข้าสู่ระบบ"
                value={deleteCredentials.username}
                onChange={(e) => setDeleteCredentials(prev => ({ ...prev, username: e.target.value }))}
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delete-password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="รหัสผ่านของผู้ใช้ที่เข้าสู่ระบบ"
                value={deleteCredentials.password}
                onChange={(e) => setDeleteCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "กำลังดำเนินการ..." : "ยืนยันและลบข้อมูล"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Creation Dialog */}
      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {visitData._id ? 'แก้ไข Visit' : 'เปิด Visit'} สำหรับ {newPatientForVisit?.firstName} {newPatientForVisit?.lastName}
            </DialogTitle>
            <DialogDescription>
              กรอกข้อมูลการมาตรวจของผู้ป่วย
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Patient Info Card */}
            {newPatientForVisit && (
              <Card className="shadow-sm border border-primary/20">
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
                      <p className="font-medium">{newPatientForVisit.title}{newPatientForVisit.firstName} {newPatientForVisit.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">LN</Label>
                      <p className="font-medium">{newPatientForVisit.ln}</p>
                    </div>
                    {newPatientForVisit.idCard && (
                      <div>
                        <Label className="text-muted-foreground">เลขบัตรประชาชน</Label>
                        <p className="font-medium">{newPatientForVisit.idCard}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">อายุ</Label>
                      <p className="font-medium">{newPatientForVisit.age} ปี</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visit Form */}
            <Card className="shadow-sm border border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  ข้อมูล Visit
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                {/* Basic Visit Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visit-date" className="text-sm font-medium">วันที่ Visit *</Label>
                    <Input
                      id="visit-date"
                      type="date"
                      value={visitData.visitDate}
                      onChange={(e) => handleVisitDataChange('visitDate', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visit-time" className="text-sm font-medium">เวลา *</Label>
                    <Input
                      id="visit-time"
                      type="time"
                      value={visitData.visitTime}
                      onChange={(e) => handleVisitDataChange('visitTime', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Rights and Organization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-rights" className="text-sm font-medium">สิทธิการรักษา *</Label>
                    <div className="relative">
                      <Input
                        id="patient-rights"
                        list="patient-rights-options"
                        placeholder="เลือกหรือพิมพ์สิทธิการรักษา"
                        value={visitData.patientRights}
                        onChange={(e) => handleVisitDataChange('patientRights', e.target.value)}
                        className="h-10"
                      />
                      <datalist id="patient-rights-options">
                        <option value="ชำระเงินเอง" />
                        <option value="สปสช." />
                        <option value="ประกันสังคม" />
                        <option value="ข้าราชการ" />
                        <option value="หน่วยงาน" />
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">หน่วยงาน *</Label>
                    <div className="relative">
                      <Input
                        id="department"
                        list="department-options"
                        placeholder="เลือกหรือพิมพ์หน่วยงาน"
                        value={visitData.department}
                        onChange={(e) => handleVisitDataChange('department', e.target.value)}
                        className="h-10"
                      />
                      <datalist id="department-options">
                        <option value="คลินิกเทคนิคการแพทย์ โปร อินเตอร์ แลบ ไชยา" />
                        <option value="คลินิกเวชกรรมไชยารวมแพทย์" />
                        <option value="สปสช." />
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referring-org" className="text-sm font-medium">หน่วยงานที่ส่งตัว</Label>
                  <div className="relative">
                    <Input
                      id="referring-org"
                      list="referring-org-options"
                      placeholder="เลือกหรือพิมพ์หน่วยงานที่ส่งตัว"
                      value={visitData.referringOrganization}
                      onChange={(e) => handleVisitDataChange('referringOrganization', e.target.value)}
                      className="h-10"
                    />
                    <datalist id="referring-org-options">
                      <option value="คลินิกเวชกรรมไชยารวมแพทย์" />
                      <option value="โรงพยาบาลไชยา" />
                      <option value="โรงพยาบาลท่าฉาง" />
                      <option value="โรงพยาบาลท่าชนะ" />
                      <option value="โรงพยาบาลสุราษฎร์ธานี" />
                      <option value="ศูนย์สุขภาพชุมชน" />
                      <option value="คลินิกเอกชน" />
                    </datalist>
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">สัญญาณชีพ</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-sm font-medium">น้ำหนัก (กก.)</Label>
                      <Input
                        id="weight"
                        placeholder="0.0"
                        value={visitData.weight}
                        onChange={(e) => handleVisitDataChange('weight', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-sm font-medium">ส่วนสูง (ซม.)</Label>
                      <Input
                        id="height"
                        placeholder="0.0"
                        value={visitData.height}
                        onChange={(e) => handleVisitDataChange('height', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="blood-pressure" className="text-sm font-medium">ความดันโลหิต</Label>
                      <Input
                        id="blood-pressure"
                        placeholder="120/80"
                        value={visitData.bloodPressure}
                        onChange={(e) => handleVisitDataChange('bloodPressure', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pulse" className="text-sm font-medium">ชีพจร</Label>
                      <Input
                        id="pulse"
                        placeholder="72"
                        value={visitData.pulse}
                        onChange={(e) => handleVisitDataChange('pulse', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">โรคประจำตัว</Label>
                      <RadioGroup
                        value={hasChronicDiseases ? "yes" : "no"}
                        onValueChange={(value) => handleChronicDiseasesToggle(value === "yes")}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="no-chronic" className="border-primary text-primary" />
                          <Label htmlFor="no-chronic" className="text-foreground font-medium">ไม่มี</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="has-chronic" className="border-primary text-primary" />
                          <Label htmlFor="has-chronic" className="text-foreground font-medium">มี</Label>
                        </div>
                      </RadioGroup>
                      {hasChronicDiseases && (
                        <Textarea
                          id="chronic-diseases"
                          placeholder="ระบุโรคประจำตัว"
                          value={visitData.chronicDiseases}
                          onChange={(e) => handleVisitDataChange('chronicDiseases', e.target.value)}
                          className="min-h-[80px]"
                        />
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">ประวัติการแพ้ยา</Label>
                      <RadioGroup
                        value={hasDrugAllergies ? "yes" : "no"}
                        onValueChange={(value) => handleDrugAllergiesToggle(value === "yes")}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="no-allergies" className="border-primary text-primary" />
                          <Label htmlFor="no-allergies" className="text-foreground font-medium">ไม่มี</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="has-allergies" className="border-primary text-primary" />
                          <Label htmlFor="has-allergies" className="text-foreground font-medium">มี</Label>
                        </div>
                      </RadioGroup>
                      {hasDrugAllergies && (
                        <Textarea
                          id="drug-allergies"
                          placeholder="ระบุยาที่แพ้"
                          value={visitData.drugAllergies}
                          onChange={(e) => handleVisitDataChange('drugAllergies', e.target.value)}
                          className="min-h-[80px]"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chief-complaint" className="text-sm font-medium">อาการสำคัญ/เหตุผลการตรวจ</Label>
                    <Textarea
                      id="chief-complaint"
                      placeholder="ระบุอาการสำคัญหรือเหตุผลที่มาตรวจ"
                      value={visitData.chiefComplaint}
                      onChange={(e) => handleVisitDataChange('chiefComplaint', e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="referring-doctor" className="text-sm font-medium">แพทย์ที่ส่งตัว *</Label>
                    <div className="relative">
                      <Input
                        id="referring-doctor"
                        list="doctors-options"
                        placeholder="เลือกหรือพิมพ์ชื่อแพทย์"
                        value={visitData.referringDoctor || ''}
                        onChange={(e) => handleDoctorSelect(e.target.value)}
                        onBlur={handleDoctorBlur}
                        className="h-10"
                        required
                      />
                      <datalist id="doctors-options">
                        {doctors.map((doctor, index) => (
                          <option key={doctor._id || index} value={doctor.name} />
                        ))}
                      </datalist>
                      {isLoadingDoctors && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">เลือกจากรายการ หรือพิมพ์ใหม่ + กรอกเลขใบอนุญาต</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctor-license" className="text-sm font-medium">เลขใบอนุญาตแพทย์ *</Label>
                    <Input
                      id="doctor-license"
                      placeholder="กรอกเลขใบอนุญาตแพทย์"
                      value={visitData.doctorLicenseNumber}
                      onChange={(e) => handleVisitDataChange('doctorLicenseNumber', e.target.value)}
                      onBlur={handleDoctorBlur}
                      className="h-10"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground flex-1">จำเป็นต้องกรอกครบถ้วนก่อนบันทึกแพทย์ใหม่</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleDoctorSave}
                        className="h-6 px-2 text-xs"
                      >
                        บันทึกแพทย์
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order-date" className="text-sm font-medium">วันที่สั่งตรวจ</Label>
                    <Input
                      id="order-date"
                      type="date"
                      value={visitData.orderDate}
                      onChange={(e) => handleVisitDataChange('orderDate', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Result Delivery */}
                <div className="space-y-2">
                  <Label htmlFor="result-delivery" className="text-sm font-medium">วิธีรับผลตรวจ</Label>
                  <Select value={visitData.resultDeliveryMethod} onValueChange={(value) => handleVisitDataChange('resultDeliveryMethod', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="เลือกวิธีรับผลตรวจ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="รับผลที่คลินิก">รับผลที่คลินิก</SelectItem>
                      <SelectItem value="Line ID">Line ID</SelectItem>
                      <SelectItem value="Tel">Tel</SelectItem>
                      <SelectItem value="E-mail">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleSkipVisit}
              disabled={isLoading}
            >
              {visitData._id ? 'ยกเลิก' : 'ข้ามการเปิด Visit'}
            </Button>
            <Button
              onClick={handleCreateVisit}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {visitData._id ? 'กำลังอัปเดต...' : 'กำลังสร้าง Visit...'}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {visitData._id ? 'อัปเดต Visit' : 'เปิด Visit'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Delete Confirmation Dialog */}
      <Dialog open={showVisitDeleteDialog} onOpenChange={setShowVisitDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              ยืนยันการลบ Visit
            </DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบ Visit นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={cancelDeleteVisit}
              disabled={isDeletingVisit}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteVisit}
              disabled={isDeletingVisit}
            >
              {isDeletingVisit ? "กำลังลบ..." : "ยืนยันและลบ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              แก้ไขข้อมูลผู้ป่วย
            </DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลผู้ป่วย {patientToEdit?.firstName} {patientToEdit?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* LN */}
            <div className="space-y-2">
              <Label htmlFor="edit-ln">เลข LN</Label>
              <Input
                id="edit-ln"
                value={editFormData.ln}
                onChange={(e) => handleEditFormChange('ln', e.target.value)}
                placeholder="เลข LN"
              />
            </div>
            
            {/* ID Card */}
            <div className="space-y-2">
              <Label htmlFor="edit-idCard">เลขบัตรประชาชน</Label>
              <Input
                id="edit-idCard"
                value={editFormData.idCard || ''}
                onChange={(e) => handleEditFormChange('idCard', e.target.value)}
                placeholder="เลขบัตรประชาชน"
              />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">คำนำหน้า</Label>
              <Select value={editFormData.title} onValueChange={(value) => handleEditFormChange('title', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคำนำหน้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="นาย">นาย</SelectItem>
                  <SelectItem value="นางสาว">นางสาว</SelectItem>
                  <SelectItem value="นาง">นาง</SelectItem>
                  <SelectItem value="เด็กชาย">เด็กชาย</SelectItem>
                  <SelectItem value="เด็กหญิง">เด็กหญิง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">ชื่อ *</Label>
                <Input
                  id="edit-firstName"
                  value={editFormData.firstName}
                  onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                  placeholder="ชื่อ"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">นามสกุล *</Label>
                <Input
                  id="edit-lastName"
                  value={editFormData.lastName}
                  onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                  placeholder="นามสกุล"
                  required
                />
              </div>
            </div>
            
            {/* Gender and Age */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-gender">เพศ</Label>
                <Select value={editFormData.gender} onValueChange={(value) => handleEditFormChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกเพศ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ชาย</SelectItem>
                    <SelectItem value="female">หญิง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age">อายุ</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editFormData.age}
                  onChange={(e) => handleEditFormChange('age', parseInt(e.target.value) || 0)}
                  placeholder="อายุ"
                  min="0"
                  max="150"
                />
              </div>
            </div>
            
            {/* Birth Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-birthDate">วันเกิด</Label>
              <Input
                id="edit-birthDate"
                type="date"
                value={editFormData.birthDate || ''}
                onChange={(e) => handleEditFormChange('birthDate', e.target.value)}
              />
            </div>
            
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit-phoneNumber">เบอร์โทรศัพท์</Label>
              <Input
                id="edit-phoneNumber"
                value={editFormData.phoneNumber || ''}
                onChange={(e) => handleEditFormChange('phoneNumber', e.target.value)}
                placeholder="เบอร์โทรศัพท์"
              />
            </div>
            
            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="edit-address">ที่อยู่</Label>
              <Textarea
                id="edit-address"
                value={editFormData.address || ''}
                onChange={(e) => handleEditFormChange('address', e.target.value)}
                placeholder="ที่อยู่"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSaveEditedPatient}
              disabled={isLoading}
            >
              {isLoading ? "กำลังบันทึก..." : "ยืนยันการแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}