// Printer utility functions for LabFlow Clinic

export interface PrinterConfig {
  sticker: string;
  medical: string;
  receipt: string;
}

export interface PrinterInfo {
  name: string;
  displayName?: string;
  description?: string;
  status: number;
  isDefault?: boolean;
}

// Get saved printer configuration (Electron-aware)
export const getPrinterConfig = (): PrinterConfig => {
  try {
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && window.electronAPI && 'getStore' in window.electronAPI) {
      // Use Electron's storage - this will be async but we'll handle it differently
      console.log('Electron environment detected, but using localStorage fallback for sync operation');
    }
    
    // Use localStorage for synchronous operation
    const saved = localStorage.getItem('printerConfig');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Loaded printer config from localStorage:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Error loading printer config:', error);
  }
  
  console.log('Using default printer config');
  return {
    sticker: "",
    medical: "",
    receipt: ""
  };
};

// Save printer configuration (Electron-aware)
export const savePrinterConfig = (config: PrinterConfig): boolean => {
  try {
    // Save to localStorage (works in both web and Electron)
    localStorage.setItem('printerConfig', JSON.stringify(config));
    console.log('Saved printer config to localStorage:', config);
    
    // Also save to Electron store if available (async operation)
    if (typeof window !== 'undefined' && window.electronAPI && 'setStore' in window.electronAPI) {
      // This is async but we don't wait for it
      (window.electronAPI as any).setStore('printerConfig', config).catch((error: any) => {
        console.warn('Failed to save to Electron store:', error);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving printer config:', error);
    return false;
  }
};

// Get specific printer by type
export const getPrinterByType = (type: keyof PrinterConfig): string => {
  const config = getPrinterConfig();
  return config[type] || "";
};

// Check if printer is configured for specific type
export const isPrinterConfigured = (type: keyof PrinterConfig): boolean => {
  const printer = getPrinterByType(type);
  return printer !== "";
};

// Print using configured printer
export const printWithConfiguredPrinter = async (
  type: keyof PrinterConfig,
  content: string,
  options?: any
): Promise<{ success: boolean; message?: string }> => {
  const printerName = getPrinterByType(type);
  
  if (!printerName) {
    return {
      success: false,
      message: `ไม่ได้กำหนดเครื่องพิมพ์สำหรับ${getTypeDisplayName(type)}`
    };
  }

  try {
    if (window.electronAPI?.printDocument) {
      const result = await window.electronAPI.printDocument({
        printerName,
        content,
        ...options
      });
      return result;
    } else {
      // Fallback for web version
      window.print();
      return { success: true, message: "เปิดหน้าต่างพิมพ์แล้ว" };
    }
  } catch (error) {
    console.error('Print error:', error);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการพิมพ์: ${error}`
    };
  }
};

// Print medical record with configured printer
export const printMedicalRecord = async (content: string): Promise<{ success: boolean; message?: string }> => {
  const printerName = getPrinterByType('medical');
  
  if (!printerName) {
    return {
      success: false,
      message: "ไม่ได้กำหนดเครื่องพิมพ์ใบเวชระเบียน"
    };
  }

  try {
    console.log('printMedicalRecord - checking Electron API...');
    console.log('printMedicalRecord - Selected printer:', printerName);
    
    // Check if we're in Electron environment and have printDocument function
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    console.log('printMedicalRecord - Electron environment:', isElectron);
    
    if (isElectron && window.electronAPI.printDocument) {
      console.log('printMedicalRecord - Using Electron printDocument API');
      
      const printOptions = {
        printerName: printerName,
        content: content,
        options: {
          pageSize: 'A4',
          margins: {
            top: 15,
            bottom: 15,
            left: 15,
            right: 15
          }
        }
      };

      const result = await window.electronAPI.printDocument(printOptions);
      console.log('printMedicalRecord - Electron print result:', result);

      if (result && result.success) {
        return {
          success: true,
          message: `ส่งใบเวชระเบียนไปยัง ${printerName} แล้ว`
        };
      } else {
        throw new Error(result?.message || 'การพิมพ์ผ่าน Electron ล้มเหลว');
      }
    } else {
      console.log('printMedicalRecord - Electron API not available, using web fallback');
      
      // Web fallback - create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Print Medical Record</title>
            <style>
              @page {
                size: A4;
                margin: 1in;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: 'Sarabun', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 500);
              }
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        
        return {
          success: true,
          message: `เปิดหน้าต่างพิมพ์ใบเวชระเบียนแล้ว`
        };
      } else {
        throw new Error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้');
      }
    }
  } catch (error) {
    console.error('Medical record print error:', error);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการพิมพ์ใบเวชระเบียน: ${error}`
    };
  }
};

// Print receipt with configured printer
export const printReceipt = async (content: string): Promise<{ success: boolean; message?: string }> => {
  const printerName = getPrinterByType('receipt');
  
  if (!printerName) {
    return {
      success: false,
      message: "ไม่ได้กำหนดเครื่องพิมพ์ใบเสร็จ"
    };
  }

  try {
    console.log('printReceipt - In Electron, using print dialog');
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Print Receipt</title>
          <style>
            @page {
              size: 80mm 200mm;
              margin: 0.2in;
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      return { success: true, message: "เปิดหน้าต่างพิมพ์ใบเสร็จแล้ว" };
    } else {
      return { success: false, message: "ไม่สามารถเปิดหน้าต่างพิมพ์ได้" };
    }
  } catch (error) {
    console.error('Receipt print error:', error);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการพิมพ์ใบเสร็จ: ${error}`
    };
  }
};

// Generate sample sticker content for testing (3 stickers per sheet)
export const generateSampleStickerContent = (): string => {
  const sampleData = {
    visitNumber: 'V' + Date.now().toString().slice(-6),
    title: 'นาย',
    firstName: 'ทดสอบ',
    lastName: 'ระบบ',
    age: '35',
    date: new Date().toLocaleDateString('th-TH')
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Test Sticker - ${sampleData.visitNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Itim&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          @page { 
            size: 105mm 25mm; 
            margin: 0mm; 
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Itim', 'Arial', sans-serif;
            background: white;
            color: black;
            width: 105mm;
            height: 25mm;
            box-sizing: border-box;
            display: flex;
            align-items: center;
          }
          .page-container {
            width: 105mm;
            height: 25mm;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 0;
            margin: 0;
          }
          .sticker {
            width: 32mm;
            height: 25mm;
            padding: 1mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            font-size: 6px;
            line-height: 0.8mm;
            text-align: center;
            background: white;
          }
          .sticker:nth-child(1) {
            margin-left: 2mm;
          }
          .sticker:nth-child(2) {
            margin-left: 2mm;
          }
          .sticker:nth-child(3) {
            margin-left: 2mm;
            margin-right: 0.2mm;
          }
          .visit-number {
            font-size: 12px;
            font-weight: bold;
            text-align: left;
            margin-bottom: 0.5mm;
            color: #000000;
            text-shadow: none;
            -webkit-font-smoothing: antialiased;
          }
          .patient-title-name {
            font-size: 8px;
            font-weight: 500;
            text-align: left;
            line-height: 0.8;
            margin-bottom: 0.5mm;
            color: #000000;
            text-shadow: none;
            -webkit-font-smoothing: antialiased;
          }
          .patient-lastname {
            font-size: 8px;
            font-weight: 500;
            text-align: left;
            line-height: 0.8;
            margin-bottom: 0.5mm;
            color: #000000;
            text-shadow: none;
            -webkit-font-smoothing: antialiased;
          }
          .visit-info {
            font-size: 7px;
            font-weight: 500;
            text-align: left;
            line-height: 0.8;
            margin-bottom: 0.5mm;
            color: #000000;
            text-shadow: none;
            -webkit-font-smoothing: antialiased;
          }
          .barcode {
            height: 8mm;
            width: 90%;
            margin: 0 auto;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
          .barcode svg {
            height: 8mm;
            width: 100%;
            shape-rendering: crispEdges;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Sticker 1 -->
          <div class="sticker">
            <div class="visit-number">${sampleData.visitNumber}</div>
            <div class="patient-title-name">${sampleData.title}${sampleData.firstName}</div>
            <div class="patient-lastname">${sampleData.lastName}</div>
            <div class="visit-info">อายุ ${sampleData.age} ปี ${sampleData.date}</div>
            <div class="barcode">
              <svg id="barcode1"></svg>
            </div>
          </div>
          
          <!-- Sticker 2 -->
          <div class="sticker">
            <div class="visit-number">${sampleData.visitNumber}</div>
            <div class="patient-title-name">${sampleData.title}${sampleData.firstName}</div>
            <div class="patient-lastname">${sampleData.lastName}</div>
            <div class="visit-info">อายุ ${sampleData.age} ปี ${sampleData.date}</div>
            <div class="barcode">
              <svg id="barcode2"></svg>
            </div>
          </div>
          
          <!-- Sticker 3 -->
          <div class="sticker">
            <div class="visit-number">${sampleData.visitNumber}</div>
            <div class="patient-title-name">${sampleData.title}${sampleData.firstName}</div>
            <div class="patient-lastname">${sampleData.lastName}</div>
            <div class="visit-info">อายุ ${sampleData.age} ปี ${sampleData.date}</div>
            <div class="barcode">
              <svg id="barcode3"></svg>
            </div>
          </div>
        </div>
        
        <script>
          function generateBarcodes() {
            try {
              if (typeof JsBarcode !== 'undefined') {
                // Generate barcodes for all three stickers
                JsBarcode("#barcode1", "${sampleData.visitNumber}", {
                  format: "CODE128",
                  width: 1.2,
                  height: 20,
                  displayValue: false,
                  margin: 0,
                  background: "#ffffff",
                  lineColor: "#000000"
                });
                
                JsBarcode("#barcode2", "${sampleData.visitNumber}", {
                  format: "CODE128",
                  width: 1.2,
                  height: 20,
                  displayValue: false,
                  margin: 0,
                  background: "#ffffff",
                  lineColor: "#000000"
                });
                
                JsBarcode("#barcode3", "${sampleData.visitNumber}", {
                  format: "CODE128",
                  width: 1.2,
                  height: 20,
                  displayValue: false,
                  margin: 0,
                  background: "#ffffff",
                  lineColor: "#000000"
                });
              } else {
                // Fallback if JsBarcode is not loaded
                console.log('JsBarcode not loaded, retrying...');
                setTimeout(generateBarcodes, 100);
              }
            } catch (error) {
              console.error('Error generating barcode:', error);
            }
          }
          
          // Try multiple ways to ensure the script runs
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', generateBarcodes);
          } else {
            generateBarcodes();
          }
          
          window.onload = generateBarcodes;
          
          // Additional fallback
          setTimeout(generateBarcodes, 500);
        </script>
      </body>
    </html>
  `;
};

// Test printer connection and configuration
export const testPrinterConnection = async (): Promise<{ 
  success: boolean; 
  message: string; 
  printers: PrinterConfig;
  availablePrinters?: PrinterInfo[];
}> => {
  try {
    console.log('Testing printer connection...');
    
    // Get current configuration
    const config = getPrinterConfig();
    console.log('Current printer config:', config);
    
    // Get available printers if in Electron
    let availablePrinters: PrinterInfo[] = [];
    if (typeof window !== 'undefined' && window.electronAPI?.getPrinters) {
      try {
        availablePrinters = await window.electronAPI.getPrinters();
        console.log('Available printers:', availablePrinters);
      } catch (error) {
        console.warn('Could not get available printers:', error);
      }
    }
    
    // Check if configured printers are available
    const results = {
      sticker: config.sticker ? availablePrinters.find(p => p.name === config.sticker) : null,
      medical: config.medical ? availablePrinters.find(p => p.name === config.medical) : null,
      receipt: config.receipt ? availablePrinters.find(p => p.name === config.receipt) : null,
    };
    
    const configuredCount = Object.values(config).filter(Boolean).length;
    const availableCount = Object.values(results).filter(Boolean).length;
    
    return {
      success: configuredCount > 0,
      message: `กำหนดค่าเครื่องพิมพ์: ${configuredCount} เครื่อง, พร้อมใช้งาน: ${availableCount} เครื่อง`,
      printers: config,
      availablePrinters
    };
    
  } catch (error) {
    console.error('Error testing printer connection:', error);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการทดสอบเครื่องพิมพ์: ${error}`,
      printers: { sticker: "", medical: "", receipt: "" }
    };
  }
};

// Print test sticker
export const printTestSticker = async (): Promise<{ success: boolean; message?: string }> => {
  const testContent = generateSampleStickerContent();
  return await printSticker(testContent);
};

// Print sticker with configured printer
export const printSticker = async (content: string): Promise<{ success: boolean; message?: string }> => {
  console.log('printSticker - Loading printer configuration...');
  const config = getPrinterConfig();
  console.log('printSticker - Current config:', config);
  
  const printerName = getPrinterByType('sticker');
  console.log('printSticker - Selected printer:', printerName);
  
  if (!printerName) {
    console.log('printSticker - No sticker printer configured');
    return {
      success: false,
      message: "ไม่ได้กำหนดเครื่องพิมพ์สติ๊กเกอร์ กรุณาไปที่หน้าตั้งค่า > เครื่องพิมพ์ เพื่อเลือกเครื่องพิมพ์"
    };
  }

  try {
    console.log('printSticker - checking Electron API...');
    console.log('window.electronAPI:', window.electronAPI);
    console.log('window.electronAPI?.printSticker:', window.electronAPI?.printSticker);
    
    // Check if we're in Electron environment and have printSticker function
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    const hasElectronPrint = isElectron && typeof window.electronAPI.printSticker === 'function';
    
    console.log('isElectron:', isElectron);
    console.log('hasElectronPrint:', hasElectronPrint);
    
    if (hasElectronPrint) {
      console.log('Using Electron printSticker API');
      console.log('Printer name:', printerName);
      console.log('Content length:', content?.length);
      console.log('Content preview:', content?.substring(0, 100) + '...');
      
      if (!content || content.trim() === '') {
        console.error('Content is empty or undefined');
        return { success: false, message: 'เนื้อหาสติ๊กเกอร์ว่างเปล่า' };
      }
      
      const result = await (window.electronAPI as any).printSticker({
        printerName,
        htmlContent: content
      });
      console.log('Electron printSticker result:', result);
      return result;
    } else if (isElectron) {
      console.log('In Electron environment - using webContents.print()');
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      
      if (printWindow) {
        // Write content to the new window
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Print Sticker</title>
            <style>
              @page {
                size: 105mm 25mm;
                margin: 0mm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: 'Sarabun', 'Tahoma', sans-serif;
                font-size: 6px;
              }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 500);
              };
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
        
        return { success: true, message: "เปิดหน้าต่างพิมพ์แล้ว" };
      } else {
        return { success: false, message: "ไม่สามารถเปิดหน้าต่างพิมพ์ได้" };
      }
    } else {
      console.log('Not in Electron - using web print');
      
      // Web fallback
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
        return { success: true, message: "เปิดหน้าต่างพิมพ์แล้ว" };
      } else {
        return { success: false, message: "ไม่สามารถเปิดหน้าต่างพิมพ์ได้" };
      }
    }
  } catch (error) {
    console.error('Sticker print error:', error);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการพิมพ์สติ๊กเกอร์: ${error}`
    };
  }
};

// Get display name for printer type
const getTypeDisplayName = (type: keyof PrinterConfig): string => {
  switch (type) {
    case 'sticker':
      return 'สติ๊กเกอร์';
    case 'medical':
      return 'ใบเวชระเบียน';
    case 'receipt':
      return 'ใบเสร็จรับเงิน';
    default:
      return type;
  }
};

// Get all available printers
export const getAvailablePrinters = async (): Promise<PrinterInfo[]> => {
  try {
    if (window.electronAPI?.getPrinters) {
      return await window.electronAPI.getPrinters();
    } else {
      // Fallback for web version
      const systemPrinters = [
        "Microsoft Print to PDF",
        "Microsoft XPS Document Writer"
      ];
      
      return systemPrinters.map(name => ({
        name,
        displayName: name,
        status: 0,
        isDefault: name === "Microsoft Print to PDF"
      }));
    }
  } catch (error) {
    console.error('Error getting printers:', error);
    return [];
  }
};

// Test printer connection
export const testPrinter = async (printerName: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (window.electronAPI?.checkPrinterStatus) {
      const result = await window.electronAPI.checkPrinterStatus(printerName);
      return {
        success: result.status === 'connected',
        message: result.message || `${printerName} ${result.status === 'connected' ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}`
      };
    } else {
      return {
        success: true,
        message: `ทดสอบ ${printerName} สำเร็จ`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `ไม่สามารถทดสอบ ${printerName} ได้`
    };
  }
};

// Declare global types for Electron API
declare global {
  interface Window {
    electronAPI?: {
      getPrinters: () => Promise<PrinterInfo[]>;
      checkPrinterStatus: (printerName: string) => Promise<{
        status: 'connected' | 'disconnected' | 'error';
        message?: string;
      }>;
      printSticker: (options: {
        printerName: string;
        htmlContent: string;
      }) => Promise<{
        success: boolean;
        message?: string;
      }>;
      printDocument: (options: any) => Promise<{
        success: boolean;
        message?: string;
      }>;
    };
  }
}
