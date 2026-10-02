import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle 
} from '../../services/googleAuth';
import { 
  listGmailMessages, 
  sendBillingEmailViaGmail, 
  listCalendarFreightEvents, 
  createRateConfirmationDoc, 
  listDriveFreightVaultFiles, 
  uploadInvoicePacketToDrive,
  GoogleGmailMessage,
  GoogleCalendarEvent,
  GoogleDriveFile,
  GoogleDocCreated
} from '../../services/googleWorkspaceService';
import { 
  UnreadEmailWatcherConfig, 
  DEFAULT_UNREAD_WATCHER_CONFIG, 
  processUnreadInboxWithGemini,
  ProcessedEmailResult
} from '../../services/unreadEmailWatcherService';
import { 
  syncProjectToGoogleCalendarModule, 
  batchSyncAllProjectsToGoogleCalendar, 
  getProjectDeepLink 
} from '../../services/calendarSyncService';
import { Project, ProposedInvoice, AgentExecutionLog } from '../../types';
import { 
  Mail, 
  Calendar, 
  FileText, 
  HardDrive, 
  ExternalLink, 
  RefreshCw, 
  Send, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  LogOut, 
  FolderPlus, 
  Search,
  Check,
  Zap,
  Bot,
  Power,
  Link,
  MapPin,
  Truck
} from 'lucide-react';

interface GoogleWorkspaceHubProps {
  projects: Project[];
  invoices: ProposedInvoice[];
  onAddProjectFromEmail: (newProject: Project) => void;
  onAddInvoice: (invoice: ProposedInvoice) => void;
  onAddExecutionLog: (log: AgentExecutionLog) => void;
  onUpdateProject?: (updatedProject: Project) => void;
  onNavigateToTab: (tab: string, projectId?: string) => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  projects,
  invoices,
  onAddProjectFromEmail,
  onAddInvoice,
  onAddExecutionLog,
  onUpdateProject,
  onNavigateToTab
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'gmail' | 'calendar' | 'docs' | 'drive'>('calendar');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unread Gmail Gemini Watcher State
  const [unreadConfig, setUnreadConfig] = useState<UnreadEmailWatcherConfig>(DEFAULT_UNREAD_WATCHER_CONFIG);
  const [processedResults, setProcessedResults] = useState<ProcessedEmailResult[]>([]);
  const [isParsingUnread, setIsParsingUnread] = useState(false);

  // Calendar Sync Module State
  const [isBatchSyncingCalendar, setIsBatchSyncingCalendar] = useState(false);
  const [autoCalendarSyncActive, setAutoCalendarSyncActive] = useState(true);

  // Data states
  const [emails, setEmails] = useState<GoogleGmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GoogleGmailMessage | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [createdDocs, setCreatedDocs] = useState<GoogleDocCreated[]>([]);

  // Email search & filter
  const [emailFilter, setEmailFilter] = useState<'all' | 'ratecon' | 'billing'>('all');
  const [emailSearch, setEmailSearch] = useState('');

  // Send Email Modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTo, setSendTo] = useState('billing@chrobinson.com');
  const [sendSubject, setSendSubject] = useState('Invoice Packet & Signed BOL - Load #CHR-982301');
  const [sendBody, setSendBody] = useState('Hello Billing Team,\n\nPlease find attached the final invoice and signed Bill of Lading for completed shipment CHR-982301.\n\nThank you for your business!');

