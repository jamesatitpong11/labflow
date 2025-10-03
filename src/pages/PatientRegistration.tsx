import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from "@/lib/toast-helpers";
import { apiService, PatientData } from "@/services/api";
import {
  UserPlus,
  Save,
  RotateCcw,
  CreditCard,
  User,
  Edit,
  Trash2,
  Clock,
  Search,
  Phone
} from "lucide-react";


export default function PatientRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingCard, setIsReadingCard] = useState(false);
  const [registrationHistory, setRegistrationHistory] = useState<PatientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [useManualAge, setUseManualAge] = useState(false);
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
  }, []);

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
    } catch (error) {
      console.error('Error loading registration history:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดประวัติการลงทะเบียนได้",
      });
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
        // Update existing patient
        const updatedPatient = await apiService.updatePatient(formData._id, {
          ln: formData.ln,
          idCard: formData.idCard || null, // Convert empty string to null
          title: formData.title,
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          birthDate: formData.birthDate,
          age: formData.age,
          phoneNumber: formData.phoneNumber,
          address: formData.address
        });

        // Update in history
        setRegistrationHistory(prev => 
          prev.map(p => p._id === formData._id ? updatedPatient : p)
        );

        showSuccessToast({
          title: "อัปเดตข้อมูลสำเร็จ",
          description: `อัปเดตข้อมูลคนไข้ ${formData.firstName} ${formData.lastName} แล้ว`,
        });
      } else {
        // Create new patient
        const newPatient = await apiService.createPatient({
          ln: formData.ln,
          idCard: formData.idCard || null, // Convert empty string to null
          title: formData.title,
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          birthDate: formData.birthDate,
          age: formData.age,
          phoneNumber: formData.phoneNumber,
          address: formData.address
        });

        // Add to history
        setRegistrationHistory(prev => [newPatient, ...prev]);

        showSuccessToast({
          title: "บันทึกข้อมูลสำเร็จ",
          description: `บันทึกข้อมูลคนไข้ ${formData.firstName} ${formData.lastName} แล้ว`,
        });
      }

      // Clear form
      handleClearForm();
    } catch (error) {
      console.error('Error saving/updating patient:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : `ไม่สามารถ${isUpdateMode ? 'อัปเดต' : 'บันทึก'}ข้อมูลได้`,
      });
    } finally {
      setIsLoading(false);
    }
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

  const handleDelete = async (patientId: string) => {
    try {
      await apiService.deletePatient(patientId);
      setRegistrationHistory(prev => prev.filter(p => p._id !== patientId));

      showSuccessToast({
        title: "ลบข้อมูลสำเร็จ",
        description: "ข้อมูลคนไข้ถูกลบแล้ว",
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      showErrorToast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลได้",
      });
    }
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
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Main Form - 3/4 width */}
      <div className="flex-1 space-y-6">
        {/* Header with Smart Card Reader */}
        <div className="relative overflow-hidden">
          <Card className="shadow-card-custom border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/3">
            <CardContent className="p-8">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl"></div>
                    <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 border border-primary/40">
                      <UserPlus className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-foreground tracking-tight">
                      ลงทะเบียนคนไข้
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium">
                      เพิ่มข้อมูลคนไข้ใหม่เข้าสู่ระบบ
                    </p>
                    <div className="flex items-center gap-2 text-sm text-primary/80">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span>ระบบพร้อมใช้งาน</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={readSmartCard}
                    disabled={isReadingCard}
                    size="lg"
                    className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
                  >
                    <CreditCard className="h-5 w-5 mr-3" />
                    {isReadingCard ? "กำลังอ่านบัตร..." : "อ่านบัตรประชาชน"}
                  </Button>
                  <Button
                    onClick={handleNoIdCard}
                    disabled={isLoading}
                    variant="outline"
                    size="lg"
                    className="border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-200 backdrop-blur-sm bg-background/80 min-w-[200px]"
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
        <Card className="shadow-card-custom border border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/20">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              ลงทะเบียนคนไข้ใหม่
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              กรอกข้อมูลคนไข้หรือใช้เครื่องอ่านบัตรประชาชน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Patient Information */}
              <div className="bg-muted/20 p-6 rounded-lg border border-primary/10">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  ข้อมูลประจำตัว
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ln" className="text-sm font-medium text-foreground">เลข Ln *</Label>
                    <Input
                      id="ln"
                      placeholder="สร้างอัตโนมัติ"
                      value={formData.ln}
                      onChange={(e) => handleInputChange('ln', e.target.value)}
                      required
                      className="h-11 border-2 border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idCard" className="text-sm font-medium text-foreground">เลขบัตรประชาชน (ไม่บังคับ)</Label>
                    <Input
                      id="idCard"
                      placeholder="1234567890123 (ไม่บังคับ)"
                      value={formData.idCard}
                      onChange={(e) => handleIdCardChange(e.target.value)}
                      maxLength={17}
                      className="h-11 border-2 border-border/50 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 p-6 rounded-lg border border-primary/10">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  ข้อมูลส่วนตัว
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-foreground">คำนำหน้า *</Label>
                    <div className="relative">
                      <Input
                        id="title"
                        placeholder="เลือกหรือกรอกคำนำหน้า"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                        list="title-options"
                        className="h-11 border-2 border-border/50 focus:border-primary transition-colors"
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

                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-foreground">ชื่อ *</Label>
                    <Input
                      id="firstName"
                      placeholder="กรอกชื่อ"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      className="h-11 border-2 border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-foreground">นามสกุล *</Label>
                    <Input
                      id="lastName"
                      placeholder="กรอกนามสกุล"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      className="h-11 border-2 border-border/50 focus:border-primary transition-colors"
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

              <div className="bg-muted/20 p-6 rounded-lg border border-primary/10">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  ข้อมูลติดต่อ
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">เบอร์โทรศัพท์</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="กรอกเบอร์โทรศัพท์"
                      value={formData.phoneNumber}
                      required
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="h-11 border-2 border-border/50 focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-foreground">ที่อยู่ *</Label>
                    <Textarea
                      id="address"
                      placeholder="กรอกที่อยู่เต็ม รวมถึงตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="min-h-[120px] border-2 border-border/50 focus:border-primary transition-colors resize-none"
                      
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-primary/20">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 text-base font-semibold"
                  disabled={isLoading}
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isLoading 
                    ? (isUpdateMode ? "กำลังอัปเดต..." : "กำลังบันทึก...") 
                    : (isUpdateMode ? "อัปเดตข้อมูล" : "บันทึกข้อมูล")
                  }
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                  className="flex-1 h-12 border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200 text-base font-semibold"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  ล้างข้อมูล
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Registration History Sidebar - 1/4 width */}
      <div className="w-80 space-y-4">
        <Card className="shadow-card-custom h-full border border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              ประวัติการลงทะเบียน
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              รายการคนไข้ที่ลงทะเบียนล่าสุด
            </CardDescription>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="ค้นหาชื่อ, เลขบัตร, Ln..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-2 border-border/50 focus:border-primary transition-colors"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="p-4 rounded-full bg-muted/30 w-fit mx-auto mb-4">
                  <User className="h-12 w-12 opacity-50" />
                </div>
                <p className="text-sm">ยังไม่มีประวัติการลงทะเบียน</p>
              </div>
            ) : (
              filteredHistory.map((patient) => (
                <Card key={patient._id} className="shadow-card-custom border border-primary/10 hover:border-primary/20 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-foreground text-sm mb-1">
                            {patient.title}{patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Ln:</span> {patient.ln}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">บัตร:</span> {patient.idCard}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">อายุ:</span> {patient.age} ปี
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(patient)}
                            className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(patient._id!)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded border">
                        <div className="truncate">
                          <span className="font-medium">ที่อยู่:</span> {patient.address}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}