import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';
import '../../styles/dashboard.css';
import '../../styles/payment-animation.css';
import '../../../public/css/professional-design.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FiCreditCard, FiGrid, FiUser, FiLayers, FiUsers, 
    FiBell, FiVideo, FiPlayCircle, FiBookOpen, FiGift, FiSmartphone,
    FiRefreshCcw, FiLogOut, FiLock, FiX, FiMenu, FiMoon, FiSun, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';


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

const NAV_GROUPS = [
    {
        label: 'OVERVIEW',
        items: [
            { id: 'payment', icon: <FiCreditCard />, label: 'Training Fee', path: 'payment', paymentOnly: true },
            { id: 'overview', icon: <FiGrid />, label: 'Overview', path: 'overview' },
            { id: 'profile', icon: <FiUser />, label: 'Profile', path: 'profile' },
        ]
    },
    {
        label: 'PROGRESS',
        items: [
            { id: 'projects', icon: <FiLayers />, label: 'Projects', path: 'projects' },
            { id: 'team', icon: <FiUsers />, label: 'Team', path: 'team' },
            { id: 'announcements', icon: <FiBell />, label: 'Updates', path: 'announcements' },
            { id: 'meetings', icon: <FiVideo />, label: 'Meetings', path: 'meetings' },
            { id: 'recordings', icon: <FiPlayCircle />, label: 'Recordings', path: 'recordings' },
        ]
    },
    {
        label: 'ACCOUNT',
        items: [
            { id: 'resources', icon: <FiBookOpen />, label: 'Resources', path: 'resources' },
            { id: 'rewards', icon: <FiGift />, label: 'Rewards', path: 'rewards' },
        ]
    }
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
};

const LOCKED_SECTIONS = ['overview', 'announcements', 'meetings', 'recordings', 'projects', 'team', 'resources', 'rewards'];

