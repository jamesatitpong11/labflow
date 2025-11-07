const { contextBridge, ipcRenderer } = require('electron');

// Set API base URL immediately
const API_BASE_URL = process.env.BACKEND_PORT ? `http://localhost:${process.env.BACKEND_PORT}` : 'http://localhost:3001';

console.log('Preload: Setting API_BASE_URL to:', API_BASE_URL);

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // API Configuration
  API_BASE_URL: API_BASE_URL,
  
  // Store operations
  getStore: (key) => ipcRenderer.invoke('get-store', key),
  setStore: (key, value) => ipcRenderer.invoke('set-store', key, value),
  
  // Printer operations
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  checkPrinterStatus: (printerName) => ipcRenderer.invoke('check-printer-status', printerName),
  printDocument: (options) => ipcRenderer.invoke('print-document', options),
  printSticker: (options) => ipcRenderer.invoke('print-sticker', options),
  printReceipt: (printerName, receiptData) => ipcRenderer.invoke('print-receipt', printerName, receiptData),

  // Database operations
  testDatabaseConnection: () => ipcRenderer.invoke('test-database-connection'),

  // System information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  // Focus helpers
  focusWindow: () => ipcRenderer.invoke('focus-window'),

  // Data export/import
  exportData: (data, format) => ipcRenderer.invoke('export-data', data, format),

  // Additional printer tools
  getPrintQueue: (printerName) => ipcRenderer.invoke('get-print-queue', printerName),
  cancelPrintJob: (jobId, printerName) => ipcRenderer.invoke('cancel-print-job', jobId, printerName),
  testPrinter: (printerName) => ipcRenderer.invoke('test-printer', printerName),
  clearPrinterCache: () => ipcRenderer.invoke('clear-printer-cache'),
  getPrinterCacheStats: () => ipcRenderer.invoke('get-printer-cache-stats'),

  // Barcode and label printing
  printBarcode: (options) => ipcRenderer.invoke('print-barcode', options),
  printLabel: (options) => ipcRenderer.invoke('print-label', options),

  // Convenient handler functions
  handlePrintSticker: (options) => ipcRenderer.invoke('print-sticker', options),
  handlePrintBarcode: (options) => ipcRenderer.invoke('print-barcode', options),
  handlePrintLabel: (options) => ipcRenderer.invoke('print-label', options),

  // System tools
  getSystemHealth: () => ipcRenderer.invoke('get-system-health'),
  getPerformanceMetrics: () => ipcRenderer.invoke('get-performance-metrics'),
  exportSystemInfo: () => ipcRenderer.invoke('export-system-info'),

  // Advanced tools
  backupAppData: () => ipcRenderer.invoke('backup-app-data'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  generateDiagnosticReport: () => ipcRenderer.invoke('generate-diagnostic-report'),
  restartApplication: () => ipcRenderer.invoke('restart-application'),

  // Backend API integration
  callBackendAPI: (endpoint, method, data) => ipcRenderer.invoke('call-backend-api', endpoint, method, data),
  checkBackendConnection: () => ipcRenderer.invoke('check-backend-connection'),
  
  // Patient management
  getPatients: () => ipcRenderer.invoke('get-patients'),
  createPatient: (patientData) => ipcRenderer.invoke('create-patient', patientData),
  updatePatient: (patientId, patientData) => ipcRenderer.invoke('update-patient', patientId, patientData),
  deletePatient: (patientId) => ipcRenderer.invoke('delete-patient', patientId),
  
  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

  // Event listeners
  onFileOpened: (callback) => ipcRenderer.on('file-opened', callback),
  onFileSavePath: (callback) => ipcRenderer.on('file-save-path', callback),
  onCheckPrinters: (callback) => ipcRenderer.on('check-printers', callback),
  onTestDatabase: (callback) => ipcRenderer.on('test-database', callback),
  onShowSystemInfo: (callback) => ipcRenderer.on('show-system-info', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Platform information
  platform: process.platform,
  
  // Version information
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },

  // API configuration
  getApiBaseUrl: () => {
    console.log('Getting API Base URL:', API_BASE_URL);
    return API_BASE_URL;
  },
  
  // Set API base URL (for debugging)
  setApiBaseUrl: (url) => {
    console.log('API Base URL cannot be changed at runtime. Current URL:', API_BASE_URL);
    return API_BASE_URL;
  },

  // HTTP fetch wrapper for Electron
  fetchAPI: async (endpoint, options = {}) => {
    const url = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      return response;
    } catch (error) {
      console.error('Electron API fetch error:', error);
      throw error;
    }
  }
});

