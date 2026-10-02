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
  Trash2
} from 'lucide-react';
import { generateFreightEstimatePDF } from '../../services/pdfGenerator';
import { sendBillingEmailViaGmail } from '../../services/googleWorkspaceService';
import { syncProjectToGoogleCalendarModule } from '../../services/calendarSyncService';

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
  const [ratePerMile, setRatePerMile] = useState(3.20);
  const [fuelSurchargePerMile, setFuelSurchargePerMile] = useState(0.38);
  const [commodity, setCommodity] = useState('Consumer Freight');
  const [weightLbs, setWeightLbs] = useState(42000);
  const [accessorialAmount, setAccessorialAmount] = useState(150);
  const [accessorialName, setAccessorialName] = useState('Reefer Temp Protection');
  const [pickupDate, setPickupDate] = useState(() => new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(() => new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');

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
    setCustomerEmail('');
    setCustomerPhone('');
    setOriginCity('');
    setOriginState('');
    setOriginZip('');
    setDestCity('');
    setDestState('');
    setDestZip('');
    setEquipmentType('53ft Reefer');
    setLoadedMiles(500);
    setDeadheadMiles(20);
    setRatePerMile(3.50);
    setFuelSurchargePerMile(0.38);
    setCommodity('');
    setWeightLbs(40000);
    setAccessorialAmount(0);
    setAccessorialName('');
    setSpecialInstructions('');
    setShowCreateModal(true);
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
        showToast(`✉️ Sent formal rate quote #${estimate.quoteNumber} directly to ${estimate.customerEmail} via Gmail!`);
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
    showToast(`🚀 Converted Quote #${estimate.quoteNumber} into live booked load in Dispatch Matrix & synced Google Calendar!`);
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
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    Real Freight Estimates & Lane Quoting
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                    Official Carrier Bidding
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Calculate real lane pricing based on loaded miles, fuel surcharge indexes, driver pay, and operating profit. Generate official PDF rate quote sheets, email shippers via Gmail, and convert into booked dispatch loads with 1 click.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Freight Estimate</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Quotes Issued</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">{estimates.length} rate quotes</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-blue-400 uppercase font-semibold block">Total Quoted Pipeline</span>
            <span className="text-lg font-bold text-blue-300 font-mono mt-0.5 block">${totalQuotedValue.toLocaleString()} USD</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Accepted & Booked</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">{acceptedCount} loads converted</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase font-semibold block">Fleet Floor RPM</span>
            <span className="text-lg font-bold text-amber-300 font-mono mt-0.5 block">${companyProfile.defaultRatePerMileFloor.toFixed(2)}/mi</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search quotes by quote #, broker/shipper name, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({estimates.length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'draft' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setStatusFilter('sent_to_customer')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'sent_to_customer' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sent to Customer
          </button>
          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'accepted' || statusFilter === 'converted_to_load' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Accepted / Booked
          </button>
        </div>
      </div>

      {/* Estimates Grid */}
      <div className="space-y-4">
        {filteredEstimates.map((estimate) => {
          const isConverted = estimate.status === 'converted_to_load';

          return (
            <div
              key={estimate.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 transition-all"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-white">
                      #{estimate.quoteNumber}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      estimate.status === 'converted_to_load'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : estimate.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : estimate.status === 'sent_to_customer'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {estimate.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Expires: {estimate.expiresAt}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {estimate.customerName}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>Contact: {estimate.customerEmail}</span>
                    <span>Phone: {estimate.customerPhone}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    ${estimate.totalQuoteAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Est. Margin: <strong className="text-emerald-400">{estimate.targetMarginPct}%</strong> (${estimate.estimatedNetProfit.toFixed(2)} net profit)
                  </div>
                </div>
              </div>

              {/* Lane & Breakdown Details */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Lane</span>
                  <span className="text-slate-200 font-bold block truncate">
                    {estimate.originCity}, {estimate.originState} → {estimate.destCity}, {estimate.destState}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {estimate.loadedMiles} loaded mi + {estimate.deadheadMiles} deadhead
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Equipment & Freight</span>
                  <span className="text-slate-200 font-semibold block truncate">
                    {estimate.equipmentType}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {estimate.commodity} ({estimate.weightLbs.toLocaleString()} lbs)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Linehaul Rate</span>
                  <span className="text-slate-200 font-mono font-bold block">
                    ${estimate.linehaulTotal.toFixed(2)} (${estimate.ratePerMile.toFixed(2)}/mi)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Fuel: ${estimate.fuelSurchargeTotal.toFixed(2)} (${estimate.fuelSurchargePerMile.toFixed(2)}/mi)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Transit Dates</span>
                  <span className="text-slate-200 font-medium block">
                    Pickup: {estimate.pickupDate}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Delivery: {estimate.deliveryDate}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF(estimate)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Quote</span>
                  </button>

                  <button
                    onClick={() => handleEmailQuoteToShipper(estimate)}
                    disabled={isSendingEmail === estimate.id}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 text-blue-400 ${isSendingEmail === estimate.id ? 'animate-spin' : ''}`} />
                    <span>{isSendingEmail === estimate.id ? 'Sending...' : 'Email to Shipper'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isConverted ? (
                    <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Converted to Booked Load
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvert(estimate)}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Convert to Booked TMS Load</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Freight Estimate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Create Real Freight Rate Estimate
                  </h2>
                  <p className="text-xs text-slate-400">
                    Calculates linehaul, fuel surcharge index, and operating margin.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEstimate} className="p-6 space-y-4 text-xs">
              {/* Shipper Details */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Shipper / Broker Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Billing Email (For Quote) *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Lane Specs */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-slate-300 font-bold block text-xs">Lane & Route Specifications:</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Origin City"
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="ST"
                      value={originState}
                      onChange={(e) => setOriginState(e.target.value.toUpperCase())}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs text-center font-mono focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Dest City"
                      value={destCity}
                      onChange={(e) => setDestCity(e.target.value)}
                      className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="ST"
                      value={destState}
                      onChange={(e) => setDestState(e.target.value.toUpperCase())}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs text-center font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Loaded Miles (mi)</label>
                    <input
                      type="number"
                      value={loadedMiles}
                      onChange={(e) => setLoadedMiles(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Equipment</label>
                    <select
                      value={equipmentType}
                      onChange={(e) => setEquipmentType(e.target.value as FreightEstimate['equipmentType'])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="53ft Reefer">53ft Reefer</option>
                      <option value="53ft Dry Van">53ft Dry Van</option>
                      <option value="Flatbed">Flatbed</option>
                      <option value="Stepdeck">Stepdeck</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Commodity</label>
                    <input
                      type="text"
                      value={commodity}
                      onChange={(e) => setCommodity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Fuel Index */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-slate-300 font-bold block text-xs">Rate & Margin Analysis:</span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Linehaul Rate ($/mi)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={ratePerMile}
                      onChange={(e) => setRatePerMile(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Fuel Surcharge ($/mi)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fuelSurchargePerMile}
                      onChange={(e) => setFuelSurchargePerMile(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Accessorials ($)</label>
                    <input
                      type="number"
                      value={accessorialAmount}
                      onChange={(e) => setAccessorialAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Real-time Calculation Summary */}
                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-300 uppercase block font-semibold">Total Customer Quote</span>
                    <span className="text-base font-bold text-white font-mono">${totalQuote.toFixed(2)} USD</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 uppercase block font-semibold">Estimated Net Margin</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{targetMarginPct}% (${estimatedNetProfit.toFixed(2)})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Freight Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
