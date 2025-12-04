import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calculator, Users, FileText, Settings, Save, Download, 
  Plus, Trash2, ChevronRight, CheckCircle, Database, LayoutDashboard,
  Mic, MessageSquare, Mail, Server, Cpu, Activity, Zap, BrainCircuit, Edit2, Globe, Boxes, Info, X, HelpCircle, Calendar, Link as LinkIcon, Layers
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, getDocs, doc, setDoc, query, orderBy, onSnapshot 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- FIREBASE SETUP ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "", 
  authDomain: "",
  projectId: "",
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase not initialized. App will run in demo mode.");
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- CONSTANTS & DEFAULTS ---
const BEDROCK_MODELS = {
  'haiku': { label: 'Claude 3 Haiku (Fast)', input: 0.00025, output: 0.00125 },
  'sonnet': { label: 'Claude 3.5 Sonnet (Balanced)', input: 0.003, output: 0.015 },
  'opus': { label: 'Claude 3 Opus (Powerful)', input: 0.015, output: 0.075 }
};

// Regional Pricing Configuration
const REGIONAL_PRICING = {
  'US': {
    currency: '$',
    voice_per_min: 0.018, 
    telephony_per_min: 0.0022, 
    chat_per_msg: 0.004,
    email_per_msg: 0.004,
    translate_voice_min: 0.015, 
    translate_chat_unit: 0.00006, 
    lex_speech_turn: 0.004, 
    lex_text_turn: 0.00075, 
    agent_assist_voice_min: 0.012,
    agent_assist_chat_msg: 0.003,
    contact_lens_voice_min: 0.015,
    contact_lens_chat_msg: 0.0015,
    storage_per_gb: 0.023
  },
  'UK': {
    currency: '£', // Display symbol (logic remains in decimals)
    voice_per_min: 0.022, 
    telephony_per_min: 0.0035, 
    chat_per_msg: 0.005,
    email_per_msg: 0.005,
    translate_voice_min: 0.018, 
    translate_chat_unit: 0.00008, 
    lex_speech_turn: 0.005, 
    lex_text_turn: 0.0009, 
    agent_assist_voice_min: 0.014,
    agent_assist_chat_msg: 0.004,
    contact_lens_voice_min: 0.018,
    contact_lens_chat_msg: 0.0018,
    storage_per_gb: 0.025
  }
};

const FEATURES_CATALOG = {
  telephony: { label: 'Telephony Included', channels: ['Voice'], icon: Zap },
  translate: { label: 'Real-time Translation', channels: ['Voice', 'Chat'], icon: Globe },
  convIVR: { label: 'Conversational IVR (Lex)', channels: ['Voice'], icon: Cpu },
  chatbot: { label: 'Chatbot Automation', channels: ['Chat'], icon: Cpu },
  emailMgmt: { label: 'Email Management (Routing)', channels: ['Email'], icon: Mail },
  contactLens: { label: 'Contact Lens (Analytics)', channels: ['Voice', 'Chat'], icon: Activity },
  agentAssist: { label: 'Agent Assist (Q/Wisdom)', channels: ['Voice', 'Chat'], icon: BrainCircuit },
  bedrock: { label: 'Agentic Framework (Bedrock)', channels: ['Voice', 'Chat', 'Email'], icon: Server },
  storage: { label: 'Recording / Archiving', channels: ['Voice', 'Chat', 'Email'], icon: Database },
};

const DEFAULT_ROLES = [
  { id: 'imp_pm', label: 'Implementation PM', monthlyRate: 3760 },
  { id: 'cx_dev', label: 'CX Developer', monthlyRate: 4001 },
  { id: 'cx_sr_dev', label: 'CX Senior Developer', monthlyRate: 5206 },
  { id: 'cx_plat', label: 'CX Platform Specialist', monthlyRate: 3760 },
  { id: 'cx_consult', label: 'CX Consultant', monthlyRate: 5447 },
  { id: 'cx_analyst', label: 'CX Data Analyst', monthlyRate: 3760 },
  { id: 'cx_design', label: 'CX Designer', monthlyRate: 3760 },
  { id: 'cx_arch', label: 'CX Solution Architect', monthlyRate: 5447 },
];

const PHASES = ['Discovery', 'Design', 'Build', 'Testing', 'Deployment', 'Hypercare'];

const PHASE_COLORS = {
  'Discovery': 'bg-purple-500',
  'Design': 'bg-blue-500',
  'Build': 'bg-emerald-500',
  'Testing': 'bg-amber-500',
  'Deployment': 'bg-orange-500',
  'Hypercare': 'bg-slate-500'
};

const PHASE_BG_COLORS = {
  'Discovery': 'bg-purple-100 text-purple-700',
  'Design': 'bg-blue-100 text-blue-700',
  'Build': 'bg-emerald-100 text-emerald-700',
  'Testing': 'bg-amber-100 text-amber-700',
  'Deployment': 'bg-orange-100 text-orange-700',
  'Hypercare': 'bg-slate-100 text-slate-700'
};

const RATE_BANDS = {
  'Low': 0.9,
  'Medium': 1.0,
  'High': 1.15
};

// --- COMPONENTS ---

