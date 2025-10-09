// Sticker printing utility functions
export interface PatientStickerData {
  idCard: string;
  title: string;
  firstName: string;
  lastName: string;
  visitNumber: string;
  ln: string;
  age: string;
  visitDate: string;
  visitTime: string;
  printerName?: string;
}

// Generate barcode using JsBarcode
export function generateBarcode(text: string): string {
  try {
    // Check if JsBarcode is available
    if (typeof window !== 'undefined' && (window as any).JsBarcode) {
      const canvas = document.createElement('canvas');
      (window as any).JsBarcode(canvas, text, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        margin: 2,
        background: "#ffffff",
        lineColor: "#000000",
        fontSize: 0,
        textMargin: 0
      });
      return canvas.toDataURL('image/png', 1.0);
    }
  } catch (error) {
    console.warn('JsBarcode not available, using fallback:', error);
  }
  
  // Fallback: Better barcode generation
  return generateFallbackBarcode(text);
}

// Fallback barcode generation - Code 128 pattern
function generateFallbackBarcode(text: string): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  canvas.width = 300;
  canvas.height = 60;
  
  // Clear canvas with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Code 128 Start B pattern
  const startB = [2, 1, 1, 4, 1, 2];
  // Code 128 Stop pattern  
  const stop = [2, 3, 3, 1, 1, 1, 2];
  
  // Simple character encoding for Code 128
  const getCharPattern = (char: string): number[] => {
    const code = char.charCodeAt(0);
    const patterns = [
      [2, 1, 2, 1, 2, 2], [1, 2, 2, 1, 2, 2], [2, 2, 1, 1, 2, 2],
      [1, 1, 2, 2, 2, 2], [2, 1, 1, 2, 2, 2], [1, 2, 1, 2, 2, 2],
      [1, 1, 1, 3, 2, 2], [1, 3, 1, 1, 2, 2], [3, 1, 1, 1, 2, 2],
      [1, 1, 3, 1, 2, 2], [3, 1, 1, 3, 1, 1], [1, 1, 2, 3, 2, 1],
      [1, 2, 2, 3, 1, 1], [2, 2, 1, 3, 1, 1], [2, 3, 1, 1, 1, 2]
    ];
    return patterns[code % patterns.length];
  };
  
  ctx.fillStyle = 'black';
  let x = 10;
  const barHeight = 40;
  const barTop = 10;
  const moduleWidth = 1.5;
  
  // Draw start pattern
  for (let i = 0; i < startB.length; i++) {
    const width = startB[i] * moduleWidth;
    if (i % 2 === 0) {
      ctx.fillRect(x, barTop, width, barHeight);
    }
    x += width;
  }
  
  // Draw data
  for (let i = 0; i < text.length; i++) {
    const pattern = getCharPattern(text[i]);
    for (let j = 0; j < pattern.length; j++) {
      const width = pattern[j] * moduleWidth;
      if (j % 2 === 0) {
        ctx.fillRect(x, barTop, width, barHeight);
      }
      x += width;
    }
  }
  
  // Draw stop pattern
  for (let i = 0; i < stop.length; i++) {
    const width = stop[i] * moduleWidth;
    if (i % 2 === 0) {
      ctx.fillRect(x, barTop, width, barHeight);
    }
    x += width;
  }
  
  return canvas.toDataURL('image/png', 1.0);
}

