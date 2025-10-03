@echo off
title LabFlow Clinic - Smart Launcher
color 0A

echo.
echo ========================================
echo    LabFlow Clinic - Smart Launcher
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
    echo Current directory: %INSTALL_DIR%
    pause
    exit /b 1
)

echo ✅ Found LabFlow Clinic.exe
echo.

:: Look for backend server
echo [1/3] Looking for Backend Server...

set "BACKEND_PATH=%INSTALL_DIR%resources\app.asar.unpacked\backend"
if exist "%BACKEND_PATH%\server.js" (
    echo ✅ Found backend server at: %BACKEND_PATH%
    
    :: Check if node_modules exists
    if exist "%BACKEND_PATH%\node_modules" (
        echo ✅ node_modules found
    ) else (
        echo ⚠️  node_modules not found, installing dependencies...
        pushd "%BACKEND_PATH%"
        
        :: Check if package.json exists
        if exist "package.json" (
            echo Installing npm packages...
            npm install --production --silent
            if %errorlevel% neq 0 (
                echo ❌ npm install failed!
                echo Trying alternative method...
                
                :: Try copying from development
                if exist "%INSTALL_DIR%..\..\..\..\Desktop\labflow2\backend\node_modules" (
                    echo Copying node_modules from development...
                    xcopy "%INSTALL_DIR%..\..\..\..\Desktop\labflow2\backend\node_modules" "node_modules" /E /I /Q
                )
            ) else (
                echo ✅ Dependencies installed successfully
            )
        ) else (
            echo ❌ package.json not found in backend directory
        )
        
        popd
    )
    
    echo [2/3] Starting Backend Server...
    pushd "%BACKEND_PATH%"
    start "LabFlow Backend Server" cmd /k "echo. && echo ========================================== && echo    LabFlow Backend Server && echo ========================================== && echo. && echo Server running on: http://localhost:3001 && echo Backend directory: %BACKEND_PATH% && echo Press Ctrl+C to stop server && echo. && node server.js"
    popd
    
    timeout /t 3 /nobreak >nul
) else (
    echo ❌ Backend server not found!
    echo Searched in: %BACKEND_PATH%
    echo.
    echo Available directories:
    if exist "%INSTALL_DIR%resources" (
        dir "%INSTALL_DIR%resources" /b
    )
    echo.
    echo The application will run without backend functionality.
    timeout /t 3 /nobreak >nul
)

echo [3/3] Starting Main Application...
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
