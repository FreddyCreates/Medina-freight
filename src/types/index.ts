export type ProjectStatus = 
  | 'booked' 
  | 'in_transit' 
  | 'delivered' 
  | 'paperwork_scanned' 
  | 'invoiced' 
  | 'paid';

export interface CompanyProfile {
  companyName: string;
  dbaName?: string;
  dotNumber: string;
  mcNumber: string;
  taxId?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  factoringCompanyName: string;
  factoringRemitAddress: string;
  factoringBankName: string;
  factoringRoutingNumber: string;
  factoringAccountNumber: string;
  factoringNoticeOfAssignment?: string;
  defaultPaymentTerms: string;
  defaultRatePerMileFloor: number;
}

export interface FleetDriver {
  id: string;
  name: string;
  phone: string;
  email: string;
  cdlNumber: string;
  cdlState: string;
  truckNumber: string;
  trailerNumber: string;
  assignedTruckNumber?: string;
  assignedTrailerNumber?: string;
  equipmentType: '53ft Reefer' | '53ft Dry Van' | 'Flatbed' | 'Stepdeck';
  status: 'available' | 'dispatched' | 'driving' | 'on_break' | 'off_duty';
  currentLocation: string;
  hOSRemainingHours: number;
  medicalCardExpiry: string;
  hireDate: string;
}

export interface FreightEstimate {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  originCity: string;
  originState: string;
  originZip?: string;
  destCity: string;
  destState: string;
  destZip?: string;
  equipmentType: '53ft Dry Van' | '53ft Reefer' | 'Flatbed' | 'Stepdeck' | 'Power Only';
  loadedMiles: number;
  deadheadMiles: number;
  ratePerMile: number;
  linehaulTotal: number;
  fuelSurchargePerMile: number;
  fuelSurchargeTotal: number;
  accessorials: Array<{ id: string; name: string; amount: number }>;
  totalQuoteAmount: number;
  targetMarginPct: number;
  estimatedDriverPay: number;
  estimatedNetProfit: number;
  pickupDate: string;
  deliveryDate: string;
  commodity: string;
  weightLbs: number;
  specialInstructions: string;
  status: 'draft' | 'sent_to_customer' | 'accepted' | 'declined' | 'converted_to_load';
  notes: string;
  createdAt: string;
  expiresAt: string;
}

export type DocumentType = 
  | 'BOL' 
  | 'RateConfirmation' 
  | 'LumperReceipt' 
  | 'WeightTicket' 
  | 'RemittanceAdvice';

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  avatarBg: string;
  status: 'active' | 'idle' | 'in_review';
  currentViewing?: string;
  cursorPos?: { x: number; y: number };
}

export interface ExtractedDocData {
  loadNumber?: string;
  bolNumber?: string;
  brokerCustomer?: string;
  carrierName?: string;
  driverName?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  pickupDate?: string;
  deliveryDate?: string;
  weightLbs?: number;
  rateAmount?: number;
  fuelSurcharge?: number;
  lumperAmount?: number;
  detentionHours?: number;
  detentionAmount?: number;
  consigneeSignature?: boolean;
  notes?: string;
  rawOcrHighlights?: Array<{
    field: string;
    text: string;
    confidence: number;
    box: { x: number; y: number; width: number; height: number };
  }>;
}

export interface ScannedDocument {
  id: string;
  fileName: string;
  fileSize: string;
  type: DocumentType;
  scannedAt: string;
  localPath: string;
  thumbnailColor: string;
  previewUrl?: string;
  ocrConfidence: number; // 0 to 100
  status: 'pending_match' | 'matched' | 'discrepancy' | 'verified';
  matchedProjectId?: string;
  matchedCustomer?: string;
  extractedData: ExtractedDocData;
  discrepancies: string[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  type: 'linehaul' | 'fuel_surcharge' | 'lumper_reimbursement' | 'detention' | 'stop_off' | 'other';
  amount: number;
  sourceDoc: 'RateConfirmation' | 'LumperReceipt' | 'BOL' | 'Manual';
  rateConfirmedAmount?: number;
  notes?: string;
}

export interface ProposedInvoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  loadNumber: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  paymentTerms: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'draft' | 'needs_review' | 'pre_approval' | 'final_approval' | 'ready_to_send' | 'sent' | 'partially_paid' | 'paid' | 'reconciled' | 'void';
  attachedDocIds: string[];
  approvalNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  factoringBatchNumber?: string;
  factoringStatus?: 'unassigned' | 'submitted' | 'funded' | 'direct_billed';
  correctionsLog: Array<{
    field: string;
    oldValue: string | number;
    newValue: string | number;
    correctedBy: string;
    timestamp: string;
    reason?: string;
  }>;
}

