const http = require('http');

console.log('🔍 Testing server connections...\n');

// Test Frontend
const testFrontend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8080', (res) => {
      console.log('✅ Frontend (Vite): OK - Status:', res.statusCode);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Frontend (Vite): FAILED -', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Frontend (Vite): TIMEOUT');
      resolve(false);
    });
  });
};

// Test Backend
const testBackend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Backend API: OK - Status:', res.statusCode);
        console.log('   Response:', data);
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend API: FAILED -', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Backend API: TIMEOUT');
      resolve(false);
    });
  });
};

// Test Proxy
const testProxy = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8080/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Proxy (Frontend -> Backend): OK - Status:', res.statusCode);
        console.log('   Response:', data);
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Proxy (Frontend -> Backend): FAILED -', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Proxy (Frontend -> Backend): TIMEOUT');
      resolve(false);
    });
  });
};

// Run tests
async function runTests() {
  const frontendOK = await testFrontend();
  const backendOK = await testBackend();
  const proxyOK = await testProxy();
  
  console.log('\n📊 Summary:');
  console.log('Frontend:', frontendOK ? '✅' : '❌');
  console.log('Backend:', backendOK ? '✅' : '❌');
  console.log('Proxy:', proxyOK ? '✅' : '❌');
  
  if (frontendOK && backendOK && proxyOK) {
    console.log('\n🎉 All connections working! You can now run Electron.');
  } else {
    console.log('\n⚠️  Some connections failed. Please fix the issues above.');
  }
}

runTests();
