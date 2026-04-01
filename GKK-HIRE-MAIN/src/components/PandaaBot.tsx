import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAudio } from './AudioProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const CONTACT_SCRIPT_URL = import.meta.env.VITE_CONTACT_SCRIPT_URL;

const generateUserToken = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface Message {
    id: string;
    type: 'bot' | 'user';
    text: string;
    timestamp: Date;
}

type View = 'WELCOME' | 'CONTACT' | 'CHAT_ENTRY' | 'CHAT_MAIN' | 'SUCCESS';

const ChatTile = React.memo(({ msg }: { msg: Message }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} will-change-transform`}
            style={{ transform: 'translateZ(0)' }}
        >
            <div className={`max-w-[85%] p-4 rounded-[18px] text-[14px] leading-relaxed shadow-lg ${
                msg.type === 'user' 
                ? 'bg-[#3b42f2] text-white rounded-br-none shadow-[#3b42f2]/20' 
                : 'bg-[#1a1a2e] border border-white/5 text-white/95 rounded-bl-none'
            }`}>
                {msg.text}
            </div>
            <span className="text-[9px] text-white/20 mt-1.5 px-3 font-bold uppercase tracking-widest">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </motion.div>
    );
});

ChatTile.displayName = 'ChatTile';

export const PandaaBot: React.FC = () => {
    const { playClick } = useAudio();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<View>('WELCOME');

    const [userName, setUserName] = useState(() => localStorage.getItem('pandaa_user_name') || '');
    const [userToken] = useState(() => {
        let token = localStorage.getItem('pandaa_user_token');
        if (!token) {
            token = generateUserToken();
            localStorage.setItem('pandaa_user_token', token);
        }
        return token;
    });

    const [dbSessionId, setDbSessionId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [lastNameChange, setLastNameChange] = useState(() => parseInt(localStorage.getItem('pandaa_last_name_change') || '0'));
    const [aiMessageCount, setAiMessageCount] = useState(() => parseInt(localStorage.getItem('pandaa_ai_msg_count') || '0'));
    const [refineCount, setRefineCount] = useState(() => parseInt(localStorage.getItem('pandaa_refine_count') || '0'));
    
    const [cooldown, setCooldown] = useState(0);

    const [email, setEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('pandaa_chat_messages');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            } catch (e) {
                console.error("Error parsing saved messages:", e);
            }
        }
        return [];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        const syncSession = async () => {
            try {
                const { data: session } = await supabase
                    .from('pandaa_sessions')
                    .select('*')
                    .eq('token', userToken)
                    .single();

                if (session) {
                    setDbSessionId(session.id);
                    setUserName(session.name || '');
                    setAiMessageCount(session.ai_msg_count);
                    setRefineCount(session.refine_count);
                    setLastNameChange(new Date(session.last_name_change).getTime());
                } else {
                    const { data: newSession } = await supabase
                        .from('pandaa_sessions')
                        .insert({ token: userToken, name: userName })
                        .select()
                        .single();
                    if (newSession) setDbSessionId(newSession.id);
                }
            } catch (err) {
                console.error("Supabase sync error:", err);
            }
        };
        syncSession();
    }, [userToken, userName]);

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
                    const dbMessages: Message[] = history.map(m => ({
                        id: m.id.toString(),
                        type: m.role === 'user' ? 'user' : 'bot',
                        text: m.content,
                        timestamp: new Date(m.created_at)
                    }));
                    if (messages.length === 0) setMessages(dbMessages);
                } else if (messages.length === 0) {
                     setMessages([{ id: 'init', type: 'bot', text: `Welcome to GKK Interns! I'm PANDAA, your growth assistant. Ready to start your tech journey?`, timestamp: new Date() }]);
                }
            };
            fetchHistory();
        }
    }, [isOpen, view, dbSessionId, messages.length, userName]);

    const fetchGroqAI = async (prompt: string, systemPrompt: string) => {
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

    const persistMessage = async (role: 'user' | 'assistant', content: string) => {
        if (!dbSessionId) return;
        await supabase.from('pandaa_chat_history').insert({
            session_id: dbSessionId,
            role,
            content
        });
    };

    const updateDbLimits = async (updates: any) => {
        if (!dbSessionId) return;
        await supabase.from('pandaa_sessions').update(updates).eq('id', dbSessionId);
    };

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen && view === 'CHAT_MAIN') scrollToBottom();
    }, [messages, isOpen, view, isTyping, scrollToBottom]);

    const handleSendMessage = async () => {
        if (!input.trim() || aiMessageCount >= 15 || cooldown > 0) return;
        
        playClick();
        const userMsg: Message = { id: Date.now().toString(), type: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        persistMessage('user', input);
        
        const newCount = aiMessageCount + 1;
        setAiMessageCount(newCount);
        updateDbLimits({ ai_msg_count: newCount });
        setCooldown(3);

        const currentInput = input;
        setInput('');
        setIsTyping(true);

        let dataContext = "";
        
        const foundEmail = currentInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}/i)?.[0];
        if (foundEmail) setEmail(foundEmail);
        const effectiveEmail = foundEmail || email;

        const statusKeywords = ['status', 'apply', 'my application', 'reviewed'];
        if (statusKeywords.some(k => currentInput.toLowerCase().includes(k))) {
            if (effectiveEmail) {
                const { data: status } = await supabase.rpc('get_pandaa_application_status', { p_email: effectiveEmail });
                if (status && status.length > 0) {
                    dataContext += `[REAL-TIME STATUS] Applicant: ${status[0].full_name}. Status: ${status[0].status}. Remark: ${status[0].remark}. `;
                } else {
                    dataContext += `[NO_STATUS_FOUND: No record found for ${effectiveEmail}.] `;
                }
            } else {
                dataContext += "[MISSING_EMAIL: Action required.] ";
            }
        }

        const { data: knowledgeMatch } = await supabase.rpc('search_pandaa_knowledge', { p_query: currentInput });
        if (knowledgeMatch && knowledgeMatch.length > 0 && knowledgeMatch[0].rank > 0.1) {
             dataContext += `[CORE KNOWLEDGE MATCH] Question: ${knowledgeMatch[0].instruction}. Truthful Answer: ${knowledgeMatch[0].response}. `;
        }

        const systemPrompt = `You are PANDAA, GKK INTERN Assistant. User: ${userName}. 
INTERNAL CONTEXT (Do not mention these tags to the user):
${dataContext || "[GENERAL_INQUIRY]"}

If [MISSING_EMAIL] is indicated, politely ask the user for the Gmail address they used to apply so you can check their real-time status.
If [CORE KNOWLEDGE MATCH] is provided, use it as the absolute truth. 
If [REAL-TIME STATUS] is provided, report the status. 
If [NO_STATUS_FOUND] is indicated, explain that you couldn't find an application for that email and suggest they verify it.
FEE RULE: If asked about fees, strictly state: "There are minimal fees for profile hosting and server provision." 
Be brief, professional, and do NOT ask for "real-time status" yourself.`;

        const aiResponse = await fetchGroqAI(currentInput, systemPrompt);
        
        const botText = aiResponse || `I'm here to help you get started with your tech career, ${userName}. What's on your mind?`;
        setIsTyping(false);
        setMessages(prev => [...prev, { id: 'bot-' + Date.now(), type: 'bot', text: botText, timestamp: new Date() }]);
        persistMessage('assistant', botText);
    };

    const handleStartChat = async () => {
        if (!tempName.trim()) return;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (userName && (now - lastNameChange < oneDay) && tempName !== userName) {
            setView('CHAT_MAIN');
            return;
        }
        playClick();
        setUserName(tempName);
        setLastNameChange(now);
        setTempName('');
        setView('CHAT_MAIN');
        
        await updateDbLimits({ name: tempName, last_name_change: new Date(now).toISOString() });

        const initMsg = `Welcome to GKK Interns, ${tempName}! I'm here to guide you through your career launch. How can I help today?`;
        setMessages([{ id: 'init-' + Date.now(), type: 'bot', text: initMsg, timestamp: new Date() }]);
        persistMessage('assistant', initMsg);
    };

    const handleResetChat = async () => {
        playClick();
        if (dbSessionId) {
            await supabase.from('pandaa_chat_history').delete().eq('session_id', dbSessionId);
        }
        localStorage.removeItem('pandaa_chat_messages');
        const resetMsg = `Memory cleared. Ready for a new start. How can I assist you, ${userName}?`;
        setMessages([{ id: 'reset-' + Date.now(), type: 'bot', text: resetMsg, timestamp: new Date() }]);
        persistMessage('assistant', resetMsg);
    };

    const handleRefine = async () => {
        if (refineCount >= 3 || !contactMessage.trim()) return;
        playClick();
        const newCount = refineCount + 1;
        setRefineCount(newCount);
        updateDbLimits({ refine_count: newCount });
        
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
                    body: JSON.stringify({ email, message: contactMessage, source: 'LANDING_PAGE', token: userToken, name: userName })
                });
            }
            
            await supabase.from('pandaa_inquiries').insert({
                session_id: dbSessionId,
                email,
                message: contactMessage,
                source: 'LANDING_PAGE',
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
        <div className="fixed bottom-8 right-12 z-[2000] font-sans">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} onClick={() => { setIsOpen(true); playClick(); }} className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(59,66,242,0.4)] bg-[#3b42f2] group" >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 0 0 1 2 2z"></path></svg>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="absolute bottom-0 right-0 w-[94vw] max-w-[480px] h-[740px] bg-[#0a0a0f] border border-white/10 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden" >
                        <div className="p-6 bg-[#12121e] border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#1a1a2e] border border-[#3b42f2]/20 flex items-center justify-center shadow-lg"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 0 0 1 2 2z"></path></svg></div>
                                 <div><h3 className="font-bold text-base text-white leading-tight uppercase font-black tracking-tight">PANDAA</h3><div className="flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#06e4f9] animate-pulse"></span><span className="text-[10px] text-white/50 font-medium tracking-tight uppercase">GKK INTERN Help V1.3</span></div></div>
                            </div>
                            <div className="flex items-center gap-2">
                                {view === 'CHAT_MAIN' && <button title="Reset Conversation" onClick={handleResetChat} className="p-1.5 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg></button>}
                                {view !== 'WELCOME' && view !== 'SUCCESS' && <button onClick={() => setView('WELCOME')} className="p-1.5 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg></button>}
                                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden relative flex flex-col bg-[#0a0a0f]">
                            <AnimatePresence mode="wait">
                                {view === 'WELCOME' && (
                                    <motion.div key="welcome" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} className="flex-1 flex flex-col p-8 items-center justify-center text-center space-y-10" >
                                         <div className="space-y-3"><h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">GKK INTERN Assistant</h2><p className="text-white/60 text-[14px]">Launch your career with expert guidance.</p></div>
                                        <div className="w-full max-w-[340px] space-y-4">
                                            <button onClick={() => setView('CONTACT')} className="w-full p-4.5 bg-white/[0.03] border border-white/5 rounded-[22px] hover:bg-white/[0.06] hover:border-[#3b42f2]/30 transition-all text-left flex items-center gap-4 group" ><div className="w-10 h-10 rounded-xl bg-[#3b42f2] flex items-center justify-center shadow-lg shadow-[#3b42f2]/30 group-hover:scale-105 transition-transform"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg></div><div><h4 className="text-white font-bold text-[15px] uppercase tracking-tighter">Support Message</h4><p className="text-white/40 text-[11px]">Direct GKK inquiry</p></div></button>
                                            <button onClick={() => { if (userName) setView('CHAT_MAIN'); else setView('CHAT_ENTRY'); }} className="w-full p-4.5 bg-white/[0.03] border border-white/5 rounded-[22px] hover:bg-white/[0.06] hover:border-[#3b42f2]/30 transition-all text-left flex items-center gap-4 group" ><div className="w-10 h-10 rounded-xl bg-[#1a1a2e] border border-[#3b42f2]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div><div><h4 className="text-white font-bold text-[15px] uppercase tracking-tighter">Chat with AI</h4><p className="text-white/40 text-[11px]">Powered by GKK Intelligence</p></div></button>
                                        </div>
                                    </motion.div>
                                )}

                                {view === 'CONTACT' && (
                                    <motion.div key="contact" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} className="flex-1 flex flex-col p-8 space-y-8 overflow-y-auto" >
                                        <div className="space-y-1"><h2 className="text-xl font-black text-white uppercase tracking-tighter">Support Message</h2><p className="text-white/60 text-[12px] font-medium">Trace ID: {userToken.substring(0, 8)}</p></div>
                                        <div className="space-y-5">
                                            <div className="space-y-1.5"><div className="flex justify-between items-center pr-1"><label className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] pl-1">Your Email</label>{email && !isEmailValid && <span className="text-[8px] text-red-500 font-bold">@gmail.com required</span>}</div><input type="email" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-white/[0.02] border rounded-[16px] p-3.5 text-white text-[14px] outline-none transition-all font-medium ${email && !isEmailValid ? 'border-red-500/30' : 'border-white/5 focus:border-[#3b42f2]/50'}`} /></div>
                                            <div className="space-y-1.5"><div className="flex items-center justify-between pl-1"><div className="flex flex-col"><label className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em]">Need Help?</label>{contactMessage && contactMessage.length < 10 && <span className="text-[8px] text-red-500 font-bold">{10 - contactMessage.length} more chars</span>}</div><button disabled={refineCount >= 3 || !contactMessage.trim() || isTyping} onClick={handleRefine} className={`text-[8px] font-black px-2 py-0.5 rounded-lg border transition-all ${refineCount >= 3 || !contactMessage.trim() || isTyping ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed' : 'bg-[#3b42f2]/10 border-[#3b42f2]/20 text-[#3b42f2] hover:bg-[#3b42f2]/20'}`} >{isTyping ? 'REFINING...' : `REFINE (${3 - refineCount})`}</button></div><textarea placeholder="How can we assist you?" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={5} className={`w-full bg-white/[0.02] border rounded-[16px] p-3.5 text-white text-[14px] outline-none transition-all resize-none leading-relaxed font-medium ${contactMessage && contactMessage.length < 10 ? 'border-red-500/30' : 'border-white/5 focus:border-[#3b42f2]/50'}`} /></div>
                                            <button disabled={!canSubmitInquiry} onClick={handleSendContact} className={`w-full py-3.5 rounded-[16px] font-black text-[15px] transition-all flex items-center justify-center gap-2.5 uppercase tracking-widest ${canSubmitInquiry ? 'bg-[#3b42f2] text-white shadow-lg shadow-[#3b42f2]/20 hover:scale-[1.01] active:scale-[0.99]' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`} >{isSubmitting ? 'DISPATCHING...' : 'Send Message'}</button>
                                        </div>
                                    </motion.div>
                                )}

                                {view === 'SUCCESS' && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6" >
                                        <div className="w-24 h-24 rounded-full bg-[#0ef992]/10 border border-[#0ef992]/20 flex items-center justify-center shadow-[0_0_50px_rgba(14,249,146,0.1)]"><motion.svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ef992" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} ><polyline points="20 6 9 17 4 12"></polyline></motion.svg></div>
                                        <div className="space-y-2"><h2 className="text-2xl font-black text-white uppercase tracking-tighter">Message Logged</h2><p className="text-[#0ef992] text-[13px] font-black uppercase tracking-widest">GKK Trace Success</p></div>
                                        <p className="text-white/40 text-[12px] max-w-[200px] leading-relaxed">Your inquiry has been received. Returning to home...</p>
                                    </motion.div>
                                )}

                                {view === 'CHAT_ENTRY' && (
                                    <motion.div key="entry" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} className="flex-1 flex flex-col p-8 items-center justify-center text-center space-y-8" >
                                        <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
                                         <div className="space-y-1"><h2 className="text-xl font-black text-white uppercase tracking-tighter">GKK Help Session</h2><p className="text-white/60 text-[13px] font-medium">Please enter your name to begin</p></div>
                                        <div className="w-full max-w-[280px] space-y-4"><input type="text" placeholder="YOUR NAME" value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleStartChat()} className="w-full bg-white/[0.03] border border-white/10 rounded-[20px] p-4 text-center text-white outline-none focus:border-[#3b42f2] transition-all text-lg font-black uppercase tracking-widest" /><button onClick={handleStartChat} className="w-full py-3.5 bg-[#3b42f2] text-white rounded-[20px] font-black text-base shadow-lg shadow-[#3b42f2]/20 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-tighter" >Start Session</button></div>
                                    </motion.div>
                                )}

                                {view === 'CHAT_MAIN' && (
                                    <motion.div key="chat" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} className="flex-1 flex flex-col overflow-hidden" >
                                        <div className="px-6 py-4 bg-[#161625] border-b border-white/5 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#3b42f2]/10 border border-[#3b42f2]/20 flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div><div className="flex flex-col"><span className="text-white text-[12px] font-black flex items-center gap-1.5 uppercase tracking-tight">Active Assistant <span className="w-1 h-1 rounded-full bg-[#06e4f9] animate-pulse"></span></span><span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Chatting as: <button onClick={() => setView('CHAT_ENTRY')} className="text-[#3b42f2] hover:underline">{userName}</button></span></div></div>
                                            <div className={`px-2 py-0.5 rounded-lg border text-[8px] font-black tracking-widest uppercase transition-colors ${aiMessageCount >= 15 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[#3b42f2]/10 border-[#3b42f2]/20 text-[#3b42f2]'}`}>{15 - aiMessageCount}/15 MESSAGES LEFT</div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scroll-smooth bg-[#0a0a0f]/50">
                                            {messages.map((msg) => ( <ChatTile key={msg.id} msg={msg} /> ))}
                                            {isTyping && ( <div className="flex items-center gap-1.5 p-3.5 bg-[#1a1a2e] border border-white/5 rounded-[16px] w-16"><span className="w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce [animation-delay:0.4s]"></span></div> )}
                                            <div ref={messagesEndRef} className="h-2" />
                                        </div>
                                        <div className="p-6 border-t border-white/5 bg-[#0a0a0f] space-y-4">
                                            <div className="relative flex items-center gap-3">
                                                <input type="text" value={input} disabled={aiMessageCount >= 15 || isTyping || cooldown > 0} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={aiMessageCount >= 15 ? "LIMIT REACHED" : cooldown > 0 ? `COOLDOWN: ${cooldown}s` : isTyping ? "PANDAA is thinking..." : "Type your message..."} className={`w-full bg-[#1a1a2e] border text-white rounded-[18px] py-3.5 pl-5 pr-12 text-[14px] outline-none transition-all placeholder:text-white/30 font-medium ${aiMessageCount >= 15 || cooldown > 0 ? 'border-red-500/20 cursor-not-allowed' : 'border-white/5 focus:border-[#3b42f2]/50'}`} />
                                                <button disabled={aiMessageCount >= 15 || isTyping || cooldown > 0} onClick={handleSendMessage} className={`absolute right-2 p-2 text-white rounded-xl transition-all flex items-center justify-center shadow-lg ${aiMessageCount >= 15 || isTyping || cooldown > 0 ? 'bg-white/5 cursor-not-allowed text-white/20' : 'bg-[#3b42f2] hover:scale-105 active:scale-95 shadow-[#3b42f2]/30'}`} >{cooldown > 0 ? <span className="text-[10px] font-bold">{cooldown}s</span> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}</button>
                                            </div>
                                             <div className="flex justify-center"><p className="text-[8px] text-white/40 font-bold tracking-[0.2em] uppercase">PANDAA GKK V1.3 • {userToken.substring(0, 10)}</p></div>
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
