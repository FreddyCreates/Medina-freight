import { 
  Project, 
  ScannedDocument, 
  ProposedInvoice, 
  BillingEmail, 
  PaymentRemittance, 
  Collaborator, 
  WindowsWatcherConfig,
  FoundryAgent,
  AgentExecutionLog,
  IntegrationService
} from '../types';

export const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    id: 'user-1',
    name: 'Dispatch Lead (You)',
    role: 'Operations & Billing Lead',
    email: 'dispatch@greenexpressllc.com',
    initials: 'DL',
    avatarBg: 'bg-orange-600',
    status: 'active',
    currentViewing: 'Foundry Studio',
  },
  {
    id: 'user-2',
    name: 'Fleet Dispatcher',
    role: 'Senior Freight Dispatcher',
    email: 'operations@greenexpressllc.com',
    initials: 'FD',
    avatarBg: 'bg-blue-600',
    status: 'active',
    currentViewing: 'Live Map Telemetry',
  },
  {
    id: 'user-3',
    name: 'Billing Auditor',
    role: 'Senior AR / Billing Auditor',
    email: 'billing@greenexpressllc.com',
    initials: 'BA',
    avatarBg: 'bg-indigo-600',
    status: 'in_review',
    currentViewing: 'Invoice INV-2026-089',
  },
  {
    id: 'user-4',
    name: 'Fleet & Safety Manager',
    role: 'Safety & Compliance Lead',
    email: 'safety@greenexpressllc.com',
    initials: 'SM',
    avatarBg: 'bg-purple-600',
    status: 'idle',
    currentViewing: 'Driver Mobile',
  },
];

export const INITIAL_WINDOWS_CONFIG: WindowsWatcherConfig = {
  incomingFolderPath: 'C:\\FreightOps\\Incoming\\Scans',
  remittancesFolderPath: 'C:\\FreightOps\\Incoming\\Remittances',
  archiveFolderPath: 'C:\\FreightOps\\Archive\\Processed_2026',
  autoWatchEnabled: true,
  pollIntervalSeconds: 3,
  localEncryption: true,
  lastScannedTime: 'Just now',
  detectedFilesCount: 6,
  myInvoiceExecutableFound: true,
  myInvoiceDataPath: 'C:\\Program Files (x86)\\MyInvoice\\Data\\GreenExpress.myinv',
};

