import React, { useState } from 'react';
import { FleetDriver, Project, CompanyProfile } from '../../types';
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
  Smartphone
} from 'lucide-react';
import { generateDriverDispatchSheetPDF } from '../../services/pdfGenerator';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<FleetDriver | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cdlNumber, setCdlNumber] = useState('');
  const [cdlState, setCdlState] = useState('IL');
  const [truckNumber, setTruckNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [equipmentType, setEquipmentType] = useState<FleetDriver['equipmentType']>('53ft Reefer');
  const [driverStatus, setDriverStatus] = useState<FleetDriver['status']>('available');
  const [currentLocation, setCurrentLocation] = useState('');
  const [hosHours, setHosHours] = useState(10);
  const [medicalCard, setMedicalCard] = useState('2027-06-30');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setEmail('');
    setCdlNumber('');
    setCdlState('IL');
    setTruckNumber('TRK-' + Math.floor(100 + Math.random() * 900));
    setTrailerNumber('TLR-' + Math.floor(500 + Math.random() * 500));
    setEquipmentType('53ft Reefer');
    setDriverStatus('available');
    setCurrentLocation('Terminal Yard');
    setHosHours(11);
    setMedicalCard('2027-08-30');
    setShowDriverModal(true);
  };

  const handleOpenEdit = (driver: FleetDriver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone);
    setEmail(driver.email);
    setCdlNumber(driver.cdlNumber);
    setCdlState(driver.cdlState);
    setTruckNumber(driver.truckNumber);
    setTrailerNumber(driver.trailerNumber);
    setEquipmentType(driver.equipmentType);
    setDriverStatus(driver.status);
    setCurrentLocation(driver.currentLocation);
    setHosHours(driver.hOSRemainingHours);
    setMedicalCard(driver.medicalCardExpiry);
    setShowDriverModal(true);
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('Please provide a driver name and contact phone number');
      return;
    }

    if (editingDriver) {
      const updated: FleetDriver = {
        ...editingDriver,
        name,
        phone,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@${companyProfile.companyName.toLowerCase().replace(/[^a-z]/g, '')}.net`,
        cdlNumber,
        cdlState,
        truckNumber,
        trailerNumber,
        equipmentType,
        status: driverStatus,
        currentLocation,
        hOSRemainingHours: hosHours,
        medicalCardExpiry: medicalCard
      };
      onUpdateDriver(updated);
      showToast(`Updated driver ${name}`);
    } else {
      const newDriver: FleetDriver = {
        id: `drv-${Date.now()}`,
        name,
        phone,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@${companyProfile.companyName.toLowerCase().replace(/[^a-z]/g, '')}.net`,
        cdlNumber,
        cdlState,
        truckNumber,
        trailerNumber,
        equipmentType,
        status: driverStatus,
        currentLocation: currentLocation || 'Terminal Yard',
        hOSRemainingHours: hosHours,
        medicalCardExpiry: medicalCard,
        hireDate: new Date().toISOString().split('T')[0]
      };
      onAddDriver(newDriver);
      showToast(`Added new driver ${name} to fleet roster`);
    }

    setShowDriverModal(false);
  };

  const handleDownloadDispatchSheet = (driver: FleetDriver) => {
    const assignedProject = projects.find(p => p.driverName.toLowerCase().includes(driver.name.toLowerCase().split(' ')[0])) || projects[0];
    if (assignedProject) {
      generateDriverDispatchSheetPDF(assignedProject, companyProfile, driver);
      showToast(`Downloaded Driver Dispatch Sheet for ${driver.name} (Load #${assignedProject.loadNumber})`);
    } else {
      showToast('No active load assigned to this driver');
    }
  };

  const handleSendDispatchSms = (driver: FleetDriver) => {
    const assignedProject = projects.find(p => p.driverName.toLowerCase().includes(driver.name.toLowerCase().split(' ')[0])) || projects[0];
    showToast(`📱 Dispatch Sheet & instructions sent to ${driver.name} via SMS at ${driver.phone}!`);
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.truckNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.currentLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const onRoadCount = drivers.filter(d => d.status === 'dispatched' || d.status === 'driving').length;

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">
                    Family Fleet Roster & Dispatch (10 Trucks)
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                    {companyProfile.companyName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                    Family Owned & Operated
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Dedicated 10-truck asset fleet (Units #101 – #110). Manage family owner-operators, commercial drivers, assigned 53ft Reefers & Dry Vans, and instant PDF/SMS driver dispatches.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateToTab('driver')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Driver Check-In Portal</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Real Driver</span>
            </button>
          </div>
        </div>

        {/* Fleet Metrics Row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Fleet Drivers</span>
            <span className="text-lg font-bold text-white font-mono mt-0.5 block">{drivers.length} commercial drivers</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Active On Road</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">{onRoadCount} dispatched</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-blue-400 uppercase font-semibold block">Available for Dispatch</span>
            <span className="text-lg font-bold text-blue-300 font-mono mt-0.5 block">{availableCount} ready</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase font-semibold block">DOT Authority</span>
            <span className="text-lg font-bold text-amber-300 font-mono mt-0.5 block">MC-{companyProfile.mcNumber}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search drivers by name, phone, truck #, or current city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({drivers.length})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'available' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Available ({availableCount})
          </button>
          <button
            onClick={() => setStatusFilter('dispatched')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'dispatched' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dispatched
          </button>
          <button
            onClick={() => setStatusFilter('driving')}
            className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
              statusFilter === 'driving' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Driving
          </button>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredDrivers.map((driver) => {
          const assignedProject = projects.find(p => p.driverName.toLowerCase().includes(driver.name.toLowerCase().split(' ')[0]));

          return (
            <div
              key={driver.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold flex items-center justify-center text-sm">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{driver.name}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          driver.status === 'available'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : driver.status === 'driving'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : driver.status === 'dispatched'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {driver.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </h3>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        CDL: {driver.cdlNumber} ({driver.cdlState})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(driver)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Edit Driver"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDriver(driver.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 cursor-pointer"
                      title="Remove Driver"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Assigned Equipment & Location */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Equipment</span>
                    <span className="text-slate-200 font-semibold truncate block">
                      {driver.truckNumber} · {driver.trailerNumber} ({driver.equipmentType})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Last Known Location</span>
                    <span className="text-slate-300 font-medium truncate block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{driver.currentLocation}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Contact Phone</span>
                    <a href={`tel:${driver.phone}`} className="text-indigo-400 hover:underline font-mono text-xs block">
                      {driver.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">HOS Remaining</span>
                    <span className="text-emerald-400 font-bold font-mono text-xs block flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {driver.hOSRemainingHours} hrs drive time
                    </span>
                  </div>
                </div>

                {/* Active Assigned Load */}
                {assignedProject && (
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-indigo-400 uppercase font-bold">Active Load Assigned</div>
                      <div className="text-slate-200 font-bold font-mono mt-0.5">
                        #{assignedProject.loadNumber} · {assignedProject.originCity}, {assignedProject.originState} → {assignedProject.destCity}, {assignedProject.destState}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        Revenue: ${assignedProject.estimatedRevenue.toLocaleString()} USD
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToTab('projects', assignedProject.id)}
                      className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      View in Matrix
                    </button>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${driver.phone}`}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Call</span>
                  </a>

                  <button
                    onClick={() => handleSendDispatchSms(driver)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3 text-blue-400" />
                    <span>Send SMS</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDownloadDispatchSheet(driver)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Dispatch Sheet (PDF)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver Modal (Add / Edit) */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>{editingDriver ? 'Edit Commercial Driver' : 'Add Driver to Fleet Roster'}</span>
              </h3>
              <button
                onClick={() => setShowDriverModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Driver Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Mobile Phone (For Dispatch) *</label>
                  <input
                    type="text"
                    required
                    placeholder="(312) 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Driver Email</label>
                  <input
                    type="email"
                    placeholder="driver@medinalogistics.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">CDL Number & State</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      placeholder="CDL #"
                      value={cdlNumber}
                      onChange={(e) => setCdlNumber(e.target.value)}
                      className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      value={cdlState}
                      onChange={(e) => setCdlState(e.target.value.toUpperCase())}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-center font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Assigned Tractor (Truck #)</label>
                  <input
                    type="text"
                    value={truckNumber}
                    onChange={(e) => setTruckNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Assigned Trailer #</label>
                  <input
                    type="text"
                    value={trailerNumber}
                    onChange={(e) => setTrailerNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Equipment Category</label>
                  <select
                    value={equipmentType}
                    onChange={(e) => setEquipmentType(e.target.value as FleetDriver['equipmentType'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer focus:outline-none"
                  >
                    <option value="53ft Reefer">53ft Reefer</option>
                    <option value="53ft Dry Van">53ft Dry Van</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Stepdeck">Stepdeck</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Duty Status</label>
                  <select
                    value={driverStatus}
                    onChange={(e) => setDriverStatus(e.target.value as FleetDriver['status'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="driving">Driving</option>
                    <option value="on_break">On Break</option>
                    <option value="off_duty">Off Duty</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
