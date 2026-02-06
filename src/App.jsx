import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Legend, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx-js-style';
import {
  Calculator, Users, FileText, Plus, Trash2, CheckCircle, Database, LayoutDashboard,
  Mic, MessageSquare, Mail, Activity, Zap, Info, X, Calendar, Layers, ArrowLeft, ArrowRight,
  Phone, Lock, Download, Save, Check, ChevronRight, TrendingDown, Boxes, Eye, ShieldCheck, Briefcase, TrendingUp, Cpu
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- CONFIGURATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAipAXjbkNTjmZPqf6xXjzZgK9atat0IZA",
  authDomain: "techprice-42770.firebaseapp.com",
  projectId: "techprice-42770",
  storageBucket: "techprice-42770.firebasestorage.app",
  messagingSenderId: "669722804840",
  appId: "1:669722804840:web:b26dcbe9aadb85a70271dd",
  measurementId: "G-51DFWTF5YN"
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

// --- CONSTANTS & PRICING DATA ---

const LOGO_TOKEN = 'pk_HJvUVX6IQgiupJJ8IW3nxA';

const REGIONAL_PRICING = {
  'US': {
    currency: '$',
    aws_connect_channel_per_min: 0.018,
    aws_connect_did_inbound: 0.0022,
    aws_connect_did_outbound: 0.0048,
    aws_connect_chat_msg: 0.004,
    lex_speech_turn: 0.0065,
    lex_text_turn: 0.0020,
    agent_assist_voice_min: 0.0080,
    contact_lens_voice_min: 0.015,
    // Bedrock Claude 3.5 Sonnet Rates
    bedrock_sonnet_input_1k: 0.003,
    bedrock_sonnet_output_1k: 0.015
  }
};

const VENDOR_PRICING = {
  five9: { voice_seat: 159, digital_seat: 119 },
  yellow: { platform_fee: 10000, civr_session: 0.21, agent_assist_session: 0.24, chatbot_session: 0.16 },
  kore: { platform_fee_annual: 40000, expert_service_one_time: 20000, civr_session: 0.21, agent_assist_session: 0.24, chatbot_session: 0.16 },
  cresta: { ai_assist_min: 0.05 },
  observe: { per_agent_monthly: 69 }
};

const CAPABILITIES = {
  channels: [
    { id: 'Voice', label: 'Voice', icon: Mic },
    { id: 'Chat', label: 'Chat & Messaging', icon: MessageSquare },
    { id: 'Email', label: 'Email Automation', icon: Mail },
  ],
  solutions: [
    // Kore is supported only for Conversational IVR (not standalone telephony/DID)
    { id: 'telephony', label: 'Telephony (DID/Toll-Free)', channels: ['Voice'], vendors: ['aws', 'five9'] },
    { id: 'civr', label: 'Conversational IVR', channels: ['Voice'], vendors: ['aws', 'kore', 'yellow'] },
    { id: 'chatbot', label: 'Self-Service Chatbot', channels: ['Chat'], vendors: ['aws', 'kore', 'yellow'] },
    { id: 'liveChat', label: 'Live Chat Support', channels: ['Chat'], vendors: ['aws', 'five9'] },
    { id: 'agentAssist', label: 'Agent Assist', channels: ['Voice', 'Chat'], vendors: ['aws', 'kore', 'yellow', 'cresta'] },
    { id: 'qaAuto', label: 'QA Automation', channels: ['Voice', 'Chat'], vendors: ['aws', 'observe'] },
    { id: 'analytics', label: 'Real Time Analytics', channels: ['Voice', 'Chat'], vendors: ['aws', 'observe'] },
    { id: 'emailAuto', label: 'Email Automation', channels: ['Email'], vendors: ['aws'] }
  ]
};

const ALL_VENDORS = ['aws', 'kore', 'yellow', 'five9', 'cresta', 'observe'];

const DEFAULT_ROLES = [
  { id: 'pm', label: 'Project Manager', monthlyRate: 4500 },
  { id: 'cx_dev', label: 'CX Developer', monthlyRate: 4001 },
  { id: 'sa', label: 'Solution Architect', monthlyRate: 5447 },
  { id: 'qa', label: 'QA Analyst', monthlyRate: 3500 },
];

const PHASES = ['Discovery', 'Build', 'Testing', 'Go Live', 'Hypercare'];
const PHASE_BG_COLORS = { 'Discovery': 'bg-purple-100 text-purple-700', 'Design': 'bg-blue-100 text-blue-700', 'Build': 'bg-emerald-100 text-emerald-700', 'Testing': 'bg-amber-100 text-amber-700', 'Go Live': 'bg-orange-100 text-orange-700', 'Hypercare': 'bg-slate-100 text-slate-700' };
const PHASE_XLSX = {
  Discovery: { fill: 'EDE9FE', text: '6D28D9' },   // purple
  Build: { fill: 'D1FAE5', text: '047857' },       // emerald
  Testing: { fill: 'FEF3C7', text: 'B45309' },     // amber
  'Go Live': { fill: 'FFEDD5', text: 'C2410C' },  // orange
  Hypercare: { fill: 'F1F5F9', text: '334155' },   // slate
  Empty: { fill: 'F8FAFC', text: '94A3B8' }
};

// --- SHARED UI COMPONENTS ---

const Sidebar = ({ activeTab, setActiveTab }) => (
  <div className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 z-50 font-black">
    <div className="p-4 flex items-center gap-3 border-b border-slate-700">
      <div className="bg-white p-2 rounded-lg flex items-center justify-center">
        <Calculator size={24} className="text-blue-600" />
      </div>
      <span className="font-black text-lg hidden lg:block leading-tight uppercase tracking-tighter">CX Cost Engine</span>
    </div>
    <nav className="flex-1 py-6 space-y-2 px-2">
      {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Pipeline' }, { id: 'calculator', icon: Plus, label: 'New Estimator' }].map((item) => (
        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <item.icon size={20} /><span className="hidden lg:block font-black uppercase text-[10px] tracking-widest">{item.label}</span>
        </button>
      ))}
    </nav>
  </div>
);

// --- MAIN WIZARD COMPONENT ---

