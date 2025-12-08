import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calculator, Users, FileText, Settings, Save, Download, 
  Plus, Trash2, ChevronRight, CheckCircle, Database, LayoutDashboard,
  Mic, MessageSquare, Mail, Server, Cpu, Activity, Zap, BrainCircuit, Edit2, Globe, Boxes, Info, X, HelpCircle, Calendar, Link as LinkIcon, Layers, ArrowLeft, ArrowRight,
  Phone, MessageSquarePlus, Lock, ArrowLeftRight, TrendingUp, TrendingDown, Clock, Search, Briefcase, Eye, Table, GripVertical
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, getDocs, doc, setDoc, query, orderBy, onSnapshot 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- CONFIGURATION ---
// --- CONFIGURATION ---
const ENABLE_EXPERIMENTAL_FEATURES = 
  (typeof process !== 'undefined' && process.env && (
    process.env.REACT_APP_ENABLE_EXPERIMENTAL === 'true' || 
    process.env.VITE_ENABLE_EXPERIMENTAL === 'true'
  )) || false; // <--- CHANGED TO FALSE

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

const DEFAULT_PRICING = {
  connect_voice_usage_per_min: 0.018,
  telephony_per_min: 0.0022, 
  connect_chat_usage_per_msg: 0.004,
  email_per_msg: 0.004,
  translate_voice_min: 0.015, 
  translate_chat_unit: 0.00006, 
  lex_speech_turn: 0.0065, 
  lex_text_turn: 0.00075, 
  agent_assist_voice_min: 0.0080,
  agent_assist_chat_msg: 0.0015,
  contact_lens_voice_min: 0.015,
  contact_lens_chat_msg: 0.0015,
  storage_per_gb: 0.023,
  qa_analysis_unit: 0.00 
};

const YELLOW_AI_PRICING = {
  currency: '$',
  platform_fee: 10000,
  live_chat_per_conversation: 0.04,
  chatbot_per_conversation: 0.04,
  conv_ivr_per_min_tiers: [
    { limit: 200000, price: 0.18 },
    { limit: 400000, price: 0.16 },
    { limit: 600000, price: 0.14 },
    { limit: 800000, price: 0.12 },
    { limit: 1000000, price: 0.10 },
    { limit: Infinity, price: 0.08 },
  ]
};

const KORE_AI_PRICING = {
  currency: '$',
  platform_fee_annual: 40000, // Non-prod env
  expert_service_one_time: 20000,
  chatbot_session_15min: 0.16, // Includes Agentic AI
  agent_assist_chat_session_15min: 0.24,
  conv_ivr_session_15min: 0.21,
  agent_assist_voice_session_15min: 0.24,
};

const REGIONAL_PRICING = {
  'US': {
    currency: '$',
    connect_voice_usage_per_min: 0.018,
    telephony_per_min: 0.0022, 
    connect_chat_usage_per_msg: 0.004,
    email_per_msg: 0.004,
    translate_voice_min: 0.015, 
    translate_chat_unit: 0.00006, 
    lex_speech_turn: 0.0065, 
    lex_text_turn: 0.00075, 
    agent_assist_voice_min: 0.0080,
    agent_assist_chat_msg: 0.0015,
    contact_lens_voice_min: 0.015,
    contact_lens_chat_msg: 0.0015,
    storage_per_gb: 0.023,
    qa_analysis_unit: 0.00
  },
  'UK': {
    currency: '£', 
    connect_voice_usage_per_min: 0.022,
    telephony_per_min: 0.0035, 
    connect_chat_usage_per_msg: 0.005,
    email_per_msg: 0.005,
    translate_voice_min: 0.018, 
    translate_chat_unit: 0.00008, 
    lex_speech_turn: 0.0065, 
    lex_text_turn: 0.0009, 
    agent_assist_voice_min: 0.014,
    agent_assist_chat_msg: 0.004,
    contact_lens_voice_min: 0.018,
    contact_lens_chat_msg: 0.0018,
    storage_per_gb: 0.025,
    qa_analysis_unit: 0.00
  }
};

const FEATURES_CATALOG = {
  connect_voice_usage: { label: 'Connect Voice Usage', channels: ['Voice'], icon: Phone },
  telephony: { label: 'Telephony DID/Toll-Free', channels: ['Voice'], icon: Zap },
  connect_chat_usage: { label: 'Connect Chat Usage', channels: ['Chat'], icon: MessageSquarePlus },
  translate: { label: 'Real-time Translation', channels: ['Voice', 'Chat'], icon: Globe, isExperimental: true },
  convIVR: { label: 'Conversational IVR (Lex)', channels: ['Voice'], icon: Cpu },
  chatbot: { label: 'Chatbot Automation', channels: ['Chat'], icon: Cpu },
  qaAnalysis: { label: 'QA Analysis (Auto-QA)', channels: ['Voice', 'Chat'], icon: Eye }, 
  emailMgmt: { label: 'Email Management (Routing)', channels: ['Email'], icon: Mail },
  contactLens: { label: 'Contact Lens (Analytics)', channels: ['Voice', 'Chat'], icon: Activity },
  agentAssist: { label: 'Agent Assist (Q/Wisdom)', channels: ['Voice', 'Chat'], icon: BrainCircuit },
  bedrock: { label: 'Agentic Framework (Bedrock)', channels: ['Voice', 'Chat', 'Email'], icon: Server, isExperimental: true },
  storage: { label: 'Recording / Archiving', channels: ['Voice', 'Chat', 'Email'], icon: Database },
};

const FEATURES_CATALOG_YELLOW_AI = {
  convIVR: { label: 'Conversational IVR', channels: ['Voice'], icon: Cpu },
  chatbot: { label: 'Chatbot', channels: ['Chat'], icon: Cpu },
  liveChat: { label: 'Live Chat', channels: ['Chat'], icon: MessageSquare },
  agentic: { label: 'Agentic Framework', channels: ['Voice', 'Chat'], icon: Server },
};

const FEATURES_CATALOG_KORE = {
  convIVR: { label: 'Conversational IVR', channels: ['Voice'], icon: Cpu },
  chatbot: { label: 'Chatbot (Agentic AI)', channels: ['Chat'], icon: Cpu },
  agentAssist: { label: 'Agent Assist', channels: ['Voice', 'Chat'], icon: BrainCircuit },
};

const DEFAULT_ROLES = [
  { id: 'imp_pm', label: 'Implementation PM', monthlyRate: 3760 },
  { id: 'cx_dev', label: 'CX Developer', monthlyRate: 4001 },
  { id: 'cx_sr_dev', label: 'CX Senior Developer', monthlyRate: 5206 },
  { id: 'cx_plat', label: 'CX Platform Specialist', monthlyRate: 3760 },
  { id: 'cx_consult', label: 'CX Consultant', monthlyRate: 5447 },
  { id: 'cx_analyst', label: 'CX QA / Analyst', monthlyRate: 3760 },
  { id: 'cx_design', label: 'CX Designer', monthlyRate: 3760 },
  { id: 'cx_arch', label: 'CX Solution Architect', monthlyRate: 5447 },
];

const PHASES = ['Discovery', 'Design', 'Build', 'Testing', 'Deployment', 'Hypercare'];

const PHASE_BG_COLORS = {
  'Discovery': 'bg-purple-100 text-purple-700',
  'Design': 'bg-blue-100 text-blue-700',
  'Build': 'bg-emerald-100 text-emerald-700',
  'Testing': 'bg-amber-100 text-amber-700',
  'Deployment': 'bg-orange-100 text-orange-700',
  'Hypercare': 'bg-slate-100 text-slate-700'
};

const PHASE_COLORS = {
  'Discovery': 'bg-purple-500',
  'Design': 'bg-blue-500',
  'Build': 'bg-emerald-500',
  'Testing': 'bg-amber-500',
  'Deployment': 'bg-orange-500',
  'Hypercare': 'bg-slate-500'
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
      <div className="bg-white p-2 rounded-lg flex items-center justify-center shrink-0">
        <img 
          src="https://logo.clearbit.com/firstsource.com" 
          alt="Firstsource" 
          className="h-14 w-auto object-contain"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} 
        />
        <Calculator size={24} className="text-blue-600 hidden" />
      </div>
      <span className="font-bold text-lg hidden lg:block leading-tight">CX Cost Calculator</span>
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

