# 🚀 LabFlow Clinic - สร้าง Launcher เอง

## วิธีสร้าง Launcher สำหรับรัน Backend + Frontend

### ขั้นตอนที่ 1: หาโฟลเดอร์ติดตั้ง
1. ติดตั้ง LabFlow Clinic ตามปกติ
2. ไปที่โฟลเดอร์ติดตั้ง (มักจะเป็น `C:\Program Files\LabFlow Clinic\`)

### ขั้นตอนที่ 2: สร้างไฟล์ Batch
1. คลิกขวาในโฟลเดอร์ติดตั้ง → New → Text Document
2. ตั้งชื่อ: `Start-LabFlow-Full.bat`
3. เปิดไฟล์และใส่โค้ดนี้:

```batch
@echo off
title LabFlow Clinic Launcher
color 0A

echo.
echo ========================================
echo    LabFlow Clinic - Starting System
echo ========================================
echo.

:: Get current directory
set "INSTALL_DIR=%~dp0"
cd /d "%INSTALL_DIR%"

echo [1/2] Starting Backend Server...

:: Try to find backend
if exist "resources\app.asar.unpacked\backend\server.js" (
    echo Found backend server, starting...
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%resources\app.asar.unpacked\backend\" && echo LabFlow Backend Server && echo Running on http://localhost:3001 && echo Press Ctrl+C to stop backend && echo. && node server.js"
    timeout /t 3 /nobreak >nul
) else if exist "resources\app\backend\server.js" (
    echo Found backend server (unpacked), starting...
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%resources\app\backend\" && echo LabFlow Backend Server && echo Running on http://localhost:3001 && echo Press Ctrl+C to stop backend && echo. && node server.js"
    timeout /t 3 /nobreak >nul
) else (
    echo WARNING: Backend server not found!
    echo The app will run without backend functionality.
    timeout /t 2 /nobreak >nul
)

echo [2/2] Starting Main Application...

:: Start main app
if exist "LabFlow Clinic.exe" (
    echo Starting LabFlow Clinic...
    start "" "LabFlow Clinic.exe"
) else (
    echo ERROR: LabFlow Clinic.exe not found!
    echo Make sure you're in the correct installation directory.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   LabFlow Clinic Started Successfully!
echo ========================================
echo.
echo Backend Server: http://localhost:3001
echo Main Application: Running
echo.
echo To stop the system:
echo 1. Close LabFlow Clinic application
echo 2. Close Backend Server window (Ctrl+C)
echo.
echo You can close this launcher window now.
timeout /t 5 /nobreak >nul
exit
```

4. บันทึกไฟล์

### ขั้นตอนที่ 3: สร้าง Desktop Shortcut
1. คลิกขวาที่ `Start-LabFlow-Full.bat` → Create shortcut
2. ลาก shortcut ไปวางที่ Desktop
3. เปลี่ยนชื่อเป็น "LabFlow Clinic (Full System)"

### ขั้นตอนที่ 4: เปลี่ยน Icon (ทำหรือไม่ทำก็ได้)
1. คลิกขวาที่ shortcut → Properties
2. คลิก "Change Icon"
3. Browse ไปที่: `resources\app\public\iconlabflow.ico`
4. เลือก icon และกด OK

## การใช้งาน

### เริ่มระบบเต็ม (Backend + Frontend):
- ดับเบิลคลิก "LabFlow Clinic (Full System)" บน Desktop
- จะเห็น 2 หน้าต่าง:
  - CMD Window = Backend Server
  - LabFlow Window = Main Application

### เริ่มแค่ Frontend:
- ใช้ shortcut ปกติ "LabFlow Clinic"

## การแก้ปัญหา

### ถ้า Backend ไม่รัน:
1. ตรวจสอบ Node.js: เปิด CMD → พิมพ์ `node --version`
2. ถ้าไม่มี Node.js ให้ติดตั้งจาก: https://nodejs.org
3. ลองรัน backend แยก:
   ```
   cd "C:\Program Files\LabFlow Clinic\resources\app.asar.unpacked\backend"
   node server.js
   ```

### ถ้า Main App ไม่รัน:
1. ลองรัน `LabFlow Clinic.exe` โดยตรง
2. ตรวจสอบ Windows Defender / Antivirus
3. รัน Command Prompt as Administrator

### ถ้าไม่เจอไฟล์:
1. ตรวจสอบว่าอยู่ในโฟลเดอร์ติดตั้งที่ถูกต้อง
2. ลองหาใน: `C:\Users\[Username]\AppData\Local\Programs\LabFlow Clinic\`

## ข้อดีของวิธีนี้:
- ✅ เห็นทั้ง Backend และ Frontend ทำงาน
- ✅ สามารถ monitor logs ได้
- ✅ ควบคุมการเปิด/ปิดได้แยก
- ✅ แก้ปัญหาได้ง่าย
- ✅ ไม่ต้องพึ่ง installer ซับซ้อน

---
**LabFlow Clinic v1.0.0**  
หากมีปัญหาติดต่อ: support@labflow.clinic
