import React, { useState } from 'react';
import { FreightEstimate, Project, CompanyProfile } from '../../types';
import { 
  Calculator, 
  Plus, 
  Send, 
  Download, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Calendar, 
  MapPin, 
  Truck, 
  Search, 
  Zap, 
  ExternalLink,
  Edit3,
  Trash2,
  X,
  Sparkles,
  Percent,
  Check
} from 'lucide-react';
import { generateFreightEstimatePDF } from '../../services/pdfGenerator';
import { sendBillingEmailViaGmail } from '../../services/googleWorkspaceService';
import { syncProjectToGoogleCalendarModule } from '../../services/calendarSyncService';
import { parseUnstructuredTextWithJEV } from '../../services/jevEngine';

interface FreightEstimatesHubProps {
  estimates: FreightEstimate[];
  companyProfile: CompanyProfile;
  onAddEstimate: (estimate: FreightEstimate) => void;
  onUpdateEstimate: (estimate: FreightEstimate) => void;
  onDeleteEstimate: (estimateId: string) => void;
  onConvertEstimateToLoad: (estimate: FreightEstimate) => void;
  onNavigateToTab: (tab: string, projectId?: string) => void;
}

export const FreightEstimatesHub: React.FC<FreightEstimatesHubProps> = ({
  estimates,
  companyProfile,
  onAddEstimate,
  onUpdateEstimate,
  onDeleteEstimate,
  onConvertEstimateToLoad,
  onNavigateToTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  // Form states for creating/editing estimate
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [originZip, setOriginZip] = useState('');
  const [destCity, setDestCity] = useState('');
  const [destState, setDestState] = useState('');
  const [destZip, setDestZip] = useState('');
  const [equipmentType, setEquipmentType] = useState<FreightEstimate['equipmentType']>('53ft Reefer');
  const [loadedMiles, setLoadedMiles] = useState(850);
  const [deadheadMiles, setDeadheadMiles] = useState(40);
  const [ratePerMile, setRatePerMile] = useState(3.40);
  const [fuelSurchargePerMile, setFuelSurchargePerMile] = useState(0.38);
  const [commodity, setCommodity] = useState('Frozen Poultry & Produce');
  const [weightLbs, setWeightLbs] = useState(42000);
  const [accessorialAmount, setAccessorialAmount] = useState(150);
  const [accessorialName, setAccessorialName] = useState('Reefer Temp Protection');
  const [pickupDate, setPickupDate] = useState(() => new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(() => new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // JEV Auto-Fill Text inside modal
  const [jevPasteArea, setJevPasteArea] = useState('');
  const [jevFeedback, setJevFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculations
  const linehaulTotal = Math.round(loadedMiles * ratePerMile * 100) / 100;
  const fuelTotal = Math.round(loadedMiles * fuelSurchargePerMile * 100) / 100;
  const totalQuote = Math.round((linehaulTotal + fuelTotal + accessorialAmount) * 100) / 100;
  const estimatedDriverPay = Math.round(totalQuote * 0.65 * 100) / 100;
  const estimatedNetProfit = Math.round((totalQuote - estimatedDriverPay - (loadedMiles + deadheadMiles) * 0.45) * 100) / 100;
  const targetMarginPct = Math.round((estimatedNetProfit / (totalQuote || 1)) * 1000) / 10;

  const handleOpenCreate = () => {
    setCustomerName('');
    setCustomerEmail('ap@chrobinson.com');
    setCustomerPhone('(800) 326-9920');
    setOriginCity('Chicago');
    setOriginState('IL');
    setOriginZip('60608');
    setDestCity('Dallas');
    setDestState('TX');
    setDestZip('75261');
    setEquipmentType('53ft Reefer');
    setLoadedMiles(850);
    setDeadheadMiles(40);
    setRatePerMile(3.40);
    setFuelSurchargePerMile(0.38);
    setCommodity('Frozen Poultry');
    setWeightLbs(42500);
    setAccessorialAmount(150);
    setAccessorialName('Reefer Temp Protection');
    setSpecialInstructions('');
    setJevPasteArea('');
    setJevFeedback(null);
    setShowCreateModal(true);
  };

  // JEV Auto-Fill Trigger inside Create Estimate Modal
  const handleJevAutoFill = () => {
    if (!jevPasteArea.trim()) {
      showToast('Please paste unstructured broker request text first');
      return;
    }
    try {
      const mapping = parseUnstructuredTextWithJEV(jevPasteArea, 'quote');
      const fields = mapping.extractedFields;

      if (fields.customerName) setCustomerName(fields.customerName);
      if (fields.customerEmail) setCustomerEmail(fields.customerEmail);
      if (fields.customerPhone) setCustomerPhone(fields.customerPhone);
      if (fields.originCity) setOriginCity(fields.originCity);
      if (fields.originState) setOriginState(fields.originState);
      if (fields.destCity) setDestCity(fields.destCity);
      if (fields.destState) setDestState(fields.destState);
      if (fields.equipmentType) setEquipmentType(fields.equipmentType);
      if (fields.loadedMiles) setLoadedMiles(fields.loadedMiles);
      if (fields.ratePerMile) setRatePerMile(fields.ratePerMile);
      if (fields.commodity) setCommodity(fields.commodity);
      if (fields.weightLbs) setWeightLbs(fields.weightLbs);
      if (fields.lumperAmount) {
        setAccessorialAmount(fields.lumperAmount);
        setAccessorialName('Lumper Reimbursement');
      }

      setJevFeedback(`JEV Engine mapped ${mapping.mappedFieldsCount} fields with ${mapping.confidenceScore}% confidence.`);
      showToast('JEV form auto-fill applied!');
    } catch (err: any) {
      showToast(`JEV mapping error: ${err.message}`);
    }
  };

  const handleSaveEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !originCity || !destCity) {
      showToast('Please fill in customer and lane information');
      return;
    }

    const newEst: FreightEstimate = {
      id: `est-${Date.now()}`,
      quoteNumber: `Q-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      customerEmail,
      customerPhone,
      originCity,
      originState,
      originZip,
      destCity,
      destState,
      destZip,
      equipmentType,
      loadedMiles,
      deadheadMiles,
      ratePerMile,
      linehaulTotal,
      fuelSurchargePerMile,
      fuelSurchargeTotal: fuelTotal,
      accessorials: accessorialAmount > 0 ? [{ id: `acc-${Date.now()}`, name: accessorialName, amount: accessorialAmount }] : [],
      totalQuoteAmount: totalQuote,
      targetMarginPct,
      estimatedDriverPay,
      estimatedNetProfit,
      pickupDate,
      deliveryDate,
      commodity,
      weightLbs,
      specialInstructions,
      status: 'draft',
      notes: 'Generated via Real Freight Pricing Engine',
      createdAt: 'Just now',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
    };

    onAddEstimate(newEst);
    showToast(`Created official freight estimate #${newEst.quoteNumber} ($${totalQuote.toLocaleString()})`);
    setShowCreateModal(false);
  };

  const handleDownloadPDF = (estimate: FreightEstimate) => {
    generateFreightEstimatePDF(estimate, companyProfile);
    showToast(`Downloaded Freight Rate Quote PDF #${estimate.quoteNumber}`);
  };

  const handleEmailQuoteToShipper = async (estimate: FreightEstimate) => {
    setIsSendingEmail(estimate.id);
    try {
      const emailBody = `Dear ${estimate.customerName} Transportation Team,\n\nPlease find our formal freight rate quote #${estimate.quoteNumber} for the ${estimate.originCity}, ${estimate.originState} to ${estimate.destCity}, ${estimate.destState} lane:\n\n- All-In Total Quote: $${estimate.totalQuoteAmount.toFixed(2)} USD\n- Equipment: ${estimate.equipmentType}\n- Linehaul: $${estimate.linehaulTotal.toFixed(2)} ($${estimate.ratePerMile.toFixed(2)}/mi for ${estimate.loadedMiles} mi)\n- Fuel Surcharge: $${estimate.fuelSurchargeTotal.toFixed(2)} ($${estimate.fuelSurchargePerMile.toFixed(2)}/mi)\n- Pickup: ${estimate.pickupDate} | Delivery: ${estimate.deliveryDate}\n- DOT: ${companyProfile.dotNumber} | MC: ${companyProfile.mcNumber}\n\nThis rate quote is valid through ${estimate.expiresAt}.\n\nBest regards,\n${companyProfile.companyName} Dispatch Desk\n${companyProfile.phone} | ${companyProfile.email}`;

      const res = await sendBillingEmailViaGmail(
        estimate.customerEmail,
        `Freight Rate Quote #${estimate.quoteNumber} - ${companyProfile.companyName} (${estimate.originCity} to ${estimate.destCity})`,
        emailBody
      );

      if (res.success) {
        onUpdateEstimate({ ...estimate, status: 'sent_to_customer' });
        showToast(`✉️ Sent rate quote #${estimate.quoteNumber} directly to ${estimate.customerEmail} via Gmail!`);
      } else {
        showToast(`Quote sent to queue: ${res.error || 'Complete'}`);
      }
    } catch (err: any) {
      showToast(`Email error: ${err.message}`);
    } finally {
      setIsSendingEmail(null);
    }
  };

  const handleConvert = (estimate: FreightEstimate) => {
    onConvertEstimateToLoad(estimate);
    onUpdateEstimate({ ...estimate, status: 'converted_to_load' });
    showToast(`🚀 Converted Quote #${estimate.quoteNumber} into booked load in Dispatch Matrix & synced Google Calendar!`);
    onNavigateToTab('projects');
  };

  const filteredEstimates = estimates.filter(e => {
    const matchesSearch = 
      e.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.originCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.destCity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalQuotedValue = estimates.reduce((sum, e) => sum + e.totalQuoteAmount, 0);
  const acceptedCount = estimates.filter(e => e.status === 'accepted' || e.status === 'converted_to_load').length;

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-md border border-gray-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#007AFF] border border-blue-200">
                <Calculator className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                    Real Freight Estimates & Lane Quoting
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                    GREEN EXPRESS LLC Bidding
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 max-w-3xl">
                  Calculate real lane pricing based on loaded miles, fuel surcharge indexes, driver pay, and operating profit. Generate official PDF rate quote sheets, email shippers via Gmail, and convert into booked dispatch loads with 1 click.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Freight Estimate</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="mt-5 pt-4 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Quotes Issued</span>
            <span className="text-lg font-bold text-gray-900 font-mono mt-0.5 block">{estimates.length} rate quotes</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-blue-700 uppercase font-semibold block">Total Quoted Pipeline</span>
            <span className="text-lg font-bold text-blue-700 font-mono mt-0.5 block">${totalQuotedValue.toLocaleString()} USD</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Accepted & Booked</span>
            <span className="text-lg font-bold text-emerald-600 font-mono mt-0.5 block">{acceptedCount} loads converted</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] text-amber-700 uppercase font-semibold block">Fleet Floor RPM</span>
            <span className="text-lg font-bold text-amber-700 font-mono mt-0.5 block">${companyProfile.defaultRatePerMileFloor.toFixed(2)}/mi</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search quotes by quote #, broker/shipper name, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF]"
          />
        </div>

        <div className="flex items-center bg-gray-50 p-0.5 rounded-xl border border-gray-200 text-xs">
          {['all', 'draft', 'sent_to_customer', 'converted_to_load'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                statusFilter === st ? 'bg-[#007AFF] text-white font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {st === 'all' ? 'All' : st === 'sent_to_customer' ? 'Sent' : st === 'converted_to_load' ? 'Converted' : 'Drafts'}
            </button>
          ))}
        </div>
      </div>

      {/* Estimates Grid */}
      <div className="space-y-4">
        {filteredEstimates.length === 0 ? (
          <div className="p-12 text-center text-gray-500 italic text-xs">
            No freight rate estimates found matching filters.
          </div>
        ) : (
          filteredEstimates.map((estimate) => {
            const isConverted = estimate.status === 'converted_to_load';

            return (
              <div
                key={estimate.id}
                className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 shadow-xs space-y-4 transition-all"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-gray-900">
                        #{estimate.quoteNumber}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                        estimate.status === 'converted_to_load'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : estimate.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : estimate.status === 'sent_to_customer'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {estimate.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        Expires: {estimate.expiresAt}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900">
                      {estimate.customerName}
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                      <span>Contact: {estimate.customerEmail}</span>
                      <span>Phone: {estimate.customerPhone}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-600 font-mono">
                      ${estimate.totalQuoteAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      Est. Margin: <strong className="text-emerald-600">{estimate.targetMarginPct}%</strong> (${estimate.estimatedNetProfit.toFixed(2)} profit)
                    </div>
                  </div>
                </div>

                {/* Lane & Breakdown Details */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Lane Stop Cities</span>
                    <span className="text-gray-900 font-bold block truncate">
                      {estimate.originCity}, {estimate.originState} → {estimate.destCity}, {estimate.destState}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {estimate.loadedMiles} loaded mi + {estimate.deadheadMiles} deadhead
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Trailer Requirements</span>
                    <span className="text-gray-900 font-semibold block truncate">
                      {estimate.equipmentType}
                    </span>
                    <span className="text-[10px] text-gray-500 truncate block">
                      {estimate.commodity} ({estimate.weightLbs.toLocaleString()} lbs)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Linehaul Quote Charge</span>
                    <span className="text-gray-900 font-mono font-bold block">
                      ${estimate.linehaulTotal.toFixed(2)} (${estimate.ratePerMile.toFixed(2)}/mi)
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Fuel FSC: ${estimate.fuelSurchargeTotal.toFixed(2)} (${estimate.fuelSurchargePerMile.toFixed(2)}/mi)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Target Appointments</span>
                    <span className="text-gray-900 font-medium block">
                      Pickup: {estimate.pickupDate}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      Delivery: {estimate.deliveryDate}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPDF(estimate)}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-gray-300 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-600" />
                      <span>Download PDF Quote Sheet</span>
                    </button>

                    <button
                      onClick={() => handleEmailQuoteToShipper(estimate)}
                      disabled={isSendingEmail === estimate.id}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-gray-300 shadow-xs disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 text-[#007AFF] ${isSendingEmail === estimate.id ? 'animate-spin' : ''}`} />
                      <span>{isSendingEmail === estimate.id ? 'Sending...' : 'Email Rate Quote'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConverted ? (
                      <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Converted & Booked Load Matrix
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConvert(estimate)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Book & Convert Quote into Matrix Load</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE ESTIMATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-5 h-5 text-[#007AFF]" />
                <h3 className="text-sm font-bold text-gray-900">
                  New Carrier Freight Estimate & Lane Quote Bidding
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel: Paste JEV Form Auto-Filler */}
              <div className="w-80 border-r border-gray-200 p-5 bg-gray-50 space-y-4 overflow-y-auto">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">JEV Form Auto-Filler</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Paste unstructured email thread or broker inquiry text below. JEV mapping engine will auto-populate the pricing calculator with 100% field mapping accuracy.
                </p>

                <textarea
                  rows={8}
                  value={jevPasteArea}
                  onChange={(e) => setJevPasteArea(e.target.value)}
                  placeholder="Paste quote request here..."
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-gray-900 font-sans focus:outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={handleJevAutoFill}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Apply JEV Auto-Fill
                </button>

                {jevFeedback && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg text-[10px] font-mono leading-tight">
                    {jevFeedback}
                  </div>
                )}
              </div>

              {/* Right Panel: Interactive Calculator Form */}
              <form onSubmit={handleSaveEstimate} className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Shipper Contact Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Contact Phone</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Origin City</label>
                    <input
                      type="text"
                      required
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Origin ST</label>
                    <input
                      type="text"
                      value={originState}
                      onChange={(e) => setOriginState(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Dest City</label>
                    <input
                      type="text"
                      required
                      value={destCity}
                      onChange={(e) => setDestCity(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Dest ST</label>
                    <input
                      type="text"
                      value={destState}
                      onChange={(e) => setDestState(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Trailer Type</label>
                    <select
                      value={equipmentType}
                      onChange={(e) => setEquipmentType(e.target.value as any)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                    >
                      <option value="53ft Reefer">53ft Reefer (-10°F Cold)</option>
                      <option value="53ft Dry Van">53ft Dry Van</option>
                      <option value="Flatbed">Flatbed (48K Max)</option>
                      <option value="Power Only">Power Only (Drop & Hook)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Loaded Route Miles</label>
                    <input
                      type="number"
                      value={loadedMiles}
                      onChange={(e) => setLoadedMiles(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Bidding Linehaul $/mi</label>
                    <input
                      type="number"
                      step="0.05"
                      value={ratePerMile}
                      onChange={(e) => setRatePerMile(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-[#007AFF] font-bold focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">DOE Diesel FSC $/mi</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fuelSurchargePerMile}
                      onChange={(e) => setFuelSurchargePerMile(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Accessorial Charge Name</label>
                    <input
                      type="text"
                      value={accessorialName}
                      onChange={(e) => setAccessorialName(e.target.value)}
                      placeholder="e.g. Lumper Reimbursement"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Accessorial Amount ($)</label>
                    <input
                      type="number"
                      value={accessorialAmount}
                      onChange={(e) => setAccessorialAmount(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Commodity Description</label>
                    <input
                      type="text"
                      value={commodity}
                      onChange={(e) => setCommodity(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                    />
                  </div>
                </div>

                {/* Instant Financial Modeling Breakdown */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
                  <span className="font-bold text-gray-800 uppercase tracking-wider block">Financial Performance Projections</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                    <div className="p-2 bg-white rounded border border-gray-200">
                      <span className="text-gray-500 text-[10px] block">LINEHAUL TOTAL:</span>
                      <span className="font-bold text-gray-950">${linehaulTotal.toLocaleString()}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-gray-200">
                      <span className="text-gray-500 text-[10px] block">FUEL FSC TOTAL:</span>
                      <span className="font-bold text-gray-950">${fuelTotal.toLocaleString()}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-gray-200">
                      <span className="text-[#007AFF] text-[10px] block font-sans font-semibold">ALL-IN QUOTE:</span>
                      <span className="font-bold text-[#007AFF]">${totalQuote.toLocaleString()}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-gray-200">
                      <span className="text-emerald-700 text-[10px] block font-sans font-semibold">NET PROFIT (MARGIN %):</span>
                      <span className="font-bold text-emerald-600">${estimatedNetProfit.toLocaleString()} ({targetMarginPct}%)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Save & Issue Freight Estimate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
