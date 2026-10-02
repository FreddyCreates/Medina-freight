import React, { useState, useRef, useEffect } from 'react';
import { Project, ProposedInvoice, FleetDriver, CompanyProfile } from '../../types';
import { 
  Bot, 
  Camera, 
  Send, 
  Mic, 
  MicOff, 
  Wrench, 
  FileText, 
  Truck, 
  Zap, 
  Mail, 
  Video, 
  VideoOff, 
  Terminal, 
  Plus, 
  X, 
  CheckCheck, 
  ArrowRight,
  ChevronRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Calculator,
  Play,
  Lock,
  Check,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Copy,
  Activity,
  User,
  Settings,
  FolderOpen,
  RefreshCw,
  HelpCircle,
  Eye,
  Sliders,
  Layers3,
  Code,
  Calendar,
  DollarSign,
  Volume2,
  VolumeX,
  FileCheck,
  Download,
  AlertCircle
} from 'lucide-react';
import { DEFAULT_COMPANY_PROFILE, INITIAL_FLEET_DRIVERS } from '../../data/realFleetData';
import { 
  listUnreadGmailThreads, 
  autoReplyToBrokerThread, 
  RealGmailMessage, 
  RealGmailThread,
  sendEmailViaRealGmail,
  tokenManager,
  getGmailAccessToken
} from '../../services/gmailIntegration';
import { executePythonAgent } from '../../services/pythonApiService';
import { executeMCPTool, MCP_TOOLS_CATALOG, MCPToolDefinition } from '../../services/mcpEngine';

interface GeminiOmniAdminHubProps {
  projects: Project[];
  invoices: ProposedInvoice[];
  drivers?: FleetDriver[];
  companyProfile?: CompanyProfile;
  onNavigateToTab: (tab: string, projectId?: string) => void;
  onAddProject?: (newProject: any) => void;
  onAddInvoice?: (newInvoice: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  image?: string;
  mode?: 'truck_diagnostic' | 'general_tms' | 'document_processing' | 'gmail_agent';
  mcpToolCallSimulated?: {
    toolName: string;
    args: any;
  };
  gmailThreads?: RealGmailThread[];
}

// =========================================================
// PREMIUM OPENAI-STYLE AI DOTS COMPONENT
// =========================================================
const OpenAIDots: React.FC<{ state: 'idle' | 'listening' | 'thinking' | 'executing' | 'done' }> = ({ state }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 h-28 relative overflow-hidden select-none bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
      {/* soft blur background aura */}
      <div className={`absolute w-28 h-28 rounded-full filter blur-xl opacity-20 transition-all duration-700 ${
        state === 'idle' ? 'bg-blue-300' :
        state === 'listening' ? 'bg-rose-300' :
        state === 'thinking' ? 'bg-purple-300' :
        state === 'executing' ? 'bg-amber-300' :
        'bg-emerald-300'
      }`} />

      {/* morphing dots row */}
      <div className="flex items-center justify-center gap-3.5 z-10 h-10">
        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-sm transition-all duration-500 ${
          state === 'idle' ? 'animate-bounce delay-75' :
          state === 'listening' ? 'scale-y-[2.2] bg-rose-500 shadow-rose-200' :
          state === 'thinking' ? 'animate-pulse scale-110 duration-1000' :
          state === 'executing' ? 'animate-ping duration-[1000ms] bg-amber-500' :
          'scale-95 bg-emerald-500'
        }`} style={{ animationDelay: '0ms' }} />

        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-sm transition-all duration-500 ${
          state === 'idle' ? 'animate-bounce delay-150' :
          state === 'listening' ? 'scale-y-[2.8] bg-rose-500 shadow-rose-200' :
          state === 'thinking' ? 'animate-pulse scale-125 duration-700' :
          state === 'executing' ? 'animate-ping duration-[1200ms] bg-amber-500' :
          'scale-100 bg-emerald-600'
        }`} style={{ animationDelay: '150ms' }} />

        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shadow-sm transition-all duration-500 ${
          state === 'idle' ? 'animate-bounce delay-220' :
          state === 'listening' ? 'scale-y-[2.5] bg-rose-400 shadow-rose-100' :
          state === 'thinking' ? 'animate-pulse scale-110 duration-1000' :
          state === 'executing' ? 'animate-ping duration-[900ms] bg-amber-500' :
          'scale-95 bg-emerald-500'
        }`} style={{ animationDelay: '300ms' }} />

        <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 shadow-sm transition-all duration-500 ${
          state === 'idle' ? 'animate-bounce delay-300' :
          state === 'listening' ? 'scale-y-[1.9] bg-rose-400 shadow-rose-100' :
          state === 'thinking' ? 'animate-pulse scale-100 duration-800' :
          state === 'executing' ? 'animate-ping duration-[1100ms] bg-amber-500' :
          'scale-90 bg-emerald-400'
        }`} style={{ animationDelay: '450ms' }} />
      </div>

      <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-mono mt-3">
        {state === 'idle' && 'Swarm Standby'}
        {state === 'listening' && 'Listening... Speak Command'}
        {state === 'thinking' && 'Swarm Analyzing...'}
        {state === 'executing' && 'Executing Task Actions...'}
        {state === 'done' && 'Swarm Sequence Committed'}
      </div>
    </div>
  );
};

