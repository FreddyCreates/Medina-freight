import React from 'react';
import { 
  FolderInput, 
  FileCheck2, 
  ReceiptText, 
  Send, 
  Coins, 
  FolderKanban, 
  Settings2,
  Laptop,
  Radio,
  Camera,
  Layers,
  ShieldCheck, 
  Cpu,
  Globe,
  Calculator,
  Users,
  Building2,
  Bot
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
      title: 'Gemini Omni Agent',
      subtitle: 'Fleet Commander & Diagnostics',
      icon: Bot,
      badge: 'Omni AI',
    },
    {
      id: 'estimates',
      title: 'Freight Estimates',
      subtitle: 'Quotes & Rate Calculations',
      icon: Calculator,
      badge: 'Quotes',
    },
    {
      id: 'projects',
      title: 'Dispatch Matrix',
      subtitle: 'Asset & Brokerage Loads',
      icon: FolderKanban,
      badge: activeProjectsCount,
    },
    {
      id: 'fleet-drivers',
      title: 'Fleet & Drivers',
      subtitle: 'Roster & Real Dispatch',
      icon: Users,
      badge: 'Drivers',
    },
    {
      id: 'invoicing',
      title: 'Billing & Invoices',
      subtitle: 'Native AR & Factoring',
      icon: ReceiptText,
      badge: pendingInvoicesCount > 0 ? pendingInvoicesCount : undefined,
    },
    {
      id: 'driver',
      title: 'Driver POD Camera',
      subtitle: 'Live Camera & POD Upload',
      icon: Camera,
    },
    {
      id: 'workspace',
      title: 'Google Workspace',
      subtitle: 'Gmail, Cal, Docs & Drive',
      icon: Globe,
      badge: 'Live',
    },
    {
      id: 'compliance',
      title: 'Carrier Compliance',
      subtitle: 'FMCSA, COI & Insurance',
      icon: ShieldCheck,
      badge: complianceAlertsCount > 0 ? `${complianceAlertsCount} Alerts` : undefined,
    },
    {
      id: 'foundry',
      title: 'Foundry AI Studio',
      subtitle: 'Auto-Pilot & Agents',
      icon: Cpu,
    },
    {
      id: 'map',
      title: 'Live Telematics',
      subtitle: 'Samsara/Motive Telemetry',
      icon: Radio,
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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Core Modules */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>TMS Core Modules</span>
          </div>
          <div className="space-y-1">
            {foundryModules.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-semibold border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{item.title}</div>
                    <div className="text-[10px] text-gray-500 truncate">{item.subtitle}</div>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
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
          <div className="px-3 mb-2 flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Billing Pipeline</span>
            <span className="text-[10px] font-mono text-gray-400">5-Step</span>
          </div>

          <div className="space-y-1">
            {workflowSteps.map((step) => {
              const isActive = currentTab === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => onTabChange(step.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-semibold border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {step.stepNum}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{step.title}</div>
                    <div className="text-[10px] text-gray-500 truncate">{step.subtitle}</div>
                  </div>

                  {step.badge !== undefined && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {step.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Integrations Hub */}
        <div>
          <button
            onClick={() => onTabChange('integrations')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
              currentTab === 'integrations'
                ? 'bg-gray-100 text-gray-900 font-semibold border border-gray-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-4 h-4 text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate font-medium">120+ Integrations Hub</div>
              <div className="text-[10px] text-gray-500 truncate">DAT, Motive, TriumphPay</div>
            </div>
          </button>
        </div>
      </div>

      {/* Footer / Company Profile & System Status */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
        {onOpenCompanyModal && (
          <button
            onClick={onOpenCompanyModal}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-xs text-gray-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-[11px] truncate max-w-[130px]">
                  {companyProfile?.companyName || 'GREEN EXPRESS LLC'}
                </div>
                <div className="text-[10px] text-gray-500 truncate max-w-[130px]">
                  {companyProfile?.email || 'dispatch@greenexpressllc.com'}
                </div>
              </div>
            </div>
            <Settings2 className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
          </button>
        )}

        <button
          onClick={onOpenWindowsModal}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-xs text-gray-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Laptop className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] font-medium text-gray-700">Local Folder Watcher</span>
          </div>
          <span className="text-[10px] text-gray-400">Ready</span>
        </button>
      </div>
    </aside>
  );
};
