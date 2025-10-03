import { toast } from "@/hooks/use-toast";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

// Success Toast - สีเขียว สำหรับการดำเนินการสำเร็จ
export const showSuccessToast = ({ title, description, duration = 5000 }: ToastOptions) => {
  return toast({
    variant: "success",
    title,
    description,
    duration,
  });
};

// Error Toast - สีแดง สำหรับข้อผิดพลาด
export const showErrorToast = ({ title, description, duration = 7000 }: ToastOptions) => {
  return toast({
    variant: "destructive",
    title,
    description,
    duration,
  });
};

// Warning Toast - สีเหลือง สำหรับคำเตือน
export const showWarningToast = ({ title, description, duration = 6000 }: ToastOptions) => {
  return toast({
    variant: "warning",
    title,
    description,
    duration,
  });
};

// Info Toast - สีน้ำเงิน สำหรับข้อมูลทั่วไป
export const showInfoToast = ({ title, description, duration = 5000 }: ToastOptions) => {
  return toast({
    variant: "info",
    title,
    description,
    duration,
  });
};

// Default Toast - สำหรับข้อมูลทั่วไป
export const showDefaultToast = ({ title, description, duration = 5000 }: ToastOptions) => {
  return toast({
    variant: "default",
    title,
    description,
    duration,
  });
};

// Convenience functions with common messages
export const toastHelpers = {
  // Success messages
  saveSuccess: (itemName: string = "ข้อมูล") => 
    showSuccessToast({
      title: "บันทึกสำเร็จ",
      description: `บันทึก${itemName}เรียบร้อยแล้ว`,
    }),
  
  updateSuccess: (itemName: string = "ข้อมูล") => 
    showSuccessToast({
      title: "อัปเดตสำเร็จ",
      description: `อัปเดต${itemName}เรียบร้อยแล้ว`,
    }),
  
  deleteSuccess: (itemName: string = "ข้อมูล") => 
    showSuccessToast({
      title: "ลบสำเร็จ",
      description: `ลบ${itemName}เรียบร้อยแล้ว`,
    }),

  // Error messages
  saveError: (itemName: string = "ข้อมูล") => 
    showErrorToast({
      title: "เกิดข้อผิดพลาด",
      description: `ไม่สามารถบันทึก${itemName}ได้`,
    }),
  
  updateError: (itemName: string = "ข้อมูล") => 
    showErrorToast({
      title: "เกิดข้อผิดพลาด",
      description: `ไม่สามารถอัปเดต${itemName}ได้`,
    }),
  
  deleteError: (itemName: string = "ข้อมูล") => 
    showErrorToast({
      title: "เกิดข้อผิดพลาด",
      description: `ไม่สามารถลบ${itemName}ได้`,
    }),

  loadError: (itemName: string = "ข้อมูล") => 
    showErrorToast({
      title: "เกิดข้อผิดพลาด",
      description: `ไม่สามารถโหลด${itemName}ได้`,
    }),

  // Warning messages
  validationWarning: (message: string) => 
    showWarningToast({
      title: "กรุณาตรวจสอบข้อมูล",
      description: message,
    }),

  // Info messages
  dataLoaded: (itemName: string = "ข้อมูล") => 
    showInfoToast({
      title: "โหลดข้อมูลแล้ว",
      description: `${itemName}ถูกโหลดเรียบร้อยแล้ว`,
    }),
};