const EstimatorWizard = ({ user }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState({ name: '', teamMember: '', ownerEmail: '', techStack: '', region: 'US' });

  const [requirements, setRequirements] = useState({ channels: [], solutions: [] });
  const [globalParams, setGlobalParams] = useState({
    Voice: { mode: 'inbound', inboundVol: 10000, outboundVol: 0, inboundAht: 5, outboundAht: 3, complexity: 5, containment: 15 },
    Chat: { volume: 5000, complexity: 8, containment: 20 },
    Email: { volume: 2000 },
    fte: 0
  });

  const [resources, setResources] = useState([]);
  const [rateBand, setRateBand] = useState('Medium');
  const [solutionVendors, setSolutionVendors] = useState({});

  // --- CALCULATION LOGIC ---

  const calculateStackSpecific = (stackId) => {
    if (!stackId) return null;
    let voice = 0, chat = 0, email = 0, fixed = 0, oneTime = 0, infra = 0;
    const p = REGIONAL_PRICING['US'];
    const vp = VENDOR_PRICING;
    const breakdown = [];

    const vData = globalParams.Voice;
    const totalCalls = (vData.inboundVol || 0) + (vData.outboundVol || 0);
    const totalVolMin = ((vData.inboundVol || 0) * (vData.inboundAht || 0)) + ((vData.outboundVol || 0) * (vData.outboundAht || 0));
    const inLive = (vData.inboundVol || 0) * (1 - (vData.containment || 0) / 100);
    const totalLiveMin = (inLive * (vData.inboundAht || 0)) + ((vData.outboundVol || 0) * (vData.outboundAht || 0));

    const chatVol = (globalParams.Chat.volume || 0);
    const chatLive = chatVol * (1 - (globalParams.Chat.containment || 0) / 100);

    // Platform Metadata
    if (requirements.solutions.some(s => ['civr', 'chatbot'].includes(s))) {
      breakdown.push({ channel: 'System', label: 'Platform Complexity', val: (vData.complexity || 5), math: String(vData.complexity || 5) + " Turns per Interaction" });
    }
    breakdown.push({ channel: 'System', label: 'Total Billable Minutes', val: totalVolMin, math: Math.round(totalVolMin).toLocaleString() + " mins/mo" });

    if (stackId === 'aws') {
      if (requirements.channels.includes('Voice')) {
        let vSub = 0;
        const usage = totalLiveMin * p.aws_connect_channel_per_min + (vData.inboundVol - inLive) * (vData.inboundAht || 0) * p.aws_connect_channel_per_min;
        vSub += usage;
        breakdown.push({ channel: 'Voice', label: 'Voice Channel Usage', val: usage, math: `$${p.aws_connect_channel_per_min}/min` });

        if (requirements.solutions.includes('telephony') || requirements.solutions.includes('civr')) {
          const inTele = (vData.inboundVol || 0) * (vData.inboundAht || 0) * p.aws_connect_did_inbound;
          const outTele = (vData.outboundVol || 0) * (vData.outboundAht || 0) * p.aws_connect_did_outbound;
          vSub += (inTele + outTele);
          breakdown.push({ channel: 'Voice', label: 'DID Inbound', val: inTele, math: `$${p.aws_connect_did_inbound}/min` });
          if (vData.outboundVol > 0) breakdown.push({ channel: 'Voice', label: 'DID Outbound', val: outTele, math: `$${p.aws_connect_did_outbound}/min` });
        }
        if (requirements.solutions.includes('civr')) {
          const lex = totalCalls * (vData.complexity || 5) * p.lex_speech_turn;
          vSub += lex;
          breakdown.push({ channel: 'Voice', label: 'Lex Voice Automation', val: lex, math: `$${p.lex_speech_turn}/turn` });
        }
        voice += vSub;
        breakdown.push({ channel: 'Voice', label: 'Voice Total Cost', val: vSub, math: 'Sum of Voice drivers', isTotal: true });

        if (requirements.solutions.includes('analytics') || requirements.solutions.includes('qaAuto')) {
          // Check if AWS is the active vendor for these capabilities before charging
          const isAwsAnalytics = (!solutionVendors['analytics'] || solutionVendors['analytics'] === 'aws');
          const isAwsQa = (!solutionVendors['qaAuto'] || solutionVendors['qaAuto'] === 'aws');

          if (requirements.solutions.includes('analytics') && isAwsAnalytics) {
            const clCost = totalVolMin * p.contact_lens_voice_min;
            infra += clCost;
            breakdown.push({ channel: 'Voice', label: 'Real Time Analytics', val: clCost, math: `$${p.contact_lens_voice_min}/min` });
          }
          if (requirements.solutions.includes('qaAuto') && isAwsQa) {
            const qaFee = (globalParams.fte || 0) * 12;
            infra += qaFee;
            breakdown.push({ channel: 'Voice', label: 'QA Automation extras', val: qaFee, math: '$12.00/agent' });
          }
        }
      }
      if (requirements.channels.includes('Chat')) {
        let cSub = 0;
        const sess = chatLive * 15 * p.aws_connect_chat_msg;
        cSub += sess;
        breakdown.push({ channel: 'Chat', label: 'AWS Chat Channel', val: sess, math: `$${p.aws_connect_chat_msg}/msg` });
        if (requirements.solutions.includes('chatbot')) {
          const lex = chatVol * (globalParams.Chat.complexity || 8) * p.lex_text_turn;
          cSub += lex;
          breakdown.push({ channel: 'Chat', label: 'Lex Chatbot Automation', val: lex, math: `$${p.lex_text_turn}/turn` });
        }
        chat += cSub;
        breakdown.push({ channel: 'Chat', label: 'Chat Total Cost', val: cSub, math: 'Sum of Chat drivers', isTotal: true });
      }
      if (requirements.channels.includes('Email') && requirements.solutions.includes('emailAuto')) {
        const eVol = globalParams.Email.volume || 0;
        const eSub = (eVol * 2 * p.bedrock_sonnet_input_1k) + (eVol * 1 * p.bedrock_sonnet_output_1k);
        email += eSub;
        breakdown.push({ channel: 'Email', label: 'Bedrock GenAI (Sonnet)', val: eSub, math: '~3k tokens/email' });
        breakdown.push({ channel: 'Email', label: 'Email Total Cost', val: eSub, math: 'Sum of Email drivers', isTotal: true });
      }
    } else if (stackId === 'kore') {
      fixed = vp.kore.platform_fee_annual / 12;
      oneTime = vp.kore.expert_service_one_time;
      if (requirements.channels.includes('Voice')) {
        const cost = (vData.inboundVol || 0) * Math.ceil((vData.inboundAht || 1) / 15) * vp.kore.civr_session;
        voice += cost;
        breakdown.push({ channel: 'Voice', label: 'Kore Voice Sessions', val: cost, math: `$${vp.kore.civr_session}/sess` });
        breakdown.push({ channel: 'Voice', label: 'Voice Total Cost', val: cost, math: 'Sum of Voice drivers', isTotal: true });
      }
      if (requirements.channels.includes('Chat') && (requirements.solutions.includes('chatbot') || requirements.solutions.includes('liveChat'))) {
        const cost = chatVol * vp.kore.chatbot_session;
        chat += cost;
        breakdown.push({ channel: 'Chat', label: 'Kore Digital Sessions', val: cost, math: `$${vp.kore.chatbot_session}/sess` });
        breakdown.push({ channel: 'Chat', label: 'Chat Total Cost', val: cost, math: 'Sum of Chat drivers', isTotal: true });
      }
      breakdown.push({ channel: 'System', label: 'Annual Platform Fee', val: fixed, math: 'Pro-rata monthly' });
    } else if (stackId === 'five9') {
      const rate = requirements.channels.includes('Voice') ? vp.five9.voice_seat : vp.five9.digital_seat;
      const seatTotal = (globalParams.fte || 0) * rate;
      if (requirements.channels.includes('Voice')) voice += seatTotal; else chat += seatTotal;
      breakdown.push({ channel: 'System', label: 'Five9 Extras', val: seatTotal, math: `$${rate}/agent` });
      breakdown.push({ channel: 'System', label: 'Channel Total', val: seatTotal, math: 'Unified seat', isTotal: true });
    } else if (stackId === 'observe') {
      const obsCost = (globalParams.fte || 0) * vp.observe.per_agent_monthly;
      voice += obsCost;
      breakdown.push({ channel: 'Voice', label: 'Observe Analytics', val: obsCost, math: `$${vp.observe.per_agent_monthly}/agent` });
      breakdown.push({ channel: 'Voice', label: 'Analytics Total', val: obsCost, math: 'Observe license', isTotal: true });
    } else if (stackId === 'yellow') {
      oneTime = vp.yellow.platform_fee;
      if (requirements.channels.includes('Voice')) {
        const cost = (vData.inboundVol || 0) * vp.yellow.civr_session;
        voice += cost;
        breakdown.push({ channel: 'Voice', label: 'Yellow Voice Sessions', val: cost, math: `$${vp.yellow.civr_session}/sess` });
        breakdown.push({ channel: 'Voice', label: 'Voice Total Cost', val: cost, math: 'Section Total', isTotal: true });
      }
      if (requirements.channels.includes('Chat')) {
        const cost = chatVol * vp.yellow.chatbot_session;
        chat += cost;
        breakdown.push({ channel: 'Chat', label: 'Yellow Digital Sessions', val: cost, math: `$${vp.yellow.chatbot_session}/sess` });
        breakdown.push({ channel: 'Chat', label: 'Chat Total Cost', val: cost, math: 'Section Total', isTotal: true });
      }
    }
    return { total: voice + chat + email + fixed + infra, voice, chat, email, fixed, oneTime, infra, breakdown };
  };

  const finalFinancials = useMemo(() => {
    if (!client.techStack) return null;
    const tech = calculateStackSpecific(client.techStack);
    const mult = rateBand === 'Low' ? 0.9 : rateBand === 'High' ? 1.15 : 1.0;
    const impl = resources.reduce((acc, r) => {
      const role = DEFAULT_ROLES.find(dr => dr.id === r.roleId);
      return acc + (role ? ((role.monthlyRate * mult) * r.duration * (r.quantity || 1) * ((r.effort || 100) / 100)) : 0);
    }, 0);
    const support = impl * 0.30;
    return {
      ...tech,
      implCost: impl,
      supportCost: support,
      year1TCO: tech.total * 12 + tech.oneTime + impl,
      year3TCO: tech.total * 36 + tech.oneTime + impl + support * 2,
      year5TCO: tech.total * 60 + tech.oneTime + impl + support * 4
    };
  }, [client.techStack, resources, rateBand, requirements, globalParams]);

  const selectedVendorIds = useMemo(() => {
    const ids = Object.values(solutionVendors || {});
    return Array.from(new Set(ids.filter(Boolean)));
  }, [solutionVendors]);

  const comparisonData = useMemo(() => {
    const vendors = ALL_VENDORS;
    const selectedSolutions = CAPABILITIES.solutions.filter(s =>
      requirements.solutions.includes(s.id)
    );

    const results = vendors.map(id => {
      const costs = calculateStackSpecific(id);
      // If no specific solutions have been selected yet, show all vendors.
      const supported =
        selectedSolutions.length === 0
          ? true
          : selectedSolutions.some(sol => sol.vendors.includes(id));
      const isSelected = selectedVendorIds.length === 0 ? true : selectedVendorIds.includes(id);
      return { id, supported, isSelected, costs };
    });

    return results.map(r => ({
      ...r,
      isBest: false,
      priceDiff: 0
    }));
  }, [requirements, globalParams, selectedVendorIds]);

  // --- ACTIONS ---
  const autoPlan = () => {
    const template = [];
    requirements.channels.forEach(ch => {
      const channelSolutions = CAPABILITIES.solutions.filter(s => s.channels.includes(ch) && requirements.solutions.includes(s.id));
      channelSolutions.forEach(sol => {
        template.push(
          { id: Math.random(), channelId: ch, solutionId: sol.id, roleId: 'sa', phase: 'Build', startMonth: 1, duration: 1, quantity: 1, effort: 100 },
          { id: Math.random(), channelId: ch, solutionId: sol.id, roleId: 'pm', phase: 'Build', startMonth: 1, duration: 6, quantity: 1, effort: 25 },
          { id: Math.random(), channelId: ch, solutionId: sol.id, roleId: 'cx_dev', phase: 'Build', startMonth: 2, duration: 4, quantity: 1, effort: 100 }
        );
      });
    });
    setResources(template);
  };

  const saveDeal = async () => {
    if (!user || !db) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'deals'), { client, financials: finalFinancials, createdAt: new Date() });
      setLoading(false);
      alert("Project archived to pipeline.");
    } catch (e) { setLoading(false); }
  };

  const exportToCSV = () => {
    const tech = finalFinancials;
    const vData = globalParams.Voice;
    let csv = "CX Cost Engine,Selected Architecture," + client.techStack.toUpperCase() + "\n\n";
    csv += "Solution,M1,M2,M3,M4,M5,M6,M7,M8,M9,M10,M11,M12,M13,M14,M15,M16,M17,M18,M19,M20,M21,M22,M23,M24\n";
    csv += `Volume,${Array(24).fill(vData.inboundVol + vData.outboundVol).join(",")}\n`;
    csv += `AHT,${Array(24).fill(Math.max(vData.inboundAht, vData.outboundAht)).join(",")}\n`;
    tech.breakdown.forEach(item => {
      const valStr = item.val !== null && item.val !== undefined ? Number(item.val).toFixed(0) : "N/A";
      csv += `"${item.label} [${item.math}]",${Array(24).fill(valStr).join(",")}\n`;
    });

    // Assumptions (separate table)
    csv += "\nAssumptions\n";
    csv += "Parameter,Value\n";
    if (requirements.channels.includes('Voice')) {
      csv += `Voice Complexity (turns),${globalParams.Voice.complexity || 0}\n`;
      csv += `Voice Containment (%),${globalParams.Voice.containment || 0}\n`;
    }
    if (requirements.channels.includes('Chat')) {
      csv += `Chat Complexity (turns),${globalParams.Chat.complexity || 0}\n`;
      csv += `Chat Containment (%),${globalParams.Chat.containment || 0}\n`;
    }
    if (requirements.channels.includes('Email')) {
      csv += `Email Volume,${globalParams.Email.volume || 0}\n`;
    }
    csv += `Resource Base (FTE),${globalParams.fte || 0}\n`;

    csv += "\nSummary,Year 1,Year 2\n";
    csv += `Tech run cost (annualized),$${(tech.total * 12).toFixed(0)},$${(tech.total * 12).toFixed(0)}\n`;
    csv += `Implementation cost (one time),$${tech.implCost.toFixed(0)},$0\n`;
    csv += `Extras (one time),$${tech.oneTime.toFixed(0)},$0\n`;
    csv += `Support Cost,$0,$${tech.supportCost.toFixed(0)}\n`;

    const grouped = resources.reduce((acc, r) => {
      const label = CAPABILITIES.solutions.find(s => s.id === r.solutionId)?.label || "Platform";
      if (!acc[label]) acc[label] = [];
      acc[label].push(r);
      return acc;
    }, {});
    csv += "\nImplementation Resources Grouped by Solution\n";
    Object.entries(grouped).forEach(([solName, resList]) => {
      csv += `Solution Stream: ${solName}\n`;
      csv += "Role,Duration,Cost\n";
      resList.forEach(r => {
        const role = DEFAULT_ROLES.find(dr => dr.id === r.roleId);
        const cost = ((role?.monthlyRate || 0) * (rateBand === 'Low' ? 0.9 : rateBand === 'High' ? 1.15 : 1.0)) * r.duration * r.quantity * (r.effort / 100);
        csv += `"${role?.label}",${r.duration} mo,$${cost.toFixed(0)}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${client.name}_Model.csv`);
    link.click();
  };

  const goToExecution = () => {
    const candidates = comparisonData.filter(v => v.supported && v.isSelected);
    if (candidates.length === 0) {
      alert('Please select at least one vendor-capability combination before proceeding.');
      return;
    }
    // For now, pick the first selected vendor as the baseline for numeric calculations,
    // while Step 3 visibly shows all vendors in the architecture.
    setClient({ ...client, techStack: candidates[0].id });
    setStep(3);
  };

  const exportToExcel = () => {
    try {
      const tech = finalFinancials;
      if (!tech) {
        alert("No financials to export. Please complete Steps 1-3 first.");
        return;
      }

      const XLSX_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
      // Build phase grid to detect Go Live month
      const phaseGridX = {};
      resources.forEach(r => {
        const sol = CAPABILITIES.solutions.find(s => s.id === r.solutionId);
        if (!sol) return;
        if (!phaseGridX[sol.id]) phaseGridX[sol.id] = { label: sol.label, months: Array(12).fill(null) };
        const start = Math.min(Math.max(r.startMonth || 1, 1), 12);
        const end = Math.min(start + (r.duration || 1) - 1, 12);
        for (let m = start; m <= end; m++) phaseGridX[sol.id].months[m - 1] = r.phase;
      });
      Object.values(phaseGridX).forEach(plan => {
        const months = plan.months;
        const buildEndIndex = months.reduce((lastIdx, phase, idx) => (phase === 'Build' ? idx : lastIdx), -1);
        if (buildEndIndex >= 0 && buildEndIndex < 11) {
          if (!months[buildEndIndex + 1]) months[buildEndIndex + 1] = 'Go Live';
          for (let i = buildEndIndex + 2; i < 12; i++) if (!months[i]) months[i] = 'Hypercare';
        }
      });
      const goLiveMonth = (() => {
        const indices = Object.values(phaseGridX)
          .flatMap(plan => plan.months.map((p, idx) => (p === 'Go Live' ? idx + 1 : null)))
          .filter(Boolean);
        return indices.length > 0 ? Math.min(...indices) : 4; // default Go Live in M4 if not set
      })();

      const voiceTargetContainment = globalParams.Voice.containment || 0;
      const buildRamp = (target, goLive) => {
        const arr = Array(12).fill(0);
        const segments = [
          { months: 3, factor: 0.25 },
          { months: 3, factor: 0.5 },
          { months: 3, factor: 1.0 }
        ];
        let idx = goLive - 1;
        segments.forEach(seg => {
          for (let i = 0; i < seg.months && idx < 12; i++, idx++) {
            arr[idx] = Math.round(target * seg.factor);
          }
        });
        for (; idx < 12; idx++) arr[idx] = target;
        return arr;
      };
      const voiceContainmentRamp = buildRamp(voiceTargetContainment, goLiveMonth);

      const vData = globalParams.Voice;
      const totalVolume = (vData.inboundVol || 0) + (vData.outboundVol || 0);
      const maxAht = Math.max(vData.inboundAht || 0, vData.outboundAht || 0);
      const fteBase = globalParams.fte || 0;
      const monthlyBillableMins = XLSX_MONTHS.map((_, idx) => {
        const cont = voiceContainmentRamp[idx] || 0;
        const liveInbound = (vData.inboundVol || 0) * (1 - cont / 100);
        const liveMins = liveInbound * (vData.inboundAht || 0) + (vData.outboundVol || 0) * (vData.outboundAht || 0);
        return Math.round(liveMins);
      });

      const monthlyVoiceCost = Array(12).fill(Math.round(tech.voice || 0));
      const monthlyChatCost = Array(12).fill(Math.round(tech.chat || 0));
      const monthlyEmailCost = Array(12).fill(Math.round(tech.email || 0));
      const monthlyExtrasCost = Array(12).fill(Math.round((tech.fixed || 0) + (tech.infra || 0)));
      const monthlyTotal = Array(12).fill(Math.round(tech.total || 0));

      // ---- Sheet 1: Costs + Summary ----
      const costsRows = [
        ['CX Cost Engine', 'Selected Architecture', client.techStack.toUpperCase()],
        [],
        ['Month', ...XLSX_MONTHS.map(m => `M${m}`)],
        ['Total Volume', ...XLSX_MONTHS.map(() => totalVolume)],
        ['AHT (mins)', ...XLSX_MONTHS.map(() => maxAht)],
        ['Containment (%)', ...voiceContainmentRamp],
        ['Resource Base (FTE)', ...XLSX_MONTHS.map(() => fteBase)],
        ['Total Billable Minutes', ...monthlyBillableMins],
        ['Voice monthly cost', ...monthlyVoiceCost],
        ['Chat monthly cost', ...monthlyChatCost],
        ['Email monthly cost', ...monthlyEmailCost],
        ['Extras monthly cost', ...monthlyExtrasCost],
        ['Total monthly tech run cost', ...monthlyTotal],
        [],
        ['Cost breakdown', 'Channel', 'Math', 'Monthly cost']
      ];
      tech.breakdown.forEach(item => {
        const monthly = item.val !== null && item.val !== undefined ? Number(item.val) : null;
        costsRows.push([
          item.label,
          item.channel,
          item.math,
          monthly === null ? '' : Math.round(monthly)
        ]);
      });
      costsRows.push([]);
      costsRows.push(['Assumptions', '', '', '']);
      costsRows.push(['Go Live month (derived)', goLiveMonth, '', '']);
      costsRows.push(['Voice Complexity (turns)', requirements.channels.includes('Voice') ? (globalParams.Voice.complexity || 0) : '', '', '']);
      costsRows.push(['Voice Containment target (%)', requirements.channels.includes('Voice') ? (globalParams.Voice.containment || 0) : '', '', '']);
      costsRows.push(['Chat Complexity (turns)', requirements.channels.includes('Chat') ? (globalParams.Chat.complexity || 0) : '', '', '']);
      costsRows.push(['Chat Containment (%)', requirements.channels.includes('Chat') ? (globalParams.Chat.containment || 0) : '', '', '']);
      costsRows.push(['Resource Base (FTE)', (globalParams.fte || 0), '', '']);
      costsRows.push([]);
      costsRows.push(['Summary', 'Year 1', 'Year 2', '']);
      costsRows.push(['Tech run cost (annualized)', Math.round(tech.total * 12), Math.round(tech.total * 12), '']);
      costsRows.push(['Implementation cost (one time)', Math.round(tech.implCost), 0, '']);
      costsRows.push(['Extras (one time)', Math.round(tech.oneTime), 0, '']);
      costsRows.push(['Support Cost', 0, Math.round(tech.supportCost), '']);

      const wsCosts = XLSX.utils.aoa_to_sheet(costsRows);

      // Basic styling: headers
      const headerStyle = {
        font: { bold: true, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        border: { top: { style: 'thin', color: { rgb: 'CBD5E1' } }, bottom: { style: 'thin', color: { rgb: 'CBD5E1' } }, left: { style: 'thin', color: { rgb: 'CBD5E1' } }, right: { style: 'thin', color: { rgb: 'CBD5E1' } } }
      };
      ['A3', 'B3', 'C3', 'D3'].forEach(addr => {
        if (wsCosts[addr]) wsCosts[addr].s = headerStyle;
      });

      // ---- Sheet 2: Plan (Gantt) ----
      const PLAN_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
      const phaseGridPlan = {};
      resources.forEach(r => {
        const sol = CAPABILITIES.solutions.find(s => s.id === r.solutionId);
        if (!sol) return;
        if (!phaseGridPlan[sol.id]) phaseGridPlan[sol.id] = { label: sol.label, months: Array(12).fill(null) };
        const start = Math.min(Math.max(r.startMonth || 1, 1), 12);
        const end = Math.min(start + (r.duration || 1) - 1, 12);
        for (let m = start; m <= end; m++) phaseGridPlan[sol.id].months[m - 1] = r.phase;
      });
      Object.values(phaseGridPlan).forEach(plan => {
        const months = plan.months;
        const buildEndIndex = months.reduce((lastIdx, phase, idx) => (phase === 'Build' ? idx : lastIdx), -1);
        if (buildEndIndex >= 0 && buildEndIndex < 11) {
          if (!months[buildEndIndex + 1]) months[buildEndIndex + 1] = 'Go Live';
          for (let i = buildEndIndex + 2; i < 12; i++) if (!months[i]) months[i] = 'Hypercare';
        }
      });
      const planRows = [
        ['Feature', ...PLAN_MONTHS.map(m => `M${m}`)]
      ];
      Object.values(phaseGridPlan)
        .sort((a, b) => a.label.localeCompare(b.label))
        .forEach(plan => {
          planRows.push([plan.label, ...plan.months.map(p => p || '')]);
        });
      planRows.push([]);
      planRows.push(['Legend', 'Discovery', 'Build', 'Testing', 'Go Live', 'Hypercare']);

      const wsPlan = XLSX.utils.aoa_to_sheet(planRows);
      // style month header
      for (let c = 0; c <= 12; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (wsPlan[addr]) wsPlan[addr].s = headerStyle;
      }
      // color phase cells
      const startRow = 1;
      const endRow = startRow + Object.keys(phaseGridPlan).length - 1;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = 1; c <= 12; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          const cell = wsPlan[addr];
          const phase = cell?.v;
          const key = phase && PHASE_XLSX[phase] ? phase : 'Empty';
          if (cell) {
            cell.s = {
              fill: { fgColor: { rgb: PHASE_XLSX[key].fill } },
              font: { bold: true, color: { rgb: PHASE_XLSX[key].text } },
              alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
              border: { top: { style: 'thin', color: { rgb: 'E2E8F0' } }, bottom: { style: 'thin', color: { rgb: 'E2E8F0' } }, left: { style: 'thin', color: { rgb: 'E2E8F0' } }, right: { style: 'thin', color: { rgb: 'E2E8F0' } } }
            };
          }
        }
      }

      // ---- Sheet 3: Resources ----
      const resRows = [
        ['Channel', 'Solution', 'Role', 'Phase', 'Start month', 'Qty', 'Duration (mo)', 'Effort (%)', 'Monthly rate', 'Cost']
      ];
      resources.forEach(r => {
        const sol = CAPABILITIES.solutions.find(s => s.id === r.solutionId);
        const role = DEFAULT_ROLES.find(dr => dr.id === r.roleId);
        const mult = rateBand === 'Low' ? 0.9 : rateBand === 'High' ? 1.15 : 1.0;
        const rate = (role?.monthlyRate || 0) * mult;
        const qty = r.quantity || 1;
        const duration = r.duration || 1;
        const effort = (r.effort || 100) / 100;
        const cost = rate * duration * qty * effort;
        resRows.push([
          r.channelId,
          sol?.label || r.solutionId,
          role?.label || r.roleId,
          r.phase,
          `M${r.startMonth || 1}`,
          qty,
          duration,
          Math.round((r.effort || 100)),
          Math.round(rate),
          Math.round(cost)
        ]);
      });
      const wsRes = XLSX.utils.aoa_to_sheet(resRows);
      for (let c = 0; c < resRows[0].length; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (wsRes[addr]) wsRes[addr].s = headerStyle;
      }

      // Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsCosts, 'Costs & Summary');
      XLSX.utils.book_append_sheet(wb, wsPlan, 'Plan');
      XLSX.utils.book_append_sheet(wb, wsRes, 'Resources');

      XLSX.writeFile(wb, `${client.name || 'Project'}_Model.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Export failed. See console for details.");
    }
  };

  // --- STEP RENDERERS ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-fadeIn font-black">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Name</label>
          <input type="text" className="w-full p-4 border-2 border-slate-100 rounded-[18px] focus:border-blue-500 outline-none transition-all font-black text-lg" placeholder="Organization name" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Project owner name</label>
          <input type="text" className="w-full p-4 border-2 border-slate-100 rounded-[18px] focus:border-blue-500 outline-none transition-all font-black text-lg" placeholder="Lead Consultant" value={client.teamMember} onChange={e => setClient({ ...client, teamMember: e.target.value })} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Project owner email address</label>
          <input type="email" className="w-full p-4 border-2 border-slate-100 rounded-[18px] focus:border-blue-500 outline-none transition-all font-black text-lg" placeholder="owner@firstsource.com" value={client.ownerEmail} onChange={e => setClient({ ...client, ownerEmail: e.target.value })} />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter font-black"><Boxes size={20} className="text-blue-600" /> Channels required</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CAPABILITIES.channels.map(ch => (
            <button key={ch.id} onClick={() => {
              const active = requirements.channels.includes(ch.id);
              setRequirements({ ...requirements, channels: active ? requirements.channels.filter(c => c !== ch.id) : [...requirements.channels, ch.id] });
            }} className={`p-6 rounded-[28px] border-2 transition-all flex items-center gap-5 ${requirements.channels.includes(ch.id) ? 'border-blue-600 bg-blue-50 shadow-xl' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${requirements.channels.includes(ch.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}><ch.icon size={22} /></div>
              <span className="font-black text-slate-800 tracking-tight text-lg uppercase">{ch.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter font-black"><Zap size={20} className="text-amber-500" /> Required capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CAPABILITIES.solutions.map(sol => {
            if (!sol.channels.some(c => requirements.channels.includes(c))) return null;
            const active = requirements.solutions.includes(sol.id);
            return (
              <button
                key={sol.id}
                type="button"
                onClick={() => {
                  const isActive = requirements.solutions.includes(sol.id);
                  if (isActive) {
                    const newSolutions = requirements.solutions.filter(s => s !== sol.id);
                    const { [sol.id]: _removed, ...rest } = solutionVendors;
                    setRequirements({ ...requirements, solutions: newSolutions });
                    setSolutionVendors(rest);
                  } else {
                    const newSolutions = [...requirements.solutions, sol.id];
                    setRequirements({ ...requirements, solutions: newSolutions });
                    setSolutionVendors(prev => {
                      if (prev[sol.id]) return prev;
                      const defaultVendor = sol.vendors[0];
                      return { ...prev, [sol.id]: defaultVendor };
                    });
                  }
                }}
                className={`px-6 py-4 rounded-[16px] border-2 font-black transition-all flex items-center gap-4 ${active
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md scale-[1.01]'
                    : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {active ? <CheckCircle size={20} className="text-amber-600" /> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full" />}
                <span className="text-xs uppercase tracking-tight">{sol.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Vendor selection per capability */}
      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-[0.25em]">
          <ShieldCheck size={16} className="text-emerald-600" /> Vendor selection by capability
        </h3>
        <div className="space-y-3">
          {CAPABILITIES.solutions
            .filter(sol => requirements.solutions.includes(sol.id))
            .map(sol => (
              <div
                key={sol.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] uppercase tracking-[0.25em] text-slate-700 font-black">
                    {sol.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sol.vendors.map(vId => {
                    const isActive = solutionVendors[sol.id] === vId;
                    const domain =
                      vId === 'aws'
                        ? 'amazon.com'
                        : vId === 'five9'
                          ? 'five9.com'
                          : vId === 'cresta'
                            ? 'cresta.com'
                            : vId === 'observe'
                              ? 'observe.ai'
                              : `${vId}.ai`;
                    const label =
                      vId === 'aws'
                        ? 'AWS'
                        : vId === 'kore'
                          ? 'Kore.ai'
                          : vId === 'five9'
                            ? 'Five9'
                            : vId === 'cresta'
                              ? 'Cresta'
                              : vId === 'observe'
                                ? 'Observe.ai'
                                : vId === 'yellow'
                                  ? 'Yellow.ai'
                                  : vId.toUpperCase();
                    return (
                      <button
                        key={vId}
                        type="button"
                        onClick={() =>
                          setSolutionVendors(prev => ({ ...prev, [sol.id]: vId }))
                        }
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] transition-all ${isActive
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-50">
                          <img
                            src={`https://img.logo.dev/${domain}?token=${LOGO_TOKEN}`}
                            alt={label}
                            className="h-4 w-4 object-contain"
                          />
                        </span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          {requirements.solutions.length === 0 && (
            <p className="text-[11px] text-slate-400">
              Select at least one capability to choose vendors.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const isAutomationActive = requirements.solutions.some(s => ['civr', 'chatbot'].includes(s));
    // FTE is needed if:
    // - QA Automation or Analytics solutions are selected (agent-based licensing), OR
    // - any supported vendor in the comparison uses seat / per-agent pricing (e.g., Five9, Observe).
    const vendorFteRelevant =
      requirements.solutions.length > 0 &&
      comparisonData.some(
        v => v.supported && ['five9', 'observe'].includes(v.id)
      );
    const isFteRequired =
      requirements.solutions.includes('qaAuto') ||
      requirements.solutions.includes('analytics') ||
      vendorFteRelevant;
    return (
      <div className="space-y-8 animate-fadeIn font-black">
        <div className="bg-slate-800 text-white rounded-[32px] p-6 lg:p-10 shadow-2xl relative overflow-hidden border border-slate-700 max-w-full overflow-x-auto">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-[12px] font-black mb-8 flex items-center gap-3 text-blue-400 uppercase tracking-[0.4em] relative z-10"><Activity size={18} /> Input Requirements</h3>
          <div className="flex flex-row items-stretch justify-between divide-x divide-slate-700/60 relative z-10 min-w-max">
            {requirements.channels.includes('Voice') && (
              <div className="flex flex-col justify-end gap-5 px-8 first:pl-0">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-black">Traffic Mode</p>
                <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-700 h-[52px] items-center">
                  {['inbound', 'outbound', 'both'].map(mode => (
                    <button key={mode} onClick={() => setGlobalParams({ ...globalParams, Voice: { ...globalParams.Voice, mode } })} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${globalParams.Voice.mode === mode ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}>{mode}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-row items-end gap-10 px-8 font-black">
              {(globalParams.Voice.mode === 'inbound' || globalParams.Voice.mode === 'both') && (
                <div className="flex gap-8">
                  <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1 font-black">IB volume</label><input type="text" inputMode="numeric" className="bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-3 w-32 font-black text-xl text-white focus:border-blue-500 outline-none transition-all shadow-lg font-black" value={globalParams.Voice.inboundVol === 0 ? '' : globalParams.Voice.inboundVol} onChange={e => setGlobalParams({ ...globalParams, Voice: { ...globalParams.Voice, inboundVol: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 } })} /></div>
                  <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1 font-black">IB AHT</label><div className="flex items-center gap-3"><input type="text" inputMode="numeric" className="bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-3 w-28 font-black text-xl text-white focus:border-blue-500 outline-none transition-all shadow-lg font-black" value={globalParams.Voice.inboundAht === 0 ? '' : globalParams.Voice.inboundAht} onChange={e => setGlobalParams({ ...globalParams, Voice: { ...globalParams.Voice, inboundAht: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 } })} /><span className="text-[11px] font-black text-slate-600 uppercase font-black">min</span></div></div>
                </div>
              )}
              {(globalParams.Voice.mode === 'outbound' || globalParams.Voice.mode === 'both') && (
                <div className="flex gap-8">
                  <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1 font-black">OB volume</label><input type="text" inputMode="numeric" className="bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-3 w-32 font-black text-xl text-white focus:border-blue-500 outline-none transition-all shadow-lg font-black" value={globalParams.Voice.outboundVol === 0 ? '' : globalParams.Voice.outboundVol} onChange={e => setGlobalParams({ ...globalParams, Voice: { ...globalParams.Voice, outboundVol: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 } })} /></div>
                  <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1 font-black">OB AHT</label><div className="flex items-center gap-3 font-black"><input type="text" inputMode="numeric" className="bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-3 w-28 font-black text-xl text-white focus:border-blue-500 outline-none transition-all shadow-lg font-black" value={globalParams.Voice.outboundAht === 0 ? '' : globalParams.Voice.outboundAht} onChange={e => setGlobalParams({ ...globalParams, Voice: { ...globalParams.Voice, outboundAht: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 } })} /><span className="text-[12px] font-black text-slate-600 uppercase font-black font-black">min</span></div></div>
                </div>
              )}
            </div>
            <div className={`flex flex-col justify-end gap-5 w-56 px-8 transition-all duration-500 ${isAutomationActive ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
              <div className="flex justify-between items-center px-1 font-black font-black"><label className="text-[11px] font-black text-emerald-400 uppercase tracking-widest font-black">Containment</label><span className="text-sm font-black font-mono text-emerald-300 font-black">{globalParams.Voice.containment}%</span></div>
              <input type="range" min="0" max="100" className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-3" value={globalParams.Voice.containment} onChange={e => setGlobalParams({ ...globalParams, Voice: { ...globalParams.Voice, containment: parseInt(e.target.value) } })} />
            </div>
            <div className={`flex flex-col justify-end gap-5 w-56 px-8 transition-all duration-500 ${isAutomationActive ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
              <div className="flex justify-between items-center px-1 font-black font-black font-black"><label className="text-[11px] font-black text-emerald-400 uppercase tracking-widest font-black">Complexity</label><span className="text-sm font-black font-mono text-emerald-300 font-black font-black">{globalParams.Voice.complexity} Turns</span></div>
              <input type="range" min="1" max="25" className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-3" value={globalParams.Voice.complexity} onChange={e => setGlobalParams({ ...globalParams, Voice: { ...globalParams.Voice, complexity: parseInt(e.target.value) } })} />
            </div>
            <div className={`flex flex-col justify-end gap-5 w-56 px-8 transition-all duration-500 ${isFteRequired ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale'}`}>
              <div className="flex justify-between items-center px-1 font-black font-black"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-black">Resource Base</label><span className="text-sm font-black font-mono text-slate-200 font-black font-black">{globalParams.fte} FTE</span></div>
              <input type="range" min="0" max="1000" disabled={!isFteRequired} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400 mb-3" value={globalParams.fte} onChange={e => setGlobalParams({ ...globalParams, fte: parseInt(e.target.value) })} />
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-6 font-black font-black">
          {comparisonData.filter(v => v.supported && v.isSelected).map(vendor => (
            <div
              key={vendor.id}
              className="group bg-white border-4 border-slate-50 hover:border-blue-400 rounded-[40px] p-6 lg:p-8 transition-all flex flex-col lg:flex-row items-stretch gap-10 relative overflow-hidden shadow-xl shadow-slate-100 font-black"
            >
              <div className="lg:w-[24%] flex flex-col justify-center items-center lg:items-start shrink-0 border-r border-slate-50 pr-8 font-black font-black">
                <div className="bg-slate-50 p-4 rounded-[22px] mb-6 border border-slate-100 shadow-sm transition-all group-hover:scale-105 font-black">
                  <img src={`https://img.logo.dev/${vendor.id === 'aws' ? 'amazon.com' : vendor.id === 'five9' ? 'five9.com' : vendor.id === 'cresta' ? 'cresta.com' : vendor.id === 'observe' ? 'observe.ai' : vendor.id + '.ai'}?token=${LOGO_TOKEN}`} className="h-10 w-auto object-contain font-black font-black" alt={vendor.id} />
                </div>
                <div className="space-y-1 text-center lg:text-left font-black">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Monthly Tech run cost
                  </p>
                  <p className="text-3xl font-black font-mono tracking-tighter text-slate-900">
                    $ {vendor.costs.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <div className="flex gap-4 mt-5 pt-4 border-t border-slate-100 font-black">
                    {requirements.channels.includes('Voice') && <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400">Voice</span><span className="text-sm font-black text-slate-800">${vendor.costs.voice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
                    {requirements.channels.includes('Chat') && <div className="flex flex-col border-l border-slate-100 pl-4 font-black"><span className="text-[9px] font-black text-slate-400">Chat</span><span className="text-sm font-black text-slate-800">${vendor.costs.chat.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
                    {requirements.channels.includes('Email') && <div className="flex flex-col border-l border-slate-100 pl-4 font-black"><span className="text-[9px] font-black text-slate-400">Email</span><span className="text-sm font-black text-slate-800">${vendor.costs.email.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>}
                  </div>
                </div>
                <div className="mt-6 w-full text-center text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">
                  Included in analysis
                </div>
              </div>
              <div className="flex-1 bg-slate-50/70 rounded-[40px] p-8 border border-slate-100 flex flex-col justify-center font-black">
                <div className="flex items-center gap-5 mb-8 border-b border-slate-200/60 pb-5 font-black"><Calculator size={20} className="text-blue-500" /><span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] font-black">Cost Breakdown</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                  {vendor.costs.breakdown
                    .filter(item => !item.isTotal)
                    .filter(item => !['Platform Complexity', 'Total Billable Minutes'].includes(item.label))
                    .map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center py-2.5 border-b border-slate-200/50 group transition-colors hover:border-blue-400 font-black`}>
                        <div className="flex items-center gap-4">
                          {item.channel === 'Voice' ? <Mic size={18} className="text-blue-400 shrink-0" /> : item.channel === 'Chat' ? <MessageSquare size={18} className="text-emerald-400 shrink-0" /> : item.channel === 'Email' ? <Mail size={18} className="text-purple-400 shrink-0" /> : <Cpu size={18} className="text-slate-400 shrink-0" />}
                          <div className="flex flex-col"><p className="text-sm font-black text-slate-800 tracking-tight uppercase font-black">{item.label}</p><p className="text-[10px] font-medium text-slate-500 font-mono mt-1 opacity-90">{item.math}</p></div>
                        </div>
                        {item.val !== null && <span className="text-lg font-mono font-black text-slate-900 tracking-tight">$ {item.val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const tech = calculateStackSpecific(client.techStack);
    // Build simple mapping of solutions to selected vendors
    const solutionVendorPairs = CAPABILITIES.solutions
      .filter(sol => requirements.solutions.includes(sol.id) && solutionVendors[sol.id])
      .map(sol => {
        const vId = solutionVendors[sol.id];
        const label =
          vId === 'aws'
            ? 'AWS'
            : vId === 'kore'
              ? 'Kore.ai'
              : vId === 'five9'
                ? 'Five9'
                : vId === 'cresta'
                  ? 'Cresta'
                  : vId === 'observe'
                    ? 'Observe.ai'
                    : vId === 'yellow'
                      ? 'Yellow.ai'
                      : vId.toUpperCase();
        const domain =
          vId === 'aws'
            ? 'amazon.com'
            : vId === 'five9'
              ? 'five9.com'
              : vId === 'cresta'
                ? 'cresta.com'
                : vId === 'observe'
                  ? 'observe.ai'
                  : `${vId}.ai`;
        return { solution: sol.label, vendorId: vId, vendorLabel: label, domain };
      });
    const architectureVendors = Array.from(
      new Map(solutionVendorPairs.map(p => [p.vendorId, { vendorId: p.vendorId, vendorLabel: p.vendorLabel, domain: p.domain }])).values()
    );
    // Build feature-wise 12-month phase plan from resources
    const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
    const phaseGrid = {};

    resources.forEach(r => {
      const sol = CAPABILITIES.solutions.find(s => s.id === r.solutionId);
      if (!sol) return;
      if (!phaseGrid[sol.id]) {
        phaseGrid[sol.id] = {
          id: sol.id,
          label: sol.label,
          months: Array(12).fill(null)
        };
      }
      const start = Math.min(Math.max(r.startMonth || 1, 1), 12);
      const end = Math.min(start + (r.duration || 1) - 1, 12);
      for (let m = start; m <= end; m++) {
        phaseGrid[sol.id].months[m - 1] = r.phase;
      }
    });

    // After Build finishes, ensure a Go-Live month and Hypercare for remaining months
    Object.values(phaseGrid).forEach(plan => {
      const months = plan.months;
      const buildEndIndex = months.reduce(
        (lastIdx, phase, idx) => (phase === 'Build' ? idx : lastIdx),
        -1
      );
      if (buildEndIndex >= 0 && buildEndIndex < 11) {
        // Go-Live milestone immediately after Build, if nothing else is set
        if (!months[buildEndIndex + 1]) {
          months[buildEndIndex + 1] = 'Go Live';
        }
        // Hypercare for remaining empty months
        for (let i = buildEndIndex + 2; i < 12; i++) {
          if (!months[i]) {
            months[i] = 'Hypercare';
          }
        }
      }
    });

    const solutionPlans = Object.values(phaseGrid).sort((a, b) =>
      a.label.localeCompare(b.label)
    );

    return (
      <div className="space-y-8 animate-fadeIn font-black">
        <div className="bg-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between border-2 border-slate-800/80 gap-6 relative overflow-hidden font-black">
          <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r-full font-black" />
          <div className="flex flex-col gap-4 relative z-10 font-black">
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Architecture baseline
              </p>
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight">
                Multi-vendor deployment
              </h2>
            </div>
            {architectureVendors.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {architectureVendors.map(v => (
                  <div
                    key={v.vendorId}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-800/60 px-3 py-1.5 border border-slate-700"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-900">
                      <img
                        src={`https://img.logo.dev/${v.domain}?token=${LOGO_TOKEN}`}
                        alt={v.vendorLabel}
                        className="h-4 w-4 object-contain"
                      />
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.25em] text-slate-100">
                      {v.vendorLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {solutionVendorPairs.length > 0 && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6 text-[11px] text-slate-300 uppercase tracking-[0.2em]">
                {solutionVendorPairs.map(p => (
                  <div key={`${p.solution}-${p.vendorId}`} className="flex items-center gap-2">
                    <span className="text-slate-500">•</span>
                    <span className="font-black">
                      {p.solution} → {p.vendorLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-right relative z-10 font-black">
            <p className="text-[11px] font-black text-blue-300 uppercase tracking-widest mb-1.5">
              Tech OPEX (baseline)
            </p>
            <p className="text-3xl lg:text-4xl font-black font-mono tracking-tighter text-white">
              $ {tech?.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 lg:p-6 shadow-md font-black">
          <div className="flex justify-between items-center mb-4 font-black">
            <h3 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight uppercase font-black">
              Implementation framework
            </h3>
            <button
              onClick={autoPlan}
              className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2 font-black font-black"
            >
              <Briefcase size={18} /> Baseline Auto-Plan
            </button>
          </div>
          {solutionPlans.length > 0 && (
            <div className="mt-4 space-y-3">
              {/* Month header */}
              <div className="pl-28 lg:pl-32 pr-4 flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {MONTHS.map(m => (
                  <span key={m} className="flex-1 text-center">
                    M{m}
                  </span>
                ))}
              </div>
              {/* Phase rows */}
              <div className="space-y-2">
                {solutionPlans.map(plan => (
                  <div key={plan.id} className="flex items-center gap-4">
                    <div className="w-24 lg:w-28 text-[11px] font-black text-slate-700 uppercase tracking-[0.18em]">
                      {plan.label}
                    </div>
                    <div className="flex-1 grid grid-cols-12 gap-[3px]">
                      {MONTHS.map((m, idx) => {
                        const phase = plan.months[idx];
                        const phaseClass = phase ? PHASE_BG_COLORS[phase] || 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-300';
                        return (
                          <div
                            key={m}
                            className={`h-6 rounded-md text-[9px] flex items-center justify-center font-black ${phaseClass}`}
                            title={phase ? `${phase} - Month ${m}` : `No planned work - Month ${m}`}
                          >
                            {phase ? phase[0] : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {/* Phase legend */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-[10px] text-slate-500">
                {PHASES.map(phase => (
                  <div key={phase} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-sm ${PHASE_BG_COLORS[phase]}`} />
                    <span className="uppercase tracking-[0.18em] font-black">{phase}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-10">
          {requirements.channels.map(ch => (
            <div key={ch} className="bg-white border-2 border-slate-200 rounded-3xl p-6 lg:p-8 shadow-md mb-8 font-black font-black">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 font-black font-black">
                {ch === 'Voice' ? (
                  <Mic size={24} className="text-blue-500" />
                ) : ch === 'Chat' ? (
                  <MessageSquare size={24} className="text-emerald-500" />
                ) : (
                  <Mail size={24} className="text-purple-500" />
                )}
                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight font-black">
                  {ch} stream execution
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-8 font-black">
                {CAPABILITIES.solutions.filter(s => s.channels.includes(ch) && requirements.solutions.includes(s.id)).map(sol => {
                  const streamResources = resources.filter(r => r.channelId === ch && r.solutionId === sol.id);
                  const streamTotal = streamResources.reduce((acc, r) => {
                    const role = DEFAULT_ROLES.find(dr => dr.id === r.roleId);
                    const mult = rateBand === 'Low' ? 0.9 : rateBand === 'High' ? 1.15 : 1.0;
                    return acc + (role ? ((role.monthlyRate * mult) * r.duration * (r.quantity || 1) * ((r.effort || 100) / 100)) : 0);
                  }, 0);
                  return (
                    <div key={sol.id} className="space-y-6 bg-slate-50/40 rounded-2xl p-6 border border-slate-100 font-black font-black">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl font-black font-black">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse font-black" />
                          <p className="text-sm font-black text-slate-700 uppercase tracking-widest">
                            {sol.label}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setResources([
                              ...resources,
                              {
                                id: Math.random(),
                                channelId: ch,
                                solutionId: sol.id,
                                roleId: 'sa',
                                phase: 'Build',
                                startMonth: 1,
                                duration: 1,
                                quantity: 1,
                                effort: 100
                              }
                            ])
                          }
                          className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 flex items-center gap-2 font-black font-black"
                        >
                          <Plus size={16} /> Add resource
                        </button>
                      </div>
                      {streamResources.length > 0 && (
                        <div className="overflow-x-auto font-black font-black font-black">
                          <table className="w-full text-left text-sm font-black">
                            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-black font-black font-black"><tr><th className="pb-5 px-3 uppercase font-black">Squad role</th><th className="pb-5 px-3 uppercase font-black">Lifecycle Phase</th><th className="pb-5 px-3 text-center uppercase font-black">Start month</th><th className="pb-5 px-3 text-center uppercase font-black">Qty</th><th className="pb-5 px-3 text-center uppercase font-black font-black">Duration (Mo)</th><th className="pb-5 px-3 text-center uppercase font-black font-black">Effort %</th><th className="pb-5 px-3 text-right uppercase font-black">Investment</th><th className="pb-5"></th></tr></thead>
                            <tbody className="divide-y divide-slate-50 font-black font-black">
                              {streamResources.map(res => {
                                const role = DEFAULT_ROLES.find(r => r.id === res.roleId);
                                const mult = rateBand === 'Low' ? 0.9 : rateBand === 'High' ? 1.15 : 1.0;
                                const cost = ((role?.monthlyRate || 0) * mult) * res.duration * res.quantity * (res.effort / 100);
                                return (
                                  <tr key={res.id} className="group hover:bg-slate-50/50 transition-colors font-black">
                                    <td className="py-5 px-3 font-black"><select className="bg-transparent outline-none uppercase text-xs font-black" value={res.roleId} onChange={e => setResources(resources.map(r => r.id === res.id ? { ...r, roleId: e.target.value } : r))}>{DEFAULT_ROLES.map(dr => <option key={dr.id} value={dr.id}>{dr.label}</option>)}</select></td>
                                    <td className="py-5 px-3 font-black"><select className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-black ${PHASE_BG_COLORS[res.phase]} font-black`} value={res.phase} onChange={e => setResources(resources.map(r => r.id === res.id ? { ...r, phase: e.target.value } : r))}>{PHASES.map(p => <option key={p} value={p}>{p}</option>)}</select></td>
                                    <td className="py-5 px-3 text-center font-black font-black">
                                      <select
                                        className="bg-transparent outline-none text-center font-black text-xs uppercase"
                                        value={res.startMonth || 1}
                                        onChange={e => setResources(resources.map(r => r.id === res.id ? { ...r, startMonth: parseInt(e.target.value) || 1 } : r))}
                                      >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                          <option key={m} value={m}>{`M${m}`}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="py-5 px-3 text-center font-black font-black">
                                      <input
                                        type="number"
                                        min="1"
                                        className="w-14 bg-transparent text-center focus:text-blue-600 outline-none font-black text-lg"
                                        value={res.quantity || 1}
                                        onChange={e => setResources(resources.map(r => r.id === res.id ? { ...r, quantity: parseInt(e.target.value) || 1 } : r))}
                                      />
                                    </td>
                                    <td className="py-5 px-3 text-center font-black font-black"><input type="number" min="1" className="w-16 bg-transparent text-center focus:text-blue-600 outline-none font-black text-lg" value={res.duration} onChange={e => setResources(resources.map(r => r.id === res.id ? { ...r, duration: parseInt(e.target.value) || 1 } : r))} /></td>
                                    <td className="py-5 px-3 text-center font-black font-black"><input type="number" min="0" max="100" className="w-16 bg-transparent text-center focus:text-blue-600 outline-none font-black text-lg" value={res.effort} onChange={e => setResources(resources.map(r => r.id === res.id ? { ...r, effort: parseInt(e.target.value) || 0 } : r))} /></td>
                                    <td className="py-5 px-3 text-right font-mono font-black text-slate-700 text-lg font-black font-black">$ {cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="py-5 text-center font-black font-black"><button onClick={() => setResources(resources.filter(r => r.id !== res.id))} className="text-slate-200 group-hover:text-red-500 transition-colors font-black font-black"><Trash2 size={20} /></button></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end items-center gap-4 font-black font-black">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total stream investment</span>
                            <span className="text-2xl font-black font-mono text-blue-600 tracking-tighter">$ {streamTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    if (!finalFinancials) return null;
    const run = finalFinancials.total * 12;
    const tcoData = Array.from({ length: 5 }).map((_, i) => {
      const year = i + 1;
      const opex = run;
      const capex = year === 1 ? (finalFinancials.implCost + finalFinancials.oneTime) : 0;
      const support = year > 1 ? finalFinancials.supportCost : 0;
      return { name: `Year ${year}`, OpEx: opex, CapEx: capex, Support: support, Total: opex + capex + support };
    });
    const cumulativeData = tcoData.reduce((acc, curr, i) => {
      const prev = i === 0 ? 0 : acc[i - 1].val;
      acc.push({ name: curr.name, val: prev + curr.Total });
      return acc;
    }, []);

    return (
      <div className="space-y-12 animate-fadeIn pb-24 font-black">
        <div className="text-center mb-10 font-black"><h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4 font-black">Summary</h2><p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[12px] font-black">Investment roadmap</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-black font-black">
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[48px] shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all font-black">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest font-black">Monthly Tech run cost</p>
            <p className="text-2xl font-black font-mono text-slate-900 font-black">$ {finalFinancials.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[48px] shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all font-black">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest font-black">Implementation cost (one time)</p>
            <p className="text-2xl font-black font-mono text-slate-900 font-black font-black">$ {finalFinancials.implCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[48px] shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all font-black">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest font-black font-black font-black">Extras</p>
            <p className="text-2xl font-black font-mono text-slate-900 font-black font-black">$ {finalFinancials.oneTime.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[48px] shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all font-black">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest font-black font-black font-black">Annual Support</p>
            <p className="text-2xl font-black font-mono text-slate-900 font-black font-black font-black">$ {finalFinancials.supportCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-black font-black">
          <div className="p-10 bg-slate-900 text-white rounded-[56px] shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden group font-black font-black">
            <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors font-black font-black" />
            <p className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em] relative z-10 font-black font-black">3-Year roadmap TCO</p>
            <p className="text-5xl font-black font-mono text-blue-400 relative z-10 font-black font-black">$ {finalFinancials.year3TCO.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className={`p-10 border rounded-[56px] shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden group font-black font-black font-black ${finalFinancials.isBest ? 'bg-emerald-50/50 border-emerald-300 font-black font-black' : 'bg-white border-slate-100'} font-black font-black`}>
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors font-black font-black" />
            <p className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em] relative z-10 font-black font-black font-black font-black">5-Year roadmap TCO</p>
            <p className={`text-5xl font-black font-mono relative z-10 font-black ${finalFinancials.isBest ? 'text-emerald-600 font-black font-black' : 'text-slate-900 font-black'} font-black`}>$ {finalFinancials.year5TCO.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 font-black font-black font-black">
          <div className="bg-white border-2 border-slate-50 p-12 rounded-[64px] h-[500px] shadow-2xl shadow-slate-100 font-black font-black">
            <div className="flex justify-between items-center mb-12 font-black uppercase tracking-[0.4em] text-[12px] text-slate-400 font-black">Cumulative roadmap growth</div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '20px',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(15,23,42,0.35)',
                    fontWeight: '900'
                  }}
                  formatter={(v) => [`$${(v / 1000).toFixed(1)}k`, 'Cumulative spend']}
                />
                <Line
                  type="monotone"
                  dataKey="val"
                  stroke="#0f172a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border-2 border-slate-50 p-12 rounded-[64px] h-[500px] shadow-2xl shadow-slate-100 font-black font-black">
            <div className="flex justify-between items-center mb-12 font-black uppercase tracking-[0.4em] text-[12px] text-slate-400 font-black">One-time vs run cost allocation</div>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={tcoData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} /><RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 'black' }} /><Legend wrapperStyle={{ fontSize: '11px', fontWeight: '900', paddingTop: '30px' }} /><Bar dataKey="OpEx" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} /><Bar dataKey="CapEx" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} /><Bar dataKey="Support" stackId="a" fill="#f59e0b" radius={[20, 20, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </div>
        <div className="flex gap-6 font-black font-black font-black">
          <button onClick={saveDeal} disabled={loading} className="flex-1 py-8 bg-blue-600 text-white rounded-[40px] font-black uppercase tracking-[0.4em] text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-5 shadow-2xl active:scale-95 text-lg font-black font-black">{loading ? 'Publishing...' : <><Save size={28} /> Save cost calculation to pipeline</>}</button>
          <button onClick={exportToExcel} className="flex-1 py-8 bg-emerald-600 text-white rounded-[40px] font-black uppercase tracking-[0.4em] text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 text-lg font-black font-black font-black font-black font-black font-black font-black"><Download size={28} /> Export result sheet</button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[96%] mx-auto p-4 lg:p-10 min-h-screen flex flex-col font-black font-black">
      {/* Compact Stepper */}
      <div className="flex items-center justify-between mb-12 px-32 relative font-black font-black">
        <div className="absolute top-6 left-32 right-32 h-0.5 bg-slate-100 -z-0 font-black font-black font-black" />
        {[{ n: 1, l: 'Discovery' }, { n: 2, l: 'Analysis' }, { n: 3, l: 'Execution' }, { n: 4, l: 'Portfolio' }].map(s => (
          <div key={s.n} className="relative z-10 flex flex-col items-center font-black font-black font-black">
            <div className={`w-12 h-12 rounded-[22px] flex items-center justify-center font-black text-lg transition-all duration-500 font-black font-black font-black ${step >= s.n ? 'bg-blue-600 text-white shadow-2xl scale-110 font-black font-black font-black' : 'bg-white border-2 border-slate-100 text-slate-200 font-black font-black font-black'}`}>{step > s.n ? <Check size={24} /> : s.n}</div>
            <span className={`text-[10px] mt-4 font-black uppercase tracking-[0.4em] font-black font-black ${step >= s.n ? 'text-blue-700' : 'text-slate-200'}`}>{s.l}</span>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-[80px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.06)] border border-slate-50 p-10 lg:p-16 min-h-[900px] flex flex-col transition-all duration-700 ease-in-out font-black font-black">
        <div className="flex-1 font-black">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
        <div className="mt-20 pt-16 flex justify-between items-center border-t border-slate-50 font-black font-black font-black font-black font-black font-black">
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!client.name || requirements.channels.length === 0}
              className="ml-auto bg-blue-600 text-white px-16 py-6 rounded-[32px] font-black uppercase tracking-[0.4em] text-[12px] flex items-center gap-5 hover:bg-blue-700 disabled:opacity-10 transition-all shadow-2xl active:scale-95 font-black"
            >
              Execute Analysis <ArrowRight size={22} />
            </button>
          )}
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-5 text-slate-400 font-black hover:text-slate-900 transition-colors uppercase text-[12px] tracking-[0.4em] font-black"
            >
              <ArrowLeft size={18} /> Return to Discovery
            </button>
          )}
          {step === 2 && (
            <button
              onClick={goToExecution}
              className="ml-auto bg-blue-600 text-white px-16 py-6 rounded-[32px] font-black uppercase tracking-[0.4em] text-[12px] flex items-center gap-5 hover:bg-blue-700 transition-all shadow-2xl active:scale-95 font-black"
            >
              Next <ArrowRight size={22} />
            </button>
          )}
          {step === 3 && (
            <button
              onClick={() => setStep(4)}
              disabled={resources.length === 0}
              className="ml-auto bg-blue-600 text-white px-16 py-6 rounded-[32px] font-black uppercase tracking-[0.4em] text-[12px] flex items-center gap-5 hover:bg-blue-700 disabled:opacity-10 transition-all shadow-2xl active:scale-95 font-black"
            >
              Finalize Portfolio <ArrowRight size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PIPELINE DASHBOARD ---

const Dashboard = ({ user }) => {
  const [deals, setDeals] = useState([]);
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'deals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (s) => setDeals(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);
  return (
    <div className="max-w-[92%] mx-auto py-12 px-6 lg:px-16 animate-fadeIn font-black">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Strategic pipeline
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-400 font-black">
            Packed view of active cost models
          </p>
        </div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-black">
          {deals.length} deals
        </span>
      </div>
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr,1.5fr,1.5fr,1.2fr,1.5fr] gap-4 px-6 py-3 border-b border-slate-100 text-[11px] uppercase tracking-[0.25em] text-slate-400 font-black">
          <span>Client / Owner</span>
          <span>Tech stack</span>
          <span>Monthly tech run cost</span>
          <span>5-year TCO</span>
          <span className="text-right">Archived on</span>
        </div>
        <div className="divide-y divide-slate-100">
          {deals.map(deal => (
            <div
              key={deal.id}
              className="px-4 md:px-6 py-4 flex flex-col md:grid md:grid-cols-[2fr,1.5fr,1.5fr,1.2fr,1.5fr] gap-3 md:gap-4 items-start md:items-center hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 hidden md:flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {deal.client?.name || 'Unnamed client'}
                  </p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-[0.25em] mt-1">
                    Owner: {deal.client?.teamMember || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="text-xs md:text-sm font-black text-slate-700">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-600">
                  {deal.client?.techStack || 'N/A'} architecture
                </span>
              </div>
              <div className="text-xs md:text-sm font-mono text-slate-900">
                $ {deal.financials?.total ? deal.financials.total.toFixed(0) : 0}
              </div>
              <div className="text-xs md:text-sm font-mono text-emerald-600">
                $ {deal.financials?.year5TCO ? deal.financials.year5TCO.toLocaleString() : 0}
              </div>
              <div className="w-full text-xs md:text-sm text-slate-400 md:text-right">
                {deal.createdAt?.toDate
                  ? deal.createdAt.toDate().toLocaleDateString()
                  : 'Archived'}
              </div>
            </div>
          ))}
          {deals.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-slate-400 font-black">
              No deals in the pipeline yet. Save a cost calculation from the estimator to see it here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (auth) {
      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } else { await signInAnonymously(auth); }
      };
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, setUser);
      return () => unsubscribe();
    }
  }, []);
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 font-black font-black font-black font-black font-black">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 ml-20 lg:ml-64 relative overflow-x-hidden font-black font-black font-black font-black font-black">
        {activeTab === 'dashboard' ? <Dashboard user={user} /> : <EstimatorWizard user={user} />}
      </main>
    </div>
  );
}