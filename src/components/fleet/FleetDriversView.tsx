import React, { useState } from 'react';
import { 
  FleetDriver, 
  Project, 
  CompanyProfile, 
  DriverVaultDocument, 
  DriverMemoryNote, 
  DriverSettlementRecord 
} from '../../types';
import { 
  Users, 
  UserPlus, 
  Truck, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  FileText, 
  Send, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ExternalLink,
  Smartphone,
  FolderOpen,
  Receipt,
  Brain,
  Key,
  Calendar,
  DollarSign,
  Plus,
  UploadCloud,
  FileCheck,
  Eye,
  Award,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { generateDriverDispatchSheetPDF, generateDriverSettlementPDF } from '../../services/pdfGenerator';

interface FleetDriversViewProps {
  drivers: FleetDriver[];
  projects: Project[];
  companyProfile: CompanyProfile;
  onAddDriver: (driver: FleetDriver) => void;
  onUpdateDriver: (driver: FleetDriver) => void;
  onDeleteDriver: (driverId: string) => void;
  onNavigateToTab: (tab: string, projectId?: string) => void;
}

export const FleetDriversView: React.FC<FleetDriversViewProps> = ({
  drivers,
  projects,
  companyProfile,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  onNavigateToTab
}) => {
  // Select first Medina driver by default
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || '');
  const [activeVaultTab, setActiveVaultTab] = useState<'documents' | 'trips' | 'settlements' | 'memory' | 'profile'>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<FleetDriver | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showDocPreviewModal, setShowDocPreviewModal] = useState<DriverVaultDocument | null>(null);

  // New Document Form
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<DriverVaultDocument['type']>('CDL');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocExpiry, setNewDocExpiry] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');

  // New Note Form
  const [newNoteCategory, setNewNoteCategory] = useState<DriverMemoryNote['category']>('preference');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Driver Edit Form
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCdlNumber, setEditCdlNumber] = useState('');
  const [editCdlState, setEditCdlState] = useState('TX');
  const [editTruckNumber, setEditTruckNumber] = useState('');
  const [editTrailerNumber, setEditTrailerNumber] = useState('');
  const [editEquipmentType, setEditEquipmentType] = useState<FleetDriver['equipmentType']>('53ft Reefer');
  const [editDriverStatus, setEditDriverStatus] = useState<FleetDriver['status']>('available');
  const [editCurrentLocation, setEditCurrentLocation] = useState('');
  const [editHosHours, setEditHosHours] = useState(11);
  const [editMedicalCard, setEditMedicalCard] = useState('2027-10-15');
  const [editPinCode, setEditPinCode] = useState('1060');
  const [editPayModel, setEditPayModel] = useState('65% Load Gross');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];

  // Active assigned load for this driver (match by name or first name)
  const activeAssignedLoad = projects.find(p => {
    if (!selectedDriver) return false;
    const driverFirst = selectedDriver.name.toLowerCase().split(' ')[0];
    const projDriver = p.driverName.toLowerCase();
    return projDriver.includes(driverFirst) || projDriver.includes(selectedDriver.name.toLowerCase());
  });

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone.includes(searchQuery) ||
    d.currentLocation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddDriver = () => {
    setEditingDriver(null);
    setEditName('');
    setEditRole('Commercial Driver');
    setEditPhone('(817) 592-');
    setEditEmail('');
    setEditCdlNumber('TX-');
    setEditCdlState('TX');
    setEditTruckNumber('Unit #104 (Freightliner)');
    setEditTrailerNumber('TLR-54204');
    setEditEquipmentType('53ft Reefer');
    setEditDriverStatus('available');
    setEditCurrentLocation('Crowley, TX Terminal');
    setEditHosHours(11);
    setEditMedicalCard('2027-10-15');
    setEditPinCode(Math.floor(1000 + Math.random() * 9000).toString());
    setEditPayModel('65% Load Gross');
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (driver: FleetDriver) => {
    setEditingDriver(driver);
    setEditName(driver.name);
    setEditRole(driver.role || 'Commercial Driver');
    setEditPhone(driver.phone);
    setEditEmail(driver.email);
    setEditCdlNumber(driver.cdlNumber);
    setEditCdlState(driver.cdlState);
    setEditTruckNumber(driver.truckNumber);
    setEditTrailerNumber(driver.trailerNumber);
    setEditEquipmentType(driver.equipmentType);
    setEditDriverStatus(driver.status);
    setEditCurrentLocation(driver.currentLocation);
    setEditHosHours(driver.hOSRemainingHours);
    setEditMedicalCard(driver.medicalCardExpiry);
    setEditPinCode(driver.pinCode || '1060');
    setEditPayModel(driver.payModel || '65% Load Gross');
    setShowDriverModal(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) {
      showToast('Please provide a driver name and contact phone number');
      return;
    }

    if (editingDriver) {
      const updated: FleetDriver = {
        ...editingDriver,
        name: editName.trim(),
        role: editRole.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || `${editName.toLowerCase().replace(/\s+/g, '.')}@greenexpressllc.com`,
        cdlNumber: editCdlNumber.trim(),
        cdlState: editCdlState.trim(),
        truckNumber: editTruckNumber.trim(),
        trailerNumber: editTrailerNumber.trim(),
        equipmentType: editEquipmentType,
        status: editDriverStatus,
        currentLocation: editCurrentLocation.trim(),
        hOSRemainingHours: Number(editHosHours),
        medicalCardExpiry: editMedicalCard,
        pinCode: editPinCode,
        payModel: editPayModel
      };
      onUpdateDriver(updated);
      showToast(`Updated driver account for ${editName}`);
    } else {
      const newDriver: FleetDriver = {
        id: `drv-${Date.now()}`,
        name: editName.trim(),
        role: editRole.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || `${editName.toLowerCase().replace(/\s+/g, '.')}@greenexpressllc.com`,
        cdlNumber: editCdlNumber.trim(),
        cdlState: editCdlState.trim(),
        truckNumber: editTruckNumber.trim(),
        trailerNumber: editTrailerNumber.trim(),
        assignedTruckNumber: editTruckNumber.replace(/\D/g, '').substring(0, 3) || '104',
        assignedTrailerNumber: editTrailerNumber.replace(/\D/g, '').substring(0, 5) || '54204',
        equipmentType: editEquipmentType,
        status: editDriverStatus,
        currentLocation: editCurrentLocation.trim() || 'Crowley, TX Yard',
        hOSRemainingHours: Number(editHosHours),
        medicalCardExpiry: editMedicalCard,
        hireDate: new Date().toISOString().split('T')[0],
        avatarBg: 'bg-emerald-600',
        pinCode: editPinCode,
        payModel: editPayModel,
        totalMilesDriven: 50000,
        lifetimeLoadsCount: 20,
        lifetimeEarnings: 30000,
        vaultDocuments: [
          {
            id: `doc-cdl-${Date.now()}`,
            title: 'Commercial Driver License (Class A)',
            type: 'CDL',
            fileName: `${editName.replace(/\s+/g, '_')}_CDL.pdf`,
            fileSize: '1.5 MB',
            uploadDate: new Date().toISOString().split('T')[0],
            expiryDate: '2028-10-15',
            status: 'valid',
            notes: 'Texas CDL Class A verified.'
          }
        ],
        driverNotes: [],
        settlements: []
      };
      onAddDriver(newDriver);
      setSelectedDriverId(newDriver.id);
      showToast(`Added ${editName} to Medina fleet roster`);
    }

    setShowDriverModal(false);
  };

  const handleAddVaultDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !newDocTitle.trim()) return;

    const newDoc: DriverVaultDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      type: newDocType,
      fileName: newDocFileName.trim() || `${newDocTitle.replace(/\s+/g, '_')}.pdf`,
      fileSize: '1.2 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      expiryDate: newDocExpiry || undefined,
      status: 'valid',
      notes: newDocNotes.trim() || undefined
    };

    const updatedDriver: FleetDriver = {
      ...selectedDriver,
      vaultDocuments: [newDoc, ...(selectedDriver.vaultDocuments || [])]
    };

    onUpdateDriver(updatedDriver);
    showToast(`Stored "${newDoc.title}" in ${selectedDriver.name}'s memory vault`);
    setShowAddDocModal(false);
    setNewDocTitle('');
    setNewDocFileName('');
    setNewDocExpiry('');
    setNewDocNotes('');
  };

  const handleDeleteVaultDocument = (docId: string) => {
    if (!selectedDriver) return;
    const updatedDocs = (selectedDriver.vaultDocuments || []).filter(d => d.id !== docId);
    onUpdateDriver({
      ...selectedDriver,
      vaultDocuments: updatedDocs
    });
    showToast('Removed document from vault');
  };

  const handleAddMemoryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !newNoteContent.trim()) return;

    const newNote: DriverMemoryNote = {
      id: `note-${Date.now()}`,
      category: newNoteCategory,
      title: newNoteTitle.trim() || 'Operational Note',
      content: newNoteContent.trim(),
      author: 'Dispatch / ' + selectedDriver.name,
      timestamp: new Date().toISOString().split('T')[0]
    };

    const updatedDriver: FleetDriver = {
      ...selectedDriver,
      driverNotes: [newNote, ...(selectedDriver.driverNotes || [])]
    };

    onUpdateDriver(updatedDriver);
    showToast(`Logged memory note for ${selectedDriver.name}`);
    setShowAddNoteModal(false);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const handleDownloadDispatchSheet = (driver: FleetDriver) => {
    const proj = activeAssignedLoad || projects[0];
    if (proj) {
      generateDriverDispatchSheetPDF(proj, companyProfile, driver);
      showToast(`Downloaded Official Driver Dispatch Sheet for ${driver.name} (Load #${proj.loadNumber})`);
    } else {
      showToast('No active or historical load found to generate dispatch sheet');
    }
  };

  const handleDownloadSettlement = (driver: FleetDriver, settlement?: DriverSettlementRecord) => {
    generateDriverSettlementPDF(driver, companyProfile, settlement);
    showToast(`Downloaded official pay settlement statement for ${driver.name}`);
  };

  const handleSendDispatchSms = (driver: FleetDriver) => {
    const proj = activeAssignedLoad || projects[0];
    showToast(`📱 Dispatch order for Load #${proj?.loadNumber || 'GE-Active'} transmitted via SMS to ${driver.name} at ${driver.phone}!`);
  };

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const onRoadCount = drivers.filter(d => d.status === 'dispatched' || d.status === 'driving').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header (Apple / Alvys enterprise layout) */}
      <div className="px-6 py-4 bg-white border-b border-[#E5E5EA] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-950 tracking-tight flex items-center gap-2">
              <span>Medina Family Fleet & Driver Memory Vault</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-[#007AFF] font-mono font-semibold border border-blue-200">
                4 Power Units
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                FMCSA Compliant
              </span>
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Dedicated driver accounts, CDL & medical vaults, trip sheets, settlements, and AI driver memory for Jesus, Jose, Luis & Alfredo Medina.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search driver, truck, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#F5F5F7] border border-gray-300 rounded-lg text-xs text-gray-950 placeholder-gray-400 focus:outline-none focus:border-[#007AFF] focus:bg-white w-52 transition-all"
            />
          </div>

          <button
            onClick={() => onNavigateToTab('driver')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Driver Check-In App</span>
          </button>

          <button
            onClick={() => onNavigateToTab('projects')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dispatch Matrix</span>
          </button>

          <button
            onClick={handleOpenAddDriver}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Driver</span>
          </button>
        </div>
      </div>

      {/* Fleet Overview Metrics Ribbon */}
      <div className="px-6 py-2.5 bg-white/70 border-b border-[#E5E5EA] flex items-center justify-between gap-4 text-xs shrink-0 overflow-x-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-gray-500 font-medium">Active Fleet:</span>
            <span className="font-bold text-gray-900 font-mono">4 Medina Drivers</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">On Road / Dispatched:</span>
            <span className="font-bold text-blue-600 font-mono">{onRoadCount} units</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Available for Loads:</span>
            <span className="font-bold text-emerald-600 font-mono">{availableCount} ready</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Authority & DOT:</span>
            <span className="font-bold text-gray-800 font-mono">USDOT-{companyProfile.dotNumber} · MC-{companyProfile.mcNumber}</span>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>All Medical Cards & CDL-A Credentials Verified Active</span>
        </div>
      </div>

      {/* Master 2-Column Split: Driver Roster Selector on Left + Memory Vault on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: 4 Driver Cards Selector */}
        <div className="w-80 border-r border-[#E5E5EA] bg-white flex flex-col shrink-0 overflow-y-auto p-3 space-y-2">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>Medina Family Drivers ({filteredDrivers.length})</span>
            <span>Status</span>
          </div>

          {filteredDrivers.map((driver) => {
            const isSelected = driver.id === selectedDriver?.id;
            const assignedLoad = projects.find(p => p.driverName.toLowerCase().includes(driver.name.toLowerCase().split(' ')[0]));

            return (
              <div
                key={driver.id}
                onClick={() => setSelectedDriverId(driver.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/60 border-[#007AFF] shadow-xs ring-1 ring-[#007AFF]/30'
                    : 'bg-white border-[#E5E5EA] hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${driver.avatarBg || 'bg-emerald-600'} text-white font-bold text-xs flex items-center justify-center shadow-2xs`}>
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-950 flex items-center gap-1">
                        <span>{driver.name}</span>
                        {driver.name.includes('Jesus') && <span className="text-[9px] text-[#007AFF] font-bold">★ Lead</span>}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium truncate max-w-[130px]">
                        {driver.role || 'Commercial Driver'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    driver.status === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : driver.status === 'driving'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : driver.status === 'dispatched'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {driver.status}
                  </span>
                </div>

                {/* Truck & Equipment snippet */}
                <div className="text-[11px] text-gray-600 font-medium truncate flex items-center gap-1 mb-1">
                  <Truck className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{driver.truckNumber}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1.5 border-t border-gray-100">
                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                    <MapPin className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    <span className="truncate">{driver.currentLocation}</span>
                  </span>

                  <span className="font-mono text-emerald-700 font-semibold shrink-0">
                    {driver.hOSRemainingHours}h drive
                  </span>
                </div>

                {assignedLoad && (
                  <div className="mt-2 pt-1.5 border-t border-blue-100 text-[10px] text-[#007AFF] font-medium flex items-center justify-between">
                    <span className="font-mono font-bold">Load #{assignedLoad.loadNumber}</span>
                    <span className="text-gray-500">{assignedLoad.originCity} → {assignedLoad.destCity}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: The Selected Driver's Memory Vault */}
        {selectedDriver ? (
          <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-y-auto">
            {/* Driver Account Hero Header */}
            <div className="p-6 bg-white border-b border-[#E5E5EA] shrink-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${selectedDriver.avatarBg || 'bg-emerald-600'} text-white font-extrabold text-xl flex items-center justify-center shadow-sm`}>
                    {selectedDriver.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-gray-950 tracking-tight">
                        {selectedDriver.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        {selectedDriver.role || 'Commercial Driver'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-mono font-medium">
                        PIN: #{selectedDriver.pinCode || '1060'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-gray-700 font-mono">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <a href={`tel:${selectedDriver.phone}`} className="hover:text-blue-600 font-semibold">{selectedDriver.phone}</a>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-gray-700">
                        <Mail className="w-3 h-3 text-blue-600" />
                        <a href={`mailto:${selectedDriver.email}`} className="hover:text-blue-600">{selectedDriver.email}</a>
                      </span>
                      <span>·</span>
                      <span className="text-gray-600 font-mono">CDL: {selectedDriver.cdlNumber} ({selectedDriver.cdlState})</span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-medium">
                        Truck: {selectedDriver.truckNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-medium">
                        Trailer: #{selectedDriver.trailerNumber} ({selectedDriver.equipmentType})
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                        Pay: {selectedDriver.payModel || '65% Load Gross'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleDownloadDispatchSheet(selectedDriver)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    title="Generate and download driver dispatch order sheet"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dispatch Sheet (PDF)</span>
                  </button>

                  <button
                    onClick={() => handleSendDispatchSms(selectedDriver)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send SMS</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditDriver(selectedDriver)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              {/* Driver Lifetime Statistics Bar */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F5F5F7] border border-gray-200/80">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Lifetime Safe Miles</span>
                  <span className="text-base font-bold text-gray-900 font-mono mt-0.5 block">
                    {(selectedDriver.totalMilesDriven || 450000).toLocaleString()} mi
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F5F5F7] border border-gray-200/80">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Completed Loads</span>
                  <span className="text-base font-bold text-blue-600 font-mono mt-0.5 block">
                    {selectedDriver.lifetimeLoadsCount || 310} loads
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F5F5F7] border border-gray-200/80">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Career Settlements</span>
                  <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                    ${(selectedDriver.lifetimeEarnings || 395000).toLocaleString()} USD
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F5F5F7] border border-gray-200/80">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">DOT Medical Card</span>
                  <span className="text-base font-bold text-gray-900 font-mono mt-0.5 block flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Expires {selectedDriver.medicalCardExpiry}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Memory Vault Sub-Navigation Tabs */}
            <div className="px-6 bg-white border-b border-[#E5E5EA] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-1 -mb-px">
                <button
                  onClick={() => setActiveVaultTab('documents')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                    activeVaultTab === 'documents'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Paperwork & Credentials Vault ({(selectedDriver.vaultDocuments || []).length})</span>
                </button>

                <button
                  onClick={() => setActiveVaultTab('trips')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                    activeVaultTab === 'trips'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Active Dispatches & Load Memory</span>
                </button>

                <button
                  onClick={() => setActiveVaultTab('settlements')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                    activeVaultTab === 'settlements'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Pay & Settlement Ledger ({(selectedDriver.settlements || []).length})</span>
                </button>

                <button
                  onClick={() => setActiveVaultTab('memory')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                    activeVaultTab === 'memory'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>AI Driver Memory & Notes ({(selectedDriver.driverNotes || []).length})</span>
                </button>

                <button
                  onClick={() => setActiveVaultTab('profile')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                    activeVaultTab === 'profile'
                      ? 'border-[#007AFF] text-[#007AFF]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Compliance & Endorsements</span>
                </button>
              </div>

              {/* Tab specific action */}
              {activeVaultTab === 'documents' && (
                <button
                  onClick={() => setShowAddDocModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Vault Document</span>
                </button>
              )}

              {activeVaultTab === 'memory' && (
                <button
                  onClick={() => setShowAddNoteModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Memory Note</span>
                </button>
              )}
            </div>

            {/* Sub-Tab Content Views */}
            <div className="p-6 flex-1 overflow-y-auto">
              {/* TAB 1: PAPERWORK & CREDENTIALS VAULT */}
              {activeVaultTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {selectedDriver.name}’s Verified Paperwork Locker
                      </h3>
                      <p className="text-xs text-gray-500">
                        Store CDL licenses, DOT medical cards, lease agreements, cab cards, and inspection stickers directly on this driver’s account.
                      </p>
                    </div>

                    <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Vault Secure: 256-Bit Encrypted
                    </span>
                  </div>

                  {/* Documents Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {(selectedDriver.vaultDocuments || []).map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-white border border-[#E5E5EA] rounded-xl hover:border-gray-300 transition-all shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#007AFF] border border-blue-200 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block">
                                  {doc.type}
                                </span>
                                <h4 className="text-xs font-bold text-gray-950 leading-tight">
                                  {doc.title}
                                </h4>
                              </div>
                            </div>

                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              VALID
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-500 space-y-1 my-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                              <span>File Name:</span>
                              <span className="font-mono text-gray-800 truncate max-w-[130px]">{doc.fileName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Uploaded:</span>
                              <span className="font-mono text-gray-800">{doc.uploadDate}</span>
                            </div>
                            {doc.expiryDate && (
                              <div className="flex items-center justify-between font-semibold text-gray-800">
                                <span>Expires:</span>
                                <span className="text-emerald-700 font-mono">{doc.expiryDate}</span>
                              </div>
                            )}
                          </div>

                          {doc.notes && (
                            <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed mb-3">
                              {doc.notes}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => setShowDocPreviewModal(doc)}
                            className="text-[#007AFF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                showToast(`Downloading ${doc.fileName}...`);
                              }}
                              className="p-1 text-gray-500 hover:text-gray-900 rounded cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVaultDocument(doc.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                              title="Remove Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!selectedDriver.vaultDocuments || selectedDriver.vaultDocuments.length === 0) && (
                    <div className="p-8 text-center bg-white border border-dashed border-gray-300 rounded-xl">
                      <FolderOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-700">No documents in vault yet</p>
                      <p className="text-[11px] text-gray-400 mt-1 mb-3">Add this driver's CDL, medical examiner cert, or W-9.</p>
                      <button
                        onClick={() => setShowAddDocModal(true)}
                        className="px-3 py-1.5 bg-[#007AFF] text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Upload Paperwork
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ACTIVE DISPATCHES & LOAD MEMORY */}
              {activeVaultTab === 'trips' && (
                <div className="space-y-5">
                  {/* Current Active Load */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Currently Assigned Load</h3>
                    {activeAssignedLoad ? (
                      <div className="p-5 bg-white border border-blue-200 rounded-2xl shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base text-gray-950">
                              Load #{activeAssignedLoad.loadNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                              {activeAssignedLoad.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">· Customer: {activeAssignedLoad.customerName}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">Gross:</span>
                            <span className="font-mono font-bold text-emerald-600 text-sm">
                              ${activeAssignedLoad.estimatedRevenue.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs text-gray-500">Driver Pay (65%):</span>
                            <span className="font-mono font-bold text-blue-600 text-sm">
                              ${(activeAssignedLoad.estimatedRevenue * 0.65).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Lane details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-[#F5F5F7] p-3 rounded-xl border border-gray-200/80">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Pickup Origin</span>
                            <span className="font-bold text-gray-900 block mt-0.5">
                              {activeAssignedLoad.originCity}, {activeAssignedLoad.originState}
                            </span>
                            <span className="text-[11px] text-gray-500">Appt: {activeAssignedLoad.pickupDate}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Destination Consignee</span>
                            <span className="font-bold text-gray-900 block mt-0.5">
                              {activeAssignedLoad.destCity}, {activeAssignedLoad.destState}
                            </span>
                            <span className="text-[11px] text-gray-500">Delivery: {activeAssignedLoad.deliveryDate}</span>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-semibold block">Equipment & Cargo</span>
                            <span className="font-bold text-gray-900 block mt-0.5">{activeAssignedLoad.equipmentType}</span>
                            <span className="text-[11px] text-gray-500">{activeAssignedLoad.weightLbs.toLocaleString()} lbs · {activeAssignedLoad.commodities || 'General Freight'}</span>
                          </div>
                        </div>

                        {/* Quick dispatch actions */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => onNavigateToTab('projects', activeAssignedLoad.id)}
                            className="text-xs text-[#007AFF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open in Dispatch Matrix</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadDispatchSheet(selectedDriver)}
                              className="px-3 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Dispatch Sheet (PDF)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-white border border-gray-200 rounded-xl">
                        <Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-900">{selectedDriver.name} is currently available</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 mb-3">No active freight load currently dispatched to this truck.</p>
                        <button
                          onClick={() => onNavigateToTab('projects')}
                          className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Dispatch a Load in Matrix
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Historical Dispatches Completed by Driver */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Driver Load History & Completed Dispatches</h3>
                    <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs text-gray-700">
                        <thead className="bg-[#F5F5F7] border-b border-gray-200 text-gray-500 font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Load #</th>
                            <th className="py-2.5 px-4">Broker / Customer</th>
                            <th className="py-2.5 px-4">Lane</th>
                            <th className="py-2.5 px-4">Equipment</th>
                            <th className="py-2.5 px-4 text-right">Gross Freight</th>
                            <th className="py-2.5 px-4 text-right">Driver Payout</th>
                            <th className="py-2.5 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {projects.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{p.loadNumber}</td>
                              <td className="py-2.5 px-4 font-medium text-gray-800">{p.customerName}</td>
                              <td className="py-2.5 px-4 text-gray-600">{p.originCity}, {p.originState} → {p.destCity}, {p.destState}</td>
                              <td className="py-2.5 px-4 text-gray-600">{p.equipmentType}</td>
                              <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-600">
                                ${p.estimatedRevenue.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-600">
                                ${(p.estimatedRevenue * 0.65).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  COMPLETED
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PAY & SETTLEMENT LEDGER */}
              {activeVaultTab === 'settlements' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {selectedDriver.name}’s Pay Settlements & Direct Deposit Statements
                      </h3>
                      <p className="text-xs text-gray-500">
                        Weekly gross freight split, fuel advances, deductions, and downloadable official settlement pay stubs.
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadSettlement(selectedDriver, selectedDriver.settlements?.[0])}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Latest Settlement (PDF)</span>
                    </button>
                  </div>

                  <div className="bg-white border border-[#E5E5EA] rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs text-gray-700">
                      <thead className="bg-[#F5F5F7] border-b border-gray-200 text-gray-500 font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Statement #</th>
                          <th className="py-2.5 px-4">Week Ending</th>
                          <th className="py-2.5 px-4">Loads Count</th>
                          <th className="py-2.5 px-4 text-right">Gross Freight</th>
                          <th className="py-2.5 px-4 text-right">Driver Share (65%)</th>
                          <th className="py-2.5 px-4 text-right">Deductions</th>
                          <th className="py-2.5 px-4 text-right">Net Direct Deposit</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                          <th className="py-2.5 px-4 text-center">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(selectedDriver.settlements || []).map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{s.settlementNumber}</td>
                            <td className="py-2.5 px-4 text-gray-600">{s.weekEnding}</td>
                            <td className="py-2.5 px-4 text-gray-600">{s.loadNumbers.join(', ')}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-gray-900">
                              ${s.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-semibold text-blue-600">
                              ${s.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-red-600">
                              -${s.deductionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                              ${s.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {s.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={() => handleDownloadSettlement(selectedDriver, s)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded text-[11px] font-semibold flex items-center gap-1 mx-auto cursor-pointer"
                              >
                                <Download className="w-3 h-3 text-blue-600" />
                                <span>PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: AI DRIVER MEMORY & NOTES */}
              {activeVaultTab === 'memory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {selectedDriver.name}’s Operational Memory & Knowledge Base
                      </h3>
                      <p className="text-xs text-gray-500">
                        Rest stop habits, customer dock quirks, preferred corridors, and equipment instructions remembered by the system.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddNoteModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Memory Note</span>
                    </button>
                  </div>

                  {/* Notes Feed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {(selectedDriver.driverNotes || []).map((note) => (
                      <div
                        key={note.id}
                        className="p-4 bg-white border border-[#E5E5EA] rounded-xl hover:border-gray-300 transition-all shadow-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            note.category === 'preference'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : note.category === 'operational'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : note.category === 'safety'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {note.category}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{note.timestamp}</span>
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 mb-1">{note.title}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">{note.content}</p>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                          <span>Recorded by: {note.author}</span>
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Synced
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Preferred Freight Corridors */}
                  {selectedDriver.preferredLanes && (
                    <div className="p-4 bg-white border border-[#E5E5EA] rounded-xl shadow-xs space-y-2 mt-4">
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#007AFF]" />
                        <span>Driver Preferred Freight Corridors</span>
                      </h4>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedDriver.preferredLanes.map((lane, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-[#F5F5F7] border border-gray-300 rounded-lg text-xs font-medium text-gray-800"
                          >
                            {lane}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: COMPLIANCE & ENDORSEMENTS PROFILE */}
              {activeVaultTab === 'profile' && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#E5E5EA] rounded-xl p-5 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
                      CDL-A Endorsements & Driver Qualification
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <span className="text-gray-500 font-semibold block text-[10px] uppercase">Active Endorsements</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedDriver.endorsements || ['Class A CDL', 'Air Brakes']).map((end, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold">
                              ✓ {end}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-gray-500 font-semibold block text-[10px] uppercase">Emergency Contact</span>
                        <p className="text-gray-900 font-bold">{selectedDriver.emergencyContactName || 'Maria Medina'}</p>
                        <p className="text-gray-600 font-mono">{selectedDriver.emergencyContactPhone || '(817) 592-9901'}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-gray-500 font-semibold block text-[10px] uppercase">Home Terminal</span>
                        <p className="text-gray-900 font-medium">100 Industrial Pkwy, Crowley, TX 76036</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-gray-500 font-semibold block text-[10px] uppercase">Hire Date & Service</span>
                        <p className="text-gray-900 font-medium">Joined {selectedDriver.hireDate} (Active Senior Driver)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
            Select a driver to view their memory vault
          </div>
        )}
      </div>

      {/* MODAL 1: ADD DOCUMENT TO DRIVER VAULT */}
      {showAddDocModal && selectedDriver && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#007AFF]" />
                <span>Store Paperwork in {selectedDriver.name}’s Vault</span>
              </h3>
              <button
                onClick={() => setShowAddDocModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVaultDocument} className="space-y-3.5 text-xs">
              <div>
                <label className="text-gray-700 font-semibold block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CDL License Front & Back"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Document Category</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white cursor-pointer"
                  >
                    <option value="CDL">CDL License</option>
                    <option value="MedicalCard">DOT Medical Card</option>
                    <option value="W9_Contract">W-9 & Subcontractor Agreement</option>
                    <option value="Inspection">Annual DOT Inspection</option>
                    <option value="CabCard">Cab Card / Registration</option>
                    <option value="DrugTest">Drug & Alcohol Certificate</option>
                    <option value="DQF">Driver Qualification File</option>
                    <option value="Custom">Other Paperwork</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Expiration Date (if applicable)</label>
                  <input
                    type="date"
                    value={newDocExpiry}
                    onChange={(e) => setNewDocExpiry(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jesus_Medina_CDL_2026.pdf"
                  value={newDocFileName}
                  onChange={(e) => setNewDocFileName(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Audit Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified by safety auditor. Class A with Tanker endorsement."
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MEMORY NOTE */}
      {showAddNoteModal && selectedDriver && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#007AFF]" />
                <span>Log Driver Memory for {selectedDriver.name}</span>
              </h3>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemoryNote} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Category</label>
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white cursor-pointer"
                  >
                    <option value="preference">Driver Preference</option>
                    <option value="operational">Operational Standard</option>
                    <option value="safety">Safety Audit & Compliance</option>
                    <option value="lane_history">Shipper / Lane Memory</option>
                    <option value="personal">Personal / Terminal Routine</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fuel Card & Truck Stop Habits"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Memory Note Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Prefers fueling at Love's in Weatherford. Home in Crowley every Friday night. Pre-cools reefer 2 hours prior to produce loading."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Record Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT / ADD DRIVER PROFILE */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#007AFF]" />
                <span>{editingDriver ? `Edit ${editingDriver.name}’s Account` : 'Add New Commercial Driver'}</span>
              </h3>
              <button
                onClick={() => setShowDriverModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Role / Position</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Phone Number (For Dispatches) *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-gray-700 font-semibold block mb-1">CDL License Number</label>
                  <input
                    type="text"
                    value={editCdlNumber}
                    onChange={(e) => setEditCdlNumber(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">State</label>
                  <input
                    type="text"
                    value={editCdlState}
                    onChange={(e) => setEditCdlState(e.target.value.toUpperCase())}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 uppercase font-semibold text-center focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Assigned Truck</label>
                  <input
                    type="text"
                    value={editTruckNumber}
                    onChange={(e) => setEditTruckNumber(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Assigned Trailer</label>
                  <input
                    type="text"
                    value={editTrailerNumber}
                    onChange={(e) => setEditTrailerNumber(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Equipment</label>
                  <select
                    value={editEquipmentType}
                    onChange={(e) => setEditEquipmentType(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white cursor-pointer"
                  >
                    <option value="53ft Reefer">53ft Reefer</option>
                    <option value="53ft Dry Van">53ft Dry Van</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Stepdeck">Stepdeck</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Status</label>
                  <select
                    value={editDriverStatus}
                    onChange={(e) => setEditDriverStatus(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="driving">Driving</option>
                    <option value="on_break">On Break</option>
                    <option value="off_duty">Off Duty</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Pay Model</label>
                  <input
                    type="text"
                    value={editPayModel}
                    onChange={(e) => setEditPayModel(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Current City / Location</label>
                  <input
                    type="text"
                    value={editCurrentLocation}
                    onChange={(e) => setEditCurrentLocation(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-gray-700 font-semibold block mb-1">Medical Card Expiry</label>
                  <input
                    type="date"
                    value={editMedicalCard}
                    onChange={(e) => setEditMedicalCard(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-[#007AFF] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save Driver Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DOCUMENT VIEWER PREVIEW */}
      {showDocPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5EA] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">{showDocPreviewModal.title}</h3>
              </div>
              <button
                onClick={() => setShowDocPreviewModal(null)}
                className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Document Type:</span>
                <span className="font-bold text-gray-900 uppercase font-mono">{showDocPreviewModal.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">File Name:</span>
                <span className="font-mono text-gray-800">{showDocPreviewModal.fileName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Upload Date:</span>
                <span className="font-mono text-gray-800">{showDocPreviewModal.uploadDate}</span>
              </div>
              {showDocPreviewModal.expiryDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Expiration Date:</span>
                  <span className="font-mono font-bold text-emerald-700">{showDocPreviewModal.expiryDate}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Compliance Status:</span>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  VERIFIED & ACTIVE
                </span>
              </div>
            </div>

            {showDocPreviewModal.notes && (
              <div className="text-xs text-gray-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <span className="font-bold text-[#007AFF] block mb-0.5">Auditor / Driver Note:</span>
                {showDocPreviewModal.notes}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDocPreviewModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast(`Downloading official verified copy of ${showDocPreviewModal.fileName}...`);
                  setShowDocPreviewModal(null);
                }}
                className="px-4 py-2 bg-[#007AFF] hover:bg-[#0066CC] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Verified PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
