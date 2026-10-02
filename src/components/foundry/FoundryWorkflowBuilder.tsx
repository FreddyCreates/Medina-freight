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
      case 'trigger': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'ocr_extract': return 'border-purple-200 bg-purple-50 text-purple-800';
      case 'rule_engine': return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'approval_gate': return 'border-indigo-200 bg-indigo-50 text-indigo-800';
      case 'tms_action': return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'notification': return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-6 select-none font-sans">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#007AFF]">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>Alvys Foundry Visual Agent Workflow Builder</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  AGENTIC NO-CODE
                </span>
              </h2>
              <p className="text-[11px] text-gray-500">Assemble triggers, AI reasoning models, business rules, and human gates.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Builder Canvas Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Canvas: Node Sequence */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Execution Pipeline Flow ({nodes.length} Sequential Steps)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddNode('trigger')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-blue-700 rounded text-[11px] font-semibold border border-gray-300 cursor-pointer"
                >
                  + Trigger
                </button>
                <button
                  onClick={() => handleAddNode('ocr_extract')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-purple-700 rounded text-[11px] font-semibold border border-gray-300 cursor-pointer"
                >
                  + AI Vision
                </button>
                <button
                  onClick={() => handleAddNode('rule_engine')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-amber-700 rounded text-[11px] font-semibold border border-gray-300 cursor-pointer"
                >
                  + Rule
                </button>
                <button
                  onClick={() => handleAddNode('approval_gate')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-indigo-700 rounded text-[11px] font-semibold border border-gray-300 cursor-pointer"
                >
                  + Human Gate
                </button>
                <button
                  onClick={() => handleAddNode('tms_action')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-emerald-700 rounded text-[11px] font-semibold border border-gray-300 cursor-pointer"
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
                  className={`p-4 rounded-xl border bg-white shadow-xs relative group ${getNodeColor(node.type)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-gray-100 border border-gray-200 font-mono text-xs font-bold text-gray-800 flex items-center justify-center shrink-0">
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
                            className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none border-b border-transparent focus:border-[#007AFF]"
                          />
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-gray-100 border border-gray-200 text-gray-600">
                            {node.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1">{node.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveNode(node.id)}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
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
          <div className="w-80 border-l border-gray-200 p-5 bg-white space-y-4 overflow-y-auto">
            <div>
              <label className="text-[10px] text-gray-500 uppercase block font-semibold mb-1">
                Agent Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase block font-semibold mb-1">
                AI Reasoning System Prompt
              </label>
              <textarea
                rows={5}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 font-mono leading-relaxed focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-900 block">Human-in-the-Loop</span>
                  <span className="text-[10px] text-gray-500">Requires dispatcher review</span>
                </div>
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="w-4 h-4 text-[#007AFF] bg-white border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>

            {isSaved && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Workflow saved successfully!</span>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
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
