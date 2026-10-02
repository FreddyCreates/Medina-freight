import { Project, ProposedInvoice } from '../types';

export interface AutoPilotConfig {
  enabled: boolean;
  scanIntervalSec: number;
  minRatePerMile: number;
  minGrossPay: number;
  equipmentFilter: ('53ft Dry Van' | '53ft Reefer' | 'Flatbed' | 'Stepdeck')[];
  autoCreateLoad: boolean;
  autoDraftInvoice: boolean;
  autoSyncGoogleCalendar: boolean;
  autoSaveGoogleDrive: boolean;
  autoBookConfidenceThreshold: number; // 0 - 100
}

export interface AutoPilotDetectedLoad {
  id: string;
  source: 'DAT One' | 'Truckstop.com' | 'Gmail Inbox' | 'C.H. Robinson API' | 'EDI 204 Feed';
  sourceId: string;
  broker: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  origin: string;
  destination: string;
  distanceMiles: number;
  rate: number;
  ratePerMile: number;
  equipmentType: '53ft Dry Van' | '53ft Reefer' | 'Flatbed' | 'Stepdeck';
  commodity: string;
  pickupWindow: string;
  deliveryWindow: string;
  confidenceScore: number;
  status: 'auto_booked' | 'under_review' | 'rejected_low_rpm' | 'evaluating';
  aiReasoning: string;
  timestamp: string;
  rawSnippet?: string;
}

export const DEFAULT_AUTOPILOT_CONFIG: AutoPilotConfig = {
  enabled: true,
  scanIntervalSec: 8,
  minRatePerMile: 2.75,
  minGrossPay: 1800,
  equipmentFilter: ['53ft Reefer', '53ft Dry Van'],
  autoCreateLoad: true,
  autoDraftInvoice: true,
  autoSyncGoogleCalendar: true,
  autoSaveGoogleDrive: true,
  autoBookConfidenceThreshold: 90
};

// Continuous pool of realistic high-yield freight tenders
const TENDER_CANDIDATES: Omit<AutoPilotDetectedLoad, 'id' | 'timestamp'>[] = [
  {
    source: 'Gmail Inbox',
    sourceId: 'GM-99120',
    broker: 'C.H. Robinson Logistics',
    originCity: 'Joliet',
    originState: 'IL',
    destCity: 'Arlington',
    destState: 'TX',
    origin: 'Joliet, IL (Intermodal Depot)',
    destination: 'Arlington, TX (Distribution Center)',
    distanceMiles: 920,
    rate: 3200,
    ratePerMile: 3.48,
    equipmentType: '53ft Reefer',
    commodity: 'Refrigerated Dairy & Deli Foods',
    pickupWindow: 'Tomorrow, 07:00 - 11:00 CT',
    deliveryWindow: 'In 2 days, 06:00 CT',
    confidenceScore: 98,
    status: 'auto_booked',
    aiReasoning: 'Rate per mile ($3.48/mi) exceeds threshold ($2.75/mi) by +26.5%. Preferred Tier-1 broker with 100% on-time payment track record.',
    rawSnippet: 'URGENT TENDER: Dedicated temp-controlled capacity required. 34F Continuous. Quick-Pay enabled.'
  },
  {
    source: 'DAT One',
    sourceId: 'DAT-88301',
    broker: 'Total Quality Logistics (TQL)',
    originCity: 'Kenosha',
    originState: 'WI',
    destCity: 'Nashville',
    destState: 'TN',
    origin: 'Kenosha, WI (Industrial Park)',
    destination: 'Nashville, TN (Fulfillment Hub)',
    distanceMiles: 540,
    rate: 1950,
    ratePerMile: 3.61,
    equipmentType: '53ft Dry Van',
    commodity: 'Commercial Packaging Materials',
    pickupWindow: 'Tomorrow, 14:00 CT',
    deliveryWindow: 'Next day, 08:00 CT',
    confidenceScore: 95,
    status: 'auto_booked',
    aiReasoning: 'Strong lane velocity with excellent backhaul opportunities in Nashville freight basin. High RPM of $3.61.',
    rawSnippet: 'Clean dry freight, no touch, pallets shrink-wrapped. Ready at dock.'
  },
  {
    source: 'Truckstop.com',
    sourceId: 'TS-55419',
    broker: 'Echo Global Logistics',
    originCity: 'Indianapolis',
    originState: 'IN',
    destCity: 'Atlanta',
    destState: 'GA',
    origin: 'Indianapolis, IN (Depot #2)',
    destination: 'Atlanta, GA (Metro DC)',
    distanceMiles: 535,
    rate: 1820,
    ratePerMile: 3.40,
    equipmentType: '53ft Dry Van',
    commodity: 'Retail Consumer Electronics',
    pickupWindow: 'Today, 18:00 EST',
    deliveryWindow: 'Tomorrow, 12:00 EST',
    confidenceScore: 92,
    status: 'auto_booked',
    aiReasoning: 'Fast-turn overnight lane. Verified clean credit score 98 from Echo Global Logistics.',
    rawSnippet: 'High-value sealed load. GPS tracking required. Standard 2 hr loading.'
  },
  {
    source: 'Gmail Inbox',
    sourceId: 'GM-44012',
    broker: 'Landstar Ranger Brokerage',
    originCity: 'Grand Rapids',
    originState: 'MI',
    destCity: 'Dallas',
    destState: 'TX',
    origin: 'Grand Rapids, MI (Cold Storage)',
    destination: 'Dallas, TX (Logistics Center)',
    distanceMiles: 1040,
    rate: 3450,
    ratePerMile: 3.31,
    equipmentType: '53ft Reefer',
    commodity: 'Pharmaceuticals & Health Supplies',
    pickupWindow: 'In 2 days, 08:00 EST',
    deliveryWindow: 'In 3 days, 16:00 CST',
    confidenceScore: 96,
    status: 'auto_booked',
    aiReasoning: 'High-paying pharmaceutical freight. Strict temp range 68-75F ambient with pre-trip inspection verified.',
    rawSnippet: 'Dedicated pharmaceutical reefer run. Automated payment on digital POD receipt.'
  },
  {
    source: 'C.H. Robinson API',
    sourceId: 'CHR-33109',
    broker: 'Coyote Logistics (UPS Company)',
    originCity: 'Gary',
    originState: 'IN',
    destCity: 'Memphis',
    destState: 'TN',
    origin: 'Gary, IN (Steel Yard)',
    destination: 'Memphis, TN (Crossdock)',
    distanceMiles: 490,
    rate: 1650,
    ratePerMile: 3.36,
    equipmentType: '53ft Dry Van',
    commodity: 'Automotive Replacement Parts',
    pickupWindow: 'Tomorrow, 10:00 CT',
    deliveryWindow: 'Tomorrow, 22:00 CT',
    confidenceScore: 91,
    status: 'auto_booked',
    aiReasoning: 'High density freight, zero detention risk history for this shipper facility.',
    rawSnippet: 'Palletized auto parts. Straight-through run with guaranteed dock door upon arrival.'
  },
  {
    source: 'DAT One',
    sourceId: 'DAT-11928',
    broker: 'Arrive Logistics',
    originCity: 'Rockford',
    originState: 'IL',
    destCity: 'Denver',
    destState: 'CO',
    origin: 'Rockford, IL',
    destination: 'Denver, CO',
    distanceMiles: 1010,
    rate: 2200,
    ratePerMile: 2.17,
    equipmentType: '53ft Dry Van',
    commodity: 'General Commodities',
    pickupWindow: 'In 3 days',
    deliveryWindow: 'In 5 days',
    confidenceScore: 62,
    status: 'rejected_low_rpm',
    aiReasoning: 'Rate per mile ($2.17/mi) below Auto-Pilot minimum threshold ($2.75/mi). Automatically bypassed to protect fleet margins.',
    rawSnippet: 'Standard load. Low spot rate.'
  }
];

