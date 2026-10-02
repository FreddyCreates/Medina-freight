/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Project, 
  ScannedDocument, 
  ProposedInvoice, 
  BillingEmail, 
  PaymentRemittance, 
  Collaborator, 
  WindowsWatcherConfig,
  ProjectStatus,
  FoundryAgent,
  AgentExecutionLog,
  IntegrationService,
  CarrierComplianceRecord 
} from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_SCANNED_DOCS, 
  INITIAL_PROPOSED_INVOICES, 
  INITIAL_BILLING_EMAILS, 
  INITIAL_PAYMENT_REMITTANCES, 
  INITIAL_COLLABORATORS, 
  INITIAL_WINDOWS_CONFIG,
  INITIAL_FOUNDRY_AGENTS,
  INITIAL_EXECUTION_LOGS,
  INITIAL_INTEGRATIONS 
} from './data/mockData';
import { INITIAL_CARRIER_COMPLIANCE_RECORDS } from './data/complianceData';
import { 
  AutoPilotConfig, 
  AutoPilotDetectedLoad, 
  DEFAULT_AUTOPILOT_CONFIG, 
  getNextAutoPilotCandidate 
} from './services/autopilotService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GoogleWorkspaceHub } from './components/workspace/GoogleWorkspaceHub';
import { FoundryStudioView } from './components/foundry/FoundryStudioView';
import { FoundryWorkflowBuilder } from './components/foundry/FoundryWorkflowBuilder';
import { LiveDispatchMapView } from './components/dispatch/LiveDispatchMapView';
import { ProjectManagementView } from './components/projects/ProjectManagementView';
import { IncomingFolderScanner } from './components/incoming/IncomingFolderScanner';
import { SideBySideInvoiceReview } from './components/review/SideBySideInvoiceReview';
import { InvoicingHub } from './components/invoicing/InvoicingHub';
import { BillingEmailApproval } from './components/email/BillingEmailApproval';
import { PaymentMatchingEngine } from './components/payments/PaymentMatchingEngine';
import { CarrierComplianceDashboard } from './components/compliance/CarrierComplianceDashboard';
import { DriverDispatchPortal } from './components/driver/DriverDispatchPortal';
import { IntegrationsHubView } from './components/integrations/IntegrationsHubView';
import { WindowsDesktopAppView } from './components/windows/WindowsDesktopAppView';
import { ProjectSummaryModal } from './components/pdf/ProjectSummaryModal';
import { WindowsCompanionModal } from './components/windows/WindowsCompanionModal';
import { generateProjectSummaryPDF } from './services/pdfGenerator';
import { CalendarSyncModule } from './components/calendar/CalendarSyncModule';
import { syncProjectToGoogleCalendarModule } from './services/calendarSyncService';
import { CompanyProfile, FleetDriver, FreightEstimate } from './types';
import { DEFAULT_COMPANY_PROFILE, INITIAL_FLEET_DRIVERS, INITIAL_FREIGHT_ESTIMATES } from './data/realFleetData';
import { CompanyProfileModal } from './components/company/CompanyProfileModal';
import { FleetDriversView } from './components/fleet/FleetDriversView';
import { FreightEstimatesHub } from './components/estimates/FreightEstimatesHub';
import { GeminiOmniAdminHub } from './components/agent/GeminiOmniAdminHub';

