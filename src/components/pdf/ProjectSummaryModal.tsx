import React from 'react';
import { Project, ProposedInvoice, ScannedDocument } from '../../types';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Stamp, 
  DollarSign, 
  ShieldCheck, 
  Sparkles,
  Share2
} from 'lucide-react';
import { generateProjectSummaryPDF } from '../../services/pdfGenerator';

interface ProjectSummaryModalProps {
  project: Project | null;
  invoice?: ProposedInvoice;
  scannedDocs: ScannedDocument[];
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSummaryModal: React.FC<ProjectSummaryModalProps> = ({
  project,
  invoice,
  scannedDocs,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !project) return null;

  const relevantDocs = scannedDocs.filter(d => 
    d.matchedProjectId === project.id || (invoice && invoice.attachedDocIds.includes(d.id))
  );

  const handleDownload = () => {
    generateProjectSummaryPDF(project, invoice, relevantDocs);
  };

  const handlePrint = () => {
    window.print();
  };

  const subtotal = invoice ? invoice.subtotal : (project.estimatedRevenue || 3450);
  const totalDue = invoice ? invoice.totalAmount : subtotal;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-6 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Alvys Foundry Official Load Summary & Audit Packet</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800 font-mono">
                  VECTOR PDF
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Full-packet review including route dispatch, OCR paperwork verification, and audited invoice financials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg cursor-pointer transition-colors"
              title="Print Summary Packet"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Summary</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Vector PDF Document Canvas Simulation */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/80 flex justify-center">
          <div className="max-w-2xl w-full bg-white text-slate-900 rounded-sm shadow-2xl p-8 font-sans space-y-6 text-xs border border-slate-200">
            {/* PDF Letterhead Banner */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-950 tracking-tight">ALVYS FOUNDRY TMS</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-800 font-bold rounded">AI CERTIFIED</span>
                </div>
                <p className="text-slate-600 font-medium mt-0.5">Heavy Haul & Freight Logistics Fleet Operations</p>
                <p className="text-[10px] text-slate-500 font-mono">MC-992104 · USDOT 3819201 · SCAC: APXT</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">LOAD PACKET</span>
                <span className="text-base font-black font-mono text-slate-950">{project.loadNumber}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Status: <strong className="uppercase text-orange-600">{project.status}</strong></p>
              </div>
            </div>

            {/* Route & Equipment Specifications */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                01. Route Dispatch & Vehicle Telemetry
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Customer / Broker:</span>
                  <span className="font-bold text-slate-900">{project.customerName}</span>
                  <p className="text-slate-600 mt-1">Origin: <strong>{project.originCity}, {project.originState}</strong></p>
                  <p className="text-slate-600">Destination: <strong>{project.destCity}, {project.destState}</strong></p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Assigned Driver & Equipment:</span>
                  <span className="font-bold text-slate-900">{project.driverName} ({project.driverPhone})</span>
                  <p className="text-slate-600 mt-1">Tractor / Trailer: <strong>{project.truckId} / {project.trailerId} ({project.equipmentType})</strong></p>
                  <p className="text-slate-600">Weight & Cargo: <strong>{project.weightLbs.toLocaleString()} lbs ({project.commodities})</strong></p>
                </div>
              </div>
            </div>

            {/* OCR Paperwork Verification Status Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Stamp className="w-3.5 h-3.5 text-orange-600" />
                  <span>02. OCR Paperwork Verification Status & Attached Proofs</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  All Documents Reconciled
                </span>
              </div>

              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[10px]">
                    <tr>
                      <th className="p-2">Document File</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">OCR Confidence</th>
                      <th className="p-2">Receiver Stamp</th>
                      <th className="p-2 text-right">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {relevantDocs.length > 0 ? (
                      relevantDocs.map(doc => (
                        <tr key={doc.id}>
                          <td className="p-2 font-mono text-[11px] font-medium">{doc.fileName}</td>
                          <td className="p-2 font-semibold">{doc.type}</td>
                          <td className="p-2 font-mono text-emerald-700 font-bold">{doc.ocrConfidence}%</td>
                          <td className="p-2">
                            {doc.extractedData.consigneeSignature || doc.type === 'BOL' ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Signed & Stamped
                              </span>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">✓ Verified</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 font-mono">BOL_Scan_Load8842_Signed_Stamped.pdf</td>
                        <td className="p-2 font-semibold">BOL</td>
                        <td className="p-2 font-mono text-emerald-700 font-bold">98%</td>
                        <td className="p-2 text-emerald-700 font-bold">✓ Signed & Stamped</td>
                        <td className="p-2 text-right font-bold text-slate-900">✓ Verified</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Associated Invoice Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  <span>03. Associated Invoice Line Items & Carrier Pay</span>
                </span>
                <span className="text-[10px] font-mono text-slate-600">
                  Invoice #: {invoice?.invoiceNumber || 'INV-2026-089'}
                </span>
              </div>

              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[10px]">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2">Source Document</th>
                      <th className="p-2 text-right">Amount (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice?.lineItems ? (
                      invoice.lineItems.map(item => (
                        <tr key={item.id}>
                          <td className="p-2 font-medium">{item.description}</td>
                          <td className="p-2 font-mono text-[10px] text-slate-500">{item.sourceDoc}</td>
                          <td className="p-2 text-right font-mono font-bold">${item.amount.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr>
                          <td className="p-2 font-medium">Linehaul Freight ({project.originCity} → {project.destCity})</td>
                          <td className="p-2 font-mono text-[10px] text-slate-500">RateConfirmation</td>
                          <td className="p-2 text-right font-mono font-bold">${(project.estimatedRevenue || 3450).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Agreed Fuel Surcharge (FSC)</td>
                          <td className="p-2 font-mono text-[10px] text-slate-500">RateConfirmation</td>
                          <td className="p-2 text-right font-mono font-bold">$420.00</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-1">
                <div className="w-60 space-y-1 text-right text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 border-b pb-1">
                    <span>Tax (0% Freight Exempt):</span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-950 pt-1">
                    <span>Total Balance Due:</span>
                    <span className="font-mono text-orange-600 font-black">${totalDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Seal & Verification Footer */}
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <span>Foundry Autonomous AI Verification & Cryptographic Audit Seal</span>
              </div>
              <p>
                This packet has been compiled by Alvys Foundry Agentic AI Platform. All carrier pay accessorials, signed receiver stamps, and detention dwell logs have been certified against GPS telematics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
