import { CompanyProfile, FleetDriver, FreightEstimate } from '../types';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'GREEN EXPRESS LLC',
  dbaName: 'Green Express LLC',
  dotNumber: '3252472',
  mcNumber: 'TXDMV-009021927C',
  taxId: '83-2948201',
  email: 'dispatch@greenexpressllc.com',
  phone: '(817) 297-8840',
  address: '100 Industrial Pkwy',
  city: 'Crowley',
  state: 'TX',
  zip: '76036',
  factoringCompanyName: 'Triumph Business Capital',
  factoringNoticeOfAssignment: 'Notice of Assignment on file. Remit all freight payments directly to Triumph Business Capital for Green Express LLC.',
  factoringRemitAddress: 'PO Box 650821, Dallas, TX 75265-0821',
  factoringBankName: 'JPMorgan Chase Bank, N.A.',
  factoringRoutingNumber: '111000614',
  factoringAccountNumber: '88492019482',
  defaultPaymentTerms: 'Net 30 Days',
  defaultRatePerMileFloor: 2.85
};

/**
 * GREEN EXPRESS LLC (Crowley, Texas) - 4-Truck Medina Family Fleet
 * Operating Authorities: USDOT-3252472 | TXDMV-009021927C
 * Fleet equipped with TruckX Certified ELD (FMCSA)
 * Memory Vault System: Complete credentials, vault documents, dispatches, settlements, and AI driver memory.
 */