// -------------------------------------------------------------
// Alvys Foundry AI Agents Library
// -------------------------------------------------------------
export const INITIAL_FOUNDRY_AGENTS: FoundryAgent[] = [
  {
    id: 'agent-1',
    name: 'Automated Load Builder Agent',
    slug: 'load_builder',
    category: 'load_building',
    tagline: 'Parses broker tender emails & rate cons into structured TMS loads instantly.',
    description: 'Listens to incoming broker rate confirmations, EDI 204 tenders, and email attachments. Extracts shipper, consignee, appointments, commodity, equipment, linehaul, and fuel surcharge to build production loads with zero manual typing.',
    status: 'active',
    iconName: 'Sparkles',
    triggerEvent: 'Incoming Email / RateCon Attachment / EDI 204',
    totalRunsCount: 1420,
    hoursSavedTotal: 184.5,
    accuracyRatePct: 99.4,
    requiresHumanApproval: true,
    systemPrompt: 'Extract all shipment metadata, stops, linehaul rates, and accessorial terms from the attached rate confirmation document. Format as a valid Alvys TMS Load Object.',
    lastRunAt: '2 mins ago',
    recentOutputSnippet: 'Built Load #CHR-982301 from C.H. Robinson RateCon PDF with $3,450.00 linehaul + $420.00 FSC.',
    workflowNodes: [
      { id: 'n1', type: 'trigger', title: 'Broker Email Ingest', description: 'Triggered when PDF or EDI 204 arrives at dispatch@greenexpressllc.com', config: { channel: 'IMAP_GMAIL' }, status: 'completed' },
      { id: 'n2', type: 'ocr_extract', title: 'Vision OCR Parser', description: 'Extracts 24 key shipment data fields', config: { model: 'gemini-2.5-flash' }, status: 'completed' },
      { id: 'n3', type: 'rule_engine', title: 'Equipment & Lane Check', description: 'Matches 53ft Reefer capacity & validates rate index', config: { minMargin: 12 }, status: 'completed' },
      { id: 'n4', type: 'approval_gate', title: 'Dispatcher Confirmation', description: 'Requires 1-click approval for loads > $3,000', config: { threshold: 3000 }, status: 'active' },
      { id: 'n5', type: 'tms_action', title: 'Create Load in TMS', description: 'Publishes load to dispatch matrix & driver app', config: { notifyDriver: true }, status: 'waiting' }
    ]
  },
  {
    id: 'agent-2',
    name: 'Document Intake & Filing Agent',
    slug: 'document_intake',
    category: 'document_intake',
    tagline: 'Auto-reads, classifies, and tags BOLs, PODs, and lumper receipts.',
    description: 'Monitors hotfolders, mobile driver uploads, and carrier emails. Identifies document type (Signed BOL, RateCon, Lumper Receipt, Scale Ticket), verifies receiver signatures and stamps, and links files directly to the load folder.',
    status: 'active',
    iconName: 'FileText',
    triggerEvent: 'Driver Mobile Upload / Incoming Hotfolder',
    totalRunsCount: 3890,
    hoursSavedTotal: 312.0,
    accuracyRatePct: 99.1,
    requiresHumanApproval: false,
    systemPrompt: 'Classify document type, detect presence of consignee stamp and signature, extract load number, and index into document repository.',
    lastRunAt: '8 mins ago',
    recentOutputSnippet: 'Verified receiver stamp on BOL-554109 for Load #CHR-982301. Attached to billing packet.',
    workflowNodes: [
      { id: 'n1', type: 'trigger', title: 'Document Drop', description: 'Triggers on incoming PDF or image', config: {}, status: 'completed' },
      { id: 'n2', type: 'ocr_extract', title: 'Stamp & Signature Detection', description: 'Validates proof of delivery', config: {}, status: 'completed' },
      { id: 'n3', type: 'tms_action', title: 'File to Load Folder', description: 'Binds PDF to Load & updates milestone', config: {}, status: 'completed' }
    ]
  },
  {
    id: 'agent-3',
    name: 'Detention Sentinel & Claim Agent',
    slug: 'detention',
    category: 'detention',
    tagline: 'Tracks geofence dwell times, detects overages (>2 hrs), and auto-files claims.',
    description: 'Continuously monitors ELD GPS telematics. When a truck dwells at a shipper or receiver dock past the 2-hour standard allowance, it calculates billable detention ($75/hr), compiles GPS proof timestamps, and drafts the claim for the broker.',
    status: 'active',
    iconName: 'Clock',
    triggerEvent: 'Geofence Dwell > 120 Minutes',
    totalRunsCount: 428,
    hoursSavedTotal: 96.0,
    accuracyRatePct: 98.7,
    requiresHumanApproval: true,
    systemPrompt: 'Calculate detention overage hours past 2.0 hrs, generate GPS breadcrumb audit logs, and build detention reimbursement line item.',
    lastRunAt: '14 mins ago',
    recentOutputSnippet: 'Detected 3.5 hrs dwell at Dallas Metro Logistics. Prepared $112.50 detention claim for Echo Logistics.',
    workflowNodes: [
      { id: 'n1', type: 'trigger', title: 'ELD Geofence Monitor', description: 'Triggers at 120min dock dwell', config: { thresholdMinutes: 120 }, status: 'completed' },
      { id: 'n2', type: 'rule_engine', title: 'Rate Calculator', description: 'Computes $75/hr after 2h free', config: { hourlyRate: 75 }, status: 'completed' },
      { id: 'n3', type: 'notification', title: 'Alert Dispatch & Broker', description: 'Sends automated check-in and detention notice', config: {}, status: 'active' }
    ]
  },
  {
    id: 'agent-4',
    name: 'Track & Trace Check-Call Sentinel',
    slug: 'track_trace',
    category: 'track_trace',
    tagline: 'Automates customer check-calls, status emails, and live ETA tracking.',
    description: 'Proactively sends automated email and EDI 214 check-calls to broker AP/tracking desks with live GPS coordinates, reefer temperature logs, weather alerts, and public tracking links, eliminating manual phone calls.',
    status: 'active',
    iconName: 'Radio',
    triggerEvent: 'Scheduled Interval (Every 4h) / Geofence Milestone',
    totalRunsCount: 8940,
    hoursSavedTotal: 580.0,
    accuracyRatePct: 99.8,
    requiresHumanApproval: false,
    systemPrompt: 'Draft clear, professional shipment transit status updates with ETA, current highway location, and temperature compliance log.',
    lastRunAt: 'Just now',
    recentOutputSnippet: 'Sent EDI 214 In-Transit update to C.H. Robinson (I-40 W Mile 182, ETA 08:30 AM).',
    workflowNodes: [
      { id: 'n1', type: 'trigger', title: 'Transit Heartbeat', description: 'Fires every 4 hours during active transit', config: {}, status: 'completed' },
      { id: 'n2', type: 'tms_action', title: 'Generate Tracking Link', description: 'Updates public customer portal view', config: {}, status: 'completed' },
      { id: 'n3', type: 'notification', title: 'Send Email & EDI 214', description: 'Dispatches check-call to broker desk', config: {}, status: 'completed' }
    ]
  },
  {
    id: 'agent-5',
    name: 'Automated Invoicing & Factoring Agent',
    slug: 'invoicing',
    category: 'invoicing',
    tagline: 'Matches BOL + RateCon + Lumpers, creates invoices, and submits to Factoring.',
    description: 'Upon delivery confirmation, cross-checks rate confirmation with signed BOL and paid lumper slips. Auto-generates invoice PDF and transmits directly to factoring partners (TriumphPay, RTS, OTR) or direct billing portals.',
    status: 'active',
    iconName: 'ReceiptText',
    triggerEvent: 'Load Delivered & Signed BOL Verified',
    totalRunsCount: 1680,
    hoursSavedTotal: 220.0,
    accuracyRatePct: 99.5,
    requiresHumanApproval: true,
    systemPrompt: 'Reconcile freight rate, FSC, detention, and lumper pass-through into a certified invoice packet for factor funding.',
    lastRunAt: '25 mins ago',
    recentOutputSnippet: 'Generated Invoice INV-2026-089 for $4,155.00 and packaged with CapStone lumper receipt.',
    workflowNodes: [
      { id: 'n1', type: 'trigger', title: 'Delivery Confirmed', description: 'Fired when driver uploads signed POD', config: {}, status: 'completed' },
      { id: 'n2', type: 'rule_engine', title: 'Reconciliation Engine', description: 'Cross-checks RateCon linehaul vs Lumper receipts', config: {}, status: 'completed' },
      { id: 'n3', type: 'approval_gate', title: 'Billing Lead Review', description: 'Side-by-side audit gate', config: {}, status: 'active' },
      { id: 'n4', type: 'tms_action', title: 'Submit to Factor / Quickbooks', description: 'Transmits EDI 210 / Factor batch', config: {}, status: 'waiting' }
    ]
  },
  {
    id: 'agent-6',
    name: 'Carrier Compliance & SaferWatch Agent',
    slug: 'compliance',
    category: 'compliance',
    tagline: 'Performs FMCSA, safety score, insurance, and fraud audits in real time.',
    description: 'Audits carrier safety ratings, active operating authority, COI insurance certificates, and double-brokering risk before any co-brokered load assignment.',
    status: 'active',
    iconName: 'ShieldCheck',
    triggerEvent: 'Carrier Assigned / COI Expiry',
    totalRunsCount: 650,
    hoursSavedTotal: 78.0,
    accuracyRatePct: 99.9,
    requiresHumanApproval: false,
    systemPrompt: 'Check FMCSA Safer database and verify $1M auto liability + $100k cargo insurance.',
    lastRunAt: '1 hour ago',
    recentOutputSnippet: 'GREEN EXPRESS LLC verified: Satisfactory Safety, $1,000,000 Auto Liability Active.',
    workflowNodes: [
      { id: 'n1', type: 'trigger', title: 'Carrier Lookup', description: 'Triggers on DOT / MC number entry', config: {}, status: 'completed' },
      { id: 'n2', type: 'tms_action', title: 'FMCSA Safety Audit', description: 'Queries SaferWatch & Registry API', config: {}, status: 'completed' }
    ]
  },
  {
    id: 'agent-7',
    name: 'Rate Intelligence & Market Pricing Agent',
    slug: 'pricing',
    category: 'pricing',
    tagline: 'Analyzes DAT One, Truckstop, and Sonar market rates to suggest optimal pricing.',
    description: 'Evaluates historical lane rates, real-time 7-day spot market indices, fuel surcharges, and equipment tightness to maximize revenue per mile and broker margin.',
    status: 'active',
    iconName: 'TrendingUp',
    triggerEvent: 'Quote Request / Load Building',
    totalRunsCount: 2190,
    hoursSavedTotal: 145.0,
    accuracyRatePct: 98.2,
    requiresHumanApproval: false,
    systemPrompt: 'Analyze Chicago to Dallas Reefer lane rates. Recommend target buy and sell rate per mile.',
    lastRunAt: '40 mins ago',
    recentOutputSnippet: 'Chicago -> Dallas Reefer 7-Day Spot Index: $3.45/mi. Suggested quote: $3,870 ($3.87/mi).',
    workflowNodes: [
      { id: 'n1', type: 'trigger', title: 'Lane Input', description: 'Triggers on origin/dest entry', config: {}, status: 'completed' },
      { id: 'n2', type: 'rule_engine', title: 'DAT & Truckstop Aggregator', description: 'Calculates 30-day & 7-day averages', config: {}, status: 'completed' }
    ]
  }
];

