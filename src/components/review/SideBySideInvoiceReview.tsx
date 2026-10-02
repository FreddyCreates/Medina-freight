import React, { useState, useEffect } from 'react';
import { 
  ProposedInvoice, 
  ScannedDocument, 
  Project, 
  InvoiceLineItem 
} from '../../types';
import { 
  FileCheck2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Check, 
  FileText,
  History,
  DollarSign,
  Stamp
} from 'lucide-react';

interface SideBySideInvoiceReviewProps {
  invoices: ProposedInvoice[];
  scannedDocs: ScannedDocument[];
  projects: Project[];
  selectedProjectId?: string;
  onUpdateInvoice: (updatedInvoice: ProposedInvoice) => void;
  onApproveInvoice: (invoiceId: string) => void;
  onNavigateToStep: (step: string, projectId?: string) => void;
}

export const SideBySideInvoiceReview: React.FC<SideBySideInvoiceReviewProps> = ({
  invoices,
  scannedDocs,
  projects,
  selectedProjectId,
  onUpdateInvoice,
  onApproveInvoice,
  onNavigateToStep,
}) => {
  // Find invoice for selected project or default to first needs_review invoice
  const activeInvoice = invoices.find(inv => 
    selectedProjectId ? inv.projectId === selectedProjectId : inv.status === 'needs_review'
  ) || invoices[0];

  const [currentInvoice, setCurrentInvoice] = useState<ProposedInvoice>(activeInvoice);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeDocTab, setActiveDocTab] = useState<'BOL' | 'RateConfirmation' | 'LumperReceipt'>('BOL');
  const [showCorrectionHistory, setShowCorrectionHistory] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync state if active invoice changes from props
  useEffect(() => {
    if (activeInvoice) {
      setCurrentInvoice(activeInvoice);
    }
  }, [activeInvoice?.id]);

  if (!currentInvoice) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        No invoices available for review.
      </div>
    );
  }

  const currentProject = projects.find(p => p.id === currentInvoice.projectId);
  
  // Find paperwork documents attached to this invoice or load
  const invoiceDocs = scannedDocs.filter(d => 
    currentInvoice.attachedDocIds.includes(d.id) || 
    (currentProject && d.matchedProjectId === currentProject.id)
  );

  const bolDoc = invoiceDocs.find(d => d.type === 'BOL');
  const rateDoc = invoiceDocs.find(d => d.type === 'RateConfirmation');
  const lumperDoc = invoiceDocs.find(d => d.type === 'LumperReceipt');

  const selectedViewingDoc = 
    activeDocTab === 'BOL' ? bolDoc :
    activeDocTab === 'RateConfirmation' ? rateDoc : lumperDoc;

  // Recalculate totals
  const recalculateInvoice = (lineItems: InvoiceLineItem[]) => {
    const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = (subtotal * (currentInvoice.taxRate || 0)) / 100;
    const totalAmount = subtotal + taxAmount;
    const balanceDue = totalAmount - currentInvoice.amountPaid;

    return {
      ...currentInvoice,
      lineItems,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue,
    };
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updatedLineItems = [...currentInvoice.lineItems];
    const oldItem = { ...updatedLineItems[index] };
    const oldValue = oldItem[field];

    updatedLineItems[index] = {
      ...oldItem,
      [field]: field === 'amount' ? Number(value) : value,
    };

    const updated = recalculateInvoice(updatedLineItems);
    
    // Log correction if value changed significantly
    if (field === 'amount' && oldValue !== Number(value)) {
      updated.correctionsLog = [
        ...updated.correctionsLog,
        {
          field: `Line item #${index + 1} (${oldItem.description})`,
          oldValue: `$${Number(oldValue).toFixed(2)}`,
          newValue: `$${Number(value).toFixed(2)}`,
          correctedBy: 'Billing Auditor',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          reason: 'Manual adjustment during side-by-side paperwork review'
        }
      ];
    }

    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `li-${Date.now()}`,
      description: 'Additional Accessorial / Stop-Off',
      type: 'other',
      amount: 100.00,
      sourceDoc: 'Manual',
    };
    const updated = recalculateInvoice([...currentInvoice.lineItems, newItem]);
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    const updatedLineItems = currentInvoice.lineItems.filter((_, i) => i !== index);
    const updated = recalculateInvoice(updatedLineItems);
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
  };

  const handleApproveAndProceed = () => {
    const approvedInvoice: ProposedInvoice = {
      ...currentInvoice,
      status: 'ready_to_send',
      reviewedBy: 'Authorized Billing Lead',
      reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    onUpdateInvoice(approvedInvoice);
    onApproveInvoice(approvedInvoice.id);
    onNavigateToStep('invoicing', approvedInvoice.projectId);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Bar: Step 2 Header & Quick Load Selector */}
      <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/70 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-400 font-mono font-bold border border-cyan-500/30">
            STEP 2 OF 5
          </span>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Side-by-Side Invoice & Paperwork Verification</span>
              <span className="text-xs font-normal text-slate-400">· Load #{currentInvoice.loadNumber}</span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Audit OCR extracted line items against original scanned paper documents before creating invoice in billing ledger.
            </p>
          </div>
        </div>

        {/* Invoice Switcher & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400">Reviewing:</span>
            <select
              value={currentInvoice.id}
              onChange={(e) => {
                const found = invoices.find(inv => inv.id === e.target.value);
                if (found) setCurrentInvoice(found);
              }}
              className="bg-transparent text-white font-mono font-semibold focus:outline-none cursor-pointer"
            >
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id} className="bg-slate-900">
                  {inv.invoiceNumber} - {inv.customerName} (${inv.totalAmount.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCorrectionHistory(!showCorrectionHistory)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Audit Log ({currentInvoice.correctionsLog.length})</span>
          </button>

          <button
            onClick={handleApproveAndProceed}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve & Continue to Step 3</span>
          </button>
        </div>
      </div>

      {/* Dual-Pane Viewport: Left = Original Paperwork Document, Right = Proposed Invoice Form */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: High-Resolution Paperwork Document Viewer */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-925 overflow-hidden">
          {/* Paperwork Document Tabs & Viewer Controls */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveDocTab('BOL')}
                className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDocTab === 'BOL' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>Signed BOL {bolDoc ? '✓' : '(Missing)'}</span>
              </button>
              <button
                onClick={() => setActiveDocTab('RateConfirmation')}
                className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeDocTab === 'RateConfirmation' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Rate Confirmation {rateDoc ? '✓' : ''}</span>
              </button>
              {lumperDoc && (
                <button
                  onClick={() => setActiveDocTab('LumperReceipt')}
                  className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeDocTab === 'LumperReceipt' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Lumper Slip ($285)</span>
                </button>
              )}
            </div>

            {/* Document Zoom Controls */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setZoomLevel(prev => Math.max(70, prev - 15))}
                className="p-1.5 hover:bg-slate-800 rounded cursor-pointer text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono tabular-nums px-1 text-slate-400">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
                className="p-1.5 hover:bg-slate-800 rounded cursor-pointer text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Document Canvas with Simulated Scanned Paper Layout */}
          <div className="flex-1 p-6 overflow-y-auto overflow-x-auto bg-slate-950/60 flex items-center justify-center">
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-[520px] min-h-[640px] bg-amber-50 text-slate-900 rounded-sm shadow-2xl p-7 relative border border-amber-200 font-sans select-none transition-transform"
            >
              {/* Document Watermark & Scan Quality Texture */}
              <div className="absolute top-3 right-4 text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                SCANNED VIA ALVYS FOUNDRY HOTFOLDER · CONFIDENCE {selectedViewingDoc?.ocrConfidence || 98}%
              </div>

              {activeDocTab === 'BOL' && (
                <div className="space-y-4">
                  {/* BOL Header */}
                  <div className="border-b-2 border-slate-900 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-950">UNIFORM STRAIGHT BILL OF LADING</h2>
                        <p className="text-[10px] text-slate-600 uppercase font-semibold">Original - Not Negotiable</p>
                      </div>
                      <div className="p-2 border-2 border-blue-600 rounded bg-blue-50/50 text-right">
                        <span className="text-[9px] font-bold text-blue-700 block uppercase">BOL Number</span>
                        <span className="font-mono text-sm font-black text-slate-950">BOL-554109</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipper / Carrier / Consignee */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] border-b border-slate-300 pb-3">
                    <div className="p-2 bg-white/80 border border-slate-200 rounded">
                      <span className="font-bold text-slate-900 block uppercase text-[10px]">Shipper / Origin:</span>
                      <p className="font-medium text-slate-800">Chicago Dist Center</p>
                      <p className="text-slate-600">4400 S Western Blvd, Chicago, IL 60608</p>
                      <p className="text-[10px] text-slate-500 mt-1">Date: 09/27/2026</p>
                    </div>
                    <div className="p-2 bg-white/80 border border-slate-200 rounded">
                      <span className="font-bold text-slate-900 block uppercase text-[10px]">Consignee / Destination:</span>
                      <p className="font-medium text-slate-800">Dallas Metro Logistics</p>
                      <p className="text-slate-600">1200 Logistics Pkwy, Dallas, TX 75261</p>
                      <p className="text-[10px] text-slate-500 mt-1">Delivery: 09/29/2026</p>
                    </div>
                  </div>

                  {/* Freight Commodity Table */}
                  <div className="border border-slate-300 rounded overflow-hidden text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-200/80 font-bold text-slate-800 border-b border-slate-300">
                        <tr>
                          <th className="p-1.5">Pkgs</th>
                          <th className="p-1.5">Commodity Description</th>
                          <th className="p-1.5 text-right">Weight (Lbs)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white/50">
                        <tr>
                          <td className="p-1.5 font-mono">22 Plts</td>
                          <td className="p-1.5 font-medium">Fresh Refrigerated Produce (Temp 34°F)</td>
                          <td className="p-1.5 text-right font-mono font-bold">42,800 LBS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Verified Stamped Seal on Document */}
                  <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-400 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 block">Carrier Signature:</span>
                      <span className="text-xs font-serif italic text-blue-900">Assigned Fleet Driver (Unit #106)</span>
                    </div>

                    <div className="border-2 border-red-600 rounded p-2 text-center rotate-[-3deg] bg-red-50/70">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">RECEIVED IN GOOD ORDER</span>
                      <span className="text-[9px] font-bold text-red-700 font-mono block">DALLAS RECEIVER DOCK #14</span>
                      <span className="text-[8px] text-red-800 font-mono">SEP 29 2026 - 11:32 AM</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDocTab === 'RateConfirmation' && (
                <div className="space-y-4">
                  <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">RATE CONFIRMATION & WORK ORDER</h2>
                      <p className="text-xs font-bold text-blue-800">C.H. ROBINSON WORLDWIDE</p>
                    </div>
                    <div className="p-2 border-2 border-blue-600 rounded bg-blue-50 text-right">
                      <span className="text-[9px] font-bold text-blue-700 block uppercase">Load Number</span>
                      <span className="font-mono text-sm font-black text-slate-950">CHR-982301</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white/90 border border-slate-300 rounded space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-600">Carrier:</span>
                      <span className="font-bold text-slate-900">GREEN EXPRESS LLC (USDOT 3252472)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-600">Agreed Linehaul Rate:</span>
                      <span className="font-mono font-bold text-slate-900">$3,450.00 USD</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1">
                      <span className="text-slate-600">Fuel Surcharge (FSC):</span>
                      <span className="font-mono font-bold text-slate-900">$420.00 USD</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="font-bold text-slate-900">Total Confirmed Carrier Pay:</span>
                      <span className="font-mono font-black text-blue-900 text-sm">$3,870.00 USD</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-100/60 border border-amber-300 rounded text-[11px] text-amber-900">
                    <strong>Accessorial Clause:</strong> Lumpers paid on-site require original receipt slip submitted within 24 hours of unload for 100% full pass-through reimbursement.
                  </div>
                </div>
              )}

              {activeDocTab === 'LumperReceipt' && (
                <div className="space-y-4">
                  <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">CAPSTONE LOGISTICS UNLOADING</h2>
                      <p className="text-[10px] text-slate-600">Dallas Metro Distribution Terminal</p>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-700">
                      RECEIPT #CP-99014
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-300 rounded space-y-2 text-xs">
                    <div className="flex justify-between border-b pb-1">
                      <span>Service:</span>
                      <span className="font-semibold">22 Pallet Unload, Sort & Segregation</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span>Payment Method:</span>
                      <span className="font-mono">EFS Check Auth #99214</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="font-bold text-slate-900">Total Paid:</span>
                      <span className="font-mono font-black text-emerald-800 text-base">$285.00</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Proposed Invoice Editor */}
        <div className="w-1/2 p-6 flex flex-col bg-slate-900 overflow-y-auto">
          <div className="max-w-2xl w-full mx-auto space-y-5">
            {/* Header Form */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase block font-mono">
                  Proposed Freight Invoice
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentInvoice.invoiceNumber}
                    onChange={(e) => {
                      const updated = { ...currentInvoice, invoiceNumber: e.target.value };
                      setCurrentInvoice(updated);
                      onUpdateInvoice(updated);
                    }}
                    className="text-lg font-black text-white font-mono bg-slate-950 border border-slate-700 px-2 py-0.5 rounded focus:outline-none focus:border-cyan-500 w-44"
                  />
                  {isSaved && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Payment Terms</span>
                <span className="text-xs font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {currentInvoice.paymentTerms}
                </span>
              </div>
            </div>

            {/* Customer & Billing Details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Customer / Broker *</label>
                <input
                  type="text"
                  value={currentInvoice.customerName}
                  onChange={(e) => {
                    const updated = { ...currentInvoice, customerName: e.target.value };
                    setCurrentInvoice(updated);
                    onUpdateInvoice(updated);
                  }}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Billing AP Email *</label>
                <input
                  type="email"
                  value={currentInvoice.customerEmail}
                  onChange={(e) => {
                    const updated = { ...currentInvoice, customerEmail: e.target.value };
                    setCurrentInvoice(updated);
                    onUpdateInvoice(updated);
                  }}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Issue Date</label>
                <input
                  type="date"
                  value={currentInvoice.issueDate}
                  onChange={(e) => {
                    const updated = { ...currentInvoice, issueDate: e.target.value };
                    setCurrentInvoice(updated);
                    onUpdateInvoice(updated);
                  }}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Due Date</label>
                <input
                  type="date"
                  value={currentInvoice.dueDate}
                  onChange={(e) => {
                    const updated = { ...currentInvoice, dueDate: e.target.value };
                    setCurrentInvoice(updated);
                    onUpdateInvoice(updated);
                  }}
                  className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            {/* Editable Line Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Verified Line Items & Accessorials</span>
                </span>
                <button
                  onClick={handleAddLineItem}
                  className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium">
                    <tr>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Source Document</th>
                      <th className="py-2 px-3 text-right">Amount ($)</th>
                      <th className="py-2 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {currentInvoice.lineItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 text-xs text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                            {item.sourceDoc}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => handleLineItemChange(idx, 'amount', e.target.value)}
                            className="w-24 text-right bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 font-mono font-bold text-emerald-400 focus:outline-none focus:border-cyan-500 tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          {currentInvoice.lineItems.length > 1 && (
                            <button
                              onClick={() => handleRemoveLineItem(idx)}
                              className="text-slate-500 hover:text-red-400 cursor-pointer p-1"
                              title="Remove Item"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Calculation Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (Linehaul + FSC + Lumper):</span>
                <span className="font-mono font-semibold text-slate-200 tabular-nums">
                  ${currentInvoice.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Tax (Freight Exempt 0%):</span>
                <span className="font-mono text-slate-400 tabular-nums">$0.00</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-white">Total Verified Balance Due:</span>
                <span className="text-lg font-black font-mono text-emerald-400 tabular-nums">
                  ${currentInvoice.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Approval Notes */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1 font-semibold">
                Internal Audit & Dispatch Notes
              </label>
              <textarea
                rows={2}
                value={currentInvoice.approvalNotes || ''}
                onChange={(e) => {
                  const updated = { ...currentInvoice, approvalNotes: e.target.value };
                  setCurrentInvoice(updated);
                  onUpdateInvoice(updated);
                }}
                placeholder="Add audit notes regarding receiver signature, lumper check receipt, or billing terms..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => onNavigateToStep('scanner', currentInvoice.projectId)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Back to Scanner
              </button>
              <button
                onClick={handleApproveAndProceed}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
              >
                <span>Approve & Push to Ledger (Step 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
