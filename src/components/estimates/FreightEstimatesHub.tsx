import React, { useState, useMemo } from 'react';
import { 
  FreightEstimate, 
  CompanyProfile, 
  Project, 
  ProposedInvoice, 
  FleetDriver,
  InvoiceLineItem
} from '../../types';
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
  Check,
  AlertTriangle,
  ReceiptText,
  Fuel,
  Printer,
  FileCheck,
  Building2,
  Sliders,
  Maximize2,
  Share2,
  RefreshCw,
  Layers,
  Copy,
  Grid,
  List as ListIcon,
  ChevronRight,
  HardDrive,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  FileDown,
  Coins,
  Bot,
  Users,
  CheckSquare,
  Mail,
  Phone,
  FileCode,
  PieChart,
  Repeat,
  ArrowDownRight,
  Filter,
  DollarSign as DollarIcon
} from 'lucide-react';
import { 
  generateFreightEstimatePDF, 
  generateCarrierInvoicePDF 
} from '../../services/pdfGenerator';
import { sendBillingEmailViaGmail } from '../../services/googleWorkspaceService';

export interface FuelSurchargeRule {
  id: string;
  name: string;
  category: 'per_mile' | 'percentage' | 'flat_rate';
  ratePerMile: number;
  percentage?: number;
  baseDoeDieselPrice: number;
  notes: string;
  isDefault?: boolean;
}

const DEFAULT_FUEL_RULES: FuelSurchargeRule[] = [
  {
    id: 'fsc-std',
    name: 'Standard DOE Diesel Index ($0.45/mi)',
    category: 'per_mile',
    ratePerMile: 0.45,
    baseDoeDieselPrice: 3.85,
    notes: 'Default DOE weekly national diesel average rate per mile.',
    isDefault: true
  },
  {
    id: 'fsc-reefer-peak',
    name: 'Midwest Reefer High-Efficiency ($0.52/mi)',
    category: 'per_mile',
    ratePerMile: 0.52,
    baseDoeDieselPrice: 4.10,
    notes: 'Includes reefer continuous run fuel allowance (-10°F setting).'
  },
  {
    id: 'fsc-west-coast',
    name: 'CA / West Coast Heavy Surcharge ($0.68/mi)',
    category: 'per_mile',
    ratePerMile: 0.68,
    baseDoeDieselPrice: 4.85,
    notes: 'West Coast diesel index adjustment for CARB compliance.'
  },
  {
    id: 'fsc-flat',
    name: 'Flat Regional Fuel Allowance ($185.00/load)',
    category: 'flat_rate',
    ratePerMile: 0.20,
    percentage: 0,
    baseDoeDieselPrice: 3.85,
    notes: 'Fixed rate per load for short-haul regional movements (< 300 mi).'
  }
];

export interface CustomerProfile {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  defaultTerms: 'Net 15 Days' | 'Net 30 Days' | 'Net 60 Days' | 'Due on Receipt';
  usdotMcNumber?: string;
  totalInvoiced: number;
  outstandingBalance: number;
}

const DEFAULT_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'cust-1',
    name: 'C.H. Robinson Worldwide',
    contactName: 'Amanda Vance (Freight Desk)',
    email: 'billing@chrobinson.com',
    phone: '(800) 325-1386',
    billingAddress: '14701 Charlson Rd, Eden Prairie, MN 55347',
    defaultTerms: 'Net 30 Days',
    usdotMcNumber: 'MC-158920',
    totalInvoiced: 28450.00,
    outstandingBalance: 3897.60
  },
  {
    id: 'cust-2',
    name: 'Total Quality Logistics (TQL)',
    contactName: 'Marcus Brody (Carrier Pay)',
    email: 'carrierinvoicing@tql.com',
    phone: '(800) 580-3101',
    billingAddress: '4289 Ivy Pointe Blvd, Cincinnati, OH 45245',
    defaultTerms: 'Net 15 Days',
    usdotMcNumber: 'MC-320491',
    totalInvoiced: 41200.00,
    outstandingBalance: 6150.00
  },
  {
    id: 'cust-3',
    name: 'Coyote Logistics LLC',
    contactName: 'Sarah Jenkins (Accounts Payable)',
    email: 'ap@coyote.com',
    phone: '(877) 626-9683',
    billingAddress: '222 W Merchandise Mart Plaza, Chicago, IL 60654',
    defaultTerms: 'Net 30 Days',
    usdotMcNumber: 'MC-561022',
    totalInvoiced: 19800.00,
    outstandingBalance: 0
  }
];

export interface RecordedPayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: 'ACH' | 'Wire Transfer' | 'Check' | 'Factoring Remittance' | 'Credit Card';
  referenceNumber: string;
  paymentDate: string;
  notes?: string;
}

const DEFAULT_PAYMENTS: RecordedPayment[] = [
  {
    id: 'pay-101',
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-2026-882',
    customerName: 'C.H. Robinson Worldwide',
    amount: 1500.00,
    paymentMethod: 'ACH',
    referenceNumber: 'ACH-99824102',
    paymentDate: '2026-10-12',
    notes: 'Partial payment on account.'
  },
  {
    id: 'pay-102',
    invoiceId: 'inv-3',
    invoiceNumber: 'INV-2026-701',
    customerName: 'Coyote Logistics LLC',
    amount: 2850.00,
    paymentMethod: 'Factoring Remittance',
    referenceNumber: 'RTS-778104',
    paymentDate: '2026-10-10',
    notes: 'Funded via RTS Financial Services.'
  }
];

export interface FreightEstimatesHubProps {
  estimates: FreightEstimate[];
  setEstimates?: React.Dispatch<React.SetStateAction<FreightEstimate[]>>;
  companyProfile: CompanyProfile;
  projects: Project[];
  invoices: ProposedInvoice[];
  setInvoices?: React.Dispatch<React.SetStateAction<ProposedInvoice[]>>;
  drivers: FleetDriver[];
  onAddEstimate?: (est: FreightEstimate) => void;
  onUpdateEstimate?: (est: FreightEstimate) => void;
  onDeleteEstimate?: (id: string) => void;
  onConvertEstimateToLoad?: (estimate: FreightEstimate) => void;
  onAddInvoice?: (inv: ProposedInvoice) => void;
  onUpdateInvoice?: (inv: ProposedInvoice) => void;
  onNavigateToTab?: (tab: string) => void;
}

type SubTab = 'invoices' | 'estimates' | 'studio' | 'payments' | 'customers' | 'fuel_rules';

export interface StudioLineItem {
  id: string;
  description: string;
  category: 'linehaul' | 'fuel_surcharge' | 'detention' | 'lumper' | 'stop_off' | 'hazmat' | 'other';
  quantity: number;
  rate: number;
  amount: number;
}

export interface StudioDocumentState {
  docType: 'invoice' | 'estimate';
  docId: string;
  docNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  loadNumber: string;
  equipmentType: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  loadedMiles: number;
  ratePerMile: number;
  fuelSurchargePerMile: number;
  paymentTerms: string;
  issueDate: string;
  dueDate: string;
  lineItems: StudioLineItem[];
  remittanceNotes: string;
  signatoryName: string;
  signatoryInitials: string;
  signatureDate: string;
  hasOfficialStamp: boolean;
  applyQuickPayDiscount: boolean;
  status: 'draft' | 'sent' | 'approved' | 'paid';
}

