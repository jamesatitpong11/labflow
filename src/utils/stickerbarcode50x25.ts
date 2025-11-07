import { generateBarcodeSVG } from '@/utils/stickerPrinter';

export function createSticker50x25HTML(data) {
  const visit = (data.visitNumber || '').trim();
  const fullName = `${(data.title || '').trim()}${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim();
  const visitDate = (data.visitDate || new Date().toLocaleDateString('th-TH')).trim();
  const visitTime = (data.visitTime || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })).trim();

  const barcodeSvg = generateBarcodeSVG(visit, {
    width: 1.0,
    height: 80, // ลดความสูงของบาร์โค้ด
    margin: 4,
    background: '#ffffff',
    lineColor: '#000000',
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sticker ${visit}</title>
  <style>
    /* ตั้งกระดาษ 50×25 แต่เนื้อหาลดเหลือ ~90% เพื่อชดเชย scale */
    @page { size: 50mm 25mm; margin: 0; }

    html, body {
      width: 45mm;       /* <== ลดจาก 50mm เหลือ 45mm */
      height: 22.5mm;    /* <== ลดจาก 25mm เหลือ 22.5mm */
      margin: 0;
      padding: 0.5mm; /* ลด padding เพื่อเพิ่มพื้นที่ใช้สอย */
      background: #fff;
      font-family: 'Sarabun', 'Tahoma', Arial, sans-serif;
      overflow: hidden;
    }

    .sticker {
      width: 45mm;
      height: 22.5mm;
      margin: 1mm; /* เอา margin บน/ล่างออกเพื่อไม่ให้ล้นความสูง */
      padding: 1mm; /* ลด padding เพื่อเพิ่มพื้นที่ใช้สอย */
      box-sizing: border-box;
      display: flex;
      flex-direction: row; /* ซ้ายเป็น visit แนวตั้ง, ขวาเป็นเนื้อหา */
      align-items: stretch;
      justify-content: flex-start;
    }

    .visit-vertical {
      width: 2.5mm; /* คอลัมน์ซ้ายสำหรับ visit */
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .visit-vertical .text {
      transform: rotate(-90deg);
      transform-origin: center center;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.4px;
      line-height: 1;
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.3mm;
      padding-left: 0.5mm; /* เว้นจากคอลัมน์ซ้ายเล็กน้อย */
    }

    .line1 {
      font-size: 10pt; /* ลดฟอนต์ลงเล็กน้อย */
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
      margin: 0;
    }

    .line2 {
      font-size: 7pt; /* ลดฟอนต์บรรทัด 2 */
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
      margin: 0;
    }

    .barcode {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .barcode svg,
    .barcode img {
      width: 40mm; /* 80% ของกระดาษ 50mm */
      height: 10mm;  /* ลดความสูงลง */
      shape-rendering: crispEdges;
      image-rendering: -webkit-optimize-contrast;
    }

    .line4 {
      text-align: center;
      font-size: 7pt; /* วันที่ เวลา */
      margin: 0;
    }

    /* กรอบทดสอบถูกลบออกในการใช้งานจริง */
  </style>
</head>
<body>
  <div class="sticker">
    <div class="visit-vertical"><span class="text">${visit}</span></div>
    <div class="content">
      <div class="line1">${fullName}</div>
      <div class="line2">LN: ${(data.ln || '').trim()} อายุ ${(data.age || '').trim()} ปี</div>
      <div class="barcode">${barcodeSvg}</div>
      <div class="line4">${visitDate} ${visitTime}</div>
    </div>
  </div>
  <script>
    // แจ้ง main process ว่าพร้อมพิมพ์แล้ว เพื่อข้ามการรอ 5 วินาที
    window.__barcodeReady = true;
  </script>
</body>
</html>`;
}