const CostBreakdownSidebar = ({ isOpen, onClose, channels, pricing, techStack }) => {
  const curr = pricing.currency || '$';

  return (
    <div 
      className={`fixed top-0 right-0 z-[50] h-full w-[400px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator size={20} className="text-blue-600"/> Cost DNA
            </h3>
            <p className="text-sm text-slate-500 font-medium">Real-time unit breakdown</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white hover:bg-slate-200 text-slate-500 rounded-full transition-colors border border-slate-200 shadow-sm"
            title="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* Platform Fee Display for Yellow.ai */}
          {(techStack === 'yellow' || techStack === 'kore') && channels.length > 0 && (
             <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm bg-gradient-to-r from-slate-50 to-white mb-4">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Server size={14} className="text-slate-600"/> 
                      {techStack === 'kore' ? 'Non-Prod Cloud (Annual)' : 'Platform Fee'}
                    </h4>
                    <span className="font-mono font-bold text-slate-800">
                        {curr}{techStack === 'yellow' 
                            ? YELLOW_AI_PRICING.platform_fee.toLocaleString() 
                            : KORE_AI_PRICING.platform_fee_annual.toLocaleString() /* Show full 40k */
                        }
                    </span>
                </div>
                {techStack === 'kore' && (
                    <div className="flex justify-between items-center border-t border-slate-100 pt-1 mt-1">
                         <h4 className="font-bold text-slate-500 text-xs flex items-center gap-2">
                           Expert Service (1-time)
                         </h4>
                         <span className="font-mono font-bold text-xs text-slate-500">
                            {curr}{KORE_AI_PRICING.expert_service_one_time.toLocaleString()}
                         </span>
                    </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1 pl-6">
                    {techStack === 'kore' ? 'Fixed annual & one-time fees (Excluded from usage)' : 'Base platform license & fees'}
                </p>
             </div>
          )}

          {channels.length === 0 ? (
            <div className="text-center text-slate-400 py-12 flex flex-col items-center">
              <Info size={32} className="mb-2 opacity-50"/>
              <p>Add channels to see cost breakdown.</p>
            </div>
          ) : channels.map((ch, idx) => {
            const containment = ch.containment || 0;
            const liveVol = ch.volume * ((100 - containment) / 100);
            const modelPricing = BEDROCK_MODELS[ch.bedrockModel || 'sonnet'];
            
            // --- YELLOW AI SPECIFIC LOGIC ---
            if (techStack === 'yellow') {
                const agenticMult = ch.features.includes('agentic') ? 1.25 : 1.0;
                
                return (
                    <div key={ch.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-extrabold">{idx + 1}</span>
                            {ch.name} <span className="text-xs font-normal text-slate-400 uppercase tracking-wider ml-1">({ch.type})</span>
                          </h4>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono font-medium">
                            {ch.volume.toLocaleString()} vol
                          </span>
                        </div>
                        <div className="space-y-3 text-sm text-slate-600">
                            {/* IVR */}
                            {ch.type === 'Voice' && ch.features.includes('convIVR') && (
                                <div className="flex justify-between items-center group">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-purple-700">Conversational IVR</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Tiered Pricing</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block font-mono font-bold text-purple-700">
                                       {(() => {
                                            const totalMinutes = ch.volume * ch.aht;
                                            let remainingMinutes = totalMinutes;
                                            let voiceCost = 0;
                                            pricing.conv_ivr_per_min_tiers.forEach((tier, index) => {
                                                const prevTierLimit = index === 0 ? 0 : pricing.conv_ivr_per_min_tiers[index-1].limit;
                                                if (remainingMinutes > 0) {
                                                    const minutesInTier = Math.min(remainingMinutes, tier.limit - prevTierLimit);
                                                    voiceCost += minutesInTier * tier.price;
                                                    remainingMinutes -= minutesInTier;
                                                }
                                            });
                                            return `${curr}${(voiceCost * agenticMult).toFixed(2)}`;
                                       })()}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Total for channel</span>
                                  </div>
                                </div>
                            )}

                            {/* Chatbot */}
                            {ch.type === 'Chat' && ch.features.includes('chatbot') && (
                                <div className="flex justify-between items-center group">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-blue-700">Chatbot Automation</span>
                                    <span className="text-[10px] text-slate-400">Total Vol ({ch.volume.toLocaleString()})</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block font-mono font-bold text-blue-700">
                                      {curr}{(ch.volume * pricing.chatbot_per_conversation * agenticMult).toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-slate-400">@ {curr}{pricing.chatbot_per_conversation}/conv</span>
                                  </div>
                                </div>
                            )}
                            
                            {/* Live Chat */}
                            {ch.type === 'Chat' && ch.features.includes('liveChat') && (
                                <div className="flex justify-between items-center group">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-green-700">Live Chat</span>
                                    <span className="text-[10px] text-slate-400">Uncontained ({liveVol.toLocaleString()})</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="block font-mono font-bold text-green-700">
                                      {curr}{(liveVol * pricing.live_chat_per_conversation * agenticMult).toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-slate-400">@ {curr}{pricing.live_chat_per_conversation}/conv</span>
                                  </div>
                                </div>
                            )}

                             {/* Agentic Multiplier */}
                            {ch.features.includes('agentic') && (
                                <div className="bg-amber-50 p-2 rounded text-center border border-amber-100">
                                    <span className="text-xs font-bold text-amber-700">Agentic Framework Active</span>
                                    <span className="block text-[10px] text-amber-600">All channel costs x1.25</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
            // --- KORE.AI SPECIFIC LOGIC ---
            // --- KORE.AI SPECIFIC LOGIC (Updated Units) ---
            if (techStack === 'kore') {
              return (
                  <div key={ch.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-extrabold">{idx + 1}</span>
                          {ch.name} <span className="text-xs font-normal text-slate-400 uppercase tracking-wider ml-1">({ch.type})</span>
                        </h4>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono font-medium">
                          {ch.volume.toLocaleString()} vol
                        </span>
                      </div>

                      <div className="space-y-3 text-sm text-slate-600">
                          {/* Voice Logic */}
                          {ch.type === 'Voice' && (
                              <div className="flex justify-between items-center group">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-purple-700">Conv IVR (15m Blocks)</span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                      {Math.ceil((ch.aht||1)/15)} units/call × {ch.volume.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="block font-mono font-bold text-purple-700">
                                     {curr}{((ch.volume * Math.ceil((ch.aht||1)/15)) * pricing.conv_ivr_session_15min).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">@ {curr}{pricing.conv_ivr_session_15min}/unit</span>
                                </div>
                              </div>
                          )}

                          {/* Chat Logic */}
                          {ch.type === 'Chat' && (
                              <div className="flex justify-between items-center group">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-blue-700">Chatbot (15m Blocks)</span>
                                </div>
                                <div className="text-right">
                                  <span className="block font-mono font-bold text-blue-700">
                                    {curr}{((ch.volume * Math.ceil((ch.aht||1)/15)) * pricing.chatbot_session_15min).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">@ {curr}{pricing.chatbot_session_15min}/unit</span>
                                </div>
                              </div>
                          )}

                          {/* Agent Assist */}
                          {ch.features.includes('agentAssist') && (
                              <div className="flex justify-between items-center group pt-2 mt-2 border-t border-slate-50">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-emerald-700">Agent Assist</span>
                                </div>
                                <div className="text-right">
                                  <span className="block font-mono font-bold text-emerald-700">
                                    {curr}{ch.type === 'Voice' 
                                      ? ((ch.volume * ((100-ch.containment)/100) * Math.ceil((ch.aht||1)/15)) * pricing.agent_assist_voice_session_15min).toFixed(2)
                                      : ((ch.volume * ((100-ch.containment)/100) * Math.ceil((ch.aht||1)/15)) * pricing.agent_assist_chat_session_15min).toFixed(2)
                                    }
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                      @ {curr}{ch.type === 'Voice' ? pricing.agent_assist_voice_session_15min : pricing.agent_assist_chat_session_15min}/unit
                                  </span>
                                </div>
                              </div>
                          )}
                      </div>
                  </div>
              );
          }
            // --- AWS (STANDARD) LOGIC ---
            return (
              <div key={ch.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-extrabold">{idx + 1}</span>
                    {ch.name} <span className="text-xs font-normal text-slate-400 uppercase tracking-wider ml-1">({ch.type})</span>
                  </h4>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono font-medium">
                    {ch.volume.toLocaleString()} vol
                  </span>
                </div>
                
                <div className="space-y-3 text-sm text-slate-600">
                  {/* --- VOICE CALCULATIONS --- */}
                  {ch.type === 'Voice' && ch.features.includes('connect_voice_usage') && (
                    <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">Voice Transport</span>
                        <span className="text-[10px] text-slate-400 font-medium">{ch.aht}m/call (Live Only)</span>
                      </div>
                      <div className="text-right">
                        {/* CHANGED: ch.volume -> liveVol */}
                        <span className="block font-mono font-bold text-slate-800">
                            {curr}{(liveVol * ch.aht * pricing.connect_voice_usage_per_min).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">@ {curr}{pricing.connect_voice_usage_per_min}/min</span>
                      </div>
                    </div>
                  )}

                  {/* --- CHAT CALCULATIONS --- */}
                  {ch.type === 'Chat' && ch.features.includes('connect_chat_usage') && (
                    <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">Chat Messaging</span>
                        <span className="text-[10px] text-slate-400 font-medium">{liveVol.toLocaleString()} live sessions</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-slate-800">{curr}{(liveVol * 15 * pricing.connect_chat_usage_per_msg).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">@ {curr}{pricing.connect_chat_usage_per_msg}/msg</span>
                      </div>
                    </div>
                  )}

                  {/* --- TRANSLATION --- */}
                  {ch.features.includes('translate') && (
                    <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-semibold text-indigo-700">Real-time Translation</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-indigo-700">
                          {curr}{ch.type === 'Voice' 
                            ? (liveVol * ch.aht * pricing.translate_voice_min).toFixed(2)
                            : (liveVol * 15 * 1.5 * pricing.translate_chat_unit).toFixed(2)
                          }
                        </span>
                         <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">@ {curr}{ch.type === 'Voice' ? pricing.translate_voice_min : pricing.translate_chat_unit}/{ch.type === 'Voice' ? 'min' : 'char'}</span>
                      </div>
                    </div>
                  )}

                  {/* --- TELEPHONY --- */}
                  {ch.features.includes('telephony') && (
                    <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-semibold text-blue-700">Telephony / DID</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-blue-700">{curr}{(liveVol * ch.aht * pricing.telephony_per_min).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">@ {curr}{pricing.telephony_per_min}/min</span>
                      </div>
                    </div>
                  )}

                  {/* --- LEX BOT --- */}
                  {(ch.features.includes('convIVR') || ch.features.includes('chatbot')) && (
                    <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-semibold text-purple-700">Automation</span>
                        <span className="text-[10px] text-slate-400 font-medium">{ch.lexTurns || 0} turns avg</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-purple-700">
                           {/* NOTE: This simple logic is for AWS. Yellow logic is handled in the main wizard, but this keeps the sidebar safe */}
                          {curr}{(ch.volume * (ch.lexTurns || 0) * (ch.type === 'Voice' ? pricing.lex_speech_turn : pricing.lex_text_turn)).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">@ {curr}{ch.type === 'Voice' ? pricing.lex_speech_turn : pricing.lex_text_turn}/turn</span>
                      </div>
                    </div>
                  )}

                  {/* --- BEDROCK --- */}
                  {ch.features.includes('bedrock') && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
                       <div className="flex justify-between mb-1">
                         <span className="text-xs font-bold text-amber-800">Bedrock ({modelPricing.label})</span>
                       </div>
                       <div className="flex justify-between items-end">
                         <span className="text-[10px] text-amber-700 opacity-80 font-medium">
                           {((ch.volume * (ch.lexTurns || 5) * ((ch.contextChars || 1000)/4) * 1.2)).toLocaleString(undefined, {maximumFractionDigits:0})} tot. tokens
                         </span>
                         <span className="font-mono font-bold text-amber-800">
                           {curr}{(
                             ch.volume * (ch.lexTurns || 5) * (
                               ((ch.contextChars || 1000)/4000 * modelPricing.input) + 
                               ((ch.contextChars || 1000)/4000 * 0.2 * modelPricing.output)
                             )
                           ).toFixed(2)}
                         </span>
                       </div>
                    </div>
                  )}

                  {/* --- AGENT ASSIST (Explicitly Shown) --- */}
                  {ch.features.includes('agentAssist') && (
                    <div className="flex justify-between items-center group mt-2 pt-2 border-t border-slate-100">
                       <div className="flex flex-col">
                         <span className="font-semibold text-emerald-700 flex items-center gap-1">
                           <BrainCircuit size={12}/> Agent Assist
                         </span>
                         <span className="text-[10px] text-emerald-600/70 font-medium">
                           Uncontained Vol: {liveVol.toLocaleString()}
                         </span>
                       </div>
                       <div className="text-right">
                         <span className="block font-mono font-bold text-emerald-700">
                           {curr}{(liveVol * (ch.type === 'Voice' ? ch.aht : 15) * (ch.type === 'Voice' ? pricing.agent_assist_voice_min : pricing.agent_assist_chat_msg)).toFixed(2)}
                         </span>
                         <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">@ {curr}{ch.type === 'Voice' ? pricing.agent_assist_voice_min : pricing.agent_assist_chat_msg}/{ch.type === 'Voice' ? 'min' : 'msg'}</span>
                       </div>
                    </div>
                  )}
                  
                  {/* --- CONTACT LENS --- */}
                  {ch.features.includes('contactLens') && (
                    <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-semibold text-rose-700">Contact Lens</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-rose-700">
                          {curr}{(ch.volume * (ch.type === 'Voice' ? ch.aht : 15) * (ch.type === 'Voice' ? pricing.contact_lens_voice_min : pricing.contact_lens_chat_msg)).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">@ {curr}{ch.type === 'Voice' ? pricing.contact_lens_voice_min : pricing.contact_lens_chat_msg}/{ch.type === 'Voice' ? 'min' : 'msg'}</span>
                      </div>
                    </div>
                  )}

                  {/* --- STORAGE --- */}
                  {ch.features.includes('storage') && (
                     <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700">Storage</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-gray-700">
                          {curr}{ (ch.type === 'Voice' ? (ch.volume * ch.aht * 0.001) * pricing.storage_per_gb : (ch.volume * 0.0005) * pricing.storage_per_gb).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">@ {curr}{pricing.storage_per_gb}/GB</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ImplementationGantt = ({ resources, channels, techStack }) => {
  const [viewMode, setViewMode] = useState('resource'); 

  const maxWeeks = useMemo(() => {
    if (!resources || resources.length === 0) return 24;
    return Math.max(...resources.map(r => (r.startWeek || 1) + (r.weeks || 4)), 24);
  }, [resources]);

  const months = Math.ceil(maxWeeks / 4);

  // Grouping for Gantt Chart
  const groupedResources = useMemo(() => {
    if (!resources || resources.length === 0) return {};
    const grouped = {};
    const catalog = techStack === 'yellow' ? FEATURES_CATALOG_YELLOW_AI : FEATURES_CATALOG;

    // Initialize groups for structure
    channels.forEach(ch => {
        ch.features.forEach(f => {
            const label = catalog[f]?.label || f;
            grouped[`${ch.type} - ${ch.name} (${label})`] = [];
        });
    });

    resources.forEach(res => {
      if (res.channelId !== 'All') {
        const foundCh = channels.find(c => c.id === res.channelId);
        if (foundCh) {
            const label = catalog[res.featureKey]?.label || res.featureKey;
            const groupKey = `${foundCh.type} - ${foundCh.name} (${label})`;
            if (!grouped[groupKey]) grouped[groupKey] = []; // Should be initialized but just in case
            grouped[groupKey].push(res);
        }
      }
    });
    return grouped;
  }, [resources, channels, techStack]);

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
            By Stream
          </button>
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header Row: Months */}
          <div className="flex mb-2">
            <div className="w-56 shrink-0 font-semibold text-xs text-slate-500 uppercase tracking-wide">
              {viewMode === 'resource' ? 'Resource' : 'Stream'}
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
              // RESOURCE VIEW (Flat List sorted by start week)
              resources
                .filter(r => r.channelId !== 'All')
                .sort((a,b)=>a.startWeek-b.startWeek)
                .map((res) => {
                const role = DEFAULT_ROLES.find(r => r.id === res.roleId);
                const startPct = ((res.startWeek - 1) / maxWeeks) * 100;
                const widthPct = (res.weeks / maxWeeks) * 100;
                const barColor = PHASE_COLORS[res.phase] || 'bg-blue-500';
                
                let label = '';
                if (res.channelId !== 'All') {
                   const found = channels.find(c => c.id === res.channelId);
                   const catalog = techStack === 'yellow' ? FEATURES_CATALOG_YELLOW_AI : FEATURES_CATALOG;
                   const fLabel = catalog[res.featureKey]?.label || res.featureKey;
                   if (found) label = `${found.type} - ${fLabel}`;
                }

                return (
                  <div key={res.id} className="flex items-center relative z-10 group">
                    <div className="w-56 shrink-0 pr-4">
                      <div className="text-sm font-medium text-slate-700 truncate">{role?.label || 'Resource'}</div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className={`w-2 h-2 rounded-full ${barColor}`}></span>
                        {res.phase} • {label}
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
              // STREAM VIEW (Grouped by Channel-Feature)
              Object.entries(groupedResources).map(([groupName, groupResources]) => {
                if(groupResources.length === 0) return null;
                return (
                  <div key={groupName} className="flex items-center relative z-10 min-h-[40px] border-b border-slate-50 last:border-0 py-2">
                    <div className="w-56 shrink-0 pr-4">
                      <div className="text-sm font-medium text-slate-700 truncate">{groupName}</div>
                      <div className="text-[10px] text-slate-400">{groupResources.length} resources</div>
                    </div>
                    <div className="flex-1 relative h-8">
                      {groupResources.map((res, i) => {
                        const startPct = ((res.startWeek - 1) / maxWeeks) * 100;
                        const widthPct = (res.weeks / maxWeeks) * 100;
                        const barColor = PHASE_COLORS[res.phase] || 'bg-blue-500';
                        const role = DEFAULT_ROLES.find(r => r.id === res.roleId);
                        return (
                          <div 
                            key={res.id}
                            className={`absolute top-1 bottom-1 ${barColor} rounded-md shadow-sm border border-white opacity-90 hover:opacity-100 hover:z-20 transition-all cursor-help`}
                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                            title={`${role?.label} (${res.phase}): ${res.weeks} weeks`}
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

const EstimatorWizard = ({ user, pricing, setGlobalPricing }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showCompare, setShowCompare] = useState(false); 
  const [showExportModal, setShowExportModal] = useState(false); 
  
  const [client, setClient] = useState({ 
    name: '', 
    email: '', 
    teamMember: '', 
    techStack: 'aws', 
    region: 'US' 
  });
  
  const [channels, setChannels] = useState([]);
  const [resources, setResources] = useState([]);
  const [rateBand, setRateBand] = useState('Medium');

  useEffect(() => {
    if (client.techStack === 'aws' && client.region && REGIONAL_PRICING[client.region]) {
      setGlobalPricing(REGIONAL_PRICING[client.region]);
    } else if (client.techStack === 'yellow') {
      setGlobalPricing(YELLOW_AI_PRICING);
    }else if (client.techStack === 'kore') {
      setGlobalPricing(KORE_AI_PRICING);
    }
  }, [client.region, client.techStack, setGlobalPricing]);

  useEffect(() => {
    document.title = "CX Cost Calculator";
  }, []);

  // --- CALCULATIONS ENGINE ---
  const calculations = useMemo(() => {
    let totalVoiceCost = 0;
    let totalDigitalCost = 0;
    let totalAiCost = 0;
    let totalInfraCost = 0; 
    let annualPlatformFees = 0; 
    let oneTimeFees = 0;

    if (client.techStack === 'aws') {
      channels.forEach(ch => {
        const containedVol = ch.volume * ((ch.containment || 0) / 100);
        const liveVol = ch.volume - containedVol;
        const modelPricing = BEDROCK_MODELS[ch.bedrockModel || 'sonnet'];
        const p = pricing; 

        if (ch.type === 'Voice') {
           // 1. Transport & Telephony (Live Only)
           const baseRate = (ch.features.includes('connect_voice_usage') ? p.connect_voice_usage_per_min : 0) + 
                            (ch.features.includes('telephony') ? p.telephony_per_min : 0);
           
           // 2. Contact Lens (Live Only)
           const analyticsRate = ch.features.includes('contactLens') ? p.contact_lens_voice_min : 0;
           
           // 3. Agent Assist (Live Only)
           const assistRate = ch.features.includes('agentAssist') ? p.agent_assist_voice_min : 0;
           const translateRate = ch.features.includes('translate') ? p.translate_voice_min : 0;
           
           totalVoiceCost += liveVol * ch.aht * (baseRate + analyticsRate + assistRate + translateRate);
           
           // 4. Bot Transport (Contained - Avg 2 mins)
           if (ch.features.includes('convIVR') || ch.features.includes('chatbot')) {
               totalVoiceCost += containedVol * 2.0 * (baseRate + translateRate);
               totalAiCost += ch.volume * (ch.lexTurns||0) * p.lex_speech_turn;
           }

           // 5. BEDROCK (Generative AI)
           if (ch.features.includes('bedrock')) {
             // Logic: (Context Chars / 4) = Input Tokens
             // Output Tokens estimated as 20% of Input
             const inputTokens = (ch.contextChars || 1000) / 4;
             const outputTokens = inputTokens * 0.2;
             
             // Cost = (Vol * Turns * (InPrice + OutPrice)) / 1000
             const costPerTurn = ((inputTokens/1000 * modelPricing.input) + (outputTokens/1000 * modelPricing.output));
             totalAiCost += ch.volume * (ch.lexTurns||5) * costPerTurn;
           }

           if (ch.features.includes('storage')) totalInfraCost += (ch.volume * ch.aht * 0.001) * p.storage_per_gb;

        } else if (ch.type === 'Chat') {
           const baseRate = ch.features.includes('connect_chat_usage') ? p.connect_chat_usage_per_msg : 0;
           const analyticsRate = ch.features.includes('contactLens') ? p.contact_lens_chat_msg : 0;
           const assistRate = ch.features.includes('agentAssist') ? p.agent_assist_chat_msg : 0;
           
           totalDigitalCost += liveVol * 15 * (baseRate + analyticsRate + assistRate);
           
           if (ch.features.includes('chatbot')) totalAiCost += ch.volume * (ch.lexTurns||0) * p.lex_text_turn;
           
           if (ch.features.includes('bedrock')) {
             const inputTokens = (ch.contextChars || 1000) / 4;
             const outputTokens = inputTokens * 0.2;
             const costPerTurn = ((inputTokens/1000 * modelPricing.input) + (outputTokens/1000 * modelPricing.output));
             totalAiCost += ch.volume * (ch.lexTurns||5) * costPerTurn;
           }
           
           if (ch.features.includes('storage')) totalInfraCost += (ch.volume * 0.0005) * p.storage_per_gb;
        }
      });
    } 
    // ... (Keep Yellow and Kore logic exactly as they were in previous step) ...
    else if (client.techStack === 'yellow') {
       oneTimeFees = YELLOW_AI_PRICING.platform_fee; 
       channels.forEach(ch => {
           const agenticMult = ch.features.includes('agentic') ? 1.25 : 1.0;
           if (ch.type === 'Voice' && ch.features.includes('convIVR')) {
                const totalMinutes = ch.volume * ch.aht;
                let remainingMinutes = totalMinutes;
                let voiceCost = 0;
                YELLOW_AI_PRICING.conv_ivr_per_min_tiers.forEach((tier, index) => {
                    const prevTierLimit = index === 0 ? 0 : YELLOW_AI_PRICING.conv_ivr_per_min_tiers[index-1].limit;
                    if (remainingMinutes > 0) {
                        const limit = tier.limit - prevTierLimit;
                        const minutesInTier = Math.min(remainingMinutes, limit);
                        voiceCost += minutesInTier * tier.price;
                        remainingMinutes -= minutesInTier;
                    }
                });
                totalVoiceCost += voiceCost * agenticMult;
           }
           if (ch.type === 'Chat') {
               const uncontainedVol = ch.volume * ((100 - (ch.containment||0)) / 100);
               if (ch.features.includes('chatbot')) totalDigitalCost += ch.volume * YELLOW_AI_PRICING.chatbot_per_conversation * agenticMult;
               if (ch.features.includes('liveChat')) totalDigitalCost += uncontainedVol * YELLOW_AI_PRICING.live_chat_per_conversation * agenticMult;
           }
       });
    } else if (client.techStack === 'kore') {
        annualPlatformFees = KORE_AI_PRICING.platform_fee_annual; 
        oneTimeFees = KORE_AI_PRICING.expert_service_one_time;
        channels.forEach(ch => {
            const unitsPerSession = Math.ceil((ch.aht || 1) / 15);
            const totalUnits = ch.volume * unitsPerSession;
            const liveVol = ch.volume * ((100 - (ch.containment || 0)) / 100);
            const liveUnits = liveVol * unitsPerSession;
            if (ch.type === 'Voice') {
                if (ch.features.includes('convIVR')) totalVoiceCost += totalUnits * KORE_AI_PRICING.conv_ivr_session_15min;
                if (ch.features.includes('agentAssist')) totalAiCost += liveUnits * KORE_AI_PRICING.agent_assist_voice_session_15min;
            }
            if (ch.type === 'Chat') {
                 if (ch.features.includes('chatbot')) totalDigitalCost += totalUnits * KORE_AI_PRICING.chatbot_session_15min;
                 if (ch.features.includes('agentAssist')) totalAiCost += liveVol * KORE_AI_PRICING.agent_assist_chat_session_15min;
            }
        });
    }

    const totalTechUsageOnly = totalVoiceCost + totalDigitalCost + totalAiCost + totalInfraCost;
    const rateMultiplier = RATE_BANDS[rateBand] || 1.0;
    
    const implCost = resources.reduce((acc, r) => {
      const role = DEFAULT_ROLES.find(role => role.id === r.roleId);
      if (!role) return acc;
      const baseMonthly = role.monthlyRate * rateMultiplier;
      const weeklyRate = baseMonthly / 4;
      const effort = (r.effort || 100) / 100;
      return acc + (weeklyRate * r.weeks * (r.quantity || 1) * effort);
    }, 0);

    const year1TCO = implCost + (totalTechUsageOnly * 12) + annualPlatformFees + oneTimeFees;
    const year2TCO = (totalTechUsageOnly * 12) + annualPlatformFees;
    const year3TCO = (totalTechUsageOnly * 12) + annualPlatformFees;

    return {
      voiceCost: totalVoiceCost,
      digitalCost: totalDigitalCost,
      aiCost: totalAiCost,
      infraCost: totalInfraCost,
      annualPlatformFees, 
      oneTimeFees, 
      totalTechMonthly: totalTechUsageOnly, 
      implCost,
      oneYearTCO: year1TCO,
      threeYearTCO: year1TCO + year2TCO + year3TCO,
      year1Only: year1TCO,
      year2Only: year2TCO,
      year3Only: year3TCO
    };
  }, [channels, pricing, resources, rateBand, client.techStack]);

  // --- COMPARISON LOGIC ---
  // --- COMPARISON LOGIC (Synchronized & Feature-Aware) ---
  const comparisonCalculations = useMemo(() => {
    
    // 1. AWS Equivalent
    const calcAws = () => {
        let cost = 0;
        const p = REGIONAL_PRICING['US']; 
        channels.forEach(ch => {
            const liveVol = ch.volume * (1 - ((ch.containment || 0) / 100));

            if (ch.type === 'Voice') {
                // Transport: Always based on Live Volume + Feature presence
                // If on Yellow/Kore, we assume "Connect Voice Usage" is the base equivalent
                cost += liveVol * ch.aht * p.connect_voice_usage_per_min;
                
                // Telephony: Only add if selected
                if (ch.features.includes('telephony')) cost += liveVol * ch.aht * p.telephony_per_min;
                
                // AI/Lex: Only add if ConvIVR is selected
                if (ch.features.includes('convIVR')) {
                    cost += ch.volume * (ch.lexTurns || 5) * p.lex_speech_turn;
                    // Add contained call transport (avg 2 mins)
                    cost += (ch.volume - liveVol) * 2.0 * p.connect_voice_usage_per_min;
                }
            } else if (ch.type === 'Chat') {
                cost += liveVol * 15 * p.connect_chat_usage_per_msg;
                if (ch.features.includes('chatbot')) {
                    cost += ch.volume * (ch.lexTurns || 8) * p.lex_text_turn;
                }
            }
        });
        return cost;
    };

    // 2. Yellow.ai Equivalent
    const calcYellow = () => {
        let cost = 0; 
        channels.forEach(ch => {
             const agenticMult = ch.features.includes('agentic') ? 1.25 : 1.0;
             if (ch.type === 'Voice') {
                // Only calculate IVR cost if feature is active
                if (ch.features.includes('convIVR')) {
                    let remaining = ch.volume * ch.aht;
                    YELLOW_AI_PRICING.conv_ivr_per_min_tiers.forEach((tier, i) => {
                        const prev = i === 0 ? 0 : YELLOW_AI_PRICING.conv_ivr_per_min_tiers[i-1].limit;
                        if (remaining > 0) {
                            const take = Math.min(remaining, tier.limit - prev);
                            cost += take * tier.price;
                            remaining -= take;
                        }
                    });
                }
                cost = cost * agenticMult;
             } else if (ch.type === 'Chat') {
                 const uncontained = ch.volume * ((100 - (ch.containment||0))/100);
                 if (ch.features.includes('chatbot')) cost += ch.volume * YELLOW_AI_PRICING.chatbot_per_conversation * agenticMult;
                 if (ch.features.includes('liveChat')) cost += uncontained * YELLOW_AI_PRICING.live_chat_per_conversation * agenticMult;
             }
        });
        return cost;
    };

    // 3. Kore.ai Equivalent
    const calcKore = () => {
        let cost = 0; 
        channels.forEach(ch => {
            const unitsPerSession = Math.ceil((ch.aht || 1) / 15);
            const totalUnits = ch.volume * unitsPerSession;
            const liveVol = ch.volume * ((100 - (ch.containment || 0)) / 100);
            const liveUnits = liveVol * unitsPerSession;

            if (ch.type === 'Voice') {
                if (ch.features.includes('convIVR')) cost += totalUnits * KORE_AI_PRICING.conv_ivr_session_15min;
                if (ch.features.includes('agentAssist')) cost += liveUnits * KORE_AI_PRICING.agent_assist_voice_session_15min; 
            } else if (ch.type === 'Chat') {
                if (ch.features.includes('chatbot')) cost += totalUnits * KORE_AI_PRICING.chatbot_session_15min;
                if (ch.features.includes('agentAssist')) cost += liveVol * KORE_AI_PRICING.agent_assist_chat_session_15min;
            }
        });
        return cost;
    };

    const costs = { aws: calcAws(), yellow: calcYellow(), kore: calcKore() };
    
    // FORCE SYNC: The "Current" card must always equal the bottom bar total
    const currentCost = calculations.totalTechMonthly;

    const others = Object.entries(costs)
        .filter(([key]) => key !== client.techStack)
        .map(([key, val]) => ({
            id: key,
            label: key === 'aws' ? 'Amazon Connect' : key === 'yellow' ? 'Yellow.ai' : 'Kore.ai',
            cost: val,
            diff: val - currentCost
        }));

    return { currentCost, others };
  }, [channels, client.techStack, calculations.totalTechMonthly]);


  // --- HANDLERS ---
  const addChannel = (type) => {
    const newId = Date.now().toString();
    const defaults_aws = {
      Voice: { name: 'Voice', type: 'Voice', volume: 10000, aht: 5, containment: 10, lexTurns: 5, systemComplexity: 1, contextChars: 5000, bedrockModel: 'sonnet', features: ['connect_voice_usage'] },
      Chat: { name: 'Chat', type: 'Chat', volume: 5000, aht: 0, containment: 20, lexTurns: 8, systemComplexity: 1, contextChars: 5000, bedrockModel: 'sonnet', features: ['connect_chat_usage'] },
      Email: { name: 'Email', type: 'Email', volume: 2000, aht: 0, containment: 0, lexTurns: 0, systemComplexity: 0, contextChars: 10000, bedrockModel: 'sonnet', features: ['emailMgmt'] }
    };
    const defaults_yellow = {
      Voice: { name: 'Voice', type: 'Voice', volume: 10000, aht: 5, containment: 10, lexTurns: 5, systemComplexity: 1, contextChars: 1000, features: ['convIVR'] },
      Chat: { name: 'Chat', type: 'Chat', volume: 5000, aht: 0, containment: 20, lexTurns: 8, systemComplexity: 1, contextChars: 1000, features: ['chatbot', 'liveChat'] },
    };
    const defaults_kore = {
      Voice: { name: 'Voice', type: 'Voice', volume: 10000, aht: 5, containment: 10, features: ['convIVR'] },
      Chat: { name: 'Chat', type: 'Chat', volume: 5000, aht: 0, containment: 20, features: ['chatbot'] },
    };
    let defaults;
    if (client.techStack === 'yellow') {
        defaults = defaults_yellow;
    } else if (client.techStack === 'kore') {
        defaults = defaults_kore;
    } else {
        defaults = defaults_aws;
    }
    if ((client.techStack === 'yellow' || client.techStack === 'kore') && type === 'Email') return;
    setChannels([...channels, { id: newId, ...defaults[type] }]);
  };

  const updateChannel = (id, field, value) => setChannels(channels.map(c => c.id === id ? { ...c, [field]: value } : c));
  
  const toggleFeature = (channelId, featureKey) => {
    let catalog;
    if (client.techStack === 'yellow') catalog = FEATURES_CATALOG_YELLOW_AI;
    else if (client.techStack === 'kore') catalog = FEATURES_CATALOG_KORE; // Add this
    else catalog = FEATURES_CATALOG;
    const featureDef = catalog[featureKey];
    if (featureDef && featureDef.isExperimental && !ENABLE_EXPERIMENTAL_FEATURES) return;
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    const newFeatures = channel.features.includes(featureKey) ? channel.features.filter(f => f !== featureKey) : [...channel.features, featureKey];
    updateChannel(channelId, 'features', newFeatures);
  };
  
  const removeChannel = (id) => setChannels(channels.filter(c => c.id !== id));

  const generateDefaultResources = () => {
    const newResources = [];
    // We only generate specific feature resources now, no general bucket
    channels.forEach(ch => {
        const isComplex = ch.features.some(f => ['convIVR', 'chatbot', 'agentAssist', 'qaAnalysis'].includes(f));
        if (isComplex) {
            // Find the first complex feature to attach resources to
            const feature = ch.features.find(f => ['convIVR', 'chatbot', 'agentAssist', 'qaAnalysis'].includes(f)) || 'Custom';
            
            // Dev
            newResources.push({
                id: Date.now() + Math.random(),
                roleId: 'cx_dev',
                channelId: ch.id,
                featureKey: feature,
                effort: 100,
                phase: 'Build',
                startWeek: 5, 
                weeks: 20, 
                quantity: 1
            });
            
            // Add PM/Arch/QA to this specific stream to keep them visible
            // Distribute or duplicate? Usually a PM covers the channel.
            newResources.push({ id: Date.now() + Math.random(), roleId: 'imp_pm', channelId: ch.id, featureKey: feature, effort: 50, phase: 'Discovery', startWeek: 1, weeks: 24, quantity: 1 });
            newResources.push({ id: Date.now() + Math.random(), roleId: 'cx_arch', channelId: ch.id, featureKey: feature, effort: 25, phase: 'Discovery', startWeek: 1, weeks: 24, quantity: 1 });
        }
    });

    // Fallback if no complex features but channels exist (basic setup)
    if (newResources.length === 0 && channels.length > 0) {
         const firstCh = channels[0];
         newResources.push({ id: Date.now(), roleId: 'cx_dev', channelId: firstCh.id, featureKey: firstCh.features[0] || 'All', effort: 100, phase: 'Build', startWeek: 1, weeks: 4, quantity: 1 });
    }

    setResources(newResources);
  };

  useEffect(() => {
      if (step === 3 && resources.length === 0) {
          generateDefaultResources();
      }
  }, [step]);

  const addResource = (channelId, featureKey) => {
    setResources([...resources, { id: Date.now(), roleId: 'cx_dev', channelId, featureKey, effort: 100, phase: 'Build', startWeek: 1, weeks: 4, quantity: 1 }]);
  };
  const removeResource = (id) => setResources(resources.filter(r => r.id !== id));
  const updateResource = (id, field, value) => setResources(resources.map(r => r.id === id ? { ...r, [field]: value } : r));

  const saveDeal = async () => {
    if (!user || !db) { alert("Demo Mode: Cannot save to database."); return; }
    setLoading(true);
    try {
      const dealData = { client, channels, resources, rateBand, financials: calculations, createdAt: new Date(), createdBy: user.uid };
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'deals'), dealData);
      alert('Deal logged successfully!');
    } catch (error) { console.error("Error saving deal", error); alert('Failed to save deal.'); } finally { setLoading(false); }
  };

  // --- EXPORT FUNCTIONS ---
  const exportImplementationCSV = () => {
    let csv = "Phase,Resource Role,Channel,Feature,Start Week,Duration (Wks),Quantity,Effort %,Monthly Rate,Total Cost\n";
    const sortedResources = [...resources].sort((a,b) => a.startWeek - b.startWeek);

    sortedResources.forEach(r => {
       const role = DEFAULT_ROLES.find(dr => dr.id === r.roleId);
       const ch = channels.find(c => c.id === r.channelId);
       const chName = ch ? `${ch.type} - ${ch.name}` : 'All Channels';
       const catalog = client.techStack === 'yellow' ? FEATURES_CATALOG_YELLOW_AI : FEATURES_CATALOG;
       const featureLabel = r.featureKey === 'All' ? 'General' : (catalog[r.featureKey]?.label || r.featureKey);
       const monthlyRate = (role?.monthlyRate || 0) * RATE_BANDS[rateBand];
       const weeklyRate = monthlyRate / 4;
       const totalCost = weeklyRate * r.weeks * (r.quantity || 1) * ((r.effort || 100)/100);

       csv += `${r.phase},${role?.label},${chName},${featureLabel},${r.startWeek},${r.weeks},${r.quantity},${r.effort}%,${pricing.currency}${monthlyRate.toFixed(2)},${pricing.currency}${totalCost.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `implementation_plan_${client.name}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const exportTechCostCSV = (mode) => {
    let csv = "";
    
    if (mode === 'single') {
        csv = "Metric,Value\n";
        csv += `Client,${client.name}\n`;
        csv += `Monthly Tech Run,${pricing.currency}${calculations.totalTechMonthly.toFixed(2)}\n`;
        csv += `1-Year TCO,${pricing.currency}${calculations.oneYearTCO.toFixed(2)}\n`;
        csv += `3-Year TCO,${pricing.currency}${calculations.threeYearTCO.toFixed(2)}\n`;
    } else {
        const goLiveWeek = Math.max(...resources.map(r => r.startWeek + r.weeks), 1);
        const goLiveMonth = Math.ceil(goLiveWeek / 4);
        
        csv += "Stream,Category,Metric,Unit,";
        for (let m = 1; m <= 36; m++) csv += `M${m},`;
        csv += "Year 1,Year 2,Year 3\n";

        // Generate Rows for Channels
        channels.forEach(ch => {
            const chName = `${ch.type} - ${ch.name}`;
            const targetCont = ch.containment || 0;
            const vol = ch.volume;
            
            // Helper to get containment for a month
            const getCont = (m) => {
                if (m < goLiveMonth) return 0;
                const monthsLive = m - goLiveMonth + 1;
                const rampMonths = 6;
                if (monthsLive <= rampMonths && targetCont > 0) return (targetCont * monthsLive) / rampMonths;
                return targetCont;
            };

            // ROW 1: Total Volume
            let rowStr = `${chName},Driver,Total Volume,Count,`;
            for(let m=1; m<=36; m++) rowStr += `${vol},`;
            csv += `${rowStr}${vol*12},${vol*12},${vol*12}\n`;

            // ROW 2: Benefit %
            rowStr = `${chName},Benefit,Containment %,%,`;
            for(let m=1; m<=36; m++) rowStr += `${getCont(m).toFixed(1)}%,`;
            csv += `${rowStr}Avg,Avg,Avg\n`;

            // ROW 3: Revised Volume (Live Agents)
            rowStr = `${chName},Driver,Live Volume,Count,`;
            let y1=0, y2=0, y3=0;
            for(let m=1; m<=36; m++) {
                const live = vol * (1 - (getCont(m)/100));
                rowStr += `${Math.round(live)},`;
                if(m<=12) y1+=live; else if(m<=24) y2+=live; else y3+=live;
            }
            csv += `${rowStr}${Math.round(y1)},${Math.round(y2)},${Math.round(y3)}\n`;

            // ROW 4: AHT (if Voice)
            if (ch.type === 'Voice') {
                rowStr = `${chName},Driver,AHT,Min,`;
                for(let m=1; m<=36; m++) rowStr += `${ch.aht},`;
                csv += `${rowStr}${ch.aht},${ch.aht},${ch.aht}\n`;
            }

            // COST ROWS PER FEATURE
            ch.features.forEach(f => {
                // Skip generic labels if needed, or map to user friendly names
                const label = (client.techStack === 'yellow' ? FEATURES_CATALOG_YELLOW_AI[f] : FEATURES_CATALOG[f])?.label || f;
                
                rowStr = `${chName},Cost,${label},${pricing.currency},`;
                let fy1=0, fy2=0, fy3=0;

                for(let m=1; m<=36; m++) {
                    const currentCont = getCont(m);
                    const liveVol = vol * (1 - (currentCont/100));
                    const containedVol = vol - liveVol;
                    let cost = 0;

                    if (client.techStack === 'aws') {
                        const p = pricing;
                        if (f === 'connect_voice_usage') cost = liveVol * ch.aht * p.connect_voice_usage_per_min + (containedVol * 2.0 * p.connect_voice_usage_per_min); 
                        else if (f === 'telephony') cost = liveVol * ch.aht * p.telephony_per_min;
                        else if (f === 'connect_chat_usage') cost = liveVol * 15 * p.connect_chat_usage_per_msg;
                        else if (f === 'convIVR') cost = vol * (ch.lexTurns||0) * p.lex_speech_turn;
                        else if (f === 'chatbot') cost = vol * (ch.lexTurns||0) * p.lex_text_turn;
                        else if (f === 'agentAssist') cost = liveVol * (ch.type==='Voice' ? ch.aht : 15) * (ch.type==='Voice' ? p.agent_assist_voice_min : p.agent_assist_chat_msg);
                        // ... simplified for others
                    } else {
                        // Yellow
                        const yp = YELLOW_AI_PRICING;
                        const mult = ch.features.includes('agentic') ? 1.25 : 1.0;
                        if (f === 'chatbot') cost = vol * yp.chatbot_per_conversation * mult;
                        else if (f === 'liveChat') cost = liveVol * yp.live_chat_per_conversation * mult;
                        else if (f === 'convIVR') cost = (vol * ch.aht * 0.10) * mult; // Avg tier
                    }
                    
                    if (m < goLiveMonth) cost = 0; // No cost before go-live
                    
                    rowStr += `${cost.toFixed(2)},`;
                    if(m<=12) fy1+=cost; else if(m<=24) fy2+=cost; else fy3+=cost;
                }
                csv += `${rowStr}${fy1.toFixed(2)},${fy2.toFixed(2)},${fy3.toFixed(2)}\n`;
            });
        });
        
        if (calculations.platformCost > 0) {
             csv += "Platform,Cost,License Fee,Fixed,";
             let val = calculations.platformCost;
             for (let m = 1; m <= 36; m++) csv += `${val},`;
             csv += `${val*12},${val*12},${val*12}\n`;
        }
    }

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tech_cost_${mode}_${client.name}.csv`);
    document.body.appendChild(link);
    link.click();
    setShowExportModal(false);
  };

  // Check Step 1 Validity
  const isStep1Valid = useMemo(() => {
    return client.name.trim() !== '' && client.email.trim() !== '' && client.teamMember.trim() !== '';
  }, [client]);

  // ... (renderStep1, renderStep2 same as before) ...
  const renderStep1 = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-xl font-bold text-slate-800">Client Intake</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="h-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Client Name <span className="text-red-500">*</span></label>
          <input type="text" className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-12 ${client.name === '' ? 'border-amber-300 bg-amber-50' : 'border-slate-300'}`} placeholder="e.g., Acme Corp" value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} />
        </div>
        <div className="h-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Prepared By (Email) <span className="text-red-500">*</span></label>
          <input type="email" className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-12 ${client.email === '' ? 'border-amber-300 bg-amber-50' : 'border-slate-300'}`} placeholder="e.g., your.name@company.com" value={client.email} onChange={(e) => setClient({...client, email: e.target.value})} />
        </div>
        <div className="h-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Prepared By (Name) <span className="text-red-500">*</span></label>
          <input type="text" className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-12 ${client.teamMember === '' ? 'border-amber-300 bg-amber-50' : 'border-slate-300'}`} placeholder="e.g., Jane Smith" value={client.teamMember} onChange={(e) => setClient({...client, teamMember: e.target.value})} />
        </div>
        <div className="h-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Tech Stack</label>
          <div className="h-12">
            <select className="w-full h-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={client.techStack} onChange={(e) => { const newStack = e.target.value; setClient({...client, techStack: newStack}); setChannels([]); }}>
                <option value="aws">Amazon Connect (AWS)</option>
                <option value="yellow">Yellow.ai</option>
                <option value="kore">Kore.ai </option>
            </select>
          </div>
        </div>
        {client.techStack === 'aws' && (
          <div className="md:col-span-2 h-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white h-12" value={client.region} onChange={(e) => setClient({...client, region: e.target.value})}>
              <option value="US">United States (USD)</option>
              <option value="UK">United Kingdom (GBP)</option>
            </select>
          </div>
        )}
      </div>
      {!isStep1Valid && <div className="flex items-center gap-2 text-amber-600 text-sm mt-4 bg-amber-50 p-3 rounded-lg border border-amber-200"><Info size={16}/> Please fill in all required fields marked with * to proceed.</div>}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* (Keep Step 2 exactly as previous file - standard layout) */}
      <div className="flex justify-between items-center pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
             {client.techStack === 'aws' ? <img src="https://logo.clearbit.com/aws.amazon.com" className="h-10 w-auto object-contain" alt="AWS Logo"/> : client.techStack === 'yellow' ? <img src="https://logo.clearbit.com/yellow.ai" className="h-8 w-auto object-contain" alt="Yellow.ai Logo"/> :client.techStack === 'kore' ? <img src="https://logo.clearbit.com/kore.ai" className="h-8 w-auto object-contain" alt="Kore.ai Logo"/>: null}
             <div><h3 className="text-xl font-bold text-slate-800">Tech Inputs & Channels</h3><p className="text-xs text-slate-500 font-medium">Configure your {client.techStack === 'aws' ? 'Amazon Connect' : 'Yellow.ai'} instance</p></div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowCompare(!showCompare)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showCompare ? 'bg-slate-800 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><ArrowLeftRight size={16} /><span className="hidden md:inline">{showCompare ? 'Hide Comparison' : 'Compare Costs'}</span></button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <button onClick={() => addChannel('Voice')} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100"><Mic size={16}/> <span className="hidden md:inline">Voice</span></button>
          <button onClick={() => addChannel('Chat')} className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100"><MessageSquare size={16}/> <span className="hidden md:inline">Chat</span></button>
          <button onClick={() => addChannel('Email')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${(client.techStack === 'yellow' || client.techStack === 'kore') ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`} disabled={client.techStack === 'yellow'|| client.techStack === 'kore'}><Mail size={16}/> <span className="hidden md:inline">Email</span></button>
        </div>
      </div>
      {showCompare && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
           <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
             <ArrowLeftRight size={16}/> Cost Comparison Analysis
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Current Stack */}
              <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-md relative z-10">
                  <div className="absolute -top-3 left-4 bg-slate-800 text-white text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider">Selected</div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">Current ({client.techStack})</span>
                  <div className="text-2xl font-bold text-slate-800 font-mono mt-1">
                    {pricing.currency}{comparisonCalculations.currentCost.toLocaleString(undefined, {maximumFractionDigits:0})}
                  </div>
                  <span className="text-xs text-slate-500">Monthly Run Rate</span>
              </div>

              {/* Other Stacks */}
              {comparisonCalculations.others.map((other) => (
                  <div key={other.id} className={`p-4 rounded-lg border shadow-sm ${other.diff < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <span className={`text-xs font-semibold uppercase ${other.diff < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {other.label}
                      </span>
                      <div className={`text-2xl font-bold font-mono mt-1 ${other.diff < 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {pricing.currency}{other.cost.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                          <span className={`text-xs font-bold ${other.diff < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {other.diff < 0 ? '-' : '+'}{pricing.currency}{Math.abs(other.diff).toLocaleString(undefined, {maximumFractionDigits:0})}
                          </span>
                          <span className="text-[10px] text-slate-400">vs Current</span>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      )}
      <div className="space-y-6">
        {channels.map((ch, index) => {
            // Simplify map rendering for readability in this update, keeping logic identical
            return (
              <div key={ch.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className={`p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between ${ch.type === 'Voice' ? 'bg-blue-50' : ch.type === 'Chat' ? 'bg-green-50' : 'bg-purple-50'}`}>
                  <div className="flex items-center gap-3 flex-1">
                    {ch.type === 'Voice' && <div className="p-2 bg-blue-200 rounded-full text-blue-700"><Mic size={18}/></div>}
                    {ch.type === 'Chat' && <div className="p-2 bg-green-200 rounded-full text-green-700"><MessageSquare size={18}/></div>}
                    {ch.type === 'Email' && <div className="p-2 bg-purple-200 rounded-full text-purple-700"><Mail size={18}/></div>}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input type="text" className="bg-transparent font-bold text-slate-800 text-lg border-b border-transparent hover:border-slate-400 focus:border-blue-500 outline-none px-1" value={ch.name} onChange={(e) => updateChannel(ch.id, 'name', e.target.value)} />
                        <Edit2 size={14} className="text-slate-400"/>
                      </div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider ml-1">{ch.type} Channel</span>
                    </div>
                  </div>
                  <button onClick={() => removeChannel(ch.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                </div>
                {/* ... Inputs ... (Abbreviated to keep response focused on Step 3 logic) */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Monthly Volume</label>
                        <input type="number" className="w-full mt-2 p-2 border border-slate-300 rounded" value={ch.volume} onChange={(e) => updateChannel(ch.id, 'volume', parseInt(e.target.value)||0)} />
                    </div>
                    {ch.type === 'Voice' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">AHT (Min)</label>
                            <input type="number" step="0.1" className="w-full mt-2 p-2 border border-slate-300 rounded" value={ch.aht} onChange={(e) => updateChannel(ch.id, 'aht', parseFloat(e.target.value)||0)} />
                        </div>
                    )}
                    {ch.type !== 'Email' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Containment ({ch.containment}%)</label>
                            <input type="range" min="0" max="100" className="w-full mt-2 h-2 bg-slate-200 rounded-lg cursor-pointer" value={ch.containment||0} onChange={(e) => updateChannel(ch.id, 'containment', parseInt(e.target.value))} />
                        </div>
                    )}
                    {/* Features */}
                    {(ch.features.includes('convIVR') || ch.features.includes('chatbot') || ch.features.includes('bedrock')) && (
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                            
                            {/* Card 1: Conversation Complexity */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-white p-1.5 rounded-md border border-slate-200 shadow-sm text-purple-600">
                                        <Activity size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Conv. Complexity</h4>
                                        <p className="text-[10px] text-slate-400">Avg. turns per session</p>
                                    </div>
                                    <div className="ml-auto bg-white border border-slate-200 px-2 py-1 rounded text-xs font-bold text-slate-700 shadow-sm">
                                        {ch.lexTurns || 5}
                                    </div>
                                </div>
                                
                                <input 
                                    type="range" min="1" max="20" 
                                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-purple-600" 
                                    value={ch.lexTurns || 5} 
                                    onChange={(e) => updateChannel(ch.id, 'lexTurns', parseInt(e.target.value))} 
                                />
                                
                                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100 flex gap-2 items-start">
                                    <Info size={14} className="text-purple-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-purple-700 leading-tight">
                                        <strong>Tip:</strong> A typical 5-min service call has ~10-15 conversation turns. Simple routing needs 3-5 turns.
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Agentic Framework (Bedrock) */}
                            {ch.features.includes('bedrock') && (
                                <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-amber-200 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">Active</div>
                                    
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-white p-1.5 rounded-md border border-amber-200 shadow-sm text-amber-600">
                                            <BrainCircuit size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Agentic Framework</h4>
                                            <p className="text-[10px] text-amber-700/70">System complexity & token usage</p>
                                        </div>
                                    </div>

                                    {/* Model Selection */}
                                    <div className="mb-4">
                                        <label className="text-[9px] font-bold text-amber-800/60 uppercase tracking-wide block mb-1">Model Selection</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full p-2 bg-white border border-amber-200 rounded text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-400/50 appearance-none"
                                                value={ch.bedrockModel || 'sonnet'}
                                                onChange={(e) => updateChannel(ch.id, 'bedrockModel', e.target.value)}
                                            >
                                                {Object.entries(BEDROCK_MODELS).map(([k, v]) => (
                                                    <option key={k} value={k}>{v.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400">
                                                <ChevronRight size={12} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sliders */}
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <label className="text-[9px] font-bold text-amber-800/60 uppercase">Context Window</label>
                                                <span className="text-[9px] font-bold text-slate-600">{ch.contextChars || 5000} chars</span>
                                            </div>
                                            <input 
                                                type="range" min="1000" max="50000" step="1000"
                                                className="w-full h-1.5 bg-amber-200/50 rounded-lg cursor-pointer accent-amber-600" 
                                                value={ch.contextChars || 5000} 
                                                onChange={(e) => updateChannel(ch.id, 'contextChars', parseInt(e.target.value))} 
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Token Estimator Footer */}
                                    <div className="mt-4 pt-3 border-t border-amber-200/50 grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <span className="block text-[8px] font-bold text-amber-800/50 uppercase">Input Tokens</span>
                                            <span className="font-mono font-bold text-xs text-slate-700">{((ch.contextChars || 5000)/4).toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] font-bold text-amber-800/50 uppercase">Output Tokens</span>
                                            <span className="font-mono font-bold text-xs text-slate-700">{((ch.contextChars || 5000)/4 * 0.2).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="md:col-span-3 border-t border-slate-100 pt-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">Features</label>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(client.techStack === 'yellow' ? FEATURES_CATALOG_YELLOW_AI :client.techStack === 'kore' ? FEATURES_CATALOG_KORE : FEATURES_CATALOG).map(([key, feature]) => {
                                if (!feature.channels.includes(ch.type)) return null;
                                // 2. EXPERIMENTAL CHECK (Add this logic)
                                // If feature is experimental AND the global flag is false, do not render it.
                                if (feature.isExperimental && !ENABLE_EXPERIMENTAL_FEATURES) return null;
                                const isSelected = ch.features.includes(key);
                                const Icon = feature.icon;
                                return (
                                    <button key={key} onClick={() => toggleFeature(ch.id, key)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                                        <Icon size={12} /> {feature.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Group Active Features to Create Cards
    const activeStreams = [];
    const catalog = client.techStack === 'yellow' ? FEATURES_CATALOG_YELLOW_AI :client.techStack === 'kore' ? FEATURES_CATALOG_KORE : FEATURES_CATALOG;

    channels.forEach(ch => {
        ch.features.forEach(fKey => {
            const feature = catalog[fKey];
            if (feature) {
                activeStreams.push({
                    id: `${ch.id}-${fKey}`,
                    channelId: ch.id,
                    featureKey: fKey,
                    label: `${ch.type} - ${feature.label}`,
                    channelName: ch.name
                });
            }
        });
    });

    // NOTE: Removed "General / Governance" stream per user request

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Resource Planning</h3>
                    <p className="text-sm text-slate-500">Plan resources for each active feature stream.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => generateDefaultResources()} className="flex items-center gap-2 text-sm bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-200"><Briefcase size={16}/> Auto-Plan</button>
                </div>
            </div>

            <div className="space-y-6">
                {activeStreams.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
                        No active features found. Go back to Step 2 and select features for your channels.
                    </div>
                ) : (
                    activeStreams.map(stream => {
                        const streamResources = resources.filter(r => r.channelId === stream.channelId && r.featureKey === stream.featureKey);
                        // FIXED: Added Card-wise Totals here
                        const cardTotal = streamResources.reduce((acc, res) => {
                            const role = DEFAULT_ROLES.find(r => r.id === res.roleId);
                            const cost = (role?.monthlyRate || 0) * RATE_BANDS[rateBand] / 4 * res.weeks * (res.quantity||1) * ((res.effort||100)/100);
                            return acc + cost;
                        }, 0);

                        return (
                            <div key={stream.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                            <Layers size={16} className="text-blue-500"/> {stream.label}
                                        </h4>
                                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">
                                            {pricing.currency}{cardTotal.toLocaleString(undefined, {maximumFractionDigits:0})}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => addResource(stream.channelId, stream.featureKey)}
                                        className="text-xs bg-white border border-slate-200 px-2 py-1 rounded hover:bg-blue-50 text-blue-600 font-medium flex items-center gap-1"
                                    >
                                        <Plus size={12}/> Add Resource
                                    </button>
                                </div>
                                
                                {streamResources.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm italic">
                                        No resources assigned to this stream yet.
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100 text-xs uppercase tracking-wide">
                                            <tr>
                                                <th className="p-3 pl-4 w-48">Role</th>
                                                <th className="p-3 w-32">Phase</th>
                                                <th className="p-3 w-20">Start Wk</th>
                                                <th className="p-3 w-20">Weeks</th>
                                                <th className="p-3 w-16">Qty</th>
                                                <th className="p-3 w-20">Effort %</th>
                                                <th className="p-3 w-28 text-right">Cost</th>
                                                <th className="p-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {streamResources.map(res => {
                                                const role = DEFAULT_ROLES.find(r => r.id === res.roleId);
                                                const cost = (role?.monthlyRate || 0) * RATE_BANDS[rateBand] / 4 * res.weeks * (res.quantity||1) * ((res.effort||100)/100);
                                                return (
                                                    <tr key={res.id} className="group hover:bg-slate-50/50">
                                                        <td className="p-3 pl-4">
                                                            <select value={res.roleId} onChange={(e) => updateResource(res.id, 'roleId', e.target.value)} className="w-full bg-transparent outline-none cursor-pointer font-medium text-slate-700 text-xs">
                                                                {DEFAULT_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="p-3">
                                                            <select value={res.phase} onChange={(e) => updateResource(res.id, 'phase', e.target.value)} className={`w-full border-none rounded px-2 py-1 outline-none text-[10px] font-bold uppercase tracking-wide ${PHASE_BG_COLORS[res.phase]}`}>
                                                                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="p-3"><input type="number" min="1" className="w-16 p-1 border border-slate-200 rounded text-center text-xs" value={res.startWeek} onChange={(e) => updateResource(res.id, 'startWeek', parseInt(e.target.value))} /></td>
                                                        <td className="p-3"><input type="number" min="1" className="w-16 p-1 border border-slate-200 rounded text-center text-xs" value={res.weeks} onChange={(e) => updateResource(res.id, 'weeks', parseInt(e.target.value))} /></td>
                                                        <td className="p-3"><input type="number" min="1" className="w-12 p-1 border border-slate-200 rounded text-center text-xs" value={res.quantity} onChange={(e) => updateResource(res.id, 'quantity', parseInt(e.target.value))} /></td>
                                                        <td className="p-3"><input type="number" min="1" max="100" className="w-14 p-1 border border-slate-200 rounded text-center text-xs" value={res.effort||100} onChange={(e) => updateResource(res.id, 'effort', parseInt(e.target.value))} /></td>
                                                        <td className="p-3 text-right font-mono text-xs font-bold text-slate-600">{pricing.currency}{cost.toLocaleString(undefined,{maximumFractionDigits:0})}</td>
                                                        <td className="p-3 text-center"><button onClick={() => removeResource(res.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <ImplementationGantt resources={resources} channels={channels} techStack={client.techStack} />
        </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* ... (Keep Step 4 Summary cards and chart) ... */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Estimation Complete</h2>
        <p className="text-slate-500">Review the Total Cost of Ownership (TCO) below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Year 1 TCO</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{pricing.currency}{calculations.year1Only.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
          <span className="text-[10px] text-slate-400 mt-2">Includes Impl. + Platform + One-time</span>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-blue-600 text-sm font-medium uppercase tracking-wide">Year 2 TCO</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{pricing.currency}{calculations.year2Only.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
          <span className="text-[10px] text-blue-400 mt-2">Usage + Platform Fees</span>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center text-white">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Year 3 TCO</p>
          <p className="text-3xl font-bold mt-2">{pricing.currency}{calculations.year3Only.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
          <span className="text-[10px] text-slate-500 mt-2">Usage + Platform Fees</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 h-80">
        <h3 className="text-sm font-semibold text-slate-600 mb-4">Cost Drivers (Monthly Usage + Fixed Fees)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { name: 'Voice Usage', value: calculations.voiceCost }, 
            { name: 'Digital/Msg', value: calculations.digitalCost }, 
            { name: 'AI & Auto', value: calculations.aiCost }, 
            // FIXED: Map to Annual or One-Time fees specifically
            { 
                name: 'Annual Platf.', 
                value: calculations.annualPlatformFees, // Shows full 40k for Kore
                fill: '#f59e0b' // Amber
            },
            { 
                name: '1-Time/Exp.', 
                value: calculations.oneTimeFees, // Shows 20k for Kore, 10k for Yellow
                fill: '#ef4444' // Red
            },
          ]}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${pricing.currency}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
            <RechartsTooltip 
                cursor={{fill: '#f1f5f9'}} 
                formatter={(val, name) => [
                    `${pricing.currency}${val.toLocaleString(undefined, {maximumFractionDigits:0})}`,
                    name
                ]}
            />
            {/* Standard Bar mapping with colors */}
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
               {
                 [
                   { fill: '#3b82f6' }, // Voice
                   { fill: '#10b981' }, // Digital
                   { fill: '#8b5cf6' }, // AI
                   { fill: '#f59e0b' }, // Annual
                   { fill: '#ef4444' }  // One-time
                 ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)
               }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Export Options */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="flex gap-4">
            <button onClick={saveDeal} disabled={loading} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-colors font-medium">
                {loading ? 'Saving...' : <><Save size={20}/> Log Deal to DB</>}
            </button>
            <button onClick={exportImplementationCSV} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                <Download size={20}/> Export Implementation Plan
            </button>
            <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Table size={20}/> Export Tech Cost
            </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-[400px] shadow-2xl animate-in fade-in zoom-in-95">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Export Tech Cost Configuration</h3>
                  <p className="text-slate-500 text-sm mb-6">Choose how you want to export the technology run costs.</p>
                  
                  <div className="space-y-3">
                      <button onClick={() => exportTechCostCSV('single')} className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group text-left">
                          <div>
                              <div className="font-bold text-slate-700 group-hover:text-blue-700">Summary Export</div>
                              <div className="text-xs text-slate-400">Single year summary and TCO totals.</div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500"/>
                      </button>
                      <button onClick={() => exportTechCostCSV('full')} className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group text-left">
                          <div>
                              <div className="font-bold text-slate-700 group-hover:text-blue-700">Full 3-Year Ramp</div>
                              <div className="text-xs text-slate-400">Detailed month-by-month breakdown (M1-M36) with benefit ramp.</div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500"/>
                      </button>
                  </div>
                  <button onClick={() => setShowExportModal(false)} className="mt-6 w-full py-2 text-sm text-slate-500 hover:text-slate-800">Cancel</button>
              </div>
          </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 flex">
      {/* Main Content Wrapper with Transition for Sidebar Push */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${showBreakdown ? 'translate-x-[-200px]' : 'translate-x-0'}`}>
      
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
                onClick={() => {
                  // Only allow jumping back, or jumping forward if valid
                  if (s < step || (s === 2 && isStep1Valid) || s > 2) {
                    setStep(s)
                  }
                }}
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

        {/* Container for Content + Sticky Bar */}
        <div className="flex flex-col min-h-[calc(100vh-12rem)] relative">
            {/* Card Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 mb-8">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </div>

            {/* Sticky Bottom Bar - Now inside the container so it aligns perfectly */}
            <div className="sticky bottom-6 z-40 mt-auto">
                <div className="w-full bg-slate-900/95 backdrop-blur-xl text-white px-8 py-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-slate-700/50 flex items-center justify-between">
                    
                    {/* Total Cost - Dynamic Label based on Step */}
                    {/* Total Cost - Dynamic Logic */}
                    <div className="flex items-center gap-8">
                        {step === 4 ? (
                            /* --- STEP 4 VIEW: SHOW BOTH TOTALS --- */
                            <>
                                <div>
                                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Total Monthly Tech</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-extrabold font-mono tracking-tighter text-white drop-shadow-sm">
                                            {pricing.currency}{calculations.totalTechMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden md:block border-l border-slate-700 pl-8">
                                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Total Implementation</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-extrabold font-mono tracking-tighter text-emerald-400 drop-shadow-sm">
                                            {pricing.currency}{calculations.implCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* --- STEPS 1-3 VIEW: STANDARD + BREAKDOWN --- */
                            <>
                                <div>
                                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                                        {step === 3 ? "Total Implementation" : "Total Monthly Tech"}
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-extrabold font-mono tracking-tighter text-white drop-shadow-sm">
                                            {pricing.currency}{(step === 3 ? calculations.implCost : calculations.totalTechMonthly).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>

                                {/* Metrics Breakdown (Hidden on mobile) */}
                                <div className="hidden lg:flex gap-8 border-l border-slate-700 pl-8">
                                    <div>
                                        <span className="block text-[10px] text-slate-500 uppercase font-extrabold mb-1">Voice</span>
                                        <span className="font-mono font-bold text-lg text-slate-300">{pricing.currency}{calculations.voiceCost.toFixed(0)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-500 uppercase font-extrabold mb-1">Digital</span>
                                        <span className="font-mono font-bold text-lg text-slate-300">{pricing.currency}{calculations.digitalCost.toFixed(0)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-500 uppercase font-extrabold mb-1">AI/Bot</span>
                                        <span className="font-mono font-bold text-lg text-emerald-400">{pricing.currency}{calculations.aiCost.toFixed(0)}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Navigation & Actions */}
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        <button 
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        disabled={step === 1}
                        className={`p-3 rounded-xl transition-all border border-slate-700 ${step === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-300'}`}
                        >
                        <ArrowLeft size={20} />
                        </button>

                        {/* Next Button */}
                        {step < 4 ? (
                        <button 
                            onClick={() => {
                              // Validation check for Step 1
                              if (step === 1 && !isStep1Valid) return;
                              setStep(s => Math.min(4, s + 1));
                            }}
                            disabled={step === 1 && !isStep1Valid}
                            className={`flex items-center gap-2 font-bold px-6 py-3 rounded-xl shadow-lg transition-all ${
                              step === 1 && !isStep1Valid 
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25 active:scale-95'
                            }`}
                        >
                            <span>Next Step</span>
                            <ArrowRight size={18} />
                        </button>
                        ) : (
                        <button 
                            onClick={saveDeal}
                            disabled={loading}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-emerald-500/25 active:scale-95 transition-all"
                        >
                            <Save size={18} />
                            <span>{loading ? 'Saving...' : 'Save Deal'}</span>
                        </button>
                        )}

                        {/* Cost DNA Toggle */}
                        <button 
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className={`p-3 rounded-xl border border-slate-600 transition-all ${showBreakdown ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
                        title="Toggle Cost DNA"
                        >
                        <Info size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* Sidebar Component (Outside the main wrapper but inside the flex container) */}
      <CostBreakdownSidebar 
        isOpen={showBreakdown} 
        onClose={() => setShowBreakdown(false)}
        channels={channels}
        pricing={pricing}
        techStack={client.techStack} // Added techStack prop
        calculations={calculations}
      />
    </div>
  );
};

// ... (Dashboard Component same as previous, ensured present) ...
const Dashboard = ({ user }) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'deals'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedDeals = snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date() }));
        setDeals(fetchedDeals);
        setLoading(false);
      }, (error) => { console.error("Error fetching deals:", error); setLoading(false); });
      return () => unsubscribe();
    } catch (e) { console.warn("Failed to subscribe to deals", e); setLoading(false); }
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto p-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold text-slate-800">Pipeline Dashboard</h1><p className="text-slate-500">View and manage your saved cost estimations</p></div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-600 text-sm flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>{user ? 'Connected' : 'Guest Mode'}</div>
      </div>
      {loading ? ( <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div><p className="text-slate-400">Loading pipeline data...</p></div> ) : deals.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-12 text-center"><div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><LayoutDashboard size={32}/></div><h3 className="text-xl font-bold text-blue-900 mb-2">No deals found</h3><p className="text-blue-600 mb-6 max-w-md mx-auto">You haven't saved any estimations yet. Create a new cost estimate to see it appear here.</p></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4"><div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><FileText size={24}/></div><span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{deal.createdAt.toLocaleDateString()}</span></div>
              <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{deal.client.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4"><span className="uppercase font-semibold tracking-wide">{deal.client.techStack === 'yellow' ? 'Yellow.ai' : 'Amazon Connect'}</span><span>•</span><span>{deal.channels.length} Channels</span></div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-end"><div><p className="text-[10px] uppercase text-slate-400 font-bold">Monthly Run</p><p className="text-xl font-bold text-slate-900 font-mono">{deal.financials?.totalTechMonthly?.toLocaleString(undefined, {style:'currency', currency:'USD', maximumFractionDigits:0})}</p></div><div className="text-right"><p className="text-[10px] uppercase text-slate-400 font-bold">1-Year TCO</p><p className="text-sm font-semibold text-emerald-600 font-mono">{deal.financials?.oneYearTCO?.toLocaleString(undefined, {style:'currency', currency:'USD', maximumFractionDigits:0})}</p></div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [user, setUser] = useState(null);
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
      <main className="flex-1 ml-20 lg:ml-64 transition-all duration-300 relative">
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'calculator' && <EstimatorWizard user={user} pricing={pricing} setGlobalPricing={setPricing} />}
        {activeTab === 'knowledge' && <KnowledgeBase pricing={pricing} />}
      </main>
    </div>
  );
}