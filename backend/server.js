const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const ExcelTemplateProcessor = require('./utils/excelTemplates');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
let db;

// Session storage (in production, use Redis or database)
const activeSessions = new Map();

// Session timeout disabled - sessions never expire automatically
// const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes in milliseconds

// Session cleanup disabled - sessions persist until manual logout
const cleanupExpiredSessions = async () => {
  // Cleanup disabled - sessions never expire automatically
  console.log('Session cleanup disabled - sessions persist until manual logout');
};

// Run session cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL, // Netlify URL
      /\.netlify\.app$/, // Any Netlify subdomain
      /localhost:\d+$/ // Any localhost port
    ].filter(Boolean);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
// Increase payload size limit for file uploads (base64 encoded files can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB with better error handling
async function connectToMongoDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in log
    
    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully');
    db = client.db('labflow');
    console.log('✅ Database selected: labflow');
    
    // Test database connection
    await db.admin().ping();
    console.log('✅ Database ping successful');
    
    // Create unique indexes to prevent duplicates
    try {
      await db.collection('patients').createIndex({ ln: 1 }, { unique: true });
      await db.collection('patients').createIndex({ idCard: 1 }, { unique: true, sparse: true });
      
      // Create session indexes for performance
      await db.collection('sessions').createIndex({ username: 1, sessionId: 1 }, { unique: true });
      await db.collection('sessions').createIndex({ lastActivity: 1 }, { expireAfterSeconds: 1800 }); // Auto-expire after 30 minutes
      
      // Create indexes for medical records search optimization
      await db.collection('visits').createIndex({ patientName: 1 });
      await db.collection('visits').createIndex({ patientId: 1 });
      await db.collection('visits').createIndex({ visitDate: -1 });
      await db.collection('patients').createIndex({ idCard: 1 });
      await db.collection('patients').createIndex({ phoneNumber: 1 });
      await db.collection('patients').createIndex({ firstName: 1, lastName: 1 });
      await db.collection('orders').createIndex({ visitId: 1 });
      await db.collection('results').createIndex({ orderId: 1 });
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.log('ℹ️ Indexes may already exist:', error.message);
    }
    
    // Clean up duplicate null idCard values
    try {
      console.log('🧹 Cleaning up duplicate null idCard values...');
      const patientsWithNullIdCard = await db.collection('patients')
        .find({ 
          $or: [
            { idCard: null },
            { idCard: '' },
            { idCard: { $exists: false } }
          ]
        })
        .toArray();
      
      console.log(`Found ${patientsWithNullIdCard.length} patients with null/empty idCard`);
      
      for (const patient of patientsWithNullIdCard) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 5);
        const uniqueIdCard = `NO_ID_${timestamp}_${randomSuffix}`;
        
        await db.collection('patients').updateOne(
          { _id: patient._id },
          { $set: { idCard: uniqueIdCard } }
        );
        
        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      console.log('✅ Cleaned up duplicate null idCard values');
    } catch (error) {
      console.log('⚠️ Error cleaning up idCard values:', error.message);
    }
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    console.error('Full error:', error);
    
    // Exit the process if we can't connect to the database
    console.log('🚨 Cannot connect to MongoDB Atlas. Please check your connection and try again.');
    process.exit(1);
  }
}

// Connect to database
connectToMongoDB();

// Middleware to check database connection
const checkDatabaseConnection = (req, res, next) => {
  if (!db) {
    return res.status(503).json({ 
      error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' 
    });
  }
  next();
};

// Middleware to validate user session and existence
const validateUserSession = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const username = req.headers['x-username'];

    if (!sessionId || !username) {
      return res.status(401).json({ 
        error: 'INVALID_SESSION',
        message: 'กรุณาเข้าสู่ระบบใหม่' 
      });
    }

    // First check memory cache for performance
    let sessionData = activeSessions.get(username);
    
    // If not in memory, check database
    if (!sessionData || sessionData.sessionId !== sessionId) {
      const dbSession = await db.collection('sessions').findOne({ 
        username: username,
        sessionId: sessionId 
      });
      
      if (!dbSession) {
        return res.status(401).json({ 
          error: 'SESSION_EXPIRED',
          message: 'เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่' 
        });
      }
      
      // Session expiration check disabled - sessions never expire automatically
      // const sessionAge = Date.now() - new Date(dbSession.lastActivity).getTime();
      // if (sessionAge > SESSION_TIMEOUT) {
      //   // Remove expired session
      //   await db.collection('sessions').deleteOne({ _id: dbSession._id });
      //   activeSessions.delete(username);
      //   return res.status(401).json({ 
      //     error: 'SESSION_EXPIRED',
      //     message: 'เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่' 
      //   });
      // }
      
      // Update memory cache
      sessionData = {
        sessionId: dbSession.sessionId,
        loginTime: dbSession.loginTime,
        lastActivity: dbSession.lastActivity,
        userAgent: dbSession.userAgent
      };
      activeSessions.set(username, sessionData);
    }

    // Check if user still exists in database
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      // Remove invalid session
      await db.collection('sessions').deleteOne({ username, sessionId });
      activeSessions.delete(username);
      return res.status(401).json({ 
        error: 'USER_NOT_FOUND',
        message: 'ไม่พบผู้ใช้ในระบบ กรุณาติดต่อผู้ดูแลระบบ' 
      });
    }

    // Update session last activity in both memory and database
    const now = new Date();
    sessionData.lastActivity = now;
    await db.collection('sessions').updateOne(
      { username, sessionId },
      { $set: { lastActivity: now } }
    );
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ 
      error: 'SESSION_ERROR',
      message: 'เกิดข้อผิดพลาดในการตรวจสอบเซสชั่น' 
    });
  }
};

// Apply database check middleware to all API routes except health check
app.use('/api', (req, res, next) => {
  if (req.path === '/health') {
    return next(); // Skip database check for health endpoint
  }
  return checkDatabaseConnection(req, res, next);
});

// Health check endpoint (doesn't require database)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected'
  });
});

// API Routes

// Authentication Routes
// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, phone, username, password } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !phone || !username || !password) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    
    // Check if username already exists
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' });
    }
    
    // Create new user
    const newUser = {
      firstName,
      lastName,
      phone,
      username,
      password, // In production, this should be hashed
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: 'สร้างบัญชีผู้ใช้สำเร็จ',
      user: { ...userWithoutPassword, _id: result.insertedId }
    });
    
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }
    
    // Find user by username
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
    
    // Check password (in production, compare hashed password)
    if (user.password !== password) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
    
    // Generate session ID
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Remove any existing sessions for this user (force logout previous sessions)
    await db.collection('sessions').deleteMany({ username });
    activeSessions.delete(username);
    
    // Store new session in database
    const sessionData = {
      username,
      sessionId,
      loginTime: now,
      lastActivity: now,
      userAgent
    };
    
    await db.collection('sessions').insertOne(sessionData);
    
    // Also store in memory for performance
    activeSessions.set(username, sessionData);
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: userWithoutPassword,
      sessionId: sessionId
    });
    
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'ไม่สามารถเข้าสู่ระบบได้' });
  }
});

// User logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const username = req.headers['x-username'];
    
    if (username) {
      // Remove from database
      await db.collection('sessions').deleteMany({ username });
      // Remove from memory
      activeSessions.delete(username);
      console.log(`User ${username} logged out`);
    }
    
    res.json({ message: 'ออกจากระบบสำเร็จ' });
  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({ error: 'ไม่สามารถออกจากระบบได้' });
  }
});

// Validate session endpoint
app.get('/api/auth/validate', validateUserSession, async (req, res) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json({
      valid: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({ error: 'ไม่สามารถตรวจสอบเซสชั่นได้' });
  }
});

// Get all users (for authentication purposes)
app.get('/api/auth/users', async (req, res) => {
  try {
    // Get all users but exclude passwords for security
    const users = await db.collection('users').find({}, { 
      projection: { password: 0 } // Exclude password field
    }).toArray();
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
  }
});

// Get all users with passwords (for delete authentication)
app.get('/api/users', async (req, res) => {
  try {
    // Get all users including passwords (for authentication purposes)
    const users = await db.collection('users').find({}).toArray();
    
    // Debug: Log users data to see what's actually in the database
    console.log('=== USERS API DEBUG ===');
    console.log('Users from database:', JSON.stringify(users, null, 2));
    console.log('Users count:', users.length);
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        username: user.username,
        password: user.password,
        hasPassword: user.password !== undefined,
        passwordType: typeof user.password
      });
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users with passwords:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
  }
});

// Company Settings Routes
// Get company settings
app.get('/api/company-settings', async (req, res) => {
  try {
    const settings = await db.collection('company_settings').findOne({});
    res.json(settings || {});
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลบริษัทได้' });
  }
});

// Save company settings
app.post('/api/company-settings', async (req, res) => {
  try {
    const {
      name,
      nameEn,
      address,
      phone,
      email,
      website,
      taxId,
      license
    } = req.body;

    const companySettings = {
      name,
      nameEn,
      address,
      phone,
      email,
      website,
      taxId,
      license,
      updatedAt: new Date()
    };

    // Use upsert to update existing or create new
    const result = await db.collection('company_settings').replaceOne(
      {},
      companySettings,
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'บันทึกข้อมูลบริษัทสำเร็จ',
      data: companySettings
    });
  } catch (error) {
    console.error('Error saving company settings:', error);
    res.status(500).json({ 
      success: false,
      error: 'ไม่สามารถบันทึกข้อมูลบริษัทได้' 
    });
  }
});

// Get all patients
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await db.collection('patients')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคนไข้ได้' });
  }
});

// Get patient by ID
app.get('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const patient = await db.collection('patients')
      .findOne({ _id: new ObjectId(id) });
    
    if (!patient) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลคนไข้' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคนไข้ได้' });
  }
});

// Create new patient
app.post('/api/patients', async (req, res) => {
  try {
    console.log('=== CREATE PATIENT REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Check database connection
    if (!db) {
      console.error('Database not connected');
      return res.status(500).json({ error: 'ฐานข้อมูลไม่พร้อมใช้งาน' });
    }

    // Validate required fields
    const requiredFields = ['ln', 'firstName', 'lastName'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        console.error(`Missing required field: ${field}`);
        return res.status(400).json({ error: `กรุณากรอก${field === 'ln' ? 'เลข LN' : field === 'firstName' ? 'ชื่อ' : 'นามสกุล'}` });
      }
    }

    const patientData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Patient data to save:', JSON.stringify(patientData, null, 2));

    // Check if patient with same ID card already exists (only if ID card is provided and not empty)
    if (patientData.idCard && patientData.idCard.trim() !== '') {
      console.log('Checking for existing ID card:', patientData.idCard);
      const existingPatient = await db.collection('patients')
        .findOne({ 
          idCard: patientData.idCard.trim()
        });
      
      if (existingPatient) {
        console.log('Found existing patient with same ID card:', existingPatient._id);
        return res.status(400).json({ error: 'มีคนไข้ที่ใช้เลขบัตรประชาชนนี้แล้ว' });
      }
    } else {
      // If idCard is empty or null, generate a unique placeholder to avoid duplicate null values
      // Use a timestamp-based unique identifier for patients without ID cards
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 5);
      patientData.idCard = `NO_ID_${timestamp}_${randomSuffix}`;
      console.log('ID Card is empty, setting unique placeholder:', patientData.idCard);
    }

    // Check if LN already exists and generate new one if needed
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existingLN = await db.collection('patients')
        .findOne({ ln: patientData.ln });
      
      if (!existingLN) {
        // LN is unique, proceed with insertion
        break;
      }
      
      // LN exists, generate a new one
      const now = new Date();
      const buddhistYear = (now.getFullYear() + 543).toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const prefix = buddhistYear + month;
      
      // Find existing LNs with current year/month prefix
      const existingLNs = await db.collection('patients')
        .find({ ln: { $regex: `^${prefix}` } })
        .toArray();
      
      const currentNumbers = existingLNs
        .map(p => parseInt(p.ln.slice(-4)))
        .filter(n => !isNaN(n))
        .sort((a, b) => b - a);
      
      const nextNumber = currentNumbers.length > 0 ? currentNumbers[0] + 1 : 1;
      patientData.ln = prefix + nextNumber.toString().padStart(4, '0');
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'ไม่สามารถสร้างเลข LN ที่ไม่ซ้ำได้' });
    }

    console.log('Inserting patient data into database...');
    const result = await db.collection('patients').insertOne(patientData);
    console.log('Insert result:', result);
    
    if (!result.insertedId) {
      console.error('Failed to insert patient - no insertedId returned');
      return res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลคนไข้ได้' });
    }
    
    console.log('Fetching newly created patient...');
    const newPatient = await db.collection('patients')
      .findOne({ _id: result.insertedId });
    
    if (!newPatient) {
      console.error('Failed to fetch newly created patient');
      return res.status(500).json({ error: 'บันทึกข้อมูลแล้วแต่ไม่สามารถดึงข้อมูลกลับมาได้' });
    }
    
    console.log('Successfully created patient:', newPatient._id);
    res.status(201).json(newPatient);
  } catch (error) {
    console.error('Error creating patient:', error);
    console.error('Error stack:', error.stack);
    
    // More specific error messages
    if (error.code === 11000) {
      return res.status(400).json({ error: 'ข้อมูลซ้ำ: เลข LN หรือเลขบัตรประชาชนมีอยู่แล้ว' });
    }
    
    res.status(500).json({ 
      error: 'ไม่สามารถบันทึกข้อมูลคนไข้ได้',
      details: error.message 
    });
  }
});

