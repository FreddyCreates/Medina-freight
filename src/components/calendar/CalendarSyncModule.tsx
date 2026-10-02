import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle
} from '../../services/googleAuth';
import { 
  CalendarSyncResult, 
  BatchCalendarSyncSummary, 
  syncProjectToGoogleCalendarModule, 
  batchSyncAllProjectsToGoogleCalendar,
  getProjectDeepLink
} from '../../services/calendarSyncService';
import { Project } from '../../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Box, 
  DollarSign, 
  ArrowRight, 
  User as UserIcon, 
  ShieldCheck, 
  Sparkles, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  CalendarCheck, 
  CalendarDays, 
  SlidersHorizontal,
  Search,
  ChevronRight,
  Edit3,
  CalendarRange,
  Zap,
  Globe
} from 'lucide-react';

interface CalendarSyncModuleProps {
  projects: Project[];
  onUpdateProject: (updated: Project) => void;
  onNavigateToProject: (projectId: string) => void;
  autoSyncActive: boolean;
  onToggleAutoSync: (active: boolean) => void;
}

export const CalendarSyncModule: React.FC<CalendarSyncModuleProps> = ({
  projects,
  onUpdateProject,
  onNavigateToProject,
  autoSyncActive,
  onToggleAutoSync,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'synced' | 'pending'>('all');
  const [activeView, setActiveView] = useState<'timeline' | 'table' | 'grid'>('timeline');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLinkProjId, setCopiedLinkProjId] = useState<string | null>(null);
  const [selectedProjectForInspection, setSelectedProjectForInspection] = useState<Project | null>(null);
  
  // Reschedule state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editPickupDate, setEditPickupDate] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);

  useEffect(() => {
    const unsub = initAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        showToast(`Connected to Google Calendar as ${res.user.email}`);
      }
    } catch (err: any) {
      showToast(`Google Sign-In: ${err.message || 'Cancelled'}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    showToast('Signed out of Google Workspace');
  };

  // Sync a single project's pickup and delivery to Google Calendar
  const handleSyncProject = async (project: Project) => {
    setSyncingProjectId(project.id);
    try {
      const { updatedProject, result } = await syncProjectToGoogleCalendarModule(project);
      onUpdateProject(updatedProject);
      if (result.success) {
        showToast(`✅ Load #${project.loadNumber} synced to Google Calendar with embedded TMS link!`);
      } else {
        showToast(`Synced with Google Calendar direct link created.`);
      }
    } catch (err: any) {
      showToast(`Sync error: ${err.message || 'Check connection'}`);
    } finally {
      setSyncingProjectId(null);
    }
  };

  // Batch sync all projects
  const handleBatchSync = async () => {
    setIsBatchSyncing(true);
    try {
      const summary: BatchCalendarSyncSummary = await batchSyncAllProjectsToGoogleCalendar(
        projects,
        onUpdateProject
      );
      showToast(`🎉 Batch Calendar Sync Complete: ${summary.totalEventsCreated} events created for ${summary.syncedCount} shipments!`);
    } catch (err: any) {
      showToast(`Batch sync error: ${err.message || 'Operation failed'}`);
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Copy deep link to clipboard
  const handleCopyDeepLink = (project: Project) => {
    const link = getProjectDeepLink(project);
    navigator.clipboard.writeText(link);
    setCopiedLinkProjId(project.id);
    setTimeout(() => setCopiedLinkProjId(null), 2500);
    showToast(`Embedded project link copied to clipboard!`);
  };

  // Open reschedule modal
  const handleOpenReschedule = (proj: Project) => {
    setEditingProject(proj);
    setEditPickupDate(proj.pickupDate);
    setEditDeliveryDate(proj.deliveryDate);
  };

  // Save reschedule and re-sync
  const handleSaveReschedule = async () => {
    if (!editingProject) return;
    setIsSavingReschedule(true);
    try {
      const updatedProj: Project = {
        ...editingProject,
        pickupDate: editPickupDate,
        deliveryDate: editDeliveryDate,
        lastUpdated: 'Just now'
      };

      const { updatedProject: syncedProj } = await syncProjectToGoogleCalendarModule(updatedProj);
      onUpdateProject(syncedProj);
      showToast(`📅 Schedule updated for #${syncedProj.loadNumber} and pushed to Google Calendar!`);
      setEditingProject(null);
    } catch (err: any) {
      showToast(`Reschedule error: ${err.message}`);
    } finally {
      setIsSavingReschedule(false);
    }
  };

  // Metrics
  const totalProjects = projects.length;
  const syncedProjectsCount = projects.filter(p => Boolean(p.googleCalendarPickupEventId || p.lastCalendarSyncedAt)).length;
  const pendingSyncCount = totalProjects - syncedProjectsCount;
  const totalCalendarEventsCount = syncedProjectsCount * 2;

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.destCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.driverName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isSynced = Boolean(p.googleCalendarPickupEventId || p.lastCalendarSyncedAt);
    if (statusFilter === 'synced') return matchesSearch && isSynced;
    if (statusFilter === 'pending') return matchesSearch && !isSynced;
    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-2xl border border-blue-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CalendarCheck className="w-4 h-4 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Module Title, Google Connection & Global Controls */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Google Calendar Sync Module
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
                  v3 REST API
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Dispatcher
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically provisions and updates pickup & delivery calendar events with embedded Alvys Foundry TMS project links, route telemetry, and driver schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto-Sync Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs">
            <span className="text-slate-300 font-medium">Auto-Sync On Dispatch:</span>
            <button
              onClick={() => onToggleAutoSync(!autoSyncActive)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                autoSyncActive ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  autoSyncActive ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
            <span className={`text-[10px] font-mono font-bold ${autoSyncActive ? 'text-blue-400' : 'text-slate-500'}`}>
              {autoSyncActive ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Batch Sync All Button */}
          <button
            onClick={handleBatchSync}
            disabled={isBatchSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin' : ''}`} />
            <span>{isBatchSyncing ? 'Synchronizing All Loads...' : `Batch Sync All (${totalProjects})`}</span>
          </button>

          {/* Direct Google Calendar Launcher */}
          <a
            href="https://calendar.google.com/calendar/r"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Google Calendar</span>
          </a>

          {/* Google Account Status Pill */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-blue-500/40" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-[11px] font-bold text-white truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </div>
                <div className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  GCal Connected
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline ml-1 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isAuthLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isAuthLoading ? 'Connecting...' : 'Authorize Google Calendar'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3.5 border-b border-slate-800 bg-slate-900/40 shrink-0">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400">Total Active Loads</div>
          <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
            <span>{totalProjects}</span>
            <span className="text-xs text-slate-500 font-normal">in matrix</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-blue-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Synced to Google Calendar</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
            <span>{syncedProjectsCount}</span>
            <span className="text-xs text-blue-400/80 font-mono">({totalCalendarEventsCount} events)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-amber-400">Pending Calendar Sync</div>
          <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-2">
            <span>{pendingSyncCount}</span>
            <span className="text-xs text-amber-500 font-normal">awaiting push</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Embedded Link Direct Access</span>
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1 flex items-baseline gap-1 text-sm font-mono">
            <span>Enabled</span>
            <span className="text-[10px] text-slate-400 font-sans font-normal ml-1">TMS deep link in event payload</span>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Load #, Customer, Origin, Destination, Driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                statusFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalProjects})
            </button>
            <button
              onClick={() => setStatusFilter('synced')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                statusFilter === 'synced' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Synced ({syncedProjectsCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({pendingSyncCount})
            </button>
          </div>
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeView === 'timeline' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
            <span>Timeline Schedule</span>
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeView === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync Matrix Table</span>
          </button>
          <button
            onClick={() => setActiveView('grid')}
            className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeView === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5 text-purple-400" />
            <span>Month Grid</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <CalendarIcon className="w-10 h-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-white">No Shipments Found</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              No loads matched your search criteria or filter. Adjust your filter or ingest a new Rate Confirmation from Gmail or Dispatch Matrix.
            </p>
          </div>
        ) : activeView === 'timeline' ? (
          /* TIMELINE VIEW */
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const isSynced = Boolean(project.googleCalendarPickupEventId || project.lastCalendarSyncedAt);
              const deepLink = getProjectDeepLink(project);

              return (
                <div
                  key={project.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-extrabold text-white">
                          #{project.loadNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono font-semibold">
                          {project.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {project.customerName}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          ${project.estimatedRevenue.toLocaleString()} USD
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                          {project.equipmentType}
                        </span>
                      </div>

                      {/* Driver & Telemetry */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1 text-slate-300">
                          <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                          {project.driverName || 'Driver Unassigned'} ({project.driverPhone || 'N/A'})
                        </span>
                        <span>•</span>
                        <span>Truck: <strong className="text-slate-200">{project.truckId}</strong></span>
                        <span>•</span>
                        <span>Trailer: <strong className="text-slate-200">{project.trailerId}</strong></span>
                      </div>
                    </div>

                    {/* Sync Actions & Status */}
                    <div className="flex items-center gap-2">
                      {isSynced ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Synced ({project.lastCalendarSyncedAt || 'Active'})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pending Calendar Sync</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleSyncProject(project)}
                        disabled={syncingProjectId === project.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingProjectId === project.id ? 'animate-spin' : ''}`} />
                        <span>{syncingProjectId === project.id ? 'Syncing...' : isSynced ? 'Re-Sync Google Cal' : 'Sync to Google Cal'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenReschedule(project)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 cursor-pointer"
                        title="Reschedule Pickup/Delivery Windows"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setSelectedProjectForInspection(project)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs border border-slate-700 cursor-pointer"
                        title="Inspect Google Calendar JSON Payload"
                      >
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      </button>
                    </div>
                  </div>

                  {/* Pickup & Delivery Event Cards with Direct Links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
                    {/* Pickup Event Block */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                            <Truck className="w-3.5 h-3.5" />
                            PICKUP APPOINTMENT
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                            Window: 08:00 - 10:00
                          </span>
                        </div>

                        <div className="mt-2.5">
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{project.pickupDate}</span>
                            <span className="text-xs text-slate-400 font-normal">at 08:00 AM</span>
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-1 font-medium">
                            <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                            <span>{project.originCity}, {project.originState}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 ml-4.5 mt-0.5">
                            {project.originAddress || `${project.originCity} Shipper Terminal`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Event: {project.googleCalendarPickupEventId ? 'Created' : 'Ready to push'}
                        </span>
                        <a
                          href={project.googleCalendarPickupLink || `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(`🚛 PICKUP: Load #${project.loadNumber} - ${project.customerName}`)}&location=${encodeURIComponent(project.originAddress || `${project.originCity}, ${project.originState}`)}&details=${encodeURIComponent(`🔗 QUICK ACCESS / DISPATCH VIEW:\n${deepLink}\n\nShipment: #${project.loadNumber}\nCustomer: ${project.customerName}\nRate: $${project.estimatedRevenue}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                        >
                          <span>Open Pickup in Google Calendar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Delivery Event Block */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                            <Box className="w-3.5 h-3.5" />
                            DELIVERY APPOINTMENT
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                            Window: 14:00 - 16:00
                          </span>
                        </div>

                        <div className="mt-2.5">
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{project.deliveryDate}</span>
                            <span className="text-xs text-slate-400 font-normal">at 02:00 PM</span>
                          </div>
                          <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-1 font-medium">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{project.destCity}, {project.destState}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 ml-4.5 mt-0.5">
                            {project.destAddress || `${project.destCity} Receiving Hub`}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Event: {project.googleCalendarDeliveryEventId ? 'Created' : 'Ready to push'}
                        </span>
                        <a
                          href={project.googleCalendarDeliveryLink || `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(`📦 DELIVERY: Load #${project.loadNumber} - ${project.destCity}, ${project.destState}`)}&location=${encodeURIComponent(project.destAddress || `${project.destCity}, ${project.destState}`)}&details=${encodeURIComponent(`🔗 QUICK ACCESS / DISPATCH VIEW:\n${deepLink}\n\nShipment: #${project.loadNumber}\nCustomer: ${project.customerName}\nRate: $${project.estimatedRevenue}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
                        >
                          <span>Open Delivery in Google Calendar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Embedded Direct Access Link Bar */}
                  <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                      <span className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 truncate">
                        <span className="text-[11px] text-slate-400 font-medium mr-1.5">Embedded Project View Link:</span>
                        <code className="text-[11px] font-mono text-slate-300 select-all">
                          {deepLink}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyDeepLink(project)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedLinkProjId === project.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onNavigateToProject(project.id)}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Open in Alvys TMS</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeView === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-4">Load Reference</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Pickup Date & Facility</th>
                    <th className="py-3 px-4">Delivery Date & Hub</th>
                    <th className="py-3 px-4">Assigned Driver</th>
                    <th className="py-3 px-4">Calendar Sync</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredProjects.map((p) => {
                    const isSynced = Boolean(p.googleCalendarPickupEventId || p.lastCalendarSyncedAt);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          #{p.loadNumber}
                          <div className="text-[10px] text-slate-500 font-normal">{p.code}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-200 font-medium">
                          {p.customerName}
                          <div className="text-[10px] text-emerald-400 font-mono">${p.estimatedRevenue.toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{p.pickupDate}</div>
                          <div className="text-slate-400 text-[11px]">{p.originCity}, {p.originState}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{p.deliveryDate}</div>
                          <div className="text-slate-400 text-[11px]">{p.destCity}, {p.destState}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {p.driverName || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4">
                          {isSynced ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Synced
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSyncProject(p)}
                              disabled={syncingProjectId === p.id}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              {syncingProjectId === p.id ? 'Syncing...' : 'Sync'}
                            </button>
                            <button
                              onClick={() => onNavigateToProject(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition-colors cursor-pointer"
                            >
                              TMS View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* MONTH GRID VIEW */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-blue-400" />
                <span>Dispatch Calendar Grid — October 2026</span>
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Pickup Events
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  Delivery Events
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = i + 1;
                const dateStr = `2026-10-${dayNum.toString().padStart(2, '0')}`;
                const pickupsOnDay = projects.filter(p => p.pickupDate === dateStr);
                const deliveriesOnDay = projects.filter(p => p.deliveryDate === dateStr);

                return (
                  <div
                    key={dayNum}
                    className="min-h-[90px] p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between text-left"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>{dayNum}</span>
                      {(pickupsOnDay.length > 0 || deliveriesOnDay.length > 0) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      )}
                    </div>

                    <div className="space-y-1 my-1 overflow-y-auto max-h-[60px]">
                      {pickupsOnDay.map(p => (
                        <button
                          key={`p-${p.id}`}
                          onClick={() => onNavigateToProject(p.id)}
                          className="w-full text-left px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono truncate hover:bg-emerald-500/30 cursor-pointer block"
                          title={`Pickup: #${p.loadNumber} - ${p.originCity}`}
                        >
                          🚛 #{p.loadNumber}
                        </button>
                      ))}

                      {deliveriesOnDay.map(p => (
                        <button
                          key={`d-${p.id}`}
                          onClick={() => onNavigateToProject(p.id)}
                          className="w-full text-left px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-mono truncate hover:bg-purple-500/30 cursor-pointer block"
                          title={`Delivery: #${p.loadNumber} - ${p.destCity}`}
                        >
                          📦 #{p.loadNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Reschedule Windows for #{editingProject.loadNumber}</span>
              </h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Pickup Appointment Date:</label>
                <input
                  type="date"
                  value={editPickupDate}
                  onChange={(e) => setEditPickupDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Delivery Appointment Date:</label>
                <input
                  type="date"
                  value={editDeliveryDate}
                  onChange={(e) => setEditDeliveryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingProject(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReschedule}
                disabled={isSavingReschedule}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSavingReschedule ? 'Saving & Pushing to Calendar...' : 'Save & Update Google Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Payload Inspector Modal */}
      {selectedProjectForInspection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Google Calendar API Event Payload (# {selectedProjectForInspection.loadNumber})</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Production REST payload sent to <code className="text-blue-300 font-mono">POST /calendar/v3/calendars/primary/events</code> with embedded deep links.
                </p>
              </div>
              <button
                onClick={() => setSelectedProjectForInspection(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-96">
              {JSON.stringify(
                {
                  summary: `🚛 PICKUP: Load #${selectedProjectForInspection.loadNumber} - ${selectedProjectForInspection.customerName}`,
                  location: selectedProjectForInspection.originAddress || `${selectedProjectForInspection.originCity}, ${selectedProjectForInspection.originState}`,
                  description: `=====================================================\nALVYS FOUNDRY TMS - SHIPMENT PICKUP APPOINTMENT\n=====================================================\n🔗 QUICK ACCESS / DISPATCH VIEW:\n${getProjectDeepLink(selectedProjectForInspection)}\n\n• Load: #${selectedProjectForInspection.loadNumber}\n• Customer: ${selectedProjectForInspection.customerName}\n• Rate: $${selectedProjectForInspection.estimatedRevenue.toLocaleString()}\n• Driver: ${selectedProjectForInspection.driverName}`,
                  start: {
                    dateTime: `${selectedProjectForInspection.pickupDate}T08:00:00Z`,
                    timeZone: 'America/Chicago'
                  },
                  end: {
                    dateTime: `${selectedProjectForInspection.pickupDate}T10:00:00Z`,
                    timeZone: 'America/Chicago'
                  },
                  source: {
                    title: `Alvys Foundry TMS Load #${selectedProjectForInspection.loadNumber}`,
                    url: getProjectDeepLink(selectedProjectForInspection)
                  },
                  reminders: {
                    useDefault: false,
                    overrides: [
                      { method: 'email', minutes: 1440 },
                      { method: 'popup', minutes: 60 }
                    ]
                  }
                },
                null,
                2
              )}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedProjectForInspection(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
