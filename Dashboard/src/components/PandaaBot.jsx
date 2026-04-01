import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import './PandaaBot.css';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const CONTACT_SCRIPT_URL = import.meta.env.VITE_CONTACT_SCRIPT_URL;

const generateUserToken = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const ChatTile = React.memo(({ msg }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start',
                transform: 'translateZ(0)'
            }}
        >
            <div style={{
                maxWidth: '85%',
                padding: '16px',
                borderRadius: '18px',
                borderBottomLeftRadius: msg.type === 'bot' ? '0' : '18px',
                borderBottomRightRadius: msg.type === 'user' ? '0' : '18px',
                fontSize: '14px',
                lineHeight: '1.6',
                background: msg.type === 'user' ? '#3b42f2' : '#1a1a2e',
                color: 'white',
                border: msg.type === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: msg.type === 'user' ? '0 8px 24px rgba(59,66,242,0.2)' : '0 4px 12px rgba(0,0,0,0.2)'
            }}>
                {msg.text}
            </div>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '6px', padding: '0 12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </motion.div>
    );
});

ChatTile.displayName = 'ChatTile';

export const PandaaBot = () => {
    const { playClick } = useAudio();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('WELCOME');

    const [userName, setUserName] = useState(() => localStorage.getItem('pandaa_user_name') || '');
    const [userToken] = useState(() => {
        let token = localStorage.getItem('pandaa_user_token');
        if (!token) {
            token = generateUserToken();
            localStorage.setItem('pandaa_user_token', token);
        }
        return token;
    });

    const [userIp, setUserIp] = useState('');
    const [dbSessionId, setDbSessionId] = useState(null); // Links to pandaa_sessions (History)
    const [usageId, setUsageId] = useState(null);       // Links to pandaa_usage (Limits)
    const [cycleStart, setCycleStart] = useState(null);
    const [tempName, setTempName] = useState('');
    const [lastNameChange, setLastNameChange] = useState(() => parseInt(localStorage.getItem('pandaa_last_name_change') || '0'));
    const [aiMessageCount, setAiMessageCount] = useState(0);
    const [refineCount, setRefineCount] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    
    const [cooldown, setCooldown] = useState(0);

    const [email, setEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('pandaa_chat_messages');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
            } catch (e) {
                console.error("Error parsing saved messages:", e);
            }
        }
        return [];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef(null);

    const isEmailValid = useMemo(() => {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        return gmailRegex.test(email);
    }, [email]);

    const isMessageValid = useMemo(() => contactMessage.trim().length >= 10, [contactMessage]);
    const canSubmitInquiry = useMemo(() => isEmailValid && isMessageValid && !isSubmitting, [isEmailValid, isMessageValid, isSubmitting]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    useEffect(() => {
        const initHybridSession = async () => {
            console.log("PandaaBot: Starting Hybrid Sync...");
            try {
                // 1. Robust IP Detection
                let ip = '';
                try {
                    const ipRes = await fetch('https://api.ipify.org?format=json');
                    const data = await ipRes.json();
                    ip = data.ip;
                    console.log("PandaaBot: Detected IP (ipify):", ip);
                } catch (e) {
                    console.warn("PandaaBot: ipify failed, trying fallback 1 (ipapi.co)...");
                    try {
                        const fallRes = await fetch('https://ipapi.co/json/');
                        const data = await fallRes.json();
                        ip = data.ip;
                        console.log("PandaaBot: Detected IP (ipapi):", ip);
                    } catch (fe) {
                        console.warn("PandaaBot: ipapi failed, trying fallback 2 (seeip.org)...");
                        try {
                            const lastRes = await fetch('https://api.seeip.org/jsonip');
                            const data = await lastRes.json();
                            ip = data.ip || data.ip_address;
                            console.log("PandaaBot: Detected IP (seeip):", ip);
                        } catch (le) {
                            console.error("PandaaBot: All IP detection services failed.", le);
                        }
                    }
                }
                
                if (ip) {
                    setUserIp(ip);
                    const currentStoredName = localStorage.getItem('pandaa_user_name') || userName || '';
                    
                    // 2. Atomic Upsert for Usage Limits
                    const { data: usage, error: usageError } = await supabase.from('pandaa_usage').upsert({
                        ip_address: ip,
                        user_name: currentStoredName,
                        last_active: new Date().toISOString()
                    }, { onConflict: 'ip_address' }).select().single();

                    if (usageError) {
                        console.error("PandaaBot: Usage Upsert Error (Check SQL Permissions):", usageError);
                    } else if (usage) {
                        console.info("PandaaBot: Usage sync success for IP:", ip);
                        setUsageId(usage.id);
                        setAiMessageCount(usage.ai_message_count || 0);
                        setRefineCount(usage.contact_refine_count || 0);
                        setCycleStart(new Date(usage.cycle_start || usage.created_at));
                        setIsBlocked(usage.is_blocked || false);
                        
                        // Sync Name if DB has it but Frontend doesn't
                        if (usage.user_name && !userName) {
                            setUserName(usage.user_name);
                            localStorage.setItem('pandaa_user_name', usage.user_name);
                        }
                    }
                }

                // 3. Token Sync (for History & Name Persistence)
                const { data: session, error: sessionError } = await supabase.from('pandaa_sessions').select('*').eq('token', userToken).single();
                
                if (sessionError && sessionError.code !== 'PGRST116') {
                    console.error("PandaaBot: Session check error:", sessionError);
                }

                if (session) {
                    setDbSessionId(session.id);
                    const finalName = session.name || userName || '';
                    if (finalName && !userName) {
                        setUserName(finalName);
                        localStorage.setItem('pandaa_user_name', finalName);
                    }
                } else {
                    const { data: newSession } = await supabase.from('pandaa_sessions').insert({ 
                        token: userToken, 
                        name: userName || localStorage.getItem('pandaa_user_name') || ''
                    }).select().single();
                    if (newSession) setDbSessionId(newSession.id);
                }
            } catch (err) {
                console.error("PandaaBot: Hybrid Sync Fatal Error:", err);
            }
        };
        initHybridSession();
    }, [userToken]);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('pandaa_chat_messages', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen && view === 'CHAT_MAIN' && dbSessionId && messages.length <= 1) {
            const fetchHistory = async () => {
                const { data: history } = await supabase
                    .from('pandaa_chat_history')
                    .select('*')
                    .eq('session_id', dbSessionId)
                    .order('created_at', { ascending: true });

                if (history && history.length > 0) {
                    const dbMessages = history.map(m => ({
                        id: m.id.toString(),
                        type: m.role === 'user' ? 'user' : 'bot',
                        text: m.content,
                        timestamp: new Date(m.created_at)
                    }));
                    if (messages.length === 0) setMessages(dbMessages);
                } else if (messages.length === 0) {
                     setMessages([{ id: 'init', type: 'bot', text: `Dashboard session active. Welcome back ${userName || 'User'}! How can I assist with your profile today?`, timestamp: new Date() }]);
                }
            };
            fetchHistory();
        }
    }, [isOpen, view, dbSessionId, messages.length, userName]);

    const fetchGroqAI = async (prompt, systemPrompt) => {
        if (!GROQ_API_KEY) return null;
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
        } catch (error) {
            console.error("Groq API Error:", error);
            return null;
        }
    };

    const persistMessage = async (role, content) => {
        if (!dbSessionId) return;
        await supabase.from('pandaa_chat_history').insert({
            session_id: dbSessionId,
            role,
            content
        });
    };

    const updateDbLimits = async (updates) => {
        if (usageId) await supabase.from('pandaa_usage').update(updates).eq('id', usageId);
        // Also sync name to sessions if changed
        if (updates.user_name && dbSessionId) {
            await supabase.from('pandaa_sessions').update({ name: updates.user_name }).eq('id', dbSessionId);
        }
    };

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen && view === 'CHAT_MAIN') scrollToBottom();
    }, [messages, isOpen, view, isTyping, scrollToBottom]);

    const handleSendMessage = async () => {
        if (!input.trim() || isBlocked || cooldown > 0) return;

        const now = new Date();
        let currentCount = aiMessageCount;
        let currentCycleStart = cycleStart;

        // 24-Hour Reset Logic
        if (currentCycleStart && (now - currentCycleStart > 24 * 60 * 60 * 1000)) {
            currentCount = 0;
            currentCycleStart = now;
            setCycleStart(now);
            updateDbLimits({ cycle_start: now.toISOString(), ai_message_count: 0 });
        }

        if (currentCount >= 15) {
            setMessages(prev => [...prev, { id: 'limit-' + Date.now(), type: 'bot', text: "Daily message limit (15) reached. Please try again after 24 hours.", timestamp: new Date() }]);
            return;
        }
        
        playClick();
        const userMsg = { id: Date.now().toString(), type: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        persistMessage('user', input);
        
        const newCount = currentCount + 1;
        setAiMessageCount(newCount);
        updateDbLimits({ ai_message_count: newCount, last_active: now.toISOString() });
        setCooldown(3);

        const currentInput = input;
        setInput('');
        setIsTyping(true);

        let dataContext = "";
        
        const foundEmail = currentInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)?.[0];
        if (foundEmail) setEmail(foundEmail);
        const effectiveEmail = foundEmail || email;

        // Smart Status Trigger: Check status on email detection OR if user asks follow-up
        const statusKeywords = ['status', 'apply', 'my application', 'reviewed', 'result', 'now tell me', 'tell me', 'check'];
        const isFollowUp = ['now', 'tell me', 'can you', 'what about'].some(k => currentInput.toLowerCase().includes(k));
        
        if (effectiveEmail && (statusKeywords.some(k => currentInput.toLowerCase().includes(k)) || foundEmail || isFollowUp)) {
            const { data: status } = await supabase.rpc('get_pandaa_application_status', { p_email: effectiveEmail });
            if (status && status.length > 0) {
                dataContext += `[REAL-TIME STATUS] Applicant: ${status[0].full_name}. Status: ${status[0].status}. Remark: ${status[0].remark}. `;
            } else if (foundEmail || statusKeywords.some(k => currentInput.toLowerCase().includes(k))) {
                dataContext += `[NO_STATUS_FOUND: No record found for ${effectiveEmail}.] `;
            }
        }

        // Improved Knowledge Search: Lower threshold (0.05) and include Top 3 matches for "dataset" coverage
        const { data: knowledgeMatch } = await supabase.rpc('search_pandaa_knowledge', { p_query: currentInput });
        if (knowledgeMatch && knowledgeMatch.length > 0) {
             const topMatches = knowledgeMatch.filter(m => m.rank > 0.05).slice(0, 3);
             topMatches.forEach(match => {
                dataContext += `[CORE KNOWLEDGE MATCH] Question Context: ${match.instruction}. Truthful Answer: ${match.response}. `;
             });
        }

        const systemPrompt = `You are PANDAA, the highly intelligent GKK/Bubblesort AI Assistant. User: ${userName}. 
INTERNAL CONTEXT (Do not mention these tags to the user):
${dataContext || "[GENERAL_INQUIRY]"}

CORE COMPANY KNOWLEDGE (Absolute Truth):
- Parent Company: Bubblesort (Located in Kolkata, West Bengal).
- GKK (Ghar Ka Khana): A Bubblesort sub-project for home-cooked food delivery (Alpha Testing Phase).
- GKKIntern: The official internship and services wing of Bubblesort (1-month internships, UI/UX, Web Dev, Full Stack).
- Contact: info@gkkintern.in | +91 94775 64633.

OFFICIAL LEADERSHIP TEAM:
- ADITYA ROUTH: Founder & CEO.
- PAYEL DEY: Co-Founder & CMO.
- DEBRAJ PRADHAN: CTO (Chief Technical Officer).
- ANIRBAN DAS: COO (Chief Operating Office) & VC.
- NIKUNJ AGARWAL: HOG (Head of Growth) & HR.
- ANKAN MUKHERJEE: HOC (Head of Curriculum) & Executive Head.

If [MISSING_EMAIL] appears, politely ask for their application Gmail.
If [REAL-TIME STATUS] is provided, report application results clearly. 
If [CORE KNOWLEDGE MATCH] is found, use it as the primary source of truth.
FEE POLICY: Strictly state: "There are minimal fees for profile hosting and server provision." 
Be proactive, technical, and accurate. Use the full leadership names if asked about the team.`;

        const aiResponse = await fetchGroqAI(currentInput, systemPrompt);
        
        const botText = aiResponse || `I'm analyzing your dashboard details, ${userName}. How else can I assist?`;
        setIsTyping(false);
        setMessages(prev => [...prev, { id: 'bot-' + Date.now(), type: 'bot', text: botText, timestamp: new Date() }]);
        persistMessage('assistant', botText);
    };

    const handleStartChat = async () => {
        const activeName = tempName.trim() || userName || 'User'; // FIX: Capture tempName here
        if (!activeName) return;
        const now = Date.now();
        setUserName(activeName);
        setLastNameChange(now);
        localStorage.setItem('pandaa_user_name', activeName);
        setTempName(''); 
        setView('CHAT_MAIN');
        
        await updateDbLimits({ user_name: activeName, last_name_change: new Date(now).toISOString() });

        const initMsg = `Dashboard session active. Welcome ${activeName}! How can I assist with your profile today?`;
        const initialMessageObject = { id: 'init-' + Date.now(), type: 'bot', text: initMsg, timestamp: new Date() };
        setMessages([initialMessageObject]);
        localStorage.setItem('pandaa_chat_messages', JSON.stringify([initialMessageObject]));
        persistMessage('assistant', initMsg);
    };

    const handleResetChat = async () => {
        playClick();
        if (dbSessionId) {
            await supabase.from('pandaa_chat_history').delete().eq('session_id', dbSessionId);
        }
        localStorage.removeItem('pandaa_chat_messages');
        const resetMsg = `Memory cleared. New dashboard session started. How can I help, ${userName}?`;
        setMessages([{ id: 'reset-' + Date.now(), type: 'bot', text: resetMsg, timestamp: new Date() }]);
        persistMessage('assistant', resetMsg);
    };

    const handleRefine = async () => {
        if (refineCount >= 3 || !contactMessage.trim()) return;
        playClick();
        const newCount = refineCount + 1;
        setRefineCount(newCount);
        updateDbLimits({ contact_refine_count: newCount });
        
        setIsTyping(true);
        const refinedText = await fetchGroqAI(contactMessage, "Refine this professional inquiry to be impressive and formal. Return ONLY the improved text.");
        setIsTyping(false);
        if (refinedText) setContactMessage(refinedText.trim());
    };

    const handleSendContact = async () => {
        if (!canSubmitInquiry) return;
        playClick();
        setIsSubmitting(true);

        try {
            if (CONTACT_SCRIPT_URL) {
                await fetch(CONTACT_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, message: contactMessage, source: 'DASHBOARD', token: userToken, name: userName })
                });
            }
            
            await supabase.from('pandaa_inquiries').insert({
                session_id: dbSessionId,
                email,
                message: contactMessage,
                source: 'DASHBOARD',
                name: userName
            });

            setView('SUCCESS');
            setEmail('');
            setContactMessage('');
            setTimeout(() => setView('WELCOME'), 3000);
        } catch (error) {
            console.error("Submission error:", error);
            alert("Connection error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pandaa-bot-anchor">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button 
                        initial={{ scale: 0, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0, opacity: 0 }} 
                        onClick={() => { setIsOpen(true); playClick(); }} 
                        className="pandaa-trigger"
                        style={{
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            background: '#3b42f2',
                            border: 'none',
                            boxShadow: '0 8px 32px rgba(59,66,242,0.4)',
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 30 }} 
                        className="pandaa-window"
                        style={{
                            borderRadius: '32px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            background: '#0a0a0f',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            width: '94vw',
                            maxWidth: '480px',
                            height: '740px',
                            position: 'absolute',
                            bottom: 0,
                            right: 0
                        }}
                    >
                        <div style={{ padding: '24px', background: '#12121e', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a1a2e', border: '1px solid rgba(59,66,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 0 0 1 2 2z"></path></svg>
                                </div>
                                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: '1.2' }}>PANDAA</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06e4f9', display: 'inline-block' }}></span>
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, textTransform: 'uppercase' }}>GKK INTERN Help V1.3</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {view === 'CHAT_MAIN' && <button title="Reset Conversation" onClick={handleResetChat} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg></button>}
                                {view !== 'WELCOME' && view !== 'SUCCESS' && <button onClick={() => setView('WELCOME')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg></button>}
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <AnimatePresence mode="wait">
                                {view === 'WELCOME' && (
                                    <motion.div key="welcome" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                         <div style={{ marginBottom: '40px' }}>
                                            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.05em', textTransform: 'uppercase', lineHeight: 1.1, margin: '0 0 12px 0' }}>GKK INTERN Assistant</h2>
                                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>How can we optimize your profile?</p>
                                        </div>
                                        <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <button 
                                                onClick={() => setView('CONTACT')} 
                                                style={{
                                                    width: '100%',
                                                    padding: '18px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: '22px',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    color: 'white'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(59,66,242,0.3)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                            >
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#3b42f2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,66,242,0.3)' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <h4 style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Support Message</h4>
                                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Direct dashboard inquiry</p>
                                                </div>
                                            </button>
                                            <button 
                                                onClick={() => { if (userName) setView('CHAT_MAIN'); else setView('CHAT_ENTRY'); }} 
                                                style={{
                                                    width: '100%',
                                                    padding: '18px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: '22px',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    color: 'white'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(59,66,242,0.3)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                            >
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#1a1a2e', border: '1px solid rgba(59,66,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 0 0 1 2 2z"></path></svg>
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <h4 style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Chat with AI</h4>
                                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Intern guidance bot</p>
                                                </div>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {view === 'CONTACT' && (
                                    <motion.div key="contact" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', gap: '32px', overflowY: 'auto' }} >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0 }}>Support Message</h2>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, margin: 0 }}>Session Token: {userToken.substring(0, 8)}</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Your Email</label>
                                                    {email && !isEmailValid && <span style={{ fontSize: '8px', color: '#ff4444', fontWeight: 'bold' }}>@gmail.com required</span>}
                                                </div>
                                                <input 
                                                    type="email" 
                                                    placeholder="name@gmail.com" 
                                                    value={email} 
                                                    onChange={(e) => setEmail(e.target.value)} 
                                                    style={{ 
                                                        width: '100%',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        border: '1px solid',
                                                        borderColor: email && !isEmailValid ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.1)',
                                                        borderRadius: '16px',
                                                        padding: '14px',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        transition: 'all 0.2s'
                                                    }} 
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <label style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Issue Details</label>
                                                        {contactMessage && contactMessage.length < 10 && <span style={{ fontSize: '8px', color: '#ff4444', fontWeight: 'bold' }}>{10 - contactMessage.length} more chars</span>}
                                                    </div>
                                                    <button disabled={refineCount >= 3 || !contactMessage.trim() || isTyping} onClick={handleRefine} style={{ fontSize: '8px', fontWeight: 900, padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(59,66,242,0.2)', background: 'rgba(59,66,242,0.1)', color: '#3b42f2', cursor: 'pointer' }} >{isTyping ? 'REFINING...' : `REFINE (${3 - refineCount})`}</button>
                                                </div>
                                                <textarea 
                                                    placeholder="How can we assist with your profile?" 
                                                    value={contactMessage} 
                                                    onChange={(e) => setContactMessage(e.target.value)} 
                                                    rows={5} 
                                                    style={{ 
                                                        resize: 'none', 
                                                        lineHeight: 1.6, 
                                                        width: '100%',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        border: '1px solid',
                                                        borderColor: contactMessage && contactMessage.length < 10 ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.1)',
                                                        borderRadius: '16px',
                                                        padding: '14px',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        transition: 'all 0.2s'
                                                    }} 
                                                />
                                            </div>
                                            <button 
                                                disabled={!canSubmitInquiry} 
                                                onClick={handleSendContact} 
                                                style={{
                                                    width: '100%',
                                                    padding: '14px',
                                                    borderRadius: '16px',
                                                    fontWeight: 900,
                                                    fontSize: '15px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em',
                                                    border: 'none',
                                                    cursor: !canSubmitInquiry ? 'not-allowed' : 'pointer',
                                                    background: !canSubmitInquiry ? 'rgba(255,255,255,0.05)' : '#3b42f2',
                                                    color: !canSubmitInquiry ? 'rgba(255,255,255,0.1)' : 'white',
                                                    boxShadow: !canSubmitInquiry ? 'none' : '0 8px 24px rgba(59,66,242,0.2)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {isSubmitting ? 'DISPATCHING...' : 'Dispatch Inquiry'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {view === 'SUCCESS' && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
                                        <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(14,249,146,0.1)', border: '1px solid rgba(14,249,146,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                            <motion.svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ef992" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} ><polyline points="20 6 9 17 4 12"></polyline></motion.svg>
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '-0.05em', margin: '0 0 8px 0' }}>Request Received</h2>
                                            <p style={{ color: '#0ef992', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Dashboard Trace Success</p>
                                        </div>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', maxWidth: '200px', lineHeight: 1.6, margin: 0 }}>Your request is being handled by a GKK expert. Returning to home...</p>
                                    </motion.div>
                                )}

                                {view === 'CHAT_ENTRY' && (
                                    <motion.div key="entry" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} >
                                        <div style={{ width: '64px', height: '64px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 0 0 1 2 2z"></path></svg></div>
                                         <div style={{ marginBottom: '32px' }}><h2 style={{ fontSize: '20px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '-0.05em', margin: '0 0 4px 0' }}>GKK INTERN Dashboard</h2><p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500, margin: 0 }}>Identify yourself for guidance</p></div>
                                        <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="YOUR NAME" 
                                                value={tempName} 
                                                onChange={(e) => setTempName(e.target.value)} 
                                                onKeyDown={(e) => e.key === 'Enter' && handleStartChat()} 
                                                style={{ 
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '20px',
                                                    padding: '16px',
                                                    textAlign: 'center',
                                                    fontSize: '18px',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.1em',
                                                    color: 'white',
                                                    outline: 'none'
                                                }}
                                            />
                                            <button 
                                                onClick={handleStartChat} 
                                                style={{
                                                    width: '100%',
                                                    padding: '14px',
                                                    background: '#3b42f2',
                                                    color: 'white',
                                                    borderRadius: '20px',
                                                    fontWeight: 900,
                                                    fontSize: '16px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '-0.02em',
                                                    border: 'none',
                                                    boxShadow: '0 8px 24px rgba(59,66,242,0.2)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Verify Profile
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {view === 'CHAT_MAIN' && (
                                    <motion.div key="chat" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} >
                                        <div style={{ padding: '16px 24px', background: '#161625', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,66,242,0.1)', border: '1px solid rgba(59,66,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 0 0 1 2 2z"></path></svg>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>Active Assistant <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06e4f9', display: 'inline-block' }}></span></span>
                                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase' }}>Chatting as: <button onClick={() => { setTempName(userName); setView('CHAT_ENTRY'); }} style={{ background: 'none', border: 'none', color: '#3b42f2', cursor: 'pointer', padding: 0, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{userName} <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button></span>
                                                </div>
                                            </div>
                                            <div style={{ padding: '2px 8px', borderRadius: '8px', border: aiMessageCount >= 15 ? '1px solid rgba(255,68,68,0.2)' : '1px solid rgba(59,66,242,0.2)', background: aiMessageCount >= 15 ? 'rgba(255,68,68,0.1)' : 'rgba(59,66,242,0.1)', color: aiMessageCount >= 15 ? '#ff4444' : '#3b42f2', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{15 - aiMessageCount}/15 MESSAGES LEFT</div>
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'rgba(10,10,15,0.5)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {messages.map((msg) => ( <ChatTile key={msg.id} msg={msg} /> ))}
                                            {isTyping && ( 
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '14px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', width: '64px' }}>
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3b42f2', display: 'inline-block' }}></span>
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3b42f2', display: 'inline-block' }}></span>
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3b42f2', display: 'inline-block' }}></span>
                                                </div> 
                                            )}
                                            <div ref={messagesEndRef} style={{ height: '8px' }} />
                                        </div>
                                        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0f', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <input 
                                                    type="text" 
                                                    value={input} 
                                                    disabled={aiMessageCount >= 15 || isTyping || cooldown > 0} 
                                                    onChange={(e) => setInput(e.target.value)} 
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                                                    placeholder={aiMessageCount >= 15 ? "LIMIT REACHED" : cooldown > 0 ? `COOLDOWN: ${cooldown}s` : isTyping ? "PANDAA is thinking..." : "Type your message..."} 
                                                    style={{ 
                                                        width: '100%',
                                                        background: '#1a1a2e',
                                                        border: '1px solid',
                                                        borderColor: aiMessageCount >= 15 || cooldown > 0 ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                                                        borderRadius: '18px',
                                                        padding: '14px 48px 14px 20px',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                        fontWeight: 500
                                                    }}
                                                />
                                                <button disabled={aiMessageCount >= 15 || isTyping || cooldown > 0} onClick={handleSendMessage} style={{ position: 'absolute', right: '8px', width: '36px', height: '36px', borderRadius: '12px', background: aiMessageCount >= 15 || isTyping || cooldown > 0 ? 'rgba(255,255,255,0.05)' : '#3b42f2', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} >{cooldown > 0 ? <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{cooldown}s</span> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}</button>
                                            </div>
                                             <div style={{ textAlign: 'center' }}><p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>PANDAA Dashboard V1.3 • {userToken.substring(0, 10)}</p></div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