// Update patient
app.put('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Handle empty idCard
    if (updateData.idCard !== undefined) {
      if (!updateData.idCard || updateData.idCard.trim() === '') {
        // Instead of setting to null, generate a unique placeholder to avoid duplicate null values
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substr(2, 5);
        updateData.idCard = `NO_ID_${timestamp}_${randomSuffix}`;
      } else {
        // Check if another patient already has this ID card
        const existingPatient = await db.collection('patients')
          .findOne({ 
            idCard: updateData.idCard.trim(),
            _id: { $ne: new ObjectId(id) } // Exclude current patient
          });
        
        if (existingPatient) {
          return res.status(400).json({ error: 'มีคนไข้ที่ใช้เลขบัตรประชาชนนี้แล้ว' });
        }
        
        updateData.idCard = updateData.idCard.trim();
      }
    }
    
    // Remove _id from update data if present
    delete updateData._id;

    const result = await db.collection('patients')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลคนไข้' });
    }
    
    const updatedPatient = await db.collection('patients')
      .findOne({ _id: new ObjectId(id) });
    
    res.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลคนไข้ได้' });
  }
});

// Delete patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const result = await db.collection('patients')
      .deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลคนไข้' });
    }
    
    res.json({ message: 'ลบข้อมูลคนไข้สำเร็จ' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'ไม่สามารถลบข้อมูลคนไข้ได้' });
  }
});

// Search patients
app.get('/api/patients/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const searchRegex = new RegExp(query, 'i');
    
    const patients = await db.collection('patients')
      .find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { idCard: searchRegex },
          { ln: searchRegex }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'ไม่สามารถค้นหาข้อมูลคนไข้ได้' });
  }
});

// Visit APIs

// Get all visits with patient data populated
app.get('/api/visits', async (req, res) => {
  try {
    const visits = await db.collection('visits')
      .aggregate([
        {
          $addFields: {
            patientObjectId: { 
              $cond: {
                if: { $type: "$patientId" },
                then: { $toObjectId: "$patientId" },
                else: "$patientObjectId"
              }
            }
          }
        },
        {
          $lookup: {
            from: 'patients',
            localField: 'patientObjectId',
            foreignField: '_id',
            as: 'patientData'
          }
        },
        {
          $addFields: {
            patientData: { $arrayElemAt: ['$patientData', 0] }
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ])
      .toArray();
    
    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Visit ได้' });
  }
});

// Generate next visit number with date prefix (Gregorian year) - MUST be before /:id route
app.get('/api/visits/generate-number/:date?', async (req, res) => {
  try {
    console.log('Generate visit number called with params:', req.params);
    
    // Check if database is connected
    if (!db) {
      console.error('Database not connected');
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const targetDate = req.params.date ? new Date(req.params.date) : new Date();
    console.log('Target date:', targetDate);
    
    // Use Gregorian year (last 2 digits) for visit number
    const gregorianYear = targetDate.getFullYear().toString().slice(-2);
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const datePrefix = gregorianYear + month;
    console.log('Date prefix:', datePrefix);
    
    // Find the latest visit number for this year/month
    const latestVisit = await db.collection('visits')
      .find({ visitNumber: { $regex: `^${datePrefix}` } })
      .sort({ visitNumber: -1 })
      .limit(1)
      .toArray();
    
    console.log('Latest visit found:', latestVisit);
    
    let nextSequence = 1;
    if (latestVisit.length > 0) {
      const lastNumber = latestVisit[0].visitNumber;
      const lastSequence = parseInt(lastNumber.slice(-4));
      nextSequence = lastSequence + 1;
    }
    
    const visitNumber = datePrefix + nextSequence.toString().padStart(4, '0');
    console.log('Generated visit number:', visitNumber);
    
    res.json({ visitNumber });
  } catch (error) {
    console.error('Error generating visit number:', error);
    res.status(500).json({ error: 'Cannot generate visit number' });
  }
});

// Get specific visit by visitNumber with patient data
app.get('/api/visits/by-number/:visitNumber', async (req, res) => {
  try {
    const { visitNumber } = req.params;
    
    const visit = await db.collection('visits')
      .aggregate([
        {
          $match: { visitNumber: visitNumber }
        },
        {
          $addFields: {
            patientObjectId: { 
              $cond: {
                if: { $type: "$patientId" },
                then: { $toObjectId: "$patientId" },
                else: "$patientObjectId"
              }
            }
          }
        },
        {
          $lookup: {
            from: 'patients',
            localField: 'patientObjectId',
            foreignField: '_id',
            as: 'patientData'
          }
        },
        {
          $addFields: {
            patientData: { $arrayElemAt: ['$patientData', 0] }
          }
        }
      ])
      .toArray();
    
    if (visit.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล Visit' });
    }
    
    res.json(visit[0]);
  } catch (error) {
    console.error('Error fetching visit:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Visit ได้' });
  }
});

// Get visit by ID
app.get('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const visit = await db.collection('visits')
      .findOne({ _id: new ObjectId(id) });
    
    if (!visit) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล Visit' });
    }
    
    res.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Visit ได้' });
  }
});

// Create new visit
app.post('/api/visits', async (req, res) => {
  try {
    const visitData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Convert patientId string to ObjectId if provided
    if (visitData.patientId && ObjectId.isValid(visitData.patientId)) {
      visitData.patientObjectId = new ObjectId(visitData.patientId);
    }

    // Check if visit number already exists and generate new one if needed
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existingVisit = await db.collection('visits')
        .findOne({ visitNumber: visitData.visitNumber });
      
      if (!existingVisit) {
        break;
      }
      
      // Generate new visit number
      const now = new Date();
      const buddhistYear = (now.getFullYear() + 543).toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const prefix = buddhistYear + month + day;
      
      const existingVisits = await db.collection('visits')
        .find({ visitNumber: { $regex: `^${prefix}` } })
        .toArray();
      
      const currentNumbers = existingVisits
        .map(v => parseInt(v.visitNumber.slice(-4)))
        .filter(n => !isNaN(n))
        .sort((a, b) => b - a);
      
      const nextNumber = currentNumbers.length > 0 ? currentNumbers[0] + 1 : 1;
      visitData.visitNumber = prefix + nextNumber.toString().padStart(4, '0');
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'ไม่สามารถสร้างเลข Visit ที่ไม่ซ้ำได้' });
    }

    const result = await db.collection('visits').insertOne(visitData);
    
    const newVisit = await db.collection('visits')
      .findOne({ _id: result.insertedId });
    
    res.status(201).json(newVisit);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูล Visit ได้' });
  }
});

// Update visit
app.put('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Remove _id from update data if present
    delete updateData._id;

    const result = await db.collection('visits')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล Visit' });
    }

    const updatedVisit = await db.collection('visits')
      .findOne({ _id: new ObjectId(id) });

    res.json(updatedVisit);
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดต Visit ได้' });
  }
});

// Delete visit
app.delete('/api/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const result = await db.collection('visits')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล Visit' });
    }

    res.json({ message: 'ลบ Visit สำเร็จ' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ error: 'ไม่สามารถลบ Visit ได้' });
  }
});

// Lab Tests APIs

// Get all lab tests
app.get('/api/labtests', async (req, res) => {
  try {
    const labTests = await db.collection('labtests')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(labTests);
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายการตรวจได้' });
  }
});

// Get lab test by ID
app.get('/api/labtests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const labTest = await db.collection('labtests')
      .findOne({ _id: new ObjectId(id) });
    
    if (!labTest) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลรายการตรวจ' });
    }
    
    res.json(labTest);
  } catch (error) {
    console.error('Error fetching lab test:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายการตรวจได้' });
  }
});

// Create new lab test
app.post('/api/labtests', async (req, res) => {
  try {
    const labTestData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Allow duplicate codes - removed uniqueness check

    const result = await db.collection('labtests').insertOne(labTestData);
    
    const newLabTest = await db.collection('labtests')
      .findOne({ _id: result.insertedId });
    
    res.status(201).json(newLabTest);
  } catch (error) {
    console.error('Error creating lab test:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลรายการตรวจได้' });
  }
});

// Update lab test
app.put('/api/labtests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    delete updateData._id;

    const result = await db.collection('labtests')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลรายการตรวจ' });
    }
    
    const updatedLabTest = await db.collection('labtests')
      .findOne({ _id: new ObjectId(id) });
    
    res.json(updatedLabTest);
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลรายการตรวจได้' });
  }
});

// Delete lab test
app.delete('/api/labtests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const result = await db.collection('labtests')
      .deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลรายการตรวจ' });
    }
    
    res.json({ message: 'ลบรายการตรวจสำเร็จ' });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    res.status(500).json({ error: 'ไม่สามารถลบรายการตรวจได้' });
  }
});

// Search lab tests
app.get('/api/labtests/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const labTests = await db.collection('labtests')
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(labTests);
  } catch (error) {
    console.error('Error searching lab tests:', error);
    res.status(500).json({ error: 'ไม่สามารถค้นหารายการตรวจได้' });
  }
});

// ===== LAB GROUP ROUTES =====

// Get all lab groups
app.get('/api/labgroups', async (req, res) => {
  try {
    const labGroups = await db.collection('labgroups')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(labGroups);
  } catch (error) {
    console.error('Error fetching lab groups:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลกลุ่มการตรวจได้' });
  }
});

// Get lab group by ID
app.get('/api/labgroups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รหัสกลุ่มการตรวจไม่ถูกต้อง' });
    }
    
    const labGroup = await db.collection('labgroups').findOne({ _id: new ObjectId(id) });
    
    if (!labGroup) {
      return res.status(404).json({ error: 'ไม่พบกลุ่มการตรวจ' });
    }
    
    res.json(labGroup);
  } catch (error) {
    console.error('Error fetching lab group:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลกลุ่มการตรวจได้' });
  }
});

// Create new lab group
app.post('/api/labgroups', async (req, res) => {
  try {
    const { code, name, price, labTests } = req.body;
    
    // Validation
    if (!code || !name || !price || !labTests || !Array.isArray(labTests)) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน กรุณากรอกรหัส ชื่อ ราคา และรายการตรวจ' });
    }
    
    // Allow duplicate codes - removed uniqueness check for lab groups
    
    // Validate lab test IDs
    const validLabTests = [];
    for (const testId of labTests) {
      if (ObjectId.isValid(testId)) {
        const test = await db.collection('labtests').findOne({ _id: new ObjectId(testId) });
        if (test) {
          validLabTests.push(testId);
        }
      }
    }
    
    if (validLabTests.length === 0) {
      return res.status(400).json({ error: 'กรุณาเลือกรายการตรวจที่ถูกต้อง' });
    }
    
    const newLabGroup = {
      code,
      name,
      price: parseFloat(price),
      labTests: validLabTests,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('labgroups').insertOne(newLabGroup);
    const createdGroup = await db.collection('labgroups').findOne({ _id: result.insertedId });
    
    res.status(201).json(createdGroup);
  } catch (error) {
    console.error('Error creating lab group:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างกลุ่มการตรวจได้' });
  }
});

// Update lab group
app.put('/api/labgroups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, price, labTests } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รหัสกลุ่มการตรวจไม่ถูกต้อง' });
    }
    
    // Check if group exists
    const existingGroup = await db.collection('labgroups').findOne({ _id: new ObjectId(id) });
    if (!existingGroup) {
      return res.status(404).json({ error: 'ไม่พบกลุ่มการตรวจ' });
    }
    
    // Check if code is being changed and already exists
    if (code && code !== existingGroup.code) {
      const codeExists = await db.collection('labgroups').findOne({ 
        code: code,
        _id: { $ne: new ObjectId(id) }
      });
      if (codeExists) {
        return res.status(400).json({ error: 'รหัสกลุ่มการตรวจนี้มีอยู่แล้ว' });
      }
    }
    
    // Validate lab test IDs if provided
    let validLabTests = existingGroup.labTests;
    if (labTests && Array.isArray(labTests)) {
      validLabTests = [];
      for (const testId of labTests) {
        if (ObjectId.isValid(testId)) {
          const test = await db.collection('labtests').findOne({ _id: new ObjectId(testId) });
          if (test) {
            validLabTests.push(testId);
          }
        }
      }
    }
    
    const updateData = {
      ...(code && { code }),
      ...(name && { name }),
      ...(price && { price: parseFloat(price) }),
      labTests: validLabTests,
      updatedAt: new Date()
    };
    
    await db.collection('labgroups').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    const updatedGroup = await db.collection('labgroups').findOne({ _id: new ObjectId(id) });
    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating lab group:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตกลุ่มการตรวจได้' });
  }
});

// Delete lab group
app.delete('/api/labgroups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รหัสกลุ่มการตรวจไม่ถูกต้อง' });
    }
    
    const result = await db.collection('labgroups').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบกลุ่มการตรวจ' });
    }
    
    res.json({ message: 'ลบกลุ่มการตรวจสำเร็จ' });
  } catch (error) {
    console.error('Error deleting lab group:', error);
    res.status(500).json({ error: 'ไม่สามารถลบกลุ่มการตรวจได้' });
  }
});

// Search lab groups
app.get('/api/labgroups/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const labGroups = await db.collection('labgroups')
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { code: { $regex: query, $options: 'i' } }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(labGroups);
  } catch (error) {
    console.error('Error searching lab groups:', error);
    res.status(500).json({ error: 'ไม่สามารถค้นหากลุ่มการตรวจได้' });
  }
});

// ===== ORDERS ROUTES =====

