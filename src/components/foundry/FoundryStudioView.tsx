import React, { useState } from 'react';
import { 
  FoundryAgent, 
  AgentExecutionLog, 
  Project 
} from '../../types';
import { 
  AutoPilotConfig, 
  AutoPilotDetectedLoad 
} from '../../services/autopilotService';
import { 
  Sparkles, 
  Bot, 
  Play, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Radio, 
  FileText, 
  ReceiptText, 
  Cpu, 
  Workflow, 
  Power, 
  SlidersHorizontal, 
  Mail, 
  Calendar, 
  HardDrive, 
  Activity, 
  Zap, 
  ArrowRight 
} from 'lucide-react';
import { executeFoundryAgent } from '../../services/foundryAgentService';
import { AgenticInboxTriageDashboard } from './AgenticInboxTriageDashboard';

interface FoundryStudioViewProps {
  agents: FoundryAgent[];
  executionLogs: AgentExecutionLog[];
  projects: Project[];
  autoPilotConfig: AutoPilotConfig;
  autoPilotLoads: AutoPilotDetectedLoad[];
  onToggleAutoPilot: () => void;
  onUpdateAutoPilotConfig: (config: AutoPilotConfig) => void;
  onToggleAgentStatus: (agentId: string) => void;
  onRunAgentManually: (agent: FoundryAgent, project: Project) => void;
  onOpenWorkflowBuilder: (agent: FoundryAgent) => void;
  onNavigateToTab: (tab: string, projectId?: string) => void;
  onAddProject?: (project: Project) => void;
  onAddExecutionLog?: (log: AgentExecutionLog) => void;
}