const Sidebar = ({ activeTab, setActiveTab }) => (
  <div className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 z-50">
    <div className="p-4 flex items-center gap-3 border-b border-slate-700">
      <div className="bg-blue-500 p-2 rounded-lg">
        <Calculator size={24} className="text-white" />
      </div>
      {/* CHANGED: Updated App Name */}
      <span className="font-bold text-lg hidden lg:block">DECX Cost Calculator</span>
    </div>
    <nav className="flex-1 py-6 space-y-2 px-2">
      {[
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'calculator', icon: Plus, label: 'New Estimator' },
        { id: 'knowledge', icon: Database, label: 'Knowledge Base' },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
            activeTab === item.id 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <item.icon size={20} />
          <span className="hidden lg:block font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  </div>
);

const KnowledgeBase = ({ pricing }) => (
  <div className="p-8 max-w-7xl mx-auto">
    <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
      <Database className="text-blue-600" />
      AWS Pricing Knowledge Base
    </h2>
    <div className="grid gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Service Component</th>
              <th className="p-4 font-semibold text-slate-700">Metric</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Unit Cost ({pricing.currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(pricing).filter(([key]) => key !== 'currency').map(([key, val]) => (
              <tr key={key} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800 capitalize">{key.replace(/_/g, ' ')}</td>
                <td className="p-4 text-slate-500 text-sm">Per Unit</td>
                <td className="p-4 text-right font-mono text-blue-600 font-bold">{pricing.currency}{val}</td>
              </tr>
            ))}
            {Object.entries(BEDROCK_MODELS).map(([key, model]) => (
              <tr key={key} className="hover:bg-slate-50 bg-amber-50/30">
                <td className="p-4 font-medium text-slate-800">{model.label}</td>
                <td className="p-4 text-slate-500 text-sm">Per 1k Tokens (In/Out)</td>
                <td className="p-4 text-right font-mono text-amber-700 font-bold">
                  ${model.input} / ${model.output}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const CostBreakdownModal = ({ isOpen, onClose, channels, pricing, calculations }) => {
  if (!isOpen) return null;

  const curr = pricing.currency || '$';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600"/> Cost DNA
            </h3>
            <p className="text-sm text-slate-500">Unit-level calculation transparency</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-6">
          {channels.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No channels to calculate yet.</p>
          ) : channels.map((ch, idx) => {
            const liveVol = ch.volume * ((100 - ch.containment) / 100);
            const containedVol = ch.volume - liveVol;
            const modelPricing = BEDROCK_MODELS[ch.bedrockModel || 'sonnet'];
            
            return (
              <div key={ch.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">{idx + 1}</span>
                    {ch.name} <span className="text-xs font-normal text-slate-400">({ch.type})</span>
                  </h4>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                    Vol: {ch.volume.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-3 text-sm text-slate-600 font-mono">
                  
                  {/* --- VOICE CALCULATIONS --- */}
                  {ch.type === 'Voice' && (
                    <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                      <span>• Voice Svc: {ch.volume.toLocaleString()} calls × {ch.aht} min</span>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 mr-2">@ {curr}{pricing.voice_per_min}/min</span>
                        <span>{curr}{(ch.volume * ch.aht * pricing.voice_per_min).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* --- CHAT CALCULATIONS (FIXED) --- */}
                  {ch.type === 'Chat' && (
                    <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                      <span>• Chat Svc: {liveVol.toLocaleString()} live × 15 msgs</span>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 mr-2">@ {curr}{pricing.chat_per_msg}/msg</span>
                        <span>{curr}{(liveVol * 15 * pricing.chat_per_msg).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* --- TRANSLATION --- */}
                  {ch.features.includes('translate') && (
                    <div className="flex justify-between items-baseline text-indigo-600 border-b border-indigo-50 pb-2">
                      {ch.type === 'Voice' ? (
                        <>
                          <span>• Translate: {liveVol.toLocaleString()} calls × {ch.aht} min</span>
                          <div className="text-right">
                            <span className="text-xs text-indigo-300 mr-2">@ {curr}{pricing.translate_voice_min}/min</span>
                            <span>{curr}{(liveVol * ch.aht * pricing.translate_voice_min).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span>• Translate: {liveVol.toLocaleString()} live × 15 msgs × 1.5 units</span>
                          <div className="text-right">
                            <span className="text-xs text-indigo-300 mr-2">@ {curr}{pricing.translate_chat_unit}/unit</span>
                            <span>{curr}{(liveVol * 15 * 1.5 * pricing.translate_chat_unit).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* --- TELEPHONY --- */}
                  {ch.features.includes('telephony') && (
                    <div className="flex justify-between items-baseline text-blue-600 border-b border-blue-50 pb-2">
                      <span>• Telephony: {liveVol.toLocaleString()} live calls × {ch.aht} min</span>
                      <div className="text-right">
                        <span className="text-xs text-blue-300 mr-2">@ {curr}{pricing.telephony_per_min}/min</span>
                        <span>{curr}{(liveVol * ch.aht * pricing.telephony_per_min).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* --- EMAIL --- */}
                  {ch.features.includes('emailMgmt') && (
                    <div className="flex justify-between items-baseline text-blue-600 border-b border-blue-50 pb-2">
                      <span>• Standard Routing: {ch.volume.toLocaleString()} msgs (In+Out)</span>
                      <div className="text-right">
                        <span className="text-xs text-blue-300 mr-2">@ {curr}{pricing.email_per_msg} x 2</span>
                        <span>{curr}{(ch.volume * pricing.email_per_msg * 2).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* --- LEX BOT --- */}
                  {(ch.features.includes('convIVR') || ch.features.includes('chatbot')) && (
                    <div className="flex justify-between items-baseline text-indigo-600 border-b border-indigo-50 pb-2">
                      <span>• Lex IVR: {ch.volume.toLocaleString()} sess × {ch.lexTurns} turns</span>
                      <div className="text-right">
                        <span className="text-xs text-indigo-300 mr-2">@ {curr}{ch.type === 'Voice' ? pricing.lex_speech_turn : pricing.lex_text_turn}/turn</span>
                        <span>{curr}{(ch.volume * ch.lexTurns * (ch.type === 'Voice' ? pricing.lex_speech_turn : pricing.lex_text_turn)).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* --- BEDROCK --- */}
                  {ch.features.includes('bedrock') && (
                    <div className="flex flex-col bg-amber-50 p-2 rounded text-amber-800">
                       <div className="flex justify-between text-xs font-bold mb-1">
                         <span>• Bedrock ({modelPricing.label})</span>
                       </div>
                       <div className="flex justify-between text-xs pl-2">
                         <span>In: {ch.volume.toLocaleString()} × {ch.lexTurns || 1} turns × {(ch.contextChars + (ch.systemComplexity * 1000))/4} tokens</span>
                         <span>@ ${modelPricing.input}/1k</span>
                       </div>
                       <div className="flex justify-between text-xs pl-2 border-b border-amber-200 pb-1 mb-1">
                         <span>Out: Est 20% of input</span>
                         <span>@ ${modelPricing.output}/1k</span>
                       </div>
                        <div className="flex justify-between font-bold">
                          <span>Total GenAI Cost</span>
                          <span>${(
                            (ch.volume * (ch.lexTurns || 1) * ((ch.contextChars + (ch.systemComplexity * 1000))/4/1000) * modelPricing.input) + 
                            (ch.volume * (ch.lexTurns || 1) * ((ch.contextChars + (ch.systemComplexity * 1000))/4/1000 * 0.2) * modelPricing.output) 
                          ).toFixed(2)}</span>
                        </div>
                    </div>
                  )}

                  {/* --- AGENT ASSIST --- */}
                  {ch.features.includes('agentAssist') && (
                    <div className="flex justify-between items-baseline text-purple-600">
                       <span>• Agent Assist: {liveVol.toLocaleString()} live × {ch.type === 'Voice' ? `${ch.aht}m` : '15 msgs'}</span>
                       <div className="text-right">
                         <span className="text-xs text-purple-300 mr-2">@ {curr}{ch.type === 'Voice' ? pricing.agent_assist_voice_min : pricing.agent_assist_chat_msg}/unit</span>
                         <span>{curr}{(liveVol * (ch.type === 'Voice' ? ch.aht : 15) * (ch.type === 'Voice' ? pricing.agent_assist_voice_min : pricing.agent_assist_chat_msg)).toFixed(2)}</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <div className="flex justify-between items-center text-lg font-bold text-slate-800">
            <span>Total Monthly Run Rate</span>
            <span>{curr}{calculations.totalTechMonthly.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImplementationGantt = ({ resources, channels }) => {
  const [viewMode, setViewMode] = useState('resource'); // 'resource' or 'channel'

  const maxWeeks = useMemo(() => {
    if (!resources || resources.length === 0) return 12;
    return Math.max(...resources.map(r => (r.startWeek || 1) + (r.weeks || 4)), 12);
  }, [resources]);

  const months = Math.ceil(maxWeeks / 4);

  // Group resources by Channel for Channel View
  const resourcesByChannel = useMemo(() => {
    if (!resources || resources.length === 0) return {};
    const grouped = {};
    // Initialize with all available channels
    channels.forEach(ch => { grouped[`${ch.type} (${ch.name})`] = []; });
    // Add resources
    resources.forEach(res => {
      let chName = 'All Channels';
      if (res.channelId !== 'All') {
        const found = channels.find(c => c.id === res.channelId);
        if (found) chName = `${found.type} (${found.name})`;
      }
      
      if (!grouped[chName]) grouped[chName] = [];
      grouped[chName].push(res);
    });
    return grouped;
  }, [resources, channels]);

  if (!resources || resources.length === 0) return null;

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h4 className="font-bold text-slate-700 flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" /> Implementation Timeline
        </h4>
        <div className="flex bg-slate-200 rounded-lg p-1">
          <button 
            onClick={() => setViewMode('resource')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'resource' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            By Resource
          </button>
          <button 
            onClick={() => setViewMode('channel')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'channel' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            By Channel
          </button>
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header Row: Months */}
          <div className="flex mb-2">
            <div className="w-56 shrink-0 font-semibold text-xs text-slate-500 uppercase tracking-wide">
              {viewMode === 'resource' ? 'Resource' : 'Channel'}
            </div>
            <div className="flex-1 flex">
              {Array.from({ length: months }).map((_, m) => (
                <div key={m} className="flex-1 border-l border-slate-200 text-center text-xs font-bold text-slate-400 py-1 bg-slate-50">
                  Month {m + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 relative">
            {/* Grid Lines Overlay */}
            <div className="absolute inset-0 flex pointer-events-none pl-56">
               {Array.from({ length: months * 4 }).map((_, w) => (
                 <div key={w} className="flex-1 border-l border-slate-100 h-full"></div>
               ))}
            </div>

            {viewMode === 'resource' ? (
              // RESOURCE VIEW
              resources.map((res) => {
                const role = DEFAULT_ROLES.find(r => r.id === res.roleId);
                const startPct = ((res.startWeek - 1) / maxWeeks) * 100;
                const widthPct = (res.weeks / maxWeeks) * 100;
                const barColor = PHASE_COLORS[res.phase] || 'bg-blue-500';
                
                let channelDisplay = 'All Channels';
                if (res.channelId !== 'All') {
                   const found = channels.find(c => c.id === res.channelId);
                   if (found) channelDisplay = `${found.type} (${found.name})`;
                }

                return (
                  <div key={res.id} className="flex items-center relative z-10 group">
                    <div className="w-56 shrink-0 pr-4">
                      <div className="text-sm font-medium text-slate-700 truncate">{role?.label || 'Resource'}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className={`w-2 h-2 rounded-full ${barColor}`}></span>
                        {res.phase} • {channelDisplay}
                      </div>
                    </div>
                    <div className="flex-1 h-8 bg-slate-50 rounded-full relative overflow-hidden">
                      <div 
                        className={`absolute top-1 bottom-1 ${barColor} rounded-full shadow-sm flex items-center px-2 text-white text-[10px] font-bold overflow-hidden`}
                        style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                      >
                        {res.weeks}w
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // CHANNEL VIEW
              Object.entries(resourcesByChannel).map(([chName, chResources]) => {
                // Render even if empty to show the channel exists
                return (
                  <div key={chName} className="flex items-center relative z-10 min-h-[40px] border-b border-slate-50 last:border-0 py-2">
                    <div className="w-56 shrink-0 pr-4">
                      <div className="text-sm font-medium text-slate-700 truncate">{chName}</div>
                      <div className="text-[10px] text-slate-400">{chResources.length} resources</div>
                    </div>
                    <div className="flex-1 relative h-8">
                      {chResources.map((res, i) => {
                        const startPct = ((res.startWeek - 1) / maxWeeks) * 100;
                        const widthPct = (res.weeks / maxWeeks) * 100;
                        const barColor = PHASE_COLORS[res.phase] || 'bg-blue-500';
                        return (
                          <div 
                            key={res.id}
                            className={`absolute top-1 bottom-1 ${barColor} rounded-md shadow-sm border border-white opacity-90 hover:opacity-100 hover:z-20 transition-all`}
                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                            title={`${res.phase}: ${res.weeks} weeks`}
                          ></div>
                        )
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="flex mt-6 ml-56 text-[10px] text-slate-400 gap-4">
             {PHASES.map(p => (
               <div key={p} className="flex items-center gap-1">
                 <div className={`w-3 h-3 rounded-sm ${PHASE_COLORS[p]}`}></div>
                 <span>{p}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EstimatorWizard = ({ user, pricing }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false); 
  
  const [client, setClient] = useState({ name: '', contact: '', teamMember: '', techStack: 'aws', region: 'US' });
  const [channels, setChannels] = useState([]);
  
  // Clean slate default
  const [resources, setResources] = useState([]);

  // Rate Band State
  const [rateBand, setRateBand] = useState('Medium');

  // --- CALCULATIONS ENGINE ---
  const calculations = useMemo(() => {
    let totalVoiceCost = 0;
    let totalDigitalCost = 0;
    let totalAiCost = 0;
    let totalInfraCost = 0;

    channels.forEach(ch => {
      // (Tech calc logic same as before...)
      const containedVol = ch.volume * (ch.containment / 100);
      const liveVol = ch.volume - containedVol;
      const modelPricing = BEDROCK_MODELS[ch.bedrockModel || 'sonnet'];
      const hasTelephony = ch.features.includes('telephony');
      const hasTranslate = ch.features.includes('translate');
      const hasContactLens = ch.features.includes('contactLens');
      const hasAgentAssist = ch.features.includes('agentAssist');
      const hasBot = ch.features.includes('convIVR') || ch.features.includes('chatbot');
      const hasBedrock = ch.features.includes('bedrock');
      const hasStorage = ch.features.includes('storage');

      if (ch.type === 'Voice') {
        const baseRate = pricing.voice_per_min + (hasTelephony ? pricing.telephony_per_min : 0);
        const analyticsRate = hasContactLens ? pricing.contact_lens_voice_min : 0;
        const translateRate = hasTranslate ? pricing.translate_voice_min : 0;
        const assistRate = hasAgentAssist ? pricing.agent_assist_voice_min : 0;
        
        // Base logic
        totalVoiceCost += liveVol * ch.aht * (baseRate + analyticsRate + assistRate + translateRate);
        
        if (hasBot) {
           // Bot consumes carriage (base) + translate if active
           const botCarriage = pricing.voice_per_min + (hasTelephony ? pricing.telephony_per_min : 0) + (hasTranslate ? pricing.translate_voice_min : 0);
           totalVoiceCost += containedVol * 2.0 * botCarriage; 
           totalAiCost += ch.volume * ch.lexTurns * pricing.lex_speech_turn;
        }
        if (hasBedrock) {
          const inputTokens = (ch.contextChars + (ch.systemComplexity * 1000)) / 4;
          const outputTokens = inputTokens * 0.2; 
          const costPerTurn = (inputTokens/1000 * modelPricing.input) + (outputTokens/1000 * modelPricing.output);
          totalAiCost += ch.volume * ch.lexTurns * costPerTurn;
        }
        if (hasStorage) totalInfraCost += (ch.volume * ch.aht * 0.001) * pricing.storage_per_gb;

      } else if (ch.type === 'Chat') {
        const msgsPerSession = 15; 
        const baseRate = pricing.chat_per_msg;
        const analyticsRate = hasContactLens ? pricing.contact_lens_chat_msg : 0;
        const assistRate = hasAgentAssist ? pricing.agent_assist_chat_msg : 0;
        const translateRate = hasTranslate ? (1.5 * pricing.translate_chat_unit) : 0; 

        totalDigitalCost += liveVol * msgsPerSession * (baseRate + analyticsRate + assistRate + translateRate);
        
        if (hasBot) totalAiCost += ch.volume * ch.lexTurns * pricing.lex_text_turn;
        if (hasBedrock) {
          const inputTokens = (ch.contextChars + (ch.systemComplexity * 1000)) / 4;
          const outputTokens = inputTokens * 0.2;
          const costPerTurn = (inputTokens/1000 * modelPricing.input) + (outputTokens/1000 * modelPricing.output);
          totalAiCost += ch.volume * ch.lexTurns * costPerTurn;
        }
        if (hasStorage) totalInfraCost += (ch.volume * 0.0005) * pricing.storage_per_gb;

      } else if (ch.type === 'Email') {
        totalDigitalCost += ch.volume * pricing.email_per_msg * 2; 
        if (hasBedrock) {
           const tokensPerEmail = (ch.contextChars * 2) / 4; 
           totalAiCost += ch.volume * (tokensPerEmail/1000 * modelPricing.input + (tokensPerEmail*0.5/1000 * modelPricing.output));
        }
      }
    });

    const totalTechMonthly = totalVoiceCost + totalDigitalCost + totalAiCost + totalInfraCost;

    const rateMultiplier = RATE_BANDS[rateBand] || 1.0;
    const implCost = resources.reduce((acc, r) => {
      const role = DEFAULT_ROLES.find(role => role.id === r.roleId);
      if (!role) return acc;
      const baseMonthly = role.monthlyRate * rateMultiplier;
      const weeklyRate = baseMonthly / 4;
      return acc + (weeklyRate * r.weeks * (r.quantity || 1));
    }, 0);

    return {
      voiceCost: totalVoiceCost,
      digitalCost: totalDigitalCost,
      aiCost: totalAiCost,
      infraCost: totalInfraCost,
      totalTechMonthly,
      implCost,
      oneYearTCO: (totalTechMonthly * 12) + implCost
    };
  }, [channels, pricing, resources, rateBand]);

  // --- HANDLERS ---
  const addChannel = (type) => {
    const newId = Date.now().toString();
    const defaults = {
      Voice: { name: 'Voice', type: 'Voice', volume: 10000, aht: 5, containment: 10, lexTurns: 5, systemComplexity: 1, contextChars: 5000, bedrockModel: 'sonnet', features: [] },
      Chat: { name: 'Chat', type: 'Chat', volume: 5000, aht: 0, containment: 20, lexTurns: 8, systemComplexity: 1, contextChars: 5000, bedrockModel: 'sonnet', features: [] },
      Email: { name: 'Email', type: 'Email', volume: 2000, aht: 0, containment: 0, lexTurns: 0, systemComplexity: 0, contextChars: 10000, bedrockModel: 'sonnet', features: ['emailMgmt'] }
    };
    setChannels([...channels, { id: newId, ...defaults[type] }]);
  };

  const updateChannel = (id, field, value) => {
    setChannels(channels.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const toggleFeature = (channelId, featureKey) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    const newFeatures = channel.features.includes(featureKey)
      ? channel.features.filter(f => f !== featureKey)
      : [...channel.features, featureKey];
    updateChannel(channelId, 'features', newFeatures);
  };

  const removeChannel = (id) => {
    setChannels(channels.filter(c => c.id !== id));
  };

  const addResource = () => {
    setResources([...resources, { id: Date.now(), roleId: 'cx_dev', channelId: 'All', phase: 'Build', startWeek: 1, weeks: 4, quantity: 1 }]);
  };

  const removeResource = (id) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const updateResource = (id, field, value) => {
    setResources(resources.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const saveDeal = async () => {
    if (!user || !db) {
      alert("Demo Mode: Cannot save to database. (Firebase not configured)");
      return;
    }
    setLoading(true);
    try {
      const dealData = { client, channels, resources, rateBand, financials: calculations, createdAt: new Date(), createdBy: user.uid };
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'deals'), dealData);
      alert('Deal logged successfully!');
    } catch (error) {
      console.error("Error saving deal", error);
      alert('Failed to save deal.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    let csv = "Client,Metric,Value\n";
    csv += `${client.name},Total Monthly,$${calculations.totalTechMonthly.toFixed(2)}\n`;
    csv += `${client.name},Implementation,$${calculations.implCost.toFixed(2)}\n`;
    csv += `\nIMPLEMENTATION PLAN (Band: ${rateBand})\nRole,Channel,Phase,Weeks,Qty\n`;
    resources.forEach(r => {
       const role = DEFAULT_ROLES.find(dr => dr.id === r.roleId);
       const ch = channels.find(c => c.id === r.channelId);
       csv += `${role?.label},${ch?.name || 'All'},${r.phase},${r.weeks},${r.quantity}\n`;
    });
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quote_${client.name}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // --- RENDER STEPS ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-bold text-slate-800">Client Intake</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
          <input 
            type="text" 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., Acme Corp"
            value={client.name}
            onChange={(e) => setClient({...client, name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lead Contact</label>
          <input 
            type="text" 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., John Doe (CTO)"
            value={client.contact}
            onChange={(e) => setClient({...client, contact: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prepared By (Team Member)</label>
          <input 
            type="text" 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., Jane Smith"
            value={client.teamMember}
            onChange={(e) => setClient({...client, teamMember: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tech Stack</label>
          <select 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            value={client.techStack}
            onChange={(e) => setClient({...client, techStack: e.target.value})}
          >
            <option value="aws">Amazon Connect (AWS)</option>
            <option value="yellow">Yellow.ai (Coming Soon)</option>
            <option value="kore">Kore.ai (Coming Soon)</option>
          </select>
        </div>
        {client.techStack === 'aws' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <select 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={client.region}
              onChange={(e) => setClient({...client, region: e.target.value})}
            >
              <option value="US">United States (USD)</option>
              <option value="UK">United Kingdom (GBP)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-fadeIn">
      <CostBreakdownModal 
        isOpen={showBreakdown} 
        onClose={() => setShowBreakdown(false)}
        channels={channels}
        pricing={pricing}
        calculations={calculations}
      />
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Tech Inputs & Channels</h3>
        <div className="flex gap-2">
          <button onClick={() => addChannel('Voice')} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
            <Mic size={16}/> Add Voice
          </button>
          <button onClick={() => addChannel('Chat')} className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100">
            <MessageSquare size={16}/> Add Chat
          </button>
          <button onClick={() => addChannel('Email')} className="flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-100">
            <Mail size={16}/> Add Email
          </button>
        </div>
      </div>
      <div className="space-y-6">
        {/* ... (Existing Step 2 Channel Cards Logic remains unchanged) ... */}
        {channels.map((ch, index) => (
          <div key={ch.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className={`p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between ${ch.type === 'Voice' ? 'bg-blue-50' : ch.type === 'Chat' ? 'bg-green-50' : 'bg-purple-50'}`}>
              <div className="flex items-center gap-3 flex-1">
                {ch.type === 'Voice' && <div className="p-2 bg-blue-200 rounded-full text-blue-700"><Mic size={18}/></div>}
                {ch.type === 'Chat' && <div className="p-2 bg-green-200 rounded-full text-green-700"><MessageSquare size={18}/></div>}
                {ch.type === 'Email' && <div className="p-2 bg-purple-200 rounded-full text-purple-700"><Mail size={18}/></div>}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      className="bg-transparent font-bold text-slate-800 text-lg border-b border-transparent hover:border-slate-400 focus:border-blue-500 outline-none px-1"
                      value={ch.name}
                      onChange={(e) => updateChannel(ch.id, 'name', e.target.value)}
                    />
                    <Edit2 size={14} className="text-slate-400"/>
                  </div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider ml-1">{ch.type} Channel</span>
                </div>
              </div>
              <button onClick={() => removeChannel(ch.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                <Trash2 size={18}/>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Monthly Volume</label>
                <div className="mt-2 flex items-center gap-2">
                  <input 
                    type="number" 
                    className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none font-mono"
                    value={ch.volume === 0 ? '' : ch.volume}
                    onChange={(e) => updateChannel(ch.id, 'volume', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <span className="text-xs text-slate-400">contacts</span>
                </div>
              </div>
              {ch.type === 'Voice' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">AHT (Minutes)</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input 
                      type="number" step="0.1"
                      className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none font-mono"
                      value={ch.aht === 0 ? '' : ch.aht}
                      onChange={(e) => updateChannel(ch.id, 'aht', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <span className="text-xs text-slate-400">min</span>
                  </div>
                </div>
              )}
              {ch.type !== 'Email' && (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Containment Target</label>
                    <span className="text-sm font-bold text-green-600">{ch.containment}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                    value={ch.containment}
                    onChange={(e) => updateChannel(ch.id, 'containment', parseInt(e.target.value))}
                  />
                </div>
              )}
              
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {(ch.features.includes('convIVR') || ch.features.includes('chatbot')) && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 relative">
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <label className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                               <Cpu size={14}/> Conv. Complexity
                            </label>
                            <p className="text-xs text-indigo-600">Avg. Lex turns per session</p>
                         </div>
                         <input 
                           type="number" 
                           className="w-20 p-2 border border-indigo-200 rounded focus:border-indigo-500 outline-none font-mono text-center bg-white"
                           value={ch.lexTurns === 0 ? '' : ch.lexTurns}
                           onChange={(e) => updateChannel(ch.id, 'lexTurns', parseInt(e.target.value) || 0)}
                           placeholder="0"
                         />
                      </div>
                      <div className="flex items-start gap-2 bg-white p-2 rounded border border-indigo-100">
                        <Info size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-indigo-500 leading-tight">
                          <strong>Tip:</strong> A typical 5-min service call has ~10-15 conversation turns. Simple routing needs 3-5 turns.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className={`p-4 rounded-lg border transition-all duration-300 ${
                     ch.features.includes('bedrock') 
                       ? 'bg-amber-50 border-amber-200' 
                       : 'bg-slate-50 border-slate-200 opacity-50 grayscale pointer-events-none'
                  }`}>
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                               <Boxes size={14} className={ch.features.includes('bedrock') ? "text-amber-600" : "text-slate-400"}/> 
                               Agentic Framework
                            </label>
                            <p className="text-xs text-slate-500">System complexity & token usage</p>
                         </div>
                         {ch.features.includes('bedrock') && <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">Active</span>}
                      </div>
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Model Selection</label>
                        <select 
                          className="w-full p-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-amber-500"
                          value={ch.bedrockModel || 'sonnet'}
                          onChange={(e) => updateChannel(ch.id, 'bedrockModel', e.target.value)}
                        >
                          {Object.entries(BEDROCK_MODELS).map(([key, m]) => (
                            <option key={key} value={key}>{m.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-4">
                         <div className="flex justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-600">System Complexity</span>
                            <span className="text-xs font-bold text-slate-800">{ch.systemComplexity} Systems</span>
                         </div>
                         <input 
                           type="range" min="1" max="10" 
                           className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                           value={ch.systemComplexity}
                           onChange={(e) => updateChannel(ch.id, 'systemComplexity', parseInt(e.target.value))}
                         />
                      </div>
                      <div>
                         <div className="flex justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-600">Context Window</span>
                            <span className="text-xs font-bold text-slate-800">{ch.contextChars.toLocaleString()} chars</span>
                         </div>
                         <input 
                           type="range" min="1000" max="30000" step="1000"
                           className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                           value={ch.contextChars}
                           onChange={(e) => updateChannel(ch.id, 'contextChars', parseInt(e.target.value))}
                         />
                         <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="bg-white p-2 rounded border border-amber-100 text-center">
                              <span className="block text-[10px] text-slate-400 uppercase">Input Tokens</span>
                              <span className="text-xs font-mono font-bold text-slate-600">
                                {Math.round((ch.contextChars + (ch.systemComplexity * 1000))/4).toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-amber-100 text-center">
                              <span className="block text-[10px] text-slate-400 uppercase">Output Tokens</span>
                              <span className="text-xs font-mono font-bold text-slate-600">
                                {Math.round(((ch.contextChars + (ch.systemComplexity * 1000))/4) * 0.2).toLocaleString()}
                              </span>
                            </div>
                         </div>
                      </div>
                  </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">AWS CCaaS Features</label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(FEATURES_CATALOG).map(([key, feature]) => {
                  if (!feature.channels.includes(ch.type)) return null;
                  const isSelected = ch.features.includes(key);
                  const Icon = feature.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleFeature(ch.id, key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-slate-200'}`}>
                         <Icon size={12} />
                      </div>
                      {feature.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {channels.length === 0 && (
          <div className="text-center p-12 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
            <p>No channels added. Add Voice, Chat, or Email to begin estimation.</p>
          </div>
        )}
      </div>
      <div className="bg-slate-900 text-white p-6 rounded-xl flex items-center justify-between sticky bottom-4 shadow-xl z-10">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider">Total Monthly Tech Cost</p>
          <div className="flex items-center gap-3">
             <p className="text-2xl font-bold font-mono">{pricing.currency}{calculations.totalTechMonthly.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
             <button 
               onClick={() => setShowBreakdown(true)}
               className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-xs px-3 py-1 rounded-full transition-colors"
             >
                <Info size={14} /> Breakdown
             </button>
          </div>
        </div>
        <div className="flex gap-4 text-right">
           <div>
             <span className="block text-xs text-slate-500">Voice</span>
             <span className="font-mono text-sm">{pricing.currency}{calculations.voiceCost.toFixed(0)}</span>
           </div>
           <div>
             <span className="block text-xs text-slate-500">Digital</span>
             <span className="font-mono text-sm">{pricing.currency}{calculations.digitalCost.toFixed(0)}</span>
           </div>
           <div>
             <span className="block text-xs text-slate-500">AI/Bot</span>
             <span className="font-mono text-sm text-green-400">{pricing.currency}{calculations.aiCost.toFixed(0)}</span>
           </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls: Rate Band & Add Resource */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Resource Plan</h3>
          <p className="text-sm text-slate-500">Define your implementation team</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
             <span className="text-xs font-bold text-slate-600">Pricing Band:</span>
             <div className="flex gap-1">
               {Object.keys(RATE_BANDS).map(band => (
                 <button
                   key={band}
                   onClick={() => setRateBand(band)}
                   className={`text-xs px-2 py-1 rounded ${rateBand === band ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   {band}
                 </button>
               ))}
             </div>
          </div>
          <button onClick={addResource} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={16}/> Add Resource
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3 w-48">Role</th>
              <th className="p-3 w-40">Channel / Stream</th>
              <th className="p-3 w-32">Phase</th>
              <th className="p-3 w-24">Start Wk</th>
              <th className="p-3 w-24">Duration</th>
              <th className="p-3 w-20">Qty</th>
              <th className="p-3 w-32 text-right">Cost ({rateBand})</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resources.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                  No resources added yet. Click "Add Resource" to begin planning.
                </td>
              </tr>
            ) : resources.map((res) => {
              const roleInfo = DEFAULT_ROLES.find(r => r.id === res.roleId);
              const rateMultiplier = RATE_BANDS[rateBand];
              const monthlyRate = (roleInfo?.monthlyRate || 0) * rateMultiplier;
              const totalCost = (monthlyRate / 4) * res.weeks * (res.quantity || 1);

              return (
                <tr key={res.id} className="group hover:bg-slate-50">
                  <td className="p-3">
                    <select 
                      value={res.roleId}
                      onChange={(e) => updateResource(res.id, 'roleId', e.target.value)}
                      className="w-full bg-transparent outline-none cursor-pointer font-medium text-slate-700"
                    >
                      {DEFAULT_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </td>
                  {/* Channel Link Dropdown */}
                  <td className="p-3">
                    <select
                      value={res.channelId}
                      onChange={(e) => updateResource(res.id, 'channelId', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-xs"
                    >
                      <option value="All">All Channels</option>
                      {channels.map(c => (
                        <option key={c.id} value={c.id}>{c.type} ({c.name})</option>
                      ))}
                    </select>
                  </td>
                  {/* Phase Dropdown */}
                  <td className="p-3">
                    <select
                      value={res.phase}
                      onChange={(e) => updateResource(res.id, 'phase', e.target.value)}
                      className={`w-full border-none rounded px-2 py-1 outline-none text-xs font-semibold ${PHASE_BG_COLORS[res.phase] || 'bg-slate-100'}`}
                    >
                      {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <input 
                      type="number" min="1"
                      value={res.startWeek}
                      onChange={(e) => updateResource(res.id, 'startWeek', parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" min="1"
                        value={res.weeks}
                        onChange={(e) => updateResource(res.id, 'weeks', parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-400">wks</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <input 
                      type="number" min="1"
                      value={res.quantity || 1}
                      onChange={(e) => updateResource(res.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                    />
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600 font-bold">
                    ${totalCost.toLocaleString(undefined, {maximumFractionDigits:0})}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeResource(res.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* GANTT CHART VISUALIZATION */}
      <ImplementationGantt resources={resources} channels={channels} />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Estimation Complete</h2>
        <p className="text-slate-500">Review the Total Cost of Ownership (TCO) below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">One-Time Implementation</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">${calculations.implCost.toLocaleString()}</p>
          <span className="text-xs bg-slate-100 px-2 py-1 rounded mt-2">Band: {rateBand}</span>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-blue-600 text-sm font-medium uppercase tracking-wide">Monthly Tech Run</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">${calculations.totalTechMonthly.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center text-white">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Year 1 TCO</p>
          <p className="text-3xl font-bold mt-2">${calculations.oneYearTCO.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 h-80">
        <h3 className="text-sm font-semibold text-slate-600 mb-4">Detailed Tech Spend Breakdown</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { name: 'Voice Transport', value: calculations.voiceCost },
            { name: 'Digital/Msg', value: calculations.digitalCost },
            { name: 'AI & Automation', value: calculations.aiCost },
            { name: 'Infrastructure', value: calculations.infraCost },
          ]}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${val/1000}k`} />
            <RechartsTooltip cursor={{fill: '#f1f5f9'}} formatter={(val) => `$${val.toLocaleString()}`} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <button onClick={saveDeal} disabled={loading} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-colors font-medium">
          {loading ? 'Saving...' : <><Save size={20}/> Log Deal to DB</>}
        </button>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          <Download size={20}/> Export Quote
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 px-4 relative">
        <div className="absolute left-0 w-full h-1 bg-slate-200 top-5 z-0 hidden lg:block" style={{marginLeft: '20px', width: 'calc(100% - 40px)'}}></div>
        {[
          { num: 1, label: 'Client Info' },
          { num: 2, label: 'Tech & Channels' },
          { num: 3, label: 'Resourcing' },
          { num: 4, label: 'Review & TCO' },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center relative z-10 bg-slate-50 px-2">
            <button 
              onClick={() => setStep(s.num)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                step >= s.num ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'
              }`}
            >
              {step > s.num ? <CheckCircle size={20} /> : s.num}
            </button>
            <span className={`text-xs mt-2 font-medium ${step >= s.num ? 'text-blue-700' : 'text-slate-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 min-h-[500px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      <div className="flex justify-between mt-8 px-4">
        <button 
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${step === 1 ? 'opacity-0' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Back
        </button>
        {step < 4 && (
          <button 
            onClick={() => setStep(s => Math.min(4, s + 1))}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all hover:pr-4"
          >
            Next Step <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

// ... (Dashboard and App components remain mostly the same, ensuring full export) ...
const Dashboard = ({ user }) => (
  <div className="max-w-7xl mx-auto p-8">
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-slate-800">Pipeline Dashboard</h1>
      <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-600 text-sm">
        {user ? 'Logged In' : 'Guest Mode'}
      </div>
    </div>
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
      <h3 className="text-lg font-semibold text-blue-800">No recent activity</h3>
      <p className="text-blue-600 mt-2">Start a new estimation to see your pipeline data here.</p>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator'); 
  const [user, setUser] = useState(null);
  
  // Use REGIONAL_PRICING based on some default, but it will be overridden by EstimatorWizard local state if we pass it down
  // Actually, pricing is better managed inside Wizard now that it's region-dependent.
  // But for the 'Knowledge Base' tab to work, we need a "global" pricing state.
  // Let's initialize with US pricing.
  const [pricing, setPricing] = useState(REGIONAL_PRICING['US']);

  useEffect(() => {
    if (auth) {
      const initAuth = async () => {
         await signInAnonymously(auth).catch(e => console.warn("Auth failed (likely offline mode)", e));
      };
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, setUser);
      return () => unsubscribe();
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 ml-20 lg:ml-64 transition-all duration-300">
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {/* Pass setPricing to Wizard so it can update global pricing based on region selection */}
        {activeTab === 'calculator' && <EstimatorWizard user={user} pricing={pricing} setGlobalPricing={setPricing} />}
        {activeTab === 'knowledge' && <KnowledgeBase pricing={pricing} />}
      </main>
    </div>
  );
}