// Get all orders with pagination and search support
app.get('/api/orders', async (req, res) => {
  try {
    // Extract query parameters
    const limit = parseInt(req.query.limit) || 0; // 0 means no limit
    const skip = parseInt(req.query.skip) || 0;
    const sortBy = req.query.sortBy || 'orderDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search;

    console.log('=== ORDERS API REQUEST ===');
    console.log('Query params:', req.query);
    console.log('Parsed params:', { limit, skip, sortBy, sortOrder, search });

    // Build match stage for search
    let matchStage = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      matchStage = {
        $or: [
          { 'visitData.visitNumber': searchRegex },
          { 'visitData.patientName': searchRegex },
          { 'labOrders.testName': searchRegex },
          { 'labOrders.name': searchRegex },
          { 'labOrders.code': searchRegex }
        ]
      };
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: 'visits',
          localField: 'visitId',
          foreignField: '_id',
          as: 'visitData'
        }
      },
      {
        $addFields: {
          visitData: { $arrayElemAt: ['$visitData', 0] }
        }
      }
    ];

    // Add match stage if search is provided
    if (search) {
      pipeline.push({ $match: matchStage });
    }

    // Add sort stage
    const sortField = sortBy === 'orderDate' ? 'orderDate' : 'createdAt';
    pipeline.push({ $sort: { [sortField]: sortOrder } });

    // Add skip and limit stages
    if (skip > 0) {
      pipeline.push({ $skip: skip });
    }
    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    const orders = await db.collection('orders')
      .aggregate(pipeline)
      .toArray();

    // Populate lab test details for each order
    for (let order of orders) {
      if (order.labOrders && Array.isArray(order.labOrders)) {
        for (let labOrder of order.labOrders) {
          if (labOrder.type === 'individual') {
            // Get individual lab test details
            const labTest = await db.collection('labtests').findOne({ _id: new ObjectId(labOrder.testId) });
            if (labTest) {
              labOrder.testDetails = labTest;
            }
          } else if (labOrder.type === 'package') {
            // Get lab group and its individual tests
            const labGroup = await db.collection('labgroups').findOne({ _id: new ObjectId(labOrder.testId) });
            if (labGroup) {
              labOrder.groupDetails = labGroup;
              
              // Get individual tests in the group
              const individualTests = [];
              for (let testId of labGroup.labTests) {
                const test = await db.collection('labtests').findOne({ _id: new ObjectId(testId) });
                if (test) {
                  individualTests.push(test);
                }
              }
              labOrder.individualTests = individualTests;
            }
          }
        }
      }
    }
    
    console.log(`Returning ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้' });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const order = await db.collection('orders')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'visits',
            localField: 'visitId',
            foreignField: '_id',
            as: 'visitData'
          }
        },
        {
          $addFields: {
            visitData: { $arrayElemAt: ['$visitData', 0] }
          }
        }
      ])
      .toArray();
    
    if (order.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลคำสั่งซื้อ' });
    }

    // Populate lab test details for the order
    const orderData = order[0];
    if (orderData.labOrders && Array.isArray(orderData.labOrders)) {
      for (let labOrder of orderData.labOrders) {
        if (labOrder.type === 'individual') {
          // Get individual lab test details
          const labTest = await db.collection('labtests').findOne({ _id: new ObjectId(labOrder.testId) });
          if (labTest) {
            labOrder.testDetails = labTest;
          }
        } else if (labOrder.type === 'package') {
          // Get lab group and its individual tests
          const labGroup = await db.collection('labgroups').findOne({ _id: new ObjectId(labOrder.testId) });
          if (labGroup) {
            labOrder.groupDetails = labGroup;
            
            // Get individual tests in the group
            const individualTests = [];
            for (let testId of labGroup.labTests) {
              const test = await db.collection('labtests').findOne({ _id: new ObjectId(testId) });
              if (test) {
                individualTests.push(test);
              }
            }
            labOrder.individualTests = individualTests;
          }
        }
      }
    }
    
    res.json(orderData);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้' });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      visitId,
      labOrders,
      totalAmount,
      paymentMethod,
      status = 'pending'
    } = req.body;

    // Validate required fields
    if (!visitId || !labOrders || !Array.isArray(labOrders) || labOrders.length === 0) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ visitId และรายการตรวจ' });
    }

    // Validate visitId
    if (!ObjectId.isValid(visitId)) {
      return res.status(400).json({ error: 'รูปแบบ visitId ไม่ถูกต้อง' });
    }

    // Check if visit exists
    const visit = await db.collection('visits').findOne({ _id: new ObjectId(visitId) });
    if (!visit) {
      return res.status(404).json({ error: 'ไม่พบข้อมูล Visit' });
    }

    const orderData = {
      visitId: new ObjectId(visitId),
      labOrders: labOrders,
      totalAmount: parseFloat(totalAmount) || 0,
      paymentMethod: paymentMethod || 'เงินสด',
      status: status,
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(orderData);
    
    const newOrder = await db.collection('orders')
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: 'visits',
            localField: 'visitId',
            foreignField: '_id',
            as: 'visitData'
          }
        },
        {
          $addFields: {
            visitData: { $arrayElemAt: ['$visitData', 0] }
          }
        }
      ])
      .toArray();
    
    res.status(201).json(newOrder[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึกคำสั่งซื้อได้' });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }

    if (!status) {
      return res.status(400).json({ error: 'กรุณาระบุสถานะ' });
    }

    const validStatuses = ['pending', 'process', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
    }

    const result = await db.collection('orders')
      .updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            status: status,
            updatedAt: new Date()
          }
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลคำสั่งซื้อ' });
    }

    const updatedOrder = await db.collection('orders')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'visits',
            localField: 'visitId',
            foreignField: '_id',
            as: 'visitData'
          }
        },
        {
          $addFields: {
            visitData: { $arrayElemAt: ['$visitData', 0] }
          }
        }
      ])
      .toArray();

    res.json(updatedOrder[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้' });
  }
});

// Update entire order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Remove _id from update data if present
    delete updateData._id;

    // Convert visitId to ObjectId if provided
    if (updateData.visitId && ObjectId.isValid(updateData.visitId)) {
      updateData.visitId = new ObjectId(updateData.visitId);
    }

    const result = await db.collection('orders')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลคำสั่งซื้อ' });
    }

    const updatedOrder = await db.collection('orders')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'visits',
            localField: 'visitId',
            foreignField: '_id',
            as: 'visitData'
          }
        },
        {
          $addFields: {
            visitData: { $arrayElemAt: ['$visitData', 0] }
          }
        }
      ])
      .toArray();

    res.json(updatedOrder[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตคำสั่งซื้อได้' });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'รูปแบบ ID ไม่ถูกต้อง' });
    }
    
    const result = await db.collection('orders').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลคำสั่งซื้อ' });
    }
    
    res.json({ message: 'ลบคำสั่งซื้อสำเร็จ' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'ไม่สามารถลบคำสั่งซื้อได้' });
  }
});

// ===== RESULTS API ROUTES =====

// Get all results
app.get('/api/results', async (req, res) => {
  try {
    const results = await db.collection('results')
      .aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'orderData'
          }
        },
        {
          $addFields: {
            orderData: { $arrayElemAt: ['$orderData', 0] }
          }
        },
        {
          $lookup: {
            from: 'visits',
            localField: 'orderData.visitId',
            foreignField: '_id',
            as: 'visitData'
          }
        },
        {
          $addFields: {
            visitData: { $arrayElemAt: ['$visitData', 0] }
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ])
      .toArray();
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผลการตรวจได้' });
  }
});

// Create new result
app.post('/api/results', async (req, res) => {
  try {
    console.log('POST /api/results - Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      orderId,
      testResults,
      attachedFiles,
      technician,
      notes
    } = req.body;

    console.log('Extracted data:', { orderId, testResults: testResults?.length, attachedFiles: attachedFiles?.length });

    // Validate required fields
    if (!orderId) {
      console.log('Validation failed - missing orderId');
      return res.status(400).json({ error: 'ไม่พบ Order ID' });
    }
    
    if (!testResults) {
      console.log('Validation failed - missing testResults');
      return res.status(400).json({ error: 'ไม่พบข้อมูลผลการตรวจ' });
    }
    
    if (!Array.isArray(testResults)) {
      console.log('Validation failed - testResults is not array:', typeof testResults);
      return res.status(400).json({ error: 'รูปแบบข้อมูลผลการตรวจไม่ถูกต้อง' });
    }
    
    if (testResults.length === 0) {
      console.log('Validation failed - empty testResults array');
      return res.status(400).json({ error: 'ไม่มีข้อมูลผลการตรวจ' });
    }

    // Validate orderId
    if (!ObjectId.isValid(orderId)) {
      console.log('Validation failed - invalid ObjectId:', orderId);
      return res.status(400).json({ error: 'รูปแบบ Order ID ไม่ถูกต้อง' });
    }

    // Check if order exists
    console.log('Checking if order exists:', orderId);
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ error: 'ไม่พบข้อมูล Order' });
    }

    console.log('Order found, creating result data...');
    const resultData = {
      orderId: new ObjectId(orderId),
      testResults: testResults.map(result => ({
        testId: result.testId,
        testName: result.testName,
        result: result.result || '',
        referenceRange: result.referenceRange || '',
        comment: result.comment || '',
        status: result.status || 'completed'
      })),
      attachedFiles: attachedFiles || [],
      technician: technician || '',
      notes: notes || '',
      resultDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Inserting result into database...');
    const insertResult = await db.collection('results').insertOne(resultData);
    console.log('Result inserted with ID:', insertResult.insertedId);
    
    // Update order status to completed
    console.log('Updating order status to completed...');
    await db.collection('orders').updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          status: 'completed',
          updatedAt: new Date()
        }
      }
    );

    console.log('Fetching saved result...');
    const savedResult = await db.collection('results').findOne({ _id: insertResult.insertedId });
    
    console.log('Result saved successfully');
    res.status(201).json(savedResult);
  } catch (error) {
    console.error('Error creating result - Full error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    // More specific error handling
    let errorMessage = 'ไม่สามารถบันทึกผลการตรวจได้';
    let statusCode = 500;
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      if (error.code === 11000) {
        errorMessage = 'ข้อมูลซ้ำในระบบ';
        statusCode = 409;
      } else {
        errorMessage = 'เกิดข้อผิดพลาดกับฐานข้อมูล';
      }
    } else if (error.message.includes('ObjectId')) {
      errorMessage = 'รูปแบบ ID ไม่ถูกต้อง';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage, 
      details: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Dashboard API Routes
// Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Use provided date or default to today
    const selectedDate = date ? new Date(date) : new Date();
    const todayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    // Get today's statistics
    const todayPatients = await db.collection('visits').countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });

    // Count new patients registered today (from patients collection)
    const newPatientsToday = await db.collection('patients').countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    });

    const todayTests = await db.collection('orders').aggregate([
      { $match: { createdAt: { $gte: todayStart, $lt: todayEnd } } },
      { $unwind: '$items' },
      { $count: 'total' }
    ]).toArray();

    const pendingResults = await db.collection('orders').countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd },
      status: { $in: ['process', 'completed'] }
    });

    const todayRevenue = await db.collection('orders').aggregate([
      { 
        $match: { 
          createdAt: { $gte: todayStart, $lt: todayEnd },
          status: { $in: ['process', 'completed'] }, // นับเฉพาะที่ชำระเงินแล้ว
          paymentMethod: { $nin: ['free', 'ฟรี', 'Free', 'FREE'] } // ตัดรายการฟรีออก
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).toArray();

    // Get yesterday's statistics for comparison
    const yesterdayPatients = await db.collection('visits').countDocuments({
      createdAt: { $gte: yesterday, $lt: yesterdayEnd }
    });

    // Count new patients registered yesterday
    const newPatientsYesterday = await db.collection('patients').countDocuments({
      createdAt: { $gte: yesterday, $lt: yesterdayEnd }
    });

    const yesterdayTests = await db.collection('orders').aggregate([
      { $match: { createdAt: { $gte: yesterday, $lt: yesterdayEnd } } },
      { $unwind: '$items' },
      { $count: 'total' }
    ]).toArray();

    const yesterdayPendingResults = await db.collection('orders').countDocuments({
      createdAt: { $gte: yesterday, $lt: yesterdayEnd },
      status: { $in: ['process', 'completed'] }
    });

    const yesterdayRevenue = await db.collection('orders').aggregate([
      { 
        $match: { 
          createdAt: { $gte: yesterday, $lt: yesterdayEnd },
          status: { $in: ['process', 'completed'] }, // นับเฉพาะที่ชำระเงินแล้ว
          paymentMethod: { $nin: ['free', 'ฟรี', 'Free', 'FREE'] } // ตัดรายการฟรีออก
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).toArray();

    // Debug: ตรวจสอบการคำนวณรายได้
    console.log('=== REVENUE CALCULATION DEBUG ===');
    console.log('Today revenue (excluding free):', todayRevenue[0]?.total || 0);
    console.log('Yesterday revenue (excluding free):', yesterdayRevenue[0]?.total || 0);
    console.log('=== END REVENUE DEBUG ===');

    res.json({
      todayPatients,
      todayTests: todayTests[0]?.total || 0,
      pendingResults,
      todayRevenue: todayRevenue[0]?.total || 0,
      yesterdayPatients,
      yesterdayTests: yesterdayTests[0]?.total || 0,
      yesterdayPendingResults,
      yesterdayRevenue: yesterdayRevenue[0]?.total || 0,
      newPatientsToday,
      newPatientsYesterday
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสถิติได้' });
  }
});

// Get recent visits
app.get('/api/dashboard/recent-visits', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const visits = await db.collection('visits').aggregate([
      { $match: { createdAt: { $gte: todayStart, $lt: todayEnd } } },
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { visitId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$visitId', '$$visitId'] } } }
          ],
          as: 'orders'
        }
      },
      {
        $project: {
          visitId: { $toString: '$_id' },
          visitNumber: 1,
          patientTitle: { $arrayElemAt: ['$patient.title', 0] },
          patientFirstName: { $arrayElemAt: ['$patient.firstName', 0] },
          patientLastName: { $arrayElemAt: ['$patient.lastName', 0] },
          patientName: {
            $concat: [
              { $ifNull: [{ $arrayElemAt: ['$patient.title', 0] }, ''] },
              { $ifNull: [{ $arrayElemAt: ['$patient.firstName', 0] }, ''] },
              ' ',
              { $ifNull: [{ $arrayElemAt: ['$patient.lastName', 0] }, ''] }
            ]
          },
          tests: {
            $reduce: {
              input: '$orders.labOrders',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] }
            }
          },
          visitStatus: '$status',
          orderStatus: { $arrayElemAt: ['$orders.status', 0] },
          time: {
            $dateToString: {
              format: '%H:%M',
              date: '$createdAt',
              timezone: 'Asia/Bangkok'
            }
          }
        }
      },
      { $sort: { visitNumber: -1 } },
      { $limit: limit }
    ]).toArray();

    // Debug: Check orders for each visit
    for (const visit of visits) {
      const ordersForVisit = await db.collection('orders').find({visitId: visit.visitId}).toArray();
      console.log(`Orders for visit ${visit.visitNumber} (${visit.visitId}):`, ordersForVisit.length);
      if (ordersForVisit.length > 0) {
        console.log('Sample order:', ordersForVisit[0]);
      }
    }

    // Process the results to extract test names
    const processedVisits = visits.map(visit => {
      // Use visit status first, then order status, then default to pending
      let status = visit.visitStatus || visit.orderStatus || 'pending';
      
      // Log for debugging
      console.log(`=== Visit ${visit.visitNumber} Debug ===`);
      console.log('visitId:', visit.visitId);
      console.log('visitStatus:', visit.visitStatus);
      console.log('orderStatus:', visit.orderStatus);
      console.log('final status:', status);
      console.log('raw tests:', visit.tests);
      console.log('orders count:', visit.orders ? visit.orders.length : 0);
      console.log('orders:', visit.orders);
      
      return {
        visitId: visit.visitId,
        visitNumber: visit.visitNumber,
        patientTitle: visit.patientTitle || '',
        patientFirstName: visit.patientFirstName || '',
        patientLastName: visit.patientLastName || '',
        patientName: visit.patientName,
        tests: visit.tests ? visit.tests.flat().map(item => item.testName || item.name || 'Unknown Test') : [],
        status: status,
        time: visit.time
      };
    });

    res.json(processedVisits);
  } catch (error) {
    console.error('Error fetching recent visits:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Visit ล่าสุดได้' });
  }
});

// Get system status
app.get('/api/dashboard/system-status', async (req, res) => {
  try {
    // Check database connection
    let databaseStatus = 'online';
    try {
      await db.admin().ping();
    } catch (error) {
      databaseStatus = 'offline';
    }

    // For now, we'll simulate printer status
    // In a real implementation, you would check actual printer connectivity
    const reportPrinter = 'online';
    const barcodePrinter = Math.random() > 0.7 ? 'warning' : 'online'; // Simulate occasional issues

    res.json({
      database: databaseStatus,
      reportPrinter,
      barcodePrinter
    });
  } catch (error) {
    console.error('Error checking system status:', error);
    res.status(500).json({ error: 'ไม่สามารถตรวจสอบสถานะระบบได้' });
  }
});

// Get monthly revenue data
app.get('/api/dashboard/monthly-revenue', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    
    const currentDate = new Date();
    const revenueData = [];
    
    // Generate data for the requested number of months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;
      const monthName = `${monthNames[monthIndex]} ${year}`;
      
      // Get revenue for this month from orders collection
      const monthRevenue = await db.collection('orders').aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextMonth },
            status: { $in: ['process', 'completed'] } // นับเฉพาะที่ชำระเงินแล้ว
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).toArray();
      
      revenueData.push({
        month: monthKey,
        monthName: monthName,
        revenue: monthRevenue[0]?.total || 0
      });
    }
    
    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายได้รายเดือนได้' });
  }
});

// Get revenue breakdown by payment method
app.get('/api/dashboard/revenue-breakdown', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Use provided date or default to today
    const selectedDate = date ? new Date(date) : new Date();
    const todayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Get revenue breakdown by payment method with count
    const revenueBreakdown = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lt: todayEnd },
          status: { $in: ['process', 'completed'] } // นับเฉพาะที่ชำระเงินแล้ว
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 } // เพิ่มการนับจำนวนรายการ
        }
      }
    ]).toArray();

    // Debug: แสดงข้อมูลจากฐานข้อมูล
    console.log('=== REVENUE BREAKDOWN DEBUG ===');
    console.log('Date range:', todayStart, 'to', todayEnd);
    console.log('Raw data from database:', JSON.stringify(revenueBreakdown, null, 2));
    
    // ตรวจสอบ paymentMethod ทั้งหมดในฐานข้อมูล
    const allPaymentMethods = await db.collection('orders').distinct('paymentMethod', {
      createdAt: { $gte: todayStart, $lt: todayEnd },
      status: { $in: ['process', 'completed'] }
    });
    console.log('All payment methods in database:', allPaymentMethods);
    
    // ตรวจสอบรายการฟรีโดยเฉพาะ
    const freeOrders = await db.collection('orders').find({
      createdAt: { $gte: todayStart, $lt: todayEnd },
      status: { $in: ['process', 'completed'] },
      paymentMethod: { $in: ['free', 'ฟรี', 'Free', 'FREE'] }
    }).toArray();
    console.log('Free orders found:', freeOrders.length);
    if (freeOrders.length > 0) {
      console.log('Free orders details:', freeOrders.map(o => ({
        paymentMethod: o.paymentMethod,
        totalAmount: o.totalAmount,
        status: o.status
      })));
    }

    // Initialize breakdown object with count fields
    const breakdown = {
      cash: 0,
      creditCard: 0,
      bankTransfer: 0,
      insurance: 0,
      other: 0,
      free: 0, // เพิ่มยอดเงินของรายการฟรี
      total: 0,
      cancelled: 0,
      // เพิ่มฟิลด์สำหรับจำนวนรายการ
      cashCount: 0,
      creditCardCount: 0,
      bankTransferCount: 0,
      insuranceCount: 0,
      otherCount: 0,
      freeCount: 0
    };

    // Process the results and map payment methods
    revenueBreakdown.forEach(item => {
      const amount = item.total || 0;
      const count = item.count || 0;
      
      console.log(`Processing: ${item._id} -> Amount: ${amount}, Count: ${count}`);

      switch (item._id?.toLowerCase()) {
        case 'cash':
        case 'เงินสด':
          breakdown.cash += amount;
          breakdown.cashCount += count;
          breakdown.total += amount; // บวกเข้ายอดรวม
          break;
        case 'credit_card':
        case 'creditcard':
        case 'บัตรเครดิต':
        case 'เครดิต': // เพิ่มการจับ "เครดิต"
          console.log(`✅ Found CREDIT order: ${item._id} -> Count: ${count}, Amount: ${amount}`);
          breakdown.creditCard += amount;
          breakdown.creditCardCount += count;
          breakdown.total += amount; // บวกเข้ายอดรวม
          break;
        case 'bank_transfer':
        case 'banktransfer':
        case 'transfer':
        case 'โอนเงิน':
          breakdown.bankTransfer += amount;
          breakdown.bankTransferCount += count;
          breakdown.total += amount; // บวกเข้ายอดรวม
          break;
        case 'insurance':
        case 'ประกันสังคม':
        case 'สปสช.':
        case 'สปสช':
          console.log(`✅ Found INSURANCE order: ${item._id} -> Count: ${count}, Amount: ${amount}`);
          breakdown.insurance += amount;
          breakdown.insuranceCount += count;
          breakdown.total += amount; // บวกเข้ายอดรวม
          break;
        case 'free':
        case 'ฟรี':
          // รายการฟรี - เก็บยอดเงินแต่ไม่บวกเข้ายอดรวม (เพราะเป็นรายการฟรี)
          console.log(`✅ Found FREE order: ${item._id} -> Count: ${count}, Amount: ${amount}`);
          breakdown.free += amount; // เก็บยอดเงินของรายการฟรี
          breakdown.freeCount += count;
          // ไม่บวกเข้า breakdown.total เพราะเป็นรายการฟรี
          break;
        default:
          breakdown.other += amount;
          breakdown.otherCount += count;
          breakdown.total += amount; // บวกเข้ายอดรวม
          break;
      }
    });

    // Get cancelled orders separately
    const cancelledOrders = await db.collection('orders').aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lt: todayEnd },
          status: 'cancelled'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]).toArray();

    breakdown.cancelled = cancelledOrders[0]?.total || 0;

    // Debug: แสดงผลลัพธ์สุดท้าย
    console.log('Final breakdown result:', JSON.stringify(breakdown, null, 2));
    console.log('=== END DEBUG ===');

    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching revenue breakdown:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายละเอียดรายได้ได้' });
  }
});

// Reports API Routes
// Get unique departments from visits
app.get('/api/reports/departments', async (req, res) => {
  try {
    const departments = await db.collection('visits').distinct('department');
    
    // Filter out null/undefined values and format response
    const formattedDepartments = departments
      .filter(dept => dept && dept.trim() !== '')
      .map(dept => ({
        id: dept.toLowerCase().replace(/\s+/g, '_'),
        name: dept
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'));

    // Add "all" option at the beginning
    const result = [
      { id: 'all', name: 'ทุกหน่วยงาน' },
      ...formattedDepartments
    ];

    res.json(result);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลหน่วยงานได้' });
  }
});

// Get report data
app.get('/api/reports/data', async (req, res) => {
  console.log('=== REPORTS API CALLED ===');
  console.log('Query params:', req.query);
  try {
    const { reportType, dateFrom, dateTo, department } = req.query;
    
    // Handle visitor report (vts) separately
    if (reportType === 'vts') {
      console.log('Routing to visitor report handler...');
      return await handleVisitorReport(req, res, { dateFrom, dateTo, department });
    }
    
    // Handle lab report separately
    if (reportType === 'lab') {
      console.log('Routing to lab report handler...');
      try {
        const labResponse = await getLabReportData({ dateFrom, dateTo, department });
        return res.json(labResponse);
      } catch (error) {
        console.error('Error in getLabReportData:', error);
        return res.status(500).json({ error: 'Failed to generate lab report' });
      }
    }
    
    // Handle sales report (salelab) separately
    if (reportType === 'salelab') {
      console.log('Routing to sales report handler...');
      try {
        const salesResponse = await getSalesReportData({ dateFrom, dateTo, department });
        const salesData = salesResponse.data || [];
        const itemColumns = salesResponse.itemColumns || [];
        
        // Calculate stats from filtered data (already filtered by date range)
        const todayPatients = salesData.length;
        const todayTests = salesData.reduce((sum, sale) => {
          return sum + itemColumns.reduce((itemSum, col) => {
            return itemSum + (sale[`item_${col}`] > 0 ? 1 : 0);
          }, 0);
        }, 0);
        const todayRevenue = salesData.reduce((sum, sale) => {
          // ตัดรายการฟรีออกจากการคำนวณรายได้
          if (sale.paymentMethod && ['free', 'ฟรี', 'Free', 'FREE'].includes(sale.paymentMethod)) {
            console.log(`Excluding FREE sale from revenue: ${sale.totalAmount} (${sale.paymentMethod})`);
            return sum; // ไม่บวกรายการฟรี
          }
          return sum + (sale.totalAmount || 0);
        }, 0);

        return res.json({
          stats: {
            todayPatients,
            todayTests,
            todayRevenue,
            growth: 0
          },
          data: salesData,
          itemColumns: itemColumns
        });
      } catch (error) {
        console.error('Error in getSalesReportData:', error);
        return await handleSalesReport(req, res, { dateFrom, dateTo, department });
      }
    }
    
    // Set date range for other reports
    let startDate, endDate;
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
    } else {
      // Default to last 7 days
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }

    // Build query filter
    let visitQuery = {
      visitDate: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (department && department !== 'all' && department !== 'ทุกหน่วยงาน') {
      // Convert underscores to spaces for department matching
      const normalizedDepartment = department.replace(/_/g, ' ');
      visitQuery.department = normalizedDepartment;
      console.log(`Regular report department filter: '${department}' -> '${normalizedDepartment}'`);
    }

    // Get visits data
    const visits = await db.collection('visits').find(visitQuery).toArray();
    
    // Get orders data for revenue calculation
    const orders = await db.collection('orders').find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).toArray();

    // Calculate stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayVisits = visits.filter(v => {
      const visitDate = new Date(v.visitDate);
      // ตรวจสอบว่า visitDate ถูกต้องหรือไม่
      if (isNaN(visitDate.getTime())) {
        console.warn('Invalid visitDate:', v.visitDate);
        return false;
      }
      return visitDate >= todayStart && visitDate <= todayEnd;
    });

    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      // ตรวจสอบว่า orderDate ถูกต้องหรือไม่
      if (isNaN(orderDate.getTime())) {
        console.warn('Invalid createdAt:', o.createdAt);
        return false;
      }
      return orderDate >= todayStart && orderDate <= todayEnd;
    });

    const todayPatients = todayVisits.length;
    const todayTests = todayOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0);
    const todayRevenue = todayOrders.reduce((sum, order) => {
      // ตัดรายการฟรีออกจากการคำนวณรายได้
      if (order.paymentMethod && ['free', 'ฟรี', 'Free', 'FREE'].includes(order.paymentMethod)) {
        return sum; // ไม่บวกรายการฟรี
      }
      return sum + (order.totalAmount || 0);
    }, 0);

    // Calculate growth (mock calculation)
    const growth = Math.random() * 20 - 10; // Random growth between -10% to +10%

    // Group data by date
    const dataByDate = {};
    visits.forEach(visit => {
      const dateKey = new Date(visit.visitDate).toISOString().split('T')[0];
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = {
          date: dateKey,
          patients: 0,
          tests: 0,
          revenue: 0,
          department: visit.department,
          status: 'completed'
        };
      }
      dataByDate[dateKey].patients++;
    });

    // Add orders data to dates
    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (dataByDate[dateKey]) {
        dataByDate[dateKey].tests += order.items?.length || 0;
        dataByDate[dateKey].revenue += order.totalAmount || 0;
      }
    });

    const reportData = Object.values(dataByDate).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json({
      stats: {
        todayPatients,
        todayTests,
        todayRevenue,
        growth
      },
      data: reportData
    });

  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายงานได้' });
  }
});

// Handle visitor report (vts)
async function handleVisitorReport(req, res, { dateFrom, dateTo, department }) {
  console.log('=== VISITOR REPORT HANDLER CALLED ===');
  console.log('Parameters:', { dateFrom, dateTo, department });
  try {
    // Set date range for Thailand timezone (UTC+7)
    let startDate, endDate;
    if (dateFrom && dateTo) {
      // Convert to Thailand timezone
      startDate = new Date(dateFrom + 'T00:00:00+07:00');
      endDate = new Date(dateTo + 'T23:59:59+07:00');
    } else {
      // Default to today for visitor report
      const now = new Date();
      // Convert to Thailand timezone
      const thailandOffset = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds
      const thailandNow = new Date(now.getTime() + thailandOffset);
      
      startDate = new Date(thailandNow);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(thailandNow);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log('Date range (Thailand timezone):', { startDate, endDate });

    // Build query filter for visits - filter by visit creation date (createdAt)
    let visitQuery = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    console.log('Visit creation date query:', visitQuery);

    if (department && department !== 'all' && department !== 'ทุกหน่วยงาน') {
      // Convert underscores to spaces for department matching
      const normalizedDepartment = department.replace(/_/g, ' ');
      visitQuery.department = normalizedDepartment;
      console.log(`Visitor report department filter: '${department}' -> '${normalizedDepartment}'`);
    }

    // Debug: Log the query
    console.log('Visitor report query:', visitQuery);
    
    // Check visits in date range
    const visitsInRange = await db.collection('visits').countDocuments(visitQuery);
    console.log('Visits created in date range:', visitsInRange);
    
    // Get visits with patient data using aggregation
    const visitorData = await db.collection('visits').aggregate([
      { $match: visitQuery },
      {
        $lookup: {
          from: 'patients',
          let: { patientIdStr: '$patientId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$patientIdStr' }]
                }
              }
            }
          ],
          as: 'patient'
        }
      },
      { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          visitNumber: '$visitNumber',
          referenceNumber: '$visitNumber',
          ln: '$patient.ln',
          idCard: '$patient.idCard',
          title: '$patient.title',
          prefix: '$patient.title',
          firstName: '$patient.firstName',
          lastName: '$patient.lastName',
          age: '$patient.age',
          birthdate: '$patient.birthDate',
          gender: {
            $switch: {
              branches: [
                { case: { $eq: ['$patient.gender', 'male'] }, then: 'ชาย' },
                { case: { $eq: ['$patient.gender', 'female'] }, then: 'หญิง' }
              ],
              default: '$patient.gender'
            }
          },
          phoneNumber: '$patient.phoneNumber',
          phone: '$patient.phoneNumber',
          weight: '$weight',
          height: '$height',
          bloodPressure: '$bloodPressure',
          pulse: '$pulse',
          address: '$patient.address',
          department: '$department',
          referringOrganization: '$referringOrganization',
          organization: '$referringOrganization',
          patientRights: '$patientRights',
          rights: '$patientRights',
          // Convert createdAt to Thailand timezone for display
          patientCreatedAt: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$patient.createdAt',
              timezone: 'Asia/Bangkok'
            }
          },
          // Convert visit createdAt to Thailand timezone for display
          visitDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Bangkok'
            }
          }
        }
      },
      { $sort: { visitNumber: -1 } }
    ]).toArray();

    // Debug: Log the results
    console.log('Visitor data count:', visitorData.length);
    if (visitorData.length > 0) {
      console.log('Sample visitor data:', JSON.stringify(visitorData, null, 2));
    }

    // Calculate basic stats based on filtered data
    const totalVisitors = visitorData.length;
    
    // For today's stats, use Thailand timezone
    const now = new Date();
    const thailandOffset = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds
    const thailandNow = new Date(now.getTime() + thailandOffset);
    
    const todayStart = new Date(thailandNow);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(thailandNow);
    todayEnd.setHours(23, 59, 59, 999);

    // Count visits created today (in Thailand timezone)
    const todayVisitQuery = {
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd
      }
    };
    
    if (department && department !== 'all' && department !== 'ทุกหน่วยงาน') {
      const normalizedDepartment = department.replace(/_/g, ' ');
      todayVisitQuery.department = normalizedDepartment;
    }
    
    const todayVisitors = await db.collection('visits').countDocuments(todayVisitQuery);

    res.json({
      stats: {
        todayPatients: todayVisitors,
        todayTests: 0,
        todayRevenue: 0,
        growth: 0
      },
      data: visitorData,
      total: totalVisitors
    });
  } catch (error) {
    console.error('Error fetching visitor report:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายงานผู้เข้ารับบริการได้' });
  }
}

// Export report to Excel using templates
app.get('/api/reports/export/excel', async (req, res) => {
  try {
    const { reportType, dateFrom, dateTo, department } = req.query;
    
    if (!reportType) {
      return res.status(400).json({ error: 'กรุณาระบุประเภทรายงาน' });
    }

    console.log('Excel export request:', { reportType, dateFrom, dateTo, department });

    // Get report data first
    let reportData, itemColumns = [];
    
    if (reportType === 'vts') {
      // Get visitor data
      const visitorResponse = await getVisitorReportData({ dateFrom, dateTo, department });
      reportData = visitorResponse.data;
      console.log('Excel export - VTS data count:', reportData ? reportData.length : 0);
      console.log('Excel export - Sample VTS data:', reportData ? reportData[0] : 'No data');
    } else if (reportType === 'salelab') {
      // Get sales data
      const salesResponse = await getSalesReportData({ dateFrom, dateTo, department });
      reportData = salesResponse.data;
      itemColumns = salesResponse.itemColumns || [];
      console.log('Excel export - Sales data count:', reportData ? reportData.length : 0);
      console.log('Excel export - Sample sales data:', reportData && reportData.length > 0 ? reportData[0] : 'No data');
      console.log('Excel export - Item columns received:', itemColumns);
      console.log('Excel export - Item columns length:', itemColumns.length);
    } else if (reportType === 'lab') {
      // Get lab report data
      const labResponse = await getLabReportData({ dateFrom, dateTo, department });
      reportData = labResponse.data;
      console.log('Excel export - Lab data count:', reportData ? reportData.length : 0);
      console.log('Excel export - Sample lab data:', reportData ? reportData[0] : 'No data');
    } else {
      // Get regular report data
      const response = await getRegularReportData({ reportType, dateFrom, dateTo, department });
      reportData = response.data;
    }

    // Create date range string
    let dateRange = 'ทั้งหมด';
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom).toLocaleDateString('th-TH');
      const endDate = new Date(dateTo).toLocaleDateString('th-TH');
      dateRange = `${startDate} - ${endDate}`;
    }

    // Get department name
    let departmentName = 'ทุกแผนก';
    if (department && department !== 'all') {
      try {
        const departments = await db.collection('visits').distinct('department');
        departmentName = department;
      } catch (error) {
        console.log('Could not get department name:', error);
      }
    }

    // Generate Excel using template
    const excelProcessor = new ExcelTemplateProcessor();
    const workbook = await excelProcessor.generateReport(reportType, reportData, {
      dateRange,
      department: departmentName,
      itemColumns
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ error: 'ไม่สามารถส่งออกรายงาน Excel ได้', details: error.message });
  }
});

// Export report to PDF
app.get('/api/reports/export/pdf', async (req, res) => {
  try {
    // For now, return a simple response
    // In a real implementation, you would generate a PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    res.status(501).json({ error: 'PDF export not implemented yet' });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ error: 'ไม่สามารถส่งออกรายงานได้' });
  }
});

// Helper functions for Excel export
async function getVisitorReportData({ dateFrom, dateTo, department }) {
  console.log('=== getVisitorReportData called ===');
  console.log('Params:', { dateFrom, dateTo, department });

  // Helper functions for date formatting and age calculation
  function formatThaiDate(dateInput) {
    try {
      if (!dateInput) return '-';
      
      // If already in DD/MM/YYYY format, return as is
      if (typeof dateInput === 'string' && dateInput.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        return dateInput;
      }
      
      let date;
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
      } else {
        return '-';
      }
      
      if (isNaN(date.getTime())) return '-';
      
      // Format as DD/MM/YYYY (Thai format)
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.log('Error formatting date:', dateInput, error.message);
      return '-';
    }
  }

  function calculateAge(birthDate) {
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? age : 0;
    } catch (error) {
      return 0;
    }
  }

  try {
    // Set date range for Thailand timezone (UTC+7) - same as handleVisitorReport
    let startDate, endDate;
    if (dateFrom && dateTo) {
      // Convert to Thailand timezone
      startDate = new Date(dateFrom + 'T00:00:00+07:00');
      endDate = new Date(dateTo + 'T23:59:59+07:00');
    } else {
      // Default to today for visitor report
      const now = new Date();
      // Convert to Thailand timezone
      const thailandOffset = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds
      const thailandNow = new Date(now.getTime() + thailandOffset);
      
      startDate = new Date(thailandNow);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(thailandNow);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log('Excel export date range (Thailand timezone):', { startDate, endDate });

    // Build match criteria - filter by visit creation date (createdAt)
    let matchCriteria = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Only filter by department if it's specified and not "all" or "ทุกหน่วยงาน"
    if (department && department !== 'all' && department !== 'ทุกหน่วยงาน') {
      // Convert underscores to spaces for department matching
      const normalizedDepartment = department.replace(/_/g, ' ');
      matchCriteria.department = normalizedDepartment;
      console.log(`Department filter: '${department}' -> '${normalizedDepartment}'`);
    }

    console.log('Excel export match criteria:', matchCriteria);

    // Use aggregation pipeline to get visits with patient data - same as handleVisitorReport
    const visitorData = await db.collection('visits').aggregate([
      { $match: matchCriteria },
      {
        $lookup: {
          from: 'patients',
          let: { patientIdStr: '$patientId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$patientIdStr' }]
                }
              }
            }
          ],
          as: 'patient'
        }
      },
      { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          visitNumber: '$visitNumber',
          referenceNumber: '$visitNumber',
          ln: '$patient.ln',
          idCard: '$patient.idCard',
          title: '$patient.title',
          prefix: '$patient.title',
          firstName: '$patient.firstName',
          lastName: '$patient.lastName',
          age: '$patient.age',
          birthdate: '$patient.birthDate',
          gender: {
            $switch: {
              branches: [
                { case: { $eq: ['$patient.gender', 'male'] }, then: 'ชาย' },
                { case: { $eq: ['$patient.gender', 'female'] }, then: 'หญิง' }
              ],
              default: '$patient.gender'
            }
          },
          phoneNumber: '$patient.phoneNumber',
          phone: '$patient.phoneNumber',
          weight: '$weight',
          height: '$height',
          bloodPressure: '$bloodPressure',
          pulse: '$pulse',
          address: '$patient.address',
          department: '$department',
          referringOrganization: '$referringOrganization',
          organization: '$referringOrganization',
          patientRights: '$patientRights',
          rights: '$patientRights',
          // Convert createdAt to Thailand timezone for display
          patientCreatedAt: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$patient.createdAt',
              timezone: 'Asia/Bangkok'
            }
          },
          // Convert visit createdAt to Thailand timezone for display
          visitDate: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'Asia/Bangkok'
            }
          }
        }
      },
      { $sort: { visitNumber: -1 } }
    ]).toArray();

    console.log('Excel export visitor data count:', visitorData.length);

    console.log('VTS data sample for Excel:', visitorData.length > 0 ? {
      visitNumber: visitorData[0].visitNumber,
      firstName: visitorData[0].firstName,
      lastName: visitorData[0].lastName,
      birthdate: visitorData[0].birthdate,
      birthdateType: typeof visitorData[0].birthdate
    } : 'No data');
    
    return { data: visitorData };
  } catch (error) {
    console.error('Error in getVisitorReportData:', error);
    return { error: 'ไม่สามารถดึงข้อมูลผู้ป่วยได้' };
  }
}

const { getLabReportData } = require('./getLabReportData');

async function getSalesReportData({ dateFrom, dateTo, department }) {
  console.log('=== getSalesReportData called ===');
  console.log('Params:', { dateFrom, dateTo, department });
  console.log('Department type:', typeof department);
  console.log('Department length:', department ? department.length : 'null');

  try {
    // Set date range for Thailand timezone (UTC+7) - same as VTS Report
    let startDate, endDate;
    if (dateFrom && dateTo) {
      // Convert to Thailand timezone
      startDate = new Date(dateFrom + 'T00:00:00+07:00');
      endDate = new Date(dateTo + 'T23:59:59+07:00');
    } else {
      // Default to today for sales report
      const now = new Date();
      // Convert to Thailand timezone
      const thailandOffset = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds
      const thailandNow = new Date(now.getTime() + thailandOffset);
      
      startDate = new Date(thailandNow);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(thailandNow);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log('Sales report date range (Thailand timezone):', { startDate, endDate });

    // Build match criteria - filter by order creation date (createdAt) and status
    let matchCriteria = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['process', 'completed'] }
    };

    // Note: Department filtering will be done after joining with visits data
    // since department field is in visits collection, not orders collection

    console.log('Sales match criteria:', matchCriteria);

    // Get orders from database
    const orders = await db.collection('orders').find(matchCriteria).sort({ orderDate: -1 }).toArray();
    console.log('Found orders:', orders.length);

    if (orders.length === 0) {
      return { data: [], itemColumns: [] };
    }

    // Get patient and visit data for each order
    const ordersWithData = [];
    for (const order of orders) {
      let visitData = null;
      let patientData = null;

      console.log('Processing order:', order._id, 'visitId:', order.visitId);

      // Get visit data
      if (order.visitId) {
        try {
          if (typeof order.visitId === 'string' && order.visitId.length === 24) {
            visitData = await db.collection('visits').findOne({ _id: new ObjectId(order.visitId) });
            console.log('Found visit:', visitData ? visitData._id : 'null', 'department:', visitData?.department, 'patientId:', visitData?.patientId);
          } else if (order.visitId instanceof ObjectId) {
            visitData = await db.collection('visits').findOne({ _id: order.visitId });
            console.log('Found visit (ObjectId):', visitData ? visitData._id : 'null', 'department:', visitData?.department);
          }
        } catch (error) {
          console.log('Error finding visit for order:', order._id, error.message);
        }
      }

      // Try alternative methods to find patient data
      if (!visitData && order.visitNumber) {
        try {
          visitData = await db.collection('visits').findOne({ visitNumber: order.visitNumber });
          console.log('Found visit by visitNumber:', visitData ? visitData._id : 'null');
        } catch (error) {
          console.log('Error finding visit by visitNumber:', error.message);
        }
      }

      // Get patient data from visit
      if (visitData && visitData.patientId) {
        try {
          if (typeof visitData.patientId === 'string' && visitData.patientId.length === 24) {
            patientData = await db.collection('patients').findOne({ _id: new ObjectId(visitData.patientId) });
            console.log('Found patient:', patientData ? `${patientData.firstName} ${patientData.lastName}` : 'null');
          }
        } catch (error) {
          console.log('Error finding patient for visit:', visitData._id, error.message);
        }
      }

      // Try to find patient directly from order if available
      if (!patientData && order.patientId) {
        try {
          if (typeof order.patientId === 'string' && order.patientId.length === 24) {
            patientData = await db.collection('patients').findOne({ _id: new ObjectId(order.patientId) });
            console.log('Found patient directly from order:', patientData ? `${patientData.firstName} ${patientData.lastName}` : 'null');
          }
        } catch (error) {
          console.log('Error finding patient directly from order:', error.message);
        }
      }

      ordersWithData.push({
        ...order,
        visitData: visitData,
        patientData: patientData
      });
    }

    // Filter orders by department first, then get item columns
    let filteredOrders = ordersWithData;
    if (department && department !== 'all') {
      filteredOrders = ordersWithData.filter(order => {
        const visit = order.visitData || {};
        const dbDepartment = visit.department || '';
        
        // Try multiple matching strategies
        const exactMatch = dbDepartment === department;
        const normalizedMatch = dbDepartment.trim() === department.trim();
        const containsMatch = dbDepartment.includes(department) || department.includes(dbDepartment);
        
        // Convert underscores to spaces for comparison
        const departmentWithSpaces = department.replace(/_/g, ' ');
        const spaceMatch = dbDepartment === departmentWithSpaces;
        
        // Convert spaces to underscores for comparison
        const dbDepartmentWithUnderscores = dbDepartment.replace(/\s+/g, '_');
        const underscoreMatch = dbDepartmentWithUnderscores === department;
        
        console.log(`Department filter check for order ${order._id}:`);
        console.log(`  DB: "${dbDepartment}"`);
        console.log(`  Filter: "${department}"`);
        console.log(`  With spaces: "${departmentWithSpaces}"`);
        console.log(`  DB with underscores: "${dbDepartmentWithUnderscores}"`);
        console.log(`  Exact: ${exactMatch}, Normalized: ${normalizedMatch}, Contains: ${containsMatch}`);
        console.log(`  Space match: ${spaceMatch}, Underscore match: ${underscoreMatch}`);
        
        const match = exactMatch || normalizedMatch || containsMatch || spaceMatch || underscoreMatch;
        console.log(`  Final match: ${match}`);
        
        return match;
      });
    }

    console.log(`Filtered orders for itemColumns scan: ${filteredOrders.length} orders`);

    // Debug: Show details of filtered orders
    filteredOrders.forEach((order, index) => {
      console.log(`Filtered Order ${index + 1}:`, {
        orderId: order._id,
        visitNumber: order.visitData?.visitNumber,
        department: order.visitData?.department,
        labOrdersCount: order.labOrders ? order.labOrders.length : 0,
        labOrders: order.labOrders ? order.labOrders.map(lo => ({
          testName: lo.testName,
          testCode: lo.testCode,
          price: lo.price
        })) : []
      });
    });

    // Get unique test items for dynamic columns using test codes (only items with actual sales from filtered orders)
    const itemSales = new Map(); // Track which items have actual sales
    filteredOrders.forEach(order => {
      if (order.labOrders && Array.isArray(order.labOrders)) {
        order.labOrders.forEach(labOrder => {
          // Use testCode as primary, fallback to other identifiers
          const columnName = labOrder.testCode || labOrder.code || labOrder.testName || labOrder.itemName || labOrder.name;
          const price = labOrder.price || 0;
          console.log(`Processing labOrder: ${columnName}, price: ${price}`);
          if (columnName && price > 0) {
            itemSales.set(columnName, (itemSales.get(columnName) || 0) + price);
            console.log(`Added to itemSales: ${columnName} = ${itemSales.get(columnName)}`);
          }
        });
      }
    });
    
    // Only include items that have actual sales
    const itemColumns = Array.from(itemSales.keys());

    // Debug: Log all unique departments found in visits
    const uniqueDepartments = new Set();
    ordersWithData.forEach((order, index) => {
      const visit = order.visitData || {};
      console.log(`Order ${index + 1}:`, {
        orderId: order._id,
        visitId: order.visitId,
        hasVisitData: !!visit,
        visitDepartment: visit.department,
        visitNumber: visit.visitNumber
      });
      if (visit.department) {
        uniqueDepartments.add(visit.department);
      }
    });
    console.log('All departments found in visits:', Array.from(uniqueDepartments));
    console.log('Filter department requested:', department);

    // Transform data for Excel using filtered orders
    const salesData = filteredOrders.map(order => {
      const patient = order.patientData || {};
      const visit = order.visitData || {};
      
      const rowData = {
        visitNumber: visit.visitNumber || order.visitNumber || '-',
        ln: patient.ln || '-',
        title: patient.title || '-',
        firstName: patient.firstName || '-',
        lastName: patient.lastName || '-',
        age: patient.age || 0,
        patientRights: visit.patientRights || '-',
        orderDate: order.orderDate ? (() => {
          const date = new Date(order.orderDate);
          // ตรวจสอบว่า date ถูกต้องหรือไม่
          if (isNaN(date.getTime())) {
            console.warn('Invalid orderDate:', order.orderDate);
            return '-';
          }
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = (date.getFullYear() + 543).toString();
          return `${day}/${month}/${year}`;
        })() : '-',
        paymentMethod: order.paymentMethod || '-',
        totalAmount: order.totalAmount || 0
      };

      // Add dynamic columns for test items (only items with actual sales)
      itemColumns.forEach(testName => {
        rowData[`item_${testName}`] = 0;
      });

      // Fill in the test items for this order with prices
      if (order.labOrders && Array.isArray(order.labOrders)) {
        order.labOrders.forEach(labOrder => {
          // Use same column name logic as above - prioritize test codes
          const columnName = labOrder.testCode || labOrder.code || labOrder.testName || labOrder.itemName || labOrder.name;
          const price = labOrder.price || 0;
          
          // Only add if the item is in our filtered itemColumns list
          if (columnName && itemColumns.includes(columnName)) {
            rowData[`item_${columnName}`] = price;
          }
        });
      }

      return rowData;
    });

    console.log('Sales data processed:', salesData.length);
    console.log('Sample sales data:', salesData.length > 0 ? salesData[0] : 'No data');
    console.log('Item columns found (test codes with actual sales):', itemColumns);
    console.log('Item sales totals:', Object.fromEntries(itemSales));
    console.log('DEBUG: Final itemColumns being returned:', itemColumns);
    return { data: salesData, itemColumns: itemColumns };

  } catch (error) {
    console.error('Error in getSalesReportData:', error);
    return { data: [], itemColumns: [] };
  }
}

async function getRegularReportData({ reportType, dateFrom, dateTo, department }) {
  let startDate, endDate;
  if (dateFrom && dateTo) {
    startDate = new Date(dateFrom);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);
  } else {
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
  }

  const matchStage = {
    orderDate: {
      $gte: startDate,
      $lte: endDate
    }
  };

  const orders = await db.collection('orders')
    .aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'visits',
          localField: 'visitId',
          foreignField: '_id',
          as: 'visitData'
        }
      },
      {
        $addFields: {
          visitData: { $arrayElemAt: ['$visitData', 0] }
        }
      }
    ])
    .toArray();

  // Filter by department if specified
  let filteredOrders = orders;
  if (department && department !== 'all' && department !== 'ทุกหน่วยงาน') {
    // Convert underscores to spaces for department matching
    const normalizedDepartment = department.replace(/_/g, ' ');
    console.log(`Sales handler department filter: '${department}' -> '${normalizedDepartment}'`);
    filteredOrders = orders.filter(order => order.visitData?.department === normalizedDepartment);
  }

  // Group by date
  const dataByDate = {};
  filteredOrders.forEach(order => {
    const dateKey = order.orderDate.toISOString().split('T')[0];
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = {
        date: new Date(dateKey).toLocaleDateString('th-TH'),
        patients: new Set(),
        tests: 0,
        revenue: 0,
        department: order.visitData?.department || '',
        status: 'completed'
      };
    }

    if (order.visitData?.patientId) {
      dataByDate[dateKey].patients.add(order.visitData.patientId);
    }
    
    if (order.labOrders && Array.isArray(order.labOrders)) {
      dataByDate[dateKey].tests += order.labOrders.length;
    }
    
    dataByDate[dateKey].revenue += order.totalAmount || 0;
  });

  // Convert Set to count
  Object.values(dataByDate).forEach(dayData => {
    dayData.patients = dayData.patients.size;
  });

  const reportData = Object.values(dataByDate).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return { data: reportData };
}

// Test endpoint to check visits data
app.get('/api/test/visits', async (req, res) => {
  try {
    const totalVisits = await db.collection('visits').countDocuments();
    const sampleVisits = await db.collection('visits').find({}).limit(3).toArray();
    const totalPatients = await db.collection('patients').countDocuments();
    const samplePatients = await db.collection('patients').find({}).limit(3).toArray();
    
    res.json({
      totalVisits,
      totalPatients,
      sampleVisits: sampleVisits.map(v => ({
        _id: v._id,
        visitNumber: v.visitNumber,
        patientId: v.patientId,
        date: v.date,
        department: v.department,
        referringOrganization: v.referringOrganization,
        vitalSigns: v.vitalSigns,
        patientRights: v.patientRights,
        createdAt: v.createdAt,
        allFields: Object.keys(v)
      })),
      samplePatients: samplePatients.map(p => ({
        _id: p._id,
        ln: p.ln,
        idCard: p.idCard,
        title: p.title,
        firstName: p.firstName,
        lastName: p.lastName,
        age: p.age,
        birthDate: p.birthDate,
        gender: p.gender,
        phoneNumber: p.phoneNumber,
        address: p.address,
        allFields: Object.keys(p)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor management endpoints
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await db.collection('doctors').find({}).sort({ name: 1 }).toArray();
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลแพทย์ได้' });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const doctorData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if doctor with same name already exists
    const existingDoctor = await db.collection('doctors').findOne({
      name: doctorData.name
    });

    if (existingDoctor) {
      return res.status(400).json({ error: 'มีแพทย์ที่ใช้ชื่อนี้แล้ว' });
    }
    
    // Check if license number is provided and already exists
    if (doctorData.licenseNumber && doctorData.licenseNumber.trim()) {
      const existingLicense = await db.collection('doctors').findOne({
        licenseNumber: doctorData.licenseNumber.trim()
      });
      
      if (existingLicense) {
        return res.status(400).json({ error: 'มีแพทย์ที่ใช้เลขใบอนุญาตนี้แล้ว' });
      }
    }

    const result = await db.collection('doctors').insertOne(doctorData);
    const newDoctor = await db.collection('doctors').findOne({ _id: result.insertedId });
    
    res.status(201).json(newDoctor);
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: 'ไม่สามารถสร้างข้อมูลแพทย์ได้' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await db.collection('doctors').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลแพทย์' });
    }

    const updatedDoctor = await db.collection('doctors').findOne({ _id: new ObjectId(id) });
    res.json(updatedDoctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลแพทย์ได้' });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('doctors').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลแพทย์' });
    }

    res.json({ message: 'ลบข้อมูลแพทย์เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'ไม่สามารถลบข้อมูลแพทย์ได้' });
  }
});

// Find or create doctor (auto-save new doctors)
app.post('/api/doctors/find-or-create', async (req, res) => {
  try {
    const { name, licenseNumber } = req.body;

    if (!name || !licenseNumber) {
      return res.status(400).json({ error: 'กรุณาระบุชื่อแพทย์และเลขใบอนุญาต' });
    }

    // First, try to find existing doctor
    let doctor = await db.collection('doctors').findOne({
      $or: [
        { name: name.trim(), licenseNumber: licenseNumber.trim() },
        { licenseNumber: licenseNumber.trim() }
      ]
    });

    if (!doctor) {
      // Create new doctor if not found
      const doctorData = {
        name: name.trim(),
        licenseNumber: licenseNumber.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('doctors').insertOne(doctorData);
      doctor = await db.collection('doctors').findOne({ _id: result.insertedId });
    }

    res.json(doctor);
  } catch (error) {
    console.error('Error finding or creating doctor:', error);
    res.status(500).json({ error: 'ไม่สามารถค้นหาหรือสร้างข้อมูลแพทย์ได้' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LabFlow Clinic API is running',
    timestamp: new Date().toISOString()
  });
});

// Sales Report Handler
async function handleSalesReport(req, res, { dateFrom, dateTo, department }) {
  console.log('=== SALES REPORT HANDLER ===');
  console.log('Params:', { dateFrom, dateTo, department });
  
  try {
    // Check MongoDB connection
    if (!db) {
      console.error('MongoDB connection not established');
      return res.status(500).json({ 
        error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
        details: 'Database connection not established'
      });
    }
    
    console.log('MongoDB connection OK');
    // Set date range
    let startDate, endDate;
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
    } else {
      // Default to last 30 days
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    console.log('Date range:', { startDate, endDate });

    // Check if collections exist and have data
    const ordersCount = await db.collection('orders').countDocuments();
    const visitsCount = await db.collection('visits').countDocuments();
    const patientsCount = await db.collection('patients').countDocuments();
    
    console.log('Collection counts:', { ordersCount, visitsCount, patientsCount });
    
    if (ordersCount === 0) {
      console.log('No orders found in database');
      return res.json({
        stats: { todayPatients: 0, todayTests: 0, todayRevenue: 0, growth: 0 },
        data: []
      });
    }

    // Debug: Check what data we have in collections
    const sampleOrder = await db.collection('orders').findOne({});
    const sampleVisit = await db.collection('visits').findOne({});
    const samplePatient = await db.collection('patients').findOne({});
    
    console.log('Sample order structure:', {
      _id: sampleOrder?._id,
      visitId: sampleOrder?.visitId,
      patientId: sampleOrder?.patientId,
      status: sampleOrder?.status,
      items: sampleOrder?.items,
      labOrders: sampleOrder?.labOrders,
      totalAmount: sampleOrder?.totalAmount,
      allFields: Object.keys(sampleOrder || {})
    });
    console.log('Sample visit structure:', {
      _id: sampleVisit?._id,
      patientId: sampleVisit?.patientId,
      visitNumber: sampleVisit?.visitNumber
    });
    console.log('Sample patient structure:', {
      _id: samplePatient?._id,
      ln: samplePatient?.ln,
      firstName: samplePatient?.firstName
    });

    // Build aggregation pipeline to join orders, visits, and patients
    const pipeline = [
      // Match orders within date range and exclude cancelled orders
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          },
          status: { $ne: 'cancelled' } // Exclude cancelled orders
        }
      },
      // Convert visitId to ObjectId if it's a string
      {
        $addFields: {
          visitObjectId: {
            $cond: {
              if: { $type: '$visitId' },
              then: { $toObjectId: '$visitId' },
              else: '$visitId'
            }
          }
        }
      },
      // Lookup visit information
      {
        $lookup: {
          from: 'visits',
          localField: 'visitObjectId',
          foreignField: '_id',
          as: 'visit'
        }
      },
      // Unwind visit array
      {
        $unwind: {
          path: '$visit',
          preserveNullAndEmptyArrays: true
        }
      },
      // Convert patient IDs to ObjectId if they're strings
      {
        $addFields: {
          visitPatientObjectId: {
            $cond: {
              if: { $and: [{ $ne: ['$visit', null] }, { $type: '$visit.patientId' }] },
              then: { $toObjectId: '$visit.patientId' },
              else: '$visit.patientId'
            }
          },
          orderPatientObjectId: {
            $cond: {
              if: { $type: '$patientId' },
              then: { $toObjectId: '$patientId' },
              else: '$patientId'
            }
          }
        }
      },
      // Lookup patient information using patientId from visit
      {
        $lookup: {
          from: 'patients',
          localField: 'visitPatientObjectId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      // Also try lookup using patientId directly from order if visit lookup fails
      {
        $lookup: {
          from: 'patients',
          localField: 'orderPatientObjectId',
          foreignField: '_id',
          as: 'patientDirect'
        }
      },
      // Unwind patient array
      {
        $unwind: {
          path: '$patient',
          preserveNullAndEmptyArrays: true
        }
      },
      // Unwind patientDirect array
      {
        $unwind: {
          path: '$patientDirect',
          preserveNullAndEmptyArrays: true
        }
      },
      // Add a stage to merge patient data (use patient from visit first, fallback to patientDirect)
      {
        $addFields: {
          finalPatient: {
            $cond: {
              if: { $ne: ['$patient', null] },
              then: '$patient',
              else: '$patientDirect'
            }
          }
        }
      },
      // Add field to handle both items and labOrders
      {
        $addFields: {
          finalItems: {
            $cond: {
              if: { $and: [{ $ne: ['$items', null] }, { $gt: [{ $size: { $ifNull: ['$items', []] } }, 0] }] },
              then: '$items',
              else: '$labOrders'
            }
          }
        }
      },
      // Project the fields we need
      {
        $project: {
          visitNumber: '$visit.visitNumber',
          ln: '$finalPatient.ln',
          title: '$finalPatient.title',
          firstName: '$finalPatient.firstName',
          lastName: '$finalPatient.lastName',
          age: '$finalPatient.age',
          patientRights: '$visit.patientRights',
          orderDate: '$createdAt',
          paymentMethod: '$paymentMethod',
          items: '$finalItems',
          totalAmount: '$totalAmount',
          department: '$visit.department',
          // Debug fields to see what data we have
          hasVisit: { $ne: ['$visit', null] },
          hasPatient: { $ne: ['$finalPatient', null] },
          originalItems: '$items',
          originalLabOrders: '$labOrders',
          finalItemsUsed: '$finalItems'
        }
      },
      // Filter by department if specified (moved after all joins)
      ...(department && department !== 'all' && department !== 'ทุกหน่วยงาน' ? [{
        $match: {
          $or: [
            { department: department },
            { department: department.replace(/_/g, ' ') },
            { department: { $regex: new RegExp(department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
          ]
        }
      }] : []),
      // Sort by order date descending
      {
        $sort: { orderDate: -1 }
      }
    ];

    // Add debug logging for department filtering
    if (department && department !== 'all' && department !== 'ทุกหน่วยงาน') {
      const normalizedDepartment = department.replace(/_/g, ' ');
      console.log(`Sales aggregation department filter: '${department}' -> '${normalizedDepartment}'`);
    }
    
    console.log('Executing aggregation pipeline...');
    const results = await db.collection('orders').aggregate(pipeline).toArray();
    
    console.log(`Found ${results.length} sales records`);
    
    // Debug: Check department data in results
    const departmentsInResults = [...new Set(results.map(r => r.department).filter(d => d))];
    console.log('Departments found in results:', departmentsInResults);
    
    if (department && department !== 'all' && department !== 'ทุกหน่วยงาน') {
      console.log(`Department filter applied: "${department}"`);
      console.log('Available departments:', departmentsInResults);
      console.log('Department matches:', results.filter(r => 
        r.department === department || 
        r.department === department.replace(/_/g, ' ') ||
        (r.department && r.department.toLowerCase().includes(department.toLowerCase()))
      ).length);
    }
    
    console.log('First few results:', results.slice(0, 2));
    
    // Debug: Check items structure in results
    results.slice(0, 3).forEach((result, index) => {
      console.log(`Result ${index + 1} items:`, {
        items: result.items,
        itemsType: typeof result.items,
        itemsLength: result.items?.length,
        totalAmount: result.totalAmount
      });
    });

    // Process results to create dynamic columns for items
    const allItemNames = new Set();
    
    // First pass: collect all unique item names to create columns
    results.forEach(result => {
      if (result.items && Array.isArray(result.items)) {
        result.items.forEach(item => {
          if (item.testName || item.name) {
            allItemNames.add(item.testName || item.name);
          }
        });
      }
    });
    
    const itemColumns = Array.from(allItemNames).sort();
    console.log('Dynamic item columns:', itemColumns);
    
    // Second pass: transform data to have separate columns for each item
    const salesData = results.map(result => {
      const baseData = {
        visitNumber: result.visitNumber,
        ln: result.ln,
        title: result.title,
        firstName: result.firstName,
        lastName: result.lastName,
        age: result.age,
        patientRights: result.patientRights,
        orderDate: result.orderDate,
        paymentMethod: result.paymentMethod,
        totalAmount: result.totalAmount
      };
      
      // Add dynamic item columns
      const itemData = {};
      if (result.items && Array.isArray(result.items)) {
        result.items.forEach(item => {
          const itemName = item.testName || item.name;
          if (itemName) {
            itemData[itemName] = item.price || 0;
          }
        });
      }
      
      // Fill in all possible item columns (0 if not present)
      itemColumns.forEach(columnName => {
        baseData[`item_${columnName}`] = itemData[columnName] || 0;
      });
      
      return baseData;
    });

    // Calculate stats for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = salesData.filter(sale => {
      const saleDate = new Date(sale.orderDate);
      return saleDate >= todayStart && saleDate <= todayEnd;
    });

    const todayPatients = todaySales.length;
    const todayTests = results.reduce((sum, result) => sum + (result.items?.length || 0), 0);
    const todayRevenue = todaySales.reduce((sum, sale) => {
      // ตัดรายการฟรีออกจากการคำนวณรายได้
      if (sale.paymentMethod && ['free', 'ฟรี', 'Free', 'FREE'].includes(sale.paymentMethod)) {
        return sum; // ไม่บวกรายการฟรี
      }
      return sum + (sale.totalAmount || 0);
    }, 0);

    // Calculate growth (mock calculation for now)
    const growth = Math.random() * 20 - 10;

    const stats = {
      todayPatients,
      todayTests,
      todayRevenue,
      growth
    };

    console.log('Sales report stats:', stats);
    console.log('Item columns:', itemColumns);
    console.log('Sample transformed sales data:', salesData.slice(0, 2));

    res.json({
      stats,
      data: salesData,
      itemColumns: itemColumns // Send available item columns to frontend
    });

  } catch (error) {
    console.error('Error in sales report handler:', error);
    res.status(500).json({ 
      error: 'ไม่สามารถสร้างรายงานการขายได้',
      details: error.message 
    });
  }
}

// ==================== PRINTER API ENDPOINTS ====================

// Get available printers
app.get('/api/printers', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const os = require('os');
    
    // Get printers based on OS
    if (os.platform() === 'win32') {
      // Windows - Use PowerShell to get printer information
      const command = 'Get-Printer | Select-Object Name, PrinterStatus, JobCount, DriverName | ConvertTo-Json';
      
      exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error getting printers:', error);
          // Return fallback printers
          return res.json({
            success: true,
            printers: [
              {
                name: 'Microsoft Print to PDF',
                displayName: 'Microsoft Print to PDF',
                status: 'Ready',
                jobCount: 0,
                driverName: 'Microsoft Print To PDF',
                isDefault: true,
                type: 'Virtual'
              },
              {
                name: 'Microsoft XPS Document Writer',
                displayName: 'Microsoft XPS Document Writer',
                status: 'Ready',
                jobCount: 0,
                driverName: 'Microsoft XPS Document Writer',
                isDefault: false,
                type: 'Virtual'
              }
            ]
          });
        }

        try {
          let printers = JSON.parse(stdout);
          if (!Array.isArray(printers)) {
            printers = [printers];
          }

          const formattedPrinters = printers.map(printer => ({
            name: printer.Name,
            displayName: printer.Name,
            status: printer.PrinterStatus === 0 ? 'Ready' : 'Error',
            jobCount: printer.JobCount || 0,
            driverName: printer.DriverName || 'Unknown',
            isDefault: false, // We'll determine this separately
            type: printer.Name.includes('PDF') || printer.Name.includes('XPS') ? 'Virtual' : 'Physical'
          }));

          res.json({
            success: true,
            printers: formattedPrinters
          });
        } catch (parseError) {
          console.error('Error parsing printer data:', parseError);
          res.status(500).json({
            success: false,
            error: 'ไม่สามารถดึงข้อมูลเครื่องพิมพ์ได้'
          });
        }
      });
    } else {
      // Linux/Mac - Use lpstat or cups
      exec('lpstat -p', (error, stdout, stderr) => {
        if (error) {
          console.error('Error getting printers on Unix:', error);
          return res.json({
            success: true,
            printers: []
          });
        }

        const lines = stdout.split('\n').filter(line => line.trim());
        const printers = lines.map(line => {
          const match = line.match(/printer (\S+)/);
          if (match) {
            return {
              name: match[1],
              displayName: match[1],
              status: line.includes('disabled') ? 'Error' : 'Ready',
              jobCount: 0,
              driverName: 'CUPS',
              isDefault: false,
              type: 'Physical'
            };
          }
        }).filter(Boolean);

        res.json({
          success: true,
          printers
        });
      });
    }
  } catch (error) {
    console.error('Printer API error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องพิมพ์'
    });
  }
});

// Get specific printer status
app.get('/api/printers/:printerName/status', async (req, res) => {
  try {
    const { printerName } = req.params;
    const { exec } = require('child_process');
    const os = require('os');

    if (os.platform() === 'win32') {
      const command = `Get-Printer -Name "${printerName}" | Select-Object Name, PrinterStatus, JobCount, Comment | ConvertTo-Json`;
      
      exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: false,
            error: 'ไม่พบเครื่องพิมพ์ที่ระบุ'
          });
        }

        try {
          const printer = JSON.parse(stdout);
          res.json({
            success: true,
            status: {
              name: printer.Name,
              status: printer.PrinterStatus === 0 ? 'Ready' : 'Error',
              jobCount: printer.JobCount || 0,
              comment: printer.Comment || '',
              lastChecked: new Date().toISOString()
            }
          });
        } catch (parseError) {
          res.status(500).json({
            success: false,
            error: 'ไม่สามารถตรวจสอบสถานะเครื่องพิมพ์ได้'
          });
        }
      });
    } else {
      // Unix systems
      exec(`lpstat -p ${printerName}`, (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: false,
            error: 'ไม่พบเครื่องพิมพ์ที่ระบุ'
          });
        }

        res.json({
          success: true,
          status: {
            name: printerName,
            status: stdout.includes('disabled') ? 'Error' : 'Ready',
            jobCount: 0,
            comment: '',
            lastChecked: new Date().toISOString()
          }
        });
      });
    }
  } catch (error) {
    console.error('Printer status error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะเครื่องพิมพ์'
    });
  }
});

// Print document
app.post('/api/print', async (req, res) => {
  try {
    const { printerName, content, options = {} } = req.body;
    
    if (!printerName || !content) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาระบุชื่อเครื่องพิมพ์และเนื้อหาที่ต้องการพิมพ์'
      });
    }

    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { exec } = require('child_process');

    // Create temporary HTML file
    const tempDir = os.tmpdir();
    const tempFileName = `labflow_print_${Date.now()}.html`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Create HTML content with proper styling
    const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LabFlow Print Document</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        
        @page {
            margin: ${options.margin || '20mm'};
            size: ${options.pageSize || 'A4'};
        }
        
        body {
            font-family: 'Sarabun', Arial, sans-serif;
            font-size: ${options.fontSize || '12px'};
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        
        .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #666;
        }
        
        .content {
            margin: 20px 0;
        }
        
        .footer {
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
            background-color: #f2f2f2;
            font-weight: 600;
        }
        
        .barcode {
            text-align: center;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LabFlow Clinic</h1>
        <p>ระบบจัดการคลินิกและห้องปฏิบัติการ</p>
    </div>
    
    <div class="content">
        ${content}
    </div>
    
    <div class="footer">
        <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')} | เครื่องพิมพ์: ${printerName}</p>
    </div>
</body>
</html>`;

    // Write HTML to temporary file
    fs.writeFileSync(tempFilePath, htmlContent, 'utf8');

    // Print based on OS
    if (os.platform() === 'win32') {
      // Windows - Use browser to print
      const command = `start /wait "" "${tempFilePath}"`;
      
      exec(command, (error, stdout, stderr) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn('Could not clean up temp file:', cleanupError);
        }

        if (error) {
          console.error('Print error:', error);
          return res.json({
            success: false,
            error: 'ไม่สามารถพิมพ์เอกสารได้'
          });
        }

        res.json({
          success: true,
          message: 'ส่งเอกสารไปยังเครื่องพิมพ์เรียบร้อยแล้ว',
          printTime: new Date().toISOString()
        });
      });
    } else {
      // Unix systems - Use lp command
      const command = `lp -d ${printerName} "${tempFilePath}"`;
      
      exec(command, (error, stdout, stderr) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn('Could not clean up temp file:', cleanupError);
        }

        if (error) {
          console.error('Print error:', error);
          return res.json({
            success: false,
            error: 'ไม่สามารถพิมพ์เอกสารได้'
          });
        }

        res.json({
          success: true,
          message: 'ส่งเอกสารไปยังเครื่องพิมพ์เรียบร้อยแล้ว',
          jobId: stdout.trim(),
          printTime: new Date().toISOString()
        });
      });
    }

  } catch (error) {
    console.error('Print API error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการพิมพ์เอกสาร'
    });
  }
});

