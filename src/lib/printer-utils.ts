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
  try {
    const { createSticker50x25HTML } = await import('@/utils/stickerbarcode50x25');
    const now = new Date();
    const sampleData = {
      title: 'นาย',
      firstName: 'ทดสอบ',
      lastName: 'ระบบ',
      ln: '67001',
      age: '35',
      visitNumber: 'V' + Date.now().toString().slice(-6),
      visitDate: now.toLocaleDateString('th-TH'),
      visitTime: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };
    const testContent = createSticker50x25HTML(sampleData);
    return await printSticker(testContent);
  } catch (error) {
    console.warn('Fallback to simple 50x25 sample sticker due to error:', error);
    const visit = 'V' + Date.now().toString().slice(-6);
    const testContent = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Test Sticker ${visit}</title>
          <style>
            @page { size: 50mm 25mm; margin: 0; }
            html, body {
              width: 45mm;
              height: 22.5mm;
              margin: 0;
              padding: 0;
              font-family: 'Sarabun', 'Tahoma', Arial, sans-serif;
              background: #fff;
              overflow: hidden;
            }
            .sticker {
              width: 45mm;
              height: 22.5mm;
              margin: 0 auto;
              padding: 0.6mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 0.2pt dashed #999;
            }
            .line1 { font-size: 8pt; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .line2 { font-size: 4.5pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .line4 { text-align: center; font-size: 7.5pt; letter-spacing: 0.2px; }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="line1">นาย ทดสอบ ระบบ</div>
            <div class="line2">LN: 67001 อายุ 35 ปี</div>
            <div class="line4">visit: ${visit}</div>
          </div>
          <script>window.__barcodeReady = true;</script>
        </body>
      </html>`;
    return await printSticker(testContent);
  }
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
        // Extract any <style> blocks from original content to preserve template CSS
        const extractStyleBlocks = (html: string): string => {
          try {
            const matches = html.match(/<style[\s\S]*?<\/style>/gi);
            return matches ? matches.join('\n') : '';
          } catch (_) {
            return '';
          }
        };

        const userStyles = extractStyleBlocks(content || '');

        // Write content to the new window
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Print Sticker</title>
            <style>
              /* Sync with single 50x25mm sticker */
              @page { size: 50mm 25mm; margin: 0mm; }
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
            ${userStyles}
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 150);
                }, 150);
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
      
      // Web fallback with resource loading wait
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
      if (printWindow) {
        // Try to extract body content if a full HTML document is provided
        const extractBodyContent = (html: string): string => {
          try {
            const lower = html.toLowerCase();
            const startIdx = lower.indexOf('<body');
            const endIdx = lower.lastIndexOf('</body>');
            if (startIdx !== -1 && endIdx !== -1) {
              // Find '>' of opening body tag
              const openEnd = lower.indexOf('>', startIdx);
              if (openEnd !== -1 && endIdx > openEnd) {
                return html.substring(openEnd + 1, endIdx);
              }
            }
          } catch (_) {}
          return html;
        };

        // Extract any <style> blocks from original content to preserve template CSS
        const extractStyleBlocks = (html: string): string => {
          try {
            const matches = html.match(/<style[\s\S]*?<\/style>/gi);
            return matches ? matches.join('\n') : '';
          } catch (_) {
            return '';
          }
        };

        const bodyContent = extractBodyContent(content || '');
        const userStyles = extractStyleBlocks(content || '');
        const wrapped = `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Print Sticker</title>
            <style>
              @page { size: 50mm 25mm; margin: 0mm; }
              html, body { margin: 0; padding: 0; width: 50mm; height: 25mm; overflow: hidden; }
              #content { width: 50mm; height: 25mm; }
            </style>
            ${userStyles}
          </head>
          <body>
            <div id="content">${bodyContent}</div>
            <script>
              (function(){
                function delay(ms){ return new Promise(r => setTimeout(r, ms)); }
                async function waitResources(){
                  try {
                    // Wait for all images to be ready
                    const imgs = Array.from(document.images);
                    await Promise.all(imgs.map(img => {
                      if ('decode' in img) {
                        return img.decode().catch(() => {});
                      }
                      if (img.complete) return Promise.resolve();
                      return new Promise(res => {
                        img.addEventListener('load', res, { once: true });
                        img.addEventListener('error', res, { once: true });
                      });
                    }));
                    // Wait for fonts if available
                    if (document.fonts && document.fonts.ready) {
                      await document.fonts.ready.catch(()=>{});
                    }
                    // Wait for JsBarcode readiness flag if present
                    var maxWait = 5000; // up to 5s
                    var start = Date.now();
                    while (Date.now() - start < maxWait) {
                      if (window.__barcodeReady === true) break;
                      await delay(50);
                    }
                  } catch (e) {}
                  setTimeout(function(){
                    window.print();
                    setTimeout(function(){ window.close(); }, 500);
                  }, 100);
                }
                if (document.readyState === 'complete') {
                  waitResources();
                } else {
                  window.addEventListener('load', waitResources);
                }
              })();
            </script>
          </body>
          </html>`;
        printWindow.document.write(wrapped);
        printWindow.document.close();
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
