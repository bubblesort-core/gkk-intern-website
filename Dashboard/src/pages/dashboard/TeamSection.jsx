import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

// ============ AES-GCM Encryption Helpers ============
async function deriveKey(secret) {
    const encoder = new TextEncoder();
    const salt = encoder.encode('GKK-HIRE-E2E-CHAT-2024');
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptMsg(key, plaintext) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
}

async function decryptMsg(key, ciphertext) {
    try {
        const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
        return new TextDecoder().decode(decrypted);
    } catch {
        return ciphertext; // fallback for plain text old messages
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export default function TeamSection() {
    const { currentUser, currentProfile, currentTeam, supabase } = useDashboard();
    const [members, setMembers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Map());
    const [encKey, setEncKey] = useState(null);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const msgSubRef = useRef(null);
    const typSubRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Init encryption key
    useEffect(() => {
        if (!currentTeam) return;
        const secret = `gkk_team_${currentTeam.id}_${currentTeam.created_at || 'static'}_secure_chat`;
        deriveKey(secret).then(setEncKey);
    }, [currentTeam]);

    // Load team members
    useEffect(() => {
        if (!currentTeam) return;
        (async () => {
            const { data } = await supabase
                .from('team_members')
                .select('*, profiles:user_id(full_name, avatar_url, title)')
                .eq('team_id', currentTeam.id);
            setMembers(data || []);
        })();
    }, [currentTeam, supabase]);

    // Load messages & subscribe
    useEffect(() => {
        if (!currentTeam || !encKey) return;

        const loadMessages = async () => {
            const { data } = await supabase
                .from('team_messages')
                .select('*')
                .eq('team_id', currentTeam.id)
                .order('created_at', { ascending: true });

            if (data) {
                const decrypted = await Promise.all(data.map(async msg => ({
                    ...msg,
                    decryptedText: msg.is_deleted ? null : await decryptMsg(encKey, msg.message)
                })));
                setMessages(decrypted);
            }
        };

        loadMessages();

        // Message subscription
        msgSubRef.current = supabase
            .channel(`team_messages_${currentTeam.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_messages', filter: `team_id=eq.${currentTeam.id}` },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const msg = payload.new;
                        const decryptedText = msg.is_deleted ? null : await decryptMsg(encKey, msg.message);
                        setMessages(prev => {
                            if (prev.some(m => m.id === msg.id)) return prev;
                            return [...prev, { ...msg, decryptedText }];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new, decryptedText: payload.new.is_deleted ? null : m.decryptedText } : m));
                    }
                }
            ).subscribe();

        // Typing subscription
        typSubRef.current = supabase
            .channel(`team_typing_${currentTeam.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_typing', filter: `team_id=eq.${currentTeam.id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        if (payload.new.user_id !== currentUser.id) {
                            setTypingUsers(prev => {
                                const next = new Map(prev);
                                if (payload.new.is_typing) next.set(payload.new.user_id, payload.new.user_name);
                                else next.delete(payload.new.user_id);
                                return next;
                            });
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setTypingUsers(prev => { const next = new Map(prev); next.delete(payload.old.user_id); return next; });
                    }
                }
            ).subscribe();

        return () => {
            if (msgSubRef.current) supabase.removeChannel(msgSubRef.current);
            if (typSubRef.current) supabase.removeChannel(typSubRef.current);
        };
    }, [currentTeam, encKey, currentUser, supabase]);

    // Auto-scroll on new messages
    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    const handleTyping = useCallback(async () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            const userName = currentProfile?.full_name || currentUser.email?.split('@')[0] || 'User';
            await supabase.from('team_typing').upsert({
                team_id: currentTeam.id, user_id: currentUser.id, user_name: userName,
                is_typing: true, updated_at: new Date().toISOString()
            }, { onConflict: 'team_id,user_id' });
        }
        typingTimeoutRef.current = setTimeout(async () => {
            isTypingRef.current = false;
            await supabase.from('team_typing').delete().eq('team_id', currentTeam.id).eq('user_id', currentUser.id);
        }, 3000);
    }, [currentTeam, currentUser, currentProfile, supabase]);

    const sendMessage = async () => {
        if (sending || !inputText.trim() || !encKey) return;
        setSending(true);
        const text = inputText.trim();
        setInputText('');

        // Stop typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        isTypingRef.current = false;
        supabase.from('team_typing').delete().eq('team_id', currentTeam.id).eq('user_id', currentUser.id);

        const userName = currentProfile?.full_name || currentUser.email?.split('@')[0] || 'User';

        // Add optimistic message
        const tempId = 'temp-' + Date.now();
        setMessages(prev => [...prev, {
            id: tempId, team_id: currentTeam.id, user_id: currentUser.id,
            user_name: userName, decryptedText: text, is_deleted: false,
            created_at: new Date().toISOString(), _pending: true
        }]);

        try {
            const encrypted = await encryptMsg(encKey, text);
            const { data, error } = await supabase.from('team_messages').insert({
                team_id: currentTeam.id, user_id: currentUser.id, user_name: userName, message: encrypted
            }).select().single();
            if (error) throw error;

            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, _pending: false } : m));
        } catch (err) {
            console.error('Send error:', err);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _failed: true } : m));
        } finally {
            setSending(false);
        }
    };

    const deleteMessage = async (msgId) => {
        const Swal = (await import('sweetalert2')).default;
        const result = await Swal.fire({
            title: 'Delete Message?', text: 'This message will be deleted for everyone.',
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
            confirmButtonText: 'Delete for everyone', background: '#1e293b', color: '#f8fafc'
        });
        if (!result.isConfirmed) return;
        await supabase.from('team_messages').update({ is_deleted: true }).eq('id', msgId).eq('user_id', currentUser.id);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true, decryptedText: null } : m));
    };

    const insertEmoji = () => {
        const emojis = ['😊', '👍', '🎉', '🔥', '💪', '👏', '❤️', '😄', '🚀', '✅', '💡', '🙌'];
        setInputText(prev => prev + emojis[Math.floor(Math.random() * emojis.length)]);
    };

    const typingNames = Array.from(typingUsers.values());

    if (!currentTeam) {
        return (
            <div className="dash-empty">
                <i className="fas fa-users-slash" />
                <h3>No Team Assigned</h3>
                <p>You haven't been assigned to a team yet.</p>
            </div>
        );
    }

    const teamInitial = (currentTeam.name || 'T')[0].toUpperCase();

    // Group messages by date
    const groupedMessages = [];
    let lastDate = null;
    messages.forEach(msg => {
        const d = new Date(msg.created_at).toDateString();
        if (d !== lastDate) {
            groupedMessages.push({ type: 'date', date: msg.created_at });
            lastDate = d;
        }
        groupedMessages.push({ type: 'msg', data: msg });
    });

    const formatDateSep = (ts) => {
        const date = new Date(ts);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <div className="dash-section-ready" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', height: 'calc(100vh - 160px)', minHeight: 500 }}>
            {/* Team Info Sidebar */}
            <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--dash-accent)', margin: '0 auto 0.75rem' }}>
                        {teamInitial}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{currentTeam.name || 'My Team'}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', display: 'block', marginBottom: 4 }}>{members.length} members</span>
                    {currentTeam.batches?.name && (
                        <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <i className="fas fa-layer-group" /> {currentTeam.batches.name}
                        </span>
                    )}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--dash-text-secondary)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--dash-text-primary)' }}>Members</div>
                    {members.map(m => {
                        const name = m.profiles?.full_name || 'Unknown';
                        const isLeader = m.role === 'leader';
                        return (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--dash-accent)' }}>
                                    {name[0]?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 500, color: 'var(--dash-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>{m.profiles?.title || m.role || 'Member'}</div>
                                </div>
                                {isLeader && <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>Leader</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Chat Header */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                        {teamInitial}
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{currentTeam.name || 'Team Chat'}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>
                            <i className="fas fa-lock" style={{ color: '#10b981', fontSize: '0.65rem', marginRight: 4 }} />
                            <span style={{ color: '#10b981' }}>Private</span> · {members.length} members
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {groupedMessages.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dash-text-muted)' }}>
                            <i className="fas fa-comments" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }} />
                            <h3 style={{ marginBottom: 4 }}>Start the conversation!</h3>
                            <p style={{ fontSize: '0.85rem' }}>Messages are private and encrypted.</p>
                        </div>
                    )}
                    {groupedMessages.map((item, idx) => {
                        if (item.type === 'date') {
                            return (
                                <div key={`date-${idx}`} style={{ textAlign: 'center', padding: '0.75rem 0', fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 8 }}>{formatDateSep(item.date)}</span>
                                </div>
                            );
                        }
                        const msg = item.data;
                        const isSent = msg.user_id === currentUser.id;
                        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={msg.id} style={{ display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                                <div style={{
                                    maxWidth: '70%', padding: '0.6rem 0.9rem', borderRadius: isSent ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                    background: isSent ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.06)',
                                    opacity: msg.is_deleted ? 0.5 : 1, position: 'relative'
                                }}>
                                    {!isSent && <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#a5b4fc', marginBottom: 2 }}>{escapeHtml(msg.user_name)}</div>}
                                    <div style={{ fontSize: '0.9rem', color: msg.is_deleted ? 'var(--dash-text-muted)' : '#e2e8f0', lineHeight: 1.45, wordBreak: 'break-word' }}>
                                        {msg.is_deleted ? <><i className="fas fa-ban" /> This message was deleted</> : escapeHtml(msg.decryptedText)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 2, fontSize: '0.65rem', color: isSent ? 'rgba(255,255,255,0.6)' : 'var(--dash-text-muted)' }}>
                                        {time}
                                        {isSent && !msg.is_deleted && (
                                            <i className={`fas fa-check${msg._pending ? '' : '-double'}`} style={{ color: msg._pending ? '#64748b' : '#10b981' }} />
                                        )}
                                        {msg._failed && <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }} title="Failed to send" />}
                                    </div>
                                    {isSent && !msg.is_deleted && !msg._pending && (
                                        <button onClick={() => deleteMessage(msg.id)} title="Delete" style={{
                                            position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                                            cursor: 'pointer', fontSize: '0.7rem', opacity: 0, transition: 'opacity 0.2s'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                                        >
                                            <i className="fas fa-trash" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator */}
                {typingNames.length > 0 && (
                    <div style={{ padding: '0.25rem 1rem 0.5rem', fontSize: '0.75rem', color: 'var(--dash-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-flex', gap: 2 }}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--dash-text-muted)', animation: 'pulse 1.4s infinite' }} />
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--dash-text-muted)', animation: 'pulse 1.4s infinite 0.2s' }} />
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--dash-text-muted)', animation: 'pulse 1.4s infinite 0.4s' }} />
                        </span>
                        {typingNames.length === 1 ? <><strong>{typingNames[0]}</strong> is typing...</> :
                            typingNames.length === 2 ? <><strong>{typingNames[0]}</strong> and <strong>{typingNames[1]}</strong> are typing...</> :
                                <><strong>{typingNames.length} people</strong> are typing...</>}
                    </div>
                )}

                {/* Input Area */}
                <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0 0.5rem' }}>
                        <input
                            type="text" value={inputText}
                            onChange={e => { setInputText(e.target.value); handleTyping(); }}
                            onKeyPress={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Type a message..." maxLength={1000}
                            style={{ flex: 1, background: 'none', border: 'none', color: '#e2e8f0', padding: '0.65rem 0.5rem', outline: 'none', fontSize: '0.9rem' }}
                        />
                        <button onClick={insertEmoji} title="Emoji" style={{ background: 'none', border: 'none', color: 'var(--dash-text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>
                            <i className="far fa-smile" />
                        </button>
                    </div>
                    <button onClick={sendMessage} disabled={sending || !inputText.trim()} title="Send" style={{
                        width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', opacity: sending || !inputText.trim() ? 0.5 : 1
                    }}>
                        <i className="fas fa-paper-plane" />
                    </button>
                </div>
            </div>
        </div>
    );
    // Listen for dashboard-refresh event
    useEffect(() => {
        const handler = () => {
            window.location.reload(); // fallback: reload page to refresh team/chat
        };
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, []);
}
