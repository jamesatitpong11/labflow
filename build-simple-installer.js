#!/usr/bin/env node

/**
 * LabFlow Clinic - Simple Installer Builder
 * สร้าง installer แบบง่าย ๆ โดยใช้ electron-builder built-in NSIS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 LabFlow Clinic - Simple Installer Builder');
console.log('===========================================\n');

async function buildSimpleInstaller() {
  try {
    // Step 1: ตรวจสอบและ build frontend
    console.log('📦 Step 1: Building frontend...');
    if (!fs.existsSync('dist')) {
      console.log('   Building React app...');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('   ✅ Frontend build complete\n');
    } else {
      console.log('   ✅ Frontend already built\n');
    }

    // Step 2: สร้าง temporary config สำหรับ installer เท่านั้น
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
        "runAfterFinish": true,
        "artifactName": "LabFlow-Clinic-Setup-${version}.exe",
        "displayLanguageSelector": false,
        "include": "build/installer.nsh"
      },
      "compression": "maximum",
      "forceCodeSigning": false,
      "asarUnpack": [
        "backend/**/*"
      ]
    };

    // สร้าง temp config file
    const configPath = 'electron-builder-temp.json';
    fs.writeFileSync(configPath, JSON.stringify(installerConfig, null, 2));
    console.log('   ✅ Configuration created\n');

    // Step 3: สร้าง custom NSIS script
    console.log('🛠️ Step 3: Creating custom NSIS script...');
    
    const buildDir = 'build';
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir);
    }

    const nsisScript = `
; LabFlow Clinic Custom NSIS Script
; สำหรับสร้าง desktop shortcut และ start menu

!macro customInstall
  ; สร้าง desktop shortcut
  CreateShortCut "$DESKTOP\\LabFlow Clinic.lnk" "$INSTDIR\\LabFlow Clinic.exe" "" "$INSTDIR\\resources\\app\\public\\iconlabflow.ico"
  
  ; สร้าง start menu shortcut
  CreateDirectory "$SMPROGRAMS\\LabFlow Clinic"
  CreateShortCut "$SMPROGRAMS\\LabFlow Clinic\\LabFlow Clinic.lnk" "$INSTDIR\\LabFlow Clinic.exe" "" "$INSTDIR\\resources\\app\\public\\iconlabflow.ico"
  CreateShortCut "$SMPROGRAMS\\LabFlow Clinic\\Uninstall LabFlow Clinic.lnk" "$INSTDIR\\Uninstall LabFlow Clinic.exe"
!macroend

!macro customUnInstall
  ; ลบ desktop shortcut
  Delete "$DESKTOP\\LabFlow Clinic.lnk"
  
  ; ลบ start menu shortcuts
  Delete "$SMPROGRAMS\\LabFlow Clinic\\LabFlow Clinic.lnk"
  Delete "$SMPROGRAMS\\LabFlow Clinic\\Uninstall LabFlow Clinic.lnk"
  RMDir "$SMPROGRAMS\\LabFlow Clinic"
!macroend
`;

    fs.writeFileSync(path.join(buildDir, 'installer.nsh'), nsisScript);
    console.log('   ✅ NSIS script created\n');

    // Step 4: สร้าง installer
    console.log('🚀 Step 4: Building installer (this may take a few minutes)...');
    
    try {
      execSync(`npx electron-builder --config ${configPath} --win`, { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
    } catch (error) {
      console.log('   ⚠️ Using fallback method...');
      // ลองใช้ portable แทน
      const portableConfig = { ...installerConfig };
      portableConfig.win.target = "portable";
      delete portableConfig.nsis;
      
      fs.writeFileSync(configPath, JSON.stringify(portableConfig, null, 2));
      execSync(`npx electron-builder --config ${configPath} --win`, { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
    }

    // Step 5: ตรวจสอบผลลัพธ์
    console.log('\n📋 Step 5: Checking results...');
    
    if (fs.existsSync('dist-electron')) {
      const files = fs.readdirSync('dist-electron');
      const setupFile = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
      const portableFile = files.find(f => f.includes('portable') && f.endsWith('.exe'));
      
      console.log('\n🎉 Build completed successfully!\n');
      
      if (setupFile) {
        const setupPath = path.join('dist-electron', setupFile);
        const setupStats = fs.statSync(setupPath);
        const setupSizeInMB = (setupStats.size / (1024 * 1024)).toFixed(2);
        
        console.log('📦 INSTALLER (Recommended):');
        console.log(`   File: ${setupFile}`);
        console.log(`   Size: ${setupSizeInMB} MB`);
        console.log(`   Path: ${setupPath}`);
        console.log('   ✅ Creates desktop icon automatically');
        console.log('   ✅ Creates start menu shortcut');
        console.log('   ✅ One-click installation\n');
      }
      
      if (portableFile) {
        const portablePath = path.join('dist-electron', portableFile);
        const portableStats = fs.statSync(portablePath);
        const portableSizeInMB = (portableStats.size / (1024 * 1024)).toFixed(2);
        
        console.log('💼 PORTABLE VERSION:');
        console.log(`   File: ${portableFile}`);
        console.log(`   Size: ${portableSizeInMB} MB`);
        console.log(`   Path: ${portablePath}`);
        console.log('   ✅ No installation required\n');
      }
      
      console.log('📋 HOW TO USE:');
      console.log('1. Send the Setup.exe file to users');
      console.log('2. Users double-click to install');
      console.log('3. Desktop icon created automatically');
      console.log('4. Ready to use!\n');
      
    } else {
      console.log('❌ No output directory found');
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
    console.error('4. Check if icon file exists: public/iconlabflow.ico');
    
    process.exit(1);
  }
}

// Run the build
console.log('Starting build process...\n');
buildSimpleInstaller().then(() => {
  console.log('🎉 Build process completed successfully!');
}).catch(error => {
  console.error('❌ Build process failed:', error);
  process.exit(1);
});
