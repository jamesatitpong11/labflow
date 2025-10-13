// API service for LabFlow Clinic
// Check if running in Electron environment - make this dynamic
// Production build - debug logs removed

// Global variable to track backend availability
let backendStatus: 'unknown' | 'local' | 'production' = 'unknown';

// Get API base URL with smart fallback
const getApiBaseUrl = () => {
  // If we already know the status, use it
  if (backendStatus === 'local') {
    return 'http://localhost:3001/api';
  } else if (backendStatus === 'production') {
    const prodBaseUrl = import.meta.env.VITE_API_URL || 
                        import.meta.env.VITE_BACKEND_URL || 
                        'https://labflow-clinic-backend-skzx.onrender.com';
    return `${prodBaseUrl}/api`;
  }

  // First time - check if we're in development environment
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       import.meta.env.DEV;
  
  if (isDevelopment) {
    // Try local first, but will fallback to production if connection fails
    return 'http://localhost:3001/api';
  } else {
    // Production environment
    const prodBaseUrl = import.meta.env.VITE_API_URL || 
                        import.meta.env.VITE_BACKEND_URL || 
                        'https://labflow-clinic-backend-skzx.onrender.com';
    backendStatus = 'production';
    console.log('Production API Base URL:', prodBaseUrl);
    return `${prodBaseUrl}/api`;
  }
};

