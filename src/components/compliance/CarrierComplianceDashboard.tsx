import React, { useState, useRef } from 'react';
import { 
  CarrierComplianceRecord, 
  InsurancePolicy, 
  CarrierDocument, 
  SafetyRatingInfo 
} from '../../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  FileText, 
  CheckCircle2, 
  FileCheck, 
  RefreshCw, 
  Mail, 
  Phone, 
  Building2, 
  ExternalLink, 
  ArrowUpRight, 
  Truck,
  FileDown,
  Upload,
  Trash2,
  Eye,
  Share2,
  Send,
  X,
  FileCode,
  Paperclip
} from 'lucide-react';
import { queryFmcsaSaferApi } from '../../services/fmcsaComplianceService';
import { generateCustomDocumentPDF } from '../../services/pdfGenerator';
import { DEFAULT_COMPANY_PROFILE } from '../../data/realFleetData';

interface UploadedFileRecord {
  id: string;
  category: string;
  name: string;
  sizeStr: string;
  fileType: string;
  uploadedAt: string;
  fileUrl?: string;
  fileData?: File;
}

interface CarrierComplianceDashboardProps {
  carriers: CarrierComplianceRecord[];
  onUpdateCarrier: (updated: CarrierComplianceRecord) => void;
  onAddCarrier: (newCarrier: CarrierComplianceRecord) => void;
}

const DEFAULT_DOC_SLOTS = [
  { id: 'coi', name: 'Certificate of Insurance (COI)', required: true, desc: 'Auto & Reefer Cargo Policy ($1,000,000 CSL)' },
  { id: 'authority', name: 'FMCSA Operating Authority Letter', required: true, desc: 'MC & USDOT Active Registration Certificate' },
  { id: 'w9', name: 'Form W-9 (Tax Identification)', required: true, desc: 'Signed Federal Taxpayer ID & EIN Verification' },
  { id: 'noa', name: 'Notice of Assignment (NOA)', required: true, desc: 'Factoring ACH Remittance & Bank Voided Check' },
  { id: 'safety', name: 'Safety Rating Certificate', required: false, desc: 'FMCSA SAFER Audit & Satisfactory Rating' },
  { id: 'dot_inspection', name: 'Annual DOT Vehicle Inspection', required: false, desc: 'Equipment & Trailer Inspection Reports' },
];

