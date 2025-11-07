import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrinter } from '@/hooks/use-printer';
import { getPrinterConfig } from '@/lib/printer-utils';
import { 
  Printer, 
  TestTube, 
  Settings, 
  CheckCircle, 
  XCircle,
  AlertCircle 
} from 'lucide-react';

export default function PrinterTest() {
  const { 
    printTestSticker, 
    isPrinting, 
    isPrinterConfigured, 
    getPrinterName 
  } = usePrinter();

  const printerConfig = getPrinterConfig();
  const stickerPrinter = getPrinterName('sticker');
  const medicalPrinter = getPrinterName('medical');
  const receiptPrinter = getPrinterName('receipt');

  const handleTestSticker = async () => {
    await printTestSticker();
  };

  const PrinterStatus = ({ type, printerName, configured }: {
    type: string;
    printerName: string;
    configured: boolean;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Printer className="h-4 w-4 text-gray-500" />
        <div>
          <p className="font-medium">{type}</p>
          <p className="text-sm text-gray-500">
            {printerName || 'ไม่ได้กำหนด'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {configured ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            พร้อมใช้งาน
          </Badge>
        ) : (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            ไม่ได้กำหนด
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ทดสอบเครื่องพิมพ์</h1>
          <p className="text-gray-600 mt-2">
            ทดสอบการทำงานของเครื่องพิมพ์ในระบบ LabFlow Clinic
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          ตั้งค่าเครื่องพิมพ์
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Printer Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              สถานะเครื่องพิมพ์
            </CardTitle>
            <CardDescription>
              ตรวจสอบการกำหนดค่าเครื่องพิมพ์ในระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PrinterStatus
              type="เครื่องพิมพ์สติ๊กเกอร์"
              printerName={stickerPrinter}
              configured={isPrinterConfigured('sticker')}
            />
            <PrinterStatus
              type="เครื่องพิมพ์ใบเวชระเบียน"
              printerName={medicalPrinter}
              configured={isPrinterConfigured('medical')}
            />
            <PrinterStatus
              type="เครื่องพิมพ์ใบเสร็จ"
              printerName={receiptPrinter}
              configured={isPrinterConfigured('receipt')}
            />
          </CardContent>
        </Card>

        {/* Sticker Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              ทดสอบพิมพ์สติ๊กเกอร์
            </CardTitle>
            <CardDescription>
              ทดสอบการพิมพ์สติ๊กเกอร์ด้วยข้อมูลตัวอย่าง
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPrinterConfigured('sticker') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-yellow-800 text-sm">
                    ไม่ได้กำหนดเครื่องพิมพ์สติ๊กเกอร์ กรุณาไปที่หน้าตั้งค่าก่อน
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleTestSticker}
                disabled={isPrinting || !isPrinterConfigured('sticker')}
                className="w-full"
                size="lg"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isPrinting ? 'กำลังพิมพ์...' : 'ทดสอบพิมพ์สติ๊กเกอร์'}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">สติ๊กเกอร์ 1 ดวง (50x25mm):</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div>
                    <strong>ขนาด:</strong> 50mm x 25mm (สติ๊กเกอร์เดี่ยว)
                  </div>
                  <div>
                    <strong>เนื้อหา:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• หมายเลข Visit: V{Date.now().toString().slice(-6)}</li>
                      <li>• คำนำหน้า + ชื่อ: นายทดสอบ</li>
                      <li>• นามสกุล: ระบบ</li>
                      <li>• อายุ + วันที่: อายุ 35 ปี {new Date().toLocaleDateString('th-TH')}</li>
                      <li>• บาร์โค้ด: CODE128 (SVG คมชัด)</li>
                    </ul>
                    <div className="mt-2 text-xs text-blue-600">
                      <strong>หมายเหตุ:</strong> ใช้เทมเพลต 50x25mm แบบเดียวกับหน้า Visit และลงทะเบียน
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>คำแนะนำการใช้งาน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  ตั้งค่าเครื่องพิมพ์
                </h4>
                <p className="text-sm text-gray-600">
                  ไปที่หน้าตั้งค่า &gt; เครื่องพิมพ์ เพื่อกำหนดเครื่องพิมพ์สำหรับแต่ละประเภท
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  ทดสอบการพิมพ์
                </h4>
                <p className="text-sm text-gray-600">
                  กดปุ่ม "ทดสอบพิมพ์สติ๊กเกอร์" เพื่อทดสอบว่าเครื่องพิมพ์ทำงานได้ปกติ
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  ใช้งานจริง
                </h4>
                <p className="text-sm text-gray-600">
                  เมื่อทดสอบสำเร็จแล้ว สามารถใช้งานการพิมพ์ในหน้าต่างๆ ของระบบได้
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
