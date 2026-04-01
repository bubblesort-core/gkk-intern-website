import { useState } from 'react';
import { motion } from 'framer-motion';
import TransitionOverlay from './TransitionOverlay';
import SectionCanvas from './SectionCanvas';

export default function CallToAction() {
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleApply = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsTransitioning(true);
    };

    const onTransitionComplete = () => {
        window.location.href = '/dashboard/apply/';
    };

    const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const letterAnim = {
        hidden: { y: 100, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 1.2, ease }
        }
    };

    return (
        <>
            <TransitionOverlay
                isVisible={isTransitioning}
                type="apply"
                onComplete={onTransitionComplete}
            />

            <section id="apply" className="relative min-h-screen flex items-center justify-center bg-[var(--bg-surface)]">
            <SectionCanvas dotColor="rgba(34,216,122,0.08)" />
                {/* ... existing section content ... */}
                {/* Need to update the Apply Button link to use onClick */}

                <div className="absolute inset-0 bg-gradient-to-br from-olive via-champagne to-olive opacity-50"></div>

                {/* Grain Overlay */}
                <div className="absolute inset-0 bg-[#000000] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                delay: i * 0.05,
                                duration: 1.5,
                                repeat: Infinity,
                                repeatType: 'reverse',
                                repeatDelay: 2,
                            }}
                            className="absolute w-1 h-1 bg-[var(--bg-surface)] rounded-full"
                            style={{
                                left: `${(i * 13) % 100}%`,
                                top: `${(i * 17) % 100}%`,
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 w-full max-w-[90vw] mx-auto text-center">
                    {/* Main heading */}
                    <motion.div
                        variants={container}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.3 }}
                        className="flex flex-col items-center justify-center mb-16"
                    >
                        <div className="overflow-hidden">
                            <motion.h2 variants={letterAnim} className="text-4xl md:text-8xl font-black font-inter tracking-tighter mb-4 text-[var(--text-primary)]">
                                JOIN THE
                            </motion.h2>
                        </div>

                        <div className="overflow-hidden relative">
                            <motion.h2
                                variants={letterAnim}
                                className="text-[80px] md:text-[240px] leading-[0.85] font-black font-inter tracking-tighter text-[var(--text-primary)] uppercase"
                            >
                                GKK
                            </motion.h2>
                            {/* Decorative line */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                transition={{ duration: 1.5, delay: 0.5, ease }}
                                className="absolute bottom-2 left-0 w-full h-2 md:h-4 bg-[var(--bg-surface)] origin-left"
                            />
                        </div>

                        <motion.p
                            variants={letterAnim}
                            className="text-base md:text-3xl font-cormorant italic text-[var(--text-primary)]/80 max-w-2xl mx-auto mt-8 md:mt-12 font-medium"
                        >
                            Build real projects. Ship production code. Launch your tech career.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: false }}
                        transition={{ delay: 0.6, duration: 0.8, ease }}
                    >
                        <motion.a
                            href="/dashboard/apply/"
                            onClick={handleApply}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative inline-block cursor-pointer no-underline"
                        >
                            {/* Button shadow */}
                            <div className="absolute inset-0 bg-[var(--bg-surface)] translate-x-3 translate-y-3 transition-transform group-hover:translate-x-4 group-hover:translate-y-4"></div>

                            {/* Button */}
                            <div className="relative bg-[#fff] px-10 py-5 md:px-16 md:py-8 border-2 border-[var(--border)] transition-all">
                                <span className="text-xl md:text-4xl font-black font-inter tracking-tighter decoration-black uppercase">
                                    APPLY NOW
                                </span>
                            </div>
                        </motion.a>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: false }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="mt-6"
                    >
                        <a href="/dashboard/user/signup.html" className="text-[var(--text-muted)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors border-b border-transparent hover:border-[var(--border)] pb-0.5">
                            Already Approved? <span className="text-[var(--text-primary)] font-bold">Register Here</span>
                        </a>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
