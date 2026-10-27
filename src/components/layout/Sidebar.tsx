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
  Bot,
  HardDrive,
  X,
  ChevronLeft,
  Sparkles,
  BarChart3
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
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  onOpenCompanyModal,
  isOpenOnMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const foundryModules = [
    {
      id: 'dashboard',
      title: 'Analytics Dashboard',
      subtitle: 'Freight Yield & Volume Metrics',
      icon: BarChart3,
      badge: 'Recharts',
    },
    {
      id: 'gemini-admin',
      title: 'Gemini Omni Agent',
      subtitle: 'Fleet Commander & Diagnostics',
      icon: Bot,
      badge: 'Omni AI',
    },
    {
      id: 'estimates',
      title: 'Quotes, Invoices & Fuel',
      subtitle: 'Estimates, AR Billing & FSC Engine',
      icon: Calculator,
      badge: 'Quotes & AR',
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
      id: 'explorer',
      title: 'Docs & Base Explorer',
      subtitle: 'PDFs, Files & Database',
      icon: HardDrive,
      badge: 'Explorer',
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
    {
      id: 'api-mcp',
      title: 'API Pro & MCP',
      subtitle: 'ChatGPT Actions & MCP',
      icon: Sparkles,
      badge: 'PRO',
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

  const handleItemClick = (tabId: string) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile background overlay */}
      {isOpenOnMobile && (
        <div 
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      <aside className={`bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 select-none overflow-y-auto transition-all duration-300
        ${isOpenOnMobile ? 'translate-x-0 fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] h-screen shadow-2xl flex' : '-translate-x-full fixed inset-y-0 left-0 z-50 h-screen hidden'}
        lg:translate-x-0 lg:static lg:h-auto lg:z-0 lg:flex ${isCollapsed ? 'lg:w-18' : 'lg:w-64'}
      `}>
      {/* Desktop & Mobile Brand Header */}
      <div className={`p-3.5 border-b border-gray-200 bg-gray-900 text-white shrink-0 ${isCollapsed ? 'lg:px-2' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-gray-950 font-black text-xs flex items-center justify-center shadow-md shrink-0">
              FS
            </div>
            {!isCollapsed && (
              <div className="text-left min-w-0">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                  {companyProfile?.companyName || 'GREEN EXPRESS LLC'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  USDOT #{companyProfile?.dotNumber || '3892019'}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Mobile Close Button */}
            {isOpenOnMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Desktop Collapse / Expand Toggle */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`p-3 space-y-5 flex-1 ${isCollapsed ? 'lg:px-2' : ''}`}>
        {/* Core Modules */}
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-2 flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <span>TMS Core Modules</span>
            </div>
          )}
          <div className="space-y-1">
            {foundryModules.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={isCollapsed ? `${item.title} - ${item.subtitle}` : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'} py-2 rounded-lg text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-semibold border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-gray-500" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{item.title}</div>
                      <div className="text-[10px] text-gray-500 truncate">{item.subtitle}</div>
                    </div>
                  )}
                  {!isCollapsed && item.badge !== undefined && (
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
          {!isCollapsed && (
            <div className="px-3 mb-2 flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <span>Billing Pipeline</span>
              <span className="text-[10px] font-mono text-gray-400">5-Step</span>
            </div>
          )}

          <div className="space-y-1">
            {workflowSteps.map((step) => {
              const isActive = currentTab === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => handleItemClick(step.id)}
                  title={isCollapsed ? `${step.stepNum}. ${step.title}` : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'} py-2 rounded-lg text-left transition-all cursor-pointer ${
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

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{step.title}</div>
                      <div className="text-[10px] text-gray-500 truncate">{step.subtitle}</div>
                    </div>
                  )}

                  {!isCollapsed && step.badge !== undefined && (
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
            onClick={() => handleItemClick('integrations')}
            title={isCollapsed ? "120+ Integrations Hub" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-3'} py-2 rounded-lg text-left transition-all cursor-pointer ${
              currentTab === 'integrations'
                ? 'bg-gray-100 text-gray-900 font-semibold border border-gray-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-4 h-4 text-gray-500 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate font-medium">120+ Integrations Hub</div>
                <div className="text-[10px] text-gray-500 truncate">DAT, Motive, TriumphPay</div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Footer / Company Profile & System Status */}
      <div className={`p-3 border-t border-gray-200 bg-gray-50 space-y-2 ${isCollapsed ? 'lg:px-2' : ''}`}>
        {onOpenCompanyModal && (
          <button
            onClick={onOpenCompanyModal}
            title={isCollapsed ? "Company Authority Settings" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-xs text-gray-800 transition-colors cursor-pointer`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
              {!isCollapsed && (
                <div className="text-left min-w-0">
                  <div className="font-semibold text-gray-900 text-[11px] truncate max-w-[130px]">
                    {companyProfile?.companyName || 'GREEN EXPRESS LLC'}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate max-w-[130px]">
                    Admin Settings & SDK
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && <Settings2 className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />}
          </button>
        )}

        <button
          onClick={onOpenWindowsModal}
          title={isCollapsed ? "Local Folder Watcher" : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-xs text-gray-600 transition-colors cursor-pointer`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Laptop className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            {!isCollapsed && <span className="text-[10px] font-medium text-gray-700 truncate">Local Folder Watcher</span>}
          </div>
          {!isCollapsed && <span className="text-[10px] text-gray-400">Ready</span>}
        </button>
      </div>
    </aside>
    </>
  );
};
