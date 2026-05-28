import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import FloatingCard from './FloatingCard';
import type { MousePosition } from '../types';
import TransitionOverlay from './TransitionOverlay';

export default function Hero() {
    const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
    const [isTransitioning, setIsTransitioning] = useState(false);
    const rafRef = useRef<number | null>(null);
    const pendingMouseRef = useRef<MousePosition>({ x: 0, y: 0 });

    const handleMainPage = () => {
        setIsTransitioning(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            pendingMouseRef.current = { x: e.clientX, y: e.clientY };

            if (rafRef.current !== null) return;

            rafRef.current = window.requestAnimationFrame(() => {
                rafRef.current = null;
                const next = pendingMouseRef.current;

                // Ignore tiny changes to reduce rerenders under high mouse polling rates.
                setMousePosition((prev) => {
                    if (Math.abs(prev.x - next.x) < 3 && Math.abs(prev.y - next.y) < 3) {
                        return prev;
                    }
                    return next;
                });
            });
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ghost pt-20">
            {/* Hero Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute"
                >
                    <img
                        src="/gkk-intern-logo.png"
                        alt="GKK Interns"
                        className="w-[82vw] max-w-245 md:w-[70vw] lg:w-[62vw] h-auto opacity-95"
                        loading="eager"
                    />
                </motion.div>
            </div>

            {/* Floating Cards Layer */}
            <div className="absolute inset-0 z-10">
                {[0, 1, 2, 3].map((index) => (
                    <FloatingCard key={index} index={index} mousePosition={mousePosition} />
                ))}
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-black/50 z-20"
            >
                <span className="text-xs tracking-widest uppercase">Scroll</span>
                <div className="w-px h-12 bg-black/30"></div>
            </motion.div>

            {/* Main Page Button */}
            <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-30">
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    onClick={handleMainPage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-black text-white font-inter font-bold text-sm tracking-widest uppercase rounded-full shadow-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                    <i className="fas fa-arrow-right"></i>
                    VISIT DASHBOARD
                </motion.button>
            </div>

            <TransitionOverlay
                isVisible={isTransitioning}
                type="dashboard"
                onComplete={() => window.location.href = '/dashboard/'}
            />
        </section>
    );
}
