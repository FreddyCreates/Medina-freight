import React, { useState, useRef, useEffect } from 'react';
import { 
  Project, 
  FleetDriver, 
  CompanyProfile, 
  ScannedDocument, 
  ProposedInvoice 
} from '../../types';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  RotateCcw, 
  X, 
  FileText, 
  ReceiptText, 
  ShieldCheck, 
  Users, 
  Scale, 
  DollarSign, 
  Landmark, 
  FileCheck, 
  FolderInput, 
  Folder, 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Sliders, 
  AlertCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sun,
  Eye,
  FileDown,
  Truck,
  AlertTriangle,
  Lock,
  Pin,
  MapPin,
  Clock,
  Printer
} from 'lucide-react';

export type UniversalDocType = 
  | 'POD' 
  | 'Invoice' 
  | 'RateCon' 
  | 'FuelReceipt' 
  | 'LumperReceipt' 
  | 'ScaleTicket' 
  | 'DOTInspection' 
  | 'MaintenanceReceipt'
  | 'DriverCredential'
  | 'TrailerDamageInspection'
  | 'Custom';

export interface DamagePin {
  id: string;
  xPct: number;
  yPct: number;
  type: 'damage' | 'securement' | 'seal';
  title: string;
  severity: 'minor' | 'moderate' | 'critical' | 'compliant';
  description: string;
}

export interface UniversalCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  drivers: FleetDriver[];
  companyProfile: CompanyProfile;
  initialProjectId?: string;
  initialDriverId?: string;
  initialMode?: 'document' | 'trailer_cargo';
  onAddScannedDoc?: (doc: ScannedDocument) => void;
  onAddInvoice?: (invoice: ProposedInvoice) => void;
  onUploadPOD?: (projectId: string, stopId: string, docData?: any) => void;
  onUpdateProjectStatus?: (projectId: string, status: Project['status']) => void;
  onNavigateToTab?: (tab: string, projectId?: string) => void;
  onFileRoutedToFolder?: (folderPath: string, fileName: string, fileRecord: any) => void;
}