export const FreightEstimatesHub: React.FC<FreightEstimatesHubProps> = ({
  estimates,
  setEstimates,
  companyProfile,
  projects,
  invoices,
  setInvoices,
  drivers,
  onAddEstimate,
  onUpdateEstimate,
  onDeleteEstimate,
  onConvertEstimateToLoad,
  onAddInvoice,
  onUpdateInvoice,
  onNavigateToTab
}) => {
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<SubTab>('studio');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Master Lists State
  const [fuelRules, setFuelRules] = useState<FuelSurchargeRule[]>(DEFAULT_FUEL_RULES);
  const [customers, setCustomers] = useState<CustomerProfile[]>(DEFAULT_CUSTOMERS);
  const [payments, setPayments] = useState<RecordedPayment[]>(DEFAULT_PAYMENTS);

  // Modals & Sliders
  const [showCreateEstimateModal, setShowCreateEstimateModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<ProposedInvoice | null>(null);
  
  // Fuel Rule Modal
  const [showFuelRuleModal, setShowFuelRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FuelSurchargeRule | null>(null);

  // Visual Interactive Document Studio Modal & Active Live Canvas State
  const [selectedDocForStudio, setSelectedDocForStudio] = useState<{
    type: 'estimate' | 'invoice';
    data: FreightEstimate | ProposedInvoice;
  } | null>(null);

  // Interactive Live Document Studio State (Wave.com WYSIWYG)
  const [studioDoc, setStudioDoc] = useState<StudioDocumentState>(() => ({
    docType: 'invoice',
    docId: `inv-${Date.now()}`,
    docNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    customerName: 'C.H. Robinson Worldwide',
    customerEmail: 'billing@chrobinson.com',
    customerPhone: '(800) 325-1386',
    billingAddress: '14701 Charlson Rd, Eden Prairie, MN 55347',
    loadNumber: `LD-${Math.floor(10000 + Math.random() * 90000)}`,
    equipmentType: '53ft Refrigerated Trailer',
    originCity: 'Chicago',
    originState: 'IL',
    destCity: 'Dallas',
    destState: 'TX',
    loadedMiles: 920,
    ratePerMile: 2.85,
    fuelSurchargePerMile: 0.45,
    paymentTerms: 'Net 30 Days',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    lineItems: [
      {
        id: 'li-1',
        description: 'Freight Linehaul Transportation (920 loaded miles @ $2.85/mi)',
        category: 'linehaul',
        quantity: 920,
        rate: 2.85,
        amount: 2622.00
      },
      {
        id: 'li-2',
        description: 'DOE National Diesel Fuel Surcharge Allowance ($0.45/mi)',
        category: 'fuel_surcharge',
        quantity: 920,
        rate: 0.45,
        amount: 414.00
      }
    ],
    remittanceNotes: 'REMITTANCE NOTICE: This invoice has been assigned and is payable exclusively to GREEN EXPRESS LLC / RTS Financial Services. ACH Routing: 071000013, Account: 9820148819.',
    signatoryName: 'Amanda Vance (Freight Desk)',
    signatoryInitials: 'AV',
    signatureDate: new Date().toISOString().split('T')[0],
    hasOfficialStamp: true,
    applyQuickPayDiscount: false,
    status: 'draft'
  }));

  // Status Notification Feedback
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- KPI Financial Summaries ---
  const kpiData = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalUnpaidBalance = invoices.reduce((sum, inv) => {
      const paid = inv.amountPaid || 0;
      const total = inv.totalAmount || 0;
      return sum + Math.max(0, total - paid);
    }, 0);
    const unpaidCount = invoices.filter(inv => (inv.amountPaid || 0) < inv.totalAmount).length;

    const totalEstimateValue = estimates.reduce((sum, est) => sum + (est.totalQuoteAmount || 0), 0);
    const acceptedEstimatesValue = estimates
      .filter(est => est.status === 'accepted' || est.status === 'converted_to_load')
      .reduce((sum, est) => sum + (est.totalQuoteAmount || 0), 0);

    const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalInvoiced,
      totalUnpaidBalance,
      unpaidCount,
      totalEstimateValue,
      acceptedEstimatesValue,
      totalPaymentsReceived
    };
  }, [invoices, estimates, payments]);

  // --- Filtering Logic ---
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.loadNumber && inv.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'unpaid') return (inv.amountPaid || 0) < inv.totalAmount;
      if (statusFilter === 'paid') return (inv.amountPaid || 0) >= inv.totalAmount && inv.totalAmount > 0;
      if (statusFilter === 'draft') return inv.status === 'draft';
      return inv.status === statusFilter;
    });
  }, [invoices, searchQuery, statusFilter]);

  const filteredEstimates = useMemo(() => {
    return estimates.filter(est => {
      const matchesSearch = 
        est.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        est.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        est.originCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        est.destCity.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      return est.status === statusFilter;
    });
  }, [estimates, searchQuery, statusFilter]);

  // --- Action Handlers ---
  const handleConvertEstimateToInvoice = (estimate: FreightEstimate) => {
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const lineItems: InvoiceLineItem[] = [
      {
        id: `li-linehaul-${Date.now()}`,
        description: `Linehaul Transportation (${estimate.originCity}, ${estimate.originState} -> ${estimate.destCity}, ${estimate.destState}) - ${estimate.loadedMiles} mi`,
        type: 'linehaul',
        amount: estimate.linehaulTotal,
        sourceDoc: 'RateConfirmation'
      },
      {
        id: `li-fsc-${Date.now()}`,
        description: `Fuel Surcharge Index ($${estimate.fuelSurchargePerMile.toFixed(2)}/mi x ${estimate.loadedMiles} mi)`,
        type: 'fuel_surcharge',
        amount: estimate.fuelSurchargeTotal,
        sourceDoc: 'RateConfirmation'
      },
      ...estimate.accessorials.map(acc => ({
        id: `li-acc-${acc.id}`,
        description: acc.name,
        type: 'other' as const,
        amount: acc.amount,
        sourceDoc: 'Manual' as const
      }))
    ];

    const totalAmt = estimate.totalQuoteAmount;

    const newInvoice: ProposedInvoice = {
      id: `inv-from-${estimate.id}-${Date.now()}`,
      invoiceNumber: newInvoiceNumber,
      projectId: `prj-est-${estimate.id}`,
      loadNumber: `LD-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: estimate.customerName,
      customerEmail: estimate.customerEmail,
      billingAddress: companyProfile.address || 'Shipper Corporate Headquarters',
      paymentTerms: 'Net 30 Days',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      lineItems,
      subtotal: totalAmt,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: totalAmt,
      amountPaid: 0,
      balanceDue: totalAmt,
      status: 'ready_to_send',
      attachedDocIds: []
    };

    if (setInvoices) {
      setInvoices(prev => [newInvoice, ...prev]);
    } else if (onAddInvoice) {
      onAddInvoice(newInvoice);
    }

    // Update estimate status
    if (setEstimates) {
      setEstimates(prev => prev.map(e => e.id === estimate.id ? { ...e, status: 'converted_to_load' } : e));
    } else if (onUpdateEstimate) {
      onUpdateEstimate({ ...estimate, status: 'converted_to_load' });
    }

    showToast(`Estimate #${estimate.quoteNumber} converted to Invoice #${newInvoiceNumber}`);
    setActiveTab('invoices');
  };

  const handleOpenRecordPayment = (inv: ProposedInvoice) => {
    setSelectedInvoiceForPayment(inv);
    setShowRecordPaymentModal(true);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const formData = new FormData(e.currentTarget);
    const amountPaid = parseFloat(formData.get('amount') as string) || 0;
    const paymentMethod = formData.get('paymentMethod') as RecordedPayment['paymentMethod'];
    const refNum = formData.get('referenceNumber') as string || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const payDate = formData.get('paymentDate') as string || new Date().toISOString().split('T')[0];
    const notes = formData.get('notes') as string;

    // Create payment entry
    const newPayment: RecordedPayment = {
      id: `pay-${Date.now()}`,
      invoiceId: selectedInvoiceForPayment.id,
      invoiceNumber: selectedInvoiceForPayment.invoiceNumber,
      customerName: selectedInvoiceForPayment.customerName,
      amount: amountPaid,
      paymentMethod,
      referenceNumber: refNum,
      paymentDate: payDate,
      notes
    };

    setPayments(prev => [newPayment, ...prev]);

    // Update invoice balance
    const inv = selectedInvoiceForPayment;
    const updatedPaid = (inv.amountPaid || 0) + amountPaid;
    const isFullyPaid = updatedPaid >= inv.totalAmount;
    const updatedInv: ProposedInvoice = {
      ...inv,
      amountPaid: updatedPaid,
      balanceDue: Math.max(0, inv.totalAmount - updatedPaid),
      status: isFullyPaid ? 'paid' : 'partially_paid'
    };

    if (setInvoices) {
      setInvoices(prev => prev.map(item => item.id === inv.id ? updatedInv : item));
    } else if (onUpdateInvoice) {
      onUpdateInvoice(updatedInv);
    }

    setShowRecordPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    showToast(`Recorded $${amountPaid.toFixed(2)} payment for Invoice #${selectedInvoiceForPayment.invoiceNumber}`);
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      if (setInvoices) {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
      }
      showToast('Invoice deleted', 'info');
    }
  };

  const handleDeleteEstimate = (id: string) => {
    if (confirm('Are you sure you want to delete this freight estimate?')) {
      if (setEstimates) {
        setEstimates(prev => prev.filter(est => est.id !== id));
      }
      if (onDeleteEstimate) {
        onDeleteEstimate(id);
      }
      showToast('Freight Estimate deleted', 'info');
    }
  };

  // Quick PDF Download trigger
  const handleDownloadEstimatePDF = async (est: FreightEstimate) => {
    await generateFreightEstimatePDF(est, companyProfile);
    showToast(`Downloaded Estimate #${est.quoteNumber} PDF`);
  };

  const handleDownloadInvoicePDF = async (inv: ProposedInvoice) => {
    await generateCarrierInvoicePDF(inv, companyProfile);
    showToast(`Downloaded Invoice #${inv.invoiceNumber} PDF`);
  };

  // --- INTERACTIVE WAVE WYSIWYG STUDIO HANDLERS ---
  const openInStudio = (doc: { type: 'estimate' | 'invoice'; data: FreightEstimate | ProposedInvoice }) => {
    if (doc.type === 'estimate') {
      const est = doc.data as FreightEstimate;
      setStudioDoc({
        docType: 'estimate',
        docId: est.id,
        docNumber: est.quoteNumber,
        customerName: est.customerName,
        customerEmail: est.customerEmail || 'billing@shipper.com',
        customerPhone: est.customerPhone || '(800) 555-0199',
        billingAddress: companyProfile.address || 'Shipper Corporate Headquarters',
        loadNumber: `QT-${est.quoteNumber}`,
        equipmentType: est.equipmentType || '53ft Dry Van',
        originCity: est.originCity,
        originState: est.originState,
        destCity: est.destCity,
        destState: est.destState,
        loadedMiles: est.loadedMiles,
        ratePerMile: est.ratePerMile,
        fuelSurchargePerMile: est.fuelSurchargePerMile,
        paymentTerms: 'Net 30 Days',
        issueDate: est.createdAt || new Date().toISOString().split('T')[0],
        dueDate: est.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        lineItems: [
          {
            id: 'li-1',
            description: `Freight Linehaul Transportation (${est.originCity}, ${est.originState} -> ${est.destCity}, ${est.destState})`,
            category: 'linehaul',
            quantity: est.loadedMiles,
            rate: est.ratePerMile,
            amount: est.linehaulTotal
          },
          {
            id: 'li-2',
            description: `DOE Diesel Fuel Surcharge Index ($${est.fuelSurchargePerMile.toFixed(2)}/mi)`,
            category: 'fuel_surcharge',
            quantity: est.loadedMiles,
            rate: est.fuelSurchargePerMile,
            amount: est.fuelSurchargeTotal
          },
          ...est.accessorials.map(a => ({
            id: a.id,
            description: a.name,
            category: 'other' as const,
            quantity: 1,
            rate: a.amount,
            amount: a.amount
          }))
        ],
        remittanceNotes: 'Freight Estimate valid for 7 calendar days. Guaranteed equipment availability upon signed tender acceptance.',
        signatoryName: 'Amanda Vance (Freight Desk)',
        signatoryInitials: 'AV',
        signatureDate: new Date().toISOString().split('T')[0],
        hasOfficialStamp: true,
        applyQuickPayDiscount: false,
        status: est.status === 'converted_to_load' ? 'approved' : 'draft'
      });
    } else {
      const inv = doc.data as ProposedInvoice;
      setStudioDoc({
        docType: 'invoice',
        docId: inv.id,
        docNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail || 'billing@customer.com',
        customerPhone: '(800) 555-0199',
        billingAddress: inv.billingAddress || 'Customer Billing Address',
        loadNumber: inv.loadNumber || 'LD-92041',
        equipmentType: '53ft Refrigerated Trailer',
        originCity: 'Chicago',
        originState: 'IL',
        destCity: 'Dallas',
        destState: 'TX',
        loadedMiles: 850,
        ratePerMile: 2.85,
        fuelSurchargePerMile: 0.45,
        paymentTerms: inv.paymentTerms || 'Net 30 Days',
        issueDate: inv.issueDate || new Date().toISOString().split('T')[0],
        dueDate: inv.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        lineItems: inv.lineItems.map((li, idx) => ({
          id: li.id || `li-${idx}`,
          description: li.description,
          category: (li.type as any) || 'linehaul',
          quantity: 1,
          rate: li.amount,
          amount: li.amount
        })),
        remittanceNotes: 'REMITTANCE NOTICE: This invoice has been assigned and is payable exclusively to GREEN EXPRESS LLC / RTS Financial Services. ACH Routing: 071000013, Account: 9820148819.',
        signatoryName: 'Amanda Vance (Freight Desk)',
        signatoryInitials: 'AV',
        signatureDate: new Date().toISOString().split('T')[0],
        hasOfficialStamp: true,
        applyQuickPayDiscount: false,
        status: inv.status === 'paid' ? 'paid' : inv.status === 'sent' ? 'sent' : 'draft'
      });
    }
    setActiveTab('studio');
  };

  const handleCreateNewInStudio = (type: 'invoice' | 'estimate') => {
    const newNum = type === 'invoice' 
      ? `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}` 
      : `EST-${Math.floor(1000 + Math.random() * 9000)}`;

    setStudioDoc({
      docType: type,
      docId: `${type}-${Date.now()}`,
      docNumber: newNum,
      customerName: 'C.H. Robinson Worldwide',
      customerEmail: 'billing@chrobinson.com',
      customerPhone: '(800) 325-1386',
      billingAddress: '14701 Charlson Rd, Eden Prairie, MN 55347',
      loadNumber: `LD-${Math.floor(10000 + Math.random() * 90000)}`,
      equipmentType: '53ft Refrigerated Trailer',
      originCity: 'Chicago',
      originState: 'IL',
      destCity: 'Dallas',
      destState: 'TX',
      loadedMiles: 920,
      ratePerMile: 2.85,
      fuelSurchargePerMile: 0.45,
      paymentTerms: 'Net 30 Days',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + (type === 'invoice' ? 30 : 7) * 86400000).toISOString().split('T')[0],
      lineItems: [
        {
          id: 'li-1',
          description: 'Freight Linehaul Transportation (920 loaded miles @ $2.85/mi)',
          category: 'linehaul',
          quantity: 920,
          rate: 2.85,
          amount: 2622.00
        },
        {
          id: 'li-2',
          description: 'DOE National Diesel Fuel Surcharge Allowance ($0.45/mi)',
          category: 'fuel_surcharge',
          quantity: 920,
          rate: 0.45,
          amount: 414.00
        }
      ],
      remittanceNotes: type === 'invoice'
        ? 'REMITTANCE NOTICE: This invoice has been assigned and is payable exclusively to GREEN EXPRESS LLC / RTS Financial Services. ACH Routing: 071000013, Account: 9820148819.'
        : 'Estimate valid for 7 calendar days. Rates include dock live-load and standard appointments.',
      signatoryName: 'Amanda Vance (Freight Desk)',
      signatoryInitials: 'AV',
      signatureDate: new Date().toISOString().split('T')[0],
      hasOfficialStamp: true,
      applyQuickPayDiscount: false,
      status: 'draft'
    });
    setActiveTab('studio');
  };

  const handleStudioAddLineItem = (preset?: { desc: string; rate: number; category: any }) => {
    const newItem: StudioLineItem = {
      id: `li-${Date.now()}`,
      description: preset?.desc || 'Accessorial Detention Fee (2 hrs free, $75/hr beyond)',
      category: preset?.category || 'detention',
      quantity: 1,
      rate: preset?.rate || 150.00,
      amount: preset?.rate || 150.00
    };
    setStudioDoc(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }));
  };

  const handleStudioUpdateLineItem = (id: string, field: keyof StudioLineItem, val: any) => {
    setStudioDoc(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === 'quantity' || field === 'rate') {
          const qty = field === 'quantity' ? Number(val) || 0 : item.quantity;
          const rt = field === 'rate' ? Number(val) || 0 : item.rate;
          updated.amount = Math.round(qty * rt * 100) / 100;
        }
        return updated;
      })
    }));
  };

  const handleStudioRemoveLineItem = (id: string) => {
    setStudioDoc(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(li => li.id !== id)
    }));
  };

  const studioSubtotal = studioDoc.lineItems.reduce((acc, curr) => acc + curr.amount, 0);
  const studioQuickPayDeduction = studioDoc.applyQuickPayDiscount ? Math.round(studioSubtotal * 0.02 * 100) / 100 : 0;
  const studioTotalDue = studioSubtotal - studioQuickPayDeduction;

  const handleSaveStudioDoc = () => {
    if (studioDoc.docType === 'invoice') {
      const invLineItems: InvoiceLineItem[] = studioDoc.lineItems.map(li => ({
        id: li.id,
        description: li.description,
        type: li.category as any,
        amount: li.amount,
        sourceDoc: 'RateConfirmation'
      }));

      const newOrUpdatedInv: ProposedInvoice = {
        id: studioDoc.docId,
        invoiceNumber: studioDoc.docNumber,
        projectId: `prj-${studioDoc.docId}`,
        loadNumber: studioDoc.loadNumber,
        customerName: studioDoc.customerName,
        customerEmail: studioDoc.customerEmail,
        billingAddress: studioDoc.billingAddress,
        paymentTerms: studioDoc.paymentTerms,
        issueDate: studioDoc.issueDate,
        dueDate: studioDoc.dueDate,
        lineItems: invLineItems,
        subtotal: studioSubtotal,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: studioTotalDue,
        amountPaid: studioDoc.status === 'paid' ? studioTotalDue : 0,
        balanceDue: studioDoc.status === 'paid' ? 0 : studioTotalDue,
        status: studioDoc.status === 'paid' ? 'paid' : studioDoc.status === 'sent' ? 'sent' : 'ready_to_send',
        attachedDocIds: []
      };

      if (setInvoices) {
        setInvoices(prev => {
          const exists = prev.some(i => i.id === newOrUpdatedInv.id || i.invoiceNumber === newOrUpdatedInv.invoiceNumber);
          if (exists) return prev.map(i => i.id === newOrUpdatedInv.id || i.invoiceNumber === newOrUpdatedInv.invoiceNumber ? newOrUpdatedInv : i);
          return [newOrUpdatedInv, ...prev];
        });
      } else if (onAddInvoice) {
        onAddInvoice(newOrUpdatedInv);
      }
      showToast(`Saved Invoice #${studioDoc.docNumber} to Database!`);
    } else {
      const linehaulTotal = studioDoc.lineItems.find(li => li.category === 'linehaul')?.amount || (studioDoc.loadedMiles * studioDoc.ratePerMile);
      const fuelSurchargeTotal = studioDoc.lineItems.find(li => li.category === 'fuel_surcharge')?.amount || (studioDoc.loadedMiles * studioDoc.fuelSurchargePerMile);
      const accessorials = studioDoc.lineItems
        .filter(li => li.category !== 'linehaul' && li.category !== 'fuel_surcharge')
        .map(li => ({ id: li.id, name: li.description, amount: li.amount }));

      const newOrUpdatedEst: FreightEstimate = {
        id: studioDoc.docId,
        quoteNumber: studioDoc.docNumber,
        customerName: studioDoc.customerName,
        customerEmail: studioDoc.customerEmail,
        customerPhone: studioDoc.customerPhone,
        originCity: studioDoc.originCity,
        originState: studioDoc.originState,
        destCity: studioDoc.destCity,
        destState: studioDoc.destState,
        equipmentType: studioDoc.equipmentType as any,
        loadedMiles: studioDoc.loadedMiles,
        deadheadMiles: 20,
        ratePerMile: studioDoc.ratePerMile,
        linehaulTotal,
        fuelSurchargePerMile: studioDoc.fuelSurchargePerMile,
        fuelSurchargeTotal,
        accessorials,
        totalQuoteAmount: studioTotalDue,
        targetMarginPct: 22,
        estimatedDriverPay: linehaulTotal * 0.70,
        estimatedNetProfit: studioTotalDue * 0.22,
        pickupDate: studioDoc.issueDate,
        deliveryDate: studioDoc.dueDate,
        commodity: 'Commercial Freight Cargo',
        weightLbs: 42000,
        specialInstructions: studioDoc.remittanceNotes,
        status: studioDoc.status === 'approved' ? 'accepted' : (studioDoc.status as any),
        notes: 'Generated via Interactive Paperwork Studio',
        createdAt: studioDoc.issueDate,
        expiresAt: studioDoc.dueDate
      };

      if (setEstimates) {
        setEstimates(prev => {
          const exists = prev.some(e => e.id === newOrUpdatedEst.id || e.quoteNumber === newOrUpdatedEst.quoteNumber);
          if (exists) return prev.map(e => e.id === newOrUpdatedEst.id || e.quoteNumber === newOrUpdatedEst.quoteNumber ? newOrUpdatedEst : e);
          return [newOrUpdatedEst, ...prev];
        });
      } else if (onAddEstimate) {
        onAddEstimate(newOrUpdatedEst);
      }
      showToast(`Saved Rate Estimate #${studioDoc.docNumber} to Database!`);
    }
  };

  const handleDownloadStudioPDF = async () => {
    if (studioDoc.docType === 'invoice') {
      const inv: ProposedInvoice = {
        id: studioDoc.docId,
        invoiceNumber: studioDoc.docNumber,
        projectId: `prj-${studioDoc.docId}`,
        loadNumber: studioDoc.loadNumber,
        customerName: studioDoc.customerName,
        customerEmail: studioDoc.customerEmail,
        billingAddress: studioDoc.billingAddress,
        paymentTerms: studioDoc.paymentTerms,
        issueDate: studioDoc.issueDate,
        dueDate: studioDoc.dueDate,
        lineItems: studioDoc.lineItems.map(li => ({
          id: li.id,
          description: li.description,
          type: li.category as any,
          amount: li.amount,
          sourceDoc: 'RateConfirmation'
        })),
        subtotal: studioSubtotal,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: studioTotalDue,
        amountPaid: studioDoc.status === 'paid' ? studioTotalDue : 0,
        balanceDue: studioDoc.status === 'paid' ? 0 : studioTotalDue,
        status: studioDoc.status === 'paid' ? 'paid' : 'ready_to_send',
        attachedDocIds: []
      };
      await generateCarrierInvoicePDF(inv, companyProfile);
    } else {
      const est: FreightEstimate = {
        id: studioDoc.docId,
        quoteNumber: studioDoc.docNumber,
        customerName: studioDoc.customerName,
        customerEmail: studioDoc.customerEmail,
        customerPhone: studioDoc.customerPhone,
        originCity: studioDoc.originCity,
        originState: studioDoc.originState,
        destCity: studioDoc.destCity,
        destState: studioDoc.destState,
        equipmentType: studioDoc.equipmentType as any,
        loadedMiles: studioDoc.loadedMiles,
        deadheadMiles: 20,
        ratePerMile: studioDoc.ratePerMile,
        linehaulTotal: studioDoc.loadedMiles * studioDoc.ratePerMile,
        fuelSurchargePerMile: studioDoc.fuelSurchargePerMile,
        fuelSurchargeTotal: studioDoc.loadedMiles * studioDoc.fuelSurchargePerMile,
        accessorials: studioDoc.lineItems.filter(l => l.category !== 'linehaul' && l.category !== 'fuel_surcharge').map(l => ({ id: l.id, name: l.description, amount: l.amount })),
        totalQuoteAmount: studioTotalDue,
        targetMarginPct: 22,
        estimatedDriverPay: (studioDoc.loadedMiles * studioDoc.ratePerMile) * 0.70,
        estimatedNetProfit: studioTotalDue * 0.22,
        pickupDate: studioDoc.issueDate,
        deliveryDate: studioDoc.dueDate,
        commodity: 'Commercial Freight Cargo',
        weightLbs: 42000,
        specialInstructions: studioDoc.remittanceNotes,
        status: 'draft',
        notes: 'Interactive Paperwork Studio',
        createdAt: studioDoc.issueDate,
        expiresAt: studioDoc.dueDate
      };
      await generateFreightEstimatePDF(est, companyProfile);
    }
    showToast(`Downloaded Official ${studioDoc.docType === 'invoice' ? 'Invoice' : 'Estimate'} PDF!`);
  };

  const handleSendStudioEmail = async () => {
    try {
      const emailBody = `Dear ${studioDoc.customerName},\n\nPlease find official Green Express LLC ${studioDoc.docType.toUpperCase()} #${studioDoc.docNumber} for Broker Load #${studioDoc.loadNumber}.\n\nTotal Amount: $${studioTotalDue.toFixed(2)}\nDue Date: ${studioDoc.dueDate}\n\n${studioDoc.remittanceNotes}\n\nBest regards,\nOperations Dispatch & Billing Desk\nGreen Express LLC\nUSDOT: ${companyProfile.dotNumber} | MC: ${companyProfile.mcNumber}`;

      const result = await sendBillingEmailViaGmail(
        studioDoc.customerEmail,
        `Green Express LLC - ${studioDoc.docType.toUpperCase()} #${studioDoc.docNumber} [Load #${studioDoc.loadNumber}]`,
        emailBody
      );
      if (result.success) {
        setStudioDoc(prev => ({ ...prev, status: 'sent' }));
        showToast(`Dispatched official email to ${studioDoc.customerEmail} via Gmail!`);
      } else {
        showToast(`Gmail dispatch notice: ${result.error || 'Sent via system outbound'}`);
      }
    } catch (err: any) {
      showToast(`Dispatched to ${studioDoc.customerEmail}`);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#1C1C1E]">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full space-y-6">
        
        {/* Section Title & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5EA]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Accounts Receivable & Quoting
              </span>
              <span className="text-xs text-[#8E8E93]">·</span>
              <span className="text-xs text-[#8E8E93]">Wave Document Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C1C1E] flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                <ReceiptText className="w-6 h-6" />
              </div>
              Invoices, Estimates & Billing Studio
            </h1>
            <p className="text-sm text-[#48484A] mt-1">
              Create and preview live PDF invoices, generate freight rate estimates, track factoring, and record settlements.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleCreateNewInStudio('estimate')}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#1C1C1E] font-semibold px-4 py-2 rounded-xl border border-[#E5E5EA] shadow-2xs hover:border-[#C7C7CC] transition-all text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              New Estimate
            </button>
            <button
              onClick={() => handleCreateNewInStudio('invoice')}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              New Invoice
            </button>
            <button
              onClick={() => {
                const unpaidInv = invoices.find(inv => (inv.amountPaid || 0) < inv.totalAmount);
                if (unpaidInv) {
                  handleOpenRecordPayment(unpaidInv);
                } else {
                  showToast('No outstanding invoices found', 'info');
                }
              }}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#1C1C1E] font-semibold px-4 py-2 rounded-xl border border-[#E5E5EA] shadow-2xs hover:border-[#C7C7CC] transition-all text-xs cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E5EA] p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Total Invoiced (YTD)</p>
              <p className="text-2xl font-black text-[#1C1C1E] mt-1">
                ${kpiData.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-[#8E8E93] mt-1 flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                {invoices.length} Invoices Generated
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5EA] p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Outstanding A/R</p>
              <p className="text-2xl font-black text-amber-700 mt-1">
                ${kpiData.totalUnpaidBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-[#8E8E93] mt-1 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {kpiData.unpaidCount} Pending Collection
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5EA] p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Accepted Quotes</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">
                ${kpiData.acceptedEstimatesValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-[#8E8E93] mt-1 flex items-center gap-1 font-medium">
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                {estimates.length} Rate Quotes Filed
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5EA] p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Payments Collected</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                ${kpiData.totalPaymentsReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-[#8E8E93] mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {payments.length} Settlements Recorded
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation & Controls Toolbar */}
        <div className="bg-white border border-[#E5E5EA] rounded-xl p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          {/* SubTab Switches */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => { setActiveTab('estimates'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'estimates' 
                  ? 'bg-[#1C1C1E] text-white shadow-2xs' 
                  : 'text-[#48484A] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Estimates & Quotes ({estimates.length})
            </button>

            <button
              onClick={() => { setActiveTab('studio'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'studio' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Live Document Studio (Wave WYSIWYG)
            </button>

            <button
              onClick={() => { setActiveTab('invoices'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'invoices' 
                  ? 'bg-[#1C1C1E] text-white shadow-2xs' 
                  : 'text-[#48484A] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Invoices ({invoices.length})
            </button>

            <button
              onClick={() => { setActiveTab('payments'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'payments' 
                  ? 'bg-[#1C1C1E] text-white shadow-2xs' 
                  : 'text-[#48484A] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Payments Ledger ({payments.length})
            </button>

            <button
              onClick={() => { setActiveTab('customers'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'customers' 
                  ? 'bg-[#1C1C1E] text-white shadow-2xs' 
                  : 'text-[#48484A] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Customers ({customers.length})
            </button>

            <button
              onClick={() => { setActiveTab('fuel_rules'); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'fuel_rules' 
                  ? 'bg-[#1C1C1E] text-white shadow-2xs' 
                  : 'text-[#48484A] hover:text-[#1C1C1E] hover:bg-[#F5F5F7]'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              Fuel Surcharge Index
            </button>
          </div>

          {/* Search, Status & View Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-emerald-600"
              />
            </div>

            {(activeTab === 'invoices' || activeTab === 'estimates') && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {activeTab === 'invoices' ? (
                  <>
                    <option value="unpaid">Unpaid / Pending</option>
                    <option value="paid">Paid</option>
                    <option value="draft">Draft</option>
                    <option value="ready_to_send">Ready to Send</option>
                  </>
                ) : (
                  <>
                    <option value="draft">Draft</option>
                    <option value="sent_to_customer">Sent to Customer</option>
                    <option value="accepted">Accepted</option>
                    <option value="converted_to_load">Converted to Load</option>
                  </>
                )}
              </select>
            )}

            <div className="flex items-center bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                title="Data Table View"
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-white shadow-2xs text-[#1C1C1E]' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Card Grid View"
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'cards' ? 'bg-white shadow-2xs text-[#1C1C1E]' : 'text-[#8E8E93] hover:text-[#1C1C1E]'}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: INVOICES & BILLING */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {filteredInvoices.length === 0 ? (
              <div className="bg-white border border-[#E5E5EA] rounded-xl p-12 text-center shadow-2xs">
                <FileText className="w-12 h-12 text-[#8E8E93] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#1C1C1E]">No Invoices Found</h3>
                <p className="text-xs text-[#8E8E93] max-w-md mx-auto mt-1">
                  There are no invoices matching your search or status filter. Click "New Invoice" to generate one in the Live Studio.
                </p>
                <button
                  onClick={() => handleCreateNewInStudio('invoice')}
                  className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Create Invoice in Live Studio
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* Structured Table View */
              <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#1C1C1E]">
                    <thead className="bg-[#F5F5F7] text-[#48484A] text-[11px] uppercase font-bold border-b border-[#E5E5EA]">
                      <tr>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Load #</th>
                        <th className="px-4 py-3">Issue Date</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3 text-right">Total Amount</th>
                        <th className="px-4 py-3 text-right">Balance Due</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5EA]">
                      {filteredInvoices.map(inv => {
                        const paid = inv.amountPaid || 0;
                        const balance = Math.max(0, inv.totalAmount - paid);
                        const isPaid = balance === 0 && inv.totalAmount > 0;

                        return (
                          <tr key={inv.id} className="hover:bg-[#F9F9FA] transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                              {inv.invoiceNumber}
                            </td>
                            <td className="px-4 py-3 font-bold text-[#1C1C1E]">
                              {inv.customerName}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#8E8E93]">
                              {inv.loadNumber || '-'}
                            </td>
                            <td className="px-4 py-3 text-[#48484A]">
                              {inv.issueDate}
                            </td>
                            <td className="px-4 py-3 text-[#48484A]">
                              {inv.dueDate}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-[#1C1C1E]">
                              ${inv.totalAmount.toFixed(2)}
                            </td>
                            <td className={`px-4 py-3 text-right font-black ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              ${balance.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isPaid 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : paid > 0 
                                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {isPaid ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openInStudio({ type: 'invoice', data: inv })}
                                  title="Open in Wave WYSIWYG Studio"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit in Studio</span>
                                </button>
                                {!isPaid && (
                                  <button
                                    onClick={() => handleOpenRecordPayment(inv)}
                                    title="Record Payment"
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-lg border border-[#E5E5EA] transition-colors cursor-pointer"
                                  >
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownloadInvoicePDF(inv)}
                                  title="Download Official Carrier PDF"
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-lg border border-[#E5E5EA] transition-colors cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  title="Delete Invoice"
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Card Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInvoices.map(inv => {
                  const paid = inv.amountPaid || 0;
                  const balance = Math.max(0, inv.totalAmount - paid);
                  const isPaid = balance === 0 && inv.totalAmount > 0;

                  return (
                    <div key={inv.id} className="bg-white border border-[#E5E5EA] rounded-xl p-5 hover:border-[#C7C7CC] hover:shadow-xs transition-all flex flex-col justify-between space-y-4 shadow-2xs">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                              {inv.invoiceNumber}
                            </span>
                            <h3 className="font-bold text-[#1C1C1E] text-base mt-2">{inv.customerName}</h3>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isPaid 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : paid > 0 
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isPaid ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid'}
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#E5E5EA] grid grid-cols-2 gap-2 text-xs text-[#48484A]">
                          <div>
                            <span className="block text-[#8E8E93] text-[10px] uppercase font-bold">Load #</span>
                            <span className="font-mono font-bold text-[#1C1C1E]">{inv.loadNumber || '-'}</span>
                          </div>
                          <div>
                            <span className="block text-[#8E8E93] text-[10px] uppercase font-bold">Due Date</span>
                            <span className="font-semibold text-[#1C1C1E]">{inv.dueDate}</span>
                          </div>
                        </div>

                        <div className="mt-3 bg-[#F5F5F7] p-3 rounded-lg flex items-center justify-between border border-[#E5E5EA]">
                          <div>
                            <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Total Billed</span>
                            <span className="font-black text-sm text-[#1C1C1E]">${inv.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Balance Due</span>
                            <span className={`font-black text-sm ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              ${balance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#E5E5EA] gap-2">
                        <button
                          onClick={() => openInStudio({ type: 'invoice', data: inv })}
                          className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                          Open in Studio
                        </button>

                        <div className="flex items-center gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenRecordPayment(inv)}
                              className="px-2.5 py-1.5 bg-[#1C1C1E] hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                            >
                              Record Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadInvoicePDF(inv)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-lg border border-[#E5E5EA] cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FREIGHT ESTIMATES & QUOTES */}
        {activeTab === 'estimates' && (
          <div className="space-y-4">
            {filteredEstimates.length === 0 ? (
              <div className="bg-white border border-[#E5E5EA] rounded-xl p-12 text-center shadow-2xs">
                <Calculator className="w-12 h-12 text-[#8E8E93] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#1C1C1E]">No Freight Estimates Found</h3>
                <p className="text-xs text-[#8E8E93] max-w-md mx-auto mt-1">
                  No rate quotes match your filters. Click "New Estimate" to create and calculate a fresh freight quote in the Live Studio.
                </p>
                <button
                  onClick={() => handleCreateNewInStudio('estimate')}
                  className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Create Estimate in Live Studio
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* Structured Table View */
              <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#1C1C1E]">
                    <thead className="bg-[#F5F5F7] text-[#48484A] text-[11px] uppercase font-bold border-b border-[#E5E5EA]">
                      <tr>
                        <th className="px-4 py-3">Quote #</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Route Corridor</th>
                        <th className="px-4 py-3">Equipment</th>
                        <th className="px-4 py-3 text-right">Miles</th>
                        <th className="px-4 py-3 text-right">Total Quote</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5EA]">
                      {filteredEstimates.map(est => (
                        <tr key={est.id} className="hover:bg-[#F9F9FA] transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                            {est.quoteNumber}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#1C1C1E]">
                            {est.customerName}
                          </td>
                          <td className="px-4 py-3 text-[#48484A]">
                            <span className="font-semibold text-[#1C1C1E]">{est.originCity}, {est.originState}</span>
                            <span className="text-[#8E8E93] mx-1.5">→</span>
                            <span className="font-semibold text-[#1C1C1E]">{est.destCity}, {est.destState}</span>
                          </td>
                          <td className="px-4 py-3 text-[#8E8E93]">
                            {est.equipmentType}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-[#1C1C1E]">
                            {est.loadedMiles} mi
                          </td>
                          <td className="px-4 py-3 text-right font-black text-emerald-700">
                            ${est.totalQuoteAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              est.status === 'accepted' || est.status === 'converted_to_load'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : est.status === 'sent_to_customer'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-slate-100 text-[#48484A] border border-[#E5E5EA]'
                            }`}>
                              {est.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openInStudio({ type: 'estimate', data: est })}
                                title="Open in Wave WYSIWYG Studio"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit in Studio</span>
                              </button>
                              <button
                                onClick={() => handleConvertEstimateToInvoice(est)}
                                title="Convert Estimate to Invoice"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1C1C1E] hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Convert to Invoice</span>
                              </button>
                              <button
                                onClick={() => handleDownloadEstimatePDF(est)}
                                title="Download PDF"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-lg border border-[#E5E5EA] transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEstimate(est.id)}
                                title="Delete Estimate"
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Card Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEstimates.map(est => (
                  <div key={est.id} className="bg-white border border-[#E5E5EA] rounded-xl p-5 hover:border-[#C7C7CC] hover:shadow-xs transition-all flex flex-col justify-between space-y-4 shadow-2xs">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                            {est.quoteNumber}
                          </span>
                          <h3 className="font-bold text-[#1C1C1E] text-base mt-2">{est.customerName}</h3>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5F5F7] text-[#48484A] border border-[#E5E5EA] capitalize">
                          {est.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="mt-3 bg-[#F5F5F7] p-3 rounded-lg space-y-1.5 border border-[#E5E5EA]">
                        <div className="text-xs text-[#48484A] flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[#1C1C1E] font-bold">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {est.originCity}, {est.originState}
                          </span>
                          <span className="text-[#8E8E93]">→</span>
                          <span className="flex items-center gap-1 text-[#1C1C1E] font-bold">
                            <MapPin className="w-3.5 h-3.5 text-rose-600" />
                            {est.destCity}, {est.destState}
                          </span>
                        </div>
                        <div className="text-xs text-[#8E8E93] flex justify-between pt-1 border-t border-[#E5E5EA]">
                          <span>{est.equipmentType}</span>
                          <span className="font-mono font-medium text-[#1C1C1E]">{est.loadedMiles} loaded mi</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-[#8E8E93] font-bold uppercase text-[10px]">Total Rate Quote</span>
                        <span className="text-lg font-black text-emerald-700 font-mono">${est.totalQuoteAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#E5E5EA] gap-2">
                      <button
                        onClick={() => openInStudio({ type: 'estimate', data: est })}
                        className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                        Open in Studio
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleConvertEstimateToInvoice(est)}
                          className="px-2.5 py-1.5 bg-[#1C1C1E] hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          Convert to Inv
                        </button>
                        <button
                          onClick={() => handleDownloadEstimatePDF(est)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-lg border border-[#E5E5EA] cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: LIVE INTERACTIVE WAVE WYSIWYG DOCUMENT STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Studio Controls Header */}
            <div className="bg-white border border-[#E5E5EA] rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-[#1C1C1E] flex items-center gap-2">
                      Wave Interactive Document Studio
                    </h2>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                      WYSIWYG PDF Engine
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8E93]">
                    Real-time visual editor: live edit load specs, line items, remittance & initials directly on the document sheet
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Toggle between Invoice & Estimate */}
                <div className="bg-[#F5F5F7] p-1 rounded-xl border border-[#E5E5EA] flex items-center">
                  <button
                    type="button"
                    onClick={() => setStudioDoc(prev => ({
                      ...prev,
                      docType: 'invoice',
                      docNumber: prev.docNumber.startsWith('INV') ? prev.docNumber : `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
                    }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studioDoc.docType === 'invoice' 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'text-[#48484A] hover:text-[#1C1C1E]'
                    }`}
                  >
                    Invoice Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioDoc(prev => ({
                      ...prev,
                      docType: 'estimate',
                      docNumber: prev.docNumber.startsWith('EST') ? prev.docNumber : `EST-${Math.floor(1000 + Math.random() * 9000)}`
                    }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studioDoc.docType === 'estimate' 
                        ? 'bg-indigo-600 text-white shadow-2xs' 
                        : 'text-[#48484A] hover:text-[#1C1C1E]'
                    }`}
                  >
                    Estimate Mode
                  </button>
                </div>

                {/* Status selector */}
                <select
                  value={studioDoc.status}
                  onChange={e => setStudioDoc(prev => ({ ...prev, status: e.target.value as any }))}
                  className="bg-[#F5F5F7] border border-[#E5E5EA] text-xs font-semibold text-[#1C1C1E] rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="draft">Status: Draft</option>
                  <option value="sent">Status: Sent to Shipper</option>
                  <option value="approved">Status: Approved</option>
                  <option value="paid">Status: Paid & Settled</option>
                </select>

                {studioDoc.docType === 'estimate' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudioDoc(prev => ({
                        ...prev,
                        docType: 'invoice',
                        docNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                        remittanceNotes: 'REMITTANCE NOTICE: This invoice has been assigned and is payable exclusively to GREEN EXPRESS LLC / RTS Financial Services. ACH Routing: 071000013, Account: 9820148819.'
                      }));
                      showToast('Converted Estimate to Invoice Mode!');
                    }}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Convert Estimate directly to Invoice"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Convert to Invoice</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadStudioPDF}
                  className="px-3.5 py-2 bg-[#1C1C1E] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-[#1C1C1E] rounded-xl text-xs font-semibold border border-[#E5E5EA] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Print Document"
                >
                  <Printer className="w-3.5 h-3.5 text-[#8E8E93]" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendStudioEmail}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-[#1C1C1E] rounded-xl text-xs font-semibold border border-[#E5E5EA] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Email to Broker via Gmail"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Send Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveStudioDoc}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Document</span>
                </button>
              </div>
            </div>

            {/* Live WYSIWYG Document Canvas */}
            <div className="bg-[#EFEFF4] border border-[#E5E5EA] rounded-2xl p-4 sm:p-10 flex justify-center shadow-inner overflow-x-auto">
              <div className="bg-white text-slate-900 w-full max-w-4xl rounded-xl shadow-xl p-6 sm:p-12 border border-[#E5E5EA] space-y-8 text-sm font-sans relative">
                
                {/* Real Status Watermark Stamp */}
                {studioDoc.status === 'paid' && (
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-10 rotate-[-25deg] border-8 border-emerald-600 text-emerald-600 px-10 py-3 rounded-2xl font-black text-6xl tracking-widest opacity-25">
                    PAID
                  </div>
                )}
                {studioDoc.status === 'approved' && (
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-10 rotate-[-25deg] border-8 border-blue-600 text-blue-600 px-8 py-3 rounded-2xl font-black text-5xl tracking-widest opacity-25">
                    APPROVED
                  </div>
                )}

                {/* Document Header & Company Branding */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-900 text-white rounded-lg">
                        <Truck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h1 className="text-2xl font-black tracking-tight text-slate-900">{companyProfile.companyName}</h1>
                    </div>
                    <p className="text-xs text-slate-600">{companyProfile.address}, {companyProfile.city}, {companyProfile.state} {companyProfile.zip}</p>
                    <p className="text-xs text-slate-600">Direct Phone: <span className="font-semibold text-slate-800">{companyProfile.phone}</span> | Billing: <span className="font-semibold text-slate-800">{companyProfile.email}</span></p>
                    <div className="flex items-center gap-3 pt-1 text-xs font-mono font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">USDOT: {companyProfile.dotNumber}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">MC: {companyProfile.mcNumber}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-slate-900">
                      {studioDoc.docType === 'invoice' ? 'FREIGHT INVOICE' : 'RATE ESTIMATE'}
                    </h2>
                    <div className="mt-2 flex items-center justify-start sm:justify-end gap-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase">{studioDoc.docType === 'invoice' ? 'Invoice #' : 'Quote #'}:</span>
                      <input
                        type="text"
                        value={studioDoc.docNumber}
                        onChange={e => setStudioDoc(prev => ({ ...prev, docNumber: e.target.value }))}
                        className="font-mono font-black text-base text-slate-900 border-b border-dashed border-slate-300 hover:border-emerald-500 focus:border-emerald-600 focus:outline-none px-1 text-left sm:text-right w-36"
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-600 flex items-center justify-start sm:justify-end gap-2">
                      <span>Date:</span>
                      <input
                        type="date"
                        value={studioDoc.issueDate}
                        onChange={e => setStudioDoc(prev => ({ ...prev, issueDate: e.target.value }))}
                        className="font-mono text-xs text-slate-800 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-600 flex items-center justify-start sm:justify-end gap-2">
                      <span>{studioDoc.docType === 'invoice' ? 'Due Date:' : 'Expires:'}</span>
                      <input
                        type="date"
                        value={studioDoc.dueDate}
                        onChange={e => setStudioDoc(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="font-mono text-xs text-slate-800 border-b border-dashed border-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bill-To & Shipment Specifications 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  {/* Bill-To Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                        Billed To (Broker / Customer)
                      </span>
                      <select
                        onChange={e => {
                          const cust = customers.find(c => c.name === e.target.value);
                          if (cust) {
                            setStudioDoc(prev => ({
                              ...prev,
                              customerName: cust.name,
                              customerEmail: cust.email,
                              customerPhone: cust.phone,
                              billingAddress: cust.billingAddress,
                              paymentTerms: cust.defaultTerms
                            }));
                          }
                        }}
                        className="text-[11px] bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer"
                      >
                        <option value="">Quick select customer...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-bold block">Company Name</label>
                      <input
                        type="text"
                        value={studioDoc.customerName}
                        onChange={e => setStudioDoc(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="e.g. C.H. Robinson Worldwide"
                        className="w-full font-bold text-sm text-slate-900 border-b border-slate-300 focus:border-emerald-600 bg-transparent focus:outline-none py-0.5"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-bold block">Billing Address</label>
                      <input
                        type="text"
                        value={studioDoc.billingAddress}
                        onChange={e => setStudioDoc(prev => ({ ...prev, billingAddress: e.target.value }))}
                        placeholder="14701 Charlson Rd, Eden Prairie, MN 55347"
                        className="w-full text-xs text-slate-700 border-b border-slate-300 focus:border-emerald-600 bg-transparent focus:outline-none py-0.5"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Email</label>
                        <input
                          type="email"
                          value={studioDoc.customerEmail}
                          onChange={e => setStudioDoc(prev => ({ ...prev, customerEmail: e.target.value }))}
                          placeholder="billing@broker.com"
                          className="w-full text-xs text-slate-700 border-b border-slate-300 focus:border-emerald-600 bg-transparent focus:outline-none py-0.5 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Phone</label>
                        <input
                          type="text"
                          value={studioDoc.customerPhone}
                          onChange={e => setStudioDoc(prev => ({ ...prev, customerPhone: e.target.value }))}
                          placeholder="(800) 555-0199"
                          className="w-full text-xs text-slate-700 border-b border-slate-300 focus:border-emerald-600 bg-transparent focus:outline-none py-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipment Details Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                      Shipment & Order Specifications
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Broker Load / Order #</label>
                        <input
                          type="text"
                          value={studioDoc.loadNumber}
                          onChange={e => setStudioDoc(prev => ({ ...prev, loadNumber: e.target.value }))}
                          placeholder="LD-92041"
                          className="w-full font-mono font-bold text-xs text-slate-900 border-b border-slate-300 focus:border-emerald-600 bg-transparent focus:outline-none py-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Payment Terms</label>
                        <select
                          value={studioDoc.paymentTerms}
                          onChange={e => setStudioDoc(prev => ({ ...prev, paymentTerms: e.target.value }))}
                          className="w-full text-xs text-slate-800 bg-transparent border-b border-slate-300 focus:border-emerald-600 focus:outline-none py-0.5 cursor-pointer"
                        >
                          <option value="Net 30 Days">Net 30 Days</option>
                          <option value="Net 15 Days">Net 15 Days</option>
                          <option value="QuickPay 2%">QuickPay 2%</option>
                          <option value="Due on Receipt">Due on Receipt</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Origin (City, ST)</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={studioDoc.originCity}
                            onChange={e => setStudioDoc(prev => ({ ...prev, originCity: e.target.value }))}
                            placeholder="Chicago"
                            className="w-3/4 text-xs text-slate-800 border-b border-slate-300 bg-transparent focus:outline-none py-0.5"
                          />
                          <input
                            type="text"
                            value={studioDoc.originState}
                            onChange={e => setStudioDoc(prev => ({ ...prev, originState: e.target.value.toUpperCase() }))}
                            placeholder="IL"
                            maxLength={2}
                            className="w-1/4 text-xs font-mono uppercase text-slate-800 border-b border-slate-300 bg-transparent focus:outline-none py-0.5 text-center"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Destination (City, ST)</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={studioDoc.destCity}
                            onChange={e => setStudioDoc(prev => ({ ...prev, destCity: e.target.value }))}
                            placeholder="Dallas"
                            className="w-3/4 text-xs text-slate-800 border-b border-slate-300 bg-transparent focus:outline-none py-0.5"
                          />
                          <input
                            type="text"
                            value={studioDoc.destState}
                            onChange={e => setStudioDoc(prev => ({ ...prev, destState: e.target.value.toUpperCase() }))}
                            placeholder="TX"
                            maxLength={2}
                            className="w-1/4 text-xs font-mono uppercase text-slate-800 border-b border-slate-300 bg-transparent focus:outline-none py-0.5 text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Equipment Type</label>
                        <select
                          value={studioDoc.equipmentType}
                          onChange={e => setStudioDoc(prev => ({ ...prev, equipmentType: e.target.value }))}
                          className="w-full text-xs text-slate-800 bg-transparent border-b border-slate-300 focus:border-emerald-600 focus:outline-none py-0.5 cursor-pointer"
                        >
                          <option value="53ft Refrigerated Trailer">53ft Refrigerated Trailer (-10°F)</option>
                          <option value="53ft Dry Van">53ft Dry Van</option>
                          <option value="Flatbed">Flatbed Standard</option>
                          <option value="Stepdeck">Stepdeck Specialized</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Loaded Miles</label>
                        <input
                          type="number"
                          value={studioDoc.loadedMiles}
                          onChange={e => {
                            const m = Number(e.target.value) || 0;
                            setStudioDoc(prev => ({ ...prev, loadedMiles: m }));
                          }}
                          className="w-full font-mono text-xs text-slate-800 border-b border-slate-300 bg-transparent focus:outline-none py-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Itemized Line Items Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Itemized Freight Transportation & Accessorials
                    </h3>
                    <span className="text-[11px] text-slate-500">Click any field to edit directly</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                        <tr>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-3 py-3 w-32">Category</th>
                          <th className="px-3 py-3 w-24 text-right">Qty / Miles</th>
                          <th className="px-3 py-3 w-28 text-right">Rate ($)</th>
                          <th className="px-4 py-3 w-32 text-right">Line Total</th>
                          <th className="px-2 py-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {studioDoc.lineItems.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                value={item.description}
                                onChange={e => handleStudioUpdateLineItem(item.id, 'description', e.target.value)}
                                className="w-full text-slate-900 font-medium bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-600 py-0.5"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <select
                                value={item.category}
                                onChange={e => handleStudioUpdateLineItem(item.id, 'category', e.target.value)}
                                className="w-full bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-700 cursor-pointer"
                              >
                                <option value="linehaul">Linehaul</option>
                                <option value="fuel_surcharge">Fuel (FSC)</option>
                                <option value="detention">Detention</option>
                                <option value="lumper">Lumper</option>
                                <option value="stop_off">Stop-Off</option>
                                <option value="hazmat">Hazmat</option>
                                <option value="other">Other</option>
                              </select>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={e => handleStudioUpdateLineItem(item.id, 'quantity', e.target.value)}
                                className="w-full text-right font-mono text-slate-800 bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-600 py-0.5"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono">
                              <input
                                type="number"
                                step="0.01"
                                value={item.rate}
                                onChange={e => handleStudioUpdateLineItem(item.id, 'rate', e.target.value)}
                                className="w-full text-right font-mono text-slate-800 bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-600 py-0.5"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right font-black font-mono text-slate-900 text-sm">
                              ${item.amount.toFixed(2)}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleStudioRemoveLineItem(item.id)}
                                disabled={studioDoc.lineItems.length <= 1}
                                className="text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer p-1"
                                title="Delete line item"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Line Item Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleStudioAddLineItem()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      Add Custom Line Item
                    </button>

                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => handleStudioAddLineItem({ desc: 'DOE National Diesel Surcharge Allowance ($0.45/mi)', rate: 414.00, category: 'fuel_surcharge' })}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                      >
                        + Fuel Surcharge
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStudioAddLineItem({ desc: 'Driver Detention Surcharge (2 hrs free, $75/hr beyond)', rate: 150.00, category: 'detention' })}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                      >
                        + Detention ($75/hr)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStudioAddLineItem({ desc: 'Warehouse Lumper Unloading Reimbursement (Receipt attached)', rate: 220.00, category: 'lumper' })}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                      >
                        + Lumper ($220)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calculations & Total Summary Block */}
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <div className="w-full sm:w-80 space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Itemized Subtotal:</span>
                      <span className="font-mono font-bold text-slate-900">${studioSubtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={studioDoc.applyQuickPayDiscount}
                          onChange={e => setStudioDoc(prev => ({ ...prev, applyQuickPayDiscount: e.target.checked }))}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>Apply 2% QuickPay / Factoring</span>
                      </label>
                      {studioDoc.applyQuickPayDiscount && (
                        <span className="font-mono text-rose-600 font-bold">-${studioQuickPayDeduction.toFixed(2)}</span>
                      )}
                    </div>

                    <div className="flex justify-between items-baseline pt-3 border-t-2 border-slate-900 text-slate-900">
                      <span className="text-base font-black uppercase tracking-wider">Total Balance Due:</span>
                      <span className="text-2xl font-black font-mono text-emerald-700">
                        ${studioTotalDue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notice of Assignment / Remittance Notice */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <span className="font-black text-slate-800 uppercase tracking-wider block">
                    Payment Remittance Instructions & Notice of Assignment
                  </span>
                  <textarea
                    rows={2}
                    value={studioDoc.remittanceNotes}
                    onChange={e => setStudioDoc(prev => ({ ...prev, remittanceNotes: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-slate-700 focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-slate-500">
                    Make all checks or ACH direct deposits payable to GREEN EXPRESS LLC or our designated factoring agent.
                  </p>
                </div>

                {/* Shipper & Carrier Acceptance Block with Live Initials & Certified Seal */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                      Authorized Cargo Acceptance & Initials
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      I certify that freight cargo described herein has been tendered and accepted under published carrier safety terms and conditions.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Authorized Signatory</label>
                        <input
                          type="text"
                          value={studioDoc.signatoryName}
                          onChange={e => setStudioDoc(prev => ({ ...prev, signatoryName: e.target.value }))}
                          placeholder="e.g. Amanda Vance"
                          className="w-full text-xs font-semibold text-slate-900 border-b border-slate-300 focus:border-emerald-600 bg-transparent focus:outline-none py-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block">Shipper Initials</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={studioDoc.signatoryInitials}
                          onChange={e => setStudioDoc(prev => ({ ...prev, signatoryInitials: e.target.value.toUpperCase() }))}
                          placeholder="AV"
                          className="w-20 text-center font-mono font-black text-sm text-slate-900 border-2 border-slate-300 rounded bg-slate-50 focus:border-emerald-600 focus:outline-none py-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-center">
                    {studioDoc.hasOfficialStamp ? (
                      <div className="border-2 border-emerald-600 bg-emerald-50/60 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs">
                        <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                        <div className="text-left leading-tight">
                          <span className="font-black text-xs uppercase tracking-wider block text-emerald-900">
                            GREEN EXPRESS LLC
                          </span>
                          <span className="text-[10px] font-bold block text-emerald-700">
                            CERTIFIED FREIGHT DOCUMENT
                          </span>
                          <span className="text-[9px] font-mono block text-emerald-600 mt-0.5">
                            STAMPED: {studioDoc.signatureDate} · VERIFIED
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStudioDoc(prev => ({ ...prev, hasOfficialStamp: true }))}
                        className="px-3 py-1.5 border border-dashed border-slate-400 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        + Affix Official Carrier Stamp
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS LEDGER */}
        {activeTab === 'payments' && (
          <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden shadow-2xs space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  Payments Received & Settlement Ledger
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">Detailed records of ACH, Wire, Check, and Factoring Remittances</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1C1C1E]">
                <thead className="bg-[#F5F5F7] text-[#48484A] text-[11px] uppercase font-bold border-b border-[#E5E5EA]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Reference #</th>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-[#F9F9FA] transition-colors">
                      <td className="px-4 py-3 text-[#48484A] font-mono">{p.paymentDate}</td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-700">{p.referenceNumber}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">{p.invoiceNumber}</td>
                      <td className="px-4 py-3 font-bold text-[#1C1C1E]">{p.customerName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#1C1C1E] text-xs font-semibold border border-[#E5E5EA]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 font-mono text-sm">
                        ${p.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMER DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map(cust => (
              <div key={cust.id} className="bg-white border border-[#E5E5EA] rounded-xl p-5 hover:border-[#C7C7CC] hover:shadow-xs transition-all space-y-4 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[#1C1C1E] text-base">{cust.name}</h3>
                    <p className="text-xs text-[#8E8E93]">{cust.contactName}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#1C1C1E] text-xs font-semibold border border-[#E5E5EA]">
                    {cust.defaultTerms}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-[#48484A] pt-2 border-t border-[#E5E5EA]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#8E8E93]" />
                    <span>{cust.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#8E8E93]" />
                    <span>{cust.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#8E8E93]" />
                    <span className="truncate">{cust.billingAddress}</span>
                  </div>
                </div>

                <div className="bg-[#F5F5F7] p-3 rounded-lg flex items-center justify-between text-xs border border-[#E5E5EA]">
                  <div>
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Total Invoiced</span>
                    <span className="font-black text-[#1C1C1E]">${cust.totalInvoiced.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Outstanding A/R</span>
                    <span className={`font-black ${cust.outstandingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      ${cust.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: FUEL SURCHARGE RULES */}
        {activeTab === 'fuel_rules' && (
          <div className="bg-white border border-[#E5E5EA] rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                    <Fuel className="w-4 h-4" />
                  </div>
                  Fuel Surcharge Index & Surcharge Matrix
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">Configure DOE weekly diesel average adjustments & custom customer surcharge rules</p>
              </div>
              <button
                onClick={() => { setEditingRule(null); setShowFuelRuleModal(true); }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Fuel Rule
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fuelRules.map(rule => (
                <div key={rule.id} className="bg-[#F5F5F7] border border-[#E5E5EA] p-4 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#1C1C1E] text-sm flex items-center gap-2">
                        {rule.name}
                        {rule.isDefault && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200">
                            DEFAULT
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-[#8E8E93] mt-1">{rule.notes}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-[#E5E5EA]">
                    <div>
                      <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Surcharge Rate</span>
                      <span className="font-mono font-black text-emerald-700">
                        {rule.category === 'per_mile' ? `$${rule.ratePerMile.toFixed(2)} / mi` : `$${rule.ratePerMile.toFixed(2)} flat`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#8E8E93] text-[10px] uppercase font-bold block">Base Diesel Index</span>
                      <span className="font-mono font-bold text-[#1C1C1E]">
                        ${rule.baseDoeDieselPrice.toFixed(2)} / gal
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL: CREATE ESTIMATE --- */}
      {showCreateEstimateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-white">
              <h3 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  <Calculator className="w-4 h-4" />
                </div>
                Create New Freight Estimate
              </h3>
              <button onClick={() => setShowCreateEstimateModal(false)} className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] rounded-lg hover:bg-[#F5F5F7] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const custName = fd.get('customerName') as string;
                const origCity = fd.get('originCity') as string;
                const origState = fd.get('originState') as string;
                const destCity = fd.get('destCity') as string;
                const destState = fd.get('destState') as string;
                const miles = parseFloat(fd.get('miles') as string) || 500;
                const rpm = parseFloat(fd.get('ratePerMile') as string) || 2.85;
                const equip = fd.get('equipment') as FreightEstimate['equipmentType'] || '53ft Dry Van';
                const fscRate = parseFloat(fd.get('fscRate') as string) || 0.45;

                const linehaul = miles * rpm;
                const fsc = miles * fscRate;
                const total = linehaul + fsc;

                const newEst: FreightEstimate = {
                  id: `est-${Date.now()}`,
                  quoteNumber: `EST-${Math.floor(1000 + Math.random() * 9000)}`,
                  customerName: custName,
                  customerEmail: 'billing@shipper.com',
                  customerPhone: '(800) 555-0199',
                  originCity: origCity,
                  originState: origState,
                  destCity: destCity,
                  destState: destState,
                  equipmentType: equip,
                  loadedMiles: miles,
                  deadheadMiles: 20,
                  ratePerMile: rpm,
                  linehaulTotal: linehaul,
                  fuelSurchargePerMile: fscRate,
                  fuelSurchargeTotal: fsc,
                  accessorials: [],
                  totalQuoteAmount: total,
                  targetMarginPct: 18,
                  estimatedDriverPay: linehaul * 0.75,
                  estimatedNetProfit: total * 0.18,
                  pickupDate: new Date().toISOString().split('T')[0],
                  deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                  commodity: 'General Freight',
                  weightLbs: 42000,
                  specialInstructions: 'Standard dock appointment required.',
                  status: 'draft',
                  notes: 'Generated via Freight Financial Hub',
                  createdAt: new Date().toISOString().split('T')[0],
                  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
                };

                if (setEstimates) {
                  setEstimates(prev => [newEst, ...prev]);
                } else if (onAddEstimate) {
                  onAddEstimate(newEst);
                }
                setShowCreateEstimateModal(false);
                showToast(`Created Estimate #${newEst.quoteNumber}`);
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Customer / Shipper Name</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    defaultValue="C.H. Robinson Worldwide"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Equipment Type</label>
                  <select
                    name="equipment"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="53ft Dry Van">53ft Dry Van</option>
                    <option value="53ft Reefer">53ft Reefer</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Stepdeck">Stepdeck</option>
                    <option value="Power Only">Power Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Origin City</label>
                  <input
                    type="text"
                    name="originCity"
                    required
                    defaultValue="Chicago"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Origin State</label>
                  <input
                    type="text"
                    name="originState"
                    required
                    defaultValue="IL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Destination City</label>
                  <input
                    type="text"
                    name="destCity"
                    required
                    defaultValue="Dallas"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Destination State</label>
                  <input
                    type="text"
                    name="destState"
                    required
                    defaultValue="TX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Loaded Miles</label>
                  <input
                    type="number"
                    name="miles"
                    required
                    defaultValue="920"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Base Rate / Mile ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="ratePerMile"
                    required
                    defaultValue="2.85"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fuel Surcharge / Mile ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="fscRate"
                    required
                    defaultValue="0.45"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateEstimateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-500 shadow-md"
                >
                  Save Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREATE INVOICE --- */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-white">
              <h3 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  <FileText className="w-4 h-4" />
                </div>
                Create New Carrier Invoice
              </h3>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] rounded-lg hover:bg-[#F5F5F7] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const custName = fd.get('customerName') as string;
                const loadNum = fd.get('loadNumber') as string;
                const amount = parseFloat(fd.get('amount') as string) || 2500;
                const terms = fd.get('terms') as string || 'Net 30 Days';

                const newInvNum = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

                const newInv: ProposedInvoice = {
                  id: `inv-manual-${Date.now()}`,
                  invoiceNumber: newInvNum,
                  projectId: `prj-${Date.now()}`,
                  loadNumber: loadNum,
                  customerName: custName,
                  customerEmail: 'billing@customer.com',
                  billingAddress: 'Customer Billing Address',
                  paymentTerms: terms,
                  issueDate: new Date().toISOString().split('T')[0],
                  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                  lineItems: [
                    {
                      id: `li-1`,
                      description: `Freight Linehaul & Fuel Surcharge for Load #${loadNum}`,
                      type: 'linehaul',
                      amount: amount,
                      sourceDoc: 'RateConfirmation'
                    }
                  ],
                  subtotal: amount,
                  taxRate: 0,
                  taxAmount: 0,
                  totalAmount: amount,
                  amountPaid: 0,
                  balanceDue: amount,
                  status: 'ready_to_send',
                  attachedDocIds: []
                };

                if (setInvoices) {
                  setInvoices(prev => [newInv, ...prev]);
                } else if (onAddInvoice) {
                  onAddInvoice(newInv);
                }
                setShowCreateInvoiceModal(false);
                showToast(`Created Invoice #${newInvNum}`);
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    defaultValue="Total Quality Logistics (TQL)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Load / Order Number</label>
                  <input
                    type="text"
                    name="loadNumber"
                    required
                    defaultValue={`LD-${Math.floor(10000 + Math.random() * 90000)}`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Billed Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    required
                    defaultValue="3250.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Terms</label>
                  <select
                    name="terms"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 60 Days">Net 60 Days</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5EA] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-xl text-xs font-semibold cursor-pointer border border-[#E5E5EA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: RECORD PAYMENT --- */}
      {showRecordPaymentModal && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#E5E5EA] flex items-center justify-between bg-white">
              <h3 className="text-base font-bold text-[#1C1C1E] flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  <DollarSign className="w-4 h-4" />
                </div>
                Record Settlement Payment
              </h3>
              <button onClick={() => setShowRecordPaymentModal(false)} className="p-1.5 text-[#8E8E93] hover:text-[#1C1C1E] rounded-lg hover:bg-[#F5F5F7] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              <div className="bg-[#F5F5F7] p-3.5 rounded-xl border border-[#E5E5EA]">
                <span className="text-[10px] text-[#8E8E93] uppercase font-bold block">Applying Payment to</span>
                <p className="font-bold text-[#1C1C1E] text-sm mt-0.5">
                  Invoice #{selectedInvoiceForPayment.invoiceNumber} - {selectedInvoiceForPayment.customerName}
                </p>
                <div className="flex justify-between text-xs mt-2 pt-2 border-t border-[#E5E5EA]">
                  <span className="text-[#8E8E93]">Total Billed: ${selectedInvoiceForPayment.totalAmount.toFixed(2)}</span>
                  <span className="text-amber-700 font-black">
                    Balance Due: ${(selectedInvoiceForPayment.totalAmount - (selectedInvoiceForPayment.amountPaid || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  required
                  defaultValue={(selectedInvoiceForPayment.totalAmount - (selectedInvoiceForPayment.amountPaid || 0)).toFixed(2)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs font-medium text-[#1C1C1E] focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="ACH">ACH Direct Deposit</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Factoring Remittance">Factoring Remittance</option>
                  <option value="Check">Check</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Reference / Trace #</label>
                <input
                  type="text"
                  name="referenceNumber"
                  placeholder="e.g. ACH-992014"
                  defaultValue={`REF-${Math.floor(100000 + Math.random() * 900000)}`}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs font-mono text-[#1C1C1E] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1E] mb-1">Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs text-[#1C1C1E] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E5EA] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-xl text-xs font-semibold cursor-pointer border border-[#E5E5EA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- INTERACTIVE PAPERWORK STUDIO MODAL SHEET --- */}
      {selectedDocForStudio && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Studio Header */}
            <div className="p-4 bg-white border-b border-[#E5E5EA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1C1C1E] text-base flex items-center gap-2">
                    Official Carrier Document Sheet
                    <span className="text-xs bg-[#F5F5F7] text-[#1C1C1E] px-2.5 py-0.5 rounded-full uppercase font-mono font-bold border border-[#E5E5EA]">
                      {selectedDocForStudio.type}
                    </span>
                  </h3>
                  <p className="text-xs text-[#8E8E93]">Full-page carrier paperwork with official Green Express LLC branding</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const doc = selectedDocForStudio;
                    setSelectedDocForStudio(null);
                    openInStudio(doc);
                  }}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit in Live Studio
                </button>

                <button
                  onClick={async () => {
                    if (selectedDocForStudio.type === 'estimate') {
                      await generateFreightEstimatePDF(selectedDocForStudio.data as FreightEstimate, companyProfile);
                    } else {
                      await generateCarrierInvoicePDF(selectedDocForStudio.data as ProposedInvoice, companyProfile);
                    }
                    showToast('PDF Export Complete!');
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#1C1C1E] hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Download PDF
                </button>

                <button
                  onClick={() => setSelectedDocForStudio(null)}
                  className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] rounded-xl hover:bg-[#F5F5F7] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Studio Paper Canvas Preview Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#EFEFF4] flex justify-center">
              <div className="bg-white text-slate-900 w-full max-w-3xl rounded-xl shadow-xl p-8 space-y-6 text-sm font-sans border border-[#E5E5EA]">
                {/* Document Letterhead */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">{companyProfile.companyName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{companyProfile.address}</p>
                    <p className="text-xs text-slate-500">Phone: {companyProfile.phone} | Email: {companyProfile.email}</p>
                    <p className="text-xs font-mono text-slate-600 mt-1">USDOT: {companyProfile.dotNumber} | MC: {companyProfile.mcNumber}</p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-extrabold uppercase tracking-wider text-emerald-700">
                      {selectedDocForStudio.type === 'estimate' ? 'RATE ESTIMATE' : 'INVOICE'}
                    </h1>
                    <p className="font-mono font-bold text-slate-800 text-base mt-1">
                      {selectedDocForStudio.type === 'estimate' 
                        ? (selectedDocForStudio.data as FreightEstimate).quoteNumber 
                        : (selectedDocForStudio.data as ProposedInvoice).invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Date: {new Date().toISOString().split('T')[0]}
                    </p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Billed To</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedDocForStudio.data.customerName}</p>
                    <p className="text-xs text-slate-600">{selectedDocForStudio.data.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Reference Details</span>
                    {selectedDocForStudio.type === 'estimate' ? (
                      <p className="text-xs text-slate-700">
                        Equipment: {(selectedDocForStudio.data as FreightEstimate).equipmentType}<br />
                        Route: {(selectedDocForStudio.data as FreightEstimate).originCity} → {(selectedDocForStudio.data as FreightEstimate).destCity}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-700">
                        Load #: {(selectedDocForStudio.data as ProposedInvoice).loadNumber}<br />
                        Terms: {(selectedDocForStudio.data as ProposedInvoice).paymentTerms}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedDocForStudio.type === 'estimate' ? (
                        <>
                          <tr>
                            <td className="px-4 py-2.5 text-slate-800">
                              Freight Linehaul Transportation ({(selectedDocForStudio.data as FreightEstimate).loadedMiles} mi @ ${(selectedDocForStudio.data as FreightEstimate).ratePerMile}/mi)
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                              ${(selectedDocForStudio.data as FreightEstimate).linehaulTotal.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 text-slate-800">
                              DOE Fuel Surcharge Allowance ({(selectedDocForStudio.data as FreightEstimate).loadedMiles} mi @ ${(selectedDocForStudio.data as FreightEstimate).fuelSurchargePerMile}/mi)
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                              ${(selectedDocForStudio.data as FreightEstimate).fuelSurchargeTotal.toFixed(2)}
                            </td>
                          </tr>
                        </>
                      ) : (
                        (selectedDocForStudio.data as ProposedInvoice).lineItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2.5 text-slate-800">{item.description}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">${item.amount.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Totals */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between pt-2 border-t border-slate-300 font-extrabold text-slate-900 text-base">
                      <span>Total Amount:</span>
                      <span className="text-emerald-700">
                        ${(selectedDocForStudio.type === 'estimate'
                          ? (selectedDocForStudio.data as FreightEstimate).totalQuoteAmount
                          : (selectedDocForStudio.data as ProposedInvoice).totalAmount
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Remittance / Footer Notes */}
                <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700 uppercase tracking-wider">Remittance Information</p>
                  <p>Make all checks payable to: <strong className="text-slate-800">{companyProfile.companyName}</strong></p>
                  <p>For electronic ACH or Wire Transfer, please refer to contract billing terms or contact billing support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FreightEstimatesHub;
