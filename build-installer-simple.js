#!/usr/bin/env node

/**
 * LabFlow Clinic - Simple Installer Builder
 * สร้าง installer แบบง่าย ๆ กดติดตั้งครั้งเดียว
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 LabFlow Clinic - Installer Builder');
console.log('=====================================\n');

async function buildInstaller() {
  try {
    // Step 1: Build frontend if needed
    console.log('📦 Step 1: Building frontend...');
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Frontend build complete\n');
    } else {
      console.log('✅ Frontend already built\n');
    }

    // Step 2: Create installer
    console.log('🔨 Step 2: Creating Windows installer...');
    
    // Use the existing package.json configuration
    execSync('npx electron-builder --win --x64', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    // Step 3: Check results
    console.log('\n📋 Step 3: Checking results...');
    
    if (fs.existsSync('dist-electron')) {
      const files = fs.readdirSync('dist-electron');
      const setupFile = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
      const portableFile = files.find(f => f.includes('portable') && f.endsWith('.exe'));
      
      console.log('\n🎉 สร้าง installer สำเร็จ!\n');
      
      if (setupFile) {
        const setupPath = path.join('dist-electron', setupFile);
        const setupStats = fs.statSync(setupPath);
        const setupSizeInMB = (setupStats.size / (1024 * 1024)).toFixed(2);
        
        console.log('📦 Setup Installer:');
        console.log(`   ไฟล์: ${setupFile}`);
        console.log(`   ขนาด: ${setupSizeInMB} MB`);
        console.log(`   ตำแหน่ง: ${setupPath}`);
        console.log('   ✅ สร้าง desktop shortcut อัตโนมัติ');
        console.log('   ✅ สร้าง start menu shortcut อัตโนมัติ\n');
      }
      
      if (portableFile) {
        const portablePath = path.join('dist-electron', portableFile);
        const portableStats = fs.statSync(portablePath);
        const portableSizeInMB = (portableStats.size / (1024 * 1024)).toFixed(2);
        
        console.log('💼 Portable Version:');
        console.log(`   ไฟล์: ${portableFile}`);
        console.log(`   ขนาด: ${portableSizeInMB} MB`);
        console.log(`   ตำแหน่ง: ${portablePath}`);
        console.log('   ✅ ไม่ต้องติดตั้ง รันได้เลย\n');
      }
      
      console.log('📋 วิธีใช้งาน Setup Installer:');
      console.log('1. ส่งไฟล์ Setup.exe ให้ผู้ใช้');
      console.log('2. ผู้ใช้ดับเบิลคลิก Setup.exe');
      console.log('3. เลือกโฟลเดอร์ติดตั้ง (หรือใช้ default)');
      console.log('4. กด Install');
      console.log('5. โปรแกรมจะสร้าง desktop icon และ start menu');
      console.log('6. เสร็จ! พร้อมใช้งาน\n');
      
      console.log('📋 วิธีใช้งาน Portable:');
      console.log('1. ส่งไฟล์ portable.exe ให้ผู้ใช้');
      console.log('2. ผู้ใช้ดับเบิลคลิกเพื่อรันได้เลย');
      console.log('3. ไม่ต้องติดตั้ง ไม่ทิ้งไฟล์ในระบบ\n');
      
    } else {
      console.log('❌ ไม่พบโฟลเดอร์ dist-electron');
    }

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
    console.error('\n💡 แนะนำการแก้ไข:');
    console.error('1. ตรวจสอบว่าติดตั้ง electron-builder แล้ว: npm install electron-builder');
    console.error('2. ตรวจสอบว่ามีไฟล์ icon: public/iconlabflow.ico');
    console.error('3. ลองรัน: npm run build ก่อน');
    console.error('4. ตรวจสอบ Node.js version >= 16');
    
    process.exit(1);
  }
}

// Run the build
buildInstaller().then(() => {
  console.log('🎉 เสร็จสิ้นการสร้าง installer!');
}).catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
