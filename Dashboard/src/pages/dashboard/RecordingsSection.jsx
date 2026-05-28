import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDashboard } from '../../contexts/DashboardContext';
import { RecordingsSkeleton } from '../../components/dashboard/DashboardSkeletons';

export default function RecordingsSection() {
    const { currentUser, currentTeam, supabase } = useDashboard();
    const [recordings, setRecordings] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(null);
    const playerRef = useRef(null);
    const playerReady = useRef(false);  // tracks if YT player API methods are available
    const [isPlaying, setIsPlaying] = useState(false);
    const progressRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const controlsTimer = useRef(null);
    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

    // Helper: safely check if player methods are callable
    const isPlayerReady = () => playerRef.current && playerReady.current && typeof playerRef.current.getPlayerState === 'function';

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

    const loadRecordings = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recordings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            const visible = (data || []).filter(isEligible);
            setRecordings(visible);
            setFiltered(visible);
        } catch (err) {
            console.error('Error loading recordings:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase, isEligible]);

    useEffect(() => { loadRecordings(); }, [loadRecordings]);

    useEffect(() => {
        localStorage.setItem('lastViewed_recordings', Date.now().toString());
    }, []);

    useEffect(() => {
        const handler = () => loadRecordings();
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, [loadRecordings]);

    useEffect(() => {
        if (!searchQuery.trim()) { setFiltered(recordings); return; }
        setFiltered(recordings.filter(r => r.title?.toLowerCase().includes(searchQuery.toLowerCase())));
    }, [searchQuery, recordings]);

    const getVideoId = (url) => {
        if (!url) return null;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|live\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        return match ? match[1] : null;
    };

    const formatTime = (seconds) => {
        seconds = Math.floor(seconds || 0);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    };

    const openPlayer = (rec) => {
        const videoId = rec.youtube_video_id || getVideoId(rec.youtube_url);
        if (!videoId) return;
        setPlaying(rec);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setPlaybackRate(1);
        playerReady.current = false;

        setTimeout(() => {
            if (!window.YT || !window.YT.Player) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(tag);
                window.onYouTubeIframeAPIReady = () => createYTPlayer(videoId);
            } else {
                createYTPlayer(videoId);
            }
        }, 150);
    };

    const createYTPlayer = (videoId) => {
        playerReady.current = false;
        if (playerRef.current) { try { playerRef.current.destroy(); } catch (e) { } }
        playerRef.current = new window.YT.Player('rec-yt-player', {
            height: '100%', width: '100%', videoId,
            playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, iv_load_policy: 3, fs: 0, showinfo: 0 },
            events: {
                onReady: (e) => {
                    playerReady.current = true;
                    setDuration(e.target.getDuration());
                    startProgressTracking();
                },
                onStateChange: (e) => {
                    const p = e.data === window.YT.PlayerState.PLAYING;
                    setIsPlaying(p);
                    if (p) startProgressTracking(); else stopProgressTracking();
                }
            }
        });
    };

    // Use requestAnimationFrame for smooth real-time progress updates
    const startProgressTracking = () => {
        stopProgressTracking();
        const tick = () => {
            if (!isPlayerReady()) { progressRef.current = requestAnimationFrame(tick); return; }
            try {
                setCurrentTime(playerRef.current.getCurrentTime());
                setDuration(playerRef.current.getDuration());
            } catch (e) { /* player may have been destroyed */ }
            progressRef.current = requestAnimationFrame(tick);
        };
        progressRef.current = requestAnimationFrame(tick);
    };

    const stopProgressTracking = () => {
        if (progressRef.current) { cancelAnimationFrame(progressRef.current); progressRef.current = null; }
    };

    const closePlayer = useCallback(() => {
        stopProgressTracking();
        playerReady.current = false;
        if (playerRef.current) { try { playerRef.current.destroy(); } catch (e) { } playerRef.current = null; }
        setPlaying(null);
        setIsPlaying(false);
    }, []);

    const togglePlay = () => {
        if (!isPlayerReady()) return;
        try {
            const state = playerRef.current.getPlayerState();
            if (state === window.YT.PlayerState.PLAYING) playerRef.current.pauseVideo();
            else playerRef.current.playVideo();
        } catch (e) { /* ignore if player not ready */ }
    };

    const handleSeek = (e) => {
        if (!isPlayerReady() || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        try {
            playerRef.current.seekTo(pos * duration, true);
            setCurrentTime(pos * duration);
        } catch (err) { /* ignore */ }
    };

    const handleVolume = (val) => {
        if (!isPlayerReady()) return;
        setVolume(val);
        try {
            playerRef.current.setVolume(val);
            if (val > 0 && isMuted) { playerRef.current.unMute(); setIsMuted(false); }
        } catch (e) { /* ignore */ }
    };

    const toggleMute = () => {
        if (!isPlayerReady()) return;
        try {
            if (isMuted) { playerRef.current.unMute(); setIsMuted(false); }
            else { playerRef.current.mute(); setIsMuted(true); }
        } catch (e) { /* ignore */ }
    };

    const cycleSpeed = () => {
        if (!isPlayerReady()) return;
        const idx = SPEEDS.indexOf(playbackRate);
        const next = SPEEDS[(idx + 1) % SPEEDS.length];
        try {
            playerRef.current.setPlaybackRate(next);
            setPlaybackRate(next);
        } catch (e) { /* ignore */ }
    };

    const toggleFullscreen = () => {
        const el = document.getElementById('rec-player-body');
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen();
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimer.current) clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        if (!isPlaying) {
            setShowControls(true);
            if (controlsTimer.current) clearTimeout(controlsTimer.current);
        }
    }, [isPlaying]);

    // Escape key to close
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape' && playing) closePlayer(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [playing, closePlayer]);

    if (loading) return <RecordingsSkeleton />;

    const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

    // The player modal is rendered via createPortal to document.body
    // so it sits ABOVE the dashboard header's stacking context
    const playerModal = playing ? createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 99999, animation: 'recFadeIn 0.25s ease-out'
            }}
            onClick={closePlayer}
            onContextMenu={e => e.preventDefault()}
        >
            <div
                style={{
                    width: '92%', maxWidth: 1100,
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                    animation: 'recSlideUp 0.35s cubic-bezier(0.175,0.885,0.32,1.275)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1 }}>
                        <i className="fas fa-play-circle" style={{ color: '#10b981', flexShrink: 0 }} />
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {playing.title}
                        </h3>
                    </div>
                    <button
                        onClick={closePlayer}
                        style={{
                            background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8',
                            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', fontSize: '1.15rem', transition: 'all 0.2s',
                            flexShrink: 0, marginLeft: 12
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* Video Body */}
                <div 
                    id="rec-player-body" 
                    style={{ 
                        position: 'relative', 
                        width: '100%', 
                        paddingTop: '56.25%', 
                        background: '#000',
                        cursor: showControls ? 'auto' : 'none'
                    }}
                    onMouseMove={handleMouseMove}
                    onContextMenu={e => e.preventDefault()}
                >
                    {/* YouTube iframe — pointer-events disabled */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        <div id="rec-yt-player" style={{ width: '100%', height: '100%' }} />
                    </div>

                    {/* Security: full shield — blocks all YouTube native UI */}
                    <div onClick={togglePlay}
                        style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'pointer', background: 'transparent', userSelect: 'none', WebkitUserSelect: 'none' }} />

                    {/* Security: top gradient — hides YouTube title bar/share/watch later */}
                    <div onClick={togglePlay}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 60, zIndex: 13,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', pointerEvents: 'auto', cursor: 'pointer'
                        }} />

                    {/* Security: bottom-right cover — hides YouTube logo */}
                    <div onClick={togglePlay}
                        style={{ position: 'absolute', bottom: 0, right: 0, width: 160, height: 48, zIndex: 13, pointerEvents: 'auto', cursor: 'pointer' }} />

                    {/* Center play button when paused */}
                    {!isPlaying && (
                        <button onClick={togglePlay}
                            style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                                width: 72, height: 72, background: 'rgba(16,185,129,0.9)', color: 'white',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.75rem', border: 'none', cursor: 'pointer', zIndex: 11,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%,-50%) scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%,-50%)'}
                        >
                            <i className="fas fa-play" style={{ marginLeft: 4 }} />
                        </button>
                    )}

                    {/* Custom controls */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 14,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
                        padding: '2rem 1rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                        opacity: showControls ? 1 : 0, transition: 'opacity 0.3s',
                        pointerEvents: showControls ? 'auto' : 'none'
                    }}>
                        <button onClick={togglePlay} style={ctrlBtn}>
                            <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`} style={!isPlaying ? { marginLeft: 2 } : {}} />
                        </button>
                        <button onClick={toggleMute} style={ctrlBtn}>
                            <i className={`fas fa-volume-${isMuted || volume === 0 ? 'mute' : 'up'}`} />
                        </button>
                        <input type="range" min="0" max="100" value={isMuted ? 0 : volume}
                            onChange={e => handleVolume(Number(e.target.value))}
                            style={{ width: 60, accentColor: '#10b981', height: 4, cursor: 'pointer' }} />
                        <div onClick={handleSeek}
                            style={{ flex: 1, height: 28, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: '#10b981', width: `${progressPct}%`, borderRadius: 2 }} />
                            </div>
                        </div>
                        <span style={{ color: 'white', fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <button onClick={cycleSpeed} title={`Speed: ${playbackRate}x`}
                            style={{ ...ctrlBtn, fontSize: '0.75rem', fontWeight: 700, width: 'auto', padding: '0 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                            {playbackRate}x
                        </button>
                        <button onClick={toggleFullscreen} style={ctrlBtn}>
                            <i className="fas fa-expand" />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="dash-section-ready">
            {/* Search */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--dash-text-muted)', fontSize: '0.85rem' }} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search recordings..." className="dash-input" style={{ paddingLeft: 38 }} />
                </div>
            </div>

            {/* Player Modal — rendered via portal */}
            {playerModal}

            {/* Recordings Grid */}
            {filtered.length === 0 ? (
                <div className="dash-card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '3rem', color: 'var(--dash-text-muted)', opacity: 0.3, marginBottom: '1rem' }}><i className={searchQuery ? 'fas fa-search' : 'fas fa-play-circle'} /></div>
                    <h3 style={{ color: 'var(--dash-text-secondary)' }}>{searchQuery ? 'No Matching Recordings' : 'No Recordings Available'}</h3>
                    <p style={{ color: 'var(--dash-text-muted)' }}>{searchQuery ? 'Try a different search term.' : 'Past session recordings will appear here.'}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                    {filtered.map(r => {
                        const videoId = r.youtube_video_id || getVideoId(r.youtube_url);
                        const thumb = r.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);
                        return (
                            <div key={r.id} onClick={() => openPlayer(r)} style={{
                                background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s',
                                display: 'flex', flexDirection: 'column'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'var(--dash-accent)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000', overflow: 'hidden' }}>
                                    {thumb && <img src={thumb} alt={r.title} loading="lazy" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={e => { e.target.src = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ''; }} />}
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s' }}
                                        className="rec-play-overlay">
                                        <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.9)', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                            <i className="fas fa-play" style={{ marginLeft: 3 }} />
                                        </div>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>
                                        {r.duration_label || 'Recording'}
                                    </div>
                                </div>
                                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {r.title}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>
                                        <span><i className="far fa-calendar" style={{ marginRight: 4 }} /> {new Date(r.created_at).toLocaleDateString()}</span>
                                        <span style={{ color: 'var(--dash-accent)' }}><i className="fas fa-play-circle" style={{ marginRight: 4 }} /> Watch Now</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .rec-play-overlay:hover, div:hover > .rec-play-overlay { opacity: 1 !important; background: rgba(0,0,0,0.4) !important; }
                @keyframes recFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes recSlideUp { from { transform: scale(0.95) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}

const ctrlBtn = {
    background: 'none', border: 'none', color: 'white', fontSize: '1rem',
    cursor: 'pointer', width: 34, height: 34, display: 'flex',
    alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
    transition: 'background 0.2s', flexShrink: 0
};
