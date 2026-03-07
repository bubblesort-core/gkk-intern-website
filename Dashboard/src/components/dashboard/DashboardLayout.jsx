import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';
import '../../styles/dashboard.css';
import '../../styles/payment-animation.css';

const GEAR_PATH = 'M20,0 L22,4 L24,0.5 L25.5,4.8 L28,2 L28.5,6.5 L32,5 L31,9.2 L34.5,9 L32.5,12.5 L36,13.5 L33.5,16 L37,18 L33.5,20 L36,22.5 L32.5,23.5 L34.5,27 L31,26.8 L32,31 L28.5,29.5 L28,34 L25.5,31.2 L24,35.5 L22,32 L20,36 L18,32 L16,35.5 L14.5,31.2 L12,34 L11.5,29.5 L8,31 L9,26.8 L5.5,27 L7.5,23.5 L4,22.5 L6.5,20 L3,18 L6.5,16 L4,13.5 L7.5,12.5 L5.5,9 L9,9.2 L8,5 L11.5,6.5 L12,2 L14.5,4.8 L16,0.5 L18,4 Z';

function PaymentSuccessOverlay({ active, onComplete }) {
    const [phase, setPhase] = useState('processing');
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Verifying Payment...');
    const [subText, setSubText] = useState('Please wait while we confirm your transaction');
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!active) return;
        setPhase('processing');
        setProgress(0);
        setStatusText('Verifying Payment...');
        setSubText('Please wait while we confirm your transaction');

        // Close any open Razorpay modal so our overlay is fully visible
        const rzpBackdrop = document.querySelector('.razorpay-container');
        if (rzpBackdrop) rzpBackdrop.style.display = 'none';
        const rzpFrame = document.querySelector('.razorpay-checkout-frame');
        if (rzpFrame) rzpFrame.style.display = 'none';

        const startTimer = setTimeout(() => {
            let prog = 0;
            intervalRef.current = setInterval(() => {
                prog += 10;
                setProgress(prog);
                if (prog >= 100) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    setTimeout(() => {
                        setPhase('complete');
                        setStatusText('Payment Verified!');
                        setSubText('Unlocking your dashboard...');
                        setTimeout(() => onComplete(), 3000);
                    }, 300);
                }
            }, 300);
        }, 500);

        return () => {
            clearTimeout(startTimer);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [active, onComplete]);

    if (!active) return null;

    return createPortal(
        <div className={`payment-overlay ${phase === 'complete' ? 'complete' : 'uncomplete'}`}>
            <div className="center">
                <h1>{statusText}</h1>
                <h2>{subText}</h2>
                <div className="wrapper">
                    <div className="gears">
                        <div className="gear-wrapper gear-wrapper-1">
                            <svg className="gear gear-1" viewBox="0 -2 40 40"><path d={GEAR_PATH} /></svg>
                        </div>
                        <div className="gear-wrapper gear-wrapper-2">
                            <svg className="gear gear-2" viewBox="0 -2 40 40"><path d={GEAR_PATH} /></svg>
                        </div>
                        <div className="gear-wrapper gear-wrapper-3">
                            <svg className="gear gear-3" viewBox="0 -2 40 40"><path d={GEAR_PATH} /></svg>
                        </div>
                        <div className="gear-wrapper gear-wrapper-4">
                            <svg className="gear gear-4" viewBox="0 -2 40 40"><path d={GEAR_PATH} /></svg>
                        </div>
                        <svg className="checkmark checkmark-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                        </svg>
                    </div>
                    <div className="loading-bar">
                        <span style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

const NAV_ITEMS = [
    { id: 'payment', icon: 'fas fa-credit-card', label: 'Training Fee', path: 'payment', paymentOnly: true },
    { id: 'overview', icon: 'fas fa-home', label: 'Overview', path: 'overview' },
    { id: 'profile', icon: 'fas fa-user-circle', label: 'Profile', path: 'profile' },
    { id: 'projects', icon: 'fas fa-project-diagram', label: 'Projects', path: 'projects' },
    { id: 'team', icon: 'fas fa-users', label: 'Team', path: 'team' },
    { id: 'announcements', icon: 'fas fa-bullhorn', label: 'Updates', path: 'announcements' },
    { id: 'meetings', icon: 'fas fa-video', label: 'Meetings', path: 'meetings' },
    { id: 'recordings', icon: 'fas fa-play-circle', label: 'Recordings', path: 'recordings' },
    { id: 'divider' },
    { id: 'leaderboard', icon: 'fas fa-trophy', label: 'Leaderboard', path: 'leaderboard' },
    { id: 'resources', icon: 'fas fa-book-reader', label: 'Resources', path: 'resources' },
    { id: 'rewards', icon: 'fas fa-gift', label: 'Rewards', path: 'rewards' },
    { id: 'referrals', icon: 'fas fa-user-plus', label: 'Invite Friends', path: 'referrals' },
    { id: 'mobileapp', icon: 'fas fa-mobile-alt', label: 'Mobile App', path: 'mobileapp' },
];

const SECTION_TITLES = {
    'overview': 'Dashboard Overview',
    'profile': 'My Profile',
    'announcements': 'Updates',
    'meetings': 'Live Meetings',
    'recordings': 'Recorded Sessions',
    'projects': 'My Projects',
    'team': 'Team Board',
    'payment': 'Complete Registration',
    'leaderboard': 'Intern Leaderboard',
    'resources': 'Learning Resources',
    'rewards': 'Rewards & Coupons',
    'referrals': 'Invite Friends',
    'mobileapp': 'Mobile App',
};

const LOCKED_SECTIONS = ['overview', 'announcements', 'meetings', 'recordings', 'projects', 'team', 'resources', 'rewards', 'leaderboard', 'referrals', 'mobileapp'];

export default function DashboardLayout() {
    const { currentProfile, currentTeam, isLocked, loading, signOut, getProxiedUrl, supabase } = useDashboard();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
    const prevLockedRef = useRef(true);
    const location = useLocation();
    const navigate = useNavigate();
    const mainRef = useRef(null);
    const realtimeRef = useRef(null);

    // Detect isLocked transition: true → false = payment just succeeded
    useEffect(() => {
        if (loading) return;
        // Only show animation if just paid
        const justPaid = localStorage.getItem('gkk_just_paid') === 'true';
        if (prevLockedRef.current === true && isLocked === false && justPaid) {
            setShowUnlockAnimation(true);
            localStorage.removeItem('gkk_just_paid');
        }
        prevLockedRef.current = isLocked;
    }, [isLocked, loading]);

    const handleUnlockAnimationComplete = useCallback(() => {
        setShowUnlockAnimation(false);
        navigate('overview', { replace: true });
    }, [navigate]);

    // Determine active section from URL
    const pathSegments = location.pathname.split('/');
    const activeSection = pathSegments[pathSegments.length - 1] || '';
    const activePath = activeSection === 'dashboard' ? 'overview' : activeSection;

    const headerTitle = SECTION_TITLES[activePath] || 'Dashboard';

    // Streak data
    const streak = currentProfile?.current_streak || 0;

    // Navigate to section
    const goTo = useCallback((path) => {
        if (isLocked && LOCKED_SECTIONS.includes(path)) {
            import('sweetalert2').then(({ default: Swal }) => {
                Swal.fire({
                    title: 'Dashboard Locked',
                    text: 'Please complete the registration payment to access this section.',
                    icon: 'warning',
                    confirmButtonText: 'Go to Payment',
                    confirmButtonColor: '#2563eb'
                }).then((result) => {
                    if (result.isConfirmed) navigate('payment');
                });
            });
            return;
        }
        navigate(path);
        setSidebarOpen(false);
        // Clear notification for this section
        setNotifications(prev => ({ ...prev, [path]: false }));
        localStorage.setItem(`gkk_last_viewed_${path}`, Date.now().toString());
        if (mainRef.current) mainRef.current.scrollTop = 0;
    }, [isLocked, navigate]);

    // Redirect locked users to payment, and unlocked users away from payment
    useEffect(() => {
        if (loading || showUnlockAnimation) return; // Don't redirect during animation
        if (isLocked && activePath !== 'payment' && activePath !== 'profile') {
            navigate('payment', { replace: true });
        } else if (!isLocked && activePath === 'payment') {
            navigate('overview', { replace: true });
        }
    }, [loading, isLocked, activePath, navigate, showUnlockAnimation]);

    // Check notifications
    useEffect(() => {
        if (isLocked || !currentTeam) return;
        const checkNotifications = async () => {
            const rpcParams = {
                p_user_id: currentProfile?.id,
                p_team_id: currentTeam?.id || null,
                p_batch: currentTeam?.batch_id || null
            };
            const checks = [
                { key: 'announcements', rpc: 'get_targeted_announcements' },
                { key: 'resources', rpc: 'get_targeted_resources' },
            ];
            const newNotifs = {};
            for (const check of checks) {
                try {
                    const { data } = await supabase.rpc(check.rpc, rpcParams);
                    if (data?.length) {
                        const latest = Math.max(...data.map(d => new Date(d.created_at).getTime()));
                        const lastViewed = parseInt(localStorage.getItem(`gkk_last_viewed_${check.key}`) || '0');
                        if (latest > lastViewed) newNotifs[check.key] = true;
                    }
                } catch { /* ignore */ }
            }
            // Check meetings
            try {
                const { data: meetings } = await supabase
                    .from('sessions')
                    .select('created_at, target_type, target_ids, status, scheduled_start')
                    .or('status.eq.live,status.eq.scheduled')
                    .order('created_at', { ascending: false })
                    .limit(10);
                if (meetings?.length) {
                    const relevant = meetings.filter(m => {
                        // Check if meeting is either live or scheduled for soon
                        const isLiveOrSoon = m.status === 'live' || (m.status === 'scheduled' && new Date(m.scheduled_start) > new Date());
                        if (!isLiveOrSoon) return false;

                        if (!m.target_type || m.target_type === 'all') return true;
                        const ids = m.target_ids || [];
                        const myTeamId = currentTeam?.id;
                        const myBatchId = currentTeam?.batch_id || currentTeam?.batches?.id;

                        if (m.target_type === 'team') return myTeamId && ids.includes(myTeamId);
                        if (m.target_type === 'batch') return myBatchId && ids.includes(myBatchId);
                        if (m.target_type === 'intern') return currentProfile?.id && ids.includes(currentProfile.id);
                        return false;
                    });
                    if (relevant.length) {
                        const latest = Math.max(...relevant.map(r => new Date(r.created_at).getTime()));
                        const lastViewed = parseInt(localStorage.getItem('gkk_last_viewed_meetings') || '0');
                        if (latest > lastViewed) newNotifs['meetings'] = true;
                    }
                }
            } catch { /* ignore */ }
            setNotifications(prev => ({ ...prev, ...newNotifs }));
        };
        checkNotifications();
        const interval = setInterval(checkNotifications, 60000);
        return () => clearInterval(interval);
    }, [isLocked, currentTeam, currentProfile, supabase]);

    // Realtime listeners
    useEffect(() => {
        if (isLocked || !currentTeam || realtimeRef.current) return;
        const channel = supabase
            .channel('dashboard-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, () => {
                setNotifications(prev => ({ ...prev, announcements: true }));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
                setNotifications(prev => ({ ...prev, meetings: true }));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `assigned_team_id=eq.${currentTeam.id}` }, () => {
                setNotifications(prev => ({ ...prev, projects: true }));
            })
            .subscribe();
        realtimeRef.current = channel;
        return () => {
            supabase.removeChannel(channel);
            realtimeRef.current = null;
        };
    }, [isLocked, currentTeam, supabase]);

    // Show streak help modal
    const showStreakHelp = async () => {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire({
            title: '🔥 How Streaks Work',
            html: `
                <div style="text-align:left; font-size:0.9rem; line-height:1.6;">
                    <p><strong>Daily Check-In:</strong> Visit the dashboard every day to build your streak.</p>
                    <p><strong>XP Bonuses:</strong></p>
                    <ul style="padding-left:1.5rem;">
                        <li>Daily: +10 XP</li>
                        <li>3-day streak: +15 XP</li>
                        <li>7-day streak: +25 XP</li>
                    </ul>
                    <p><strong>Tip:</strong> Don't miss a day or your streak resets!</p>
                </div>`,
            confirmButtonText: 'Got it!',
            confirmButtonColor: '#6366f1',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#f8fafc'
        });
    };

    // Refresh logic
    const handleRefresh = async () => {
        setRefreshing(true);
        // The child components will handle their own refresh via key changes or context
        // For now just trigger a brief animation
        setTimeout(() => setRefreshing(false), 1000);
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    };

    if (loading) {
        return (
            <div className="dash-loading-overlay">
                <div style={{ position: 'relative', width: 60, height: 60, marginBottom: '1.5rem' }}>
                    <div className="dash-loader-pulse" />
                    <div className="dash-loader-pulse" />
                    <div className="dash-loader-icon" />
                </div>
                <div style={{ color: 'white', fontWeight: 500 }}>Loading Dashboard...</div>
            </div>
        );
    }

    const userName = currentProfile?.full_name || currentProfile?.email?.split('@')[0] || 'Intern';
    const userEmail = currentProfile?.email || '';
    const userInitial = userName[0]?.toUpperCase() || 'I';

    return (
        <>
            <PaymentSuccessOverlay active={showUnlockAnimation} onComplete={handleUnlockAnimationComplete} />
            <div className="dash-container">
                {/* Mobile Toggle */}
                <button className="dash-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <span /><span /><span />
                </button>

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div className={`dash-mobile-overlay open`} onClick={() => setSidebarOpen(false)} />
                )}

                {/* Sidebar */}
                <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="dash-sidebar-logo">
                        <img src="/assets/gkk-intern-logo.png" alt="GKK Intern Logo" />
                    </div>

                    <nav className="dash-nav">
                        {NAV_ITEMS.map(item => {
                            if (item.id === 'divider') return <div key="divider" className="dash-nav-divider" />;
                            if (item.paymentOnly && !isLocked) return null;

                            const isActive = activePath === item.path || (activePath === '' && item.path === '');
                            const isLockedItem = isLocked && LOCKED_SECTIONS.includes(item.path);
                            const hasNotif = notifications[item.path];

                            return (
                                <button
                                    key={item.id}
                                    className={`dash-nav-item ${isActive ? 'active' : ''} ${isLockedItem ? 'locked' : ''}`}
                                    onClick={() => goTo(item.path)}
                                >
                                    <i className={item.icon} />
                                    <span>{item.label}</span>
                                    {hasNotif && <span className="dash-nav-notif" />}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="dash-sidebar-footer">
                        <div className="dash-sidebar-user">
                            <div className="dash-sidebar-avatar">
                                {currentProfile?.avatar_url
                                    ? <img src={getProxiedUrl(currentProfile.avatar_url)} alt="Avatar" />
                                    : userInitial}
                            </div>
                            <div className="dash-sidebar-info">
                                <div className="dash-sidebar-name">{userName}</div>
                                <div className="dash-sidebar-email">{userEmail}</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="dash-main" ref={mainRef}>
                    <header className="dash-header">
                        <h1 className="dash-header-title">{headerTitle}</h1>
                        <div className="dash-header-actions">
                            <button
                                className="dash-btn-icon"
                                onClick={handleRefresh}
                                title="Check for updates"
                            >
                                <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`} />
                            </button>

                            <div className="dash-streak" onClick={showStreakHelp} title="Daily Login Streak">
                                <span className={`dash-streak-fire ${streak > 0 ? 'streak-active' : ''}`}>🔥</span>
                                <div className="dash-streak-info">
                                    <div className="dash-streak-count">{isLocked ? 'Locked' : streak}</div>
                                    <div className="dash-streak-status">{isLocked ? '' : 'day streak'}</div>
                                </div>
                            </div>

                            <button className="dash-signout-btn" onClick={signOut} title="Sign Out">
                                <i className="fas fa-sign-out-alt" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </header>

                    <div className="dash-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </>
    );
}
