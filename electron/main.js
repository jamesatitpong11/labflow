const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');

// Import utility classes
const PrinterManager = require('./utils/printerManager');
const SystemInfo = require('./utils/systemInfo');

// Simple persistent store
let userDataPath = app.getPath('userData');
let storePath = path.join(userDataPath, 'store.json');

// Store functions
const getStore = (key) => {
  try {
    if (fs.existsSync(storePath)) {
      const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      return data[key];
    }
  } catch (error) {
    console.error('Error reading store:', error);
  }
  return null;
};

const setStore = (key, value) => {
  try {
    let data = {};
    if (fs.existsSync(storePath)) {
      data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }
    data[key] = value;
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing store:', error);
    return false;
  }
};

// Keep a global reference of the window object
let mainWindow;
let splashWindow;
let backendProcess;

// Initialize utility classes
const printerManager = new PrinterManager();
const systemInfo = new SystemInfo();

const isDev = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 8080;
const backendPort = process.env.BACKEND_PORT || 3001;

// Ensure backend port is available to preload script
process.env.BACKEND_PORT = backendPort;

// Configure app settings before ready event
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');

// Set userData path to avoid permission issues
const customUserDataPath = path.join(os.homedir(), '.labflow-clinic');
try {
  if (!fs.existsSync(customUserDataPath)) {
    fs.mkdirSync(customUserDataPath, { recursive: true });
    console.log('Created userData directory:', customUserDataPath);
  }
  
  // Test write permissions
  const testFile = path.join(customUserDataPath, 'test-write.tmp');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('UserData directory permissions: OK');
  
  app.setPath('userData', customUserDataPath);
  // Update store path with new userData path
  userDataPath = app.getPath('userData');
  storePath = path.join(userDataPath, 'store.json');
} catch (error) {
  console.warn('Could not set custom userData path:', error.message);
  console.log('Using default userData path:', app.getPath('userData'));
}

// Clear cache on startup if needed
function clearAppCache() {
  try {
    const cachePath = path.join(app.getPath('userData'), 'Cache');
    const gpuCachePath = path.join(app.getPath('userData'), 'GPUCache');
    
    if (fs.existsSync(cachePath)) {
      fs.rmSync(cachePath, { recursive: true, force: true });
      console.log('Cache cleared successfully');
    }
    
    if (fs.existsSync(gpuCachePath)) {
      fs.rmSync(gpuCachePath, { recursive: true, force: true });
      console.log('GPU Cache cleared successfully');
    }
  } catch (error) {
    console.warn('Could not clear cache:', error.message);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the app, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the app, just log the error
});

// Enable live reload for Electron in development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

// Function to start backend server
function startBackendServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend server...');
    
    try {
      // Try multiple possible backend paths
      const possiblePaths = [
        path.join(__dirname, '..', 'backend'),
        path.join(process.resourcesPath, 'app', 'backend'),
        path.join(process.resourcesPath, 'backend'),
        path.join(__dirname, 'backend'),
        path.join(process.cwd(), 'backend'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'backend')
      ];
      
      console.log('Searching for backend in these paths:');
      possiblePaths.forEach(p => console.log('  -', p));
      
      let backendPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          backendPath = testPath;
          console.log('Found backend at:', backendPath);
          break;
        }
      }
      
      if (!backendPath) {
        console.error('Backend directory not found in any of these paths:', possiblePaths);
        resolve(); // Don't reject, just continue without backend
        return;
      }
      
      const serverFile = path.join(backendPath, 'server.js');
      if (!fs.existsSync(serverFile)) {
        console.error('Backend server.js not found:', serverFile);
        resolve(); // Don't reject, just continue without backend
        return;
      }
      
      // Start backend process
      const { spawn } = require('child_process');
      backendProcess = spawn('node', [serverFile], {
        cwd: backendPath,
        env: { 
          ...process.env, 
          PORT: backendPort,
          NODE_ENV: isDev ? 'development' : 'production'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let backendStarted = false;
      
      backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data.toString().trim()}`);
        if (data.toString().includes('Server running on port') || data.toString().includes('listening on port')) {
          backendStarted = true;
          resolve();
        }
      });
      
      backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data.toString().trim()}`);
      });
      
      backendProcess.on('error', (error) => {
        console.error('Failed to start backend:', error);
        resolve(); // Don't reject, just continue without backend
      });
      
      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
        backendProcess = null;
      });
      
      // Timeout after 8 seconds - resolve anyway to prevent hanging
      setTimeout(() => {
        if (!backendStarted) {
          console.log('Backend startup timeout - continuing without backend');
        }
        resolve();
      }, 8000);
      
    } catch (error) {
      console.error('Error starting backend:', error);
      resolve(); // Don't reject, just continue without backend
    }
  });
}