export const INITIAL_EXECUTION_LOGS: AgentExecutionLog[] = [
  {
    id: 'log-1',
    agentId: 'agent-1',
    agentName: 'Automated Load Builder Agent',
    timestamp: '2026-09-30 16:20',
    loadNumber: 'CHR-982301',
    triggerEvent: 'RateCon Email Intake',
    inputSummary: 'PDF RateCon_CHR_Load982301.pdf (C.H. Robinson)',
    outputSummary: 'Parsed Load #CHR-982301: Chicago, IL -> Dallas, TX | Rate: $3,450 + FSC: $420 | Reefer 34°F',
    executionTimeMs: 420,
    status: 'success',
    confidenceScore: 99.4,
    humanApprovedBy: 'Alfredo Medina'
  },
  {
    id: 'log-2',
    agentId: 'agent-3',
    agentName: 'Detention Sentinel & Claim Agent',
    timestamp: '2026-09-30 15:45',
    loadNumber: 'EGL-77190',
    triggerEvent: 'Geofence Dwell > 120min',
    inputSummary: 'Samsara GPS Dwell: 3.5 hrs @ Atlanta Distribution Terminal Dock #4',
    outputSummary: 'Detention detected: 1.5 hrs overage @ $75/hr = $112.50. Compiled GPS time audit proof packet.',
    executionTimeMs: 310,
    status: 'needs_human_review',
    confidenceScore: 98.7,
  },
  {
    id: 'log-3',
    agentId: 'agent-4',
    agentName: 'Track & Trace Check-Call Sentinel',
    timestamp: '2026-09-30 15:00',
    loadNumber: 'CHR-982301',
    triggerEvent: 'Scheduled Check-Call (4h)',
    inputSummary: 'GPS: 32.7767° N, -96.7970° W (Dallas Suburbs)',
    outputSummary: 'Automated email sent to ap-freight@chrobinson.com with live ETA (11:30 AM) and Reefer temp (34°F).',
    executionTimeMs: 250,
    status: 'success',
    confidenceScore: 100.0,
  }
];

