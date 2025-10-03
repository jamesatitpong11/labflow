#!/usr/bin/env node

/**
 * Simple LabFlow Clinic Installer Creator
 * สร้างไฟล์ installer .exe แบบง่าย
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 สร้าง LabFlow Clinic Installer\n');

try {
  // 1. Check if build exists
  if (!fs.existsSync('dist')) {
    console.log('📦 Building frontend...');
    execSync('npm run build', { stdio: 'inherit' });
  }

  // 2. Create installer using electron-builder
  console.log('🔨 Creating installer...');
  
  const builderConfig = {
    "appId": "com.labflow.clinic",
    "productName": "LabFlow Clinic",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "public/iconlabflow.ico"
    ],
    "win": {
      "target": "nsis",
      "icon": "public/iconlabflow.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "LabFlow Clinic",
      "artifactName": "LabFlow-Clinic-Setup-${version}.exe"
    }
  };

  // Write temporary config
  fs.writeFileSync('electron-builder-temp.json', JSON.stringify(builderConfig, null, 2));

  // Run electron-builder with config
  execSync(`npx electron-builder --config electron-builder-temp.json --win`, { stdio: 'inherit' });

  // Clean up temp config
  if (fs.existsSync('electron-builder-temp.json')) {
    fs.unlinkSync('electron-builder-temp.json');
  }

  // Check results
  if (fs.existsSync('dist-electron')) {
    const files = fs.readdirSync('dist-electron');
    const installer = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
    
    if (installer) {
      const installerPath = path.join('dist-electron', installer);
      const stats = fs.statSync(installerPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('\n✅ สร้าง installer สำเร็จ!');
      console.log(`📁 ไฟล์: ${installer}`);
      console.log(`📊 ขนาด: ${sizeInMB} MB`);
      console.log(`📂 ตำแหน่ง: ${installerPath}`);
      
      console.log('\n📋 วิธีใช้งาน:');
      console.log('1. ส่งไฟล์ installer ให้ผู้ใช้');
      console.log('2. ผู้ใช้ดับเบิลคลิกเพื่อติดตั้ง');
      console.log('3. โปรแกรมจะสร้าง desktop icon อัตโนมัติ');
      console.log('4. เสร็จ! พร้อมใช้งาน');
    }
  }

} catch (error) {
  console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
  
  // Clean up on error
  if (fs.existsSync('electron-builder-temp.json')) {
    fs.unlinkSync('electron-builder-temp.json');
  }
  
  process.exit(1);
}

console.log('\n🎉 เสร็จสิ้น!');
