@echo off
title LabFlow Clinic - Fixed Launcher
color 0A

echo.
echo ========================================
echo    LabFlow Clinic - Fixed Launcher
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
    echo Current directory: %INSTALL_DIR%
    pause
    exit /b 1
)

echo ✅ Found LabFlow Clinic.exe
echo.

:: Look for backend server with detailed debugging
echo [1/2] Looking for Backend Server...

:: Check path 1
set "BACKEND_PATH1=%INSTALL_DIR%resources\app.asar.unpacked\backend"
echo Checking: %BACKEND_PATH1%
if exist "%BACKEND_PATH1%\server.js" (
    echo ✅ Found backend server!
    echo Full path: %BACKEND_PATH1%\server.js
    echo.
    echo Starting backend server...
    start "LabFlow Backend Server" cmd /k "cd /d \"%BACKEND_PATH1%\" && echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Backend directory: %BACKEND_PATH1% && echo Press Ctrl+C to stop server && echo. && node server.js"
    timeout /t 3 /nobreak >nul
    goto :start_main_app
)

:: Check path 2
set "BACKEND_PATH2=%INSTALL_DIR%resources\app\backend"
echo Checking: %BACKEND_PATH2%
if exist "%BACKEND_PATH2%\server.js" (
    echo ✅ Found backend server!
    echo Full path: %BACKEND_PATH2%\server.js
    echo.
    echo Starting backend server...
    start "LabFlow Backend Server" cmd /k "cd /d \"%BACKEND_PATH2%\" && echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Backend directory: %BACKEND_PATH2% && echo Press Ctrl+C to stop server && echo. && node server.js"
    timeout /t 3 /nobreak >nul
    goto :start_main_app
)

:: Check path 3 (fallback)
set "BACKEND_PATH3=%INSTALL_DIR%backend"
echo Checking: %BACKEND_PATH3%
if exist "%BACKEND_PATH3%\server.js" (
    echo ✅ Found backend server!
    echo Full path: %BACKEND_PATH3%\server.js
    echo.
    echo Starting backend server...
    start "LabFlow Backend Server" cmd /k "cd /d \"%BACKEND_PATH3%\" && echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Backend directory: %BACKEND_PATH3% && echo Press Ctrl+C to stop server && echo. && node server.js"
    timeout /t 3 /nobreak >nul
    goto :start_main_app
)

:: Backend not found
echo ⚠️  Backend server not found!
echo.
echo Searched in:
echo 1. %BACKEND_PATH1%\server.js
echo 2. %BACKEND_PATH2%\server.js  
echo 3. %BACKEND_PATH3%\server.js
echo.
echo Available directories in resources:
if exist "resources" (
    dir "resources" /b
    echo.
    if exist "resources\app" (
        echo Contents of resources\app:
        dir "resources\app" /b
    )
    if exist "resources\app.asar.unpacked" (
        echo Contents of resources\app.asar.unpacked:
        dir "resources\app.asar.unpacked" /b
    )
) else (
    echo resources directory not found!
)
echo.
echo The application will run without backend functionality.
timeout /t 5 /nobreak >nul

:start_main_app
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