// -------------------------------------------------------------
// 120+ Connected Integrations Catalog
// -------------------------------------------------------------
export const INITIAL_INTEGRATIONS: IntegrationService[] = [
  { id: 'int-1', name: 'DAT One & RateView', category: 'Load Boards', description: 'Instant load posting, lane rate benchmarking, and carrier capacity network.', iconName: 'TrendingUp', connected: true, syncStatus: 'synced', lastSync: '1 min ago', recordsCount: 1420 },
  { id: 'int-2', name: 'Truckstop.com', category: 'Load Boards', description: 'Real-time load board syndication and negotiation portal.', iconName: 'Truck', connected: true, syncStatus: 'synced', lastSync: '3 mins ago', recordsCount: 890 },
  { id: 'int-3', name: 'Samsara Telematics & ELD', category: 'ELD Telematics', description: 'Live GPS breadcrumbs, HOS drive hours, geofences, and reefer temperature telemetry.', iconName: 'Radio', connected: true, syncStatus: 'synced', lastSync: 'Real-time (3s)', recordsCount: 48 },
  { id: 'int-4', name: 'Motive (KeepTruckin)', category: 'ELD Telematics', description: 'Driver logs, IFTA fuel tracking, and maintenance diagnostics.', iconName: 'Compass', connected: true, syncStatus: 'synced', lastSync: 'Real-time', recordsCount: 32 },
  { id: 'int-5', name: 'TriumphPay & Factoring', category: 'Accounting & Factoring', description: 'Automated factor schedule upload, quickpay processing, and audit verification.', iconName: 'DollarSign', connected: true, syncStatus: 'synced', lastSync: '12 mins ago', recordsCount: 310 },
  { id: 'int-6', name: 'QuickBooks Online', category: 'Accounting & Factoring', description: 'Two-way chart of accounts sync, AR receivables, and settlement journal entries.', iconName: 'ReceiptText', connected: true, syncStatus: 'synced', lastSync: '15 mins ago', recordsCount: 640 },
  { id: 'int-7', name: 'SaferWatch / FMCSA', category: 'Compliance & Safety', description: 'Live carrier safety scoring, authority verification, and COI monitoring.', iconName: 'ShieldCheck', connected: true, syncStatus: 'synced', lastSync: '1 hour ago', recordsCount: 180 },
  { id: 'int-8', name: 'EDI 204 / 214 / 210 Gateway', category: 'EDI Gateway', description: 'Direct electronic data interchange with Tier-1 shippers (Walmart, Amazon, Target).', iconName: 'Server', connected: true, syncStatus: 'synced', lastSync: 'Just now', recordsCount: 4200 }
];

