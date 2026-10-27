import React, { useState } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Bot, 
  Check, 
  Copy, 
  ExternalLink, 
  Play, 
  Download, 
  ShieldCheck, 
  Radio, 
  Layers, 
  Cpu, 
  FolderInput, 
  Truck, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  RefreshCw, 
  Code2, 
  FileCode, 
  Globe, 
  Send,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Project, ProposedInvoice, CompanyProfile } from '../../types';
import { downloadJsSdkFile, FREIGHTSYNC_JS_SDK_CODE } from '../../services/sdkDownloadService';

interface ApiMcpDeveloperPortalProps {
  projects: Project[];
  invoices: ProposedInvoice[];
  companyProfile: CompanyProfile;
  onNavigateToTab?: (tab: string, projectId?: string) => void;
}

export const ApiMcpDeveloperPortal: React.FC<ApiMcpDeveloperPortalProps> = ({
  projects,
  invoices,
  companyProfile,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<'chatgpt' | 'mcp' | 'rest_api' | 'keys' | 'sdk'>('chatgpt');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedRestEndpoint, setSelectedRestEndpoint] = useState<string>('get_loads');
  const [isExecutingApi, setIsExecutingApi] = useState<boolean>(false);
  const [apiResponsePayload, setApiResponsePayload] = useState<any>(null);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'python' | 'typescript'>('curl');
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>('get_fleet_matrix');
  const [mcpTestArgs, setMcpTestArgs] = useState<string>('{\n  "status": "all"\n}');
  const [mcpExecutionResult, setMcpExecutionResult] = useState<any>(null);
  const [isExecutingMcp, setIsExecutingMcp] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentHost = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-34fhwzfezpcfssnam7b6ac-624602357517.us-west2.run.app';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // OpenAPI 3.1.0 Full Schema formatted as string
  const openApiSchemaString = JSON.stringify({
    openapi: "3.1.0",
    info: {
      title: "Apex Fleet TMS & Alvys Foundry API Pro",
      version: "1.0.0",
      description: "Autonomous freight dispatch, real-time GPS telematics, trailer cargo damage vision inspection, rate quoting, and FMCSA carrier compliance."
    },
    servers: [
      {
        url: currentOrigin,
        description: "Live Apex Fleet TMS Gateway"
      }
    ],
    paths: {
      "/api/v1/loads": {
        get: {
          operationId: "getFleetLoads",
          summary: "List Fleet Loads & Dispatch Matrix",
          responses: { "200": { description: "Active fleet dispatches" } }
        }
      },
      "/api/v1/loads/dispatch": {
        post: {
          operationId: "dispatchLoad",
          summary: "Dispatch Freight Load to Driver",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["loadNumber", "broker", "origin", "destination", "rate"] } } }
          },
          responses: { "201": { description: "Load dispatched" } }
        }
      },
      "/api/v1/telematics": {
        get: {
          operationId: "getFleetTelematics",
          summary: "Get Real-Time Fleet GPS & Telemetry",
          responses: { "200": { description: "Real-time fleet GPS locations" } }
        }
      },
      "/api/v1/telematics/ping": {
        post: {
          operationId: "ingestPhoneGpsPing",
          summary: "Stream Live Driver Phone GPS Ping",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["lat", "lng"] } } }
          },
          responses: { "200": { description: "GPS ping mapped" } }
        }
      },
      "/api/v1/cargo/inspect": {
        post: {
          operationId: "inspectTrailerCargo",
          summary: "Inspect Trailer Cargo & Scan Damage (Gemini Vision)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["loadNumber"] } } }
          },
          responses: { "200": { description: "49 CFR 393 compliance & non-liability certificate" } }
        }
      },
      "/api/v1/rates/quote": {
        post: {
          operationId: "calculateFreightQuote",
          summary: "Calculate Lane Rate & Counter-Offer",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["originCity", "originState", "destCity", "destState"] } } }
          },
          responses: { "200": { description: "Lane breakeven RPM and recommended rate" } }
        }
      },
      "/api/v1/documents/route": {
        post: {
          operationId: "routeUniversalDocument",
          summary: "Ingest & Route Document (POD, BOL, RateCon)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", required: ["fileName", "docType"] } } }
          },
          responses: { "200": { description: "File routed to project folder" } }
        }
      },
      "/api/v1/compliance/packet": {
        get: {
          operationId: "getCarrierCompliancePacket",
          summary: "Retrieve Verified Carrier Onboarding Packet",
          responses: { "200": { description: "COI, W-9, and FMCSA authority" } }
        }
      }
    }
  }, null, 2);

  // ChatGPT Custom GPT System Prompt
  const chatGptInstructionsPrompt = `You are the Apex Fleet TMS Autonomous Freight Commander & Dispatch Agent for Green Express LLC (USDOT #3984102, MC #1489201).

You have direct real-time API Actions connected to the carrier's transportation management system:
1. 'getFleetLoads': Query active dispatches, driver assignments, truck/trailer units, and delivery statuses.
2. 'dispatchLoad': Assign loads to CDL drivers (Jesus Medina, Jose Medina, Luis Medina, Roberto Medina), set equipment (53ft Reefer), and book tenders.
3. 'getFleetTelematics' / 'ingestPhoneGpsPing': Track live GPS coordinates, speeds, compass headings, and reefer temperatures (-10°F to 34°F).
4. 'inspectTrailerCargo': Run Gemini AI Vision inspection on trailer photos to verify FMCSA 49 CFR 393 cargo securement, check door bolt seals, and detect pre-existing warehouse carton damage to exonerate the carrier from in-transit claims under 49 U.S.C. 14706.
5. 'calculateFreightQuote': Defend a strict 22% operating margin on all lanes. Calculate breakeven RPM ($0.68 fuel + $0.72 driver + $0.22 maintenance + $0.18 insurance + $0.12 reefer surcharge) and generate strategic counter-offers to brokers like TQL and C.H. Robinson.
6. 'getCarrierCompliancePacket': Provide instant Certificate of Insurance ($1M Auto Liability / $250k Reefer Cargo) and W-9 verification.

Always be concise, professional, and act as an elite dispatcher. Format operational answers with truck numbers, RPM, and clear action items.`;

  // Claude Desktop MCP Configuration Snippet
  const claudeDesktopConfig = JSON.stringify({
    mcpServers: {
      "apex-fleet-tms": {
        url: `${currentOrigin}/api/mcp/sse`,
        env: {
          APEX_API_KEY: "apex_live_sec_99214a7812bc"
        }
      }
    }
  }, null, 2);

  // Execute REST API endpoint
  const handleExecuteRestApi = async (endpoint: string) => {
    setIsExecutingApi(true);
    setApiResponsePayload(null);

    try {
      let url = '/api/v1/loads';
      let method = 'GET';
      let body: any = null;

      if (endpoint === 'get_loads') {
        url = '/api/v1/loads';
      } else if (endpoint === 'get_telematics') {
        url = '/api/v1/telematics';
      } else if (endpoint === 'ping_telematics') {
        url = '/api/v1/telematics/ping';
        method = 'POST';
        body = {
          truckId: 'TRK-101',
          driverName: 'Jesus Medina',
          lat: 32.5401,
          lng: -97.3456,
          speedMph: 58,
          heading: 315
        };
      } else if (endpoint === 'inspect_cargo') {
        url = '/api/v1/cargo/inspect';
        method = 'POST';
        body = {
          loadNumber: 'GE-982301',
          driverName: 'Jesus Medina',
          inspectionCategory: 'pre_trip'
        };
      } else if (endpoint === 'quote_lane') {
        url = '/api/v1/rates/quote';
        method = 'POST';
        body = {
          originCity: 'Fort Worth',
          originState: 'TX',
          destCity: 'Denver',
          destState: 'CO',
          miles: 1140,
          equipmentType: '53ft Reefer (-10°F)',
          brokerOfferedRate: 3200.00
        };
      } else if (endpoint === 'compliance_packet') {
        url = '/api/v1/compliance/packet';
      } else if (endpoint === 'vault_documents') {
        url = '/api/v1/vault/documents?query=Denver';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer apex_live_test_key_8829'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await res.json();
      setApiResponsePayload(data);
      showToast(`200 OK: ${endpoint} executed`);
    } catch (err: any) {
      setApiResponsePayload({ error: err.message });
    } finally {
      setIsExecutingApi(false);
    }
  };

  // Execute MCP Tool call
  const handleExecuteMcpTool = async () => {
    setIsExecutingMcp(true);
    setMcpExecutionResult(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(mcpTestArgs);
    } catch (e) {
      setMcpExecutionResult({ error: 'Invalid JSON in tool arguments' });
      setIsExecutingMcp(false);
      return;
    }

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedMcpTool,
            arguments: parsedArgs
          }
        })
      });

      const data = await res.json();
      setMcpExecutionResult(data);
      showToast('MCP Tool executed successfully!');
    } catch (err: any) {
      setMcpExecutionResult({ error: err.message });
    } finally {
      setIsExecutingMcp(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] overflow-hidden select-none font-sans text-gray-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="bg-white border-b border-[#E5E5EA] px-4 sm:px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-gray-950 tracking-tight">
                  API Pro & Model Context Protocol (MCP) Gateway
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200">
                  ChatGPT & Claude Ready
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Turn this entire TMS into an AI Action for ChatGPT, a live Model Context Protocol (MCP) server, or integrate via REST API Pro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <a
              href="/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-gray-300"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>OpenAPI 3.1 JSON</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>

            <a
              href="/api/mcp/sse"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>MCP SSE Stream</span>
            </a>
          </div>
        </div>

        {/* SUBTAB SWITCHER */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-3 text-xs">
          {[
            { id: 'chatgpt', label: 'ChatGPT Custom GPT Actions', icon: Bot },
            { id: 'mcp', label: 'Model Context Protocol (MCP)', icon: Cpu },
            { id: 'rest_api', label: 'REST API Pro Playground', icon: Terminal },
            { id: 'keys', label: 'Developer Keys & Webhooks', icon: Key },
            { id: 'sdk', label: 'SDK Downloads', icon: Download }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-left">
        {/* ========================================================================= */}
        {/* TAB 1: CHATGPT CUSTOM GPT ACTIONS (One-Click Setup) */}
        {/* ========================================================================= */}
        {activeTab === 'chatgpt' && (
          <div className="space-y-6">
            {/* Hero Quick Start Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white shadow-md border border-emerald-800/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-400/30">
                    ChatGPT Plus / Team / Enterprise Ready
                  </span>
                  <h2 className="text-lg font-extrabold">
                    Control Your Freight Carrier From ChatGPT
                  </h2>
                  <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                    By importing our OpenAPI 3.1 schema into ChatGPT's Custom GPT builder, ChatGPT can query active loads, dispatch Jesus Medina or other drivers, check trailer cargo vision damage, and negotiate broker rates with margin defense.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://chatgpt.com/gpts/editor"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <span>Open GPT Builder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* 3-Step Setup Instructions Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="font-extrabold text-xs text-gray-900">Create Custom GPT</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Go to ChatGPT ➔ Explore GPTs ➔ Create. Name it <b>"Apex Freight Commander"</b>.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="font-extrabold text-xs text-gray-900">Paste Instructions</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Copy the pre-tuned Carrier Dispatch system prompt below and paste into the <b>Instructions</b> field.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="font-extrabold text-xs text-gray-900">Add Action Schema</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Click <b>Create new action</b>, paste the OpenAPI 3.1 schema below, and test the endpoints live!
                </p>
              </div>
            </div>

            {/* Side-by-Side: System Instructions & Action Schema */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* ChatGPT System Instructions (5 Cols) */}
              <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    <span>Instructions for ChatGPT</span>
                  </span>
                  <button
                    onClick={() => handleCopy(chatGptInstructionsPrompt, 'instructions')}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'instructions' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'instructions' ? 'Copied' : 'Copy Instructions'}</span>
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-700 font-mono leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap">
                  {chatGptInstructionsPrompt}
                </div>
              </div>

              {/* OpenAPI 3.1.0 JSON Schema (7 Cols) */}
              <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-purple-600" />
                      <span>OpenAPI 3.1.0 Action Schema</span>
                    </span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-mono font-bold px-2 py-0.2 rounded">
                      {currentOrigin}/openapi.json
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(`${currentOrigin}/openapi.json`, 'schema_url')}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                      title="Copy URL for ChatGPT Import from URL"
                    >
                      {copiedKey === 'schema_url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy URL</span>
                    </button>

                    <button
                      onClick={() => handleCopy(openApiSchemaString, 'schema_json')}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      {copiedKey === 'schema_json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Schema JSON</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-300 bg-gray-950 p-3.5 font-mono text-[11px] text-gray-200 overflow-x-auto max-h-[360px] leading-relaxed shadow-inner">
                  <pre>{openApiSchemaString}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MODEL CONTEXT PROTOCOL (MCP) SERVER GATEWAY */}
        {/* ========================================================================= */}
        {activeTab === 'mcp' && (
          <div className="space-y-6">
            {/* MCP Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white shadow-md border border-purple-800/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-extrabold text-[10px] uppercase tracking-wider border border-purple-400/30">
                    MCP Protocol Version 2024-11-05
                  </span>
                  <h2 className="text-lg font-extrabold">
                    Live Model Context Protocol (MCP) Server
                  </h2>
                  <p className="text-xs text-purple-100 max-w-2xl leading-relaxed">
                    Exposes 8 enterprise freight tools, URI resources, and prompt templates to any MCP client (Claude Desktop, Cursor, ChatGPT MCP bridges, or custom agents) via standard JSON-RPC 2.0.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(claudeDesktopConfig, 'claude_config')}
                    className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-gray-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    {copiedKey === 'claude_config' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Claude Desktop Config</span>
                  </button>
                </div>
              </div>
            </div>

            {/* MCP Live Playground */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Tool Selector & Arguments (5 Cols) */}
              <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <span>MCP Tools Catalog (8 Tools)</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">JSON-RPC 2.0</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Select MCP Tool</label>
                  <select
                    value={selectedMcpTool}
                    onChange={(e) => {
                      const t = e.target.value;
                      setSelectedMcpTool(t);
                      if (t === 'get_fleet_matrix') setMcpTestArgs('{\n  "status": "all"\n}');
                      else if (t === 'inspect_trailer_cargo') setMcpTestArgs('{\n  "loadNumber": "GE-982301",\n  "driverName": "Jesus Medina",\n  "inspectionCategory": "pre_trip"\n}');
                      else if (t === 'calculate_freight_rate') setMcpTestArgs('{\n  "originCity": "Fort Worth",\n  "originState": "TX",\n  "destCity": "Denver",\n  "destState": "CO",\n  "miles": 1140,\n  "brokerOfferedRate": 3200\n}');
                      else if (t === 'stream_phone_telematics') setMcpTestArgs('{\n  "truckId": "TRK-101",\n  "lat": 32.5401,\n  "lng": -97.3456,\n  "speedMph": 62\n}');
                      else if (t === 'get_carrier_compliance_packet') setMcpTestArgs('{\n  "brokerRecipient": "TQL Compliance"\n}');
                      else if (t === 'search_vault_documents') setMcpTestArgs('{\n  "query": "Denver"\n}');
                      else setMcpTestArgs('{}');
                    }}
                    className="w-full bg-[#F5F5F7] border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="get_fleet_matrix">get_fleet_matrix (Loads & Status)</option>
                    <option value="dispatch_freight_load">dispatch_freight_load (Book Load)</option>
                    <option value="inspect_trailer_cargo">inspect_trailer_cargo (49 CFR 393 Vision)</option>
                    <option value="calculate_freight_rate">calculate_freight_rate (Margin Defense)</option>
                    <option value="stream_phone_telematics">stream_phone_telematics (Phone GPS)</option>
                    <option value="route_universal_document">route_universal_document (POD / Files)</option>
                    <option value="get_carrier_compliance_packet">get_carrier_compliance_packet (COI / W-9)</option>
                    <option value="search_vault_documents">search_vault_documents (Vault Files)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">Tool Input Arguments (JSON)</label>
                  <textarea
                    rows={6}
                    value={mcpTestArgs}
                    onChange={(e) => setMcpTestArgs(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-gray-950 p-3 font-mono text-xs text-emerald-400 focus:outline-none shadow-inner"
                  />
                </div>

                <button
                  onClick={handleExecuteMcpTool}
                  disabled={isExecutingMcp}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Play className={`w-3.5 h-3.5 ${isExecutingMcp ? 'animate-spin' : ''}`} />
                  <span>{isExecutingMcp ? 'Executing MCP Tool...' : 'Execute Tool Call (/api/mcp)'}</span>
                </button>
              </div>

              {/* JSON-RPC 2.0 Response Inspector (7 Cols) */}
              <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-gray-700" />
                    <span>MCP JSON-RPC 2.0 Response</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                    POST /api/mcp
                  </span>
                </div>

                <div className="rounded-xl border border-gray-300 bg-gray-950 p-4 font-mono text-[11px] text-gray-200 overflow-x-auto max-h-[380px] leading-relaxed shadow-inner">
                  <pre>
                    {mcpExecutionResult 
                      ? JSON.stringify(mcpExecutionResult, null, 2)
                      : `// Ready for MCP Tool execution.\n// Click "Execute Tool Call" to invoke "${selectedMcpTool}".`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REST API PRO INTERACTIVE PLAYGROUND */}
        {/* ========================================================================= */}
        {activeTab === 'rest_api' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Endpoint Picker (4 Cols) */}
              <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-2">
                <span className="text-xs font-extrabold text-gray-950 uppercase tracking-wider block mb-2">
                  API Pro Endpoints (/api/v1)
                </span>

                {[
                  { id: 'get_loads', method: 'GET', path: '/api/v1/loads', label: 'List Fleet Loads' },
                  { id: 'get_telematics', method: 'GET', path: '/api/v1/telematics', label: 'Live Telemetry' },
                  { id: 'ping_telematics', method: 'POST', path: '/api/v1/telematics/ping', label: 'Phone GPS Ping' },
                  { id: 'inspect_cargo', method: 'POST', path: '/api/v1/cargo/inspect', label: 'Trailer Damage Scan' },
                  { id: 'quote_lane', method: 'POST', path: '/api/v1/rates/quote', label: 'Lane Rate Quote' },
                  { id: 'compliance_packet', method: 'GET', path: '/api/v1/compliance/packet', label: 'Carrier Packet & COI' },
                  { id: 'vault_documents', method: 'GET', path: '/api/v1/vault/documents', label: 'Search Vault Files' }
                ].map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setSelectedRestEndpoint(ep.id);
                      handleExecuteRestApi(ep.id);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all space-y-1 ${
                      selectedRestEndpoint === ep.id
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-gray-900">{ep.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        ep.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ep.method}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 truncate">{ep.path}</div>
                  </button>
                ))}
              </div>

              {/* Execution Console & Code Snippets (8 Cols) */}
              <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-150">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                      Live Response Console
                    </span>
                    <button
                      onClick={() => handleExecuteRestApi(selectedRestEndpoint)}
                      disabled={isExecutingApi}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isExecutingApi ? 'animate-spin' : ''}`} />
                      <span>Execute</span>
                    </button>
                  </div>

                  {/* Code snippet language switcher */}
                  <div className="flex items-center gap-1 text-[11px] bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setCodeLanguage('curl')}
                      className={`px-2 py-0.5 rounded cursor-pointer font-bold ${codeLanguage === 'curl' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-600'}`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setCodeLanguage('python')}
                      className={`px-2 py-0.5 rounded cursor-pointer font-bold ${codeLanguage === 'python' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-600'}`}
                    >
                      Python
                    </button>
                    <button
                      onClick={() => setCodeLanguage('typescript')}
                      className={`px-2 py-0.5 rounded cursor-pointer font-bold ${codeLanguage === 'typescript' ? 'bg-white text-gray-950 shadow-2xs' : 'text-gray-600'}`}
                    >
                      TypeScript
                    </button>
                  </div>
                </div>

                {/* Code Snippet Box */}
                <div className="rounded-xl border border-gray-300 bg-gray-950 p-3 font-mono text-[11px] text-gray-200 overflow-x-auto leading-relaxed shadow-inner">
                  <pre>
                    {codeLanguage === 'curl' && `curl -X GET "${currentOrigin}/api/v1/loads" \\
  -H "Authorization: Bearer apex_live_sec_99214a" \\
  -H "Accept: application/json"`}
                    {codeLanguage === 'python' && `import requests

url = "${currentOrigin}/api/v1/loads"
headers = {"Authorization": "Bearer apex_live_sec_99214a"}
response = requests.get(url, headers=headers)
print(response.json())`}
                    {codeLanguage === 'typescript' && `const response = await fetch("${currentOrigin}/api/v1/loads", {
  headers: {
    "Authorization": "Bearer apex_live_sec_99214a",
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log(data);`}
                  </pre>
                </div>

                {/* Live JSON Response Body */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Response Body (HTTP 200)</span>
                  <div className="rounded-xl border border-gray-300 bg-gray-950 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[260px] leading-relaxed shadow-inner">
                    <pre>
                      {apiResponsePayload ? JSON.stringify(apiResponsePayload, null, 2) : 'Loading live API response...'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DEVELOPER KEYS & LIVE WEBHOOK LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-gray-950">Developer API Keys & Authentication</h3>
              <p className="text-xs text-gray-500">
                Use Bearer token authorization in the HTTP Header (e.g. <code>Authorization: Bearer apex_live_...</code>).
              </p>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-gray-900 flex items-center gap-2">
                    <span>Production API Key</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded">Active</span>
                  </div>
                  <div className="text-[11px] font-mono text-gray-500">apex_live_sec_99214a7812bc884901f</div>
                </div>

                <button
                  onClick={() => handleCopy('apex_live_sec_99214a7812bc884901f', 'prod_key')}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'prod_key' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'prod_key' ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            {/* Live Webhook Event Logs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-150">
                <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>Outbound Webhook Activity Stream</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400">Events ➔ ChatGPT & External Systems</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {[
                  { event: 'load.dispatched', payload: '#GE-982301 assigned to Jesus Medina (Unit TRK-101)', time: '2 mins ago' },
                  { event: 'telematics.ping', payload: 'TRK-101 GPS Stream: 32.5401, -97.3456 (Speed 62 MPH)', time: '4 mins ago' },
                  { event: 'cargo.inspected', payload: '49 CFR 393 Certified. Skid #4 pre-existing carton damage logged.', time: '12 mins ago' },
                  { event: 'rate.counter_offered', payload: 'C.H. Robinson tender countered at $3,850.00 (Target RPM 3.38)', time: '28 mins ago' }
                ].map((wh, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-700 font-bold">[{wh.event}]</span>
                      <span className="text-gray-700">{wh.payload}</span>
                    </div>
                    <span className="text-gray-400 text-[10px] shrink-0">{wh.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SDK DOWNLOADS TAB */}
        {activeTab === 'sdk' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Banner */}
            <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 p-6 rounded-2xl text-white shadow-xl border border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 w-fit mb-2">
                  <Download className="w-3.5 h-3.5" />
                  Client & Node.js Developer SDK v1.4.0
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  FreightSync Document Processing & Invoicing JS SDK
                </h2>
                <p className="text-xs text-gray-300 mt-1 max-w-2xl">
                  Downloadable JavaScript SDK implementation. Embed carrier document parsing, rate calculations, and AR invoicing directly into your own external web apps, TMS platforms, or custom portals.
                </p>
              </div>

              <button
                onClick={downloadJsSdkFile}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2.5 cursor-pointer shrink-0 transition-all hover:scale-102"
              >
                <Download className="w-4 h-4" />
                <span>Download freightsync-sdk.js</span>
              </button>
            </div>

            {/* Supported Document Formats Grid */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-600" />
                Multi-Format Document & Data Processing Capability
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="p-2 rounded-lg bg-red-100 text-red-700 w-fit">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-gray-900">PDF Documents</h4>
                  <p className="text-[11px] text-gray-500">Invoices, RateConfirmations, Bills of Lading (BOL), and Dispatch manifests.</p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 w-fit">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-gray-900">OCR Images & Photos</h4>
                  <p className="text-[11px] text-gray-500">Driver mobile POD photos, trailer cargo damage inspection images, JPEG weight tickets.</p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 w-fit">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-gray-900">CSV & Excel Sheets</h4>
                  <p className="text-[11px] text-gray-500">Bulk load manifests, fuel surcharge matrices, and customer billing ledgers.</p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 w-fit">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-gray-900">JSON & XML EDI</h4>
                  <p className="text-[11px] text-gray-500">EDI 204 load tenders, EDI 210 freight invoices, and EDI 214 status pings.</p>
                </div>
              </div>
            </div>

            {/* Source Code Preview */}
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 text-white space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-gray-200">freightsync-sdk.js Code Preview</span>
                </div>
                <button
                  onClick={() => handleCopy(FREIGHTSYNC_JS_SDK_CODE, 'sdk-code')}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'sdk-code' ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-4 bg-gray-950 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-80 leading-relaxed border border-gray-800/80">
                {FREIGHTSYNC_JS_SDK_CODE}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
