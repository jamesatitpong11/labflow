@echo off
title LabFlow Clinic Launcher
color 0A

echo.
echo ========================================
echo    LabFlow Clinic - Starting System
echo ========================================
echo.

:: Get the installation directory
set "INSTALL_DIR=%~dp0"
cd /d "%INSTALL_DIR%"

echo [1/2] Starting Backend Server...

:: Try different possible backend paths
set "BACKEND_PATH="
if exist "%INSTALL_DIR%resources\app.asar.unpacked\backend\server.js" (
    set "BACKEND_PATH=%INSTALL_DIR%resources\app.asar.unpacked\backend"
) else if exist "%INSTALL_DIR%resources\app\backend\server.js" (
    set "BACKEND_PATH=%INSTALL_DIR%resources\app\backend"
) else if exist "%INSTALL_DIR%backend\server.js" (
    set "BACKEND_PATH=%INSTALL_DIR%backend"
)

if "%BACKEND_PATH%"=="" (
    echo ERROR: Backend server not found!
    echo Trying to start application without backend...
) else (
    echo Starting backend at: %BACKEND_PATH%
    start "LabFlow Backend Server" cmd /k "cd /d \"%BACKEND_PATH%\" && echo LabFlow Backend Server && echo Running on http://localhost:3001 && echo. && node server.js"
    echo Backend server starting...
    timeout /t 3 /nobreak >nul
)

echo [2/2] Starting Main Application...

:: Start the main application
if exist "%INSTALL_DIR%LabFlow Clinic.exe" (
    echo Starting LabFlow Clinic...
    start "" "%INSTALL_DIR%LabFlow Clinic.exe"
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