export default function App() {
  // Master Application Navigation State
  const [currentTab, setCurrentTab] = useState<string>('gemini-admin');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('prj-1');

  // Real Company Profile & Authority State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('alvys_company_profile');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_PROFILE;
  });
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // Real Commercial Fleet Drivers State (10-Truck Family Fleet)
  const [drivers, setDrivers] = useState<FleetDriver[]>(() => {
    const saved = localStorage.getItem('alvys_fleet_drivers_v2');
    return saved ? JSON.parse(saved) : INITIAL_FLEET_DRIVERS;
  });

  // Real Freight Estimates & Lane Quoting State
  const [estimates, setEstimates] = useState<FreightEstimate[]>(() => {
    const saved = localStorage.getItem('alvys_freight_estimates');
    return saved ? JSON.parse(saved) : INITIAL_FREIGHT_ESTIMATES;
  });

  // Real Business State Persistence
  useEffect(() => {
    localStorage.setItem('alvys_company_profile', JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem('alvys_fleet_drivers_v2', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('alvys_freight_estimates', JSON.stringify(estimates));
  }, [estimates]);

  const handleSaveCompanyProfile = (newProfile: CompanyProfile) => {
    setCompanyProfile(newProfile);
    localStorage.setItem('alvys_company_profile', JSON.stringify(newProfile));
  };

  const handleAddDriver = (newDriver: FleetDriver) => {
    setDrivers(prev => [newDriver, ...prev]);
  };

  const handleUpdateDriver = (updated: FleetDriver) => {
    setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const handleDeleteDriver = (driverId: string) => {
    setDrivers(prev => prev.filter(d => d.id !== driverId));
  };

  const handleAddEstimate = (newEst: FreightEstimate) => {
    setEstimates(prev => [newEst, ...prev]);
  };

  const handleUpdateEstimate = (updated: FreightEstimate) => {
    setEstimates(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteEstimate = (estId: string) => {
    setEstimates(prev => prev.filter(e => e.id !== estId));
  };

  const handleConvertEstimateToLoad = async (estimate: FreightEstimate) => {
    const projectCode = `PRJ-${Math.floor(1080 + Math.random() * 8000)}`;
    const linehaul = estimate.linehaulTotal;
    const fuel = estimate.fuelSurchargeTotal;
    const assignedDriver = drivers.find(d => d.status === 'available') || drivers[0];

    const newProject: Project = {
      id: `prj-est-${Date.now()}`,
      code: projectCode,
      loadNumber: `LD-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: estimate.customerName,
      customerCode: estimate.customerName.substring(0, 4).toUpperCase(),
      originCity: estimate.originCity,
      originState: estimate.originState,
      originAddress: `${estimate.originCity} Shipper Terminal`,
      destCity: estimate.destCity,
      destState: estimate.destState,
      destAddress: `${estimate.destCity} Consignee Hub`,
      status: 'booked',
      driverName: assignedDriver.name,
      driverPhone: assignedDriver.phone,
      truckId: assignedDriver.truckNumber,
      trailerId: assignedDriver.trailerNumber,
      pickupDate: estimate.pickupDate,
      deliveryDate: estimate.deliveryDate,
      estimatedRevenue: estimate.totalQuoteAmount,
      linehaulPay: linehaul,
      fuelSurcharge: fuel,
      equipmentType: estimate.equipmentType === 'Power Only' ? '53ft Dry Van' : estimate.equipmentType,
      commodities: estimate.commodity,
      weightLbs: estimate.weightLbs,
      documentsCount: 1,
      telemetry: {
        lat: 41.8781,
        lng: -87.6298,
        speedMph: 0,
        headingDeg: 90,
        reeferTempF: 34.0,
        fuelLevelPct: 100,
        currentLocationName: `${estimate.originCity} Terminal`,
        lastPingTime: 'Just now',
        geofenceState: 'Inside Shipper',
        dwellMinutes: 0
      },
      tripStops: [
        {
          id: `stop-${Date.now()}-1`,
          stopSequence: 1,
          type: 'pickup',
          facilityName: `${estimate.originCity} Shipper`,
          address: `${estimate.originCity} Logistics Pkwy`,
          city: estimate.originCity,
          state: estimate.originState,
          appointmentTime: `${estimate.pickupDate} 08:00`,
          completed: false,
          podUploaded: false,
          dwellHours: 0,
          detentionAlert: false
        },
        {
          id: `stop-${Date.now()}-2`,
          stopSequence: 2,
          type: 'delivery',
          facilityName: `${estimate.destCity} Receiving Dock`,
          address: `${estimate.destCity} Commercial Blvd`,
          city: estimate.destCity,
          state: estimate.destState,
          appointmentTime: `${estimate.deliveryDate} 14:00`,
          completed: false,
          podUploaded: false,
          dwellHours: 0,
          detentionAlert: false
        }
      ],
      tasks: [
        { id: `t1-${Date.now()}`, title: `Converted from Rate Quote #${estimate.quoteNumber}`, completed: true, assignee: 'Freight Pricing Desk', dueDate: 'Today' },
        { id: `t2-${Date.now()}`, title: `Assigned to Driver ${assignedDriver.name}`, completed: true, assignee: 'Dispatch', dueDate: 'Today' }
      ],
      comments: [
        {
          id: `comm-${Date.now()}`,
          userId: 'user-1',
          userName: `${companyProfile.companyName} Dispatch`,
          userRole: 'Dispatcher',
          avatarBg: 'bg-emerald-600',
          text: `Converted from formal Quote #${estimate.quoteNumber} ($${estimate.totalQuoteAmount.toFixed(2)} USD). Driver ${assignedDriver.name} (${assignedDriver.phone}) assigned.`,
          timestamp: 'Just now'
        }
      ],
      activeCollaboratorIds: ['user-1'],
      lastUpdated: 'Just now'
    };

    // Auto-sync calendar
    try {
      const { updatedProject } = await syncProjectToGoogleCalendarModule(newProject);
      setProjects(prev => [updatedProject, ...prev]);
    } catch {
      setProjects(prev => [newProject, ...prev]);
    }

    // Auto-create matching invoice
    const newInvoice: ProposedInvoice = {
      id: `inv-from-est-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      projectId: newProject.id,
      loadNumber: newProject.loadNumber,
      customerName: estimate.customerName,
      customerEmail: estimate.customerEmail,
      billingAddress: `${estimate.customerName} Transportation Billing HQ`,
      paymentTerms: companyProfile.defaultPaymentTerms,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      lineItems: [
        { id: `li-lh-${Date.now()}`, description: `Linehaul: ${estimate.originCity} to ${estimate.destCity} (${estimate.loadedMiles} mi)`, type: 'linehaul', amount: estimate.linehaulTotal, sourceDoc: 'RateConfirmation' },
        { id: `li-fsc-${Date.now()}`, description: 'Fuel Surcharge (DOE Diesel Index)', type: 'fuel_surcharge', amount: estimate.fuelSurchargeTotal, sourceDoc: 'RateConfirmation' },
        ...estimate.accessorials.map(acc => ({
          id: `li-acc-${Date.now()}-${acc.id}`,
          description: acc.name,
          type: 'other' as const,
          amount: acc.amount,
          sourceDoc: 'RateConfirmation' as const
        }))
      ],
      subtotal: estimate.totalQuoteAmount,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: estimate.totalQuoteAmount,
      amountPaid: 0,
      balanceDue: estimate.totalQuoteAmount,
      status: 'ready_to_send',
      attachedDocIds: [],
      factoringStatus: 'submitted',
      correctionsLog: []
    };
    setInvoices(prev => [newInvoice, ...prev]);

    // Record execution log
    setExecutionLogs(prev => [
      {
        id: `log-est-${Date.now()}`,
        agentId: 'agent-1',
        agentName: 'Automated Load Builder Agent',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        loadNumber: newProject.loadNumber,
        triggerEvent: `Converted Quote #${estimate.quoteNumber} to Booked Load`,
        inputSummary: `Shipper: ${estimate.customerName} (${estimate.originCity}, ${estimate.originState} -> ${estimate.destCity}, ${estimate.destState})`,
        outputSummary: `Created active Load #${newProject.loadNumber} ($${newProject.estimatedRevenue.toLocaleString()}) and auto-synced Google Calendar.`,
        executionTimeMs: 420,
        status: 'success',
        confidenceScore: 99
      },
      ...prev
    ]);
  };

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('alvys_freight_projects_v2');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [scannedDocs, setScannedDocs] = useState<ScannedDocument[]>(INITIAL_SCANNED_DOCS);
  const [invoices, setInvoices] = useState<ProposedInvoice[]>(() => {
    const saved = localStorage.getItem('alvys_freight_invoices_v2');
    return saved ? JSON.parse(saved) : INITIAL_PROPOSED_INVOICES;
  });

  useEffect(() => {
    localStorage.setItem('alvys_freight_projects_v2', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('alvys_freight_invoices_v2', JSON.stringify(invoices));
  }, [invoices]);
  const [emails, setEmails] = useState<BillingEmail[]>(INITIAL_BILLING_EMAILS);
  const [remittances, setRemittances] = useState<PaymentRemittance[]>(INITIAL_PAYMENT_REMITTANCES);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [windowsConfig, setWindowsConfig] = useState<WindowsWatcherConfig>(INITIAL_WINDOWS_CONFIG);
  
  // Alvys Foundry State
  const [agents, setAgents] = useState<FoundryAgent[]>(INITIAL_FOUNDRY_AGENTS);
  const [executionLogs, setExecutionLogs] = useState<AgentExecutionLog[]>(INITIAL_EXECUTION_LOGS);
  const [integrations, setIntegrations] = useState<IntegrationService[]>(INITIAL_INTEGRATIONS);

  // Auto-Pilot Continuous Autonomous Monitoring State
  const [autoPilotConfig, setAutoPilotConfig] = useState<AutoPilotConfig>(DEFAULT_AUTOPILOT_CONFIG);
  const [autoPilotLoads, setAutoPilotLoads] = useState<AutoPilotDetectedLoad[]>([]);
  const autoPilotCounterRef = useRef(0);

  // Carrier Compliance State
  const [carriers, setCarriers] = useState<CarrierComplianceRecord[]>(INITIAL_CARRIER_COMPLIANCE_RECORDS);

  // Google Calendar Auto-Dispatcher State
  const [autoCalendarSyncActive, setAutoCalendarSyncActive] = useState<boolean>(true);

  // Modals & Dynamic State
  const [isWindowsModalOpen, setIsWindowsModalOpen] = useState(false);
  const [selectedPDFProject, setSelectedPDFProject] = useState<Project | null>(null);
  const [activeWorkflowAgent, setActiveWorkflowAgent] = useState<FoundryAgent | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // =================================================================
  // CONTINUOUS AUTOPILOT ENGINE (Autonomous Load Boards & Inbox Scan)
  // =================================================================
  useEffect(() => {
    if (!autoPilotConfig.enabled) return;

    const intervalId = setInterval(() => {
      autoPilotCounterRef.current += 1;
      const { load, convertedProject, convertedInvoice } = getNextAutoPilotCandidate(
        autoPilotConfig,
        autoPilotCounterRef.current
      );

      setAutoPilotLoads(prev => [load, ...prev.slice(0, 19)]);

      if (convertedProject && load.status === 'auto_booked') {
        setProjects(prev => [convertedProject, ...prev]);

        if (convertedInvoice) {
          setInvoices(prev => [convertedInvoice, ...prev]);
        }

        const newLog: AgentExecutionLog = {
          id: `log-ap-${Date.now()}`,
          agentId: 'agent-1',
          agentName: 'Auto-Pilot Autonomous Load Builder',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          loadNumber: convertedProject.loadNumber,
          triggerEvent: `Continuous Ingestion (${load.source})`,
          inputSummary: `${load.broker} tender: ${load.originCity} → ${load.destCity} ($${load.rate.toLocaleString()} / $${load.ratePerMile.toFixed(2)}/mi)`,
          outputSummary: `Autonomously parsed rate con, scheduled driver assignment, and generated Load #${convertedProject.loadNumber}.`,
          executionTimeMs: Math.floor(180 + Math.random() * 120),
          status: 'success',
          confidenceScore: load.confidenceScore
        };

        setExecutionLogs(prev => [newLog, ...prev]);
        setAgents(prev => prev.map(a => a.id === 'agent-1' ? { 
          ...a, 
          totalRunsCount: (a.totalRunsCount || 0) + 1,
          hoursSavedTotal: (a.hoursSavedTotal || 0) + 0.4,
          lastRunAt: 'Just now'
        } : a));
      }
    }, autoPilotConfig.scanIntervalSec * 1000);

    return () => clearInterval(intervalId);
  }, [autoPilotConfig]);

  // Navigation Handler
  const handleNavigateToStep = (step: string, projectId?: string) => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
    setCurrentTab(step);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Carrier Compliance Handlers
  const handleUpdateCarrier = (updatedCarrier: CarrierComplianceRecord) => {
    setCarriers(prev => prev.map(c => c.id === updatedCarrier.id ? updatedCarrier : c));
  };

  const handleAddCarrier = (newCarrier: CarrierComplianceRecord) => {
    setCarriers(prev => [newCarrier, ...prev]);
  };

  // Foundry Agent Handlers
  const handleToggleAgentStatus = (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a
    ));
  };

  const handleRunAgentManually = (agent: FoundryAgent, project: Project) => {
    const newLog: AgentExecutionLog = {
      id: `log-${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      loadNumber: project.loadNumber,
      triggerEvent: 'Manual Dispatch Trigger',
      inputSummary: `Payload for ${project.customerName} (Load #${project.loadNumber})`,
      outputSummary: `Executed ${agent.name} with 100% data integrity on lane ${project.originCity} -> ${project.destCity}.`,
      executionTimeMs: Math.floor(Math.random() * 200) + 300,
      status: 'success',
      confidenceScore: 99.2,
      humanApprovedBy: 'Fleet Dispatch Operations'
    };

    setExecutionLogs(prev => [newLog, ...prev]);
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, totalRunsCount: (a.totalRunsCount || 0) + 1, lastRunAt: 'Just now' } : a));
  };

  const handleSaveAgentWorkflow = (updatedAgent: FoundryAgent) => {
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  };

  // Add Load / Project from Manual Form
  const handleAddProject = async (newProjData: Omit<Project, 'id' | 'documentsCount' | 'tasks' | 'comments' | 'activeCollaboratorIds' | 'lastUpdated' | 'telemetry' | 'tripStops'>) => {
    let newProj: Project = {
      ...newProjData,
      id: `prj-${Date.now()}`,
      documentsCount: 0,
      telemetry: {
        lat: 41.8781,
        lng: -87.6298,
        speedMph: 0,
        headingDeg: 90,
        reeferTempF: 34.0,
        fuelLevelPct: 100,
        currentLocationName: `${newProjData.originCity} Shipper Terminal`,
        lastPingTime: 'Just now',
        geofenceState: 'Inside Shipper',
        dwellMinutes: 15
      },
      tripStops: [
        {
          id: `stop-${Date.now()}-1`,
          stopSequence: 1,
          type: 'pickup',
          facilityName: `${newProjData.originCity} Origin Terminal`,
          address: '100 Industrial Pkwy',
          city: newProjData.originCity,
          state: newProjData.originState,
          appointmentTime: `${newProjData.pickupDate} 08:00`,
          completed: false,
          podUploaded: false,
          dwellHours: 0.2,
          detentionAlert: false
        },
        {
          id: `stop-${Date.now()}-2`,
          stopSequence: 2,
          type: 'delivery',
          facilityName: `${newProjData.destCity} Distribution Hub`,
          address: '500 Logistics Blvd',
          city: newProjData.destCity,
          state: newProjData.destState,
          appointmentTime: `${newProjData.deliveryDate} 14:00`,
          completed: false,
          podUploaded: false,
          dwellHours: 0,
          detentionAlert: false
        }
      ],
      tasks: [
        { id: `t-${Date.now()}-1`, title: 'Foundry Agent: Run automated load build & rate index', completed: true, assignee: 'Foundry AI', dueDate: newProjData.pickupDate },
        { id: `t-${Date.now()}-2`, title: 'Verify signed receiver stamp on Bill of Lading', completed: false, assignee: newProjData.driverName, dueDate: newProjData.deliveryDate },
      ],
      comments: [
        {
          id: `c-${Date.now()}`,
          userId: 'user-1',
          userName: 'Dispatch Lead (You)',
          userRole: 'Operations & Billing Lead',
          avatarBg: 'bg-orange-600',
          text: `Created load ${newProjData.loadNumber} for ${newProjData.customerName}. Route: ${newProjData.originCity} to ${newProjData.destCity}.`,
          timestamp: 'Just now'
        }
      ],
      activeCollaboratorIds: ['user-1'],
      lastUpdated: 'Just now'
    };

    if (autoCalendarSyncActive) {
      try {
        const { updatedProject } = await syncProjectToGoogleCalendarModule(newProj);
        newProj = updatedProject;
      } catch (err) {
        console.warn('Auto calendar sync error:', err);
      }
    }

    setProjects(prev => [newProj, ...prev]);
    setSelectedProjectId(newProj.id);
  };

  // Add Full Project (e.g. from Google Workspace Gmail Rate Con or OCR)
  const handleAddFullProject = async (incomingProj: Project) => {
    let finalProj = incomingProj;
    if (autoCalendarSyncActive && !incomingProj.googleCalendarPickupEventId) {
      try {
        const { updatedProject } = await syncProjectToGoogleCalendarModule(incomingProj);
        finalProj = updatedProject;
      } catch (err) {
        console.warn('Auto calendar sync on full project error:', err);
      }
    }
    setProjects(prev => [finalProj, ...prev]);
    setSelectedProjectId(finalProj.id);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleSyncProjectCalendar = async (proj: Project) => {
    try {
      const { updatedProject } = await syncProjectToGoogleCalendarModule(proj);
      handleUpdateProject(updatedProject);
    } catch (err) {
      console.warn('Manual project calendar sync error:', err);
    }
  };

  const handleAddComment = (projectId: string, text: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const newComment = {
        id: `c-${Date.now()}`,
        userId: 'user-1',
        userName: 'Dispatch Lead (You)',
        userRole: 'Operations & Billing Lead',
        avatarBg: 'bg-orange-600',
        text,
        timestamp: 'Just now'
      };
      return {
        ...p,
        comments: [...p.comments, newComment],
        lastUpdated: 'Just now'
      };
    }));
  };

  const handleToggleTask = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
        lastUpdated: 'Just now'
      };
    }));
  };

  const handleUpdateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus, lastUpdated: 'Just now' } : p));
  };

  const handleDriverUploadPOD = (projectId: string, stopId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        status: 'paperwork_scanned',
        documentsCount: p.documentsCount + 1,
        tripStops: p.tripStops.map(s => s.id === stopId ? { ...s, completed: true, podUploaded: true } : s),
        lastUpdated: 'Just now'
      };
    }));
  };

  const handleQuickDownloadPDF = () => {
    const targetProject = selectedProject || projects[0];
    const targetInvoice = invoices.find(i => i.projectId === targetProject?.id);
    if (targetProject) {
      generateProjectSummaryPDF(targetProject, targetInvoice, scannedDocs);
    }
  };

  const handleTriggerCheckCall = (project: Project) => {
    const newLog: AgentExecutionLog = {
      id: `log-${Date.now()}`,
      agentId: 'agent-4',
      agentName: 'Track & Trace Check-Call Sentinel',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      loadNumber: project.loadNumber,
      triggerEvent: 'Dispatched Check-Call',
      inputSummary: `GPS Coordinates: ${project.telemetry.lat.toFixed(4)}, ${project.telemetry.lng.toFixed(4)} (Speed: ${project.telemetry.speedMph} mph)`,
      outputSummary: `Transmitted automated ETA tracking link to ${project.customerName} broker desk.`,
      executionTimeMs: 240,
      status: 'success',
      confidenceScore: 100
    };
    setExecutionLogs(prev => [newLog, ...prev]);
  };

  const handleAddScannedDoc = (newDoc: ScannedDocument) => {
    setScannedDocs(prev => [newDoc, ...prev]);
    if (newDoc.matchedProjectId) {
      setProjects(prev => prev.map(p => p.id === newDoc.matchedProjectId ? { ...p, documentsCount: p.documentsCount + 1, status: 'paperwork_scanned' } : p));
    }
  };

  const handleSimulateBatchScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const sampleScan: ScannedDocument = {
        id: `doc-batch-${Date.now()}`,
        fileName: `Scanned_BOL_POD_Signed_${Date.now().toString().slice(-4)}.pdf`,
        fileSize: '2.6 MB',
        type: 'BOL',
        scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        localPath: `C:\\FreightOps\\Incoming\\Scans\\Scanned_BOL_POD_Signed_${Date.now().toString().slice(-4)}.pdf`,
        thumbnailColor: 'from-amber-950/40 to-slate-900',
        ocrConfidence: 99,
        status: 'matched',
        matchedProjectId: 'prj-1',
        matchedCustomer: 'C.H. Robinson Worldwide',
        discrepancies: [],
        extractedData: {
          loadNumber: 'CHR-982301',
          bolNumber: `BOL-${Math.floor(100000 + Math.random() * 900000)}`,
          brokerCustomer: 'C.H. Robinson Worldwide',
          pickupDate: '2026-09-27',
          deliveryDate: '2026-09-29',
          consigneeSignature: true,
          weightLbs: 42800,
          notes: 'Automatic OCR matched receiver signature & stamp from incoming hotfolder.'
        }
      };

      setScannedDocs(prev => [sampleScan, ...prev]);
      setIsScanning(false);
    }, 800);
  };

  const handleUpdateInvoice = (updatedInvoice: ProposedInvoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
  };

  const handleApproveInvoice = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: 'ready_to_send' } : i));
    setProjects(prev => prev.map(p => p.id === inv.projectId ? { ...p, status: 'invoiced' } : p));

    const existingEmail = emails.find(e => e.invoiceId === invoiceId);
    if (!existingEmail) {
      const newEmail: BillingEmail = {
        id: `email-${Date.now()}`,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        recipientEmail: inv.customerEmail,
        recipientName: `${inv.customerName} Accounts Payable`,
        ccEmails: [companyProfile.email || 'dispatch@greenexpressllc.com'],
        subject: `Billing Packet: Invoice ${inv.invoiceNumber} (Load #${inv.loadNumber})`,
        bodyText: `Dear ${inv.customerName} Accounts Payable Team,\n\nPlease find attached our official billing packet for Load #${inv.loadNumber}.\n\nTotal Due: $${inv.totalAmount.toFixed(2)}\nTerms: ${inv.paymentTerms}\n\nAttached:\n1. Invoice ${inv.invoiceNumber}.pdf\n2. Signed Bill of Lading (BOL)\n3. Rate Confirmation\n\nThank you,\n${companyProfile.companyName || 'GREEN EXPRESS LLC'}\nFreight Operations Team`,
        attachedDocsSummary: [
          { title: `Invoice_${inv.invoiceNumber}.pdf`, type: 'System Generated Invoice', fileSize: '180 KB', verified: true },
          { title: `Signed_BOL_Load_${inv.loadNumber}.pdf`, type: 'Signed Bill of Lading', fileSize: '2.4 MB', verified: true },
        ],
        status: 'pending_approval',
        localPacketHash: `sha256-${Math.random().toString(36).substring(2, 12)}`
      };
      setEmails(prev => [newEmail, ...prev]);
    }
  };

  const handleApproveAndSendEmail = (emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, status: 'sent', sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : e));
    const email = emails.find(e => e.id === emailId);
    if (email) {
      setInvoices(prev => prev.map(i => i.id === email.invoiceId ? { ...i, status: 'sent' } : i));
    }
  };

  const handleConfirmPayment = (remittanceId: string, matchedInvoiceId: string) => {
    setRemittances(prev => prev.map(r => {
      if (r.id === remittanceId) {
        return {
          ...r,
          status: 'reconciled',
          matchedInvoices: r.matchedInvoices.map(m => m.invoiceId === matchedInvoiceId ? { ...m, confirmedReceipt: true } : m)
        };
      }
      return r;
    }));

    setInvoices(prev => prev.map(inv => inv.id === matchedInvoiceId ? { ...inv, status: 'paid', amountPaid: inv.totalAmount, balanceDue: 0.00 } : inv));
    
    const targetInv = invoices.find(i => i.id === matchedInvoiceId);
    if (targetInv) {
      setProjects(prev => prev.map(p => p.id === targetInv.projectId ? { ...p, status: 'paid' } : p));
    }
  };

  const complianceAlertsCount = carriers.filter(c => c.complianceStatus === 'needs_attention' || c.complianceStatus === 'expired').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F5F5F7] text-gray-900 font-sans antialiased overflow-hidden select-none">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        collaborators={collaborators}
        windowsConfig={windowsConfig}
        companyProfile={companyProfile}
        onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        onQuickGeneratePDF={handleQuickDownloadPDF}
        activeAgentsCount={agents.filter(a => a.status === 'active').length}
        autoPilotEnabled={autoPilotConfig.enabled}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          pendingDocsCount={scannedDocs.filter(d => d.status === 'pending_match').length}
          pendingInvoicesCount={invoices.filter(i => i.status === 'needs_review').length}
          pendingEmailsCount={emails.filter(e => e.status === 'pending_approval').length}
          pendingRemittancesCount={remittances.filter(r => r.status === 'proposed_match').length}
          activeProjectsCount={projects.length}
          activeAgentsCount={agents.filter(a => a.status === 'active').length}
          complianceAlertsCount={complianceAlertsCount}
          companyProfile={companyProfile}
          autoPilotActive={autoPilotConfig.enabled}
          onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
          onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 bg-[#F5F5F7]">
          {currentTab === 'estimates' && (
            <FreightEstimatesHub
              estimates={estimates}
              companyProfile={companyProfile}
              onAddEstimate={handleAddEstimate}
              onUpdateEstimate={handleUpdateEstimate}
              onDeleteEstimate={handleDeleteEstimate}
              onConvertEstimateToLoad={handleConvertEstimateToLoad}
              onNavigateToTab={handleNavigateToStep}
            />
          )}

          {currentTab === 'fleet-drivers' && (
            <FleetDriversView
              drivers={drivers}
              projects={projects}
              companyProfile={companyProfile}
              onAddDriver={handleAddDriver}
              onUpdateDriver={handleUpdateDriver}
              onDeleteDriver={handleDeleteDriver}
              onNavigateToTab={handleNavigateToStep}
            />
          )}
          {currentTab === 'calendar-sync' && (
            <CalendarSyncModule
              projects={projects}
              onUpdateProject={handleUpdateProject}
              onNavigateToProject={(projId) => {
                setSelectedProjectId(projId);
                setCurrentTab('projects');
              }}
              autoSyncActive={autoCalendarSyncActive}
              onToggleAutoSync={setAutoCalendarSyncActive}
            />
          )}

          {currentTab === 'workspace' && (
            <GoogleWorkspaceHub
              projects={projects}
              invoices={invoices}
              onAddProjectFromEmail={handleAddFullProject}
              onAddInvoice={(inv) => setInvoices(prev => [inv, ...prev])}
              onAddExecutionLog={(log) => setExecutionLogs(prev => [log, ...prev])}
              onNavigateToTab={handleNavigateToStep}
            />
          )}

          {currentTab === 'compliance' && (
            <CarrierComplianceDashboard
              carriers={carriers}
              onUpdateCarrier={handleUpdateCarrier}
              onAddCarrier={handleAddCarrier}
            />
          )}

          {currentTab === 'foundry' && (
            <FoundryStudioView
              agents={agents}
              executionLogs={executionLogs}
              projects={projects}
              autoPilotConfig={autoPilotConfig}
              autoPilotLoads={autoPilotLoads}
              onToggleAutoPilot={() => setAutoPilotConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              onUpdateAutoPilotConfig={setAutoPilotConfig}
              onToggleAgentStatus={handleToggleAgentStatus}
              onRunAgentManually={handleRunAgentManually}
              onOpenWorkflowBuilder={setActiveWorkflowAgent}
              onNavigateToTab={handleNavigateToStep}
              onAddProject={handleAddFullProject}
              onAddExecutionLog={(log) => setExecutionLogs(prev => [log, ...prev])}
            />
          )}

          {currentTab === 'gemini-admin' && (
            <GeminiOmniAdminHub
              projects={projects}
              invoices={invoices}
              drivers={drivers}
              companyProfile={companyProfile}
              onNavigateToTab={setCurrentTab}
              onAddProject={handleAddFullProject}
              onAddInvoice={(inv) => setInvoices(prev => [inv, ...prev])}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectManagementView
              projects={projects}
              invoices={invoices}
              collaborators={collaborators}
              companyProfile={companyProfile}
              drivers={drivers}
              onSelectProject={setSelectedProjectId}
              onNavigateToStep={handleNavigateToStep}
              onAddProject={handleAddProject}
              onAddComment={handleAddComment}
              onToggleTask={handleToggleTask}
              onUpdateProjectStatus={handleUpdateProjectStatus}
              onOpenPDFSummaryModal={setSelectedPDFProject}
              onSyncCalendar={handleSyncProjectCalendar}
              onNavigateToCalendarSync={() => setCurrentTab('calendar-sync')}
            />
          )}

          {currentTab === 'map' && (
            <LiveDispatchMapView
              projects={projects}
              invoices={invoices}
              onOpenPDFSummaryModal={setSelectedPDFProject}
              onTriggerCheckCall={handleTriggerCheckCall}
            />
          )}

          {currentTab === 'scanner' && (
            <IncomingFolderScanner
              scannedDocs={scannedDocs}
              projects={projects}
              windowsConfig={windowsConfig}
              onSelectDocForReview={(docId, projId) => {
                if (projId) setSelectedProjectId(projId);
              }}
              onAddScannedDoc={handleAddScannedDoc}
              onNavigateToStep={handleNavigateToStep}
              onQuickSimulateBatch={handleSimulateBatchScan}
            />
          )}

          {currentTab === 'review' && (
            <SideBySideInvoiceReview
              invoices={invoices}
              scannedDocs={scannedDocs}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onUpdateInvoice={handleUpdateInvoice}
              onApproveInvoice={handleApproveInvoice}
              onNavigateToStep={handleNavigateToStep}
            />
          )}

          {currentTab === 'invoicing' && (
            <InvoicingHub
              invoices={invoices}
              projects={projects}
              companyProfile={companyProfile}
              onNavigateToStep={handleNavigateToStep}
              onUpdateInvoiceStatus={(id, status) => {
                setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
              }}
              onMigrateFromMyInvoice={(migrated) => setInvoices(prev => [...migrated, ...prev])}
              onAddInvoice={(newInv) => setInvoices(prev => [newInv, ...prev])}
              onDeleteInvoice={handleDeleteInvoice}
            />
          )}

          {currentTab === 'email' && (
            <BillingEmailApproval
              emails={emails}
              invoices={invoices}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onApproveAndSendEmail={handleApproveAndSendEmail}
              onUpdateEmail={(e) => setEmails(prev => prev.map(item => item.id === e.id ? e : item))}
              onUpdateInvoice={handleUpdateInvoice}
              onAddComment={handleAddComment}
              onAddExecutionLog={(log) => setExecutionLogs(prev => [log, ...prev])}
              onNavigateToStep={handleNavigateToStep}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentMatchingEngine
              remittances={remittances}
              invoices={invoices}
              projects={projects}
              onConfirmPayment={handleConfirmPayment}
              onAddRemittance={(r) => setRemittances(prev => [r, ...prev])}
              onNavigateToStep={setCurrentTab}
            />
          )}

          {currentTab === 'driver' && (
            <DriverDispatchPortal
              project={selectedProject}
              projects={projects}
              drivers={drivers}
              companyProfile={companyProfile}
              onUploadPOD={handleDriverUploadPOD}
              onCompleteStop={() => {}}
              onUpdateProjectStatus={handleUpdateProjectStatus}
              onAddScannedDoc={handleAddScannedDoc}
            />
          )}

          {currentTab === 'integrations' && (
            <IntegrationsHubView
              integrations={integrations}
              onToggleIntegration={(id) => {
                setIntegrations(prev => prev.map(int => int.id === id ? { ...int, connected: !int.connected } : int));
              }}
            />
          )}

          {currentTab === 'windows' && (
            <WindowsDesktopAppView
              config={windowsConfig}
              scannedDocs={scannedDocs}
              invoices={invoices}
              remittances={remittances}
              onUpdateConfig={setWindowsConfig}
              onTriggerScan={handleSimulateBatchScan}
              onNavigateToStep={handleNavigateToStep}
            />
          )}
        </main>
      </div>

      {/* PDF Summary Packet Viewer & Export Modal */}
      {selectedPDFProject && (
        <ProjectSummaryModal
          isOpen={Boolean(selectedPDFProject)}
          onClose={() => setSelectedPDFProject(null)}
          project={selectedPDFProject}
          invoice={invoices.find(i => i.projectId === selectedPDFProject.id)}
          scannedDocs={scannedDocs}
        />
      )}

      {/* Visual Workflow Builder Modal */}
      {activeWorkflowAgent && (
        <FoundryWorkflowBuilder
          agent={activeWorkflowAgent}
          onSaveAgentWorkflow={handleSaveAgentWorkflow}
          onClose={() => setActiveWorkflowAgent(null)}
        />
      )}

      {/* Windows Hotfolder Daemon Modal */}
      <WindowsCompanionModal
        isOpen={isWindowsModalOpen}
        onClose={() => setIsWindowsModalOpen(false)}
        config={windowsConfig}
        onUpdateConfig={setWindowsConfig}
        onTriggerManualScan={handleSimulateBatchScan}
      />
    </div>
  );
}
