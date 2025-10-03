@echo off
title LabFlow Test Launcher
color 0E

echo ========================================
echo    LabFlow Clinic - Test Launcher
echo ========================================
echo.

:: Get current directory
set "CURRENT_DIR=%~dp0"
echo Current directory: %CURRENT_DIR%
echo.

:: Test 1: Check if we're in development directory
echo TEST 1: Checking if we're in development directory...
if exist "backend\server.js" (
    echo ✅ Found backend\server.js - We're in development directory
    echo Starting development backend...
    start "LabFlow Backend (Dev)" cmd /k "cd /d \"%CURRENT_DIR%backend\" && echo LabFlow Backend Server (Development) && echo Running on http://localhost:3001 && echo Press Ctrl+C to stop && echo. && node server.js"
    timeout /t 3 /nobreak >nul
    goto :start_electron
) else (
    echo ❌ Not in development directory
)

:: Test 2: Check if we're in production directory
echo.
echo TEST 2: Checking if we're in production directory...
if exist "LabFlow Clinic.exe" (
    echo ✅ Found LabFlow Clinic.exe - We're in production directory
    
    :: Check for backend in production
    if exist "resources\app.asar.unpacked\backend\server.js" (
        echo ✅ Found production backend
        echo Starting production backend...
        start "LabFlow Backend (Prod)" cmd /k "cd /d \"%CURRENT_DIR%resources\app.asar.unpacked\backend\" && echo LabFlow Backend Server (Production) && echo Running on http://localhost:3001 && echo Press Ctrl+C to stop && echo. && node server.js"
        timeout /t 3 /nobreak >nul
    ) else (
        echo ❌ Production backend not found
    )
    
    echo Starting LabFlow Clinic...
    start "" "LabFlow Clinic.exe"
    goto :success
) else (
    echo ❌ Not in production directory
)

:start_electron
echo.
echo TEST 3: Starting Electron in development mode...
if exist "electron\main.js" (
    echo ✅ Found electron\main.js
    echo Starting Electron...
    start "" "npm" "run" "electron"
    goto :success
) else (
    echo ❌ Electron files not found
)

echo.
echo ❌ ERROR: Could not determine directory type or find required files
echo.
echo Available files in current directory:
dir /b
echo.
echo Please make sure you're running this from either:
echo 1. Development directory (with backend\ folder)
echo 2. Production directory (with LabFlow Clinic.exe)
pause
exit /b 1

:success
echo.
echo ========================================
echo    ✅ LabFlow Clinic Started!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: Running
echo.
echo Press any key to close this launcher...
pause >nul
exit
