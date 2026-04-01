import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion';
import anime from 'animejs';
import HeroCanvas from './HeroCanvas';



// FAQ Content
const faqs = [
    { q: "Do I need prior experience?", a: "No. Basic HTML, CSS, and a little JavaScript is enough. We teach you the rest through real work on real projects." },
    { q: "Is this paid or free?", a: "Free to apply. There is a minimal charge inside the profile to cover code reviews and server costs. You earn a verified certificate and letter of recommendation on completion." },
    { q: "How long is the program?", a: "Most interns complete it in 6–10 weeks depending on project complexity and their availability." },
    { q: "Will I get a real project or a practice one?", a: "Real. Every task comes from GKK's actual product pipeline. Your code gets reviewed and deployed." },
    { q: "What do I get at the end?", a: "A verified certificate, a letter of recommendation, and live project links you can show in interviews — not just a PDF." },
    { q: "Who can apply?", a: "Any college student or dropout who is serious about building. No degree requirement, minimal profile charge, no gatekeeping." }
];

// FAQ Item Component
const FAQItem = ({ faq, isOpen, onClick }) => {
    return (
        <div className="faq-row-container" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
            <div 
                onClick={onClick}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px 0' }}
                className="faq-header"
            >
                <div style={{ fontSize: '13px', fontWeight: 500, color: isOpen ? '#22d87a' : '#f0efe9', transition: 'color 0.2s' }}>
                    {faq.q}
                </div>
                <div style={{ 
                    color: '#22d87a', 
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.22s ease-out',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '20px', height: '20px'
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ fontSize: '13px', color: 'rgba(240,239,233,0.45)', lineHeight: 1.75, paddingTop: '10px' }}>
                            {faq.a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Icons using standard React icons / FontAwesome classes
const IconUserGroup = () => <i className="fas fa-users" style={{ fontSize: '1.25rem', color: '#f0efe9' }} />;
const IconCodeBrackets = () => <i className="fas fa-code" style={{ fontSize: '1.25rem', color: '#f0efe9' }} />;
const IconCheckCircle = () => <i className="fas fa-check-circle" style={{ fontSize: '1.25rem', color: '#f0efe9' }} />;
const IconArrowRight = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="svg-connector">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

// Framer motion standard view config
const vConfig = { once: true, amount: 0.15 };

const springTransition = { duration: 0.55, ease: "easeOut" };

const parentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { ...springTransition, staggerChildren: 0.12 }
    }
};

const childVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: springTransition }
};