export const INITIAL_SCANNED_DOCS: ScannedDocument[] = [
  {
    id: 'doc-bol-8842',
    fileName: 'BOL_Scan_Load8842_Signed_Stamped.pdf',
    fileSize: '2.4 MB',
    type: 'BOL',
    scannedAt: '2026-09-30 14:15',
    localPath: 'C:\\FreightOps\\Incoming\\Scans\\BOL_Scan_Load8842_Signed_Stamped.pdf',
    thumbnailColor: 'from-amber-950/40 to-slate-900',
    ocrConfidence: 98,
    status: 'matched',
    matchedProjectId: 'prj-1',
    matchedCustomer: 'C.H. Robinson Worldwide',
    discrepancies: [],
    extractedData: {
      loadNumber: 'CHR-982301',
      bolNumber: 'BOL-554109',
      brokerCustomer: 'C.H. Robinson Worldwide',
      carrierName: 'GREEN EXPRESS LLC',
      driverName: 'Ray Delgado',
      pickupLocation: 'Chicago Dist Center, IL 60608',
      deliveryLocation: 'Dallas Metro Logistics, TX 75261',
      pickupDate: '2026-09-27',
      deliveryDate: '2026-09-29',
      weightLbs: 42800,
      consigneeSignature: true,
      notes: 'Received in good order. 22 pallets refrigerated produce. Clean receiver stamp present.',
      rawOcrHighlights: [
        { field: 'BOL Number', text: 'BOL-554109', confidence: 99, box: { x: 72, y: 15, width: 22, height: 5 } },
        { field: 'Shipper', text: 'Chicago Dist Center, IL', confidence: 98, box: { x: 10, y: 25, width: 38, height: 8 } },
        { field: 'Consignee', text: 'Dallas Metro Logistics, TX', confidence: 97, box: { x: 55, y: 25, width: 38, height: 8 } },
        { field: 'Weight', text: '42,800 LBS', confidence: 99, box: { x: 68, y: 62, width: 25, height: 4 } },
        { field: 'Signature', text: 'Consignee Signature Verified [G. Miller]', confidence: 96, box: { x: 55, y: 82, width: 35, height: 10 } }
      ]
    }
  },
  {
    id: 'doc-rate-8842',
    fileName: 'RateCon_CHR_Load982301.pdf',
    fileSize: '1.1 MB',
    type: 'RateConfirmation',
    scannedAt: '2026-09-30 14:15',
    localPath: 'C:\\FreightOps\\Incoming\\Scans\\RateCon_CHR_Load982301.pdf',
    thumbnailColor: 'from-blue-950/40 to-slate-900',
    ocrConfidence: 99,
    status: 'matched',
    matchedProjectId: 'prj-1',
    matchedCustomer: 'C.H. Robinson Worldwide',
    discrepancies: [],
    extractedData: {
      loadNumber: 'CHR-982301',
      brokerCustomer: 'C.H. Robinson Worldwide',
      rateAmount: 3450.00,
      fuelSurcharge: 420.00,
      detentionHours: 0,
      detentionAmount: 0,
      pickupDate: '2026-09-27',
      deliveryDate: '2026-09-29',
      notes: 'All accessorials require receipts within 24h. Standard net 30 payment terms.',
      rawOcrHighlights: [
        { field: 'Load Number', text: 'CHR-982301', confidence: 100, box: { x: 65, y: 12, width: 30, height: 6 } },
        { field: 'Linehaul Rate', text: '$3,450.00 USD', confidence: 99, box: { x: 70, y: 48, width: 24, height: 5 } },
        { field: 'Fuel Surcharge', text: '$420.00 USD', confidence: 98, box: { x: 70, y: 55, width: 24, height: 5 } },
        { field: 'Total Agreed', text: '$3,870.00 USD', confidence: 99, box: { x: 70, y: 72, width: 24, height: 6 } }
      ]
    }
  },
  {
    id: 'doc-lumper-8842',
    fileName: 'Lumper_CapStone_Dallas_Receipt.pdf',
    fileSize: '780 KB',
    type: 'LumperReceipt',
    scannedAt: '2026-09-30 14:16',
    localPath: 'C:\\FreightOps\\Incoming\\Scans\\Lumper_CapStone_Dallas_Receipt.pdf',
    thumbnailColor: 'from-purple-950/40 to-slate-900',
    ocrConfidence: 95,
    status: 'matched',
    matchedProjectId: 'prj-1',
    matchedCustomer: 'C.H. Robinson Worldwide',
    discrepancies: [],
    extractedData: {
      loadNumber: 'CHR-982301',
      lumperAmount: 285.00,
      deliveryLocation: 'CapStone Logistics @ Dallas Metro',
      deliveryDate: '2026-09-29',
      notes: 'Unloading 22 pallets, sorting & segregating fee paid via EFS check #99214.',
      rawOcrHighlights: [
        { field: 'Merchant', text: 'CapStone Logistics Unloading Services', confidence: 97, box: { x: 12, y: 10, width: 75, height: 8 } },
        { field: 'Total Amount', text: '$285.00', confidence: 99, box: { x: 60, y: 65, width: 30, height: 8 } },
        { field: 'Payment Ref', text: 'EFS Auth #99214', confidence: 94, box: { x: 15, y: 78, width: 40, height: 6 } }
      ]
    }
  },
  {
    id: 'doc-bol-8843',
    fileName: 'BOL_Scan_Load8843_EchoLogistics.pdf',
    fileSize: '3.1 MB',
    type: 'BOL',
    scannedAt: '2026-09-30 15:02',
    localPath: 'C:\\FreightOps\\Incoming\\Scans\\BOL_Scan_Load8843_EchoLogistics.pdf',
    thumbnailColor: 'from-emerald-950/40 to-slate-900',
    ocrConfidence: 94,
    status: 'matched',
    matchedProjectId: 'prj-2',
    matchedCustomer: 'Echo Global Logistics',
    discrepancies: [],
    extractedData: {
      loadNumber: 'EGL-77190',
      bolNumber: 'BOL-88201A',
      brokerCustomer: 'Echo Global Logistics',
      carrierName: 'GREEN EXPRESS LLC',
      driverName: 'Dave Cooper',
      pickupLocation: 'Atlanta Distribution, GA',
      deliveryLocation: 'Orlando Cold Storage, FL',
      pickupDate: '2026-09-28',
      deliveryDate: '2026-09-30',
      weightLbs: 38400,
      consigneeSignature: true,
      notes: 'Delivered intact, temp logged at -10°F throughout transport.',
      rawOcrHighlights: [
        { field: 'BOL Number', text: 'BOL-88201A', confidence: 98, box: { x: 70, y: 12, width: 25, height: 6 } },
        { field: 'Weight', text: '38,400 LBS', confidence: 95, box: { x: 65, y: 58, width: 28, height: 5 } }
      ]
    }
  },
  {
    id: 'doc-rate-8843',
    fileName: 'RateCon_Echo_Load77190.pdf',
    fileSize: '950 KB',
    type: 'RateConfirmation',
    scannedAt: '2026-09-30 15:02',
    localPath: 'C:\\FreightOps\\Incoming\\Scans\\RateCon_Echo_Load77190.pdf',
    thumbnailColor: 'from-cyan-950/40 to-slate-900',
    ocrConfidence: 97,
    status: 'matched',
    matchedProjectId: 'prj-2',
    matchedCustomer: 'Echo Global Logistics',
    discrepancies: [],
    extractedData: {
      loadNumber: 'EGL-77190',
      brokerCustomer: 'Echo Global Logistics',
      rateAmount: 2200.00,
      fuelSurcharge: 280.00,
      detentionHours: 2,
      detentionAmount: 150.00,
      pickupDate: '2026-09-28',
      deliveryDate: '2026-09-30',
      notes: 'Detention approved after 2h dwell at shipper ($75/hr x 2h = $150).',
      rawOcrHighlights: [
        { field: 'Linehaul', text: '$2,200.00', confidence: 98, box: { x: 70, y: 45, width: 25, height: 5 } },
        { field: 'Fuel', text: '$280.00', confidence: 96, box: { x: 70, y: 52, width: 25, height: 5 } }
      ]
    }
  }
];

