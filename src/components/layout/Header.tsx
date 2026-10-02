import React from 'react';
import { Collaborator, WindowsWatcherConfig, CompanyProfile } from '../../types';
import { 
  Radio, 
  Laptop, 
  FileDown, 
  FolderKanban, 
  ShieldCheck, 
  Cpu,
  Mail,
  Zap,
  Globe,
  CalendarDays,
  Building2,
  Calculator,
  Users,
  Bot,
  Wrench
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  collaborators: Collaborator[];
  windowsConfig: WindowsWatcherConfig;
  companyProfile?: CompanyProfile;
  onOpenWindowsModal: () => void;
  onOpenCompanyModal?: () => void;
  onQuickGeneratePDF: () => void;
  activeAgentsCount: number;
  autoPilotEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  collaborators,
  windowsConfig,
  companyProfile,
  onOpenWindowsModal,
  onOpenCompanyModal,
  onQuickGeneratePDF,
  activeAgentsCount,
  autoPilotEnabled = true,
}) => {
  const activeCollaborators = collaborators.filter(c => c.status === 'active' || c.status === 'in_review');

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800/80 sticky top-0 z-40 shrink-0 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div 
        onClick={onOpenCompanyModal}
        className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5 group cursor-pointer"
        title="Click to edit real company legal name, DOT #, MC #, and dispatch email"
      >
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:from-orange-400 group-hover:to-amber-500 transition-all">
          AF
        </span>
        <div className="flex flex-col text-left">
          <span className="font-extrabold tracking-tight text-sm leading-tight text-white group-hover:text-orange-400 transition-colors">
            {companyProfile?.companyName || 'Your Carrier Name LLC'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            DOT #{companyProfile?.dotNumber || 'DOT-PENDING'} · MC #{companyProfile?.mcNumber || 'MC-PENDING'} ⚙️
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden xl:flex items-center gap-4 text-sm font-medium text-slate-300">
        <button
          onClick={() => onTabChange('gemini-admin')}
          className={`hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'gemini-admin' ? 'text-white border-b-2 border-purple-500 font-semibold text-purple-400' : 'text-slate-400'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span>Gemini Omni Admin</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => onTabChange('estimates')}
          className={`hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'estimates' ? 'text-white border-b-2 border-blue-500 font-semibold text-blue-400' : 'text-slate-400'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-blue-400" />
          <span>Freight Estimates</span>
        </button>

        <button
          onClick={() => onTabChange('projects')}
          className={`hover:text-white transition-colors cursor-pointer py-1 ${
            currentTab === 'projects' ? 'text-white border-b-2 border-orange-500 font-semibold' : 'text-slate-400'
          }`}
        >
          Dispatch Matrix
        </button>

        <button
          onClick={() => onTabChange('fleet-drivers')}
          className={`hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'fleet-drivers' ? 'text-white border-b-2 border-purple-500 font-semibold text-purple-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>Fleet & Drivers</span>
        </button>

        <button
          onClick={() => onTabChange('invoicing')}
          className={`hover:text-white transition-colors cursor-pointer py-1 ${
            currentTab === 'invoicing' ? 'text-white border-b-2 border-orange-500 font-semibold' : 'text-slate-400'
          }`}
        >
          Billing & Factoring
        </button>

        <button
          onClick={() => onTabChange('workspace')}
          className={`hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'workspace' ? 'text-white border-b-2 border-blue-500 font-semibold text-blue-400' : 'text-slate-400'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>Google Suite</span>
        </button>

        <button
          onClick={() => onTabChange('compliance')}
          className={`hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'compliance' ? 'text-white border-b-2 border-emerald-500 font-semibold text-emerald-400' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Carrier Compliance</span>
        </button>

        <button
          onClick={() => onTabChange('foundry')}
          className={`hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'foundry' ? 'text-white border-b-2 border-orange-500 font-semibold text-orange-400' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-orange-400" />
          <span>Foundry AI Studio</span>
          {autoPilotEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>
      </nav>

      {/* Zone 3: Actions, Google Workspace Status, Auto-Pilot & Collaborators */}
      <div className="flex items-center gap-3">
        {/* Company Profile Button */}
        {onOpenCompanyModal && (
          <button
            onClick={onOpenCompanyModal}
            className="px-3 py-1.5 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 text-orange-300 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Edit Carrier Authority & Company Profile"
          >
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">{companyProfile?.companyName || 'Company Profile'}</span>
          </button>
        )}
        {/* Auto-Pilot Pulsing Status Pill */}
        <button
          onClick={() => onTabChange('foundry')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
            autoPilotEnabled 
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="Auto-Pilot autonomous tender monitoring"
        >
          <Zap className={`w-3.5 h-3.5 ${autoPilotEnabled ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden sm:inline font-mono text-[11px]">
            {autoPilotEnabled ? 'Auto-Pilot Active' : 'Auto-Pilot Paused'}
          </span>
        </button>

        {/* Google Workspace Quick Button */}
        <button
          onClick={() => onTabChange('workspace')}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Google Workspace Hub (Gmail, Calendar, Docs, Drive)"
        >
          <span className="text-xs">🌐</span>
          <span className="hidden md:inline">Google Suite</span>
        </button>

        {/* Windows Companion App Button */}
        <button
          onClick={onOpenWindowsModal}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs text-slate-300 transition-colors"
          title="Configure Local Folder Watcher"
        >
          <Laptop className="w-3.5 h-3.5 text-blue-400" />
          <span>Folder Watcher</span>
          <span className={`w-2 h-2 rounded-full ${windowsConfig.autoWatchEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </button>

        {/* Quick PDF Summary Export */}
        <button
          onClick={onQuickGeneratePDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          title="Export Project Summary Packet (PDF)"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PDF Packet</span>
        </button>

        {/* Real-time Team Collaborators Avatar Stack */}
        <div className="flex items-center -space-x-2 pl-2 border-l border-slate-800">
          {activeCollaborators.slice(0, 3).map((collab) => (
            <div
              key={collab.id}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-slate-900 ${collab.avatarBg}`}
              title={`${collab.name} (${collab.role}) - ${collab.status}`}
            >
              {collab.initials}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};
