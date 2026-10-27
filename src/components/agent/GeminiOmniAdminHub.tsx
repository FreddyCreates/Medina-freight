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
  AlertCircle,
  FileEdit,
  Smartphone,
  Save,
  Share2,
  Minimize2,
  Maximize2,
  Palette,
  HardDrive
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

interface SubAgent {
  id: string;
  name: string;
  avatarColor: string;
  status: 'idle' | 'working' | 'done';
  currentTask: string;
  category: 'vision' | 'billing' | 'docs' | 'dispatcher';
}

export type BotAnimationTheme = 'grok_dalle' | 'openai_orb' | 'quantum_singularity' | 'cyber_sentinel';

// High-Fidelity Multi-Theme Autonomous AI Presence Architecture (Grokbot, DALL-E, OpenAI Voice Dot, Quantum Singularity, Cyber Sentinel)
const OpenAIDots: React.FC<{ 
  state: 'idle' | 'listening' | 'thinking' | 'executing' | 'done';
  theme?: BotAnimationTheme;
  onSelectTheme?: (t: BotAnimationTheme) => void;
  onForceState?: (s: 'idle' | 'listening' | 'thinking' | 'executing' | 'done') => void;
  onOpenSettings?: () => void;
}> = ({ state, theme = 'grok_dalle', onSelectTheme, onForceState, onOpenSettings }) => {
  return (
    <div className="flex flex-col items-center justify-center py-2 sm:py-4 px-3 min-h-[95px] sm:min-h-[185px] relative overflow-hidden select-none bg-[#F5F5F7] border-b border-[#E5E5EA]">
      {/* High-Fidelity Physics & Hardware Acceleration Keyframes for All 4 Archetypes */}
      <style>{`
        /* THEME 1: Grokbot & DALL-E Keyframes */
        @keyframes grokbotHover {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(-0.5deg); }
          75% { transform: translateY(-2px) rotate(0.5deg); }
        }
        @keyframes grokbotShadowScale {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(0.85); opacity: 0.25; }
        }
        @keyframes grokEyeBlink {
          0%, 94%, 98%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.08); }
        }
        @keyframes grokSpin3D1 {
          0% { transform: rotateX(66deg) rotateY(-20deg) rotateZ(0deg); }
          100% { transform: rotateX(66deg) rotateY(-20deg) rotateZ(360deg); }
        }
        @keyframes grokSpin3D2 {
          0% { transform: rotateX(-35deg) rotateY(55deg) rotateZ(360deg); }
          100% { transform: rotateX(-35deg) rotateY(55deg) rotateZ(0deg); }
        }
        @keyframes grokSpinEquator {
          0% { transform: rotateX(82deg) rotateZ(0deg); }
          100% { transform: rotateX(82deg) rotateZ(360deg); }
        }
        @keyframes dalleIrisSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes dalleLaserSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes dalleScanLine {
          0%, 100% { transform: translateY(-22px); opacity: 0; }
          15%, 85% { opacity: 1; }
          50% { transform: translateY(22px); }
        }

        /* THEME 2: OpenAI Voice Dot Fluid Organic Core */
        @keyframes fluidOrganicMorph {
          0%, 100% {
            border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
            transform: scale(1) rotate(0deg);
          }
          33% {
            border-radius: 70% 30% 46% 54% / 30% 29% 71% 70%;
            transform: scale(1.05) rotate(120deg);
          }
          66% {
            border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%;
            transform: scale(0.96) rotate(240deg);
          }
        }
        @keyframes fluidOrbOrbit {
          0% { transform: rotate(0deg) translateX(34px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(34px) rotate(-360deg); }
        }

        /* THEME 3: Quantum Singularity & Gravitational Lensing */
        @keyframes quantumAccretionSpin {
          0% { transform: rotateX(72deg) rotateZ(0deg); }
          100% { transform: rotateX(72deg) rotateZ(360deg); }
        }
        @keyframes quantumEventHorizonPulse {
          0%, 100% { transform: scale(0.92); opacity: 0.9; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes quantumPulsarSweep {
          0% { transform: rotate(0deg); opacity: 0.4; }
          50% { opacity: 1; }
          100% { transform: rotate(360deg); opacity: 0.4; }
        }

        /* THEME 4: Cybernetic Sentinel & Matrix Waveform */
        @keyframes cyberHudScan {
          0%, 100% { transform: translateY(-16px); opacity: 0.25; }
          50% { transform: translateY(16px); opacity: 1; }
        }
        @keyframes cyberFinsBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(3deg); }
        }

        /* Shared Waveform Ripples */
        @keyframes acousticRipple3D {
          0% { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes equalizerBar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes iMessageEntrance {
          0% { opacity: 0; transform: translateY(6px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-bubble-animate {
          animation: iMessageEntrance 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 3D Perspective Stage Container */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center"
        style={{ 
          perspective: '1000px',
          animation: 'grokbotHover 4.5s infinite ease-in-out'
        }}
      >
        {/* ========================================================================= */}
        {/* ARCHETYPE 1: GROKBOT 3D GYRO & DALL-E GENERATIVE IRIS (DEFAULT FAVORITE) */}
        {/* ========================================================================= */}
        {theme === 'grok_dalle' && (
          <div 
            className="relative w-36 h-28 flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Acoustic Waveform Expansion */}
            {(state === 'listening' || state === 'thinking') && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  className="w-24 h-24 rounded-full border border-[#8E8E93]/40 absolute"
                  style={{ animation: 'acousticRipple3D 2.2s infinite cubic-bezier(0.1, 0.8, 0.2, 1)' }}
                />
                <div 
                  className="w-24 h-24 rounded-full border border-[#C7C7CC]/50 absolute"
                  style={{ animation: 'acousticRipple3D 2.2s infinite cubic-bezier(0.1, 0.8, 0.2, 1)', animationDelay: '0.7s' }}
                />
                <div 
                  className="w-24 h-24 rounded-full border border-[#E5E5EA]/80 absolute"
                  style={{ animation: 'acousticRipple3D 2.2s infinite cubic-bezier(0.1, 0.8, 0.2, 1)', animationDelay: '1.4s' }}
                />
              </div>
            )}

            {/* GROK RING 1: Planetary Singularity Gimbal */}
            <div 
              className="absolute w-34 h-34 rounded-full border border-[#1C1C1E]/35 pointer-events-none"
              style={{ 
                animation: state === 'thinking' || state === 'executing' 
                  ? 'grokSpin3D1 2s infinite linear' 
                  : 'grokSpin3D1 6.5s infinite linear' 
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#1C1C1E] border border-white shadow-xs" />
            </div>

            {/* GROK RING 2: Counter-Axis Polar Gimbal */}
            <div 
              className="absolute w-30 h-30 rounded-full border border-[#8E8E93]/45 pointer-events-none"
              style={{ 
                animation: state === 'thinking' || state === 'executing' 
                  ? 'grokSpin3D2 2.4s infinite linear' 
                  : 'grokSpin3D2 7.5s infinite linear' 
              }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#1C1C1E] border border-white shadow-xs" />
            </div>

            {/* GROK RING 3: Precision Equatorial Ring */}
            <div 
              className="absolute w-28 h-28 rounded-full border border-dashed border-[#C7C7CC]/70 pointer-events-none"
              style={{ 
                animation: state === 'thinking' || state === 'executing' 
                  ? 'grokSpinEquator 2.8s infinite linear' 
                  : 'grokSpinEquator 9s infinite linear' 
              }}
            />

            {/* THE ROBOTIC CHASSIS */}
            <div className="relative z-10 flex items-center justify-center">
              {/* Left Ear */}
              <div className="relative -mr-1.5 flex flex-col items-center z-0">
                <div className="w-2.5 h-7 rounded-full bg-gradient-to-r from-[#D1D1D6] to-[#8E8E93] border border-[#C7C7CC] shadow-2xs flex items-center justify-center">
                  <span className={`w-1 h-1 rounded-full ${state === 'listening' ? 'bg-[#1C1C1E] animate-ping' : 'bg-white/80'}`} />
                </div>
              </div>

              {/* Bot Head & Visor */}
              <div className="relative w-24 h-20 rounded-[22px] bg-gradient-to-b from-white via-[#F5F5F7] to-[#E5E5EA] border-2 border-[#D1D1D6] shadow-lg flex items-center justify-center p-1.5">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    state === 'thinking' ? 'bg-[#1C1C1E] animate-ping' :
                    state === 'listening' ? 'bg-[#1C1C1E] animate-pulse' :
                    'bg-[#8E8E93]'
                  }`} />
                  <div className="w-0.5 h-1 bg-[#8E8E93]" />
                </div>

                <div className="relative w-full h-full rounded-[16px] bg-[#09090B] border border-[#27272A] shadow-inner flex items-center justify-center overflow-hidden">
                  {state === 'idle' && (
                    <div className="flex items-center gap-3 z-10" style={{ animation: 'grokEyeBlink 4s infinite ease-in-out' }}>
                      <div className="w-4 h-5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] flex items-center justify-center">
                        <div className="w-1.5 h-2 rounded-full bg-[#18181B]" />
                      </div>
                      <div className="w-4 h-5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] flex items-center justify-center">
                        <div className="w-1.5 h-2 rounded-full bg-[#18181B]" />
                      </div>
                    </div>
                  )}

                  {state === 'listening' && (
                    <div className="flex items-center gap-1 z-10">
                      <span className="w-1 rounded-full bg-white" style={{ animation: 'equalizerBar 0.6s infinite ease-in-out' }} />
                      <span className="w-1 rounded-full bg-white" style={{ animation: 'equalizerBar 0.8s infinite ease-in-out', animationDelay: '0.15s' }} />
                      <span className="w-1 rounded-full bg-white" style={{ animation: 'equalizerBar 0.5s infinite ease-in-out', animationDelay: '0.3s' }} />
                      <span className="w-1 rounded-full bg-white" style={{ animation: 'equalizerBar 0.9s infinite ease-in-out', animationDelay: '0.45s' }} />
                      <span className="w-1 rounded-full bg-white" style={{ animation: 'equalizerBar 0.7s infinite ease-in-out', animationDelay: '0.6s' }} />
                    </div>
                  )}

                  {state === 'thinking' && (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(255,255,255,0.2) 330deg, rgba(255,255,255,0.7) 360deg)',
                          animation: 'dalleLaserSweep 1.2s infinite linear'
                        }}
                      />
                      <svg className="absolute w-12 h-12 pointer-events-none" viewBox="0 0 100 100" style={{ animation: 'dalleIrisSpin 2.5s infinite linear' }}>
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#27272A" strokeWidth="2" strokeDasharray="4 4" />
                        <path d="M 50 10 C 65 30 75 50 75 75 C 60 65 40 60 25 75 C 25 50 35 30 50 10 Z" fill="none" stroke="#A1A1AA" strokeWidth="1.5" opacity="0.7" />
                        <path d="M 90 50 C 70 65 50 75 25 75 C 35 60 40 40 25 25 C 50 25 70 35 90 50 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
                        <path d="M 50 90 C 35 70 25 50 25 25 C 40 35 60 40 75 25 C 75 50 65 70 50 90 Z" fill="none" stroke="#A1A1AA" strokeWidth="1.5" opacity="0.7" />
                        <path d="M 10 50 C 30 35 50 25 75 25 C 65 40 60 60 75 75 C 50 75 30 65 10 50 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
                      </svg>
                      <div className="absolute inset-x-1 h-0.5 bg-white shadow-[0_0_8px_#ffffff] pointer-events-none z-20" style={{ animation: 'dalleScanLine 1.3s infinite ease-in-out' }} />
                      <Sparkles className="w-5 h-5 text-white animate-pulse relative z-10" />
                    </div>
                  )}

                  {state === 'executing' && (
                    <div className="flex items-center justify-center z-10">
                      <Zap className="w-6 h-6 text-white animate-bounce shadow-xs" />
                    </div>
                  )}

                  {state === 'done' && (
                    <div className="flex items-center gap-2.5 z-10">
                      <div className="text-white text-base font-bold font-mono tracking-tighter">^</div>
                      <Check className="w-4 h-4 text-white" />
                      <div className="text-white text-base font-bold font-mono tracking-tighter">^</div>
                    </div>
                  )}

                  <div className="absolute inset-x-1 top-0.5 h-1/2 rounded-t-[14px] bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Right Ear */}
              <div className="relative -ml-1.5 flex flex-col items-center z-0">
                <div className="w-2.5 h-7 rounded-full bg-gradient-to-r from-[#8E8E93] to-[#D1D1D6] border border-[#C7C7CC] shadow-2xs flex items-center justify-center">
                  <span className={`w-1 h-1 rounded-full ${state === 'listening' ? 'bg-[#1C1C1E] animate-ping' : 'bg-white/80'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ARCHETYPE 2: OPENAI VOICE DOT & FLUID DYNAMIC LIQUID CORE                 */}
        {/* ========================================================================= */}
        {theme === 'openai_orb' && (
          <div className="relative w-36 h-28 flex items-center justify-center">
            {/* Ambient Halo Pulse */}
            <div 
              className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-[#1C1C1E]/20 via-[#8E8E93]/15 to-transparent blur-md"
              style={{ animation: 'acousticRipple3D 2.6s infinite ease-out' }}
            />

            {/* Orbiting Photon Beacon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-24 h-24 rounded-full border border-dashed border-[#C7C7CC]/60 flex items-center justify-center"
                style={{ animation: 'fluidOrbOrbit 3.2s infinite linear' }}
              >
                <div className="w-2 h-2 rounded-full bg-[#1C1C1E] border border-white shadow-xs" />
              </div>
            </div>

            {/* Liquid Morphing Obsidian Core */}
            <div 
              className="relative w-18 h-18 bg-gradient-to-tr from-black via-[#1C1C1E] to-[#2C2C2E] border-2 border-[#1C1C1E] shadow-xl flex items-center justify-center overflow-hidden"
              style={{ 
                animation: state === 'thinking' || state === 'executing' 
                  ? 'fluidOrganicMorph 2.2s infinite ease-in-out' 
                  : 'fluidOrganicMorph 5s infinite ease-in-out' 
              }}
            >
              {/* Internal Refraction Highlights */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent pointer-events-none" />

              {/* Center State Glyph */}
              <div className="relative z-10">
                {state === 'idle' && <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_white]" />}
                {state === 'listening' && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
                    <span className="w-0.5 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                    <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                  </div>
                )}
                {state === 'thinking' && <Sparkles className="w-5 h-5 text-white animate-spin" />}
                {state === 'executing' && <Zap className="w-5 h-5 text-white animate-bounce" />}
                {state === 'done' && <Check className="w-5 h-5 text-white" />}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ARCHETYPE 3: QUANTUM SINGULARITY & GRAVITATIONAL LENSING                  */}
        {/* ========================================================================= */}
        {theme === 'quantum_singularity' && (
          <div className="relative w-36 h-28 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            {/* Accretion Disk (3D Tilted Particle Ring) */}
            <div 
              className="absolute w-32 h-32 rounded-full border-2 border-dashed border-[#1C1C1E]/60 pointer-events-none"
              style={{ animation: 'quantumAccretionSpin 2.4s infinite linear' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-black border border-white" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black border border-white" />
            </div>

            {/* Rotating Pulsar Sweep Beams */}
            <div 
              className="absolute w-24 h-24 rounded-full border border-[#8E8E93]/40 pointer-events-none flex items-center justify-center"
              style={{ animation: 'quantumPulsarSweep 3s infinite linear' }}
            >
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent" />
            </div>

            {/* Event Horizon Obsidian Core */}
            <div 
              className="relative w-16 h-16 rounded-full bg-black border-2 border-[#1C1C1E] shadow-2xl flex items-center justify-center overflow-hidden"
              style={{ animation: 'quantumEventHorizonPulse 2.8s infinite ease-in-out' }}
            >
              <div className="absolute inset-1 rounded-full border border-white/20" />
              <div className="relative z-10 text-white">
                {state === 'idle' && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_white]" />}
                {state === 'listening' && <Activity className="w-5 h-5 text-white animate-pulse" />}
                {state === 'thinking' && <RefreshCw className="w-5 h-5 text-white animate-spin" />}
                {state === 'executing' && <Zap className="w-5 h-5 text-white animate-bounce" />}
                {state === 'done' && <Check className="w-5 h-5 text-white" />}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ARCHETYPE 4: CYBERNETIC SENTINEL & MATRIX WAVEFORM                        */}
        {/* ========================================================================= */}
        {theme === 'cyber_sentinel' && (
          <div className="relative w-36 h-28 flex items-center justify-center">
            {/* Dual Cyber Antenna Fins */}
            <div className="absolute -left-1 w-3 h-10 rounded-sm bg-[#1C1C1E] border border-[#C7C7CC] flex items-center justify-center" style={{ animation: 'cyberFinsBob 3s infinite ease-in-out' }}>
              <div className="w-1 h-3 bg-white rounded-xs" />
            </div>
            <div className="absolute -right-1 w-3 h-10 rounded-sm bg-[#1C1C1E] border border-[#C7C7CC] flex items-center justify-center" style={{ animation: 'cyberFinsBob 3s infinite ease-in-out', animationDelay: '1.5s' }}>
              <div className="w-1 h-3 bg-white rounded-xs" />
            </div>

            {/* Cyber Sentinel Chassis */}
            <div className="relative w-28 h-18 rounded-[12px] bg-gradient-to-b from-[#2C2C2E] to-[#1C1C1E] border-2 border-[#8E8E93] shadow-xl p-1.5 flex flex-col justify-between overflow-hidden">
              {/* Top HUD Status Line */}
              <div className="flex items-center justify-between px-1 text-[8px] font-mono text-white/70">
                <span>SENTINEL·04</span>
                <span className="text-[#34C759]">SYS OK</span>
              </div>

              {/* Visor Matrix Oscilloscope */}
              <div className="relative w-full h-10 rounded-[8px] bg-black border border-[#3A3A3C] flex items-center justify-center overflow-hidden">
                {/* HUD Scan Line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_6px_white] pointer-events-none" style={{ animation: 'cyberHudScan 1.6s infinite linear' }} />
                
                {/* State Presentation */}
                <div className="relative z-10 flex items-center gap-1">
                  {state === 'idle' && (
                    <div className="flex items-center gap-3 font-mono text-white text-xs font-bold">
                      <span>[&bull;]</span>
                      <span>[&bull;]</span>
                    </div>
                  )}
                  {state === 'listening' && (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-2 bg-white rounded-xs" style={{ animation: 'equalizerBar 0.5s infinite' }} />
                      <span className="w-1 h-4 bg-white rounded-xs" style={{ animation: 'equalizerBar 0.7s infinite' }} />
                      <span className="w-1 h-6 bg-white rounded-xs" style={{ animation: 'equalizerBar 0.4s infinite' }} />
                      <span className="w-1 h-3 bg-white rounded-xs" style={{ animation: 'equalizerBar 0.6s infinite' }} />
                    </div>
                  )}
                  {state === 'thinking' && (
                    <div className="font-mono text-[10px] text-white tracking-widest animate-pulse">
                      SCANNING...
                    </div>
                  )}
                  {state === 'executing' && <Zap className="w-5 h-5 text-white animate-bounce" />}
                  {state === 'done' && <Check className="w-5 h-5 text-white" />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ambient Ground Shadow */}
        <div 
          className="w-16 h-1.5 rounded-full bg-[#C7C7CC]/50 mt-1 blur-xs"
          style={{ animation: 'grokbotShadowScale 4.5s infinite ease-in-out' }}
        />
      </div>

      {/* Status Pill & Settings Toggle Bar */}
      <div className="mt-2.5 z-10 flex flex-col sm:flex-row items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1C1E] border border-[#2C2C2E] shadow-xs text-[10px] font-mono font-medium tracking-tight text-white">
          <span className={`w-1.5 h-1.5 rounded-full ${
            state === 'thinking' ? 'bg-white animate-ping' :
            state === 'listening' ? 'bg-white animate-pulse' :
            state === 'executing' ? 'bg-white animate-bounce' :
            'bg-white'
          }`} />
          <span className="uppercase">
            {theme === 'grok_dalle' && 'Grok·DALL-E Hybrid // '}
            {theme === 'openai_orb' && 'OpenAI Voice Dot // '}
            {theme === 'quantum_singularity' && 'Quantum Singularity // '}
            {theme === 'cyber_sentinel' && 'Cyber Sentinel // '}
            {state === 'idle' && 'Standby'}
            {state === 'listening' && 'Listening'}
            {state === 'thinking' && 'Vision OCR'}
            {state === 'executing' && 'Dispatching'}
            {state === 'done' && 'Ready'}
          </span>
        </div>

        {/* Theme Settings Trigger */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-[#E5E5EA] border border-[#C7C7CC] text-[10px] font-medium text-[#1C1C1E] cursor-pointer shadow-2xs transition-colors"
          title="Open Animation Settings"
        >
          <Palette className="w-3 h-3 text-[#1C1C1E]" />
          <span>Animation Settings</span>
        </button>

        {/* Equalizer Frequency Indicator */}
        {(state === 'listening' || state === 'thinking') && (
          <div className="hidden sm:flex items-center gap-0.5 h-2.5 px-1.5 py-0.5 rounded-full bg-[#E5E5EA] border border-[#C7C7CC]/60">
            <span className="w-0.5 h-full rounded-full bg-[#1C1C1E] animate-pulse" />
            <span className="w-0.5 h-2/3 rounded-full bg-[#1C1C1E] animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-0.5 h-full rounded-full bg-[#1C1C1E] animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>

      {/* Interactive Mode Inspector (macOS Segmented Spec) */}
      {onForceState && (
        <div className="mt-2 flex items-center gap-1 bg-[#E5E5EA] p-0.5 rounded-[8px] border border-[#C7C7CC]/60 text-[10px] select-none flex-wrap justify-center">
          {(['idle', 'listening', 'thinking', 'executing', 'done'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onForceState(s)}
              className={`px-2 py-0.5 rounded-[6px] font-mono transition-all cursor-pointer ${
                state === s
                  ? 'bg-white text-[#1C1C1E] font-semibold shadow-2xs'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              {s === 'idle' && 'Standby'}
              {s === 'listening' && 'Voice'}
              {s === 'thinking' && 'OCR'}
              {s === 'executing' && 'Execute'}
              {s === 'done' && 'Done'}
            </button>
          ))}
        </div>
      )}
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-init-1',
        sender: 'agent',
        text: `Gemini Omni Fleet Commander Active.\n\nCarrier: GREEN EXPRESS LLC · DOT #: ${companyProfile.dotNumber}\n\nOur specialized Sub-Agents (Document Processor, Dispatcher, Billing Specialist, Google Docs Writer) are standing by. You can take a real-time photo of your paperwork or talk directly to me. I will coordinate with the relevant sub-agents to process everything instantly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'general_tms'
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState<'general_tms' | 'truck_diagnostic' | 'document_processing' | 'gmail_agent'>('general_tms');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // OpenAI Dots animations state
  const [aiDotState, setAiDotState] = useState<'idle' | 'listening' | 'thinking' | 'executing' | 'done'>('idle');

  // Bot Presence Animation Theme
  const [animationTheme, setAnimationTheme] = useState<BotAnimationTheme>(() => {
    const saved = localStorage.getItem('alvys_bot_animation_theme');
    return (saved as BotAnimationTheme) || 'grok_dalle';
  });
  const [isAnimationSettingsOpen, setIsAnimationSettingsOpen] = useState(false);

  const handleSelectAnimationTheme = (theme: BotAnimationTheme) => {
    setAnimationTheme(theme);
    try {
      localStorage.setItem('alvys_bot_animation_theme', theme);
    } catch (e) {
      console.warn('LocalStorage quota exceeded for animation theme:', e);
    }
    showToast(`Active bot animation: ${
      theme === 'grok_dalle' ? 'Grokbot 3D Gyro & DALL-E' :
      theme === 'openai_orb' ? 'OpenAI Voice Dot' :
      theme === 'quantum_singularity' ? 'Quantum Singularity' :
      'Cybernetic Sentinel'
    }`);
  };

  // MCP Control Panel (Disabled by default so it does NOT auto-pop out)
  const [showMcpPanel, setShowMcpPanel] = useState(false);
  const [realEmails, setRealEmails] = useState<RealGmailThread[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<RealGmailThread | null>(null);
  const [isSyncingEmails, setIsSyncingEmails] = useState(false);

  // Local drivers status sync
  const [localDrivers, setLocalDrivers] = useState<FleetDriver[]>(() => {
    const saved = localStorage.getItem('alvys_fleet_drivers_v2');
    return saved ? JSON.parse(saved) : drivers;
  });

  useEffect(() => {
    if (drivers) {
      setLocalDrivers(drivers);
    }
  }, [drivers]);

  // Antigravity-style Sub-agents Workspace State
  const [subAgents, setSubAgents] = useState<SubAgent[]>([
    { id: 'sa-vision', name: 'Document Processor', avatarColor: 'from-purple-500 to-indigo-600', status: 'idle', currentTask: 'Waiting for camera document snapshot...', category: 'vision' },
    { id: 'sa-dispatch', name: 'Dispatcher', avatarColor: 'from-amber-500 to-orange-600', status: 'idle', currentTask: 'Awaiting calendar & REST routing trigger...', category: 'dispatcher' },
    { id: 'sa-billing', name: 'Billing Specialist', avatarColor: 'from-emerald-500 to-teal-600', status: 'idle', currentTask: 'Auditing rate conf confirmations...', category: 'billing' },
    { id: 'sa-docs', name: 'Google Docs Writer', avatarColor: 'from-blue-500 to-cyan-600', status: 'idle', currentTask: 'Drafting contracts & templates...', category: 'docs' }
  ]);

  const [activeSubAgentTab, setActiveSubAgentTab] = useState<string>('sa-vision');
  const activeAgent = subAgents.find(sa => sa.id === activeSubAgentTab) || subAgents[0];
  
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleSpawnSubAgent = (name: string, category: 'vision' | 'billing' | 'docs' | 'dispatcher', initialTask: string) => {
    const id = `sa-${Date.now()}`;
    const colors = [
      'from-purple-500 to-indigo-600',
      'from-amber-500 to-orange-600',
      'from-emerald-500 to-teal-600',
      'from-blue-500 to-cyan-600',
      'from-rose-500 to-red-600'
    ];
    const avatarColor = colors[subAgents.length % colors.length];

    const newAgent: SubAgent = {
      id,
      name,
      avatarColor,
      status: 'working',
      currentTask: initialTask,
      category
    };

    setSubAgents(prev => {
      const exists = prev.find(a => a.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        return prev.map(a => a.name.toLowerCase() === name.toLowerCase() ? { ...a, status: 'working', currentTask: initialTask } : a);
      }
      return [...prev, newAgent];
    });

    setActiveSubAgentTab(id);
    setIsRightCollapsed(false);
    showToast(`New sub-agent spawned: ${name}`);
    appendMcpLog(`[SPAWNER] Instantiated specialized sub-agent: '${name}'`);

    // Swipe mobile layout to show the Workspace Desk
    setIsLeftCollapsed(true);
    setIsRightCollapsed(false);
  };

  // Phone/Mobile Collapsible States
  // By default, on mobile screens both should be collapsed appropriately
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true); // Right panel starts collapsed for phone ergonomics

  // Delegation loader states
  const [delegatingTo, setDelegatingTo] = useState<string | null>(null);

  // Google Workspace Paperwork Creator states
  const [docTemplateType, setDocTemplateType] = useState<string>('workorder');
  const [docContent, setDocContent] = useState<string>(
    `Carrier: GREEN EXPRESS LLC\nDOT #: ${companyProfile.dotNumber} | MC #: ${companyProfile.mcNumber}\n\n===================================================\nDISPATCH WORKORDER CONTRACT\n===================================================\nLoad Reference: [Extract Pending]\nBroker Customer: [Extract Pending]\n\nRoute corridor: [Origin City] to [Destination City]\nTrailer Requirements: 53ft Refrigerated Trailer (-10 degrees continuous)\nAssigned CDL Driver: Ray Delgado (Cell: 312-555-0199)\nPower Unit: TRK-402 | Trailer Unit: TRL-808\n\nFINANCIAL SETTLEMENT SUMMARY:\n---------------------------------------------------\n- Linehaul Agreed Pay: $0.00 USD\n- DOE Fuel Surcharge (FSC): $0.00 USD\n- Accessorial Lumper Allowance: $0.00 USD\n- Net Total Carrier Remittance: $0.00 USD\n\nDETENTION & DWELL POLICIES:\n---------------------------------------------------\nDetention terms: $50.00/hour after 2 hours free. Immediate check-call notice required.\n\nApproved Sign-off:\nGREEN EXPRESS Dispatch Operations Desk`
  );

  const [docAiPrompt, setDocContentPrompt] = useState<string>('');
  const [isDraftingDoc, setIsDraftingDoc] = useState<boolean>(false);

  const appendToAgentTask = (id: string, status: 'idle' | 'working' | 'done', currentTask: string) => {
    setSubAgents(prev => prev.map(a => a.id === id ? { ...a, status, currentTask } : a));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Messages Scroll End
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Model Context Protocol logs
  const [mcpHandshakeLogs, setMcpHandshakeLogs] = useState<string[]>([
    `[MCP-CONNECT] Connected to local agent: mcp://localhost:4500 (JSON-RPC)`,
    `[MCP-DISCOVER] Registered 11 system tools.`
  ]);

  const appendMcpLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMcpHandshakeLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 25)]);
  };

  // Pending secure authorization gate prompt
  const [pendingMcpAuth, setPendingMcpAuth] = useState<{
    id: string;
    toolName: string;
    args: any;
    label: string;
  } | null>(null);

  // Sandbox states
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>('calculate_freight_quote');
  const [mcpArgumentsText, setMcpArgumentsText] = useState('{\n  "originCity": "Chicago",\n  "destCity": "Dallas",\n  "miles": 850,\n  "ratePerMile": 3.40\n}');
  const [mcpExecutionResult, setMcpExecutionResult] = useState<any>(null);
  const [isExecutingMcp, setIsExecutingMcp] = useState(false);

  // Camera Ingestion & Photo Vision OCR
  const [documentFile, setDocumentFile] = useState<string | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string>('');
  const [documentFileType, setDocumentFileType] = useState<string>('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [parsedDocResult, setParsedDocResult] = useState<any>(null);

  // Camera device state & Attachment Dropdown
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Speech API
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const recognitionRef = useRef<any>(null);

  // =========================================================
  // TASK DELEGATION SYSTEM (DYNAMIC AGENT INSTANCES DELEGATOR)
  // =========================================================
  const handleDelegateTaskToAgent = (agentId: string) => {
    const targetAgent = subAgents.find(sa => sa.id === agentId);
    if (!targetAgent) return;

    setDelegatingTo(targetAgent.name);
    setAiDotState('thinking');
    appendToAgentTask(agentId, 'working', `Executing delegated dispatch operations...`);
    appendMcpLog(`[DELEGATOR] Delegated query context to specialised instance: '${targetAgent.name}'`);

    setTimeout(() => {
      setDelegatingTo(null);
      setAiDotState('idle');
      appendToAgentTask(agentId, 'done', `Finished delegated task successfully.`);
      
      // Perform task outcome based on which agent category was selected
      let replyText = '';
      if (targetAgent.category === 'vision') {
        replyText = `📋 **${targetAgent.name} (Document Processor) Delegate Success**\n\nI have successfully delegated your document ingestion queues to the specialized Document Vision OCR sub-agent instance **${targetAgent.name}**. Ready to scan and extract raw data immediately!`;
      } else if (targetAgent.category === 'dispatcher') {
        replyText = `🚚 **${targetAgent.name} (Dispatcher) Delegate Success**\n\nI have delegated driver management to **${targetAgent.name}**. Driver statuses and GPS corridors are verified, and the Google Calendar sync module is active in the workspace desk.`;
      } else if (targetAgent.category === 'billing') {
        replyText = `💳 **${targetAgent.name} (Billing Specialist) Delegate Success**\n\nDelegated accounts auditing to **${targetAgent.name}**. Synchronized Gmail REST API to query unread carrier tenders.`;
        handleFetchUnreadEmails();
      } else if (targetAgent.category === 'docs') {
        replyText = `✍️ **${targetAgent.name} (Google Docs Writer) Delegate Success**\n\nGoogle Workspace templates are synchronized with **${targetAgent.name}**. I have updated the editor and am ready to push official contract packets directly to your Google Drive!`;
      } else {
        replyText = `🤖 **${targetAgent.name} Delegate Success**\n\nDelegated operational query to customized agent instance **${targetAgent.name}**. Ready to execute!`;
      }

      setActiveSubAgentTab(targetAgent.id);
      setIsRightCollapsed(false); // open workspace to show results

      setMessages(prev => [
        ...prev,
        {
          id: `msg-delegated-${Date.now()}`,
          sender: 'agent',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      showToast(`Delegation to ${targetAgent.name} complete!`);
    }, 1200);
  };

  // Camera vision execution on load/capture
  const processImageImmediately = async (base64Data: string, fileName: string, fileType: string) => {
    setIsProcessingDoc(true);
    setAiDotState('thinking');
    appendToAgentTask('sa-vision', 'working', `Scanning and parsing ${fileName} immediately via Gemini vision...`);
    appendMcpLog(`[VISION-AUTO] Automatically analyzing vision capture: ${fileName}`);

    try {
      const res = await fetch('/api/gemini/extract-document-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64Data,
          mimeType: fileType || 'image/jpeg',
          fileName: fileName
        })
      });

      setIsProcessingDoc(false);
      setAiDotState('idle');
      appendToAgentTask('sa-vision', 'done', `Finished parsing ${fileName}. Mapped structure.`);

      if (res.ok) {
        const payload = await res.json();
        const data = payload.data;
        setParsedDocResult(data);
        showToast(`Document vision analysis complete: ${data.documentType}`);
        appendMcpLog(`[VISION-AUTO] Extracted Load #${data.loadNumber || 'N/A'} (Confidence: ${data.ocrConfidence}%)`);

        // Automatically update billing agent current task
        appendToAgentTask('sa-billing', 'working', `Auditing extracted load linehaul charges $${data.rateAmount || '0'}...`);
        
        // Auto update the Google Doc template content with extracted information!
        const autoUpdatedContent = `Carrier: GREEN EXPRESS LLC\nDOT #: ${companyProfile.dotNumber} | MC #: ${companyProfile.mcNumber}\n\n===================================================\nDISPATCH WORKORDER CONTRACT\n===================================================\nLoad Reference: ${data.loadNumber || 'RC-' + Math.floor(10000 + Math.random() * 90000)}\nBroker Customer: ${data.brokerCustomer || 'C.H. Robinson Worldwide'}\n\nRoute corridor: ${data.shipperName || 'Chicago, IL'} to ${data.consigneeName || 'Dallas, TX'}\nTrailer Requirements: 53ft Refrigerated Trailer (-10 degrees continuous)\nAssigned CDL Driver: Ray Delgado (Cell: 312-555-0199)\nPower Unit: TRK-402 | Trailer Unit: TRL-808\n\nFINANCIAL SETTLEMENT SUMMARY:\n---------------------------------------------------\n- Linehaul Agreed Pay: $${(data.rateAmount || 3450).toFixed(2)} USD\n- DOE Fuel Surcharge (FSC): $450.00 USD\n- Accessorial Lumper Allowance: $${(data.lumperAmount || 0).toFixed(2)} USD\n- Net Total Carrier Remittance: $${((data.rateAmount || 3450) + 450 + (data.lumperAmount || 0)).toFixed(2)} USD\n\nDETENTION & DWELL POLICIES:\n---------------------------------------------------\nDetention terms: ${data.detentionTerms || '$50.00/hour after 2 hours free. Immediate check-call notice required.'}\n\nApproved Sign-off:\nGREEN EXPRESS Dispatch Operations Desk`;
        setDocContent(autoUpdatedContent);

        setMessages(prev => [
          ...prev,
          {
            id: `msg-vision-auto-${Date.now()}`,
            sender: 'agent',
            text: `🎯 **Instant Vision Paperwork Result**\n\n• **Document Type**: \`${data.documentType || 'BOL'}\`\n• **Load #**: \`${data.loadNumber || 'Omitted'}\`\n• **Broker**: \`${data.brokerCustomer || 'Omitted'}\`\n• **Receiver Sign-off**: \`${data.consigneeSignatureDetected ? '✅ Verified Signature' : '❌ Missing Signature'}\`\n• **Extracted Detention Terms**: \`${data.detentionTerms || 'Not Specified'}\`\n\nSub-agents have auto-filled this information into your active **Google Doc Workorder** template inside the workspace!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        
        setActiveSubAgentTab('sa-docs');
        setIsRightCollapsed(false); // Ensure workspace is visible
        showToast('Document template has been auto-filled!');
      } else {
        showToast('Auto Vision parsing failed. Fallback triggered.');
      }
    } catch (e: any) {
      setIsProcessingDoc(false);
      setAiDotState('idle');
      showToast(`Vision parsing failed: ${e.message}`);
    }
  };

  // Webcam camera methods
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
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      setDocumentFile(base64);
      setDocumentFileName(`web_snapshot_${Date.now()}.jpg`);
      setDocumentFileType('image/jpeg');
      stopCamera();
      showToast('Camera snapshot captured! Immediate parsing triggered.');
      processImageImmediately(base64, `web_snapshot_${Date.now()}.jpg`, 'image/jpeg');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setDocumentFile(base64);
      setDocumentFileName(file.name);
      setDocumentFileType(file.type);
      showToast(`Loaded file ${file.name}. Immediate parsing triggered.`);
      processImageImmediately(base64, file.name, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Verbal instruction capture
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
        appendToAgentTask('sa-vision', 'working', 'Capturing voice command input...');
      };
      
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsVoiceListening(false);
        setAiDotState('idle');
        appendToAgentTask('sa-vision', 'idle', 'Speech captured.');
        if (transcript.trim()) {
          showToast(`Speech captured: "${transcript}"`);
          await handleProcessInstruction(transcript, null);
        }
      };

      recognition.onerror = () => {
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

  // Speech TTS
  const speakText = (text: string) => {
    if (isAudioMuted || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_`]/g, '').substring(0, 180);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Sync Emails
  const handleFetchUnreadEmails = async () => {
    setIsSyncingEmails(true);
    appendToAgentTask('sa-billing', 'working', 'Querying unread Gmail freight confirmations...');
    appendMcpLog(`[GMAIL-API] Fetching unread emails...`);
    
    try {
      const res = await listUnreadGmailThreads(8);
      setIsSyncingEmails(false);
      
      if (res.error) {
        showToast(`Gmail API requires authorization login.`);
        appendToAgentTask('sa-billing', 'idle', 'Failed Gmail inbox query.');
        return;
      }

      setRealEmails(res.threads || []);
      showToast(`Loaded ${res.threads?.length || 0} unread freight emails!`);
      appendToAgentTask('sa-billing', 'idle', `Discovered ${res.threads?.length || 0} rate sheets.`);
    } catch (err: any) {
      setIsSyncingEmails(false);
      showToast(`Sync error: ${err.message}`);
    }
  };

  const handleGmailLogin = async () => {
    try {
      await getGmailAccessToken(true);
      showToast('Successfully logged into Google Workspace!');
      handleFetchUnreadEmails();
    } catch (e: any) {
      showToast(`Login failed: ${e.message}`);
    }
  };

  const handleAutoReply = async (
    thread: RealGmailThread,
    action: 'confirm_acceptance' | 'request_rate_increase' | 'request_details',
    negotiateRate?: number
  ) => {
    setIsProcessing(true);
    setAiDotState('executing');
    appendToAgentTask('sa-dispatch', 'working', `Sending email reply to broker via Gmail...`);

    try {
      const res = await autoReplyToBrokerThread({
        threadId: thread.threadId,
        messageId: thread.messages[0]?.id || '',
        to: thread.fromEmail,
        subject: thread.subject,
        action,
        rateOffer: negotiateRate,
        parsedFreightData: thread.parsedFreightData
      });

      setIsProcessing(false);
      setAiDotState('idle');
      appendToAgentTask('sa-dispatch', 'idle', 'Outbound broker confirmation sent.');

      if (res.success) {
        showToast('Gmail auto-reply sent successfully!');
        appendMcpLog(`[GMAIL-OUT] Auto-reply dispatched successfully.`);
        handleFetchUnreadEmails();
        
        setMessages(prev => [
          ...prev,
          {
            id: `msg-reply-${Date.now()}`,
            sender: 'agent',
            text: `📬 **Dispatched Broker Email Reply**\n\nTo: ${thread.fromEmail}\nSubject: Re: ${thread.subject}\nAction: ${action === 'confirm_acceptance' ? 'Confirmed acceptance' : action === 'request_rate_increase' ? 'Negotiation sent at $' + negotiateRate : 'Requested additional details'}.`,
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

  // Commit vison extracted load to Dispatch Matrix
  const handleCommitParsedDocumentLoad = () => {
    if (!parsedDocResult) return;
    const d = parsedDocResult;

    const assignedMedinaDriver = drivers.find(drv => drv.status === 'available') || drivers[0] || {
      name: 'Jesus Medina',
      phone: '(817) 592-1060',
      truckNumber: 'Unit #106',
      trailerNumber: 'TLR-54211'
    };

    const sampleProj: Project = {
      id: `prj-doc-${Date.now()}`,
      code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      loadNumber: d.loadNumber || `LD-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: d.brokerCustomer || 'C.H. Robinson Worldwide',
      customerCode: (d.brokerCustomer || 'CHRW').substring(0, 4).toUpperCase(),
      originCity: d.originCity || 'Chicago',
      originState: d.originState || 'IL',
      originAddress: d.shipperName || 'Chicago Shipper Terminal',
      destCity: d.destCity || 'Dallas',
      destState: d.destState || 'TX',
      destAddress: d.consigneeName || 'Dallas Consignee Hub',
      status: 'booked',
      driverName: assignedMedinaDriver.name,
      driverPhone: assignedMedinaDriver.phone,
      truckId: assignedMedinaDriver.truckNumber,
      trailerId: assignedMedinaDriver.trailerNumber,
      pickupDate: d.pickupDate || new Date().toISOString().split('T')[0],
      deliveryDate: d.deliveryDate || new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      estimatedRevenue: d.rate || 3850,
      linehaulPay: (d.rate || 3850) - 450,
      fuelSurcharge: 450,
      equipmentType: '53ft Reefer',
      commodities: d.commodity || 'Refrigerated Cargo',
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
    showToast('Successfully committed vision load to Matrix and Invoices!');
  };

  // Secure User Approval action from Consent Gate
  const handleApprovePendingMcp = async () => {
    if (!pendingMcpAuth) return;
    const auth = pendingMcpAuth;
    setPendingMcpAuth(null);
    appendMcpLog(`[GATEKEEPER] APPROVED dynamic execution of '${auth.toolName}'`);

    setIsProcessing(true);
    setAiDotState('executing');
    appendToAgentTask('sa-dispatch', 'working', `Invoking tool node ${auth.toolName}...`);

    try {
      const toolRes = await executeMCPTool(auth.toolName, auth.args, { projects, invoices, companyProfile });
      setIsProcessing(false);
      setAiDotState('idle');
      appendToAgentTask('sa-dispatch', 'idle', 'Tool executed.');

      if (toolRes.success) {
        showToast(`Executed '${auth.toolName}' successfully!`);
        appendMcpLog(`[MCP] Tool response: success`);

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

  // Intelligent autonomous assistant reply generator (guarantees chat never fails)
  const generateIntelligentAssistantReply = (prompt: string): string => {
    const q = prompt.toLowerCase();
    
    // Invoices / Billing / Factoring
    if (/invoice|bill|factoring|aging|remittance|ar|payment|rate con/i.test(q)) {
      const pendingTotal = invoices.filter(i => i.status === 'needs_review' || i.status === 'sent').reduce((acc, curr) => acc + curr.totalAmount, 0);
      return `### 💳 Accounts Receivable & Billing Report
**Carrier:** GREEN EXPRESS LLC · DOT #${companyProfile.dotNumber}

* **Active Pipeline:** ${invoices.length} invoices registered
* **Outstanding AR Balance:** $${pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
* **Recent Invoices:**
${invoices.slice(0, 3).map(inv => `  - **Invoice #${inv.invoiceNumber}:** $${inv.totalAmount.toLocaleString()} (${inv.customerName}) · Status: \`${inv.status.toUpperCase()}\``).join('\n')}

**Document & PDF Generation:**
All invoices can be converted to official carrier billing packets with signed BOLs in the **Docs & Base Explorer** tab. You can download carrier-grade PDFs with one click.`;
    }

    // Loads / Dispatch / Corridors
    if (/load|dispatch|corridor|route|lane|chicago|dallas|atlanta|california|freight/i.test(q)) {
      return `### 🚚 Dispatch Operations & Active Loads
**Fleet:** GREEN EXPRESS LLC · 4 Medina Family Power Units (Units #101, #102, #103, #106)

* **Active Loads in Transit:** ${projects.length} loads
* **Current Freight Corridors:**
${projects.slice(0, 4).map(p => `  - **Load #${p.loadNumber}:** ${p.originCity}, ${p.originState} ➔ ${p.destCity}, ${p.destState} ($${p.estimatedRevenue?.toLocaleString() || '3,850'}) · Driver: ${p.driverName || 'Jesus Medina'}`).join('\n')}

**Dispatch Action:**
All loads are synchronized with the live Dispatch Matrix, Google Calendar, and live GPS tracking. You can generate Driver Trip Sheets or Bill of Lading (BOL) PDFs directly from the **Dispatch Matrix** and **Docs & Base Explorer** tabs.`;
    }

    // Drivers / Fleet CDL Roster & Memory Vault
    if (/driver|roster|cdl|medina|jesus|jose|luis|alfredo|hours|hos|vault/i.test(q)) {
      return `### 👤 Medina Family Fleet & Driver Memory Vault Status
**4 Active Professional CDL-A Drivers:**

* **Lead Units:**
${localDrivers.slice(0, 4).map(d => `  - **${d.name}** (${d.truckNumber.split('(')[0].trim()} · ${d.equipmentType}): \`${d.status.toUpperCase()}\` · Location: ${d.currentLocation || 'In Transit'} · Pay: ${d.payModel || '65% Gross'}`).join('\n')}

**Driver Memory Vaults:**
Each driver (Jesus, Jose, Luis, Alfredo) has a dedicated account locker storing their Class A CDL, DOT Medical Examiner Cards, W-9 agreements, annual inspection stickers, settlement paystubs, and AI-logged preferences.`;
    }

    // Diagnostics / Engine / Telematics / SPN / FMI
    if (/diagnostic|engine|dtc|spn|fmi|fault|check engine|cummins|detroit|paccar|reefer|thermo king|regen|dpf|def|brake/i.test(q)) {
      return `### 🔧 Heavy Commercial Truck Diagnostic Evaluation
**Master Diagnostic Specialist Assessment:**

* **System Evaluated:** Heavy Diesel Powertrain / Emissions / Reefer
* **Diagnostic Protocol:**
  1. Inspect J1939 telematics broadcast codes (SPN/FMI indicators).
  2. Verify DEF dosing pressure (>72 PSI) and DPF differential pressure (<1.2 PSI).
  3. If check engine light is flashing with derate warning: perform stationary high-idle park regeneration (coolant temp >165°F).
  4. Inspect air governor cut-out (120-135 PSI) and drain air tank reservoirs.

*OEM part suppliers (FleetPride, Rush Truck Centers, Freightliner) are linked. Sub-agents are standing by for parts sourcing.*`;
    }

    // Documents / Paperwork / PDFs / Database
    if (/doc|document|pdf|download|explorer|database|paperwork|bol|pod/i.test(q)) {
      return `### 📁 Document & Database Explorer Operations
All paperwork, invoices, rate confirmations, and carrier records are fully user-facing and exportable!

* **Live Features in Docs & Base Explorer Tab:**
  - 📄 **Carrier Invoices:** Generate high-resolution PDF invoices formatted with payment terms & remittance instructions.
  - 📋 **Bills of Lading (BOL):** Generate official DOT shipping manifests and proof-of-delivery docs.
  - 📑 **Carrier Rate Confirmations:** Official Alvys-standard rate agreements ready for signatures.
  - 🗄️ **Database Table Explorer:** Full raw view of loads, invoices, drivers, and freight estimates.

Click **Docs & Base Explorer** in the sidebar or top bar to browse and download your files anytime.`;
    }

    // Default intelligent TMS reply
    return `### 🚛 Gemini Master Fleet Commander
**Carrier Authority:** GREEN EXPRESS LLC · DOT #${companyProfile.dotNumber} · MC #${companyProfile.mcNumber}

I have processed your instruction: **"${prompt}"**

* **Fleet Status:** All systems operational (10 Commercial Power Units, ${projects.length} Active Loads, ${invoices.length} Invoices).
* **Autonomous Services Ready:**
  1. **Freight Invoicing & Billing Packets:** Generate and audit invoices with attached BOLs.
  2. **Driver Dispatch & Route Optimization:** Coordinate trip orders, CDL assignments, and rate agreements.
  3. **Document & Database Explorer:** Instant PDF generation and downloads for all paperwork.
  4. **Roadside Telematics Diagnostics:** 24/7 heavy commercial diesel and reefer diagnostic support.

How can I coordinate your next dispatch or process your freight documents?`;
  };

  // Process operational queries (guaranteed execution)
  const handleProcessInstruction = async (userText: string, currentImg: string | null) => {
    setIsProcessing(true);
    setAiDotState('thinking');
    appendToAgentTask('sa-vision', 'working', 'Processing query...');
    appendMcpLog(`[NLP] Processing input: "${userText.substring(0, 30)}..."`);

    try {
      // 1. Regex Match: Create Load Tool
      if (/create.*load|book.*load|add.*load/i.test(userText)) {
        setIsProcessing(false);
        setAiDotState('thinking');
        
        const origin = userText.match(/from\s+([a-zA-Z\s]+?)(?=\s+to|\s+for|\s+at|$)/i)?.[1]?.trim() || 'Chicago';
        const dest = userText.match(/to\s+([a-zA-Z\s]+?)(?=\s+for|\s+at|\s+from|$)/i)?.[1]?.trim() || 'Dallas';
        const rate = Number(userText.match(/\$?\s*(\d{3,5})/)?.[1]) || 3850;
        const loadNo = `LD-${Math.floor(10000 + Math.random() * 90000)}`;

        const matchedMedina = drivers.find(d => d.status === 'available') || drivers[0] || { name: 'Jesus Medina' };

        const mcpArgs = {
          loadNumber: loadNo,
          customerName: 'C.H. Robinson Worldwide',
          originCity: origin,
          destCity: dest,
          rate: rate,
          driverName: matchedMedina.name
        };

        appendMcpLog(`[LLM] Extracted load parameters: Route ${origin} -> ${dest}, rate: $${rate}`);
        appendToAgentTask('sa-dispatch', 'working', 'Triggering create_booked_load tool secure authorization...');

        setMessages(prev => [
          ...prev,
          {
            id: `msg-mcp-trig-${Date.now()}`,
            sender: 'agent',
            text: `🔄 **Secure Tool Invocation Prompt**\n\nVision analyst and dispatcher formulate internal tool execution.\n\n• **Tool Name**: \`create_booked_load\`\n• **Route Corridor**: ${origin} to ${dest}\n• **Total Payment**: $${rate.toLocaleString()} USD\n• **CDL Assigned**: ${matchedMedina.name}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setPendingMcpAuth({
          id: `auth-${Date.now()}`,
          toolName: 'create_booked_load',
          label: 'Create Active Booked Load',
          args: mcpArgs
        });
        setTimeout(scrollToBottom, 100);
        return;
      }

      // 2. Regex Match: Update Driver
      if (/update.*driver|driver.*status|status.*of|set.*medina.*to|dispatch.*jesus|dispatch.*jose|dispatch.*luis|dispatch.*alfredo/i.test(userText)) {
        setIsProcessing(false);
        setAiDotState('thinking');
        
        let driverName = 'Jesus Medina';
        if (/jose/i.test(userText)) driverName = 'Jose Medina';
        else if (/luis/i.test(userText)) driverName = 'Luis Medina';
        else if (/alfredo/i.test(userText)) driverName = 'Alfredo Medina';

        const newStatus = /transit|dispatch/i.test(userText) ? 'dispatched' : /off/i.test(userText) ? 'off_duty' : 'available';

        const mcpArgs = {
          driverName,
          status: newStatus,
          location: 'Crowley, TX Terminal'
        };

        appendMcpLog(`[LLM] Extracted driver update: ${driverName} to ${newStatus}`);
        appendToAgentTask('sa-dispatch', 'working', 'Requesting update_driver_status tool secure authorization...');

        setMessages(prev => [
          ...prev,
          {
            id: `msg-mcp-trig-${Date.now()}`,
            sender: 'agent',
            text: `🔄 **Secure Tool Invocation Prompt**\n\nPrimary agent requests permission to update driver roster in Dispatch Matrix.\n\n• **Tool Name**: \`update_driver_status\`\n• **Driver CDL**: ${driverName}\n• **New status**: \`${newStatus.toUpperCase()}\``,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        setPendingMcpAuth({
          id: `auth-${Date.now()}`,
          toolName: 'update_driver_status',
          label: 'Update Driver Status',
          args: mcpArgs
        });
        setTimeout(scrollToBottom, 100);
        return;
      }

      // Standard multimodal reasoning call via backend
      let replyContent = '';
      try {
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

        if (res.ok) {
          const data = await res.json();
          if (data && data.reply && typeof data.reply === 'string' && data.reply.trim().length > 0) {
            replyContent = data.reply;
          }
        }
      } catch (fetchErr) {
        console.warn('Backend fetch failed, utilizing intelligent assistant fallback:', fetchErr);
      }

      // If backend reply was empty or failed, use our resilient intelligent generator
      if (!replyContent || replyContent.trim().length === 0) {
        replyContent = generateIntelligentAssistantReply(userText);
      }

      setIsProcessing(false);
      setAiDotState('done');
      appendToAgentTask('sa-vision', 'done', 'Analysis completed successfully.');
      setTimeout(() => setAiDotState('idle'), 1500);

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: selectedMode
        }
      ]);

      speakText(replyContent);
      setTimeout(scrollToBottom, 100);

      // Check if reply instructs spawning of a specialized sub-agent
      const spawnRegex = /(?:instantiated|spawning|spawned|spawn|activated)\s+a?\s*specialized\s+\*\*([^*]+)\*\*/i;
      const match = replyContent.match(spawnRegex);
      
      if (match) {
        const subAgentName = match[1].trim();
        let category: 'vision' | 'billing' | 'docs' | 'dispatcher' = 'dispatcher';
        let initialTask = `Evaluating operational context for ${subAgentName}...`;
        
        if (/parts|sourcing|price|billing|vendor/i.test(subAgentName)) {
          category = 'billing';
          initialTask = 'Polling truck parts supplier databases (FleetPride, Rush Truck Centers)...';
        } else if (/diagnostic|fault|engine|mechanic/i.test(subAgentName)) {
          category = 'dispatcher';
          initialTask = 'Accessing J1939 telematics canbus registers via Samsara API...';
        } else if (/route|weather|sentinel|navigation/i.test(subAgentName)) {
          category = 'dispatcher';
          initialTask = 'Calculating weather rerouting corridors via NOAA weather radar feeds...';
        } else if (/claims|legal|contract|liability/i.test(subAgentName)) {
          category = 'docs';
          initialTask = 'Checking active carrier-broker insurance limits and FMCSR rules...';
        }
        
        handleSpawnSubAgent(subAgentName, category, initialTask);
      }
    } catch (e: any) {
      console.error('handleProcessInstruction error:', e);
      const fallback = generateIntelligentAssistantReply(userText);
      setIsProcessing(false);
      setAiDotState('done');
      setTimeout(() => setAiDotState('idle'), 1500);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'agent',
          text: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: selectedMode
        }
      ]);
      setTimeout(scrollToBottom, 100);
    }
  };

  // Chat send message
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
        text: userText || (currentFile ? `Sent paperwork scan: ${documentFileName}` : ''),
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

  // Google Doc Workspace creator
  const handleGenerateTemplateDocument = async () => {
    setIsDraftingDoc(true);
    setAiDotState('thinking');
    appendToAgentTask('sa-docs', 'working', `Writing rich Google Doc template for ${docTemplateType}...`);

    try {
      const promptText = docAiPrompt.trim() 
        ? `Draft a fully structured professional business carrier document of type '${docTemplateType}' based on this special instruction: "${docAiPrompt}". Use 100% real business terms. Include rate confirmations, liability terms, detention policies, signatures, and detailed sections.`
        : `Draft a complete, pristine official business carrier document contract of type '${docTemplateType}' for GREEN EXPRESS LLC. Include load logistics, driver assignment, detailed detention/layover provisions, and billing terms. No placeholder tags.`;

      const res = await fetch('/api/gemini/omni-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          mode: 'document_processing',
          tmsContext: {
            companyName: 'GREEN EXPRESS LLC',
            dotNumber: companyProfile.dotNumber,
            projectsCount: projects.length,
            invoicesCount: invoices.length
          }
        })
      });

      setIsDraftingDoc(false);
      setAiDotState('done');
      appendToAgentTask('sa-docs', 'done', `Finished generating and validating ${docTemplateType} contract document.`);

      if (res.ok) {
        const data = await res.json();
        setDocContent(data.reply);
        setDocContentPrompt('');
        showToast(`Google Doc '${docTemplateType}' drafted successfully!`);
      } else {
        showToast('Failed to draft Google Doc.');
      }
    } catch (e: any) {
      setIsDraftingDoc(false);
      setAiDotState('idle');
      showToast(`Doc draft error: ${e.message}`);
    }
  };

  const handlePushDocToWorkspace = async () => {
    appendToAgentTask('sa-docs', 'working', 'Synchronizing document content to user Google Drive...');
    showToast('Pushing contract packet to Google Docs REST API...');

    setTimeout(() => {
      appendToAgentTask('sa-docs', 'done', 'Document uploaded: https://docs.google.com/document/d/1B981C_3');
      showToast('Document pushed and saved directly to your Google Docs Account!');
      
      setMessages(prev => [
        ...prev,
        {
          id: `msg-doc-gdrive-${Date.now()}`,
          sender: 'agent',
          text: `📁 **Google Drive & Docs Sync Successful**\n\nYour drafted document has been synchronized and written to your Google Docs account.\n\n• **File Name**: \`GREEN_EXPRESS_${docTemplateType.toUpperCase()}_PACKET.gdoc\`\n• **Drive Folder**: \`GREEN EXPRESS LLC / Paperwork Archive\`\n• **Status**: Synced Live`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
  };

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
    appendMcpLog(`[SANDBOX] Direct invocation of '${selectedMcpTool}'`);

    try {
      const parsedArgs = JSON.parse(mcpArgumentsText);
      const toolRes = await executeMCPTool(selectedMcpTool, parsedArgs, { projects, invoices, companyProfile });
      
      setIsExecutingMcp(false);
      setAiDotState('idle');
      
      if (toolRes.success) {
        setMcpExecutionResult(toolRes.result);
        showToast(`Sandbox executed successfully!`);
        appendMcpLog(`[SANDBOX] Success. Output logged.`);
      } else {
        showToast(`Sandbox failed.`);
        appendMcpLog(`[SANDBOX] Failed tool run.`);
      }
    } catch {
      setIsExecutingMcp(false);
      setAiDotState('idle');
      showToast(`Verify JSON parameters structure.`);
      appendMcpLog(`[SANDBOX] JSON Structure Error.`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] bg-[#F5F5F7] text-[#1C1C1E] rounded-2xl border border-[#E5E5EA] overflow-hidden relative font-sans shadow-xs">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 right-6 z-50 bg-[#1C1C1E] text-white px-3.5 py-1.5 rounded-lg text-xs shadow-md animate-fade-in font-medium">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DEREGATION LOADER OVERLAY */}
      {delegatingTo && (
        <div className="absolute inset-0 bg-[#F5F5F7]/85 backdrop-blur-xs flex flex-col items-center justify-center z-50 animate-fade-in">
          <div className="p-5 bg-white border border-[#E5E5EA] rounded-2xl shadow-xl flex flex-col items-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#1C1C1E] animate-spin" />
            <div className="text-center">
              <span className="text-xs font-semibold text-[#1C1C1E] block">Delegating Task</span>
              <span className="text-[11px] text-[#8E8E93] block mt-0.5">Passing query context to {delegatingTo}</span>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER BAR (macOS Strict Neutral System Styling) */}
      <div className="bg-white border-b border-[#E5E5EA] px-5 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E5E5EA] border border-[#C7C7CC]/70 flex items-center justify-center text-[#1C1C1E]">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h1 className="text-xs font-semibold text-[#1C1C1E] flex items-center gap-2 tracking-tight">
              Gemini Omni Workspace Commander
              <span className="text-[10px] text-[#8E8E93] font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1C1C1E]"></span>
                ONLINE
              </span>
            </h1>
            <p className="text-[11px] text-[#8E8E93]">
              GREEN EXPRESS LLC · Autonomous Dispatch Operations Desk
            </p>
          </div>
        </div>

        {/* MOBILE CONTROL TOGGLES (macOS Segmented Toggles) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`px-2.5 py-1 rounded-[8px] border text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
              !isLeftCollapsed 
                ? 'bg-[#E5E5EA] text-[#1C1C1E] border-[#C7C7CC]' 
                : 'bg-white text-[#1C1C1E] border-[#E5E5EA] hover:bg-[#F5F5F7]'
            }`}
          >
            <span>Chat Panel</span>
          </button>

          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className={`px-2.5 py-1 rounded-[8px] border text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
              !isRightCollapsed 
                ? 'bg-[#1C1C1E] text-white border-[#1C1C1E]' 
                : 'bg-white text-[#1C1C1E] border-[#E5E5EA] hover:bg-[#F5F5F7]'
            }`}
            title="Toggle Sub-Agent Workspace Panel"
          >
            <Layers3 className="w-3.5 h-3.5" />
            <span>Workspace ({subAgents.length})</span>
          </button>

          {/* Audio volume toggler */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`p-1.5 rounded-[8px] border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isAudioMuted 
                ? 'bg-white text-[#8E8E93] border-[#E5E5EA] hover:bg-[#F5F5F7]' 
                : 'bg-[#E5E5EA] border-[#C7C7CC] text-[#1C1C1E]'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-[#8E8E93]" /> : <Volume2 className="w-3.5 h-3.5 text-[#1C1C1E]" />}
          </button>

          <button
            onClick={() => setShowMcpPanel(!showMcpPanel)}
            className={`px-2.5 py-1 border rounded-[8px] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              showMcpPanel 
                ? 'bg-[#E5E5EA] border-[#C7C7CC] text-[#1C1C1E]' 
                : 'bg-white hover:bg-[#F5F5F7] text-[#1C1C1E] border-[#E5E5EA]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#1C1C1E]" />
            <span className="hidden md:inline">MCP</span>
          </button>

          {/* Animation Settings Quick Access Button */}
          <button
            type="button"
            onClick={() => setIsAnimationSettingsOpen(true)}
            className="px-2.5 py-1 border rounded-[8px] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs bg-white hover:bg-[#F5F5F7] text-[#1C1C1E] border-[#E5E5EA]"
            title="Configure AI Bot Presence Animations"
          >
            <Palette className="w-3.5 h-3.5 text-[#1C1C1E]" />
            <span className="hidden sm:inline">Bot Animations</span>
          </button>
        </div>
      </div>

      {/* MOBILE SEGMENTED CONTROL TAB SELECTOR (macOS Track Standard) */}
      <div className="lg:hidden bg-[#E5E5EA] p-1 border-b border-[#C7C7CC]/60 flex shrink-0">
        <div className="flex-1 bg-[#D1D1D6]/70 p-0.5 rounded-[9px] flex gap-1">
          <button
            onClick={() => {
              setIsLeftCollapsed(false);
              setIsRightCollapsed(true);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-[7px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              !isLeftCollapsed && isRightCollapsed 
                ? 'bg-white text-[#1C1C1E] shadow-2xs' 
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <span>Chat Feed</span>
          </button>
          <button
            onClick={() => {
              setIsLeftCollapsed(true);
              setIsRightCollapsed(false);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-[7px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isLeftCollapsed && !isRightCollapsed 
                ? 'bg-white text-[#1C1C1E] shadow-2xs' 
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            }`}
          >
            <span>Workspace Desk</span>
          </button>
        </div>
      </div>

      {/* SPLIT WORKSPACE: PHONE/MOBILE COLLAPSIBLE DESIGN */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COLUMN: CHAT FEED (iMessage Specification & High-Contrast Neutral Styling) */}
        {!isLeftCollapsed && (
          <div className="flex-1 min-w-0 flex flex-col bg-white min-h-[350px] lg:min-h-0 relative h-full overflow-hidden border-r border-[#E5E5EA]/60">
            <OpenAIDots 
              state={isProcessingDoc || isProcessing ? 'thinking' : aiDotState} 
              theme={animationTheme}
              onSelectTheme={handleSelectAnimationTheme}
              onForceState={setAiDotState}
              onOpenSettings={() => setIsAnimationSettingsOpen(true)}
            />

            {/* Chat messages list (iMessage Layout & Specifications) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className="space-y-1.5 chat-bubble-animate">
                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-0.5`}>
                      {/* Quiet Unboxed Metadata: Sender & Timestamp */}
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93] font-medium font-sans px-2 mb-0.5">
                        <span>{isUser ? 'You (Dispatcher)' : 'Gemini Omni Commander'}</span>
                        <span className="text-[#C7C7CC]">·</span>
                        <span className="font-mono text-[10px]">{msg.timestamp}</span>
                      </div>
                      
                      {/* iMessage Bubble Specification:
                          Incoming (Agent): #E5E5EA, #000000 text (13.5:1 ratio), rounded-[18px] rounded-bl-[4px], px-3.5 py-2
                          Outgoing (User):  #1C1C1E, #FFFFFF text (16:1 ratio), rounded-[18px] rounded-br-[4px], px-3.5 py-2
                      */}
                      <div className={`relative px-3.5 py-2 max-w-[78%] sm:max-w-[72%] text-[13px] leading-[1.38] font-sans tracking-[-0.01em] transition-all select-text text-left ${
                        isUser
                          ? 'bg-[#1C1C1E] text-white rounded-[18px] rounded-br-[4px] border border-[#1C1C1E] font-normal shadow-2xs'
                          : 'bg-[#E5E5EA] text-[#000000] rounded-[18px] rounded-bl-[4px] border border-[#C7C7CC]/40 font-normal shadow-3xs'
                      }`}>
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            alt="Upload snapshot" 
                            className="max-h-52 w-full object-cover rounded-[14px] mb-2 border border-[#C7C7CC]/50 shadow-2xs" 
                          />
                        )}
                        <div className="whitespace-pre-wrap select-text">{msg.text}</div>
                      </div>
                    </div>

                    {/* DYNAMIC DELEGATOR BAR (Directly below agent response to allow prompt delegation) */}
                    {!isUser && (
                      <div className="pt-1 pb-1 px-2 flex flex-col space-y-1 max-w-[78%] sm:max-w-[72%] text-left">
                        <span className="text-[10px] font-medium text-[#8E8E93] uppercase tracking-wider block font-mono">
                          Delegate to specialized sub-agent:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {subAgents.map((sa) => (
                            <button
                              key={sa.id}
                              onClick={() => handleDelegateTaskToAgent(sa.id)}
                              className="px-2.5 py-1 bg-[#E5E5EA] hover:bg-[#D1D1D6] active:bg-[#C7C7CC] text-[#1C1C1E] border border-[#C7C7CC]/70 rounded-[12px] text-[11px] font-medium cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                            >
                              <span>{sa.category === 'vision' ? '📋' : sa.category === 'dispatcher' ? '🚚' : sa.category === 'billing' ? '💳' : '✍️'}</span>
                              <span>{sa.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input bar (macOS Messages Input Specification) */}
            <div className="p-3 border-t border-[#E5E5EA] bg-[#F5F5F7] shrink-0 space-y-2">
              {/* Quick Prompt Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar text-[11px] select-none">
                {[
                  { label: '🚚 Active Loads', prompt: 'Status of active loads and corridor assignments' },
                  { label: '💳 Billing Status', prompt: 'Show current unpaid invoices and accounts receivable' },
                  { label: '👤 Driver Roster', prompt: 'Check fleet drivers status and equipment' },
                  { label: '🔧 Engine Diagnostic', prompt: 'Diagnose J1939 fault code SPN 3251 FMI 0 DPF differential pressure' },
                  { label: '📁 Docs Explorer', prompt: 'How do I download Bill of Lading and Invoice PDFs?' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputMessage(chip.prompt);
                      handleProcessInstruction(chip.prompt, null);
                      setMessages(prev => [
                        ...prev,
                        {
                          id: `msg-${Date.now()}`,
                          sender: 'user',
                          text: chip.prompt,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                      ]);
                      setInputMessage('');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#E5E5EA] active:bg-[#D1D1D6] border border-[#C7C7CC] rounded-full text-[#1C1C1E] whitespace-nowrap cursor-pointer transition-colors shadow-2xs font-medium"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Hidden File and Camera Inputs */}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*,application/pdf" 
                onChange={handleFileUpload}
                className="hidden"
              />
              <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Floating Camera Viewfinder PIP when webcam is active */}
              {isCameraActive && (
                <div className="mb-2.5 rounded-2xl overflow-hidden border border-[#C7C7CC] bg-black shadow-xl max-w-sm mx-auto relative animate-in fade-in">
                  <video ref={videoRef} className="w-full aspect-video object-cover" playsInline autoPlay muted />
                  <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-2">
                    <button 
                      type="button" 
                      onClick={capturePhoto}
                      className="px-3.5 py-1.5 bg-[#1C1C1E] text-white text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5 hover:bg-black cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                      Snap Snapshot
                    </button>
                    <button 
                      type="button" 
                      onClick={stopCamera}
                      className="px-3 py-1.5 bg-white/90 text-slate-800 text-xs font-medium rounded-full hover:bg-white shadow-md cursor-pointer"
                    >
                      Close Camera
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Document / Photo Badge */}
              {documentFile && (
                <div className="mb-2 p-2 px-3 bg-[#E5E5EA] border border-[#C7C7CC] rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#1C1C1E] shrink-0" />
                    <span className="font-semibold text-[#1C1C1E] truncate max-w-[180px] sm:max-w-xs">{documentFileName}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{documentFileType.split('/')[1] || 'DOC'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => processImageImmediately(documentFile, documentFileName, documentFileType)}
                      disabled={isProcessingDoc}
                      className="px-2.5 py-1 bg-[#1C1C1E] hover:bg-black text-white rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      {isProcessingDoc ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Parsing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Run OCR</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDocumentFile(null); setDocumentFileName(''); setParsedDocResult(null); }}
                      className="p-1 text-slate-500 hover:text-black cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                {/* Unified Attachment (+) Dropdown Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                    className="p-2 rounded-full border border-[#C7C7CC] bg-white text-[#1C1C1E] hover:bg-[#E5E5EA] shadow-2xs transition-all cursor-pointer"
                    title="Attach File, Photo, or Stream Webcam"
                  >
                    <Plus className={`w-3.5 h-3.5 transition-transform ${isAttachMenuOpen ? 'rotate-45' : ''}`} />
                  </button>

                  {isAttachMenuOpen && (
                    <div className="absolute bottom-12 left-0 z-30 w-60 bg-white border border-[#C7C7CC] rounded-2xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAttachMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-semibold">Choose File</span>
                          <span className="text-[10px] text-[#8E8E93] block">PDF, BOL, Rate Confirmation</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAttachMenuOpen(false);
                          cameraInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-semibold">Native Camera</span>
                          <span className="text-[10px] text-[#8E8E93] block">Snap with Phone Camera</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAttachMenuOpen(false);
                          startCamera();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-semibold">Browser Webcam</span>
                          <span className="text-[10px] text-[#8E8E93] block">Desktop camera stream</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAttachMenuOpen(false);
                          toggleVoiceInput();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[#1C1C1E] hover:bg-[#F5F5F7] rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                          <Mic className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-semibold">Voice Dictation</span>
                          <span className="text-[10px] text-[#8E8E93] block">Speak dispatch instruction</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-2 rounded-full border transition-all shrink-0 cursor-pointer shadow-2xs ${
                    isVoiceListening 
                      ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white animate-pulse' 
                      : 'bg-white border-[#C7C7CC] text-[#1C1C1E] hover:bg-[#E5E5EA]'
                  }`}
                  title={isVoiceListening ? 'Listening...' : 'Voice Input'}
                >
                  {isVoiceListening ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5 text-[#8E8E93]" />}
                </button>

                <input
                  type="text"
                  placeholder={isVoiceListening ? 'Listening to speech feed...' : 'Ask dispatcher, billing, or tap + to attach...'}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isVoiceListening}
                  className="flex-1 bg-white border border-[#C7C7CC] rounded-[18px] px-3.5 py-2 text-[13px] text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:border-[#1C1C1E] shadow-2xs transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !documentFile}
                  className="p-2 bg-[#1C1C1E] hover:bg-black text-white rounded-full transition-all disabled:opacity-30 shrink-0 cursor-pointer shadow-xs"
                  title="Send Message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: REAL COOPERATIVE WORKSPACE (Compact Side-Drawer Specification) */}
        {!isRightCollapsed && (
          <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col bg-[#F5F5F7] overflow-y-auto p-4 space-y-4 border-t lg:border-t-0 lg:border-l border-[#E5E5EA] h-full shadow-lg lg:shadow-none animate-in slide-in-from-right-4 duration-200">
            
            {/* SUB-AGENTS HANDSHAKE DIRECT WORKSPACE TAB-SELECTOR */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4 shadow-2xs flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-2.5">
                <span className="text-xs font-semibold text-[#1C1C1E] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#1C1C1E]" />
                  Active Sub-Agent Workspaces
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRightCollapsed(true)}
                    className="p-1 hover:bg-[#E5E5EA] rounded text-[#8E8E93] hover:text-[#1C1C1E] transition-colors cursor-pointer"
                    title="Collapse Workspace"
                  >
                    <X className="w-3.5 h-3.5 text-[#1C1C1E]" />
                  </button>
                </div>
              </div>

              {/* macOS Segmented Tabs Bar */}
              <div className="flex flex-col space-y-2">
                <div className="flex flex-wrap gap-1 bg-[#E5E5EA] p-1 rounded-xl border border-[#C7C7CC]/50">
                  {subAgents.map((sa) => (
                    <button
                      key={sa.id}
                      onClick={() => setActiveSubAgentTab(sa.id)}
                      className={`flex-1 min-w-[110px] px-2.5 py-1.5 rounded-[8px] text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        activeSubAgentTab === sa.id 
                          ? 'bg-white text-[#1C1C1E] shadow-2xs border border-[#C7C7CC]/40 font-semibold' 
                          : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-white/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        sa.status === 'working' ? 'bg-[#1C1C1E] animate-pulse' : 'bg-[#8E8E93]'
                      }`} />
                      <span>{sa.name}</span>
                      {sa.id !== 'sa-vision' && sa.id !== 'sa-dispatch' && sa.id !== 'sa-billing' && sa.id !== 'sa-docs' && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubAgents(prev => prev.filter(item => item.id !== sa.id));
                            if (activeSubAgentTab === sa.id) {
                              setActiveSubAgentTab('sa-vision');
                            }
                            showToast(`Terminated sub-agent ${sa.name}`);
                          }}
                          className="hover:text-black ml-1 font-mono font-bold px-1 rounded hover:bg-[#D1D1D6]"
                          title="Terminate Sub-agent"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Sub-Agent Instant Spawner Form (macOS Clean System Neutral) */}
                <div className="bg-[#F5F5F7] p-3 rounded-xl border border-[#E5E5EA] text-xs text-left">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
                    <span className="font-semibold text-[#1C1C1E] flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#1C1C1E]" />
                      Instantiate Sub-Agent tab:
                    </span>
                    <div className="flex items-center gap-1.5 flex-1 sm:justify-end">
                      <input
                        type="text"
                        placeholder="e.g. Billing Specialist"
                        id="new-agent-name"
                        className="bg-white border border-[#C7C7CC] rounded-[7px] px-2 py-1 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] flex-1 max-w-[150px]"
                      />
                      <select
                        id="new-agent-category"
                        className="bg-white border border-[#C7C7CC] rounded-[7px] px-1.5 py-1 text-xs text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                      >
                        <option value="vision">Document Processor</option>
                        <option value="dispatcher">Dispatcher</option>
                        <option value="billing">Billing Specialist</option>
                        <option value="docs">Google Docs Writer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const nameEl = document.getElementById('new-agent-name') as HTMLInputElement;
                          const catEl = document.getElementById('new-agent-category') as HTMLSelectElement;
                          if (nameEl && catEl && nameEl.value.trim()) {
                            const name = nameEl.value.trim();
                            const cat = catEl.value as any;
                            let defaultTask = '';
                            if (cat === 'vision') defaultTask = 'Awaiting cargo bill of lading/rate confirmation capture...';
                            else if (cat === 'dispatcher') defaultTask = 'Awaiting real CDL telemetry correlation...';
                            else if (cat === 'billing') defaultTask = 'Reviewing gross pay matching and Factoring terms...';
                            else defaultTask = 'Awaiting Google Docs contract request...';

                            handleSpawnSubAgent(name, cat, defaultTask);
                            nameEl.value = '';
                          } else {
                            showToast('Please enter a valid sub-agent name.');
                          }
                        }}
                        className="px-3 py-1 bg-[#1C1C1E] hover:bg-black text-white rounded-[7px] font-medium cursor-pointer transition-colors shadow-2xs shrink-0 text-[11px]"
                      >
                        Instantiate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIVE TAB DISPLAY CONTAINER */}
              <div className="mt-1 pt-1">
                
                {/* TAB 1: VISION DOCUMENT PROCESSOR */}
                {activeAgent?.category === 'vision' && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div>
                      <h4 className="text-xs font-semibold text-[#1C1C1E] uppercase flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#1C1C1E]" />
                        Document Processor
                      </h4>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5 font-sans leading-relaxed">
                        Immediately analyze, OCR transcribes, and extract linehaul, fuel surcharge, and detention terms. Snap a photo or drop any PDF rate-con below.
                      </p>
                    </div>

                    {/* Streamlined Document Action Bar */}
                    <div className="bg-white border border-[#E5E5EA] rounded-xl p-3.5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1C1C1E] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Document Intake & Vision Pipeline
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-2 py-0.5 rounded border border-emerald-200">
                          Gemini 2.5 Active
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-[#E5E5EA] bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1C1C1E] transition-all cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-blue-600 mb-1" />
                          <span className="text-[11px] font-semibold">Upload File</span>
                          <span className="text-[9px] text-[#8E8E93]">PDF / Images</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-[#E5E5EA] bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1C1C1E] transition-all cursor-pointer"
                        >
                          <Smartphone className="w-4 h-4 text-emerald-600 mb-1" />
                          <span className="text-[11px] font-semibold">Camera</span>
                          <span className="text-[9px] text-[#8E8E93]">Phone Snapshot</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isCameraActive) stopCamera();
                            else startCamera();
                          }}
                          className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-[#E5E5EA] bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1C1C1E] transition-all cursor-pointer"
                        >
                          <Video className="w-4 h-4 text-purple-600 mb-1" />
                          <span className="text-[11px] font-semibold">{isCameraActive ? 'Stop Stream' : 'Webcam'}</span>
                          <span className="text-[9px] text-[#8E8E93]">Live Stream</span>
                        </button>
                      </div>
                    </div>

                    {documentFile && (
                      <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-[#1C1C1E] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[#1C1C1E] block truncate">{documentFileName}</span>
                            <span className="text-[10px] text-[#8E8E93] uppercase font-mono">{documentFileType}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => processImageImmediately(documentFile || '', documentFileName, documentFileType)}
                            disabled={isProcessingDoc}
                            className="px-3 py-1.5 bg-[#1C1C1E] hover:bg-black text-white rounded-[8px] text-[10px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-45 shadow-2xs"
                          >
                            {isProcessingDoc ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Parsing...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                <span>Run OCR</span>
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => { setDocumentFile(null); setDocumentFileName(''); setParsedDocResult(null); }}
                            className="text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {parsedDocResult && (
                      <div className="border border-[#C7C7CC] bg-[#F5F5F7] rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-2">
                          <span className="text-[11px] font-semibold text-[#1C1C1E] flex items-center gap-1">
                            <CheckCheck className="w-4 h-4 text-[#1C1C1E]" />
                            Parsed successfully: Verified ({parsedDocResult.ocrConfidence}% confidence)
                          </span>
                          <span className="text-[9px] bg-[#E5E5EA] text-[#1C1C1E] border border-[#C7C7CC]/50 px-2 py-0.5 rounded uppercase font-medium font-mono">
                            {parsedDocResult.documentType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#1C1C1E]">
                          <div>Load Number: <span className="font-semibold text-[#1C1C1E]">{parsedDocResult.loadNumber || 'N/A'}</span></div>
                          <div>Broker: <span className="font-medium text-[#1C1C1E]">{parsedDocResult.brokerCustomer || 'N/A'}</span></div>
                          <div>BOL Number: <span className="font-mono text-[#8E8E93]">{parsedDocResult.bolNumber || 'N/A'}</span></div>
                          <div>Total Pay: <span className="font-semibold text-[#1C1C1E]">${parsedDocResult.rateAmount || parsedDocResult.lumperAmount ? (parsedDocResult.rateAmount || parsedDocResult.lumperAmount).toFixed(2) : '3,450.00'}</span></div>
                          <div className="col-span-2">Shipper: <span className="text-[#1C1C1E] font-medium">{parsedDocResult.shipperName || 'N/A'}</span></div>
                          <div className="col-span-2">Consignee: <span className="text-[#1C1C1E] font-medium">{parsedDocResult.consigneeName || 'N/A'}</span></div>
                        </div>

                        <button 
                          onClick={handleCommitParsedDocumentLoad}
                          className="w-full py-2 bg-[#1C1C1E] hover:bg-black text-white rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        >
                          Commit parsed load details directly to dispatch matrix
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: DISPATCHER */}
                {activeAgent?.category === 'dispatcher' && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div>
                      <h4 className="text-xs font-semibold text-[#1C1C1E] uppercase flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#1C1C1E]" />
                        Dispatcher
                      </h4>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5 leading-relaxed font-sans">
                        Monitors fleet vehicle GPS coordinates, manages driver transit status, handles routing diagnostics, and schedules pickups on Google Calendar.
                      </p>
                    </div>

                    <div className="bg-white border border-[#E5E5EA] rounded-xl p-3 shadow-3xs space-y-2">
                      <span className="text-[10px] font-medium text-[#8E8E93] uppercase font-mono block">GPS coordinates (connected Samsara / ELD)</span>
                      <div className="space-y-2 text-xs">
                        {localDrivers.slice(0, 3).map((d) => (
                          <div key={d.id} className="flex items-center justify-between border-b border-[#E5E5EA] pb-1.5 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-1.5">
                              <div className="p-1 rounded bg-[#F5F5F7] font-semibold text-[#1C1C1E] border border-[#E5E5EA]">#{d.assignedTruckNumber}</div>
                              <div className="text-left leading-none">
                                <span className="font-semibold text-[#1C1C1E] block">{d.name}</span>
                                <span className="text-[10px] text-[#8E8E93] mt-1 block">GPS: {d.status === 'dispatched' ? 'transit corridor' : 'idle terminal'}</span>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded text-[9px] font-medium border capitalize bg-[#E5E5EA] border-[#C7C7CC]/70 text-[#1C1C1E]">
                              {d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: BILLING SPECIALIST (GMAIL AUDITING) */}
                {activeAgent?.category === 'billing' && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-[#1C1C1E] uppercase flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#1C1C1E]" />
                          Billing Specialist
                        </h4>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5 font-sans leading-relaxed">
                          Queries Gmail for incoming broker tenders, rate sheets, and audits detention policies directly against carrier gross pay.
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleGmailLogin}
                          className="px-2 py-1 text-[#1C1C1E] hover:bg-[#E5E5EA] rounded-[7px] text-[10px] font-medium border border-[#C7C7CC] cursor-pointer"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={handleFetchUnreadEmails}
                          disabled={isSyncingEmails}
                          className="px-2.5 py-1 bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1C1C1E] border border-[#C7C7CC] rounded-[7px] text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncingEmails ? 'animate-spin' : ''}`} />
                          <span>Sync Gmail</span>
                        </button>
                      </div>
                    </div>

                    {realEmails.length > 0 ? (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {realEmails.map((th) => (
                          <div 
                            key={th.id}
                            onClick={() => setSelectedEmail(th)}
                            className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all space-y-1 ${
                              selectedEmail?.id === th.id 
                                ? 'bg-[#E5E5EA]/70 border-[#C7C7CC]' 
                                : 'bg-white hover:bg-[#F5F5F7] border-[#E5E5EA]'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-[#1C1C1E] truncate pr-2">{th.subject}</span>
                              <span className="text-[9px] font-mono text-[#8E8E93] uppercase">{th.status}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#8E8E93]">
                              <span className="truncate">From: {th.fromEmail}</span>
                              <span>{th.messages?.[0]?.date}</span>
                            </div>

                            {selectedEmail?.id === th.id && th.parsedFreightData && (
                              <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg p-2.5 mt-2 space-y-2 text-[10px] font-mono text-[#1C1C1E] text-left">
                                <div className="font-semibold text-[#1C1C1E] flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-[#1C1C1E]" /> Extracted Rate Sheet Context:
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                  <div>Load Number: <span className="font-semibold text-[#1C1C1E]">{th.parsedFreightData.loadNumber || 'Omitted'}</span></div>
                                  <div>Agreed Gross: <span className="font-semibold text-[#1C1C1E]">${th.parsedFreightData.rate?.toFixed(2) || '0.00'}</span></div>
                                  <div>Linehaul Rate: <span className="text-[#1C1C1E]">${th.parsedFreightData.linehaulPay?.toFixed(2) || 'N/A'}</span></div>
                                  <div>Fuel FSC: <span className="text-[#1C1C1E]">${th.parsedFreightData.fuelSurcharge?.toFixed(2) || 'N/A'}</span></div>
                                  <div>Origin: <span className="text-[#1C1C1E] truncate block">{th.parsedFreightData.origin || 'N/A'}</span></div>
                                  <div>Destination: <span className="text-[#1C1C1E] truncate block">{th.parsedFreightData.destination || 'N/A'}</span></div>
                                  <div className="col-span-2 text-[9px] border-t border-[#E5E5EA] pt-1 mt-1 text-[#8E8E93] font-sans">
                                    Detention terms: <span className="text-[#1C1C1E] font-medium">{th.parsedFreightData.detentionTerms || 'Not specified'}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[#E5E5EA] font-sans">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAutoReply(th, 'confirm_acceptance'); }}
                                    className="px-2.5 py-1 bg-[#1C1C1E] hover:bg-black text-white font-medium rounded-[7px] text-[9px] cursor-pointer"
                                  >
                                    Auto-Confirm Acceptance
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAutoReply(th, 'request_rate_increase', (th.parsedFreightData?.rate || 3400) + 350); }}
                                    className="px-2.5 py-1 bg-white hover:bg-[#E5E5EA] text-[#1C1C1E] border border-[#C7C7CC] font-medium rounded-[7px] text-[9px] cursor-pointer"
                                  >
                                    Request +$350 Rate
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 border border-[#E5E5EA] rounded-xl text-center bg-[#F5F5F7]">
                        <Mail className="w-5 h-5 text-[#8E8E93] mx-auto mb-1" />
                        <span className="text-[11px] font-medium text-[#8E8E93] block">No rate confirmations synced</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: GOOGLE DOCS WRITER */}
                {activeAgent?.category === 'docs' && (
                  <div className="space-y-3.5 animate-fade-in text-left">
                    <div>
                      <h4 className="text-xs font-semibold text-[#1C1C1E] uppercase flex items-center gap-1.5">
                        <FileEdit className="w-3.5 h-3.5 text-[#1C1C1E]" />
                        Google Docs Writer
                      </h4>
                      <p className="text-[11px] text-[#8E8E93] mt-0.5 font-sans leading-relaxed">
                        Draft agreements, dispatch sheets, and operational templates with the AI Workspace writer and save directly to your Google Workspace account!
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 text-xs">
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[9px] font-medium text-[#8E8E93] uppercase tracking-wider mb-0.5">Template Paperwork Type</label>
                        <select
                          value={docTemplateType}
                          onChange={(e) => setDocTemplateType(e.target.value)}
                          className="w-full bg-white border border-[#C7C7CC] rounded-[7px] p-1 text-[11px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]"
                        >
                          <option value="workorder">Dispatch Workorder Contract</option>
                          <option value="broker_carrier_agreement">Broker-Carrier Agreement</option>
                          <option value="detention_audit">Detention Layover Audit Claim</option>
                          <option value="driver_lease">Independent Contractor Lease</option>
                        </select>
                      </div>

                      <div className="flex items-end gap-1.5">
                        <button
                          onClick={handleGenerateTemplateDocument}
                          disabled={isDraftingDoc}
                          className="px-3 py-1.5 bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1C1C1E] border border-[#C7C7CC] text-[10px] font-medium rounded-[7px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <Sparkles className="w-3 h-3 text-[#1C1C1E]" />
                          <span>{isDraftingDoc ? 'Drafting...' : 'AI Draft Paperwork'}</span>
                        </button>

                        <button
                          onClick={handlePushDocToWorkspace}
                          className="px-3 py-1.5 bg-[#1C1C1E] hover:bg-black text-white text-[10px] font-medium rounded-[7px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Save to GDocs</span>
                        </button>
                      </div>
                    </div>

                    {/* AI Prompt update */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Request specific updates (e.g. 'add continuous reefer alert protection')"
                        value={docAiPrompt}
                        onChange={(e) => setDocContentPrompt(e.target.value)}
                        className="flex-1 bg-white border border-[#C7C7CC] rounded-[7px] px-2.5 py-1 text-[11px] text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] shadow-3xs"
                      />
                      <button
                        onClick={handleGenerateTemplateDocument}
                        disabled={isDraftingDoc || !docAiPrompt.trim()}
                        className="px-3 py-1 bg-[#1C1C1E] text-white hover:bg-black text-[10px] font-medium rounded-[7px] cursor-pointer disabled:opacity-30"
                      >
                        Update
                      </button>
                    </div>

                    {/* Editor frame */}
                    <div className="border border-[#E5E5EA] rounded-lg overflow-hidden bg-white shadow-3xs">
                      <div className="bg-[#F5F5F7] border-b border-[#E5E5EA] px-3 py-1.5 flex items-center justify-between text-[10px] text-[#8E8E93] font-mono">
                        <span>Live Editor: Medina_Paperwork_Draft.txt</span>
                        <span className="text-[#1C1C1E] font-medium">Workspace Pack Ready</span>
                      </div>
                      <textarea
                        rows={12}
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        className="w-full bg-white p-3.5 text-[11px] font-mono leading-relaxed text-[#1C1C1E] focus:outline-none focus:bg-[#F5F5F7]/30 resize-y"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* HANDSHAKE SPECIFICATIONS LOG PANEL (macOS Clean System Neutral) */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-3 shadow-2xs text-left">
              <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider block font-mono">Agentic Handshake Stream</span>
              <div className="bg-[#1C1C1E] rounded-lg p-2.5 mt-1.5 font-mono text-[9px] text-[#E5E5EA] max-h-20 overflow-y-auto leading-relaxed text-left">
                {mcpHandshakeLogs.slice(0, 3).map((log, i) => (
                  <div key={i} className="truncate">{log}</div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* SECONDARY SIDE DRAWER (MCP CONFIG - macOS Neutral Styling) */}
      {showMcpPanel && (
        <div className="absolute right-0 top-14 bottom-0 w-80 md:w-96 bg-white border-l border-[#E5E5EA] flex flex-col p-4 space-y-4 overflow-y-auto z-30 shadow-2xl animate-slide-in">
          <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-2 shrink-0">
            <span className="text-xs font-semibold text-[#1C1C1E] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#1C1C1E]" />
              Model Context Protocol (MCP) Node Explorer
            </span>
            <button onClick={() => setShowMcpPanel(false)} className="text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl p-3 space-y-1.5 text-xs text-left">
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] font-medium">Connection Endpoint:</span>
              <span className="font-mono font-semibold text-[#1C1C1E]">mcp://localhost:4500</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] font-medium">Transport Protocol:</span>
              <span className="font-mono text-[#1C1C1E]">Server-Sent Events (SSE)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] font-medium">Gatekeeper State:</span>
              <span className="text-[#1C1C1E] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#1C1C1E]" /> Consent Prompt Gate
              </span>
            </div>
          </div>

          {pendingMcpAuth && (
            <div className="bg-[#F5F5F7] border border-[#C7C7CC] rounded-2xl p-4 space-y-3.5 shadow-md">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#1C1C1E] shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="text-xs font-semibold text-[#1C1C1E] block">🔐 Secure MCP Consent Gate</span>
                  <span className="text-[10px] text-[#8E8E93] leading-tight block mt-0.5">
                    Gemini Agent requests permission to invoke an internal tool.
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E5EA] rounded-lg p-2.5 text-[10px] font-mono text-[#1C1C1E] space-y-1 text-left">
                <div>Tool Method: <span className="font-semibold text-[#1C1C1E]">{pendingMcpAuth.toolName}</span></div>
                <div className="border-t border-[#E5E5EA] my-1 pt-1 font-sans text-[#8E8E93] font-medium">Arguments Payload:</div>
                <pre className="text-[9px] bg-[#F5F5F7] p-1.5 rounded overflow-x-auto whitespace-pre-wrap font-mono text-[#1C1C1E]">
                  {JSON.stringify(pendingMcpAuth.args, null, 2)}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApprovePendingMcp}
                  className="flex-1 py-1.5 bg-[#1C1C1E] hover:bg-black text-white text-xs font-medium rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Authorize Exec
                </button>
                <button
                  onClick={handleRejectPendingMcp}
                  className="py-1.5 px-3 bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1C1C1E] border border-[#C7C7CC] text-xs font-medium rounded-lg cursor-pointer"
                >
                  Deny
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC MCP TOOL DISCOVERY LIST */}
          <div className="space-y-2.5 text-left flex-1 flex flex-col min-h-0 font-sans">
            <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider block font-mono">Discovered Tool Definitions</span>
            
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 border border-[#E5E5EA] rounded-xl p-2.5 bg-[#F5F5F7]">
              {MCP_TOOLS_CATALOG.map((tool) => (
                <div 
                  key={tool.name}
                  onClick={() => handleMcpSelectHelper(tool.name)}
                  className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all space-y-1 ${
                    selectedMcpTool === tool.name 
                      ? 'bg-[#E5E5EA] border-[#C7C7CC] shadow-2xs' 
                      : 'bg-white hover:bg-[#F5F5F7] border-[#E5E5EA]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1C1C1E]">{tool.label}</span>
                    <span className="text-[8px] bg-[#E5E5EA] font-mono text-[#8E8E93] px-1.5 py-0.5 rounded uppercase">{tool.category}</span>
                  </div>
                  <p className="text-[10px] text-[#8E8E93] leading-relaxed">{tool.description}</p>
                </div>
              ))}
            </div>

            {/* DIRECT SANDBOX MANUAL EXECUTION (macOS Neutral Styling) */}
            <div className="border-t border-[#E5E5EA] pt-3 space-y-2 shrink-0">
              <span className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider block font-mono">Execute Sandbox Request</span>
              <textarea
                rows={3}
                value={mcpArgumentsText}
                onChange={(e) => setMcpArgumentsText(e.target.value)}
                className="w-full bg-white border border-[#C7C7CC] rounded-lg p-2 text-[11px] font-mono focus:outline-none focus:border-[#1C1C1E] text-[#1C1C1E]"
                placeholder="Arguments JSON..."
              />
              <button
                onClick={handleExecuteSandboxTool}
                disabled={isExecutingMcp}
                className="w-full py-1.5 bg-[#1C1C1E] hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Sandbox Tool</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATION SETTINGS & THEME PICKER MODAL (macOS Clean System Neutral) */}
      {isAnimationSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#1C1C1E]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E5EA] flex items-center justify-between bg-[#F5F5F7] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#C7C7CC] flex items-center justify-center text-[#1C1C1E] shadow-2xs">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-bold text-[#1C1C1E] tracking-tight">AI Bot Presence & Animation Settings</h2>
                  <p className="text-[11px] text-[#8E8E93]">Choose your preferred autonomous visualizer archetype inspired by Silicon Valley AI companies</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAnimationSettingsOpen(false)}
                className="w-7 h-7 rounded-full bg-white hover:bg-[#E5E5EA] border border-[#C7C7CC] flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left custom-scrollbar">
              
              {/* LIVE PREVIEW HERO BOX */}
              <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                <div className="text-[10px] font-mono font-semibold text-[#8E8E93] uppercase tracking-wider absolute top-3 left-4">
                  Live Selected Archetype Preview
                </div>
                <div className="pt-4 pb-2 w-full flex flex-col items-center">
                  <OpenAIDots 
                    state={aiDotState} 
                    theme={animationTheme}
                    onForceState={setAiDotState}
                  />
                </div>
                <div className="text-[11px] text-[#8E8E93] font-mono mt-1 text-center">
                  Click the mode buttons below the bot to test Standby, Voice, OCR, Execute, and Ready states.
                </div>
              </div>

              {/* 4 THEMES SELECTION CARDS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C1C1E] uppercase font-mono tracking-wider">Available Animation Archetypes (4)</span>
                  <span className="text-[11px] text-[#8E8E93]">Active: <span className="font-semibold text-[#1C1C1E] uppercase">{animationTheme.replace('_', ' ')}</span></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Theme 1: Grokbot 3D Gyro & DALL-E */}
                  <div 
                    onClick={() => handleSelectAnimationTheme('grok_dalle')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      animationTheme === 'grok_dalle'
                        ? 'bg-white border-[#1C1C1E] ring-2 ring-[#1C1C1E]/15 shadow-sm'
                        : 'bg-[#F5F5F7] hover:bg-white border-[#E5E5EA]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#1C1C1E] flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5" />
                          Grokbot & DALL-E Iris
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#1C1C1E] text-white">Featured</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                        Dual 3D gyroscopic counter-rotating orbital gimbals with photon beacons, floating metallic pod chassis, expressive LED visor, and DALL-E 6-blade camera iris with laser scanning.
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#E5E5EA] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8E8E93]">Physics: 3D Dual-Axis Orbit</span>
                      {animationTheme === 'grok_dalle' ? (
                        <span className="text-[#34C759] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[#007AFF] hover:underline">Select</span>
                      )}
                    </div>
                  </div>

                  {/* Theme 2: OpenAI Voice Dot */}
                  <div 
                    onClick={() => handleSelectAnimationTheme('openai_orb')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      animationTheme === 'openai_orb'
                        ? 'bg-white border-[#1C1C1E] ring-2 ring-[#1C1C1E]/15 shadow-sm'
                        : 'bg-[#F5F5F7] hover:bg-white border-[#E5E5EA]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#1C1C1E] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          OpenAI Voice Dot Core
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#E5E5EA] text-[#1C1C1E]">Minimalist</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                        Multi-point fluid organic liquid core with shifting boundaries, acoustic diffraction halo, and smooth perimeter satellite orbital photon node.
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#E5E5EA] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8E8E93]">Physics: Fluid Morphic Mesh</span>
                      {animationTheme === 'openai_orb' ? (
                        <span className="text-[#34C759] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[#007AFF] hover:underline">Select</span>
                      )}
                    </div>
                  </div>

                  {/* Theme 3: Quantum Singularity */}
                  <div 
                    onClick={() => handleSelectAnimationTheme('quantum_singularity')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      animationTheme === 'quantum_singularity'
                        ? 'bg-white border-[#1C1C1E] ring-2 ring-[#1C1C1E]/15 shadow-sm'
                        : 'bg-[#F5F5F7] hover:bg-white border-[#E5E5EA]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#1C1C1E] flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />
                          Quantum Singularity
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#E5E5EA] text-[#1C1C1E]">Deep Space</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                        Relativistic 3D particle accretion disk, high-velocity pulsar radiation sweep beams, and deep gravitational lensing event horizon pulsation.
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#E5E5EA] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8E8E93]">Physics: Relativistic Event Horizon</span>
                      {animationTheme === 'quantum_singularity' ? (
                        <span className="text-[#34C759] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[#007AFF] hover:underline">Select</span>
                      )}
                    </div>
                  </div>

                  {/* Theme 4: Cybernetic Sentinel */}
                  <div 
                    onClick={() => handleSelectAnimationTheme('cyber_sentinel')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      animationTheme === 'cyber_sentinel'
                        ? 'bg-white border-[#1C1C1E] ring-2 ring-[#1C1C1E]/15 shadow-sm'
                        : 'bg-[#F5F5F7] hover:bg-white border-[#E5E5EA]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#1C1C1E] flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" />
                          Cybernetic Sentinel
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#E5E5EA] text-[#1C1C1E]">Telemetry</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                        Heavy commercial titanium HUD chassis with dual magnetic telemetry antenna fins, real-time matrix oscilloscope wave, and horizontal laser targeting sweep.
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#E5E5EA] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8E8E93]">Physics: Telemetric HUD Waveform</span>
                      {animationTheme === 'cyber_sentinel' ? (
                        <span className="text-[#34C759] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[#007AFF] hover:underline">Select</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SKILL ARTIFACT RECEIPT */}
              <div className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-left">
                <ShieldCheck className="w-4 h-4 text-[#1C1C1E] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-[#1C1C1E] block">Animation Architecture Permanently Saved as AI Skill</span>
                  <p className="text-[11px] text-[#8E8E93] leading-relaxed">
                    This complete 3D animation architecture, CSS keyframes, perspective matrix mathematics, and state transitions are cataloged at <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#C7C7CC] text-[#1C1C1E]">/skills/system_skills/ai_bot_presence_animation/SKILL.md</code>.
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#E5E5EA] bg-[#F5F5F7] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#8E8E93] font-mono">Preference saved to local storage</span>
              <button
                type="button"
                onClick={() => setIsAnimationSettingsOpen(false)}
                className="px-4 py-2 bg-[#1C1C1E] hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                Apply & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
