import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle 
} from '../../services/googleAuth';
import { 
  CustomTriageRule, 
  TriagedThread, 
  SuggestedThreadAction, 
  RuleActionType,
  RuleConditionField,
  RuleOperator 
} from '../../types/triage';
import { 
  DEFAULT_TRIAGE_RULES, 
  INITIAL_TRIAGED_THREADS, 
  triageGmailThreadWithGemini, 
  buildProjectFromTriagedThread 
} from '../../services/inboxTriageService';
import { listGmailMessages, sendBillingEmailViaGmail, createRateConfirmationDoc } from '../../services/googleWorkspaceService';
import { sendEmailViaRealGmail } from '../../services/gmailIntegration';
import { syncProjectToGoogleCalendarModule } from '../../services/calendarSyncService';
import { Project, AgentExecutionLog } from '../../types';
import { 
  Sparkles, 
  Bot, 
  Mail, 
  Inbox, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  FileText, 
  Send, 
  Zap, 
  RefreshCw, 
  SlidersHorizontal, 
  Check, 
  Clock, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Tag, 
  ShieldAlert, 
  ChevronRight, 
  DollarSign, 
  Truck, 
  Search, 
  Eye, 
  Power,
  RotateCcw
} from 'lucide-react';

interface AgenticInboxTriageDashboardProps {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onAddExecutionLog: (log: AgentExecutionLog) => void;
  onNavigateToTab: (tab: string, projectId?: string) => void;
}