export interface BillingEmail {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  recipientEmail: string;
  recipientName: string;
  ccEmails: string[];
  subject: string;
  bodyText: string;
  attachedDocsSummary: Array<{
    title: string;
    type: string;
    fileSize: string;
    verified: boolean;
  }>;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent';
  scheduledSend?: string;
  sentAt?: string;
  localPacketHash: string;
}

export interface MatchedPaymentInvoice {
  invoiceId: string;
  invoiceNumber: string;
  loadNumber: string;
  originalBilled: number;
  amountToApply: number;
  deductionOrShortPay: number;
  deductionReason?: string;
  matchConfidence: number;
  confirmedReceipt: boolean;
  notes?: string;
}

export interface PaymentRemittance {
  id: string;
  documentNumber: string;
  remittanceDocName: string;
  payerName: string;
  paymentMethod: 'ACH_DIRECT' | 'CHECK' | 'WIRE' | 'EFT';
  checkOrReferenceNumber: string;
  paymentDate: string;
  totalPaymentAmount: number;
  unallocatedAmount: number;
  matchedInvoices: MatchedPaymentInvoice[];
  status: 'imported' | 'proposed_match' | 'confirmed' | 'reconciled';
  processedBy?: string;
  processedAt?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  assignee: string;
  dueDate: string;
}

export interface ProjectComment {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  avatarBg: string;
  text: string;
  timestamp: string;
}

export interface TelemetryData {
  lat: number;
  lng: number;
  speedMph: number;
  headingDeg: number;
  reeferTempF: number;
  fuelLevelPct: number;
  currentLocationName: string;
  lastPingTime: string;
  geofenceState: 'Inside Shipper' | 'En Route' | 'Inside Receiver' | 'Detention Over 2h' | 'Terminal Yard';
  dwellMinutes: number;
}

export interface DriverTripStop {
  id: string;
  stopSequence: number;
  type: 'pickup' | 'delivery';
  facilityName: string;
  address: string;
  city: string;
  state: string;
  appointmentTime: string;
  completed: boolean;
  completedAt?: string;
  podUploaded: boolean;
  receiverSignatureName?: string;
  dwellHours: number;
  detentionAlert: boolean;
}

export interface Project {
  id: string;
  code: string;
  loadNumber: string;
  customerName: string;
  customerCode: string;
  originCity: string;
  originState: string;
  originAddress?: string;
  destCity: string;
  destState: string;
  destAddress?: string;
  status: ProjectStatus;
  driverName: string;
  driverPhone: string;
  truckId: string;
  trailerId: string;
  pickupDate: string;
  deliveryDate: string;
  estimatedRevenue: number;
  linehaulPay: number;
  fuelSurcharge: number;
  equipmentType: '53ft Dry Van' | '53ft Reefer' | 'Flatbed' | 'Stepdeck';
  commodities: string;
  commodity?: string;
  weightLbs: number;
  documentsCount: number;
  associatedInvoiceId?: string;
  telemetry: TelemetryData;
  tripStops: DriverTripStop[];
  tasks: ProjectTask[];
  comments: ProjectComment[];
  activeCollaboratorIds: string[];
  lastUpdated: string;
  detentionClaimAmount?: number;
  trackingUrl?: string;
  googleCalendarPickupEventId?: string;
  googleCalendarPickupLink?: string;
  googleCalendarDeliveryEventId?: string;
  googleCalendarDeliveryLink?: string;
  lastCalendarSyncedAt?: string;
}

export interface WindowsWatcherConfig {
  incomingFolderPath: string;
  remittancesFolderPath: string;
  archiveFolderPath: string;
  autoWatchEnabled: boolean;
  pollIntervalSeconds: number;
  localEncryption: boolean;
  lastScannedTime: string;
  detectedFilesCount: number;
  myInvoiceExecutableFound: boolean;
  myInvoiceDataPath: string;
}

// -------------------------------------------------------------------
// Alvys Foundry AI Agent Models
// -------------------------------------------------------------------

export interface AgentWorkflowNode {
  id: string;
  type: 'trigger' | 'ocr_extract' | 'rule_engine' | 'approval_gate' | 'tms_action' | 'notification';
  title: string;
  description: string;
  config: Record<string, any>;
  status: 'active' | 'waiting' | 'completed' | 'failed';
}