// Section 1 - Top Bar
const TopBar = () => {
    const { scrollY } = useScroll();
    const prefersReducedMotion = useReducedMotion();
    
    // Smooth transitions for background and blur
    const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.8]);
    const blurObj = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(12px)"]);

    const background = prefersReducedMotion ? 'rgba(12, 12, 15, 0.95)' : useTransform(bgOpacity, v => `rgba(12, 12, 15, ${v})`);
    const backdropFilter = prefersReducedMotion ? 'blur(12px)' : blurObj;

    return (
        <motion.div
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                background,
                backdropFilter,
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <div style={{ color: '#f0efe9', fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                GKK Interns
            </div>
            <div style={{ color: '#f0efe9', fontSize: '0.9rem', display: 'flex', gap: '1.5rem', fontWeight: 500 }}>
                <a href="/dashboard/user/login" style={{ cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none', color: 'inherit' }} onMouseEnter={(e)=>e.target.style.color='#22d87a'} onMouseLeave={(e)=>e.target.style.color='#f0efe9'}>Sign In</a>
                <a href="/dashboard/apply/" className="nav-btn-primary" onClick={(e) => {
                    if (prefersReducedMotion) return;
                    const el = e.currentTarget;
                    anime.remove(el);
                    anime({ targets: el, scale: [1, 1.03, 1], duration: 300, easing: 'easeOutExpo' });
                }}>Apply Now</a>
            </div>
        </motion.div>
    );
};

// Section 3 - Stats Section
const StatsSection = () => {
    const ref = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (!ref.current) return;
        const columns = ref.current.querySelectorAll('.stat-col');
        const numbers = ref.current.querySelectorAll('.stat-num');

        if (prefersReducedMotion) {
            columns.forEach(c => c.style.opacity = '1');
            numbers.forEach(n => n.innerText = n.dataset.val + (n.dataset.suffix || ''));
            return;
        }

        // Pre-animation state
        columns.forEach(c => c.style.opacity = '0');

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.unobserve(ref.current);

                // Animate columns fade & translateY
                anime({
                    targets: columns,
                    translateY: [20, 0],
                    opacity: [0, 1],
                    duration: 800,
                    easing: 'easeOutExpo',
                    delay: anime.stagger(100)
                });

                // Animate numbers counting up
                numbers.forEach(n => {
                    const finalVal = parseFloat(n.dataset.val);
                    const suffix = n.dataset.suffix || '';
                    const obj = { val: 0 };
                    anime({
                        targets: obj,
                        val: [0, finalVal],
                        round: 1,
                        duration: 1800,
                        easing: 'easeOutExpo',
                        update: () => {
                            n.innerText = obj.val + suffix;
                        }
                    });
                });
            }
        }, { threshold: 0.15 });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [prefersReducedMotion]);

    const statData = [
        { val: 50, suffix: '+', label: 'Projects Shipped' },
        { val: 30, suffix: '+', label: 'Interns Trained' },
        { val: 10, suffix: '+', label: 'Tech Stacks' },
        { val: 92, suffix: '%', label: 'Satisfaction Rate' }
    ];

    return (
        <div ref={ref} className="stats-bar">
            {statData.map((s, i) => (
                <div key={i} className="stat-col" style={{ padding: '1rem', flex: 1, minWidth: '150px' }}>
                    <div className="stat-num" data-val={s.val} data-suffix={s.suffix} style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f0efe9', marginBottom: '0.25rem', fontFamily: 'monospace' }}>
                        0{s.suffix}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(240,239,233,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {s.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Section 4 - Program Section
const ProgramSection = () => {
    const ref = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (!ref.current) return;
        const headings = ref.current.querySelectorAll('.prog-head');
        const cards = ref.current.querySelectorAll('.phase-card-anim');
        const lines = ref.current.querySelectorAll('.phase-card-line-anim');
        const outcome = ref.current.querySelector('.outcome-bar-anim');

        if (prefersReducedMotion) {
            headings.forEach(h => h.style.opacity = '1');
            cards.forEach(c => c.style.opacity = '1');
            lines.forEach(l => { l.style.transform = 'scaleX(1)'; l.style.opacity = '1'; });
            if (outcome) outcome.style.opacity = '1';
            return;
        }

        // Pre-animation state
        headings.forEach(h => h.style.opacity = '0');
        cards.forEach(c => c.style.opacity = '0');
        lines.forEach(l => { l.style.transform = 'scaleX(0)'; l.style.opacity = '0'; });
        if (outcome) outcome.style.opacity = '0';

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.unobserve(ref.current);

                // Heading Animation
                anime({
                    targets: headings,
                    translateY: [16, 0],
                    opacity: [0, 1],
                    duration: 600,
                    easing: 'easeOutExpo',
                    delay: anime.stagger(120)
                });

                // Phase Cards
                anime({
                    targets: cards,
                    translateY: [40, 0],
                    opacity: [0, 1],
                    duration: 700,
                    easing: 'easeOutExpo',
                    delay: anime.stagger(150, { start: 200 })
                });

                // Top Border ScaleX
                anime({
                    targets: lines,
                    scaleX: [0, 1],
                    opacity: [0, 1],
                    duration: 500,
                    easing: 'easeOutQuart',
                    delay: anime.stagger(150, { start: 400 }) // 200 + 200
                });

                // Outcome Bar
                if (outcome) {
                    anime({
                        targets: outcome,
                        translateY: [20, 0],
                        opacity: [0, 1],
                        duration: 600,
                        easing: 'easeOutExpo',
                        delay: 700 // Cards start at 200 + 500 delay
                    });
                }
            }
        }, { threshold: 0.15 });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [prefersReducedMotion]);

    return (
        <div id="program" ref={ref} style={{ padding: '4rem 0' }}>
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                <span className="prog-head" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#22d87a', display: 'block', marginBottom: '1rem' }}>The Program</span>
                <h2 className="prog-head" style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>One path. Three real phases.</h2>
                <p className="prog-head" style={{ fontSize: '1rem', color: 'rgba(240,239,233,0.7)', lineHeight: 1.6 }}>No fake tutorials. No toy projects. You learn by doing — with AI as your co-pilot.</p>
            </div>

            <div className="phases-row">
                {/* Phase 01 */}
                <div className="phase-card phase-card-anim" onMouseEnter={handlePhaseCardEnter} onMouseLeave={handlePhaseCardLeave}>
                    <div className="phase-card-line phase-card-line-anim"></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>01</span>
                        <span className="pill" style={{ background: 'rgba(34,216,122,0.15)', color: '#22d87a' }}>Live Sessions</span>
                    </div>
                    <div style={{ marginBottom: '1rem' }}><IconUserGroup /></div>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>Foundation & Sync</h3>
                    <ul className="bullet-list">
                        <li><span className="bullet-prefix">›</span>Weekly live mentor calls</li>
                        <li><span className="bullet-prefix">›</span>Tech stack orientation</li>
                        <li><span className="bullet-prefix">›</span>AI tools and workflow setup</li>
                    </ul>
                </div>

                <IconArrowRight />

                {/* Phase 02 */}
                <div className="phase-card phase-card-anim" onMouseEnter={handlePhaseCardEnter} onMouseLeave={handlePhaseCardLeave}>
                    <div className="phase-card-line phase-card-line-anim"></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>02</span>
                        <span className="pill" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>Build with AI</span>
                    </div>
                    <div style={{ marginBottom: '1rem' }}><IconCodeBrackets /></div>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>Development</h3>
                    <ul className="bullet-list">
                        <li><span className="bullet-prefix">›</span>AI-assisted development</li>
                        <li><span className="bullet-prefix">›</span>PR reviews and feedback</li>
                        <li><span className="bullet-prefix">›</span>Daily async collaboration</li>
                    </ul>
                </div>

                <IconArrowRight />

                {/* Phase 03 */}
                <div className="phase-card phase-card-anim" onMouseEnter={handlePhaseCardEnter} onMouseLeave={handlePhaseCardLeave}>
                    <div className="phase-card-line phase-card-line-anim"></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>03</span>
                        <span className="pill" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>Real Projects</span>
                    </div>
                    <div style={{ marginBottom: '1rem' }}><IconCheckCircle /></div>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>Assigned by GKK</h3>
                    <ul className="bullet-list">
                        <li><span className="bullet-prefix">›</span>GKK-assigned project briefs</li>
                        <li><span className="bullet-prefix">›</span>Production deployment</li>
                        <li><span className="bullet-prefix">›</span>Verified certificate and LOR</li>
                    </ul>
                </div>
            </div>

            {/* Outcome Bar */}
            <div className="outcome-bar outcome-bar-anim" onMouseEnter={handleOutcomeEnter} onMouseLeave={handleOutcomeLeave}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>You leave with a portfolio that proves you can ship</div>
                    <div style={{ color: 'rgba(240,239,233,0.6)', fontSize: '0.85rem' }}>Not just theoretical knowledge.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="pill" style={{ background: '#1c1c24', border: '0.5px solid rgba(255,255,255,0.1)', color: '#f0efe9' }}>Certificate</span>
                    <span className="pill" style={{ background: '#1c1c24', border: '0.5px solid rgba(255,255,255,0.1)', color: '#f0efe9' }}>LOR</span>
                    <span className="pill" style={{ background: '#1c1c24', border: '0.5px solid rgba(255,255,255,0.1)', color: '#f0efe9' }}>Live Projects</span>
                </div>
            </div>
        </div>
    );
};

// Section 4.5 - FAQ Section
const FaqSection = () => {
    const [openFaq, setOpenFaq] = useState(0);
    const ref = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (!ref.current) return;
        const headings = ref.current.querySelectorAll('.faq-head');
        const items = ref.current.querySelectorAll('.faq-item-anim');

        if (prefersReducedMotion) {
            headings.forEach(h => h.style.opacity = '1');
            items.forEach(i => i.style.opacity = '1');
            return;
        }

        headings.forEach(h => h.style.opacity = '0');
        items.forEach(i => i.style.opacity = '0');

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.unobserve(ref.current);

                anime({
                    targets: headings,
                    translateY: [16, 0],
                    opacity: [0, 1],
                    duration: 600,
                    easing: 'easeOutExpo',
                    delay: anime.stagger(120)
                });

                anime({
                    targets: items,
                    translateX: [-16, 0],
                    opacity: [0, 1],
                    duration: 500,
                    easing: 'easeOutExpo',
                    delay: anime.stagger(80, { start: 200 })
                });
            }
        }, { threshold: 0.15 });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [prefersReducedMotion]);

    return (
        <div ref={ref} className="faq-section">
            <div style={{ flex: '1 1 300px' }}>
                <div className="faq-head" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', color: '#22d87a', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>FAQ</span>
                    <div style={{ width: '32px', height: '1px', backgroundColor: '#22d87a' }}></div>
                </div>
                <h2 className="faq-head" style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>Common questions</h2>
                <p className="faq-head" style={{ fontSize: '13px', color: 'rgba(240,239,233,0.42)', margin: '0 0 24px 0', lineHeight: 1.6 }}>Everything a student usually asks before applying.</p>
                
                <div className="faq-head" style={{ fontSize: '13px', color: 'rgba(240,239,233,0.42)' }}>
                    Didn't find your answer? <a href="/community-chat/" style={{ color: '#22d87a', textDecoration: 'none', marginLeft: '4px' }}>Reach out &rarr;</a>
                </div>
            </div>
            
            <div style={{ flex: '2 1 400px' }}>
                {faqs.map((faq, idx) => (
                    <div key={idx} className="faq-item-anim">
                        <FAQItem 
                            faq={faq} 
                            isOpen={openFaq === idx} 
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Section 4.6 - CTA Band
const CtaBandSection = () => {
    const ref = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (!ref.current) return;
        const band = ref.current;
        const words = band.querySelectorAll('.cta-word');
        const btn = band.querySelector('.btn-filled-cta');

        if (prefersReducedMotion) {
            band.style.opacity = '1';
            band.style.transform = 'scale(1)';
            words.forEach(w => w.style.opacity = '1');
            return;
        }

        band.style.opacity = '0';
        words.forEach(w => w.style.opacity = '0');

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.unobserve(ref.current);

                anime({
                    targets: band,
                    scale: [0.96, 1],
                    opacity: [0, 1],
                    duration: 700,
                    easing: 'easeOutExpo'
                });

                anime({
                    targets: words,
                    translateY: [12, 0],
                    opacity: [0, 1],
                    duration: 600,
                    easing: 'easeOutExpo',
                    delay: anime.stagger(60, { start: 200 })
                });

                if (btn) {
                    anime({
                        targets: btn,
                        scale: [1, 1.04, 1],
                        duration: 400,
                        easing: 'easeOutExpo',
                        delay: 600
                    });
                }
            }
        }, { threshold: 0.15 });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [prefersReducedMotion]);

    const splitText = (text) => {
        return text.split(' ').map((word, i) => (
            <span key={i} className="cta-word" style={{ display: 'inline-block', marginRight: '8px' }}>
                {word}
            </span>
        ));
    };

    return (
        <div ref={ref} className="cta-band">
            <span style={{ fontSize: '10px', color: '#22d87a', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '16px' }}>Ready to ship real work?</span>
            <h2 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 16px 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {splitText('Your career starts with')} <span className="cta-word outline-text-alt" style={{ display: 'inline-block', marginRight: '8px' }}>one</span> {splitText('application.')}
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(240,239,233,0.42)', marginBottom: '28px' }}>No fees. No prerequisites. Just show us you're serious.</p>
            
            <a href="/dashboard/apply/" className="btn-filled-cta" onClick={(e) => {
                const el = e.currentTarget;
                anime.remove(el);
                anime({ targets: el, scale: [1, 1.03, 1], duration: 300, easing: 'easeOutExpo' });
            }}>
                Apply for Internship &rarr;
            </a>
            
            <div style={{ fontSize: '11px', color: 'rgba(240,239,233,0.25)' }}>
                Applications reviewed within 48 hours &middot; MSME Registered &middot; Built in India
            </div>
        </div>
    );
};