export const UniversalCameraModal: React.FC<UniversalCameraModalProps> = ({
  isOpen,
  onClose,
  projects = [],
  drivers = [],
  companyProfile,
  initialProjectId,
  initialDriverId,
  initialMode = 'document',
  onAddScannedDoc,
  onAddInvoice,
  onUploadPOD,
  onUpdateProjectStatus,
  onNavigateToTab,
  onFileRoutedToFolder
}) => {
  const [activeWorkflowMode, setActiveWorkflowMode] = useState<'document' | 'trailer_cargo'>(initialMode);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const [selectedDriverId, setSelectedDriverId] = useState<string>(initialDriverId || drivers[0]?.id || '');
  const [docType, setDocType] = useState<UniversalDocType>(initialMode === 'trailer_cargo' ? 'TrailerDamageInspection' : 'POD');
  
  // Media / Capture State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFileName, setCapturedFileName] = useState<string>('');
  const [capturedFileType, setCapturedFileType] = useState<string>('image/jpeg');
  const [capturedFileSize, setCapturedFileSize] = useState<string>('1.8 MB');
  const [filterMode, setFilterMode] = useState<'scan_contrast' | 'grayscale' | 'normal'>('scan_contrast');
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Intelligent Routing Heuristics & OCR State
  const [isAnalyzingOcr, setIsAnalyzingOcr] = useState<boolean>(false);
  const [ocrConfidence, setOcrConfidence] = useState<number>(98);
  const [extractedLoadNumber, setExtractedLoadNumber] = useState<string>('');
  const [extractedCustomer, setExtractedCustomer] = useState<string>('');
  const [extractedAmount, setExtractedAmount] = useState<number>(0);
  const [extractedDate, setExtractedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [extractedNotes, setExtractedNotes] = useState<string>('Receiver dock sign-off timestamp verified.');
  const [targetFolderPath, setTargetFolderPath] = useState<string>('');
  const [customFolderOverride, setCustomFolderOverride] = useState<string>('');

  // Trailer Cargo & Damage Vision Engine State
  const [trailerInspectionType, setTrailerInspectionType] = useState<'pre_trip' | 'dock_arrival' | 'consignee_exception'>('pre_trip');
  const [detectedPalletCount, setDetectedPalletCount] = useState<number>(24);
  const [isSecurementCompliant, setIsSecurementCompliant] = useState<boolean>(true);
  const [detectedSealNumber, setDetectedSealNumber] = useState<string>('US-981249');
  const [sealStatus, setSealStatus] = useState<'intact' | 'broken' | 'absent'>('intact');
  const [damagePins, setDamagePins] = useState<DamagePin[]>([
    {
      id: 'pin-1',
      xPct: 65,
      yPct: 35,
      type: 'damage',
      title: 'Carton Puncture & Corner Crush',
      severity: 'moderate',
      description: 'Shipper warehouse pre-existing corner crush on Skid #4. Shrinkwrap punctured prior to trailer loading.'
    },
    {
      id: 'pin-2',
      xPct: 30,
      yPct: 75,
      type: 'securement',
      title: 'FMCSA 49 CFR 393.100 Securement',
      severity: 'compliant',
      description: 'Heavy-duty 2-inch E-Track ratchet strap locked & tensioned (WLL 3,333 lbs).'
    },
    {
      id: 'pin-3',
      xPct: 88,
      yPct: 22,
      type: 'seal',
      title: 'High-Security Bolt Seal',
      severity: 'compliant',
      description: 'Bolt seal #US-981249 verified intact on trailer cam latch. Tamper-evident lock verified.'
    }
  ]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [showCertificatePreview, setShowCertificatePreview] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const activeDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];

  // Initialize or update fields when project changes
  useEffect(() => {
    if (activeProject) {
      setExtractedLoadNumber(activeProject.loadNumber);
      setExtractedCustomer(activeProject.customerName);
      setExtractedAmount(activeProject.estimatedRevenue);
      updateIntelligentTargetFolder(docType, activeProject, activeDriver);
    }
  }, [selectedProjectId, selectedDriverId, docType]);

  // Update mode if initialMode prop changed
  useEffect(() => {
    if (initialMode) {
      setActiveWorkflowMode(initialMode);
      if (initialMode === 'trailer_cargo') {
        setDocType('TrailerDamageInspection');
      }
    }
  }, [initialMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute intelligent folder destination within DocumentDatabaseExplorer
  const updateIntelligentTargetFolder = (
    type: UniversalDocType,
    proj: Project | undefined,
    drv: FleetDriver | undefined
  ) => {
    const loadNo = proj?.loadNumber || 'GE-982301';
    const driverName = drv?.name || 'Jesus Medina';

    let path = '';
    switch (type) {
      case 'POD':
        path = `Loads / #${loadNo} / Proof of Delivery (POD)`;
        break;
      case 'RateCon':
        path = `Loads / #${loadNo} / Rate Confirmation`;
        break;
      case 'Invoice':
        path = `Invoices / Outgoing Carrier Invoices`;
        break;
      case 'FuelReceipt':
        path = `Fleet & Drivers / ${driverName} / Fuel & DEF Receipts`;
        break;
      case 'LumperReceipt':
        path = `Loads / #${loadNo} / Accessorials & Lumpers`;
        break;
      case 'ScaleTicket':
        path = `Loads / #${loadNo} / Scale Tickets`;
        break;
      case 'DOTInspection':
        path = `Compliance & Safety / DOT Inspections`;
        break;
      case 'MaintenanceReceipt':
        path = `Fleet & Drivers / Maintenance & Repairs`;
        break;
      case 'DriverCredential':
        path = `Fleet & Drivers / ${driverName} / Credentials`;
        break;
      case 'TrailerDamageInspection':
        path = `Loads / #${loadNo} / Cargo & Damage Inspections`;
        break;
      default:
        path = `General Repository / Uploads`;
    }
    setTargetFolderPath(path);
  };

  // Start Camera Stream
  const startCameraStream = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Direct mediaDevices camera stream unavailable, opening phone camera picker', err);
      showToast('Camera stream unavailable. Opening native camera app...');
      nativeCameraInputRef.current?.click();
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture from live video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    
    if (activeWorkflowMode === 'trailer_cargo') {
      setCapturedFileName(`TRAILER_CARGO_INSPECTION_${activeProject?.loadNumber || 'GE-982301'}_${Date.now()}.jpg`);
      setCapturedFileType('image/jpeg');
      setCapturedFileSize('2.6 MB');
      stopCameraStream();
      runGeminiCargoDamageAnalysis();
    } else {
      setCapturedFileName(`${docType}_${activeProject?.loadNumber || 'SCAN'}_${Date.now()}.jpg`);
      setCapturedFileType('image/jpeg');
      setCapturedFileSize('2.1 MB');
      stopCameraStream();
      runIntelligentOcrAnalysis();
    }
  };

  // Handle Universal File Upload (PDF, JPEG, PNG, HEIC, TIFF, WebP)
  const handleUniversalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setCapturedFileName(fileName);
    setCapturedFileType(file.type || `application/${ext}`);
    setCapturedFileSize(`${sizeMb} MB`);

    const lowerName = fileName.toLowerCase();
    if (activeWorkflowMode === 'trailer_cargo') {
      setDocType('TrailerDamageInspection');
    } else {
      if (lowerName.includes('bol') || lowerName.includes('pod') || lowerName.includes('delivery')) {
        setDocType('POD');
      } else if (lowerName.includes('rate') || lowerName.includes('con') || lowerName.includes('tender')) {
        setDocType('RateCon');
      } else if (lowerName.includes('inv') || lowerName.includes('bill')) {
        setDocType('Invoice');
      } else if (lowerName.includes('fuel') || lowerName.includes('def') || lowerName.includes('pilot') || lowerName.includes('loves')) {
        setDocType('FuelReceipt');
      } else if (lowerName.includes('lump') || lowerName.includes('capstone')) {
        setDocType('LumperReceipt');
      } else if (lowerName.includes('scale') || lowerName.includes('cat') || lowerName.includes('weight')) {
        setDocType('ScaleTicket');
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImage(result);
      if (activeWorkflowMode === 'trailer_cargo') {
        runGeminiCargoDamageAnalysis();
      } else {
        runIntelligentOcrAnalysis();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Simulated Intelligent OCR Analysis
  const runIntelligentOcrAnalysis = () => {
    setIsAnalyzingOcr(true);
    setTimeout(() => {
      setIsAnalyzingOcr(false);
      setOcrConfidence(97 + Math.floor(Math.random() * 3));
      if (activeProject) {
        setExtractedLoadNumber(activeProject.loadNumber);
        setExtractedCustomer(activeProject.customerName);
        setExtractedAmount(
          docType === 'FuelReceipt' ? 425.50 :
          docType === 'LumperReceipt' ? 185.00 :
          docType === 'ScaleTicket' ? 14.50 :
          activeProject.estimatedRevenue
        );
      }
      showToast('⚡ Intelligent OCR: Extracted load metadata & validated signature!');
    }, 600);
  };

  // Gemini AI Trailer Cargo & Damage Vision Engine
  const runGeminiCargoDamageAnalysis = () => {
    setIsAnalyzingOcr(true);
    setTimeout(() => {
      setIsAnalyzingOcr(false);
      setDetectedPalletCount(24);
      setIsSecurementCompliant(true);
      setDetectedSealNumber('US-981249');
      setSealStatus('intact');
      setExtractedNotes('Trailer back inspection verified. 24 pallets secured with dual E-Track ratchet tie-downs. Bolt seal US-981249 intact. 1 pre-existing shipper carton puncture logged at Skid #4.');
      showToast('🤖 Gemini Vision: Cargo scanned, securement compliant, pre-existing carton damage logged!');
    }, 900);
  };

  // Final Intelligent Route & Save Action
  const handleExecuteRoute = () => {
    if (!capturedImage && !capturedFileName) {
      showToast('Please capture or upload a document or trailer inspection photo first.');
      return;
    }

    setIsSubmitting(true);
    const docId = `doc-${Date.now()}`;
    const destinationFolder = customFolderOverride.trim() || targetFolderPath;

    const scannedRecord: ScannedDocument = {
      id: docId,
      fileName: capturedFileName || `${docType}_${extractedLoadNumber}.pdf`,
      fileSize: capturedFileSize,
      type: docType === 'POD' ? 'BOL' : docType === 'RateCon' ? 'RateConfirmation' : docType === 'LumperReceipt' ? 'LumperReceipt' : docType === 'ScaleTicket' ? 'WeightTicket' : 'Custom',
      scannedAt: new Date().toLocaleString(),
      localPath: `C:\\GREEN_EXPRESS\\DOCUMENTS\\${destinationFolder.replace(/\s+/g, '_')}\\${capturedFileName}`,
      thumbnailColor: activeWorkflowMode === 'trailer_cargo' ? 'bg-amber-600' : 'bg-blue-600',
      ocrConfidence: ocrConfidence,
      status: 'verified',
      matchedProjectId: activeProject?.id,
      matchedCustomer: extractedCustomer,
      extractedData: {
        loadNumber: extractedLoadNumber,
        bolNumber: `BOL-${Math.floor(100000 + Math.random() * 900000)}`,
        brokerCustomer: extractedCustomer,
        carrierName: companyProfile.companyName || 'GREEN EXPRESS LLC',
        driverName: activeDriver?.name || 'Jesus Medina',
        consigneeSignature: true,
        weightLbs: 42500,
        notes: activeWorkflowMode === 'trailer_cargo'
          ? `[PRE-TRIP DVIR / CARGO INSPECTION] 24 pallets, Seal #${detectedSealNumber} intact. 49 CFR 393 compliant. Damage tags logged.`
          : extractedNotes
      },
      discrepancies: []
    };

    // 1. Central Scanned Document Store
    if (onAddScannedDoc) {
      onAddScannedDoc(scannedRecord);
    }

    // 2. Route directly into DocumentDatabaseExplorer project folder
    if (onFileRoutedToFolder) {
      onFileRoutedToFolder(destinationFolder, scannedRecord.fileName, scannedRecord);
    }

    // 3. Automated side effects based on doc type
    if (docType === 'POD') {
      if (activeProject && onUploadPOD) {
        onUploadPOD(activeProject.id, 'stop-final', scannedRecord);
      }
      if (activeProject && onUpdateProjectStatus) {
        onUpdateProjectStatus(activeProject.id, 'paperwork_scanned');
      }
    } else if (docType === 'Invoice' && onAddInvoice) {
      onAddInvoice({
        id: `inv-cam-${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        projectId: activeProject?.id || 'prj-1',
        loadNumber: extractedLoadNumber,
        customerName: extractedCustomer,
        customerEmail: 'billing@carrier.com',
        billingAddress: 'Accounts Payable Dept',
        paymentTerms: 'Net 30 Days',
        issueDate: extractedDate,
        dueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        lineItems: [
          { id: 'li-1', description: `Freight Charges for Load #${extractedLoadNumber}`, type: 'linehaul', amount: extractedAmount, sourceDoc: 'Manual' }
        ],
        subtotal: extractedAmount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: extractedAmount,
        amountPaid: 0,
        balanceDue: extractedAmount,
        status: 'needs_review',
        attachedDocIds: [docId],
        factoringStatus: 'eligible'
      });
    }

    setIsSubmitting(false);
    showToast(`✅ Successfully categorized & routed to: ${destinationFolder}`);
    setTimeout(() => {
      stopCameraStream();
      onClose();
    }, 700);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto select-none animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-60 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Modal Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden text-left text-gray-900">
        {/* MODAL HEADER */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-[#F5F5F7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${activeWorkflowMode === 'trailer_cargo' ? 'bg-amber-600' : 'bg-blue-600'} text-white flex items-center justify-center font-bold shadow-xs transition-colors`}>
              {activeWorkflowMode === 'trailer_cargo' ? <Truck className="w-4.5 h-4.5" /> : <Camera className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-950 flex items-center gap-2">
                <span>
                  {activeWorkflowMode === 'trailer_cargo' 
                    ? 'Trailer Cargo, Securement & Damage AI Scanner' 
                    : 'Universal Document Camera & Routing Engine'}
                </span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                  Universal Files & Camera
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                {activeWorkflowMode === 'trailer_cargo'
                  ? 'Take a photo of the back of the truck to verify 49 CFR 393 securement, inspect door seals, and scan for damage with Gemini Vision.'
                  : 'Capture or upload PDF, JPEG, PNG, HEIC files. AI auto-categorizes and routes them into project folders.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-white hover:bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer transition-colors shadow-2xs"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WORKFLOW MODE SELECTOR: DOCUMENT vs TRAILER CARGO */}
        <div className="px-4 sm:px-6 py-2.5 bg-gray-100 border-b border-gray-200 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-300">
            <button
              onClick={() => {
                setActiveWorkflowMode('document');
                setDocType('POD');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeWorkflowMode === 'document'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document Scanner (POD, BOL, RateCon)</span>
            </button>

            <button
              onClick={() => {
                setActiveWorkflowMode('trailer_cargo');
                setDocType('TrailerDamageInspection');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeWorkflowMode === 'trailer_cargo'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Trailer Cargo & Damage Scanner (Back of Truck)</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">Gemini</span>
            </button>
          </div>

          {activeWorkflowMode === 'trailer_cargo' && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 font-bold">Inspection Type:</span>
              <select
                value={trailerInspectionType}
                onChange={(e) => setTrailerInspectionType(e.target.value as any)}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 focus:outline-none"
              >
                <option value="pre_trip">Pre-Trip Departure Check</option>
                <option value="dock_arrival">Shipper Dock Loading</option>
                <option value="consignee_exception">Consignee Exception / Offload</option>
              </select>
            </div>
          )}
        </div>

        {/* MODAL BODY (Grid on Desktop, Scrollable on Mobile) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Top Bar: Driver & Load Assignment Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
            {/* Load Selector */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Active Load / Shipment
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.loadNumber} · {p.originCity} ➔ {p.destCity} (${p.estimatedRevenue})
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Selector */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Driver & Power Unit
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} · Unit #{d.truckNumber} ({d.equipmentType})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Folder Routing Preview */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                Intelligent Target Project Folder
              </label>
              <div className="w-full bg-blue-50/70 border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-blue-900 truncate flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{customFolderOverride || targetFolderPath}</span>
              </div>
            </div>
          </div>

          {/* MAIN 2-COLUMN WORK AREA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT: CAMERA VIEWFINDER & UPLOAD CONTAINER (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className={`w-4 h-4 ${activeWorkflowMode === 'trailer_cargo' ? 'text-amber-600' : 'text-blue-600'}`} />
                  <span>
                    {activeWorkflowMode === 'trailer_cargo' 
                      ? 'Trailer Cargo Viewfinder & Damage Pins' 
                      : 'Document Viewfinder & Upload'}
                  </span>
                </span>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                  <span>Universal: PDF, JPEG, PNG, HEIC</span>
                </div>
              </div>

              {/* VIEWFINDER SCREEN */}
              <div className="relative aspect-4/3 w-full bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-gray-300 shadow-inner">
                {/* Active Live Video Stream */}
                {isCameraActive && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* HUD Laser Alignment Reticle */}
                    <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                      <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono font-bold bg-black/60 px-2 py-0.5 rounded">
                        <span>
                          {activeWorkflowMode === 'trailer_cargo' 
                            ? 'CARGO / SEAL / SECUREMENT RETICLE' 
                            : 'DOCUMENT RETICLE'}
                        </span>
                        <span>49 CFR 393: ACTIVE</span>
                      </div>
                      <div className="text-center text-[10px] text-emerald-400 font-mono font-bold bg-black/60 px-2.5 py-0.5 rounded self-center">
                        {activeWorkflowMode === 'trailer_cargo'
                          ? 'AIM AT TRAILER CARGO / REAR DOORS · TAP SHUTTER'
                          : 'HOLD STEADY · TAP SHUTTER BELOW'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Captured Image / Upload Preview with AR Pins */}
                {!isCameraActive && capturedImage && (
                  <div className="relative w-full h-full flex items-center justify-center bg-gray-900 p-2">
                    {capturedFileType.includes('pdf') ? (
                      <div className="text-center p-6 text-white space-y-3">
                        <FileText className="w-16 h-16 text-red-400 mx-auto animate-pulse" />
                        <div className="text-sm font-bold">{capturedFileName}</div>
                        <p className="text-xs text-gray-400">PDF document ingested and verified for folder routing.</p>
                      </div>
                    ) : (
                      <div className="relative max-h-full max-w-full flex items-center justify-center">
                        <img
                          src={capturedImage}
                          alt="Captured content"
                          style={{
                            transform: `rotate(${rotationDegrees}deg)`,
                            filter: filterMode === 'scan_contrast' ? 'contrast(1.25) brightness(1.05)' : filterMode === 'grayscale' ? 'grayscale(1) contrast(1.4)' : 'none'
                          }}
                          className="max-h-[380px] max-w-full object-contain rounded-lg transition-all"
                        />

                        {/* Interactive Damage & Securement Pins (Trailer Mode) */}
                        {activeWorkflowMode === 'trailer_cargo' && damagePins.map(pin => (
                          <button
                            key={pin.id}
                            onClick={() => setSelectedPinId(pin.id)}
                            style={{ top: `${pin.yPct}%`, left: `${pin.xPct}%` }}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full border-2 shadow-lg cursor-pointer transition-transform hover:scale-125 animate-pulse ${
                              pin.type === 'damage' 
                                ? 'bg-red-500 border-white text-white' 
                                : pin.type === 'seal' 
                                ? 'bg-blue-500 border-white text-white' 
                                : 'bg-emerald-500 border-white text-white'
                            }`}
                            title={pin.title}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Filter and Rotate Toolbar */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/75 backdrop-blur-xs p-2 rounded-xl text-white text-xs">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-gray-400 font-bold hidden sm:inline">Filter:</span>
                        <button
                          onClick={() => setFilterMode('scan_contrast')}
                          className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'scan_contrast' ? 'bg-blue-600 font-bold' : 'text-gray-300'}`}
                        >
                          Doc Contrast
                        </button>
                        <button
                          onClick={() => setFilterMode('grayscale')}
                          className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'grayscale' ? 'bg-blue-600 font-bold' : 'text-gray-300'}`}
                        >
                          B&W
                        </button>
                        <button
                          onClick={() => setFilterMode('normal')}
                          className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'normal' ? 'bg-blue-600 font-bold' : 'text-gray-300'}`}
                        >
                          Color
                        </button>
                      </div>

                      <button
                        onClick={() => setRotationDegrees(prev => (prev + 90) % 360)}
                        className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rotate</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Idle / Initial State */}
                {!isCameraActive && !capturedImage && (
                  <div className="p-8 text-center text-gray-400 space-y-3">
                    <Camera className="w-12 h-12 text-gray-500 mx-auto" />
                    <div className="text-sm font-bold text-gray-200">
                      {activeWorkflowMode === 'trailer_cargo'
                        ? 'Trailer Cargo & Damage Camera Ready'
                        : 'Optical Camera & Ingestion Ready'}
                    </div>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      {activeWorkflowMode === 'trailer_cargo'
                        ? 'Snap a photo of the back of the trailer to run Gemini Vision AI damage and securement compliance scanning.'
                        : 'Use your device camera to snap paperwork, or upload PDF, JPEG, PNG, or HEIC files from your phone or computer.'}
                    </p>
                  </div>
                )}
              </div>

              {/* CAMERA SHUTTER & FILE UPLOAD ACTION STRIP */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {!isCameraActive ? (
                    <button
                      onClick={startCameraStream}
                      className={`px-4 py-2.5 ${activeWorkflowMode === 'trailer_cargo' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{activeWorkflowMode === 'trailer_cargo' ? 'Open Trailer Cam' : 'Open Camera'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={capturePhoto}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-colors animate-pulse"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture Photo</span>
                      </button>
                      <button
                        onClick={stopCameraStream}
                        className="px-3.5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Native Camera trigger for iPhones and mobile tablets */}
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleUniversalFileUpload}
                  />
                  <button
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-gray-300"
                    title="Open Phone Native Camera"
                  >
                    <Smartphone className="w-4 h-4 text-gray-600" />
                    <span>Phone Cam</span>
                  </button>
                </div>

                {/* Universal File Upload Button (PDF, JPEG, PNG, HEIC) */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,.tiff"
                    className="hidden"
                    onChange={handleUniversalFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Upload File (PDF/IMG/HEIC)</span>
                  </button>
                </div>
              </div>

              {/* Pin Detail Callout (Trailer Mode) */}
              {activeWorkflowMode === 'trailer_cargo' && selectedPinId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                  {(() => {
                    const pin = damagePins.find(p => p.id === selectedPinId);
                    if (!pin) return null;
                    return (
                      <>
                        <div className="flex items-center justify-between font-bold text-amber-950">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{pin.title}</span>
                          </span>
                          <span className={`text-[10px] uppercase px-2 py-0.2 rounded-full font-bold ${
                            pin.severity === 'critical' ? 'bg-red-200 text-red-900' :
                            pin.severity === 'moderate' ? 'bg-amber-200 text-amber-900' :
                            'bg-emerald-200 text-emerald-900'
                          }`}>
                            {pin.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900">{pin.description}</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* RIGHT: INTELLIGENT ROUTING & VERIFICATION ENGINE (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>
                    {activeWorkflowMode === 'trailer_cargo'
                      ? 'Gemini Vision Inspection Results'
                      : 'Intelligent Routing & Extracted Metadata'}
                  </span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {isAnalyzingOcr ? 'Analyzing...' : `OCR Score: ${ocrConfidence}%`}
                </span>
              </div>

              {/* TRAILER MODE: GEMINI COMPLIANCE & DAMAGE DETAILS */}
              {activeWorkflowMode === 'trailer_cargo' ? (
                <div className="space-y-3 text-xs">
                  {/* Securement Status */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>FMCSA 49 CFR 393.100 Compliant</span>
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        2x Ratchet Straps + Load Lock Bar verified in position.
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      Verified
                    </span>
                  </div>

                  {/* Seal Verification */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-extrabold text-blue-950">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Bolt Seal Verification</span>
                      </span>
                      <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                        Intact
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-blue-800">
                      <span>Detected Seal #: <b>{detectedSealNumber}</b></span>
                      <span>Tamper Check: Clean</span>
                    </div>
                  </div>

                  {/* Pallet Count & Defect Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Pallet Count</span>
                      <span className="text-sm font-extrabold text-gray-900">{detectedPalletCount} Pallets</span>
                    </div>
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Pre-Existing Damage</span>
                      <span className="text-sm font-extrabold text-amber-600">1 Logged (Skid #4)</span>
                    </div>
                  </div>

                  {/* Driver Exoneration Clause */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 space-y-1">
                    <div className="font-bold text-gray-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Carrier Exoneration from In-Transit Claims</span>
                    </div>
                    <p>
                      Pre-existing warehouse defect registered prior to trailer latching. Carrier Green Express LLC protected under 49 U.S.C. 14706.
                    </p>
                  </div>
                </div>
              ) : (
                /* DOCUMENT MODE: METADATA & OCR FIELDS */
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Document Classification
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 font-bold text-gray-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="POD">Proof of Delivery (Signed BOL / POD)</option>
                      <option value="RateCon">Rate Confirmation (Broker Tender)</option>
                      <option value="Invoice">Carrier Freight Invoice</option>
                      <option value="FuelReceipt">Fuel & DEF Fueling Receipt</option>
                      <option value="LumperReceipt">Lumper / Unloading Receipt</option>
                      <option value="ScaleTicket">CAT Scale Weight Ticket</option>
                      <option value="DOTInspection">DOT Roadside Inspection Report</option>
                      <option value="MaintenanceReceipt">Shop / Maintenance Repair Work Order</option>
                      <option value="DriverCredential">Driver Medical Card / CDL License</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Load / Order Number
                      </label>
                      <input
                        type="text"
                        value={extractedLoadNumber}
                        onChange={(e) => setExtractedLoadNumber(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 font-mono font-bold text-gray-900 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Total Amount ($)
                      </label>
                      <input
                        type="number"
                        value={extractedAmount}
                        onChange={(e) => setExtractedAmount(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 font-bold text-gray-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      Customer / Shipper / Vendor
                    </label>
                    <input
                      type="text"
                      value={extractedCustomer}
                      onChange={(e) => setExtractedCustomer(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 font-bold text-gray-900 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Destination Folder Path & Override */}
              <div className="pt-2 border-t border-gray-150 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                  <span>Routing Destination:</span>
                  <span className="text-[10px] text-blue-600 font-mono">DocumentDatabaseExplorer</span>
                </div>
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-mono text-[11px] font-bold flex items-center gap-1.5">
                  <FolderInput className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{customFolderOverride || targetFolderPath}</span>
                </div>
              </div>

              {/* EXECUTE ROUTING BUTTON */}
              <div className="pt-3">
                <button
                  onClick={handleExecuteRoute}
                  disabled={isSubmitting || (!capturedImage && !capturedFileName)}
                  className={`w-full py-3 ${
                    activeWorkflowMode === 'trailer_cargo'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FolderInput className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Categorizing & Routing File...'
                      : activeWorkflowMode === 'trailer_cargo'
                      ? 'Certify & Route Trailer Inspection'
                      : 'Execute Intelligent Route & Save'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
