import { CarrierComplianceRecord } from '../types';

export const INITIAL_CARRIER_COMPLIANCE_RECORDS: CarrierComplianceRecord[] = [
  {
    id: 'carr-1',
    legalName: 'GREEN EXPRESS LLC',
    dbaName: 'Green Express LLC',
    dotNumber: '3252472',
    mcNumber: 'TXDMV-009021927C',
    complianceStatus: 'approved',
    contactName: 'Operations Lead',
    contactEmail: 'dispatch@greenexpressllc.com',
    contactPhone: '(817) 297-8840',
    city: 'Crowley',
    state: 'TX',
    onboardingDate: '2024-03-15',
    riskScore: 3,
    coiExpiryWarningCount: 0,
    notes: 'Primary in-house dedicated asset fleet based in Crowley, TX. All equipment and FMCSA safety records in full compliance.',
    fraudCheck: {
      doubleBrokeringRisk: 'LOW',
      chameleonCarrierRisk: 'NONE',
      physicalAddressType: 'Commercial Freight Yard',
      phoneCarrierType: 'Landline / Business VoIP'
    },
    equipmentCount: {
      tractors: 48,
      trailers: 62,
      drivers: 52
    },
    safetyRating: {
      fmcsaSafetyRating: 'Satisfactory',
      fmcsaAuditDate: '2025-11-14',
      fmcsaRegistryStatus: 'AUTHORIZED',
      operatingAuthority: {
        common: true,
        contract: true,
        broker: false,
        status: 'ACTIVE'
      },
      basicsScores: {
        unsafeDrivingPercentile: 4.2,
        hosCompliancePercentile: 8.5,
        driverFitnessPercentile: 0.0,
        controlledSubstancesPercentile: 0.0,
        vehicleMaintPercentile: 12.1
      },
      outOfServiceRates: {
        vehicleOosPct: 6.8,
        vehicleNatAvgPct: 22.3,
        driverOosPct: 1.2,
        driverNatAvgPct: 6.7
      },
      inspectionsTotal24Mo: 142,
      crashesTotal24Mo: 1,
      fatalCrashes: 0,
      injuryCrashes: 0,
      towawayCrashes: 1,
      lastFmcsaApiSync: 'Today, 16:45'
    },
    insurancePolicies: [
      {
        id: 'pol-1',
        type: 'AutoLiability',
        provider: 'Great West Casualty Insurance',
        policyNumber: 'GWC-AL-8891042',
        coverageAmount: 1000000,
        effectiveDate: '2026-01-01',
        expiryDate: '2027-01-01',
        daysRemaining: 92,
        status: 'valid',
        underwriterPhone: '(800) 228-8602',
        naicCompanyNumber: '11371',
        verifiedBy: 'Marcus Vance'
      },
      {
        id: 'pol-2',
        type: 'Cargo',
        provider: 'Great West Casualty Insurance',
        policyNumber: 'GWC-CG-8891043',
        coverageAmount: 250000,
        effectiveDate: '2026-01-01',
        expiryDate: '2027-01-01',
        daysRemaining: 92,
        status: 'valid',
        underwriterPhone: '(800) 228-8602',
        naicCompanyNumber: '11371',
        verifiedBy: 'Marcus Vance'
      },
      {
        id: 'pol-3',
        type: 'ReeferBreakdown',
        provider: 'Travelers Property Casualty',
        policyNumber: 'TRV-RF-904128',
        coverageAmount: 50000,
        effectiveDate: '2026-02-15',
        expiryDate: '2027-02-15',
        daysRemaining: 137,
        status: 'valid',
        verifiedBy: 'Elena Rostova'
      },
      {
        id: 'pol-4',
        type: 'GeneralLiability',
        provider: 'Hartford Fire Insurance',
        policyNumber: 'HFD-GL-449102',
        coverageAmount: 1000000,
        effectiveDate: '2026-03-01',
        expiryDate: '2027-03-01',
        daysRemaining: 151,
        status: 'valid',
        verifiedBy: 'Marcus Vance'
      }
    ],
    documents: [
      { id: 'doc-c-1', name: 'Certificate_of_Insurance_COI_2026.pdf', type: 'COI', uploadedAt: '2026-01-02', expiresAt: '2027-01-01', status: 'verified', fileSize: '840 KB', verifiedBy: 'Safety Officer', verifiedAt: '2026-01-03' },
      { id: 'doc-c-2', name: 'W9_Form_Green_Express_Signed.pdf', type: 'W9', uploadedAt: '2026-01-02', status: 'verified', fileSize: '210 KB', verifiedBy: 'Safety Officer', verifiedAt: '2026-01-03' },
      { id: 'doc-c-3', name: 'Broker_Carrier_Agreement_Signed.pdf', type: 'BrokerCarrierAgreement', uploadedAt: '2026-01-02', status: 'verified', fileSize: '1.4 MB', verifiedBy: 'Operations Lead', verifiedAt: '2026-01-03' },
      { id: 'doc-c-4', name: 'TXDMV_Authority_Certificate.pdf', type: 'SCACCertificate', uploadedAt: '2026-01-02', expiresAt: '2027-06-30', status: 'verified', fileSize: '180 KB', verifiedBy: 'Safety Officer', verifiedAt: '2026-01-03' }
    ]
  },
  {
    id: 'carr-2',
    legalName: 'SwiftLine Logistics Group LLC',
    dotNumber: '2940192',
    mcNumber: '819204',
    complianceStatus: 'needs_attention',
    contactName: 'Derrick Vance',
    contactEmail: 'safety@swiftlinefreight.com',
    contactPhone: '(404) 555-8819',
    city: 'Atlanta',
    state: 'GA',
    onboardingDate: '2025-06-20',
    riskScore: 28,
    coiExpiryWarningCount: 1,
    notes: 'Auto-Liability insurance policy expires in 14 days. Automated notification dispatched to underwriter.',
    fraudCheck: {
      doubleBrokeringRisk: 'LOW',
      chameleonCarrierRisk: 'NONE',
      physicalAddressType: 'Commercial Freight Yard',
      phoneCarrierType: 'Landline / Business VoIP'
    },
    equipmentCount: {
      tractors: 24,
      trailers: 30,
      drivers: 26
    },
    safetyRating: {
      fmcsaSafetyRating: 'Satisfactory',
      fmcsaAuditDate: '2025-08-22',
      fmcsaRegistryStatus: 'AUTHORIZED',
      operatingAuthority: {
        common: true,
        contract: true,
        broker: false,
        status: 'ACTIVE'
      },
      basicsScores: {
        unsafeDrivingPercentile: 18.4,
        hosCompliancePercentile: 24.1,
        driverFitnessPercentile: 5.0,
        controlledSubstancesPercentile: 0.0,
        vehicleMaintPercentile: 32.6
      },
      outOfServiceRates: {
        vehicleOosPct: 12.4,
        vehicleNatAvgPct: 22.3,
        driverOosPct: 3.8,
        driverNatAvgPct: 6.7
      },
      inspectionsTotal24Mo: 68,
      crashesTotal24Mo: 2,
      fatalCrashes: 0,
      injuryCrashes: 1,
      towawayCrashes: 1,
      lastFmcsaApiSync: 'Today, 14:20'
    },
    insurancePolicies: [
      {
        id: 'pol-5',
        type: 'AutoLiability',
        provider: 'Progressive Commercial Insurance',
        policyNumber: 'PRG-AL-774019',
        coverageAmount: 1000000,
        effectiveDate: '2025-10-14',
        expiryDate: '2026-10-14',
        daysRemaining: 14,
        status: 'expiring_soon',
        underwriterPhone: '(888) 240-8692',
        naicCompanyNumber: '24260',
        verifiedBy: 'Elena Rostova'
      },
      {
        id: 'pol-6',
        type: 'Cargo',
        provider: 'Progressive Commercial Insurance',
        policyNumber: 'PRG-CG-774020',
        coverageAmount: 150000,
        effectiveDate: '2025-10-14',
        expiryDate: '2026-10-14',
        daysRemaining: 14,
        status: 'expiring_soon',
        underwriterPhone: '(888) 240-8692',
        naicCompanyNumber: '24260',
        verifiedBy: 'Elena Rostova'
      }
    ],
    documents: [
      { id: 'doc-c-5', name: 'SwiftLine_COI_2025_2026.pdf', type: 'COI', uploadedAt: '2025-10-15', expiresAt: '2026-10-14', status: 'verified', fileSize: '650 KB', verifiedBy: 'Elena Rostova' },
      { id: 'doc-c-6', name: 'SwiftLine_W9.pdf', type: 'W9', uploadedAt: '2025-06-20', status: 'verified', fileSize: '190 KB', verifiedBy: 'Elena Rostova' }
    ]
  },
  {
    id: 'carr-3',
    legalName: 'Eagle Express Freight LLC',
    dotNumber: '3401928',
    mcNumber: '772109',
    complianceStatus: 'expired',
    contactName: 'Boris Miller',
    contactEmail: 'dispatch@eagleexpressfreight.com',
    contactPhone: '(214) 555-0812',
    city: 'Dallas',
    state: 'TX',
    onboardingDate: '2025-01-10',
    riskScore: 74,
    coiExpiryWarningCount: 2,
    notes: 'Cargo policy expired on 09/27/2026. Load dispatch blocked automatically by Foundry Compliance Sentinel.',
    fraudCheck: {
      doubleBrokeringRisk: 'MEDIUM',
      chameleonCarrierRisk: 'NONE',
      physicalAddressType: 'Commercial Freight Yard',
      phoneCarrierType: 'Prepaid Cell'
    },
    equipmentCount: {
      tractors: 12,
      trailers: 14,
      drivers: 11
    },
    safetyRating: {
      fmcsaSafetyRating: 'Conditional',
      fmcsaAuditDate: '2025-04-10',
      fmcsaRegistryStatus: 'AUTHORIZED',
      operatingAuthority: {
        common: true,
        contract: false,
        broker: false,
        status: 'ACTIVE'
      },
      basicsScores: {
        unsafeDrivingPercentile: 62.4,
        hosCompliancePercentile: 68.9,
        driverFitnessPercentile: 45.0,
        controlledSubstancesPercentile: 12.0,
        vehicleMaintPercentile: 71.4
      },
      outOfServiceRates: {
        vehicleOosPct: 28.5,
        vehicleNatAvgPct: 22.3,
        driverOosPct: 9.8,
        driverNatAvgPct: 6.7
      },
      inspectionsTotal24Mo: 42,
      crashesTotal24Mo: 4,
      fatalCrashes: 0,
      injuryCrashes: 2,
      towawayCrashes: 2,
      lastFmcsaApiSync: 'Today, 12:10'
    },
    insurancePolicies: [
      {
        id: 'pol-7',
        type: 'AutoLiability',
        provider: 'National Indemnity Company',
        policyNumber: 'NIC-AL-550192',
        coverageAmount: 1000000,
        effectiveDate: '2025-09-27',
        expiryDate: '2026-09-27',
        daysRemaining: -3,
        status: 'expired',
        underwriterPhone: '(402) 916-3000',
        naicCompanyNumber: '20087',
        verifiedBy: 'Elena Rostova'
      },
      {
        id: 'pol-8',
        type: 'Cargo',
        provider: 'National Indemnity Company',
        policyNumber: 'NIC-CG-550193',
        coverageAmount: 100000,
        effectiveDate: '2025-09-27',
        expiryDate: '2026-09-27',
        daysRemaining: -3,
        status: 'expired',
        underwriterPhone: '(402) 916-3000',
        naicCompanyNumber: '20087',
        verifiedBy: 'Elena Rostova'
      }
    ],
    documents: [
      { id: 'doc-c-7', name: 'Eagle_Express_Expired_COI.pdf', type: 'COI', uploadedAt: '2025-09-28', expiresAt: '2026-09-27', status: 'expired', fileSize: '520 KB', verifiedBy: 'Elena Rostova' },
      { id: 'doc-c-8', name: 'W9_EagleExpress.pdf', type: 'W9', uploadedAt: '2025-01-10', status: 'verified', fileSize: '140 KB', verifiedBy: 'Elena Rostova' }
    ]
  },
  {
    id: 'carr-4',
    legalName: 'Vanguard Heavy Haul & Transport',
    dotNumber: '4019281',
    mcNumber: '901244',
    complianceStatus: 'approved',
    contactName: 'Samir Patel',
    contactEmail: 'dispatch@vanguardheavyhaul.com',
    contactPhone: '(713) 555-0931',
    city: 'Houston',
    state: 'TX',
    onboardingDate: '2024-11-05',
    riskScore: 4,
    coiExpiryWarningCount: 0,
    notes: 'Premium heavy haul specialized carrier. $2,000,000 Auto-Liability with zero BASICs violations.',
    fraudCheck: {
      doubleBrokeringRisk: 'LOW',
      chameleonCarrierRisk: 'NONE',
      physicalAddressType: 'Commercial Freight Yard',
      phoneCarrierType: 'Landline / Business VoIP'
    },
    equipmentCount: {
      tractors: 35,
      trailers: 48,
      drivers: 38
    },
    safetyRating: {
      fmcsaSafetyRating: 'Satisfactory',
      fmcsaAuditDate: '2025-10-18',
      fmcsaRegistryStatus: 'AUTHORIZED',
      operatingAuthority: {
        common: true,
        contract: true,
        broker: true,
        status: 'ACTIVE'
      },
      basicsScores: {
        unsafeDrivingPercentile: 2.1,
        hosCompliancePercentile: 4.8,
        driverFitnessPercentile: 0.0,
        controlledSubstancesPercentile: 0.0,
        vehicleMaintPercentile: 8.4
      },
      outOfServiceRates: {
        vehicleOosPct: 4.2,
        vehicleNatAvgPct: 22.3,
        driverOosPct: 0.8,
        driverNatAvgPct: 6.7
      },
      inspectionsTotal24Mo: 94,
      crashesTotal24Mo: 0,
      fatalCrashes: 0,
      injuryCrashes: 0,
      towawayCrashes: 0,
      lastFmcsaApiSync: 'Today, 15:30'
    },
    insurancePolicies: [
      {
        id: 'pol-9',
        type: 'AutoLiability',
        provider: 'Zurich American Insurance Company',
        policyNumber: 'ZUR-AL-992104',
        coverageAmount: 2000000,
        effectiveDate: '2026-04-01',
        expiryDate: '2027-04-01',
        daysRemaining: 182,
        status: 'valid',
        underwriterPhone: '(800) 382-2150',
        naicCompanyNumber: '16535',
        verifiedBy: 'Elena Rostova'
      },
      {
        id: 'pol-10',
        type: 'Cargo',
        provider: 'Zurich American Insurance Company',
        policyNumber: 'ZUR-CG-992105',
        coverageAmount: 500000,
        effectiveDate: '2026-04-01',
        expiryDate: '2027-04-01',
        daysRemaining: 182,
        status: 'valid',
        underwriterPhone: '(800) 382-2150',
        naicCompanyNumber: '16535',
        verifiedBy: 'Elena Rostova'
      }
    ],
    documents: [
      { id: 'doc-c-9', name: 'Vanguard_COI_2M.pdf', type: 'COI', uploadedAt: '2026-04-02', expiresAt: '2027-04-01', status: 'verified', fileSize: '980 KB', verifiedBy: 'Elena Rostova' },
      { id: 'doc-c-10', name: 'Vanguard_Signed_BCA.pdf', type: 'BrokerCarrierAgreement', uploadedAt: '2024-11-05', status: 'verified', fileSize: '1.2 MB', verifiedBy: 'Marcus Vance' }
    ]
  },
  {
    id: 'carr-5',
    legalName: 'Crossroads Freight Lines Inc.',
    dotNumber: '3882910',
    mcNumber: '654102',
    complianceStatus: 'suspended',
    contactName: 'James Thorne',
    contactEmail: 'billing@crossroadsfreight.com',
    contactPhone: '(314) 555-0994',
    city: 'St. Louis',
    state: 'MO',
    onboardingDate: '2025-03-01',
    riskScore: 89,
    coiExpiryWarningCount: 1,
    notes: 'Operating Authority REVOKED by FMCSA on 09/15/2026 due to lack of active Form BOC-3 / Insurance filing. Carrier placed on strict do-not-load status.',
    fraudCheck: {
      doubleBrokeringRisk: 'HIGH',
      chameleonCarrierRisk: 'FLAGGED',
      physicalAddressType: 'Virtual Office PO Box',
      phoneCarrierType: 'Prepaid Cell'
    },
    equipmentCount: {
      tractors: 6,
      trailers: 8,
      drivers: 5
    },
    safetyRating: {
      fmcsaSafetyRating: 'Unsatisfactory',
      fmcsaAuditDate: '2026-02-18',
      fmcsaRegistryStatus: 'NOT_AUTHORIZED',
      operatingAuthority: {
        common: false,
        contract: false,
        broker: false,
        status: 'REVOKED'
      },
      basicsScores: {
        unsafeDrivingPercentile: 88.2,
        hosCompliancePercentile: 91.5,
        driverFitnessPercentile: 58.0,
        controlledSubstancesPercentile: 24.0,
        vehicleMaintPercentile: 84.1
      },
      outOfServiceRates: {
        vehicleOosPct: 38.2,
        vehicleNatAvgPct: 22.3,
        driverOosPct: 14.5,
        driverNatAvgPct: 6.7
      },
      inspectionsTotal24Mo: 28,
      crashesTotal24Mo: 3,
      fatalCrashes: 1,
      injuryCrashes: 1,
      towawayCrashes: 1,
      lastFmcsaApiSync: 'Today, 09:00'
    },
    insurancePolicies: [
      {
        id: 'pol-11',
        type: 'AutoLiability',
        provider: 'Revoked Underwriter',
        policyNumber: 'CANC-9921',
        coverageAmount: 750000,
        effectiveDate: '2025-03-01',
        expiryDate: '2026-03-01',
        daysRemaining: -213,
        status: 'expired',
        verifiedBy: 'Elena Rostova'
      }
    ],
    documents: [
      { id: 'doc-c-11', name: 'Crossroads_W9.pdf', type: 'W9', uploadedAt: '2025-03-01', status: 'verified', fileSize: '160 KB', verifiedBy: 'Elena Rostova' }
    ]
  }
];
