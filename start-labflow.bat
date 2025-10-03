@echo off
title LabFlow Clinic Launcher
color 0A

echo.
echo ========================================
echo    LabFlow Clinic - Starting System
echo ========================================
echo.

:: Get the directory where this batch file is located
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

echo [1/3] Checking system requirements...
timeout /t 1 /nobreak >nul

:: Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Starting Backend Server...
echo.

:: Start backend server in a new window
start "LabFlow Backend Server" cmd /k "cd /d \"%APP_DIR%backend\" && echo Starting LabFlow Backend Server... && echo Backend running on http://localhost:3001 && node server.js"

echo Backend server starting in separate window...
echo Waiting for backend to initialize...

:: Wait for backend to start
timeout /t 5 /nobreak >nul

echo [3/3] Starting LabFlow Clinic Application...
echo.

:: Start the main Electron application
if exist "%APP_DIR%LabFlow Clinic.exe" (
    echo Starting Electron application...
    start "" "%APP_DIR%LabFlow Clinic.exe"
) else if exist "%APP_DIR%electron.exe" (
    echo Starting Electron application...
    start "" "%APP_DIR%electron.exe"
) else (
    echo Starting with npm...
    npm run electron
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
echo 1. Close the LabFlow Clinic application
echo 2. Close the Backend Server window
echo.
echo Press any key to close this launcher...
pause >nul
