const { build } = require('electron-builder');
const path = require('path');
const fs = require('fs');

async function createPortable() {
  console.log('🚀 Starting portable build process...');
  
  try {
    // Ensure dist directory exists
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      console.log('📁 Building web application first...');
      const { spawn } = require('child_process');
      
      await new Promise((resolve, reject) => {
        const buildProcess = spawn('npm', ['run', 'build'], { 
          stdio: 'inherit',
          shell: true 
        });
        
        buildProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Build process failed with code ${code}`));
          }
        });
      });
    }

    // Build portable executable
    console.log('📦 Creating portable executable...');
    
    const config = {
      appId: 'com.labflow.clinic',
      productName: 'LabFlow Clinic',
      directories: {
        output: 'dist-electron'
      },
      files: [
        'dist/**/*',
        'electron/**/*',
        'node_modules/**/*',
        '!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
        '!node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
        '!node_modules/*.d.ts',
        '!node_modules/.bin',
        '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
        '!.editorconfig',
        '!**/._*',
        '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
        '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
        '!**/{appveyor.yml,.travis.yml,circle.yml}',
        '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
      ],
      win: {
        target: [
          {
            target: 'portable',
            arch: ['x64']
          }
        ],
        icon: 'electron/assets/icon.png',
        requestedExecutionLevel: 'asInvoker',
        sign: null,
        verifyUpdateCodeSignature: false
      },
      portable: {
        artifactName: 'LabFlow-Clinic-${version}-portable.exe',
        requestExecutionLevel: 'user',
        unpackDirName: 'LabFlowClinic'
      },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'LabFlow Clinic',
        allowElevation: false,
        installerIcon: 'electron/assets/icon.png',
        uninstallerIcon: 'electron/assets/icon.png',
        installerHeaderIcon: 'electron/assets/icon.png'
      },
      mac: {
        target: [
          {
            target: 'dmg',
            arch: ['x64', 'arm64']
          }
        ],
        icon: 'electron/assets/icon.png',
        category: 'public.app-category.medical'
      },
      linux: {
        target: [
          {
            target: 'AppImage',
            arch: ['x64']
          }
        ],
        icon: 'electron/assets/icon.png',
        category: 'Office'
      },
      compression: 'maximum',
      forceCodeSigning: false,
      buildVersion: '1.0.0'
    };

    await build({
      targets: process.platform === 'win32' 
        ? [{ platform: 'win32', arch: 'x64' }]
        : process.platform === 'darwin'
        ? [{ platform: 'darwin', arch: 'x64' }]
        : [{ platform: 'linux', arch: 'x64' }],
      config
    });

    console.log('✅ Portable build completed successfully!');
    console.log('📁 Output directory: dist-electron/');
    
    // List created files
    const outputDir = path.join(__dirname, 'dist-electron');
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      console.log('\n📋 Created files:');
      files.forEach(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   ${file} (${sizeInMB} MB)`);
      });
    }

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createPortable();
}

module.exports = createPortable;