// Get print queue status
app.get('/api/print/queue/:printerName?', async (req, res) => {
  try {
    const { printerName } = req.params;
    const { exec } = require('child_process');
    const os = require('os');

    if (os.platform() === 'win32') {
      const command = printerName 
        ? `Get-PrintJob -PrinterName "${printerName}" | ConvertTo-Json`
        : 'Get-PrintJob | ConvertTo-Json';
      
      exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: true,
            queue: []
          });
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
            submittedTime: job.SubmittedTime
          }));

          res.json({
            success: true,
            queue: formattedJobs
          });
        } catch (parseError) {
          res.json({
            success: true,
            queue: []
          });
        }
      });
    } else {
      // Unix systems
      const command = printerName ? `lpq -P ${printerName}` : 'lpq';
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: true,
            queue: []
          });
        }

        // Parse lpq output (simplified)
        const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Rank'));
        const jobs = lines.map((line, index) => ({
          id: index + 1,
          printerName: printerName || 'default',
          documentName: 'Document',
          status: 'Processing',
          size: 0,
          submittedTime: new Date().toISOString()
        }));

        res.json({
          success: true,
          queue: jobs
        });
      });
    }
  } catch (error) {
    console.error('Print queue error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคิวการพิมพ์'
    });
  }
});

// Cancel print job
app.delete('/api/print/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { printerName } = req.query;
    const { exec } = require('child_process');
    const os = require('os');

    if (os.platform() === 'win32') {
      const command = `Remove-PrintJob -PrinterName "${printerName}" -ID ${jobId}`;
      
      exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: false,
            error: 'ไม่สามารถยกเลิกงานพิมพ์ได้'
          });
        }

        res.json({
          success: true,
          message: 'ยกเลิกงานพิมพ์เรียบร้อยแล้ว'
        });
      });
    } else {
      // Unix systems
      const command = `lprm ${jobId}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: false,
            error: 'ไม่สามารถยกเลิกงานพิมพ์ได้'
          });
        }

        res.json({
          success: true,
          message: 'ยกเลิกงานพิมพ์เรียบร้อยแล้ว'
        });
      });
    }
  } catch (error) {
    console.error('Cancel print job error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการยกเลิกงานพิมพ์'
    });
  }
});

// Test printer connection
app.post('/api/printers/:printerName/test', async (req, res) => {
  try {
    const { printerName } = req.params;
    
    // Create a simple test page
    const testContent = `
      <div style="text-align: center; padding: 50px;">
        <h2>ทดสอบการพิมพ์</h2>
        <p>เครื่องพิมพ์: ${printerName}</p>
        <p>เวลา: ${new Date().toLocaleString('th-TH')}</p>
        <p>หากคุณเห็นข้อความนี้ แสดงว่าเครื่องพิมพ์ทำงานปกติ</p>
      </div>
    `;

    // Use the existing print endpoint
    const printResult = await new Promise((resolve) => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const { exec } = require('child_process');

      const tempDir = os.tmpdir();
      const tempFileName = `labflow_test_${Date.now()}.html`;
      const tempFilePath = path.join(tempDir, tempFileName);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Printer Test</title>
    <style>
        body { font-family: 'Sarabun', Arial, sans-serif; margin: 20px; }
    </style>
</head>
<body>${testContent}</body>
</html>`;

      fs.writeFileSync(tempFilePath, htmlContent, 'utf8');

      if (os.platform() === 'win32') {
        exec(`start /wait "" "${tempFilePath}"`, (error) => {
          try { fs.unlinkSync(tempFilePath); } catch {}
          resolve({ success: !error });
        });
      } else {
        exec(`lp -d ${printerName} "${tempFilePath}"`, (error) => {
          try { fs.unlinkSync(tempFilePath); } catch {}
          resolve({ success: !error });
        });
      }
    });

    res.json({
      success: printResult.success,
      message: printResult.success 
        ? 'ส่งหน้าทดสอบไปยังเครื่องพิมพ์เรียบร้อยแล้ว'
        : 'ไม่สามารถทดสอบเครื่องพิมพ์ได้'
    });

  } catch (error) {
    console.error('Printer test error:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการทดสอบเครื่องพิมพ์'
    });
  }
});

