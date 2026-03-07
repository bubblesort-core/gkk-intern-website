import React from 'react';
import { useThreeHero } from '../hooks/useThreeHero';
import { Link } from 'react-router-dom';
import UseAnimations from 'react-useanimations';
import star from 'react-useanimations/lib/star';
import explore from 'react-useanimations/lib/explore';
import activity from 'react-useanimations/lib/activity';
import lock from 'react-useanimations/lib/lock';
import alertCircle from 'react-useanimations/lib/alertCircle';
import bookmark from 'react-useanimations/lib/bookmark';

const stats = [
    { value: '50+', label: 'Projects Shipped' },
    { value: '30+', label: 'Interns Trained' },
    { value: '10+', label: 'Tech Stacks' },
    { value: '92%', label: 'Satisfaction Rate' },
];

const trustItems = [
    { animation: alertCircle, label: 'Registered MSME', sub: 'Govt. Verified', accent: 'trust-accent-msme' },
    { animation: lock, label: 'SSL Secured', sub: '256-bit Encryption', accent: 'trust-accent-ssl' },
    { animation: alertCircle, label: 'DMCA Protected', sub: 'Secured Content', accent: 'trust-accent-dmca' },
    { animation: bookmark, label: 'Built in India', sub: 'Made in WB', accent: 'trust-accent-india' },
    { animation: activity, label: 'A Venture by', sub: 'Bubblesort Group', accent: 'trust-accent-venture' },
];

export default function HeroSection() {
    const threeRef = useThreeHero();

    return (
        <section className="hero-section">
            <div className="hero-visual-shape" style={{ top: '-100px', right: '-100px' }}></div>
            <div className="container">
                <div className="grid hero-grid" style={{ gap: '4rem', alignItems: 'center' }}>
                    {/* Left — Content */}
                    <div className="hero-content">
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.25rem 0.75rem',
                                background: 'var(--bg-subtle)',
                                borderRadius: '99px',
                                fontSize: '0.85rem',
                                color: 'var(--primary)',
                                fontWeight: 500,
                                marginBottom: '1.5rem',
                            }}
                        >
                            <UseAnimations animation={star} size={16} strokeColor="currentColor" autoplay={true} loop={true} speed={0.5} />
                            India's Leading Internship Platform
                        </div>

                        <h1 style={{ marginBottom: '1.5rem' }}>
                            Build Your Career with <br />
                            <span className="text-primary">Real Experience</span>
                        </h1>

                        <p
                            style={{
                                fontSize: '1.1rem',
                                color: 'var(--text-body)',
                                maxWidth: '500px',
                                marginBottom: '2.5rem',
                            }}
                        >
                            Join GKK Interns and work on industry-level projects, collaborate with dynamic teams,
                            and earn verified certificates.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <a href="/apply/" className="pro-btn pro-btn-primary pro-btn-lg magnetic-btn">
                                Start Application
                            </a>
                            <a href="#features" className="pro-btn pro-btn-secondary pro-btn-lg">
                                Learn More
                            </a>
                        </div>

                        {/* Stats */}
                        <div
                            className="hero-stats"
                            style={{
                                marginTop: '4rem',
                                display: 'flex',
                                gap: '3rem',
                                flexWrap: 'wrap',
                                borderTop: '1px solid var(--border)',
                                paddingTop: '2rem',
                            }}
                        >
                            {stats.map((stat) => (
                                <div key={stat.label}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                        {stat.value}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Visual */}
                    <div className="hero-visual-wrapper" style={{ position: 'relative' }}>
                        <div
                            ref={threeRef}
                            id="hero-3d-container"
                            style={{
                                position: 'absolute',
                                top: '-25%',
                                left: '-25%',
                                width: '150%',
                                height: '150%',
                                zIndex: -1,
                                pointerEvents: 'none',
                            }}
                        ></div>
                        <div className="hero-visual-accent" style={{ opacity: 0.2 }}></div>
                        <div className="grid gap-4">
                            {/* Apply Card */}
                            <a href="/dashboard/apply/" className="hero-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="card-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                                        <UseAnimations animation={explore} size={24} strokeColor="#10b981" autoplay={true} loop={true} speed={0.5} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Apply for Internship</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Start your journey</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>
                                    Submit your application and join our team. Work on real-world projects.
                                </div>
                            </a>

                            {/* Intern Portal Card */}
                            <Link to="/user/login" className="hero-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="card-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                                        <UseAnimations animation={activity} size={24} strokeColor="#3b82f6" autoplay={true} loop={true} speed={0.5} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Intern Portal</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Track progress</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-body)' }}>
                                    Access your dashboard, view assignments, and connect with mentors.
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Trust Strip */}
                <div className="trust-strip trust-strip-wide">
                    <div className="trust-strip-title">🏆 Trust &amp; Compliance</div>
                    <ul className="trust-rail">
                        {trustItems.map((item) => (
                            <li key={item.label} className={`trust-item ${item.accent}`}>
                                <UseAnimations animation={item.animation} size={22} strokeColor="currentColor" autoplay={true} loop={true} speed={0.3} />
                                <div className="trust-text">
                                    <span className="trust-label">{item.label}</span>
                                    <span className="trust-sub">{item.sub}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
