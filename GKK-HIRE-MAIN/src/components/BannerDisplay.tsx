import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Banner {
    id: string;
    title: string;
    description: string;
    image_url: string;
    key_points: string[];
    position?: string;
    bg_color?: string;
    text_color?: string;
    button_text?: string;
    button_link?: string;
}

export default function BannerDisplay() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const { data, error } = await supabase
                    .from('banners')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    setBanners(data);
                }
            } catch (err) {
                console.error("Failed to fetch banners");
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % banners.length);
            }, 6000);
            return () => clearInterval(interval);
        }
    }, [banners]);

    if (banners.length === 0 || !isVisible) return null;

    const banner = banners[currentIndex];
    const position = banner.position || 'top';
    const bgColor = banner.bg_color || '#0f172a';
    const textColor = banner.text_color || '#34d399';

    // Container classes based on position
    let wrapperClasses = "z-[100] transition-all duration-500 ";
    let innerClasses = "relative max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between p-6 md:p-12 gap-8 ";

    if (position === 'bottom') {
        wrapperClasses += "fixed bottom-0 left-0 right-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]";
    } else if (position === 'side') {
        wrapperClasses += "fixed bottom-6 right-6 md:right-10 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full";
        innerClasses = "relative w-full flex flex-col items-center p-6 gap-6 "; // Stack vertically for side popup
    } else if (position === 'popup') {
        wrapperClasses += "fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4";
        innerClasses += "rounded-2xl shadow-2xl max-w-4xl w-full ";
    } else if (position === 'fullscreen') {
        wrapperClasses += "fixed inset-0 flex items-center justify-center";
        innerClasses += "w-full h-full p-8 md:p-16 ";
    } else {
        // top/default
        wrapperClasses += "relative border-b border-white/10 w-full";
    }

    // Dynamic gradient based on base color
    const containerStyle = (position === 'popup' || position === 'side' || position === 'fullscreen' || position === 'top' || position === 'bottom') 
        ? { backgroundColor: bgColor } : {};

    return (
        <section className={wrapperClasses} style={position !== 'popup' ? containerStyle : {}}>
            {/* Close Button */}
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 z-[120] text-white/60 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm transition-all"
                aria-label="Close Banner"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* For popup, the wrapper is the backdrop, inner is the modal */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.98, y: position === 'bottom' ? 50 : 0 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: position === 'bottom' ? 50 : 0 }}
                    transition={{ duration: 0.6 }}
                    className={innerClasses}
                    style={position === 'popup' ? containerStyle : {}}
                >
                    {/* Content Side */}
                    <div className="flex-1 flex flex-col items-start gap-4 z-10 w-full text-left order-2 md:order-1">
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-5xl font-bold leading-tight drop-shadow-md"
                            style={{ color: textColor }}
                        >
                            {banner.title}
                        </motion.h2>
                        
                        {banner.description && (
                            <motion.p 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-gray-200 text-lg md:text-xl font-light max-w-2xl drop-shadow"
                            >
                                {banner.description}
                            </motion.p>
                        )}

                        {banner.key_points && banner.key_points.length > 0 && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap gap-2 md:gap-3 mt-4"
                            >
                                {banner.key_points.map((kp, idx) => (
                                    <span 
                                        key={idx} 
                                        className="px-3 py-1.5 rounded-full border border-white/20 text-white text-sm md:text-base backdrop-blur-md shadow-lg"
                                        style={{ backgroundColor: `${textColor}20` }}
                                    >
                                        <div className="inline-block size-1.5 rounded-full mr-2 animate-pulse" style={{ backgroundColor: textColor }} />
                                        {kp}
                                    </span>
                                ))}
                            </motion.div>
                        )}

                        {banner.button_text && (
                            <motion.a
                                href={banner.button_link || '#'}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-6 px-8 py-3 rounded-full font-bold text-white transition-transform hover:scale-105 shadow-xl hover:shadow-2xl"
                                style={{ backgroundColor: textColor }}
                            >
                                {banner.button_text}
                            </motion.a>
                        )}
                    </div>

                    {/* Image Side */}
                    {banner.image_url && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className={`w-full flex justify-center order-1 md:order-2 ${position === 'side' ? 'flex-none' : 'flex-1'}`}
                        >
                            <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 group flex items-center justify-center bg-black/10">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60 pointer-events-none" />
                                <img 
                                    src={banner.image_url} 
                                    alt={banner.title}
                                    className="w-full h-auto max-h-[60vh] object-contain transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Carousel Navigation Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[110]">
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`transition-all duration-300 rounded-full ${
                                i === currentIndex ? 'w-8 h-2' : 'bg-white/40 hover:bg-white/60 w-2 h-2'
                            }`}
                            style={i === currentIndex ? { backgroundColor: textColor } : {}}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
