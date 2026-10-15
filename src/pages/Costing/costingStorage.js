// Storage and Mock Data helper for Cost Overview Module

const STORAGE_KEYS = {
  HR_COST: 'pms_costing_hr_data',
  MATERIAL_COST: 'pms_costing_material_data',
  QUALITY_TESTING: 'pms_costing_quality_testing_data',
  FACTORY_OVERHEAD: 'pms_costing_factory_overhead_data',
};

const INITIAL_HR_DATA = [
  {
    id: 'HR-001',
    role: 'Plant Operations Manager',
    subCategory: 'management',
    department: 'Production Management',
    monthYear: '2026-10',
    baseSalary: 280000,
    allowances: 45000,
    overtimeBonuses: 25000,
    headcount: 1,
    totalCost: 350000,
    status: 'Approved',
    remarks: 'Monthly executive compensation package',
    createdAt: '2026-10-01'
  },
  {
    id: 'HR-002',
    role: 'Shift Production Supervisors',
    subCategory: 'management',
    department: 'Manufacturing',
    monthYear: '2026-10',
    baseSalary: 420000,
    allowances: 60000,
    overtimeBonuses: 45000,
    headcount: 3,
    totalCost: 525000,
    status: 'Approved',
    remarks: '3 Senior Shift Incharges (Morning/Evening/Night)',
    createdAt: '2026-10-02'
  },
  {
    id: 'HR-003',
    role: 'Direct HR Lead & Plant Recruiter',
    subCategory: 'direct-hr',
    department: 'Human Resources',
    monthYear: '2026-10',
    baseSalary: 450000,
    allowances: 85000,
    overtimeBonuses: 0,
    headcount: 1,
    totalCost: 535000,
    status: 'Approved',
    remarks: 'Head of People & Culture corporate allocation',
    createdAt: '2026-10-01'
  },
  {
    id: 'HR-004',
    role: 'HR Executive & Plant Recruiter',
    subCategory: 'direct-hr',
    department: 'Human Resources',
    monthYear: '2026-10',
    baseSalary: 95000,
    allowances: 15000,
    overtimeBonuses: 10000,
    headcount: 1,
    totalCost: 120000,
    status: 'Approved',
    remarks: 'On-site technical hiring & attendance management',
    createdAt: '2026-10-03'
  },
  {
    id: 'HR-005',
    role: 'Quality Assurance Manager (QAM)',
    subCategory: 'quality',
    department: 'Quality Assurance',
    monthYear: '2026-10',
    baseSalary: 220000,
    allowances: 35000,
    overtimeBonuses: 15000,
    headcount: 1,
    totalCost: 270000,
    status: 'Approved',
    remarks: 'QA Release and validation oversight',
    createdAt: '2026-10-02'
  },
  {
    id: 'HR-006',
    role: 'QC Analysts & Microbiologists',
    subCategory: 'quality',
    department: 'Quality Control',
    monthYear: '2026-10',
    baseSalary: 380000,
    allowances: 40000,
    overtimeBonuses: 35000,
    headcount: 4,
    totalCost: 455000,
    status: 'Approved',
    remarks: '4 bench analysts (HPLC, Dissolution, Micro)',
    createdAt: '2026-10-04'
  }
];

