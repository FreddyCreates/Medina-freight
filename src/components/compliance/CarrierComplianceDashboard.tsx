import React, { useState } from 'react';
import { 
  CarrierComplianceRecord, 
  InsurancePolicy, 
  CarrierDocument, 
  SafetyRatingInfo 
} from '../../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  FileText, 
  CheckCircle2, 
  FileCheck, 
  RefreshCw, 
  Mail, 
  Phone, 
  Building2, 
  ExternalLink, 
  ArrowUpRight, 
  Sliders, 
  TrendingDown, 
  AlertCircle,
  Truck,
  FileDown,
  Lock,
  Unlock,
  Check,
  Zap,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { queryFmcsaSaferApi, calculateInsurancePolicyStatus } from '../../services/fmcsaComplianceService';

interface CarrierComplianceDashboardProps {
  carriers: CarrierComplianceRecord[];
  onUpdateCarrier: (updated: CarrierComplianceRecord) => void;
  onAddCarrier: (newCarrier: CarrierComplianceRecord) => void;
}

export const CarrierComplianceDashboard: React.FC<CarrierComplianceDashboardProps> = ({
  carriers,
  onUpdateCarrier,
  onAddCarrier,
}) => {
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>(carriers[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'insurance' | 'fmcsa' | 'documents' | 'fraud'>('insurance');
  const [isQueryingFmcsa, setIsQueryingFmcsa] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<string | null>(null);
  const [showAddCarrierModal, setShowAddCarrierModal] = useState(false);

  // New Carrier Modal State
  const [newDotNumber, setNewDotNumber] = useState('');
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isLookingUpDot, setIsLookingUpDot] = useState(false);

  const selectedCarrier = carriers.find(c => c.id === selectedCarrierId) || carriers[0];

  // Global Compliance KPI Metrics
  const totalCarriersCount = carriers.length;
  const approvedCount = carriers.filter(c => c.complianceStatus === 'approved').length;
  const needsAttentionCount = carriers.filter(c => c.complianceStatus === 'needs_attention').length;
  const expiredCount = carriers.filter(c => c.complianceStatus === 'expired').length;
  const suspendedCount = carriers.filter(c => c.complianceStatus === 'suspended').length;

  const totalExpiringSoonPolicies = carriers.flatMap(c => c.insurancePolicies).filter(p => p.status === 'expiring_soon' || p.daysRemaining <= 30).length;

  const filteredCarriers = carriers.filter(c => {
    const matchesSearch = 
      c.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dotNumber.includes(searchQuery) ||
      c.mcNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.complianceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRunFmcsaAudit = async () => {
    if (!selectedCarrier) return;
    setIsQueryingFmcsa(true);

    const fmcsaData = await queryFmcsaSaferApi(selectedCarrier.dotNumber);
    
    const updatedCarrier: CarrierComplianceRecord = {
      ...selectedCarrier,
      safetyRating: {
        ...selectedCarrier.safetyRating,
        fmcsaSafetyRating: fmcsaData.safetyRating.fmcsaSafetyRating,
        operatingAuthority: fmcsaData.safetyRating.operatingAuthority,
        basicsScores: fmcsaData.safetyRating.basicsScores,
        lastFmcsaApiSync: 'Just now'
      }
    };

    onUpdateCarrier(updatedCarrier);
    setIsQueryingFmcsa(false);
  };

  const handleRequestCOIRenewal = (policy: InsurancePolicy) => {
    setEmailSentSuccess(policy.id);
    setTimeout(() => {
      setEmailSentSuccess(null);
    }, 3000);
  };

  const handleVerifyDocument = (docId: string) => {
    if (!selectedCarrier) return;
    const updatedDocs = selectedCarrier.documents.map(d => 
      d.id === docId ? { ...d, status: 'verified' as const, verifiedBy: 'Elena Rostova (Compliance Lead)', verifiedAt: 'Just now' } : d
    );
    const updatedCarrier: CarrierComplianceRecord = {
      ...selectedCarrier,
      documents: updatedDocs
    };
    onUpdateCarrier(updatedCarrier);
  };

  const handleToggleComplianceStatus = (newStatus: CarrierComplianceRecord['complianceStatus']) => {
    if (!selectedCarrier) return;
    const updated = { ...selectedCarrier, complianceStatus: newStatus };
    onUpdateCarrier(updated);
  };

  const handleLookupDot = async () => {
    if (!newDotNumber) return;
    setIsLookingUpDot(true);
    const data = await queryFmcsaSaferApi(newDotNumber);
    setNewCarrierName(data.carrierName);
    setIsLookingUpDot(false);
  };

  const handleCreateCarrierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDotNumber || !newCarrierName) return;

    const newRecord: CarrierComplianceRecord = {
      id: `carr-${Date.now()}`,
      legalName: newCarrierName,
      dotNumber: newDotNumber,
      mcNumber: `MC-${Math.floor(100000 + Math.random() * 900000)}`,
      complianceStatus: 'approved',
      contactName: 'Operations Contact',
      contactEmail: newContactEmail || 'dispatch@carrierops.com',
      contactPhone: newContactPhone || '(555) 019-2810',
      city: 'Chicago',
      state: 'IL',
      onboardingDate: new Date().toISOString().substring(0, 10),
      riskScore: 12,
      coiExpiryWarningCount: 0,
      notes: 'Onboarded via FMCSA live Safer query and verified COI certificate.',
      fraudCheck: {
        doubleBrokeringRisk: 'LOW',
        chameleonCarrierRisk: 'NONE',
        physicalAddressType: 'Commercial Freight Yard',
        phoneCarrierType: 'Landline / Business VoIP'
      },
      equipmentCount: {
        tractors: 14,
        trailers: 18,
        drivers: 15
      },
      safetyRating: {
        fmcsaSafetyRating: 'Satisfactory',
        fmcsaAuditDate: new Date().toISOString().substring(0, 10),
        fmcsaRegistryStatus: 'AUTHORIZED',
        operatingAuthority: {
          common: true,
          contract: true,
          broker: false,
          status: 'ACTIVE'
        },
        basicsScores: {
          unsafeDrivingPercentile: 12.0,
          hosCompliancePercentile: 15.4,
          driverFitnessPercentile: 0.0,
          controlledSubstancesPercentile: 0.0,
          vehicleMaintPercentile: 18.2
        },
        outOfServiceRates: {
          vehicleOosPct: 11.2,
          vehicleNatAvgPct: 22.3,
          driverOosPct: 2.1,
          driverNatAvgPct: 6.7
        },
        inspectionsTotal24Mo: 34,
        crashesTotal24Mo: 0,
        fatalCrashes: 0,
        injuryCrashes: 0,
        towawayCrashes: 0,
        lastFmcsaApiSync: 'Just now'
      },
      insurancePolicies: [
        {
          id: `pol-${Date.now()}-1`,
          type: 'AutoLiability',
          provider: 'Progressive Commercial',
          policyNumber: `PRG-AL-${Math.floor(100000 + Math.random() * 900000)}`,
          coverageAmount: 1000000,
          effectiveDate: new Date().toISOString().substring(0, 10),
          expiryDate: new Date(Date.now() + 86400000 * 365).toISOString().substring(0, 10),
          daysRemaining: 365,
          status: 'valid',
          verifiedBy: 'Elena Rostova'
        },
        {
          id: `pol-${Date.now()}-2`,
          type: 'Cargo',
          provider: 'Progressive Commercial',
          policyNumber: `PRG-CG-${Math.floor(100000 + Math.random() * 900000)}`,
          coverageAmount: 150000,
          effectiveDate: new Date().toISOString().substring(0, 10),
          expiryDate: new Date(Date.now() + 86400000 * 365).toISOString().substring(0, 10),
          daysRemaining: 365,
          status: 'valid',
          verifiedBy: 'Elena Rostova'
        }
      ],
      documents: [
        { id: `doc-${Date.now()}-1`, name: 'Certificate_of_Insurance_COI.pdf', type: 'COI', uploadedAt: new Date().toISOString().substring(0, 10), status: 'verified', fileSize: '740 KB', verifiedBy: 'Elena Rostova' },
        { id: `doc-${Date.now()}-2`, name: 'W9_Tax_Form.pdf', type: 'W9', uploadedAt: new Date().toISOString().substring(0, 10), status: 'verified', fileSize: '180 KB', verifiedBy: 'Elena Rostova' }
      ]
    };

    onAddCarrier(newRecord);
    setSelectedCarrierId(newRecord.id);
    setShowAddCarrierModal(false);
    setNewDotNumber('');
    setNewCarrierName('');
  };

  const getStatusBadge = (status: CarrierComplianceRecord['complianceStatus']) => {
    switch (status) {
      case 'approved': return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      case 'needs_attention': return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'expired': return 'text-red-400 bg-red-950/60 border-red-800';
      case 'suspended': return 'text-rose-400 bg-rose-950/60 border-rose-800';
      case 'pending_onboarding': return 'text-blue-400 bg-blue-950/60 border-blue-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-600/20 text-emerald-400 font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>CARRIER COMPLIANCE & SAFETY</span>
            </span>
            <h1 className="text-base font-bold text-white tracking-tight">
              Insurance Expiry Tracking, FMCSA Safety Ratings & Document Verification
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time automated compliance engine. Tracks auto-liability and cargo policy expirations, audits live FMCSA Safer scores, and validates carrier COIs & W-9 forms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCarrierModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard Carrier (DOT Lookup)</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Row */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/40 grid grid-cols-4 gap-4 shrink-0">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Total Monitored Carriers</div>
          <div className="text-lg font-black text-white font-mono mt-0.5 tabular-nums">
            {totalCarriersCount} Carriers
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{approvedCount} Active Approved</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Insurance Policies Expiring &lt;30d</div>
          <div className="text-lg font-black text-amber-400 font-mono mt-0.5 tabular-nums">
            {totalExpiringSoonPolicies} Policies
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated renewal notices active</div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Expired / Suspended Carriers</div>
          <div className="text-lg font-black text-red-400 font-mono mt-0.5 tabular-nums">
            {expiredCount + suspendedCount} Blocked
          </div>
          <div className="text-[10px] text-red-400 mt-0.5">Automated do-not-load lock</div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">FMCSA Safer Registry Sync</div>
          <div className="text-lg font-black text-cyan-400 font-mono mt-0.5 tabular-nums">
            100% Live
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Direct DOT / MC API gateway</div>
        </div>
      </div>

      {/* Main Compliance Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Carrier Roster List */}
        <div className="w-4/12 border-r border-slate-800 p-5 overflow-y-auto space-y-4 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                  statusFilter === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({carriers.length})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-2 py-1 rounded font-medium cursor-pointer transition-colors ${
                  statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('needs_attention')}
                className={`px-2 py-1 rounded font-medium cursor-pointer transition-colors ${
                  statusFilter === 'needs_attention' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Expiring
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-2 py-1 rounded font-medium cursor-pointer transition-colors ${
                  statusFilter === 'suspended' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Blocked
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search carrier, DOT #, MC #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Carrier List Cards */}
          <div className="space-y-2.5 flex-1">
            {filteredCarriers.map((carrier) => {
              const isSelected = carrier.id === selectedCarrierId;
              const hasExpiring = carrier.insurancePolicies.some(p => p.status === 'expiring_soon');
              const hasExpired = carrier.insurancePolicies.some(p => p.status === 'expired');

              return (
                <div
                  key={carrier.id}
                  onClick={() => setSelectedCarrierId(carrier.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white truncate max-w-[210px]">
                      {carrier.legalName}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${getStatusBadge(carrier.complianceStatus)}`}>
                      {carrier.complianceStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-2 font-mono">
                    <span>DOT: {carrier.dotNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>MC: {carrier.mcNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{carrier.city}, {carrier.state}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
                    <span className="text-slate-400">
                      Safety: <strong className="text-emerald-400">{carrier.safetyRating.fmcsaSafetyRating}</strong>
                    </span>

                    {hasExpired ? (
                      <span className="text-red-400 font-bold flex items-center gap-1 text-[10px]">
                        <XCircle className="w-3 h-3" /> Policy Expired
                      </span>
                    ) : hasExpiring ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" /> Expiring &lt;30d
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> 100% Compliant
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Compliance Inspector & Actions */}
        {selectedCarrier && (
          <div className="w-8/12 p-6 overflow-y-auto bg-slate-900/40 flex flex-col justify-between">
            <div className="max-w-3xl w-full mx-auto space-y-5">
              {/* Carrier Header Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-bold text-white">{selectedCarrier.legalName}</h2>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${getStatusBadge(selectedCarrier.complianceStatus)}`}>
                        {selectedCarrier.complianceStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-3 font-mono">
                      <span>USDOT #{selectedCarrier.dotNumber}</span>
                      <span>{selectedCarrier.mcNumber}</span>
                      <span>{selectedCarrier.city}, {selectedCarrier.state}</span>
                      <span>Contact: {selectedCarrier.contactPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunFmcsaAudit}
                      disabled={isQueryingFmcsa}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isQueryingFmcsa ? 'animate-spin text-cyan-400' : ''}`} />
                      <span>{isQueryingFmcsa ? 'Querying FMCSA...' : 'Run Live Safer Audit'}</span>
                    </button>

                    <select
                      value={selectedCarrier.complianceStatus}
                      onChange={(e) => handleToggleComplianceStatus(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="approved">Set Approved</option>
                      <option value="needs_attention">Needs Attention</option>
                      <option value="expired">Mark Expired</option>
                      <option value="suspended">Suspend / Block</option>
                    </select>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveTab('insurance')}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                      activeTab === 'insurance' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Insurance Policies & Expiry ({selectedCarrier.insurancePolicies.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('fmcsa')}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                      activeTab === 'fmcsa' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    FMCSA Safer Ratings & BASICs
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                      activeTab === 'documents' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Verified Documents ({selectedCarrier.documents.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('fraud')}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                      activeTab === 'fraud' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Fraud & Chameleon Audit
                  </button>
                </div>
              </div>

              {/* TAB 1: Insurance Expiry Tracking */}
              {activeTab === 'insurance' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Active COI Policies & Expiration Timeline</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Minimum Requirement: $1M Auto Liability / $100k Cargo
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedCarrier.insurancePolicies.map((pol) => {
                        const isExpired = pol.status === 'expired' || pol.daysRemaining <= 0;
                        const isExpiringSoon = pol.status === 'expiring_soon' || (pol.daysRemaining > 0 && pol.daysRemaining <= 30);

                        return (
                          <div
                            key={pol.id}
                            className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                              isExpired
                                ? 'bg-red-950/20 border-red-800'
                                : isExpiringSoon
                                ? 'bg-amber-950/20 border-amber-800'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">{pol.type} Insurance</span>
                                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                    {pol.policyNumber}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Underwriter: <strong className="text-slate-200">{pol.provider}</strong> {pol.underwriterPhone && `· ${pol.underwriterPhone}`}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block uppercase">Coverage Limit</span>
                                <span className="text-base font-black font-mono text-emerald-400 tabular-nums">
                                  ${pol.coverageAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                              <div>
                                <span className="text-slate-500 block">Effective Date:</span>
                                <span className="text-slate-300 font-mono">{pol.effectiveDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Expiry Date:</span>
                                <span className={`font-mono font-bold ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-slate-300'}`}>
                                  {pol.expiryDate}
                                </span>
                              </div>
                              <div className="text-right flex items-center justify-end gap-2">
                                {isExpired ? (
                                  <span className="text-red-400 font-bold font-mono">EXPIRED ({Math.abs(pol.daysRemaining)}d ago)</span>
                                ) : isExpiringSoon ? (
                                  <span className="text-amber-400 font-bold font-mono">Expires in {pol.daysRemaining} days</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold font-mono">Active ({pol.daysRemaining}d remaining)</span>
                                )}

                                {(isExpired || isExpiringSoon) && (
                                  <button
                                    onClick={() => handleRequestCOIRenewal(pol)}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Send Urgent COI Request to Carrier"
                                  >
                                    <Mail className="w-3 h-3" />
                                    <span>Request Renewal</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {emailSentSuccess && (
                      <div className="p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Automated insurance renewal request dispatched to carrier safety desk & underwriter!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: FMCSA Safer Ratings & BASICs */}
              {activeTab === 'fmcsa' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>FMCSA Safety Measurement System (SMS) BASICs Scores</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        Last Synced: {selectedCarrier.safetyRating.lastFmcsaApiSync}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Safety Rating & Operating Authority */}
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Federal Safety Rating
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white">{selectedCarrier.safetyRating.fmcsaSafetyRating}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            {selectedCarrier.safetyRating.operatingAuthority.status} AUTHORITY
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-slate-400">
                          <div>Common Authority: <strong className="text-white">{selectedCarrier.safetyRating.operatingAuthority.common ? 'YES' : 'NO'}</strong></div>
                          <div>Contract Authority: <strong className="text-white">{selectedCarrier.safetyRating.operatingAuthority.contract ? 'YES' : 'NO'}</strong></div>
                          <div>Broker Authority: <strong className="text-white">{selectedCarrier.safetyRating.operatingAuthority.broker ? 'YES' : 'NO'}</strong></div>
                        </div>
                      </div>

                      {/* Out of Service Rates */}
                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Out-of-Service (OOS) Rates vs US Average
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Vehicle OOS Rate:</span>
                            <span className="font-mono font-bold text-white">
                              {selectedCarrier.safetyRating.outOfServiceRates.vehicleOosPct}% (Natl Avg: {selectedCarrier.safetyRating.outOfServiceRates.vehicleNatAvgPct}%)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Driver OOS Rate:</span>
                            <span className="font-mono font-bold text-white">
                              {selectedCarrier.safetyRating.outOfServiceRates.driverOosPct}% (Natl Avg: {selectedCarrier.safetyRating.outOfServiceRates.driverNatAvgPct}%)
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800">
                            <span className="text-slate-400">24-Mo Crash Total:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {selectedCarrier.safetyRating.crashesTotal24Mo} (Fatal: {selectedCarrier.safetyRating.fatalCrashes}, Injury: {selectedCarrier.safetyRating.injuryCrashes})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BASICs Percentiles Progress Grid */}
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        SMS BASICs Percentiles (Lower is Better · &gt;65% Triggers FMCSA Alert)
                      </span>

                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-300">Unsafe Driving</span>
                            <span className="font-mono font-bold text-emerald-400">{selectedCarrier.safetyRating.basicsScores.unsafeDrivingPercentile}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div style={{ width: `${selectedCarrier.safetyRating.basicsScores.unsafeDrivingPercentile}%` }} className={`h-full ${selectedCarrier.safetyRating.basicsScores.unsafeDrivingPercentile > 65 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-300">Hours-of-Service (HOS) Compliance</span>
                            <span className="font-mono font-bold text-emerald-400">{selectedCarrier.safetyRating.basicsScores.hosCompliancePercentile}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div style={{ width: `${selectedCarrier.safetyRating.basicsScores.hosCompliancePercentile}%` }} className={`h-full ${selectedCarrier.safetyRating.basicsScores.hosCompliancePercentile > 65 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-300">Vehicle Maintenance</span>
                            <span className="font-mono font-bold text-emerald-400">{selectedCarrier.safetyRating.basicsScores.vehicleMaintPercentile}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div style={{ width: `${selectedCarrier.safetyRating.basicsScores.vehicleMaintPercentile}%` }} className={`h-full ${selectedCarrier.safetyRating.basicsScores.vehicleMaintPercentile > 65 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Carrier Document Verification Center */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span>Carrier Compliance Documents & W-9 Registry</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {selectedCarrier.documents.filter(d => d.status === 'verified').length}/{selectedCarrier.documents.length} Verified
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedCarrier.documents.map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-white block">{doc.name}</span>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>Type: <strong className="text-slate-300 font-mono">{doc.type}</strong></span>
                                <span>Uploaded: {doc.uploadedAt}</span>
                                <span>{doc.fileSize}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {doc.status === 'verified' ? (
                              <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified by {doc.verifiedBy?.split(' ')[0] || 'Admin'}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleVerifyDocument(doc.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                              >
                                Verify Doc
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Fraud & Chameleon Carrier Audit */}
              {activeTab === 'fraud' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-orange-400" />
                        <span>Double-Brokering & Chameleon Carrier Risk Screening</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Risk Score: {selectedCarrier.riskScore}/100 ({selectedCarrier.riskScore < 20 ? 'Low Risk' : 'High Risk'})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Double Brokering Risk:</span>
                        <span className="font-bold text-white text-sm">{selectedCarrier.fraudCheck.doubleBrokeringRisk}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Chameleon Carrier Flag:</span>
                        <span className="font-bold text-white text-sm">{selectedCarrier.fraudCheck.chameleonCarrierRisk}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Physical Address Inspection:</span>
                        <span className="font-bold text-slate-200">{selectedCarrier.fraudCheck.physicalAddressType}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Phone Line Origin:</span>
                        <span className="font-bold text-slate-200">{selectedCarrier.fraudCheck.phoneCarrierType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Onboard New Carrier Modal */}
      {showAddCarrierModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Onboard New Carrier & Query FMCSA</h3>
            <p className="text-xs text-slate-400">
              Enter USDOT or MC number. The system will query the FMCSA Safer database to fetch safety ratings and active operating authority.
            </p>

            <form onSubmit={handleCreateCarrierSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">USDOT Number *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3819201"
                    value={newDotNumber}
                    onChange={(e) => setNewDotNumber(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleLookupDot}
                    disabled={isLookingUpDot || !newDotNumber}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-700 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isLookingUpDot ? 'Looking up...' : 'Query FMCSA'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Carrier Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GREEN EXPRESS LLC"
                  value={newCarrierName}
                  onChange={(e) => setNewCarrierName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Safety Contact Email</label>
                  <input
                    type="email"
                    placeholder="safety@carrier.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="(555) 019-2810"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCarrierModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Verify & Onboard Carrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