export const INITIAL_FLEET_DRIVERS: FleetDriver[] = [
  {
    id: 'drv-jesus-medina',
    name: 'Jesus Medina',
    role: 'Lead Driver & Owner-Operator',
    phone: '(817) 592-1060',
    email: 'jesus.medina@greenexpressllc.com',
    cdlNumber: 'TX-48201948',
    cdlState: 'TX',
    truckNumber: 'Unit #106 (Freightliner Classic · VIN-YLB94884)',
    trailerNumber: 'TLR-54211',
    assignedTruckNumber: '106',
    assignedTrailerNumber: '54211',
    equipmentType: '53ft Dry Van',
    status: 'available',
    currentLocation: 'Crowley, TX (Terminal Yard)',
    hOSRemainingHours: 11.0,
    medicalCardExpiry: '2027-10-15',
    hireDate: '2019-03-10',
    avatarBg: 'bg-emerald-600',
    pinCode: '1060',
    payModel: '65% Load Gross',
    totalMilesDriven: 482900,
    lifetimeLoadsCount: 342,
    lifetimeEarnings: 428950,
    endorsements: ['Class A CDL', 'Tanker (N)', 'Doubles/Triples (T)', 'Air Brakes'],
    preferredLanes: ['DFW (TX) ➔ Midwest (IL/IN/OH)', 'Texas Intrastate Triangle (DFW/Houston/San Antonio)', 'I-35 Corridor'],
    emergencyContactName: 'Maria Medina',
    emergencyContactPhone: '(817) 592-9901',
    vaultDocuments: [
      {
        id: 'doc-cdl-jesus',
        title: 'Commercial Driver License (Class A)',
        type: 'CDL',
        fileName: 'Jesus_Medina_CDL_ClassA_TX48201948.pdf',
        fileSize: '1.8 MB',
        uploadDate: '2024-04-12',
        expiryDate: '2028-09-14',
        status: 'valid',
        notes: 'Texas CDL Class A with Tanker and Doubles endorsements. Clean MVR.'
      },
      {
        id: 'doc-med-jesus',
        title: 'DOT Medical Examiner Certificate',
        type: 'MedicalCard',
        fileName: 'DOT_Medical_Card_Jesus_Medina_Exp2027.pdf',
        fileSize: '950 KB',
        uploadDate: '2025-10-15',
        expiryDate: '2027-10-15',
        status: 'valid',
        notes: '2-year commercial medical card issued by Concentra Urgent Care (Fort Worth, TX).'
      },
      {
        id: 'doc-w9-jesus',
        title: 'W-9 & Subcontractor Agreement',
        type: 'W9_Contract',
        fileName: 'Jesus_Medina_W9_GreenExpress_Executed.pdf',
        fileSize: '2.1 MB',
        uploadDate: '2024-01-05',
        status: 'valid',
        notes: 'Active lease and direct deposit factoring authorization.'
      },
      {
        id: 'doc-insp-jesus',
        title: 'Annual DOT Inspection - Unit #106',
        type: 'Inspection',
        fileName: 'Unit106_Freightliner_Annual_Inspection_2026.pdf',
        fileSize: '1.2 MB',
        uploadDate: '2026-02-18',
        expiryDate: '2027-02-18',
        status: 'valid',
        notes: 'Passed 100% with no violations. Brakes, tires (>10/32), and emissions certified.'
      },
      {
        id: 'doc-cab-jesus',
        title: 'Texas Cab Card & Apportioned Registration',
        type: 'CabCard',
        fileName: 'TxDMV_CabCard_Unit106_VIN94884.pdf',
        fileSize: '820 KB',
        uploadDate: '2026-01-01',
        expiryDate: '2026-12-31',
        status: 'valid',
        notes: 'IRP Apportioned 80,000 lbs registered in Texas.'
      }
    ],
    driverNotes: [
      {
        id: 'note-j1',
        category: 'preference',
        title: 'Rest Stop & Fuel Routine',
        content: 'Prefers fueling at Love’s Travel Stops via EFS card. Takes 30-min break around mile 250. Home terminal in Crowley, TX on weekends.',
        author: 'Jesus Medina',
        timestamp: '2026-08-14'
      },
      {
        id: 'note-j2',
        category: 'lane_history',
        title: 'Chicago Shippers Dock Protocol',
        content: 'Familiar with C.H. Robinson cold storage and Amazon MDW2 dock appointments. Overnight staging allowed on west apron.',
        author: 'Dispatch Desk',
        timestamp: '2026-09-02'
      }
    ],
    settlements: [
      {
        id: 'set-j-101',
        settlementNumber: 'SET-2026-W39-JM',
        weekEnding: '2026-09-29',
        loadNumbers: ['GE-982301'],
        grossRevenue: 4155.00,
        driverPayRate: 0.65,
        grossPay: 2700.75,
        deductionsTotal: 180.00,
        netPay: 2520.75,
        status: 'paid',
        paidDate: '2026-10-01'
      },
      {
        id: 'set-j-100',
        settlementNumber: 'SET-2026-W38-JM',
        weekEnding: '2026-09-22',
        loadNumbers: ['GE-981042', 'GE-981110'],
        grossRevenue: 6400.00,
        driverPayRate: 0.65,
        grossPay: 4160.00,
        deductionsTotal: 340.00,
        netPay: 3820.00,
        status: 'paid',
        paidDate: '2026-09-24'
      }
    ]
  },
  {
    id: 'drv-jose-medina',
    name: 'Jose Medina',
    role: 'Senior Commercial Reefer Driver',
    phone: '(817) 592-1010',
    email: 'jose.medina@greenexpressllc.com',
    cdlNumber: 'TX-39184021',
    cdlState: 'TX',
    truckNumber: 'Unit #101 (Freightliner Cascadia)',
    trailerNumber: 'TLR-54201',
    assignedTruckNumber: '101',
    assignedTrailerNumber: '54201',
    equipmentType: '53ft Reefer',
    status: 'dispatched',
    currentLocation: 'Fort Worth, TX (Logistics Center)',
    hOSRemainingHours: 9.5,
    medicalCardExpiry: '2027-09-15',
    hireDate: '2020-04-10',
    avatarBg: 'bg-blue-600',
    pinCode: '1010',
    payModel: '65% Load Gross',
    totalMilesDriven: 395400,
    lifetimeLoadsCount: 286,
    lifetimeEarnings: 372100,
    endorsements: ['Class A CDL', 'Reefer Specialist', 'Air Brakes'],
    preferredLanes: ['Texas ➔ Southeast (Atlanta/Orlando)', 'Texas ➔ Midwest (Chicago/Detroit)'],
    emergencyContactName: 'Carmen Medina',
    emergencyContactPhone: '(817) 592-9902',
    vaultDocuments: [
      {
        id: 'doc-cdl-jose',
        title: 'Commercial Driver License (Class A)',
        type: 'CDL',
        fileName: 'Jose_Medina_CDL_TX39184021.pdf',
        fileSize: '1.6 MB',
        uploadDate: '2024-05-18',
        expiryDate: '2028-11-20',
        status: 'valid',
        notes: 'Texas CDL-A Commercial Master.'
      },
      {
        id: 'doc-med-jose',
        title: 'DOT Medical Examiner Certificate',
        type: 'MedicalCard',
        fileName: 'DOT_Medical_Card_Jose_Medina_Exp2027.pdf',
        fileSize: '890 KB',
        uploadDate: '2025-09-15',
        expiryDate: '2027-09-15',
        status: 'valid',
        notes: 'Clean physical with no restrictions.'
      },
      {
        id: 'doc-insp-jose',
        title: 'Annual DOT Inspection - Unit #101',
        type: 'Inspection',
        fileName: 'Unit101_Cascadia_Annual_Inspection_2026.pdf',
        fileSize: '1.4 MB',
        uploadDate: '2026-03-02',
        expiryDate: '2027-03-02',
        status: 'valid',
        notes: 'Thermo King Reefer unit calibrated at -20°F to +70°F.'
      }
    ],
    driverNotes: [
      {
        id: 'note-jos1',
        category: 'operational',
        title: 'Reefer Pre-Cooling Standard',
        content: 'Always pre-cools reefer trailer 2 hours prior to produce or meat loading. Continuous run mode on produce.',
        author: 'Jose Medina',
        timestamp: '2026-07-20'
      }
    ],
    settlements: [
      {
        id: 'set-jos-101',
        settlementNumber: 'SET-2026-W39-JOSM',
        weekEnding: '2026-09-29',
        loadNumbers: ['GE-884210'],
        grossRevenue: 3800.00,
        driverPayRate: 0.65,
        grossPay: 2470.00,
        deductionsTotal: 150.00,
        netPay: 2320.00,
        status: 'paid',
        paidDate: '2026-10-01'
      }
    ]
  },
  {
    id: 'drv-luis-medina',
    name: 'Luis Medina',
    role: 'Commercial Asset Driver',
    phone: '(817) 592-1020',
    email: 'luis.medina@greenexpressllc.com',
    cdlNumber: 'TX-39184022',
    cdlState: 'TX',
    truckNumber: 'Unit #102 (Peterbilt 389)',
    trailerNumber: 'TLR-54202',
    assignedTruckNumber: '102',
    assignedTrailerNumber: '54202',
    equipmentType: '53ft Dry Van',
    status: 'available',
    currentLocation: 'Crowley, TX Yard',
    hOSRemainingHours: 11.0,
    medicalCardExpiry: '2027-11-20',
    hireDate: '2020-06-01',
    avatarBg: 'bg-indigo-600',
    pinCode: '1020',
    payModel: '65% Load Gross',
    totalMilesDriven: 360200,
    lifetimeLoadsCount: 260,
    lifetimeEarnings: 335400,
    endorsements: ['Class A CDL', 'Dry Van Specialist', 'Air Brakes'],
    preferredLanes: ['Texas ➔ East Coast / Mid-Atlantic', 'DFW ➔ Kansas City / St. Louis'],
    emergencyContactName: 'Sofia Medina',
    emergencyContactPhone: '(817) 592-9903',
    vaultDocuments: [
      {
        id: 'doc-cdl-luis',
        title: 'Commercial Driver License (Class A)',
        type: 'CDL',
        fileName: 'Luis_Medina_CDL_TX39184022.pdf',
        fileSize: '1.7 MB',
        uploadDate: '2024-06-10',
        expiryDate: '2028-12-05',
        status: 'valid',
        notes: 'Texas CDL Class A. Clean safety record.'
      },
      {
        id: 'doc-med-luis',
        title: 'DOT Medical Examiner Certificate',
        type: 'MedicalCard',
        fileName: 'DOT_Medical_Card_Luis_Medina_Exp2027.pdf',
        fileSize: '910 KB',
        uploadDate: '2025-11-20',
        expiryDate: '2027-11-20',
        status: 'valid',
        notes: 'Certified medical examiner clearance.'
      },
      {
        id: 'doc-insp-luis',
        title: 'Annual DOT Inspection - Unit #102',
        type: 'Inspection',
        fileName: 'Unit102_Peterbilt389_Annual_Inspection.pdf',
        fileSize: '1.3 MB',
        uploadDate: '2026-04-10',
        expiryDate: '2027-04-10',
        status: 'valid',
        notes: 'Peterbilt 389 Cummins X15 motor verified and certified.'
      }
    ],
    driverNotes: [
      {
        id: 'note-l1',
        category: 'preference',
        title: 'Long Haul Van Lanes',
        content: 'Prefers drop-and-hook dry van freight or appointment deliveries with under 1-hour dwell time.',
        author: 'Luis Medina',
        timestamp: '2026-08-01'
      }
    ],
    settlements: [
      {
        id: 'set-l-101',
        settlementNumber: 'SET-2026-W39-LM',
        weekEnding: '2026-09-29',
        loadNumbers: ['GE-77190'],
        grossRevenue: 2950.00,
        driverPayRate: 0.65,
        grossPay: 1917.50,
        deductionsTotal: 120.00,
        netPay: 1797.50,
        status: 'paid',
        paidDate: '2026-10-01'
      }
    ]
  },
  {
    id: 'drv-alfredo-medina',
    name: 'Alfredo Medina',
    role: 'Operations & Heavy Transport Driver',
    phone: '(817) 592-1030',
    email: 'alfredo.medina@greenexpressllc.com',
    cdlNumber: 'TX-82919405',
    cdlState: 'TX',
    truckNumber: 'Unit #103 (Kenworth W900)',
    trailerNumber: 'TLR-54203',
    assignedTruckNumber: '103',
    assignedTrailerNumber: '54203',
    equipmentType: '53ft Reefer',
    status: 'driving',
    currentLocation: 'Dallas, TX (I-35E Southbound)',
    hOSRemainingHours: 6.5,
    medicalCardExpiry: '2027-08-20',
    hireDate: '2019-01-15',
    avatarBg: 'bg-amber-600',
    pinCode: '1030',
    payModel: '65% Load Gross',
    totalMilesDriven: 512000,
    lifetimeLoadsCount: 388,
    lifetimeEarnings: 495000,
    endorsements: ['Class A CDL', 'Hazmat (H)', 'Tanker (N)', 'Doubles/Triples (T)', 'TWIC Card'],
    preferredLanes: ['National Expedited Corridors', 'Texas ➔ California / West Coast', 'Cross-Border Laredo/DFW'],
    emergencyContactName: 'Laura Medina',
    emergencyContactPhone: '(817) 592-9904',
    vaultDocuments: [
      {
        id: 'doc-cdl-alfredo',
        title: 'Commercial Driver License (Class A Master)',
        type: 'CDL',
        fileName: 'Alfredo_Medina_CDL_Master_TX82919405.pdf',
        fileSize: '1.9 MB',
        uploadDate: '2024-03-15',
        expiryDate: '2029-01-20',
        status: 'valid',
        notes: 'Texas Master CDL-A with Hazmat, Tanker, Doubles, and TWIC card clearance.'
      },
      {
        id: 'doc-med-alfredo',
        title: 'DOT Medical Examiner Certificate',
        type: 'MedicalCard',
        fileName: 'DOT_Medical_Card_Alfredo_Medina_Exp2027.pdf',
        fileSize: '880 KB',
        uploadDate: '2025-08-20',
        expiryDate: '2027-08-20',
        status: 'valid',
        notes: 'DOT Medical Card 2-year certification.'
      },
      {
        id: 'doc-insp-alfredo',
        title: 'Annual DOT Inspection - Unit #103',
        type: 'Inspection',
        fileName: 'Unit103_KenworthW900_Annual_Inspection.pdf',
        fileSize: '1.5 MB',
        uploadDate: '2026-01-10',
        expiryDate: '2027-01-10',
        status: 'valid',
        notes: 'Kenworth W900 CAT C15 certified. ELD TruckX synchronized.'
      },
      {
        id: 'doc-twic-alfredo',
        title: 'TWIC Card (Transportation Worker Identification Credential)',
        type: 'Custom',
        fileName: 'TWIC_Card_Alfredo_Medina_TSA.pdf',
        fileSize: '740 KB',
        uploadDate: '2024-07-15',
        expiryDate: '2029-07-15',
        status: 'valid',
        notes: 'TSA maritime port and secure facility access clearance.'
      }
    ],
    driverNotes: [
      {
        id: 'note-a1',
        category: 'operational',
        title: 'Fleet Operations Lead',
        content: 'Coordinates vehicle maintenance schedule, preventive oil analysis, and FMCSA safety audit compliance.',
        author: 'Alfredo Medina',
        timestamp: '2026-09-10'
      }
    ],
    settlements: [
      {
        id: 'set-a-101',
        settlementNumber: 'SET-2026-W39-AM',
        weekEnding: '2026-09-29',
        loadNumbers: ['GE-662190'],
        grossRevenue: 4400.00,
        driverPayRate: 0.65,
        grossPay: 2860.00,
        deductionsTotal: 190.00,
        netPay: 2670.00,
        status: 'paid',
        paidDate: '2026-10-01'
      }
    ]
  }
];

