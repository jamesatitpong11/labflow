@echo off
title LabFlow Clinic - Production Launcher
color 0A

echo.
echo ========================================
echo    LabFlow Clinic - Production Launcher
echo ========================================
echo.

:: Get current directory
set "INSTALL_DIR=%~dp0"
cd /d "%INSTALL_DIR%"

echo Installation directory: %INSTALL_DIR%
echo.

:: Check if we're in the right directory
echo Checking installation...
if not exist "LabFlow Clinic.exe" (
    echo ❌ ERROR: LabFlow Clinic.exe not found!
    echo.
    echo This launcher must be placed in the LabFlow Clinic installation directory.
    echo Usually: C:\Program Files\LabFlow Clinic\
    echo.
    echo Current directory: %INSTALL_DIR%
    echo Available files:
    dir /b
    echo.
    pause
    exit /b 1
)

echo ✅ Found LabFlow Clinic.exe
echo.

:: Look for backend server
echo [1/2] Looking for Backend Server...

if exist "resources\app.asar.unpacked\backend\server.js" (
    echo ✅ Found backend at: resources\app.asar.unpacked\backend\
    echo Starting backend server...
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%resources\\app.asar.unpacked\\backend\" && echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Press Ctrl+C to stop server && echo. && node server.js"
    timeout /t 3 /nobreak >nul
) else if exist "resources\app\backend\server.js" (
    echo ✅ Found backend at: resources\app\backend\
    echo Starting backend server...
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%resources\app\backend\" && echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Press Ctrl+C to stop server && echo. && node server.js"
    timeout /t 3 /nobreak >nul
) else (
    echo ⚠️  Backend server not found!
    echo The application will run without backend functionality.
    echo.
    echo Searched in:
    echo - resources\app.asar.unpacked\backend\server.js
    echo - resources\app\backend\server.js
    echo.
    timeout /t 3 /nobreak >nul
)

echo [2/2] Starting Main Application...
echo ✅ Starting LabFlow Clinic...
start "" "LabFlow Clinic.exe"

echo.
echo ========================================
echo    ✅ LabFlow Clinic Started!
echo ========================================
echo.
echo 🌐 Backend Server: http://localhost:3001
echo 🏥 Main Application: Running
echo.
echo 📋 To stop the system:
echo    1. Close LabFlow Clinic application window
echo    2. Close Backend Server window (press Ctrl+C)
echo.
echo 💡 You can close this launcher window now.
echo.
timeout /t 5 /nobreak >nul
exit
