import React, { useState } from 'react';
import { 
  WindowsWatcherConfig, 
  ScannedDocument, 
  ProposedInvoice, 
  PaymentRemittance 
} from '../../types';
import { 
  Laptop, 
  FolderOpen, 
  FolderSync, 
  ShieldCheck, 
  HardDrive, 
  Clock, 
  FileText, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  FileCheck, 
  Cpu, 
  Play, 
  Settings, 
  ExternalLink,
  Minimize2,
  Square,
  X
} from 'lucide-react';
import { MIGRATION_MYINVOICE_SAMPLE } from '../../data/mockData';

interface WindowsDesktopAppViewProps {
  config: WindowsWatcherConfig;
  scannedDocs: ScannedDocument[];
  invoices: ProposedInvoice[];
  remittances: PaymentRemittance[];
  onUpdateConfig: (newConfig: WindowsWatcherConfig) => void;
  onTriggerScan: () => void;
  onNavigateToStep: (step: string) => void;
}

export const WindowsDesktopAppView: React.FC<WindowsDesktopAppViewProps> = ({
  config,
  scannedDocs,
  invoices,
  remittances,
  onUpdateConfig,
  onTriggerScan,
  onNavigateToStep,
}) => {
  const [activeWindowsTab, setActiveWindowsTab] = useState<'incoming' | 'remittances' | 'myinvoice' | 'logs'>('incoming');
  const [isScanningNow, setIsScanningNow] = useState(false);
  const [isMyInvoiceSyncing, setIsMyInvoiceSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleManualScan = () => {
    setIsScanningNow(true);
    setTimeout(() => {
      onTriggerScan();
      setIsScanningNow(false);
    }, 800);
  };

  const handleSyncMyInvoice = () => {
    setIsMyInvoiceSyncing(true);
    setTimeout(() => {
      setIsMyInvoiceSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 font-mono font-bold border border-blue-500/30 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" />
              <span>WINDOWS LOCAL COMPANION</span>
            </span>
            <h1 className="text-base font-bold text-white tracking-tight">
              Windows Hotfolder Daemon & MyInvoice Integration Bridge
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Runs locally on your Windows PC. Watches the <code className="font-mono text-slate-300 bg-slate-800 px-1 py-0.5 rounded">Incoming</code> and <code className="font-mono text-slate-300 bg-slate-800 px-1 py-0.5 rounded">Remittances</code> folders, performs 100% on-device OCR, and connects directly to your MyInvoice database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToStep('scanner')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <span>Go to Step 1 Scanner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Windows Window Simulator Frame */}
      <div className="flex-1 p-6 flex items-center justify-center overflow-y-auto bg-slate-950/80">
        <div className="max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[640px]">
          {/* Windows Title Bar */}
          <div className="h-9 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-orange-600 rounded-xs flex items-center justify-center text-[10px] font-black text-white">
                AF
              </span>
              <span className="font-semibold text-white">Alvys Foundry Windows Agent v2.4 (64-bit)</span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">
                SERVICE: RUNNING (PID 8812)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="text-slate-400 hover:text-white cursor-pointer"><Minimize2 className="w-3.5 h-3.5" /></button>
              <button className="text-slate-400 hover:text-white cursor-pointer"><Square className="w-3.5 h-3.5" /></button>
              <button className="text-slate-400 hover:text-red-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Windows Program Navigation Tabs */}
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveWindowsTab('incoming')}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeWindowsTab === 'incoming' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>1. Incoming Folder Watcher</span>
              </button>

              <button
                onClick={() => setActiveWindowsTab('remittances')}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeWindowsTab === 'remittances' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>5. Remittances Watcher</span>
              </button>

              <button
                onClick={() => setActiveWindowsTab('myinvoice')}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeWindowsTab === 'myinvoice' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>MyInvoice Bridge & Sync</span>
              </button>

              <button
                onClick={() => setActiveWindowsTab('logs')}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeWindowsTab === 'logs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Service Logs</span>
              </button>
            </div>

            <button
              onClick={handleManualScan}
              disabled={isScanningNow}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-blue-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <FolderSync className={`w-3.5 h-3.5 ${isScanningNow ? 'animate-spin' : ''}`} />
              <span>{isScanningNow ? 'Scanning...' : 'Rescan Hotfolders'}</span>
            </button>
          </div>

          {/* Windows Tab Viewport Body */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-950/60 space-y-4">
            {activeWindowsTab === 'incoming' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-blue-400" />
                      <span>Monitored Path: {config.incomingFolderPath}</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Polling every 3 seconds</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Drop paperwork PDFs or scanner feeds into this directory. The Windows daemon instantly parses BOLs, Rate Confirmations, and Lumper slips locally on-device.
                  </p>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                  <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 flex justify-between">
                    <span>Detected Files in Hotfolder ({scannedDocs.length})</span>
                    <span>Local OCR Engine: Active</span>
                  </div>
                  <div className="divide-y divide-slate-800/60 text-xs">
                    {scannedDocs.map(doc => (
                      <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-900/60">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="font-semibold text-white block">{doc.fileName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{doc.localPath}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {doc.type} · {doc.ocrConfidence}% OCR
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            ✓ Parsed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeWindowsTab === 'remittances' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <span>Remittance Folder: {config.remittancesFolderPath}</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-400">ACH & Check Stub Watcher</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Save scanned check stubs, wire notices, or ACH remittance PDFs here. The Windows agent cross-checks invoices and proposes allocations.
                  </p>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                  <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                    Remittance Queue ({remittances.length} Detected)
                  </div>
                  <div className="divide-y divide-slate-800/60 text-xs">
                    {remittances.map(remit => (
                      <div key={remit.id} className="p-3 flex items-center justify-between hover:bg-slate-900/60">
                        <div>
                          <span className="font-bold text-white block">{remit.remittanceDocName}</span>
                          <span className="text-[10px] text-slate-400">{remit.payerName} · Ref: {remit.checkOrReferenceNumber}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 text-xs block">
                            ${remit.totalPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {remit.status === 'reconciled' ? '✓ Reconciled' : 'Pending Confirmation'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeWindowsTab === 'myinvoice' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">Legacy MyInvoice Windows Software Connector</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                      STATUS: HOOKED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">MyInvoice Executable:</span>
                      <span className="font-mono text-slate-200">C:\Program Files (x86)\MyInvoice\MyInvoice.exe</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Data File (.myinv):</span>
                      <span className="font-mono text-slate-200">{config.myInvoiceDataPath}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    You can operate in dual-sync mode or run the 1-Click Migration to move all 142 historical customer invoices ($10,275 AR) entirely into Alvys Foundry.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handleSyncMyInvoice}
                      disabled={isMyInvoiceSyncing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                    >
                      <FolderSync className={`w-3.5 h-3.5 ${isMyInvoiceSyncing ? 'animate-spin' : ''}`} />
                      <span>{isMyInvoiceSyncing ? 'Synchronizing with MyInvoice...' : 'Execute Two-Way Database Sync'}</span>
                    </button>
                  </div>
                </div>

                {syncSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>MyInvoice database sync complete! All accounts and active balances are aligned.</span>
                  </div>
                )}
              </div>
            )}

            {activeWindowsTab === 'logs' && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-80 overflow-y-auto">
                <div className="text-slate-500">// Alvys Foundry Windows Daemon Realtime Event Stream</div>
                <div className="text-slate-400">[2026-09-30 14:15:02] Watcher initialized on C:\FreightOps\Incoming\Scans</div>
                <div className="text-emerald-400">[2026-09-30 14:15:04] Detected new scan: BOL_Scan_Load8842_Signed_Stamped.pdf (2.4 MB)</div>
                <div className="text-cyan-400">[2026-09-30 14:15:05] Local OCR Engine: extracted BOL-554109, consignee stamp verified (98% confidence)</div>
                <div className="text-slate-400">[2026-09-30 14:15:08] Auto-bound to Load #CHR-982301 (C.H. Robinson Worldwide)</div>
                <div className="text-emerald-400">[2026-09-30 14:16:10] Detected Lumper receipt: CapStone Dallas ($285.00)</div>
                <div className="text-blue-400">[2026-09-30 14:16:12] Generated proposed invoice INV-2026-089 for Step 2 Review</div>
                <div className="text-slate-400">[2026-09-30 16:20:00] MyInvoice bridge heartbeat OK · PID 8812 memory: 42MB</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
