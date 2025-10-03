// Custom hook for printer management in LabFlow Clinic

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  printSticker, 
  printMedicalRecord, 
  printReceipt,
  printTestSticker,
  isPrinterConfigured,
  getPrinterByType,
  testPrinter as testPrinterUtil
} from '@/lib/printer-utils';

export const usePrinter = () => {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);

  // Print sticker with error handling and toast notifications
  const handlePrintSticker = useCallback(async (content: string) => {
    console.log('usePrinter: handlePrintSticker called');
    console.log('usePrinter: content length:', content?.length);
    console.log('usePrinter: content preview:', content?.substring(0, 200) + '...');
    
    if (!isPrinterConfigured('sticker')) {
      toast({
        title: "ไม่ได้กำหนดเครื่องพิมพ์",
        description: "กรุณาไปที่หน้าตั้งค่า > เครื่องพิมพ์ เพื่อกำหนดเครื่องพิมพ์สติ๊กเกอร์",
        variant: "destructive",
      });
      return false;
    }

    if (!content || content.trim() === '') {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เนื้อหาสติ๊กเกอร์ว่างเปล่า",
        variant: "destructive",
      });
      return false;
    }

    setIsPrinting(true);
    try {
      console.log('usePrinter: calling printSticker with content length:', content.length);
      const result = await printSticker(content);
      
      if (result.success) {
        const printerName = getPrinterByType('sticker');
        const description = result.message || 
          (printerName ? `ส่งสติ๊กเกอร์ไปยัง ${printerName} แล้ว` : "ส่งสติ๊กเกอร์ไปยังเครื่องพิมพ์แล้ว");
        
        toast({
          title: "ส่งพิมพ์สำเร็จ",
          description,
        });
        return true;
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.message || "ไม่สามารถพิมพ์สติ๊กเกอร์ได้",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Print sticker error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถพิมพ์สติ๊กเกอร์ได้",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [toast]);

  // Print medical record with error handling and toast notifications
  const handlePrintMedicalRecord = useCallback(async (content: string) => {
    if (!isPrinterConfigured('medical')) {
      toast({
        title: "ไม่ได้กำหนดเครื่องพิมพ์",
        description: "กรุณาไปที่หน้าตั้งค่า > เครื่องพิมพ์ เพื่อกำหนดเครื่องพิมพ์ใบเวชระเบียน",
        variant: "destructive",
      });
      return false;
    }

    setIsPrinting(true);
    try {
      const result = await printMedicalRecord(content);
      
      if (result.success) {
        toast({
          title: "ส่งพิมพ์สำเร็จ",
          description: result.message || "ส่งใบเวชระเบียนไปยังเครื่องพิมพ์แล้ว",
        });
        return true;
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.message || "ไม่สามารถพิมพ์ใบเวชระเบียนได้",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Print medical record error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถพิมพ์ใบเวชระเบียนได้",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [toast]);

  // Print receipt with error handling and toast notifications
  const handlePrintReceipt = useCallback(async (content: string) => {
    if (!isPrinterConfigured('receipt')) {
      toast({
        title: "ไม่ได้กำหนดเครื่องพิมพ์",
        description: "กรุณาไปที่หน้าตั้งค่า > เครื่องพิมพ์ เพื่อกำหนดเครื่องพิมพ์ใบเสร็จรับเงิน",
        variant: "destructive",
      });
      return false;
    }

    setIsPrinting(true);
    try {
      const result = await printReceipt(content);
      
      if (result.success) {
        toast({
          title: "ส่งพิมพ์สำเร็จ",
          description: result.message || "ส่งใบเสร็จรับเงินไปยังเครื่องพิมพ์แล้ว",
        });
        return true;
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.message || "ไม่สามารถพิมพ์ใบเสร็จรับเงินได้",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Print receipt error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถพิมพ์ใบเสร็จรับเงินได้",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [toast]);

  // Test printer connection
  const handleTestPrinter = useCallback(async (printerName: string) => {
    try {
      const result = await testPrinterUtil(printerName);
      
      if (result.success) {
        toast({
          title: "เครื่องพิมพ์พร้อมใช้งาน",
          description: result.message,
        });
      } else {
        toast({
          title: "เครื่องพิมพ์ไม่พร้อม",
          description: result.message,
          variant: "destructive",
        });
      }
      
      return result.success;
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทดสอบเครื่องพิมพ์ได้",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Check if printer is configured for specific type
  const checkPrinterConfigured = useCallback((type: 'sticker' | 'medical' | 'receipt') => {
    return isPrinterConfigured(type);
  }, []);

  // Get printer name for specific type
  const getPrinterName = useCallback((type: 'sticker' | 'medical' | 'receipt') => {
    return getPrinterByType(type);
  }, []);

  // Print test sticker with sample data
  const handlePrintTestSticker = useCallback(async () => {
    if (!isPrinterConfigured('sticker')) {
      toast({
        title: "ไม่ได้กำหนดเครื่องพิมพ์",
        description: "กรุณาไปที่หน้าตั้งค่า > เครื่องพิมพ์ เพื่อกำหนดเครื่องพิมพ์สติ๊กเกอร์",
        variant: "destructive",
      });
      return false;
    }

    setIsPrinting(true);
    try {
      console.log('usePrinter: calling printTestSticker');
      const result = await printTestSticker();
      
      if (result.success) {
        const printerName = getPrinterByType('sticker');
        const description = result.message || 
          (printerName ? `ส่งสติ๊กเกอร์ทดสอบไปยัง ${printerName} แล้ว` : "ส่งสติ๊กเกอร์ทดสอบไปยังเครื่องพิมพ์แล้ว");
        
        toast({
          title: "ส่งพิมพ์ทดสอบสำเร็จ",
          description,
        });
        return true;
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.message || "ไม่สามารถพิมพ์สติ๊กเกอร์ทดสอบได้",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Print test sticker error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถพิมพ์สติ๊กเกอร์ทดสอบได้",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [toast]);

  return {
    // State
    isPrinting,
    
    // Print functions
    printSticker: handlePrintSticker,
    printTestSticker: handlePrintTestSticker,
    printMedicalRecord: handlePrintMedicalRecord,
    printReceipt: handlePrintReceipt,
    
    // Utility functions
    testPrinter: handleTestPrinter,
    isPrinterConfigured: checkPrinterConfigured,
    getPrinterName,
  };
};

export default usePrinter;