export const INITIAL_PROPOSED_INVOICES: ProposedInvoice[] = [
  {
    id: 'inv-8842',
    invoiceNumber: 'INV-2026-089',
    projectId: 'prj-1',
    loadNumber: 'CHR-982301',
    customerName: 'C.H. Robinson Worldwide',
    customerEmail: 'ap-freight@chrobinson.com',
    billingAddress: '14701 Charlson Road, Eden Prairie, MN 55347',
    paymentTerms: 'Net 30 Days',
    issueDate: '2026-09-30',
    dueDate: '2026-10-30',
    status: 'needs_review',
    factoringStatus: 'unassigned',
    lineItems: [
      {
        id: 'li-1',
        description: 'Linehaul Freight (Chicago, IL -> Dallas, TX)',
        type: 'linehaul',
        amount: 3450.00,
        sourceDoc: 'RateConfirmation',
        rateConfirmedAmount: 3450.00,
      },
      {
        id: 'li-2',
        description: 'Agreed Fuel Surcharge (FSC)',
        type: 'fuel_surcharge',
        amount: 420.00,
        sourceDoc: 'RateConfirmation',
        rateConfirmedAmount: 420.00,
      },
      {
        id: 'li-3',
        description: 'Lumper Unloading Fee Pass-Through (CapStone Dallas)',
        type: 'lumper_reimbursement',
        amount: 285.00,
        sourceDoc: 'LumperReceipt',
        rateConfirmedAmount: 285.00,
        notes: 'Attached proof slip EFS #99214',
      },
    ],
    subtotal: 4155.00,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 4155.00,
    amountPaid: 0,
    balanceDue: 4155.00,
    attachedDocIds: ['doc-bol-8842', 'doc-rate-8842', 'doc-lumper-8842'],
    approvalNotes: 'BOL signed with clear receiver stamp. Lumper receipt matched and verified.',
    correctionsLog: []
  },
  {
    id: 'inv-8843',
    invoiceNumber: 'INV-2026-090',
    projectId: 'prj-2',
    loadNumber: 'EGL-77190',
    customerName: 'Echo Global Logistics',
    customerEmail: 'invoicing@echo.com',
    billingAddress: '600 W Chicago Ave #725, Chicago, IL 60654',
    paymentTerms: 'QuickPay (2% 10 / Net 30)',
    issueDate: '2026-09-30',
    dueDate: '2026-10-10',
    status: 'ready_to_send',
    factoringStatus: 'submitted',
    factoringBatchNumber: 'TRIUMPH-BATCH-9941',
    lineItems: [
      {
        id: 'li-4',
        description: 'Linehaul Freight (Atlanta, GA -> Orlando, FL)',
        type: 'linehaul',
        amount: 2200.00,
        sourceDoc: 'RateConfirmation',
      },
      {
        id: 'li-5',
        description: 'Fuel Surcharge (FSC)',
        type: 'fuel_surcharge',
        amount: 280.00,
        sourceDoc: 'RateConfirmation',
      },
      {
        id: 'li-6',
        description: 'Approved Detention (2 hrs @ Shipper Facility)',
        type: 'detention',
        amount: 150.00,
        sourceDoc: 'RateConfirmation',
      }
    ],
    subtotal: 2630.00,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 2630.00,
    amountPaid: 0,
    balanceDue: 2630.00,
    attachedDocIds: ['doc-bol-8843', 'doc-rate-8843'],
    approvalNotes: 'Ready for billing email approval packet generation.',
    reviewedBy: 'Authorized Billing Lead',
    reviewedAt: '2026-09-30 15:20',
    correctionsLog: []
  }
];

