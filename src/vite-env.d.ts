/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI?: {
      API_BASE_URL?: string;
      // Store operations
      getStore?: (key: string) => Promise<any>;
      setStore?: (key: string, value: any) => Promise<boolean>;
      // Printer operations
      getPrinters: () => Promise<{
        name: string;
        displayName?: string;
        description?: string;
        status: number;
        isDefault?: boolean;
      }[]>;
      checkPrinterStatus?: (printerName: string) => Promise<{
        status: "connected" | "disconnected" | "error";
        message?: string;
      }>;
      printSticker?: (options: any) => Promise<void>;
      testPrint?: (printerName: string, testData: any) => Promise<void>;
      printReceipt?: (printerName: string, receiptData: any) => Promise<void>;
      printDocument?: (options: any) => Promise<void>;
      printDocumentWithDialog?: (options: any) => Promise<void>;
      platform?: string;
      isElectron?: boolean;
      [key: string]: any;
    };
    ELECTRON_API_BASE_URL?: string;
  }
}