export function getNextAutoPilotCandidate(
  config: AutoPilotConfig,
  indexCounter: number
): { load: AutoPilotDetectedLoad; convertedProject?: Project; convertedInvoice?: ProposedInvoice } {
  const template = TENDER_CANDIDATES[indexCounter % TENDER_CANDIDATES.length];
  const uniqueSuffix = Math.floor(100 + Math.random() * 900);
  const loadId = `ap-load-${Date.now()}-${uniqueSuffix}`;
  const now = new Date();

  // Evaluate candidate against active config
  const isAboveRpm = template.ratePerMile >= config.minRatePerMile;
  const isAboveGross = template.rate >= config.minGrossPay;
  const isEquipmentMatch = config.equipmentFilter.includes(template.equipmentType);
  const isHighConfidence = template.confidenceScore >= config.autoBookConfidenceThreshold;

  let status: 'auto_booked' | 'under_review' | 'rejected_low_rpm' = 'auto_booked';
  if (!isAboveRpm) {
    status = 'rejected_low_rpm';
  } else if (!isEquipmentMatch || !isHighConfidence || !isAboveGross) {
    status = 'under_review';
  }

  const detectedLoad: AutoPilotDetectedLoad = {
    ...template,
    id: loadId,
    sourceId: `${template.sourceId}-${uniqueSuffix}`,
    status,
    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  if (status === 'auto_booked' && config.autoCreateLoad) {
    const projectCode = `PRJ-${Math.floor(1050 + Math.random() * 8900)}`;
    const linehaul = Math.round(template.rate * 0.9);
    const fuel = template.rate - linehaul;
    const loadNum = `${template.broker.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const convertedProject: Project = {
      id: `prj-${Date.now()}-${uniqueSuffix}`,
      code: projectCode,
      loadNumber: loadNum,
      customerName: template.broker,
      customerCode: template.broker.substring(0, 4).toUpperCase(),
      originCity: template.originCity,
      originState: template.originState,
      originAddress: template.origin,
      destCity: template.destCity,
      destState: template.destState,
      destAddress: template.destination,
      status: 'booked',
      driverName: ['Carlos Mendez', 'Marcus Vance', 'Sarah Jenkins', 'David Kowalski'][Math.floor(Math.random() * 4)],
      driverPhone: '(555) 392-1044',
      truckId: `TRK-${Math.floor(101 + Math.random() * 20)}`,
      trailerId: `TLR-${Math.floor(501 + Math.random() * 80)}`,
      pickupDate: now.toISOString().split('T')[0],
      deliveryDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      estimatedRevenue: template.rate,
      linehaulPay: linehaul,
      fuelSurcharge: fuel,
      equipmentType: template.equipmentType,
      commodities: template.commodity,
      weightLbs: Math.floor(38000 + Math.random() * 6000),
      documentsCount: 1,
      telemetry: {
        lat: 41.8781,
        lng: -87.6298,
        speedMph: 0,
        headingDeg: 90,
        reeferTempF: template.equipmentType.includes('Reefer') ? 34.0 : 70.0,
        fuelLevelPct: 94,
        currentLocationName: `${template.originCity} Shipper Terminal`,
        lastPingTime: 'Just now',
        geofenceState: 'Inside Shipper',
        dwellMinutes: 10
      },
      tripStops: [
        {
          id: `stop-${Date.now()}-1`,
          stopSequence: 1,
          type: 'pickup',
          facilityName: `${template.originCity} Terminal`,
          address: template.origin,
          city: template.originCity,
          state: template.originState,
          appointmentTime: 'Tomorrow 08:00',
          completed: false,
          podUploaded: false,
          dwellHours: 0.2,
          detentionAlert: false
        },
        {
          id: `stop-${Date.now()}-2`,
          stopSequence: 2,
          type: 'delivery',
          facilityName: `${template.destCity} Receiving DC`,
          address: template.destination,
          city: template.destCity,
          state: template.destState,
          appointmentTime: 'In 2 days 14:00',
          completed: false,
          podUploaded: false,
          dwellHours: 0,
          detentionAlert: false
        }
      ],
      tasks: [
        { id: `t1-${loadId}`, title: 'Autonomous Rate Confirmation parsed & verified', completed: true, assignee: 'Auto-Pilot AI', dueDate: 'Today' },
        { id: `t2-${loadId}`, title: 'Assigned available fleet driver & truck', completed: true, assignee: 'Auto-Pilot', dueDate: 'Today' },
        { id: `t3-${loadId}`, title: 'Sync pickup & delivery schedule to Google Calendar', completed: config.autoSyncGoogleCalendar, assignee: 'Google Calendar Agent', dueDate: 'Today' },
        { id: `t4-${loadId}`, title: 'Generate Rate Confirmation Google Doc in Drive', completed: config.autoSaveGoogleDrive, assignee: 'Google Docs Agent', dueDate: 'Today' },
        { id: `t5-${loadId}`, title: 'Driver check-in & electronic BOL capture', completed: false, assignee: 'Driver', dueDate: 'Tomorrow' }
      ],
      comments: [
        {
          id: `comm-ap-${Date.now()}`,
          userId: 'agent-1',
          userName: 'Auto-Pilot Ingestion Agent',
          userRole: 'AI Agent',
          avatarBg: 'bg-indigo-600',
          text: `Autonomous intake verified from ${template.source}. Rate ($${template.rate.toLocaleString()}) and equipment (${template.equipmentType}) matched fleet criteria at $${template.ratePerMile.toFixed(2)}/mi.`,
          timestamp: 'Just now'
        }
      ],
      activeCollaboratorIds: ['user-1'],
      lastUpdated: 'Just now'
    };

    let convertedInvoice: ProposedInvoice | undefined;
    if (config.autoDraftInvoice) {
      convertedInvoice = {
        id: `inv-${Date.now()}-${uniqueSuffix}`,
        projectId: convertedProject.id,
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        loadNumber: loadNum,
        customerName: template.broker,
        billingAddress: '14701 Charlson Rd, Eden Prairie, MN 55347',
        customerEmail: `ap-invoicing@${template.broker.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        issueDate: now.toLocaleDateString(),
        dueDate: new Date(now.getTime() + 30 * 24 * 3600 * 1000).toLocaleDateString(),
        paymentTerms: 'Net 30',
        lineItems: [
          {
            id: `li-1-${loadId}`,
            description: `Freight Linehaul (${template.originCity} to ${template.destCity} - ${template.distanceMiles} mi)`,
            amount: linehaul,
            type: 'linehaul',
            sourceDoc: 'RateConfirmation'
          },
          {
            id: `li-2-${loadId}`,
            description: 'Fuel Surcharge (DOE Index Adjustment)',
            amount: fuel,
            type: 'fuel_surcharge',
            sourceDoc: 'RateConfirmation'
          }
        ],
        subtotal: template.rate,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: template.rate,
        amountPaid: 0,
        balanceDue: template.rate,
        status: 'draft',
        attachedDocIds: [],
        correctionsLog: []
      };
    }

    return {
      load: detectedLoad,
      convertedProject,
      convertedInvoice
    };
  }

  return { load: detectedLoad };
}
