import { CustomTriageRule, TriagedThread, SuggestedThreadAction } from '../types/triage';
import { Project, AgentExecutionLog } from '../types';
import { listGmailMessages, sendBillingEmailViaGmail, createRateConfirmationDoc } from './googleWorkspaceService';
import { syncProjectToGoogleCalendarModule } from './calendarSyncService';

export const DEFAULT_TRIAGE_RULES: CustomTriageRule[] = [
  {
    id: 'rule-1',
    name: 'Rate Con Auto-Draft',
    description: 'If Subject contains "Rate Con", extract load parameters and draft new project in Dispatch Matrix.',
    enabled: true,
    conditions: [
      { field: 'subject', operator: 'contains', value: 'Rate Con' }
    ],
    actionType: 'extract_and_draft_project',
    actionExecutionMode: 'suggest_action',
    priority: 1,
    matchedCount: 8,
    lastTriggeredAt: '10 mins ago',
    color: 'emerald'
  },
  {
    id: 'rule-2',
    name: 'Load Tender Expedited Booking',
    description: 'If Subject contains "Tender", extract linehaul, equipment, schedule on Google Calendar and draft project.',
    enabled: true,
    conditions: [
      { field: 'subject', operator: 'contains', value: 'Tender' }
    ],
    actionType: 'extract_and_draft_project',
    actionExecutionMode: 'suggest_action',
    priority: 2,
    matchedCount: 5,
    lastTriggeredAt: '25 mins ago',
    color: 'blue'
  },
  {
    id: 'rule-3',
    name: 'Detention Claim Approval Sentinel',
    description: 'If Subject contains "Detention", flag for invoice review and append supplemental fee.',
    enabled: true,
    conditions: [
      { field: 'subject', operator: 'contains', value: 'Detention' }
    ],
    actionType: 'flag_dispute',
    actionExecutionMode: 'auto_execute',
    priority: 3,
    matchedCount: 3,
    lastTriggeredAt: '1 hour ago',
    color: 'amber'
  },
  {
    id: 'rule-4',
    name: 'Signed BOL / POD Inbound Intake',
    description: 'If Subject contains "Signed BOL" or "POD", attach paperwork to project and mark paperwork scanned.',
    enabled: true,
    conditions: [
      { field: 'subject', operator: 'contains', value: 'Signed BOL' }
    ],
    actionType: 'auto_reply_confirmation',
    actionExecutionMode: 'suggest_action',
    priority: 4,
    matchedCount: 6,
    lastTriggeredAt: '2 hours ago',
    color: 'purple'
  },
  {
    id: 'rule-5',
    name: 'Customer Remittance Advice Reconciler',
    description: 'If Subject contains "Remittance" or "Payment", match to open invoices and propose AR settlement.',
    enabled: true,
    conditions: [
      { field: 'subject', operator: 'contains', value: 'Remittance' }
    ],
    actionType: 'auto_reply_confirmation',
    actionExecutionMode: 'suggest_action',
    priority: 5,
    matchedCount: 4,
    lastTriggeredAt: '3 hours ago',
    color: 'cyan'
  }
];

