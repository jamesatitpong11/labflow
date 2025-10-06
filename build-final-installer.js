#!/usr/bin/env node

/**
 * LabFlow Clinic - Final Installer Builder
 * สร้าง installer แบบง่าย พร้อม batch launcher
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 LabFlow Clinic - Final Installer Builder');
console.log('==========================================\n');

async function buildFinalInstaller() {
  try {
    // Step 1: Build frontend if needed
    console.log('📦 Step 1: Building frontend...');
    if (!fs.existsSync('dist')) {
      console.log('   Building React app...');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('   ✅ Frontend build complete\n');
    } else {
      console.log('   ✅ Frontend already built\n');
    }

    // Step 2: Check launcher batch files
    console.log('🔧 Step 2: Checking launcher batch files...');
    
    // Copy LabFlow-Smart-Launcher.bat if it exists
    if (fs.existsSync('LabFlow-Smart-Launcher.bat')) {
      console.log('   ✅ LabFlow-Smart-Launcher.bat found');
    } else {
      console.log('   ⚠️  LabFlow-Smart-Launcher.bat not found');
    }
    
    if (!fs.existsSync('LabFlow-Launcher.bat')) {
      console.log('   Creating launcher batch file...');
      const launcherContent = `@echo off
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
if exist "resources\\app.asar.unpacked\\backend\\server.js" (
    echo Found backend server, starting...
    start "LabFlow Backend Server" cmd /k "cd /d \"%INSTALL_DIR%resources\\app.asar.unpacked\\backend\" && echo LabFlow Backend Server && echo Running on http://localhost:3001 && echo. && node server.js"
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
exit`;

      fs.writeFileSync('LabFlow-Launcher.bat', launcherContent);
    }
    console.log('   ✅ Launcher batch file ready\n');

    // Step 3: Create installer configuration
    console.log('🔧 Step 3: Creating installer configuration...');
    
    const installerConfig = {
      "appId": "com.labflow.clinic",
      "productName": "LabFlow Clinic",
      "directories": {
        "output": "dist-electron"
      },
      "files": [
        "dist/**/*",
        "electron/**/*",
        "backend/**/*",
        "LabFlow-Launcher.bat",
        "LabFlow-Smart-Launcher.bat",
        "public/iconlabflow.ico",
        "node_modules/**/*",
        "!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
        "!node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
        "!node_modules/*.d.ts",
        "!node_modules/.bin",
        "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
        "!.editorconfig",
        "!**/._*",
        "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
        "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
        "!**/{appveyor.yml,.travis.yml,circle.yml}",
        "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
      ],
      "win": {
        "target": "nsis",
        "icon": "public/iconlabflow.ico",
        "requestedExecutionLevel": "asInvoker"
      },
      "nsis": {
        "oneClick": false,
        "allowToChangeInstallationDirectory": true,
        "createDesktopShortcut": true,
        "createStartMenuShortcut": true,
        "shortcutName": "LabFlow Clinic",
        "allowElevation": true,
        "installerIcon": "public/iconlabflow.ico",
        "uninstallerIcon": "public/iconlabflow.ico",
        "installerHeaderIcon": "public/iconlabflow.ico",
        "deleteAppDataOnUninstall": false,
        "runAfterFinish": false,
        "artifactName": "LabFlow-Clinic-Setup-${version}.exe",
        "displayLanguageSelector": false
      },
      "compression": "maximum",
      "forceCodeSigning": false,
      "asarUnpack": [
        "backend/**/*",
        "node_modules/**/*"
      ]
    };

    // Create temp config file
    const configPath = 'electron-builder-temp.json';
    fs.writeFileSync(configPath, JSON.stringify(installerConfig, null, 2));
    console.log('   ✅ Configuration created\n');

    // Step 4: Build installer
    console.log('🚀 Step 4: Building installer (this may take a few minutes)...');
    
    execSync(`npx electron-builder --config ${configPath} --win`, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Step 5: Create manual shortcut instructions
    console.log('\n📋 Step 5: Creating manual shortcut...');
    
    const shortcutInstructions = `# LabFlow Clinic - Manual Shortcut Setup

## After Installation:

### Option 1: Smart Launcher (Recommended)
1. Navigate to installation directory (usually C:\\Program Files\\LabFlow Clinic\\)
2. Find "LabFlow-Smart-Launcher.bat" file
3. Right-click on "LabFlow-Smart-Launcher.bat"
4. Select "Create shortcut"
5. Drag the shortcut to Desktop
6. Rename to "LabFlow Clinic"
7. Right-click shortcut → Properties → Change Icon
8. Browse to: resources\\app\\public\\iconlabflow.ico

### Option 2: Basic Launcher
1. Navigate to installation directory (usually C:\\Program Files\\LabFlow Clinic\\)
2. Find "LabFlow-Launcher.bat" file
3. Right-click on "LabFlow-Launcher.bat"
4. Select "Create shortcut"
5. Drag the shortcut to Desktop
6. Rename to "LabFlow Clinic"
7. Right-click shortcut → Properties → Change Icon
8. Browse to: resources\\app\\public\\iconlabflow.ico

## Usage:
- Double-click the desktop shortcut
- Backend will start in CMD window
- Main application will start automatically
- Both programs will be visible

## Troubleshooting:
- If backend doesn't start, check Node.js installation
- If main app doesn't start, run "LabFlow Clinic.exe" directly
- Check Windows Defender/Antivirus settings
`;

    fs.writeFileSync('SHORTCUT_SETUP.md', shortcutInstructions);

    // Step 6: Check results
    console.log('\n📋 Step 6: Checking results...');
    
    if (fs.existsSync('dist-electron')) {
      const files = fs.readdirSync('dist-electron');
      const setupFile = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
      
      if (setupFile) {
        const setupPath = path.join('dist-electron', setupFile);
        const setupStats = fs.statSync(setupPath);
        const setupSizeInMB = (setupStats.size / (1024 * 1024)).toFixed(2);
        
        console.log('\n🎉 Build completed successfully!\n');
        console.log('📦 INSTALLER:');
        console.log(`   File: ${setupFile}`);
        console.log(`   Size: ${setupSizeInMB} MB`);
        console.log(`   Path: ${setupPath}`);
        console.log('   ✅ Includes LabFlow-Launcher.bat');
        console.log('   ✅ Includes LabFlow-Smart-Launcher.bat');
        console.log('   ✅ Includes iconlabflow.ico');
        console.log('   ✅ Creates desktop shortcut to main exe\n');
        
        console.log('📋 POST-INSTALLATION STEPS:');
        console.log('1. Install the .exe file normally');
        console.log('2. Go to installation directory');
        console.log('3. Create shortcut from "LabFlow-Launcher.bat"');
        console.log('4. Move shortcut to desktop');
        console.log('5. Use the launcher shortcut instead of main exe\n');
        
        console.log('📋 HOW IT WORKS:');
        console.log('• Launcher starts backend in CMD window');
        console.log('• Main application starts after backend');
        console.log('• Both programs visible to user');
        console.log('• User can monitor both processes\n');
        
        console.log('📄 INSTRUCTIONS: See SHORTCUT_SETUP.md for detailed steps\n');
      }
    }

    // Clean up
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    // Keep LabFlow-Launcher.bat for future builds

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    
    // Clean up on error
    const configPath = 'electron-builder-temp.json';
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    // Keep LabFlow-Launcher.bat even on error
    
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure Node.js version >= 16');
    console.error('2. Try: npm install');
    console.error('3. Try: npm run build');
    console.error('4. Check Windows Defender settings');
    
    process.exit(1);
  }
}

// Run the build
console.log('Starting build process...\n');
buildFinalInstaller().then(() => {
  console.log('🎉 Build process completed successfully!');
}).catch(error => {
  console.error('❌ Build process failed:', error);
  process.exit(1);
});
