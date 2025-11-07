// Medical Record Form Generator for LabFlow Clinic
import { CompanySettingsData } from "@/services/api";

export interface MedicalRecordFormData {
  // Company info
  companyInfo: CompanySettingsData;

  // Patient info
  patientln: string;
  patientTitle: string;
  patientFirstName: string;
  patientLastName: string;
  patientBirthDate?: string;
  patientAge: number;
  patientGender: string;
  patientIdCard: string;
  patientPhone: string;
  patientAddress: string;

  // Visit info
  visitNumber: string;
  visitDate: string;

  // Medical info
  weight?: number;
  height?: number;
  bloodPressure?: string;
  temperature?: string;
  pulse?: string;
  chronicDiseases?: string;
  drugAllergies?: string;

  // Insurance info
  insuranceType?: string;
  insuranceNumber?: string;

  // Service info
  serviceType?: string;
  serviceCost?: number;

  // Contact preferences
  lineId?: string;
  email?: string;
  tel?: string;
  receiveResults?: boolean;
  resultDeliveryMethod?: string;
  resultDeliveryDetails?: string;
}

// Helper function to format date in Thai format (day/month/year in Buddhist Era)
function formatThaiDate(dateString?: string): string {
  if (!dateString) return '';

  // Handle Thai date format DD/MM/YYYY (Buddhist Era)
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year > 0) {
        // If year is already in Buddhist Era (> 2400), use as is, otherwise convert
        const buddhistYear = year > 2400 ? year : year + 543;
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${buddhistYear}`;
      }
    }
  }

  // Fallback: try to parse as standard date
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Month is 0-indexed, so add 1
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }

  return '';
}

export function generateMedicalRecordFormHTML(data: MedicalRecordFormData): string {
  const currentDate = new Date().toLocaleDateString('th-TH');
  const currentTime = new Date().toLocaleTimeString('th-TH');

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ใบเวชระเบียน - ${data.visitNumber}</title>
      <style>
        @page {
          size: A4;
          margin: 8mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Sarabun', 'TH SarabunPSK', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.2;
          color: #000;
          background: white;
        }
        
        .form-container {
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
          padding: 10px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 0;
          margin-bottom: 10px;
          padding: 12px;
          background: white;
          color: #000;
          border: 2px solid #000;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .company-name-en {
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .company-details {
          font-size: 12px;
          line-height: 1.2;
        }
        
        .sticker-area {
          width: 85px;
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #000;
          background: white;
          font-weight: 600;
        }
        
        .form-section {
          margin: 8px 0;
          padding: 8px;
          background: white;
          border: 1px solid #000;
        }
        
        .main-content {
          padding: 10px;
          margin-top: 0;
          background: white;
        }
        
        .form-row {
          display: flex;
          align-items: center;
          margin: 5px 0;
          flex-wrap: wrap;
          gap: 10px;
          padding: 3px 0;
        }
        
        .form-field {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-right: 15px;
        }
        
        .form-label {
          font-weight: 600;
          color: #000;
          white-space: nowrap;
          min-width: fit-content;
          font-size: 14px;
        }
        
        .form-input {
          border-bottom: 1px solid #000;
          min-width: 80px;
          padding: 3px 5px;
          display: inline-block;
          background: white;
          font-weight: 500;
          font-size: 14px;
          color: #000;
        }
        
        .form-input:not(:empty) {
          background: white;
        }
        
        .form-input.wide {
          min-width: 160px;
        }
        
        .form-input.medium {
          min-width: 120px;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 4px 0;
          flex-wrap: wrap;
        }
        
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 5px;
          background: white;
        }
        
        .checkbox {
          width: 16px;
          height: 16px;
          border: 2px solid #000;
          display: inline-block;
          position: relative;
          background: white;
          box-sizing: border-box;
        }
        
        .checkbox.checked {
          width: 16px;
          height: 16px;
          border: 2px solid #000;
          background: white;
          box-sizing: border-box;
        }
        
        .checkbox.checked::after {
          content: '✓';
          position: absolute;
          top: -2px;
          left: 1px;
          bottom: 0px;
          right: 0px;
          font-size: 14px;
          font-weight: bold;
          color: black;
          background: white;
          z-index: 1;
        }
        
        .section-title {
          font-weight: 700;
          font-size: 16px;
          margin: 10px 0 5px 0;
          padding: 8px 12px;
          background: #000;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .contact-section {
          margin-top: 8px;
          padding: 8px;
          background: white;
          border: 1px solid #000;
        }
        
        .contact-section .form-row {
          background: transparent;
          padding: 3px;
          margin: 3px 0;
        }
        
        .signatures {
          display: flex;
          justify-content: space-around;
          margin-top: 15px;
          padding: 10px;
          background: white;
        }
        
        .signature-box {
          width: 140px;
          text-align: center;
          padding: 8px;
          background: white;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          height: 40px;
          margin-bottom: 5px;
          position: relative;
          background: white;
        }
        
        .signature-line::before {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: #000;
        }
        
        .signature-label {
          font-weight: 600;
          font-size: 12px;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        /* Print optimizations */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
          }
          
          .form-container {
            box-shadow: none;
            background: white;
          }
          
          .header {
            background: white !important;
            color: black !important;
            border: 2px solid white !important;
          }
          
          .section-title {
            background: white !important;
            color: black !important;
          }
          
          .checkbox.checked {
            background: #000 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="form-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
              <div class="company-name">${data.companyInfo.name || ''}</div>
              ${data.companyInfo.nameEn ? `<div class="company-name-en">${data.companyInfo.nameEn}</div>` : '<div class="company-name-en"></div>'}
              <div class="company-details">
                ${data.companyInfo.address || ''}<br>
                ${data.companyInfo.address ? '' : ''}<br>
                โทร ${data.companyInfo.phone || ''}
              </div>
            </div>
          <div class="sticker-area">
            
          </div>
        </div>
        
        <!-- Main Content Frame -->
        <div class="main-content">
          <!-- Patient Information Section -->
          <div class="section-title">ข้อมูลผู้ป่วย</div>
          <div class="form-section">

          <!-- บรรทัดที่ 1: เลข LN เลขบัตรประชาชน -->
          <div class="form-row">
            <div class="form-field">
              <span class="form-label">เลข LN</span>
              <span class="form-input wide">${data.patientln}</span>
            </div>
            <div class="form-field">
              <span class="form-label">เลขบัตรประชาชน</span>
              <span class="form-input wide">${data.patientIdCard && data.patientIdCard.startsWith('NO_ID_') ? '-' : (data.patientIdCard || '-')}</span>
            </div>
          </div>

          <!-- บรรทัดที่ 2: คำนำหน้า ชื่อ นามสกุล เพศ -->
          <div class="form-row">
            <div class="form-field">
              <span class="form-label">คำนำหน้า</span>
              <span class="form-input">${data.patientTitle}</span>
            </div>
            <div class="form-field">
              <span class="form-label">ชื่อ</span>
              <span class="form-input wide">${data.patientFirstName}</span>
            </div>
            <div class="form-field">
              <span class="form-label">นามสกุล</span>
              <span class="form-input wide">${data.patientLastName}</span>
            </div>
            <div class="form-field">
              <span class="form-label">เพศ</span>
              <span class="form-input">${data.patientGender === 'male' ? 'ชาย' : data.patientGender === 'female' ? 'หญิง' : data.patientGender}</span>
            </div>
          </div>
          
          <!-- บรรทัดที่ 3: อายุ วันเกิด เบอร์โทร -->
          <div class="form-row">
            <div class="form-field">
              <span class="form-label">อายุ</span>
              <span class="form-input">${data.patientAge}</span>
              <span class="form-label">ปี</span>
            </div>
            <div class="form-field">
              <span class="form-label">วันเกิด</span>
              <span class="form-input wide">${formatThaiDate(data.patientBirthDate)}</span>
            </div>
            <div class="form-field">
              <span class="form-label">เบอร์โทร</span>
              <span class="form-input wide">${data.patientPhone}</span>
            </div>
          </div>
          
          <!-- บรรทัดที่ 4: ที่อยู่ -->
          <div class="form-row">
            <div class="form-field">
              <span class="form-label">ที่อยู่</span>
              <span class="form-input wide">${data.patientAddress}</span>
            </div>
          </div>
        </div>
        
        <!-- Vital Signs Section -->
        <div class="section-title">ประวัติทางการแพทย์</div>
        <div class="form-section">
          <!-- บรรทัดที่ 1: น้ำหนัก ส่วนสูง -->
          <div class="form-row">
            <div class="form-field">
              <span class="form-label">น้ำหนัก</span>
              <span class="form-input">${data.weight || ''}</span>
              <span class="form-label">กก.</span>
            </div>
            <div class="form-field">
              <span class="form-label">ส่วนสูง</span>
              <span class="form-input">${data.height || ''}</span>
              <span class="form-label">ซม.</span>
            </div>
          </div>

          <!-- บรรทัดที่ 2: ความดัน ชีพจร -->
          <div class="form-row">
            <div class="form-field">
              <span class="form-label">ความดัน</span>
              <span class="form-input">${data.bloodPressure || ''}</span>
              <span class="form-label">mmHg</span>
            </div>
            <div class="form-field">
              <span class="form-label">ชีพจร</span>
              <span class="form-input">${data.pulse || ''}</span>
              <span class="form-label">ครั้ง/นาที</span>
            </div>
          </div>

          <!-- บรรทัดที่ 3: โรคประจำตัว ประวัติแพ้ยา -->
          <div class="form-row">
            <div class="form-field">
              <span class="form-label">โรคประจำตัว</span>
              <span class="form-input wide">${data.chronicDiseases || ''}</span>
            </div>
            <div class="form-field">
              <span class="form-label">ประวัติแพ้ยา</span>
              <span class="form-input wide">${data.drugAllergies && data.drugAllergies !== 'ไม่แพ้' ? (data.drugAllergies.startsWith('แพ้: ') ? data.drugAllergies.replace('แพ้: ', '') : data.drugAllergies) : ''}</span>
            </div>
          </div>

          <!-- บรรทัดที่ 4: วันที่มารับบริการ หมายเลขการรับบริการ -->
          <div class="form-row">
            <div class="form-field">
              <span class="form-label">วันที่มารับบริการ</span>
              <span class="form-input wide">${formatThaiDate(data.visitDate)}</span>
            </div>
            <div class="form-field">
              <span class="form-label">หมายเลขการรับบริการ</span>
              <span class="form-input wide">${data.visitNumber}</span>
            </div>
          </div>
        </div>
        
        <!-- Result Delivery Section -->
        <div class="section-title">วิธีการรับผลการตรวจ</div>
        <div class="form-section">
          <div class="form-row">
            <div class="checkbox-item">
              <div class="checkbox ${data.resultDeliveryMethod === 'Line ID' ? 'checked' : ''}"></div>
              <span class="form-label">Line ID :</span>
              <span class="form-input wide">${data.resultDeliveryMethod === 'Line ID' ? (data.resultDeliveryDetails || '') : ''}</span>
            </div>
            <div class="checkbox-item">
              <div class="checkbox ${data.resultDeliveryMethod === 'E-mail' ? 'checked' : ''}"></div>
              <span class="form-label">E-mail :</span>
              <span class="form-input wide">${data.resultDeliveryMethod === 'E-mail' ? (data.resultDeliveryDetails || '') : ''}</span>
            </div>
          </div>
          <div class="form-row">
            <div class="checkbox-item">
              <div class="checkbox ${data.resultDeliveryMethod === 'Tel.' ? 'checked' : ''}"></div>
              <span class="form-label">Tel. :</span>
              <span class="form-input wide">${data.resultDeliveryMethod === 'Tel.' ? (data.resultDeliveryDetails || '') : ''}</span>
            </div>
            <div class="checkbox-item">
              <div class="checkbox ${data.resultDeliveryMethod === 'รับผลที่คลินิก' ? 'checked' : ''}"></div>
              <span class="form-label">มารับผลตรวจเอง</span>
            </div>
          </div>
        </div>        
        
          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">ผู้เข้ารับบริการ</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">นักเทคนิคการแพทย์</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function printMedicalRecordForm(data: MedicalRecordFormData, printerName?: string): Promise<void> {
  const formHTML = generateMedicalRecordFormHTML(data);

  // Import printer utilities
  const { printMedicalRecord } = await import('@/lib/printer-utils');
  
  console.log('printMedicalRecordForm: Starting print process...');
  console.log('printMedicalRecordForm: Electron API available:', !!window.electronAPI);
  
  try {
    // Use the new printer system
    console.log('printMedicalRecordForm: Using new printer system');
    const result = await printMedicalRecord(formHTML);
    
    if (result.success) {
      console.log('Medical record printed successfully:', result.message);
      return;
    } else {
      console.error('New printer system failed:', result.message);
      throw new Error(result.message || 'Failed to print medical record');
    }
  } catch (error) {
    console.error('Error using new printer system:', error);
    
    // Only throw the error, don't fallback to web printing
    throw error;
  }
}