// Section 5 - Trust Strip
const TrustStripSection = () => {
    const ref = useRef(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (!ref.current) return;
        const items = ref.current.querySelectorAll('.trust-anim-item');

        if (prefersReducedMotion) {
            items.forEach(i => i.style.opacity = '1');
            return;
        }

        items.forEach(i => i.style.opacity = '0');

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.unobserve(ref.current);

                anime({
                    targets: items,
                    translateY: [8, 0],
                    opacity: [0, 1],
                    duration: 400,
                    easing: 'easeOutExpo',
                    delay: anime.stagger(70)
                });
            }
        }, { threshold: 0.15 });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [prefersReducedMotion]);

    const IconWrapper = ({ children }) => (
        <span style={{ fontSize: '14px', marginRight: '6px', color: '#22d87a', display: 'flex', alignItems: 'center' }}>
            {children}
        </span>
    );

    return (
        <div ref={ref} style={{ padding: '2rem 0 4rem' }}>
            <div className="trust-strip-inner" style={{ padding: '1.25rem 2.5rem' }}>
                <div className="trust-anim-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    <div className="pulse-dot"></div> GKK Interns
                </div>
                <div className="trust-anim-item dot-sep"></div>
                
                <div className="trust-anim-item trust-item">
                    <IconWrapper><i className="fas fa-university"></i></IconWrapper>
                    <strong>MSME</strong> Govt. Verified
                </div>
                <div className="trust-anim-item dot-sep"></div>
                
                <div className="trust-anim-item trust-item">
                    <IconWrapper><i className="fas fa-lock"></i></IconWrapper>
                    <strong>SSL</strong> 256-Bit
                </div>
                <div className="trust-anim-item dot-sep"></div>
                
                <div className="trust-anim-item trust-item">
                    <IconWrapper><i className="fas fa-shield-alt"></i></IconWrapper>
                    <strong>DMCA</strong> Protected
                </div>
                <div className="trust-anim-item dot-sep"></div>
                
                <div className="trust-anim-item trust-item">
                    <IconWrapper><i className="fas fa-earth-asia"></i></IconWrapper>
                    Built in <strong>India</strong>
                </div>
                <div className="trust-anim-item dot-sep"></div>
                
                <div className="trust-anim-item trust-item">
                    <IconWrapper><i className="fas fa-layer-group"></i></IconWrapper>
                    <strong>Bubblesort Group</strong>
                </div>
            </div>
        </div>
    );
};