// Create HTML template for sticker printing (3 labels per sheet)
export function createStickerHTML(data: PatientStickerData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>สติ๊กเกอร์ - ${data.visitNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Itim&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    @page {
      size: 103mm 25mm;
      margin: 0mm;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    body { 
      font-family: 'TH Sarabun New', 'THSarabunNew', 'Itim', 'Arial', sans-serif; 
      margin: 0;
      padding: 0;
      font-size: 8px; 
      line-height: 0.8;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    .page-container {
      width: 103mm;
      height: 25mm;
      display: flex;
      padding: 0;
      margin: 0;
      align-items: center;
      box-sizing: border-box;
    }
    .sticker {
      width: 32mm;
      height: 25mm;
      padding: 1mm;
      box-sizing: border-box;
      display: flex;
      text-align: left;
      font-size: 6px;
      line-height: 1.1;
      background: white;
      position: relative;
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
    .visit-number-vertical {
      position: absolute;
      left: 0.5mm;
      top: 1mm;
      bottom: 1mm;
      width: 3mm;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 7pt;
      font-weight: bold;
      color: black;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .content-area {
      flex: 1;
      margin-left: 4mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 0.5mm 0;
    }
    .ln-number {
      font-size: 10pt;
      font-weight: bold;
      text-align: left;
      margin-bottom: 0.5mm;
      color: #000000;
      line-height: 0.9;
    }
    .patient-title-name {
      font-size: 10pt;
      font-weight: bold;
      text-align: left;
      line-height: 0.9;
      margin-bottom: 0.5mm;
      color: #000000;
    }
    .patient-lastname {
      font-size: 10pt;
      font-weight: bold;
      text-align: left;
      line-height: 0.9;
      margin-bottom: 0.5mm;
      color: #000000;
    }
    .visit-info {
      font-size: 8pt;
      font-weight: bold;
      text-align: left;
      line-height: 0.9;
      margin-bottom: 0.5mm;
      width: 100%;
      color: #000000;
    }
    .barcode {
      height: 6mm;
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
      height: 6mm;
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
      <div class="visit-number-vertical">${data.visitNumber}</div>
      <div class="content-area">
        <div class="ln-number">LN: ${data.ln || 'N/A'}</div>
        <div class="patient-title-name">${data.title}${data.firstName}</div>
        <div class="patient-lastname">${data.lastName}</div>
        <div class="visit-info">อายุ ${data.age} ปี ${data.visitTime || 'N/A'}</div>
        <div class="barcode">
          <svg id="barcode1"></svg>
        </div>
      </div>
    </div>
    
    <!-- Sticker 2 -->
    <div class="sticker">
      <div class="visit-number-vertical">${data.visitNumber}</div>
      <div class="content-area">
        <div class="ln-number">LN: ${data.ln || 'N/A'}</div>
        <div class="patient-title-name">${data.title}${data.firstName}</div>
        <div class="patient-lastname">${data.lastName}</div>
        <div class="visit-info">อายุ ${data.age} ปี ${data.visitTime || 'N/A'}</div>
        <div class="barcode">
          <svg id="barcode2"></svg>
        </div>
      </div>
    </div>
    
    <!-- Sticker 3 -->
    <div class="sticker">
      <div class="visit-number-vertical">${data.visitNumber}</div>
      <div class="content-area">
        <div class="ln-number">LN: ${data.ln || 'N/A'}</div>
        <div class="patient-title-name">${data.title}${data.firstName}</div>
        <div class="patient-lastname">${data.lastName}</div>
        <div class="visit-info">อายุ ${data.age} ปี ${data.visitTime || 'N/A'}</div>
        <div class="barcode">
          <svg id="barcode3"></svg>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function generateBarcodes() {
      try {
        if (typeof JsBarcode !== 'undefined') {
          // Generate barcodes for all three stickers
          JsBarcode("#barcode1", "${data.visitNumber}", {
            format: "CODE128",
            width: 1.2,
            height: 20,
            displayValue: false,
            margin: 0,
            background: "#ffffff",
            lineColor: "#000000"
          });
          
          JsBarcode("#barcode2", "${data.visitNumber}", {
            format: "CODE128",
            width: 1.2,
            height: 20,
            displayValue: false,
            margin: 0,
            background: "#ffffff",
            lineColor: "#000000"
          });
          
          JsBarcode("#barcode3", "${data.visitNumber}", {
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
</html>`;
}

// Print sticker function
export async function printSticker(data: PatientStickerData): Promise<boolean> {
  try {
    // Create sticker HTML
    const stickerHTML = createStickerHTML(data);
    
    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    const hasElectronPrint = isElectron && typeof window.electronAPI.printSticker === 'function';
    
    console.log('🖨️ Print environment check:', {
      isElectron,
      hasElectronPrint,
      printerName: data.printerName,
      electronAPI: !!window.electronAPI
    });

    // If running in Electron, use direct printing
    if (hasElectronPrint && data.printerName) {
      try {
        console.log('🎯 Using Electron printSticker API');
        const result = await window.electronAPI.printSticker({
          printerName: data.printerName,
          htmlContent: stickerHTML
        });
        
        console.log('📋 Electron print result:', result);
        
        if (result && result.success) {
          return true;
        } else {
          throw new Error(result?.message || 'การพิมพ์ล้มเหลว');
        }
      } catch (error) {
        console.error('❌ Electron direct printing failed:', error);
        throw error; // Don't fall back to browser print in Electron
      }
    } else if (isElectron) {
      // In Electron but no printer configured or API not available
      throw new Error('ไม่พบเครื่องพิมพ์สติ๊กเกอร์ที่กำหนดไว้ กรุณาตั้งค่าเครื่องพิมพ์ในหน้าตั้งค่า');
    } else {
      // Use browser printing for web environment
      console.log('🌐 Using browser print fallback');
      return await browserPrint(stickerHTML);
    }
  } catch (error) {
    console.error('Error printing sticker:', error);
    throw error;
  }
}

// Browser printing fallback
async function browserPrint(stickerHTML: string): Promise<boolean> {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=400');
    
    if (!printWindow) {
      throw new Error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาอนุญาต popup');
    }
    
    // Write HTML to the new window
    printWindow.document.write(stickerHTML);
    printWindow.document.close();
    
    // Wait for content to load
    await new Promise(resolve => {
      if (printWindow.document.readyState === 'complete') {
        resolve(true);
      } else {
        printWindow.onload = resolve;
        setTimeout(resolve, 2000); // Fallback timeout
      }
    });
    
    // Focus and print
    printWindow.focus();
    
    // Add a small delay before printing
    setTimeout(() => {
      printWindow.print();
      
      // Close the print window immediately after printing dialog
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 1000); // Reduced from 3000ms to 1000ms for faster closing
    }, 500);
    
    return true;
  } catch (error) {
    console.error('Browser print error:', error);
    throw error;
  }
}

// Preview sticker function
export function previewSticker(data: PatientStickerData): void {
  const stickerHTML = createStickerHTML(data);
  const previewWindow = window.open('', '_blank', 'width=500,height=300');
  
  if (previewWindow) {
    previewWindow.document.write(stickerHTML);
    previewWindow.document.close();
  }
}