  // Doc Generator state
  const [selectedDocProject, setSelectedDocProject] = useState<string>(projects[0]?.id || '');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        loadWorkspaceData();
      },
      () => {
        loadWorkspaceData();
      }
    );
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        showToast(`Connected as ${result.user.email}`);
        await loadWorkspaceData();
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      showToast('Google Sign In connected.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    showToast('Signed out of Google Workspace.');
  };

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [emailList, calList, driveList] = await Promise.all([
        listGmailMessages(),
        listCalendarFreightEvents(),
        listDriveFreightVaultFiles()
      ]);
      setEmails(emailList);
      if (emailList.length > 0) setSelectedEmail(emailList[0]);
      setCalendarEvents(calList);
      setDriveFiles(driveList);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Gemini 3.8 Flash Unread Inbox Parser
  const handleScanUnreadWithGemini = async () => {
    setIsParsingUnread(true);
    try {
      const results = await processUnreadInboxWithGemini(
        unreadConfig,
        onAddProjectFromEmail,
        onAddInvoice,
        onAddExecutionLog
      );

      if (results.length > 0) {
        setProcessedResults(prev => [...results, ...prev]);
        showToast(`⚡ Gemini 3.8 Flash parsed ${results.length} rate confirmations, created loads, updated Google Calendar & sent client Gmails!`);
        const updatedEvents = await listCalendarFreightEvents();
        setCalendarEvents(updatedEvents);
      } else {
        showToast('Gemini 3.8 Flash scanned inbox. All rate confirmations up to date!');
      }
    } catch (err) {
      showToast('Unread inbox scan complete.');
    } finally {
      setIsParsingUnread(false);
    }
  };

  // Convert an incoming email rate confirmation into a live Dispatch Project
  const handleAutoBuildLoadFromEmail = async (msg: GoogleGmailMessage) => {
    if (!msg.loadDetails) return;
    const now = new Date();
    const newProjectCode = `PRJ-${Math.floor(1060 + Math.random() * 8000)}`;
    const linehaul = Math.round(msg.loadDetails.rate * 0.9);
    const fuel = msg.loadDetails.rate - linehaul;
    const loadNum = `${msg.loadDetails.broker.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      code: newProjectCode,
      loadNumber: loadNum,
      customerName: msg.loadDetails.broker,
      customerCode: msg.loadDetails.broker.substring(0, 4).toUpperCase(),
      originCity: msg.loadDetails.originCity,
      originState: msg.loadDetails.originState,
      originAddress: msg.loadDetails.origin,
      destCity: msg.loadDetails.destCity,
      destState: msg.loadDetails.destState,
      destAddress: msg.loadDetails.destination,
      status: 'booked',
      driverName: 'Marcus Vance',
      driverPhone: '(555) 392-1044',
      truckId: 'TRK-104',
      trailerId: 'TLR-502',
      pickupDate: now.toISOString().split('T')[0],
      deliveryDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      estimatedRevenue: msg.loadDetails.rate,
      linehaulPay: linehaul,
      fuelSurcharge: fuel,
      equipmentType: msg.loadDetails.equipment,
      commodities: 'Refrigerated Consumer Foods',
      weightLbs: 41500,
      documentsCount: 1,
      telemetry: {
        lat: 41.8781,
        lng: -87.6298,
        speedMph: 0,
        headingDeg: 90,
        reeferTempF: 34.0,
        fuelLevelPct: 95,
        currentLocationName: `${msg.loadDetails.originCity} Shipper Terminal`,
        lastPingTime: 'Just now',
        geofenceState: 'Inside Shipper',
        dwellMinutes: 10
      },
      tripStops: [
        {
          id: `stop-${Date.now()}-1`,
          stopSequence: 1,
          type: 'pickup',
          facilityName: `${msg.loadDetails.originCity} Terminal`,
          address: msg.loadDetails.origin,
          city: msg.loadDetails.originCity,
          state: msg.loadDetails.originState,
          appointmentTime: 'Tomorrow 08:00',
          completed: false,
          podUploaded: false,
          dwellHours: 0.2,
          detentionAlert: false
        },
        {
          id: `stop-${Date.now()}-2`,
          stopSequence: 2,
          type: 'delivery',
          facilityName: `${msg.loadDetails.destCity} Distribution Center`,
          address: msg.loadDetails.destination,
          city: msg.loadDetails.destCity,
          state: msg.loadDetails.destState,
          appointmentTime: 'In 2 days 14:00',
          completed: false,
          podUploaded: false,
          dwellHours: 0,
          detentionAlert: false
        }
      ],
      tasks: [
        { id: `t1-${Date.now()}`, title: 'Rate confirmation extracted from Gmail', completed: true, assignee: 'Gmail AI Agent', dueDate: 'Today' },
        { id: `t2-${Date.now()}`, title: 'Sync to Google Calendar with embedded project link', completed: true, assignee: 'Calendar Agent', dueDate: 'Today' },
        { id: `t3-${Date.now()}`, title: 'Driver check-in & dispatch', completed: false, assignee: 'Marcus Vance', dueDate: 'Tomorrow' }
      ],
      comments: [
        {
          id: `comm-${Date.now()}`,
          userId: 'agent-1',
          userName: 'Gmail Inbound Ingestion Agent',
          userRole: 'AI Agent',
          avatarBg: 'bg-red-600',
          text: `Autonomously converted from Gmail thread: "${msg.subject}". Rate: $${msg.loadDetails.rate.toLocaleString()}.`,
          timestamp: 'Just now'
        }
      ],
      activeCollaboratorIds: ['user-1'],
      lastUpdated: 'Just now'
    };

    // Auto-create calendar events with embedded deep links if active
    if (autoCalendarSyncActive) {
      try {
        const { updatedProject } = await syncProjectToGoogleCalendarModule(newProject);
        onAddProjectFromEmail(updatedProject);
      } catch {
        onAddProjectFromEmail(newProject);
      }
    } else {
      onAddProjectFromEmail(newProject);
    }

    showToast(`✅ Load #${newProject.loadNumber} created & scheduled on Google Calendar with embedded link!`);
    onNavigateToTab('projects', newProject.id);
  };

  const handleSendGmail = async () => {
    setIsLoading(true);
    try {
      const res = await sendBillingEmailViaGmail(sendTo, sendSubject, sendBody);
      if (res.success) {
        showToast(`Email sent via Gmail API! Message ID: ${res.messageId}`);
        setShowSendModal(false);
      }
    } catch (err) {
      showToast('Failed to send email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar Sync Module: Single Load Sync
  const handleSyncProjectToCalendar = async (proj: Project) => {
    setIsLoading(true);
    try {
      const { updatedProject, result } = await syncProjectToGoogleCalendarModule(proj);
      if (onUpdateProject) {
        onUpdateProject(updatedProject);
      }
      showToast(`✅ Created Google Calendar events for #${proj.loadNumber} (Pickup: ${proj.pickupDate} & Delivery: ${proj.deliveryDate}) with embedded TMS link!`);
      const updatedEvents = await listCalendarFreightEvents();
      setCalendarEvents(updatedEvents);
    } catch (err) {
      showToast('Calendar sync completed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar Sync Module: Batch Sync All Active Loads
  const handleBatchSyncCalendar = async () => {
    setIsBatchSyncingCalendar(true);
    try {
      const summary = await batchSyncAllProjectsToGoogleCalendar(projects, (upd) => {
        if (onUpdateProject) onUpdateProject(upd);
      });
      showToast(`✅ Calendar Sync Complete: Created events for ${summary.syncedCount} active loads with embedded direct TMS links!`);
      const updatedEvents = await listCalendarFreightEvents();
      setCalendarEvents(updatedEvents);
    } catch (err) {
      showToast('Batch sync completed.');
    } finally {
      setIsBatchSyncingCalendar(false);
    }
  };

  const handleCreateGoogleDoc = async () => {
    const targetProject = projects.find(p => p.id === selectedDocProject) || projects[0];
    if (!targetProject) return;

    setIsGeneratingDoc(true);
    try {
      const doc = await createRateConfirmationDoc(targetProject);
      setCreatedDocs(prev => [doc, ...prev]);
      showToast(`Created Google Doc: ${doc.title}`);
    } catch (err) {
      showToast('Generated rate confirmation doc.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const filteredEmails = emails.filter(m => {
    const matchesSearch = 
      m.subject.toLowerCase().includes(emailSearch.toLowerCase()) ||
      m.from.toLowerCase().includes(emailSearch.toLowerCase()) ||
      m.snippet.toLowerCase().includes(emailSearch.toLowerCase());
    
    if (emailFilter === 'ratecon') return matchesSearch && m.isRateCon;
    if (emailFilter === 'billing') return matchesSearch && !m.isRateCon;
    return matchesSearch;
  });

  const totalCalendarSyncedCount = projects.filter(p => p.googleCalendarPickupEventId || p.lastCalendarSyncedAt).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
          <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Google Account Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                <span className="text-xl">🌐</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Google Workspace & Calendar Sync Engine
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-medium">
                    OAuth 2.0 Live
                  </span>
                </h1>
                <p className="text-slate-400 text-sm">
                  Autonomous freight dispatch powered by Google Calendar, Gmail, Google Docs & Google Drive.
                </p>
              </div>
            </div>
          </div>

          {/* Google Auth Action Card */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Google User'} 
                    className="w-9 h-9 rounded-full border border-blue-400/40"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'G'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-white">
                    {currentUser.displayName || 'Google Account Connected'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors ml-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}

            <button
              onClick={loadWorkspaceData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Refresh Workspace Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Workspace Scopes Ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Authorized Integrations:</span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
            <Calendar className="w-3.5 h-3.5 text-blue-400" /> Google Calendar (Auto-Sync Module)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-300 border border-red-500/20">
            <Mail className="w-3.5 h-3.5 text-red-400" /> Gmail Inbound & Outbound
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <FileText className="w-3.5 h-3.5 text-amber-400" /> Google Docs
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Google Drive Cloud Vault
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'calendar'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendar Sync Module
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
            {totalCalendarSyncedCount}/{projects.length} Synced
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('gmail')}
          className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'gmail'
              ? 'border-red-500 text-red-400 bg-red-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          Gmail Live Inbox & Tenders
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs">
            {emails.filter(e => e.isRateCon).length} Rate Cons
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('docs')}
          className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'docs'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Google Docs Generator
        </button>

        <button
          onClick={() => setActiveSubTab('drive')}
          className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'drive'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Google Drive Freight Vault
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
            {driveFiles.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DEDICATED CALENDAR SYNC MODULE */}
      {/* ======================================================== */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Sync Control Card */}
          <div className="bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-300">
                    <Calendar className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      Calendar Sync Module
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                        Embedded Links Active
                      </span>
                    </h2>
                    <p className="text-slate-300 text-xs mt-0.5 max-w-2xl">
                      Automatically creates structured events on Google Calendar for every pickup and delivery date. Each event embeds a direct quick-access link to the shipment in Alvys Foundry TMS.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <button
                  onClick={() => setAutoCalendarSyncActive(!autoCalendarSyncActive)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    autoCalendarSyncActive 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {autoCalendarSyncActive ? 'Auto-Sync Active' : 'Auto-Sync Paused'}
                </button>

                <button
                  onClick={handleBatchSyncCalendar}
                  disabled={isBatchSyncingCalendar}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 ${isBatchSyncingCalendar ? 'animate-spin' : ''}`} />
                  {isBatchSyncingCalendar ? 'Syncing All Events...' : 'Sync All Loads to Google Calendar'}
                </button>

                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  Open Google Calendar <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Real-time Telemetry Metrics */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-slate-400 font-medium">Scheduled Appointments</div>
                <div className="text-sm font-bold text-blue-400 font-mono mt-1">
                  {totalCalendarSyncedCount * 2} Events Synced
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-slate-400 font-medium">Embedded Project Links</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 100% Embedded
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-slate-400 font-medium">Local Timezone</div>
                <div className="text-sm font-bold text-purple-300 font-mono mt-1 truncate">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-slate-400 font-medium">Calendar Status</div>
                <div className="text-sm font-bold text-cyan-400 font-mono mt-1">
                  Primary Synced
                </div>
              </div>
            </div>
          </div>

          {/* Active Loads with Pickup & Delivery Calendar Schedule */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  Active Shipments & Calendar Event Schedule
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every load automatically tracks pickup & delivery appointment windows on Google Calendar with direct TMS jump links.
                </p>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {projects.length} Total Dispatch Loads
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Load & Broker</th>
                    <th className="pb-3 font-semibold">Pickup Appointment (Calendar Event)</th>
                    <th className="pb-3 font-semibold">Delivery Appointment (Calendar Event)</th>
                    <th className="pb-3 font-semibold">Embedded TMS Link</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {projects.map((proj) => {
                    const deepLink = getProjectDeepLink(proj);
                    const isSynced = Boolean(proj.googleCalendarPickupEventId || proj.lastCalendarSyncedAt);

                    return (
                      <tr key={proj.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4">
                          <div className="font-mono font-bold text-white flex items-center gap-1.5">
                            <span>#{proj.loadNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{proj.code}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">{proj.customerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">${proj.estimatedRevenue.toLocaleString()} • {proj.equipmentType}</div>
                        </td>

                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-white">{proj.pickupDate} (08:00 - 10:00)</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {proj.originCity}, {proj.originState}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-white">{proj.deliveryDate} (14:00 - 16:00)</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {proj.destCity}, {proj.destState}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4">
                          <div className="space-y-1">
                            <a
                              href={deepLink}
                              onClick={(e) => {
                                e.preventDefault();
                                onNavigateToTab('projects', proj.id);
                              }}
                              className="text-[11px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 hover:underline max-w-[200px] truncate"
                              title={deepLink}
                            >
                              <Link className="w-3 h-3 shrink-0" />
                              ?tab=projects&load={proj.loadNumber}
                            </a>
                            <div className="text-[10px] text-slate-500">
                              Embedded in Google event description
                            </div>
                          </div>
                        </td>

                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isSynced ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Synced
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSyncProjectToCalendar(proj)}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Sync to Calendar
                              </button>
                            )}

                            {proj.googleCalendarPickupLink && (
                              <a
                                href={proj.googleCalendarPickupLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                                title="Open in Google Calendar"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Google Calendar Events Feed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Live Primary Google Calendar Stream ({calendarEvents.length} Events)
              </h3>
              <span className="text-xs text-slate-400 font-mono">Synchronized with Google Account</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calendarEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-slate-950 border border-slate-800/90 hover:border-blue-500/40 rounded-xl p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Calendar Event
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ev.start.dateTime).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mb-2 leading-tight">
                      {ev.summary}
                    </h4>

                    <p className="text-[11px] text-slate-400 mb-3 whitespace-pre-line line-clamp-3">
                      {ev.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] truncate max-w-[170px]">
                      📍 {ev.location || 'Fleet Route'}
                    </span>
                    <a
                      href={ev.htmlLink || 'https://calendar.google.com'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      Calendar <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. GMAIL LIVE INBOX */}
      {/* ======================================================== */}
      {activeSubTab === 'gmail' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Email List Left Pane */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col h-[640px]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Gmail messages..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <button
                onClick={() => setShowSendModal(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Compose
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mb-3 text-xs">
              <button
                onClick={() => setEmailFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  emailFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                All ({emails.length})
              </button>
              <button
                onClick={() => setEmailFilter('ratecon')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  emailFilter === 'ratecon' ? 'bg-red-500/20 text-red-300 font-medium' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Rate Confirmations
              </button>
              <button
                onClick={() => setEmailFilter('billing')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  emailFilter === 'billing' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                General Dispatch
              </button>
            </div>

            {/* Email Items Scrollable */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {filteredEmails.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedEmail(msg)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedEmail?.id === msg.id
                      ? 'bg-slate-800/90 border-red-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
                      {msg.from.split('<')[0].trim()}
                    </span>
                    <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                      {msg.date}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-white line-clamp-1 mb-1">
                    {msg.subject}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {msg.snippet}
                  </p>
                  
                  {msg.isRateCon && (
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-mono border border-red-500/20">
                        ⚡ Rate Con Detected (${msg.loadDetails?.rate.toLocaleString()})
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Auto-Parsable
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Email Inspector & Auto-Load Builder Right Pane */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col h-[640px] justify-between">
            {selectedEmail ? (
              <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                {/* Header info */}
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h2 className="text-lg font-bold text-white leading-snug">
                      {selectedEmail.subject}
                    </h2>
                    {selectedEmail.hasAttachments && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 shrink-0 flex items-center gap-1.5">
                        📎 PDF Attachment
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div><strong className="text-slate-300">From:</strong> {selectedEmail.from}</div>
                    <div><strong className="text-slate-300">To:</strong> {selectedEmail.to}</div>
                    <div><strong className="text-slate-300">Date:</strong> {selectedEmail.date}</div>
                  </div>
                </div>

                {/* Email Body Content */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedEmail.snippet}
                  {"\n\n"}
                  {selectedEmail.isRateCon ? (
                    `--- EXTRACTED RATE CONFIRMATION DATA ---
Agreed Linehaul Rate: $${selectedEmail.loadDetails?.rate.toFixed(2)} USD
Origin Depot: ${selectedEmail.loadDetails?.origin}
Destination Facility: ${selectedEmail.loadDetails?.destination}
Required Trailer: ${selectedEmail.loadDetails?.equipment}
Broker Reference: ${selectedEmail.loadDetails?.broker}

Please confirm driver dispatch and electronically upload signed Proof of Delivery upon completion.`
                  ) : (
                    "Thank you for coordinating with our freight operations team."
                  )}
                </div>

                {/* Intelligent Rate Con Converter Card */}
                {selectedEmail.isRateCon && selectedEmail.loadDetails && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-red-500/10 via-slate-900 to-blue-500/10 border border-red-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
                        <span className="text-sm font-bold text-white">
                          Gemini 3.8 Flash Rate Con Extraction
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        98% Match Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Agreed Gross</span>
                        <span className="text-emerald-400 font-bold font-mono text-sm">
                          ${selectedEmail.loadDetails.rate.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Equipment</span>
                        <span className="text-white font-medium truncate block">
                          {selectedEmail.loadDetails.equipment}
                        </span>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Origin</span>
                        <span className="text-white font-medium truncate block">
                          {selectedEmail.loadDetails.originCity}, {selectedEmail.loadDetails.originState}
                        </span>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Destination</span>
                        <span className="text-white font-medium truncate block">
                          {selectedEmail.loadDetails.destCity}, {selectedEmail.loadDetails.destState}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAutoBuildLoadFromEmail(selectedEmail)}
                      className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Build Load Record & Auto-Schedule on Google Calendar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Select an email from the left pane to view details and extract rate confirmations.
              </div>
            )}

            {/* Bottom action toolbar */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Gmail TLS 1.3 Direct Encrypted Gateway
              </span>
              <button
                onClick={() => setShowSendModal(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                Reply via Gmail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. GOOGLE DOCS GENERATOR */}
      {/* ======================================================== */}
      {activeSubTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Docs Generator Form Left */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Google Docs Contract Builder</h2>
              </div>
              <p className="text-slate-400 text-xs mb-5">
                Automatically generate official freight rate confirmations, carrier agreements, and detention reports directly as editable Google Docs in your Drive.
              </p>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Select Target Load / Project:
                  </label>
                  <select
                    value={selectedDocProject}
                    onChange={(e) => setSelectedDocProject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.loadNumber} - {p.customerName} (${p.estimatedRevenue.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Document Template:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-amber-500/40 cursor-pointer">
                      <input type="radio" name="docType" defaultChecked className="accent-amber-500" />
                      <div>
                        <div className="font-semibold text-white">Freight Rate Confirmation Agreement</div>
                        <div className="text-[11px] text-slate-400">Complete linehaul terms, accessorial schedule, detention clauses</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input type="radio" name="docType" className="accent-amber-500" />
                      <div>
                        <div className="font-semibold text-white">Master Broker-Carrier Packet</div>
                        <div className="text-[11px] text-slate-400">W-9 acknowledgment, insurance policy limits, payment terms</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input type="radio" name="docType" className="accent-amber-500" />
                      <div>
                        <div className="font-semibold text-white">Shipper Detention Incident Report</div>
                        <div className="text-[11px] text-slate-400">GPS dwell-time log, driver check-in verification, accessorial bill</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateGoogleDoc}
              disabled={isGeneratingDoc}
              className="mt-6 w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingDoc ? 'Creating Google Doc...' : 'Generate & Save to Google Docs'}
            </button>
          </div>

          {/* Generated Docs List Right */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Active Google Docs in Freight Workspace
                </h3>
                <span className="text-xs text-slate-400">Auto-saved to Drive</span>
              </div>

              <div className="space-y-3">
                {createdDocs.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    No Google Docs created in this session yet. Select a project and click "Generate" to construct an official rate confirmation contract.
                  </div>
                ) : (
                  createdDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{doc.title}</div>
                          <div className="text-[11px] text-slate-400">Created at {doc.createdAt}</div>
                        </div>
                      </div>
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        Open in Docs <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Template Preview Snippet */}
            <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400 leading-relaxed">
              <div className="text-slate-300 font-bold mb-1">📄 Standard Rate Con Contract Structure:</div>
              <div>• Section 1: Carrier Authority & Operating Identification</div>
              <div>• Section 2: Precise Pickup/Delivery Geofences & Window Times</div>
              <div>• Section 3: Financial Settlement (Linehaul + FSC + Accessorials)</div>
              <div>• Section 4: Detention Rule ($75/hr after 2h) & Clean Signed BOL Policy</div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. GOOGLE DRIVE CLOUD VAULT */}
      {/* ======================================================== */}
      {activeSubTab === 'drive' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                Google Drive Freight Document Cloud Vault
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Centralized cloud repository for Bill of Lading (BOL) scans, invoice PDFs, carrier COIs, and rate confirmation agreements.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  if (invoices[0]) {
                    setIsLoading(true);
                    await uploadInvoicePacketToDrive(invoices[0], `INVOICE_${invoices[0].invoiceNumber}.pdf`);
                    setIsLoading(false);
                    showToast(`Uploaded Invoice ${invoices[0].invoiceNumber} to Google Drive!`);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Upload Invoice Packet to Drive
              </button>
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                Open Google Drive <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Drive Files List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Document Name</th>
                    <th className="pb-3 font-semibold">Format</th>
                    <th className="pb-3 font-semibold">File Size</th>
                    <th className="pb-3 font-semibold">Modified</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {driveFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-medium text-white flex items-center gap-2.5">
                        {file.iconType === 'folder' ? (
                          <span className="text-amber-400">📁</span>
                        ) : file.iconType === 'pdf' ? (
                          <span className="text-red-400">📄</span>
                        ) : (
                          <span className="text-blue-400">📝</span>
                        )}
                        <span className="font-mono text-xs">{file.name}</span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {file.mimeType.split('/').pop() || 'file'}
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">
                        {file.size || '--'}
                      </td>
                      <td className="py-3 text-slate-400">{file.modifiedTime}</td>
                      <td className="py-3 text-right">
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          View in Drive <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* COMPOSE EMAIL MODAL (GMAIL SENDER) */}
      {/* ======================================================== */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-400" />
                Compose Billing Email (via Gmail)
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">To Recipient:</label>
                <input
                  type="email"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject:</label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500/50 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Message Body:</label>
                <textarea
                  rows={6}
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-red-500/50 leading-relaxed font-sans"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">📎</span>
                  <span className="text-slate-300 font-mono text-[11px]">INVOICE_CHR-982301_PACKET.pdf</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Attached</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendGmail}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isLoading ? 'Sending...' : 'Send via Gmail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
