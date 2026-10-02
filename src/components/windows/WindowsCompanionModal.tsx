import React, { useState } from 'react';
import { WindowsWatcherConfig } from '../../types';
import { 
  Laptop, 
  FolderSync, 
  ShieldCheck, 
  Clock, 
  Database, 
  CheckCircle2, 
  HardDrive, 
  X,
  Sliders,
  FolderOpen
} from 'lucide-react';

interface WindowsCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WindowsWatcherConfig;
  onUpdateConfig: (newConfig: WindowsWatcherConfig) => void;
  onTriggerManualScan: () => void;
}

export const WindowsCompanionModal: React.FC<WindowsCompanionModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onTriggerManualScan,
}) => {
  const [incomingPath, setIncomingPath] = useState(config.incomingFolderPath);
  const [remittancesPath, setRemittancesPath] = useState(config.remittancesFolderPath);
  const [pollInterval, setPollInterval] = useState(config.pollIntervalSeconds);
  const [autoWatch, setAutoWatch] = useState(config.autoWatchEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...config,
      incomingFolderPath: incomingPath,
      remittancesFolderPath: remittancesPath,
      pollIntervalSeconds: pollInterval,
      autoWatchEnabled: autoWatch,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Windows Hotfolder Watcher & Companion Agent
              </h3>
              <p className="text-[11px] text-slate-400">
                Daemon monitors local folders and coordinates MyInvoice legacy synchronization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Service Status */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Daemon Status</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Running (3s Poll)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Security Mode</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              100% Local OCR
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Legacy MyInvoice</span>
            <span className="text-cyan-400 font-mono text-[11px] font-semibold mt-0.5">
              Hook Attached
            </span>
          </div>
        </div>

        {/* Form Config */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Step 1: Scanned Paperwork "Incoming" Folder Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={incomingPath}
                onChange={(e) => setIncomingPath(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setIncomingPath('C:\\FreightOps\\Incoming\\Scans')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs cursor-pointer"
                title="Reset to default"
              >
                Default
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Step 5: Payment Remittances & Check Stubs Folder Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={remittancesPath}
                onChange={(e) => setRemittancesPath(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setRemittancesPath('C:\\FreightOps\\Incoming\\Remittances')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs cursor-pointer"
                title="Reset to default"
              >
                Default
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Folder Scan Frequency (Seconds)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Auto-Watcher Daemon</span>
                <span className="text-[10px] text-slate-400">Background file trigger</span>
              </div>
              <input
                type="checkbox"
                checked={autoWatch}
                onChange={(e) => setAutoWatch(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded cursor-pointer"
              />
            </div>
          </div>

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-lg text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Windows folder watcher configuration saved successfully.</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onTriggerManualScan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-blue-400 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Force Rescan Now</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
