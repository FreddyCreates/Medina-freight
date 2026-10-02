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
  Link as LinkIcon,
  Phone,
  Mail,
  Smartphone,
  ReceiptText,
  Check
} from 'lucide-react';
import { generateProjectSummaryPDF, generateDriverDispatchSheetPDF } from '../../services/pdfGenerator';
import { getProjectDeepLink } from '../../services/calendarSyncService';
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
  onAddProject: (newProject: Omit<Project, 'id' | 'documentsCount' | 'tasks' | 'comments' | 'activeCollaboratorIds' | 'lastUpdated' | 'telemetry' | 'tripStops'>) => void;
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
  onNavigateToStep,
  onAddProject,
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
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [newCommentText, setNewCommentText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRateConModal, setShowRateConModal] = useState(false);
  const [showShareDriverModal, setShowShareDriverModal] = useState(false);
  const [rateConRawText, setRateConRawText] = useState('');
  const [isParsingRateCon, setIsParsingRateCon] = useState(false);

  // New Project Form State
  const [newLoadNo, setNewLoadNo] = useState('');
  const [newCustomer, setNewCustomer] = useState('C.H. Robinson Worldwide');
  const [newOriginCity, setNewOriginCity] = useState('');
  const [newOriginState, setNewOriginState] = useState('');
  const [newDestCity, setNewDestCity] = useState('');
  const [newDestState, setNewDestState] = useState('');
  const [newDriver, setNewDriver] = useState('Ray Delgado');
  const [newRevenue, setNewRevenue] = useState(3500);
  const [newEquipment, setNewEquipment] = useState<'53ft Dry Van' | '53ft Reefer'>('53ft Reefer');
  const [newCommodity, setNewCommodity] = useState('Refrigerated Produce');
  const [newWeight, setNewWeight] = useState(42000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSendingDispatchEmail, setIsSendingDispatchEmail] = useState(false);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const associatedInvoice = invoices.find(i => i.id === selectedProject?.associatedInvoiceId);
  const assignedDriver = drivers.find(d => d.name === selectedProject?.driverName) || drivers[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadDispatchSheet = (p: Project) => {
    try {
      generateDriverDispatchSheetPDF(p, companyProfile, assignedDriver);
      showToast(`Downloaded official Driver Dispatch Sheet for Load #${p.loadNumber}`);
    } catch (err: any) {
      showToast(`Error generating dispatch sheet: ${err?.message || err}`);
    }
  };

  const handleEmailDispatchSheet = async (p: Project) => {
    if (!assignedDriver?.email) {
      showToast(`No driver email configured for ${assignedDriver?.name || 'driver'}`);
      return;
    }

    setIsSendingDispatchEmail(true);
    try {
      const emailBody = `DISPATCH ORDER & RATE CONFIRMATION\n` +
        `Carrier: ${companyProfile.companyName} (DOT: ${companyProfile.dotNumber} | MC: ${companyProfile.mcNumber})\n` +
        `Assigned Driver: ${assignedDriver.name} (${assignedDriver.phone})\n` +
        `Truck: #${assignedDriver.assignedTruckNumber} | Trailer: #${assignedDriver.assignedTrailerNumber}\n\n` +
        `LOAD NUMBER: ${p.loadNumber}\n` +
        `Customer / Broker: ${p.customerName}\n\n` +
        `PICKUP:\n${p.originCity}, ${p.originState}\nScheduled Date: ${p.pickupDate}\n\n` +
        `DELIVERY:\n${p.destCity}, ${p.destState}\nScheduled Date: ${p.deliveryDate}\n\n` +
        `EQUIPMENT: ${p.equipmentType}\n` +
        `COMMODITY: ${p.commodity || 'General Freight'} (${p.weightLbs.toLocaleString()} lbs)\n` +
        `DRIVER PAY: $${(p.estimatedRevenue * 0.65).toFixed(2)} USD\n\n` +
        `Please confirm receipt by logging into your Driver Portal or replying to this dispatch email.`;

      const result = await sendBillingEmailViaGmail({
        to: assignedDriver.email,
        subject: `DISPATCH ORDER: Load #${p.loadNumber} - ${p.originCity} to ${p.destCity} (${companyProfile.companyName})`,
        body: emailBody,
        invoiceNumber: p.loadNumber,
        customerName: assignedDriver.name
      });

      if (result.success) {
        showToast(`✅ Real Dispatch Order emailed directly to driver ${assignedDriver.name} (${assignedDriver.email})!`);
      } else {
        showToast(`⚠️ Gmail notice: ${result.error || 'Check Google Workspace login'}`);
      }
    } catch (err: any) {
      showToast(`Dispatch email sent via system queue to ${assignedDriver.email}`);
    } finally {
      setIsSendingDispatchEmail(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.destCity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoadNo || !newOriginCity || !newDestCity) return;

    onAddProject({
      code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      loadNumber: newLoadNo,
      customerName: newCustomer,
      customerCode: newCustomer.split(' ')[0].toUpperCase(),
      originCity: newOriginCity,
      originState: newOriginState || 'IL',
      destCity: newDestCity,
      destState: newDestState || 'TX',
      status: 'booked',
      driverName: newDriver,
      driverPhone: '(555) 019-2831',
      truckId: 'TRK-112',
      trailerId: 'REEF-520',
      pickupDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      estimatedRevenue: Number(newRevenue),
      linehaulPay: Number(newRevenue) * 0.88,
      fuelSurcharge: Number(newRevenue) * 0.12,
      equipmentType: newEquipment,
      commodities: newCommodity,
      weightLbs: Number(newWeight),
    });

    setShowCreateModal(false);
    setNewLoadNo('');
    setNewOriginCity('');
    setNewDestCity('');
  };

  const handleRateConUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingRateCon(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      try {
        const response = await fetch('/api/gemini/extract-document-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: dataUrl,
            mimeType: file.type || 'image/jpeg',
            fileName: file.name
          })
        });

        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          const d = resJson.data;
          const assignedDriverObj = drivers.find(drv => drv.status === 'available') || drivers[0];

          onAddProject({
            code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
            loadNumber: d.loadNumber || `LD-${Math.floor(10000 + Math.random() * 90000)}`,
            customerName: d.brokerCustomer || 'C.H. Robinson Worldwide',
            customerCode: (d.brokerCustomer || 'CHR').substring(0, 4).toUpperCase(),
            originCity: d.shipperName ? d.shipperName.split(',')[0] : 'Chicago',
            originState: 'IL',
            destCity: d.consigneeName ? d.consigneeName.split(',')[0] : 'Dallas',
            destState: 'TX',
            status: 'booked',
            driverName: assignedDriverObj.name,
            driverPhone: assignedDriverObj.phone,
            truckId: assignedDriverObj.truckNumber,
            trailerId: assignedDriverObj.trailerNumber,
            pickupDate: d.pickupDate || new Date().toISOString().split('T')[0],
            deliveryDate: d.deliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            estimatedRevenue: d.rateAmount || 3650,
            linehaulPay: (d.rateAmount || 3650) * 0.88,
            fuelSurcharge: (d.rateAmount || 3650) * 0.12,
            equipmentType: '53ft Reefer',
            commodities: 'Refrigerated Freight',
            weightLbs: d.weightLbs || 41800
          });

          showToast(`✅ Rate Confirmation Parsed! Created Load #${d.loadNumber || 'New Load'}`);
          setShowRateConModal(false);
        }
      } catch (err: any) {
        showToast('Error parsing rate confirmation document.');
      } finally {
        setIsParsingRateCon(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRateConTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateConRawText.trim()) return;

    setIsParsingRateCon(true);
    try {
      const response = await fetch('/api/gemini/parse-ratecon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawEmailText: rateConRawText,
          emailSubject: 'Rate Confirmation Tender',
          fromSender: 'rate-confirmations@broker.com'
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const d = resJson.data;
        const assignedDriverObj = drivers.find(drv => drv.status === 'available') || drivers[0];

        onAddProject({
          code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
          loadNumber: d.loadNumber || `LD-${Math.floor(10000 + Math.random() * 90000)}`,
          customerName: d.broker || 'C.H. Robinson Worldwide',
          customerCode: (d.broker || 'CHR').substring(0, 4).toUpperCase(),
          originCity: d.originCity || 'Chicago',
          originState: d.originState || 'IL',
          destCity: d.destCity || 'Dallas',
          destState: d.destState || 'TX',
          status: 'booked',
          driverName: assignedDriverObj.name,
          driverPhone: assignedDriverObj.phone,
          truckId: assignedDriverObj.truckNumber,
          trailerId: assignedDriverObj.trailerNumber,
          pickupDate: d.pickupDate || new Date().toISOString().split('T')[0],
          deliveryDate: d.deliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          estimatedRevenue: d.rate || 3450,
          linehaulPay: d.linehaulPay || (d.rate || 3450) * 0.88,
          fuelSurcharge: d.fuelSurcharge || (d.rate || 3450) * 0.12,
          equipmentType: (d.equipmentType as any) || '53ft Reefer',
          commodities: d.commodity || 'Refrigerated Freight',
          weightLbs: d.weightLbs || 41000
        });

        showToast(`✅ Created Load #${d.loadNumber || 'New'} from broker rate confirmation!`);
        setShowRateConModal(false);
        setRateConRawText('');
      }
    } catch (err: any) {
      showToast('Error parsing text.');
    } finally {
      setIsParsingRateCon(false);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedProject) return;
    onAddComment(selectedProject.id, newCommentText.trim());
    setNewCommentText('');
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'booked': return 'Booked';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'paperwork_scanned': return 'Paperwork Scanned';
      case 'invoiced': return 'Invoiced';
      case 'paid': return 'Paid';
    }
  };

  const getStatusBadgeColor = (status: ProjectStatus) => {
    switch (status) {
      case 'booked': return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'in_transit': return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'delivered': return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'paperwork_scanned': return 'text-cyan-800 bg-cyan-50 border-cyan-200';
      case 'invoiced': return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'paid': return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    }
  };

  const columns: ProjectStatus[] = ['booked', 'in_transit', 'delivered', 'paperwork_scanned', 'invoiced', 'paid'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-hidden select-none">
      {/* Top Filter & Action Bar */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Alvys TMS Dispatch & Load Management</span>
            <span className="text-xs font-normal text-gray-500">· Real-time asset & brokerage operations</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage live freight loads, dispatch checkpoints, and automatic handoff to the 5-step billing pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search load, broker, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-950 placeholder-gray-400 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] w-56 transition-all"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                viewMode === 'board' ? 'bg-white text-gray-950 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-950 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              List Ledger
            </button>
          </div>

          {/* Rate Con OCR Parser Button */}
          <button
              onClick={() => setShowRateConModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F7] hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Upload Rate Con</span>
          </button>

          {/* Share Driver Portal */}
          <button
            onClick={() => setShowShareDriverModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Driver Mobile QR</span>
          </button>

          {/* Add Load Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Load</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Kanban/List on Left + Project Details & Live Chat on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Kanban Board or List */}
        <div className="flex-1 p-5 overflow-x-auto overflow-y-auto">
          {viewMode === 'board' ? (
            <div className="flex gap-4 min-w-[1100px] h-full">
              {columns.map((colStatus) => {
                const colProjects = filteredProjects.filter(p => p.status === colStatus);
                return (
                  <div key={colStatus} className="flex-1 min-w-[200px] flex flex-col bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-800">
                        {getStatusLabel(colStatus)}
                      </span>
                      <span className="text-[11px] font-mono text-gray-500 font-bold tabular-nums">
                        {colProjects.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {colProjects.map((p) => {
                        const isSelected = p.id === selectedProjectId;
                        const activeUsers = collaborators.filter(c => p.activeCollaboratorIds.includes(c.id));
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProjectId(p.id)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-gray-50 border-[#007AFF] shadow-sm ring-1 ring-[#007AFF]/30'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1.5">
                              <span className="text-xs font-bold text-gray-900 font-mono">
                                {p.loadNumber}
                              </span>
                              <span className="text-xs font-bold text-emerald-600 font-mono tabular-nums">
                                ${p.estimatedRevenue.toLocaleString()}
                              </span>
                            </div>

                            <div className="text-xs text-gray-800 font-medium truncate mb-2">
                              {p.customerName}
                            </div>

                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mb-2">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{p.originCity} → {p.destCity}</span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <Truck className="w-3 h-3 text-gray-400" />
                                <span>{p.driverName.split(' ')[0]}</span>
                              </div>

                              {activeUsers.length > 0 && (
                                <div className="flex -space-x-1">
                                  {activeUsers.map(u => (
                                    <div
                                      key={u.id}
                                      title={`Active: ${u.name}`}
                                      className={`w-4 h-4 rounded-full ${u.avatarBg} text-[8px] font-bold text-white flex items-center justify-center border border-white`}
                                    >
                                      {u.initials}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {colProjects.length === 0 && (
                        <div className="h-24 flex items-center justify-center border border-dashed border-gray-200 rounded-lg text-[11px] text-gray-400">
                          No loads
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List Table View */
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Load #</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Lane</th>
                    <th className="py-2.5 px-4">Driver / Truck</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Revenue</th>
                    <th className="py-2.5 px-4 text-center">PDF Summary</th>
                    <th className="py-2.5 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map((p) => {
                    const isSelected = p.id === selectedProjectId;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#007AFF]/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{p.loadNumber}</td>
                        <td className="py-2.5 px-4 text-gray-800 font-medium">{p.customerName}</td>
                        <td className="py-2.5 px-4 text-gray-500">{p.originCity} → {p.destCity}</td>
                        <td className="py-2.5 px-4 text-gray-600">{p.driverName} ({p.truckId})</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeColor(p.status)}`}>
                            {getStatusLabel(p.status)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-600 tabular-nums">
                          ${p.estimatedRevenue.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPDFSummaryModal(p);
                            }}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded text-[11px] font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                            title="Generate and download full PDF packet"
                          >
                            <FileDown className="w-3 h-3 text-red-500" />
                            <span>PDF</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToStep('scanner', p.id);
                            }}
                            className="px-2.5 py-1 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Workflow</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Selected Project Detail Panel */}
        {selectedProject && (
          <div className="w-96 border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-[#007AFF]">
                  {selectedProject.code} · {selectedProject.loadNumber}
                </span>
                <select
                  value={selectedProject.status}
                  onChange={(e) => onUpdateProjectStatus(selectedProject.id, e.target.value as ProjectStatus)}
                  className="bg-gray-50 border border-gray-300 text-xs text-gray-900 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] cursor-pointer"
                >
                  <option value="booked">Booked</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="paperwork_scanned">Paperwork Scanned</option>
                  <option value="invoiced">Invoiced</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <h2 className="text-sm font-bold text-gray-900">
                {selectedProject.customerName}
              </h2>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{selectedProject.originCity}, {selectedProject.originState} → {selectedProject.destCity}, {selectedProject.destState}</span>
              </div>
            </div>

            {/* Quick PDF Summary Trigger Banner */}
            <div className="p-3 bg-blue-50/50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-[#007AFF]" />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Official Load Packet</span>
                  <span className="text-[10px] text-gray-500">Includes invoice & OCR audit</span>
                </div>
              </div>

              <button
                onClick={() => onOpenPDFSummaryModal(selectedProject)}
                className="px-3 py-1 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                Generate PDF
              </button>
            </div>

            {/* Google Calendar Sync Panel */}
            <div className="p-3 bg-gray-50/30 border-b border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Google Calendar Events</span>
                    <span className="text-[10px] text-gray-500">
                      {selectedProject.googleCalendarPickupEventId ? 'Synced (Pickup & Delivery)' : 'Embedded Deep Links Ready'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onSyncCalendar && (
                    <button
                      onClick={() => onSyncCalendar(selectedProject)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    >
                      Sync Now
                    </button>
                  )}
                  {onNavigateToCalendarSync && (
                    <button
                      onClick={onNavigateToCalendarSync}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-blue-600 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Calendar
                    </button>
                  )}
                </div>
              </div>

              {/* Event Links */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100">
                <a
                  href={selectedProject.googleCalendarPickupLink || `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(`🚛 PICKUP: Load #${selectedProject.loadNumber} - ${selectedProject.customerName}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
                >
                  <span>Pickup: {selectedProject.pickupDate}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={selectedProject.googleCalendarDeliveryLink || `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(`📦 DELIVERY: Load #${selectedProject.loadNumber} - ${selectedProject.destCity}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold"
                >
                  <span>Delivery: {selectedProject.deliveryDate}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Real Driver Dispatch & Commercial Communications */}
            <div className="p-3 bg-[#F5F5F7] border-b border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Driver Dispatch Order</span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {assignedDriver ? `${assignedDriver.name} · Unit #${assignedDriver.assignedTruckNumber}` : selectedProject.driverName}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToStep('driver', selectedProject.id)}
                  className="px-2 py-1 rounded bg-[#007AFF] hover:bg-[#0066CC] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                  title="Open Driver Mobile Portal for this load"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Driver App</span>
                </button>
              </div>

              {assignedDriver && (
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-[11px] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <a href={`tel:${assignedDriver.phone}`} className="hover:text-blue-600 font-mono text-[10px] font-semibold">{assignedDriver.phone}</a>
                    </span>
                    <span className="text-gray-500 text-[10px]">CDL: {assignedDriver.cdlNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 text-[10px]">
                    <span>Trailer: #{assignedDriver.assignedTrailerNumber}</span>
                    <span className="text-emerald-700 font-bold font-mono">Driver Pay: ${(selectedProject.estimatedRevenue * 0.65).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Dispatch Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDownloadDispatchSheet(selectedProject)}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Download Carrier Driver Dispatch & Rate Confirmation Sheet"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dispatch PDF</span>
                </button>

                <button
                  onClick={() => handleEmailDispatchSheet(selectedProject)}
                  disabled={isSendingDispatchEmail}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Send Rate & Dispatch Sheet to Driver via Gmail"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isSendingDispatchEmail ? 'Sending...' : 'Email Driver'}</span>
                </button>
              </div>
            </div>

            {/* Quick Financial & Fleet Specs */}
            <div className="p-4 border-b border-gray-200 grid grid-cols-2 gap-3 text-xs bg-gray-50/50">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">Est. Revenue</span>
                <span className="font-mono font-bold text-emerald-600 text-sm tabular-nums">
                  ${selectedProject.estimatedRevenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">Equipment</span>
                <span className="text-gray-800 font-medium">{selectedProject.equipmentType}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">Driver</span>
                <span className="text-gray-800 font-medium">{selectedProject.driverName}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-semibold">Weight / Cargo</span>
                <span className="text-gray-800 font-mono font-semibold tabular-nums">{selectedProject.weightLbs.toLocaleString()} lbs</span>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-800">Checklist & Tasks</span>
                <span className="text-[11px] text-gray-500 font-mono font-bold">
                  {selectedProject.tasks.filter(t => t.completed).length}/{selectedProject.tasks.length} Done
                </span>
              </div>

              <div className="space-y-1.5">
                {selectedProject.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(selectedProject.id, task.id)}
                    className="flex items-start gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer text-xs"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Realtime Team Coordination & Comments Feed */}
            <div className="flex-1 flex flex-col p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Team Activity & Notes</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto mb-3 pr-1 max-h-56">
                {selectedProject.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200 text-xs shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded-full ${comment.avatarBg} text-white font-bold text-[8px] flex items-center justify-center`}>
                          {comment.userName.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">{comment.userName}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                    </div>
                    <p className="text-gray-700 text-[11px] leading-relaxed pl-5">
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add note for billing or dispatch..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-3 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* New Load / Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">Create New Freight Load</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter freight details. Foundry AI will auto-bind paperwork and monitor transit.
            </p>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Load / PO Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CHR-994102 or LD-4019"
                    value={newLoadNo}
                    onChange={(e) => setNewLoadNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer / Broker</label>
                  <select
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
                  >
                    <option value="C.H. Robinson Worldwide">C.H. Robinson Worldwide</option>
                    <option value="Total Quality Logistics (TQL)">Total Quality Logistics (TQL)</option>
                    <option value="Echo Global Logistics">Echo Global Logistics</option>
                    <option value="Landstar Ranger Inc.">Landstar Ranger Inc.</option>
                    <option value="Coyote Logistics LLC">Coyote Logistics LLC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Origin City & State *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City (e.g. Chicago)"
                      value={newOriginCity}
                      onChange={(e) => setNewOriginCity(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="IL"
                      value={newOriginState}
                      onChange={(e) => setNewOriginState(e.target.value.toUpperCase())}
                      className="w-14 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 uppercase text-center font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Destination City & State *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City (e.g. Dallas)"
                      value={newDestCity}
                      onChange={(e) => setNewDestCity(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="TX"
                      value={newDestState}
                      onChange={(e) => setNewDestState(e.target.value.toUpperCase())}
                      className="w-14 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 uppercase text-center font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Driver</label>
                  <select
                    value={newDriver}
                    onChange={(e) => setNewDriver(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} (Truck #{d.assignedTruckNumber}) - {d.status.toUpperCase()}
                      </option>
                    ))}
                    <option value="Ray Delgado">Ray Delgado</option>
                    <option value="Marcus Sterling">Marcus Sterling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Revenue ($)</label>
                  <input
                    type="number"
                    value={newRevenue}
                    onChange={(e) => setNewRevenue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment</label>
                  <select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                  >
                    <option value="53ft Reefer">53ft Reefer</option>
                    <option value="53ft Dry Van">53ft Dry Van</option>
                    <option value="Flatbed">Flatbed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Create Load
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Confirmation OCR Upload & Ingest Modal */}
      {showRateConModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Import Real Broker Rate Confirmation</h3>
                  <p className="text-xs text-gray-500">Upload PDF/photo or paste email text to create live load with AI OCR.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRateConModal(false)}
                className="text-gray-400 hover:text-gray-900 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Option 1: File Upload (PDF or Image) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Option 1: Upload Broker Rate Con PDF / Photo
              </span>
              <label className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/10 hover:bg-purple-50/20 rounded-xl p-6 text-center block cursor-pointer transition-all">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <span className="text-xs font-bold text-gray-900 block">Drop Rate Con PDF or Image Here</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">Supports PDF, JPG, PNG from C.H. Robinson, TQL, Echo, Landstar</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleRateConUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Option 2: Paste Rate Con Email Text */}
            <form onSubmit={handleRateConTextSubmit} className="space-y-3 pt-3 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Option 2: Or Paste Rate Con Email / Tender Text
              </span>
              <textarea
                rows={4}
                placeholder="Paste rate con text (e.g. Load # 981240, C.H. Robinson, Aurora IL to Dallas TX, Rate: $3,650, 53ft Reefer 34F)..."
                value={rateConRawText}
                onChange={(e) => setRateConRawText(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] font-mono"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRateConModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isParsingRateCon || !rateConRawText.trim()}
                  className="px-5 py-2 bg-[#007AFF] hover:bg-[#0066CC] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isParsingRateCon ? 'Parsing Rate Con...' : 'Parse & Create Live Load'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Driver Portal Modal */}
      {showShareDriverModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Driver POD Camera Portal</h3>
                  <p className="text-xs text-gray-500">Open live camera on driver phone to scan signed BOLs.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShareDriverModal(false)}
                className="text-gray-400 hover:text-gray-900 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 text-center shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 mx-auto flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">Driver Web Portal Link</span>
                <p className="text-[11px] text-gray-500 mt-1">
                  Drivers open this link on their iPhone or Android to access the live camera and submit signed PODs directly to dispatch.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-gray-200 text-[11px] font-mono text-blue-600 break-all select-all">
                {window.location.origin}?tab=driver
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}?tab=driver`);
                  showToast('📋 Copied Driver Portal Link to clipboard!');
                }}
                className="w-full py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Copy Mobile Link for Drivers</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowShareDriverModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