// Expose a limited set of Node.js APIs for specific use cases
contextBridge.exposeInMainWorld('nodeAPI', {
  // Path utilities
  path: {
    join: (...args) => require('path').join(...args),
    dirname: (path) => require('path').dirname(path),
    basename: (path) => require('path').basename(path),
    extname: (path) => require('path').extname(path)
  },

  // OS information
  os: {
    platform: () => require('os').platform(),
    arch: () => require('os').arch(),
    hostname: () => require('os').hostname(),
    tmpdir: () => require('os').tmpdir()
  }
});

// Utility functions for the renderer process
contextBridge.exposeInMainWorld('utils', {
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format date
  formatDate: (date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  },

  // Generate UUID
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Validate email
  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Sanitize HTML
  sanitizeHTML: (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});

// Printer utilities specific to the application
contextBridge.exposeInMainWorld('printerUtils', {
  // Get printer status text in Thai
  getStatusText: (status) => {
    const statusMap = {
      0: 'พร้อมใช้งาน',
      1: 'ไม่พร้อมใช้งาน',
      2: 'กำลังพิมพ์',
      3: 'มีปัญหา',
      4: 'ออฟไลน์'
    };
    return statusMap[status] || 'ไม่ทราบสถานะ';
  },

  // Format print job
  formatPrintJob: (content, options = {}) => {
    const {
      title = 'LabFlow Clinic Document',
      fontSize = '12px',
      fontFamily = 'Sarabun, Arial, sans-serif',
      margin = '20px'
    } = options;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            margin: ${margin};
          }
          body {
            font-family: ${fontFamily};
            font-size: ${fontSize};
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .content {
            margin-top: 20px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>LabFlow Clinic</h2>
          <p>ระบบจัดการคลินิกและห้องปฏิบัติการ</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
        </div>
      </body>
      </html>
    `;
  },

  // Create barcode HTML
  createBarcodeHTML: (value, options = {}) => {
    const {
      width = 2,
      height = 100,
      displayValue = true
    } = options;

    return `
      <div class="barcode-container" style="text-align: center; margin: 20px 0;">
        <canvas id="barcode-${Date.now()}" style="margin: 10px 0;"></canvas>
        <script>
          // This would integrate with JsBarcode library
          // JsBarcode("#barcode-${Date.now()}", "${value}", {
          //   width: ${width},
          //   height: ${height},
          //   displayValue: ${displayValue}
          // });
        </script>
        ${displayValue ? `<div style="margin-top: 5px; font-size: 12px;">${value}</div>` : ''}
      </div>
    `;
  }
});

// Database utilities
contextBridge.exposeInMainWorld('dbUtils', {
  // Format SQL query for logging
  formatQuery: (query, params = []) => {
    let formattedQuery = query;
    params.forEach((param, index) => {
      const placeholder = new RegExp(`\\$${index + 1}`, 'g');
      formattedQuery = formattedQuery.replace(placeholder, `'${param}'`);
    });
    return formattedQuery;
  },

  // Validate connection string
  validateConnectionString: (connectionString) => {
    // Basic validation for connection string format
    const patterns = [
      /^postgresql:\/\//, // PostgreSQL
      /^mysql:\/\//, // MySQL
      /^sqlite:/, // SQLite
      /^mongodb:\/\//, // MongoDB
    ];
    return patterns.some(pattern => pattern.test(connectionString));
  }
});

// Also expose API_BASE_URL directly to window for backward compatibility
contextBridge.exposeInMainWorld('ELECTRON_API_BASE_URL', API_BASE_URL);
contextBridge.exposeInMainWorld('electron_api_base_url', API_BASE_URL);

console.log('Preload script loaded successfully');
console.log('API_BASE_URL exposed as:', API_BASE_URL);