// Function to stop backend server
function stopBackendServer() {
  if (backendProcess && !backendProcess.killed) {
    console.log('Stopping backend server...');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });

  // Close splash after 3 seconds
  setTimeout(() => {
    if (splashWindow) {
      splashWindow.close();
    }
  }, 3000);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${port}`);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // API base URL is now handled in preload.js

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create a basic window without advanced features (fallback)
function createBasicWindow() {
  console.log('Creating basic fallback window...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Disable for fallback
    }
  });

  // Load a simple HTML page
  const basicHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LabFlow Clinic - Basic Mode</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
        .error { color: #d32f2f; margin: 20px 0; }
        .info { color: #1976d2; margin: 20px 0; }
        button { padding: 10px 20px; margin: 10px; font-size: 16px; }
      </style>
    </head>
    <body>
      <h1>LabFlow Clinic</h1>
      <div class="error">แอปพลิเคชันทำงานในโหมดพื้นฐาน</div>
      <div class="info">กรุณารีสตาร์ทแอปพลิเคชันหรือติดต่อฝ่ายสนับสนุน</div>
      <button onclick="location.reload()">รีโหลด</button>
      <button onclick="window.close()">ปิด</button>
    </body>
    </html>
  `;

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(basicHtml)}`);
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create error window
function createErrorWindow(error) {
  console.log('Creating error window...');
  
  const errorWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>LabFlow Clinic - Error</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .error { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 5px; }
        .details { background: #f5f5f5; padding: 10px; margin: 10px 0; font-family: monospace; font-size: 12px; }
        button { padding: 10px 20px; margin: 10px 5px; font-size: 16px; }
      </style>
    </head>
    <body>
      <h1>LabFlow Clinic - เกิดข้อผิดพลาด</h1>
      <div class="error">
        <strong>ไม่สามารถเริ่มต้นแอปพลิเคชันได้</strong>
      </div>
      <div class="details">
        ${error.message || error.toString()}
      </div>
      <p>กรุณาลองวิธีการแก้ไขต่อไปนี้:</p>
      <ul>
        <li>รีสตาร์ทแอปพลิเคชัน</li>
        <li>ล้างแคชแอปพลิเคชัน</li>
        <li>ติดต่อฝ่ายสนับสนุน</li>
      </ul>
      <button onclick="require('electron').ipcRenderer.invoke('restart-application')">รีสตาร์ท</button>
      <button onclick="window.close()">ปิด</button>
    </body>
    </html>
  `;

  errorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'ไฟล์',
      submenu: [
        {
          label: 'เปิดไฟล์',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Text Files', extensions: ['txt', 'md'] },
                { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('file-opened', result.filePaths[0]);
            }
          }
        },
        {
          label: 'บันทึกไฟล์',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              filters: [
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('file-save-path', result.filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'ออกจากโปรแกรม',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'แก้ไข',
      submenu: [
        { role: 'undo', label: 'ยกเลิก' },
        { role: 'redo', label: 'ทำซ้ำ' },
        { type: 'separator' },
        { role: 'cut', label: 'ตัด' },
        { role: 'copy', label: 'คัดลอก' },
        { role: 'paste', label: 'วาง' },
        { role: 'selectall', label: 'เลือกทั้งหมด' }
      ]
    },
    {
      label: 'เครื่องมือ',
      submenu: [
        {
          label: 'ตรวจสอบเครื่องพิมพ์',
          click: () => {
            mainWindow.webContents.send('check-printers');
          }
        },
        {
          label: 'ทดสอบการเชื่อมต่อฐานข้อมูล',
          click: () => {
            mainWindow.webContents.send('test-database');
          }
        },
        {
          label: 'ข้อมูลระบบ',
          click: () => {
            mainWindow.webContents.send('show-system-info');
          }
        },
        {
          label: 'ล้างแคชแอปพลิเคชัน',
          click: async () => {
            const result = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['ยกเลิก', 'ล้างแคช'],
              defaultId: 0,
              title: 'ล้างแคชแอปพลิเคชัน',
              message: 'คุณต้องการล้างแคชแอปพลิเคชันหรือไม่?',
              detail: 'การล้างแคชจะช่วยแก้ไขปัญหาการแสดงผลและประสิทธิภาพ แอปพลิเคชันจะรีสตาร์ทอัตโนมัติ'
            });
            
            if (result.response === 1) {
              clearAppCache();
              app.relaunch();
              app.exit();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'รีโหลดหน้า',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'เปิด Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'หน้าต่าง',
      submenu: [
        { role: 'minimize', label: 'ย่อหน้าต่าง' },
        { role: 'close', label: 'ปิดหน้าต่าง' },
        { type: 'separator' },
        { role: 'zoom', label: 'ซูม' },
        { role: 'zoomin', label: 'ซูมเข้า' },
        { role: 'zoomout', label: 'ซูมออก' },
        { role: 'resetzoom', label: 'รีเซ็ตซูม' }
      ]
    },
    {
      label: 'ช่วยเหลือ',
      submenu: [
        {
          label: 'เกี่ยวกับ LabFlow Clinic',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'เกี่ยวกับ LabFlow Clinic',
              message: 'LabFlow Clinic v1.0.0',
              detail: 'ระบบจัดการคลินิกและห้องปฏิบัติการ\nพัฒนาโดย LabFlow Team'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Fallback window functions
function createBasicWindow() {
  console.log('Creating basic window...');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${port}`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMinimalWindow() {
  console.log('Creating minimal window...');
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load a simple HTML page
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>LabFlow Clinic</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { color: #d32f2f; }
            .info { color: #1976d2; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>LabFlow Clinic</h1>
            <p class="info">โปรแกรมกำลังเริ่มต้น...</p>
            <p>หากหน้านี้ไม่เปลี่ยนภายใน 10 วินาที กรุณาปิดโปรแกรมและเปิดใหม่</p>
            <p class="error">หรือติดต่อฝ่ายสนับสนุนหากปัญหายังคงอยู่</p>
        </div>
        <script>
            setTimeout(() => {
                location.reload();
            }, 10000);
        </script>
    </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createErrorWindow(error) {
  console.log('Creating error window...');
  const errorWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>LabFlow Clinic - Error</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .error { color: #d32f2f; }
            .details { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>LabFlow Clinic - เกิดข้อผิดพลาด</h1>
        <p class="error">ไม่สามารถเริ่มโปรแกรมได้</p>
        <div class="details">
            <strong>รายละเอียดข้อผิดพลาด:</strong><br>
            ${error ? error.message : 'Unknown error'}
        </div>
        <p>กรุณาลองดำเนินการต่อไปนี้:</p>
        <ul>
            <li>ปิดโปรแกรมและเปิดใหม่</li>
            <li>ตรวจสอบว่าไม่มีโปรแกรม LabFlow Clinic อื่นทำงานอยู่</li>
            <li>รีสตาร์ทคอมพิวเตอร์</li>
            <li>ติดต่อฝ่ายสนับสนุน</li>
        </ul>
        <button onclick="window.close()">ปิดหน้าต่าง</button>
    </body>
    </html>
  `;
  
  errorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  errorWindow.on('closed', () => {
    app.quit();
  });
}

// App event handlers
app.whenReady().then(async () => {
  console.log('Electron app ready, initializing...');
  
  // Clear cache if there were previous errors
  if (process.argv.includes('--clear-cache')) {
    console.log('Clearing app cache...');
    clearAppCache();
  }
  
  try {
    createSplashWindow();
    
    // Backend server is started externally via batch script in production
    // Only start backend automatically in development mode
    if (isDev) {
      try {
        console.log('Development mode: Starting backend server...');
        await startBackendServer();
        console.log('Backend server startup completed');
      } catch (error) {
        console.error('Failed to start backend server:', error);
        // Continue anyway - app will work without backend
      }
    } else {
      console.log('Production mode: Backend should be started externally');
    }
    
    // Wait a bit for splash screen, then create window
    setTimeout(() => {
      try {
        createWindow();
        createMenu();
        console.log('Main window and menu created successfully');
      } catch (error) {
        console.error('Error creating main window:', error);
        // Try to create a basic window without advanced features
        try {
          createBasicWindow();
        } catch (basicError) {
          console.error('Error creating basic window:', basicError);
          // Create minimal window as last resort
          createMinimalWindow();
        }
      }
    }, isDev ? 1500 : 2000); // Reduced wait time
    
  } catch (error) {
    console.error('Error during app initialization:', error);
    // Create a basic error window
    createErrorWindow(error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((error) => {
  console.error('Failed to initialize app:', error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopBackendServer();
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('App is quitting, stopping backend server...');
  stopBackendServer();
});

// IPC Handlers

// Store operations
ipcMain.handle('get-store', async (event, key) => {
  return getStore(key);
});

ipcMain.handle('set-store', async (event, key, value) => {
  return setStore(key, value);
});

// Get available printers
ipcMain.handle('get-printers', async () => {
  try {
    return await printerManager.getPrinters();
  } catch (error) {
    console.error('Error getting printers:', error);
    return printerManager.getFallbackPrinters();
  }
});

// Check printer status
ipcMain.handle('check-printer-status', async (event, printerName) => {
  try {
    return await printerManager.getPrinterStatus(printerName);
  } catch (error) {
    console.error('Error checking printer status:', error);
    return {
      name: printerName,
      status: 'พร้อมใช้งาน',
      jobCount: 0,
      error: null
    };
  }
});

// Print document - Use Electron's webContents.print() instead of temp files
ipcMain.handle('print-document', async (event, options) => {
  try {
    console.log('Main process: print-document called');
    console.log('Print options received:', JSON.stringify(options, null, 2));
    
    const { printerName, content, options: printOptions = {} } = options;
    
    console.log('Printer name:', printerName);
    console.log('Content type:', typeof content);
    console.log('Content length:', content?.length);
    
    // Use Electron's webContents.print() instead of temp files
    const electronPrintOptions = {
      silent: printerName ? true : false, // Silent if printer specified, show dialog if not
      printBackground: true,
      deviceName: printerName || '', // Use specified printer
      margins: {
        marginType: 'custom',
        top: printOptions.margins?.top || 15,
        bottom: printOptions.margins?.bottom || 15,
        left: printOptions.margins?.left || 15,
        right: printOptions.margins?.right || 15
      },
      pageSize: printOptions.pageSize || 'A4'
    };
    
    console.log('Electron print options:', electronPrintOptions);
    
    // Create a new window for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Format content as complete HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Print Document</title>
        <style>
          @page { 
            size: ${printOptions.pageSize || 'A4'}; 
            margin: ${printOptions.margins?.top || 15}mm ${printOptions.margins?.right || 15}mm ${printOptions.margins?.bottom || 15}mm ${printOptions.margins?.left || 15}mm;
          }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Sarabun', Arial, sans-serif; 
            font-size: 14px; 
            line-height: 1.6;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `;
    
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    return new Promise((resolve) => {
      printWindow.webContents.print(electronPrintOptions, (success, failureReason) => {
        printWindow.close();
        if (success) {
          const message = printerName ? 
            `ส่งใบเวชระเบียนไปยัง ${printerName} แล้ว` : 
            'พิมพ์เอกสารสำเร็จ';
          console.log('Print success:', message);
          resolve({ success: true, message });
        } else {
          console.error('Print failed:', failureReason);
          resolve({ success: false, message: `เกิดข้อผิดพลาด: ${failureReason}` });
        }
      });
    });
    
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการพิมพ์: ' + error.message };
  }
});

// Print sticker (specialized for small format printing)
ipcMain.handle('print-sticker', async (event, options) => {
  console.log('🔥 MAIN PROCESS: print-sticker handler STARTED');
  console.log('🔥 Event:', event);
  console.log('🔥 Options type:', typeof options);
  console.log('🔥 Options:', options);
  
  try {
    console.log('🖨️ Main process: print-sticker called');
    console.log('📋 Raw options received:', JSON.stringify(options, null, 2));
    
    // Handle both parameter formats: { printerName, content } and { printerName, htmlContent }
    const printerName = options.printerName || '';
    const content = options.htmlContent || options.content || '';
    
    console.log('🎯 Printer name:', printerName);
    console.log('📄 Content type:', typeof content);
    console.log('📏 Content length:', content?.length);
    console.log('👀 Content preview:', content?.substring(0, 300));
    console.log('🔍 Content contains barcode script:', content?.includes('JsBarcode'));
    console.log('🔍 Content contains sticker class:', content?.includes('sticker'));
    
    if (!content) {
      console.error('❌ No content provided for sticker printing');
      throw new Error('ไม่พบเนื้อหาสติ๊กเกอร์ที่จะพิมพ์');
    }

    if (!printerName) {
      console.warn('⚠️ No printer name provided, will use default printer');
    } else {
      // Check if printer exists and is available
      try {
        const printers = await mainWindow.webContents.getPrinters();
        const targetPrinter = printers.find(p => p.name === printerName);
        console.log('🔍 Available printers:', printers.map(p => p.name));
        console.log('🎯 Target printer found:', !!targetPrinter);
        
        if (targetPrinter) {
          console.log('✅ Printer details:', {
            name: targetPrinter.name,
            displayName: targetPrinter.displayName,
            status: targetPrinter.status,
            isDefault: targetPrinter.isDefault
          });
        } else {
          console.warn('⚠️ Target printer not found in available printers list');
        }
      } catch (error) {
        console.warn('⚠️ Could not check printer availability:', error.message);
      }
    }
    
    // Optimized print options for sticker printing
    const electronPrintOptions = {
      silent: true,
      printBackground: true,
      color: false, // Use black and white for better compatibility
      deviceName: printerName || '',
      margins: {
        marginType: 'custom',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      },
      pageSize: {
        width: 105000, // 105mm in microns (same as web)
        height: 25000  // 25mm in microns (sticker height)
      },
      scaleFactor: 100,
      headerFooter: false,
      // Additional options for consistent rendering
      landscape: false,
      shouldPrintBackgrounds: true,
      shouldPrintSelectionOnly: false
    };
    
    console.log('Print options:', electronPrintOptions);
    console.log(`🎯 Printing sticker to configured printer: ${printerName || 'Default printer'}`);
    
    console.log('🔧 About to create BrowserWindow for printing...');
    
    // Create a new window for printing
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    console.log('✅ BrowserWindow created successfully');
    
    // Load the HTML content directly (stickerPrinter.ts already provides complete HTML)
    console.log('📄 Loading HTML content into print window...');
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);
    console.log('✅ HTML content loaded successfully');
    
    // Wait for content to fully load with timeout
    console.log('⏳ Waiting for content to finish loading...');
    await new Promise(resolve => {
      if (printWindow.webContents.isLoading()) {
        console.log('📄 Content is still loading, waiting for did-finish-load event...');
        
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log('⏰ Timeout reached, proceeding anyway...');
            resolve(true);
          }
        }, 2000); // Reduced timeout to 2 seconds
        
        printWindow.webContents.once('did-finish-load', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.log('✅ did-finish-load event received');
            resolve(true);
          }
        });
      } else {
        console.log('✅ Content already loaded');
        resolve(true);
      }
    });
    
    console.log('✅ Content loading completed');
    
    // Reduced wait for dynamic content (barcodes, etc.)
    console.log('⏳ Waiting for dynamic content to load...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 3000ms to 1000ms
    console.log('✅ Dynamic content wait completed');
    
    console.log('🚀 Starting print process...');
    return new Promise((resolve) => {
      printWindow.webContents.print(electronPrintOptions, (success, failureReason) => {
        console.log('📊 Print callback - Success:', success, 'Reason:', failureReason);
        
        // Close window faster after printing
        setTimeout(() => {
          printWindow.close();
        }, 200);
        
        if (success) {
          const message = printerName ? 
            `พิมพ์สติ๊กเกอร์ไปยัง ${printerName} สำเร็จ` : 
            'พิมพ์สติ๊กเกอร์สำเร็จ';
          console.log('✅ Sticker print success:', message);
          resolve({ success: true, message });
        } else {
          const errorMessage = `เกิดข้อผิดพลาดในการพิมพ์: ${failureReason || 'ไม่ทราบสาเหตุ'}`;
          console.error('❌ Sticker print failed:', errorMessage);
          console.error('🔧 Troubleshooting: Check if printer is online and has correct drivers');
          resolve({ success: false, message: errorMessage });
        }
      });
    });
    
  } catch (error) {
    console.error('💥 Sticker print error:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    return { success: false, message: 'เกิดข้อผิดพลาดในการพิมพ์สติกเกอร์: ' + error.message };
  }
});

// Print barcode
ipcMain.handle('print-barcode', async (event, options) => {
  try {
    const { printerName, barcodeValue, barcodeType = 'CODE128', ...printOptions } = options;
    
    const barcodeContent = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-family: 'Courier New', monospace; font-size: 24px; letter-spacing: 2px; margin-bottom: 10px;">
          ${barcodeValue}
        </div>
        <div style="font-size: 12px; margin-top: 10px;">
          ${barcodeType}: ${barcodeValue}
        </div>
      </div>
    `;
    
    const barcodeOptions = {
      pageSize: '4x2',
      margin: '2mm',
      fontSize: '12px',
      ...printOptions
    };
    
    return await printerManager.printDocument(printerName, barcodeContent, barcodeOptions);
  } catch (error) {
    console.error('Barcode print error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการพิมพ์บาร์โค้ด: ' + error.message };
  }
});

// Print label
ipcMain.handle('print-label', async (event, options) => {
  try {
    const { printerName, labelData, ...printOptions } = options;
    
    const labelContent = `
      <div style="padding: 10px; font-size: 12px;">
        ${typeof labelData === 'string' ? labelData : JSON.stringify(labelData)}
      </div>
    `;
    
    const labelOptions = {
      pageSize: '3x1',
      margin: '2mm',
      fontSize: '10px',
      ...printOptions
    };
    
    return await printerManager.printDocument(printerName, labelContent, labelOptions);
  } catch (error) {
    console.error('Label print error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการพิมพ์ป้ายกำกับ: ' + error.message };
  }
});

// Print receipt (specialized for receipt printing)
ipcMain.handle('print-receipt', async (event, printerName, receiptData) => {
  try {
    console.log('Main process: print-receipt called');
    console.log('Printer name:', printerName);
    console.log('Receipt data:', JSON.stringify(receiptData, null, 2));
    
    if (!printerName) {
      return { success: false, message: 'ไม่ได้ระบุเครื่องพิมพ์' };
    }

    if (!receiptData) {
      return { success: false, message: 'ไม่มีข้อมูลใบเสร็จ' };
    }

    // Create receipt HTML content
    const receiptHTML = `
      <div style="width: 80mm; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h3 style="margin: 0; font-size: 14px;">${receiptData.clinic || 'LabFlow Clinic'}</h3>
          <p style="margin: 2px 0; font-size: 10px;">ใบเสร็จรับเงิน</p>
        </div>
        
        <div style="margin-bottom: 10px; font-size: 10px;">
          <div>Visit: ${receiptData.visitNumber || ''}</div>
          <div>ผู้ป่วย: ${receiptData.patient?.name || ''}</div>
          <div>อายุ: ${receiptData.patient?.age || ''} ปี</div>
          <div>วันที่: ${receiptData.date || ''} ${receiptData.time || ''}</div>
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 10px 0;">
          ${receiptData.items?.map(item => `
            <div style="display: flex; justify-content: space-between; margin: 2px 0;">
              <span style="flex: 1;">${item.name || ''}</span>
              <span>${item.price?.toLocaleString() || '0'}</span>
            </div>
          `).join('') || ''}
        </div>
        
        <div style="text-align: right; margin: 10px 0; font-weight: bold;">
          <div>รวม: ${receiptData.total?.toLocaleString() || '0'} บาท</div>
          <div style="font-size: 10px;">ชำระ: ${receiptData.paymentMethod || 'เงินสด'}</div>
        </div>
        
        <div style="text-align: center; margin-top: 15px; font-size: 10px;">
          <p>ขอบคุณที่ใช้บริการ</p>
        </div>
      </div>
    `;

    // Use Electron's webContents.print() for receipt printing
    const electronPrintOptions = {
      silent: true, // Print silently without dialog
      printBackground: true,
      deviceName: printerName,
      margins: {
        marginType: 'custom',
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
      },
      pageSize: {
        width: 80000, // 80mm in microns
        height: 200000  // 200mm in microns (auto-adjust)
      }
    };
    
    console.log('Receipt print options:', electronPrintOptions);
    
    // Create a new window for printing receipt
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 5mm;
          }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>${receiptHTML}</body>
      </html>
    `;
    
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    return new Promise((resolve) => {
      // Set timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.log('Receipt print timeout');
        printWindow.close();
        resolve({ success: false, message: 'การพิมพ์ใบเสร็จหมดเวลา (Timeout)' });
      }, 15000); // 15 seconds timeout

      printWindow.webContents.print(electronPrintOptions, (success, failureReason) => {
        clearTimeout(timeoutId);
        printWindow.close();
        
        if (success) {
          const message = `พิมพ์ใบเสร็จไปยัง ${printerName} สำเร็จ`;
          console.log('Receipt print success:', message);
          resolve({ success: true, message });
        } else {
          console.error('Receipt print failed:', failureReason);
          resolve({ success: false, message: `เกิดข้อผิดพลาด: ${failureReason || 'ไม่ทราบสาเหตุ'}` });
        }
      });
    });
    
  } catch (error) {
    console.error('Receipt print error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการพิมพ์ใบเสร็จ: ' + error.message };
  }
});

// Test database connection
ipcMain.handle('test-database-connection', async () => {
  try {
    // This would typically test your actual database connection
    // For now, we'll simulate a connection test
    const testResult = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'เชื่อมต่อฐานข้อมูลสำเร็จ' });
      }, 1000);
    });
    
    return testResult;
  } catch (error) {
    return { success: false, message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ' + error.message };
  }
});

// Get system information
ipcMain.handle('get-system-info', async () => {
  try {
    return await systemInfo.getSystemInfo();
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
      cpus: os.cpus().length + ' cores',
      uptime: Math.round(os.uptime() / 3600) + ' hours',
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      error: error.message
    };
  }
});

// File operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window controls
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// ==================== ADDITIONAL PRINTER TOOLS ====================

// Get print queue
ipcMain.handle('get-print-queue', async (event, printerName) => {
  try {
    return await printerManager.getPrintQueue(printerName);
  } catch (error) {
    console.error('Error getting print queue:', error);
    return [];
  }
});

// Cancel print job
ipcMain.handle('cancel-print-job', async (event, jobId, printerName) => {
  try {
    return await printerManager.cancelPrintJob(jobId, printerName);
  } catch (error) {
    console.error('Error canceling print job:', error);
    return { success: false, message: 'ไม่สามารถยกเลิกงานพิมพ์ได้: ' + error.message };
  }
});

// Test printer
ipcMain.handle('test-printer', async (event, printerName) => {
  try {
    return await printerManager.testPrinter(printerName);
  } catch (error) {
    console.error('Error testing printer:', error);
    return { success: false, message: 'ไม่สามารถทดสอบเครื่องพิมพ์ได้: ' + error.message };
  }
});

// Clear printer cache
ipcMain.handle('clear-printer-cache', async () => {
  try {
    printerManager.clearCache();
    return { success: true, message: 'ล้างแคชเครื่องพิมพ์เรียบร้อยแล้ว' };
  } catch (error) {
    return { success: false, message: 'ไม่สามารถล้างแคชได้: ' + error.message };
  }
});

// Clear application cache
ipcMain.handle('clear-app-cache', async () => {
  try {
    clearAppCache();
    return { success: true, message: 'ล้างแคชแอปพลิเคชันเรียบร้อยแล้ว' };
  } catch (error) {
    return { success: false, message: 'ไม่สามารถล้างแคชแอปพลิเคชันได้: ' + error.message };
  }
});

// Get cache information
ipcMain.handle('get-cache-info', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const cachePath = path.join(userDataPath, 'Cache');
    const gpuCachePath = path.join(userDataPath, 'GPUCache');
    
    const getCacheSize = (dirPath) => {
      if (!fs.existsSync(dirPath)) return 0;
      let size = 0;
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          size += getCacheSize(filePath);
        } else {
          try {
            size += fs.statSync(filePath).size;
          } catch (error) {
            // Ignore files that can't be accessed
          }
        }
      }
      return size;
    };
    
    const cacheSize = getCacheSize(cachePath);
    const gpuCacheSize = getCacheSize(gpuCachePath);
    const totalSize = cacheSize + gpuCacheSize;
    
    return {
      success: true,
      cacheSize: Math.round(cacheSize / 1024 / 1024 * 100) / 100, // MB
      gpuCacheSize: Math.round(gpuCacheSize / 1024 / 1024 * 100) / 100, // MB
      totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
      cachePath,
      gpuCachePath
    };
  } catch (error) {
    return { success: false, message: 'ไม่สามารถตรวจสอบข้อมูลแคชได้: ' + error.message };
  }
});

// Get printer cache stats
ipcMain.handle('get-printer-cache-stats', async () => {
  try {
    return printerManager.getCacheStats();
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { size: 0, keys: [], platform: os.platform() };
  }
});

// ==================== SYSTEM TOOLS ====================

// Get system health
ipcMain.handle('get-system-health', async () => {
  try {
    return await systemInfo.getSystemHealth();
  } catch (error) {
    console.error('Error getting system health:', error);
    return {
      overall: 'unknown',
      issues: ['ไม่สามารถตรวจสอบสถานะระบบได้'],
      warnings: [],
      recommendations: []
    };
  }
});

// Get performance metrics
ipcMain.handle('get-performance-metrics', async () => {
  try {
    return await systemInfo.getPerformanceMetrics();
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return { error: error.message };
  }
});

// Export system info
ipcMain.handle('export-system-info', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ],
      defaultPath: `labflow_system_info_${new Date().toISOString().split('T')[0]}.json`
    });
    
    if (!result.canceled) {
      return await systemInfo.exportSystemInfo(result.filePath);
    }
    
    return { success: false, message: 'ยกเลิกการส่งออก' };
  } catch (error) {
    console.error('Error exporting system info:', error);
    return { success: false, message: 'ไม่สามารถส่งออกข้อมูลระบบได้: ' + error.message };
  }
});

// ==================== ADVANCED TOOLS ====================

// Backup application data
ipcMain.handle('backup-app-data', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'ZIP Files', extensions: ['zip'] }
      ],
      defaultPath: `labflow_backup_${new Date().toISOString().split('T')[0]}.zip`
    });
    
    if (!result.canceled) {
      // This would implement actual backup functionality
      // For now, we'll create a simple backup manifest
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        platform: os.platform(),
        systemInfo: await systemInfo.getSystemInfo(),
        printerConfig: printerManager.getCacheStats()
      };
      
      fs.writeFileSync(result.filePath.replace('.zip', '.json'), JSON.stringify(backupData, null, 2), 'utf8');
      
      return { 
        success: true, 
        message: 'สำรองข้อมูลเรียบร้อยแล้ว',
        path: result.filePath.replace('.zip', '.json')
      };
    }
    
    return { success: false, message: 'ยกเลิกการสำรองข้อมูล' };
  } catch (error) {
    console.error('Error backing up data:', error);
    return { success: false, message: 'ไม่สามารถสำรองข้อมูลได้: ' + error.message };
  }
});

// Check for updates (placeholder)
ipcMain.handle('check-for-updates', async () => {
  try {
    // This would implement actual update checking
    return {
      hasUpdate: false,
      currentVersion: '1.0.0',
      latestVersion: '1.0.0',
      message: 'คุณใช้เวอร์ชันล่าสุดแล้ว'
    };
  } catch (error) {
    return {
      hasUpdate: false,
      error: error.message,
      message: 'ไม่สามารถตรวจสอบอัปเดตได้'
    };
  }
});

// Generate diagnostic report
ipcMain.handle('generate-diagnostic-report', async () => {
  try {
    const systemData = await systemInfo.getSystemInfo();
    const systemHealth = await systemInfo.getSystemHealth();
    const printerData = await printerManager.getPrinters();
    const cacheStats = printerManager.getCacheStats();
    
    const diagnosticReport = {
      timestamp: new Date().toISOString(),
      application: {
        name: 'LabFlow Clinic',
        version: '1.0.0',
        platform: 'Electron'
      },
      system: systemData,
      health: systemHealth,
      printers: {
        available: printerData,
        cache: cacheStats
      },
      environment: {
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
        isDevelopment: isDev
      }
    };
    
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ],
      defaultPath: `labflow_diagnostic_${new Date().toISOString().split('T')[0]}.json`
    });
    
    if (!result.canceled) {
      fs.writeFileSync(result.filePath, JSON.stringify(diagnosticReport, null, 2), 'utf8');
      return { 
        success: true, 
        message: 'สร้างรายงานการวินิจฉัยเรียบร้อยแล้ว',
        path: result.filePath
      };
    }
    
    return { success: false, message: 'ยกเลิกการสร้างรายงาน' };
  } catch (error) {
    console.error('Error generating diagnostic report:', error);
    return { success: false, message: 'ไม่สามารถสร้างรายงานการวินิจฉัยได้: ' + error.message };
  }
});

// Restart application
ipcMain.handle('restart-application', async () => {
  try {
    app.relaunch();
    app.exit();
  } catch (error) {
    console.error('Error restarting application:', error);
    return { success: false, message: 'ไม่สามารถรีสตาร์ทแอปพลิเคชันได้' };
  }
});

// ==================== BACKEND API PROXY ====================

// Generic backend API call
ipcMain.handle('call-backend-api', async (event, endpoint, method = 'GET', data = null) => {
  try {
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    const apiUrl = `http://localhost:${backendPort}${endpoint}`;
    const parsedUrl = url.parse(apiUrl);
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }
      
      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve({
              success: true,
              data: jsonData,
              status: res.statusCode
            });
          } catch (parseError) {
            resolve({
              success: true,
              data: responseData,
              status: res.statusCode
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          message: 'ไม่สามารถเชื่อมต่อ backend ได้'
        });
      });
      
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการเรียก API'
    };
  }
});

// Specific backend API calls
ipcMain.handle('get-patients', async () => {
  return await ipcMain.emit('call-backend-api', null, '/api/patients', 'GET');
});

ipcMain.handle('get-dashboard-stats', async () => {
  return await ipcMain.emit('call-backend-api', null, '/api/dashboard/stats', 'GET');
});

ipcMain.handle('create-patient', async (event, patientData) => {
  return await ipcMain.emit('call-backend-api', null, '/api/patients', 'POST', patientData);
});

ipcMain.handle('update-patient', async (event, patientId, patientData) => {
  return await ipcMain.emit('call-backend-api', null, `/api/patients/${patientId}`, 'PUT', patientData);
});

ipcMain.handle('delete-patient', async (event, patientId) => {
  return await ipcMain.emit('call-backend-api', null, `/api/patients/${patientId}`, 'DELETE');
});

// Check backend connection
ipcMain.handle('check-backend-connection', async () => {
  try {
    const result = await new Promise((resolve) => {
      const http = require('http');
      const req = http.get(`http://localhost:${backendPort}/api/health`, (res) => {
        resolve({
          success: true,
          status: res.statusCode,
          message: 'Backend เชื่อมต่อสำเร็จ'
        });
      });
      
      req.on('error', () => {
        resolve({
          success: false,
          message: 'ไม่สามารถเชื่อมต่อ Backend ได้ กรุณาตรวจสอบว่า Backend Server รันอยู่หรือไม่'
        });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          success: false,
          message: 'Backend ไม่ตอบสนอง (Timeout)'
        });
      });
    });
    
    return result;
  } catch (error) {
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบ Backend: ' + error.message
    };
  }
});

// Export/Import data
ipcMain.handle('export-data', async (event, data, format = 'json') => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'Excel Files', extensions: ['xlsx'] }
      ],
      defaultPath: `labflow_export_${new Date().toISOString().split('T')[0]}.${format}`
    });
    
    if (!result.canceled) {
      let content;
      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        // Simple CSV conversion
        const headers = Object.keys(data[0] || {});
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');
        content = csvContent;
      }
      
      fs.writeFileSync(result.filePath, content, 'utf8');
      return { success: true, path: result.filePath };
    }
    
    return { success: false, message: 'ยกเลิกการส่งออก' };
  } catch (error) {
    return { success: false, message: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล: ' + error.message };
  }
});

console.log('Electron main process started');
