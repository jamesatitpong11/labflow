#!/usr/bin/env node

/**
 * LabFlow Clinic Installer Builder
 * สร้างไฟล์ installer .exe แบบอัตโนมัติ
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 กำลังสร้าง LabFlow Clinic Installer...\n');

// ตรวจสอบไฟล์ที่จำเป็น
const requiredFiles = [
  'public/iconlabflow.ico',
  'build/installer.nsh',
  'package.json'
];

console.log('📋 ตรวจสอบไฟล์ที่จำเป็น...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ ไม่พบไฟล์: ${file}`);
    process.exit(1);
  }
  console.log(`✅ ${file}`);
}

try {
  // 1. Clean previous builds
  console.log('\n🧹 ล้างไฟล์ build เก่า...');
  if (fs.existsSync('dist')) {
    execSync('rmdir /s /q dist', { stdio: 'inherit' });
  }
  if (fs.existsSync('dist-electron')) {
    execSync('rmdir /s /q dist-electron', { stdio: 'inherit' });
  }

  // 2. Install dependencies
  console.log('\n📦 ตรวจสอบ dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // 3. Build frontend
  console.log('\n🏗️ กำลัง build frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // 4. Build installer
  console.log('\n📦 กำลังสร้าง installer...');
  execSync('npx electron-builder --win --x64', { stdio: 'inherit' });

  // 5. Check output files
  console.log('\n📁 ตรวจสอบไฟล์ที่สร้างขึ้น...');
  const distDir = 'dist-electron';
  
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    console.log('\n✅ ไฟล์ที่สร้างสำเร็จ:');
    
    files.forEach(file => {
      const filePath = path.join(distDir, file);
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      if (file.includes('Setup')) {
        console.log(`🎯 ${file} (${sizeInMB} MB) - INSTALLER`);
      } else if (file.includes('portable')) {
        console.log(`📱 ${file} (${sizeInMB} MB) - PORTABLE`);
      } else {
        console.log(`📄 ${file} (${sizeInMB} MB)`);
      }
    });

    // Find installer file
    const installerFile = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
    if (installerFile) {
      console.log(`\n🎉 สร้าง installer สำเร็จ!`);
      console.log(`📂 ไฟล์: ${path.join(distDir, installerFile)}`);
      console.log(`\n📋 คำแนะนำการใช้งาน:`);
      console.log(`1. ส่งไฟล์ ${installerFile} ให้ผู้ใช้`);
      console.log(`2. ผู้ใช้ดับเบิลคลิกเพื่อติดตั้ง`);
      console.log(`3. โปรแกรมจะสร้าง desktop icon อัตโนมัติ`);
      console.log(`4. ไม่ต้องติดตั้งอะไรเพิ่มเติม`);
    }
  } else {
    console.error('❌ ไม่พบโฟลเดอร์ dist-electron');
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
  console.log('\n🔧 วิธีแก้ไขปัญหา:');
  console.log('1. ตรวจสอบว่าติดตั้ง Node.js และ npm แล้ว');
  console.log('2. รัน npm install ก่อน');
  console.log('3. ตรวจสอบว่ามี icon file ใน public/iconlabflow.ico');
  console.log('4. ลองรัน npm run build ก่อนแยก');
  process.exit(1);
}

console.log('\n🎊 เสร็จสิ้นการสร้าง installer!');