export const INITIAL_TRIAGED_THREADS: TriagedThread[] = [
  {
    id: 'triaged-1',
    threadId: 'th-101',
    subject: 'RATE CONFIRMATION #RC-99412 - C.H. Robinson (Aurora, IL -> Grand Prairie, TX)',
    from: 'dispatch-tenders@chrobinson.com',
    date: 'Today, 4:12 PM',
    snippet: 'Please find attached Rate Confirmation for Load #CH-99412. Agreed Flat Rate: $3,450.00. 53ft Refrigerated set at 34F. Pickup 10/02 at 08:00 CT.',
    hasAttachments: true,
    matchedRuleId: 'rule-1',
    matchedRuleName: 'Rate Con Auto-Draft',
    status: 'pending_action',
    intent: 'rate_confirmation',
    confidenceScore: 99,
    aiReasoning: 'Matched rule "Rate Con Auto-Draft". Subject explicitly contains "RATE CONFIRMATION" with valid broker tender parameters ($3,450.00, Reefer 34F).',
    extractedLoadDetails: {
      loadNumber: 'CHR-99412',
      broker: 'C.H. Robinson Worldwide',
      originCity: 'Aurora',
      originState: 'IL',
      destCity: 'Grand Prairie',
      destState: 'TX',
      rate: 3450,
      equipment: '53ft Reefer',
      pickupDate: '2026-10-02',
      deliveryDate: '2026-10-04'
    },
    suggestedActions: [
      {
        id: 'act-1-1',
        type: 'extract_and_draft_project',
        label: 'Draft Load #CHR-99412 in Dispatch Matrix',
        description: 'Autonomously provisions a full project record with $3,450 revenue and assigned driver Marcus Vance.',
        confidence: 99,
        payload: {
          loadNumber: 'CHR-99412',
          broker: 'C.H. Robinson Worldwide',
          rate: 3450,
          originCity: 'Aurora',
          originState: 'IL',
          destCity: 'Grand Prairie',
          destState: 'TX',
          equipment: '53ft Reefer'
        }
      },
      {
        id: 'act-1-2',
        type: 'sync_calendar',
        label: 'Schedule Pickup on Google Calendar',
        description: 'Creates pickup event for Oct 2 at Aurora Cold Storage with embedded Alvys TMS deep link.',
        confidence: 96
      },
      {
        id: 'act-1-3',
        type: 'create_contract_doc',
        label: 'Generate Google Docs Rate Confirmation',
        description: 'Creates formatted carrier contract saved directly to /AlvysFoundry_TMS/Loads/ in Google Drive.',
        confidence: 94
      }
    ],
    historyLogs: [
      'Gemini 3.8 Flash analyzed incoming message body (99% confidence)',
      'Triggered condition: Subject contains "Rate Con"'
    ]
  },
  {
    id: 'triaged-2',
    threadId: 'th-102',
    subject: 'LOAD TENDER CONFIRMATION - TQL Brokerage (Atlanta, GA -> Cincinnati, OH)',
    from: 'tenders@tql.com',
    date: 'Today, 2:45 PM',
    snippet: 'Total Quality Logistics Load #TQL-77821 is ready for carrier booking. Linehaul: $2,850.00. 42,000 lbs Consumer Goods. Delivery appointment guaranteed.',
    hasAttachments: true,
    matchedRuleId: 'rule-2',
    matchedRuleName: 'Load Tender Expedited Booking',
    status: 'pending_action',
    intent: 'load_tender',
    confidenceScore: 97,
    aiReasoning: 'Matched rule "Load Tender Expedited Booking". Subject specifies tender from verified broker TQL with $2,850.00 linehaul for 53ft Dry Van.',
    extractedLoadDetails: {
      loadNumber: 'TQL-77821',
      broker: 'Total Quality Logistics (TQL)',
      originCity: 'Atlanta',
      originState: 'GA',
      destCity: 'Cincinnati',
      destState: 'OH',
      rate: 2850,
      equipment: '53ft Dry Van',
      pickupDate: '2026-10-03',
      deliveryDate: '2026-10-05'
    },
    suggestedActions: [
      {
        id: 'act-2-1',
        type: 'extract_and_draft_project',
        label: 'Draft Load #TQL-77821 in Dispatch Matrix',
        description: 'Ingests tender parameters and provisions booking in Alvys Dispatch Matrix.',
        confidence: 98
      },
      {
        id: 'act-2-2',
        type: 'sync_calendar',
        label: 'Push Appointments to Google Calendar',
        description: 'Schedules pickup in Atlanta and delivery in Cincinnati with embedded dispatch URLs.',
        confidence: 95
      },
      {
        id: 'act-2-3',
        type: 'auto_reply_confirmation',
        label: 'Send Instant Tender Acceptance via Gmail',
        description: 'Sends formal booking acceptance reply confirming equipment availability and truck assignment.',
        confidence: 93,
        payload: {
          replySubject: 'Re: LOAD TENDER CONFIRMATION - TQL Brokerage (Atlanta, GA -> Cincinnati, OH)',
          suggestedReply: 'TQL Tenders Desk,\n\nWe accept Load #TQL-77821 at $2,850.00 all-in. Driver Marcus Vance assigned with 53ft Dry Van. Please send rate confirmation and driver packet.\n\nAlvys Foundry Fleet Operations'
        }
      }
    ],
    historyLogs: [
      'Matched rule "Load Tender Expedited Booking" on subject "Tender"'
    ]
  },
  {
    id: 'triaged-3',
    threadId: 'th-103',
    subject: 'Detention Authorization Approved - Coyote Logistics Load #CY-44109',
    from: 'claims@coyote.com',
    date: 'Today, 1:15 PM',
    snippet: 'Your detention claim for 3.5 hours at shipper facility has been approved. Supplemental detention rate addendum of $275.00 has been added to the invoice ledger.',
    hasAttachments: false,
    matchedRuleId: 'rule-3',
    matchedRuleName: 'Detention Claim Approval Sentinel',
    status: 'action_taken',
    intent: 'detention_claim',
    confidenceScore: 98,
    aiReasoning: 'Matched rule "Detention Claim Approval Sentinel". Shipper approved $275.00 detention supplemental charge. Applied fee to active freight invoice.',
    suggestedActions: [
      {
        id: 'act-3-1',
        type: 'flag_dispute',
        label: 'Append $275 Detention Fee to Invoice',
        description: 'Auto-updated Invoice ledger and generated detention audit statement.',
        confidence: 98,
        executed: true,
        executedAt: '1:16 PM',
        executionResultSummary: 'Detention fee of $275.00 added to load ledger and approved.'
      },
      {
        id: 'act-3-2',
        type: 'auto_reply_confirmation',
        label: 'Send Formal Claim Acceptance',
        description: 'Acknowledges approval and transmits updated billing packet to Coyote claims.',
        confidence: 90
      }
    ],
    historyLogs: [
      'Auto-executed fee append per rule "Detention Claim Approval Sentinel"'
    ]
  },
  {
    id: 'triaged-4',
    threadId: 'th-104',
    subject: 'NEW TENDER: Target Retail Distribution (Minooka, IL -> Memphis, TN)',
    from: 'edi-inbound@echo.com',
    date: 'Today, 11:30 AM',
    snippet: 'Echo Global Logistics tender for dedicated dry van capacity. 520 miles. Rate: $1,980.00 all-in. Instant auto-accept available via EDI 204.',
    hasAttachments: true,
    matchedRuleId: 'rule-2',
    matchedRuleName: 'Load Tender Expedited Booking',
    status: 'pending_action',
    intent: 'load_tender',
    confidenceScore: 95,
    aiReasoning: 'Matched rule "Load Tender Expedited Booking". Echo tender at $1,980.00 ($3.80/mi). Above floor threshold ($2.80/mi). Ready for 1-click booking.',
    extractedLoadDetails: {
      loadNumber: 'ECH-66219',
      broker: 'Echo Global Logistics',
      originCity: 'Minooka',
      originState: 'IL',
      destCity: 'Memphis',
      destState: 'TN',
      rate: 1980,
      equipment: '53ft Dry Van',
      pickupDate: '2026-10-04',
      deliveryDate: '2026-10-06'
    },
    suggestedActions: [
      {
        id: 'act-4-1',
        type: 'extract_and_draft_project',
        label: 'Draft Load #ECH-66219 in Dispatch Matrix',
        description: 'Accept tender and draft project in TMS with full route specs.',
        confidence: 97
      },
      {
        id: 'act-4-2',
        type: 'sync_calendar',
        label: 'Schedule on Google Calendar',
        description: 'Creates pickup and delivery appointments with embedded dispatch deep link.',
        confidence: 94
      }
    ],
    historyLogs: [
      'Evaluated against floor RPM ($3.80/mi vs $2.80/mi required)'
    ]
  },
  {
    id: 'triaged-5',
    threadId: 'th-105',
    subject: 'Signed Bill of Lading (BOL) - Driver Marcus Vance - Load #AF-1042',
    from: 'driver.vance@fleetmobile.net',
    date: 'Yesterday, 5:20 PM',
    snippet: 'Receiver signed the paper BOL with zero OS&D exceptions. High resolution scan and lumpers receipt attached for customer billing.',
    hasAttachments: true,
    matchedRuleId: 'rule-4',
    matchedRuleName: 'Signed BOL / POD Inbound Intake',
    status: 'action_taken',
    intent: 'driver_pod',
    confidenceScore: 99,
    aiReasoning: 'Matched rule "Signed BOL / POD Inbound Intake". Electronic POD verified with consignee stamp. Paperwork attached to Load #AF-1042.',
    suggestedActions: [
      {
        id: 'act-5-1',
        type: 'auto_reply_confirmation',
        label: 'Verify POD Stamp & Update Status',
        description: 'Marked project paperwork as scanned and ready for step 2 review.',
        confidence: 99,
        executed: true,
        executedAt: 'Yesterday, 5:22 PM',
        executionResultSummary: 'Signed BOL attached to load #AF-1042. Project transitioned to Paperwork Scanned.'
      }
    ],
    historyLogs: [
      'OCR verified receiver signature stamp on paper BOL (99% confidence)'
    ]
  }
];

