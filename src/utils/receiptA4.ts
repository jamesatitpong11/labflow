// A4 Receipt Generator for LabFlow Clinic
import { CompanySettingsData } from "@/services/api";

export interface A4ReceiptData {
  // Company info
  companyInfo: CompanySettingsData;
  
  // Receipt info
  receiptNumber: string;
  visitNumber: string;
  date: string;
  time: string;
  
  // Patient info
  patientLn: string;
  patientIdCard: string;
  patientTitle: string;
  patientFirstName: string;
  patientLastName: string;
  patientAge: number;
  patientPhone: string;
  
  // Staff info (ผู้ใช้งาน)
  staffName: string;
  staffPhone: string;
  
  // Items
  items: Array<{
    name: string;
    code?: string;
    price: number;
    quantity: number;
  }>;
  
  // Totals
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

export function generateA4ReceiptHTML(data: A4ReceiptData): string {
  const currentDate = new Date().toLocaleDateString('th-TH');
  const currentTime = new Date().toLocaleTimeString('th-TH');
  
  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ใบเสร็จรับเงิน - ${data.visitNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Sarabun', 'TH SarabunPSK', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.2;
          color: #000;
          background: white;
        }
        
        .receipt-container {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        
        .company-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .company-name-en {
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .company-details {
          font-size: 12px;
          line-height: 1.6;
        }
        
        .receipt-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .receipt-info-left,
        .receipt-info-right {
          width: 48%;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 8px;
        }
        
        .info-label {
          width: 120px;
          font-weight: bold;
        }
        
        .info-value {
          flex: 1;
          border-bottom: 1px dotted #000;
          padding-bottom: 2px;
        }
        
        .patient-section {
          margin-bottom: 8px;
          padding: 15px;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
          text-align: center;
          padding: 8px;
          margin: -15px -15px 15px -15px;
        }
        
        .patient-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        
        .items-table th,
        .items-table td {
          border: 1px solid #000;
          padding: 10px;
          text-align: left;
          font-size: 12px;
        }
        
        .items-table th {
          background: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .items-table .text-center {
          text-align: center;
        }
        
        .items-table .text-right {
          text-align: right;
        }
        
        .total-section {
          margin-bottom: 30px;
        }
        
        .total-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 5px;
        }
        
        .total-label {
          width: 150px;
          text-align: right;
          padding-right: 20px;
          font-weight: bold;
        }
        
        .total-value {
          width: 120px;
          text-align: right;
          padding-bottom: 2px;
        }
        
        .grand-total {
          font-size: 14px;
          font-weight: bold;
        }
        
        .payment-method {
          margin-bottom: 30px;
        }
        
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }
        
        .signature-box {
          width: 200px;
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          height: 60px;
          margin-bottom: 10px;
        }
        
        .signature-label {
          font-weight: bold;
        }
        
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          border-top: 1px solid #000;
          padding-top: 15px;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .receipt-container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="header">
          <div class="company-name">${data.companyInfo.name || 'LabFlow Clinic'}</div>
          ${data.companyInfo.nameEn ? `<div class="company-name-en">${data.companyInfo.nameEn}</div>` : ''}
          <div class="company-details">
            ${data.companyInfo.address ? `<div>ที่อยู่: ${data.companyInfo.address}</div>` : ''}
            ${data.companyInfo.phone ? `<div>โทรศัพท์: ${data.companyInfo.phone}</div>` : ''}
            ${data.companyInfo.email ? `<div>อีเมล: ${data.companyInfo.email}</div>` : ''}
            ${data.companyInfo.taxId ? `<div>เลขประจำตัวผู้เสียภาษี: ${data.companyInfo.taxId}</div>` : ''}
            ${data.companyInfo.license ? `<div>เลขที่ใบอนุญาต: ${data.companyInfo.license}</div>` : ''}
          </div>
        </div>
        
        <!-- Receipt Title -->
        <div class="receipt-title">ใบเสร็จรับเงิน</div>
        
        <!-- Receipt Info -->
        <div class="receipt-info">
          <div class="receipt-info-left">
            <div class="info-row">
              <span class="info-label">เลข Visit:</span>
              <span class="info-value">${data.visitNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">วันที่:</span>
              <span class="info-value">${data.date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">เลข LN:</span>
              <span class="info-value">${data.patientLn}</span>
            </div>
            <div class="info-row">
              <span class="info-label">เลขบัตรประชาชน:</span>
              <span class="info-value">${data.patientIdCard}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">ชื่อ:</span>
              <span class="info-value">${data.patientFirstName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">เบอร์โทรศัพท์:</span>
              <span class="info-value">${data.patientPhone}</span>
            </div>
          </div>
          <div class="receipt-info-right">
            <div class="info-row">
              <span class="info-label">เวลา:</span>
              <span class="info-value">${data.time}</span>
            </div>
            <div class="info-row">
              <span class="info-label">วิธีชำระเงิน:</span>
              <span class="info-value">${data.paymentMethod}</span>
            </div>
            <div class="info-row">
              <span class="info-label">อายุ:</span>
              <span class="info-value">${data.patientAge} ปี</span>
            </div>
            <div class="info-row">
              <span class="info-label">คำนำหน้า:</span>
              <span class="info-value">${data.patientTitle}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">นามสกุล:</span>
              <span class="info-value">${data.patientLastName}</span>
            </div>
          </div>
        </div>
        
        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 60px;">ลำดับ</th>
              <th>รายการตรวจ</th>
              <th style="width: 100px;">รหัส</th>
              <th style="width: 80px;">จำนวน</th>
              <th style="width: 120px;">ราคา (บาท)</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.name}</td>
                <td class="text-center">${item.code || '-'}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.price.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Total Section -->
        <div class="total-section">
          <div class="total-row">
            <span class="total-label grand-total">รวมทั้งสิ้น:</span>
            <span class="total-value grand-total">${data.total.toLocaleString()}</span>
          </div>
        </div>
        
        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">ลายเซ็นผู้รับบริการ</div>
            <div>( ${data.patientTitle}${data.patientFirstName} ${data.patientLastName} )</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">ลายเซ็นเจ้าหน้าที่</div>
            <div>( ${data.staffName} )</div>
            <div style="font-size: 10px; margin-top: 5px;">โทร: ${data.staffPhone}</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div>ขอบคุณที่ใช้บริการ</div>
          <div>พิมพ์เมื่อ: ${currentDate} ${currentTime}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function printA4Receipt(data: A4ReceiptData, printerName?: string): Promise<void> {
  const receiptHTML = generateA4ReceiptHTML(data);
  
  // Debug: Log printer name being used
  console.log('printA4Receipt called with printerName:', printerName);
  
  // Validate printer name before sending to Electron
  const validPrinterName = printerName && 
    printerName.trim() !== '' && 
    printerName !== 'undefined' && 
    printerName !== 'null' ? printerName : undefined;
  
  console.log('Validated printer name:', validPrinterName);
  
  if (window.electronAPI && window.electronAPI.printDocument) {
    // Direct print via Electron to saved printer
    const printOptions = {
      printerName: validPrinterName, // Use validated printer name
      content: receiptHTML,
      options: {
        pageSize: 'A4',
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        }
      }
    };
    
    console.log('Direct printing to saved printer:', validPrinterName);
    
    try {
      const result = await window.electronAPI.printDocument(printOptions);
      console.log('Direct print result:', result);
      
      if (result && result.success) {
        console.log('Direct printing successful to:', printerName);
        return; // Success - no fallback needed
      } else {
        console.log('Direct printing failed, reason:', result?.message);
        
        // If direct printing failed and system suggests dialog, try with dialog
        if (result?.suggestDialog && (window.electronAPI as any).printDocumentWithDialog) {
          console.log('Trying with print dialog...');
          const dialogResult = await (window.electronAPI as any).printDocumentWithDialog(printOptions);
          
          if (dialogResult && dialogResult.success) {
            console.log('Dialog printing successful');
            return;
          } else {
            throw new Error(dialogResult?.message || 'Dialog printing also failed');
          }
        } else {
          throw new Error(result?.message || 'Direct printing failed');
        }
      }
    } catch (error) {
      console.error('Direct print error:', error);
      
      // Final fallback: try with print dialog if available
      if ((window.electronAPI as any).printDocumentWithDialog) {
        try {
          console.log('Attempting final fallback with print dialog...');
          const dialogResult = await (window.electronAPI as any).printDocumentWithDialog(printOptions);
          
          if (dialogResult && dialogResult.success) {
            console.log('Fallback dialog printing successful');
            return;
          }
        } catch (dialogError) {
          console.error('Dialog fallback also failed:', dialogError);
        }
      }
      
      throw error; // Re-throw original error to show to user
    }
  } else {
    // Web fallback - open in new window for printing
    console.log('Not in Electron environment, using web printing');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }
}
