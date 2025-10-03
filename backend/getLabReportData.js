const { MongoClient } = require('mongodb');

// Lab test code mappings based on labtests table codes
const LAB_TEST_MAPPINGS = {
  // Direct code mappings from labtests table
  'CBC': 'CBC',
  'ABO': 'ABO',
  'BUN': 'BUN', 
  'Creatinine': 'Creatinine',
  'AST': 'AST',
  'ALT': 'ALT',
  'ALP': 'ALP',
  'eGFR': 'eGFR',
  'FBS': 'FBS',
  'HDL': 'HDL',
  'LDL': 'LDL',
  'Triglyceride': 'Triglyceride',
  'Cholesterol': 'Cholesterol',
  'Uric acid': 'Uric acid',
  'AFP': 'AFP',
  'Anti HAV': 'Anti HAV',
  'Anti HCV': 'Anti HCV', 
  'Anti HBs': 'Anti HBs',
  'Anti HIV': 'Anti HIV',
  'CA125': 'CA125',
  'CA15-3': 'CA15-3',
  'CA 19-9': 'CA19-9',
  'CEA': 'CEA',
  'FT3': 'FT3',
  'FT4': 'FT4',
  'HBs Ag': 'HBs Ag',
  'PSA': 'PSA',
  'TSH': 'TSH',
  'Flu A/B': 'Influenza A', // Map to both Influenza A and B
  'RSV': 'RSV',
  'Covid-19': 'SARS-COV-2',
  'Dengue': 'Dengue IgM', // Map to all Dengue variants
  'Leptospira': 'Leptospira IgG', // Map to both Leptospira variants
  'Methamphetamine': 'Methamphetamine',
  'UPT': 'Pregnancy test',
  'Albumin': 'Albumin',
  'Amylase': 'Amylase',
  'Calcium': 'Calcium',
  'Cholinesterase': 'Cholinesterase',
  'CK-MB': 'CK-MB',
  'CPK': 'CPK',
  'Cystatin-C': 'Cystatin-C',
  'Bilirubin, Direct': 'Direct Bilirubin',
  'GGT': 'GGT',
  'Globulin': 'Globulin',
  'HbA1C': 'HbA1C',
  'Homocysteine': 'Homocysteine',
  'hs-CRP': 'hs-CRP',
  'CRP': 'CRP',
  'LDH': 'LDH',
  'Magnesium': 'Magnesium',
  'Phosphorus': 'Phosphorus',
  'Bilirubin, Total': 'Total Bilirubin',
  'Total Protein': 'Total Protein',
  'Microalbumin': 'Microalbumin',
  'Beta HCG': 'Beta - HCG',
  'NSE': 'NSE',
  'VDRL': 'VDRL (RPR)',
  'Progesterone': 'Progesterone',
  'Rheumatoid Factor': 'Rheumatoid Factor',
  'D-dimer': 'D-dimer',
  'Hb typing': 'Hb typing',
  'HPV DNA': 'HPV DNA',
  'FIT Test': 'FOB Test',
  'UA': 'Urine Analysis',
  'Rh': 'Rh Type',
  'PT': 'PT',
  'PTT': 'PTT',
  'INR': 'INR',
  'DTX': 'DTX',
  'Stool Culture': 'Stool Culture',
  'Chest X-ray': 'Chest X-ray',
  'Stool': 'Stool Examination',
  'FSH': 'FSH',
  'Prolactin': 'Prolactin',
  'Testosterone': 'Testosterone',
  'Pharmacogenetics': 'Pharmacogenetics',
  'Vitamin D': 'Vitamin D'
};