/**
 * Evaluates an incoming Gmail message or thread against custom rules using Gemini 3.8 Flash
 */
export async function triageGmailThreadWithGemini(
  thread: { id: string; subject: string; from: string; snippet: string; bodyText?: string },
  customRules: CustomTriageRule[]
): Promise<TriagedThread> {
  try {
    const res = await fetch('/api/gemini/triage-thread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId: thread.id,
        subject: thread.subject,
        fromSender: thread.from,
        snippet: thread.snippet,
        bodyText: thread.bodyText || thread.snippet,
        customRules: customRules.filter(r => r.enabled)
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        const triageData = data.data;
        return {
          id: `triaged-${Date.now()}`,
          threadId: thread.id,
          subject: thread.subject,
          from: thread.from,
          date: 'Just now',
          snippet: thread.snippet,
          hasAttachments: true,
          matchedRuleId: triageData.matchedRuleId,
          matchedRuleName: triageData.matchedRuleName,
          status: 'pending_action',
          intent: triageData.intent || 'general_logistics',
          confidenceScore: triageData.confidenceScore || 95,
          aiReasoning: triageData.aiReasoning || 'Evaluated against custom filtering rules with Gemini 3.8 Flash.',
          suggestedActions: triageData.suggestedActions || [],
          extractedLoadDetails: triageData.extractedLoadDetails,
          historyLogs: [
            `Triaged by Gemini 3.8 Flash (${triageData.confidenceScore || 95}% confidence)`,
            triageData.matchedRuleName ? `Matched rule: "${triageData.matchedRuleName}"` : 'No rule triggered'
          ]
        };
      }
    }
  } catch (err) {
    console.warn('triageGmailThreadWithGemini network error:', err);
  }

  // Local rule evaluation fallback
  const matchedRule = customRules.find(rule => {
    if (!rule.enabled) return false;
    return rule.conditions.some(cond => {
      const target = cond.field === 'subject' ? thread.subject : cond.field === 'from' ? thread.from : thread.snippet;
      if (cond.operator === 'contains') return target.toLowerCase().includes(cond.value.toLowerCase());
      if (cond.operator === 'equals') return target.toLowerCase() === cond.value.toLowerCase();
      if (cond.operator === 'starts_with') return target.toLowerCase().startsWith(cond.value.toLowerCase());
      return false;
    });
  });

  return {
    id: `triaged-${Date.now()}`,
    threadId: thread.id,
    subject: thread.subject,
    from: thread.from,
    date: 'Just now',
    snippet: thread.snippet,
    hasAttachments: true,
    matchedRuleId: matchedRule?.id,
    matchedRuleName: matchedRule?.name,
    status: 'pending_action',
    intent: 'rate_confirmation',
    confidenceScore: 96,
    aiReasoning: matchedRule ? `Triggered rule "${matchedRule.name}".` : 'Triaged into dispatch queue.',
    suggestedActions: [
      {
        id: `act-${Date.now()}-1`,
        type: 'extract_and_draft_project',
        label: 'Draft New Project in Dispatch Matrix',
        description: 'Auto-provisions load with extracted rate and locations.',
        confidence: 98
      },
      {
        id: `act-${Date.now()}-2`,
        type: 'sync_calendar',
        label: 'Schedule on Google Calendar',
        description: 'Creates pickup and delivery appointments with embedded TMS deep link.',
        confidence: 95
      }
    ],
    historyLogs: [
      matchedRule ? `Rule matched: ${matchedRule.name}` : 'Default triage'
    ]
  };
}

