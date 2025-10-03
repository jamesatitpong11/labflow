// Electron API service
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

const getApiBaseUrl = () => {
  // Check if we're in Electron environment
  const inElectron = typeof window !== 'undefined' && (
    window.electronAPI || 
    (window as any).ELECTRON_API_BASE_URL ||
    (window as any).electron_api_base_url
  );
  
  console.log('Environment check - inElectron:', inElectron);
  console.log('window.electronAPI:', window.electronAPI);
  console.log('window.ELECTRON_API_BASE_URL:', (window as any).ELECTRON_API_BASE_URL);
  console.log('window.electron_api_base_url:', (window as any).electron_api_base_url);
  
  if (inElectron) {
    // Try multiple ways to get the API base URL
    const apiUrl = (window as any).ELECTRON_API_BASE_URL || 
                   (window as any).electron_api_base_url ||
                   (window as any).electronAPI?.API_BASE_URL || 
                   'http://localhost:3001';
    console.log('Getting API Base URL for Electron:', apiUrl);
    return apiUrl;
  }
  
  console.log('Using relative URLs for web version');
  return ''; // Use relative URLs for web version (proxy will handle)
};

// Enhanced fetch function for Electron
export const electronFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  
  console.log('Electron API call:', url);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('Electron API error:', error);
    throw error;
  }
};

// API service functions
export const electronAPI = {
  // Auth
  login: async (credentials: { username: string; password: string }) => {
    const response = await electronFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  // Patients
  getPatients: async () => {
    const response = await electronFetch('/api/patients');
    return response.json();
  },

  createPatient: async (patientData: any) => {
    const response = await electronFetch('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
    return response.json();
  },

  updatePatient: async (patientId: string, patientData: any) => {
    const response = await electronFetch(`/api/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(patientData)
    });
    return response.json();
  },

  deletePatient: async (patientId: string) => {
    const response = await electronFetch(`/api/patients/${patientId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await electronFetch('/api/dashboard/stats');
    return response.json();
  },

  // Health check
  healthCheck: async () => {
    const response = await electronFetch('/api/health');
    return response.json();
  },

  // Generic API call
  call: async (endpoint: string, options: RequestInit = {}) => {
    const response = await electronFetch(endpoint, options);
    return response.json();
  }
};

// Export utility functions
export { isElectron, getApiBaseUrl };