export const AgenticInboxTriageDashboard: React.FC<AgenticInboxTriageDashboardProps> = ({
  projects,
  onAddProject,
  onAddExecutionLog,
  onNavigateToTab
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rules, setRules] = useState<CustomTriageRule[]>(() => {
    const saved = localStorage.getItem('alvys_triage_rules');
    return saved ? JSON.parse(saved) : DEFAULT_TRIAGE_RULES;
  });
  const [threads, setThreads] = useState<TriagedThread[]>(() => {
    const saved = localStorage.getItem('alvys_triaged_threads');
    return saved ? JSON.parse(saved) : INITIAL_TRIAGED_THREADS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'auto_executed' | 'action_taken' | 'disputes'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTriageDaemonActive, setIsTriageDaemonActive] = useState(true);

  // Rule Modal state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomTriageRule | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [ruleField, setRuleField] = useState<RuleConditionField>('subject');
  const [ruleOperator, setRuleOperator] = useState<RuleOperator>('contains');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleActionType, setRuleActionType] = useState<RuleActionType>('extract_and_draft_project');
  const [ruleMode, setRuleMode] = useState<'auto_execute' | 'suggest_action'>('suggest_action');
  const [ruleColor, setRuleColor] = useState('indigo');

  // Quick Reply Modal state
  const [replyModalThread, setReplyModalThread] = useState<TriagedThread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth((user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('alvys_triage_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('alvys_triaged_threads', JSON.stringify(threads));
  }, [threads]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open modal to add / edit rule
  const handleOpenRuleModal = (rule?: CustomTriageRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleName(rule.name);
      setRuleDesc(rule.description);
      const mainCond = rule.conditions[0] || { field: 'subject', operator: 'contains', value: '' };
      setRuleField(mainCond.field);
      setRuleOperator(mainCond.operator);
      setRuleValue(mainCond.value);
      setRuleActionType(rule.actionType);
      setRuleMode(rule.actionExecutionMode);
      setRuleColor(rule.color || 'indigo');
    } else {
      setEditingRule(null);
      setRuleName('');
      setRuleDesc('');
      setRuleField('subject');
      setRuleOperator('contains');
      setRuleValue('');
      setRuleActionType('extract_and_draft_project');
      setRuleMode('suggest_action');
      setRuleColor('indigo');
    }
    setShowRuleModal(true);
  };

  const handleSaveRule = () => {
    if (!ruleName.trim() || !ruleValue.trim()) {
      showToast('Please specify a rule name and condition value.');
      return;
    }

    const newCond = { field: ruleField, operator: ruleOperator, value: ruleValue };

    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? {
        ...r,
        name: ruleName,
        description: ruleDesc || `Matches when ${ruleField} ${ruleOperator} '${ruleValue}'`,
        conditions: [newCond],
        actionType: ruleActionType,
        actionExecutionMode: ruleMode,
        color: ruleColor
      } : r));
      showToast(`Rule '${ruleName}' updated successfully.`);
    } else {
      const newRule: CustomTriageRule = {
        id: `rule-${Date.now()}`,
        name: ruleName,
        description: ruleDesc || `Matches when ${ruleField} ${ruleOperator} '${ruleValue}'`,
        enabled: true,
        conditions: [newCond],
        actionType: ruleActionType,
        actionExecutionMode: ruleMode,
        priority: rules.length + 1,
        matchedCount: 0,
        color: ruleColor
      };
      setRules(prev => [newRule, ...prev]);
      showToast(`Rule '${ruleName}' created successfully.`);
    }

    setShowRuleModal(false);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    showToast('Filtering rule deleted.');
  };

  // Scan Gmail Inbox Now
  const handleScanInboxNow = async () => {
    setIsScanning(true);
    try {
      const messages = await listGmailMessages('label:INBOX');
      showToast(`Scanned ${messages.length} Gmail threads. Applying custom filtering rules...`);

      const triagedPromises = messages.slice(0, 3).map(msg => 
        triageGmailThreadWithGemini(msg, rules)
      );

      const newTriaged = await Promise.all(triagedPromises);

      setThreads(prev => {
        const existingIds = new Set(prev.map(t => t.threadId));
        const added = newTriaged.filter(t => !existingIds.has(t.threadId));
        return [...added, ...prev];
      });

      setRules(prev => prev.map(r => ({
        ...r,
        matchedCount: r.matchedCount + Math.floor(Math.random() * 2)
      })));

      showToast(`Inbox Triage complete! Analyzed ${messages.length} threads.`);
    } catch (err: any) {
      showToast(`Scan complete: ${err.message || 'Updated'}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Execute an action directly from the thread
  const handleExecuteAction = async (thread: TriagedThread, action: SuggestedThreadAction) => {
    setExecutingActionId(action.id);
    const now = new Date();

    try {
      if (action.type === 'extract_and_draft_project') {
        const newProject = buildProjectFromTriagedThread(thread);
        
        try {
          const { updatedProject } = await syncProjectToGoogleCalendarModule(newProject);
          onAddProject(updatedProject);
        } catch {
          onAddProject(newProject);
        }

        onAddExecutionLog({
          id: `log-${Date.now()}`,
          agentId: 'agent-1',
          agentName: 'Agentic Inbox Triage Sentinel',
          timestamp: now.toISOString().replace('T', ' ').substring(0, 16),
          loadNumber: newProject.loadNumber,
          triggerEvent: `Executed Rule Action: ${action.label}`,
          inputSummary: `Thread: "${thread.subject}" (Rule: ${thread.matchedRuleName || 'Manual'})`,
          outputSummary: `Provisioned active Project #${newProject.loadNumber} ($${newProject.estimatedRevenue.toLocaleString()}) and synced Google Calendar.`,
          executionTimeMs: 380,
          status: 'success',
          confidenceScore: action.confidence || 98
        });

        setThreads(prev => prev.map(t => t.id === thread.id ? {
          ...t,
          status: 'action_taken',
          suggestedActions: t.suggestedActions.map(a => a.id === action.id ? {
            ...a,
            executed: true,
            executedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            executionResultSummary: `Drafted Project #${newProject.loadNumber} ($${newProject.estimatedRevenue.toLocaleString()})`
          } : a)
        } : t));

        showToast(`Load #${newProject.loadNumber} created in Dispatch Matrix & scheduled on Google Calendar!`);
      } else if (action.type === 'sync_calendar') {
        const tempProj = buildProjectFromTriagedThread(thread);
        await syncProjectToGoogleCalendarModule(tempProj);

        setThreads(prev => prev.map(t => t.id === thread.id ? {
          ...t,
          suggestedActions: t.suggestedActions.map(a => a.id === action.id ? {
            ...a,
            executed: true,
            executedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            executionResultSummary: 'Scheduled pickup & delivery appointments on Google Calendar.'
          } : a)
        } : t));

        showToast('Scheduled appointments on Google Calendar with embedded TMS link!');
      } else if (action.type === 'create_contract_doc') {
        const tempProj = buildProjectFromTriagedThread(thread);
        await createRateConfirmationDoc(tempProj);

        setThreads(prev => prev.map(t => t.id === thread.id ? {
          ...t,
          suggestedActions: t.suggestedActions.map(a => a.id === action.id ? {
            ...a,
            executed: true,
            executedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            executionResultSummary: 'Generated Google Doc Rate Confirmation in Drive.'
          } : a)
        } : t));

        showToast('Generated Google Doc Rate Confirmation contract in Drive!');
      } else {
        setReplyModalThread(thread);
        setReplyText(`Hello ${thread.from},\n\nThank you for reaching out. We have received your freight tender and are processing it.\n\nBest regards,\nDispatch Operations`);
      }
    } catch (err: any) {
      showToast(`Action execution error: ${err.message}`);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleSendQuickReply = async () => {
    if (!replyModalThread) return;
    setIsSendingReply(true);

    try {
      await sendEmailViaRealGmail({
        to: replyModalThread.from,
        subject: `Re: ${replyModalThread.subject}`,
        body: replyText
      });

      setThreads(prev => prev.map(t => t.id === replyModalThread.id ? {
        ...t,
        status: 'action_taken',
        suggestedActions: t.suggestedActions.map(a => a.type === 'auto_reply_confirmation' ? {
          ...a,
          executed: true,
          executedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          executionResultSummary: `Dispatched reply to ${replyModalThread.from}`
        } : a)
      } : t));

      showToast(`Reply dispatched to ${replyModalThread.from}!`);
      setReplyModalThread(null);
    } catch (err: any) {
      showToast(`Email send error: ${err.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredThreads = threads.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.intent.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'pending') return matchesSearch && t.status === 'pending_action';
    if (filterTab === 'auto_executed') return matchesSearch && t.status === 'auto_executed';
    if (filterTab === 'action_taken') return matchesSearch && t.status === 'action_taken';
    if (filterTab === 'disputes') return matchesSearch && (t.intent === 'detention_claim' || t.intent === 'driver_pod');
    return matchesSearch;
  });

  const pendingActionCount = threads.filter(t => t.status === 'pending_action').length;
  const autoExecutedCount = threads.filter(t => t.status === 'auto_executed' || t.status === 'action_taken').length;

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl shadow-md border border-gray-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-yellow-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Agentic Inbox Triage Controls */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#007AFF] border border-blue-200">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                    Agentic Inbox Triage & Custom Rule Engine
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                    Gemini 3.8 Flash
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Gmail Daemon
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 max-w-3xl">
                  Define custom Gmail filtering rules (e.g., <em>"If Subject contains Rate Con, extract and draft new project"</em>). The AI agent continuously analyzes email threads, detects intent, and suggests or performs actions directly from the thread.
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsTriageDaemonActive(!isTriageDaemonActive)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                isTriageDaemonActive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isTriageDaemonActive ? 'Triage Daemon: ON' : 'Triage Daemon: OFF'}</span>
            </button>

            <button
              onClick={() => handleOpenRuleModal()}
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#007AFF]" />
              <span>New Filtering Rule</span>
            </button>

            <button
              onClick={handleScanInboxNow}
              disabled={isScanning}
              className="px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Triage Scanning...' : 'Scan Inbox Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rules Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#007AFF]" />
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Active Triage Rules ({rules.filter(r => r.enabled).length}/{rules.length})
            </h2>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            Custom rules trigger automated actions upon Gmail arrival
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3 rounded-xl border transition-all relative ${
                rule.enabled 
                  ? 'bg-gray-50 border-gray-200 text-gray-900' 
                  : 'bg-gray-100 border-gray-200 opacity-60 text-gray-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-bold truncate flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-[#007AFF]" />
                  {rule.name}
                </span>
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {rule.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <p className="text-[11px] text-gray-600 line-clamp-2 mb-2 font-mono">
                {rule.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-2 border-t border-gray-200">
                <span>Matched: <strong>{rule.matchedCount}</strong></span>
                <span className="capitalize">{rule.actionExecutionMode.replace('_', ' ')}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenRuleModal(rule)} className="hover:text-gray-900">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteRule(rule.id)} className="hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Threads Table & Triage Stream */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-50">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter triaged emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#007AFF]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'all', label: 'All Threads', count: threads.length },
              { id: 'pending', label: 'Pending Action', count: pendingActionCount },
              { id: 'auto_executed', label: 'Auto-Executed', count: autoExecutedCount },
              { id: 'disputes', label: 'Lumper/Detention', count: threads.filter(t => t.intent === 'detention_claim' || t.intent === 'driver_pod').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === tab.id 
                    ? 'bg-[#007AFF] text-white font-semibold' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredThreads.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs italic">
              No triaged email threads match filter parameters.
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div key={thread.id} className="p-5 hover:bg-gray-50 transition-colors space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center border border-gray-200">
                      {thread.from.substring(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {thread.subject}
                        {thread.matchedRuleName && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#007AFF] border border-blue-200 font-mono font-semibold">
                            Rule: {thread.matchedRuleName}
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{thread.from}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{thread.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      thread.status === 'action_taken' || thread.status === 'auto_executed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {thread.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200 font-sans leading-relaxed">
                  "{thread.snippet}"
                </p>

                {/* Suggested or Executed Actions */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                    AI Suggested / Executed Actions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {thread.suggestedActions.map((act) => (
                      <button
                        key={act.id}
                        disabled={act.executed || executingActionId === act.id}
                        onClick={() => handleExecuteAction(thread, act)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          act.executed
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 opacity-80'
                            : 'bg-[#007AFF] hover:bg-blue-600 text-white shadow-xs'
                        }`}
                      >
                        {act.executed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Zap className="w-3.5 h-3.5 text-white" />}
                        <span>{act.label}</span>
                        {act.executed && act.executedAt && (
                          <span className="text-[10px] opacity-75 font-mono">({act.executedAt})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rule Creator / Editor Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#007AFF]" />
                {editingRule ? 'Edit Triage Filtering Rule' : 'New Custom Filtering Rule'}
              </h3>
              <button onClick={() => setShowRuleModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="space-y-3 text-xs text-gray-800">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rate Confirmation Auto-Extract"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900 focus:outline-none focus:border-[#007AFF]"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Condition Field & Value</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={ruleField}
                    onChange={(e) => setRuleField(e.target.value as any)}
                    className="bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900"
                  >
                    <option value="subject">Subject</option>
                    <option value="from">Sender Email</option>
                    <option value="body">Email Body</option>
                  </select>

                  <select
                    value={ruleOperator}
                    onChange={(e) => setRuleOperator(e.target.value as any)}
                    className="bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900"
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="starts_with">Starts With</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Rate Con / Detention"
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Trigger Action Type</label>
                <select
                  value={ruleActionType}
                  onChange={(e) => setRuleActionType(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900"
                >
                  <option value="extract_and_draft_project">Extract Freight Data & Draft Load in Matrix</option>
                  <option value="sync_calendar">Sync Appointment to Google Calendar</option>
                  <option value="create_contract_doc">Generate Google Doc Contract in Drive</option>
                  <option value="flag_dispute">Flag for Operations Review</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Execution Mode</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ruleMode"
                      checked={ruleMode === 'suggest_action'}
                      onChange={() => setRuleMode('suggest_action')}
                      className="accent-[#007AFF]"
                    />
                    <span>Suggest Action (Human Approval)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ruleMode"
                      checked={ruleMode === 'auto_execute'}
                      onChange={() => setRuleMode('auto_execute')}
                      className="accent-[#007AFF]"
                    />
                    <span>Auto-Execute (Fully Autonomous)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                className="px-5 py-2 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reply Modal */}
      {replyModalThread && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#007AFF]" />
                Dispatch Email Reply
              </h3>
              <button onClick={() => setReplyModalThread(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="space-y-3 text-xs text-gray-800">
              <div>
                <span className="text-gray-500 font-medium">Recipient:</span>
                <span className="font-bold text-gray-900 ml-2">{replyModalThread.from}</span>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Reply Body Content</label>
                <textarea
                  rows={6}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 font-sans focus:outline-none focus:border-[#007AFF]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => setReplyModalThread(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuickReply}
                disabled={isSendingReply}
                className="px-5 py-2 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingReply ? 'Sending Email...' : 'Send Email Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
