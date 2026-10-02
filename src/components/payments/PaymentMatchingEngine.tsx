import React, { useState } from 'react';
import { 
  PaymentRemittance, 
  ProposedInvoice, 
  Project 
} from '../../types';
import { 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Upload, 
  Sparkles, 
  ArrowRight, 
  Search, 
  Check, 
  CheckCheck,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  Building2
} from 'lucide-react';

interface PaymentMatchingEngineProps {
  remittances: PaymentRemittance[];
  invoices: ProposedInvoice[];
  projects: Project[];
  onConfirmPayment: (remittanceId: string, matchedInvoiceId: string) => void;
  onAddRemittance: (newRemittance: PaymentRemittance) => void;
  onNavigateToStep: (step: string) => void;
}

export const PaymentMatchingEngine: React.FC<PaymentMatchingEngineProps> = ({
  remittances,
  invoices,
  projects,
  onConfirmPayment,
  onAddRemittance,
  onNavigateToStep,
}) => {
  const [selectedRemittanceId, setSelectedRemittanceId] = useState<string>(remittances[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingNew, setIsProcessingNew] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const selectedRemittance = remittances.find(r => r.id === selectedRemittanceId) || remittances[0];

  const handleConfirm = (remittanceId: string, invoiceId: string) => {
    onConfirmPayment(remittanceId, invoiceId);
    setConfirmSuccess(true);
    setTimeout(() => setConfirmSuccess(false), 2500);
  };

  const handleSimulateNewRemittanceDrop = () => {
    setIsProcessingNew(true);
    setTimeout(() => {
      // Find an unpaid invoice like INV-2026-090 or create realistic remittance
      const unpaidInv = invoices.find(i => i.status === 'ready_to_send' || i.status === 'sent') || invoices[0];
      
      const newRemit: PaymentRemittance = {
        id: `remit-${Date.now()}`,
        documentNumber: `ACH-AUTO-${Math.floor(100000 + Math.random() * 900000)}`,
        remittanceDocName: `ECHO_DirectDeposit_Remit_${new Date().toISOString().substring(0, 10)}.pdf`,
        payerName: unpaidInv ? unpaidInv.customerName : 'Echo Global Logistics',
        paymentMethod: 'ACH_DIRECT',
        checkOrReferenceNumber: `ACH-${Math.floor(1000000 + Math.random() * 9000000)}`,
        paymentDate: new Date().toISOString().substring(0, 10),
        totalPaymentAmount: unpaidInv ? unpaidInv.totalAmount : 2630.00,
        unallocatedAmount: 0.00,
        status: 'proposed_match',
        matchedInvoices: unpaidInv ? [
          {
            invoiceId: unpaidInv.id,
            invoiceNumber: unpaidInv.invoiceNumber,
            loadNumber: unpaidInv.loadNumber,
            originalBilled: unpaidInv.totalAmount,
            amountToApply: unpaidInv.totalAmount,
            deductionOrShortPay: 0,
            matchConfidence: 99,
            confirmedReceipt: false,
            notes: `Auto-matched remittance with outstanding invoice ${unpaidInv.invoiceNumber} for ${unpaidInv.customerName}.`
          }
        ] : []
      };

      onAddRemittance(newRemit);
      setSelectedRemittanceId(newRemit.id);
      setIsProcessingNew(false);
    }, 800);
  };

  const filteredRemittances = remittances.filter(r => {
    const matchesSearch = 
      r.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.checkOrReferenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.documentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 font-mono font-bold border border-purple-500/30">
              STEP 5 OF 5
            </span>
            <h1 className="text-base font-bold text-white tracking-tight">
              Payment Remittance & Automated Invoice Matching
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Import ACH remittance documents, wire stubs, and checks. The system automatically cross-references payer and load reference, proposing exact invoice allocations for your 1-click confirmation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateNewRemittanceDrop}
            disabled={isProcessingNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessingNew ? 'Parsing Remittance...' : 'Import Scanned Remittance'}</span>
          </button>

          <button
            onClick={() => onNavigateToStep('projects')}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <span>Back to Projects Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Imported Remittance Documents List */}
        <div className="w-5/12 border-r border-slate-800 p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Imported Payment Documents ({remittances.length})
            </span>
            <span className="text-xs font-mono text-purple-400">
              Watcher: C:\FreightOps\Remittances
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search payer, check #, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-2.5">
            {filteredRemittances.map((remit) => {
              const isSelected = remit.id === selectedRemittanceId;
              const isReconciled = remit.status === 'reconciled';

              return (
                <div
                  key={remit.id}
                  onClick={() => setSelectedRemittanceId(remit.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-900 border-purple-500 shadow-md ring-1 ring-purple-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <Building2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>{remit.payerName}</span>
                    </div>
                    <span className="text-xs font-black font-mono text-emerald-400 tabular-nums">
                      ${remit.totalPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-2">
                    <span className="font-mono text-slate-300">{remit.checkOrReferenceNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{remit.paymentMethod}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{remit.paymentDate}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400">
                      Matches {remit.matchedInvoices.length} Outstanding Invoice
                    </span>
                    <span className={`px-2 py-0.2 rounded font-semibold text-[10px] border ${
                      isReconciled 
                        ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                        : 'text-amber-300 bg-amber-950/60 border-amber-800'
                    }`}>
                      {isReconciled ? 'RECONCILED & PAID' : 'CONFIRMATION PENDING'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Proposed Invoice Matching & Reconciliation Workspace */}
        {selectedRemittance ? (
          <div className="w-7/12 p-6 overflow-y-auto bg-slate-900/40 flex flex-col justify-between">
            <div className="max-w-2xl w-full mx-auto space-y-5">
              {/* Remittance Document Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">
                      Remittance Advice Document: {selectedRemittance.remittanceDocName}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                    Direct Customer Payment
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Payer Customer</span>
                    <span className="font-semibold text-white">{selectedRemittance.payerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Payment Reference</span>
                    <span className="font-mono text-purple-300 font-semibold">{selectedRemittance.checkOrReferenceNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Disbursement Date</span>
                    <span className="font-mono text-slate-200">{selectedRemittance.paymentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Total Remittance Amount</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                      ${selectedRemittance.totalPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proposed Match Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Proposed Invoice Allocation & Matching</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Match Confidence: 100%
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedRemittance.matchedInvoices.map((match, idx) => {
                    const inv = invoices.find(i => i.id === match.invoiceId);
                    const isAlreadyConfirmed = match.confirmedReceipt || selectedRemittance.status === 'reconciled';

                    return (
                      <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white font-mono text-sm">{match.invoiceNumber}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono border border-blue-800">
                                Load #{match.loadNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{match.notes}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">To Apply</span>
                            <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                              ${match.amountToApply.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                          <div className="text-slate-400">
                            Original Billed: <span className="font-mono text-slate-200 font-semibold">${match.originalBilled.toFixed(2)}</span>
                            {match.deductionOrShortPay > 0 && (
                              <span className="text-red-400 font-mono ml-2">
                                (Deduction: -${match.deductionOrShortPay.toFixed(2)})
                              </span>
                            )}
                          </div>

                          {isAlreadyConfirmed ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCheck className="w-4 h-4" /> Confirmed & Marked Paid
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConfirm(selectedRemittance.id, match.invoiceId)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm Receipt & Mark Paid</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Alert */}
              {confirmSuccess && (
                <div className="p-3.5 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2 font-bold shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Payment confirmed! Invoice marked Paid in ledger and project lifecycle updated.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-7/12 flex items-center justify-center text-xs text-slate-500">
            Select a payment remittance document to view proposed matches.
          </div>
        )}
      </div>
    </div>
  );
};
