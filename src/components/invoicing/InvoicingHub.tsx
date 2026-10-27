import React, { useState } from 'react';
import { 
  ProposedInvoice, 
  Project,
  CompanyProfile,
  InvoiceLineItem,
  ScannedDocument,
  FreightEstimate
} from '../../types';
import { 
  ReceiptText, 
  ArrowRight, 
  Search, 
  Download, 
  Database, 
  Upload, 
  CheckCircle2, 
  Send, 
  FileCheck, 
  Clock, 
  Coins,
  Sparkles,
  RefreshCw,
  Printer,
  Plus,
  DollarSign,
  Landmark,
  Building2,
  Trash2,
  Check,
  FileText,
  ShieldCheck,
  AlertCircle,
  Eye,
  Edit3,
  Filter,
  FolderInput,
  Layers,
  Laptop,
  CheckSquare,
  Zap,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  TrendingUp,
  Tag,
  Truck,
  MapPin,
  Calendar,
  X,
  FileDown
} from 'lucide-react';
import { DEFAULT_COMPANY_PROFILE } from '../../data/realFleetData';
import { generateCarrierInvoicePDF } from '../../services/pdfGenerator';
import { sendEmailViaRealGmail } from '../../services/gmailIntegration';
import { sendBillingEmailViaGmail } from '../../services/googleWorkspaceService';
import { saveInvoiceToPythonDB, recordPaymentInPythonDB } from '../../services/pythonApiService';

interface InvoicingHubProps {
  invoices: ProposedInvoice[];
  projects: Project[];
  companyProfile?: CompanyProfile;
  onNavigateToStep: (step: string, projectId?: string) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: ProposedInvoice['status']) => void;
  onMigrateFromMyInvoice: (migratedInvoices: ProposedInvoice[]) => void;
  onAddInvoice?: (invoice: ProposedInvoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onAddProject?: (newProject: any) => void;
}

export interface SpotFreightBid {
  id: string;
  tenderNumber: string;
  brokerName: string;
  brokerEmail: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  pickupDate: string;
  deliveryDate: string;
  equipmentType: '53ft Reefer' | '53ft Dry Van' | 'Flatbed';
  loadedMiles: number;
  initialBrokerOffer: number;
  ourBidAmount: number;
  ratePerMile: number;
  status: 'won' | 'submitted' | 'countered' | 'lost';
  driverAssignment: string;
  notes: string;
}

const INITIAL_SPOT_BIDS: SpotFreightBid[] = [
  {
    id: 'bid-101',
    tenderNumber: 'TND-CHR-8910',
    brokerName: 'C.H. Robinson Worldwide',
    brokerEmail: 'loadbids@chrobinson.com',
    originCity: 'Fort Worth',
    originState: 'TX',
    destCity: 'Chicago',
    destState: 'IL',
    pickupDate: '2026-10-08',
    deliveryDate: '2026-10-10',
    equipmentType: '53ft Reefer',
    loadedMiles: 928,
    initialBrokerOffer: 3400,
    ourBidAmount: 3870,
    ratePerMile: 4.17,
    status: 'won',
    driverAssignment: 'Jesus Medina (Unit #106)',
    notes: 'Agreed at $3,870 all-in. High-value frozen cargo.'
  },
  {
    id: 'bid-102',
    tenderNumber: 'TND-TQL-4421',
    brokerName: 'Total Quality Logistics (TQL)',
    brokerEmail: 'spotops@tql.com',
    originCity: 'Dallas',
    originState: 'TX',
    destCity: 'Atlanta',
    destState: 'GA',
    pickupDate: '2026-10-09',
    deliveryDate: '2026-10-11',
    equipmentType: '53ft Dry Van',
    loadedMiles: 785,
    initialBrokerOffer: 2400,
    ourBidAmount: 2750,
    ratePerMile: 3.50,
    status: 'countered',
    driverAssignment: 'Jose Medina (Unit #101)',
    notes: 'Countered broker at $2,750. Waiting on final shipper approval.'
  },
  {
    id: 'bid-103',
    tenderNumber: 'TND-ECHO-7730',
    brokerName: 'Echo Global Logistics',
    brokerEmail: 'truckloads@echo.com',
    originCity: 'Houston',
    originState: 'TX',
    destCity: 'Denver',
    destState: 'CO',
    pickupDate: '2026-10-10',
    deliveryDate: '2026-10-13',
    equipmentType: '53ft Reefer',
    loadedMiles: 1040,
    initialBrokerOffer: 3800,
    ourBidAmount: 4250,
    ratePerMile: 4.08,
    status: 'submitted',
    driverAssignment: 'Luis Medina (Unit #102)',
    notes: 'Submitted bid with continuous temperature monitoring guaranteed.'
  },
  {
    id: 'bid-104',
    tenderNumber: 'TND-LAND-1192',
    brokerName: 'Landstar Ranger',
    brokerEmail: 'bids@landstar.com',
    originCity: 'San Antonio',
    originState: 'TX',
    destCity: 'Indianapolis',
    destState: 'IN',
    pickupDate: '2026-10-11',
    deliveryDate: '2026-10-14',
    equipmentType: '53ft Dry Van',
    loadedMiles: 1070,
    initialBrokerOffer: 2900,
    ourBidAmount: 3350,
    ratePerMile: 3.13,
    status: 'won',
    driverAssignment: 'Alfredo Medina (Unit #104)',
    notes: 'Rate lock confirmed. Direct carrier tender.'
  }
];