// ==================== END PRINTER API ====================

// ==================== MEDICAL RECORDS API ====================

// Optimized search medical records with server-side filtering and joining
app.get('/api/medical-records/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json([]);
    }

    console.log('Searching medical records for:', query);
    const searchTerm = query.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    // Simple search from patients collection
    const patients = await db.collection('patients').find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { idCard: searchRegex },
        { phoneNumber: searchRegex },
        { ln: searchRegex }
      ]
    }).toArray();

    console.log(`Found ${patients.length} patients matching query: ${query}`);

    // Transform to medical records format
    const medicalRecords = patients.map(patient => ({
      id: patient._id.toString(),
      patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
      patientId: patient.ln || 'N/A',
      idCardNumber: patient.idCard || null,
      phone: patient.phoneNumber || null,
      address: patient.address || 'ไม่ระบุที่อยู่',
      totalVisits: 0, // Will be updated when we add visit lookup
      lastVisit: 'ไม่มีข้อมูล',
      status: 'active',
      recentTests: [],
      visits: []
    }));

    console.log(`Found ${medicalRecords.length} medical records for query: ${query}`);
    res.json(medicalRecords);
    
  } catch (error) {
    console.error('Error searching medical records:', error);
    res.status(500).json({ error: 'ไม่สามารถค้นหาข้อมูลเวชระเบียนได้' });
  }
});