const INITIAL_MATERIAL_DATA = [
  {
    id: 'MAT-101',
    code: 'RM-PARACET-01',
    name: 'Paracetamol BP Micropulverized',
    category: 'Raw Material (API)',
    batchNo: 'BATCH-2026-904',
    quantity: 1250,
    unit: 'kg',
    unitRate: 1850,
    totalCost: 2312500,
    supplier: 'Sinochem Pharma Corp.',
    entryDate: '2026-10-05',
    notes: 'Primary active ingredient for Tablet line'
  },
  {
    id: 'MAT-102',
    code: 'EXC-MCC-102',
    name: 'Microcrystalline Cellulose PH-102',
    category: 'Excipient',
    batchNo: 'BATCH-2026-904',
    quantity: 450,
    unit: 'kg',
    unitRate: 980,
    totalCost: 441000,
    supplier: 'FMC BioPolymer Europe',
    entryDate: '2026-10-06',
    notes: 'Direct compression binder'
  },
  {
    id: 'MAT-103',
    code: 'PKG-ALU-250',
    name: 'Printed Aluminum Blister Foil (250mm)',
    category: 'Packaging Material',
    batchNo: 'BATCH-2026-908',
    quantity: 60,
    unit: 'Rolls',
    unitRate: 18500,
    totalCost: 1110000,
    supplier: 'Pak Flex Packaging Ltd.',
    entryDate: '2026-10-08',
    notes: 'Rotogravure 4-color printed blister foil'
  },
  {
    id: 'MAT-104',
    code: 'PKG-CARTON-500',
    name: 'Outer Unit Cartons (10x10s pack)',
    category: 'Packaging Material',
    batchNo: 'BATCH-2026-908',
    quantity: 25000,
    unit: 'Pieces',
    unitRate: 14.5,
    totalCost: 362500,
    supplier: 'Apex Graphics Print Works',
    entryDate: '2026-10-09',
    notes: 'Bleached craft folding box board 350gsm'
  },
  {
    id: 'MAT-105',
    code: 'SLV-IPA-99',
    name: 'Isopropyl Alcohol (IPA) 99.8% Pharma Grade',
    category: 'Solvent',
    batchNo: 'PO-2026-4412',
    quantity: 800,
    unit: 'Liter',
    unitRate: 420,
    totalCost: 336000,
    supplier: 'PetroChem Distributing Hub',
    entryDate: '2026-10-10',
    notes: 'Granulation solvent and line clearance wash'
  }
];

const INITIAL_QUALITY_TESTING_DATA = [
  {
    id: 'QT-201',
    sampleBatch: 'BATCH-2026-904',
    sampleItem: 'Paracetamol 500mg Finished Tablets',
    testType: 'Assay & Dissolution (HPLC)',
    lab: 'Internal QC Lab',
    standard: 'USP 44-NF 39',
    reagentCost: 28000,
    labFee: 15000,
    totalCost: 43000,
    testDate: '2026-10-08',
    reportNo: 'COA-QC-2026-1402',
    status: 'Complies'
  },
  {
    id: 'QT-202',
    sampleBatch: 'WATER-SYS-W41',
    sampleItem: 'Purified Water Generation Loop',
    testType: 'Total Viable Count & Endotoxin (LAL)',
    lab: 'Internal QC Lab',
    standard: 'Ph. Eur. Current',
    reagentCost: 18500,
    labFee: 8000,
    totalCost: 26500,
    testDate: '2026-10-09',
    reportNo: 'MIC-2026-0881',
    status: 'Complies'
  },
  {
    id: 'QT-203',
    sampleBatch: 'STAB-PAR-6M',
    sampleItem: 'Paracetamol Caplets (Accelerated 40C/75%RH)',
    testType: '6-Month Stability Profile & Degradation',
    lab: 'PCSIR Analytical Laboratories',
    standard: 'ICH Q1A (R2)',
    reagentCost: 45000,
    labFee: 95000,
    totalCost: 140000,
    testDate: '2026-10-02',
    reportNo: 'EXT-PCSIR-77341',
    status: 'Complies'
  },
  {
    id: 'QT-204',
    sampleBatch: 'BATCH-2026-905',
    sampleItem: 'Raw Material Paracetamol Powder',
    testType: 'Heavy Metals & Related Substances',
    lab: 'SGS Pakistan Testing Center',
    standard: 'BP 2024 Vol II',
    reagentCost: 22000,
    labFee: 68000,
    totalCost: 90000,
    testDate: '2026-10-06',
    reportNo: 'SGS-PK-88912',
    status: 'Complies'
  }
];

