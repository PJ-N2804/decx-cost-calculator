
// Mock Data
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

// State
const requirements = {
    channels: ['Voice'],
    solutions: ['telephony', 'qaAuto'] // Telephony by Five9, QA by Observe
};
const globalParams = {
    Voice: { mode: 'inbound', inboundVol: 10000, outboundVol: 0, inboundAht: 5, outboundAht: 3, complexity: 5, containment: 15 },
    Chat: { volume: 5000, complexity: 8, containment: 20 },
    Email: { volume: 2000 },
    fte: 10
};
const solutionVendors = {
    'telephony': 'five9',
    'qaAuto': 'observe'
    // AWS is NOT selected for anything
};

// --- Logic from App.jsx ---

const calculateStackSpecific = (stackId) => {
    if (!stackId) return null;
    let voice = 0, chat = 0, email = 0, fixed = 0, oneTime = 0, infra = 0;
    const p = REGIONAL_PRICING['US'];
    const vp = VENDOR_PRICING;
    const breakdown = [];

    const vData = globalParams.Voice;
    const totalCalls = (vData.inboundVol || 0) + (vData.outboundVol || 0);
    const totalVolMin = ((vData.inboundVol || 0) * (vData.inboundAht || 0)) + ((vData.outboundVol || 0) * (vData.outboundAht || 0));

    // Helper to check if this stack (vendor) is selected for a specific solution
    const isVendorFor = (solId) => solutionVendors[solId] === stackId;
    const isVendorForAny = (solIds) => solIds.some(id => solutionVendors[id] === stackId);

    if (stackId === 'aws') {
        if (requirements.channels.includes('Voice')) {
            // AWS only charges if selected for Telephony (Connect) or CIVR
            if (isVendorFor('telephony') || isVendorFor('civr')) {
                // ... calc ...
                voice += 1000; // Mock value
            }
            if (requirements.solutions.includes('qaAuto') && isVendorFor('qaAuto')) {
                infra += 500; // Mock value
            }
        }
    } else if (stackId === 'five9') {
        const usesVoice = requirements.channels.includes('Voice') && (isVendorFor('telephony') || isVendorFor('liveChat'));
        if (usesVoice) {
            const seatTotal = (globalParams.fte || 0) * vp.five9.voice_seat;
            voice += seatTotal;
        }
    } else if (stackId === 'observe') {
        if (isVendorFor('qaAuto') || isVendorFor('analytics')) {
            const obsCost = (globalParams.fte || 0) * vp.observe.per_agent_monthly;
            voice += obsCost;
        }
    }
    return { total: voice + chat + email + fixed + infra, voice, chat, email, fixed, oneTime, infra, breakdown };
};

// Simulation of finalFinancials
const activeVendors = Array.from(new Set(Object.values(solutionVendors || {}).filter(Boolean)));
let totalTech = { total: 0 };

console.log("Active Vendors:", activeVendors);

activeVendors.forEach(vId => {
    const vCosts = calculateStackSpecific(vId);
    console.log(`Cost for ${vId}:`, vCosts.total);
    totalTech.total += vCosts.total;
});

console.log("Total Aggregated Cost:", totalTech.total);

// Expected:
// Five9 Cost: 10 * 159 = 1590
// Observe Cost: 10 * 69 = 690
// AWS Cost: 0 (Not selected)
// Total: 2280

if (totalTech.total === 2280) {
    console.log("SUCCESS: Aggregation verified.");
} else {
    console.log("FAILURE: Incorrect aggregation.");
}
