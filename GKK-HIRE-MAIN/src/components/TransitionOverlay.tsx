import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TransitionOverlayProps {
    isVisible: boolean;
    type: 'login' | 'apply' | 'register' | 'dashboard' | 'unlock';
    onComplete: () => void;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ isVisible, type, onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isVisible) {
            // Reset state
            setProgress(0);

            // Progress bar simulation
            const timer = setTimeout(() => {
                setProgress(90);
            }, 100);

            // Complete after animation
            const completeTimer = setTimeout(() => {
                onComplete();
            }, 1500); // 1.5s total duration

            return () => {
                clearTimeout(timer);
                clearTimeout(completeTimer);
            };
        }
    }, [isVisible, onComplete]);

    // Icon Variants
    const iconVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
        exit: { scale: 0, opacity: 0 }
    };

    // Specific Animations
    const lockAnim = {
        animate: {
            rotate: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5, delay: 0.3 }
        }
    };

    const planeAnim = {
        animate: {
            x: [0, -10, 300],
            y: [0, 10, -300],
            scale: [1, 0.9, 0.5],
            opacity: [1, 1, 0],
            transition: { duration: 0.8, delay: 0.3, ease: "easeInOut" as const }
        }
    };

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[99999] bg-[var(--bg-primary)] flex flex-col items-center justify-center top-0 left-0 w-screen h-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', transform: 'none' }}
                >
                    {/* Icon Container */}
                    <div className="mb-8 text-white text-6xl">
                        {type === 'login' && (
                            <motion.div variants={iconVariants} initial="hidden" animate="visible">
                                <motion.div variants={lockAnim} animate="animate">
                                    <i className="fas fa-lock"></i>
                                </motion.div>
                            </motion.div>
                        )}
                        {type === 'register' && (
                            <motion.div variants={iconVariants} initial="hidden" animate="visible">
                                <motion.div variants={lockAnim} animate="animate">
                                    <i className="fas fa-user-lock"></i>
                                </motion.div>
                            </motion.div>
                        )}
                        {type === 'apply' && (
                            <motion.div variants={iconVariants} initial="hidden" animate="visible">
                                <motion.div variants={planeAnim} animate="animate">
                                    <i className="fas fa-paper-plane"></i>
                                </motion.div>
                            </motion.div>
                        )}
                        {type === 'dashboard' && (
                            <motion.div variants={iconVariants} initial="hidden" animate="visible">
                                <motion.div animate={{ scale: [1, 1.2, 1], transition: { duration: 1, repeat: Infinity } }}>
                                    <i className="fas fa-home"></i>
                                </motion.div>
                            </motion.div>
                        )}
                        {type === 'unlock' && (
                            <motion.div variants={iconVariants} initial="hidden" animate="visible">
                                <motion.div
                                    animate={{
                                        rotate: [0, -10, 10, -5, 5, 0],
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{ duration: 0.6, ease: "backOut" }}
                                >
                                    <i className="fas fa-lock-open"></i>
                                </motion.div>
                            </motion.div>
                        )}
                    </div>

                    {/* Progress Bar - Hide for apply animation */}
                    {type !== 'apply' && (
                        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.2, ease: "circOut" }}
                            />
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default TransitionOverlay;
