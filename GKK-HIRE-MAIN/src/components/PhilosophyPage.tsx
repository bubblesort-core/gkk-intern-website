import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { motion } from 'framer-motion';

interface PhilosophyPageProps {
    onBack: () => void;
}

const PhilosophyPage: React.FC<PhilosophyPageProps> = ({ onBack }) => {
    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2, // Stagger text appearance
                delayChildren: 0.3
            }
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as any } // "Cinematic" easing
        }
    };

    const lineReveal = {
        hidden: { opacity: 0, y: "100%" },
        visible: {
            opacity: 1,
            y: "0%",
            transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as any }
        }
    };

    const manifestoSlideIn = {
        hidden: { opacity: 0, x: 50 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 1, ease: "easeOut" as const, delay: 0.5 }
        }
    };

    return (
        <View style={styles.container}>
            {/* Header / Zigzag Pattern */}
            <View style={styles.topZigzagContainer}>
                <View style={styles.zigzagBorder}>
                    {[...Array(30)].map((_, i) => (
                        <View key={i} style={styles.zigzagTriangle} />
                    ))}
                </View>
            </View>

            {/* Background Ghost Text */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 0.8, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={styles.ghostTextContainerMotion as any}
            >
                <View style={styles.ghostTextContainer}>
                    <Text style={styles.ghostText}>AESTHETIC</Text>
                </View>
            </motion.div>

            <View style={styles.contentWrapper}>
                {/* Main Title Section */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.3 }}
                    style={styles.mainContentMotion as any}
                >
                    <View style={styles.mainContent}>
                        <View style={styles.titleContainer}>
                            <View style={{ overflow: 'hidden' }}>
                                <motion.div variants={lineReveal}>
                                    <Text style={styles.titleLine}>THE COLLAPSE</Text>
                                </motion.div>
                            </View>
                            <View style={{ overflow: 'hidden' }}>
                                <motion.div variants={lineReveal}>
                                    <Text style={styles.titleLine}>OF</Text>
                                </motion.div>
                            </View>
                            <View style={{ overflow: 'hidden' }}>
                                <motion.div variants={lineReveal}>
                                    <Text style={[styles.titleLine, styles.italicCormoram]}>CONVENTION.</Text>
                                </motion.div>
                            </View>
                        </View>

                        {/* Subtext */}
                        <motion.div variants={fadeInUp}>
                            <Text style={styles.subtext}>
                                We dismantle the traditional internship model,
                                fusing clinical precision with the lawless
                                creativity of high-fashion editorial.
                            </Text>
                        </motion.div>
                    </View>
                </motion.div>

                {/* Manifesto Box Section */}
                <motion.div
                    variants={manifestoSlideIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false }}
                    style={styles.manifestoContainerMotion as any}
                >
                    <View style={styles.manifestoContainer}>
                        <View style={styles.manifestoBox}>
                            <View style={styles.blackBar} />
                            <View style={styles.manifestoContent}>
                                <Text style={styles.manifestoLabel}>THE MANIFESTO</Text>
                                <Text style={styles.manifestoText}>
                                    GKK operates at the bleeding edge. Our residencies
                                    aren't just placements; they are curated experiences
                                    within the world's most exclusive aesthetic
                                    environments. We seek those who understand that
                                    medicine is a form of art.
                                </Text>
                                <TouchableOpacity style={styles.methodologyLink}>
                                    <Text style={styles.methodologyText}>VIEW METHODOLOGY ↗</Text>
                                    <View style={styles.linkUnderline} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </motion.div>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
        width: '100vw' as any,
        height: '100vh' as any,
    },
    topZigzagContainer: {
        height: 100,
        backgroundColor: 'var(--border)',
        overflow: 'hidden',
        justifyContent: 'flex-end',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 5,
    },
    zigzagBorder: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: -25,
        left: -20,
    },
    zigzagTriangle: {
        width: 50,
        height: 50,
        backgroundColor: 'var(--bg-primary)',
        transform: [{ rotate: '45deg' } as any],
        marginRight: -10,
    },
    backButtonText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        color: 'var(--text-primary)',
    },
    ghostTextContainerMotion: {
        position: 'absolute',
        top: '15%',
        width: '100%',
        zIndex: 0,
        pointerEvents: 'none',
    },
    ghostTextContainer: {
        alignItems: 'center',
    },
    ghostText: {
        // @ts-ignore
        fontSize: 'clamp(80px, 20vw, 240px)',
        fontWeight: '900',
        color: 'var(--text-faint)',
        letterSpacing: -15,
        opacity: 0.8,
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 60,
        gap: 80, // Increased gap
        paddingTop: 100,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center', // Keep centered but with more gap
        alignContent: 'center',
        maxWidth: 1600, // Limit max width
        alignSelf: 'center', // Center the wrapper itself
        width: '100%',
    },
    mainContentMotion: {
        flex: 1, // Changed from 1.5 to 1 to balance
        minWidth: 400, // Increased min width for title
    },
    mainContent: {
        // Just a wrapper
    },
    titleContainer: {
        marginBottom: 40,
    },
    titleLine: {
        // @ts-ignore
        fontSize: 'clamp(50px, 7vw, 90px)', // Slightly larger
        fontWeight: '900',
        color: 'var(--text-primary)',
        lineHeight: 90,
        letterSpacing: -2,
    },
    italicCormoram: {
        fontFamily: 'Cormorant Garamond',
        fontStyle: 'italic',
        fontWeight: '400',
    },
    subtext: {
        fontSize: 18,
        color: 'var(--text-muted)',
        lineHeight: 28,
        width: '100%', // Allow full width
        maxWidth: 500, // But limit max width
        marginTop: 20,
    },
    manifestoContainerMotion: {
        flex: 1,
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        minWidth: 300, // Ensure it doesn't squish too much
    },
    manifestoContainer: {
        paddingLeft: 40,
        justifyContent: 'center',
    },
    manifestoBox: {
        backgroundColor: 'var(--bg-surface)',
        padding: 50,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    blackBar: {
        width: 6,
        backgroundColor: 'var(--accent)',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
    },
    manifestoContent: {
        flex: 1,
    },
    manifestoLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        color: 'var(--text-primary)',
        marginBottom: 20,
        textAlign: 'right',
    },
    manifestoText: {
        fontSize: 16,
        lineHeight: 26,
        color: 'var(--text-muted)',
        textAlign: 'right',
        marginBottom: 30,
    },
    methodologyLink: {
        alignSelf: 'flex-end',
    },
    methodologyText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        color: 'var(--text-primary)',
    },
    linkUnderline: {
        height: 2,
        backgroundColor: 'var(--text-primary)',
        marginTop: 4,
    },
});

export default PhilosophyPage;