// Dynamic API base URL that updates when window.ELECTRON_API_BASE_URL changes
const getApiUrl = (endpoint: string) => {
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}${endpoint}`;
  console.log(`API URL for ${endpoint}:`, fullUrl);
  return fullUrl;
};

export interface DoctorData {
  _id?: string;
  name: string;
  licenseNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PatientData {
  _id?: string;
  ln: string;
  idCard?: string | null; // Made optional and nullable
  title: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  age: number;
  phoneNumber: string;
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderData {
  _id?: string;
  visitId: string;
  labOrders: Array<{
    testId: string;
    testName: string;
    code: string;
    price: number;
    type: 'individual' | 'package';
    testDetails?: LabTestData;
    groupDetails?: LabGroupData;
    individualTests?: LabTestData[];
  }>;
  totalAmount: number;
  paymentMethod: string;
  status: 'pending' | 'process' | 'completed' | 'cancelled';
  orderDate: Date;
  visitData?: VisitData;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VisitData {
  _id?: string;
  visitNumber: string;
  patientId: string;
  patientData?: PatientData;
  department: string;
  referringOrganization: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
    height: string;
  };
  medicalHistory: string;
  visitDetails: string;
  date: string;
  time: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LabTestData {
  _id?: string;
  code: string;
  name: string;
  price: number;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LabGroupData {
  _id?: string;
  code: string;
  name: string;
  price: number;
  labTests: string[]; // Array of lab test IDs
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanySettingsData {
  _id?: string;
  name: string;
  nameEn: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  license: string;
  updatedAt?: Date;
}

export interface OrderData {
  _id?: string;
  visitId: string;
  labOrders: Array<{
    testId: string;
    testName: string;
    code: string;
    price: number;
    type: 'individual' | 'package';
    testDetails?: LabTestData; // For individual tests
    groupDetails?: LabGroupData; // For package tests
    individualTests?: LabTestData[]; // Individual tests within a package
  }>;
  totalAmount: number;
  paymentMethod: string;
  status: 'pending' | 'process' | 'completed' | 'cancelled';
  orderDate: Date;
  visitData?: VisitData;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ResultData {
  _id?: string;
  orderId: string;
  testResults: Array<{
    testId: string;
    testName: string;
    result: string;
    referenceRange: string;
    comment: string;
    status: 'completed' | 'pending';
  }>;
  attachedFiles: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData?: string; // Base64 encoded file data
  }>;
  technician: string;
  notes: string;
  resultDate: Date;
  orderData?: OrderData;
  visitData?: VisitData;
  createdAt?: Date;
  updatedAt?: Date;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = getApiUrl(endpoint);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Mark backend as working
      if (url.includes('localhost:3001')) {
        backendStatus = 'local';
        console.log('✅ Local backend is working');
      } else {
        backendStatus = 'production';
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // If local backend failed and we haven't tried production yet
      if (url.includes('localhost:3001') && backendStatus === 'unknown') {
        console.log('🔄 Local backend failed, trying production...');
        backendStatus = 'production';
        
        // Retry with production URL
        const prodBaseUrl = import.meta.env.VITE_API_URL || 
                           import.meta.env.VITE_BACKEND_URL || 
                           'https://labflow-clinic-backend-skzx.onrender.com';
        const prodUrl = `${prodBaseUrl}/api${endpoint}`;
        
        try {
          const prodResponse = await fetch(prodUrl, config);
          
          if (!prodResponse.ok) {
            const errorData = await prodResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${prodResponse.status}`);
          }
          
          console.log('✅ Production backend is working');
          return await prodResponse.json();
        } catch (prodError) {
          console.error('❌ Both local and production backends failed:', prodError);
          throw prodError;
        }
      }
      
      throw error;
    }
  }

  // Patient API methods
  async getPatients(): Promise<PatientData[]> {
    const patients = await this.request<PatientData[]>('/patients');
    // Filter out placeholder ID cards and convert them to null for display
    return patients.map(patient => ({
      ...patient,
      idCard: patient.idCard && patient.idCard.startsWith('NO_ID_') ? null : patient.idCard
    }));
  }

  async getPatient(id: string): Promise<PatientData> {
    return this.request<PatientData>(`/patients/${id}`);
  }

  async createPatient(patientData: Omit<PatientData, '_id' | 'createdAt' | 'updatedAt'>): Promise<PatientData> {
    console.log('=== API CREATE PATIENT ===');
    console.log('Patient data to send:', JSON.stringify(patientData, null, 2));
    
    try {
      const result = await this.request<PatientData>('/patients', {
        method: 'POST',
        body: JSON.stringify(patientData),
      });
      console.log('Patient created successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to create patient:', error);
      throw error;
    }
  }

  async updatePatient(id: string, patientData: Partial<PatientData>): Promise<PatientData> {
    return this.request<PatientData>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/patients/${id}`, {
      method: 'DELETE',
    });
  }

  async searchPatients(query: string): Promise<PatientData[]> {
    return this.request<PatientData[]>(`/patients/search/${encodeURIComponent(query)}`);
  }

  // Check if patient exists by ID card
  async checkPatientByIdCard(idCard: string): Promise<PatientData | null> {
    try {
      const patients = await this.searchPatients(idCard);
      // Find patient with exact ID card match (excluding placeholder IDs)
      const found = patients.find(p => 
        p.idCard === idCard && 
        p.idCard && 
        !p.idCard.startsWith('NO_ID_')
      );
      return found || null;
    } catch (error) {
      return null;
    }
  }

  // Generate next LN number
  async generateNextLN(): Promise<string> {
    try {
      const patients = await this.getPatients();
      const now = new Date();
      const buddhistYear = (now.getFullYear() + 543).toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const prefix = buddhistYear + month;
      
      console.log('generateNextLN - Current prefix:', prefix);
      console.log('generateNextLN - Total patients:', patients.length);
      
      // Find existing LNs with current year/month prefix
      const currentLNs = patients
        .filter(p => {
          const hasPrefix = p.ln && p.ln.startsWith(prefix);
          if (hasPrefix) {
            console.log('generateNextLN - Found existing LN:', p.ln);
          }
          return hasPrefix;
        })
        .map(p => {
          const numberPart = p.ln.slice(-4);
          const parsed = parseInt(numberPart);
          console.log('generateNextLN - Parsing:', numberPart, '→', parsed);
          return parsed;
        })
        .filter(n => !isNaN(n))
        .sort((a, b) => b - a);
      
      console.log('generateNextLN - Current LNs for prefix:', currentLNs);
      
      const nextNumber = currentLNs.length > 0 ? currentLNs[0] + 1 : 1;
      const newLN = prefix + nextNumber.toString().padStart(4, '0');
      
      console.log('generateNextLN - Generated LN:', newLN);
      return newLN;
    } catch (error) {
      console.error('generateNextLN - Error occurred:', error);
      
      // Improved fallback - start from 0001 for new month instead of random
      const now = new Date();
      const buddhistYear = (now.getFullYear() + 543).toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const fallbackLN = buddhistYear + month + '0001';
      
      console.log('generateNextLN - Using fallback LN:', fallbackLN);
      return fallbackLN;
    }
  }

  // Visit APIs
  async getVisits(): Promise<VisitData[]> {
    return this.request<VisitData[]>('/visits');
  }

  async getVisitById(id: string): Promise<VisitData> {
    return this.request<VisitData>(`/visits/${id}`);
  }

  async createVisit(visitData: Omit<VisitData, '_id' | 'createdAt' | 'updatedAt'>): Promise<VisitData> {
    return this.request<VisitData>('/visits', {
      method: 'POST',
      body: JSON.stringify(visitData),
    });
  }

  async updateVisit(id: string, visitData: Partial<VisitData>): Promise<VisitData> {
    return this.request<VisitData>(`/visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(visitData),
    });
  }

  async deleteVisit(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/visits/${id}`, {
      method: 'DELETE',
    });
  }

  async generateNextVisitNumber(date?: string): Promise<{ visitNumber: string }> {
    const endpoint = date ? `/visits/generate-number/${date}` : '/visits/generate-number';
    return this.request<{ visitNumber: string }>(endpoint);
  }

  // Lab Test API methods
  async getLabTests(): Promise<LabTestData[]> {
    return this.request<LabTestData[]>('/labtests');
  }

  async getLabTest(id: string): Promise<LabTestData> {
    return this.request<LabTestData>(`/labtests/${id}`);
  }

  async createLabTest(labTestData: Omit<LabTestData, '_id' | 'createdAt' | 'updatedAt'>): Promise<LabTestData> {
    return this.request<LabTestData>('/labtests', {
      method: 'POST',
      body: JSON.stringify(labTestData),
    });
  }

  async updateLabTest(id: string, labTestData: Partial<LabTestData>): Promise<LabTestData> {
    return this.request<LabTestData>(`/labtests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(labTestData),
    });
  }

  async deleteLabTest(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/labtests/${id}`, {
      method: 'DELETE',
    });
  }

  async searchLabTests(query: string): Promise<LabTestData[]> {
    return this.request<LabTestData[]>(`/labtests/search/${encodeURIComponent(query)}`);
  }

  // Lab Group API methods
  async getLabGroups(): Promise<LabGroupData[]> {
    return this.request<LabGroupData[]>('/labgroups');
  }

  async getLabGroup(id: string): Promise<LabGroupData> {
    return this.request<LabGroupData>(`/labgroups/${id}`);
  }

  async createLabGroup(labGroupData: Omit<LabGroupData, '_id' | 'createdAt' | 'updatedAt'>): Promise<LabGroupData> {
    return this.request<LabGroupData>('/labgroups', {
      method: 'POST',
      body: JSON.stringify(labGroupData),
    });
  }

  async updateLabGroup(id: string, labGroupData: Partial<LabGroupData>): Promise<LabGroupData> {
    return this.request<LabGroupData>(`/labgroups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(labGroupData),
    });
  }

  async deleteLabGroup(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/labgroups/${id}`, {
      method: 'DELETE',
    });
  }

  async searchLabGroups(query: string): Promise<LabGroupData[]> {
    return this.request<LabGroupData[]>(`/labgroups/search/${encodeURIComponent(query)}`);
  }

  // Company Settings API methods
  async getCompanySettings(): Promise<CompanySettingsData> {
    return this.request<CompanySettingsData>('/company-settings');
  }

  async saveCompanySettings(companyData: Omit<CompanySettingsData, '_id' | 'updatedAt'>): Promise<{
    success: boolean;
    message: string;
    data: CompanySettingsData;
  }> {
    return this.request<{
      success: boolean;
      message: string;
      data: CompanySettingsData;
    }>('/company-settings', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  // Orders API methods
  async getOrders(params?: {
    limit?: number;
    skip?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }): Promise<OrderData[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = queryParams.toString() ? `/orders?${queryParams.toString()}` : '/orders';
    return this.request<OrderData[]>(endpoint);
  }

  async getOrder(id: string): Promise<OrderData> {
    return this.request<OrderData>(`/orders/${id}`);
  }

  async createOrder(orderData: Omit<OrderData, '_id' | 'createdAt' | 'updatedAt'>): Promise<OrderData> {
    return this.request<OrderData>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<OrderData> {
    return this.request<OrderData>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateOrder(id: string, orderData: Partial<OrderData>): Promise<OrderData> {
    return this.request<OrderData>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  async deleteOrder(id: string): Promise<void> {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Results API methods
  async getResults(): Promise<ResultData[]> {
    return this.request<ResultData[]>('/results');
  }

  async getResult(id: string): Promise<ResultData> {
    return this.request<ResultData>(`/results/${id}`);
  }

  async createResult(resultData: Omit<ResultData, '_id' | 'createdAt' | 'updatedAt'>): Promise<ResultData> {
    return this.request<ResultData>('/results', {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  }

  async updateResult(id: string, resultData: Partial<ResultData>): Promise<ResultData> {
    return this.request<ResultData>(`/results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(resultData),
    });
  }

  async deleteResult(id: string): Promise<void> {
    return this.request(`/results/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard Statistics API methods
  async getDashboardStats(date?: string): Promise<{
    todayPatients: number;
    todayTests: number;
    pendingResults: number;
    todayRevenue: number;
    yesterdayPatients: number;
    yesterdayTests: number;
    yesterdayPendingResults: number;
    yesterdayRevenue: number;
    newPatientsToday: number;
    newPatientsYesterday: number;
  }> {
    const params = date ? `?date=${date}` : '';
    return this.request<{
      todayPatients: number;
      todayTests: number;
      pendingResults: number;
      todayRevenue: number;
      yesterdayPatients: number;
      yesterdayTests: number;
      yesterdayPendingResults: number;
      yesterdayRevenue: number;
      newPatientsToday: number;
      newPatientsYesterday: number;
    }>(`/dashboard/stats${params}`);
  }

  // Get new patients count for a specific date
  async getNewPatientsCount(date?: string): Promise<{
    newPatientsToday: number;
    newPatientsYesterday: number;
  }> {
    const params = date ? `?date=${date}` : '';
    return this.request<{
      newPatientsToday: number;
      newPatientsYesterday: number;
    }>(`/dashboard/new-patients${params}`);
  }

  async getRecentVisits(limit: number = 10): Promise<Array<{
    visitId: string;
    visitNumber: string;
    patientTitle: string;
    patientFirstName: string;
    patientLastName: string;
    patientName: string;
    tests: string[];
    status: string;
    time: string;
  }>> {
    return this.request<Array<{
      visitId: string;
      visitNumber: string;
      patientTitle: string;
      patientFirstName: string;
      patientLastName: string;
      patientName: string;
      tests: string[];
      status: string;
      time: string;
    }>>(`/dashboard/recent-visits?limit=${limit}`);
  }

  async getSystemStatus(): Promise<{
    database: 'online' | 'offline';
    reportPrinter: 'online' | 'offline' | 'warning';
    barcodePrinter: 'online' | 'offline' | 'warning';
  }> {
    return this.request<{
      database: 'online' | 'offline';
      reportPrinter: 'online' | 'offline' | 'warning';
      barcodePrinter: 'online' | 'offline' | 'warning';
    }>('/dashboard/system-status');
  }

  async getMonthlyRevenue(months: number = 6): Promise<Array<{
    month: string;
    revenue: number;
    monthName: string;
  }>> {
    return this.request<Array<{
      month: string;
      revenue: number;
      monthName: string;
    }>>(`/dashboard/monthly-revenue?months=${months}`);
  }

  async getRevenueBreakdown(date: string): Promise<{
    cash: number;
    creditCard: number;
    bankTransfer: number;
    insurance: number;
    other: number;
    free: number; // เพิ่มยอดเงินของรายการฟรี
    total: number;
    cancelled: number;
    // เพิ่มฟิลด์สำหรับจำนวนรายการ
    cashCount?: number;
    creditCardCount?: number;
    bankTransferCount?: number;
    insuranceCount?: number;
    otherCount?: number;
    freeCount?: number;
  }> {
    return this.request<{
      cash: number;
      creditCard: number;
      bankTransfer: number;
      insurance: number;
      other: number;
      free: number; // เพิ่มยอดเงินของรายการฟรี
      total: number;
      cancelled: number;
      // เพิ่มฟิลด์สำหรับจำนวนรายการ
      cashCount?: number;
      creditCardCount?: number;
      bankTransferCount?: number;
      insuranceCount?: number;
      otherCount?: number;
      freeCount?: number;
    }>(`/dashboard/revenue-breakdown?date=${date}`);
  }

  // Reports API methods
  async getDepartments(): Promise<Array<{ id: string; name: string }>> {
    return this.request<Array<{ id: string; name: string }>>('/reports/departments');
  }

  async getReportData(params: {
    reportType: string;
    dateFrom?: string;
    dateTo?: string;
    department?: string;
  }): Promise<{
    stats: {
      todayPatients: number;
      todayTests: number;
      todayRevenue: number;
      growth: number;
    };
    data: any[];
    total?: number;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('reportType', params.reportType);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.department && params.department !== 'all') queryParams.append('department', params.department);

    return this.request<{
      stats: {
        todayPatients: number;
        todayTests: number;
        todayRevenue: number;
        growth: number;
      };
      data: any[];
      total?: number;
    }>(`/reports/data?${queryParams.toString()}`);
  }

  async exportReportExcel(params: {
    reportType: string;
    dateFrom?: string;
    dateTo?: string;
    department?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('reportType', params.reportType);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.department && params.department !== 'all') queryParams.append('department', params.department);

    const response = await fetch(getApiUrl(`/reports/export/excel?${queryParams.toString()}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถส่งออกรายงานได้');
    }

    return response.blob();
  }

  async exportReportPDF(params: {
    reportType: string;
    dateFrom?: string;
    dateTo?: string;
    department?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('reportType', params.reportType);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.department && params.department !== 'all') queryParams.append('department', params.department);

    const response = await fetch(getApiUrl(`/reports/export/pdf?${queryParams.toString()}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถส่งออกรายงานได้');
    }

    return response.blob();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
    return this.request<{ status: string; message: string; timestamp: string }>('/health');
  }

  // Get visit by visitNumber with patient data
  async getVisitByNumber(visitNumber: string): Promise<VisitData> {
    return this.request<VisitData>(`/visits/by-number/${visitNumber}`);
  }

  // Doctor management
  async getDoctors(): Promise<DoctorData[]> {
    return this.request<DoctorData[]>('/doctors');
  }

  async createDoctor(doctorData: Omit<DoctorData, '_id' | 'createdAt' | 'updatedAt'>): Promise<DoctorData> {
    return this.request<DoctorData>('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  }

  async updateDoctor(id: string, doctorData: Partial<DoctorData>): Promise<DoctorData> {
    return this.request<DoctorData>(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctorData),
    });
  }

  async deleteDoctor(id: string): Promise<void> {
    return this.request<void>(`/doctors/${id}`, {
      method: 'DELETE',
    });
  }

  // Search or create doctor (auto-save if not exists)
  async findOrCreateDoctor(name: string, licenseNumber: string): Promise<DoctorData> {
    return this.request<DoctorData>('/doctors/find-or-create', {
      method: 'POST',
      body: JSON.stringify({ name, licenseNumber }),
    });
  }

  // Medical Records API - Optimized search
  async searchMedicalRecords(query: string): Promise<any[]> {
    return this.request<any[]>(`/medical-records/search?q=${encodeURIComponent(query)}`);
  }

  async getAllMedicalRecords(): Promise<any[]> {
    return this.request<any[]>('/medical-records/all');
  }
}

export interface VisitData {
  _id?: string;
  visitNumber: string;
  patientId: string;
  patientName: string;
  visitDate: string;
  visitTime: string;
  patientRights?: string;
  insuranceNumber?: string;
  department: string;
  referringOrganization: string;
  weight: string | number;
  height: string | number;
  bloodPressure: string;
  pulse: string | number;
  chronicDiseases: string;
  drugAllergies: string;
  chiefComplaint: string;
  referringDoctor: string;
  doctorLicenseNumber: string;
  orderDate: string;
  resultDeliveryMethod: string;
  resultDeliveryDetails?: string;
  status: "pending" | "in-progress" | "completed";
  patientData?: PatientData;
  createdAt?: Date;
  updatedAt?: Date;
}

export const apiService = new ApiService();
export default apiService;
