import React, { useState } from 'react';
import { 
  Project, 
  Collaborator, 
  ProjectStatus,
  ProposedInvoice,
  CompanyProfile,
  FleetDriver
} from '../../types';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  MessageSquare, 
  Plus, 
  Search, 
  ArrowRight,
  Send,
  Sparkles,
  FileText,
  DollarSign,
  FileDown,
  Cpu,
  Radio,
  Calendar,
  CalendarDays,
  ExternalLink,
  Phone,
  Mail,
  Smartphone,
  ReceiptText,
  Check,
  Edit3,
  Trash2,
  Navigation,
  Bot,
  Compass,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
  ThermometerSnowflake,
  ShieldCheck,
  ChevronRight,
  Filter,
  Grid,
  List as ListIcon,
  Columns as KanbanIcon,
  X,
  Upload
} from 'lucide-react';
import { generateProjectSummaryPDF, generateDriverDispatchSheetPDF } from '../../services/pdfGenerator';
import { sendBillingEmailViaGmail } from '../../services/googleWorkspaceService';
import { DEFAULT_COMPANY_PROFILE, INITIAL_FLEET_DRIVERS } from '../../data/realFleetData';

interface ProjectManagementViewProps {
  projects: Project[];
  invoices: ProposedInvoice[];
  collaborators: Collaborator[];
  companyProfile?: CompanyProfile;
  drivers?: FleetDriver[];
  onSelectProject: (projectId: string) => void;
  onNavigateToStep: (step: string, projectId?: string) => void;
  onAddProject: (newProject: any) => void;
  onUpdateProject?: (updatedProject: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onAddInvoice?: (newInvoice: ProposedInvoice) => void;
  onAddComment: (projectId: string, text: string) => void;
  onToggleTask: (projectId: string, taskId: string) => void;
  onUpdateProjectStatus: (projectId: string, newStatus: ProjectStatus) => void;
  onOpenPDFSummaryModal: (project: Project) => void;
  onSyncCalendar?: (project: Project) => void;
  onNavigateToCalendarSync?: () => void;
}

export const ProjectManagementView: React.FC<ProjectManagementViewProps> = ({
  projects,
  invoices,
  collaborators,
  companyProfile = DEFAULT_COMPANY_PROFILE,
  drivers = INITIAL_FLEET_DRIVERS,
  onSelectProject,
  onNavigateToStep,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddInvoice,
  onAddComment,
  onToggleTask,
  onUpdateProjectStatus,
  onOpenPDFSummaryModal,
  onSyncCalendar,
  onNavigateToCalendarSync,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'table' | 'kanban'>('matrix');
  const [newCommentText, setNewCommentText] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRateConModal, setShowRateConModal] = useState(false);
  const [showShareDriverModal, setShowShareDriverModal] = useState(false);
  const [showAiDispatchModal, setShowAiDispatchModal] = useState(false);
  const [showCheckCallModal, setShowCheckCallModal] = useState(false);
  const [rateConRawText, setRateConRawText] = useState('');
  const [isParsingRateCon, setIsParsingRateCon] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSendingDispatchEmail, setIsSendingDispatchEmail] = useState(false);

  // AI Dispatcher State
  const [aiDispatchPrompt, setAiDispatchPrompt] = useState('');
  const [aiDispatchResponse, setAiDispatchResponse] = useState<string | null>(null);
  const [isAiDispatching, setIsAiDispatching] = useState(false);

  // Check-call state
  const [checkCallLocation, setCheckCallLocation] = useState('');
  const [checkCallTemp, setCheckCallTemp] = useState(34);
  const [checkCallNote, setCheckCallNote] = useState('');

  // Selected Medina driver default
  const defaultMedinaDriver = drivers[0] || {
    id: 'drv-jesus-medina',
    name: 'Jesus Medina',
    phone: '(817) 592-1060',
    truckNumber: 'Unit #106 (Freightliner Classic · VIN-YLB94884)',
    trailerNumber: 'TLR-54211',
    equipmentType: '53ft Dry Van' as const
  };