export const FoundryStudioView: React.FC<FoundryStudioViewProps> = ({
  agents,
  executionLogs,
  projects,
  autoPilotConfig,
  autoPilotLoads,
  onToggleAutoPilot,
  onUpdateAutoPilotConfig,
  onToggleAgentStatus,
  onRunAgentManually,
  onOpenWorkflowBuilder,
  onNavigateToTab,
  onAddProject,
  onAddExecutionLog
}) => {
  const [activeFoundrySubTab, setActiveFoundrySubTab] = useState<'triage' | 'agents' | 'logs'>('triage');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState<string>(projects[0]?.id || '');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [showAutoPilotSettings, setShowAutoPilotSettings] = useState(false);

  // Settings local state
  const [tempMinRpm, setTempMinRpm] = useState(autoPilotConfig.minRatePerMile);
  const [tempMinGross, setTempMinGross] = useState(autoPilotConfig.minGrossPay);
  const [tempConfidence, setTempConfidence] = useState(autoPilotConfig.autoBookConfidenceThreshold);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];
  const selectedProject = projects.find(p => p.id === selectedLoadId) || projects[0];

  // Aggregate Foundry metrics
  const avgAccuracy = (agents.reduce((sum, a) => sum + (a.accuracyRatePct || 0), 0) / (agents.length || 1)).toFixed(1);

  const autoBookedLoadsCount = autoPilotLoads.filter(l => l.status === 'auto_booked').length;
  const autoCapturedRevenue = autoPilotLoads
    .filter(l => l.status === 'auto_booked')
    .reduce((sum, l) => sum + l.rate, 0);

  const filteredAgents = agents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const getAgentIcon = (slug: string) => {
    switch (slug) {
      case 'load_builder': return Sparkles;
      case 'document_intake': return FileText;
      case 'detention': return Clock;
      case 'track_trace': return Radio;
      case 'invoicing': return ReceiptText;
      case 'compliance': return ShieldCheck;
      case 'pricing': return TrendingUp;
      default: return Bot;
    }
  };

  const handleTestRun = async () => {
    if (!selectedAgent || !selectedProject) return;
    setIsRunning(true);
    setRunResult(null);

    const inputPayload = {
      loadNumber: selectedProject.loadNumber,
      broker: selectedProject.customerName,
      origin: `${selectedProject.originCity}, ${selectedProject.originState}`,
      destination: `${selectedProject.destCity}, ${selectedProject.destState}`,
      rate: selectedProject.estimatedRevenue,
      dwellHours: (selectedProject.telemetry.dwellMinutes || 0) / 60,
      facility: `${selectedProject.destCity} Terminal`,
      customerEmail: 'ap-billing@brokerage.com'
    };

    const response = await executeFoundryAgent(selectedAgent, inputPayload);
    setIsRunning(false);
    setRunResult(response);
  };

  const handleSaveSettings = () => {
    onUpdateAutoPilotConfig({
      ...autoPilotConfig,
      minRatePerMile: tempMinRpm,
      minGrossPay: tempMinGross,
      autoBookConfidenceThreshold: tempConfidence
    });
    setShowAutoPilotSettings(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Sub-Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFoundrySubTab('triage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeFoundrySubTab === 'triage'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-300" />
            <span>Agentic Inbox Triage</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-400/20 text-indigo-300 text-[10px] font-mono">
              Custom Rules
            </span>
          </button>

          <button
            onClick={() => setActiveFoundrySubTab('agents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeFoundrySubTab === 'agents'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-300" />
            <span>Studio Agents & Auto-Pilot</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
              {agents.length} AI Agents
            </span>
          </button>

          <button
            onClick={() => setActiveFoundrySubTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeFoundrySubTab === 'logs'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Trail & Execution Logs</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
              {executionLogs.length} events
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-2 text-xs">
          <span className="text-slate-400">Foundry Autonomous Sentinel:</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 0. AGENTIC INBOX TRIAGE DASHBOARD (CUSTOM GMAIL RULES) */}
      {/* ======================================================== */}
      {activeFoundrySubTab === 'triage' && (
        <AgenticInboxTriageDashboard
          projects={projects}
          onAddProject={onAddProject || (() => {})}
          onAddExecutionLog={onAddExecutionLog || (() => {})}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* ======================================================== */}
      {/* 1. AUTONOMOUS AUTO-PILOT & STUDIO AGENTS */}
      {/* ======================================================== */}
      {activeFoundrySubTab === 'agents' && (
        <>
          <div className={`border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300 backdrop-blur-md ${
        autoPilotConfig.enabled 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border-indigo-500/40 shadow-indigo-500/10' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-2xl border transition-all ${
                autoPilotConfig.enabled 
                  ? 'bg-indigo-500/20 border-indigo-400/50 shadow-lg shadow-indigo-500/20 text-indigo-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <Zap className={`w-6 h-6 ${autoPilotConfig.enabled ? 'animate-bounce text-indigo-400' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Foundry Agent Auto-Pilot
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                    autoPilotConfig.enabled 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${autoPilotConfig.enabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                    {autoPilotConfig.enabled ? 'Continuous Ingestion Active' : 'Auto-Pilot Paused'}
                  </span>
                </div>
                <p className="text-slate-300 text-xs mt-1 max-w-2xl">
                  Continuously scans connected load boards (DAT One, Truckstop) and Gmail inboxes. Autonomously extracts rate confirmations, validates rate per mile ($/mi), builds dispatch load records, and drafts invoices without manual intervention.
                </p>
              </div>
            </div>
          </div>

          {/* Master Toggle & Settings Button */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowAutoPilotSettings(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              Auto-Pilot Rules
            </button>

            <button
              onClick={onToggleAutoPilot}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 shadow-xl transition-all active:scale-95 cursor-pointer ${
                autoPilotConfig.enabled
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/20'
              }`}
            >
              <Power className="w-4 h-4" />
              {autoPilotConfig.enabled ? 'AUTO-PILOT ON' : 'ENABLE AUTO-PILOT'}
            </button>
          </div>
        </div>

        {/* Auto-Pilot Real-time Telemetry Metrics */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Continuous Ingestion</div>
            <div className="text-sm font-bold text-white flex items-center gap-2 mt-1">
              <span className="font-mono text-indigo-400">{autoBookedLoadsCount + 14}</span> Loads Captured
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Auto-Booked Gross Pay</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
              ${(autoCapturedRevenue + 42650).toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Min Floor Rate / Mile</div>
            <div className="text-sm font-bold text-amber-400 font-mono mt-1">
              ${autoPilotConfig.minRatePerMile.toFixed(2)}/mi
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Google Workspace Sync</div>
            <div className="text-sm font-bold text-cyan-400 flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" />
              <Calendar className="w-3.5 h-3.5" />
              <HardDrive className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono text-emerald-400">Synced</span>
            </div>
          </div>
        </div>

        {/* Real-time Ingestion Stream Feed */}
        {autoPilotLoads.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Live Auto-Pilot Ingestion Stream (Recent Tenders & Rate Cons)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Polling DAT, Truckstop & Gmail
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {autoPilotLoads.slice(0, 3).map((load) => (
                <div
                  key={load.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {load.source}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {load.timestamp}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {load.broker}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {load.originCity}, {load.originState} → {load.destCity}, {load.destState}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold font-mono text-xs">
                        ${load.rate.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1">
                        (${load.ratePerMile.toFixed(2)}/mi)
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      load.status === 'auto_booked'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : load.status === 'rejected_low_rpm'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {load.status === 'auto_booked' ? 'Auto-Booked' : load.status === 'rejected_low_rpm' ? 'Low RPM' : 'Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. AGENTS CATALOG & LIVE REASONING CONSOLE */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Agents List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Autonomous Agents ({filteredAgents.length})
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {avgAccuracy}% Accuracy
              </span>
            </div>

            {/* Agent Cards */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredAgents.map((agent) => {
                const IconComponent = getAgentIcon(agent.slug || 'bot');
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedAgent?.id === agent.id
                        ? 'bg-slate-800/90 border-indigo-500/50 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{agent.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{agent.category.replace('_', ' ')}</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleAgentStatus(agent.id);
                        }}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                          agent.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {agent.status === 'active' ? 'Active' : 'Paused'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                      {agent.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
                      <span>{agent.totalRunsCount || 0} Runs</span>
                      <span>{agent.hoursSavedTotal || 0}h Saved</span>
                      <span className="text-indigo-400">{agent.accuracyRatePct || 99}% Match</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Agent Sandbox & Test Runner */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          {selectedAgent ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-white">{selectedAgent.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      {selectedAgent.triggerEvent}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedAgent.description}
                  </p>
                </div>

                <button
                  onClick={() => onOpenWorkflowBuilder(selectedAgent)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Workflow className="w-3.5 h-3.5 text-indigo-400" />
                  Edit Workflow
                </button>
              </div>

              {/* Execution Prompt & Parameters */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Agent Instruction Prompt:
                </span>
                <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                  {selectedAgent.systemPrompt || 'Evaluate freight parameters against fleet criteria and autonomously dispatch records.'}
                </p>
              </div>

              {/* Live Test Execution Bar */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-slate-950 to-slate-900 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Agent Live Dispatch Execution Console</span>
                  <span className="text-slate-400">Select target shipment for agent execution</span>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedLoadId}
                    onChange={(e) => setSelectedLoadId(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.loadNumber} - {p.customerName} (${p.estimatedRevenue.toLocaleString()})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleTestRun}
                    disabled={isRunning}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                    {isRunning ? 'Executing Agent...' : 'Run Agent Test'}
                  </button>
                </div>
              </div>

              {/* Execution Output Panel */}
              {runResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Execution Output (Confidence: {runResult.confidenceScore || 98}%)
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Execution Time: {runResult.executionTimeMs || 340}ms
                    </span>
                  </div>
                  <pre className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap overflow-x-auto">
                    {typeof runResult.outputSummary === 'string' 
                      ? runResult.outputSummary 
                      : JSON.stringify(runResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select an agent to inspect logic and execute live tests.
            </div>
          )}

          {/* Bottom Execution History */}
          <div className="border-t border-slate-800 pt-4 mt-6 flex items-center justify-between text-xs text-slate-400">
            <span>Recent Agent Executions: {executionLogs.length} logged</span>
            <button
              onClick={() => onNavigateToTab('projects')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View Dispatch Matrix <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* ======================================================== */}
      {/* 2. AUDIT TRAIL & EXECUTION LOGS SUB-TAB */}
      {/* ======================================================== */}
      {activeFoundrySubTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Foundry Autonomous Execution Audit Feed ({executionLogs.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable trace of autonomous rate confirmation ingestions, custom rule actions, and fleet dispatches.
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('projects')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Dispatch Matrix</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>

          <div className="space-y-3">
            {executionLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">{log.agentName}</span>
                    {log.loadNumber && (
                      <span className="font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                        #{log.loadNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span>{log.executionTimeMs}ms</span>
                    <span className="text-emerald-400 font-bold">{log.confidenceScore}% confidence</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <div className="text-slate-300 font-medium">
                  Trigger: <strong className="text-slate-100">{log.triggerEvent}</strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-850">
                    <span className="text-slate-500 uppercase font-mono block text-[9px]">Input Context</span>
                    <span className="text-slate-300 line-clamp-2">{log.inputSummary}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-850">
                    <span className="text-emerald-400 uppercase font-mono block text-[9px]">Autonomous Result</span>
                    <span className="text-slate-300 line-clamp-2">{log.outputSummary}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. AUTO-PILOT SETTINGS MODAL */}
      {/* ======================================================== */}
      {showAutoPilotSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                Foundry Auto-Pilot Autonomous Criteria
              </h3>
              <button
                onClick={() => setShowAutoPilotSettings(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Minimum Rate Per Mile ($/mi):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1.50"
                    max="5.00"
                    step="0.05"
                    value={tempMinRpm}
                    onChange={(e) => setTempMinRpm(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-sm font-mono font-bold text-indigo-400 w-16 text-right">
                    ${tempMinRpm.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Loads below this floor rate are automatically rejected to preserve fleet profitability.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Minimum Gross Pay ($):
                </label>
                <input
                  type="number"
                  value={tempMinGross}
                  onChange={(e) => setTempMinGross(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Autonomous Auto-Book Confidence Threshold (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="75"
                    max="99"
                    value={tempConfidence}
                    onChange={(e) => setTempConfidence(parseInt(e.target.value, 10))}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-sm font-mono font-bold text-emerald-400 w-12 text-right">
                    {tempConfidence}%
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPilotConfig.autoCreateLoad} 
                    onChange={(e) => onUpdateAutoPilotConfig({ ...autoPilotConfig, autoCreateLoad: e.target.checked })}
                    className="accent-indigo-500 rounded" 
                  />
                  <span>Automatically construct Dispatch Load records in Matrix</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPilotConfig.autoDraftInvoice} 
                    onChange={(e) => onUpdateAutoPilotConfig({ ...autoPilotConfig, autoDraftInvoice: e.target.checked })}
                    className="accent-indigo-500 rounded" 
                  />
                  <span>Automatically draft customer invoices in Invoicing Hub</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPilotConfig.autoSyncGoogleCalendar} 
                    onChange={(e) => onUpdateAutoPilotConfig({ ...autoPilotConfig, autoSyncGoogleCalendar: e.target.checked })}
                    className="accent-indigo-500 rounded" 
                  />
                  <span>Automatically sync pickup & delivery appointments to Google Calendar</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPilotConfig.autoSaveGoogleDrive} 
                    onChange={(e) => onUpdateAutoPilotConfig({ ...autoPilotConfig, autoSaveGoogleDrive: e.target.checked })}
                    className="accent-indigo-500 rounded" 
                  />
                  <span>Automatically save Rate Con contracts as Google Docs in Drive</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAutoPilotSettings(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Save Criteria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
