# LabFlow Clinic - Electron Desktop Application

## 📋 Overview

LabFlow Clinic เป็นแอปพลิเคชันเดสก์ท็อปที่พัฒนาด้วย Electron สำหรับระบบจัดการคลินิกและห้องปฏิบัติการ พร้อมด้วยเครื่องมือการพิมพ์และการจัดการระบบที่ครบครัน

## 🚀 Features

### Core Features
- **Window Management**: การจัดการหน้าต่างแบบเต็มรูปแบบ (minimize, maximize, close)
- **Splash Screen**: หน้าจอเริ่มต้นที่สวยงามพร้อมภาษาไทย
- **Menu System**: เมนูระบบภาษาไทยที่ครบครัน
- **Security**: Context isolation และ preload script ที่ปลอดภัย

### Printer Management
- **Printer Detection**: ตรวจจับเครื่องพิมพ์อัตโนมัติ (Windows, macOS, Linux)
- **Print Queue Management**: จัดการคิวการพิมพ์
- **Printer Status Monitoring**: ตรวจสอบสถานะเครื่องพิมพ์แบบเรียลไทม์
- **Print Testing**: ทดสอบการพิมพ์
- **Fallback Support**: รองรับเครื่องพิมพ์เสมือน (PDF, XPS)

### System Tools
- **System Information**: ข้อมูลระบบแบบละเอียด
- **Performance Monitoring**: ตรวจสอบประสิทธิภาพระบบ
- **Health Monitoring**: ตรวจสอบสุขภาพระบบ
- **Diagnostic Reports**: สร้างรายงานการวินิจฉัย

### Advanced Tools
- **Data Backup**: สำรองข้อมูลแอปพลิเคชัน
- **System Export**: ส่งออกข้อมูลระบบ
- **Update Checking**: ตรวจสอบอัปเดต
- **Application Restart**: รีสตาร์ทแอปพลิเคชัน

## 📁 File Structure

```
electron/
├── main.js              # Main Electron process
├── preload.js           # Security preload script
├── splash.html          # Splash screen
├── assets/
│   └── icon.png         # Application icon
├── utils/
│   ├── printerManager.js # Printer management utility
│   └── systemInfo.js     # System information utility
└── README.md            # This file
```

## 🛠️ Core Components

### main.js
Main Electron process ที่จัดการ:
- Window lifecycle
- IPC handlers
- Menu system
- File operations
- Printer management
- System monitoring

### preload.js
Security-focused preload script ที่:
- Exposes safe APIs to renderer
- Implements context isolation
- Provides utility functions
- Manages IPC communication

### utils/printerManager.js
Comprehensive printer management:
- Cross-platform printer detection
- Print job management
- Status monitoring
- Cache management
- Fallback handling

### utils/systemInfo.js
System information and monitoring:
- Hardware information
- Performance metrics
- Health monitoring
- Export capabilities

## 🔧 API Reference

### Printer APIs
```javascript
// Get available printers
const printers = await window.electronAPI.getPrinters();

// Check printer status
const status = await window.electronAPI.checkPrinterStatus(printerName);

// Print document
const result = await window.electronAPI.printDocument({
  printerName: 'MyPrinter',
  content: '<h1>Hello World</h1>',
  copies: 1
});

// Get print queue
const queue = await window.electronAPI.getPrintQueue(printerName);

// Test printer
const testResult = await window.electronAPI.testPrinter(printerName);
```

### System APIs
```javascript
// Get system information
const systemInfo = await window.electronAPI.getSystemInfo();

// Get system health
const health = await window.electronAPI.getSystemHealth();

// Get performance metrics
const metrics = await window.electronAPI.getPerformanceMetrics();

// Export system info
const exportResult = await window.electronAPI.exportSystemInfo();
```

### Advanced APIs
```javascript
// Backup application data
const backupResult = await window.electronAPI.backupAppData();

// Generate diagnostic report
const diagnosticResult = await window.electronAPI.generateDiagnosticReport();

// Check for updates
const updateInfo = await window.electronAPI.checkForUpdates();

// Restart application
await window.electronAPI.restartApplication();
```

## 🖨️ Printer Support

### Supported Platforms
- **Windows**: PowerShell-based printer management
- **macOS**: CUPS-based printer management  
- **Linux**: CUPS-based printer management

### Supported Printer Types
- Physical printers (USB, Network)
- Virtual printers (PDF, XPS)
- Network printers
- Shared printers

### Print Features
- HTML content printing
- Custom page formatting
- Multiple copies support
- Print queue management
- Job cancellation
- Status monitoring

## 📊 System Monitoring

### Monitored Metrics
- **Memory Usage**: Total, free, used memory
- **CPU Usage**: Load average, core utilization
- **Disk Usage**: Drive space, usage percentage
- **Network**: Interface information, external IP
- **Process**: Application resource usage

### Health Checks
- Memory usage thresholds
- Disk space warnings
- CPU load monitoring
- System uptime tracking
- Performance recommendations

## 🔒 Security Features

### Context Isolation
- Renderer process isolation
- Safe API exposure
- No direct Node.js access
- Controlled IPC communication

### Safe Operations
- File path validation
- Command injection prevention
- Error handling
- Resource cleanup

## 🚀 Development

### Prerequisites
- Node.js 16+
- Electron 28+
- Windows/macOS/Linux

### Development Mode
```bash
npm run electron:dev
```

### Production Build
```bash
npm run build:electron
```

### Portable Build
```bash
npm run build:portable
```

## 🐛 Troubleshooting

### Common Issues

#### Printer Detection Issues
- Ensure PowerShell execution policy allows scripts (Windows)
- Check CUPS service status (Linux/macOS)
- Verify printer drivers are installed

#### Permission Issues
- Run as administrator if needed (Windows)
- Check file system permissions
- Verify network printer access

#### Performance Issues
- Clear printer cache: `window.electronAPI.clearPrinterCache()`
- Generate diagnostic report for analysis
- Monitor system health metrics

### Debug Information
```javascript
// Get cache statistics
const cacheStats = await window.electronAPI.getPrinterCacheStats();

// Generate diagnostic report
const diagnostic = await window.electronAPI.generateDiagnosticReport();
```

## 📝 Changelog

### v1.0.0
- Initial release
- Complete printer management system
- System monitoring tools
- Advanced diagnostic features
- Cross-platform support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Generate diagnostic report for troubleshooting
- Check system health status

---

**LabFlow Clinic** - Professional clinic and laboratory management system
