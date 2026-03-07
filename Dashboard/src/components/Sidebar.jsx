import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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

const sidebarLinks = [
    { animation: home, label: 'Home', href: '/', section: 'navigate' },
    { animation: explore, label: 'Apply', href: 'https://gkkintern.in/dashboard/apply/', section: 'navigate' },
    { animation: lock, label: 'Sign In', href: '/user/login', section: 'navigate', spa: true },
    { animation: userPlus, label: 'Sign Up', href: '/user/signup', section: 'navigate', spa: true },

    { divider: true },
    { animation: activity, label: 'Dashboard', href: '/user/login', section: 'portal', spa: true },

    { animation: infinity, label: 'Community', href: '/community-chat/', section: 'portal' },
    { divider: true },
    { animation: star, label: 'Benefits', href: '#features', section: 'page', scroll: true },
    { animation: bookmark, label: 'Brochure', href: '/GKK_Interns_Company_Brochure.pdf', section: 'page', download: true },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleMobile = useCallback(() => setMobileOpen(prev => !prev), []);
    const closeMobile = useCallback(() => setMobileOpen(false), []);

    const handleClick = (e, link) => {
        if (link.download) {
            e.preventDefault(); // Always prevent default first for async SweetAlert
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
                    // Create a temporary anchor element to trigger the download programmatically
                    const a = document.createElement('a');
                    a.href = link.href;
                    a.download = 'GKK_Interns_Company_Brochure.pdf';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
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

    return (
        <>
            {/* Mobile hamburger toggle */}
            <button
                className={`sidebar-mobile-toggle ${mobileOpen ? 'open' : ''}`}
                onClick={toggleMobile}
                aria-label="Toggle sidebar"
            >
                <span />
                <span />
                <span />
            </button>

            {/* Overlay for mobile */}
            {mobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

            <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <img src="/assets/gkk-intern-logo.png" alt="GKK Interns" />
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {sidebarLinks.map((link, index) => {
                        if (link.divider) {
                            return <div key={`div-${index}`} className="sidebar-divider" />;
                        }

                        return (
                            <a
                                key={link.label}
                                href={link.href}
                                className="sidebar-link"
                                onClick={(e) => { handleClick(e, link); closeMobile(); }}
                                title={link.label}
                                {...(link.download ? { download: 'GKK_Interns_Company_Brochure.pdf', target: '_blank', rel: 'noopener noreferrer' } : {})}
                            >
                                <div className="sidebar-icon">
                                    <UseAnimations
                                        animation={link.animation}
                                        size={28}
                                        strokeColor="currentColor"
                                        autoplay={true}
                                        loop={true}
                                        speed={0.5}
                                    />
                                </div>
                                <span className="sidebar-link-label">{link.label}</span>
                            </a>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
