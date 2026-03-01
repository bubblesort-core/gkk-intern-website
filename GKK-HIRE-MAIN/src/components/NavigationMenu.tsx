import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import gsap from 'gsap';
import { CustomEase } from 'gsap/all';
import TransitionOverlay from './TransitionOverlay';

// Register CustomEase (if available from the package, otherwise use standard ease)
// Note: CustomEase is a bonus plugin, often requires registration. 
// If it fails in standard npm gsap, we'll fall back to a power ease.
try {
    gsap.registerPlugin(CustomEase);
} catch (e) {
    console.log("CustomEase not available, using standard ease");
}

interface NavigationMenuProps {
    onNavigate: (sectionIndex: number) => void;
}

const NavigationMenu = ({ onNavigate }: NavigationMenuProps) => {
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
        window.location.href = transitionInfo.url;
    };

    const menuItems = [
        { label: "Home", index: 0 },
        { label: "About", index: 1 },
        { label: "Services", index: 2 },
        { label: "Alumni", index: 3 }, // Portfolio Section (h-[300vh])
        { label: "Insights", index: 6 }, // Starts after Portfolio (300vh start + 300vh height = 600vh)
        { label: "Achievements", index: 7 }, // After Blog
        { label: "Contact", index: 9 }, // After Achievement + CTA
    ];

    useEffect(() => {
        // Initialize GSAP timeline
        // using a standard power4.inOut or similar if CustomEase isn't perfectly replicable without the specific path data
        // The user provided script tags but we are using npm, so we might not have the exact "CustomEase" definition string.
        // We will use a high quality standard ease.

        timeline.current = gsap.timeline({ paused: true });

        // Overlay expansion
        timeline.current.to(overlayRef.current, {
            duration: 1,
            height: '100vh',
            ease: 'power4.inOut', // Very close to custom editorial eases
        });

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
            if (index >= 0) {
                onNavigate(index);
            }
        }, 800); // Wait for close animation
    };

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
                    <span className="text-xs md:text-sm font-bold tracking-widest uppercase transition-colors group-hover:text-neutral-500">
                        {isOpen ? "Close" : "Menu"}
                    </span>
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full border border-black flex items-center justify-center transition-all duration-300 ${isOpen ? "rotate-45" : ""}`}>
                        <span className="text-base md:text-lg leading-none mb-1">+</span>
                    </div>
                </div>
            </TouchableOpacity>

            {/* Full Screen Overlay */}
            <div
                ref={overlayRef}
                className="fixed top-0 left-0 w-full bg-[#E5E5E5] z-[50] overflow-hidden h-0 flex flex-col justify-center px-4 md:px-20"
                style={{ height: 0 }} // Start hidden
            >
                <div ref={linksRef} className="flex flex-col gap-2 md:gap-4 max-w-4xl">
                    {menuItems.map((item, idx) => (
                        <div key={idx} className="overflow-hidden">
                            {/* Class for GSAP selection */}
                            <div
                                className="menu-link-item cursor-pointer group"
                                onClick={() => handleLinkPress(item.index)}
                            >
                                <h3 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-black transition-colors group-hover:text-neutral-500 group-hover:translate-x-4 duration-300">
                                    {item.label}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-neutral-300">
                    <a
                        href="/dashboard/apply/"
                        onClick={(e) => { e.preventDefault(); triggerTransition('apply', '/dashboard/apply/'); }}
                        className="menu-link-item px-8 py-3 bg-black text-white text-sm font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors text-center rounded-sm"
                    >
                        Apply Now
                    </a>
                    <a
                        href="/dashboard/user/login"
                        onClick={(e) => { e.preventDefault(); triggerTransition('login', '/dashboard/user/login'); }}
                        className="menu-link-item px-8 py-3 border-2 border-black text-black text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors text-center rounded-sm"
                    >
                        Intern Login <span className="text-[10px] block font-normal normal-case">(Returning Users)</span>
                    </a>
                    <a
                        href="/Dashboard/user/signup.html"
                        onClick={(e) => { e.preventDefault(); triggerTransition('register', '/Dashboard/user/signup.html'); }}
                        className="menu-link-item px-8 py-3 border-2 border-black bg-white text-black text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors text-center rounded-sm"
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
