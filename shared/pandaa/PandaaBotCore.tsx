import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONTACT_SCRIPT_URL = import.meta.env.VITE_CONTACT_SCRIPT_URL;

type SupabaseClientLike = any;

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

interface PandaaBotCoreProps {
    playClick: () => void;
    supabase: SupabaseClientLike;
    contactSource: string;
}

const STATUS_INTENT_REGEX = /\b(status|application|applied|shortlist|shortlisted|selected|selection|review)\b/i;

const ChatTile = React.memo(({ msg }: { msg: Message }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} will-change-transform`}
            style={{ transform: 'translateZ(0)' }}
        >
            <div
                className={`max-w-[85%] p-4 rounded-[18px] text-[14px] leading-relaxed shadow-lg ${
                    msg.type === 'user'
                        ? 'bg-[#3b42f2] text-white rounded-br-none shadow-[#3b42f2]/20'
                        : 'bg-[#1a1a2e] border border-white/5 text-white/95 rounded-bl-none'
                }`}
            >
                {msg.text}
            </div>
            <span className="text-[9px] text-white/20 mt-1.5 px-3 font-bold uppercase tracking-widest">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </motion.div>
    );
});

ChatTile.displayName = 'ChatTile';

export const PandaaBotCore: React.FC<PandaaBotCoreProps> = ({ playClick, supabase, contactSource }) => {
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

    const [userIp, setUserIp] = useState('');
    const [dbSessionId, setDbSessionId] = useState<string | null>(null);
    const [usageId, setUsageId] = useState<string | null>(null);
    const [cycleStart, setCycleStart] = useState<Date | null>(null);
    const [tempName, setTempName] = useState('');
    const [aiMessageCount, setAiMessageCount] = useState(0);
    const [refineCount, setRefineCount] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
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
                console.error('Error parsing saved messages:', e);
            }
        }
        return [];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasInitializedSession, setHasInitializedSession] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isEmailValid = useMemo(() => {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        return gmailRegex.test(email);
    }, [email]);

    const isMessageValid = useMemo(() => contactMessage.trim().length >= 10, [contactMessage]);
    const canSubmitInquiry = useMemo(() => isEmailValid && isMessageValid && !isSubmitting, [isEmailValid, isMessageValid, isSubmitting]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    const detectIp = async () => {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const data = await ipRes.json();
            return data.ip as string;
        } catch {
            try {
                const ipRes = await fetch('https://ipapi.co/json/');
                const data = await ipRes.json();
                return data.ip as string;
            } catch {
                const ipRes = await fetch('https://api.seeip.org/jsonip');
                const data = await ipRes.json();
                return (data.ip || data.ip_address || '') as string;
            }
        }
    };

    useEffect(() => {
        if (!isOpen || hasInitializedSession) return;

        const syncSession = async () => {
            try {
                const ip = await detectIp();
                if (ip) {
                    setUserIp(ip);
                    const currentStoredName = localStorage.getItem('pandaa_user_name') || userName || '';
                    const { data: usage } = await supabase
                        .from('pandaa_usage')
                        .upsert(
                            {
                                ip_address: ip,
                                user_name: currentStoredName,
                                last_active: new Date().toISOString(),
                            },
                            { onConflict: 'ip_address' }
                        )
                        .select()
                        .single();

                    if (usage) {
                        setUsageId(usage.id);
                        setAiMessageCount(usage.ai_message_count || 0);
                        setRefineCount(usage.contact_refine_count || 0);
                        setCycleStart(new Date(usage.cycle_start || usage.created_at));
                        setIsBlocked(usage.is_blocked || false);

                        if (usage.user_name && !userName) {
                            setUserName(usage.user_name);
                            localStorage.setItem('pandaa_user_name', usage.user_name);
                        }
                    }
                }

                const { data: session } = await supabase.from('pandaa_sessions').select('*').eq('token', userToken).single();

                if (session) {
                    setDbSessionId(session.id);
                    if (session.name && !userName) {
                        setUserName(session.name);
                        localStorage.setItem('pandaa_user_name', session.name);
                    }
                } else {
                    const { data: newSession } = await supabase
                        .from('pandaa_sessions')
                        .insert({ token: userToken, name: userName || localStorage.getItem('pandaa_user_name') || '' })
                        .select()
                        .single();

                    if (newSession) {
                        setDbSessionId(newSession.id);
                    }
                }
            } catch (err) {
                console.error('Pandaa sync error:', err);
            } finally {
                setHasInitializedSession(true);
            }
        };

        syncSession();
    }, [hasInitializedSession, isOpen, supabase, userName, userToken]);

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
                    const dbMessages: Message[] = history.map((m: any) => ({
                        id: m.id.toString(),
                        type: m.role === 'user' ? 'user' : 'bot',
                        text: m.content,
                        timestamp: new Date(m.created_at),
                    }));
                    if (messages.length === 0) setMessages(dbMessages);
                } else if (messages.length === 0) {
                    setMessages([
                        {
                            id: 'init',
                            type: 'bot',
                            text: `Welcome to GKK Interns! I'm PANDAA, your growth assistant. Ready to start your tech journey?`,
                            timestamp: new Date(),
                        },
                    ]);
                }
            };
            fetchHistory();
        }
    }, [isOpen, view, dbSessionId, messages.length, userName, supabase]);

    const fetchAssistantReply = async (prompt: string, mode: 'chat' | 'refine' = 'chat', emailOverride = '') => {
        try {
            const { data, error } = await supabase.functions.invoke('pandaa-assistant', {
                body: {
                    prompt,
                    userName,
                    email: emailOverride || email || '',
                    mode,
                },
            });

            if (error) throw error;
            if (data && data.success === false) {
                throw new Error(data.error || 'Assistant function returned failure');
            }
            return data?.response || null;
        } catch (error) {
            console.error('PANDAA assistant function error:', error);
            return null;
        }
    };

    const persistMessage = async (role: 'user' | 'assistant', content: string) => {
        if (!dbSessionId) return;
        await supabase.from('pandaa_chat_history').insert({
            session_id: dbSessionId,
            role,
            content,
        });
    };

    const updateDbLimits = async (updates: any) => {
        if (usageId) {
            await supabase.from('pandaa_usage').update(updates).eq('id', usageId);
        }

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
        const currentCycleStart = cycleStart;

        if (currentCycleStart && now.getTime() - currentCycleStart.getTime() > 24 * 60 * 60 * 1000) {
            currentCount = 0;
            setAiMessageCount(0);
            setCycleStart(now);
            await updateDbLimits({ cycle_start: now.toISOString(), ai_message_count: 0, is_blocked: false });
            setIsBlocked(false);
        }

        if (currentCount >= 15) {
            setMessages((prev) => [
                ...prev,
                {
                    id: 'limit-' + Date.now(),
                    type: 'bot',
                    text: 'Daily message limit (15) reached. Please try again after 24 hours.',
                    timestamp: new Date(),
                },
            ]);
            return;
        }

        playClick();
        const userMsg: Message = { id: Date.now().toString(), type: 'user', text: input, timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        persistMessage('user', input);

        const newCount = currentCount + 1;
        setAiMessageCount(newCount);
        updateDbLimits({ ai_message_count: newCount, last_active: now.toISOString(), ip_address: userIp || undefined });
        setCooldown(3);

        const currentInput = input;
        setInput('');
        setIsTyping(true);

        const foundEmail = currentInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}/i)?.[0];
        if (foundEmail) setEmail(foundEmail);
        const effectiveEmail = foundEmail || email;

        const aiResponse = await fetchAssistantReply(currentInput, 'chat', effectiveEmail);

        const askedForStatus = STATUS_INTENT_REGEX.test(currentInput);
        const botText =
            aiResponse ||
            (askedForStatus && !effectiveEmail
                ? 'I can check your application status. Please share the Gmail address you used while applying.'
                : askedForStatus
                  ? 'I could not fetch your live application status right now. Please retry in a moment, or share your application Gmail again.'
                  : 'I could not fetch a live reply just now. Please ask again in a moment, and I can also help with general knowledge questions.');
        setIsTyping(false);
        setMessages((prev) => [...prev, { id: 'bot-' + Date.now(), type: 'bot', text: botText, timestamp: new Date() }]);
        persistMessage('assistant', botText);
    };

    const handleStartChat = async () => {
        if (!tempName.trim() && !userName) return;

        const displayName = tempName.trim() || userName;
        playClick();

        if (displayName && displayName !== userName) {
            setUserName(displayName);
            localStorage.setItem('pandaa_user_name', displayName);
            await updateDbLimits({ user_name: displayName, last_name_change: new Date().toISOString() });
        }

        setTempName('');
        setView('CHAT_MAIN');

        if (!dbSessionId && !messages.length) {
            const initMsg = `Welcome to GKK Interns, ${displayName || 'there'}! I'm here to guide you through your career launch. How can I help today?`;
            setMessages([{ id: 'init-' + Date.now(), type: 'bot', text: initMsg, timestamp: new Date() }]);
            persistMessage('assistant', initMsg);
        }
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
        updateDbLimits({ contact_refine_count: newCount });

        setIsTyping(true);
        const refinedText = await fetchAssistantReply(contactMessage, 'refine');
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
                    body: JSON.stringify({ email, message: contactMessage, source: contactSource, token: userToken, name: userName }),
                });
            }

            await supabase.from('pandaa_inquiries').insert({
                session_id: dbSessionId,
                email,
                message: contactMessage,
                source: contactSource,
                name: userName,
            });

            setView('SUCCESS');
            setEmail('');
            setContactMessage('');
            setTimeout(() => setView('WELCOME'), 3000);
        } catch (error) {
            console.error('Submission error:', error);
            alert('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="pandaa-root fixed bottom-8 right-12 z-9999 font-sans"
            style={{
                position: 'fixed',
                right: '3rem',
                bottom: '2rem',
                zIndex: 9999,
                pointerEvents: 'auto',
                fontFamily: 'inherit',
            }}
        >
            <style>{`
                .pandaa-root, .pandaa-root * {
                    box-sizing: border-box;
                }

                .pandaa-root h1,
                .pandaa-root h2,
                .pandaa-root h3,
                .pandaa-root h4,
                .pandaa-root p,
                .pandaa-root label {
                    margin: 0;
                    line-height: 1.25;
                }

                .pandaa-root {
                    font-family: 'Space Grotesk', 'Inter', 'Segoe UI', sans-serif;
                    line-height: 1.35;
                    color: #f4f6ff;
                }

                .pandaa-root button,
                .pandaa-root input,
                .pandaa-root textarea {
                    font-family: inherit;
                    appearance: none;
                    -webkit-appearance: none;
                    font-size: 14px;
                }

                .pandaa-root .pandaa-window {
                    width: min(95vw, 560px) !important;
                    max-width: 560px !important;
                    min-width: 340px;
                    min-height: 560px;
                    max-height: 85vh;
                    border-radius: 24px;
                    overflow: hidden;
                }

                .pandaa-root .pandaa-scroll-area {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(59, 66, 242, 0.7) rgba(255, 255, 255, 0.08);
                }

                .pandaa-root .pandaa-scroll-area::-webkit-scrollbar {
                    width: 10px;
                }

                .pandaa-root .pandaa-scroll-area::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 999px;
                }

                .pandaa-root .pandaa-scroll-area::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, rgba(59, 66, 242, 0.95), rgba(59, 66, 242, 0.55));
                    border-radius: 999px;
                    border: 2px solid rgba(10, 10, 15, 0.75);
                }

                .pandaa-root .pandaa-scroll-area::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, rgba(79, 87, 255, 0.95), rgba(79, 87, 255, 0.65));
                }

                .pandaa-root .pandaa-header {
                    padding: 18px 20px;
                    background: linear-gradient(180deg, #121520 0%, #10131d 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.09);
                }

                .pandaa-root .pandaa-title {
                    font-size: 29px;
                    font-weight: 900;
                    letter-spacing: 0.01em;
                    text-transform: uppercase;
                    line-height: 1.02;
                }

                .pandaa-root .pandaa-subtitle {
                    margin-top: 8px;
                    color: rgba(228, 233, 255, 0.66);
                    font-size: 18px;
                    line-height: 1.2;
                    font-weight: 500;
                }

                .pandaa-root .pandaa-welcome {
                    gap: 24px;
                    padding: 28px;
                }

                .pandaa-root .pandaa-welcome-actions {
                    width: 100%;
                    max-width: 340px;
                    display: grid;
                    gap: 12px;
                }

                .pandaa-root .pandaa-action-card {
                    width: 100%;
                    min-height: 72px;
                    padding: 14px 14px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    background: rgba(255, 255, 255, 0.03);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-align: left;
                }

                .pandaa-root .pandaa-action-icon {
                    width: 40px;
                    height: 40px;
                    flex: 0 0 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .pandaa-root .pandaa-action-copy {
                    min-width: 0;
                }

                .pandaa-root .pandaa-action-copy h4 {
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.15;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: 0;
                }

                .pandaa-root .pandaa-action-copy p {
                    margin: 4px 0 0;
                    font-size: 11px;
                    line-height: 1.2;
                    color: rgba(255, 255, 255, 0.62);
                }

                .pandaa-root .pandaa-contact,
                .pandaa-root .pandaa-chat-main,
                .pandaa-root .pandaa-chat-entry,
                .pandaa-root .pandaa-success {
                    padding: 22px;
                }

                .pandaa-root .pandaa-contact h2,
                .pandaa-root .pandaa-chat-entry h2,
                .pandaa-root .pandaa-success h2 {
                    font-size: 31px;
                    font-weight: 900;
                    letter-spacing: 0;
                    text-transform: uppercase;
                    line-height: 1.05;
                }

                .pandaa-root .pandaa-contact p,
                .pandaa-root .pandaa-chat-entry p,
                .pandaa-root .pandaa-success p {
                    color: rgba(230, 235, 255, 0.68);
                    font-size: 15px;
                }

                .pandaa-root .pandaa-contact label {
                    color: rgba(215, 221, 255, 0.72);
                    font-size: 11px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    font-weight: 700;
                }

                .pandaa-root .pandaa-contact input,
                .pandaa-root .pandaa-contact textarea,
                .pandaa-root .pandaa-chat-main input,
                .pandaa-root .pandaa-chat-entry input {
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    background: rgba(255, 255, 255, 0.03);
                    color: #f4f6ff;
                    font-size: 18px;
                    font-weight: 500;
                    line-height: 1.35;
                    padding: 13px 14px;
                }

                .pandaa-root .pandaa-contact input::placeholder,
                .pandaa-root .pandaa-contact textarea::placeholder,
                .pandaa-root .pandaa-chat-main input::placeholder,
                .pandaa-root .pandaa-chat-entry input::placeholder {
                    color: rgba(227, 232, 255, 0.42);
                }

                .pandaa-root .pandaa-contact textarea {
                    min-height: 120px;
                    resize: none;
                }

                .pandaa-root .pandaa-contact button,
                .pandaa-root .pandaa-chat-entry button,
                .pandaa-root .pandaa-chat-main button {
                    min-height: 44px;
                    border-radius: 12px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                }

                .pandaa-root .pandaa-chat-meta {
                    font-size: 11px;
                    color: rgba(232, 237, 255, 0.74);
                }

                .pandaa-root .pandaa-input-row {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .pandaa-root .pandaa-chat-input {
                    width: 100%;
                    min-height: 48px;
                    padding-right: 52px;
                }

                .pandaa-root .pandaa-send-btn {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (max-width: 640px) {
                    .pandaa-root {
                        right: 12px !important;
                        bottom: 12px !important;
                    }

                    .pandaa-root .pandaa-window {
                        width: calc(100vw - 24px) !important;
                        min-width: 0;
                        max-width: none !important;
                        height: min(82vh, 700px);
                        min-height: 520px;
                    }

                    .pandaa-root .pandaa-welcome {
                        padding: 22px;
                        gap: 18px;
                    }

                    .pandaa-root .pandaa-title,
                    .pandaa-root .pandaa-contact h2,
                    .pandaa-root .pandaa-chat-entry h2,
                    .pandaa-root .pandaa-success h2 {
                        font-size: 25px;
                    }

                    .pandaa-root .pandaa-subtitle,
                    .pandaa-root .pandaa-contact p,
                    .pandaa-root .pandaa-chat-entry p,
                    .pandaa-root .pandaa-success p,
                    .pandaa-root .pandaa-contact input,
                    .pandaa-root .pandaa-contact textarea,
                    .pandaa-root .pandaa-chat-main input,
                    .pandaa-root .pandaa-chat-entry input {
                        font-size: 16px;
                    }
                }
            `}</style>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => {
                            setIsOpen(true);
                            playClick();
                        }}
                        className="w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(59,66,242,0.4)] bg-[#3b42f2] group"
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#3b42f2',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 8px 32px rgba(59,66,242,0.4)',
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
                        className="pandaa-window absolute bottom-0 right-0 w-[94vw] max-w-120 h-185 bg-[#0a0a0f] border border-white/10 rounded-4xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
                        style={{
                            width: 'min(95vw, 560px)',
                            maxWidth: '560px',
                            height: 'min(740px, 85vh)',
                            minHeight: '560px',
                            background: '#0a0a0f',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '24px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <div className="pandaa-header p-6 bg-[#12121e] border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#1a1a2e] border border-[#3b42f2]/20 flex items-center justify-center shadow-lg"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
                                <div><h3 className="text-base text-white leading-tight uppercase font-black tracking-tight">PANDAA</h3><div className="flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#06e4f9] animate-pulse"></span><span className="text-[10px] text-white/50 font-medium tracking-tight uppercase">GKK INTERN Help V1.3</span></div></div>
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
                                    <motion.div
                                        key="welcome"
                                        initial={{ x: 15, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -15, opacity: 0 }}
                                        className="pandaa-welcome flex-1 flex flex-col p-8 items-center justify-center text-center space-y-10"
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textAlign: 'center',
                                            gap: '24px',
                                            padding: '32px',
                                        }}
                                    >
                                        <div className="space-y-3"><h2 className="pandaa-title text-2xl font-black text-white tracking-tighter uppercase leading-tight">GKK INTERN Assistant</h2><p className="pandaa-subtitle text-white/60 text-[14px]">Launch your career with expert guidance.</p></div>
                                        <div className="pandaa-welcome-actions w-full max-w-85 space-y-4" style={{ width: '100%', maxWidth: '340px', display: 'grid', gap: '12px' }}>
                                            <button onClick={() => setView('CONTACT')} className="pandaa-action-card w-full p-4.5 bg-white/3 border border-white/5 rounded-[22px] hover:bg-white/6 hover:border-[#3b42f2]/30 transition-all text-left flex items-center gap-4 group" style={{ width: '100%', minHeight: '72px', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}><div className="pandaa-action-icon w-10 h-10 rounded-xl bg-[#3b42f2] flex items-center justify-center shadow-lg shadow-[#3b42f2]/30 group-hover:scale-105 transition-transform"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg></div><div className="pandaa-action-copy"><h4 className="text-white text-[15px] uppercase tracking-tighter">Support Message</h4><p className="text-white/40 text-[11px]">Direct GKK inquiry</p></div></button>
                                            <button onClick={() => { if (userName) setView('CHAT_MAIN'); else setView('CHAT_ENTRY'); }} className="pandaa-action-card w-full p-4.5 bg-white/3 border border-white/5 rounded-[22px] hover:bg-white/6 hover:border-[#3b42f2]/30 transition-all text-left flex items-center gap-4 group" style={{ width: '100%', minHeight: '72px', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}><div className="pandaa-action-icon w-10 h-10 rounded-xl bg-[#1a1a2e] border border-[#3b42f2]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div><div className="pandaa-action-copy"><h4 className="text-white text-[15px] uppercase tracking-tighter">Chat with AI</h4><p className="text-white/40 text-[11px]">Powered by GKK Intelligence</p></div></button>
                                        </div>
                                    </motion.div>
                                )}

                                {view === 'CONTACT' && (
                                    <motion.div key="contact" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} className="pandaa-contact flex-1 flex flex-col p-8 space-y-8 overflow-y-auto">
                                        <div className="space-y-1"><h2 className="text-xl font-black text-white uppercase tracking-tighter">Support Message</h2><p className="text-white/60 text-[12px] font-medium">Trace ID: {userToken.substring(0, 8)}</p></div>
                                        <div className="space-y-5">
                                            <div className="space-y-1.5"><div className="flex justify-between items-center pr-1"><label className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] pl-1">Your Email</label>{email && !isEmailValid && <span className="text-[8px] text-red-500 font-bold">@gmail.com required</span>}</div><input type="email" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-white/2 border rounded-2xl p-3.5 text-white text-[14px] outline-none transition-all font-medium ${email && !isEmailValid ? 'border-red-500/30' : 'border-white/5 focus:border-[#3b42f2]/50'}`} /></div>
                                            <div className="space-y-1.5"><div className="flex items-center justify-between pl-1"><div className="flex flex-col"><label className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em]">Need Help?</label>{contactMessage && contactMessage.length < 10 && <span className="text-[8px] text-red-500 font-bold">{10 - contactMessage.length} more chars</span>}</div><button disabled={refineCount >= 3 || !contactMessage.trim() || isTyping} onClick={handleRefine} className={`text-[8px] font-black px-2 py-0.5 rounded-lg border transition-all ${refineCount >= 3 || !contactMessage.trim() || isTyping ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed' : 'bg-[#3b42f2]/10 border-[#3b42f2]/20 text-[#3b42f2] hover:bg-[#3b42f2]/20'}`}>{isTyping ? 'REFINING...' : `REFINE (${3 - refineCount})`}</button></div><textarea placeholder="How can we assist you?" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={5} className={`w-full bg-white/2 border rounded-2xl p-3.5 text-white text-[14px] outline-none transition-all resize-none leading-relaxed font-medium ${contactMessage && contactMessage.length < 10 ? 'border-red-500/30' : 'border-white/5 focus:border-[#3b42f2]/50'}`} /></div>
                                            <button disabled={!canSubmitInquiry} onClick={handleSendContact} className={`w-full py-3.5 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2.5 uppercase tracking-widest ${canSubmitInquiry ? 'bg-[#3b42f2] text-white shadow-lg shadow-[#3b42f2]/20 hover:scale-[1.01] active:scale-[0.99]' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}>{isSubmitting ? 'DISPATCHING...' : 'Send Message'}</button>
                                        </div>
                                    </motion.div>
                                )}

                                {view === 'SUCCESS' && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="pandaa-success flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                        <div className="w-24 h-24 rounded-full bg-[#0ef992]/10 border border-[#0ef992]/20 flex items-center justify-center shadow-[0_0_50px_rgba(14,249,146,0.1)]"><motion.svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ef992" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}><polyline points="20 6 9 17 4 12"></polyline></motion.svg></div>
                                        <div className="space-y-2"><h2 className="text-2xl font-black text-white uppercase tracking-tighter">Message Logged</h2><p className="text-[#0ef992] text-[13px] font-black uppercase tracking-widest">GKK Trace Success</p></div>
                                        <p className="text-white/40 text-[12px] max-w-50 leading-relaxed">Your inquiry has been received. Returning to home...</p>
                                    </motion.div>
                                )}

                                {view === 'CHAT_ENTRY' && (
                                    <motion.div key="entry" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} className="pandaa-chat-entry flex-1 flex flex-col p-8 items-center justify-center text-center space-y-8">
                                        <div className="w-16 h-16 rounded-3xl bg-white/3 border border-white/10 flex items-center justify-center shadow-inner"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
                                        <div className="space-y-1"><h2 className="text-xl font-black text-white uppercase tracking-tighter">GKK Help Session</h2><p className="text-white/60 text-[13px] font-medium">Please enter your name to begin</p></div>
                                        <div className="w-full max-w-70 space-y-4"><input type="text" placeholder="YOUR NAME" value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleStartChat()} className="w-full bg-white/3 border border-white/10 rounded-[20px] p-4 text-center text-white outline-none focus:border-[#3b42f2] transition-all text-lg font-black uppercase tracking-widest" /><button onClick={handleStartChat} className="w-full py-3.5 bg-[#3b42f2] text-white rounded-[20px] font-black text-base shadow-lg shadow-[#3b42f2]/20 hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-tighter">Start Session</button></div>
                                    </motion.div>
                                )}

                                {view === 'CHAT_MAIN' && (
                                    <motion.div key="chat" initial={{ x: 15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -15, opacity: 0 }} className="pandaa-chat-main flex-1 flex flex-col overflow-hidden">
                                        <div className="px-6 py-4 bg-[#161625] border-b border-white/5 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#3b42f2]/10 border border-[#3b42f2]/20 flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b42f2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div><div className="flex flex-col"><span className="text-white text-[12px] font-black flex items-center gap-1.5 uppercase tracking-tight">Active Assistant <span className="w-1 h-1 rounded-full bg-[#06e4f9] animate-pulse"></span></span><span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">Chatting as: <button onClick={() => setView('CHAT_ENTRY')} className="text-[#3b42f2] hover:underline">{userName}</button></span></div></div>
                                            <div className={`px-2 py-0.5 rounded-lg border text-[8px] font-black tracking-widest uppercase transition-colors ${aiMessageCount >= 15 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[#3b42f2]/10 border-[#3b42f2]/20 text-[#3b42f2]'}`}>{15 - aiMessageCount}/15 MESSAGES LEFT</div>
                                        </div>
                                        <div className="pandaa-scroll-area flex-1 overflow-y-auto p-6 space-y-5 scroll-smooth bg-[#0a0a0f]/50">
                                            {messages.map((msg) => (<ChatTile key={msg.id} msg={msg} />))}
                                            {isTyping && (<div className="flex items-center gap-1.5 p-3.5 bg-[#1a1a2e] border border-white/5 rounded-2xl w-16"><span className="w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-1.5 h-1.5 bg-[#3b42f2] rounded-full animate-bounce [animation-delay:0.4s]"></span></div>)}
                                            <div ref={messagesEndRef} className="h-2" />
                                        </div>
                                        <div className="p-6 border-t border-white/5 bg-[#0a0a0f] space-y-4">
                                            <div className="pandaa-input-row relative flex items-center gap-3">
                                                <input type="text" value={input} disabled={aiMessageCount >= 15 || isTyping || cooldown > 0} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={aiMessageCount >= 15 ? 'LIMIT REACHED' : cooldown > 0 ? `COOLDOWN: ${cooldown}s` : isTyping ? 'PANDAA is thinking...' : 'Type your message...'} className={`pandaa-chat-input w-full bg-[#1a1a2e] border text-white rounded-[18px] py-3.5 pl-5 pr-12 text-[14px] outline-none transition-all placeholder:text-white/30 font-medium ${aiMessageCount >= 15 || cooldown > 0 ? 'border-red-500/20 cursor-not-allowed' : 'border-white/5 focus:border-[#3b42f2]/50'}`} />
                                                <button disabled={aiMessageCount >= 15 || isTyping || cooldown > 0} onClick={handleSendMessage} className={`pandaa-send-btn absolute right-2 p-2 text-white rounded-xl transition-all flex items-center justify-center shadow-lg ${aiMessageCount >= 15 || isTyping || cooldown > 0 ? 'bg-white/5 cursor-not-allowed text-white/20' : 'bg-[#3b42f2] hover:scale-105 active:scale-95 shadow-[#3b42f2]/30'}`}>{cooldown > 0 ? <span className="text-[10px] font-bold">{cooldown}s</span> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}</button>
                                            </div>
                                            <div className="flex justify-center"><p className="pandaa-chat-meta text-[8px] text-white/40 font-bold tracking-[0.2em] uppercase">PANDAA GKK V1.3 • {userToken.substring(0, 10)}</p></div>
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
