import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { MeetingsSkeleton } from '../../components/dashboard/DashboardSkeletons';

export default function MeetingsSection() {
    const { currentUser, currentProfile, currentTeam, supabase } = useDashboard();
    const [activeMeetings, setActiveMeetings] = useState([]);
    const [scheduledMeetings, setScheduledMeetings] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState({});
    const [chatInputs, setChatInputs] = useState({});
    const [sendingChat, setSendingChat] = useState({});
    const playerRef = useRef(null);
    const [playerMeetingId, setPlayerMeetingId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playerError, setPlayerError] = useState(null); // {meetingId, videoId, joinUrl}

    const isEligible = useCallback((m) => {
        if (!m) return false;
        if (!m.target_type || m.target_type === 'all') return true;
        const tIds = m.target_ids || [];
        const myTeamId = currentTeam?.id;
        const myBatchId = currentTeam?.batch_id || currentTeam?.batches?.id;
        if (m.target_type === 'team') return myTeamId && tIds.includes(myTeamId);
        if (m.target_type === 'batch') return myBatchId && tIds.includes(myBatchId);
        if (m.target_type === 'intern') return currentUser?.id && tIds.includes(currentUser.id);
        return false;
    }, [currentTeam, currentUser]);

    const loadMeetings = useCallback(async () => {
        setLoading(true);
        try {
            const [sessionsResult] = await Promise.all([
                supabase.from('sessions').select('*').order('scheduled_start', { ascending: false }).limit(50)
            ]);
            if (sessionsResult.error) throw sessionsResult.error;

            const allSessions = sessionsResult.data || [];
            const visible = allSessions.filter(isEligible);

            setActiveMeetings(visible.filter(s => s.status === 'live'));
            setScheduledMeetings(visible.filter(s => s.status === 'scheduled' && new Date(s.scheduled_start) > new Date()));
            setHistory(visible.filter(s => s.status === 'ended' || s.status === 'cancelled'));
        } catch (err) {
            console.error('Error loading meetings:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase, isEligible]);

    useEffect(() => { loadMeetings(); }, [loadMeetings]);

    useEffect(() => {
        localStorage.setItem('lastViewed_meetings', Date.now().toString());
    }, []);

    useEffect(() => {
        const handler = () => loadMeetings();
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, [loadMeetings]);

    // Subscribe to live chat for active meetings
    useEffect(() => {
        const subs = [];
        activeMeetings.forEach(m => {
            // Load existing messages
            supabase.from('meeting_messages').select('*').eq('meeting_id', m.id).order('created_at', { ascending: true })
                .then(({ data }) => {
                    if (data) setChatMessages(prev => ({ ...prev, [m.id]: data }));
                });

            const channel = supabase
                .channel(`meeting_${m.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meeting_messages', filter: `meeting_id=eq.${m.id}` },
                    (payload) => {
                        setChatMessages(prev => ({
                            ...prev,
                            [m.id]: [...(prev[m.id] || []), payload.new]
                        }));
                    })
                .subscribe();
            subs.push(channel);
        });
        return () => subs.forEach(ch => supabase.removeChannel(ch));
    }, [activeMeetings, supabase]);

    const sendChatMessage = async (meetingId) => {
        const text = (chatInputs[meetingId] || '').trim();
        if (!text || sendingChat[meetingId]) return;
        setSendingChat(prev => ({ ...prev, [meetingId]: true }));
        const name = currentProfile?.full_name || currentUser.email;
        try {
            await supabase.from('meeting_messages').insert({ meeting_id: meetingId, user_name: name, message: text });
            setChatInputs(prev => ({ ...prev, [meetingId]: '' }));
        } catch (err) {
            console.error('Chat send error:', err);
        } finally {
            setSendingChat(prev => ({ ...prev, [meetingId]: false }));
        }
    };

    const startVideo = (videoUrl, meetingId, joinUrl) => {
        if (!videoUrl) return;
        const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|live\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        if (!match) return;
        setPlayerError(null);
        setPlayerMeetingId(meetingId);

        // Load YouTube IFrame API if needed
        if (!window.YT || !window.YT.Player) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = () => initPlayer(match[1], meetingId, joinUrl || videoUrl);
        } else {
            initPlayer(match[1], meetingId, joinUrl || videoUrl);
        }
    };

    const initPlayer = (videoId, meetingId, joinUrl) => {
        const container = document.getElementById(`yt-player-${meetingId}`);
        if (!container) return;
        if (playerRef.current) playerRef.current.destroy();

        playerRef.current = new window.YT.Player(`yt-player-${meetingId}`, {
            height: '100%', width: '100%', videoId,
            playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, origin: window.location.origin },
            events: {
                onStateChange: (e) => {
                    setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
                },
                onError: (e) => {
                    // Error codes 101 and 150 mean embedding is disabled by the video owner
                    if (e.data === 101 || e.data === 150 || e.data === 2) {
                        setPlayerError({ meetingId, videoId, joinUrl: joinUrl || `https://www.youtube.com/watch?v=${videoId}` });
                    }
                }
            }
        });
    };

    const togglePlay = () => {
        if (!playerRef.current) return;
        const state = playerRef.current.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
    };

    if (loading) return <MeetingsSkeleton />;

    const hasActive = activeMeetings.length > 0;

    return (
        <div className="dash-section-ready">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Live Meetings</h3>
                {hasActive && (
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.85rem' }}>
                        <i className="fas fa-circle" style={{ fontSize: '0.6rem', marginRight: 6, animation: 'pulse 2s infinite' }} /> LIVE
                    </span>
                )}
            </div>

            {activeMeetings.length === 0 && scheduledMeetings.length === 0 && (
                <div className="dash-card" style={{ textAlign: 'center', padding: '3rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '2.5rem', color: 'var(--dash-text-muted)', opacity: 0.3, marginBottom: '1rem' }}><i className="fas fa-video-slash" /></div>
                    <h3 style={{ color: 'var(--dash-text-secondary)' }}>No Live Meetings</h3>
                    <p style={{ color: 'var(--dash-text-muted)' }}>There are no live or upcoming sessions right now.</p>
                </div>
            )}

            {activeMeetings.map(m => {
                const isMeet = m.platform === 'google_meet';
                if (isMeet) {
                    return (
                        <div key={m.id} className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', borderLeft: '4px solid #1a73e8', marginBottom: '1.5rem' }}>
                            <div style={{ width: 64, height: 64, background: 'rgba(26,115,232,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8', fontSize: '1.5rem' }}>
                                <i className="fas fa-video" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                                    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                                        <i className="fas fa-circle" style={{ fontSize: '0.5rem' }} /> LIVE NOW
                                    </span>
                                    <span style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem' }}>via Google Meet</span>
                                </div>
                                <h3 style={{ color: 'white', fontSize: '1.25rem', margin: 0 }}>{m.title}</h3>
                                <p style={{ color: 'var(--dash-text-secondary)', margin: '0.25rem 0 0' }}>
                                    Started at {new Date(m.actual_start || m.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <a href={m.join_url} target="_blank" rel="noopener noreferrer" className="dash-btn dash-btn-primary" style={{ background: '#1a73e8' }}>
                                Join Meeting <i className="fas fa-external-link-alt" style={{ marginLeft: 8 }} />
                            </a>
                        </div>
                    );
                }

                // YouTube live stream
                const msgs = chatMessages[m.id] || [];
                return (
                    <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1rem', marginBottom: '2rem' }}>
                        {/* Video Area */}
                        <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
                            {playerError && playerError.meetingId === m.id ? (
                                /* Fallback: when embedding is disabled by video owner */
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'linear-gradient(145deg, #0f172a, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '2px solid rgba(239,68,68,0.2)' }}>
                                            <i className="fab fa-youtube" style={{ fontSize: '2rem', color: '#ef4444' }} />
                                        </div>
                                        <h3 style={{ color: '#f1f5f9', margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Live Stream Available</h3>
                                        <p style={{ color: '#94a3b8', margin: '0 0 1.25rem', fontSize: '0.9rem', maxWidth: 320 }}>
                                            This live stream needs to be watched directly on YouTube.
                                        </p>
                                        <a href={playerError.joinUrl} target="_blank" rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                                background: '#ef4444', color: 'white', padding: '0.7rem 1.5rem',
                                                borderRadius: 10, fontWeight: 600, fontSize: '0.95rem',
                                                textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
                                                boxShadow: '0 4px 15px rgba(239,68,68,0.3)'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(239,68,68,0.3)'; }}
                                        >
                                            <i className="fab fa-youtube" /> Watch on YouTube <i className="fas fa-external-link-alt" style={{ fontSize: '0.75rem' }} />
                                        </a>
                                    </div>
                                    {/* Live badge */}
                                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(239,68,68,0.85)', color: 'white', padding: '4px 10px', borderRadius: 4, fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, zIndex: 15 }}>
                                        <i className="fas fa-circle" style={{ fontSize: '0.5rem', animation: 'pulse 1.5s infinite' }} /> LIVE
                                    </div>
                                </div>
                            ) : playerMeetingId === m.id ? (
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}
                                    onContextMenu={e => e.preventDefault()}>
                                    <div id={`yt-player-${m.id}`} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />

                                    {/* Security: full shield */}
                                    <div onClick={togglePlay}
                                        style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'pointer', background: 'transparent', userSelect: 'none', WebkitUserSelect: 'none' }} />

                                    {/* Security: top gradient cover */}
                                    <div onClick={togglePlay}
                                        style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 13,
                                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)', pointerEvents: 'auto', cursor: 'pointer'
                                        }} />

                                    {/* Security: bottom-right cover — hides YouTube logo */}
                                    <div onClick={togglePlay}
                                        style={{ position: 'absolute', bottom: 0, right: 0, width: 140, height: 42, zIndex: 13, pointerEvents: 'auto', cursor: 'pointer' }} />

                                    {/* Live badge */}
                                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(239,68,68,0.85)', color: 'white', padding: '4px 10px', borderRadius: 4, fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, zIndex: 15 }}>
                                        <i className="fas fa-circle" style={{ fontSize: '0.5rem', animation: 'pulse 1.5s infinite' }} /> LIVE
                                    </div>
                                    <button onClick={togglePlay} style={{
                                        position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', border: 'none',
                                        color: 'white', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', zIndex: 15
                                    }}>
                                        <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    onClick={() => startVideo(m.video_url, m.id, m.join_url)}>
                                    <div style={{ textAlign: 'center', color: 'white' }}>
                                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 1rem', boxShadow: '0 0 0 6px rgba(99,102,241,0.15), 0 0 30px rgba(99,102,241,0.3)' }}>
                                            <i className="fas fa-play" style={{ marginLeft: 3 }} />
                                        </div>
                                        <div style={{ fontWeight: 500 }}>Join Live Stream</div>
                                    </div>
                                </div>
                            )}
                            <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
                                <span style={{ fontWeight: 500, color: 'white' }}>{m.title}</span>
                            </div>
                        </div>

                        {/* Chat Panel */}
                        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', height: '100%' }}>
                            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600, fontSize: '0.9rem' }}>
                                <i className="fas fa-comments" style={{ marginRight: 8, color: 'var(--dash-accent)' }} /> Live Chat
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {msgs.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--dash-text-muted)', fontSize: '0.85rem' }}>Welcome to the live chat session.</div>
                                )}
                                {msgs.map((msg, idx) => {
                                    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const isMe = msg.user_name === (currentProfile?.full_name || currentUser.email);
                                    const isAdmin = msg.user_name === 'Admin';
                                    return (
                                        <div key={msg.id || idx} style={{ padding: '0.5rem 0.75rem', background: isMe ? 'rgba(99,102,241,0.1)' : isAdmin ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: isAdmin ? '2px solid #fbbf24' : 'none' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isAdmin ? '#fbbf24' : isMe ? '#a5b4fc' : '#94a3b8' }}>
                                                    {msg.user_name} {isAdmin && <span style={{ background: '#fbbf24', color: 'black', padding: '1px 5px', borderRadius: 3, fontSize: '0.65rem', fontWeight: 'bold', marginLeft: 4 }}>ADMIN</span>}
                                                </span>
                                                <span style={{ fontSize: '0.65rem', color: '#475569' }}>{time}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.45, wordBreak: 'break-word' }}>{msg.message}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text" value={chatInputs[m.id] || ''}
                                        onChange={e => setChatInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                                        onKeyPress={e => { if (e.key === 'Enter') sendChatMessage(m.id); }}
                                        placeholder="Type a message..."
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.65rem 1rem', color: '#e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                    <button onClick={() => sendChatMessage(m.id)} style={{
                                        width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                        color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <i className="fas fa-paper-plane" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Upcoming Meetings */}
            {scheduledMeetings.length > 0 && (
                <>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '2rem 0 1rem' }}>
                        <i className="fas fa-calendar-alt" style={{ color: '#fbbf24' }} /> Upcoming Sessions
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {scheduledMeetings.map(m => (
                            <div key={m.id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ color: 'var(--dash-accent)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="far fa-clock" />
                                    {new Date(m.scheduled_start).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div style={{ color: '#f1f5f9', fontSize: '1.1rem', fontWeight: 600 }}>{m.title}</div>
                                <span style={{ alignSelf: 'flex-start', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--dash-text-secondary)', padding: '2px 8px', borderRadius: 4 }}>
                                    {m.platform === 'google_meet' ? <><i className="fab fa-google" /> Google Meet</> : <><i className="fab fa-youtube" /> YouTube Live</>}
                                </span>
                                <button className="dash-btn dash-btn-secondary" disabled style={{ marginTop: 'auto', opacity: 0.7 }}>Not Started</button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Meeting History */}
            <h3 style={{ margin: '2rem 0 1rem' }}>Meeting History</h3>
            {history.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--dash-text-muted)' }}>No past sessions found</div>
            ) : (
                <div style={{ background: 'rgba(30,41,59,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr>
                                {['Session Title', 'Date', 'Platform', 'Status'].map(h => (
                                    <th key={h} style={{ background: 'rgba(15,23,42,0.5)', padding: '1rem', fontWeight: 600, color: 'var(--dash-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--dash-text-primary)', fontSize: '0.9rem' }}>{m.title}</td>
                                    <td style={{ padding: '1rem', color: 'var(--dash-text-primary)', fontSize: '0.9rem' }}>
                                        {new Date(m.actual_start || m.scheduled_start).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, background: 'rgba(255,255,255,0.05)', color: 'var(--dash-text-secondary)' }}>
                                            {m.platform === 'google_meet' ? 'Google Meet' : 'YouTube Live'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--dash-text-muted)', fontSize: '0.8rem' }}>
                                        {m.status === 'cancelled' ? 'Cancelled' : 'Ended'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
