import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Workshop {
    id: string;
    title: string;
    description: string;
    hero_image_url: string;
    cta_link: string;
    cta_text: string;
    timer_duration: number;
    instructor_name?: string;
    session_date?: string;
    session_time?: string;
}

const WorkshopModal: React.FC = () => {
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [canClose, setCanClose] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchWorkshop = async () => {
            try {
                const { data, error } = await supabase
                    .from('workshops')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    setWorkshop(data);
                    setTimeLeft(data.timer_duration || 5);
                    // Show after a slight delay
                    setTimeout(() => setIsVisible(true), 2000);
                }
            } catch (err) {
                console.error('Error fetching workshop:', err);
            }
        };

        fetchWorkshop();
    }, []);

    useEffect(() => {
        if (isVisible && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanClose(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isVisible, timeLeft]);

    const handleClose = () => {
        if (!canClose) return;
        setIsVisible(false);
    };

    if (!workshop) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    perspective: '1000px'
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'var(--bg-primary)',
                            opacity: 0.9,
                            backdropFilter: 'blur(12px)'
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotateY: -10 }}
                        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotateY: -10 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 20, 
                            stiffness: 120,
                            duration: 0.6
                        }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: isMobile ? '100%' : '600px',
                            maxHeight: '90vh',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: isMobile ? '24px' : '32px',
                            overflow: 'auto',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Top: Visuals */}
                        <div style={{ 
                            position: 'relative', 
                            width: '100%', 
                            height: isMobile ? '220px' : '320px', 
                            flexShrink: 0,
                            overflow: 'hidden' 
                        }}>
                            {workshop.hero_image_url ? (
                                <img
                                    src={workshop.hero_image_url}
                                    alt={workshop.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1e1b4b, #312e81)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-sparkles" style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.1)' }} />
                                </div>
                            )}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to bottom, transparent, var(--bg-surface))'
                            }} />
                            
                            {/* LIVE Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '24px',
                                left: '24px',
                                background: '#ef4444',
                                color: '#fff',
                                padding: '6px 16px',
                                borderRadius: '99px',
                                fontSize: '12px',
                                fontWeight: 900,
                                letterSpacing: '0.1em',
                                boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                                LIVE WORKSHOP
                            </div>
                        </div>

                        {/* Bottom: Content */}
                        <div style={{ 
                            padding: isMobile ? '32px 24px' : '40px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            textAlign: 'center' 
                        }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 style={{
                                    fontSize: isMobile ? '24px' : '32px',
                                    fontWeight: 800,
                                    color: 'var(--text-primary)',
                                    margin: '0 0 8px 0',
                                    lineHeight: 1.2,
                                    fontFamily: "'Outfit', sans-serif"
                                }}>
                                    {workshop.title}
                                </h2>
                                
                                {workshop.instructor_name && (
                                    <div style={{ 
                                        color: '#6366f1', 
                                        fontSize: isMobile ? '11px' : '13px', 
                                        fontWeight: 700, 
                                        letterSpacing: '0.15em', 
                                        marginBottom: isMobile ? '16px' : '20px',
                                        textTransform: 'uppercase'
                                    }}>
                                        HOSTED BY {workshop.instructor_name}
                                    </div>
                                )}

                                <p style={{
                                    fontSize: isMobile ? '14px' : '15px',
                                    color: 'var(--text-muted)',
                                    lineHeight: '1.6',
                                    margin: `0 auto ${ (workshop.session_date || workshop.session_time) ? '24px' : '32px'} auto`,
                                    maxWidth: '480px',
                                    opacity: 0.9
                                }}>
                                    {workshop.description}
                                </p>

                                {(workshop.session_date || workshop.session_time) && (
                                    <div style={{ 
                                        display: 'flex', 
                                        gap: '24px', 
                                        marginBottom: '32px',
                                        padding: '16px 24px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        width: 'fit-content',
                                        margin: '0 auto 32px auto'
                                    }}>
                                        {workshop.session_date && (
                                            <div>
                                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>Date</div>
                                                <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{workshop.session_date}</div>
                                            </div>
                                        )}
                                        {workshop.session_date && workshop.session_time && (
                                            <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                                        )}
                                        {workshop.session_time && (
                                            <div>
                                                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>Time</div>
                                                <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>{workshop.session_time}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                    {workshop.cta_link && (
                                        <a
                                            href={workshop.cta_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                backgroundColor: '#6366f1',
                                                color: '#fff',
                                                padding: isMobile ? '14px 32px' : '16px 48px',
                                                borderRadius: '16px',
                                                fontSize: isMobile ? '14px' : '15px',
                                                fontWeight: 800,
                                                textDecoration: 'none',
                                                transition: 'all 0.3s',
                                                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.5)',
                                                display: 'inline-block',
                                                width: isMobile ? '100%' : 'auto'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(99, 102, 241, 0.6)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(99, 102, 241, 0.5)';
                                            }}
                                        >
                                            {workshop.cta_text || 'Secure Your Slot'}
                                        </a>
                                    )}

                                    <button
                                        onClick={handleClose}
                                        disabled={!canClose}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: canClose ? '#64748b' : '#334155',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: canClose ? 'pointer' : 'not-allowed',
                                            textDecoration: canClose ? 'underline' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {canClose ? 'Dismiss' : (
                                            <>
                                                <i className="fas fa-spinner fa-spin" />
                                                WAITING {timeLeft}S
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    <style>{`
                        @keyframes pulse {
                            0% { transform: scale(1); opacity: 1; }
                            50% { transform: scale(1.5); opacity: 0.5; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WorkshopModal;
