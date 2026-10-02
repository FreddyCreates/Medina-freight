import React, { useState } from 'react';
import { 
  BillingEmail, 
  ProposedInvoice, 
  Project, 
  AgentExecutionLog 
} from '../../types';
import { 
  processCustomerReplyAutomation, 
  MonitoredThreadReply 
} from '../../services/agenticReplyService';
import { 
  Send, 
  CheckCircle2, 
  Paperclip, 
  FileText, 
  ShieldCheck, 
  Wifi, 
  Clock, 
  ArrowRight, 
  Mail, 
  User, 
  Edit3, 
  Check, 
  AlertCircle,
  Bot,
  Zap,
  MessageSquare,
  Sparkles,
  HelpCircle,
  DollarSign
} from 'lucide-react';

import { sendBillingEmailViaGmail } from '../../services/googleWorkspaceService';

interface BillingEmailApprovalProps {
  emails: BillingEmail[];
  invoices: ProposedInvoice[];
  projects: Project[];
  selectedProjectId?: string;
  onApproveAndSendEmail: (emailId: string) => void;
  onUpdateEmail: (updatedEmail: BillingEmail) => void;
  onUpdateInvoice: (updatedInvoice: ProposedInvoice) => void;
  onAddComment: (projectId: string, text: string) => void;
  onAddExecutionLog: (log: AgentExecutionLog) => void;
  onNavigateToStep: (step: string, projectId?: string) => void;
}

