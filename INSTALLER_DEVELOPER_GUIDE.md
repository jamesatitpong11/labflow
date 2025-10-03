# 🛠️ LabFlow Clinic - คู่มือสร้าง Installer สำหรับ Developer

## 🚀 Quick Start

### สร้าง Installer แบบง่าย (แนะนำ):
```bash
npm run build:simple-installer
```

### สร้าง Installer แบบครบครัน:
```bash
npm run build:installer
```

### สร้างทั้ง Installer และ Portable:
```bash
npm run build:all
```

## 📦 ไฟล์ที่ได้

หลังจากรัน build จะได้ไฟล์ในโฟลเดอร์ `dist-electron/`:

| ไฟล์ | ขนาด | คำอธิบาย |
|------|------|----------|
| `LabFlow-Clinic-Setup-1.0.0.exe` | ~80 MB | **Installer หลัก** (แนะนำ) |
| `LabFlow-Clinic-1.0.0-portable.exe` | ~150 MB | Portable version |
| `*.blockmap` | ~1 KB | Block map สำหรับ update |

## 🔧 การปรับแต่ง Installer

### 1. แก้ไขข้อมูลโปรแกรม
แก้ไขใน `package.json`:
```json
{
  "name": "labflow-clinic",
  "version": "1.0.0",
  "description": "ระบบจัดการคลินิกและห้องปฏิบัติการ LabFlow Clinic",
  "author": "LabFlow Team"
}
```

### 2. เปลี่ยน Icon
แทนที่ไฟล์ `public/iconlabflow.ico` ด้วย icon ใหม่:
- ขนาด: 256x256 pixels
- รูปแบบ: .ico
- รองรับ multiple sizes (16, 32, 48, 64, 128, 256)

### 3. ปรับแต่งการตั้งค่า NSIS
แก้ไขใน `package.json` ส่วน `build.nsis`:
```json
{
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "LabFlow Clinic",
    "allowElevation": true,
    "runAfterFinish": true,
    "artifactName": "LabFlow-Clinic-Setup-${version}.exe"
  }
}
```

### 4. เพิ่ม Custom NSIS Script
สร้างไฟล์ `build/installer.nsh`:
```nsis
; Custom NSIS commands
!macro customInstall
  ; สร้าง desktop shortcut พิเศษ
  CreateShortCut "$DESKTOP\\LabFlow Clinic.lnk" "$INSTDIR\\LabFlow Clinic.exe"
!macroend

!macro customUnInstall
  ; ลบ desktop shortcut
  Delete "$DESKTOP\\LabFlow Clinic.lnk"
!macroend
```

## 🎯 Build Scripts ที่มีอยู่

### 1. `build:simple-installer` (แนะนำ)
- ใช้ electron-builder built-in NSIS
- สร้าง installer พร้อม desktop icon
- ไม่ต้องติดตั้ง NSIS แยก
- รวดเร็วและเสถียร

### 2. `build:installer`
- ใช้ custom configuration
- ยืดหยุ่นมากขึ้น
- ต้องการ NSIS ติดตั้งในระบบ

### 3. `build:portable`
- สร้าง portable executable
- ไม่ต้องติดตั้ง
- เหมาะสำหรับทดสอบ

### 4. `build:all`
- สร้างทั้ง installer และ portable
- ใช้เวลานานสุด
- ได้ไฟล์ครบทุกรูปแบบ

## 🔍 การทดสอบ Installer

### 1. ทดสอบในเครื่องพัฒนา
```bash
# สร้าง installer
npm run build:simple-installer

# ทดสอบติดตั้ง
cd dist-electron
.\LabFlow-Clinic-Setup-1.0.0.exe
```

### 2. ทดสอบใน Virtual Machine
- ใช้ Windows 10/11 VM
- ทดสอบการติดตั้งจากศูนย์
- ตรวจสอบ desktop icon และ start menu

### 3. ทดสอบการถอนการติดตั้ง
- ทดสอบ uninstaller
- ตรวจสอบว่าลบไฟล์ครบถ้วน
- ตรวจสอบ registry cleanup

## 🛡️ Code Signing (อนาคต)

### เตรียม Certificate:
```bash
# ซื้อ code signing certificate
# หรือใช้ self-signed สำหรับทดสอบ
```

### เพิ่มใน package.json:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "password",
      "sign": "path/to/signtool.exe"
    }
  }
}
```

## 📊 การ Monitor และ Analytics

### 1. Build Size Optimization
```bash
# ตรวจสอบขนาดไฟล์
npm run build:simple-installer
ls -la dist-electron/

# วิเคราะห์ bundle size
npx webpack-bundle-analyzer dist/
```

### 2. Performance Monitoring
- ติดตาม build time
- ตรวจสอบ installer size
- Monitor download speed

## 🚨 การแก้ไขปัญหา

### ปัญหา: Build ล้มเหลว
```bash
# ลบ cache และ build ใหม่
rm -rf node_modules dist dist-electron
npm install
npm run build:simple-installer
```

### ปัญหา: Icon ไม่แสดง
- ตรวจสอบไฟล์ `public/iconlabflow.ico`
- ใช้เครื่องมือ convert เป็น .ico
- ตรวจสอบขนาดและรูปแบบ

### ปัญหา: NSIS Error
- ใช้ `build:simple-installer` แทน
- ตรวจสอบ custom NSIS script
- ลบไฟล์ temp และ build ใหม่

## 📋 Checklist ก่อน Release

### ✅ Pre-build:
- [ ] อัปเดต version ใน package.json
- [ ] ทดสอบ app ใน development mode
- [ ] ตรวจสอบ icon และ assets
- [ ] อัปเดต changelog

### ✅ Build:
- [ ] รัน `npm run build:simple-installer`
- [ ] ตรวจสอบขนาดไฟล์
- [ ] ทดสอบ installer ในเครื่องทดสอบ
- [ ] ตรวจสอบ desktop icon

### ✅ Post-build:
- [ ] สร้าง checksum (MD5/SHA256)
- [ ] เตรียมคู่มือการใช้งาน
- [ ] อัปโหลดไฟล์ไปยัง server
- [ ] แจ้งผู้ใช้เรื่อง update

## 🔄 Automated Build (CI/CD)

### GitHub Actions Example:
```yaml
name: Build Installer
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:simple-installer
      - uses: actions/upload-artifact@v3
        with:
          name: installer
          path: dist-electron/*.exe
```

---

## 📞 Support

หากมีปัญหาในการ build installer:

1. ตรวจสอบ [INSTALLER_GUIDE.md](./INSTALLER_GUIDE.md)
2. ดู logs ใน terminal
3. ลองใช้ `build:simple-installer` แทน
4. ติดต่อทีมพัฒนา

**LabFlow Clinic Installer Builder v1.0.0**  
© 2024 LabFlow Team. All rights reserved.
