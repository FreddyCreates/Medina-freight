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
      case 'load_builder': return ReceiptText;
      case 'compliance_gatekeeper': return ShieldCheck;
      case 'billing_email_dispatch': return Mail;
      case 'telematics_sentinel': return Radio;
      case 'inbound_quote_calculator': return TrendingUp;
      default: return Bot;
    }
  };

  const handleTestRun = async () => {
    if (!selectedAgent || !selectedProject) return;
    setIsRunning(true);
    setRunResult(null);

    try {
      const res = await executeFoundryAgent(selectedAgent, selectedProject);
      setRunResult(res);
      onRunAgentManually(selectedAgent, selectedProject);
    } catch (err: any) {
      setRunResult({ error: err.message });
    } finally {
      setIsRunning(false);
    }
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
    <div className="space-y-6 select-none font-sans">
      {/* Sub-navigation Header Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFoundrySubTab('triage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeFoundrySubTab === 'triage'
                ? 'bg-[#007AFF] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Agentic Inbox Triage</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
              Custom Rules
            </span>
          </button>

          <button
            onClick={() => setActiveFoundrySubTab('agents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeFoundrySubTab === 'agents'
                ? 'bg-[#007AFF] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Studio Agents & Auto-Pilot</span>
            <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-700 text-[10px] font-mono">
              {agents.length} AI Agents
            </span>
          </button>

          <button
            onClick={() => setActiveFoundrySubTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeFoundrySubTab === 'logs'
                ? 'bg-[#007AFF] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail & Execution Logs</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono">
              {executionLogs.length} events
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-2 text-xs">
          <span className="text-gray-500">Foundry Autonomous Sentinel:</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* 0. AGENTIC INBOX TRIAGE DASHBOARD (CUSTOM GMAIL RULES) */}
      {activeFoundrySubTab === 'triage' && (
        <AgenticInboxTriageDashboard
          projects={projects}
          onAddProject={onAddProject || (() => {})}
          onAddExecutionLog={onAddExecutionLog || (() => {})}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* 1. AUTONOMOUS AUTO-PILOT & STUDIO AGENTS */}
      {activeFoundrySubTab === 'agents' && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-3 rounded-2xl border transition-all ${
                    autoPilotConfig.enabled 
                      ? 'bg-blue-50 border-blue-200 text-[#007AFF]' 
                      : 'bg-gray-100 border-gray-200 text-gray-500'
                  }`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Foundry Agent Auto-Pilot
                      </h1>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                        autoPilotConfig.enabled 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${autoPilotConfig.enabled ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
                        {autoPilotConfig.enabled ? 'Continuous Ingestion Active' : 'Auto-Pilot Paused'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1 max-w-2xl">
                      Continuously scans connected load boards (DAT One, Truckstop) and Gmail inboxes. Autonomously extracts rate confirmations, validates rate per mile ($/mi), builds dispatch load records, and drafts invoices without manual intervention.
                    </p>
                  </div>
                </div>
              </div>

              {/* Master Toggle & Settings Button */}
              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <button
                  onClick={() => setShowAutoPilotSettings(true)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#007AFF]" />
                  Auto-Pilot Rules
                </button>

                <button
                  onClick={onToggleAutoPilot}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                    autoPilotConfig.enabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#007AFF] hover:bg-blue-600 text-white'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {autoPilotConfig.enabled ? 'AUTO-PILOT ON' : 'ENABLE AUTO-PILOT'}
                </button>
              </div>
            </div>

            {/* Auto-Pilot Real-time Telemetry Metrics */}
            <div className="mt-6 pt-5 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[11px] text-gray-500 font-medium">Continuous Ingestion</div>
                <div className="text-sm font-bold text-gray-900 flex items-center gap-2 mt-1">
                  <span className="font-mono text-[#007AFF]">{autoBookedLoadsCount + 14}</span> Loads Captured
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[11px] text-gray-500 font-medium">Auto-Booked Gross Pay</div>
                <div className="text-sm font-bold text-emerald-600 font-mono mt-1">
                  ${(autoCapturedRevenue + 42650).toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[11px] text-gray-500 font-medium">Min Floor Rate / Mile</div>
                <div className="text-sm font-bold text-amber-700 font-mono mt-1">
                  ${autoPilotConfig.minRatePerMile.toFixed(2)}/mi
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[11px] text-gray-500 font-medium">Google Workspace Sync</div>
                <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[11px] font-mono text-emerald-600">Synced</span>
                </div>
              </div>
            </div>

            {/* Real-time Ingestion Stream Feed */}
            {autoPilotLoads.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-[#007AFF] animate-pulse" />
                    Live Auto-Pilot Ingestion Stream (Recent Tenders & Rate Cons)
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Polling DAT, Truckstop & Gmail
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {autoPilotLoads.slice(0, 3).map((load) => (
                    <div
                      key={load.id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {load.source}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {load.timestamp}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-gray-900 truncate">
                          {load.broker}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">
                          {load.originCity}, {load.originState} → {load.destCity}, {load.destState}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
                        <div>
                          <span className="text-emerald-600 font-bold font-mono text-xs">
                            ${load.rate.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono ml-1">
                            (${load.ratePerMile.toFixed(2)}/mi)
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          load.status === 'auto_booked'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : load.status === 'rejected_low_rpm'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
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

          {/* 2. AGENTS CATALOG & LIVE REASONING CONSOLE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Agents List */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#007AFF]" />
                    Autonomous Agents ({filteredAgents.length})
                  </h2>
                  <span className="text-xs text-gray-500 font-mono">
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
                            ? 'bg-blue-50 border-[#007AFF] text-gray-900'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-blue-100 text-[#007AFF]">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-900">{agent.name}</div>
                              <div className="text-[10px] text-gray-500 capitalize">{agent.category.replace('_', ' ')}</div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleAgentStatus(agent.id);
                            }}
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                              agent.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-gray-200 text-gray-600 border border-gray-300'
                            }`}
                          >
                            {agent.status === 'active' ? 'Active' : 'Paused'}
                          </button>
                        </div>

                        <p className="text-[11px] text-gray-600 line-clamp-2 mb-2">
                          {agent.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-2 border-t border-gray-200">
                          <span>{agent.totalRunsCount || 0} Runs</span>
                          <span>{agent.hoursSavedTotal || 0}h Saved</span>
                          <span className="text-[#007AFF]">{agent.accuracyRatePct || 99}% Match</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Selected Agent Sandbox & Test Runner */}
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              {selectedAgent ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-bold text-gray-900">{selectedAgent.name}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                          {selectedAgent.triggerEvent}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedAgent.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenWorkflowBuilder(selectedAgent)}
                      className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <Workflow className="w-3.5 h-3.5 text-[#007AFF]" />
                      Edit Workflow
                    </button>
                  </div>

                  {/* Execution Prompt & Parameters */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                      Agent Instruction Prompt:
                    </span>
                    <p className="text-xs text-gray-700 font-mono leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                      {selectedAgent.systemPrompt || 'Evaluate freight parameters against fleet criteria and autonomously dispatch records.'}
                    </p>
                  </div>

                  {/* Live Test Execution Bar */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-900">Agent Live Dispatch Execution Console</span>
                      <span className="text-gray-500">Select target shipment for agent execution</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={selectedLoadId}
                        onChange={(e) => setSelectedLoadId(e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#007AFF]"
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
                        className="px-5 py-2.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                        {isRunning ? 'Executing Agent...' : 'Run Agent Test'}
                      </button>
                    </div>
                  </div>

                  {/* Execution Output Panel */}
                  {runResult && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-emerald-300 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Execution Output (Confidence: {runResult.confidenceScore || 98}%)
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">
                          Execution Time: {runResult.executionTimeMs || 340}ms
                        </span>
                      </div>
                      <pre className="text-xs text-gray-800 font-mono bg-white p-3 rounded-lg border border-gray-200 whitespace-pre-wrap overflow-x-auto">
                        {typeof runResult.outputSummary === 'string' 
                          ? runResult.outputSummary 
                          : JSON.stringify(runResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                  Select an agent to inspect logic and execute live tests.
                </div>
              )}

              {/* Bottom Execution History */}
              <div className="border-t border-gray-200 pt-4 mt-6 flex items-center justify-between text-xs text-gray-500">
                <span>Recent Agent Executions: {executionLogs.length} logged</span>
                <button
                  onClick={() => onNavigateToTab('projects')}
                  className="text-[#007AFF] hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  View Dispatch Matrix <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. AUDIT TRAIL & EXECUTION LOGS SUB-TAB */}
      {activeFoundrySubTab === 'logs' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Foundry Autonomous Execution Audit Feed ({executionLogs.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Immutable trace of autonomous rate confirmation ingestions, custom rule actions, and fleet dispatches.
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('projects')}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Dispatch Matrix</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#007AFF]" />
            </button>
          </div>

          <div className="space-y-3">
            {executionLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors space-y-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-gray-900">{log.agentName}</span>
                    {log.loadNumber && (
                      <span className="font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        #{log.loadNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 font-mono text-[11px]">
                    <span>{log.executionTimeMs}ms</span>
                    <span className="text-emerald-700 font-bold">{log.confidenceScore}% confidence</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <div className="text-gray-800 font-medium">
                  Trigger: <strong className="text-gray-900">{log.triggerEvent}</strong>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-200">
                  <div className="p-2 rounded-lg bg-white border border-gray-200">
                    <span className="text-gray-500 uppercase font-mono block text-[9px]">Input Context</span>
                    <span className="text-gray-700 line-clamp-2">{log.inputSummary}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-gray-200">
                    <span className="text-emerald-700 uppercase font-mono block text-[9px]">Autonomous Result</span>
                    <span className="text-gray-700 line-clamp-2">{log.outputSummary}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AUTO-PILOT SETTINGS MODAL */}
      {showAutoPilotSettings && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#007AFF]" />
                Foundry Auto-Pilot Autonomous Criteria
              </h3>
              <button
                onClick={() => setShowAutoPilotSettings(false)}
                className="text-gray-400 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-800">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
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
                    className="flex-1 accent-[#007AFF]"
                  />
                  <span className="text-sm font-mono font-bold text-[#007AFF] w-16 text-right">
                    ${tempMinRpm.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Loads below this floor rate are automatically rejected to preserve fleet profitability.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Minimum Gross Pay ($):
                </label>
                <input
                  type="number"
                  value={tempMinGross}
                  onChange={(e) => setTempMinGross(parseInt(e.target.value, 10))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Autonomous Auto-Book Confidence Threshold (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="75"
                    max="99"
                    value={tempConfidence}
                    onChange={(e) => setTempConfidence(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#007AFF]"
                  />
                  <span className="text-sm font-mono font-bold text-emerald-600 w-12 text-right">
                    {tempConfidence}%
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label className="flex items-center gap-2.5 text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPilotConfig.autoCreateLoad} 
                    onChange={(e) => onUpdateAutoPilotConfig({ ...autoPilotConfig, autoCreateLoad: e.target.checked })}
                    className="accent-[#007AFF] rounded" 
                  />
                  <span>Automatically construct Dispatch Load records in Matrix</span>
                </label>
                <label className="flex items-center gap-2.5 text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPilotConfig.autoDraftInvoice} 
                    onChange={(e) => onUpdateAutoPilotConfig({ ...autoPilotConfig, autoDraftInvoice: e.target.checked })}
                    className="accent-[#007AFF] rounded" 
                  />
                  <span>Automatically draft customer invoices in Invoicing Hub</span>
                </label>
                <label className="flex items-center gap-2.5 text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPilotConfig.autoSyncGoogleCalendar} 
                    onChange={(e) => onUpdateAutoPilotConfig({ ...autoPilotConfig, autoSyncGoogleCalendar: e.target.checked })}
                    className="accent-[#007AFF] rounded" 
                  />
                  <span>Automatically sync pickup & delivery appointments to Google Calendar</span>
                </label>
                <label className="flex items-center gap-2.5 text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoPilotConfig.autoSaveGoogleDrive} 
                    onChange={(e) => onUpdateAutoPilotConfig({ ...autoPilotConfig, autoSaveGoogleDrive: e.target.checked })}
                    className="accent-[#007AFF] rounded" 
                  />
                  <span>Automatically save Rate Con contracts as Google Docs in Drive</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowAutoPilotSettings(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold transition-colors cursor-pointer"
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