export default function DashboardLayout() {
    const { currentUser, currentProfile, currentTeam, isLocked, loading, signOut, getProxiedUrl, profileSlug, supabase, isAdmin } = useDashboard();
    const { slug } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.innerWidth > 1024;
    });
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('gkk_dashboard_theme') || 'dark';
    });
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

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gkk_dashboard_theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleViewportLayout = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setSidebarOpen(false);
            }
            if (width >= 768 && width <= 1024) {
                setSidebarExpanded(false);
            }
        };

        handleViewportLayout();
        window.addEventListener('resize', handleViewportLayout);
        return () => window.removeEventListener('resize', handleViewportLayout);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    }, []);

    const handleUnlockAnimationComplete = useCallback(() => {
        setShowUnlockAnimation(false);
        navigate('overview', { replace: true });
    }, [navigate]);

    // Determine active section from URL
    const pathSegments = location.pathname.split('/');
    const activeSection = pathSegments[pathSegments.length - 1] || '';
    const activePath = activeSection === 'dashboard' ? 'overview' : activeSection;

    // Enforcement: Redirect to correct slug if mismatch
    useEffect(() => {
        if (!loading && profileSlug && slug !== profileSlug) {
            console.log(`Slug mismatch: expected ${profileSlug}, got ${slug}. Redirecting...`);
            navigate(`/${profileSlug}/${activePath}`, { replace: true });
        }
    }, [slug, profileSlug, loading, activePath, navigate]);

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

    const showStreakHelp = async () => {
        const Swal = (await import('sweetalert2')).default;
        const streak = currentProfile?.current_streak || 0;
        const currentLevel = calculateLevel(streak);
        const nextLevelStreak = (currentLevel) * 5;
        const daysToNext = Math.max(0, nextLevelStreak - streak);

        Swal.fire({
            title: '🔥 How Streaks Work',
            html: `
                <div style="text-align:left; font-size:0.9rem; line-height:1.6;">
                    <p><strong>Daily Check-In:</strong> Visit the dashboard every day to build your streak.</p>
                    <p><strong>Leveling Up:</strong></p>
                    <ul style="padding-left:1.5rem;">
                        <li>You gain 1 Level for every 5 days of your streak.</li>
                        <li>Current Level: <strong>${currentLevel}</strong></li>
                        ${daysToNext > 0 ? `<li>Next Level in: <strong>${daysToNext} days</strong></li>` : ''}
                    </ul>
                    <p><strong>Tip:</strong> Don't miss a day or your streak resets and your Level will reflect your new current streak!</p>
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
    const userInitial = userName[0]?.toUpperCase() || 'I';

    const displayedNavGroups = [...NAV_GROUPS];

    const mobileNavItems = displayedNavGroups.flatMap(group => group.items)
        .filter(item => !item.paymentOnly || isLocked)
        .filter(item => ['overview', 'projects', 'meetings', 'profile', 'payment'].includes(item.path));

    return (
        <>
            <PaymentSuccessOverlay active={showUnlockAnimation} onComplete={handleUnlockAnimationComplete} />
            <div className="dash-container">
                {/* Mobile Overlay */}
                <div className={`dash-mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

                {/* Sidebar */}
                <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarExpanded ? 'expanded' : 'collapsed'} cinematic-entry entry-1`}>
                    <div className="dash-sidebar-logo">
                        <button
                            className="dash-sidebar-expand-toggle dash-tooltip"
                            onClick={() => setSidebarExpanded(prev => !prev)}
                            data-tooltip={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            {sidebarExpanded ? <FiChevronLeft /> : <FiChevronRight />}
                        </button>

                        <div className="dash-sidebar-user-card">
                            <div className="dash-sidebar-avatar">
                                {currentProfile?.avatar_url
                                    ? <img src={getProxiedUrl(currentProfile.avatar_url)} alt="Avatar" />
                                    : userInitial}
                            </div>
                            <div className="dash-sidebar-info">
                                <div className="dash-sidebar-name">{userName}</div>
                                <div className="dash-sidebar-meta-badge">Intern · {isLocked ? 'Pending' : 'Active'}</div>
                            </div>
                        </div>

                        {sidebarOpen && (
                            <button 
                                className="dash-mobile-toggle" 
                                style={{ position: 'absolute', right: '10px', top: '10px' }} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <FiX />
                            </button>
                        )}
                    </div>

                    <nav className="dash-nav">
                        <div className="sidebar-noise" />
                        {displayedNavGroups.map((group, gIdx) => (
                            <div key={group.label} className={`dash-nav-group cinematic-entry entry-${gIdx + 2}`}>
                                <span className="dash-nav-group-label">{group.label}</span>
                                <AnimatePresence mode="wait">
                                    {group.items.map((item) => {
                                        if (item.paymentOnly && !isLocked) return null;

                                        const isActive = activePath === item.path || (activePath === '' && item.path === '');
                                        const isLockedItem = isLocked && LOCKED_SECTIONS.includes(item.path);
                                        const hasNotif = notifications[item.path];

                                        return (
                                            <motion.button
                                                key={item.id}
                                                className={`dash-nav-item dash-tooltip group ${isActive ? 'active' : ''} ${isLockedItem ? 'locked' : 'unlocked'}`}
                                                onClick={() => goTo(item.path)}
                                                data-tooltip={item.label}
                                                data-label={item.label}
                                                aria-label={item.label}
                                                layout
                                                initial={{ opacity: 0.7, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                            >
                                                <div className="nav-item-active-bar" />
                                                <motion.div 
                                                    className="nav-item-liquid"
                                                    animate={isActive ? { transform: 'translateX(0)' } : { transform: 'translateX(-100%)' }}
                                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                                />
                                                <motion.div 
                                                    className="nav-item-icon-wrapper"
                                                    whileHover={!isLockedItem ? { scale: 1.1, y: -2 } : {}}
                                                    whileTap={!isLockedItem ? { scale: 0.95 } : {}}
                                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                                    animate={isLockedItem ? { filter: 'grayscale(90%)' } : { filter: 'grayscale(0%)' }}
                                                >
                                                    {item.icon}
                                                    <AnimatePresence>
                                                        {isLockedItem && (
                                                            <motion.div
                                                                className="lock-icon-wrapper"
                                                                initial={{ scale: 0, rotate: -45 }}
                                                                animate={{ scale: 1, rotate: 0 }}
                                                                exit={{ scale: 0, rotate: 45 }}
                                                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                            >
                                                                <i className="fas fa-lock lock-icon" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                                <motion.span 
                                                    className="nav-item-label"
                                                    animate={isLockedItem ? { opacity: 0.6 } : { opacity: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {item.label}
                                                </motion.span>
                                                <AnimatePresence>
                                                    {hasNotif && (
                                                        <motion.span 
                                                            className="dash-nav-notif"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            exit={{ scale: 0 }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                        />
                                                    )}
                                                </AnimatePresence>
                                            </motion.button>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        ))}
                    </nav>

                    <div className="sidebar-fog-fade" />

                    <div className="dash-sidebar-footer">
                        <div className="dash-sidebar-divider" />
                        <button className="dash-nav-item dash-bottom-nav-item" onClick={() => goTo('profile')} data-label="Settings" aria-label="Settings">
                            <div className="nav-item-icon-wrapper"><FiUser /></div>
                            <span className="nav-item-label">Settings</span>
                        </button>
                        <button className="dash-nav-item dash-bottom-nav-item" onClick={signOut} data-label="Logout" aria-label="Logout">
                            <div className="nav-item-icon-wrapper"><FiLogOut /></div>
                            <span className="nav-item-label">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="dash-main" ref={mainRef}>
                    <header className="dash-header cinematic-entry entry-2">
                        <div className="dash-header-left">
                            {/* Mobile Toggle inside Header */}
                            <button className="dash-mobile-toggle" onClick={() => setSidebarOpen(true)}>
                                <FiMenu />
                            </button>
                            <h1 className="dash-header-title">{headerTitle}</h1>
                        </div>
                        <div className="dash-header-actions">
                            <div className="dash-header-user">
                                <div className="dash-header-avatar">
                                    {currentProfile?.avatar_url
                                        ? <img src={getProxiedUrl(currentProfile.avatar_url)} alt="Avatar" />
                                        : userInitial}
                                </div>
                                <div className="dash-header-user-meta">
                                    <div className="dash-header-user-name">{userName}</div>
                                    <span className={`dash-status-badge ${isLocked ? 'pending' : 'active'}`}>
                                        {isLocked ? 'Pending' : 'Active'}
                                    </span>
                                </div>
                            </div>

                            {isLocked && (
                                <div className="dash-header-pill amber-shimmer">
                                    <FiLock /> Locked
                                </div>
                            )}

                            <button
                                className="dash-btn-icon dash-tooltip"
                                onClick={toggleTheme}
                                data-tooltip={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                            >
                                {theme === 'light' ? <FiMoon /> : <FiSun />}
                            </button>

                            <button
                                className="dash-btn-icon dash-tooltip"
                                onClick={handleRefresh}
                                data-tooltip="Check for updates"
                            >
                                <FiRefreshCcw className={refreshing ? 'nav-icon-spin' : ''} />
                            </button>

                            <button className="dash-signout-btn dash-tooltip" onClick={signOut} data-tooltip="Sign Out">
                                <span>Sign Out</span>
                                <FiLogOut />
                            </button>
                        </div>
                        <div className="dash-header-progress">
                            <div className="progress-bar-fill" style={{ width: isLocked ? '40%' : '100%' }} />
                        </div>
                    </header>

                    <div className="dash-content">
                        <Outlet />
                    </div>

                    <nav className="dash-mobile-bottom-nav" aria-label="Mobile navigation">
                        {mobileNavItems.map((item) => {
                            const isActive = activePath === item.path || (activePath === '' && item.path === 'overview');
                            const isLockedItem = isLocked && LOCKED_SECTIONS.includes(item.path);
                            return (
                                <button
                                    key={`mobile-${item.id}`}
                                    className={`dash-mobile-nav-item ${isActive ? 'active' : ''} ${isLockedItem ? 'locked' : ''}`}
                                    onClick={() => goTo(item.path)}
                                    aria-label={item.label}
                                >
                                    <span className="dash-mobile-nav-icon">{item.icon}</span>
                                    <span className="dash-mobile-nav-label">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

        </>
    );
}
