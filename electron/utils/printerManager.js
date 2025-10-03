const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

class PrinterManager {
  constructor() {
    this.platform = os.platform();
    this.printerCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Get all available printers
   */
  async getPrinters() {
    const cacheKey = 'all_printers';
    const cached = this.printerCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      let printers = [];
      
      if (this.platform === 'win32') {
        printers = await this.getWindowsPrinters();
      } else if (this.platform === 'darwin') {
        printers = await this.getMacPrinters();
      } else {
        printers = await this.getLinuxPrinters();
      }

      // Cache the result
      this.printerCache.set(cacheKey, {
        data: printers,
        timestamp: Date.now()
      });

      return printers;
    } catch (error) {
      console.error('Error getting printers:', error);
      return this.getFallbackPrinters();
    }
  }

  /**
   * Get Windows printers using PowerShell
   */
  async getWindowsPrinters() {
    return new Promise((resolve, reject) => {
      const command = `
        Get-Printer | Select-Object Name, PrinterStatus, JobCount, DriverName, PortName, Shared, Published | 
        ConvertTo-Json -Depth 3
      `;
      
      exec(command, { shell: 'powershell.exe', timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          let printers = JSON.parse(stdout);
          if (!Array.isArray(printers)) {
            printers = [printers];
          }

          const formattedPrinters = printers.map(printer => ({
            name: printer.Name,
            displayName: printer.Name,
            status: this.mapWindowsStatus(printer.PrinterStatus),
            jobCount: printer.JobCount || 0,
            driverName: printer.DriverName || 'Unknown',
            portName: printer.PortName || '',
            isShared: printer.Shared || false,
            isPublished: printer.Published || false,
            isDefault: false, // Will be determined separately
            type: this.determinePrinterType(printer.Name, printer.PortName),
            platform: 'windows'
          }));

          resolve(formattedPrinters);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Get macOS printers using lpstat
   */
  async getMacPrinters() {
    return new Promise((resolve, reject) => {
      exec('lpstat -p -d', { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const lines = stdout.split('\n');
          const printers = [];
          let defaultPrinter = '';

          // Find default printer
          const defaultLine = lines.find(line => line.startsWith('system default destination:'));
          if (defaultLine) {
            defaultPrinter = defaultLine.split(':')[1].trim();
          }

          // Parse printer lines
          lines.forEach(line => {
            if (line.startsWith('printer ')) {
              const match = line.match(/printer (\S+)/);
              if (match) {
                const name = match[1];
                printers.push({
                  name,
                  displayName: name,
                  status: line.includes('disabled') ? 'Error' : 'Ready',
                  jobCount: 0,
                  driverName: 'CUPS',
                  portName: '',
                  isShared: false,
                  isPublished: false,
                  isDefault: name === defaultPrinter,
                  type: 'Physical',
                  platform: 'macos'
                });
              }
            }
          });

          resolve(printers);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Get Linux printers using CUPS
   */
  async getLinuxPrinters() {
    return new Promise((resolve, reject) => {
      exec('lpstat -p -d', { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const lines = stdout.split('\n');
          const printers = [];
          let defaultPrinter = '';

          // Find default printer
          const defaultLine = lines.find(line => line.startsWith('system default destination:'));
          if (defaultLine) {
            defaultPrinter = defaultLine.split(':')[1].trim();
          }

          // Parse printer lines
          lines.forEach(line => {
            if (line.startsWith('printer ')) {
              const match = line.match(/printer (\S+)/);
              if (match) {
                const name = match[1];
                printers.push({
                  name,
                  displayName: name,
                  status: line.includes('disabled') ? 'Error' : 'Ready',
                  jobCount: 0,
                  driverName: 'CUPS',
                  portName: '',
                  isShared: false,
                  isPublished: false,
                  isDefault: name === defaultPrinter,
                  type: 'Physical',
                  platform: 'linux'
                });
              }
            }
          });

          resolve(printers);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Get printer status
   */
  async getPrinterStatus(printerName) {
    const cacheKey = `status_${printerName}`;
    const cached = this.printerCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 5000) { // 5 second cache for status
      return cached.data;
    }

    try {
      let status;
      
      if (this.platform === 'win32') {
        status = await this.getWindowsPrinterStatus(printerName);
      } else {
        status = await this.getUnixPrinterStatus(printerName);
      }

      // Cache the result
      this.printerCache.set(cacheKey, {
        data: status,
        timestamp: Date.now()
      });

      return status;
    } catch (error) {
      console.error('Error getting printer status:', error);
      return {
        name: printerName,
        status: 'Unknown',
        jobCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get Windows printer status
   */
  async getWindowsPrinterStatus(printerName) {
    return new Promise((resolve, reject) => {
      const command = `Get-Printer -Name "${printerName}" | Select-Object Name, PrinterStatus, JobCount, Comment | ConvertTo-Json`;
      
      exec(command, { shell: 'powershell.exe', timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const printer = JSON.parse(stdout);
          resolve({
            name: printer.Name,
            status: this.mapWindowsStatus(printer.PrinterStatus),
            jobCount: printer.JobCount || 0,
            comment: printer.Comment || '',
            lastChecked: new Date().toISOString()
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Get Unix printer status
   */
  async getUnixPrinterStatus(printerName) {
    return new Promise((resolve, reject) => {
      exec(`lpstat -p ${printerName}`, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          name: printerName,
          status: stdout.includes('disabled') ? 'Error' : 'Ready',
          jobCount: 0,
          comment: '',
          lastChecked: new Date().toISOString()
        });
      });
    });
  }

  /**
   * Print document
   */
  async printDocument(printerName, htmlContent, options = {}) {
    try {
      const tempFilePath = await this.createTempFile(htmlContent, options);
      
      let result;
      if (this.platform === 'win32') {
        result = await this.printWindows(tempFilePath, printerName, options);
      } else {
        result = await this.printUnix(tempFilePath, printerName, options);
      }

      // Clean up temp file
      this.cleanupTempFile(tempFilePath);
      
      return result;
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }

  /**
   * Create temporary HTML file for printing
   */
  async createTempFile(content, options = {}) {
    const tempDir = os.tmpdir();
    const tempFileName = `labflow_print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.html`;
    const tempFilePath = path.join(tempDir, tempFileName);

    const htmlContent = this.formatPrintContent(content, options);
    
    fs.writeFileSync(tempFilePath, htmlContent, 'utf8');
    return tempFilePath;
  }

  /**
   * Format content for printing
   */
  formatPrintContent(content, options = {}) {
    const {
      title = 'LabFlow Clinic Document',
      fontSize = '12px',
      fontFamily = 'Sarabun, Arial, sans-serif',
      margin = '20mm',
      pageSize = 'A4',
      orientation = 'portrait'
    } = options;

    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        
        @page {
            margin: ${margin};
            size: ${pageSize} ${orientation};
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontFamily};
            font-size: ${fontSize};
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
            background: white;
        }
        
        .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        
        .print-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
        }
        
        .print-header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #666;
        }
        
        .print-content {
            margin: 20px 0;
        }
        
        .print-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        .barcode {
            text-align: center;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
        }
        
        @media screen {
            .print-only { display: none; }
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>LabFlow Clinic</h1>
        <p>ระบบจัดการคลินิกและห้องปฏิบัติการ</p>
    </div>
    
    <div class="print-content">
        ${content}
    </div>
    
    <div class="print-footer">
        <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')} | หน้า: <span class="page-number"></span></p>
    </div>
    
    <script>
        // Add page numbers
        window.addEventListener('beforeprint', function() {
            const pageNumbers = document.querySelectorAll('.page-number');
            pageNumbers.forEach((el, index) => {
                el.textContent = index + 1;
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * Print on Windows
   */
  async printWindows(filePath, printerName, options = {}) {
    return new Promise((resolve, reject) => {
      // Use the default browser to print
      const command = `start /wait "" "${filePath}"`;
      
      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Windows print failed: ${error.message}`));
          return;
        }

        resolve({
          success: true,
          message: 'ส่งเอกสารไปยังเครื่องพิมพ์เรียบร้อยแล้ว',
          printTime: new Date().toISOString(),
          platform: 'windows'
        });
      });
    });
  }

  /**
   * Print on Unix systems
   */
  async printUnix(filePath, printerName, options = {}) {
    return new Promise((resolve, reject) => {
      const { copies = 1 } = options;
      const command = `lp -d "${printerName}" -n ${copies} "${filePath}"`;
      
      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Unix print failed: ${error.message}`));
          return;
        }

        resolve({
          success: true,
          message: 'ส่งเอกสารไปยังเครื่องพิมพ์เรียบร้อยแล้ว',
          jobId: stdout.trim(),
          printTime: new Date().toISOString(),
          platform: 'unix'
        });
      });
    });
  }

  /**
   * Clean up temporary file
   */
  cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Could not clean up temp file:', error.message);
    }
  }

  /**
   * Get print queue
   */
  async getPrintQueue(printerName = null) {
    try {
      if (this.platform === 'win32') {
        return await this.getWindowsPrintQueue(printerName);
      } else {
        return await this.getUnixPrintQueue(printerName);
      }
    } catch (error) {
      console.error('Error getting print queue:', error);
      return [];
    }
  }

  /**
   * Get Windows print queue
   */
  async getWindowsPrintQueue(printerName) {
    return new Promise((resolve, reject) => {
      const command = printerName 
        ? `Get-PrintJob -PrinterName "${printerName}" | ConvertTo-Json`
        : 'Get-PrintJob | ConvertTo-Json';
      
      exec(command, { shell: 'powershell.exe', timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          resolve([]);
          return;
        }

        try {
          let jobs = stdout.trim() ? JSON.parse(stdout) : [];
          if (!Array.isArray(jobs)) {
            jobs = [jobs];
          }

          const formattedJobs = jobs.map(job => ({
            id: job.Id,
            printerName: job.PrinterName,
            documentName: job.DocumentName,
            status: job.JobStatus,
            size: job.Size,
            submittedTime: job.SubmittedTime,
            userName: job.UserName || 'Unknown'
          }));

          resolve(formattedJobs);
        } catch (parseError) {
          resolve([]);
        }
      });
    });
  }

  /**
   * Get Unix print queue
   */
  async getUnixPrintQueue(printerName) {
    return new Promise((resolve, reject) => {
      const command = printerName ? `lpq -P ${printerName}` : 'lpq';
      
      exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          resolve([]);
          return;
        }

        // Parse lpq output (simplified)
        const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Rank'));
        const jobs = lines.map((line, index) => {
          const parts = line.trim().split(/\s+/);
          return {
            id: index + 1,
            printerName: printerName || 'default',
            documentName: parts[2] || 'Document',
            status: 'Processing',
            size: 0,
            submittedTime: new Date().toISOString(),
            userName: parts[0] || 'Unknown'
          };
        });

        resolve(jobs);
      });
    });
  }

  /**
   * Cancel print job
   */
  async cancelPrintJob(jobId, printerName) {
    try {
      if (this.platform === 'win32') {
        return await this.cancelWindowsPrintJob(jobId, printerName);
      } else {
        return await this.cancelUnixPrintJob(jobId);
      }
    } catch (error) {
      console.error('Error canceling print job:', error);
      throw error;
    }
  }

  /**
   * Cancel Windows print job
   */
  async cancelWindowsPrintJob(jobId, printerName) {
    return new Promise((resolve, reject) => {
      const command = `Remove-PrintJob -PrinterName "${printerName}" -ID ${jobId}`;
      
      exec(command, { shell: 'powershell.exe', timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error('ไม่สามารถยกเลิกงานพิมพ์ได้'));
          return;
        }

        resolve({
          success: true,
          message: 'ยกเลิกงานพิมพ์เรียบร้อยแล้ว'
        });
      });
    });
  }

  /**
   * Cancel Unix print job
   */
  async cancelUnixPrintJob(jobId) {
    return new Promise((resolve, reject) => {
      const command = `lprm ${jobId}`;
      
      exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error('ไม่สามารถยกเลิกงานพิมพ์ได้'));
          return;
        }

        resolve({
          success: true,
          message: 'ยกเลิกงานพิมพ์เรียบร้อยแล้ว'
        });
      });
    });
  }

  /**
   * Test printer connection
   */
  async testPrinter(printerName) {
    const testContent = `
      <div style="text-align: center; padding: 50px;">
        <h2>🖨️ ทดสอบการพิมพ์</h2>
        <p><strong>เครื่องพิมพ์:</strong> ${printerName}</p>
        <p><strong>เวลา:</strong> ${new Date().toLocaleString('th-TH')}</p>
        <p><strong>สถานะ:</strong> หากคุณเห็นข้อความนี้ แสดงว่าเครื่องพิมพ์ทำงานปกติ ✅</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 10px; color: #666;">
          การทดสอบนี้ถูกสร้างโดย LabFlow Clinic System<br>
          Test ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
        </p>
      </div>
    `;

    try {
      const result = await this.printDocument(printerName, testContent, {
        title: 'Printer Test Page',
        fontSize: '14px'
      });

      return {
        success: true,
        message: 'ส่งหน้าทดสอบไปยังเครื่องพิมพ์เรียบร้อยแล้ว',
        ...result
      };
    } catch (error) {
      return {
        success: false,
        message: 'ไม่สามารถทดสอบเครื่องพิมพ์ได้: ' + error.message
      };
    }
  }

  /**
   * Helper methods
   */
  mapWindowsStatus(status) {
    const statusMap = {
      0: 'Ready',
      1: 'Paused',
      2: 'Error',
      3: 'Pending Deletion',
      4: 'Paper Jam',
      5: 'Paper Out',
      6: 'Manual Feed',
      7: 'Paper Problem',
      8: 'Offline',
      9: 'I/O Active',
      10: 'Busy',
      11: 'Printing',
      12: 'Output Bin Full',
      13: 'Not Available',
      14: 'Waiting',
      15: 'Processing',
      16: 'Initializing',
      17: 'Warming Up',
      18: 'Toner Low',
      19: 'No Toner',
      20: 'Page Punt',
      21: 'User Intervention Required',
      22: 'Out of Memory',
      23: 'Door Open'
    };
    return statusMap[status] || 'Unknown';
  }

  determinePrinterType(name, portName) {
    const virtualKeywords = ['PDF', 'XPS', 'Fax', 'OneNote', 'Microsoft'];
    const networkKeywords = ['IP_', 'WSD', 'HTTP', 'LPT', 'TCP'];
    
    if (virtualKeywords.some(keyword => name.includes(keyword))) {
      return 'Virtual';
    }
    
    if (networkKeywords.some(keyword => portName.includes(keyword))) {
      return 'Network';
    }
    
    return 'Physical';
  }

  getFallbackPrinters() {
    const fallbackPrinters = [];
    
    if (this.platform === 'win32') {
      fallbackPrinters.push(
        {
          name: 'Microsoft Print to PDF',
          displayName: 'Microsoft Print to PDF',
          status: 'Ready',
          jobCount: 0,
          driverName: 'Microsoft Print To PDF',
          portName: 'PORTPROMPT:',
          isShared: false,
          isPublished: false,
          isDefault: true,
          type: 'Virtual',
          platform: 'windows'
        },
        {
          name: 'Microsoft XPS Document Writer',
          displayName: 'Microsoft XPS Document Writer',
          status: 'Ready',
          jobCount: 0,
          driverName: 'Microsoft XPS Document Writer',
          portName: 'XPSPort:',
          isShared: false,
          isPublished: false,
          isDefault: false,
          type: 'Virtual',
          platform: 'windows'
        }
      );
    }
    
    return fallbackPrinters;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.printerCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.printerCache.size,
      keys: Array.from(this.printerCache.keys()),
      platform: this.platform
    };
  }
}

module.exports = PrinterManager;
