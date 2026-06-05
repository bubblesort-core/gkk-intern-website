import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { motion } from 'framer-motion';
import NavigationMenu from './NavigationMenu';
import SectionCanvas from './SectionCanvas';
import TransitionOverlay from './TransitionOverlay';
import anime from 'animejs/lib/anime.es.js';
import Marquee from './Marquee';
import { MagneticButton } from './MagneticButton';
import { useNavigate } from 'react-router-dom';

const StaggerButton = ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => {
    return (
        <motion.div
            onClick={onClick}
            className="group cursor-pointer relative"
            whileHover="hovered"
            initial="initial"
        >
            <div className="relative overflow-hidden bg-black text-white px-16 py-6 rounded-full uppercase font-black text-base tracking-[0.2em] no-underline inline-block border border-white/10 shadow-[0_0_20px_rgba(34,216,122,0.2)]">
                <div className="relative block overflow-hidden">
                    <motion.div
                        variants={{
                            initial: { y: 0 },
                            hovered: { y: "-100%" }
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        APPLY NOW
                    </motion.div>
                    <motion.div
                        className="absolute top-0 left-0 w-full"
                        variants={{
                            initial: { y: "100%" },
                            hovered: { y: 0 }
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        APPLY NOW
                    </motion.div>
                </div>
            </div>
            {/* Simple glow instead of magnetic blur */}
            <div className="absolute inset-0 bg-[#22d87a] opacity-0 group-hover:opacity-10 blur-2xl rounded-full transition-opacity duration-500" />
        </motion.div>
    );
};

const NAV_ITEMS_LEFT = [
    { name: 'Home', desc: 'Main Page', transitionType: 'dashboard', transitionUrl: '/dashboard/' },
    { name: 'About', desc: 'Our Mission', index: 1 },
    { name: 'Services', desc: 'What We Do', index: 2 },
    { name: 'Alumni', desc: 'Past Interns', index: 3 },
];

const NAV_ITEMS_RIGHT = [
    { name: 'Achievements', desc: 'Our Wins', index: 6 },
    { name: 'Clients', desc: 'Who We Work With', href: '/clients.html' },
    { name: 'Contact', desc: 'Get In Touch', index: 8 },
    { name: 'Merchandise', desc: 'Shop Gear', reactRouterPath: '/merchandise' },
];

const NavItem = ({ item, side, onNavigate, onTransition, navigate }: { item: any, side: 'left' | 'right', onNavigate: (idx: number) => void, onTransition?: (type: string, url: string) => void, navigate: any }) => {
    return (
        <motion.div 
            className="group relative cursor-pointer py-4"
            onClick={() => {
                if (item.transitionType && item.transitionUrl && onTransition) {
                    onTransition(item.transitionType, item.transitionUrl);
                } else if (item.href) {
                    window.location.href = item.href;
                } else if (item.reactRouterPath) {
                    navigate(item.reactRouterPath);
                } else if (item.index !== undefined) {
                    onNavigate(item.index);
                }
            }}
            whileHover="hover"
            initial="initial"
        >
            <div className={`flex items-center gap-5 ${side === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
                <motion.div 
                    variants={{
                        initial: { width: "24px", height: "4px", backgroundColor: "rgba(255,255,255,0.3)" },
                        hover: { width: "56px", height: "4px", backgroundColor: "#22d87a" }
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
                
                <div className={`flex flex-col justify-center ${side === 'right' ? 'items-end' : 'items-start'}`}>
                    <motion.span 
                        variants={{
                            initial: { opacity: 0.7, color: "#f0efe9", x: 0 },
                            hover: { opacity: 1, color: "#ffffff", x: side === 'left' ? 8 : -8 }
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="text-sm md:text-lg font-black uppercase tracking-[0.2em]"
                    >
                        {item.name}
                    </motion.span>
                    
                    <motion.div 
                        variants={{
                            initial: { opacity: 0, height: 0, y: -5, display: "none" },
                            hover: { opacity: 0.85, height: "auto", y: 0, display: "block" }
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <span className="text-xs md:text-sm font-bold text-[#22d87a] uppercase tracking-widest mt-1 block">
                            {item.desc}
                        </span>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

const GKKPage = ({ onNavigate }: { onNavigate: (index: number) => void }) => {
    const navigate = useNavigate();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionType, setTransitionType] = useState<'login' | 'apply' | 'register' | 'dashboard'>('dashboard');
    const [transitionUrl, setTransitionUrl] = useState<string>('');

    const handleTransition = (type: string, url?: string) => {
        setTransitionType(type as any);
        if (url) setTransitionUrl(url);
        setIsTransitioning(true);
    };

    React.useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                setIsTransitioning(false);
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);



    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.8
            }
        }
    };

    const titleVariants = {
        zoom: {
            scale: 2,
            opacity: 0,
            y: 50
        },
        settle: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
                duration: 1.5,
                ease: [0.16, 1, 0.3, 1] as const
            }
        }
    };

    const elementVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" as const }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            style={{ ...styles.containerMotion as any, backgroundColor: '#0c0c0f' }}
        >
            <View style={styles.container}>
                <SectionCanvas dotColor="rgba(240,239,233,0.08)" accentColor="rgba(34,216,122,0.4)" />
                {/* Background Grain Overlay */}
                <View style={styles.noiseOverlay} />

                {/* Internal Padding Wrapper for Content */}
                <View style={styles.contentWrapper}>
                    {/* Header */}
                    <motion.div variants={elementVariants} style={styles.headerMotion as any}>
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Text style={styles.logoText}>GKK</Text>
                                <View style={styles.logoUnderline} />
                            </View>

                            <div className="flex flex-row items-center">
                                {/* Navigation Menu Toggle */}
                                <NavigationMenu onNavigate={onNavigate} />
                            </div>
                        </View>
                    </motion.div>

                    {/* Main Content Area */}
                    <View style={styles.mainContent}>
                        
                        {/* LEFT NAV */}
                        <div className="absolute left-6 xl:left-12 top-1/2 -translate-y-1/2 flex-col gap-4 z-50 hidden lg:flex">
                            {NAV_ITEMS_LEFT.map(item => (
                                <NavItem key={item.name} item={item} side="left" onNavigate={onNavigate} onTransition={handleTransition} navigate={navigate} />
                            ))}
                        </div>

                        {/* RIGHT NAV */}
                        <div className="absolute right-6 xl:right-12 top-1/2 -translate-y-1/2 flex-col gap-4 z-50 hidden lg:flex">
                            {NAV_ITEMS_RIGHT.map(item => (
                                <NavItem key={item.name} item={item} side="right" onNavigate={onNavigate} onTransition={handleTransition} navigate={navigate} />
                            ))}
                        </div>

                        <motion.div
                            initial="zoom"
                            animate="settle"
                            variants={titleVariants}
                            style={styles.titleContainerMotion as any}
                        >
                            <View style={styles.titleContainer}>
                                <div className="relative flex flex-col items-center leading-none select-none">
                                    <div className="absolute -inset-x-10 top-8 h-24 md:h-32 rounded-full bg-linear-to-r from-[#22d87a]/20 via-[#06e4f9]/15 to-[#22d87a]/20 blur-3xl" />
                                    <h1 className="relative text-[clamp(68px,12vw,190px)] font-black tracking-tight text-[#f0efe9] [text-shadow:0_8px_30px_rgba(0,0,0,0.45)]">
                                        GKK
                                    </h1>
                                    <p className="relative mt-1 md:mt-2 text-[clamp(34px,6vw,92px)] font-black tracking-[0.18em] text-[#f0efe9]/55">
                                        INTERNS
                                    </p>
                                </div>
                            </View>
                        </motion.div>

                        <motion.div variants={elementVariants} className="flex flex-col items-center relative z-50 px-4">


                            <div className="mt-24 md:mt-48 relative z-50 transform scale-75 md:scale-100 origin-top flex flex-col items-center gap-3 md:gap-4">
                                <StaggerButton onClick={(e) => { e.preventDefault(); setTransitionType('apply'); setIsTransitioning(true); }} />
                                <a href="/dashboard/user/signup" className="text-[#f0efe9] text-sm font-medium hover:opacity-80 transition-opacity border-b border-transparent hover:border-[rgba(255,255,255,0.07)] pb-0.5">
                                    Already Approved? <span className="text-[#22d87a] font-bold">Register Here</span>
                                </a>

                                <motion.button
                                    className="mt-1 px-6 py-2 bg-transparent border border-[rgba(255,255,255,0.07)] text-[#f0efe9] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#13131a] hover:text-[#f0efe9] transition-all flex items-center gap-2"
                                    onClick={() => { setTransitionType('dashboard'); setIsTransitioning(true); }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <i className="fas fa-arrow-left"></i>
                                    Visit Our Main Page
                                </motion.button>
                            </div>
                        </motion.div>
                    </View>
                </View>

                <TransitionOverlay
                    isVisible={isTransitioning}
                    type={transitionType}
                    onComplete={() => {
                        sessionStorage.setItem('cross_app_transition', transitionType);
                        if (transitionUrl) {
                            window.location.href = transitionUrl;
                        } else {
                            if (transitionType === 'dashboard') window.location.href = '/dashboard/';
                            if (transitionType === 'apply') window.location.href = '/dashboard/apply/';
                        }
                    }}
                />

                <div className="absolute bottom-0 left-0 w-full z-40 border-t border-[rgba(255,255,255,0.05)] bg-[#0c0c0f]">
                    <Marquee />
                </div>
            </View >
        </motion.div >
    );
};

const styles = StyleSheet.create({
    containerMotion: {
        flex: 1,
        width: '100%' as any,
        minHeight: '100vh' as any,
    },
    container: {
        flex: 1,
        backgroundColor: '#0c0c0f',
        width: '100%' as any,
        minHeight: '100vh' as any,
        overflow: 'visible' as any,
    },
    contentWrapper: {
        flex: 1,
        padding: 12, // Reduced for mobile
        paddingHorizontal: 12,
        zIndex: 50,
    },
    noiseOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.01)',
        zIndex: -1,
    },
    headerMotion: {
        zIndex: 60,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Align items
        width: '100%',
    },
    logoContainer: {
        alignItems: 'flex-start',
    },
    logoText: {
        fontSize: 24, // Smaller on mobile
        fontWeight: '900',
        color: '#f0efe9',
    },
    logoUnderline: {
        height: 3,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginTop: 2,
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        width: '100%',
        paddingBottom: 120, // Shift content up
    },
    titleContainerMotion: {
        alignItems: 'center',
        width: '100%',
    },
    titleContainer: {
        alignItems: 'center',
        position: 'relative',
        width: '100%',
    },
    mainTitle: {
        fontSize: 'clamp(50px, 10vw, 180px)', // Smaller minimum size
        fontWeight: '900',
        color: '#f0efe9',
        textShadow: '0 0 30px rgba(0, 0, 0, 0.15), 0 0 60px rgba(0, 0, 0, 0.1)', // Subtle glow
        lineHeight: 1, // Let it flow naturally or use a relative unit
        letterSpacing: -2, // Less aggressive spacing on mobile
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
    } as any,
    subTitle: {
        fontSize: 'clamp(30px, 8vw, 120px)', // Smaller minimum
        color: 'rgba(240,239,233,0.45)',
        position: 'absolute',
        bottom: -30, // Adjust overlap for mobile
        lineHeight: 1,
        zIndex: -1,
        letterSpacing: -2,
        textAlign: 'center',
    } as any,
    italicCormoram: {
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fontWeight: '400',
    },

});

export default GKKPage;