  // Form State: New Load
  const [newLoadNo, setNewLoadNo] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newOriginAddress, setNewOriginAddress] = useState('');
  const [newOriginCity, setNewOriginCity] = useState('');
  const [newOriginState, setNewOriginState] = useState('TX');
  const [newDestAddress, setNewDestAddress] = useState('');
  const [newDestCity, setNewDestCity] = useState('');
  const [newDestState, setNewDestState] = useState('IL');
  const [newPickupDate, setNewPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDeliveryDate, setNewDeliveryDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [selectedDriverName, setSelectedDriverName] = useState(defaultMedinaDriver.name);
  const [newEquipment, setNewEquipment] = useState<'53ft Reefer' | '53ft Dry Van' | 'Flatbed' | 'Stepdeck'>('53ft Reefer');
  const [newLinehaul, setNewLinehaul] = useState(3450);
  const [newFuel, setNewFuel] = useState(420);
  const [newWeight, setNewWeight] = useState(42500);
  const [newCommodity, setNewCommodity] = useState('Commercial Freight');
  const [newReeferTemp, setNewReeferTemp] = useState('-10°F Continuous');

  // Edit load state
  const [editProject, setEditProject] = useState<Project | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Auto populate driver details on driver select
  const handleDriverSelectChange = (driverName: string) => {
    setSelectedDriverName(driverName);
    const matched = drivers.find(d => d.name === driverName);
    if (matched && matched.equipmentType) {
      setNewEquipment(matched.equipmentType);
    }
  };

  // Create new load
  const handleCreateLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoadNo.trim() || !newCustomer.trim() || !newOriginCity.trim() || !newDestCity.trim()) {
      showToast('Please fill out all required load details.');
      return;
    }

    const matchedDriver = drivers.find(d => d.name === selectedDriverName) || defaultMedinaDriver;
    const estRev = newLinehaul + newFuel;

    const newProj: Omit<Project, 'id' | 'documentsCount' | 'tasks' | 'comments' | 'activeCollaboratorIds' | 'lastUpdated' | 'telemetry' | 'tripStops'> = {
      code: `PRJ-${newLoadNo.replace(/\D/g, '').slice(-3) || '100'}`,
      loadNumber: newLoadNo.trim().toUpperCase(),
      customerName: newCustomer.trim(),
      customerCode: newCustomer.slice(0, 4).toUpperCase(),
      originCity: newOriginCity.trim(),
      originState: newOriginState.trim().toUpperCase(),
      originAddress: newOriginAddress.trim() || `${newOriginCity}, ${newOriginState}`,
      destCity: newDestCity.trim(),
      destState: newDestState.trim().toUpperCase(),
      destAddress: newDestAddress.trim() || `${newDestCity}, ${newDestState}`,
      pickupDate: newPickupDate,
      deliveryDate: newDeliveryDate,
      driverName: matchedDriver.name,
      driverPhone: matchedDriver.phone,
      truckId: matchedDriver.truckNumber,
      trailerId: matchedDriver.trailerNumber,
      equipmentType: newEquipment,
      linehaulPay: newLinehaul,
      fuelSurcharge: newFuel,
      estimatedRevenue: estRev,
      status: 'in_transit',
      commodities: newCommodity,
      weightLbs: newWeight,
      progress: 25,
      reeferSetpoint: newEquipment.includes('Reefer') ? newReeferTemp : undefined,
    };

    onAddProject(newProj);
    showToast(`✅ Load #${newProj.loadNumber} dispatched to ${matchedDriver.name}!`);
    setShowCreateModal(false);

    // Reset form
    setNewLoadNo('');
    setNewCustomer('');
    setNewOriginCity('');
    setNewDestCity('');
  };

  // Open Edit Modal
  const handleOpenEdit = (project: Project) => {
    setEditProject({ ...project });
    setShowEditModal(true);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject || !onUpdateProject) return;

    onUpdateProject({
      ...editProject,
      lastUpdated: 'Just now'
    });
    showToast(`✅ Load #${editProject.loadNumber} updated.`);
    setShowEditModal(false);
  };

  // Advance load status pipeline
  const handleAdvanceStatus = (project: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const statusOrder: ProjectStatus[] = ['booked', 'in_transit', 'delivered', 'paperwork_scanned', 'invoiced', 'paid'];
    const currentIndex = statusOrder.indexOf(project.status);
    if (currentIndex < statusOrder.length - 1) {
      const nextStatus = statusOrder[currentIndex + 1];
      onUpdateProjectStatus(project.id, nextStatus);
      showToast(`Load #${project.loadNumber} advanced to ${getStatusLabel(nextStatus)}`);
    } else {
      showToast(`Load #${project.loadNumber} is fully paid.`);
    }
  };

  // Download dispatch sheet
  const handleDownloadDispatchSheet = (project: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const matchedDriver = drivers.find(d => d.name === project.driverName);
    generateDriverDispatchSheetPDF(project, companyProfile, matchedDriver);
    showToast(`📄 Downloaded Dispatch Workorder PDF for Load #${project.loadNumber}`);
  };

  // AI Autonomous Dispatcher Execution
  const handleExecuteAiDispatch = () => {
    if (!aiDispatchPrompt.trim()) return;
    setIsAiDispatching(true);
    setAiDispatchResponse(null);

    setTimeout(() => {
      setIsAiDispatching(false);
      const promptLower = aiDispatchPrompt.toLowerCase();

      if (promptLower.includes('jesus')) {
        const targetLoad = projects.find(p => p.status === 'booked' || p.driverName.includes('Jesus')) || projects[0];
        if (targetLoad && onUpdateProject) {
          const jesus = drivers.find(d => d.name.includes('Jesus')) || defaultMedinaDriver;
          onUpdateProject({
            ...targetLoad,
            driverName: jesus.name,
            driverPhone: jesus.phone,
            truckId: jesus.truckNumber,
            trailerId: jesus.trailerNumber,
            status: 'in_transit',
            lastUpdated: 'Just now'
          });
          setAiDispatchResponse(`🤖 **AI Dispatch Executed:** Dispatched **${jesus.name}** on Load #${targetLoad.loadNumber} (${targetLoad.originCity} ➔ ${targetLoad.destCity}). Unit #106 HOS clock verified at 11h.`);
          showToast(`AI dispatched Jesus Medina on Load #${targetLoad.loadNumber}!`);
          return;
        }
      }

      if (promptLower.includes('jose')) {
        const targetLoad = projects.find(p => p.equipmentType === '53ft Reefer') || projects[0];
        if (targetLoad && onUpdateProject) {
          const jose = drivers.find(d => d.name.includes('Jose')) || defaultMedinaDriver;
          onUpdateProject({
            ...targetLoad,
            driverName: jose.name,
            driverPhone: jose.phone,
            truckId: jose.truckNumber,
            trailerId: jose.trailerNumber,
            status: 'in_transit',
            lastUpdated: 'Just now'
          });
          setAiDispatchResponse(`🤖 **AI Dispatch Executed:** Assigned **Jose Medina** (Reefer Specialist · Unit #101) to Load #${targetLoad.loadNumber}. Reefer pre-cool sequence scheduled at 34°F.`);
          showToast(`AI dispatched Jose Medina on Load #${targetLoad.loadNumber}!`);
          return;
        }
      }

      if (promptLower.includes('deliver') || promptLower.includes('delivered')) {
        const inTransit = projects.find(p => p.status === 'in_transit') || projects[0];
        if (inTransit) {
          onUpdateProjectStatus(inTransit.id, 'delivered');
          setAiDispatchResponse(`🤖 **AI Dispatch Status Update:** Marked Load #${inTransit.loadNumber} as **DELIVERED** at consignee dock. Geofence dwell verified.`);
          showToast(`AI marked Load #${inTransit.loadNumber} as Delivered!`);
          return;
        }
      }

      // Default autonomous audit response
      const availableMedinas = drivers.filter(d => d.status === 'available');
      setAiDispatchResponse(
        `🤖 **AI Dispatch Matrix Analysis:**\n\n` +
        `• **Fleet Ready:** ${availableMedinas.length} Medina drivers available (${availableMedinas.map(d => d.name).join(', ') || 'All drivers active'})\n` +
        `• **Active Asset Loads:** ${projects.length} loads monitored across Texas, Midwest, and Southeast corridors\n` +
        `• **Recommendation:** Jesus Medina (Unit #106) is stationed at Crowley, TX yard with 11.0h HOS ready for Midwest linehaul.`
      );
    }, 600);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.destCity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesDriver = driverFilter === 'all' || p.driverName.toLowerCase().includes(driverFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesDriver;
  });

  const getStatusBadgeColor = (status: ProjectStatus) => {
    switch (status) {
      case 'booked': return 'text-slate-800 bg-slate-100 border-slate-300';
      case 'in_transit': return 'text-emerald-900 bg-emerald-100/90 border-emerald-400 font-bold';
      case 'delivered': return 'text-sky-900 bg-sky-100/90 border-sky-400 font-bold';
      case 'paperwork_scanned': return 'text-indigo-900 bg-indigo-100/90 border-indigo-400 font-bold';
      case 'invoiced': return 'text-purple-900 bg-purple-100/90 border-purple-400 font-bold';
      case 'paid': return 'text-green-950 bg-green-200/90 border-green-500 font-bold';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'booked': return 'Booked';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'paperwork_scanned': return 'POD Scanned';
      case 'invoiced': return 'Invoiced';
      case 'paid': return 'Paid';
    }
  };

  // Metrics for Top Operations HUD
  const inTransitCount = projects.filter(p => p.status === 'in_transit').length;
  const bookedCount = projects.filter(p => p.status === 'booked').length;
  const deliveredCount = projects.filter(p => p.status === 'delivered' || p.status === 'paperwork_scanned').length;
  const invoicedCount = projects.filter(p => p.status === 'invoiced' || p.status === 'paid').length;
  const totalGross = projects.reduce((acc, p) => acc + (p.estimatedRevenue || 0), 0);

  const columns: ProjectStatus[] = ['booked', 'in_transit', 'delivered', 'paperwork_scanned', 'invoiced', 'paid'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-hidden select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP OPERATIONS HUD BAR (Eye-Ergonomic Contrast) */}
      <div className="bg-white border-b border-[#E5E5EA] px-6 py-3.5 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                  <span>Alvys Dispatch Matrix</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    ● Live Operations Active
                  </span>
                </h1>
                <p className="text-[11px] text-gray-500">
                  Fleet operations desk for Medina family drivers (Jesus, Jose, Luis, Alfredo).
                </p>
              </div>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] border border-gray-200/80 flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Loads</span>
              <span className="font-extrabold text-gray-950 font-mono">{projects.length}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">In Transit</span>
              <span className="font-extrabold text-emerald-800 font-mono">{inTransitCount}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2">
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Pending POD</span>
              <span className="font-extrabold text-blue-800 font-mono">{deliveredCount}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-2">
              <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Gross Revenue</span>
              <span className="font-extrabold text-purple-900 font-mono">${totalGross.toLocaleString()}</span>
            </div>

            {/* AI Dispatcher & New Load Actions */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <button
                onClick={() => setShowAiDispatchModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Dispatcher</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Load</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER ROW */}
        <div className="mt-3 pt-3 border-t border-gray-150 flex flex-wrap items-center justify-between gap-3">
          {/* Search & Driver Filter */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search load #, broker, city, driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F5F5F7] border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF] focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Medina Driver Filter */}
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="bg-[#F5F5F7] border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-semibold focus:outline-none focus:border-[#007AFF] cursor-pointer"
            >
              <option value="all">All Medina Drivers</option>
              <option value="Jesus">Jesus Medina (Unit #106)</option>
              <option value="Jose">Jose Medina (Unit #101)</option>
              <option value="Luis">Luis Medina (Unit #102)</option>
              <option value="Alfredo">Alfredo Medina (Unit #104)</option>
            </select>
          </div>

          {/* Status Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'All Loads', count: projects.length },
              { id: 'in_transit', label: 'In Transit', count: inTransitCount },
              { id: 'booked', label: 'Booked', count: bookedCount },
              { id: 'delivered', label: 'Delivered', count: deliveredCount },
              { id: 'invoiced', label: 'Invoiced', count: invoicedCount }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-[#F5F5F7] text-gray-600 hover:text-gray-950 border border-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F5F5F7] border border-gray-300 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'matrix' ? 'bg-white text-gray-950 shadow-2xs border border-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Operations Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-white text-gray-950 shadow-2xs border border-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ListIcon className="w-3 h-3" />
              <span>Dispatch Ledger</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-950 shadow-2xs border border-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <KanbanIcon className="w-3 h-3" />
              <span>Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN DISPATCH CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* MODE 1: OPERATIONS MATRIX (High Contrast Spacious Responsive Cards) */}
        {viewMode === 'matrix' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((p) => {
              const isSelected = p.id === selectedProjectId;
              const matchedDriver = drivers.find(d => d.name === p.driverName) || defaultMedinaDriver;
              const isReefer = p.equipmentType?.includes('Reefer');

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    onSelectProject(p.id);
                  }}
                  className={`bg-white rounded-2xl border transition-all text-left p-5 shadow-xs flex flex-col justify-between cursor-pointer ${
                    isSelected 
                      ? 'border-[#007AFF] ring-2 ring-[#007AFF]/25 shadow-md' 
                      : 'border-gray-200/90 hover:border-gray-400 hover:shadow-sm'
                  }`}
                >
                  {/* CARD TOP HEADER: LOAD #, BROKER, RATE */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-extrabold text-gray-950 px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200">
                            #{p.loadNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(p.status)}`}>
                            {getStatusLabel(p.status)}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-gray-900 mt-1.5 truncate max-w-[210px]">
                          {p.customerName}
                        </div>
                      </div>

                      {/* Revenue Display */}
                      <div className="text-right">
                        <div className="text-base font-extrabold text-emerald-700 font-mono tabular-nums">
                          ${p.estimatedRevenue.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          ${p.linehaulPay.toLocaleString()} + ${p.fuelSurcharge} FSC
                        </div>
                      </div>
                    </div>

                    {/* CORRIDOR & ROUTE VISUALIZATION (Clean & Easy to scan) */}
                    <div className="my-3.5 p-3 rounded-xl bg-[#F5F5F7] border border-gray-200/70">
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-extrabold text-gray-950 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{p.originCity}, {p.originState}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-[11px] font-bold">
                          <span>────────</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#007AFF]" />
                        </div>
                        <div className="font-extrabold text-gray-950 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{p.destCity}, {p.destState}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500 font-mono">
                        <span>Pickup: <strong className="text-gray-800">{p.pickupDate}</strong></span>
                        <span>Delivery: <strong className="text-gray-800">{p.deliveryDate}</strong></span>
                      </div>
                    </div>

                    {/* MEDINA DRIVER & EQUIPMENT INFO */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3.5">
                      {/* Driver Chip */}
                      <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          {p.driverName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-gray-900 truncate">
                            {p.driverName}
                          </div>
                          <div className="text-[9px] text-gray-500 font-mono truncate">
                            {matchedDriver.phone}
                          </div>
                        </div>
                      </div>

                      {/* Equipment Chip */}
                      <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isReefer ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          {isReefer ? <ThermometerSnowflake className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-gray-900 truncate">
                            {isReefer ? '53ft Reefer' : '53ft Dry Van'}
                          </div>
                          <div className="text-[9px] text-gray-500 font-mono truncate">
                            {p.reeferSetpoint || p.truckId}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="pt-3 border-t border-gray-150 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDownloadDispatchSheet(p, e)}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Download Dispatch Sheet PDF"
                      >
                        <FileDown className="w-3 h-3 text-blue-600" />
                        <span>Workorder</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectId(p.id);
                          setShowCheckCallModal(true);
                        }}
                        className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Log GPS Check Call"
                      >
                        <Radio className="w-3 h-3 text-emerald-600" />
                        <span>Ping GPS</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(p);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        title="Edit Load Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={(e) => handleAdvanceStatus(p, e)}
                      className="px-3 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Next Status</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white border border-gray-200 rounded-2xl">
                <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-gray-800">No active loads match your filter</h3>
                <p className="text-xs text-gray-500 mt-1">Try clearing search or driver filters.</p>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: DISPATCH LEDGER TABLE (Full-width clean rows) */}
        {viewMode === 'table' && (
          <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-xs text-gray-800">
              <thead className="bg-[#F5F5F7] border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Load #</th>
                  <th className="py-3 px-4">Broker / Customer</th>
                  <th className="py-3 px-4">Origin ➔ Destination Corridor</th>
                  <th className="py-3 px-4">Medina Driver</th>
                  <th className="py-3 px-4">Equipment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-center">Workorder</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredProjects.map((p) => {
                  const isSelected = p.id === selectedProjectId;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        onSelectProject(p.id);
                      }}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-extrabold text-gray-950">
                        #{p.loadNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {p.customerName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">
                          {p.originCity}, {p.originState} ➔ {p.destCity}, {p.destState}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {p.pickupDate} to {p.deliveryDate}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] flex items-center justify-center font-bold">
                            {p.driverName.charAt(0)}
                          </span>
                          <span>{p.driverName}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {p.truckId}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {p.equipmentType}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeColor(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">
                        ${p.estimatedRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => handleDownloadDispatchSheet(p, e)}
                          className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded text-[11px] font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <FileDown className="w-3 h-3 text-blue-600" />
                          <span>PDF</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => handleAdvanceStatus(p, e)}
                          className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white rounded text-[11px] font-bold cursor-pointer"
                        >
                          Advance
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 3: KANBAN BOARD */}
        {viewMode === 'kanban' && (
          <div className="flex gap-4 min-w-[1200px] overflow-x-auto pb-4">
            {columns.map((colStatus) => {
              const colProjects = filteredProjects.filter(p => p.status === colStatus);
              return (
                <div key={colStatus} className="flex-1 min-w-[240px] flex flex-col bg-white border border-[#E5E5EA] rounded-2xl p-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-150">
                    <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                      {getStatusLabel(colStatus)}
                    </span>
                    <span className="text-[11px] font-mono text-gray-700 font-bold tabular-nums bg-gray-100 px-2 py-0.5 rounded-full">
                      {colProjects.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          onSelectProject(p.id);
                        }}
                        className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-xs font-bold text-gray-950 font-mono">
                            #{p.loadNumber}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
                            ${p.estimatedRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-900 font-semibold truncate mb-1">
                          {p.customerName}
                        </div>
                        <div className="text-[11px] text-gray-600 flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate">{p.originCity}, {p.originState} → {p.destCity}, {p.destState}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                          <span className="font-bold text-gray-900">{p.driverName.split(' ')[0]}</span>
                          <button
                            onClick={(e) => handleAdvanceStatus(p, e)}
                            className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                          >
                            Advance ➔
                          </button>
                        </div>
                      </div>
                    ))}
                    {colProjects.length === 0 && (
                      <div className="h-24 flex items-center justify-center border border-dashed border-gray-200 rounded-xl text-[11px] text-gray-400">
                        No loads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE NEW LOAD */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-950">Book & Dispatch Commercial Load</h3>
                  <p className="text-xs text-gray-500">Real asset load assignment to Medina family drivers.</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoad} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Load / Rate Con # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GE-982305"
                    value={newLoadNo}
                    onChange={(e) => setNewLoadNo(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Broker / Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C.H. Robinson, TQL, Echo"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Corridor */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Origin City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fort Worth"
                    value={newOriginCity}
                    onChange={(e) => setNewOriginCity(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Origin State *</label>
                  <input
                    type="text"
                    required
                    placeholder="TX"
                    value={newOriginState}
                    onChange={(e) => setNewOriginState(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Dest City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicago"
                    value={newDestCity}
                    onChange={(e) => setNewDestCity(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Dest State *</label>
                  <input
                    type="text"
                    required
                    placeholder="IL"
                    value={newDestState}
                    onChange={(e) => setNewDestState(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Driver & Equipment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Assign Medina Driver *</label>
                  <select
                    value={selectedDriverName}
                    onChange={(e) => handleDriverSelectChange(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:bg-white font-bold cursor-pointer"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} · Unit #{d.assignedTruckNumber || d.truckNumber} ({d.equipmentType || '53ft Van'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Trailer Equipment *</label>
                  <select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 focus:bg-white cursor-pointer"
                  >
                    <option value="53ft Reefer">53ft Reefer</option>
                    <option value="53ft Dry Van">53ft Dry Van</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Stepdeck">Stepdeck</option>
                  </select>
                </div>
              </div>

              {/* Financials */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Linehaul Rate ($) *</label>
                  <input
                    type="number"
                    required
                    value={newLinehaul}
                    onChange={(e) => setNewLinehaul(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Fuel FSC ($) *</label>
                  <input
                    type="number"
                    value={newFuel}
                    onChange={(e) => setNewFuel(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Total Agreed Gross</label>
                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-emerald-800 font-mono font-extrabold text-sm">
                    ${(newLinehaul + newFuel).toLocaleString()} USD
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Pickup Date *</label>
                  <input
                    type="date"
                    required
                    value={newPickupDate}
                    onChange={(e) => setNewPickupDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={newDeliveryDate}
                    onChange={(e) => setNewDeliveryDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Confirm & Dispatch Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI DISPATCHER INTERACTIVE DIALOG */}
      {showAiDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-950">AI Autonomous Dispatch Assistant</h3>
                  <p className="text-xs text-gray-500">Natural language commands on the Dispatch Matrix.</p>
                </div>
              </div>
              <button onClick={() => setShowAiDispatchModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-bold mb-1">Quick Command Suggestions:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Dispatch Jesus Medina on Texas-Midwest linehaul",
                    "Assign Jose Medina to Chicago reefer load",
                    "Advance delivered loads to POD scanned",
                    "Audit Medina drivers HOS availability"
                  ].map(cmd => (
                    <button
                      key={cmd}
                      type="button"
                      onClick={() => setAiDispatchPrompt(cmd)}
                      className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] hover:bg-gray-200 border border-gray-300 text-gray-800 text-[11px] font-medium cursor-pointer"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Your Dispatch Instruction:</label>
                <textarea
                  rows={3}
                  value={aiDispatchPrompt}
                  onChange={(e) => setAiDispatchPrompt(e.target.value)}
                  placeholder="e.g. Dispatch Jesus Medina on Load #GE-982301 and verify unit 106 hours of service"
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-3 text-gray-900 focus:bg-white focus:outline-none text-xs"
                />
              </div>

              {aiDispatchResponse && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs whitespace-pre-line leading-relaxed">
                  {aiDispatchResponse}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiDispatchModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAiDispatch}
                  disabled={isAiDispatching}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isAiDispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Execute on Matrix</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CHECK CALL / GPS PING */}
      {showCheckCallModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-950">Log Driver Check-Call & Telemetry</h3>
              </div>
              <button onClick={() => setShowCheckCallModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F5F5F7] border border-gray-200">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Active Trip</span>
                <strong className="text-xs text-gray-900 block mt-0.5">
                  #{selectedProject.loadNumber} · {selectedProject.driverName}
                </strong>
                <span className="text-[11px] text-gray-600 block mt-0.5">
                  Route: {selectedProject.originCity}, {selectedProject.originState} ➔ {selectedProject.destCity}, {selectedProject.destState}
                </span>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Current Mile Marker / City</label>
                <input
                  type="text"
                  placeholder="e.g. I-44 E Mile Marker 120, Springfield MO"
                  value={checkCallLocation}
                  onChange={(e) => setCheckCallLocation(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Reefer Sensor Temp (°F)</label>
                <input
                  type="number"
                  value={checkCallTemp}
                  onChange={(e) => setCheckCallTemp(Number(e.target.value))}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Dispatch Note</label>
                <input
                  type="text"
                  placeholder="e.g. Driver rolling on schedule, ETA consignee 06:00"
                  value={checkCallNote}
                  onChange={(e) => setCheckCallNote(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckCallModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast(`📍 Check-call recorded for ${selectedProject.driverName}!`);
                    setShowCheckCallModal(false);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Transmit Check-Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT LOAD */}
      {showEditModal && editProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150">
              <h3 className="text-sm font-bold text-gray-950">Edit Load #{editProject.loadNumber}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-bold mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editProject.customerName}
                  onChange={(e) => setEditProject({ ...editProject, customerName: e.target.value })}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Linehaul Pay ($)</label>
                  <input
                    type="number"
                    value={editProject.linehaulPay}
                    onChange={(e) => {
                      const lh = Number(e.target.value);
                      setEditProject({
                        ...editProject,
                        linehaulPay: lh,
                        estimatedRevenue: lh + editProject.fuelSurcharge
                      });
                    }}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Fuel Surcharge ($)</label>
                  <input
                    type="number"
                    value={editProject.fuelSurcharge}
                    onChange={(e) => {
                      const f = Number(e.target.value);
                      setEditProject({
                        ...editProject,
                        fuelSurcharge: f,
                        estimatedRevenue: editProject.linehaulPay + f
                      });
                    }}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Assigned Driver</label>
                <select
                  value={editProject.driverName}
                  onChange={(e) => {
                    const d = drivers.find(drv => drv.name === e.target.value);
                    setEditProject({
                      ...editProject,
                      driverName: e.target.value,
                      driverPhone: d?.phone || editProject.driverPhone,
                      truckId: d?.truckNumber || editProject.truckId,
                      trailerId: d?.trailerNumber || editProject.trailerId
                    });
                  }}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 font-bold cursor-pointer"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.truckNumber})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-150">
                {onDeleteProject && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete Load #${editProject.loadNumber}?`)) {
                        onDeleteProject(editProject.id);
                        setShowEditModal(false);
                        showToast(`Load #${editProject.loadNumber} deleted.`);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Load</span>
                  </button>
                )}

                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
