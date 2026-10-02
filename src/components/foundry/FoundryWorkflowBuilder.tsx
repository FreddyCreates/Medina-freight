import React, { useState } from 'react';
import { FoundryAgent, AgentWorkflowNode } from '../../types';
import { 
  Workflow, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Check, 
  Play, 
  Sparkles, 
  X, 
  Sliders, 
  Zap, 
  ShieldCheck, 
  Mail, 
  Radio, 
  Clock, 
  Layers
} from 'lucide-react';

interface FoundryWorkflowBuilderProps {
  agent: FoundryAgent;
  onSaveAgentWorkflow: (updatedAgent: FoundryAgent) => void;
  onClose: () => void;
}

export const FoundryWorkflowBuilder: React.FC<FoundryWorkflowBuilderProps> = ({
  agent,
  onSaveAgentWorkflow,
  onClose,
}) => {
  const [nodes, setNodes] = useState<AgentWorkflowNode[]>(agent.workflowNodes);
  const [agentName, setAgentName] = useState(agent.name);
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [requiresApproval, setRequiresApproval] = useState(agent.requiresHumanApproval);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddNode = (type: AgentWorkflowNode['type']) => {
    const titles: Record<string, string> = {
      trigger: 'New Data Ingest Trigger',
      ocr_extract: 'AI Document / Vision Parser',
      rule_engine: 'Carrier Business Logic & Rules',
      approval_gate: 'Human Dispatcher Approval Gate',
      tms_action: 'Automated TMS Operation',
      notification: 'Customer EDI / Email Notice'
    };

    const newNode: AgentWorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      title: titles[type] || 'Custom Node',
      description: 'Configured automated logic step',
      config: {},
      status: 'active'
    };

    setNodes([...nodes, newNode]);
  };

  const handleRemoveNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleSave = () => {
    const updatedAgent: FoundryAgent = {
      ...agent,
      name: agentName,
      systemPrompt,
      requiresHumanApproval: requiresApproval,
      workflowNodes: nodes,
    };

    onSaveAgentWorkflow(updatedAgent);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const getNodeColor = (type: AgentWorkflowNode['type']) => {
    switch (type) {
      case 'trigger': return 'border-blue-500/50 bg-blue-950/40 text-blue-400';
      case 'ocr_extract': return 'border-purple-500/50 bg-purple-950/40 text-purple-400';
      case 'rule_engine': return 'border-amber-500/50 bg-amber-950/40 text-amber-400';
      case 'approval_gate': return 'border-cyan-500/50 bg-cyan-950/40 text-cyan-400';
      case 'tms_action': return 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400';
      case 'notification': return 'border-orange-500/50 bg-orange-950/40 text-orange-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-6 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Alvys Foundry Visual Agent Workflow Builder</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800 font-mono">
                  AGENTIC NO-CODE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Assemble triggers, AI reasoning models, business rules, and human gates.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Builder Canvas Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Canvas: Node Sequence */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Execution Pipeline Flow ({nodes.length} Sequential Steps)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddNode('trigger')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-blue-400 rounded text-[11px] font-semibold border border-slate-700 cursor-pointer"
                >
                  + Trigger
                </button>
                <button
                  onClick={() => handleAddNode('ocr_extract')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-purple-400 rounded text-[11px] font-semibold border border-slate-700 cursor-pointer"
                >
                  + AI Vision
                </button>
                <button
                  onClick={() => handleAddNode('rule_engine')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-amber-400 rounded text-[11px] font-semibold border border-slate-700 cursor-pointer"
                >
                  + Rule
                </button>
                <button
                  onClick={() => handleAddNode('approval_gate')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-cyan-400 rounded text-[11px] font-semibold border border-slate-700 cursor-pointer"
                >
                  + Human Gate
                </button>
                <button
                  onClick={() => handleAddNode('tms_action')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-emerald-400 rounded text-[11px] font-semibold border border-slate-700 cursor-pointer"
                >
                  + TMS Action
                </button>
              </div>
            </div>

            {/* Nodes Stack */}
            <div className="space-y-3">
              {nodes.map((node, index) => (
                <div
                  key={node.id}
                  className={`p-4 rounded-xl border bg-slate-900/90 shadow-sm relative group ${getNodeColor(node.type)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-white flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={node.title}
                            onChange={(e) => {
                              const updated = [...nodes];
                              updated[index].title = e.target.value;
                              setNodes(updated);
                            }}
                            className="bg-transparent text-xs font-bold text-white focus:outline-none border-b border-transparent focus:border-orange-500"
                          />
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400">
                            {node.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">{node.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveNode(node.id)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      title="Delete Node"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Agent Configuration Form */}
          <div className="w-80 border-l border-slate-800 p-5 bg-slate-900 space-y-4 overflow-y-auto">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block font-semibold mb-1">
                Agent Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase block font-semibold mb-1">
                AI Reasoning System Prompt
              </label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Human-in-the-Loop</span>
                  <span className="text-[10px] text-slate-400">Requires dispatcher review</span>
                </div>
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="w-4 h-4 text-orange-600 bg-slate-900 border-slate-700 rounded cursor-pointer"
                />
              </div>
            </div>

            {isSaved && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-lg text-xs flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4" />
                <span>Workflow saved successfully!</span>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Deploy Workflow
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
