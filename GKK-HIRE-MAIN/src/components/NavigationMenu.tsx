import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import gsap from 'gsap';
import { CustomEase } from 'gsap/all';
import TransitionOverlay from './TransitionOverlay';
import { useNavigate } from 'react-router-dom';

// Register CustomEase (if available from the package, otherwise use standard ease)
// Note: CustomEase is a bonus plugin, often requires registration. 
// If it fails in standard npm gsap, we'll fall back to a power ease.
try {
    gsap.registerPlugin(CustomEase);
} catch (e) {
    console.log("CustomEase not available, using standard ease");
}

interface NavigationMenuProps {
    onNavigate?: (sectionIndex: number) => void;
}

const NavigationMenu = ({ onNavigate }: NavigationMenuProps = {}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [transitionInfo, setTransitionInfo] = useState<{ active: boolean, type: 'login' | 'apply' | 'register' | 'dashboard' | 'unlock', url: string }>({ active: false, type: 'login', url: '' });

    const menuRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const linksRef = useRef<HTMLDivElement>(null);
    const timeline = useRef<gsap.core.Timeline | null>(null);

    const triggerTransition = (type: 'login' | 'apply' | 'register' | 'dashboard' | 'unlock', url: string) => {
        setTransitionInfo({ active: true, type, url });
    };

    const onTransitionComplete = () => {
        sessionStorage.setItem('cross_app_transition', transitionInfo.type);
        window.location.href = transitionInfo.url;
    };

    const menuItems = [
        { label: "Home", index: -1, transitionType: 'dashboard', transitionUrl: '/dashboard/' },
        { label: "About", index: 1 },
        { label: "Services", index: 2 },
        { label: "Alumni", index: 3 }, // Since Portfolio was removed, Alumni starts at 300vh
        { label: "Achievements", index: 6 }, // After Alumni (300vh)
        { label: "Clients", index: -1, href: "/clients.html" }, // Separate page
        { label: "Contact", index: 8 }, // After Achievement (100vh) + CTA (100vh)
        { label: "Merchandise", index: -1, reactRouterPath: '/merchandise' }, // New!
    ] as { label: string; index: number; href?: string; transitionType?: string; transitionUrl?: string, reactRouterPath?: string }[];

    useEffect(() => {
        // Initialize GSAP timeline
        // using a standard power4.inOut or similar if CustomEase isn't perfectly replicable without the specific path data
        // The user provided script tags but we are using npm, so we might not have the exact "CustomEase" definition string.
        // We will use a high quality standard ease.

        timeline.current = gsap.timeline({ paused: true });

        // Overlay expansion - using clipPath stops reflow jitter compared to height animation
        timeline.current.fromTo(overlayRef.current,
            { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
            {
                duration: 1,
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                ease: 'power4.inOut',
            }
        );

        // Links reveal (staggered)
        timeline.current.fromTo(
            ".menu-link-item", // simplistic class selector
            { x: 100, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
            },
            "-=0.4"
        );

        // Reset transition on back navigation
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                setTransitionInfo(prev => ({ ...prev, active: false }));
            }
        };
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);

    const toggleMenu = () => {
        if (isOpen) {
            timeline.current?.reverse();
        } else {
            timeline.current?.play();
        }
        setIsOpen(!isOpen);
    };

    const handleLinkPress = (index: number) => {
        toggleMenu();
        setTimeout(() => {
            if (index >= 0 && onNavigate) {
                onNavigate(index);
            }
        }, 800); // Wait for close animation
    };

    const navigate = useNavigate();

    return (
        <>
            <TransitionOverlay
                isVisible={transitionInfo.active}
                type={transitionInfo.type}
                onComplete={onTransitionComplete}
            />

            {/* Toggle Button (Absolute Top Right) */}
            <TouchableOpacity
                onPress={toggleMenu}
                style={styles.toggleButton as any}
                activeOpacity={0.8}
            >
                <div className="flex flex-row items-center gap-2 group cursor-pointer">
                    <span className="text-xs md:text-sm text-right w-[46px] font-bold tracking-widest uppercase transition-colors group-hover:text-[var(--accent)] text-[var(--text-primary)] inline-block">
                        {isOpen ? "Close" : "Menu"}
                    </span>
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full border border-[var(--text-primary)] flex items-center justify-center transition-all duration-300 ${isOpen ? "rotate-45" : ""} text-[var(--text-primary)]`}>
                        <span className="text-base md:text-lg leading-none mb-1">+</span>
                    </div>
                </div>
            </TouchableOpacity>

            <div
                ref={overlayRef}
                className="fixed top-0 left-0 w-full bg-[var(--bg-primary)] z-[50] overflow-hidden flex flex-col justify-center px-4 md:px-20 [clip-path:polygon(0%_0%,_100%_0%,_100%_0%,_0%_0%)]"
                style={{ 
                    height: '100vh',
                    pointerEvents: isOpen ? 'auto' : 'none'
                }} // Start hidden securely
            >
                <div ref={linksRef} className="flex flex-col gap-2 md:gap-4 max-w-4xl">
                    {menuItems.map((item, idx) => (
                        <div key={idx} className="overflow-hidden">
                            {item.transitionUrl ? (
                                <a
                                    href={item.transitionUrl}
                                    onClick={(e) => { e.preventDefault(); toggleMenu(); triggerTransition(item.transitionType as any, item.transitionUrl!); }}
                                    className="menu-link-item cursor-pointer group block no-underline"
                                >
                                    <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] group-hover:translate-x-4 duration-300">
                                        {item.label}
                                    </h3>
                                </a>
                            ) : item.href ? (
                                <a
                                    href={item.href}
                                    className="menu-link-item cursor-pointer group block no-underline"
                                >
                                    <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] group-hover:translate-x-4 duration-300">
                                        {item.label}
                                    </h3>
                                </a>
                            ) : item.reactRouterPath ? (
                                <a
                                    href={item.reactRouterPath}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleMenu();
                                        setTimeout(() => {
                                            navigate(item.reactRouterPath!);
                                        }, 800);
                                    }}
                                    className="menu-link-item cursor-pointer group block no-underline"
                                >
                                    <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] group-hover:translate-x-4 duration-300">
                                        {item.label}
                                    </h3>
                                </a>
                            ) : (
                                <div
                                    className="menu-link-item cursor-pointer group"
                                    onClick={() => handleLinkPress(item.index)}
                                >
                                    <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)] group-hover:translate-x-4 duration-300">
                                        {item.label}
                                    </h3>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-[var(--border)]">
                    <a
                        href="/dashboard/apply/"
                        onClick={(e) => { e.preventDefault(); triggerTransition('apply', '/dashboard/apply/'); }}
                        className="menu-link-item px-8 py-3 bg-[var(--accent)] text-black text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-colors duration-300 text-center rounded-sm"
                    >
                        Apply Now
                    </a>
                    <a
                        href="/dashboard/user/login"
                        onClick={(e) => { e.preventDefault(); triggerTransition('login', '/dashboard/user/login'); }}
                        className="menu-link-item px-8 py-3 border-2 border-[var(--text-primary)] text-[var(--text-primary)] text-sm font-bold uppercase tracking-wider hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors duration-300 text-center rounded-sm"
                    >
                        Intern Login <span className="text-[10px] block font-normal normal-case">(Returning Users)</span>
                    </a>
                    <a
                        href="/dashboard/user/signup.html"
                        onClick={(e) => { e.preventDefault(); triggerTransition('register', '/dashboard/user/signup.html'); }}
                        className="menu-link-item px-8 py-3 border-2 border-[var(--text-primary)] bg-transparent text-[var(--text-primary)] text-sm font-bold uppercase tracking-wider hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors duration-300 text-center rounded-sm"
                    >
                        Register <span className="text-[10px] block font-normal normal-case">(Approved Users)</span>
                    </a>
                </div>

                {/* Socials / Extra Info Footer in Menu */}
                <div className="absolute bottom-6 md:bottom-10 left-4 md:left-20 flex flex-wrap gap-4 md:gap-8">
                    <a href="https://www.linkedin.com/company/gkk-intern/" target="_blank" rel="noopener noreferrer" className="menu-link-item text-xs font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">LinkedIn</a>
                    <a href="https://x.com/gkkintern" target="_blank" rel="noopener noreferrer" className="menu-link-item text-xs font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">X (Twitter)</a>
                    <a href="https://www.instagram.com/gkkintern?igsh=MWV1ZWwza3NoeGNndg==" target="_blank" rel="noopener noreferrer" className="menu-link-item text-xs font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">Instagram</a>
                    <a href="https://www.facebook.com/share/1Ar1Giv2Vw/" target="_blank" rel="noopener noreferrer" className="menu-link-item text-xs font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">Facebook</a>
                    <a href="mailto:noreplay.gkk26@gmail.com" className="menu-link-item text-xs font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">Contact</a>
                </div>
            </div>
        </>
    );
};

const styles = StyleSheet.create({
    toggleButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 60, // Above everything including the menu overlay
    }
});

export default NavigationMenu;
