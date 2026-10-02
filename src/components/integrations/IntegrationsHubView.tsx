import React, { useState } from 'react';
import { IntegrationService } from '../../types';
import { 
  Layers, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Sliders, 
  ExternalLink, 
  TrendingUp, 
  Truck, 
  Radio, 
  DollarSign, 
  ReceiptText, 
  ShieldCheck, 
  Server,
  Zap,
  Check
} from 'lucide-react';

interface IntegrationsHubViewProps {
  integrations: IntegrationService[];
  onToggleIntegration: (id: string) => void;
}

export const IntegrationsHubView: React.FC<IntegrationsHubViewProps> = ({
  integrations,
  onToggleIntegration,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const categories = ['all', 'Load Boards', 'ELD Telematics', 'Accounting & Factoring', 'Compliance & Safety', 'EDI Gateway'];

  const filteredIntegrations = integrations.filter(int => {
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          int.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || int.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSyncNow = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
    }, 1200);
  };

  const getIntegrationIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return TrendingUp;
      case 'Truck': return Truck;
      case 'Radio': return Radio;
      case 'DollarSign': return DollarSign;
      case 'ReceiptText': return ReceiptText;
      case 'ShieldCheck': return ShieldCheck;
      case 'Server': return Server;
      default: return Layers;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-orange-600/20 text-orange-400 font-mono font-bold border border-orange-500/30 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>120+ NATIVE INTEGRATIONS</span>
            </span>
            <h1 className="text-base font-bold text-white tracking-tight">
              Alvys TMS Connected Ecosystem & EDI Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Seamlessly connect ELDs, load boards, factoring houses, accounting software, and EDI clearinghouses directly with your Foundry AI workflows.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        {/* Filter Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded font-medium cursor-pointer transition-colors capitalize ${
                  selectedCategory === cat ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Integrations (120+)' : cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search 120+ integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-orange-500 w-64"
            />
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredIntegrations.map((item) => {
            const Icon = getIntegrationIcon(item.iconName);
            const isSyncing = syncingId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                      item.connected ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' : 'text-slate-400 bg-slate-800 border-slate-700'
                    }`}>
                      {item.connected ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white">{item.name}</h3>
                  <span className="text-[10px] text-orange-400 font-mono block mb-1">{item.category}</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Sync: {item.lastSync}</span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSyncNow(item.id)}
                      disabled={isSyncing}
                      className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                      title="Sync Now"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => onToggleIntegration(item.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        item.connected ? 'bg-slate-800 text-slate-300 hover:bg-slate-750' : 'bg-orange-600 text-white hover:bg-orange-500'
                      }`}
                    >
                      {item.connected ? 'Configure' : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
