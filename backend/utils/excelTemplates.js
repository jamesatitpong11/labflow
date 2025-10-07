const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

class ExcelTemplateProcessor {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
  }

  // Create VTS (Visitor) Report Template
  async createVTSTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานผู้เข้ารับบริการ');

    // Set column widths
    worksheet.columns = [
      { header: 'เลขอ้างอิง', key: 'visitNumber', width: 15 },
      { header: 'LN', key: 'ln', width: 12 },
      { header: 'เลขบัตรประชาชน', key: 'idCard', width: 18 },
      { header: 'คำนำหน้า', key: 'title', width: 10 },
      { header: 'ชื่อ', key: 'firstName', width: 15 },
      { header: 'นามสกุล', key: 'lastName', width: 15 },
      { header: 'อายุ', key: 'age', width: 8 },
      { header: 'วันเกิด', key: 'birthdate', width: 12 },
      { header: 'เพศ', key: 'gender', width: 8 },
      { header: 'เบอร์โทร', key: 'phoneNumber', width: 15 },
      { header: 'น้ำหนัก (กก.)', key: 'weight', width: 12 },
      { header: 'ส่วนสูง (ซม.)', key: 'height', width: 12 },
      { header: 'ความดันโลหิต', key: 'bloodPressure', width: 15 },
      { header: 'ชีพจร', key: 'pulse', width: 10 },
      { header: 'ที่อยู่', key: 'address', width: 30 },
      { header: 'แผนก', key: 'department', width: 15 },
      { header: 'หน่วยงานที่ส่งมา', key: 'referringOrganization', width: 20 },
      { header: 'สิทธิ', key: 'patientRights', width: 15 },
      { header: 'วันที่ลงทะเบียน', key: 'patientCreatedAt', width: 18 },
      { header: 'วันที่มาตรวจ', key: 'visitDate', width: 15 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add borders to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add title row
    worksheet.insertRow(1, ['รายงานผู้เข้ารับบริการ (VTS Report)']);
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:T1');

    // Add date range row
    worksheet.insertRow(2, ['ช่วงวันที่: {{dateRange}}']);
    const dateRow = worksheet.getRow(2);
    dateRow.font = { bold: true };
    worksheet.mergeCells('A2:T2');

    // Add empty row
    worksheet.insertRow(3, []);

    return workbook;
  }

  // Create Sales Lab Report Template
  async createSalesLabTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานการขาย');

    // Basic columns (will be extended dynamically)
    const baseColumns = [
      { header: 'เลขอ้างอิง', key: 'visitNumber', width: 15 },
      { header: 'เลข LN', key: 'ln', width: 12 },
      { header: 'คำนำหน้า', key: 'title', width: 10 },
      { header: 'ชื่อ', key: 'firstName', width: 15 },
      { header: 'นามสกุล', key: 'lastName', width: 15 },
      { header: 'อายุ', key: 'age', width: 8 },
      { header: 'สิทธิ', key: 'patientRights', width: 15 },
      { header: 'วันที่', key: 'orderDate', width: 12 },
      { header: 'วิธีการชำระเงิน', key: 'paymentMethod', width: 18 }
    ];

    // Set only base columns initially
    baseColumns.forEach((col, index) => {
      const column = worksheet.getColumn(index + 1);
      column.header = col.header;
      column.key = col.key;
      column.width = col.width;
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '70AD47' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add title row
    worksheet.insertRow(1, ['รายงานการขาย (Sales Lab Report)']);
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };

    // Add date range row
    worksheet.insertRow(2, ['ช่วงวันที่: {{dateRange}}']);
    const dateRow = worksheet.getRow(2);
    dateRow.font = { bold: true };

    // Add empty row
    worksheet.insertRow(3, []);

    return workbook;
  }

  // Create Daily Report Template
  async createDailyTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานประจำวัน');

    worksheet.columns = [
      { header: 'วันที่', key: 'date', width: 15 },
      { header: 'จำนวนคนไข้', key: 'patients', width: 15 },
      { header: 'จำนวนรายการตรวจ', key: 'tests', width: 18 },
      { header: 'รายได้ (บาท)', key: 'revenue', width: 15 },
      { header: 'แผนก', key: 'department', width: 20 },
      { header: 'สถานะ', key: 'status', width: 12 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E67E22' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add borders to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add title row
    worksheet.insertRow(1, ['รายงานประจำวัน (Daily Report)']);
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:F1');

    // Add date range row
    worksheet.insertRow(2, ['ช่วงวันที่: {{dateRange}}']);
    const dateRow = worksheet.getRow(2);
    dateRow.font = { bold: true };
    worksheet.mergeCells('A2:F2');

    // Add empty row
    worksheet.insertRow(3, []);

    return workbook;
  }

  // Process VTS Report with template
  async generateVTSReport(data, dateRange, department) {
    console.log('generateVTSReport called with data count:', data ? data.length : 0);
    console.log('generateVTSReport sample data:', data && data.length > 0 ? data[0] : 'No data');
    
    const workbook = await this.createVTSTemplate();
    const worksheet = workbook.getWorksheet('รายงานผู้เข้ารับบริการ');

    // Update date range
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `ช่วงวันที่: ${dateRange}`;
    if (department && department !== 'all') {
      dateCell.value += ` | แผนก: ${department}`;
    }

    // Add data rows starting from row 4 (after title, date, empty row, header)
    let rowIndex = 5;
    data.forEach((item, index) => {
      console.log(`Processing row ${index + 1}:`, {
        visitNumber: item.visitNumber,
        name: `${item.firstName} ${item.lastName}`,
        birthdate: item.birthdate,
        birthdateType: typeof item.birthdate
      });
      const row = worksheet.getRow(rowIndex + index);
      
      row.values = {
        visitNumber: item.visitNumber || '-',
        ln: item.ln || '-',
        idCard: (item.idCard && !item.idCard.startsWith('NO_ID')) ? item.idCard : '',
        title: item.title || '-',
        firstName: item.firstName || '-',
        lastName: item.lastName || '-',
        age: item.age || '-',
        birthdate: item.birthdate || '-',
        gender: item.gender || '-',
        phoneNumber: item.phoneNumber || '-',
        weight: item.weight || '-',
        height: item.height || '-',
        bloodPressure: item.bloodPressure || '-',
        pulse: item.pulse || '-',
        address: item.address || '-',
        department: item.department || '-',
        referringOrganization: item.referringOrganization || '-',
        patientRights: item.patientRights || '-',
        patientCreatedAt: item.patientCreatedAt || '-',
        visitDate: item.visitDate || '-'
      };

      // Style data rows
      row.alignment = { horizontal: 'left', vertical: 'middle' };
      row.eachCell((cell) => {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F9FA' }
        };
      }
    });

    // Add summary row
    const summaryRowIndex = rowIndex + data.length + 1;
    const summaryRow = worksheet.getRow(summaryRowIndex);
    summaryRow.values = ['', `รวมทั้งหมด: ${data.length} รายการ`];
    summaryRow.font = { bold: true };
    worksheet.mergeCells(`B${summaryRowIndex}:T${summaryRowIndex}`);

    return workbook;
  }

  // Process Sales Lab Report with template
  async generateSalesLabReport(data, itemColumns, dateRange, department) {
    console.log('Excel Template - Item columns received:', itemColumns);
    const workbook = await this.createSalesLabTemplate();
    const worksheet = workbook.getWorksheet('รายงานการขาย');

    // Create header row manually at row 4
    const headerRow = worksheet.getRow(4);
    const headerValues = [
      'เลขอ้างอิง', 'LN', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'อายุ', 'สิทธิ', 'วันที่', 'วิธีการชำระเงิน'
    ];
    
    // Add item column headers (only for items with actual sales)
    console.log('Excel Template - Processing itemColumns:', itemColumns);
    itemColumns.forEach(columnName => {
      console.log('Excel Template - Adding header for:', columnName);
      headerValues.push(columnName);
    });
    
    // Add total column header
    headerValues.push('รวมเงิน (บาท)');
    
    console.log('Excel Template - Final header values:', headerValues);
    // Set header values
    headerRow.values = headerValues;
    
    // Add dynamic item columns
    const baseColumnCount = 9;
    itemColumns.forEach((columnName, index) => {
      console.log(`Adding column ${index + 1}: ${columnName}`);
      const column = worksheet.getColumn(baseColumnCount + 1 + index);
      column.key = `item_${columnName}`;
      column.width = 12;
    });

    // Add total amount column
    const totalColumnIndex = baseColumnCount + itemColumns.length + 1;
    const totalColumn = worksheet.getColumn(totalColumnIndex);
    totalColumn.key = 'totalAmount';
    totalColumn.width = 15;

    // Add title and date rows
    const titleRow = worksheet.getRow(1);
    titleRow.values = ['รายงานการขาย'];
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    
    const dateRow = worksheet.getRow(2);
    let dateText = `ช่วงวันที่: ${dateRange}`;
    if (department && department !== 'all') {
      dateText += ` | แผนก: ${department}`;
    }
    dateRow.values = [dateText];
    dateRow.font = { bold: true };
    dateRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Update merged cells for title and date
    const totalColumns = baseColumnCount + itemColumns.length + 1;
    const lastColumn = String.fromCharCode(64 + totalColumns); // Convert to Excel column letter
    worksheet.mergeCells(`A1:${lastColumn}1`);
    worksheet.mergeCells(`A2:${lastColumn}2`);

    // Style the header row
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '70AD47' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add borders to all header cells including dynamic ones
    for (let col = 1; col <= totalColumns; col++) {
      const cell = headerRow.getCell(col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }

    // Add data rows
    let rowIndex = 5;
    let totalRevenue = 0;
    
    data.forEach((item, index) => {
      const row = worksheet.getRow(rowIndex + index);
      const rowData = [
        item.visitNumber || '-',
        item.ln || '-',
        item.title || '-',
        item.firstName || '-',
        item.lastName || '-',
        item.age || '-',
        item.patientRights || '-',
        item.orderDate ? (() => {
          if (typeof item.orderDate === 'string' && item.orderDate.includes('/')) {
            // Already formatted as DD/MM/YYYY BE
            return item.orderDate;
          } else {
            // Convert from Date object to DD/MM/YYYY BE format
            const date = new Date(item.orderDate);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = (date.getFullYear() + 543).toString();
            return `${day}/${month}/${year}`;
          }
        })() : '-',
        item.paymentMethod || '-'
      ];

      // Add item columns data with prices
      itemColumns.forEach(columnName => {
        const price = item[`item_${columnName}`];
        rowData.push(price > 0 ? price.toLocaleString('th-TH') : '-');
      });

      // Add total amount
      const amount = item.totalAmount || 0;
      rowData.push(amount.toLocaleString('th-TH'));
      totalRevenue += amount;

      row.values = rowData;

      // Style data rows
      row.alignment = { vertical: 'middle' };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F9FA' }
        };
      }
    });

    // Add summary row
    const summaryRowIndex = rowIndex + data.length + 1;
    const summaryRow = worksheet.getRow(summaryRowIndex);
    summaryRow.values = [
      `รวมทั้งหมด: ${data.length} รายการ`,
      '', '', '', '', '', '', '', '',
      ...new Array(itemColumns.length).fill(''),
      `${totalRevenue.toLocaleString('th-TH')} บาท`
    ];
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D5E8D4' }
    };

    return workbook;
  }

  // Process Daily Report with template
  async generateDailyReport(data, dateRange, department) {
    const workbook = await this.createDailyTemplate();
    const worksheet = workbook.getWorksheet('รายงานประจำวัน');

    // Update date range
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `ช่วงวันที่: ${dateRange}`;
    if (department && department !== 'all') {
      dateCell.value += ` | แผนก: ${department}`;
    }

    // Add data rows
    let rowIndex = 5;
    let totalPatients = 0;
    let totalTests = 0;
    let totalRevenue = 0;

    data.forEach((item, index) => {
      const row = worksheet.getRow(rowIndex + index);
      
      row.values = [
        '', // Empty first column
        item.date || '-',
        item.patients || 0,
        item.tests || 0,
        item.revenue ? item.revenue.toLocaleString('th-TH') : '0',
        item.department || '-',
        item.status === 'completed' ? 'เสร็จแล้ว' : item.status || '-'
      ];

      totalPatients += item.patients || 0;
      totalTests += item.tests || 0;
      totalRevenue += item.revenue || 0;

      // Style data rows
      row.alignment = { vertical: 'middle' };
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F9FA' }
        };
      }
    });

    // Add summary row
    const summaryRowIndex = rowIndex + data.length + 1;
    const summaryRow = worksheet.getRow(summaryRowIndex);
    summaryRow.values = [
      '', 'รวมทั้งหมด',
      totalPatients,
      totalTests,
      totalRevenue.toLocaleString('th-TH'),
      '', ''
    ];
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6CC' }
    };

    return workbook;
  }

  // Create Lab Report Template with all 86 test columns
  async createLabReportTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานการตรวจ Lab');

    // Define all 86 lab test columns as specified
    const labTestColumns = [
      'CBC', 'ABO', 'BUN', 'Creatinine', 'AST', 'ALT', 'ALP', 'eGFR', 'Glucose FBS', 'HDL', 'LDL', 
      'Triglyceride', 'Cholesterol', 'Uric acid', 'AFP', 'Anti HAV', 'Anti HCV', 'Anti HBs', 
      'Anti HIV screening', 'CA125', 'CA15-3', 'CA19-9', 'CEA', 'FT3', 'FT4', 'HBs Ag', 'PSA', 'TSH',
      'Influenza A', 'Influenza B', 'RSV', 'SARS-COV-2', 'Dengue IgM', 'Dengue IgG', 'Dengue Ns1 Ag',
      'Leptospira IgG', 'Leptospira IgM', 'Methamphetamine', 'Pregnancy test', 'Albumin', 'Amylase',
      'Calcium', 'Cholinesterase', 'CK-MB', 'CPK', 'Cystatin-C', 'Direct Bilirubin', 'GGT', 'Globulin',
      'HbA1C', 'Homocysteine', 'hs-CRP', 'CRP', 'LDH', 'Magnesium', 'Phosphorus', 'Total Bilirubin',
      'Total Protein', 'Microalbumin', 'Beta - HCG', 'NSE', 'VDRL (RPR)', 'Progesterone', 
      'Rheumatoid Factor', 'D-dimer', 'Hb typing', 'HPV DNA', 'FOB Test', 'Urine Analysis', 'Rh Type',
      'ตรวจการแข็งตัวของเลือด Prothrombin Time (PT)', 'PTT', 'ตรวจระยะเวลาการแข็งตัวของเลือด (INR)',
      'DTX', 'Stool Culture', 'Chest X-ray', 'Stool Examination', 'FSH', 'Prolactin', 'Testosterone',
      'Pharmacogenetics', 'Vitamin D'
    ];

    // Set up columns: basic info + all lab tests
    const columns = [
      { header: 'LN', key: 'ln', width: 12 },
      { header: 'HN', key: 'visitNumber', width: 12 },
      { header: 'คำนำหน้า', key: 'title', width: 10 },
      { header: 'ชื่อ', key: 'firstName', width: 15 },
      { header: 'นามสกุล', key: 'lastName', width: 15 },
      { header: 'เพศ', key: 'gender', width: 8 },
      { header: 'อายุ', key: 'age', width: 8 },
      { header: 'ส่วนสูง', key: 'height', width: 10 },
      { header: 'สิทธิ์', key: 'rights', width: 15 }
    ];

    // Add lab test columns
    labTestColumns.forEach(testName => {
      columns.push({ 
        header: testName, 
        key: testName.replace(/[^a-zA-Z0-9]/g, '_'), 
        width: testName.length > 15 ? 20 : 12 
      });
    });

    worksheet.columns = columns;

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '9C27B0' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add borders to header
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add title row
    worksheet.insertRow(1, ['รายงานการตรวจ Lab (Lab Report)']);
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A1:${String.fromCharCode(64 + columns.length)}1`);

    // Add date range row
    worksheet.insertRow(2, ['ช่วงวันที่: {{dateRange}}']);
    const dateRow = worksheet.getRow(2);
    dateRow.font = { bold: true };
    worksheet.mergeCells(`A2:${String.fromCharCode(64 + columns.length)}2`);

    // Add empty row
    worksheet.insertRow(3, []);

    return workbook;
  }

  // Process Lab Report with template
  async generateLabReport(data, dateRange, department) {
    const workbook = await this.createLabReportTemplate();
    const worksheet = workbook.getWorksheet('รายงานการตรวจ Lab');

    // Update date range
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `ช่วงวันที่: ${dateRange}`;
    if (department && department !== 'all') {
      dateCell.value += ` | แผนก: ${department}`;
    }

    // Add data rows starting from row 4
    let rowIndex = 5;
    data.forEach((item, index) => {
      const row = worksheet.getRow(rowIndex + index);
      
      // Basic patient info
      const rowData = [
        item.visitNumber || '-',
        item.ln || '-',        
        item.title || '-',
        item.firstName || '-',
        item.lastName || '-',
        item.gender || '-',
        item.age || '-',
        item.height || '-',
        item.rights || '-'
      ];

      // Add lab test results (1 for purchased, - for not purchased)
      const labTests = item.labTests || {};
      const labTestColumns = [
        'CBC', 'ABO', 'BUN', 'Creatinine', 'AST', 'ALT', 'ALP', 'eGFR', 'FBS', 'HDL', 'LDL', 
        'Triglyceride', 'Cholesterol', 'Uric acid', 'AFP', 'Anti HAV', 'Anti HCV', 'Anti HBs', 
        'Anti HIV', 'CA125', 'CA15-3', 'CA19-9', 'CEA', 'FT3', 'FT4', 'HBs Ag', 'PSA', 'TSH',
        'Influenza A', 'Influenza B', 'RSV', 'SARS-COV-2', 'Dengue IgM', 'Dengue IgG', 'Dengue Ns1 Ag',
        'Leptospira IgG', 'Leptospira IgM', 'Methamphetamine', 'Pregnancy test', 'Albumin', 'Amylase',
        'Calcium', 'Cholinesterase', 'CK-MB', 'CPK', 'Cystatin-C', 'Direct Bilirubin', 'GGT', 'Globulin',
        'HbA1C', 'Homocysteine', 'hs-CRP', 'CRP', 'LDH', 'Magnesium', 'Phosphorus', 'Total Bilirubin',
        'Total Protein', 'Microalbumin', 'Beta - HCG', 'NSE', 'VDRL (RPR)', 'Progesterone', 
        'Rheumatoid Factor', 'D-dimer', 'Hb typing', 'HPV DNA', 'FOB Test', 'Urine Analysis', 'Rh Type',
        'PT', 'PTT', 'INR', 'DTX', 'Stool Culture', 'Chest X-ray', 'Stool Examination', 'FSH', 
        'Prolactin', 'Testosterone', 'Pharmacogenetics', 'Vitamin D'
      ];

      labTestColumns.forEach(testName => {
        rowData.push(labTests[testName] ? '1' : '-');
      });

      row.values = rowData;

      // Style data rows
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F9FA' }
        };
      }
    });

    // Add summary row
    const summaryRowIndex = rowIndex + data.length + 1;
    const summaryRow = worksheet.getRow(summaryRowIndex);
    summaryRow.values = ['', `รวมทั้งหมด: ${data.length} รายการ`];
    summaryRow.font = { bold: true };
    const totalColumns = 9 + 86; // 9 basic columns + 86 lab tests
    worksheet.mergeCells(`B${summaryRowIndex}:${String.fromCharCode(64 + totalColumns)}${summaryRowIndex}`);

    return workbook;
  }

  // Main method to generate report based on type
  async generateReport(reportType, data, options = {}) {
    const { dateRange, department, itemColumns } = options;
    
    switch (reportType) {
      case 'vts':
        return await this.generateVTSReport(data, dateRange, department);
      
      case 'salelab':
        return await this.generateSalesLabReport(data, itemColumns || [], dateRange, department);
      
      case 'lab':
        return await this.generateLabReport(data, dateRange, department);
      
      case 'daily':
      case 'monthly':
      case 'patient':
      case 'revenue':
      case 'test':
        return await this.generateDailyReport(data, dateRange, department);
      
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }
}

module.exports = ExcelTemplateProcessor;