export const InvoicingHub: React.FC<InvoicingHubProps> = ({
  invoices,
  projects,
  companyProfile = DEFAULT_COMPANY_PROFILE,
  onNavigateToStep,
  onUpdateInvoiceStatus,
  onMigrateFromMyInvoice,
  onAddInvoice,
  onDeleteInvoice,
  onAddProject
}) => {
  // Navigation tabs: 'invoices' | 'bidding' | 'audit' | 'factoring'
  const [activeTab, setActiveTab] = useState<'invoices' | 'bidding' | 'audit' | 'factoring'>('invoices');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Invoices list state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<ProposedInvoice | null>(invoices[0] || null);

  // Spot Bidding state
  const [spotBids, setSpotBids] = useState<SpotFreightBid[]>(INITIAL_SPOT_BIDS);
  const [bidFilter, setBidFilter] = useState<'all' | 'won' | 'submitted' | 'countered'>('all');
  const [showNewBidModal, setShowNewBidModal] = useState(false);

  // New Bid Form State
  const [bidBroker, setBidBroker] = useState('C.H. Robinson Worldwide');
  const [bidBrokerEmail, setBidBrokerEmail] = useState('ap@chrobinson.com');
  const [bidOriginCity, setBidOriginCity] = useState('Fort Worth');
  const [bidOriginState, setBidOriginState] = useState('TX');
  const [bidDestCity, setBidDestCity] = useState('Chicago');
  const [bidDestState, setBidDestState] = useState('IL');
  const [bidEquipment, setBidEquipment] = useState<'53ft Reefer' | '53ft Dry Van' | 'Flatbed'>('53ft Reefer');
  const [bidMiles, setBidMiles] = useState(930);
  const [bidOffer, setBidOffer] = useState(3850);
  const [bidBrokerOriginal, setBidBrokerOriginal] = useState(3400);
  const [bidDriver, setBidDriver] = useState('Jesus Medina');

  // Manual New Invoice Modal State
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvNo, setNewInvNo] = useState(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newInvCustomer, setNewInvCustomer] = useState('C.H. Robinson Worldwide');
  const [newInvEmail, setNewInvEmail] = useState('ap@chrobinson.com');
  const [newInvLoadNo, setNewInvLoadNo] = useState('GE-982301');
  const [newInvLinehaul, setNewInvLinehaul] = useState(3450);
  const [newInvFuel, setNewInvFuel] = useState(420);
  const [newInvLumper, setNewInvLumper] = useState(0);
  const [newInvDetention, setNewInvDetention] = useState(0);
  const [newInvTerms, setNewInvTerms] = useState('Net 30 Days');

  // Factoring batch selection state
  const [selectedFactoringIds, setSelectedFactoringIds] = useState<string[]>([]);
  const [isSubmittingFactoring, setIsSubmittingFactoring] = useState(false);
  const [factoringCompany, setFactoringCompany] = useState<'TriumphPay' | 'RTS Financial' | 'Apex Capital'>('TriumphPay');

  // Gmail Dispatch state
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Calculations for Spot Bid Rate per mile
  const calculatedBidRPM = bidMiles > 0 ? Math.round((bidOffer / bidMiles) * 100) / 100 : 0;
  const estimatedDriverCut = Math.round(bidOffer * 0.65 * 100) / 100;
  const estimatedNetMargin = Math.round((bidOffer - estimatedDriverCut - (bidMiles * 0.45)) * 100) / 100;

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    const matchQuery = 
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.loadNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // Filtered bids
  const filteredBids = spotBids.filter(b => {
    const matchFilter = bidFilter === 'all' || b.status === bidFilter;
    const matchQuery = !searchQuery || 
      b.tenderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.brokerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.originCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.destCity.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchQuery;
  });

  // Financial metrics
  const totalBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalBalanceDue = invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.totalAmount, 0);
  const wonBidsCount = spotBids.filter(b => b.status === 'won').length;

  // Handle Create Spot Bid
  const handleSaveSpotBid = (e: React.FormEvent) => {
    e.preventDefault();
    const newBid: SpotFreightBid = {
      id: `bid-${Date.now()}`,
      tenderNumber: `TND-${bidBroker.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      brokerName: bidBroker,
      brokerEmail: bidBrokerEmail,
      originCity: bidOriginCity,
      originState: bidOriginState,
      destCity: bidDestCity,
      destState: bidDestState,
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      equipmentType: bidEquipment,
      loadedMiles: bidMiles,
      initialBrokerOffer: bidBrokerOriginal,
      ourBidAmount: bidOffer,
      ratePerMile: calculatedBidRPM,
      status: 'submitted',
      driverAssignment: `${bidDriver} (Assigned)`,
      notes: `Direct spot quote submitted at $${calculatedBidRPM}/mi.`
    };

    setSpotBids(prev => [newBid, ...prev]);
    showToast(`✅ Spot Bid #${newBid.tenderNumber} of $${newBid.ourBidAmount.toLocaleString()} submitted to ${bidBroker}!`);
    setShowNewBidModal(false);
  };

  // Convert Won Bid to Active Load & Proposed Invoice
  const handleConvertBidToLoad = (bid: SpotFreightBid) => {
    // 1. Create Invoice
    const totalAmount = bid.ourBidAmount;
    const linehaul = Math.round(totalAmount * 0.88);
    const fuel = totalAmount - linehaul;
    const invNo = `INV-${new Date().getFullYear()}-${bid.tenderNumber.slice(-4)}`;

    const newInv: ProposedInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNo,
      projectId: `prj-${Date.now()}`,
      loadNumber: `GE-${bid.tenderNumber.slice(-4)}`,
      customerName: bid.brokerName,
      customerEmail: bid.brokerEmail,
      billingAddress: 'Corporate Accounts Payable, PO Box 9801',
      paymentTerms: 'Net 30 Days',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      lineItems: [
        { id: 'li-1', description: `Linehaul: ${bid.originCity}, ${bid.originState} to ${bid.destCity}, ${bid.destState}`, type: 'linehaul', amount: linehaul, sourceDoc: 'RateConfirmation' },
        { id: 'li-2', description: 'Fuel Surcharge (DOE Diesel Index)', type: 'fuel_surcharge', amount: fuel, sourceDoc: 'RateConfirmation' }
      ],
      subtotal: totalAmount,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      status: 'needs_review',
      attachedDocIds: [],
      factoringStatus: 'eligible'
    };

    if (onAddInvoice) {
      onAddInvoice(newInv);
    }

    // 2. Add to active projects
    if (onAddProject) {
      onAddProject({
        code: `PRJ-${bid.tenderNumber.slice(-3)}`,
        loadNumber: newInv.loadNumber,
        customerName: bid.brokerName,
        customerCode: bid.brokerName.slice(0, 4).toUpperCase(),
        originCity: bid.originCity,
        originState: bid.originState,
        originAddress: `${bid.originCity}, ${bid.originState}`,
        destCity: bid.destCity,
        destState: bid.destState,
        destAddress: `${bid.destCity}, ${bid.destState}`,
        pickupDate: bid.pickupDate,
        deliveryDate: bid.deliveryDate,
        driverName: bid.driverAssignment.split(' ')[0] + ' ' + bid.driverAssignment.split(' ')[1],
        driverPhone: '(817) 592-1060',
        truckId: 'Unit #106',
        trailerId: 'TLR-54211',
        equipmentType: bid.equipmentType,
        linehaulPay: linehaul,
        fuelSurcharge: fuel,
        estimatedRevenue: totalAmount,
        status: 'in_transit',
        commodities: 'High-Value Commercial Freight',
        weightLbs: 42000,
        progress: 25
      });
    }

    // Update bid status to won
    setSpotBids(prev => prev.map(b => b.id === bid.id ? { ...b, status: 'won' } : b));
    showToast(`🎉 Bid Won! Load #${newInv.loadNumber} dispatched and Pre-Invoice #${invNo} created!`);
  };

  // Handle Manual Invoice Creation
  const handleCreateManualInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = newInvLinehaul + newInvFuel + newInvLumper + newInvDetention;
    const lineItems: InvoiceLineItem[] = [
      { id: 'li-1', description: `Freight Linehaul Charges`, type: 'linehaul', amount: newInvLinehaul, sourceDoc: 'RateConfirmation' },
      { id: 'li-2', description: `Fuel Surcharge (DOE Index)`, type: 'fuel_surcharge', amount: newInvFuel, sourceDoc: 'RateConfirmation' }
    ];

    if (newInvLumper > 0) {
      lineItems.push({ id: 'li-3', description: `Lumper Reimbursement (Pass-through)`, type: 'lumper_reimbursement', amount: newInvLumper, sourceDoc: 'LumperReceipt' });
    }
    if (newInvDetention > 0) {
      lineItems.push({ id: 'li-4', description: `Detention Dwell Time (Dock delay)`, type: 'detention', amount: newInvDetention, sourceDoc: 'RateConfirmation' });
    }

    const created: ProposedInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: newInvNo,
      projectId: `prj-${Date.now()}`,
      loadNumber: newInvLoadNo,
      customerName: newInvCustomer,
      customerEmail: newInvEmail,
      billingAddress: 'Corporate Accounts Payable, PO Box 9801',
      paymentTerms: newInvTerms,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      lineItems,
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: subtotal,
      amountPaid: 0,
      balanceDue: subtotal,
      status: 'approved',
      attachedDocIds: [],
      factoringStatus: 'eligible'
    };

    if (onAddInvoice) {
      onAddInvoice(created);
    }
    showToast(`✅ Invoice #${created.invoiceNumber} created and ready for factoring/dispatch!`);
    setShowNewInvoiceModal(false);
  };

  // Handle Factoring Submission Batch
  const handleSubmitFactoringBatch = () => {
    if (selectedFactoringIds.length === 0) {
      showToast('Please select at least one eligible invoice for factoring.');
      return;
    }

    setIsSubmittingFactoring(true);
    setTimeout(() => {
      setIsSubmittingFactoring(false);
      selectedFactoringIds.forEach(id => {
        onUpdateInvoiceStatus(id, 'invoiced');
      });
      showToast(`🏦 Batch Transmitted: ${selectedFactoringIds.length} invoices submitted to ${factoringCompany} with Notice of Assignment!`);
      setSelectedFactoringIds([]);
    }, 1200);
  };

  // Handle Download Invoice PDF
  const handleDownloadInvoicePDF = (inv: ProposedInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const proj = projects.find(p => p.id === inv.projectId);
    generateCarrierInvoicePDF(inv, companyProfile, proj);
    showToast(`📄 Downloaded Carrier Invoice PDF for #${inv.invoiceNumber}`);
  };

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = ['InvoiceNumber', 'LoadNumber', 'Customer', 'TotalAmount', 'BalanceDue', 'Status', 'IssueDate', 'DueDate'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      i.loadNumber,
      `"${i.customerName}"`,
      i.totalAmount.toFixed(2),
      i.balanceDue.toFixed(2),
      i.status,
      i.issueDate,
      i.dueDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `green_express_invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Invoices exported to CSV format.');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-hidden select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & METRICS BAR */}
      <div className="bg-white border-b border-[#E5E5EA] px-6 py-3.5 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                <span>Billing, Invoices & Freight Bidding</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  AR & Factoring Active
                </span>
              </h1>
              <p className="text-[11px] text-gray-500">
                Spot rate bidding, factoring submissions, and accounts receivable ledger for GREEN EXPRESS LLC.
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] border border-gray-200 flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total AR</span>
              <span className="font-extrabold text-gray-950 font-mono">${totalBilled.toLocaleString()}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Balance Due</span>
              <span className="font-extrabold text-amber-900 font-mono">${totalBalanceDue.toLocaleString()}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Collected</span>
              <span className="font-extrabold text-emerald-800 font-mono">${totalPaid.toLocaleString()}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-2">
              <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Bids Won</span>
              <span className="font-extrabold text-purple-900 font-mono">{wonBidsCount} Loads</span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <button
                onClick={() => setShowNewBidModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Place Spot Bid</span>
              </button>

              <button
                onClick={() => setShowNewInvoiceModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABS ROW */}
        <div className="mt-3 pt-3 border-t border-gray-150 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'invoices'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-[#F5F5F7] text-gray-600 hover:text-gray-950 border border-gray-200'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Invoices Ledger ({invoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bidding')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'bidding'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-[#F5F5F7] text-gray-600 hover:text-gray-950 border border-gray-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Spot Freight Bidding Matrix ({spotBids.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('factoring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'factoring'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-[#F5F5F7] text-gray-600 hover:text-gray-950 border border-gray-200'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Factoring & QuickPay (TriumphPay)</span>
            </button>
          </div>

          {/* Search & Export */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoice #, broker, tender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#F5F5F7] border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF] focus:bg-white w-52 transition-all font-medium"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Export Invoices to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT WORKSPACE */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* TAB 1: INVOICES LEDGER */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {['all', 'needs_review', 'approved', 'invoiced', 'paid'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                      statusFilter === st
                        ? 'bg-gray-900 text-white shadow-2xs'
                        : 'bg-white text-gray-600 hover:text-gray-950 border border-gray-200'
                    }`}
                  >
                    {st === 'all' ? 'All Invoices' : st === 'needs_review' ? 'Needs Review' : st === 'approved' ? 'Approved' : st === 'invoiced' ? 'Factored / Sent' : 'Paid'}
                  </button>
                ))}
              </div>

              <span className="text-xs text-gray-500 font-mono">
                Showing {filteredInvoices.length} of {invoices.length} billing packets
              </span>
            </div>

            {/* Invoices Table */}
            <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs text-gray-800">
                <thead className="bg-[#F5F5F7] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Load #</th>
                    <th className="py-3 px-4">Broker / Shipper Customer</th>
                    <th className="py-3 px-4">Issue / Due Date</th>
                    <th className="py-3 px-4">Payment Terms</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">PDF</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredInvoices.map((inv) => {
                    const isSelected = selectedInvoice?.id === inv.id;
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-extrabold text-gray-950">
                          #{inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          #{inv.loadNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {inv.customerName}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-600 font-mono">
                          {inv.issueDate} ➔ {inv.dueDate}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {inv.paymentTerms}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            inv.status === 'invoiced' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            inv.status === 'approved' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {inv.status === 'needs_review' ? 'Needs Review' : inv.status === 'approved' ? 'Approved' : inv.status === 'invoiced' ? 'Factored' : 'Paid'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-gray-950">
                          ${inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-amber-700">
                          ${inv.balanceDue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => handleDownloadInvoicePDF(inv, e)}
                            className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded text-[11px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                            title="Download PDF Invoice"
                          >
                            <FileDown className="w-3 h-3 text-blue-600" />
                            <span>PDF</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {inv.status !== 'paid' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateInvoiceStatus(inv.id, 'paid');
                                showToast(`Marked Invoice #${inv.invoiceNumber} as Paid!`);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-bold">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-400">
                        No invoices match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SPOT FREIGHT BIDDING MATRIX */}
        {activeTab === 'bidding' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {['all', 'won', 'submitted', 'countered'].map(bf => (
                  <button
                    key={bf}
                    onClick={() => setBidFilter(bf as any)}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                      bidFilter === bf
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-white text-gray-600 hover:text-gray-950 border border-gray-200'
                    }`}
                  >
                    {bf === 'all' ? 'All Bids' : bf === 'won' ? 'Won / Booked' : bf === 'submitted' ? 'Pending Review' : 'Countered'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowNewBidModal(true)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Freight Spot Bid</span>
              </button>
            </div>

            {/* Bids Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBids.map(bid => {
                const isWon = bid.status === 'won';
                return (
                  <div
                    key={bid.id}
                    className="bg-white border border-gray-200/90 hover:border-gray-300 rounded-2xl p-5 shadow-xs space-y-3.5 text-left transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-150">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-extrabold text-gray-950 px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200">
                            #{bid.tenderNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            bid.status === 'won' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            bid.status === 'countered' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {bid.status === 'won' ? 'Won & Agreed' : bid.status === 'countered' ? 'Countered' : 'Pending Review'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-gray-900 mt-1.5">
                          {bid.brokerName}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-purple-700 font-mono">
                          ${bid.ourBidAmount.toLocaleString()} USD
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          ${bid.ratePerMile.toFixed(2)}/mi · {bid.loadedMiles} mi
                        </div>
                      </div>
                    </div>

                    {/* Corridor */}
                    <div className="p-3 rounded-xl bg-[#F5F5F7] border border-gray-200 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{bid.originCity}, {bid.originState}</span>
                      </div>
                      <div className="text-gray-400 font-bold text-[11px]">
                        ────➔
                      </div>
                      <div className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{bid.destCity}, {bid.destState}</span>
                      </div>
                    </div>

                    {/* Financial details & Driver */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Broker Target</span>
                        <strong className="text-xs text-gray-700 font-mono block mt-0.5">
                          ${bid.initialBrokerOffer.toLocaleString()} USD
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-gray-200">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Equipment</span>
                        <strong className="text-xs text-gray-700 font-mono block mt-0.5">
                          {bid.equipmentType}
                        </strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-150">
                      "{bid.notes}"
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-150 flex items-center justify-between">
                      <span className="text-[11px] text-gray-600 font-medium">
                        Driver: <strong>{bid.driverAssignment}</strong>
                      </span>

                      {isWon ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active in Dispatch</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConvertBidToLoad(bid)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Win Bid & Dispatch Load</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FACTORING & QUICKPAY */}
        {activeTab === 'factoring' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-600" />
                  <span>Freight Factoring Hub (Instant AR Liquidity)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Direct submission to {factoringCompany} with auto-attached Rate Con, signed BOL, and Notice of Assignment (NOA).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={factoringCompany}
                  onChange={(e) => setFactoringCompany(e.target.value as any)}
                  className="bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-800 cursor-pointer"
                >
                  <option value="TriumphPay">TriumphPay (Primary Factor)</option>
                  <option value="RTS Financial">RTS Financial</option>
                  <option value="Apex Capital">Apex Capital</option>
                </select>

                <button
                  onClick={handleSubmitFactoringBatch}
                  disabled={selectedFactoringIds.length === 0 || isSubmittingFactoring}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {isSubmittingFactoring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit Selected Batch ({selectedFactoringIds.length})</span>
                </button>
              </div>
            </div>

            {/* Invoices Eligible for Factoring */}
            <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs text-gray-800">
                <thead className="bg-[#F5F5F7] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedFactoringIds.length === invoices.length && invoices.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedFactoringIds(invoices.map(i => i.id));
                          else setSelectedFactoringIds([]);
                        }}
                      />
                    </th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Load #</th>
                    <th className="py-3 px-4">Broker</th>
                    <th className="py-3 px-4">Net Gross</th>
                    <th className="py-3 px-4">Factoring Advance (97%)</th>
                    <th className="py-3 px-4">Factoring Fee (3%)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {invoices.map(inv => {
                    const isChecked = selectedFactoringIds.includes(inv.id);
                    const advanceAmt = inv.totalAmount * 0.97;
                    const feeAmt = inv.totalAmount * 0.03;

                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedFactoringIds(prev => [...prev, inv.id]);
                              else setSelectedFactoringIds(prev => prev.filter(id => id !== inv.id));
                            }}
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-950">#{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">#{inv.loadNumber}</td>
                        <td className="py-3 px-4 font-bold text-gray-900">{inv.customerName}</td>
                        <td className="py-3 px-4 font-mono font-extrabold text-gray-950">${inv.totalAmount.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">${advanceAmt.toFixed(2)}</td>
                        <td className="py-3 px-4 font-mono text-gray-500">${feeAmt.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Eligible
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SUBMIT SPOT FREIGHT BID */}
      {showNewBidModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-gray-950">Place Spot Rate Freight Bid</h3>
              </div>
              <button onClick={() => setShowNewBidModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpotBid} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Broker Name *</label>
                  <input
                    type="text"
                    required
                    value={bidBroker}
                    onChange={(e) => setBidBroker(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Broker Tender Email *</label>
                  <input
                    type="email"
                    required
                    value={bidBrokerEmail}
                    onChange={(e) => setBidBrokerEmail(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Origin City</label>
                  <input
                    type="text"
                    value={bidOriginCity}
                    onChange={(e) => setBidOriginCity(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Origin ST</label>
                  <input
                    type="text"
                    value={bidOriginState}
                    onChange={(e) => setBidOriginState(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Dest City</label>
                  <input
                    type="text"
                    value={bidDestCity}
                    onChange={(e) => setBidDestCity(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Dest ST</label>
                  <input
                    type="text"
                    value={bidDestState}
                    onChange={(e) => setBidDestState(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Loaded Miles *</label>
                  <input
                    type="number"
                    value={bidMiles}
                    onChange={(e) => setBidMiles(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Broker Posted ($)</label>
                  <input
                    type="number"
                    value={bidBrokerOriginal}
                    onChange={(e) => setBidBrokerOriginal(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Our Bid Offer ($) *</label>
                  <input
                    type="number"
                    value={bidOffer}
                    onChange={(e) => setBidOffer(Number(e.target.value))}
                    className="w-full bg-purple-50 border border-purple-300 rounded-lg px-3 py-1.5 text-purple-900 font-mono font-extrabold"
                  />
                </div>
              </div>

              {/* Dynamic Calculation HUD */}
              <div className="p-3 rounded-xl bg-[#F5F5F7] border border-gray-200 grid grid-cols-3 gap-2 font-mono text-center">
                <div>
                  <span className="text-[10px] text-gray-400 block">Rate / Mile</span>
                  <strong className="text-xs text-blue-600 block mt-0.5">${calculatedBidRPM}/mi</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Driver Pay (65%)</span>
                  <strong className="text-xs text-gray-800 block mt-0.5">${estimatedDriverCut.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Est Net Profit</span>
                  <strong className="text-xs text-emerald-600 block mt-0.5">${estimatedNetMargin.toFixed(2)}</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBidModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Transmit Spot Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW INVOICE MANUAL CREATION */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-950">Create Carrier Billing Invoice</h3>
              </div>
              <button onClick={() => setShowNewInvoiceModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={newInvNo}
                    onChange={(e) => setNewInvNo(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Load # *</label>
                  <input
                    type="text"
                    required
                    value={newInvLoadNo}
                    onChange={(e) => setNewInvLoadNo(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Customer / Broker *</label>
                  <input
                    type="text"
                    required
                    value={newInvCustomer}
                    onChange={(e) => setNewInvCustomer(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">AP Email *</label>
                  <input
                    type="email"
                    required
                    value={newInvEmail}
                    onChange={(e) => setNewInvEmail(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                  />
                </div>
              </div>

              {/* Line items */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Linehaul ($) *</label>
                  <input
                    type="number"
                    value={newInvLinehaul}
                    onChange={(e) => setNewInvLinehaul(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Fuel Surcharge ($)</label>
                  <input
                    type="number"
                    value={newInvFuel}
                    onChange={(e) => setNewInvFuel(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Lumper Reimbursement ($)</label>
                  <input
                    type="number"
                    value={newInvLumper}
                    onChange={(e) => setNewInvLumper(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Detention Fee ($)</label>
                  <input
                    type="number"
                    value={newInvDetention}
                    onChange={(e) => setNewInvDetention(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-900">Total Invoice Amount:</span>
                <span className="text-base font-extrabold text-emerald-800 font-mono">
                  ${(newInvLinehaul + newInvFuel + newInvLumper + newInvDetention).toLocaleString()} USD
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Create & Lock Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
