import React, { useState, useEffect } from 'react';
import { Project, ProposedInvoice } from '../../types';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Radio, 
  Thermometer, 
  Fuel, 
  Clock, 
  AlertTriangle, 
  Send, 
  FileDown, 
  Share2, 
  CheckCircle2, 
  Search,
  ExternalLink,
  ShieldAlert,
  Settings,
  Zap,
  Key,
  Database
} from 'lucide-react';
import { generateProjectSummaryPDF } from '../../services/pdfGenerator';
import { 
  subscribeToELDLiveStream, 
  getELDStatus, 
  saveELDConfig, 
  LiveVehicleTelemetry,
  ELDConfig
} from '../../services/eldStreamService';

interface LiveDispatchMapViewProps {
  projects: Project[];
  invoices: ProposedInvoice[];
  onOpenPDFSummaryModal: (project: Project) => void;
  onTriggerCheckCall: (project: Project) => void;
}

export const LiveDispatchMapView: React.FC<LiveDispatchMapViewProps> = ({
  projects,
  invoices,
  onOpenPDFSummaryModal,
  onTriggerCheckCall,
}) => {
  const [selectedLoadId, setSelectedLoadId] = useState<string>(projects[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkCallSuccess, setCheckCallSuccess] = useState(false);

  // Live Telemetry Stream State
  const [liveTelemetryMap, setLiveTelemetryMap] = useState<Record<string, LiveVehicleTelemetry>>({});
  const [showEldModal, setShowEldModal] = useState(false);
  const [eldConfig, setEldConfig] = useState<ELDConfig>({
    provider: 'samsara',
    apiKey: '',
    refreshIntervalSec: 2,
    status: 'active'
  });
  const [saveEldSuccess, setSaveEldSuccess] = useState(false);

  // Load initial ELD config
  useEffect(() => {
    getELDStatus().then(res => {
      if (res && res.config) setEldConfig(res.config);
    });
  }, []);

  // Subscribe to Live Server-Sent Events (SSE) ELD Stream
  useEffect(() => {
    const unsubscribe = subscribeToELDLiveStream((telemetry) => {
      setLiveTelemetryMap(prev => ({
        ...prev,
        [telemetry.truckId]: telemetry
      }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const selectedProject = projects.find(p => p.id === selectedLoadId) || projects[0];
  const associatedInvoice = invoices.find(i => i.id === selectedProject?.associatedInvoiceId);

  // Merge live streaming ELD telemetry over static project state
  const currentTelemetry = (selectedProject && liveTelemetryMap[selectedProject.truckId])
    ? {
        ...selectedProject.telemetry,
        lat: liveTelemetryMap[selectedProject.truckId].lat,
        lng: liveTelemetryMap[selectedProject.truckId].lng,
        speedMph: liveTelemetryMap[selectedProject.truckId].speedMph,
        reeferTempF: liveTelemetryMap[selectedProject.truckId].reeferTempF,
        fuelLevelPct: liveTelemetryMap[selectedProject.truckId].fuelLevelPct,
        dwellMinutes: liveTelemetryMap[selectedProject.truckId].dwellMinutes || selectedProject.telemetry.dwellMinutes,
        geofenceState: liveTelemetryMap[selectedProject.truckId].geofenceState || selectedProject.telemetry.geofenceState
      }
    : selectedProject?.telemetry;

  const handleSendCheckCall = () => {
    if (!selectedProject) return;
    onTriggerCheckCall(selectedProject);
    setCheckCallSuccess(true);
    setTimeout(() => setCheckCallSuccess(false), 2500);
  };

  const handleDirectDownloadPDF = () => {
    if (!selectedProject) return;
    generateProjectSummaryPDF(selectedProject, associatedInvoice);
  };

  const handleSaveEldSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveELDConfig(eldConfig);
    setSaveEldSuccess(true);
    setTimeout(() => {
      setSaveEldSuccess(false);
      setShowEldModal(false);
    }, 1200);
  };

  const filteredProjects = projects.filter(p => 
    p.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.driverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 font-mono font-bold border border-blue-500/30 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>LIVE GPS TELEMATICS</span>
            </span>
            <h1 className="text-base font-bold text-white tracking-tight">
              Fleet Telemetry, Geofencing & Automated Detention Monitor
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Samsara & Motive ELD data stream. Monitored by Foundry AI Detention Sentinel with automated check-calls and public tracking links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEldModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
            title="Configure Samsara, Geotab, or Motive ELD API Integration"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>ELD Provider Settings</span>
          </button>

          <button
            onClick={handleDirectDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5 text-orange-400" />
            <span>Download Load Packet PDF</span>
          </button>

          <button
            onClick={() => onOpenPDFSummaryModal(selectedProject)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
          >
            <span>Preview & Generate Summary</span>
          </button>
        </div>
      </div>

      {/* Main Map & Telemetry Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Active Loads List */}
        <div className="w-4/12 border-r border-slate-800 p-5 overflow-y-auto space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search load, driver, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2.5">
            {filteredProjects.map((p) => {
              const isSelected = p.id === selectedLoadId;
              const hasDetention = p.telemetry.dwellMinutes > 120;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedLoadId(p.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white font-mono">{p.loadNumber}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border font-mono ${
                      hasDetention ? 'text-amber-400 bg-amber-950/60 border-amber-800' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    }`}>
                      {p.telemetry.geofenceState.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 truncate mb-1">
                    {p.customerName}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{p.originCity} → {p.destCity}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3 h-3 text-slate-500" />
                      <span>{p.driverName.split(' ')[0]} ({p.truckId})</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold tabular-nums">
                      {p.telemetry.speedMph} MPH
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Map Simulation Canvas & Telemetry Gauges */}
        {selectedProject && (
          <div className="w-8/12 p-6 flex flex-col justify-between overflow-y-auto bg-slate-900/30 space-y-4">
            {/* Simulated Interactive Vector Map Canvas */}
            <div className="w-full h-80 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner">
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-30"></div>

              {/* Highway Route Arc */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path
                  d="M 120 220 Q 340 80 580 180"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="6,6"
                  className="animate-pulse"
                />
                <circle cx="120" cy="220" r="6" fill="#f97316" />
                <circle cx="580" cy="180" r="6" fill="#10b981" />
              </svg>

              {/* Truck Active Position Marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white animate-bounce">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-bold text-white shadow-md">
                  {selectedProject.truckId} · {currentTelemetry?.speedMph} MPH
                </div>
              </div>

              {/* Overlay Top Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <div className="px-3 py-1 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white font-mono flex items-center gap-2">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>GPS Lat: {currentTelemetry?.lat.toFixed(4)}° N, Lng: {currentTelemetry?.lng.toFixed(4)}° W</span>
                </div>
              </div>

              <div className="absolute bottom-3 right-3 flex gap-2">
                <a
                  href={selectedProject.trackingUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-blue-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Customer Live Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* IoT Telemetry Gauges Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 shrink-0">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Reefer Setpoint</span>
                  <span className="text-sm font-mono font-bold text-white tabular-nums">
                    {currentTelemetry?.reeferTempF}°F
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Fuel Level</span>
                  <span className="text-sm font-mono font-bold text-white tabular-nums">
                    {currentTelemetry?.fuelLevelPct}% Full
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Facility Dwell</span>
                  <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                    {currentTelemetry?.dwellMinutes} Mins
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Current Geofence</span>
                  <span className="text-xs font-semibold text-slate-200 truncate block max-w-[110px]">
                    {currentTelemetry?.geofenceState}
                  </span>
                </div>
              </div>
            </div>

            {/* Detention Sentinel Over-Threshold Card */}
            {selectedProject.telemetry.dwellMinutes > 120 && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-700/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Foundry Detention Alert: 2-Hour Threshold Exceeded
                    </span>
                    <span className="text-[11px] text-amber-200">
                      Truck has dwelt {selectedProject.telemetry.dwellMinutes} mins at facility. Detention calculated: $112.50 (1.5 hrs @ $75/hr).
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSendCheckCall}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors whitespace-nowrap"
                >
                  File Detention Claim
                </button>
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {checkCallSuccess ? (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Automated check-call dispatched to broker AP desk!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  Driver: <strong className="text-white">{selectedProject.driverName}</strong> · Phone: <strong className="text-white">{selectedProject.driverPhone}</strong>
                </span>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSendCheckCall}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3 h-3" />
                  <span>Trigger Check-Call Email</span>
                </button>

                <button
                  onClick={() => onOpenPDFSummaryModal(selectedProject)}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileDown className="w-3 h-3" />
                  <span>Generate PDF Summary</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Commercial ELD Provider Settings Modal */}
      {showEldModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Commercial ELD Integration Settings</h3>
              </div>
              <button
                onClick={() => setShowEldModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEldSettings} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Active Commercial ELD Provider</label>
                <select
                  value={eldConfig.provider}
                  onChange={(e) => setEldConfig({ ...eldConfig, provider: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="samsara">Samsara API v2 (Production REST)</option>
                  <option value="geotab">Geotab Cloud API (MyGeotab SDK)</option>
                  <option value="motive">Motive ELD (KeepTruckin API)</option>
                  <option value="python_physics">High-Frequency Python Vector Kinematics Stream</option>
                </select>
              </div>

              {eldConfig.provider === 'samsara' && (
                <div>
                  <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                    <span>Samsara API Token *</span>
                    <span className="text-[10px] text-blue-400 font-mono">samsara_api_...</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Samsara API Token"
                    value={eldConfig.apiKey}
                    onChange={(e) => setEldConfig({ ...eldConfig, apiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Fetches live truck GPS, reefer temperature sensors, and ELD HOS logs directly from Samsara Cloud.</p>
                </div>
              )}

              {eldConfig.provider === 'geotab' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Geotab Database Name</label>
                    <input
                      type="text"
                      placeholder="e.g. mycompany_fleet"
                      value={eldConfig.geotabDatabase || ''}
                      onChange={(e) => setEldConfig({ ...eldConfig, geotabDatabase: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Geotab User Email / Service Account</label>
                    <input
                      type="text"
                      placeholder="api.user@company.com"
                      value={eldConfig.geotabUser || ''}
                      onChange={(e) => setEldConfig({ ...eldConfig, geotabUser: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Live Stream Polling Frequency</label>
                <select
                  value={eldConfig.refreshIntervalSec}
                  onChange={(e) => setEldConfig({ ...eldConfig, refreshIntervalSec: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer focus:outline-none"
                >
                  <option value={1}>High-Frequency (1 Second)</option>
                  <option value={2}>Standard Telemetry Stream (2 Seconds)</option>
                  <option value={5}>Balanced Polling (5 Seconds)</option>
                  <option value={10}>Eco Polling (10 Seconds)</option>
                </select>
              </div>

              {saveEldSuccess ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Integration settings saved! Live SSE telematics stream re-connected.</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEldModal(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Save ELD Integration
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
