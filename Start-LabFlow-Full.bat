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

echo Current directory: %INSTALL_DIR%
echo.

echo [1/2] Looking for Backend Server...

:: List possible backend locations for debugging
echo Checking possible backend locations:
echo 1. resources\app.asar.unpacked\backend\server.js
if exist "resources\app.asar.unpacked\backend\server.js" echo    - FOUND!
if not exist "resources\app.asar.unpacked\backend\server.js" echo    - Not found

echo 2. resources\app\backend\server.js
if exist "resources\app\backend\server.js" echo    - FOUND!
if not exist "resources\app\backend\server.js" echo    - Not found

echo 3. backend\server.js
if exist "backend\server.js" echo    - FOUND!
if not exist "backend\server.js" echo    - Not found

echo.

:: Try to start backend
if exist "resources\app.asar.unpacked\backend\server.js" (
    echo Starting backend from: resources\app.asar.unpacked\backend\
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%resources\app.asar.unpacked\backend\" && echo LabFlow Backend Server && echo Running on http://localhost:3001 && echo. && node server.js"
    timeout /t 3 /nobreak >nul
) else if exist "resources\app\backend\server.js" (
    echo Starting backend from: resources\app\backend\
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%resources\app\backend\" && echo LabFlow Backend Server && echo Running on http://localhost:3001 && echo. && node server.js"
    timeout /t 3 /nobreak >nul
) else if exist "backend\server.js" (
    echo Starting backend from: backend\
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%backend\" && echo LabFlow Backend Server && echo Running on http://localhost:3001 && echo. && node server.js"
    timeout /t 3 /nobreak >nul
) else (
    echo WARNING: Backend server not found in any location!
    echo The app will run without backend functionality.
    echo.
    echo Available files in current directory:
    dir /b
    echo.
    timeout /t 5 /nobreak >nul
)

echo [2/2] Looking for Main Application...

:: Check for main app
echo Checking for LabFlow Clinic.exe...
if exist "LabFlow Clinic.exe" (
    echo FOUND: LabFlow Clinic.exe
    echo Starting LabFlow Clinic...
    start "" "LabFlow Clinic.exe"
) else (
    echo ERROR: LabFlow Clinic.exe not found!
    echo.
    echo Available .exe files:
    dir *.exe /b 2>nul
    echo.
    echo Make sure you're in the correct installation directory.
    echo Current directory: %INSTALL_DIR%
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
echo Press any key to close this launcher...
pause >nul