// Get all medical records with server-side processing
app.get('/api/medical-records/all', async (req, res) => {
  try {
    console.log('Loading all medical records...');

    // Similar aggregation pipeline but without search filter
    const medicalRecords = await db.collection('visits').aggregate([
      // Stage 1: Lookup patient data
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patientData'
        }
      },
      {
        $unwind: {
          path: '$patientData',
          preserveNullAndEmptyArrays: true
        }
      },
      // Stage 2: Lookup orders
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'visitId',
          as: 'orders'
        }
      },
      // Stage 3: Lookup results
      {
        $lookup: {
          from: 'results',
          let: { orderIds: '$orders._id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$orderId', '$$orderIds'] }
              }
            }
          ],
          as: 'results'
        }
      },
      // Stage 4: Group by patient
      {
        $group: {
          _id: {
            patientKey: { $ifNull: ['$patientName', '$patientId'] }
          },
          id: { $first: '$_id' },
          patientName: { $first: { $ifNull: ['$patientName', 'ไม่ระบุชื่อ'] } },
          patientId: { $first: { $ifNull: ['$patientId', 'N/A'] } },
          idCardNumber: { $first: { $ifNull: ['$patientData.idCard', 'ไม่ระบุ'] } },
          phone: { $first: { $ifNull: ['$patientData.phoneNumber', 'ไม่ระบุ'] } },
          address: { $first: { $ifNull: ['$patientData.address', 'ไม่ระบุที่อยู่'] } },
          totalVisits: { $sum: 1 },
          lastVisit: { $max: '$visitDate' },
          status: { $first: 'active' },
          visits: {
            $push: {
              visitId: '$_id',
              visitNumber: '$visitNumber',
              visitDate: '$visitDate',
              visitTime: '$visitTime',
              department: { $ifNull: ['$department', 'ไม่ระบุ'] },
              orders: {
                $map: {
                  input: '$orders',
                  as: 'order',
                  in: {
                    $map: {
                      input: { $ifNull: ['$$order.labOrders', []] },
                      as: 'labOrder',
                      in: {
                        orderId: '$$order._id',
                        testName: { $ifNull: ['$$labOrder.testName', 'ไม่ระบุ'] },
                        testCode: { $ifNull: ['$$labOrder.code', ''] },
                        price: { $ifNull: ['$$labOrder.price', 0] },
                        status: { $ifNull: ['$$order.status', 'pending'] }
                      }
                    }
                  }
                }
              },
              results: {
                $map: {
                  input: '$results',
                  as: 'result',
                  in: {
                    $map: {
                      input: { $ifNull: ['$$result.testResults', []] },
                      as: 'testResult',
                      in: {
                        resultId: '$$result._id',
                        testName: { $ifNull: ['$$testResult.testName', 'ไม่ระบุ'] },
                        result: { $ifNull: ['$$testResult.result', 'รอผล'] },
                        normalRange: { $ifNull: ['$$testResult.normalRange', ''] },
                        status: { $ifNull: ['$$testResult.status', 'pending'] },
                        attachedFiles: {
                          $map: {
                            input: { $ifNull: ['$$result.attachedFiles', []] },
                            as: 'file',
                            in: {
                              fileName: { $ifNull: ['$$file.fileName', 'ไฟล์แนบ'] },
                              fileData: { $ifNull: ['$$file.fileData', ''] },
                              fileType: { $ifNull: ['$$file.fileType', 'application/octet-stream'] },
                              uploadDate: { $ifNull: ['$$file.uploadDate', '$$result.createdAt'] }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      // Stage 5: Format output (same as search)
      {
        $project: {
          _id: 0,
          id: { $toString: '$id' },
          patientName: 1,
          patientId: 1,
          idCardNumber: 1,
          phone: 1,
          address: 1,
          totalVisits: 1,
          lastVisit: {
            $dateToString: {
              format: '%d/%m/%Y',
              date: { $dateFromString: { dateString: '$lastVisit' } },
              timezone: 'Asia/Bangkok'
            }
          },
          status: 1,
          recentTests: {
            $slice: [
              {
                $reduce: {
                  input: '$visits.orders',
                  initialValue: [],
                  in: {
                    $setUnion: [
                      '$$value',
                      {
                        $map: {
                          input: { $reduce: { input: '$$this', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
                          as: 'order',
                          in: '$$order.testName'
                        }
                      }
                    ]
                  }
                }
              },
              5
            ]
          },
          visits: {
            $map: {
              input: {
                $sortArray: {
                  input: '$visits',
                  sortBy: { visitDate: -1 }
                }
              },
              as: 'visit',
              in: {
                visitId: { $toString: '$$visit.visitId' },
                visitNumber: '$$visit.visitNumber',
                visitDate: '$$visit.visitDate',
                visitTime: '$$visit.visitTime',
                department: '$$visit.department',
                orders: {
                  $reduce: {
                    input: '$$visit.orders',
                    initialValue: [],
                    in: { $concatArrays: ['$$value', '$$this'] }
                  }
                },
                results: {
                  $reduce: {
                    input: '$$visit.results',
                    initialValue: [],
                    in: { $concatArrays: ['$$value', '$$this'] }
                  }
                }
              }
            }
          }
        }
      },
      // Stage 6: Sort by last visit date
      {
        $sort: { lastVisit: -1 }
      },
      // Stage 7: Limit results for performance (optional)
      {
        $limit: 1000 // Limit to prevent overwhelming the client
      }
    ]).toArray();

    console.log(`Loaded ${medicalRecords.length} medical records`);
    res.json(medicalRecords);
    
  } catch (error) {
    console.error('Error loading all medical records:', error);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลเวชระเบียนทั้งหมดได้' });
  }
});

// ==================== END MEDICAL RECORDS API ====================

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