const shouldSkipAnim = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const handleBtnClick = (e) => {
    if (shouldSkipAnim()) return;
    const el = e.currentTarget;
    anime.remove(el);
    anime({ targets: el, scale: [1, 1.03, 1], duration: 300, easing: 'easeOutExpo' });
};

const handlePhaseCardEnter = (e) => {
    if (shouldSkipAnim()) return;
    const bullets = e.currentTarget.querySelectorAll('.bullet-prefix');
    anime.remove(bullets);
    anime({
        targets: bullets,
        translateX: [0, 3],
        duration: 300,
        easing: 'easeOutExpo',
        delay: anime.stagger(40)
    });
};

const handlePhaseCardLeave = (e) => {
    if (shouldSkipAnim()) return;
    const bullets = e.currentTarget.querySelectorAll('.bullet-prefix');
    anime.remove(bullets);
    anime({
        targets: bullets,
        translateX: 0,
        duration: 200,
        easing: 'easeOutExpo'
    });
};

const handleOutcomeEnter = (e) => {
    if (shouldSkipAnim()) return;
    const pills = e.currentTarget.querySelectorAll('.pill');
    anime.remove(pills);
    anime({
        targets: pills,
        translateY: -1,
        borderColor: 'rgba(255,255,255,0.28)',
        duration: 300,
        easing: 'easeOutExpo',
        delay: anime.stagger(40)
    });
};

