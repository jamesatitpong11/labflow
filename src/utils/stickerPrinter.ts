// Sticker printing utility functions
export interface PatientStickerData {
  idCard: string;
  title: string;
  firstName: string;
  lastName: string;
  printerName?: string;
}

// Generate simple barcode using Code 128 pattern
export function generateBarcode(text: string): string {
  // Simple barcode generation - creates a pattern of bars
  // In production, you might want to use a proper barcode library
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Set canvas size for barcode
  canvas.width = 200;
  canvas.height = 50;
  
  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw barcode bars
  ctx.fillStyle = 'black';
  const barWidth = 2;
  const spacing = 1;
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const pattern = charCode % 10; // Simple pattern based on character
    
    for (let j = 0; j < pattern; j++) {
      const x = (i * 10) + (j * (barWidth + spacing));
      if (x < canvas.width - barWidth) {
        ctx.fillRect(x, 5, barWidth, 40);
      }
    }
  }
  
  return canvas.toDataURL();
}

// Create HTML template for sticker printing (3 labels per sheet)
export function createStickerHTML(data: PatientStickerData): string {
  const barcodeDataUrl = generateBarcode(data.idCard);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Patient Sticker</title>
      <style>
        @page {
          size: 10.5cm 2.5cm;
          margin: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'THSarabunNew', 'TH Sarabun New', 'Sarabun', Arial, sans-serif;
          width: 10.5cm;
          height: 2.5cm;
          background: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }
        
        .sticker-sheet {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.3cm;
          padding: 0 0.15cm;
          box-sizing: border-box;
        }
        
        .sticker-label {
          width: 3.2cm;
          height: 2.2cm;
          border: 1px solid #ddd;
          padding: 1mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
        }
        
        .clinic-name {
          font-size: 8px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 1mm;
          color: #333;
        }
        
        .patient-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .patient-name {
          font-size: 9px;
          font-weight: bold;
          margin-bottom: 0.5mm;
          color: #000;
          text-align: center;
        }
        
        .patient-id {
          font-size: 8px;
          margin-bottom: 1mm;
          color: #666;
          text-align: center;
        }
        
        .barcode-container {
          text-align: center;
          margin-top: 1mm;
        }
        
        .barcode {
          max-width: 100%;
          height: 6mm;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <div class="sticker-sheet">
        <div class="sticker-label">
          <div class="clinic-name">LabFlow Clinic</div>
          <div class="patient-info">
            <div class="patient-name">${data.title}${data.firstName} ${data.lastName}</div>
            <div class="patient-id">ID: ${data.idCard}</div>
          </div>
          <div class="barcode-container">
            <img src="${barcodeDataUrl}" alt="Barcode" class="barcode">
          </div>
        </div>
        
        <div class="sticker-label">
          <div class="clinic-name">LabFlow Clinic</div>
          <div class="patient-info">
            <div class="patient-name">${data.title}${data.firstName} ${data.lastName}</div>
            <div class="patient-id">ID: ${data.idCard}</div>
          </div>
          <div class="barcode-container">
            <img src="${barcodeDataUrl}" alt="Barcode" class="barcode">
          </div>
        </div>
        
        <div class="sticker-label">
          <div class="clinic-name">LabFlow Clinic</div>
          <div class="patient-info">
            <div class="patient-name">${data.title}${data.firstName} ${data.lastName}</div>
            <div class="patient-id">ID: ${data.idCard}</div>
          </div>
          <div class="barcode-container">
            <img src="${barcodeDataUrl}" alt="Barcode" class="barcode">
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Print sticker function
export async function printSticker(data: PatientStickerData): Promise<boolean> {
  try {
    // Create sticker HTML
    const stickerHTML = createStickerHTML(data);
    
    // If running in Electron, use direct printing
    if (window.electronAPI && window.electronAPI.printSticker && data.printerName) {
      try {
        const result = await window.electronAPI.printSticker({
          printerName: data.printerName,
          htmlContent: stickerHTML
        });
        
        if (result.success) {
          return true;
        } else {
          throw new Error(result.message || 'การพิมพ์ล้มเหลว');
        }
      } catch (error) {
        console.error('Electron direct printing failed:', error);
        // Fall back to browser printing
        return await browserPrint(stickerHTML);
      }
    } else {
      // Use browser printing for web environment
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
      
      // Close the print window after printing
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 3000);
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
