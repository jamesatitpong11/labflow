#!/usr/bin/env node

/**
 * LabFlow Clinic - Installer with Batch Launcher
 * สร้าง installer พร้อม batch script สำหรับรัน backend แยก
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 LabFlow Clinic - Installer with Launcher Builder');
console.log('==================================================\n');

async function buildInstallerWithLauncher() {
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

    // Step 2: Create installer configuration
    console.log('🔧 Step 2: Creating installer configuration...');
    
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
        "start-labflow-production.bat",
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
        "createDesktopShortcut": false, // We'll create custom shortcut
        "createStartMenuShortcut": true,
        "shortcutName": "LabFlow Clinic",
        "allowElevation": true,
        "installerIcon": "public/iconlabflow.ico",
        "uninstallerIcon": "public/iconlabflow.ico",
        "installerHeaderIcon": "public/iconlabflow.ico",
        "deleteAppDataOnUninstall": false,
        "runAfterFinish": false, // Don't run immediately
        "artifactName": "LabFlow-Clinic-Setup-${version}.exe",
        "displayLanguageSelector": false,
        "include": "build/installer-with-launcher.nsh"
      },
      "compression": "maximum",
      "forceCodeSigning": false,
      "asarUnpack": [
        "backend/**/*"
      ]
    };

    // Create temp config file
    const configPath = 'electron-builder-temp.json';
    fs.writeFileSync(configPath, JSON.stringify(installerConfig, null, 2));
    console.log('   ✅ Configuration created\n');

    // Step 3: Create custom NSIS script
    console.log('🛠️ Step 3: Creating custom NSIS script...');
    
    const buildDir = 'build';
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir);
    }

    const nsisScript = `
; LabFlow Clinic Custom NSIS Script with Launcher
; สร้าง desktop shortcut ที่ใช้ batch launcher

!macro customInstall
  ; Create the launcher batch file in install directory
  FileOpen $0 "$INSTDIR\\Start-LabFlow.bat" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "title LabFlow Clinic Launcher$\r$\n"
  FileWrite $0 "color 0A$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "echo ========================================$\r$\n"
  FileWrite $0 "echo    LabFlow Clinic - Starting System$\r$\n"
  FileWrite $0 "echo ========================================$\r$\n"
  FileWrite $0 "echo.$\r$\n"
  FileWrite $0 "set INSTALL_DIR=%~dp0$\r$\n"
  FileWrite $0 "cd /d %INSTALL_DIR%$\r$\n"
  FileWrite $0 "echo [1/2] Starting Backend Server...$\r$\n"
  FileWrite $0 "if exist resources\\app.asar.unpacked\\backend\\server.js ($\r$\n"
  FileWrite $0 "  start $\"LabFlow Backend$\" cmd /k $\"cd /d %INSTALL_DIR%resources\\app.asar.unpacked\\backend && echo LabFlow Backend Server && echo Running on http://localhost:3001 && node server.js$\"$\r$\n"
  FileWrite $0 "  timeout /t 3 /nobreak >nul$\r$\n"
  FileWrite $0 ")$\r$\n"
  FileWrite $0 "echo [2/2] Starting Main Application...$\r$\n"
  FileWrite $0 "start $\"$\" $\"LabFlow Clinic.exe$\"$\r$\n"
  FileWrite $0 "echo LabFlow Clinic Started Successfully!$\r$\n"
  FileWrite $0 "timeout /t 3 /nobreak >nul$\r$\n"
  FileWrite $0 "exit$\r$\n"
  FileClose $0
  
  ; Create desktop shortcut to our created batch file
  CreateShortCut "$DESKTOP\\LabFlow Clinic.lnk" "$INSTDIR\\Start-LabFlow.bat" "" "$INSTDIR\\resources\\app\\public\\iconlabflow.ico" 0 SW_SHOWMINIMIZED
  
  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\\LabFlow Clinic"
  CreateShortCut "$SMPROGRAMS\\LabFlow Clinic\\LabFlow Clinic.lnk" "$INSTDIR\\Start-LabFlow.bat" "" "$INSTDIR\\resources\\app\\public\\iconlabflow.ico" 0 SW_SHOWMINIMIZED
  CreateShortCut "$SMPROGRAMS\\LabFlow Clinic\\LabFlow Clinic (Direct).lnk" "$INSTDIR\\LabFlow Clinic.exe" "" "$INSTDIR\\resources\\app\\public\\iconlabflow.ico"
  CreateShortCut "$SMPROGRAMS\\LabFlow Clinic\\Uninstall LabFlow Clinic.lnk" "$INSTDIR\\Uninstall LabFlow Clinic.exe"
!macroend

!macro customUnInstall
  ; Remove desktop shortcut
  Delete "$DESKTOP\\LabFlow Clinic.lnk"
  
  ; Remove start menu shortcuts
  Delete "$SMPROGRAMS\\LabFlow Clinic\\LabFlow Clinic.lnk"
  Delete "$SMPROGRAMS\\LabFlow Clinic\\LabFlow Clinic (Direct).lnk"
  Delete "$SMPROGRAMS\\LabFlow Clinic\\Uninstall LabFlow Clinic.lnk"
  RMDir "$SMPROGRAMS\\LabFlow Clinic"
  
  ; Remove created batch file
  Delete "$INSTDIR\\Start-LabFlow.bat"
!macroend
`;

    fs.writeFileSync(path.join(buildDir, 'installer-with-launcher.nsh'), nsisScript);
    console.log('   ✅ NSIS script created\n');

    // Step 4: Build installer
    console.log('🚀 Step 4: Building installer (this may take a few minutes)...');
    
    execSync(`npx electron-builder --config ${configPath} --win`, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Step 5: Check results
    console.log('\n📋 Step 5: Checking results...');
    
    if (fs.existsSync('dist-electron')) {
      const files = fs.readdirSync('dist-electron');
      const setupFile = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
      
      if (setupFile) {
        const setupPath = path.join('dist-electron', setupFile);
        const setupStats = fs.statSync(setupPath);
        const setupSizeInMB = (setupStats.size / (1024 * 1024)).toFixed(2);
        
        console.log('\n🎉 Build completed successfully!\n');
        console.log('📦 INSTALLER WITH LAUNCHER:');
        console.log(`   File: ${setupFile}`);
        console.log(`   Size: ${setupSizeInMB} MB`);
        console.log(`   Path: ${setupPath}`);
        console.log('   ✅ Creates desktop shortcut with launcher');
        console.log('   ✅ Backend runs in separate CMD window');
        console.log('   ✅ Both programs visible to user\n');
        
        console.log('📋 HOW IT WORKS:');
        console.log('1. User clicks desktop icon');
        console.log('2. Launcher starts backend in CMD window');
        console.log('3. Main application starts after backend');
        console.log('4. Both windows are visible');
        console.log('5. User can monitor both processes\n');
        
        console.log('📋 SHORTCUTS CREATED:');
        console.log('• Desktop: LabFlow Clinic (uses launcher)');
        console.log('• Start Menu: LabFlow Clinic (uses launcher)');
        console.log('• Start Menu: LabFlow Clinic (Direct) - bypasses launcher');
        console.log('• Start Menu: Backend Server Only - just backend\n');
        
      }
    }

    // Clean up
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    
    // Clean up on error
    const configPath = 'electron-builder-temp.json';
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure Node.js version >= 16');
    console.error('2. Try: npm install');
    console.error('3. Try: npm run build');
    console.error('4. Check if batch files exist');
    
    process.exit(1);
  }
}

// Run the build
console.log('Starting build process...\n');
buildInstallerWithLauncher().then(() => {
  console.log('🎉 Build process completed successfully!');
}).catch(error => {
  console.error('❌ Build process failed:', error);
  process.exit(1);
});