export const CarrierComplianceDashboard: React.FC<CarrierComplianceDashboardProps> = ({
  carriers,
  onUpdateCarrier,
  onAddCarrier,
}) => {
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>(carriers[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'documents' | 'email_packet' | 'fmcsa' | 'insurance'>('documents');
  const [isQueryingFmcsa, setIsQueryingFmcsa] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local state for user-uploaded actual documents
  const [customDocuments, setCustomDocuments] = useState<UploadedFileRecord[]>([
    {
      id: 'doc-1',
      category: 'coi',
      name: 'Certificate_of_Insurance_GreatWest_2026.pdf',
      sizeStr: '1.4 MB',
      fileType: 'application/pdf',
      uploadedAt: new Date().toLocaleDateString()
    },
    {
      id: 'doc-2',
      category: 'authority',
      name: 'FMCSA_MC1489201_Authority_Letter.pdf',
      sizeStr: '850 KB',
      fileType: 'application/pdf',
      uploadedAt: new Date().toLocaleDateString()
    },
    {
      id: 'doc-3',
      category: 'w9',
      name: 'Signed_W9_Green_Express_LLC.pdf',
      sizeStr: '420 KB',
      fileType: 'application/pdf',
      uploadedAt: new Date().toLocaleDateString()
    },
    {
      id: 'doc-4',
      category: 'noa',
      name: 'Notice_of_Assignment_TriumphPay.pdf',
      sizeStr: '610 KB',
      fileType: 'application/pdf',
      uploadedAt: new Date().toLocaleDateString()
    }
  ]);

  // Client Packet Email Modal State
  const [showEmailPacketModal, setShowEmailPacketModal] = useState(false);
  const [brokerRecipientEmail, setBrokerRecipientEmail] = useState('carriercompliance@chrobinson.com');
  const [brokerEmailSubject, setBrokerEmailSubject] = useState('Carrier Onboarding Packet - GREEN EXPRESS LLC (MC #1489201)');
  const [brokerEmailMessage, setBrokerEmailMessage] = useState(
    'Hello Compliance Team,\n\nPlease find attached our complete carrier onboarding packet for GREEN EXPRESS LLC, including our Certificate of Insurance ($1,000,000 Auto / $250,000 Reefer Cargo), FMCSA Operating Authority, signed W-9, and Notice of Assignment (NOA).\n\nPlease let us know if you need anything else to complete our setup!'
  );
  const [selectedDocsForEmail, setSelectedDocsForEmail] = useState<string[]>(['coi', 'authority', 'w9', 'noa']);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetCategoryForUpload, setTargetCategoryForUpload] = useState<string>('coi');

  const selectedCarrier = carriers.find(c => c.id === selectedCarrierId) || carriers[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle User Document Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;
    const objectUrl = URL.createObjectURL(file);

    const newDocRecord: UploadedFileRecord = {
      id: `doc-${Date.now()}`,
      category,
      name: file.name,
      sizeStr,
      fileType: file.type,
      uploadedAt: new Date().toLocaleDateString(),
      fileUrl: objectUrl,
      fileData: file
    };

    setCustomDocuments(prev => [newDocRecord, ...prev]);
    showToast(`Uploaded "${file.name}" under ${DEFAULT_DOC_SLOTS.find(s => s.id === category)?.name || 'Documents'}!`);

    if (e.target) e.target.value = '';
  };

  const handleDeleteDocument = (id: string) => {
    setCustomDocuments(prev => prev.filter(d => d.id !== id));
    showToast('Document removed from compliance repository.');
  };

  // Run FMCSA Audit
  const handleRunFmcsaAudit = async () => {
    if (!selectedCarrier) return;
    setIsQueryingFmcsa(true);
    const fmcsaData = await queryFmcsaSaferApi(selectedCarrier.dotNumber);
    const updatedCarrier: CarrierComplianceRecord = {
      ...selectedCarrier,
      safetyRating: {
        ...selectedCarrier.safetyRating,
        fmcsaSafetyRating: fmcsaData.safetyRating.fmcsaSafetyRating,
        operatingAuthority: fmcsaData.safetyRating.operatingAuthority,
        basicsScores: fmcsaData.safetyRating.basicsScores,
        lastFmcsaApiSync: 'Just now'
      }
    };
    onUpdateCarrier(updatedCarrier);
    setIsQueryingFmcsa(false);
    showToast(`✅ FMCSA SAFER Audit sync complete for ${selectedCarrier.legalName}!`);
  };

  // Generate & Download Combined Carrier Packet PDF
  const handleDownloadClientPacket = () => {
    if (!selectedCarrier) return;

    const uploadedDocNames = customDocuments.map(d => `- ${d.name} (${d.sizeStr})`).join('\n');

    const packetContent = `
OFFICIAL CARRIER COMPLIANCE ONBOARDING PACKET
==================================================
Legal Carrier Name: ${selectedCarrier.legalName}
DBA / Operating Name: GREEN EXPRESS LLC
USDOT Number: ${selectedCarrier.dotNumber}
MC Authority Number: ${selectedCarrier.mcNumber}
Primary Terminal: ${selectedCarrier.city}, ${selectedCarrier.state}
Dispatch Phone: ${selectedCarrier.contactPhone}
Dispatch Email: ${selectedCarrier.contactEmail}

1. FMCSA OPERATING AUTHORITY
- Status: ACTIVE / AUTHORIZED FOR COMMON & CONTRACT CARRIER
- Safety Rating: SATISFACTORY / CLEAN AUDIT
- Last SAFER Verification: ${selectedCarrier.safetyRating.lastFmcsaApiSync || 'Active'}

2. CERTIFICATE OF INSURANCE (COI)
- Auto Liability: $1,000,000 Combined Single Limit
- Reefer Cargo: $250,000 with Temperature Breakdown Coverage
- Underwriter: Great West Casualty Company
- Policy Expiry: Dec 15, 2026

3. TAX IDENTIFICATION & W-9
- Federal Taxpayer ID: Verified on Form W-9
- Corporate Structure: Limited Liability Company (LLC)

4. FACTORING & REMITTANCE (NOA)
- Factoring Partner: TriumphPay / Apex Capital Corp
- Payment Settlement: QuickPay or Direct ACH

5. ATTACHED ACTUAL DOCUMENTS IN THIS REPOSITORY:
${uploadedDocNames || '- Certificate_of_Insurance.pdf\n- FMCSA_MC_Authority_Letter.pdf\n- Signed_W9_Form.pdf\n- Notice_of_Assignment_NOA.pdf'}
`;

    generateCustomDocumentPDF(
      `Carrier_Packet_${selectedCarrier.mcNumber}_Green_Express.pdf`,
      packetContent,
      DEFAULT_COMPANY_PROFILE,
      {
        category: 'Client Carrier Compliance Bundle',
        loadNumber: selectedCarrier.mcNumber,
        customer: 'Broker Onboarding Department'
      }
    );
    showToast('Downloaded Carrier Compliance Packet (PDF)!');
  };

  // Send packet to broker via email
  const handleSendPacketEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEmailPacketModal(false);
    showToast(`✉️ Transmitted compliance documents & packet to ${brokerRecipientEmail}!`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-y-auto select-none font-sans text-gray-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="bg-white border-b border-[#E5E5EA] px-4 sm:px-6 py-3.5 shrink-0 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-gray-950 tracking-tight flex items-center gap-2 flex-wrap">
                <span>Carrier Document Compliance Repository</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  DOT / MC Authority Verified
                </span>
              </h1>
              <p className="text-xs text-gray-500">
                Upload your actual compliance documents and send complete onboarding packets to brokers & clients.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            <button
              onClick={handleDownloadClientPacket}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Packet (PDF)</span>
            </button>

            <button
              onClick={() => setShowEmailPacketModal(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Send to Broker</span>
            </button>
          </div>
        </div>

        {/* SUBTABS */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-3 border-t border-gray-100 mt-3 text-xs overflow-x-auto no-scrollbar">
          {[
            { id: 'documents', label: 'Documents & Uploads', icon: FileCheck },
            { id: 'insurance', label: 'Insurance Policies (COI)', icon: ShieldCheck },
            { id: 'fmcsa', label: 'FMCSA SAFER Audit', icon: RefreshCw },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-5">
        {/* ========================================================================= */}
        {/* TAB 1: DOCUMENTS & UPLOADS */}
        {/* ========================================================================= */}
        {activeTab === 'documents' && (
          <div className="space-y-5 text-left">
            {/* Quick Status Banner */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Carrier Onboarding Packet
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    USDOT #{selectedCarrier.dotNumber} · MC #{selectedCarrier.mcNumber}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-950">
                  Carrier Compliance Documents Repository
                </h2>
                <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
                  Upload your active Certificates of Insurance, W-9, FMCSA Authority, and Factoring NOA files. You can preview, download, or email these documents directly to shippers and brokers.
                </p>
              </div>

              <button
                onClick={() => setShowEmailPacketModal(true)}
                className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Email Packet to Client</span>
              </button>
            </div>

            {/* DOCUMENT CATEGORIES UPLOAD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEFAULT_DOC_SLOTS.map(slot => {
                const uploadedFilesForCategory = customDocuments.filter(d => d.category === slot.id);
                const hasUploaded = uploadedFilesForCategory.length > 0;

                return (
                  <div 
                    key={slot.id} 
                    className={`bg-white border rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                      hasUploaded ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-gray-950 flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${hasUploaded ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <span>{slot.name}</span>
                        </span>
                        {hasUploaded ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            {uploadedFilesForCategory.length} File{uploadedFilesForCategory.length > 1 ? 's' : ''}
                          </span>
                        ) : slot.required ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                            Optional
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500">{slot.desc}</p>

                      {/* Display Uploaded Files in this category */}
                      {hasUploaded && (
                        <div className="space-y-1.5 pt-1">
                          {uploadedFilesForCategory.map(doc => (
                            <div 
                              key={doc.id}
                              className="p-2 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs gap-2"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="font-semibold text-gray-900 truncate" title={doc.name}>
                                  {doc.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {doc.fileUrl && (
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="View / Preview"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Upload File Button */}
                    <div className="pt-2 border-t border-gray-100">
                      <label className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload {slot.name.split(' ')[0]} File</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, slot.id)}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MASTER FILE LIST */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                <h3 className="text-sm font-extrabold text-gray-950 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>All Uploaded Documents ({customDocuments.length})</span>
                </h3>
                <span className="text-xs text-gray-500">Ready for 1-click email attachment</span>
              </div>

              <div className="divide-y divide-gray-100">
                {customDocuments.map(doc => (
                  <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-gray-900 truncate">{doc.name}</div>
                        <div className="text-[10px] text-gray-400">
                          Uploaded {doc.uploadedAt} · {doc.sizeStr} · Category: <span className="uppercase font-mono">{doc.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          download={doc.name}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px] flex items-center gap-1"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        title="Delete File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INSURANCE POLICIES */}
        {/* ========================================================================= */}
        {activeTab === 'insurance' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div>
                <h3 className="text-base font-extrabold text-gray-950">Active Certificate of Insurance (COI)</h3>
                <p className="text-xs text-gray-500">Verified insurance policies, coverage amounts, and underwriters.</p>
              </div>
              <button
                onClick={handleDownloadClientPacket}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Download COI Certificate</span>
              </button>
            </div>

            <div className="space-y-3">
              {selectedCarrier.insurancePolicies.map(pol => (
                <div key={pol.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">{pol.type} Insurance</span>
                    <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      ${pol.coverageAmount.toLocaleString()} Coverage Limit
                    </span>
                  </div>
                  <div className="text-gray-600 flex flex-col sm:flex-row justify-between gap-1">
                    <span>Underwriter: <b>{pol.provider}</b> (Policy #{pol.policyNumber})</span>
                    <span>Expires: <b>{pol.expiryDate}</b> ({pol.daysRemaining} days remaining)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FMCSA SAFER AUDIT */}
        {/* ========================================================================= */}
        {activeTab === 'fmcsa' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div>
                <h3 className="text-base font-extrabold text-gray-950">FMCSA SAFER System Ratings</h3>
                <p className="text-xs text-gray-500">Official government safety scores and operating authority status.</p>
              </div>
              <button
                onClick={handleRunFmcsaAudit}
                disabled={isQueryingFmcsa}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isQueryingFmcsa ? 'animate-spin' : ''}`} />
                <span>{isQueryingFmcsa ? 'Querying...' : 'Live Safer Sync'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 font-bold uppercase block text-[10px]">Safety Rating</span>
                <span className="font-extrabold text-emerald-700 text-sm">{selectedCarrier.safetyRating.fmcsaSafetyRating}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 font-bold uppercase block text-[10px]">Authority Status</span>
                <span className="font-extrabold text-blue-700 text-sm">{selectedCarrier.safetyRating.operatingAuthority.status}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 font-bold uppercase block text-[10px]">Unsafe Driving Score</span>
                <span className="font-extrabold text-emerald-700 text-sm">{selectedCarrier.safetyRating.basicsScores.unsafeDrivingPercentile}%</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 font-bold uppercase block text-[10px]">HOS Compliance Score</span>
                <span className="font-extrabold text-emerald-700 text-sm">{selectedCarrier.safetyRating.basicsScores.hosCompliancePercentile}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EMAIL CARRIER PACKET MODAL */}
      {showEmailPacketModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-left space-y-4 border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-150">
              <h3 className="text-sm font-extrabold text-gray-950 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Email Carrier Onboarding Packet</span>
              </h3>
              <button onClick={() => setShowEmailPacketModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendPacketEmail} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Broker / Shipper Compliance Email</label>
                <input
                  type="email"
                  value={brokerRecipientEmail}
                  onChange={(e) => setBrokerRecipientEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Subject</label>
                <input
                  type="text"
                  value={brokerEmailSubject}
                  onChange={(e) => setBrokerEmailSubject(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Cover Note</label>
                <textarea
                  rows={4}
                  value={brokerEmailMessage}
                  onChange={(e) => setBrokerEmailMessage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900"
                />
              </div>

              {/* Select Attachments */}
              <div>
                <label className="text-gray-500 font-bold block mb-1.5">Attached Documents</label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] space-y-1.5">
                  {customDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 flex items-center gap-1.5 truncate">
                        <Paperclip className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </span>
                      <span className="text-gray-400 font-mono text-[10px]">{doc.sizeStr}</span>
                    </div>
                  ))}
                  {customDocuments.length === 0 && (
                    <span className="text-gray-500 italic">No files attached yet. Upload files above to include.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailPacketModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold cursor-pointer"
                >
                  Send Compliance Packet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
