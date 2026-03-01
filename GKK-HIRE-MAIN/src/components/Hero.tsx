import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import FloatingCard from './FloatingCard';
import type { MousePosition } from '../types';
import TransitionOverlay from './TransitionOverlay';

export default function Hero() {
    const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleMainPage = () => {
        setIsTransitioning(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ghost pt-20">
            {/* Background Text Layers */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                {/* Bottom Layer - Solid GKK */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute"
                >
                    <h2 className="text-[12rem] md:text-[18rem] lg:text-[24rem] font-black font-inter leading-none tracking-tighter text-black/10">
                        GKK
                    </h2>
                </motion.div>

                {/* Middle Layer - Ghost INTERNS */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    className="absolute"
                    style={{ top: '55%' }}
                >
                    <h2 className="text-[8rem] md:text-[12rem] lg:text-[16rem] font-black font-inter leading-none tracking-wider text-stroke">
                        INTERNS
                    </h2>
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
                <div className="w-[1px] h-12 bg-black/30"></div>
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