export const INITIAL_BILLING_EMAILS: BillingEmail[] = [
  {
    id: 'email-8843',
    invoiceId: 'inv-8843',
    invoiceNumber: 'INV-2026-090',
    recipientEmail: 'invoicing@echo.com',
    recipientName: 'Echo Global Accounts Payable',
    ccEmails: ['dispatch@greenexpressllc.com'],
    subject: 'GREEN EXPRESS LLC Billing Packet: Invoice INV-2026-090 (Load #EGL-77190)',
    bodyText: `Dear Echo Global Logistics Accounts Payable Team,\n\nPlease find attached our complete billing packet for Load #EGL-77190 delivered to Orlando Cold Storage on 09/30/2026.\n\nSummary of Charges:\n- Invoice #: INV-2026-090\n- Load Reference: EGL-77190 / BOL #BOL-88201A\n- Linehaul & Fuel: $2,480.00\n- Approved Detention: $150.00\n- Total Amount Due: $2,630.00\n\nAttached packet includes:\n1. GREEN EXPRESS LLC Official Invoice INV-2026-090\n2. Signed & Timed Bill of Lading (BOL)\n3. Signed Rate Confirmation\n\nThank you,\nGREEN EXPRESS LLC\nFreight Billing Operations`,
    attachedDocsSummary: [
      { title: 'Invoice_INV-2026-090.pdf', type: 'System Generated Invoice', fileSize: '185 KB', verified: true },
      { title: 'BOL_Scan_Load8843_EchoLogistics.pdf', type: 'Signed Bill of Lading', fileSize: '3.1 MB', verified: true },
      { title: 'RateCon_Echo_Load77190.pdf', type: 'Rate Confirmation', fileSize: '950 KB', verified: true }
    ],
    status: 'pending_approval',
    localPacketHash: 'sha256-e9c8b321fa44c9802d7e'
  }
];

