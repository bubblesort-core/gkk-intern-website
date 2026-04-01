import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import UseAnimations from 'react-useanimations';
import home from 'react-useanimations/lib/home';
import explore from 'react-useanimations/lib/explore';
import lock from 'react-useanimations/lib/lock';
import userPlus from 'react-useanimations/lib/userPlus';
import activity from 'react-useanimations/lib/activity';
import infinity from 'react-useanimations/lib/infinity';
import bookmark from 'react-useanimations/lib/bookmark';
import star from 'react-useanimations/lib/star';
import Swal from 'sweetalert2';
import { useAudio } from '../contexts/AudioContext';

const sidebarGroups = [
    {
        label: 'Main',
        items: [
            { animation: home, label: 'Home', href: '/', section: 'navigate' },
            { animation: explore, label: 'Apply', href: 'https://gkkintern.in/dashboard/apply/', section: 'navigate' },
            { animation: lock, label: 'Sign In', href: '/user/login', section: 'navigate', spa: true },
            { animation: userPlus, label: 'Sign Up', href: '/user/signup', section: 'navigate', spa: true },
        ]
    },
    {
        label: 'App',
        items: [
            { animation: activity, label: 'Dashboard', href: '/home', section: 'portal', spa: true },
            { animation: infinity, label: 'Community', href: '/community-chat/', section: 'portal' },
        ]
    },
    {
        label: 'Resources',
        items: [
            { animation: star, label: 'Benefits', href: '#features', section: 'page', scroll: true },
            { animation: bookmark, label: 'Brochure', href: '/dashboard/GKK_Interns_Company_Brochure.pdf', section: 'page', download: true },
        ]
    }
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isMuted, toggleMute } = useAudio();
    const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const toggleMobile = useCallback(() => setMobileOpen(prev => !prev), []);
    const closeMobile = useCallback(() => setMobileOpen(false), []);

    const prefersReducedMotion = useReducedMotion();

    const handleClick = (e, link) => {
        if (link.download) {
            e.preventDefault();
            Swal.fire({
                title: 'Download Brochure?',
                text: 'Do you want to download the GKK Interns company brochure?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3b82f6',
                cancelButtonColor: '#ef4444',
                confirmButtonText: 'Yes, download it!',
                background: '#1e293b',
                color: '#fff'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Preparing your brochure...',
                        html: 'Please wait while we fetch the file securely.',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                        background: '#1e293b',
                        color: '#fff'
                    });

                    fetch(link.href)
                        .then(response => {
                            if (!response.ok) throw new Error("Network response was not ok");
                            return response.blob();
                        })
                        .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'GKK_Interns_Company_Brochure.pdf';
                            document.body.appendChild(a);
                            a.click();
                            
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);

                            Swal.fire({
                                title: 'Downloaded!',
                                text: 'Your brochure is ready.',
                                icon: 'success',
                                background: '#1e293b',
                                color: '#fff',
                                timer: 2000,
                                showConfirmButton: false
                            });
                        })
                        .catch(err => {
                            Swal.fire({
                                title: 'Download Failed',
                                text: 'There was an issue fetching the brochure. Please try again.',
                                icon: 'error',
                                background: '#1e293b',
                                color: '#fff'
                            });
                        });
                }
            });
        } else if (link.scroll) {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (link.spa) {
            e.preventDefault();
            navigate(link.href);
        }
    };

    const containerVariants = prefersReducedMotion ? {} : {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.06 } }
    };
    
    const itemVariants = prefersReducedMotion ? {} : {
        hidden: { y: 8, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }
    };

    // Inject styles specific to the dark theme refactor
    const localStyle = `
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 72px; /* Collapsed width */
            background: #0e0e12;
            border-right: 0.5px solid rgba(255,255,255,0.07);
            z-index: 1100;
            display: flex;
            flex-direction: column;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-x: hidden;
        }
        .sidebar:hover {
            width: 220px; /* Expanded width */
        }
        .main-content {
            margin-left: 72px;
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 769px) {
            .sidebar:hover ~ .main-content,
            .main-content:hover /* For pseudo structural bounds */ {
                /* Optional: shift content when sidebar expands */
            }
        }
        @media (max-width: 768px) {
            .sidebar {
                width: 220px;
                transform: translateX(-100%) !important;
            }
            .sidebar.sidebar-mobile-open {
                transform: translateX(0) !important;
            }
            .main-content {
                margin-left: 0;
            }
            .sidebar-logo-text, .sidebar-link span, .sidebar-nav-group-label, .sidebar-logo-img {
                opacity: 1 !important;
                visibility: visible !important;
            }
            
            .sidebar-mobile-toggle {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 5px;
                position: fixed;
                top: 14px;
                left: 14px;
                z-index: 1200;
                width: 40px;
                height: 40px;
                background: #0e0e12;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px;
                cursor: pointer;
                padding: 0;
            }
            .sidebar-mobile-toggle span {
                display: block;
                width: 20px;
                height: 2px;
                background: #f0efe9;
                border-radius: 2px;
                transition: all 0.3s ease;
            }
            .sidebar-mobile-toggle.open span:nth-child(1) {
                transform: translateY(7px) rotate(45deg);
            }
            .sidebar-mobile-toggle.open span:nth-child(2) {
                opacity: 0;
            }
            .sidebar-mobile-toggle.open span:nth-child(3) {
                transform: translateY(-7px) rotate(-45deg);
            }
            
            .sidebar-overlay {
                display: block;
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 1050;
            }
        }
        
        .sidebar-logo-container {
            height: 100px;
            padding: 10px 24px;
            border-bottom: 0.5px solid rgba(255,255,255,0.07);
            display: flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
            white-space: nowrap;
            overflow: hidden;
        }
        
        /* The physical logo image */
        .sidebar-logo-img {
            height: 80px;
            width: auto;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .sidebar:hover .sidebar-logo-img {
            opacity: 1;
            visibility: visible;
        }
        
        /* The collapsed placeholder dot */
        .sidebar-collapsed-icon {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            background: rgba(34, 216, 122, 0.15);
            color: #22d87a;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-weight: bold;
            font-family: monospace;
            opacity: 1;
            transition: opacity 0.2s ease;
            position: absolute;
            left: 24px;
        }
        .sidebar:hover .sidebar-collapsed-icon {
            opacity: 0;
            pointer-events: none;
        }

        .sidebar-nav {
            flex: 1;
            padding: 10px 0;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
        }

        .sidebar-nav-group-label {
            font-size: 10px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgba(240,239,233,0.4); /* brightened layout to fix visual issues */
            padding: 16px 20px 6px;
            margin: 0;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .sidebar:hover .sidebar-nav-group-label {
            opacity: 1;
        }

        .sidebar-link {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 12px;
            padding: 10px 16px;
            margin: 2px 8px;
            border-radius: 6px;
            color: rgba(240,239,233,0.6); /* brightened layout to fix visual issues */
            text-decoration: none;
            transition: background 0.15s, color 0.15s;
            font-size: 13px;
            font-weight: 500;
            position: relative;
            white-space: nowrap;
            overflow: hidden;
        }
        .sidebar-link span {
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .sidebar:hover .sidebar-link span {
            opacity: 1;
            visibility: visible;
        }
        
        .sidebar-link:hover {
            background: rgba(255,255,255,0.06);
            color: rgba(240,239,233,0.9);
        }
        .sidebar-link.active {
            background: rgba(34,216,122,0.1);
            color: #ffffff;
            font-weight: 600;
        }
        .sidebar-link.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 10%;
            bottom: 10%;
            width: 3px;
            background-color: #22d87a;
            border-radius: 0 4px 4px 0;
        }
        
        .sidebar-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .sidebar-icon > div, .sidebar-icon svg {
            width: 18px !important;
            height: 18px !important;
        }
        
        .sidebar-link.active .sidebar-icon {
            color: #22d87a;
        }

        .sidebar-divider {
            height: 1px;
            background-color: rgba(255,255,255,0.07);
            margin: 8px 16px;
        }
    `;

    return (
        <>
            <style>{localStyle}</style>

            {/* Mobile hamburger toggle (keeps existing structure/class) */}
            <button
                className={`sidebar-mobile-toggle ${mobileOpen ? 'open' : ''}`}
                onClick={toggleMobile}
                aria-label="Toggle sidebar"
                style={{
                    backgroundColor: mobileOpen ? '#0e0e12' : undefined,
                    borderColor: 'rgba(255,255,255,0.1)'
                }}
            >
                <span style={{ backgroundColor: '#f0efe9' }} />
                <span style={{ backgroundColor: '#f0efe9' }} />
                <span style={{ backgroundColor: '#f0efe9' }} />
            </button>

            {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

            <motion.aside 
                className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="sidebar-logo-container">
                    <div className="sidebar-collapsed-icon">G</div>
                    <img src="/assets/gkk-intern-logo.png" alt="GKK Interns" className="sidebar-logo-img" />
                </div>

                <nav className="sidebar-nav">
                    {sidebarGroups.map((group, groupIdx) => (
                        <React.Fragment key={group.label}>
                            <motion.div variants={itemVariants} className="sidebar-nav-group-label">
                                {group.label}
                            </motion.div>
                            
                            {group.items.map((link) => {
                                const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href));
                                const uniqueKey = link.label + '-' + groupIdx;
                                
                                return (
                                    <motion.a
                                        variants={itemVariants}
                                        key={uniqueKey}
                                        href={link.href}
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                        onClick={(e) => { handleClick(e, link); closeMobile(); }}
                                        onMouseEnter={() => setHoveredIndex(uniqueKey)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                        title={link.label}
                                        {...(link.download ? { download: 'GKK_Interns_Company_Brochure.pdf', target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    >
                                        <div className="sidebar-icon">
                                            <UseAnimations
                                                animation={link.animation}
                                                size={18}
                                                strokeColor="currentColor"
                                                autoplay={hoveredIndex === uniqueKey}
                                                loop={hoveredIndex === uniqueKey}
                                                speed={1.0}
                                            />
                                        </div>
                                        <span>{link.label}</span>
                                    </motion.a>
                                );
                            })}

                            {/* Don't render divider after the very last group */}
                            {groupIdx < sidebarGroups.length - 1 && (
                                <motion.div variants={itemVariants} className="sidebar-divider" />
                            )}
                        </React.Fragment>
                    ))}
                </nav>

                {/* Sidebar Footer Controls */}
                <div style={{ 
                    padding: '20px 16px', 
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                            onClick={toggleTheme}
                            className="sidebar-control-btn"
                            title="Toggle Theme"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                {theme === 'light' ? 'dark_mode' : 'light_mode'}
                            </span>
                        </button>
                    </div>
                </div>
                <style>{`
                    .sidebar-control-btn {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.1);
                        color: rgba(240,239,233,0.6);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .sidebar-control-btn:hover {
                        background: rgba(255,255,255,0.1);
                        color: #fff;
                    }
                    .sidebar-control-btn.active {
                        background: var(--accent);
                        color: #fff;
                        border-color: var(--accent);
                        box-shadow: 0 0 10px var(--accent);
                    }
                `}</style>
            </motion.aside>
        </>
    );
}
