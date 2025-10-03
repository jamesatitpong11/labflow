@echo off
title LabFlow Clinic - Final Launcher
color 0A

echo.
echo ========================================
echo    LabFlow Clinic - Final Launcher
echo ========================================
echo.

:: Get current directory and escape spaces
set "INSTALL_DIR=%~dp0"
cd /d "%INSTALL_DIR%"

echo Installation directory: %INSTALL_DIR%
echo.

:: Check if we're in the right directory
echo Checking installation...
if not exist "LabFlow Clinic.exe" (
    echo ❌ ERROR: LabFlow Clinic.exe not found!
    echo Current directory: %INSTALL_DIR%
    pause
    exit /b 1
)

echo ✅ Found LabFlow Clinic.exe
echo.

:: Look for backend server with proper path handling
echo [1/2] Looking for Backend Server...

:: Method 1: Try resources\app.asar.unpacked\backend
set "BACKEND_PATH=%INSTALL_DIR%resources\app.asar.unpacked\backend"
echo Checking: %BACKEND_PATH%
if exist "%BACKEND_PATH%\server.js" (
    echo ✅ Found backend server at: %BACKEND_PATH%
    echo Starting backend server...
    
    :: Use pushd/popd to handle paths with spaces
    pushd "%BACKEND_PATH%"
    start "LabFlow Backend Server" cmd /k "echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Backend directory: %BACKEND_PATH% && echo Press Ctrl+C to stop server && echo. && node server.js"
    popd
    
    timeout /t 3 /nobreak >nul
    goto :start_main_app
)

:: Method 2: Try resources\app\backend
set "BACKEND_PATH=%INSTALL_DIR%resources\app\backend"
echo Checking: %BACKEND_PATH%
if exist "%BACKEND_PATH%\server.js" (
    echo ✅ Found backend server at: %BACKEND_PATH%
    echo Starting backend server...
    
    pushd "%BACKEND_PATH%"
    start "LabFlow Backend Server" cmd /k "echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Backend directory: %BACKEND_PATH% && echo Press Ctrl+C to stop server && echo. && node server.js"
    popd
    
    timeout /t 3 /nobreak >nul
    goto :start_main_app
)

:: Method 3: Manual node command with full path
set "BACKEND_PATH=%INSTALL_DIR%resources\app.asar.unpacked\backend"
if exist "%BACKEND_PATH%\server.js" (
    echo ✅ Found backend, trying alternative method...
    echo Starting backend with full path...
    
    start "LabFlow Backend Server" cmd /k "echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Backend path: %BACKEND_PATH%\server.js && echo Press Ctrl+C to stop server && echo. && node \"%BACKEND_PATH%\server.js\""
    
    timeout /t 3 /nobreak >nul
    goto :start_main_app
)

:: Backend not found - show debug info
echo ⚠️  Backend server not found!
echo.
echo Debug information:
echo Install directory: %INSTALL_DIR%
echo.
echo Checking resources directory:
if exist "%INSTALL_DIR%resources" (
    echo ✅ resources directory exists
    dir "%INSTALL_DIR%resources" /b
    echo.
    
    if exist "%INSTALL_DIR%resources\app.asar.unpacked" (
        echo ✅ app.asar.unpacked exists
        dir "%INSTALL_DIR%resources\app.asar.unpacked" /b
    ) else (
        echo ❌ app.asar.unpacked not found
    )
    
    if exist "%INSTALL_DIR%resources\app" (
        echo ✅ app directory exists  
        dir "%INSTALL_DIR%resources\app" /b
    ) else (
        echo ❌ app directory not found
    )
) else (
    echo ❌ resources directory not found
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
