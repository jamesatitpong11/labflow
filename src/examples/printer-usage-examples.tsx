// Examples of how to use the printer system in LabFlow Clinic

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrinter } from '@/hooks/use-printer';
import { getPrinterConfig, isPrinterConfigured } from '@/lib/printer-utils';
import { Printer, TestTube } from 'lucide-react';

// Example 1: Simple component using the printer hook with test sticker
export const StickerPrintExample = () => {
  const { printSticker, printTestSticker, isPrinting, isPrinterConfigured } = usePrinter();

  const handlePrintCustom = async () => {
    const stickerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ตัวอย่างสติ๊กเกอร์</title>
          <style>
            @page { size: 4cm 6cm; margin: 0.1cm; }
            body {
              margin: 0;
              padding: 0.2cm;
              font-family: 'Sarabun', 'Tahoma', sans-serif;
              font-size: 8px;
              line-height: 1.2;
              background: white;
              color: black;
            }
            .sticker {
              border: 1px solid #000;
              padding: 0.1cm;
              text-align: center;
            }
            .visit-number {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 0.1cm;
            }
            .patient-name {
              font-size: 9px;
              font-weight: bold;
              margin-bottom: 0.1cm;
            }
            .info {
              font-size: 7px;
              margin-bottom: 0.1cm;
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="visit-number">V001</div>
            <div class="patient-name">นาย ตัวอย่าง ทดสอบ</div>
            <div class="info">อายุ 30 ปี</div>
            <div class="info">${new Date().toLocaleDateString('th-TH')}</div>
          </div>
        </body>
      </html>
    `;
    
    await printSticker(stickerHTML);
  };

  const handlePrintTest = async () => {
    await printTestSticker();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          ตัวอย่างการพิมพ์สติ๊กเกอร์
        </CardTitle>
        <CardDescription>
          ทดสอบการพิมพ์สติ๊กเกอร์ด้วยข้อมูลตัวอย่าง
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isPrinterConfigured('sticker') && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">
              ⚠️ ไม่ได้กำหนดเครื่องพิมพ์สติ๊กเกอร์ กรุณาไปที่หน้าตั้งค่า
            </p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={handlePrintTest}
            disabled={isPrinting || !isPrinterConfigured('sticker')}
            className="flex-1"
            variant="default"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isPrinting ? 'กำลังพิมพ์...' : 'ทดสอบอัตโนมัติ'}
          </Button>
          
          <Button 
            onClick={handlePrintCustom}
            disabled={isPrinting || !isPrinterConfigured('sticker')}
            className="flex-1"
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'กำลังพิมพ์...' : 'ตัวอย่างกำหนดเอง'}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          <p>• ทดสอบอัตโนมัติ: ใช้ข้อมูลตัวอย่างที่สร้างไว้</p>
          <p>• ตัวอย่างกำหนดเอง: ใช้ HTML ที่กำหนดเอง</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Example 2: Medical record printing
export const MedicalRecordPrintExample = () => {
  const { printMedicalRecord, isPrinting } = usePrinter();

  const handlePrintMedicalRecord = async () => {
    const medicalRecordHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ใบเวชระเบียน</title>
          <style>
            body { font-family: 'Sarabun', Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .content { margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>ใบเวชระเบียน</h2>
            <p>คลินิกตัวอย่าง</p>
          </div>
          <div class="content">
            <p><strong>ชื่อผู้ป่วย:</strong> นาย ตัวอย่าง ทดสอบ</p>
            <p><strong>Visit Number:</strong> V001</p>
            <p><strong>วันที่:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
            <p><strong>การตรวจ:</strong> ตรวจเลือด CBC, Lipid Profile</p>
          </div>
        </body>
      </html>
    `;
    
    await printMedicalRecord(medicalRecordHTML);
  };

  return (
    <div className="space-y-4">
      <h3>ตัวอย่างการพิมพ์ใบเวชระเบียน</h3>
      <Button 
        onClick={handlePrintMedicalRecord}
        disabled={isPrinting}
        variant="outline"
      >
        {isPrinting ? 'กำลังพิมพ์...' : 'พิมพ์ใบเวชระเบียนตัวอย่าง'}
      </Button>
    </div>
  );
};

// Example 3: Receipt printing
export const ReceiptPrintExample = () => {
  const { printReceipt, isPrinting } = usePrinter();

  const handlePrintReceipt = async () => {
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ใบเสร็จรับเงิน</title>
          <style>
            body { 
              font-family: 'Sarabun', Arial, sans-serif; 
              margin: 10px; 
              font-size: 12px;
              width: 80mm;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px dashed #000; padding-top: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>ใบเสร็จรับเงิน</h3>
            <p>คลินิกตัวอย่าง</p>
            <p>เลขที่: R001</p>
          </div>
          <div class="content">
            <div class="item">
              <span>CBC</span>
              <span>150 บาท</span>
            </div>
            <div class="item">
              <span>Lipid Profile</span>
              <span>200 บาท</span>
            </div>
            <div class="total">
              <div class="item">
                <span>รวมทั้งสิ้น</span>
                <span>350 บาท</span>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 10px;">
            <p>ขอบคุณที่ใช้บริการ</p>
          </div>
        </body>
      </html>
    `;
    
    await printReceipt(receiptHTML);
  };

  return (
    <div className="space-y-4">
      <h3>ตัวอย่างการพิมพ์ใบเสร็จรับเงิน</h3>
      <Button 
        onClick={handlePrintReceipt}
        disabled={isPrinting}
        variant="secondary"
      >
        {isPrinting ? 'กำลังพิมพ์...' : 'พิมพ์ใบเสร็จตัวอย่าง'}
      </Button>
    </div>
  );
};

// Example 4: Check printer configuration
export const PrinterStatusExample = () => {
  const { testPrinter, getPrinterName } = usePrinter();
  
  const stickerPrinter = getPrinterName('sticker');
  const medicalPrinter = getPrinterName('medical');
  const receiptPrinter = getPrinterName('receipt');

  return (
    <div className="space-y-4">
      <h3>สถานะเครื่องพิมพ์</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 border rounded">
          <h4 className="font-medium">สติ๊กเกอร์</h4>
          <p className="text-sm text-gray-600">
            {stickerPrinter || 'ไม่ได้กำหนด'}
          </p>
          {stickerPrinter && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => testPrinter(stickerPrinter)}
              className="mt-2"
            >
              ทดสอบ
            </Button>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h4 className="font-medium">ใบเวชระเบียน</h4>
          <p className="text-sm text-gray-600">
            {medicalPrinter || 'ไม่ได้กำหนด'}
          </p>
          {medicalPrinter && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => testPrinter(medicalPrinter)}
              className="mt-2"
            >
              ทดสอบ
            </Button>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h4 className="font-medium">ใบเสร็จรับเงิน</h4>
          <p className="text-sm text-gray-600">
            {receiptPrinter || 'ไม่ได้กำหนด'}
          </p>
          {receiptPrinter && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => testPrinter(receiptPrinter)}
              className="mt-2"
            >
              ทดสอบ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Example 5: Using printer utilities directly (without hook)
export const DirectPrinterUsageExample = () => {
  const handleDirectPrint = async () => {
    // Check if printer is configured
    if (!isPrinterConfigured('sticker')) {
      alert('ไม่ได้กำหนดเครื่องพิมพ์สติ๊กเกอร์');
      return;
    }

    // Get current printer configuration
    const config = getPrinterConfig();
    console.log('Current printer config:', config);

    // You can also use the utility functions directly
    // import { printSticker } from '@/lib/printer-utils';
    // const result = await printSticker(htmlContent);
  };

  return (
    <div className="space-y-4">
      <h3>การใช้งาน Printer Utilities โดยตรง</h3>
      <Button onClick={handleDirectPrint} variant="outline">
        ตัวอย่างการใช้งานโดยตรง
      </Button>
      <div className="text-sm text-gray-600">
        <p>ตัวอย่างนี้แสดงการใช้งาน printer utilities โดยตรงโดยไม่ผ่าน hook</p>
        <p>เหมาะสำหรับกรณีที่ต้องการควบคุมการทำงานเอง</p>
      </div>
    </div>
  );
};

// Main example component
export const PrinterExamples = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">ตัวอย่างการใช้งานระบบเครื่องพิมพ์</h1>
      
      <StickerPrintExample />
      <MedicalRecordPrintExample />
      <ReceiptPrintExample />
      <PrinterStatusExample />
      <DirectPrinterUsageExample />
      
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-medium text-blue-800">วิธีการใช้งาน</h3>
        <ol className="mt-2 text-sm text-blue-700 space-y-1">
          <li>1. ไปที่หน้าตั้งค่า &gt; เครื่องพิมพ์</li>
          <li>2. สแกนหาเครื่องพิมพ์ที่เชื่อมต่อ</li>
          <li>3. กำหนดเครื่องพิมพ์สำหรับแต่ละประเภท</li>
          <li>4. บันทึกการตั้งค่า</li>
          <li>5. ใช้งานในหน้าต่างๆ ผ่าน usePrinter hook</li>
        </ol>
      </div>
    </div>
  );
};
