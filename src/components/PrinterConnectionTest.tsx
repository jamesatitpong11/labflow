import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Printer, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { testPrinterConnection, PrinterConfig, PrinterInfo } from '@/lib/printer-utils';
import { useToast } from '@/hooks/use-toast';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  printers: PrinterConfig;
  availablePrinters?: PrinterInfo[];
}

export const PrinterConnectionTest: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const result = await testPrinterConnection();
      setTestResult(result);
      
      toast({
        title: result.success ? "ทดสอบเสร็จสิ้น" : "พบปัญหา",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทดสอบการเชื่อมต่อเครื่องพิมพ์ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPrinterStatus = (printerName: string, availablePrinters?: PrinterInfo[]) => {
    if (!printerName) return { status: 'not-configured', text: 'ไม่ได้กำหนด', color: 'secondary' };
    
    if (!availablePrinters) return { status: 'unknown', text: 'ไม่ทราบสถานะ', color: 'outline' };
    
    const printer = availablePrinters.find(p => p.name === printerName);
    if (printer) {
      return { status: 'connected', text: 'เชื่อมต่อแล้ว', color: 'default' };
    } else {
      return { status: 'disconnected', text: 'ไม่พบเครื่องพิมพ์', color: 'destructive' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not-configured':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          ทดสอบการเชื่อมต่อเครื่องพิมพ์
        </CardTitle>
        <CardDescription>
          ตรวจสอบการตั้งค่าและสถานะการเชื่อมต่อเครื่องพิมพ์ทั้งหมด
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              กำลังทดสอบ...
            </>
          ) : (
            <>
              <Printer className="mr-2 h-4 w-4" />
              ทดสอบการเชื่อมต่อ
            </>
          )}
        </Button>

        {testResult && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {testResult.message}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">สถานะเครื่องพิมพ์:</h4>
              
              {/* Sticker Printer */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getPrinterStatus(testResult.printers.sticker, testResult.availablePrinters).status)}
                  <div>
                    <p className="font-medium">เครื่องพิมพ์สติ๊กเกอร์</p>
                    <p className="text-sm text-muted-foreground">
                      {testResult.printers.sticker || 'ไม่ได้กำหนด'}
                    </p>
                  </div>
                </div>
                <Badge variant={getPrinterStatus(testResult.printers.sticker, testResult.availablePrinters).color as any}>
                  {getPrinterStatus(testResult.printers.sticker, testResult.availablePrinters).text}
                </Badge>
              </div>

              {/* Medical Printer */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getPrinterStatus(testResult.printers.medical, testResult.availablePrinters).status)}
                  <div>
                    <p className="font-medium">เครื่องพิมพ์ใบเวชระเบียน</p>
                    <p className="text-sm text-muted-foreground">
                      {testResult.printers.medical || 'ไม่ได้กำหนด'}
                    </p>
                  </div>
                </div>
                <Badge variant={getPrinterStatus(testResult.printers.medical, testResult.availablePrinters).color as any}>
                  {getPrinterStatus(testResult.printers.medical, testResult.availablePrinters).text}
                </Badge>
              </div>

              {/* Receipt Printer */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getPrinterStatus(testResult.printers.receipt, testResult.availablePrinters).status)}
                  <div>
                    <p className="font-medium">เครื่องพิมพ์ใบเสร็จ</p>
                    <p className="text-sm text-muted-foreground">
                      {testResult.printers.receipt || 'ไม่ได้กำหนด'}
                    </p>
                  </div>
                </div>
                <Badge variant={getPrinterStatus(testResult.printers.receipt, testResult.availablePrinters).color as any}>
                  {getPrinterStatus(testResult.printers.receipt, testResult.availablePrinters).text}
                </Badge>
              </div>
            </div>

            {testResult.availablePrinters && testResult.availablePrinters.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">เครื่องพิมพ์ที่พบในระบบ:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {testResult.availablePrinters.map((printer, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Printer className="h-3 w-3" />
                      <span>{printer.displayName || printer.name}</span>
                      {printer.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrinterConnectionTest;
