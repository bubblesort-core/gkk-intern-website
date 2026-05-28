import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface Banner {
    id: string;
    title: string;
    description: string;
    image_url: string;
    key_points: string[];
}

export default function BannerDisplay() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

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

    if (banners.length === 0) return null;

    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#020617] border-b border-白/10 z-50">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.6 }}
                    className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between p-6 md:p-12 gap-8"
                >
                    {/* Content Side */}
                    <div className="flex-1 flex flex-col items-start gap-4 z-10 w-full text-left order-2 md:order-1">
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 leading-tight"
                        >
                            {banners[currentIndex].title}
                        </motion.h2>
                        
                        {banners[currentIndex].description && (
                            <motion.p 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-gray-300 text-lg md:text-xl font-light max-w-2xl"
                            >
                                {banners[currentIndex].description}
                            </motion.p>
                        )}

                        {banners[currentIndex].key_points && banners[currentIndex].key_points.length > 0 && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-wrap gap-2 md:gap-3 mt-4"
                            >
                                {banners[currentIndex].key_points.map((kp, idx) => (
                                    <span 
                                        key={idx} 
                                        className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm md:text-base backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    >
                                        <div className="inline-block size-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                                        {kp}
                                    </span>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Image Side */}
                    {banners[currentIndex].image_url && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="flex-1 w-full flex justify-center order-1 md:order-2"
                        >
                            <div className="relative w-full max-w-md aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent z-10 opacity-60" />
                                <img 
                                    src={banners[currentIndex].image_url} 
                                    alt={banners[currentIndex].title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Carousel Navigation Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`transition-all duration-300 rounded-full ${
                                i === currentIndex ? 'bg-emerald-400 w-8 h-2' : 'bg-white/20 hover:bg-white/40 w-2 h-2'
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
