const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== LabFlow Clinic Startup Check ===');
console.log('Node version:', process.version);
console.log('Electron version:', process.versions.electron);
console.log('Chrome version:', process.versions.chrome);
console.log('Platform:', os.platform());
console.log('Architecture:', os.arch());

// Check userData directory
const userDataPath = path.join(os.homedir(), '.labflow-clinic');
console.log('UserData path:', userDataPath);
console.log('UserData exists:', fs.existsSync(userDataPath));

// Check cache directories
const cachePath = path.join(userDataPath, 'Cache');
const gpuCachePath = path.join(userDataPath, 'GPUCache');
console.log('Cache path:', cachePath);
console.log('Cache exists:', fs.existsSync(cachePath));
console.log('GPU Cache path:', gpuCachePath);
console.log('GPU Cache exists:', fs.existsSync(gpuCachePath));

// Check permissions
try {
  const testFile = path.join(userDataPath, 'test-write.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('Write permissions: OK');
} catch (error) {
  console.log('Write permissions: ERROR -', error.message);
}

// Check if backend is running
const http = require('http');
const backendPort = process.env.BACKEND_PORT || 3001;

console.log('Checking backend connection...');
const req = http.get(`http://localhost:${backendPort}/api/health`, (res) => {
  console.log('Backend status:', res.statusCode);
  process.exit(0);
});

req.on('error', (error) => {
  console.log('Backend connection: ERROR -', error.message);
  process.exit(0);
});

req.setTimeout(3000, () => {
  console.log('Backend connection: TIMEOUT');
  req.destroy();
  process.exit(0);
});