export const INITIAL_FREIGHT_ESTIMATES: FreightEstimate[] = [
  {
    id: 'est-101',
    quoteNumber: `Q-${new Date().getFullYear()}-106`,
    customerName: 'C.H. Robinson Worldwide',
    customerEmail: 'pricing@chrobinson.com',
    customerPhone: '(800) 323-7587',
    originCity: 'Fort Worth',
    originState: 'TX',
    originZip: '76102',
    destCity: 'Chicago',
    destState: 'IL',
    destZip: '60638',
    equipmentType: '53ft Dry Van',
    loadedMiles: 925,
    deadheadMiles: 20,
    ratePerMile: 3.45,
    linehaulTotal: 3191.25,
    fuelSurchargePerMile: 0.42,
    fuelSurchargeTotal: 388.50,
    accessorials: [],
    totalQuoteAmount: 3579.75,
    targetMarginPct: 24.5,
    estimatedDriverPay: 2326.84,
    estimatedNetProfit: 877.04,
    status: 'accepted',
    notes: 'Accepted rate quote for Green Express LLC Unit #106.',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    pickupDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    commodity: 'Commercial Freight & Dry Goods',
    weightLbs: 43500,
    specialInstructions: 'Green Express LLC Unit #106 assigned. Driver call upon dock arrival in Chicago.'
  }
];
