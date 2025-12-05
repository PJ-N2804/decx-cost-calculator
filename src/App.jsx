import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calculator, Users, FileText, Settings, Save, Download, 
  Plus, Trash2, ChevronRight, CheckCircle, Database, LayoutDashboard,
  Mic, MessageSquare, Mail, Server, Cpu, Activity, Zap, BrainCircuit, Edit2, Globe, Boxes, Info, X, HelpCircle, Calendar, Link as LinkIcon, Layers, ArrowLeft, ArrowRight,
  Phone, MessageSquarePlus, Lock
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, getDocs, doc, setDoc, query, orderBy, onSnapshot 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- CONFIGURATION ---
// Set this to FALSE for your Production deployment
// Set this to TRUE for your Dev/Staging deployment
// Check for Vite (import.meta.env) or Create-React-App (process.env) variables
const ENABLE_EXPERIMENTAL_FEATURES = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ENABLE_EXPERIMENTAL === 'true') || 
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ENABLE_EXPERIMENTAL === 'true');

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
  storage_per_gb: 0.023
};

const YELLOW_AI_PRICING = {
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
    storage_per_gb: 0.023
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
    storage_per_gb: 0.025
  }
};

const FEATURES_CATALOG = {
  connect_voice_usage: { label: 'Connect Voice Usage', channels: ['Voice'], icon: Phone },
  telephony: { label: 'Telephony DID/Toll-Free', channels: ['Voice'], icon: Zap },
  connect_chat_usage: { label: 'Connect Chat Usage', channels: ['Chat'], icon: MessageSquarePlus },
  
  // Experimental Features
  translate: { label: 'Real-time Translation', channels: ['Voice', 'Chat'], icon: Globe, isExperimental: true },
  
  convIVR: { label: 'Conversational IVR (Lex)', channels: ['Voice'], icon: Cpu },
  chatbot: { label: 'Chatbot Automation', channels: ['Chat'], icon: Cpu },
  emailMgmt: { label: 'Email Management (Routing)', channels: ['Email'], icon: Mail },
  contactLens: { label: 'Contact Lens (Analytics)', channels: ['Voice', 'Chat'], icon: Activity },
  agentAssist: { label: 'Agent Assist (Q/Wisdom)', channels: ['Voice', 'Chat'], icon: BrainCircuit },
  
  // Experimental Features
  bedrock: { label: 'Agentic Framework (Bedrock)', channels: ['Voice', 'Chat', 'Email'], icon: Server, isExperimental: true },
  
  storage: { label: 'Recording / Archiving', channels: ['Voice', 'Chat', 'Email'], icon: Database },
};