const handleOutcomeLeave = (e) => {
    if (shouldSkipAnim()) return;
    const pills = e.currentTarget.querySelectorAll('.pill');
    anime.remove(pills);
    anime({
        targets: pills,
        translateY: 0,
        borderColor: 'rgba(255,255,255,0.1)',
        duration: 250,
        easing: 'easeOutExpo'
    });
};

export default function HeroSection() {
    const prefersReducedMotion = useReducedMotion();
    const { scrollY } = useScroll();
    const scrollOpacity = useTransform(scrollY, [0, 80], [1, 0]);
    
    const resolveVariants = (variants) => prefersReducedMotion ? { hidden: { opacity: 1, y: 0, x: 0 }, visible: { opacity: 1, y: 0, x: 0 } } : variants;


    // Custom CSS block
    const globalStyles = `
        :root {
            --d-bg: #0c0c0f;
            --d-green: #22d87a;
            --d-text: #f0efe9;
        }
        .dash-landing-root {
            font-family: 'Inter', sans-serif;
            background-color: var(--d-bg);
            color: var(--d-text);
            min-height: 100vh;
            margin: 0;
            padding: 0;
        }
        .dash-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 4rem 2rem;
        }
        .outline-text {
            -webkit-text-stroke: 0.5px rgba(240,239,233,0.22);
            color: transparent;
        }
        .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: var(--d-green);
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 0 0 rgba(34, 216, 122, 0.7);
            animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 216, 122, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 216, 122, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 216, 122, 0); }
        }
        
        .btn-filled, .btn-filled-cta, .nav-btn-primary {
            background-color: var(--d-green);
            color: #0c0c0f;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, background-color 0.2s ease-out, opacity 0.2s ease-out;
            cursor: pointer;
        }
        .btn-filled-cta {
            font-size: 12px;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            padding: 14px 36px;
            margin-bottom: 24px;
        }
        .nav-btn-primary {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
            border-radius: 4px;
        }
        .btn-filled:hover, .btn-filled-cta:hover, .nav-btn-primary:hover { 
            transform: translateY(-1px); 
            box-shadow: 0 4px 20px rgba(34,216,122,0.25); 
        }
        .btn-filled:active, .btn-filled-cta:active, .nav-btn-primary:active {
            transform: translateY(0px) scale(0.97);
            transition: transform 0.1s;
        }
        
        .btn-ghost {
            background-color: transparent;
            color: var(--d-text);
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.15);
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            transition: border-color 0.2s ease-out, color 0.2s ease-out, transform 0.2s ease-out;
        }
        .btn-ghost:hover { 
            border-color: rgba(240,239,233,0.4);
            color: rgba(240,239,233,0.85);
            transform: translateY(-1px);
        }
        .btn-ghost:active {
            transform: translateY(0) scale(0.97);
            transition: transform 0.1s;
        }

        .action-card {
            background-color: #17171c;
            border: 0.5px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 1.5rem;
            transition: border-color 0.25s ease-out, transform 0.25s ease-out, background-color 0.25s ease-out;
            cursor: pointer;
            text-decoration: none;
            display: block;
            margin-bottom: 1rem;
            text-align: left;
        }
        .action-card:hover { 
            border-color: rgba(34,216,122,0.3); 
            transform: translateY(-2px);
            background-color: #1c1c22;
        }
        .action-card:active {
            transform: translateY(0) scale(0.98);
            transition: transform 0.1s;
        }
        
        .card-icon-box {
            transition: background-color 0.25s ease-out;
        }
        .action-card:hover .card-icon-box {
            background-color: rgba(34,216,122,0.18) !important;
        }
        
        .phase-card {
            background-color: #13131a;
            border: 0.5px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 2rem 1.5rem;
            position: relative;
            flex: 1;
            text-align: left;
            min-width: 250px;
            transition: border-color 0.25s ease-out, background-color 0.25s ease-out, transform 0.25s ease-out;
        }
        .phase-card:hover {
            border-color: rgba(255,255,255,0.15);
            background-color: #17171e;
            transform: translateY(-3px);
        }
        .phase-card-line {
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            height: 2px;
            background-color: transparent;
            transform-origin: left;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }
        .phase-card-line::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: var(--d-green);
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.35s ease-out;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }
        .phase-card:hover .phase-card-line::before {
            transform: scaleX(1);
        }
        
        .pill {
            padding: 4px 12px;
            border-radius: 99px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: opacity 0.2s ease-out, transform 0.3s ease-out, border-color 0.3s ease-out;
            opacity: 0.8;
            display: inline-block;
        }
        .phase-card:hover .pill {
            opacity: 1;
        }
        
        .stats-bar {
            display: flex;
            flex-wrap: wrap;
            border: 0.5px solid rgba(255,255,255,0.07);
            border-radius: 12px;
            margin: 4rem 0;
            background: rgba(255,255,255,0.02);
        }
        .stats-bar > div:not(:last-child) { border-right: 0.5px solid rgba(255,255,255,0.07); }
        @media (max-width: 768px) {
            .stats-bar > div:not(:last-child) { border-right: none; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
        }

        .phases-row {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            align-items: stretch;
            margin-top: 3rem;
        }
        @media (min-width: 900px) {
            .phases-row { flex-direction: row; align-items: center; }
        }

        .outcome-bar {
            background: linear-gradient(90deg, rgba(34,216,122,0.06), rgba(34,216,122,0.02));
            border: 0.5px solid rgba(34,216,122,0.18);
            border-radius: 12px;
            padding: 1.5rem 2rem;
            margin-top: 2rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            transition: border-color 0.25s ease-out, background 0.25s ease-out;
        }
        .outcome-bar:hover {
            border-color: rgba(34,216,122,0.3);
            background: linear-gradient(90deg, rgba(34,216,122,0.08), rgba(34,216,122,0.04));
        }

        .bullet-list { margin: 1rem 0 0; padding: 0; list-style: none; }
        .bullet-list li {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.85rem;
            color: rgba(240,239,233,0.7);
        }
        .bullet-prefix {
            color: var(--d-green);
            font-weight: bold;
            font-size: 1.1rem;
            line-height: 1;
            display: inline-block;
            transform-origin: center;
        }

        .trust-strip-inner {
            border-top: 0.5px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.02);
            padding: 1.25rem 2rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 1.5rem;
        }
        .trust-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(240,239,233,0.6);
            opacity: 0.7;
            transition: opacity 0.2s ease-out;
            cursor: default;
        }
        .trust-item:hover { opacity: 1; }
        .trust-item strong { color: var(--d-text); }
        .dot-sep { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.15); }

        .faq-section {
            display: flex;
            flex-wrap: wrap;
            gap: 4rem;
            padding: 56px 36px;
            border-bottom: 0.5px solid rgba(255,255,255,0.07);
        }
        @media (max-width: 768px) {
            .faq-section { padding: 40px 20px; gap: 2rem; }
        }
        
        .faq-row-container {
            padding: 16px 0;
            transition: background 0.2s ease-out, padding-left 0.2s ease-out;
            border-radius: 6px;
            margin-left: -4px;
        }
        .faq-row-container:hover {
            background: rgba(255,255,255,0.025);
            padding-left: 12px;
        }
        .faq-header {
            padding: 0 12px;
        }
        
        .cta-band {
            background: #0e0e12;
            background-image: radial-gradient(ellipse at center, rgba(34,216,122,0.07) 0%, transparent 60%);
            border-top: 0.5px solid rgba(255,255,255,0.07);
            border-bottom: 0.5px solid rgba(255,255,255,0.07);
            padding: 80px 36px;
            text-align: center;
        }
        @media (max-width: 768px) {
            .cta-band { padding: 40px 20px; }
        }
        
        .outline-text-alt {
            -webkit-text-stroke: 0.5px rgba(240,239,233,0.25);
            color: transparent;
        }

        @keyframes sbeam {
            0% { transform: scaleY(0); transform-origin: top; }
            50% { transform: scaleY(1); transform-origin: top; }
            50.1% { transform: scaleY(1); transform-origin: bottom; }
            100% { transform: scaleY(0); transform-origin: bottom; }
        }
    `;

    return (
        <div className="dash-landing-root">
            <style>{globalStyles}</style>

            <TopBar />

            {/* SECTION 2 - Hero Block (Full Width) */}
            <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
                <HeroCanvas />

                <motion.div 
                    style={{ position: 'absolute', bottom: '30px', left: '50%', x: '-50%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, pointerEvents: 'none', opacity: scrollOpacity }}
                >
                    <span style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,239,233,0.22)' }}>Scroll</span>
                    <div style={{ width: '1px', height: '40px', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(34,216,122,0.35)', animation: 'sbeam 1.6s infinite' }}></div>
                    </div>
                </motion.div>

                <div className="dash-content" style={{ paddingTop: 0, paddingBottom: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={vConfig}
                        variants={resolveVariants({
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
                        })}
                        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem', padding: '6rem 0', width: '100%' }}
                    >
                    {/* Left Column */}
                    <div style={{ flex: '1 1 500px' }}>
                        <motion.div variants={resolveVariants(childVariants)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '20px', height: '2px', backgroundColor: '#22d87a' }}></div>
                            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: '#f0efe9' }}>
                                India's Leading Internship Platform
                            </span>
                        </motion.div>
                        
                        <motion.h1 variants={resolveVariants(childVariants)} style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 1.5rem', letterSpacing: '-0.03em' }}>
                            <span className="outline-text">Build Your</span> <br/>
                            Career with <br/>
                            <span style={{ color: '#22d87a' }}>Real Experience</span>
                        </motion.h1>

                        <motion.p variants={resolveVariants(childVariants)} style={{ fontSize: '1.1rem', color: 'rgba(240,239,233,0.7)', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '480px' }}>
                            One program — live sessions, AI-powered building, and real projects assigned by us.
                        </motion.p>

                        <motion.div variants={resolveVariants(childVariants)} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <a href="/dashboard/apply/" className="btn-filled" onClick={handleBtnClick}>Start Application</a>
                            <a href="#program" className="btn-ghost">See the Program &rarr;</a>
                        </motion.div>
                    </div>

                    {/* Right Column Action Cards */}
                    <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <motion.a 
                            href="/dashboard/apply/" 
                            className="action-card"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={vConfig}
                            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.4 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div className="card-icon-box" style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="fas fa-briefcase" style={{ color: '#22d87a' }}></i>
                                </div>
                                <span className="pill" style={{ background: 'rgba(34,216,122,0.15)', color: '#22d87a' }}>Open</span>
                            </div>
                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 600 }}>Apply for Internship</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(240,239,233,0.5)' }}>Submit your application and join our team. Work on real-world projects.</p>
                        </motion.a>

                        <motion.a 
                            href="/dashboard/user/login" 
                            className="action-card"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={vConfig}
                            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.6 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div className="card-icon-box">
                                    <i className="fas fa-chart-line" style={{ color: '#60a5fa' }}></i>
                                </div>
                                <span className="pill" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>Track progress</span>
                            </div>
                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 600 }}>Intern Portal</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(240,239,233,0.5)' }}>Access your dashboard, view assignments, and connect with mentors.</p>
                        </motion.a>
                    </div>
                </motion.div>
                </div>
            </div>

            <div className="dash-content">

                {/* SECTION 3 - Stats Bar */}
                <StatsSection />

                {/* SECTION 4 - Program Section */}
                <ProgramSection />

                {/* SECTION 4.5 - FAQ */}
                <FaqSection />

                {/* SECTION 4.6 - CTA Band */}
                <CtaBandSection />

                {/* SECTION 5 - Trust Strip */}
                <TrustStripSection />

            </div>
        </div>
    );
}
