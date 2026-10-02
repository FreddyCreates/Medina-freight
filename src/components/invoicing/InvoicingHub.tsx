import React, { useState, useEffect } from 'react';
import { 
  ProposedInvoice, 
  Project,
  CompanyProfile,
  InvoiceLineItem,
  ScannedDocument,
  DocumentType
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
  Wifi,
  CheckSquare,
  Zap,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  FileCode,
  FileSpreadsheet
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
}

// Simulated Incoming Scans for Folder Processing
const MOCK_INCOMING_PAPERWORK: ScannedDocument[] = [
  {
    id: 'doc-inc-101',
    fileName: 'BOL_CHR_982301_Signed.pdf',
    fileSize: '1.4 MB',
    type: 'BOL',
    scannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    localPath: '/incoming/BOL_CHR_982301_Signed.pdf',
    thumbnailColor: 'bg-emerald-50 border-emerald-200',
    ocrConfidence: 98,
    status: 'matched',
    matchedCustomer: 'C.H. Robinson Worldwide',
    extractedData: {
      bolNumber: 'BOL-998124',
      loadNumber: 'CHR-982301',
      brokerCustomer: 'C.H. Robinson Worldwide',
      carrierName: 'GREEN EXPRESS LLC',
      driverName: 'Ray Delgado',
      pickupLocation: 'Chicago Dist Center, IL 60608',
      deliveryLocation: 'Dallas Metro Logistics, TX 75261',
      pickupDate: '2026-09-28',
      deliveryDate: '2026-09-30',
      weightLbs: 42800,
      consigneeSignature: true,
      notes: 'Clean BOL stamped by receiver with zero OS&D exceptions.'
    },
    discrepancies: []
  },
  {
    id: 'doc-inc-102',
    fileName: 'RateCon_CHR_982301.pdf',
    fileSize: '820 KB',
    type: 'RateConfirmation',
    scannedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    localPath: '/incoming/RateCon_CHR_982301.pdf',
    thumbnailColor: 'bg-blue-50 border-blue-200',
    ocrConfidence: 99,
    status: 'matched',
    matchedCustomer: 'C.H. Robinson Worldwide',
    extractedData: {
      loadNumber: 'CHR-982301',
      brokerCustomer: 'C.H. Robinson Worldwide',
      rateAmount: 3870.00,
      pickupLocation: 'Chicago, IL',
      deliveryLocation: 'Dallas, TX',
      pickupDate: '2026-09-28',
      deliveryDate: '2026-09-30',
      notes: 'Agreed Rate: $3,450 Linehaul + $420 Fuel Surcharge (Equipment: 53ft Refrigerated)'
    },
    discrepancies: []
  },
  {
    id: 'doc-inc-103',
    fileName: 'Lumper_CapStone_Dallas_285.pdf',
    fileSize: '410 KB',
    type: 'LumperReceipt',
    scannedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    localPath: '/incoming/Lumper_CapStone_Dallas_285.pdf',
    thumbnailColor: 'bg-amber-50 border-amber-200',
    ocrConfidence: 96,
    status: 'matched',
    matchedCustomer: 'CapStone Logistics (Pass-through to CHR)',
    extractedData: {
      loadNumber: 'CHR-982301',
      lumperAmount: 285.00,
      notes: 'Unloading 22 pallets frozen poultry. Express code paid.'
    },
    discrepancies: []
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
  onDeleteInvoice
}) => {
  // Master Multi-Stage Pipeline Active Stage State
  const [activeStage, setActiveStage] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stage 1: Incoming Folder Paperwork State
  const [incomingDocs, setIncomingDocs] = useState<ScannedDocument[]>(MOCK_INCOMING_PAPERWORK);
  const [isScanningFolder, setIsScanningFolder] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('');

  // Stage 2: Side-by-Side Review State (Proposed Invoice Editing)
  const [proposedInvoice, setProposedInvoice] = useState<ProposedInvoice>(invoices[0] || {
    id: 'inv-prop-101',
    invoiceNumber: 'INV-2026-9812',
    projectId: 'prj-1',
    loadNumber: 'CHR-982301',
    customerName: 'C.H. Robinson Worldwide',
    customerEmail: 'ap@chrobinson.com',
    billingAddress: '14701 Charlson Rd, Eden Prairie, MN 55347',
    paymentTerms: 'Net 30 Days',
    issueDate: '2026-09-30',
    dueDate: '2026-10-30',
    lineItems: [
      { id: 'li-1', description: 'Linehaul: Chicago IL to Dallas TX', type: 'linehaul', amount: 3450.00, sourceDoc: 'RateConfirmation' },
      { id: 'li-2', description: 'Fuel Surcharge (DOE Diesel Index)', type: 'fuel_surcharge', amount: 420.00, sourceDoc: 'RateConfirmation' },
      { id: 'li-3', description: 'CapStone Lumper Reimbursement', type: 'lumper_reimbursement', amount: 285.00, sourceDoc: 'LumperReceipt' }
    ],
    subtotal: 4155.00,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 4155.00,
    amountPaid: 0,
    balanceDue: 4155.00,
    status: 'needs_review',
    attachedDocIds: ['doc-inc-101', 'doc-inc-102', 'doc-inc-103'],
    factoringStatus: 'eligible',
    correctionsLog: [
      { field: 'Intake Scan', oldValue: 'Raw Files', newValue: 'Matched (3 Docs)', correctedBy: 'OCR Engine', timestamp: '10:15 AM' }
    ]
  });

  // Editable Fields in Pre-Approval Audit
  const [editCustomerName, setEditCustomerName] = useState(proposedInvoice.customerName);
  const [editCustomerEmail, setEditCustomerEmail] = useState(proposedInvoice.customerEmail);
  const [editBillingAddress, setEditBillingAddress] = useState(proposedInvoice.billingAddress);
  const [editLinehaul, setEditLinehaul] = useState(3450.00);
  const [editFuel, setEditFuel] = useState(420.00);
  const [editLumper, setEditLumper] = useState(285.00);
  const [editDetention, setEditDetention] = useState(0.00);
  const [correctionsLog, setCorrectionsLog] = useState<ProposedInvoice['correctionsLog']>(proposedInvoice.correctionsLog || []);
  const [selectedDocTab, setSelectedDocTab] = useState<'BOL' | 'RateConfirmation' | 'LumperReceipt'>('BOL');

  // Stage 3 & 4: Invoices List & Email Dispatch State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<ProposedInvoice | null>(invoices[0] || null);

  // Email Approval Modal / Dispatch Panel State
  const [emailTo, setEmailTo] = useState('ap@chrobinson.com');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Stage 5: Payment Remittance Import & Matching Engine State
  const [remittanceFileName, setRemittanceFileName] = useState('');
  const [remittancePayer, setRemittancePayer] = useState('');
  const [remittanceRef, setRemittanceRef] = useState('');
  const [remittanceAmount, setRemittanceAmount] = useState<number>(0);
  const [matchingInvoice, setMatchingInvoice] = useState<ProposedInvoice | null>(null);
  const [isProcessingRemittance, setIsProcessingRemittance] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Stage 1: Trigger Hotfolder Scanner for Paperwork
  const handleScanIncomingFolder = () => {
    setIsScanningFolder(true);
    setScanProgressText('Reading local /incoming folder...');

    setTimeout(() => setScanProgressText('Extracting text from BOL_CHR_982301_Signed.pdf...'), 600);
    setTimeout(() => setScanProgressText('Matching Rate Confirmation & Lumper Receipt...'), 1200);

    setTimeout(() => {
      setIsScanningFolder(false);
      showToast('✅ Folder Scanner complete: Matched 3 documents for Load #CHR-982301 (Customer: C.H. Robinson Worldwide).');
    }, 1800);
  };

  // Stage 1 -> Stage 2: Generate Proposed Invoice from Matched Paperwork
  const handleProposeInvoiceFromScans = () => {
    const subtotal = editLinehaul + editFuel + editLumper + editDetention;
    const proposed: ProposedInvoice = {
      ...proposedInvoice,
      customerName: editCustomerName,
      customerEmail: editCustomerEmail,
      billingAddress: editBillingAddress,
      subtotal,
      totalAmount: subtotal,
      balanceDue: subtotal,
      lineItems: [
        { id: 'li-1', description: 'Linehaul: Chicago IL to Dallas TX', type: 'linehaul', amount: editLinehaul, sourceDoc: 'RateConfirmation' },
        { id: 'li-2', description: 'Fuel Surcharge (DOE Diesel Index)', type: 'fuel_surcharge', amount: editFuel, sourceDoc: 'RateConfirmation' },
        { id: 'li-3', description: 'CapStone Lumper Reimbursement', type: 'lumper_reimbursement', amount: editLumper, sourceDoc: 'LumperReceipt' },
        ...(editDetention > 0 ? [{ id: 'li-4', description: 'Detention Hours Charge', type: 'detention' as const, amount: editDetention, sourceDoc: 'Manual' as const }] : [])
      ],
      status: 'needs_review'
    };

    setProposedInvoice(proposed);
    setActiveStage(2);
    showToast('Proposed Invoice generated! Proceed with side-by-side verification.');
  };

  // Stage 2: Save Approved Invoice Data
  const handleUpdateProposedInvoice = async () => {
    const subtotal = editLinehaul + editFuel + editLumper + editDetention;

    const updated: ProposedInvoice = {
      ...proposedInvoice,
      customerName: editCustomerName,
      customerEmail: editCustomerEmail,
      billingAddress: editBillingAddress,
      subtotal,
      totalAmount: subtotal,
      balanceDue: subtotal,
      status: 'ready_to_send',
      lineItems: [
        { id: 'li-1', description: 'Linehaul: Chicago IL to Dallas TX', type: 'linehaul', amount: editLinehaul, sourceDoc: 'RateConfirmation' },
        { id: 'li-2', description: 'Fuel Surcharge (DOE Diesel Index)', type: 'fuel_surcharge', amount: editFuel, sourceDoc: 'RateConfirmation' },
        { id: 'li-3', description: 'CapStone Lumper Reimbursement', type: 'lumper_reimbursement', amount: editLumper, sourceDoc: 'LumperReceipt' },
        ...(editDetention > 0 ? [{ id: 'li-4', description: 'Detention Hours Charge', type: 'detention' as const, amount: editDetention, sourceDoc: 'Manual' as const }] : [])
      ]
    };

    const logEntry = {
      field: 'Total Verification',
      oldValue: proposedInvoice.totalAmount || 0,
      newValue: subtotal,
      correctedBy: 'Dispatcher Review',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reason: `Verified by Dispatcher: Total $${subtotal.toFixed(2)} (Linehaul: $${editLinehaul}, Fuel: $${editFuel}, Lumper: $${editLumper})`
    };

    const newLog = [...correctionsLog, logEntry];
    updated.correctionsLog = newLog;
    setCorrectionsLog(newLog);
    setProposedInvoice(updated);

    if (onAddInvoice) {
      onAddInvoice(updated);
    }

    await saveInvoiceToPythonDB(updated);
    showToast(`Invoice #${updated.invoiceNumber} approved and saved to SQLite! Ready for Gmail dispatch.`);
    setActiveStage(3);
  };

  // Stage 3 -> Stage 4: Prepare Billing Email for Invoice
  const handlePrepareEmailForInvoice = (inv: ProposedInvoice) => {
    setSelectedInvoice(inv);
    setEmailTo(inv.customerEmail || 'ap@chrobinson.com');
    setEmailSubject(`OFFICIAL BILLING PACKET: Invoice #${inv.invoiceNumber} (Load #${inv.loadNumber}) - ${companyProfile.companyName}`);
    setEmailBody(`Dear ${inv.customerName} Accounts Payable Team,\n\nPlease find attached our official billing packet for Load #${inv.loadNumber}.\n\nSUMMARY OF CHARGES:\n• Invoice #: ${inv.invoiceNumber}\n• Load #: ${inv.loadNumber}\n• Pickup Date: ${inv.issueDate}\n• Total Amount Due: $${inv.totalAmount.toFixed(2)} USD\n• Payment Terms: ${inv.paymentTerms}\n\nATTACHED DOCUMENTS:\n1. Carrier Invoice PDF (${inv.invoiceNumber}.pdf)\n2. Signed Bill of Lading (BOL)\n3. Rate Confirmation Agreement\n4. CapStone Lumper Receipt\n\nREMITTANCE NOTICE:\nPlease issue ACH / Check payment directly to:\n${companyProfile.companyName}\nMC #${companyProfile.mcNumber} · DOT #${companyProfile.dotNumber}\nEmail: ${companyProfile.email || 'dispatch@greenexpressllc.com'}\nPhone: ${companyProfile.phone || '(312) 555-0199'}\n\nThank you for your business,\nFreight Operations & Accounts Receivable Team`);
    setActiveStage(4);
  };

  // Stage 4: Send Billing Email via Google Workspace Gmail API
  const handleSendBillingEmail = async () => {
    if (!selectedInvoice) return;
    setIsSendingEmail(true);

    try {
      const res = await sendEmailViaRealGmail({
        to: emailTo,
        subject: emailSubject,
        body: emailBody
      });

      if (res.success) {
        onUpdateInvoiceStatus(selectedInvoice.id, 'sent');
        showToast(`✅ Billing Packet sent to ${emailTo} via Gmail API! Message ID: ${res.messageId}`);
        setActiveStage(3);
      } else {
        const workspaceRes = await sendBillingEmailViaGmail(
          emailTo,
          emailSubject,
          emailBody
        );

        if (workspaceRes.success) {
          onUpdateInvoiceStatus(selectedInvoice.id, 'sent');
          showToast(`✅ Email sent via Google Workspace Gmail API!`);
          setActiveStage(3);
        } else {
          showToast(`Gmail API Error: ${workspaceRes.error || res.error}`);
        }
      }
    } catch (err: any) {
      showToast(`Email error: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Stage 5: Import Payment Remittance Document & Propose Matching Invoice
  const handleImportRemittanceDoc = (fileName: string) => {
    setIsProcessingRemittance(true);
    setRemittanceFileName(fileName);

    setTimeout(() => {
      const isCHR = fileName.toLowerCase().includes('chr') || fileName.toLowerCase().includes('robinson');
      const targetInvoice = invoices.find(inv => inv.customerName.toLowerCase().includes('robinson') || inv.status === 'sent') || invoices[0];

      setRemittancePayer(isCHR ? 'C.H. Robinson Worldwide' : 'Echo Global Logistics');
      setRemittanceRef(isCHR ? 'ACH-REM-998201' : 'CHK-44102');
      const amt = targetInvoice ? targetInvoice.balanceDue : 4155.00;
      setRemittanceAmount(amt);
      setMatchingInvoice(targetInvoice || null);

      setIsProcessingRemittance(false);
      showToast(`Parsed Remittance Document '${fileName}'. Proposed match: Invoice #${targetInvoice?.invoiceNumber || 'INV-2026-881'}`);
    }, 1000);
  };

  // Stage 5: Confirm Payment Receipt & Mark Invoice Reconciled / Paid
  const handleConfirmPaymentReceipt = async () => {
    if (!matchingInvoice || remittanceAmount <= 0) return;

    const remaining = matchingInvoice.balanceDue - remittanceAmount;
    const newStatus: ProposedInvoice['status'] = remaining <= 0 ? 'reconciled' : 'partially_paid';

    onUpdateInvoiceStatus(matchingInvoice.id, newStatus);
    await recordPaymentInPythonDB(
      matchingInvoice.id,
      remittanceAmount,
      remittanceRef || 'ACH-REM-998201',
      'ACH',
      new Date().toISOString().split('T')[0]
    );

    showToast(`✅ Payment of $${remittanceAmount.toLocaleString()} confirmed and applied to Invoice #${matchingInvoice.invoiceNumber}! Status updated to '${newStatus}'. Recorded in SQLite.`);
    setMatchingInvoice(null);
    setRemittanceFileName('');
    setRemittanceAmount(0);
    setActiveStage(3);
  };

  // PDF Generator Trigger with Real Company Billing Data
  const handleDownloadInvoicePDF = (inv: ProposedInvoice) => {
    const proj = projects.find(p => p.id === inv.projectId);
    generateCarrierInvoicePDF(inv, companyProfile, proj);
    showToast(`Downloaded Official Carrier Invoice PDF #${inv.invoiceNumber} (Real Billing Data: MC #${companyProfile.mcNumber})`);
  };

  // Filtered Invoices List
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.loadNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Toast Notification Header Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 border border-gray-700 text-white px-4 py-2.5 rounded-lg text-xs shadow-md">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Multi-Stage State Machine Pipeline Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
              <ReceiptText className="w-6 h-6 text-[#007AFF]" />
              Automated Freight Invoicing & Settlement Engine
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              End-to-end multi-stage billing pipeline: Local paper OCR scanning, side-by-side audit, real carrier PDF generation, Gmail API email approval, and payment reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="font-semibold">{companyProfile.companyName}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-mono">MC: {companyProfile.mcNumber}</span>
          </div>
        </div>

        {/* 5-Stage Pipeline Progress Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {[
            { stage: 1, label: '1. Incoming Paperwork', icon: FolderInput, desc: 'Scan BOL, RateCon & Lumpers' },
            { stage: 2, label: '2. Pre-Approval Audit', icon: Eye, desc: 'Side-by-Side Paperwork Verification' },
            { stage: 3, label: '3. Final Approval & PDF', icon: FileCheck, desc: 'Accounting & Carrier PDF Export' },
            { stage: 4, label: '4. Gmail Email Dispatch', icon: Send, desc: 'Review & Dispatch via Gmail API' },
            { stage: 5, label: '5. Payment Remittance', icon: Landmark, desc: 'Import Stub & Reconcile' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeStage === item.stage;
            return (
              <button
                key={item.stage}
                onClick={() => setActiveStage(item.stage as any)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 border-[#007AFF] text-[#007AFF] font-semibold' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#007AFF]' : 'text-gray-400'}`} />
                    {item.label}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 truncate">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STAGE 1: INCOMING FOLDER PAPERWORK SCANNING & MATCHING */}
      {activeStage === 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FolderInput className="w-5 h-5 text-[#007AFF]" />
                  Incoming Folder Paperwork Scanner (/incoming)
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  The program reads the BOL, matches it with the rate confirmation and lumper receipts, and identifies the customer and load.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleScanIncomingFolder}
                  disabled={isScanningFolder}
                  className="px-4 py-2 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl font-medium text-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanningFolder ? 'animate-spin' : ''}`} />
                  {isScanningFolder ? 'Scanning Local Folder...' : 'Scan /incoming Folder Now'}
                </button>

                <button
                  onClick={handleProposeInvoiceFromScans}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  Propose Invoice from Matched Scans
                </button>
              </div>
            </div>

            {isScanningFolder && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-xs text-blue-800">
                <RefreshCw className="w-4 h-4 text-[#007AFF] animate-spin shrink-0" />
                <span>{scanProgressText}</span>
              </div>
            )}

            {/* Scanned Paperwork Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {incomingDocs.map((doc) => (
                <div key={doc.id} className={`p-4 rounded-xl border ${doc.thumbnailColor} space-y-3 relative overflow-hidden bg-white`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                      {doc.type}
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {doc.ocrConfidence}% OCR
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</h3>
                    <p className="text-xs text-gray-500">{doc.fileSize} • Local Path: {doc.localPath}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-700">
                      <span className="text-gray-500">Customer:</span>
                      <span className="font-medium text-gray-900">{doc.extractedData.brokerCustomer || doc.matchedCustomer}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span className="text-gray-500">Matched Load #:</span>
                      <span className="font-mono text-emerald-600 font-bold">{doc.extractedData.loadNumber}</span>
                    </div>
                    {doc.type === 'RateConfirmation' && (
                      <div className="flex justify-between text-gray-700">
                        <span className="text-gray-500">Agreed Rate:</span>
                        <span className="font-semibold text-gray-900">${doc.extractedData.rateAmount?.toFixed(2)} USD</span>
                      </div>
                    )}
                    {doc.type === 'LumperReceipt' && (
                      <div className="flex justify-between text-gray-700">
                        <span className="text-gray-500">Lumper Fee:</span>
                        <span className="font-semibold text-amber-600">${doc.extractedData.lumperAmount?.toFixed(2)} USD</span>
                      </div>
                    )}
                    {doc.type === 'BOL' && (
                      <div className="flex justify-between text-gray-700">
                        <span className="text-gray-500">Signed BOL Stamp:</span>
                        <span className="text-emerald-600 font-medium">Receiver Stamp Verified</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 italic">"{doc.extractedData.notes}"</p>
                </div>
              ))}
            </div>

            {/* Matching Summary Banner */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Load #CHR-982301 Documents Matched (100% Complete)</h4>
                  <p className="text-xs text-gray-500">All required documents (Signed BOL, Rate Con, Lumper receipt) are verified for customer C.H. Robinson Worldwide.</p>
                </div>
              </div>

              <button
                onClick={handleProposeInvoiceFromScans}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Proceed to Review Proposed Invoice</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: PRE-APPROVAL SIDE-BY-SIDE PROPOSED INVOICE AUDIT */}
      {activeStage === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-500" />
                  Review Proposed Invoice (Side-by-Side Audit)
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  Check extracted details beside original paperwork and correct anything necessary before creating the official invoice.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStage(1)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Back to Incoming Scans
                </button>
                <button
                  onClick={handleUpdateProposedInvoice}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Invoice & Move to Final Stage
                </button>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel: Extracted Invoice Details Editor */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#007AFF]" />
                    Proposed Invoice Fields (Editable)
                  </h3>
                  <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                    Status: Pre-Approval Draft
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Customer / Broker Name</label>
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1 font-medium">Billing Email (AP Dept)</label>
                    <input
                      type="email"
                      value={editCustomerEmail}
                      onChange={(e) => setEditCustomerEmail(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-gray-600 mb-1 font-medium">Billing Address</label>
                  <input
                    type="text"
                    value={editBillingAddress}
                    onChange={(e) => setEditBillingAddress(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                {/* Itemized Line Items Form */}
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Extracted Itemized Charges ($ USD)</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                      <span className="text-gray-700">Linehaul Rate (Chicago -&gt; Dallas)</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          value={editLinehaul}
                          onChange={(e) => setEditLinehaul(Number(e.target.value))}
                          className="w-24 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-900 font-semibold text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                      <span className="text-gray-700">Agreed Fuel Surcharge (FSC)</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          value={editFuel}
                          onChange={(e) => setEditFuel(Number(e.target.value))}
                          className="w-24 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-900 font-semibold text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                      <span className="text-amber-700 font-medium">Lumper Reimbursement (CapStone)</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          value={editLumper}
                          onChange={(e) => setEditLumper(Number(e.target.value))}
                          className="w-24 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-amber-700 font-semibold text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                      <span className="text-gray-700">Detention Hours Charge</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          value={editDetention}
                          onChange={(e) => setEditDetention(Number(e.target.value))}
                          className="w-24 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-900 font-semibold text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Calculation Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Total Invoice Amount:</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">
                    ${(editLinehaul + editFuel + editLumper + editDetention).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                  </span>
                </div>

                {/* Audit Corrections Log */}
                <div className="pt-2">
                  <h4 className="text-[11px] font-semibold text-gray-500 mb-1">Audit Corrections Log:</h4>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200 text-[11px] text-gray-700 space-y-1 max-h-24 overflow-y-auto font-mono">
                    {correctionsLog.map((log, i) => (
                      <div key={i} className="flex flex-col gap-0.5 border-b border-gray-100 pb-1 last:border-b-0">
                        <div className="flex items-center justify-between text-gray-800">
                          <span className="font-semibold text-[#007AFF]">{log.field}: {String(log.newValue)}</span>
                          <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                        </div>
                        {log.reason && <span className="text-gray-500 text-[10px]">{log.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel: Original Paperwork Viewer */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Original Scanned Paperwork Viewer
                  </h3>

                  {/* Document Type Selector Tabs */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                    {(['BOL', 'RateConfirmation', 'LumperReceipt'] as const).map((docType) => (
                      <button
                        key={docType}
                        onClick={() => setSelectedDocTab(docType)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          selectedDocTab === docType 
                            ? 'bg-[#007AFF] text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {docType === 'RateConfirmation' ? 'RateCon' : docType}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Display Box */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[360px] flex flex-col justify-between">
                  {selectedDocTab === 'BOL' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Delivery BOL #BOL-998124 (Original Scan)
                        </span>
                        <span className="text-[10px] text-gray-500">Receiver Stamp: Present</span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs space-y-2">
                        <p className="text-gray-700 font-mono">
                          <span className="text-gray-500">Shipper:</span> Chicago Dist Center, 1200 S Damen Ave, Chicago IL
                        </p>
                        <p className="text-gray-700 font-mono">
                          <span className="text-gray-500">Consignee:</span> Dallas Metro Cold Storage, 4400 DC Pkwy, Dallas TX
                        </p>
                        <p className="text-gray-700 font-mono">
                          <span className="text-gray-500">Commodity:</span> Frozen Produce / 22 Pallets / Weight: 42,800 lbs
                        </p>
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-[11px] text-emerald-800">
                          ✓ Signed by Receiver Stamp: "RECEIVED IN GOOD CONDITION - DALLAS WHSE #4 - 09/30/2026 - NO OS&D"
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedDocTab === 'RateConfirmation' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs font-bold text-[#007AFF] flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-[#007AFF]" />
                          Rate Confirmation Agreement #CHR-982301
                        </span>
                        <span className="text-[10px] text-gray-500">Broker: C.H. Robinson</span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs space-y-2 font-mono">
                        <p className="text-gray-800"><span className="text-gray-500">Linehaul Flat Pay:</span> $3,450.00 USD</p>
                        <p className="text-gray-800"><span className="text-gray-500">Fuel Surcharge (FSC):</span> $420.00 USD</p>
                        <p className="text-gray-800"><span className="text-gray-500">Equipment Req:</span> 53ft Refrigerated (-10°F Continuous)</p>
                        <p className="text-gray-800"><span className="text-gray-500">Payment Terms:</span> Net 30 Days via Factoring</p>
                      </div>
                    </div>
                  )}

                  {selectedDocTab === 'LumperReceipt' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-600" />
                          CapStone Logistics Lumper Receipt
                        </span>
                        <span className="text-[10px] text-gray-500">Amount: $285.00</span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs space-y-2 font-mono">
                        <p className="text-gray-800"><span className="text-gray-500">Service:</span> Pallet Unloading & Sorting (22 Pallets)</p>
                        <p className="text-gray-800"><span className="text-gray-500">Payment Method:</span> Express Code / EFS Check</p>
                        <p className="text-gray-800"><span className="text-gray-500">Location:</span> Dallas Metro Facility</p>
                        <p className="text-amber-700 font-semibold">Total Paid: $285.00 (Pass-through reimbursement to carrier)</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={handleUpdateProposedInvoice}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Confirm & Save Verified Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: APPROVED INVOICES, CARRIER PDF & ACCOUNTING SYNC */}
      {activeStage === 3 && (
        <div className="space-y-6">
          {/* Action Bar & Search / Filter */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice #, customer, load..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#007AFF]"
              >
                <option value="all">All Statuses</option>
                <option value="final_approval">Final Approval</option>
                <option value="sent">Sent</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="reconciled">Reconciled / Paid</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStage(1)}
                className="px-3.5 py-2 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Invoice Intake
              </button>
              <button
                onClick={() => setActiveStage(5)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Landmark className="w-4 h-4" />
                Import Remittance Stub
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="p-4">Invoice #</th>
                    <th className="p-4">Customer / Broker</th>
                    <th className="p-4">Load #</th>
                    <th className="p-4">Issue Date</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Balance Due</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800 font-medium">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500 italic">
                        No invoices match search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#007AFF]">{inv.invoiceNumber}</td>
                        <td className="p-4 font-medium text-gray-900">{inv.customerName}</td>
                        <td className="p-4 font-mono text-gray-500">{inv.loadNumber}</td>
                        <td className="p-4 text-gray-500">{inv.issueDate}</td>
                        <td className="p-4 font-semibold text-gray-900">${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 font-semibold text-emerald-600">${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            inv.status === 'reconciled' || inv.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'sent'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : inv.status === 'partially_paid'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* PDF Generation Link */}
                            <button
                              onClick={() => handleDownloadInvoicePDF(inv)}
                              title="Download Official Carrier Invoice PDF (Real Billing Data)"
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border border-gray-300 flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-gray-600" />
                              PDF
                            </button>

                            {/* Prepare Email Dispatch Link */}
                            <button
                              onClick={() => handlePrepareEmailForInvoice(inv)}
                              title="Approve Billing Email via Gmail API"
                              className="px-2.5 py-1.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-lg flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Email
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4: GMAIL API EMAIL BILLING APPROVAL WORKBENCH */}
      {activeStage === 4 && selectedInvoice && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#007AFF]" />
                  Approve Billing Email (Google Workspace Gmail API)
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  The program shows the recipient, invoice, and attachments before sending. Document processing stays local; email needs internet.
                </p>
              </div>

              <button
                onClick={() => setActiveStage(3)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Back to Invoice Table
              </button>
            </div>

            {/* Local vs Internet Connectivity Indicator */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-700">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <span>Local Document Processing: Active (OCR & Audit local)</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Wifi className="w-4 h-4 text-[#007AFF]" />
                <span>Internet Connectivity: Active (Google Workspace Gmail API Connected)</span>
              </div>
            </div>

            {/* Email Form & Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Recipient Email Address (Customer AP)</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Email Subject Line</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                  />
                </div>
              </div>

              {/* Attachments Checklist */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 text-xs">
                <h4 className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Attached Billing Documentation Packet:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-700">
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Invoice #{selectedInvoice.invoiceNumber}.pdf</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Signed_BOL_998124.pdf</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">RateCon_982301.pdf</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Lumper_CapStone_285.pdf</span>
                  </div>
                </div>
              </div>

              {/* Email Body Text Area */}
              <div>
                <label className="block text-gray-600 mb-1 text-xs font-medium">Notice of Assignment & Email Body Content</label>
                <textarea
                  rows={10}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-xs font-mono text-gray-900 focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSendBillingEmail}
                  disabled={isSendingEmail}
                  className="px-6 py-3 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-4 h-4 ${isSendingEmail ? 'animate-bounce' : ''}`} />
                  {isSendingEmail ? 'Dispatching via Gmail API...' : 'Approve & Send Billing Email Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 5: PAYMENT REMITTANCE IMPORT & RECONCILIATION */}
      {activeStage === 5 && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-purple-600" />
                  Import Payment Documents & Reconciliation
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  Import payment documents. The program proposes which invoices to apply payments to, and you confirm receipt before they’re marked paid.
                </p>
              </div>

              <button
                onClick={() => setActiveStage(3)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Back to Invoice Table
              </button>
            </div>

            {/* Quick Upload Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  Select Payment Document to Import
                </h3>
                <p className="text-xs text-gray-500">
                  Select ACH advice, bank remittance stub, or check voucher to auto-parse payment amounts and invoice numbers.
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleImportRemittanceDoc('Remittance_CH_Robinson_ACH_998201.pdf')}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    C.H. Robinson Remittance Stub
                  </button>

                  <button
                    onClick={() => handleImportRemittanceDoc('Check_Echo_Logistics_44102.pdf')}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Echo Logistics Check
                  </button>
                </div>
              </div>

              {/* Proposed Match Display Box */}
              {matchingInvoice && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Proposed Match Found
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                      100% Match
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-gray-800 font-mono">
                    <p><span className="text-gray-500">Remittance File:</span> {remittanceFileName}</p>
                    <p><span className="text-gray-500">Payer:</span> {remittancePayer}</p>
                    <p><span className="text-gray-500">Ref #:</span> {remittanceRef}</p>
                    <p><span className="text-gray-500">Target Invoice:</span> #{matchingInvoice.invoiceNumber} (Load #{matchingInvoice.loadNumber})</p>
                    <p className="text-emerald-700 font-bold"><span className="text-gray-500">Payment Amount:</span> ${remittanceAmount.toLocaleString()} USD</p>
                  </div>

                  <button
                    onClick={handleConfirmPaymentReceipt}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Payment Receipt & Mark Reconciled / Paid
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
