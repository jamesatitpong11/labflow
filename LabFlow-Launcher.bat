@echo off
title LabFlow Clinic Launcher
color 0A

echo.
echo ========================================
echo    LabFlow Clinic - Starting System  
echo ========================================
echo.

:: Get installation directory
set "INSTALL_DIR=%~dp0"
cd /d "%INSTALL_DIR%"

echo [1/2] Starting Backend Server...

:: Try to find and start backend
if exist "resources\app.asar.unpacked\backend\server.js" (
    echo Found backend server, starting...
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%resources\app.asar.unpacked\backend\" && echo LabFlow Backend Server && echo Running on http://localhost:3001 && echo. && node server.js"
    timeout /t 3 /nobreak >nul
) else (
    echo Backend server not found, continuing...
)

echo [2/2] Starting Main Application...

:: Start main application
if exist "LabFlow Clinic.exe" (
    echo Starting LabFlow Clinic...
    start "" "LabFlow Clinic.exe"
) else (
    echo ERROR: LabFlow Clinic.exe not found!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   LabFlow Clinic Started Successfully!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Main App: Running
echo.
echo You can close this window now.
timeout /t 5 /nobreak >nul
exit
