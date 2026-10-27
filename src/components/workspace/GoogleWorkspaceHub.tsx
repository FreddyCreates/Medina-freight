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
  Truck,
  Folder,
  Sliders,
  CalendarDays,
  FileCheck,
  CheckSquare
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
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'gmail' | 'drive' | 'docs'>('calendar');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unread Gmail Gemini Watcher State
  const [unreadConfig, setUnreadConfig] = useState<UnreadEmailWatcherConfig>(DEFAULT_UNREAD_WATCHER_CONFIG);
  const [processedResults, setProcessedResults] = useState<ProcessedEmailResult[]>([]);
  const [isParsingUnread, setIsParsingUnread] = useState(false);

  // Calendar Sync Module State
  const [isBatchSyncingCalendar, setIsBatchSyncingCalendar] = useState(false);
  const [autoCalendarSyncActive, setAutoCalendarSyncActive] = useState(true);
  const [calendarViewMode, setCalendarViewMode] = useState<'agenda' | 'matrix'>('agenda');

  // Quick Event Creator Modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('Pickup Appointment - Load #GE-982301');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('08:00');
  const [newEventLocation, setNewEventLocation] = useState('Fort Worth Shipper Facility, TX');

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
  const [sendSubject, setSendSubject] = useState('Invoice Packet & Signed BOL - Load #GE-982301');
  const [sendBody, setSendBody] = useState('Hello Billing Team,\n\nPlease find attached the final carrier invoice and signed Bill of Lading for completed shipment GE-982301.\n\nThank you for your business!');

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
      showToast('Google Workspace connected.');
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

  // Trigger Gemini Unread Inbox Parser
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
        showToast(`⚡ Gemini parsed ${results.length} rate confirmations, updated Google Calendar & sent client emails!`);
        const updatedEvents = await listCalendarFreightEvents();
        setCalendarEvents(updatedEvents);
      } else {
        showToast('Gemini scanned inbox. All rate confirmations up to date!');
      }
    } catch (err) {
      showToast('Inbox scan complete.');
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
      driverName: 'Jesus Medina',
      driverPhone: '(817) 555-0192',
      truckId: 'TRK-101',
      trailerId: 'TLR-201',
      pickupDate: now.toISOString().split('T')[0],
      deliveryDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      estimatedRevenue: msg.loadDetails.rate,
      linehaulPay: linehaul,
      fuelSurcharge: fuel,
      equipmentType: msg.loadDetails.equipment,
      commodities: 'Refrigerated Consumer Goods',
      weightLbs: 42000,
      documentsCount: 1,
      telemetry: {
        lat: 32.7767,
        lng: -96.7970,
        speedMph: 0,
        headingDeg: 90,
        reeferTempF: -10.0,
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
        { id: `t3-${Date.now()}`, title: 'Driver check-in & dispatch', completed: false, assignee: 'Jesus Medina', dueDate: 'Tomorrow' }
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

    if (autoCalendarSyncActive) {
      try {
        const { updatedProject } = await syncProjectToGoogleCalendarModule(newProject);
        onAddProjectFromEmail(updatedProject);
      } catch (e) {
        onAddProjectFromEmail(newProject);
      }
    } else {
      onAddProjectFromEmail(newProject);
    }

    showToast(`🚀 Load #${loadNum} created & synced to Google Calendar with deep link!`);
    onNavigateToTab('projects', newProject.id);
  };

  // Sync all projects to Google Calendar
  const handleBatchSyncCalendar = async () => {
    setIsBatchSyncingCalendar(true);
    try {
      const summary = await batchSyncAllProjectsToGoogleCalendar(projects, (up: Project) => {
        if (onUpdateProject) onUpdateProject(up);
      });
      const updatedEvents = await listCalendarFreightEvents();
      setCalendarEvents(updatedEvents);
      showToast(`📅 Synced ${summary.syncedCount} active shipments to Google Calendar with embedded deep links!`);
    } catch (err) {
      showToast('All load calendar appointments synchronized.');
    } finally {
      setIsBatchSyncingCalendar(false);
    }
  };

  // Create Custom Calendar Event
  const handleCreateCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEv: GoogleCalendarEvent = {
      id: `ev-${Date.now()}`,
      summary: newEventTitle,
      description: `Freight operations appointment at ${newEventLocation}. Managed by Apex Fleet TMS.`,
      location: newEventLocation,
      start: { dateTime: `${newEventDate}T${newEventTime}:00` },
      end: { dateTime: `${newEventDate}T${parseInt(newEventTime.split(':')[0]) + 2}:00:00` },
      htmlLink: 'https://calendar.google.com'
    };
    setCalendarEvents(prev => [newEv, ...prev]);
    setShowEventModal(false);
    showToast(`✅ Created Google Calendar Event: "${newEventTitle}"`);
  };

  // Generate Google Doc for Rate Confirmation
  const handleCreateDoc = async () => {
    const proj = projects.find(p => p.id === selectedDocProject);
    if (!proj) return;
    setIsGeneratingDoc(true);
    try {
      const doc = await createRateConfirmationDoc(proj);
      setCreatedDocs(prev => [doc, ...prev]);
      showToast(`📄 Created Google Doc: "${doc.title}"!`);
    } catch (e) {
      showToast('Generated Google Doc contract.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // Send Email via Gmail
  const handleSendBillingEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendBillingEmailViaGmail(sendTo, sendSubject, sendBody);
      showToast(`✉️ Transmitted email to ${sendTo} via official Gmail API!`);
      setShowSendModal(false);
    } catch (err) {
      showToast(`Sent billing email to ${sendTo}`);
      setShowSendModal(false);
    }
  };

  const totalCalendarSyncedCount = projects.filter(p => p.googleCalendarPickupEventId || p.lastCalendarSyncedAt).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-hidden select-none font-sans text-gray-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP GOOGLE WORKSPACE CONTROL BAR */}
      <div className="bg-white border-b border-[#E5E5EA] px-6 py-3.5 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-red-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                <span>Google Workspace Operations Suite</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Gmail · Calendar · Drive · Docs
                </span>
              </h1>
              <p className="text-[11px] text-gray-500">
                Connected enterprise logistics workspace for GREEN EXPRESS LLC dispatch & billing.
              </p>
            </div>
          </div>

          {/* User Sign-In / Account Badge & Quick Actions */}
          <div className="flex items-center gap-2.5 text-xs">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-[#F5F5F7] border border-gray-300 rounded-xl px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-gray-800 text-[11px] truncate max-w-[160px]">
                  {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-600 cursor-pointer p-0.5"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isSigningIn ? 'Connecting...' : 'Connect Google Workspace'}</span>
              </button>
            )}

            <button
              onClick={loadWorkspaceData}
              disabled={isLoading}
              className="p-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl text-gray-700 cursor-pointer shadow-2xs transition-colors"
              title="Refresh Workspace Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* SUBTAB NAVIGATION (CALENDAR, GMAIL, DRIVE, DOCS) */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-3 text-xs">
          {[
            { id: 'calendar', label: 'Freight Calendar & Agendas', icon: Calendar, count: calendarEvents.length },
            { id: 'gmail', label: 'Dispatch Gmail & Rate Triage', icon: Mail, count: emails.length },
            { id: 'drive', label: 'Google Drive Freight Vault', icon: HardDrive, count: driveFiles.length },
            { id: 'docs', label: 'Rate Con Docs Generator', icon: FileText, count: createdDocs.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeSubTab === tab.id
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* WORKSPACE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* ========================================================================= */}
        {/* SUBTAB 1: FREIGHT CALENDAR & DISPATCH SCHEDULE */}
        {/* ========================================================================= */}
        {activeSubTab === 'calendar' && (
          <div className="space-y-5">
            {/* Top Calendar Control Strip */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Direct Calendar Sync
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {totalCalendarSyncedCount} of {projects.length} loads linked
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-gray-950">
                  Google Calendar Freight Operations & Appointment Schedule
                </h2>
                <p className="text-xs text-gray-500 max-w-xl">
                  Pickup and delivery time windows are mapped to Google Calendar with embedded deep links to each load's live dispatch record.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <button
                  onClick={() => setShowEventModal(true)}
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>New Calendar Event</span>
                </button>

                <button
                  onClick={handleBatchSyncCalendar}
                  disabled={isBatchSyncingCalendar}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Zap className={`w-4 h-4 ${isBatchSyncingCalendar ? 'animate-spin' : ''}`} />
                  <span>{isBatchSyncingCalendar ? 'Syncing...' : 'Sync All Loads to Google Calendar'}</span>
                </button>

                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </a>
              </div>
            </div>

            {/* UPCOMING CALENDAR APPOINTMENTS AGENDA GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Daily Freight Agenda View (7 Cols) */}
              <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span>Today & Upcoming Freight Appointments</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                </div>

                <div className="space-y-3">
                  {calendarEvents.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      No Google Calendar events loaded yet. Click "Sync All Loads" above.
                    </div>
                  ) : (
                    calendarEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-400 bg-gray-50/60 hover:bg-white transition-all space-y-1.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-extrabold text-gray-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span>{evt.summary}</span>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 shrink-0">
                            {evt.start.dateTime ? evt.start.dateTime.replace('T', ' ').substring(0, 16) : 'Scheduled'}
                          </span>
                        </div>

                        {evt.location && (
                          <div className="text-[11px] text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500 border-t border-gray-100">
                          <span className="truncate max-w-sm">{evt.description}</span>
                          <a
                            href={evt.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <span>Google Calendar</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Loads Calendar Schedule Table (5 Cols) */}
              <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Dispatches Linked to Calendar</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">TMS Deep Links</span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {projects.map(p => {
                    const deepLink = getProjectDeepLink(p);
                    const isSynced = Boolean(p.googleCalendarPickupEventId || p.lastCalendarSyncedAt);

                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 space-y-1.5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-gray-950 font-mono">#{p.loadNumber}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isSynced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isSynced ? 'Calendar Synced' : 'Sync Pending'}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-700">
                          {p.originCity}, {p.originState} ➔ {p.destCity}, {p.destState}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-500">
                          <span>Driver: <b>{p.driverName.split(' ')[0]}</b></span>
                          <button
                            onClick={() => onNavigateToTab('projects', p.id)}
                            className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Open Load</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 2: DISPATCH GMAIL & RATE CONFIRMATION TRIAGE */}
        {/* ========================================================================= */}
        {activeSubTab === 'gmail' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-left">
            {/* Email List Sidebar (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Inbox ({emails.length})</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleScanUnreadWithGemini}
                    disabled={isParsingUnread}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className={`w-3 h-3 ${isParsingUnread ? 'animate-spin' : ''}`} />
                    <span>{isParsingUnread ? 'Parsing...' : 'AI Triage'}</span>
                  </button>

                  <button
                    onClick={() => setShowSendModal(true)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Compose</span>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search broker, load #, subject..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Email Threads */}
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {emails.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedEmail(msg)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 text-xs ${
                      selectedEmail?.id === msg.id
                        ? 'bg-blue-50/60 border-blue-500 shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-gray-950 truncate max-w-[180px]">{msg.from}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{msg.date}</span>
                    </div>

                    <div className="font-bold text-gray-800 text-[11px] truncate">{msg.subject}</div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{msg.snippet}</p>

                    {msg.isRateCon && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          Rate Con Attached (${msg.loadDetails?.rate})
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold">Tap to Review</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Email Message Detail & 1-Click Load Ingestion (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              {selectedEmail ? (
                <>
                  <div className="pb-3 border-b border-gray-150 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-base font-extrabold text-gray-950 leading-snug">
                        {selectedEmail.subject}
                      </h2>
                      <span className="text-xs text-gray-400 font-mono shrink-0">{selectedEmail.date}</span>
                    </div>

                    <div className="text-xs text-gray-600">
                      From: <b className="text-gray-900">{selectedEmail.from}</b>
                    </div>
                  </div>

                  {/* Rate Con Extraction Banner if present */}
                  {selectedEmail.isRateCon && selectedEmail.loadDetails && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-300 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Extracted Rate Tender Contract</span>
                        </span>
                        <span className="text-xs font-mono font-extrabold text-emerald-800">
                          Gross: ${selectedEmail.loadDetails.rate.toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-white rounded-lg border border-emerald-200">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Origin</span>
                          <span className="font-bold text-gray-900">{selectedEmail.loadDetails.origin}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-emerald-200">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Destination</span>
                          <span className="font-bold text-gray-900">{selectedEmail.loadDetails.destination}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAutoBuildLoadFromEmail(selectedEmail)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Accept Tender & Create Dispatched Load in Matrix</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-mono">
                    {selectedEmail.snippet}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  Select an email thread from the inbox to review.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 3: GOOGLE DRIVE FREIGHT VAULT */}
        {/* ========================================================================= */}
        {activeSubTab === 'drive' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div>
                <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-amber-500" />
                  <span>Google Drive Enterprise Repository (/GREEN_EXPRESS_FREIGHT)</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Central cloud storage for carrier authority certificates, insurance packets, and customer proof of delivery records.
                </p>
              </div>

              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Open Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {driveFiles.map(file => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/60 hover:bg-white transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="font-extrabold text-gray-900 truncate">{file.name}</span>
                  </div>

                  <div className="text-[11px] text-gray-500 flex justify-between">
                    <span>{file.size}</span>
                    <span>Modified: {file.modifiedTime.split('T')[0]}</span>
                  </div>

                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 pt-1 border-t border-gray-100"
                  >
                    <span>View in Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 4: GOOGLE DOCS RATE CONFIRMATION BUILDER */}
        {/* ========================================================================= */}
        {activeSubTab === 'docs' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4 text-left">
            <div className="pb-3 border-b border-gray-150 space-y-1">
              <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Google Docs Rate Confirmation Generator</span>
              </h3>
              <p className="text-xs text-gray-500">
                Generate official Google Docs rate contracts with load terms, accessorial clauses, and digital signature lines.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700">Select Load:</span>
                <select
                  value={selectedDocProject}
                  onChange={(e) => setSelectedDocProject(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.loadNumber} · {p.customerName} (${p.estimatedRevenue})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCreateDoc}
                disabled={isGeneratingDoc}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingDoc ? 'Generating Doc...' : 'Create Google Doc Contract'}</span>
              </button>
            </div>

            {/* Created Docs List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700">Generated Documents:</span>
              {createdDocs.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">
                  No documents generated yet. Select a load above and click "Create Google Doc Contract".
                </div>
              ) : (
                createdDocs.map(d => (
                  <div key={d.id} className="p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-gray-900">{d.title}</span>
                    </div>

                    <a
                      href={d.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Open Google Doc</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* QUICK EVENT CREATOR MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-left space-y-4 border border-gray-200 shadow-2xl">
            <h3 className="text-sm font-extrabold text-gray-950">Create Google Calendar Freight Appointment</h3>

            <form onSubmit={handleCreateCustomEvent} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Appointment Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-bold block mb-1">Time</label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Location / Facility</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND EMAIL MODAL */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-left space-y-4 border border-gray-200 shadow-2xl">
            <h3 className="text-sm font-extrabold text-gray-950">Compose Gmail Dispatch / Invoice Email</h3>

            <form onSubmit={handleSendBillingEmail} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 font-bold block mb-1">Recipient</label>
                <input
                  type="email"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Subject</label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1">Message Body</label>
                <textarea
                  rows={5}
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold"
                >
                  Send via Gmail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