async function getLabReportData({ dateFrom, dateTo, department }) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/labflow-clinic';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    console.log('Generating lab report with params:', { dateFrom, dateTo, department });

    // Set date range - handle both Date objects and string dates
    let startDate, endDate;
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0); // Start of day
      endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999); // End of day
    } else {
      // Default to last 30 days
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Also check for visits with string dates (YYYY-MM-DD format)
    const dateFromStr = dateFrom || startDate.toISOString().split('T')[0];
    const dateToStr = dateTo || endDate.toISOString().split('T')[0];

    console.log('Date range:', { startDate, endDate });

    // First, let's check what visits exist in the database
    const totalVisits = await db.collection('visits').countDocuments();
    console.log('Total visits in database:', totalVisits);
    
    const visitsInRange = await db.collection('visits').countDocuments({
      visitDate: { $gte: startDate, $lte: endDate }
    });
    console.log('Visits in date range:', visitsInRange);
    
    // Check if we have any orders
    const totalOrders = await db.collection('orders').countDocuments();
    console.log('Total orders in database:', totalOrders);

    const { ObjectId } = require('mongodb');

    // Build aggregation pipeline to get visits with patient data and sales data
    const pipeline = [
      // Match visits in date range - handle both Date objects and string dates
      {
        $match: {
          $or: [
            {
              visitDate: {
                $gte: startDate,
                $lte: endDate
              }
            },
            {
              visitDate: {
                $gte: dateFromStr,
                $lte: dateToStr
              }
            }
          ]
        }
      },
      {
        $addFields: {
          patientId: { $toObjectId: "$patientId" }  // แปลง string → ObjectId
        }
      },
      // Lookup patient data
      {
        $lookup: {
          from: 'patients',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      // Unwind patient data
      {
        $unwind: {
          path: '$patient',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup sales/orders for this visit to see what was purchased
      {
        $lookup: {
          from: 'orders',
          localField: 'visitNumber',
          foreignField: 'visitNumber',
          as: 'orders'
        }
      },
      // Also try lookup by visitId for newer data structure
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'visitId',
          as: 'ordersByVisitId'
        }
      },
      // Lookup labgroups and labtests for reference
      {
        $lookup: {
          from: 'labgroups',
          pipeline: [],
          as: 'labgroups'
        }
      },
      {
        $lookup: {
          from: 'labtests',
          pipeline: [],
          as: 'labtests'
        }
      }
    ];

    // Add department filter if specified
    if (department && department !== 'all' && department !== 'ทุกหน่วยงาน') {
      const normalizedDepartment = department.replace(/_/g, ' ');
      pipeline[0].$match.department = normalizedDepartment;
      console.log(`Lab report department filter: '${department}' -> '${normalizedDepartment}'`);
    }

    console.log('Executing aggregation pipeline...');
    const visits = await db.collection('visits').aggregate(pipeline).toArray();
    console.log('Found', visits.length, 'visits for lab report');
    
    if (visits.length > 0) {
      console.log('Sample visit data keys:', Object.keys(visits[0]));
      console.log('Sample visit patient:', visits[0].patient);
      console.log('Sample visit orders:', visits[0].orders);
    }

    // Process each visit to extract lab test data
    const labData = visits.map(visit => {
      // Initialize lab tests object with all 86 tests set to false (will show as "-")
      const labTests = {
        'CBC': false,
        'ABO': false,
        'BUN': false,
        'Creatinine': false,
        'AST': false,
        'ALT': false,
        'ALP': false,
        'eGFR': false,
        'FBS': false,
        'HDL': false,
        'LDL': false,
        'Triglyceride': false,
        'Cholesterol': false,
        'Uric acid': false,
        'AFP': false,
        'Anti HAV': false,
        'Anti HCV': false,
        'Anti HBs': false,
        'Anti HIV screening': false,
        'CA125': false,
        'CA15-3': false,
        'CA19-9': false,
        'CEA': false,
        'FT3': false,
        'FT4': false,
        'HBs Ag': false,
        'PSA': false,
        'TSH': false,
        'Influenza A': false,
        'Influenza B': false,
        'RSV': false,
        'SARS-COV-2': false,
        'Dengue IgM': false,
        'Dengue IgG': false,
        'Dengue Ns1 Ag': false,
        'Leptospira IgG': false,
        'Leptospira IgM': false,
        'Methamphetamine': false,
        'Pregnancy test': false,
        'Albumin': false,
        'Amylase': false,
        'Calcium': false,
        'Cholinesterase': false,
        'CK-MB': false,
        'CPK': false,
        'Cystatin-C': false,
        'Direct Bilirubin': false,
        'GGT': false,
        'Globulin': false,
        'HbA1C': false,
        'Homocysteine': false,
        'hs-CRP': false,
        'CRP': false,
        'LDH': false,
        'Magnesium': false,
        'Phosphorus': false,
        'Total Bilirubin': false,
        'Total Protein': false,
        'Microalbumin': false,
        'Beta - HCG': false,
        'NSE': false,
        'VDRL (RPR)': false,
        'Progesterone': false,
        'Rheumatoid Factor': false,
        'D-dimer': false,
        'Hb typing': false,
        'HPV DNA': false,
        'FOB Test': false,
        'Urine Analysis': false,
        'Rh Type': false,
        'ตรวจการแข็งตัวของเลือด Prothrombin Time (PT)': false,
        'PTT': false,
        'ตรวจระยะเวลาการแข็งตัวของเลือด (INR)': false,
        'DTX': false,
        'Stool Culture': false,
        'Chest X-ray': false,
        'Stool Examination': false,
        'FSH': false,
        'Prolactin': false,
        'Testosterone': false,
        'Pharmacogenetics': false,
        'Vitamin D': false
      };
      
      // Process all orders for this visit - handle both old and new data structures
      const allOrders = [...(visit.orders || []), ...(visit.ordersByVisitId || [])];
      
      if (allOrders.length > 0) {
        allOrders.forEach(order => {
          // Handle both old structure (items) and new structure (labOrders)
          const orderItems = order.items || order.labOrders || [];
          
          console.log('Processing order with', orderItems.length, 'items');
          
          if (orderItems.length > 0) {
            orderItems.forEach(item => {
              // Handle different item structures
              const testCode = item.code || item.name || item.testCode;
              const testName = item.name || item.testName;
              
              console.log('Processing item:', testCode, testName);
              
              // Direct mapping by code or name
              if (testCode && LAB_TEST_MAPPINGS[testCode]) {
                labTests[LAB_TEST_MAPPINGS[testCode]] = true;
                console.log('Mapped by code:', testCode, '->', LAB_TEST_MAPPINGS[testCode]);
              } else if (testName && LAB_TEST_MAPPINGS[testName]) {
                labTests[LAB_TEST_MAPPINGS[testName]] = true;
                console.log('Mapped by name:', testName, '->', LAB_TEST_MAPPINGS[testName]);
              } else {
                // Try to find in labtests collection
                const foundTest = visit.labtests?.find(lt => 
                  lt.code === testCode || lt.name === testName || 
                  lt.code === testName || lt.name === testCode
                );
                if (foundTest && LAB_TEST_MAPPINGS[foundTest.code]) {
                  labTests[LAB_TEST_MAPPINGS[foundTest.code]] = true;
                  console.log('Found and mapped test:', foundTest.code, '->', LAB_TEST_MAPPINGS[foundTest.code]);
                }
                
                // Try to find in labgroups collection
                const foundGroup = visit.labgroups?.find(lg => 
                  lg.code === testCode || lg.name === testName ||
                  lg.code === testName || lg.name === testCode
                );
                if (foundGroup && foundGroup.tests && foundGroup.tests.length > 0) {
                  console.log('Found labgroup with tests:', foundGroup.tests.length);
                  foundGroup.tests.forEach(testInGroup => {
                    if (LAB_TEST_MAPPINGS[testInGroup.code]) {
                      labTests[LAB_TEST_MAPPINGS[testInGroup.code]] = true;
                      console.log('Mapped group test:', testInGroup.code, '->', LAB_TEST_MAPPINGS[testInGroup.code]);
                    }
                  });
                } else {
                  console.log('No mapping found for:', testCode, testName);
                }
              }
              
              // Handle special cases for multi-mapping
              const searchTerm = testCode || testName || '';
              if (searchTerm.includes('Flu') || searchTerm.includes('Influenza')) {
                labTests['Influenza A'] = true;
                labTests['Influenza B'] = true;
              }
              if (searchTerm.includes('Dengue')) {
                labTests['Dengue IgM'] = true;
                labTests['Dengue IgG'] = true;
                labTests['Dengue Ns1 Ag'] = true;
              }
              if (searchTerm.includes('Leptospira')) {
                labTests['Leptospira IgG'] = true;
                labTests['Leptospira IgM'] = true;
              }
            });
          }
        });
      }

      // Convert gender to Thai
      const convertGender = (gender) => {
        if (!gender) return '';
        const g = gender.toLowerCase();
        if (g === 'male' || g === 'm' || g === 'ชาย') return 'ชาย';
        if (g === 'female' || g === 'f' || g === 'หญิง') return 'หญิง';
        return gender;
      };

      return {
        // Use correct field mappings as specified by user
        visitNumber: visit.visitNumber || '', // LN = visitNumber (from visits)
        ln: visit.patient?.ln || '', // LN = visitNumber (from visits)
        title: visit.patient?.title || '', // คำนำหน้า = title (from patients)
        firstName: visit.patient?.firstName || '', // ชื่อ = firstName (from patients)
        lastName: visit.patient?.lastName || '', // นามสกุล = lastName (from patients)
        gender: convertGender(visit.patient?.gender), // เพศ = gender (from patients) - converted to Thai
        age: visit.patient?.age || '', // อายุ = age (from patients)
        height: visit.height || '', // ส่วนสูง = height (from visits)
        rights: visit.patientRights || '', // สิทธิ์ = patientRights (from visits)
        labTests: labTests
      };
    });

    // Calculate stats for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      return visitDate >= todayStart && visitDate <= todayEnd;
    });

    const todayPatients = todayVisits.length;
    const todayTests = todayVisits.reduce((sum, visit) => {
      if (visit.orders && visit.orders.length > 0) {
        return sum + visit.orders.reduce((orderSum, order) => {
          return orderSum + (order.items ? order.items.length : 0);
        }, 0);
      }
      return sum;
    }, 0);

    const todayRevenue = todayVisits.reduce((sum, visit) => {
      if (visit.orders && visit.orders.length > 0) {
        return sum + visit.orders.reduce((orderSum, order) => {
          return orderSum + (order.totalAmount || 0);
        }, 0);
      }
      return sum;
    }, 0);

    console.log(`Lab report stats - Patients: ${todayPatients}, Tests: ${todayTests}, Revenue: ${todayRevenue}`);
    console.log(`Lab report data count: ${labData.length}`);

    return {
      stats: {
        todayPatients,
        todayTests,
        todayRevenue,
        growth: 0
      },
      data: labData
    };

  } catch (error) {
    console.error('Error in getLabReportData:', error);
    throw error;
  } finally {
    await client.close();
  }
}

module.exports = { getLabReportData };
