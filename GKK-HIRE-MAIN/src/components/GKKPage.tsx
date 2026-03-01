import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { motion } from 'framer-motion';
import NavigationMenu from './NavigationMenu';
import TransitionOverlay from './TransitionOverlay';
import { useState } from 'react';

const StaggerButton = ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => {
    return (
        <motion.a
            href="/dashboard/apply/"
            onClick={onClick}
            className="relative overflow-hidden bg-black text-white px-16 py-6 rounded-full uppercase font-black text-base tracking-[0.2em] group no-underline inline-block"
            initial="initial"
            whileHover="hovered"
            style={{ textDecoration: 'none' }}
        >
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
        </motion.a>
    );
};

const GKKPage = ({ onNavigate }: { onNavigate: (index: number) => void }) => {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionType, setTransitionType] = useState<'login' | 'apply' | 'register' | 'dashboard'>('dashboard');

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
            style={styles.containerMotion as any}
        >
            <View style={styles.container}>
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
                        <motion.div
                            initial="zoom"
                            animate="settle"
                            variants={titleVariants}
                            style={styles.titleContainerMotion as any}
                        >
                            <View style={styles.titleContainer}>
                                <h1 style={{ ...styles.mainTitle, margin: 0 } as any}>GKK</h1>
                                <Text style={[styles.subTitle, styles.italicCormoram]}>INTERNS</Text>
                            </View>
                        </motion.div>

                        <motion.div variants={elementVariants} className="flex flex-col items-center relative z-50 px-4">
                            <p className="mt-16 md:mt-32 text-xs md:text-lg text-neutral-800 max-w-[90%] md:max-w-xl text-center font-medium leading-relaxed backdrop-blur-sm bg-white/40 p-4 md:p-6 rounded-2xl border border-white/20 shadow-lg">
                                Launch your career in 3 simple steps: <br className="hidden md:block" />
                                <span className="font-bold text-black">1. Apply Now</span> &rarr;
                                <span className="font-bold text-black"> 2. Get Approved</span> &rarr;
                                <span className="font-bold text-black"> 3. Join.</span>
                                <br /> Start by clicking Apply below.
                            </p>

                            <div className="mt-4 md:mt-8 relative z-50 transform scale-75 md:scale-100 origin-top flex flex-col items-center gap-3 md:gap-4">
                                <StaggerButton onClick={(e) => { e.preventDefault(); setTransitionType('apply'); setIsTransitioning(true); }} />
                                <a href="/dashboard/user/signup" className="text-neutral-500 text-sm font-medium hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5">
                                    Already Approved? <span className="text-black font-bold">Register Here</span>
                                </a>

                                <motion.button
                                    className="mt-1 px-6 py-2 bg-transparent border border-black text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-black hover:text-white transition-all flex items-center gap-2"
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
                        if (transitionType === 'dashboard') window.location.href = 'https://gkkintern.in/dashboard';
                        if (transitionType === 'apply') window.location.href = '/dashboard/apply/';
                    }}
                />

                {/* Floating Cards - Hidden on very small screens or scaled way down */}
                <div className="hidden md:block">
                    <motion.div
                        variants={elementVariants}
                        initial={{ y: 800, opacity: 0 }}
                        animate={{
                            y: [-10, 10, -10],
                            opacity: 1,
                            rotate: [-11, -13, -11]
                        }}
                        transition={{
                            y: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
                            rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
                            default: { duration: 1.5, ease: "easeOut" as const, delay: 1.2 }
                        }}
                        style={styles.card1Motion as any}
                    >
                        <View style={[styles.diamondCard, styles.glowDiamond]}>
                            <motion.div
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" as const, repeatDelay: 2 }}
                                style={styles.shineEffect as any}
                            />
                            <View style={styles.blurEffectDiamond} />
                        </View>
                    </motion.div>

                    <motion.div
                        variants={elementVariants}
                        initial={{ y: 800, opacity: 0 }}
                        animate={{
                            y: [10, -10, 10],
                            rotate: [4, 6, 4],
                            opacity: 1
                        }}
                        transition={{
                            y: { duration: 7, repeat: Infinity, ease: "easeInOut" as const },
                            rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" as const },
                            default: { duration: 1.8, ease: "easeOut" as const, delay: 1.4 }
                        }}
                        style={styles.card2Motion as any}
                    >
                        <View style={[styles.diamondCard, styles.glowCyan]}>
                            <motion.div
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" as const, repeatDelay: 3 }}
                                style={styles.shineEffect as any}
                            />
                            <View style={styles.cornerMarkerDiamond} />
                        </View>
                    </motion.div>

                    <motion.div
                        variants={elementVariants}
                        initial={{ y: 1000, opacity: 0 }}
                        animate={{
                            y: [15, -15, 15],
                            rotate: [-1, 1, -1],
                            opacity: 1
                        }}
                        transition={{
                            y: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
                            rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
                            default: { duration: 2, ease: "easeOut" as const, delay: 1.6 }
                        }}
                        style={styles.card3Motion as any}
                    >
                        <View style={[styles.diamondCard, styles.glowSoftDiamond]}>
                            <motion.div
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" as const, repeatDelay: 1 }}
                                style={styles.shineEffect as any}
                            />
                        </View>
                    </motion.div>
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
        backgroundColor: '#E5E5E5',
        width: '100%' as any,
        minHeight: '100vh' as any,
        overflow: 'visible' as any,
    },
    contentWrapper: {
        flex: 1,
        padding: 12, // Reduced for mobile
        paddingHorizontal: 12,
        zIndex: 10,
    },
    noiseOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.01)',
        zIndex: -1,
    },
    headerMotion: {
        zIndex: 20,
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
        color: '#000',
    },
    logoUnderline: {
        height: 3,
        width: '100%',
        backgroundColor: '#000',
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
        // @ts-ignore
        fontSize: 'clamp(50px, 15vw, 220px)', // Smaller minimum size
        fontWeight: '900',
        color: '#1A1A1A',
        textShadow: '0 0 30px rgba(0, 0, 0, 0.15), 0 0 60px rgba(0, 0, 0, 0.1)', // Subtle glow
        lineHeight: 1, // Let it flow naturally or use a relative unit
        letterSpacing: -2, // Less aggressive spacing on mobile
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
    },
    subTitle: {
        // @ts-ignore
        fontSize: 'clamp(40px, 12vw, 180px)', // Smaller minimum
        color: '#C0C0C0',
        position: 'absolute',
        bottom: -50, // Adjust overlap for mobile
        lineHeight: 1,
        zIndex: -1,
        letterSpacing: -2,
        textAlign: 'center',
    },
    italicCormoram: {
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fontWeight: '400',
    },
    diamondCard: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        // @ts-ignore
        backdropFilter: 'blur(30px) saturate(150%)',
        borderRadius: 2,
    },
    shineEffect: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '50%',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.3)',
        transform: [{ skewX: '-25deg' } as any],
        // @ts-ignore
        backgroundImage: 'linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)' as any,
        zIndex: 2,
    },
    card1Motion: {
        position: 'absolute',
        width: 250,
        height: 280,
        top: '15%',
        left: '15%',
        zIndex: 1,
    },
    card2Motion: {
        position: 'absolute',
        width: 320,
        height: 220,
        bottom: '20%',
        right: '10%',
        zIndex: 1,
    },
    card3Motion: {
        position: 'absolute',
        width: 300,
        height: 400,
        bottom: -100,
        right: '5%',
        zIndex: 1,
    },
    blurEffectDiamond: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.6)',
        right: -50,
        top: '20%',
        // @ts-ignore
        filter: 'blur(30px)',
        opacity: 0.3,
    },
    cornerMarkerDiamond: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        width: 20,
        height: 20,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    glowDiamond: {
        // @ts-ignore
        boxShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 20px 60px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255,255,255,0.4)' as any,
    },
    glowCyan: {
        // @ts-ignore
        boxShadow: '0 0 40px rgba(200, 230, 255, 0.4), 0 30px 80px rgba(0, 0, 0, 0.1), inset 0 0 30px rgba(255,255,255,0.5)' as any,
    },
    glowSoftDiamond: {
        // @ts-ignore
        boxShadow: '0 0 50px rgba(255, 255, 255, 0.6), 0 40px 100px rgba(0, 0, 0, 0.08), inset 0 0 40px rgba(255,255,255,0.3)' as any,
    }
});

export default GKKPage;