export interface FoundryAgent {
  id: string;
  name: string;
  slug: string;
  category: 'load_building' | 'document_intake' | 'detention' | 'track_trace' | 'invoicing' | 'compliance' | 'pricing';
  tagline: string;
  description: string;
  status: 'active' | 'paused' | 'running';
  iconName: string;
  triggerEvent: string;
  totalRunsCount: number;
  hoursSavedTotal: number;
  accuracyRatePct: number;
  requiresHumanApproval: boolean;
  systemPrompt: string;
  workflowNodes: AgentWorkflowNode[];
  lastRunAt: string;
  recentOutputSnippet: string;
}

export interface AgentExecutionLog {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  loadNumber?: string;
  triggerEvent: string;
  inputSummary: string;
  outputSummary: string;
  executionTimeMs: number;
  status: 'success' | 'needs_human_review' | 'error';
  confidenceScore: number;
  humanApprovedBy?: string;
  payloadDiff?: Record<string, any>;
}

export interface IntegrationService {
  id: string;
  name: string;
  category: 'Load Boards' | 'ELD Telematics' | 'Accounting & Factoring' | 'Compliance & Safety' | 'EDI Gateway';
  description: string;
  iconName: string;
  connected: boolean;
  syncStatus: 'synced' | 'syncing' | 'idle' | 'error';
  lastSync: string;
  recordsCount: number;
}

// -------------------------------------------------------------------
// Carrier Compliance & FMCSA Safety Models
// -------------------------------------------------------------------

export interface InsurancePolicy {
  id: string;
  type: 'AutoLiability' | 'Cargo' | 'ReeferBreakdown' | 'GeneralLiability' | 'WorkersComp';
  provider: string;
  policyNumber: string;
  coverageAmount: number;
  effectiveDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'valid' | 'expiring_soon' | 'expired';
  underwriterPhone?: string;
  certificateUrl?: string;
  verifiedBy?: string;
  naicCompanyNumber?: string;
}

export interface SafetyRatingInfo {
  fmcsaSafetyRating: 'Satisfactory' | 'Conditional' | 'Unsatisfactory' | 'Not Rated';
  fmcsaAuditDate: string;
  operatingAuthority: {
    common: boolean;
    contract: boolean;
    broker: boolean;
    status: 'ACTIVE' | 'REVOKED' | 'INACTIVE';
  };
  basicsScores: {
    unsafeDrivingPercentile: number; // 0-100 (lower is better)
    hosCompliancePercentile: number;
    driverFitnessPercentile: number;
    controlledSubstancesPercentile: number;
    vehicleMaintPercentile: number;
  };
  outOfServiceRates: {
    vehicleOosPct: number;
    vehicleNatAvgPct: number;
    driverOosPct: number;
    driverNatAvgPct: number;
  };
  inspectionsTotal24Mo: number;
  crashesTotal24Mo: number;
  fatalCrashes: number;
  injuryCrashes: number;
  towawayCrashes: number;
  lastFmcsaApiSync: string;
  fmcsaRegistryStatus: 'AUTHORIZED' | 'PENDING' | 'NOT_AUTHORIZED';
}

export interface CarrierDocument {
  id: string;
  name: string;
  type: 'COI' | 'W9' | 'BrokerCarrierAgreement' | 'NoticeOfAssignment' | 'VoidedCheck' | 'SCACCertificate';
  uploadedAt: string;
  expiresAt?: string;
  status: 'verified' | 'pending_review' | 'rejected' | 'expired';
  fileSize: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface CarrierComplianceRecord {
  id: string;
  legalName: string;
  dbaName?: string;
  dotNumber: string;
  mcNumber: string;
  complianceStatus: 'approved' | 'needs_attention' | 'expired' | 'suspended' | 'pending_onboarding';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  safetyRating: SafetyRatingInfo;
  insurancePolicies: InsurancePolicy[];
  documents: CarrierDocument[];
  equipmentCount: {
    tractors: number;
    trailers: number;
    drivers: number;
  };
  riskScore: number; // 0-100 (0-20 = Excellent, 21-50 = Moderate, >50 = High Risk)
  fraudCheck: {
    doubleBrokeringRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    chameleonCarrierRisk: 'NONE' | 'FLAGGED';
    physicalAddressType: 'Commercial Freight Yard' | 'Residential' | 'Virtual Office PO Box';
    phoneCarrierType: 'Landline / Business VoIP' | 'Prepaid Cell';
  };
  coiExpiryWarningCount: number;
  notes: string;
  onboardingDate: string;
}
