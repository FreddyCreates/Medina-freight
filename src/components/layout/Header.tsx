import React from 'react';
import { Collaborator, WindowsWatcherConfig, CompanyProfile } from '../../types';
import { 
  Laptop, 
  FileDown, 
  Building2, 
  Calculator, 
  Users, 
  Bot, 
  Globe, 
  ShieldCheck, 
  Cpu 
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
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-40 shrink-0 select-none shadow-xs">
      {/* Zone 1: Wordmark */}
      <div 
        onClick={onOpenCompanyModal}
        className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2.5 group cursor-pointer"
        title="Click to edit real company legal name, DOT #, MC #, and dispatch email"
      >
        <span className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 font-bold text-xs">
          AF
        </span>
        <div className="flex flex-col text-left">
          <span className="font-extrabold tracking-tight text-sm leading-tight text-gray-900 group-hover:text-[#007AFF] transition-colors">
            {companyProfile?.companyName || 'Your Carrier Name LLC'}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            DOT #{companyProfile?.dotNumber || 'DOT-PENDING'} · MC #{companyProfile?.mcNumber || 'MC-PENDING'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-gray-600">
        <button
          onClick={() => onTabChange('gemini-admin')}
          className={`hover:text-gray-900 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'gemini-admin' ? 'text-[#007AFF] font-semibold border-b-2 border-[#007AFF]' : 'text-gray-600'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-gray-500" />
          <span>Gemini Omni Agent</span>
        </button>

        <button
          onClick={() => onTabChange('estimates')}
          className={`hover:text-gray-900 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'estimates' ? 'text-[#007AFF] font-semibold border-b-2 border-[#007AFF]' : 'text-gray-600'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-gray-500" />
          <span>Freight Estimates</span>
        </button>

        <button
          onClick={() => onTabChange('projects')}
          className={`hover:text-gray-900 transition-colors cursor-pointer py-1 ${
            currentTab === 'projects' ? 'text-[#007AFF] font-semibold border-b-2 border-[#007AFF]' : 'text-gray-600'
          }`}
        >
          Dispatch Matrix
        </button>

        <button
          onClick={() => onTabChange('fleet-drivers')}
          className={`hover:text-gray-900 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'fleet-drivers' ? 'text-[#007AFF] font-semibold border-b-2 border-[#007AFF]' : 'text-gray-600'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-gray-500" />
          <span>Fleet & Drivers</span>
        </button>

        <button
          onClick={() => onTabChange('invoicing')}
          className={`hover:text-gray-900 transition-colors cursor-pointer py-1 ${
            currentTab === 'invoicing' ? 'text-[#007AFF] font-semibold border-b-2 border-[#007AFF]' : 'text-gray-600'
          }`}
        >
          Billing & Factoring
        </button>

        <button
          onClick={() => onTabChange('workspace')}
          className={`hover:text-gray-900 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'workspace' ? 'text-[#007AFF] font-semibold border-b-2 border-[#007AFF]' : 'text-gray-600'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-gray-500" />
          <span>Google Suite</span>
        </button>

        <button
          onClick={() => onTabChange('compliance')}
          className={`hover:text-gray-900 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'compliance' ? 'text-[#007AFF] font-semibold border-b-2 border-[#007AFF]' : 'text-gray-600'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
          <span>Carrier Compliance</span>
        </button>

        <button
          onClick={() => onTabChange('foundry')}
          className={`hover:text-gray-900 transition-colors cursor-pointer py-1 flex items-center gap-1.5 ${
            currentTab === 'foundry' ? 'text-[#007AFF] font-semibold border-b-2 border-[#007AFF]' : 'text-gray-600'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-gray-500" />
          <span>Foundry AI Studio</span>
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-3">
        {onOpenCompanyModal && (
          <button
            onClick={onOpenCompanyModal}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Edit Carrier Authority & Company Profile"
          >
            <Building2 className="w-3.5 h-3.5 text-gray-600" />
            <span className="hidden sm:inline">{companyProfile?.companyName || 'Company Profile'}</span>
          </button>
        )}

        <button
          onClick={onOpenWindowsModal}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs text-gray-800 transition-colors"
          title="Configure Local Folder Watcher"
        >
          <Laptop className="w-3.5 h-3.5 text-gray-600" />
          <span>Folder Watcher</span>
        </button>

        <button
          onClick={onQuickGeneratePDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium transition-all cursor-pointer shadow-xs"
          title="Export Project Summary Packet (PDF)"
        >
          <FileDown className="w-3.5 h-3.5 text-gray-300" />
          <span className="hidden sm:inline">PDF Packet</span>
        </button>

        <div className="flex items-center -space-x-2 pl-2 border-l border-gray-200">
          {activeCollaborators.slice(0, 3).map((collab) => (
            <div
              key={collab.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-700 bg-gray-200 border border-white"
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