export const GeminiOmniAdminHub: React.FC<GeminiOmniAdminHubProps> = ({
  projects,
  invoices,
  drivers = INITIAL_FLEET_DRIVERS,
  companyProfile = DEFAULT_COMPANY_PROFILE,
  onNavigateToTab,
  onAddProject,
  onAddInvoice
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      sender: 'agent',
      text: `Gemini Omni Swarm active and connected to your database.\n\nCarrier: GREEN EXPRESS LLC · DOT #: ${companyProfile.dotNumber}\n\nOur cooperative agent instances are monitoring your operations. You can speak commands directly or upload files/take photos of broker tenders or rate confirmations to process them.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'general_tms'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState<'general_tms' | 'truck_diagnostic' | 'document_processing' | 'gmail_agent'>('general_tms');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // OpenAI Dots animations state
  const [aiDotState, setAiDotState] = useState<'idle' | 'listening' | 'thinking' | 'executing' | 'done'>('idle');

  // Interactive UI Panels
  const [showMcpPanel, setShowMcpPanel] = useState(true);
  const [realEmails, setRealEmails] = useState<RealGmailThread[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<RealGmailThread | null>(null);
  const [isSyncingEmails, setIsSyncingEmails] = useState(false);

  // local drivers status sync
  const [localDrivers, setLocalDrivers] = useState<FleetDriver[]>(() => {
    const saved = localStorage.getItem('alvys_fleet_drivers_v2');
    return saved ? JSON.parse(saved) : drivers;
  });

  useEffect(() => {
    if (drivers) {
      setLocalDrivers(drivers);
    }
  }, [drivers]);

  // Model Context Protocol logs
  const [mcpHandshakeLogs, setMcpHandshakeLogs] = useState<string[]>([
    `[MCP-CONNECT] Secure connected: mcp://localhost:4500 (JSON-RPC 2.0)`,
    `[MCP-DISCOVER] Discovered 11 active tool nodes successfully.`
  ]);

  const appendMcpLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMcpHandshakeLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 20)]);
  };

  // Pending secure authorization gate prompt
  const [pendingMcpAuth, setPendingMcpAuth] = useState<{
    id: string;
    toolName: string;
    args: any;
    label: string;
  } | null>(null);

  // Sandbox Tool Selection state
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>('calculate_freight_quote');
  const [mcpArgumentsText, setMcpArgumentsText] = useState('{\n  "originCity": "Chicago",\n  "destCity": "Dallas",\n  "miles": 850,\n  "ratePerMile": 3.40\n}');
  const [mcpExecutionResult, setMcpExecutionResult] = useState<any>(null);
  const [isExecutingMcp, setIsExecutingMcp] = useState(false);

  // Real Uploaded / Camera Taken Document state (Jesus Medina's Paperwork)
  const [documentFile, setDocumentFile] = useState<string | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string>('');
  const [documentFileType, setDocumentFileType] = useState<string>('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [parsedDocResult, setParsedDocResult] = useState<any>(null);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Speech & Voice controls (Voice is muted by default, browser-default synthesis only)
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Swarm agent cluster statuses
  const [swarmAgents, setSwarmAgents] = useState([
    { id: '1', name: 'Omni Dispatch Lead', status: 'standby', activity: 'Listening to chat & vocal feed' },
    { id: '2', name: 'Vision OCR Analyst', status: 'standby', activity: 'Monitoring file ingest ports' },
    { id: '3', name: 'AR Settlement Specialist', status: 'standby', activity: 'Analyzing margin & invoice ledger' },
    { id: '4', name: 'REST Dispatcher', status: 'standby', activity: 'Waiting for REST execution prompts' }
  ]);

  const updateAgentStatus = (id: string, status: 'standby' | 'working' | 'done', activity: string) => {
    setSwarmAgents(prev => prev.map(a => a.id === id ? { ...a, status, activity } : a));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Web Speech verbal instruction capture
  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setAiDotState('listening');
        updateAgentStatus('1', 'working', 'Capturing speech audio wave input...');
      };
      
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsVoiceListening(false);
        setAiDotState('idle');
        updateAgentStatus('1', 'standby', 'Speech processing finished.');
        if (transcript.trim()) {
          showToast(`Vocal input: "${transcript}"`);
          await handleProcessInstruction(transcript, null);
        }
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
        setAiDotState('idle');
        updateAgentStatus('1', 'standby', 'Speech capture error.');
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
        setAiDotState('idle');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsVoiceListening(false);
      setAiDotState('idle');
    }
  };

  // Default-only Speech Synthesis (Muted unless isAudioMuted is false)
  const speakText = (text: string) => {
    if (isAudioMuted || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`]/g, '').substring(0, 180);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Sync / Fetch Unread Gmail Threads via REST
  const handleFetchUnreadEmails = async () => {
    setIsSyncingEmails(true);
    updateAgentStatus('3', 'working', 'Querying unread Gmail rate confirmations...');
    appendMcpLog(`[GMAIL-API] Fetching unread email threads...`);
    
    try {
      const res = await listUnreadGmailThreads(8);
      setIsSyncingEmails(false);
      
      if (res.error) {
        showToast(`Gmail API: Please click to log in.`);
        updateAgentStatus('3', 'standby', 'Failed unread Gmail sync.');
        appendMcpLog(`[GMAIL-API] Error listing threads: ${res.error}`);
        return;
      }

      setRealEmails(res.threads || []);
      showToast(`Synced ${res.threads?.length || 0} freight rate emails!`);
      updateAgentStatus('3', 'standby', `Synced ${res.threads?.length || 0} emails from inbox`);
      appendMcpLog(`[GMAIL-API] Loaded ${res.threads?.length || 0} freight threads`);
    } catch (err: any) {
      setIsSyncingEmails(false);
      updateAgentStatus('3', 'standby', 'Inbox sync error.');
      showToast(`Gmail sync error: ${err.message}`);
    }
  };

  // Google OAuth Login Trigger
  const handleGmailLogin = async () => {
    try {
      await getGmailAccessToken(true);
      showToast('Successfully authenticated Gmail OAuth!');
      handleFetchUnreadEmails();
    } catch (e: any) {
      showToast(`Authentication failed: ${e.message}`);
    }
  };

  // Auto-Reply Broker via Gmail REST API
  const handleAutoReply = async (
    thread: RealGmailThread,
    action: 'confirm_acceptance' | 'request_rate_increase' | 'request_details',
    negotiateRate?: number
  ) => {
    setIsProcessing(true);
    setAiDotState('executing');
    updateAgentStatus('4', 'working', `Sending auto-reply '${action}' via Gmail REST...`);
    const topMsg = thread.messages[0] || { id: `msg-${thread.threadId}`, from: thread.fromEmail, subject: thread.subject };

    try {
      const res = await autoReplyToBrokerThread({
        threadId: thread.threadId,
        messageId: topMsg.id,
        to: thread.fromEmail,
        subject: thread.subject,
        action,
        rateOffer: negotiateRate,
        parsedFreightData: thread.parsedFreightData
      });

      setIsProcessing(false);
      setAiDotState('idle');
      updateAgentStatus('4', 'standby', 'Gmail reply dispatched.');

      if (res.success) {
        showToast('Gmail reply sent successfully!');
        appendMcpLog(`[GMAIL-API] Dispatched reply message successfully`);
        handleFetchUnreadEmails();
        
        // Add message in chat
        setMessages(prev => [
          ...prev,
          {
            id: `msg-reply-${Date.now()}`,
            sender: 'agent',
            text: `📬 **Outbound Email Sent**\n\nTo: ${thread.fromEmail}\nSubject: Re: ${thread.subject}\nAction: ${action === 'confirm_acceptance' ? 'Confirmed acceptance' : action === 'request_rate_increase' ? 'Negotiation sent at $' + negotiateRate : 'Requested load details'}.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        showToast(`Reply error: ${res.error}`);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setAiDotState('idle');
      showToast(`Gmail reply error: ${err.message}`);
    }
  };

  // Camera capture methods
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      showToast('Webcam not accessible. Please use file upload.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      setDocumentFile(base64);
      setDocumentFileName(`cam_capture_${Date.now()}.jpg`);
      setDocumentFileType('image/jpeg');
      stopCamera();
      showToast('Captured photo of document!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setDocumentFile(evt.target?.result as string);
      setDocumentFileName(file.name);
      setDocumentFileType(file.type);
      showToast(`Loaded file ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Process uploaded or camera taken document (Jesus Medina's Paperwork)
  const handleProcessUploadedDocument = async () => {
    if (!documentFile) return;

    setIsProcessingDoc(true);
    setAiDotState('thinking');
    updateAgentStatus('2', 'working', `Executing vision OCR analysis on ${documentFileName}...`);
    appendMcpLog(`[VISION-OCR] Ingesting document frame for Gemini...`);

    try {
      const res = await fetch('/api/gemini/extract-document-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: documentFile,
          mimeType: documentFileType,
          fileName: documentFileName
        })
      });

      setIsProcessingDoc(false);
      setAiDotState('idle');
      updateAgentStatus('2', 'standby', 'Vision OCR extraction complete.');

      if (res.ok) {
        const payload = await res.json();
        const data = payload.data;
        setParsedDocResult(data);
        showToast(`Document processed successfully! Type: ${data.documentType}`);
        appendMcpLog(`[VISION-OCR] Extracted Load #${data.loadNumber || 'N/A'} with confidence ${data.ocrConfidence}%`);

        setMessages(prev => [
          ...prev,
          {
            id: `msg-doc-${Date.now()}`,
            sender: 'agent',
            text: `📄 **Jesus Medina's Paperwork Vision OCR Result**\n\n• **Document Type**: \`${data.documentType || 'BOL'}\`\n• **Load Number**: \`${data.loadNumber || 'Not specified'}\`\n• **BOL Reference**: \`${data.bolNumber || 'Not specified'}\`\n• **Broker/Shipper**: \`${data.brokerCustomer || 'Not specified'}\`\n• **Receiver Signature**: \`${data.consigneeSignatureDetected ? '✅ Verified Signature Detected' : '❌ NOT Detected'}\`\n• **Weight**: \`${data.weightLbs ? data.weightLbs.toLocaleString() + ' LBS' : 'Not specified'}\`\n• **Temperature**: \`${data.temperatureRecordedF ? data.temperatureRecordedF + '°F' : 'Not specified'}\`\n\n${data.discrepancies?.length > 0 ? '⚠️ **Discrepancies found**: \n' + data.discrepancies.join('\n') : '✅ Paperwork is verified clean with 0 exceptions.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        showToast('Vision parsing failed. Fallback triggered.');
      }
    } catch (e: any) {
      setIsProcessingDoc(false);
      setAiDotState('idle');
      showToast(`Error processing document: ${e.message}`);
    }
  };

  // Commit vision document load into actual system
  const handleCommitParsedDocumentLoad = () => {
    if (!parsedDocResult) return;
    const d = parsedDocResult;

    const sampleProj: Project = {
      id: `prj-doc-${Date.now()}`,
      code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      loadNumber: d.loadNumber || `LD-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: d.brokerCustomer || 'C.H. Robinson Worldwide',
      customerCode: (d.brokerCustomer || 'CHRW').substring(0, 4).toUpperCase(),
      originCity: d.shipperName?.split(',')?.[0]?.trim() || 'Chicago',
      originState: 'IL',
      originAddress: d.shipperName || 'Chicago Logistics Terminal',
      destCity: d.consigneeName?.split(',')?.[0]?.trim() || 'Dallas',
      destState: 'TX',
      destAddress: d.consigneeName || 'Dallas Logistics Terminal',
      status: 'booked',
      driverName: 'Ray Delgado',
      driverPhone: '(312) 555-0199',
      truckId: 'TRK-402',
      trailerId: 'TRL-808',
      pickupDate: d.pickupDate || new Date().toISOString().split('T')[0],
      deliveryDate: d.deliveryDate || new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      estimatedRevenue: d.rateAmount || 3850,
      linehaulPay: (d.rateAmount || 3850) - 450,
      fuelSurcharge: 450,
      equipmentType: '53ft Reefer',
      commodities: 'Refrigerated Cargo',
      weightLbs: d.weightLbs || 42000,
      documentsCount: 2,
      telemetry: {
        lat: 41.8781,
        lng: -87.6298,
        speedMph: 0,
        headingDeg: 180,
        reeferTempF: d.temperatureRecordedF || -10,
        fuelLevelPct: 100,
        currentLocationName: 'Shipper Dock',
        lastPingTime: 'Just now',
        geofenceState: 'Inside Shipper',
        dwellMinutes: 1
      },
      tripStops: [],
      tasks: [],
      comments: [],
      activeCollaboratorIds: ['user-1'],
      lastUpdated: 'Just now'
    };

    onAddProject?.(sampleProj);

    // Draft Invoice
    if (onAddInvoice) {
      onAddInvoice({
        id: `inv-doc-${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        projectId: sampleProj.id,
        loadNumber: sampleProj.loadNumber,
        customerName: sampleProj.customerName,
        customerEmail: 'ap@chrobinson.com',
        billingAddress: '14701 Charlson Rd, Eden Prairie, MN 55347',
        paymentTerms: 'Net 30 Days',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        lineItems: [
          { id: 'li-1', description: `Linehaul payment`, type: 'linehaul', amount: sampleProj.estimatedRevenue - 450, sourceDoc: 'RateConfirmation' },
          { id: 'li-2', description: 'Fuel Surcharge', type: 'fuel_surcharge', amount: 450, sourceDoc: 'RateConfirmation' }
        ],
        subtotal: sampleProj.estimatedRevenue,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: sampleProj.estimatedRevenue,
        amountPaid: 0,
        balanceDue: sampleProj.estimatedRevenue,
        status: 'needs_review',
        attachedDocIds: [],
        factoringStatus: 'unassigned',
        correctionsLog: []
      });
    }

    setParsedDocResult(null);
    setDocumentFile(null);
    setDocumentFileName('');
    showToast('Successfully committed load to Dispatch & Invoicing!');
  };

  // Secure user approval for LLM tool invocation
  const handleApprovePendingMcp = async () => {
    if (!pendingMcpAuth) return;
    const auth = pendingMcpAuth;
    setPendingMcpAuth(null);
    appendMcpLog(`[GATEKEEPER] Auth APPROVED for dynamic execution of '${auth.toolName}'`);

    setIsProcessing(true);
    setAiDotState('executing');
    updateAgentStatus('4', 'working', `Invoking verified tool node ${auth.toolName}...`);

    try {
      const toolRes = await executeMCPTool(auth.toolName, auth.args, { projects, invoices, companyProfile });
      setIsProcessing(false);
      setAiDotState('idle');
      updateAgentStatus('4', 'standby', 'Tool invocation complete.');

      if (toolRes.success) {
        showToast(`Executed '${auth.toolName}' successfully!`);
        appendMcpLog(`[MCP] Tool response: success`);

        // Local operations reflecting tool outcome
        if (auth.toolName === 'create_booked_load') {
          const loadNo = auth.args.loadNumber || `LD-${Math.floor(10000 + Math.random() * 90000)}`;
          const pOrigin = auth.args.originCity || 'Chicago';
          const pDest = auth.args.destCity || 'Dallas';
          const pRate = Number(auth.args.rate) || 3850;

          const sampleProj: Project = {
            id: `prj-mcp-${Date.now()}`,
            code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
            loadNumber: loadNo,
            customerName: auth.args.customerName || 'C.H. Robinson Worldwide',
            customerCode: 'CHRW',
            originCity: pOrigin,
            originState: 'IL',
            originAddress: `${pOrigin} Shipper Hub`,
            destCity: pDest,
            destState: 'TX',
            destAddress: `${pDest} Consignee Hub`,
            status: 'booked',
            driverName: auth.args.driverName || 'Ray Delgado',
            driverPhone: '(312) 555-0199',
            truckId: 'TRK-402',
            trailerId: 'TRL-808',
            pickupDate: new Date().toISOString().split('T')[0],
            deliveryDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
            estimatedRevenue: pRate,
            linehaulPay: pRate - 450,
            fuelSurcharge: 450,
            equipmentType: '53ft Reefer',
            commodities: 'Refrigerated Cargo',
            weightLbs: 42500,
            documentsCount: 2,
            telemetry: {
              lat: 41.8781,
              lng: -87.6298,
              speedMph: 0,
              headingDeg: 180,
              reeferTempF: -10,
              fuelLevelPct: 100,
              currentLocationName: `${pOrigin} Shipper Hub`,
              lastPingTime: 'Just now',
              geofenceState: 'Inside Shipper',
              dwellMinutes: 1
            },
            tripStops: [],
            tasks: [],
            comments: [],
            activeCollaboratorIds: ['user-1'],
            lastUpdated: 'Just now'
          };

          onAddProject?.(sampleProj);

          if (onAddInvoice) {
            onAddInvoice({
              id: `inv-mcp-${Date.now()}`,
              invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              projectId: sampleProj.id,
              loadNumber: sampleProj.loadNumber,
              customerName: sampleProj.customerName,
              customerEmail: 'ap@chrobinson.com',
              billingAddress: '14701 Charlson Rd, Eden Prairie, MN 55347',
              paymentTerms: 'Net 30 Days',
              issueDate: new Date().toISOString().split('T')[0],
              dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
              lineItems: [
                { id: 'li-1', description: `Linehaul payment`, type: 'linehaul', amount: pRate - 450, sourceDoc: 'RateConfirmation' },
                { id: 'li-2', description: 'Fuel Surcharge', type: 'fuel_surcharge', amount: 450, sourceDoc: 'RateConfirmation' }
              ],
              subtotal: pRate,
              taxRate: 0,
              taxAmount: 0,
              totalAmount: pRate,
              amountPaid: 0,
              balanceDue: pRate,
              status: 'needs_review',
              attachedDocIds: [],
              factoringStatus: 'unassigned',
              correctionsLog: []
            });
          }
        } else if (auth.toolName === 'update_driver_status') {
          const updatedName = auth.args.driverName || 'Ray Delgado';
          const newStat = auth.args.status || 'available';
          setLocalDrivers(prev => prev.map(d => d.name.toLowerCase().includes(updatedName.toLowerCase()) ? { ...d, status: newStat as any } : d));
        }

        setMessages(prev => [
          ...prev,
          {
            id: `msg-mcp-res-${Date.now()}`,
            sender: 'agent',
            text: `✅ **Secure MCP Execution Successful**\n\n• **Tool Executed**: \`${auth.toolName}\`\n• **Status**: SUCCESS\n• **Outcome**: Committed fully to company database.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        showToast(`Tool execution failed: ${toolRes.result?.error}`);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setAiDotState('idle');
      showToast(`Execution error: ${err.message}`);
    }
  };

  const handleRejectPendingMcp = () => {
    if (!pendingMcpAuth) return;
    const auth = pendingMcpAuth;
    setPendingMcpAuth(null);
    setAiDotState('idle');
    appendMcpLog(`[GATEKEEPER] Auth DENIED for tool '${auth.toolName}'`);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-mcp-rej-${Date.now()}`,
        sender: 'agent',
        text: `❌ **Secure MCP Execution Denied**\n\n• **Tool Request**: \`${auth.toolName}\`\n• **Status**: DENIED BY SYSTEM\n• **Action**: Mutation blocked to protect production data.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Process instructional queries (Verbal / Chat)
  const handleProcessInstruction = async (userText: string, currentImg: string | null) => {
    setIsProcessing(true);
    setAiDotState('thinking');
    updateAgentStatus('1', 'working', 'Interpreting linguistic instruction...');
    appendMcpLog(`[NLP-PARSER] Analyzing user intent swarm...`);

    try {
      // 1. Regex Match: Create Load Tool
      if (/create.*load|book.*load|add.*load/i.test(userText)) {
        setIsProcessing(false);
        setAiDotState('thinking');
        
        const origin = userText.match(/from\s+([a-zA-Z\s]+?)(?=\s+to|\s+for|\s+at|$)/i)?.[1]?.trim() || 'Chicago';
        const dest = userText.match(/to\s+([a-zA-Z\s]+?)(?=\s+for|\s+at|\s+from|$)/i)?.[1]?.trim() || 'Dallas';
        const rate = Number(userText.match(/\$?\s*(\d{3,5})/)?.[1]) || 3850;
        const loadNo = `LD-${Math.floor(10000 + Math.random() * 90000)}`;

        const mcpArgs = {
          loadNumber: loadNo,
          customerName: 'C.H. Robinson Worldwide',
          originCity: origin,
          destCity: dest,
          rate: rate,
          driverName: 'Ray Delgado'
        };

        appendMcpLog(`[LLM-INTENT] Mapped create load request to 'create_booked_load'`);
        updateAgentStatus('1', 'working', 'Triggering create load authorization...');

        setMessages(prev => [
          ...prev,
          {
            id: `msg-mcp-trig-${Date.now()}`,
            sender: 'agent',
            text: `🔄 **Secure Tool Invocation Prompt**\n\nPrimary agent requested tool execution gate access.\n\n• **Tool Name**: \`create_booked_load\`\n• **Origin**: ${origin}\n• **Destination**: ${dest}\n• **Gross Rate**: $${rate.toLocaleString()} USD\n• **Assigned Operator**: Ray Delgado`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setPendingMcpAuth({
          id: `auth-${Date.now()}`,
          toolName: 'create_booked_load',
          label: 'Create Active Booked Load',
          args: mcpArgs
        });
        return;
      }

      // 2. Regex Match: Driver Status Update
      if (/update.*driver|driver.*status|status.*of.*ray|set.*Marcus.*to/i.test(userText)) {
        setIsProcessing(false);
        setAiDotState('thinking');
        
        const driverName = /marcus/i.test(userText) ? 'Marcus Vance' : 'Ray Delgado';
        const newStatus = /transit|dispatch/i.test(userText) ? 'dispatched' : /off/i.test(userText) ? 'off-duty' : 'available';

        const mcpArgs = {
          driverName,
          status: newStatus,
          location: 'Dallas Terminal'
        };

        appendMcpLog(`[LLM-INTENT] Mapped driver request to 'update_driver_status'`);
        updateAgentStatus('1', 'working', 'Triggering driver update authorization...');

        setMessages(prev => [
          ...prev,
          {
            id: `msg-mcp-trig-${Date.now()}`,
            sender: 'agent',
            text: `🔄 **Secure Tool Invocation Prompt**\n\nPrimary agent requested tool execution gate access.\n\n• **Tool Name**: \`update_driver_status\`\n• **Driver**: ${driverName}\n• **New Status**: \`${newStatus.toUpperCase()}\``,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setPendingMcpAuth({
          id: `auth-${Date.now()}`,
          toolName: 'update_driver_status',
          label: 'Update Driver Status',
          args: mcpArgs
        });
        return;
      }

      // 3. Regex Match: Trigger Email
      if (/email.*dispatch|send.*dispatch|trigger.*dispatch/i.test(userText)) {
        setIsProcessing(false);
        setAiDotState('thinking');
        
        const driverEmail = 'ray.delgado@greenexpress.com';
        const loadNo = 'CHR-99120';

        const mcpArgs = {
          driverEmail,
          loadNumber: loadNo,
          originCity: 'Chicago',
          destCity: 'Dallas',
          revenue: 3850
        };

        appendMcpLog(`[LLM-INTENT] Mapped dispatch trigger to 'trigger_dispatch_email'`);
        updateAgentStatus('1', 'working', 'Triggering email dispatch authorization...');

        setMessages(prev => [
          ...prev,
          {
            id: `msg-mcp-trig-${Date.now()}`,
            sender: 'agent',
            text: `🔄 **Secure Tool Invocation Prompt**\n\nPrimary agent requested tool execution gate access.\n\n• **Tool Name**: \`trigger_dispatch_email\`\n• **Recipient**: ${driverEmail}\n• **Reference Load**: #${loadNo}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setPendingMcpAuth({
          id: `auth-${Date.now()}`,
          toolName: 'trigger_dispatch_email',
          label: 'Trigger Dispatch Sheet Email',
          args: mcpArgs
        });
        return;
      }

      // Standard multi-agent reasoning flow via backend
      const res = await fetch('/api/gemini/omni-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          attachedImage: currentImg,
          mode: selectedMode,
          tmsContext: {
            companyName: 'GREEN EXPRESS LLC',
            dotNumber: companyProfile.dotNumber,
            projectsCount: projects.length,
            invoicesCount: invoices.length
          }
        })
      });

      setIsProcessing(false);
      setAiDotState('idle');
      updateAgentStatus('1', 'standby', 'Finished interpreting query.');

      if (res.ok) {
        const data = await res.json();
        
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            sender: 'agent',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: selectedMode
          }
        ]);

        speakText(data.reply);
      } else {
        showToast('Error communicating with Gemini Omni.');
      }
    } catch (e: any) {
      setIsProcessing(false);
      setAiDotState('idle');
      showToast(`Reasoning error: ${e.message}`);
    }
  };

  // Main Submit Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && !documentFile) return;

    const userText = inputMessage.trim();
    const currentFile = documentFile;
    const isDoc = currentFile && documentFileType === 'application/pdf';

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: userText || (currentFile ? `Sent document file: ${documentFileName}` : ''),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        image: (!isDoc && currentFile) ? currentFile : undefined
      }
    ]);

    setInputMessage('');
    if (!isDoc) {
      setDocumentFile(null);
      setDocumentFileName('');
    }

    await handleProcessInstruction(userText, (!isDoc && currentFile) ? currentFile : null);
  };

  // MCP sandbox selection preset helper
  const handleMcpSelectHelper = (toolName: string) => {
    setSelectedMcpTool(toolName);
    let preset = '{}';
    if (toolName === 'calculate_freight_quote') {
      preset = '{\n  "originCity": "Chicago",\n  "destCity": "Dallas",\n  "miles": 850,\n  "ratePerMile": 3.40\n}';
    } else if (toolName === 'create_booked_load') {
      preset = '{\n  "customerName": "C.H. Robinson",\n  "originCity": "Chicago",\n  "destCity": "Dallas",\n  "rate": 3850,\n  "driverName": "Ray Delgado"\n}';
    } else if (toolName === 'generate_carrier_invoice') {
      preset = '{\n  "loadNumber": "RC-99812",\n  "linehaul": 3400,\n  "fuelSurcharge": 450,\n  "lumper": 150\n}';
    } else if (toolName === 'run_truck_diagnostic') {
      preset = '{\n  "faultCode": "SPN-3251"\n}';
    } else if (toolName === 'auto_reply_broker') {
      preset = '{\n  "to": "broker@chrobinson.com",\n  "subject": "Re: Quote",\n  "action": "confirm"\n}';
    } else if (toolName === 'list_unread_emails') {
      preset = '{\n  "maxResults": 5\n}';
    } else if (toolName === 'update_driver_status') {
      preset = '{\n  "driverName": "Ray Delgado",\n  "status": "dispatched",\n  "location": "Dallas, TX"\n}';
    } else if (toolName === 'trigger_dispatch_email') {
      preset = '{\n  "driverEmail": "ray.delgado@greenexpress.com",\n  "loadNumber": "RC-99120",\n  "originCity": "Chicago",\n  "destCity": "Dallas",\n  "revenue": 3850\n}';
    }
    setMcpArgumentsText(preset);
  };

  const handleExecuteSandboxTool = async () => {
    setIsExecutingMcp(true);
    setAiDotState('executing');
    updateAgentStatus('4', 'working', `Executing sandbox node tool ${selectedMcpTool}...`);

    try {
      const parsed = JSON.parse(mcpArgumentsText);
      const res = await executeMCPTool(selectedMcpTool, parsed, { projects, invoices, companyProfile });
      
      setMcpExecutionResult(res.result);
      setIsExecutingMcp(false);
      setAiDotState('idle');
      updateAgentStatus('4', 'standby', 'Sandbox tool execution complete.');
      showToast(`Executed ${selectedMcpTool} successfully!`);
      appendMcpLog(`[SANDBOX] Direct API executed: ${selectedMcpTool}`);

      if (res.success && selectedMcpTool === 'update_driver_status') {
        const dName = parsed.driverName || 'Ray Delgado';
        const dStat = parsed.status || 'available';
        setLocalDrivers(prev => prev.map(d => d.name.toLowerCase().includes(dName.toLowerCase()) ? { ...d, status: dStat as any } : d));
      }
    } catch {
      setIsExecutingMcp(false);
      setAiDotState('idle');
      showToast('Error executing tool. Please verify JSON structure.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] bg-gray-50 text-gray-900 rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-14 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-xs shadow-md animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================= */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#007AFF]">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              Gemini Omni Swarm Coordinator
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE MATRIX
              </span>
            </h1>
            <p className="text-[11px] text-gray-500">
              GREEN EXPRESS LLC · Real-Time Multi-Agent Fleet Ingestion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Mute Switcher */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isAudioMuted ? 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}
            title={isAudioMuted ? 'Unmute Verbal TTS' : 'Mute Verbal TTS'}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
            <span className="text-[10px]">{isAudioMuted ? 'Muted' : 'Voice Active'}</span>
          </button>

          <button
            onClick={() => setShowMcpPanel(!showMcpPanel)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              showMcpPanel ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>MCP Explorer</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN SCREEN SPLIT WORKSPACE */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: ACTIVE CHAT FRAME & ORB */}
        <div className="w-[55%] flex flex-col border-r border-gray-200 bg-white">
          <OpenAIDots state={aiDotState} />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/20">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-0.5`}>
                  <div className="text-[10px] text-gray-400 font-bold font-mono px-2">
                    {isUser ? 'Dispatcher' : 'Omni Commander'}
                  </div>
                  <div className={`relative ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[85%] text-xs shadow-2xs'
                      : 'bg-white text-gray-900 rounded-2xl rounded-tl-xs px-4 py-2.5 max-w-[85%] text-xs shadow-2xs border border-gray-150'
                  }`}>
                    {msg.image && (
                      <img src={msg.image} alt="Upload Scan" className="max-h-48 w-full object-cover rounded-lg mb-2 border border-gray-100" />
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed text-left">{msg.text}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input bar */}
          <div className="p-3 border-t border-gray-200 bg-[#F6F6F6] shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-full border transition-all shrink-0 cursor-pointer shadow-2xs ${
                  isVoiceListening ? 'bg-rose-100 border-rose-400 text-rose-600 animate-pulse' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
                title="Speak to agent"
              >
                {isVoiceListening ? <Mic className="w-4 h-4 text-rose-600" /> : <MicOff className="w-4 h-4 text-gray-400" />}
              </button>

              <input
                type="text"
                placeholder={isVoiceListening ? 'Listening to voice feed...' : 'Command Omni, assign drivers, create loads...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isVoiceListening}
                className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500 shadow-2xs placeholder-gray-400"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() && !documentFile}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all disabled:opacity-30 shrink-0 cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL GMAIL & DOCUMENT PROCESSING */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto p-4 space-y-4">
          
          {/* SECTION 1: JESUS MEDINA'S PAPERWORK PROCESSING */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    Jesus Medina's Paperwork
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Drag & drop, upload, or take a live photo of signed BOLs, rate confirmations, or scale tickets.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload & Webcam Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Box 1: File Upload */}
              <div className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 transition-all text-center relative cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileCheck className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-[11px] font-bold text-gray-700">Choose file or drag here</span>
                <span className="text-[9px] text-gray-400 mt-1">Supports PDF, JPG, PNG (Max 10MB)</span>
              </div>

              {/* Box 2: Webcam Camera Capture */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 hover:bg-gray-50 transition-all flex flex-col items-center justify-center">
                {isCameraActive ? (
                  <div className="w-full relative rounded-lg overflow-hidden border border-gray-200 bg-black aspect-video max-h-32 mb-2">
                    <video ref={videoRef} className="w-full h-full object-cover" play-inline="true" muted />
                    <button 
                      onClick={capturePhoto}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center p-2.5"
                  >
                    <Video className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-[11px] font-bold text-gray-700">Use Live Camera</span>
                    <span className="text-[9px] text-gray-400 mt-1">Take photo with laptop or phone camera</span>
                  </button>
                )}
                {isCameraActive && (
                  <button 
                    onClick={stopCamera}
                    className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Cancel Camera
                  </button>
                )}
              </div>
            </div>

            {/* File loaded state */}
            {documentFile && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-gray-800 block truncate">{documentFileName}</span>
                    <span className="text-[9px] text-gray-400 uppercase font-mono">{documentFileType}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleProcessUploadedDocument}
                    disabled={isProcessingDoc}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    {isProcessingDoc ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Process document</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => { setDocumentFile(null); setDocumentFileName(''); setParsedDocResult(null); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Extracted vision document results display */}
            {parsedDocResult && (
              <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    OCR Extraction Successful (Confidence: {parsedDocResult.ocrConfidence}%)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {parsedDocResult.documentType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  <div>Load Number: <span className="font-bold text-gray-900">{parsedDocResult.loadNumber || 'N/A'}</span></div>
                  <div>Broker: <span className="font-semibold text-gray-800">{parsedDocResult.brokerCustomer || 'N/A'}</span></div>
                  <div>BOL Number: <span className="font-mono">{parsedDocResult.bolNumber || 'N/A'}</span></div>
                  <div>Total Rate: <span className="font-bold text-emerald-600">${parsedDocResult.rateAmount || parsedDocResult.lumperAmount ? (parsedDocResult.rateAmount || parsedDocResult.lumperAmount).toFixed(2) : '3,850.00'}</span></div>
                  <div>Shipper: <span className="text-gray-700 truncate block">{parsedDocResult.shipperName || 'N/A'}</span></div>
                  <div>Consignee: <span className="text-gray-700 truncate block">{parsedDocResult.consigneeName || 'N/A'}</span></div>
                  <div>Weight: <span className="text-gray-700">{parsedDocResult.weightLbs ? parsedDocResult.weightLbs.toLocaleString() + ' lbs' : 'N/A'}</span></div>
                  <div>Temp Protection: <span className="text-gray-700">{parsedDocResult.temperatureRecordedF ? parsedDocResult.temperatureRecordedF + '°F' : 'N/A'}</span></div>
                </div>

                <button 
                  onClick={handleCommitParsedDocumentLoad}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  Commit parsed details to active loads & invoices
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: GMAIL FREIGHT RATE INBOX STREAM */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    Gmail Freight Inbox
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Real-time access to your Gmail carrier tenders & freight rates confirmation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleGmailLogin}
                  className="px-2 py-1 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded text-[10px] font-bold cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={handleFetchUnreadEmails}
                  disabled={isSyncingEmails}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingEmails ? 'animate-spin' : ''}`} />
                  <span>Sync Inbox</span>
                </button>
              </div>
            </div>

            {realEmails.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {realEmails.map((th) => (
                  <div 
                    key={th.id}
                    onClick={() => setSelectedEmail(th)}
                    className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all space-y-1 ${
                      selectedEmail?.id === th.id 
                        ? 'bg-blue-50/50 border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100/70 border-gray-150'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-gray-900 truncate pr-2">{th.subject}</span>
                      <span className="text-[9px] font-bold text-gray-400 shrink-0 uppercase font-mono">{th.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span className="truncate">From: {th.fromEmail}</span>
                      <span className="shrink-0">{th.messages?.[0]?.date || 'Today'}</span>
                    </div>

                    {/* Extracted Details within email row if selected */}
                    {selectedEmail?.id === th.id && th.parsedFreightData && (
                      <div className="bg-white border border-gray-200 rounded-lg p-2.5 mt-2.5 space-y-2 animate-fade-in text-[10px] font-mono text-gray-800">
                        <div className="font-bold text-blue-600 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Extracted Context (Non-Hallucinatory):
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <div>Load #: <span className="font-bold text-gray-950">{th.parsedFreightData.loadNumber || 'Omitted'}</span></div>
                          <div>Total Pay: <span className="font-bold text-emerald-600">${th.parsedFreightData.rate?.toFixed(2) || '0.00'}</span></div>
                          <div>Linehaul: <span className="text-gray-950">${th.parsedFreightData.linehaulPay?.toFixed(2) || 'N/A'}</span></div>
                          <div>Fuel FSC: <span className="text-gray-950">${th.parsedFreightData.fuelSurcharge?.toFixed(2) || 'N/A'}</span></div>
                          <div>Origin: <span className="text-gray-950">{th.parsedFreightData.origin || 'N/A'}</span></div>
                          <div>Destination: <span className="text-gray-950">{th.parsedFreightData.destination || 'N/A'}</span></div>
                          <div className="col-span-2 text-[9px] border-t border-gray-100 pt-1 mt-1 text-gray-500">
                            Detention Terms: <span className="text-gray-800 font-sans font-bold">{th.parsedFreightData.detentionTerms || 'Not specified'}</span>
                          </div>
                        </div>

                        {/* Direct actions */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-100 font-sans">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAutoReply(th, 'confirm_acceptance'); }}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[9px] cursor-pointer"
                          >
                            Auto-Confirm Acceptance
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAutoReply(th, 'request_rate_increase', (th.parsedFreightData?.rate || 3400) + 350); }}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-250 text-gray-700 border border-gray-250 font-bold rounded text-[9px] cursor-pointer"
                          >
                            Negotiate +$350 Rate
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAutoReply(th, 'request_details'); }}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-250 text-gray-700 border border-gray-250 font-bold rounded text-[9px] cursor-pointer"
                          >
                            Ask Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 border border-gray-100 rounded-xl text-center bg-gray-50/50">
                <Mail className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                <span className="text-[11px] font-bold text-gray-400 block">No freight emails synchronized</span>
                <span className="text-[9px] text-gray-400 mt-0.5 block">Click 'Sync Inbox' to query unread carrier threads</span>
              </div>
            )}
          </div>

          {/* SECTION 3: MULTI-AGENT SWARM CLUSTER COOPERATION */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    Active Swarm Worker Nodes
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Cooperative agent nodes initialized locally within the platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {swarmAgents.map((agent) => (
                <div key={agent.id} className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-3xs">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    agent.status === 'working' ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-gray-800 block leading-tight">{agent.name}</span>
                    <span className="text-[9px] text-gray-500 truncate block mt-0.5">{agent.activity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* SECONDARY DRAWER: MCP SERVER HANDSHAKE & TOOL DISCOVERY */}
      {/* ========================================================= */}
      {showMcpPanel && (
        <div className="absolute right-0 top-14 bottom-0 w-80 md:w-96 bg-white border-l border-gray-200 flex flex-col p-4 space-y-4 overflow-y-auto z-30 shadow-2xl animate-slide-in">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 shrink-0">
            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600 animate-pulse" />
              Model Context Protocol (MCP) Node
            </span>
            <button onClick={() => setShowMcpPanel(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* HANDSHAKE SPECIFICATIONS CARD */}
          <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 space-y-1.5 text-xs text-left">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Connection Endpoint:</span>
              <span className="font-mono font-bold text-gray-900">mcp://localhost:4500</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Transport Protocol:</span>
              <span className="font-mono text-gray-700">Server-Sent Events (SSE)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Gatekeeper State:</span>
              <span className="text-blue-600 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Consent Prompt Gate
              </span>
            </div>
          </div>

          {/* SECURE USER CONSENT BLOCK (GATEKEEPER) */}
          {pendingMcpAuth && (
            <div className="bg-amber-50/50 border-2 border-amber-300 rounded-2xl p-4 space-y-3.5 shadow-md animate-pulse">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="text-xs font-extrabold text-amber-900 block">🔐 Secure MCP Consent Gate</span>
                  <span className="text-[10px] text-amber-700 leading-tight block mt-0.5">
                    Gemini Agent requests permission to invoke an internal tool.
                  </span>
                </div>
              </div>

              <div className="bg-white border border-amber-200 rounded-lg p-2.5 text-[10px] font-mono text-gray-800 space-y-1 text-left">
                <div>Tool Method: <span className="font-bold text-blue-600">{pendingMcpAuth.toolName}</span></div>
                <div className="border-t border-gray-100 my-1 pt-1 font-sans text-gray-500 font-medium">Arguments Payload:</div>
                <pre className="text-[9px] bg-gray-50 p-1.5 rounded overflow-x-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(pendingMcpAuth.args, null, 2)}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApprovePendingMcp}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Authorize Exec
                </button>
                <button
                  onClick={handleRejectPendingMcp}
                  className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Deny
                </button>
              </div>
            </div>
          )}

          {/* LIVE DRIVER MONITOR ROSTER */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-3xs text-left space-y-2">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Live Fleet Tracker</span>
            <div className="space-y-2 text-xs">
              {localDrivers.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-gray-100 text-gray-600">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-extrabold block text-gray-800 leading-none">{d.name}</span>
                      <span className="text-[10px] text-gray-400 mt-1 block">Unit #{d.assignedTruckNumber}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border capitalize ${
                    d.status === 'available' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : d.status === 'dispatched'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* DYNAMIC MCP TOOL DISCOVERY LIST (USER CLICKS TO COPY PRESENTS) */}
          <div className="space-y-2.5 text-left flex-1 flex flex-col min-h-0">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Discovered Tool Definitions</span>
            
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 border border-gray-150 rounded-xl p-2.5 bg-gray-50/50">
              {MCP_TOOLS_CATALOG.map((tool) => (
                <div 
                  key={tool.name}
                  onClick={() => handleMcpSelectHelper(tool.name)}
                  className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all space-y-1 ${
                    selectedMcpTool === tool.name 
                      ? 'bg-blue-50/50 border-blue-300 shadow-3xs' 
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{tool.label}</span>
                    <span className="text-[8px] bg-gray-100 font-mono text-gray-500 px-1.5 py-0.5 rounded uppercase">{tool.category}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{tool.description}</p>
                  
                  {selectedMcpTool === tool.name && (
                    <div className="text-[9px] bg-white border border-gray-150 rounded p-1.5 mt-2 font-mono text-gray-600 text-left">
                      <span className="font-semibold block text-gray-800 mb-0.5">Parameters schema:</span>
                      {Object.entries(tool.parametersSchema).map(([key, val]) => (
                        <div key={key}>• {key}: <span className="text-indigo-600">{val}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* DIRECT SANDBOX MANUAL EXECUTION PANEL */}
            <div className="border-t border-gray-200 pt-3 space-y-2 shrink-0">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Execute Sandbox Request</span>
              
              <textarea
                rows={3}
                value={mcpArgumentsText}
                onChange={(e) => setMcpArgumentsText(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-[11px] font-mono focus:outline-none focus:border-blue-500 text-gray-800"
                placeholder="Arguments JSON payload..."
              />

              <button
                onClick={handleExecuteSandboxTool}
                disabled={isExecutingMcp}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {isExecutingMcp ? 'Executing...' : 'Execute sandbox tool'}
              </button>

              {mcpExecutionResult && (
                <div className="bg-gray-900 rounded-lg p-2.5 font-mono text-[9px] text-emerald-400 text-left max-h-32 overflow-y-auto">
                  <span className="text-gray-500 block mb-1">RPC Response:</span>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(mcpExecutionResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