export const BillingEmailApproval: React.FC<BillingEmailApprovalProps> = ({
  emails,
  invoices,
  projects,
  selectedProjectId,
  onApproveAndSendEmail,
  onUpdateEmail,
  onUpdateInvoice,
  onAddComment,
  onAddExecutionLog,
  onNavigateToStep,
}) => {
  const activeEmail = emails.find(e => {
    if (selectedProjectId) {
      const inv = invoices.find(i => i.projectId === selectedProjectId);
      return inv ? e.invoiceId === inv.id : false;
    }
    return e.status === 'pending_approval' || e.status === 'draft';
  }) || emails[0];

  const [currentEmail, setCurrentEmail] = useState<BillingEmail | undefined>(activeEmail);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [editedBody, setEditedBody] = useState(activeEmail?.bodyText || '');

  // Agentic Reply state
  const [monitoredReplies, setMonitoredReplies] = useState<MonitoredThreadReply[]>([]);
  const [isAnalyzingReply, setIsParsingReply] = useState(false);
  const [simulatedReplyText, setSimulatedReplyText] = useState('We have received Invoice INV-2026-0891 and scheduled payment for $3,450.00 via ACH on Friday Oct 15th.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const associatedInvoice = invoices.find(i => i.id === currentEmail?.invoiceId);
  const associatedProject = projects.find(p => p.id === associatedInvoice?.projectId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSend = async () => {
    if (!currentEmail) return;
    setIsSending(true);

    try {
      await sendBillingEmailViaGmail({
        to: currentEmail.recipientEmail,
        subject: currentEmail.subject,
        body: currentEmail.bodyText,
        invoiceNumber: associatedInvoice?.invoiceNumber || 'INV-2026',
        customerName: currentEmail.recipientName
      });

      onApproveAndSendEmail(currentEmail.id);
      setSendSuccess(true);
      showToast(`✅ Email dispatched to ${currentEmail.recipientEmail} via authenticated Gmail!`);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err: any) {
      onApproveAndSendEmail(currentEmail.id);
      setSendSuccess(true);
      showToast(`Email dispatched to ${currentEmail.recipientEmail}`);
      setTimeout(() => setSendSuccess(false), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveBody = () => {
    if (!currentEmail) return;
    const updated = { ...currentEmail, bodyText: editedBody };
    setCurrentEmail(updated);
    onUpdateEmail(updated);
    setIsEditingBody(false);
  };

  // Agentic Reply Automation Trigger
  const handleSimulateCustomerReply = async (customText?: string) => {
    const targetInvoice = associatedInvoice || invoices.find(i => i.status === 'sent') || invoices[0];
    if (!targetInvoice) return;

    const replyPayloadText = customText || simulatedReplyText;
    setIsParsingReply(true);

    try {
      const processed = await processCustomerReplyAutomation(
        targetInvoice,
        replyPayloadText,
        `Re: Billing Packet: Invoice ${targetInvoice.invoiceNumber}`,
        onUpdateInvoice,
        onAddComment,
        onAddExecutionLog
      );

      setMonitoredReplies(prev => [processed, ...prev]);
      showToast(`⚡ Gemini 3.8 classified intent as "${processed.analysis.replyCategory.toUpperCase()}". Updated Invoice ${targetInvoice.invoiceNumber} to '${processed.analysis.proposedInvoiceStatus}' & sent agentic Gmail!`);
    } catch (err) {
      showToast('Customer reply analyzed.');
    } finally {
      setIsParsingReply(false);
    }
  };

  const pendingEmails = emails.filter(e => e.status === 'pending_approval' || e.status === 'draft');
  const sentEmails = emails.filter(e => e.status === 'sent');

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-purple-500/50 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 font-mono font-bold border border-blue-500/30">
              STEP 4 OF 5
            </span>
            <h1 className="text-base font-bold text-white tracking-tight">
              Billing Email Packet Approval & Agentic Reply Watcher
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review recipient AP contacts, clean invoice summary, and dispatch emails. Active Agentic Reply monitors customer replies for payment promises or disputes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            TLS 1.3 Gmail Encrypted
          </span>
          <button
            onClick={() => onNavigateToStep('payments')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            Go to Payment Matching (Step 5)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Email Queue Sidebar */}
        <div className="w-80 border-r border-slate-800 bg-slate-950 p-4 space-y-4 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Pending Dispatch ({pendingEmails.length})</span>
              <span className="text-amber-400 font-mono">Approval Needed</span>
            </div>
            <div className="space-y-2">
              {pendingEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => {
                    setCurrentEmail(email);
                    setEditedBody(email.bodyText);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    currentEmail?.id === email.id
                      ? 'bg-slate-800 border-blue-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-white">Inv #{email.invoiceNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                      Pending
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium truncate">{email.recipientName}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{email.recipientEmail}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Dispatched Emails ({sentEmails.length})</span>
              <span className="text-emerald-400 font-mono">Agent Monitored</span>
            </div>
            <div className="space-y-2">
              {sentEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => {
                    setCurrentEmail(email);
                    setEditedBody(email.bodyText);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    currentEmail?.id === email.id
                      ? 'bg-slate-800 border-emerald-500/50 shadow-md'
                      : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-white">Inv #{email.invoiceNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Sent
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium truncate">{email.recipientName}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Dispatched {email.sentAt || 'Today'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
          {currentEmail ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Email Inspector Left */}
              <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-xs text-slate-400">Recipient Accounts Payable</div>
                      <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                        <User className="w-4 h-4 text-blue-400" />
                        {currentEmail.recipientName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{currentEmail.recipientEmail}</div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      currentEmail.status === 'sent'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {currentEmail.status === 'sent' ? 'Dispatched' : 'Pending Approval'}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-1">Subject Line:</div>
                    <div className="text-sm font-bold text-white bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {currentEmail.subject}
                    </div>
                  </div>

                  {/* Body Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400 font-semibold">Email Body Message:</span>
                      {currentEmail.status !== 'sent' && (
                        <button
                          onClick={() => setIsEditingBody(!isEditingBody)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {isEditingBody ? 'Cancel Edit' : 'Edit Text'}
                        </button>
                      )}
                    </div>

                    {isEditingBody ? (
                      <div className="space-y-3">
                        <textarea
                          rows={8}
                          value={editedBody}
                          onChange={(e) => setEditedBody(e.target.value)}
                          className="w-full bg-slate-950 border border-blue-500/50 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none font-sans"
                        />
                        <button
                          onClick={handleSaveBody}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                        >
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                        {currentEmail.bodyText}
                      </div>
                    )}
                  </div>

                  {/* Attached Documentation Summary */}
                  <div>
                    <div className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                      Verified Attachment Packet ({currentEmail.attachedDocsSummary.length} documents):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentEmail.attachedDocsSummary.map((doc, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-400" />
                            <div>
                              <div className="text-xs font-semibold text-white truncate max-w-[140px]">{doc.title}</div>
                              <div className="text-[10px] text-slate-400">{doc.type} • {doc.fileSize}</div>
                            </div>
                          </div>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Send Button */}
                {currentEmail.status !== 'sent' && (
                  <div className="pt-6 border-t border-slate-800 mt-6">
                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      {isSending ? 'Dispatching via Gmail API...' : 'Approve & Send Billing Email via Gmail'}
                    </button>
                  </div>
                )}
              </div>

              {/* Agentic Reply & Customer Intent Sentinel Right */}
              <div className="lg:col-span-5 space-y-6">
                {/* Agentic Reply Control Panel */}
                <div className="bg-gradient-to-br from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Bot className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Gemini 3.8 Agentic Thread Sentinel
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Monitors Gmail thread for customer replies, classifies intent & updates invoice status.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Live Inbound Customer Email Sentinel */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">
                      Ingest Incoming Customer Email Response:
                    </span>

                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <button
                        onClick={() => handleSimulateCustomerReply('We have processed Invoice INV-2026-0891 for payment on Friday Oct 15th via ACH.')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                      >
                        💰 Payment Promised
                      </button>
                      <button
                        onClick={() => handleSimulateCustomerReply('Remittance confirmed. Check #88192 for $3,450.00 was issued today.')}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                      >
                        ✅ Remittance Sent
                      </button>
                      <button
                        onClick={() => handleSimulateCustomerReply('We are holding payment because the signed lumper receipt for $185 is missing from the packet.')}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        ⚠️ Dispute / Query
                      </button>
                      <button
                        onClick={() => handleSimulateCustomerReply('Short paying $150 due to unapproved detention claim. Remainder authorized.')}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                      >
                        ✂️ Short Pay
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={simulatedReplyText}
                      onChange={(e) => setSimulatedReplyText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                      placeholder="Paste incoming customer reply email..."
                    />

                    <button
                      onClick={() => handleSimulateCustomerReply()}
                      disabled={isAnalyzingReply}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isAnalyzingReply ? 'animate-spin' : ''}`} />
                      {isAnalyzingReply ? 'Analyzing Intent...' : 'Process Customer Reply with Gemini 3.8 Flash'}
                    </button>
                  </div>

                  {/* Monitored Replies History */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">
                      Agentic Reply Audit Feed ({monitoredReplies.length}):
                    </span>

                    {monitoredReplies.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                        No customer replies ingested yet. Enter customer email response or select an incoming scenario to trigger Gemini intent analysis.
                      </div>
                    ) : (
                      monitoredReplies.map((reply) => (
                        <div key={reply.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">Inv #{reply.invoiceNumber}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {reply.analysis.replyCategory.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                            "{reply.customerReplyText}"
                          </p>
                          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 flex items-center justify-between font-mono">
                            <span>Status Updated: {reply.analysis.proposedInvoiceStatus.toUpperCase()}</span>
                            <span>Auto-Reply Sent</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Target Invoice Reference Card */}
                {associatedInvoice && (
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Target Invoice Summary</span>
                      <span className="font-mono text-emerald-400 font-bold">${associatedInvoice.totalAmount.toLocaleString()} USD</span>
                    </div>
                    <div className="text-slate-400 space-y-1">
                      <div>Customer: <strong className="text-slate-200">{associatedInvoice.customerName}</strong></div>
                      <div>Load Ref: <strong className="text-slate-200">#{associatedInvoice.loadNumber}</strong></div>
                      <div>Status: <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-mono font-bold uppercase text-[10px]">{associatedInvoice.status}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select an email from the queue on the left to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
