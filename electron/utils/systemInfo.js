const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class SystemInfo {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
  }

  /**
   * Get comprehensive system information
   */
  async getSystemInfo() {
    const basicInfo = this.getBasicInfo();
    const memoryInfo = this.getMemoryInfo();
    const cpuInfo = this.getCPUInfo();
    const networkInfo = await this.getNetworkInfo();
    const diskInfo = await this.getDiskInfo();
    const processInfo = this.getProcessInfo();

    return {
      basic: basicInfo,
      memory: memoryInfo,
      cpu: cpuInfo,
      network: networkInfo,
      disk: diskInfo,
      process: processInfo,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get basic system information
   */
  getBasicInfo() {
    return {
      platform: this.platform,
      arch: this.arch,
      release: os.release(),
      version: os.version ? os.version() : 'N/A',
      hostname: os.hostname(),
      uptime: os.uptime(),
      uptimeFormatted: this.formatUptime(os.uptime()),
      userInfo: os.userInfo(),
      homeDir: os.homedir(),
      tmpDir: os.tmpdir(),
      endianness: os.endianness(),
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      v8Version: process.versions.v8
    };
  }

  /**
   * Get memory information
   */
  getMemoryInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      totalFormatted: this.formatBytes(totalMemory),
      freeFormatted: this.formatBytes(freeMemory),
      usedFormatted: this.formatBytes(usedMemory),
      usagePercentage: Math.round((usedMemory / totalMemory) * 100),
      processMemory: process.memoryUsage()
    };
  }

  /**
   * Get CPU information
   */
  getCPUInfo() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0,
      cores: cpus.length,
      architecture: this.arch,
      loadAverage: {
        '1min': loadAvg[0],
        '5min': loadAvg[1],
        '15min': loadAvg[2]
      },
      usage: this.calculateCPUUsage(cpus)
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return {
      usage: usage,
      idle: ~~(100 * idle / total),
      details: cpus.map(cpu => ({
        model: cpu.model,
        speed: cpu.speed,
        times: cpu.times
      }))
    };
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkInfo = {
      interfaces: {},
      activeConnections: 0,
      externalIP: null
    };

    // Process network interfaces
    for (const [name, addresses] of Object.entries(interfaces)) {
      networkInfo.interfaces[name] = addresses.map(addr => ({
        address: addr.address,
        netmask: addr.netmask,
        family: addr.family,
        mac: addr.mac,
        internal: addr.internal,
        cidr: addr.cidr
      }));

      // Count active connections
      if (addresses.some(addr => !addr.internal && addr.family === 'IPv4')) {
        networkInfo.activeConnections++;
      }
    }

    // Try to get external IP
    try {
      networkInfo.externalIP = await this.getExternalIP();
    } catch (error) {
      networkInfo.externalIP = 'Unable to determine';
    }

    return networkInfo;
  }

  /**
   * Get external IP address
   */
  async getExternalIP() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, 5000);

      // Try multiple services
      const services = [
        'https://api.ipify.org',
        'https://ipinfo.io/ip',
        'https://icanhazip.com'
      ];

      let attempts = 0;
      const tryService = (index) => {
        if (index >= services.length) {
          clearTimeout(timeout);
          reject(new Error('All services failed'));
          return;
        }

        const https = require('https');
        const req = https.get(services[index], (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            clearTimeout(timeout);
            resolve(data.trim());
          });
        });

        req.on('error', () => {
          tryService(index + 1);
        });

        req.setTimeout(2000, () => {
          req.destroy();
          tryService(index + 1);
        });
      };

      tryService(0);
    });
  }

  /**
   * Get disk information
   */
  async getDiskInfo() {
    try {
      if (this.platform === 'win32') {
        return await this.getWindowsDiskInfo();
      } else {
        return await this.getUnixDiskInfo();
      }
    } catch (error) {
      console.error('Error getting disk info:', error);
      return {
        drives: [],
        error: error.message
      };
    }
  }

  /**
   * Get Windows disk information
   */
  async getWindowsDiskInfo() {
    return new Promise((resolve, reject) => {
      const command = `
        Get-WmiObject -Class Win32_LogicalDisk | 
        Select-Object DeviceID, Size, FreeSpace, FileSystem, VolumeName, DriveType | 
        ConvertTo-Json
      `;

      exec(command, { shell: 'powershell.exe', timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          let drives = JSON.parse(stdout);
          if (!Array.isArray(drives)) {
            drives = [drives];
          }

          const driveTypes = {
            0: 'Unknown',
            1: 'No Root Directory',
            2: 'Removable Disk',
            3: 'Local Disk',
            4: 'Network Drive',
            5: 'Compact Disc',
            6: 'RAM Disk'
          };

          const formattedDrives = drives.map(drive => ({
            device: drive.DeviceID,
            size: parseInt(drive.Size) || 0,
            free: parseInt(drive.FreeSpace) || 0,
            used: (parseInt(drive.Size) || 0) - (parseInt(drive.FreeSpace) || 0),
            filesystem: drive.FileSystem || 'Unknown',
            label: drive.VolumeName || '',
            type: driveTypes[drive.DriveType] || 'Unknown',
            sizeFormatted: this.formatBytes(parseInt(drive.Size) || 0),
            freeFormatted: this.formatBytes(parseInt(drive.FreeSpace) || 0),
            usedFormatted: this.formatBytes((parseInt(drive.Size) || 0) - (parseInt(drive.FreeSpace) || 0)),
            usagePercentage: drive.Size ? Math.round(((parseInt(drive.Size) - parseInt(drive.FreeSpace)) / parseInt(drive.Size)) * 100) : 0
          }));

          resolve({
            drives: formattedDrives,
            platform: 'windows'
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Get Unix disk information
   */
  async getUnixDiskInfo() {
    return new Promise((resolve, reject) => {
      exec('df -h', { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const lines = stdout.split('\n').slice(1); // Skip header
          const drives = lines
            .filter(line => line.trim())
            .map(line => {
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 6) {
                return {
                  device: parts[0],
                  size: parts[1],
                  used: parts[2],
                  free: parts[3],
                  usagePercentage: parseInt(parts[4]) || 0,
                  mountPoint: parts[5],
                  filesystem: 'ext4', // Default, could be improved
                  type: 'Local Disk',
                  sizeFormatted: parts[1],
                  usedFormatted: parts[2],
                  freeFormatted: parts[3]
                };
              }
              return null;
            })
            .filter(Boolean);

          resolve({
            drives,
            platform: 'unix'
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Get process information
   */
  getProcessInfo() {
    return {
      pid: process.pid,
      ppid: process.ppid,
      title: process.title,
      argv: process.argv,
      execPath: process.execPath,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH ? process.env.PATH.split(path.delimiter).length + ' entries' : 'Not set',
        USER: process.env.USER || process.env.USERNAME,
        HOME: process.env.HOME || process.env.USERPROFILE
      },
      versions: process.versions,
      features: process.features,
      resourceUsage: process.resourceUsage ? process.resourceUsage() : null
    };
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const info = await this.getSystemInfo();
    const health = {
      overall: 'good',
      issues: [],
      warnings: [],
      recommendations: []
    };

    // Check memory usage
    if (info.memory.usagePercentage > 90) {
      health.issues.push('High memory usage detected');
      health.overall = 'critical';
    } else if (info.memory.usagePercentage > 80) {
      health.warnings.push('Memory usage is high');
      if (health.overall === 'good') health.overall = 'warning';
    }

    // Check disk usage
    info.disk.drives.forEach(drive => {
      if (drive.usagePercentage > 95) {
        health.issues.push(`Disk ${drive.device} is almost full`);
        health.overall = 'critical';
      } else if (drive.usagePercentage > 85) {
        health.warnings.push(`Disk ${drive.device} is getting full`);
        if (health.overall === 'good') health.overall = 'warning';
      }
    });

    // Check uptime
    if (info.basic.uptime > 30 * 24 * 60 * 60) { // 30 days
      health.recommendations.push('Consider restarting the system for optimal performance');
    }

    // Check CPU usage (simplified)
    if (info.cpu.usage.usage > 90) {
      health.issues.push('High CPU usage detected');
      health.overall = 'critical';
    }

    return health;
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format uptime to human readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} วัน`);
    if (hours > 0) parts.push(`${hours} ชั่วโมง`);
    if (minutes > 0) parts.push(`${minutes} นาที`);
    
    return parts.join(' ') || '0 นาที';
  }

  /**
   * Export system information to file
   */
  async exportSystemInfo(filePath) {
    try {
      const info = await this.getSystemInfo();
      const health = await this.getSystemHealth();
      
      const exportData = {
        systemInfo: info,
        systemHealth: health,
        exportTime: new Date().toISOString(),
        exportedBy: 'LabFlow Clinic System'
      };

      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');
      
      return {
        success: true,
        message: 'ส่งออกข้อมูลระบบเรียบร้อยแล้ว',
        filePath: filePath
      };
    } catch (error) {
      return {
        success: false,
        message: 'ไม่สามารถส่งออกข้อมูลระบบได้: ' + error.message
      };
    }
  }

  /**
   * Get system performance metrics
   */
  async getPerformanceMetrics() {
    const startTime = process.hrtime.bigint();
    const info = await this.getSystemInfo();
    const endTime = process.hrtime.bigint();
    
    return {
      ...info,
      performance: {
        dataCollectionTime: Number(endTime - startTime) / 1000000, // Convert to milliseconds
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = SystemInfo;