const FEATURES_CATALOG_YELLOW_AI = {
  convIVR: { label: 'Conversational IVR', channels: ['Voice'], icon: Cpu },
  chatbot: { label: 'Chatbot', channels: ['Chat'], icon: Cpu },
  liveChat: { label: 'Live Chat', channels: ['Chat'], icon: MessageSquare },
  agentic: { label: 'Agentic Framework', channels: ['Voice', 'Chat'], icon: Server },
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
          {techStack === 'yellow' && channels.length > 0 && (
             <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm bg-gradient-to-r from-yellow-50 to-white">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Server size={14} className="text-yellow-600"/> Platform Fee
                    </h4>
                    <span className="font-mono font-bold text-slate-800">{curr}{YELLOW_AI_PRICING.platform_fee.toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-6">Base platform license fee</p>
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
                        <span className="text-[10px] text-slate-400 font-medium">{ch.aht}m/call</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-slate-800">{curr}{(ch.volume * ch.aht * pricing.connect_voice_usage_per_min).toFixed(2)}</span>
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
                           {((ch.volume * (ch.lexTurns || 1) * (((ch.contextChars || 0) + ((ch.systemComplexity || 0) * 1000))/4))).toLocaleString()} tot. tokens
                         </span>
                         <span className="font-mono font-bold text-amber-800">
                           {curr}{(
                            (ch.volume * (ch.lexTurns || 1) * (((ch.contextChars || 0) + ((ch.systemComplexity || 0) * 1000))/4/1000) * modelPricing.input) + 
                            (ch.volume * (ch.lexTurns || 1) * (((ch.contextChars || 0) + ((ch.systemComplexity || 0) * 1000))/4/1000 * 0.2) * modelPricing.output) 
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

const ImplementationGantt = ({ resources, channels }) => {
  const [viewMode, setViewMode] = useState('resource'); 

  const maxWeeks = useMemo(() => {
    if (!resources || resources.length === 0) return 12;
    return Math.max(...resources.map(r => (r.startWeek || 1) + (r.weeks || 4)), 12);
  }, [resources]);

  const months = Math.ceil(maxWeeks / 4);

  const resourcesByChannel = useMemo(() => {
    if (!resources || resources.length === 0) return {};
    const grouped = {};
    channels.forEach(ch => { grouped[`${ch.type} (${ch.name})`] = []; });
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

const EstimatorWizard = ({ user, pricing, setGlobalPricing }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false); 
  
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
    let totalPlatformCost = 0;

    if (client.techStack === 'aws') {
      channels.forEach(ch => {
        const containedVol = ch.volume * (ch.containment / 100);
        const liveVol = ch.volume - containedVol;
        const modelPricing = BEDROCK_MODELS[ch.bedrockModel || 'sonnet'];
        const hasConnectVoiceUsage = ch.features.includes('connect_voice_usage');
        const hasTelephony = ch.features.includes('telephony');
        const hasTranslate = ch.features.includes('translate');
        const hasContactLens = ch.features.includes('contactLens');
        const hasAgentAssist = ch.features.includes('agentAssist');
        const hasBot = ch.features.includes('convIVR') || ch.features.includes('chatbot');
        const hasBedrock = ch.features.includes('bedrock');
        const hasStorage = ch.features.includes('storage');
        const hasConnectChatUsage = ch.features.includes('connect_chat_usage');

        if (ch.type === 'Voice') {
          const baseRate = (hasConnectVoiceUsage ? pricing.connect_voice_usage_per_min : 0) + (hasTelephony ? pricing.telephony_per_min : 0);
          const analyticsRate = hasContactLens ? pricing.contact_lens_voice_min : 0;
          const translateRate = hasTranslate ? pricing.translate_voice_min : 0;
          const assistRate = hasAgentAssist ? pricing.agent_assist_voice_min : 0;
          
          totalVoiceCost += liveVol * ch.aht * (baseRate + analyticsRate + assistRate + translateRate);
          
          if (hasBot) {
             totalVoiceCost += containedVol * 2.0 * (baseRate + translateRate); 
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
          const baseRate = hasConnectChatUsage ? pricing.connect_chat_usage_per_msg : 0;
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
    } else if (client.techStack === 'yellow') {
        const hasYellowFeature = channels.some(c => c.features.length > 0);
        if (hasYellowFeature) {
            totalPlatformCost = YELLOW_AI_PRICING.platform_fee;
        }

        channels.forEach(ch => {
            const hasAgentic = ch.features.includes('agentic');
            const agenticMultiplier = hasAgentic ? 1.25 : 1.0;

            if (ch.type === 'Voice' && ch.features.includes('convIVR')) {
                const totalMinutes = ch.volume * ch.aht;
                let remainingMinutes = totalMinutes;
                let voiceCost = 0;
                YELLOW_AI_PRICING.conv_ivr_per_min_tiers.forEach((tier, index) => {
                    const prevTierLimit = index === 0 ? 0 : YELLOW_AI_PRICING.conv_ivr_per_min_tiers[index-1].limit;
                    if (remainingMinutes > 0) {
                        const minutesInTier = Math.min(remainingMinutes, tier.limit - prevTierLimit);
                        voiceCost += minutesInTier * tier.price;
                        remainingMinutes -= minutesInTier;
                    }
                });
                totalVoiceCost += voiceCost * agenticMultiplier;
            } else if (ch.type === 'Chat') {
                const containment = ch.containment || 0;
                const uncontainedVol = ch.volume * ((100 - containment) / 100);

                if (ch.features.includes('chatbot')) {
                     // Chatbot pricing applies to all conversations (assuming bot starts all interactions)
                     totalDigitalCost += ch.volume * YELLOW_AI_PRICING.chatbot_per_conversation * agenticMultiplier;
                }
                if (ch.features.includes('liveChat')) {
                    // Live chat pricing only applies to sessions that escalate to human (uncontained)
                    totalDigitalCost += uncontainedVol * YELLOW_AI_PRICING.live_chat_per_conversation * agenticMultiplier;
                }
            }
        });
    }


    const totalTechMonthly = totalVoiceCost + totalDigitalCost + totalAiCost + totalInfraCost + totalPlatformCost;

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
      platformCost: totalPlatformCost,
      totalTechMonthly,
      implCost,
      oneYearTCO: (totalTechMonthly * 12) + implCost
    };
  }, [channels, pricing, resources, rateBand, client.techStack]);

  // --- HANDLERS ---
  const addChannel = (type) => {
    const newId = Date.now().toString();
    const defaults_aws = {
      Voice: { name: 'Voice', type: 'Voice', volume: 10000, aht: 5, containment: 10, lexTurns: 5, systemComplexity: 1, contextChars: 5000, bedrockModel: 'sonnet', features: ['connect_voice_usage'] },
      Chat: { name: 'Chat', type: 'Chat', volume: 5000, aht: 0, containment: 20, lexTurns: 8, systemComplexity: 1, contextChars: 5000, bedrockModel: 'sonnet', features: ['connect_chat_usage'] },
      Email: { name: 'Email', type: 'Email', volume: 2000, aht: 0, containment: 0, lexTurns: 0, systemComplexity: 0, contextChars: 10000, bedrockModel: 'sonnet', features: ['emailMgmt'] }
    };
    const defaults_yellow = {
      // Added missing keys to prevent UI crashes in Step 2
      Voice: { name: 'Voice', type: 'Voice', volume: 10000, aht: 5, containment: 10, lexTurns: 5, systemComplexity: 1, contextChars: 1000, features: ['convIVR'] },
      Chat: { name: 'Chat', type: 'Chat', volume: 5000, aht: 0, containment: 20, lexTurns: 8, systemComplexity: 1, contextChars: 1000, features: ['chatbot', 'liveChat'] },
    };
    
    const defaults = client.techStack === 'yellow' ? defaults_yellow : defaults_aws;
    if (client.techStack === 'yellow' && type === 'Email') return;

    setChannels([...channels, { id: newId, ...defaults[type] }]);
  };

  const updateChannel = (id, field, value) => {
    setChannels(channels.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const toggleFeature = (channelId, featureKey) => {
    // Prevent toggling if it's an experimental feature and we are in prod mode
    const catalog = client.techStack === 'yellow' ? FEATURES_CATALOG_YELLOW_AI : FEATURES_CATALOG;
    const featureDef = catalog[featureKey];
    if (featureDef && featureDef.isExperimental && !ENABLE_EXPERIMENTAL_FEATURES) return;

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
    csv += `${client.name},Total Monthly,${pricing.currency}${calculations.totalTechMonthly.toFixed(2)}\n`;
    csv += `${client.name},Implementation,${pricing.currency}${calculations.implCost.toFixed(2)}\n`;
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Prepared By (Email)</label>
          <input 
            type="email" 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., your.name@company.com"
            value={client.email}
            onChange={(e) => setClient({...client, email: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prepared By (Name)</label>
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
            onChange={(e) => {
                const newStack = e.target.value;
                setClient({...client, techStack: newStack});
                // Clear channels when switching stacks to avoid feature mismatches
                setChannels([]); 
            }}
          >
            <option value="aws">Amazon Connect (AWS)</option>
            <option value="yellow">Yellow.ai</option>
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
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Tech Inputs & Channels</h3>
        <div className="flex gap-2">
          <button onClick={() => addChannel('Voice')} className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
            <Mic size={16}/> Add Voice
          </button>
          <button onClick={() => addChannel('Chat')} className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100">
            <MessageSquare size={16}/> Add Chat
          </button>
          <button 
            onClick={() => addChannel('Email')} 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${client.techStack === 'yellow' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
            disabled={client.techStack === 'yellow'}
            title={client.techStack === 'yellow' ? "Not available for Yellow.ai" : "Add Email"}
          >
            <Mail size={16}/> Add Email
          </button>
        </div>
      </div>
      <div className="space-y-6">
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
              {ch.type !== 'Email' && !(client.techStack === 'yellow' && ch.type === 'Voice') && (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Containment Target</label>
                    <span className="text-sm font-bold text-green-600">{ch.containment}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                    value={ch.containment || 0}
                    onChange={(e) => updateChannel(ch.id, 'containment', parseInt(e.target.value))}
                  />
                </div>
              )}

              {/* Feature Checklist - DYNAMIC SWITCHING ADDED HERE */}
              <div className="md:col-span-3 border-t border-slate-100 pt-4 mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">
                    {client.techStack === 'yellow' ? 'Yellow.ai Modules' : 'AWS CCaaS Features'}
                </label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(client.techStack === 'yellow' ? FEATURES_CATALOG_YELLOW_AI : FEATURES_CATALOG).map(([key, feature]) => {
                    if (!feature.channels.includes(ch.type)) return null;
                    const isSelected = ch.features.includes(key);
                    const isExperimental = feature.isExperimental;
                    const isDisabled = isExperimental && !ENABLE_EXPERIMENTAL_FEATURES;
                    const Icon = feature.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => toggleFeature(ch.id, key)}
                        disabled={isDisabled}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-200' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                      >
                        <div className={`p-1 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-slate-200'}`}>
                           {isDisabled ? <Lock size={12}/> : <Icon size={12} />}
                        </div>
                        {feature.label}
                        {isDisabled && <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded ml-1">Beta</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Conditional Settings (Bot/GenAI) */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  {(client.techStack === 'aws' && (ch.features.includes('convIVR') || ch.features.includes('chatbot'))) && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 relative">
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <label className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                               <Cpu size={14}/> Conv. Complexity
                            </label>
                            <p className="text-xs text-indigo-600">Avg. turns per session</p>
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
                       : 'bg-slate-50 border-slate-200 opacity-50 grayscale pointer-events-none hidden' // Hide if not active to save space
                  } ${ch.features.includes('bedrock') ? 'block' : 'hidden'}`}>
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
                           value={ch.systemComplexity || 1}
                           onChange={(e) => updateChannel(ch.id, 'systemComplexity', parseInt(e.target.value))}
                         />
                      </div>
                      <div>
                         <div className="flex justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-600">Context Window</span>
                            <span className="text-xs font-bold text-slate-800">{(ch.contextChars || 0).toLocaleString()} chars</span>
                         </div>
                         <input 
                           type="range" min="1000" max="30000" step="1000"
                           className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                           value={ch.contextChars || 5000}
                           onChange={(e) => updateChannel(ch.id, 'contextChars', parseInt(e.target.value))}
                         />
                         <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="bg-white p-2 rounded border border-amber-100 text-center">
                              <span className="block text-[10px] text-slate-400 uppercase">Input Tokens</span>
                              <span className="text-xs font-mono font-bold text-slate-600">
                                {Math.round(((ch.contextChars || 0) + ((ch.systemComplexity || 0) * 1000))/4).toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded border border-amber-100 text-center">
                              <span className="block text-[10px] text-slate-400 uppercase">Output Tokens</span>
                              <span className="text-xs font-mono font-bold text-slate-600">
                                {Math.round((((ch.contextChars || 0) + ((ch.systemComplexity || 0) * 1000))/4) * 0.2).toLocaleString()}
                              </span>
                            </div>
                         </div>
                      </div>
                  </div>
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
                    {pricing.currency}{totalCost.toLocaleString(undefined, {maximumFractionDigits:0})}
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
      {/* ... (Keep Step 4 Summary cards and chart) ... */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Estimation Complete</h2>
        <p className="text-slate-500">Review the Total Cost of Ownership (TCO) below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">One-Time Implementation</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{pricing.currency}{calculations.implCost.toLocaleString()}</p>
          <span className="text-xs bg-slate-100 px-2 py-1 rounded mt-2">Band: {rateBand}</span>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-blue-600 text-sm font-medium uppercase tracking-wide">Monthly Tech Run</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{pricing.currency}{calculations.totalTechMonthly.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center text-white">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Year 1 TCO</p>
          <p className="text-3xl font-bold mt-2">{pricing.currency}{calculations.oneYearTCO.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
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
            { name: 'Platform Fee', value: calculations.platformCost },
          ]}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${pricing.currency}${val/1000}k`} />
            <RechartsTooltip cursor={{fill: '#f1f5f9'}} formatter={(val) => `${pricing.currency}${val.toLocaleString()}`} />
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
                    
                    {/* Total Cost */}
                    <div className="flex items-center gap-8">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Total Monthly Tech</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold font-mono tracking-tighter text-white drop-shadow-sm">
                            {pricing.currency}{calculations.totalTechMonthly.toLocaleString(undefined, {maximumFractionDigits: 0})}
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
                            onClick={() => setStep(s => Math.min(4, s + 1))}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all"
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
}

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
      {/* NOTE: removed overflow-x-hidden to allow sticky positioning to work properly relative to viewport scrolling */}
      <main className="flex-1 ml-20 lg:ml-64 transition-all duration-300 relative">
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'calculator' && <EstimatorWizard user={user} pricing={pricing} setGlobalPricing={setPricing} />}
        {activeTab === 'knowledge' && <KnowledgeBase pricing={pricing} />}
      </main>
    </div>
  );
}