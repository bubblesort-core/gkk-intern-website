import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const EntranceOverlay: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [type, setType] = useState('apply');
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        const transitionType = sessionStorage.getItem('cross_app_transition');
        if (transitionType) {
            setType(transitionType);
            setShouldRender(true);
            sessionStorage.removeItem('cross_app_transition');
            
            // Fade out after a brief moment so the page is ready and feels seamless
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 600);
            return () => clearTimeout(timer);
        } else {
            setShouldRender(false);
        }
    }, []);

    if (!shouldRender) return null;

    // Icon Variants
    const iconVariants = {
        visible: { scale: 1, opacity: 1 },
        exit: { scale: 0, opacity: 0 }
    };

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center top-0 left-0 w-screen h-screen"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeOut" } }}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', transform: 'none', backgroundColor: '#0c0c0f' }}
                >
                    {/* Icon Container */}
                    <div className="mb-8 text-white text-6xl">
                        {type === 'login' && (
                            <motion.div variants={iconVariants} initial="visible" exit="exit">
                                <i className="fas fa-lock"></i>
                            </motion.div>
                        )}
                        {type === 'register' && (
                            <motion.div variants={iconVariants} initial="visible" exit="exit">
                                <i className="fas fa-user-lock"></i>
                            </motion.div>
                        )}
                        {type === 'apply' && (
                            <motion.div variants={iconVariants} initial="visible" exit="exit">
                                <i className="fas fa-paper-plane"></i>
                            </motion.div>
                        )}
                        {type === 'dashboard' && (
                            <motion.div variants={iconVariants} initial="visible" exit="exit">
                                <i className="fas fa-home"></i>
                            </motion.div>
                        )}
                        {type === 'unlock' && (
                            <motion.div variants={iconVariants} initial="visible" exit="exit">
                                <i className="fas fa-lock-open"></i>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default EntranceOverlay;