export const INITIAL_PAYMENT_REMITTANCES: PaymentRemittance[] = [
  {
    id: 'remit-101',
    documentNumber: 'ACH-REMIT-20260930-CHR',
    remittanceDocName: 'CHR_ACH_Remittance_Advice_093026.pdf',
    payerName: 'C.H. Robinson Worldwide',
    paymentMethod: 'ACH_DIRECT',
    checkOrReferenceNumber: 'ACH-8891042-CHR',
    paymentDate: '2026-09-30',
    totalPaymentAmount: 4155.00,
    unallocatedAmount: 0.00,
    status: 'proposed_match',
    matchedInvoices: [
      {
        invoiceId: 'inv-8842',
        invoiceNumber: 'INV-2026-089',
        loadNumber: 'CHR-982301',
        originalBilled: 4155.00,
        amountToApply: 4155.00,
        deductionOrShortPay: 0.00,
        matchConfidence: 100,
        confirmedReceipt: false,
        notes: 'Exact match on CHR-982301 including $285 lumper reimbursement.',
      }
    ]
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-1',
    code: 'PRJ-106',
    loadNumber: 'GE-982301',
    customerName: 'C.H. Robinson Worldwide',
    customerCode: 'CHRW',
    originCity: 'Fort Worth',
    originState: 'TX',
    originAddress: '1400 Meacham Blvd, Fort Worth, TX 76106',
    destCity: 'Chicago',
    destState: 'IL',
    destAddress: '4400 S Western Blvd, Chicago, IL 60608',
    status: 'paperwork_scanned',
    driverName: 'Lead Driver (Unit 106)',
    driverPhone: '(817) 592-1060',
    truckId: 'Unit #106 (Freightliner Classic · VIN-YLB94884)',
    trailerId: 'TLR-54211',
    pickupDate: '2026-09-27',
    deliveryDate: '2026-09-29',
    estimatedRevenue: 4155.00,
    linehaulPay: 3650.00,
    fuelSurcharge: 505.00,
    equipmentType: '53ft Dry Van',
    commodities: 'Commercial Freight & Dry Goods',
    weightLbs: 43500,
    documentsCount: 3,
    associatedInvoiceId: 'inv-8842',
    activeCollaboratorIds: ['user-1'],
    lastUpdated: '2 mins ago',
    trackingUrl: 'https://track.greenexpressllc.com/ld/982301',
    telemetry: {
      lat: 32.5785,
      lng: -97.3606,
      speedMph: 0,
      headingDeg: 180,
      fuelLevelPct: 88,
      reeferTempF: 34,
      currentLocationName: 'Crowley, TX Yard (TruckX ELD Active)',
      lastPingTime: '1 min ago',
      geofenceState: 'Terminal Yard',
      dwellMinutes: 20,
    },
    tripStops: [
      {
        id: 'stop-1',
        stopSequence: 1,
        type: 'pickup',
        facilityName: 'Fort Worth Distribution Center',
        address: '1400 Meacham Blvd',
        city: 'Fort Worth',
        state: 'TX',
        appointmentTime: '2026-09-27 08:00',
        completed: true,
        completedAt: '2026-09-27 08:45',
        podUploaded: true,
        dwellHours: 1.0,
        detentionAlert: false
      },
      {
        id: 'stop-2',
        stopSequence: 2,
        type: 'delivery',
        facilityName: 'Chicago Logistics Terminal',
        address: '4400 S Western Blvd',
        city: 'Chicago',
        state: 'IL',
        appointmentTime: '2026-09-29 10:00',
        completed: true,
        completedAt: '2026-09-29 11:30',
        podUploaded: true,
        receiverSignatureName: 'J. Davis (Receiver)',
        dwellHours: 1.5,
        detentionAlert: false
      }
    ],
    tasks: [
      { id: 't-1', title: 'Confirm delivery receiver stamp on BOL', completed: true, assignee: 'Unit 106 Driver', dueDate: '2026-09-29' },
      { id: 't-2', title: 'Verify TruckX ELD duty status and log certification', completed: true, assignee: 'Safety Officer', dueDate: '2026-09-29' },
      { id: 't-3', title: 'Gemini Omni Agent: Run automated invoice audit', completed: true, assignee: 'Gemini AI', dueDate: '2026-09-30' },
      { id: 't-4', title: 'Approve & submit billing email packet to broker AP', completed: false, assignee: 'Dispatch', dueDate: '2026-09-30' },
    ],
    comments: [
      {
        id: 'c-1',
        userId: 'user-1',
        userName: 'Operations Lead',
        userRole: 'Dispatch & Billing',
        avatarBg: 'bg-orange-600',
        text: 'Green Express LLC Unit #106 delivered load GE-982301. Receiver stamp verified. Carrier invoice ready.',
        timestamp: 'Today, 2:18 PM',
      }
    ]
  },
  {
    id: 'prj-2',
    code: 'PRJ-102',
    loadNumber: 'GE-77190',
    customerName: 'Echo Global Logistics',
    customerCode: 'ECHO',
    originCity: 'Dallas',
    originState: 'TX',
    destCity: 'Atlanta',
    destState: 'GA',
    status: 'in_transit',
    driverName: 'Driver #102',
    driverPhone: '(817) 592-1020',
    truckId: 'Unit #102 (Peterbilt 389)',
    trailerId: 'TLR-54202',
    pickupDate: '2026-09-28',
    deliveryDate: '2026-09-30',
    estimatedRevenue: 2950.00,
    linehaulPay: 2550.00,
    fuelSurcharge: 400.00,
    equipmentType: '53ft Dry Van',
    commodities: 'Packaged Retail Freight',
    weightLbs: 39500,
    documentsCount: 2,
    associatedInvoiceId: 'inv-8843',
    activeCollaboratorIds: ['user-1'],
    lastUpdated: '14 mins ago',
    trackingUrl: 'https://track.greenexpressllc.com/ld/77190',
    telemetry: {
      lat: 32.3512,
      lng: -90.1848,
      speedMph: 65,
      headingDeg: 85,
      fuelLevelPct: 76,
      reeferTempF: 34,
      currentLocationName: 'I-20 East near Jackson, MS (TruckX ELD Active)',
      lastPingTime: '30s ago',
      geofenceState: 'En Route',
      dwellMinutes: 0,
    },
    tripStops: [
      {
        id: 'stop-3',
        stopSequence: 1,
        type: 'pickup',
        facilityName: 'Dallas Logistics Hub',
        address: '2200 Intermodal Pkwy',
        city: 'Dallas',
        state: 'TX',
        appointmentTime: '2026-09-28 09:00',
        completed: true,
        completedAt: '2026-09-28 09:45',
        podUploaded: true,
        dwellHours: 0.8,
        detentionAlert: false
      },
      {
        id: 'stop-4',
        stopSequence: 2,
        type: 'delivery',
        facilityName: 'Atlanta Freight Depot',
        address: '500 Fulton Industrial Blvd',
        city: 'Atlanta',
        state: 'GA',
        appointmentTime: '2026-09-30 14:00',
        completed: false,
        podUploaded: false,
        dwellHours: 0,
        detentionAlert: false
      }
    ],
    tasks: [
      { id: 't-5', title: 'Monitor ELD 11h driving clock', completed: true, assignee: 'Driver 102', dueDate: '2026-09-30' }
    ],
    comments: []
  }
];

export const MIGRATION_MYINVOICE_SAMPLE = {
  softwareName: 'MyInvoice Desktop Edition v11.4',
  companyName: 'GREEN EXPRESS LLC',
  exportDate: '2026-09-30T10:00:00Z',
  totalCustomers: 18,
  totalHistoricalInvoices: 142,
  totalOutstandingReceivables: 10275.00,
  customers: [
    { id: 'CUST-01', name: 'C.H. Robinson Worldwide', defaultTerms: 'Net 30', email: 'ap-freight@chrobinson.com', totalBilled: 124500.00 },
    { id: 'CUST-02', name: 'Echo Global Logistics', defaultTerms: 'QuickPay 2% 10', email: 'invoicing@echo.com', totalBilled: 86400.00 },
    { id: 'CUST-03', name: 'Landstar Ranger Inc.', defaultTerms: 'Net 30', email: 'accountspayable@landstar.com', totalBilled: 94100.00 }
  ],
  legacyInvoices: [
    { invoiceNo: 'INV-2026-081', customer: 'Total Quality Logistics', date: '2026-09-02', amount: 3850.00, status: 'Paid', loadNo: 'TQL-81920' },
    { invoiceNo: 'INV-2026-088', customer: 'Landstar Ranger Inc.', date: '2026-09-24', amount: 3490.00, status: 'Pending Payment', loadNo: 'LND-449102' },
  ]
};