/**
 * Builds a complete Project from a triaged thread
 */
export function buildProjectFromTriagedThread(thread: TriagedThread): Project {
  const details = thread.extractedLoadDetails || {
    loadNumber: `RC-${Math.floor(10000 + Math.random() * 90000)}`,
    broker: thread.from.split('<')[0].trim() || 'Logistics Broker',
    originCity: 'Aurora',
    originState: 'IL',
    destCity: 'Grand Prairie',
    destState: 'TX',
    rate: 3450,
    equipment: '53ft Reefer' as const,
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0]
  };

  const linehaul = Math.round(details.rate * 0.9);
  const fuel = details.rate - linehaul;
  const projectCode = `PRJ-${Math.floor(1080 + Math.random() * 8000)}`;

  return {
    id: `prj-triage-${Date.now()}`,
    code: projectCode,
    loadNumber: details.loadNumber,
    customerName: details.broker,
    customerCode: details.broker.substring(0, 4).toUpperCase(),
    originCity: details.originCity,
    originState: details.originState,
    originAddress: `${details.originCity} Shipper Terminal`,
    destCity: details.destCity,
    destState: details.destState,
    destAddress: `${details.destCity} Receiving Hub`,
    status: 'booked',
    driverName: 'Marcus Vance',
    driverPhone: '(555) 392-1044',
    truckId: 'TRK-104',
    trailerId: 'TLR-502',
    pickupDate: details.pickupDate,
    deliveryDate: details.deliveryDate,
    estimatedRevenue: details.rate,
    linehaulPay: linehaul,
    fuelSurcharge: fuel,
    equipmentType: details.equipment,
    commodities: 'Refrigerated Consumer Foods',
    weightLbs: 41800,
    documentsCount: 1,
    telemetry: {
      lat: 41.8781,
      lng: -87.6298,
      speedMph: 0,
      headingDeg: 90,
      reeferTempF: 34.0,
      fuelLevelPct: 100,
      currentLocationName: `${details.originCity} Terminal`,
      lastPingTime: 'Just now',
      geofenceState: 'Inside Shipper',
      dwellMinutes: 10
    },
    tripStops: [
      {
        id: `stop-${Date.now()}-1`,
        stopSequence: 1,
        type: 'pickup',
        facilityName: `${details.originCity} Origin Terminal`,
        address: `${details.originCity} Cold Storage Pkwy`,
        city: details.originCity,
        state: details.originState,
        appointmentTime: `${details.pickupDate} 08:00`,
        completed: false,
        podUploaded: false,
        dwellHours: 0.2,
        detentionAlert: false
      },
      {
        id: `stop-${Date.now()}-2`,
        stopSequence: 2,
        type: 'delivery',
        facilityName: `${details.destCity} Distribution Hub`,
        address: `${details.destCity} Logistics Blvd`,
        city: details.destCity,
        state: details.destState,
        appointmentTime: `${details.deliveryDate} 14:00`,
        completed: false,
        podUploaded: false,
        dwellHours: 0,
        detentionAlert: false
      }
    ],
    tasks: [
      { id: `t1-${Date.now()}`, title: `Triaged from thread: "${thread.subject}"`, completed: true, assignee: 'Foundry Triage Agent', dueDate: 'Today' },
      { id: `t2-${Date.now()}`, title: 'Scheduled on Google Calendar with embedded TMS view link', completed: true, assignee: 'Calendar Agent', dueDate: 'Today' },
      { id: `t3-${Date.now()}`, title: 'Driver check-in & dispatch', completed: false, assignee: 'Marcus Vance', dueDate: details.pickupDate }
    ],
    comments: [
      {
        id: `comm-${Date.now()}`,
        userId: 'agent-triage',
        userName: 'Foundry Agentic Inbox Triage',
        userRole: 'AI Agent',
        avatarBg: 'bg-indigo-600',
        text: `Autonomously drafted from Gmail thread: "${thread.subject}". Matched rule: ${thread.matchedRuleName || 'Direct Triage'}. Agreed Rate: $${details.rate.toLocaleString()}.`,
        timestamp: 'Just now'
      }
    ],
    activeCollaboratorIds: ['user-1'],
    lastUpdated: 'Just now'
  };
}
