import React, { useState } from 'react';
import { FoundryAgent, AgentWorkflowNode } from '../../types';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  X, 
  Check, 
  Plus, 
  Zap, 
  Radio, 
  Clock, 
  FileText, 
  ReceiptText, 
  TrendingUp, 
  Workflow,
  Cpu,
  Layers,
  Lock
} from 'lucide-react';

interface CreateCustomAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: (newAgent: FoundryAgent) => void;
}

export const CreateCustomAgentModal: React.FC<CreateCustomAgentModalProps> = ({
  isOpen,
  onClose,
  onCreateAgent,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoundryAgent['category']>('load_building');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('Incoming Email RateCon / EDI 204');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are an autonomous logistics software worker in Alvys Foundry. Analyze incoming shipment tenders, validate lane margins against DAT spot rates, extract all accessorial requirements, and format a clean TMS load object.'
  );
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [approvalThreshold, setApprovalThreshold] = useState(3000);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');

  if (!isOpen) return null;

  const agentTemplates = [
    {
      id: 'template-rate-audit',
      name: 'Rate & Accessorial Audit Agent',
      category: 'pricing' as const,
      tagline: 'Audits linehaul against signed rate con and flags unexpected accessorials.',
      trigger: 'Invoice Creation / Load Delivery',
      prompt: 'Compare agreed Rate Confirmation linehaul vs carrier settlement request. Flag unapproved detention or lumper fees > $50.',
    },
    {
      id: 'template-email-quote',
      name: 'Instant Customer Quote Agent',
      category: 'pricing' as const,
      tagline: 'Reads customer RFQ emails and generates instant market-indexed quotes.',
      trigger: 'Inbound Customer Email to quotes@greenexpressllc.com',
      prompt: 'Extract origin, destination, equipment, and dates from RFQ. Pull DAT RateView 7-day average, apply 15% target margin, and draft response.',
    },
    {
      id: 'template-pod-extractor',
      name: 'High-Speed POD Stamp Validator',
      category: 'document_intake' as const,
      tagline: 'Extracts consignee receiver stamps, signature time, and shortage notes.',
      trigger: 'Driver App POD Upload / Scanner Hotfolder',
      prompt: 'Verify consignee signature on glass or paper stamp. Extract delivery timestamp and check for OS&D (Over, Short, Damaged) annotations.',
    },
    {
      id: 'template-claims-sentinel',
      name: 'Automated Detention & Layover Sentinel',
      category: 'detention' as const,
      tagline: 'Monitors ELD dwell times and drafts claims with GPS breadcrumbs.',
      trigger: 'Samsara Geofence Dwell > 120min',
      prompt: 'Calculate exact dwell time past 2.0 hours. Prepare detention claim with certified GPS coordinates and timestamps for broker AP.',
    }
  ];

  const handleSelectTemplate = (temp: typeof agentTemplates[0]) => {
    setSelectedTemplate(temp.id);
    setName(temp.name);
    setCategory(temp.category);
    setTagline(temp.tagline);
    setDescription(temp.tagline);
    setTriggerEvent(temp.trigger);
    setSystemPrompt(temp.prompt);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAgent: FoundryAgent = {
      id: `agent-${Date.now()}`,
      name: name.trim(),
      slug: category,
      category,
      tagline: tagline.trim() || 'Custom autonomous AI software worker created in Alvys Foundry.',
      description: description.trim() || tagline.trim() || 'Autonomous logistics AI software worker.',
      status: 'active',
      iconName: category === 'load_building' ? 'Sparkles' : category === 'detention' ? 'Clock' : category === 'invoicing' ? 'ReceiptText' : 'Bot',
      triggerEvent: triggerEvent.trim() || 'Custom Ingest Event',
      totalRunsCount: 0,
      hoursSavedTotal: 0,
      accuracyRatePct: 99.5,
      requiresHumanApproval: requiresApproval,
      systemPrompt: systemPrompt.trim(),
      lastRunAt: 'Just created',
      recentOutputSnippet: 'Agent initialized and listening on TMS operational streams.',
      workflowNodes: [
        {
          id: `n-${Date.now()}-1`,
          type: 'trigger',
          title: 'Event Trigger',
          description: triggerEvent,
          config: {},
          status: 'active'
        },
        {
          id: `n-${Date.now()}-2`,
          type: 'ocr_extract',
          title: 'Reasoning Engine',
          description: 'Gemini 2.5 Flash Autonomous Reasoning',
          config: { model: 'gemini-2.5-flash' },
          status: 'active'
        },
        {
          id: `n-${Date.now()}-3`,
          type: 'approval_gate',
          title: 'Agent Shield Governance Gate',
          description: requiresApproval ? `Requires human review if value > $${approvalThreshold}` : 'Autonomous Execution',
          config: { threshold: approvalThreshold },
          status: 'active'
        },
        {
          id: `n-${Date.now()}-4`,
          type: 'tms_action',
          title: 'TMS Direct Execution',
          description: 'Publishes results to dispatch & accounting',
          config: {},
          status: 'waiting'
        }
      ]
    };

    onCreateAgent(newAgent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-6 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Alvys Foundry · Create Custom AI Agent</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800 font-mono">
                  SOFTWARE WORKER
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Deploy an autonomous software worker built directly on live TMS operational streams with Agent Shield governance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-950/60">
          {/* Pre-Built Template Picker */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Quick-Start from 20+ Pre-Built Foundry Templates
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {agentTemplates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all text-left ${
                    selectedTemplate === t.id
                      ? 'bg-slate-900 border-orange-500 ring-1 ring-orange-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{t.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-orange-400 font-mono uppercase">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{t.tagline}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Agent Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lane Margin & Rate Auditor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category & Domain</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                >
                  <option value="load_building">Load Building & Tender Parsing</option>
                  <option value="document_intake">Document Intake & Filing</option>
                  <option value="detention">Detention & Dwell Tracking</option>
                  <option value="track_trace">Track & Trace Check-Calls</option>
                  <option value="invoicing">Invoicing, Settlements & Factoring</option>
                  <option value="compliance">Carrier Compliance & Safety</option>
                  <option value="pricing">Rate Intelligence & Market Pricing</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Trigger Event Hook</label>
              <input
                type="text"
                placeholder="e.g. Incoming Email / RateCon PDF / ELD Geofence Dwell > 120m"
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                AI Reasoning System Prompt (Instructions for Agent)
              </label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Agent Shield Governance Controls */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-white">Agent Shield Governance & Safety Controls</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  HUMAN-IN-THE-LOOP
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Require Human Sign-Off</span>
                    <span className="text-[10px] text-slate-400">Dispatcher confirms high-impact actions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-slate-900 border-slate-700 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Auto-Approval Dollar Ceiling</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      value={approvalThreshold}
                      onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Deploy Agent to Foundry Swarm</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