const INITIAL_FACTORY_OVERHEAD_DATA = [
  {
    id: 'FOH-301',
    subCategory: 'repair-maintenance',
    title: 'High-Speed Rotary Tablet Press Major Overhaul',
    itemRef: 'Machine # TP-02 (Sejong 37-Station)',
    invoiceNo: 'INV-MNT-8812',
    amount: 175000,
    date: '2026-10-03',
    vendor: 'Precision Engineering Works',
    notes: 'Turret seal replacement, lower punch cam track realignment'
  },
  {
    id: 'FOH-302',
    subCategory: 'repair-maintenance',
    title: 'HVAC Cleanroom HEPA Filter Velocity Calibration',
    itemRef: 'AHU-04 (Class C Production Corridor)',
    invoiceNo: 'INV-AIR-2026',
    amount: 92000,
    date: '2026-10-07',
    vendor: 'AirTech Clean Environments',
    notes: 'DOP smoke leak test & anemometer face velocity profiling'
  },
  {
    id: 'FOH-303',
    subCategory: 'stationary-printing',
    title: 'GMP Batch Manufacturing Records (BMR) Printing',
    itemRef: '500 sets 32-page BMR & Cleaning Logs',
    invoiceNo: 'INV-PRN-441',
    amount: 68500,
    date: '2026-10-04',
    vendor: 'Falcon Press & Stationery',
    notes: 'Official bound watermarked production logs'
  },
  {
    id: 'FOH-304',
    subCategory: 'generator-diesel',
    title: 'GenSet #1 High-Speed Diesel Fuel Refill',
    itemRef: '500 kVA Cummins Industrial GenSet',
    invoiceNo: 'PSO-DIESEL-909',
    amount: 420000,
    date: '2026-10-06',
    vendor: 'Pakistan State Oil Depot',
    notes: '1,500 Liters @ 280 PKR/L for load shedding support'
  },
  {
    id: 'FOH-305',
    subCategory: 'drap',
    title: 'DRAP Drug Manufacturing License 5-Year Renewal Fee',
    itemRef: 'Challan # NBP-ISB-2026-90',
    invoiceNo: 'DRAP-FEE-2026-01',
    amount: 250000,
    date: '2026-10-02',
    vendor: 'Drug Regulatory Authority of Pakistan',
    notes: 'Statutory government fee deposited via National Bank treasury'
  },
  {
    id: 'FOH-306',
    subCategory: 'utilities',
    title: 'Industrial Electric Power Utility Bill',
    itemRef: 'LESCO Meter # 18820-Industrial Tariff B2',
    invoiceNo: 'LESCO-OCT-2026',
    amount: 890000,
    date: '2026-10-10',
    vendor: 'Lahore Electric Supply Company',
    notes: 'Peak load demand 180kW, cleanroom chiller power'
  },
  {
    id: 'FOH-307',
    subCategory: 'pest-control',
    title: 'Monthly Facility Pest Extermination & Rodent Trapping',
    itemRef: 'Full Plant Interior & Perimeter Zone',
    invoiceNo: 'INV-TERM-551',
    amount: 55000,
    date: '2026-10-05',
    vendor: 'BioShield Pest Control Services',
    notes: 'Pyrethrin ultra-low-volume spray + glue board audits'
  },
  {
    id: 'FOH-308',
    subCategory: 'facilitation',
    title: 'Production Shift Staff Bus Transportation Service',
    itemRef: '3 Routes (Shahdara, Raiwind, Kot Lakhpat)',
    invoiceNo: 'INV-TRP-2026-10',
    amount: 310000,
    date: '2026-10-08',
    vendor: 'Metro Fleet Logistical Transport',
    notes: 'Monthly contracted commuter buses for double shift operators'
  },
  {
    id: 'FOH-309',
    subCategory: 'depreciation',
    title: 'Monthly Fixed Machinery & HVAC Straight-Line Depreciation',
    itemRef: 'Asset Block A: Production Machinery & Plant Equipment',
    invoiceNo: 'SCH-DEP-OCT-26',
    amount: 620000,
    date: '2026-10-01',
    vendor: 'Finance & Accounting Schedule',
    notes: '10-year straight-line depreciation schedule'
  }
];

