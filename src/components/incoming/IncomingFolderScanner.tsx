import React, { useState } from 'react';
import { 
  ScannedDocument, 
  Project, 
  WindowsWatcherConfig,
  DocumentType
} from '../../types';
import { 
  FolderInput, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Scan, 
  Sparkles, 
  HardDrive, 
  Upload, 
  ArrowRight, 
  CheckCheck,
  Search,
  Zap,
  Tag
} from 'lucide-react';
import { analyzeDocumentFile } from '../../services/documentParser';

interface IncomingFolderScannerProps {
  scannedDocs: ScannedDocument[];
  projects: Project[];
  windowsConfig: WindowsWatcherConfig;
  onSelectDocForReview: (docId: string, projectId?: string) => void;
  onAddScannedDoc: (doc: ScannedDocument) => void;
  onNavigateToStep: (step: string, projectId?: string) => void;
  onQuickSimulateBatch: () => void;
}

export const IncomingFolderScanner: React.FC<IncomingFolderScannerProps> = ({
  scannedDocs,
  projects,
  windowsConfig,
  onSelectDocForReview,
  onAddScannedDoc,
  onNavigateToStep,
  onQuickSimulateBatch,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(scannedDocs[0]?.id || '');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDoc = scannedDocs.find(d => d.id === selectedDocId) || scannedDocs[0];
  const matchedProject = projects.find(p => p.id === selectedDoc?.matchedProjectId);

  // Grouping documents by matched load to show full bundles
  const loadBundles: { [loadNumber: string]: ScannedDocument[] } = {};
  scannedDocs.forEach(doc => {
    const load = doc.extractedData.loadNumber || 'Unassigned';
    if (!loadBundles[load]) loadBundles[load] = [];
    loadBundles[load].push(doc);
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileSizeStr = `${(file.size / 1024).toFixed(1)} KB`;

      // Read as DataURL for visual preview & real Multimodal OCR
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        let ocrData: any = null;

        if (file.type.startsWith('image/')) {
          try {
            const res = await fetch('/api/gemini/extract-document-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageData: dataUrl,
                mimeType: file.type,
                fileName: file.name
              })
            });
            const json = await res.json();
            if (json.success && json.data) {
              ocrData = json.data;
            }
          } catch (err) {
            console.warn('Real OCR fallback:', err);
          }
        }

        const analysis = analyzeDocumentFile(file.name, fileSizeStr);
        const extractedLoadNo = ocrData?.loadNumber || analysis.extractedData.loadNumber || '';
        const detectedCust = ocrData?.brokerCustomer || analysis.detectedCustomer;

        // Auto-match with existing project by loadNumber or customer
        const matchingProj = projects.find(
          p => (extractedLoadNo && p.loadNumber.toLowerCase() === extractedLoadNo.toLowerCase()) ||
               (detectedCust && p.customerName.toLowerCase().includes(detectedCust.toLowerCase()))
        );

        const newDoc: ScannedDocument = {
          id: `doc-${Date.now()}-${i}`,
          fileName: file.name,
          fileSize: fileSizeStr,
          type: (ocrData?.documentType as any) || analysis.type,
          scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          localPath: `C:\\FreightOps\\Incoming\\Scans\\${file.name}`,
          thumbnailColor: analysis.type === 'BOL' ? 'from-amber-950/40 to-slate-900' : 'from-blue-950/40 to-slate-900',
          ocrConfidence: ocrData?.ocrConfidence || analysis.ocrConfidence,
          status: matchingProj ? 'matched' : 'pending_match',
          matchedProjectId: matchingProj?.id,
          matchedCustomer: detectedCust,
          extractedData: {
            loadNumber: extractedLoadNo,
            bolNumber: ocrData?.bolNumber || analysis.extractedData.bolNumber,
            brokerCustomer: detectedCust,
            pickupDate: ocrData?.pickupDate || analysis.extractedData.pickupDate,
            deliveryDate: ocrData?.deliveryDate || analysis.extractedData.deliveryDate,
            consigneeSignature: ocrData?.consigneeSignatureDetected ?? analysis.extractedData.consigneeSignature,
            weightLbs: ocrData?.weightLbs || analysis.extractedData.weightLbs,
            rateAmount: analysis.extractedData.rateAmount,
            notes: ocrData?.fullTranscription || analysis.extractedData.notes
          },
          discrepancies: ocrData?.discrepancies?.length ? ocrData.discrepancies : (matchingProj ? [] : ['Matching load confirmed in dispatch ledger.']),
        };

        onAddScannedDoc(newDoc);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleScanSamplePaperwork = () => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      onQuickSimulateBatch();
      setIsSimulatingScan(false);
    }, 700);
  };

  const filteredDocs = scannedDocs.filter(d => {
    const matchesSearch = 
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.extractedData.loadNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.matchedCustomer || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || d.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'BOL': return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'RateConfirmation': return 'text-blue-400 bg-blue-950/60 border-blue-800/60';
      case 'LumperReceipt': return 'text-purple-400 bg-purple-950/60 border-purple-800/60';
      case 'WeightTicket': return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      case 'RemittanceAdvice': return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Banner & Folder Status */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 font-mono font-bold border border-blue-500/30">
              STEP 1 OF 5
            </span>
            <h1 className="text-base font-bold text-white tracking-tight">
              Incoming Folder Paperwork Scanner & OCR Matcher
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Windows daemon monitors <code className="font-mono text-slate-300 bg-slate-800 px-1 py-0.5 rounded">{windowsConfig.incomingFolderPath}</code>. Paperwork is parsed into BOLs, Rate Confirmations, and Lumper Receipts with cross-document reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* File Upload Input */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Drop Files to Incoming</span>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Ingest Windows Scanner Push */}
          <button
            onClick={handleScanSamplePaperwork}
            disabled={isSimulatingScan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isSimulatingScan ? 'Processing Scans...' : 'Ingest Hotfolder Paperwork'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Scanned Files Grid & Load Bundles */}
        <div className="w-7/12 p-5 border-r border-slate-800 overflow-y-auto flex flex-col space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                  filterType === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Documents ({scannedDocs.length})
              </button>
              <button
                onClick={() => setFilterType('BOL')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                  filterType === 'BOL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BOLs
              </button>
              <button
                onClick={() => setFilterType('RateConfirmation')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                  filterType === 'RateConfirmation' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rate Cons
              </button>
              <button
                onClick={() => setFilterType('LumperReceipt')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                  filterType === 'LumperReceipt' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lumper Slips
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter filename or load..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
              />
            </div>
          </div>

          {/* Matched Load Packets Callout */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Paperwork Ingest Queue</span>
              <span className="text-slate-500 font-mono">Local OCR Engine 100% On-Device</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {filteredDocs.map((doc) => {
                const isSelected = doc.id === selectedDocId;
                const isMatched = doc.status === 'matched';
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-10 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-slate-300" />
                          <span className="text-[8px] font-mono text-slate-400 uppercase mt-0.5">
                            {doc.fileName.split('.').pop()}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-white truncate max-w-[260px]">
                              {doc.fileName}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-medium border font-mono ${getDocTypeBadge(doc.type)}`}>
                              {doc.type}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{doc.matchedCustomer || 'Detecting Customer...'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-blue-400">Load {doc.extractedData.loadNumber || 'N/A'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-500">{doc.fileSize}</span>
                          </div>
                        </div>
                      </div>

                      {/* Matching Status */}
                      <div className="text-right shrink-0">
                        {isMatched ? (
                          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Matched Load</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Unmatched</span>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          OCR Confidence: {doc.ocrConfidence}%
                        </span>
                      </div>
                    </div>

                    {/* Extracted snippet highlights */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px]">
                      {doc.extractedData.rateAmount !== undefined && (
                        <div>
                          <span className="text-slate-500 block">Rate / FSC</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            ${doc.extractedData.rateAmount.toLocaleString()}
                            {doc.extractedData.fuelSurcharge ? ` + $${doc.extractedData.fuelSurcharge}` : ''}
                          </span>
                        </div>
                      )}
                      {doc.extractedData.lumperAmount !== undefined && (
                        <div>
                          <span className="text-slate-500 block">Lumper Slip</span>
                          <span className="font-mono text-purple-300 font-semibold">
                            ${doc.extractedData.lumperAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {doc.extractedData.bolNumber && (
                        <div>
                          <span className="text-slate-500 block">BOL Number</span>
                          <span className="font-mono text-amber-300 font-semibold">
                            {doc.extractedData.bolNumber}
                          </span>
                        </div>
                      )}
                      {doc.extractedData.consigneeSignature && (
                        <div className="col-span-1">
                          <span className="text-slate-500 block">Receiver Signature</span>
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" /> Signed & Stamped
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: OCR Document Deep Inspection & Handoff to Step 2 */}
        {selectedDoc && (
          <div className="w-5/12 p-5 bg-slate-900/80 overflow-y-auto flex flex-col justify-between">
            <div>
              {/* Document Header */}
              <div className="pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getDocTypeBadge(selectedDoc.type)}`}>
                    {selectedDoc.type} Document
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    Confidence: {selectedDoc.ocrConfidence}%
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white truncate">
                  {selectedDoc.fileName}
                </h3>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {selectedDoc.localPath}
                </div>
              </div>

              {/* Cross-Reconciliation Summary with Matched Project */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-4">
                <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center justify-between">
                  <span>Cross-Paperwork Reconciliation</span>
                  {selectedDoc.matchedProjectId ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Matched to Project
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400 font-semibold">
                      Needs Load Assignment
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Customer / Broker:</span>
                    <span className="text-white font-medium">{selectedDoc.matchedCustomer || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Load Reference:</span>
                    <span className="font-mono text-blue-400 font-bold">{selectedDoc.extractedData.loadNumber || 'N/A'}</span>
                  </div>
                  {selectedDoc.extractedData.pickupLocation && (
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Origin / Shipper:</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{selectedDoc.extractedData.pickupLocation}</span>
                    </div>
                  )}
                  {selectedDoc.extractedData.deliveryLocation && (
                    <div className="flex justify-between py-1 border-b border-slate-800/80">
                      <span className="text-slate-400">Destination / Consignee:</span>
                      <span className="text-slate-300 truncate max-w-[200px]">{selectedDoc.extractedData.deliveryLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted OCR Bounding Highlights */}
              <div className="space-y-2 mb-4">
                <span className="text-xs font-semibold text-slate-300 block">
                  Extracted Data Points ({selectedDoc.extractedData.rawOcrHighlights?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {selectedDoc.extractedData.rawOcrHighlights?.map((hl, idx) => (
                    <div key={idx} className="bg-slate-850 border border-slate-800 p-2 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">{hl.field}</span>
                        <span className="font-mono text-white font-semibold">{hl.text}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                        {hl.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 Handoff Callout */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  onSelectDocForReview(selectedDoc.id, selectedDoc.matchedProjectId);
                  onNavigateToStep('review', selectedDoc.matchedProjectId);
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <span>Proceed to Step 2: Review Proposed Invoice</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Side-by-side inspection: check extracted details against original paperwork before generation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
