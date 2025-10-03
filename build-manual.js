const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 LabFlow Clinic - Manual Build Process');
console.log('=====================================\n');

async function buildManual() {
  try {
    // Step 1: Install dependencies
    console.log('📦 Step 1: Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully\n');
    } catch (error) {
      console.error('❌ Failed to install dependencies');
      throw error;
    }

    // Step 2: Install electron-reload if not exists
    console.log('🔄 Step 2: Checking electron-reload...');
    try {
      require.resolve('electron-reload');
      console.log('✅ electron-reload already installed\n');
    } catch (error) {
      console.log('📥 Installing electron-reload...');
      execSync('npm install --save-dev electron-reload@2.0.0-alpha.1', { stdio: 'inherit' });
      console.log('✅ electron-reload installed\n');
    }

    // Step 3: Build web application
    console.log('🌐 Step 3: Building web application...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Web application built successfully\n');
    } catch (error) {
      console.error('❌ Failed to build web application');
      throw error;
    }

    // Step 4: Verify Electron files
    console.log('🔍 Step 4: Verifying Electron files...');
    const electronFiles = [
      'electron/main.js',
      'electron/preload.js',
      'electron/splash.html',
      'electron/utils/printerManager.js',
      'electron/utils/systemInfo.js'
    ];

    let allFilesExist = true;
    electronFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ❌ ${file} - Missing!`);
        allFilesExist = false;
      }
    });

    if (!allFilesExist) {
      throw new Error('Some Electron files are missing');
    }
    console.log('✅ All Electron files verified\n');

    // Step 5: Create assets directory if not exists
    console.log('📁 Step 5: Checking assets directory...');
    const assetsDir = path.join(__dirname, 'electron', 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
      console.log('✅ Assets directory created');
    } else {
      console.log('✅ Assets directory exists');
    }

    // Create a simple icon if not exists
    const iconPath = path.join(assetsDir, 'icon.png');
    if (!fs.existsSync(iconPath)) {
      console.log('🎨 Creating placeholder icon...');
      // Create a simple text file as placeholder
      fs.writeFileSync(iconPath, 'PNG placeholder - Replace with actual icon');
      console.log('✅ Placeholder icon created');
    }
    console.log();

    // Step 6: Test Electron app
    console.log('🧪 Step 6: Testing Electron application...');
    console.log('   You can now run the following commands:');
    console.log('   - Development: npm run electron:dev');
    console.log('   - Production build: npm run build:electron');
    console.log('   - Portable build: npm run build:portable');
    console.log();

    // Step 7: Display system information
    console.log('💻 Step 7: System Information');
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Architecture: ${process.arch}`);
    console.log(`   Node.js: ${process.version}`);
    
    try {
      const electronVersion = require('electron/package.json').version;
      console.log(`   Electron: ${electronVersion}`);
    } catch (error) {
      console.log('   Electron: Not found in node_modules');
    }
    console.log();

    // Step 8: Backend check
    console.log('🔧 Step 8: Backend verification...');
    const backendPath = path.join(__dirname, 'backend', 'server.js');
    if (fs.existsSync(backendPath)) {
      console.log('✅ Backend server found');
      console.log('   You can start the backend with: cd backend && npm start');
    } else {
      console.log('❌ Backend server not found');
    }
    console.log();

    console.log('🎉 Manual build process completed successfully!');
    console.log('=====================================');
    console.log('Next steps:');
    console.log('1. Replace electron/assets/icon.png with your actual icon');
    console.log('2. Start backend server: cd backend && npm start');
    console.log('3. Run Electron app: npm run electron:dev');
    console.log('4. For production: npm run build:electron');

  } catch (error) {
    console.error('\n❌ Build process failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Ensure Node.js is installed (version 16+)');
    console.log('- Check internet connection for package downloads');
    console.log('- Verify all source files are present');
    console.log('- Try running: npm cache clean --force');
    process.exit(1);
  }
}

// Run the build process
buildManual();
