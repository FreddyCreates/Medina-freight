import React, { useState } from 'react';
import { CompanyProfile } from '../../types';
import { saveCompanyProfileToPythonDB } from '../../services/pythonApiService';
import { 
  Building2, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Landmark, 
  DollarSign, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Code,
  Copy,
  Check,
  HardDrive,
  FileCode,
  Layers,
  Terminal,
  FileText
} from 'lucide-react';
import { 
  downloadDocsBaseSdkZip, 
  downloadJsSdkFile,
  downloadPythonSdkFile,
  DOCS_BASE_PYTHON_SDK_CODE, 
  DOCS_BASE_TYPESCRIPT_SDK_CODE,
  DOCS_BASE_README_MD 
} from '../../services/docsBaseSdkService';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSaveProfile: (profile: CompanyProfile) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'sdk'>('settings');
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCodeLang, setCopiedCodeLang] = useState<string | null>(null);
  const [isDownloadingSdk, setIsDownloadingSdk] = useState(false);
  const [selectedSdkLang, setSelectedSdkLang] = useState<'python' | 'typescript' | 'readme'>('python');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    await saveCompanyProfileToPythonDB(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleDownloadSdk = async () => {
    setIsDownloadingSdk(true);
    try {
      await downloadDocsBaseSdkZip();
    } catch (err) {
      console.error('Failed to download SDK zip:', err);
    } finally {
      setIsDownloadingSdk(false);
    }
  };

  const handleCopyCode = (text: string, lang: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeLang(lang);
    setTimeout(() => setCopiedCodeLang(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden text-left">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#F5F5F7]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-950">
                Admin Settings & Docs & Base SDK
              </h2>
              <p className="text-xs text-gray-500">
                Operating authorities, company profile, and downloadable Docs & Base Core SDK.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 bg-white text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Carrier Authority & Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('sdk')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sdk'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Docs & Base Core SDK (Download & Export)</span>
          </button>
        </div>

        {/* TAB 1: COMPANY PROFILE SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Company profile updated! Invoices, quotes, and workorders will reflect these details.</span>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-150">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Operating Authorities & Legal Entity</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 font-bold block mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-gray-600 font-bold block mb-1">USDOT Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.dotNumber}
                    onChange={(e) => setFormData({ ...formData, dotNumber: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-600 font-bold block mb-1">MC / FF Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.mcNumber}
                    onChange={(e) => setFormData({ ...formData, mcNumber: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-bold block mb-1">Dispatch Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-bold block mb-1">Billing AP Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-600 font-bold block mb-1">Operating Terminal Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-bold block mb-1">City, State & Zip</label>
                  <input
                    type="text"
                    value={`${formData.city}, ${formData.state} ${formData.zip}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(',');
                      setFormData({ ...formData, city: parts[0]?.trim() || formData.city });
                    }}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-gray-600 font-bold block mb-1">Default Rate Floor ($/mi)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.defaultRatePerMileFloor}
                    onChange={(e) => setFormData({ ...formData, defaultRatePerMileFloor: Number(e.target.value) })}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-bold block mb-1">Factoring Remittance Notice</label>
                  <input
                    type="text"
                    value={formData.factoringCompanyName || 'TriumphPay (Notice of Assignment Attached)'}
                    onChange={(e) => setFormData({ ...formData, factoringCompanyName: e.target.value })}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl p-2.5 text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Authority Profile</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DOCS & BASE STANDALONE SDK (DOWNLOAD & EXPORT) */}
        {activeTab === 'sdk' && (
          <div className="p-6 space-y-5 text-xs">
            {/* Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-purple-700 uppercase font-extrabold tracking-wider block">
                  Standalone Document Processing & Invoicing API SDK
                </span>
                <h3 className="text-sm font-black text-purple-950 mt-0.5">
                  FreightSync JS & Python SDK Engine
                </h3>
                <p className="text-xs text-purple-800 mt-0.5 max-w-lg leading-relaxed">
                  Download the complete JavaScript/TypeScript or Python SDK to integrate document parsing, OCR, rate estimates, fuel surcharges, and invoicing API into other platforms.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadJsSdkFile()}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0"
                  title="Download JavaScript / TypeScript SDK"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JS SDK (.js)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadPythonSdkFile()}
                  className="px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0"
                  title="Download Python SDK"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Python (.py)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSdk}
                  disabled={isDownloadingSdk}
                  className="px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloadingSdk ? 'Packaging...' : 'SDK Bundle (.zip)'}</span>
                </button>
              </div>
            </div>

            {/* Universal Multi-Format Support Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-bold text-purple-900 block">📄 PDF Documents</span>
                <span className="text-purple-700 text-[10px]">Invoices, RateCons, BOLs</span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900 block">🖼️ Image Scans & OCR</span>
                <span className="text-blue-700 text-[10px]">PNG, JPG, WEBP driver receipts</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block">📊 CSV & Spreadsheets</span>
                <span className="text-emerald-700 text-[10px]">Excel rate sheets & dispatch logs</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 block">⚡ Raw JSON & EDI</span>
                <span className="text-amber-700 text-[10px]">REST API payloads & EDI 204/210</span>
              </div>
            </div>

            {/* Language Selector & Copy Code */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-gray-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSdkLang('typescript')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      selectedSdkLang === 'typescript' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                    }`}
                  >
                    JavaScript / TS SDK (freight-document-sdk.js)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSdkLang('python')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      selectedSdkLang === 'python' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                    }`}
                  >
                    Python SDK (alvys_docbase_sdk.py)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSdkLang('readme')}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      selectedSdkLang === 'readme' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                    }`}
                  >
                    Documentation (README.md)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const code = selectedSdkLang === 'python' 
                      ? DOCS_BASE_PYTHON_SDK_CODE 
                      : selectedSdkLang === 'typescript' 
                      ? DOCS_BASE_TYPESCRIPT_SDK_CODE 
                      : DOCS_BASE_README_MD;
                    handleCopyCode(code, selectedSdkLang);
                  }}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedCodeLang === selectedSdkLang ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-600" />
                      <span>Copy Full Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Display Area */}
              <div className="relative rounded-xl border border-gray-300 bg-gray-950 p-4 font-mono text-[11px] text-gray-200 overflow-x-auto max-h-[300px] leading-relaxed">
                <pre>
                  {selectedSdkLang === 'python' && DOCS_BASE_PYTHON_SDK_CODE}
                  {selectedSdkLang === 'typescript' && DOCS_BASE_TYPESCRIPT_SDK_CODE}
                  {selectedSdkLang === 'readme' && DOCS_BASE_README_MD}
                </pre>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs text-gray-600">
              <span className="font-semibold">
                📦 Includes: Standalone Client, AutoIngestionAgent, MemoryVault, UniversalFileParser, and package.json
              </span>
              <span className="font-mono text-gray-400">Zero external runtime dependencies</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
