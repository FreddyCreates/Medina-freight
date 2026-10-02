import React from 'react';
import { 
  FolderInput, 
  FileCheck2, 
  ReceiptText, 
  Send, 
  Coins, 
  FolderKanban, 
  Settings2,
  Clock,
  ArrowRight,
  Laptop,
  Radio,
  Smartphone,
  Camera,
  Layers,
  ShieldCheck, 
  Cpu,
  Globe,
  Mail,
  Zap,
  CalendarDays,
  Calculator,
  Users,
  Building2,
  Bot,
  Wrench
} from 'lucide-react';
import { CompanyProfile } from '../../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingDocsCount: number;
  pendingInvoicesCount: number;
  pendingEmailsCount: number;
  pendingRemittancesCount: number;
  activeProjectsCount: number;
  activeAgentsCount: number;
  complianceAlertsCount: number;
  companyProfile?: CompanyProfile;
  autoPilotActive?: boolean;
  onOpenWindowsModal: () => void;
  onOpenCompanyModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  pendingDocsCount,
  pendingInvoicesCount,
  pendingEmailsCount,
  pendingRemittancesCount,
  activeProjectsCount,
  activeAgentsCount,
  complianceAlertsCount,
  companyProfile,
  autoPilotActive = true,
  onOpenWindowsModal,
  onOpenCompanyModal
}) => {
  const foundryModules = [
    {
      id: 'gemini-admin',
      title: 'Gemini Omni Admin',
      subtitle: 'Fleet Commander & Diagnostics',
      icon: Bot,
      badge: 'Omni AI',
      color: 'text-purple-400',
    },
    {
      id: 'estimates',
      title: 'Freight Estimates',
      subtitle: 'Quotes & Rate Calculations',
      icon: Calculator,
      badge: 'Quotes',
      color: 'text-blue-400',
    },
    {
      id: 'projects',
      title: 'Dispatch Matrix',
      subtitle: 'Asset & Brokerage Loads',
      icon: FolderKanban,
      badge: activeProjectsCount,
      color: 'text-indigo-400',
    },
    {
      id: 'fleet-drivers',
      title: 'Fleet & Drivers',
      subtitle: 'Roster & Real Dispatch',
      icon: Users,
      badge: 'Drivers',
      color: 'text-purple-400',
    },
    {
      id: 'invoicing',
      title: 'Billing & Invoices',
      subtitle: 'Native AR & Factoring',
      icon: ReceiptText,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
      color: 'text-emerald-400',
    },
    {
      id: 'driver',
      title: 'Driver POD Camera',
      subtitle: 'Live Camera & POD Upload',
      icon: Camera,
      color: 'text-purple-400',
    },
    {
      id: 'calendar-sync',
      title: 'Calendar Sync',
      subtitle: 'Google Cal Auto-Dispatcher',
      icon: CalendarDays,
      badge: 'Live GCal',
      color: 'text-blue-400',
    },
    {
      id: 'workspace',
      title: 'Google Workspace',
      subtitle: 'Gmail, Cal, Docs & Drive',
      icon: Globe,
      badge: 'Live',
      color: 'text-sky-400',
    },
    {
      id: 'compliance',
      title: 'Carrier Compliance',
      subtitle: 'FMCSA, COI & Insurance',
      icon: ShieldCheck,
      badge: complianceAlertsCount > 0 ? `${complianceAlertsCount} Alerts` : undefined,
      color: 'text-emerald-400',
    },
    {
      id: 'foundry',
      title: 'Foundry AI Studio',
      subtitle: 'Auto-Pilot & 7 Agents',
      icon: Cpu,
      badge: autoPilotActive ? 'Auto-Pilot' : `${activeAgentsCount} AI`,
      color: 'text-orange-400',
    },
    {
      id: 'map',
      title: 'Live GPS & Telematics',
      subtitle: 'Samsara/Motive Telemetry',
      icon: Radio,
      color: 'text-cyan-400',
    },
  ];

  const workflowSteps = [
    {
      id: 'scanner',
      stepNum: '1',
      title: 'Incoming Folder',
      subtitle: 'Scan & Match BOL/RateCon',
      icon: FolderInput,
      badge: pendingDocsCount > 0 ? pendingDocsCount : undefined,
    },
    {
      id: 'review',
      stepNum: '2',
      title: 'Review Proposed Invoice',
      subtitle: 'Side-by-side paperwork audit',
      icon: FileCheck2,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
    },
    {
      id: 'invoicing',
      stepNum: '3',
      title: 'Invoicing & Factoring',
      subtitle: 'MyInvoice Bridge & AR',
      icon: ReceiptText,
    },
    {
      id: 'email',
      stepNum: '4',
      title: 'Approve Billing Email',
      subtitle: 'Outbound dispatch packet',
      icon: Send,
      badge: pendingEmailsCount > 0 ? pendingEmailsCount : undefined,
    },
    {
      id: 'payments',
      stepNum: '5',
      title: 'Payment Matching',
      subtitle: 'Auto-reconcile remittances',
      icon: Coins,
      badge: pendingRemittancesCount > 0 ? pendingRemittancesCount : undefined,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-6">
        {/* Alvys Foundry Platform Modules */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              TMS Core Modules
            </span>
            {autoPilotActive && (
              <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
                <Zap className="w-3 h-3 animate-pulse" /> Auto-Pilot
              </span>
            )}
          </div>
          <div className="space-y-1">
            {foundryModules.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? item.color : 'text-slate-400 group-hover:text-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Step Invoicing & Paperwork Pipeline */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Billing Pipeline
            </span>
            <span className="text-[10px] font-mono text-slate-400">5-Step</span>
          </div>

          <div className="space-y-1">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              const isActive = currentTab === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => onTabChange(step.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isActive 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                  }`}>
                    {step.stepNum}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{step.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{step.subtitle}</div>
                  </div>

                  {step.badge !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {step.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 120+ Integrations Hub */}
        <div>
          <button
            onClick={() => onTabChange('integrations')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
              currentTab === 'integrations'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate font-medium">120+ Integrations Hub</div>
              <div className="text-[10px] text-slate-400 truncate">DAT, Motive, TriumphPay</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer / Company Profile & System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-2">
        {onOpenCompanyModal && (
          <button
            onClick={onOpenCompanyModal}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              <div className="text-left">
                <div className="font-semibold text-slate-200 text-[11px] truncate max-w-[130px]">
                  {companyProfile?.companyName || 'GREEN EXPRESS LLC'}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {companyProfile?.email || 'dispatch@greenexpressllc.com'}
                </div>
              </div>
            </div>
            <Settings2 className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
          </button>
        )}

        <button
          onClick={onOpenWindowsModal}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-850 text-xs text-slate-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Laptop className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-medium text-slate-300">Local Folder Watcher</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>
    </aside>
  );
};