export const HR_SUBCATEGORIES = [
  { id: 'management', label: 'Management' },
  { id: 'direct-hr', label: 'Direct HR' },
  { id: 'quality', label: 'Quality' }
];

export const MATERIAL_CATEGORIES = [
  'Raw Material',
  'Packaging Material',
  'Excipient',
  'Solvent'
];

export const QUALITY_TEST_TYPES = [
  'Assay & Dissolution (HPLC)',
  'Microbial Limit Testing (MLT)',
  'Heavy Metal Analysis',
  'Sterility Testing',
  'Raw Material Release Testing',
  'Packaging Quality Testing'
];

export const OVERHEAD_SUBCATEGORIES = [
  { id: 'repair-maintenance', label: 'Repair & maintenance' },
  { id: 'stationary-printing', label: 'Stationary & printing' },
  { id: 'generator-diesel', label: 'Generator/Diesel' },
  { id: 'drap', label: 'DRAP' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'pest-control', label: 'Pest Control' },
  { id: 'facilitation', label: 'Facilitation' },
  { id: 'depreciation', label: 'Depreciation' }
];

export const formatCurrency = (amount) => {
  return `PKR ${Number(amount || 0).toLocaleString()}`;
};

export const getStoredData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const setStoredData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
};

export const costingService = {
  // HR Cost
  getHRCosts: (subCategory) => {
    let data = getStoredData(STORAGE_KEYS.HR_COST, INITIAL_HR_DATA);
    let migrated = false;
    data = data.map(item => {
      if (item.subCategory === 'director-hr') {
        migrated = true;
        return { ...item, subCategory: 'direct-hr' };
      }
      return item;
    });
    if (migrated) {
      setStoredData(STORAGE_KEYS.HR_COST, data);
    }
    if (!subCategory || subCategory === 'all') return data;
    return data.filter(item => item.subCategory === subCategory);
  },
  saveHRCost: (entry) => {
    const current = getStoredData(STORAGE_KEYS.HR_COST, INITIAL_HR_DATA);
    let updated;
    if (entry.id) {
      updated = current.map(item => item.id === entry.id ? { ...item, ...entry } : item);
    } else {
      const newEntry = {
        ...entry,
        id: `HR-${String(Date.now()).slice(-4)}`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      updated = [newEntry, ...current];
    }
    setStoredData(STORAGE_KEYS.HR_COST, updated);
    return updated;
  },
  deleteHRCost: (id) => {
    const current = getStoredData(STORAGE_KEYS.HR_COST, INITIAL_HR_DATA);
    const updated = current.filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.HR_COST, updated);
    return updated;
  },

  // Material Cost
  getMaterialCosts: () => {
    return getStoredData(STORAGE_KEYS.MATERIAL_COST, INITIAL_MATERIAL_DATA);
  },
  saveMaterialCost: (entry) => {
    const current = getStoredData(STORAGE_KEYS.MATERIAL_COST, INITIAL_MATERIAL_DATA);
    let updated;
    if (entry.id) {
      updated = current.map(item => item.id === entry.id ? { ...item, ...entry } : item);
    } else {
      const newEntry = {
        ...entry,
        id: `MAT-${String(Date.now()).slice(-4)}`,
      };
      updated = [newEntry, ...current];
    }
    setStoredData(STORAGE_KEYS.MATERIAL_COST, updated);
    return updated;
  },
  deleteMaterialCost: (id) => {
    const current = getStoredData(STORAGE_KEYS.MATERIAL_COST, INITIAL_MATERIAL_DATA);
    const updated = current.filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.MATERIAL_COST, updated);
    return updated;
  },

  // Quality Testing Cost
  getQualityCosts: () => {
    return getStoredData(STORAGE_KEYS.QUALITY_TESTING, INITIAL_QUALITY_TESTING_DATA);
  },
  saveQualityCost: (entry) => {
    const current = getStoredData(STORAGE_KEYS.QUALITY_TESTING, INITIAL_QUALITY_TESTING_DATA);
    let updated;
    if (entry.id) {
      updated = current.map(item => item.id === entry.id ? { ...item, ...entry } : item);
    } else {
      const newEntry = {
        ...entry,
        id: `QT-${String(Date.now()).slice(-4)}`,
      };
      updated = [newEntry, ...current];
    }
    setStoredData(STORAGE_KEYS.QUALITY_TESTING, updated);
    return updated;
  },
  deleteQualityCost: (id) => {
    const current = getStoredData(STORAGE_KEYS.QUALITY_TESTING, INITIAL_QUALITY_TESTING_DATA);
    const updated = current.filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.QUALITY_TESTING, updated);
    return updated;
  },

  // Factory Overhead
  getOverheads: (subCategory) => {
    const data = getStoredData(STORAGE_KEYS.FACTORY_OVERHEAD, INITIAL_FACTORY_OVERHEAD_DATA);
    if (!subCategory || subCategory === 'all') return data;
    return data.filter(item => item.subCategory === subCategory);
  },
  saveOverhead: (entry) => {
    const current = getStoredData(STORAGE_KEYS.FACTORY_OVERHEAD, INITIAL_FACTORY_OVERHEAD_DATA);
    let updated;
    if (entry.id) {
      updated = current.map(item => item.id === entry.id ? { ...item, ...entry } : item);
    } else {
      const newEntry = {
        ...entry,
        id: `FOH-${String(Date.now()).slice(-4)}`,
      };
      updated = [newEntry, ...current];
    }
    setStoredData(STORAGE_KEYS.FACTORY_OVERHEAD, updated);
    return updated;
  },
  deleteOverhead: (id) => {
    const current = getStoredData(STORAGE_KEYS.FACTORY_OVERHEAD, INITIAL_FACTORY_OVERHEAD_DATA);
    const updated = current.filter(item => item.id !== id);
    setStoredData(STORAGE_KEYS.FACTORY_OVERHEAD, updated);
    return updated;
  },

  // Overall Totals & Statistics
  getOverallStats: () => {
    const hr = getStoredData(STORAGE_KEYS.HR_COST, INITIAL_HR_DATA);
    const mat = getStoredData(STORAGE_KEYS.MATERIAL_COST, INITIAL_MATERIAL_DATA);
    const qt = getStoredData(STORAGE_KEYS.QUALITY_TESTING, INITIAL_QUALITY_TESTING_DATA);
    const foh = getStoredData(STORAGE_KEYS.FACTORY_OVERHEAD, INITIAL_FACTORY_OVERHEAD_DATA);

    const hrTotal = hr.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const matTotal = mat.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const qtTotal = qt.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const fohTotal = foh.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const grandTotal = hrTotal + matTotal + qtTotal + fohTotal;

    const categoryBreakdown = [
      { name: 'Material Cost', value: matTotal, color: '#2563eb', count: mat.length },
      { name: 'HR Cost', value: hrTotal, color: '#10b981', count: hr.length },
      { name: 'Factory Overhead', value: fohTotal, color: '#f59e0b', count: foh.length },
      { name: 'Quality Testing Cost', value: qtTotal, color: '#8b5cf6', count: qt.length }
    ];

    const recentEntries = [
      ...hr.map(i => ({ id: i.id, title: i.role, category: 'HR Cost', date: i.monthYear, amount: i.totalCost, sub: i.subCategory })),
      ...mat.map(i => ({ id: i.id, title: i.name, category: 'Material Cost', date: i.entryDate, amount: i.totalCost, sub: i.category })),
      ...qt.map(i => ({ id: i.id, title: `${i.sampleItem} (${i.testType})`, category: 'Quality Testing', date: i.testDate, amount: i.totalCost, sub: i.lab })),
      ...foh.map(i => ({ id: i.id, title: i.title, category: 'Factory Overhead', date: i.date, amount: i.amount, sub: i.subCategory }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    return {
      grandTotal,
      hrTotal,
      matTotal,
      qtTotal,
      fohTotal,
      totalEntries: hr.length + mat.length + qt.length + foh.length,
      categoryBreakdown,
      recentEntries
    };
  }
};
