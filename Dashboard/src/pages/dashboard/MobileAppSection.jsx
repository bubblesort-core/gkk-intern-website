import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

const APK_URL = 'https://github.com/noreplaygkk26-png/gkk-app-releases/releases/download/v1.3.0/app-release.apk';

const features = [
    { icon: 'fa-bell', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', title: 'Push Notifications', desc: 'Stay updated with instant alerts for meetings, announcements, and deadlines.' },
    { icon: 'fa-tasks', color: '#10b981', bg: 'rgba(16,185,129,0.15)', title: 'Project Tracking', desc: 'View and manage your projects, submit work, and track progress on the go.' },
    { icon: 'fa-comments', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', title: 'Team Chat', desc: 'Communicate with your team in real-time with encrypted messaging.' }
];

export default function MobileAppSection() {
    const { isLocked } = useDashboard();

    React.useEffect(() => {
        const handler = () => {
            window.location.reload(); // fallback: reload page to refresh unlock status
        };
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, []);

    return (
        <div className="dash-section-ready" style={{ position: 'relative' }}>
            {isLocked && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    background: 'rgba(15,23,42,0.7)', borderRadius: 12,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem'
                }}>
                    <i className="fas fa-lock" style={{ fontSize: '2rem', color: '#f59e0b' }} />
                    <h3 style={{ color: '#f1f5f9', margin: 0 }}>Complete Payment to Download</h3>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Unlock access to the mobile app after registration.</p>
                </div>
            )}

            <div style={{ opacity: isLocked ? 0.4 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                {/* Hero */}
                <div className="dash-glass-card" style={{
                    padding: '2.5rem 2rem', textAlign: 'center', marginBottom: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.08))'
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 20, margin: '0 auto 1.25rem',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', color: 'white', boxShadow: '0 8px 24px rgba(139,92,246,0.3)'
                    }}>
                        <i className="fas fa-mobile-alt" />
                    </div>
                    <h2 style={{ color: '#f1f5f9', fontSize: '1.5rem', marginBottom: 8 }}>GKK INTERN MOBILE APP</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: 500, margin: '0 auto 1.5rem' }}>
                        Access your dashboard, chat with your team, and stay updated — all from your phone.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <a href={APK_URL} download className="dash-btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '12px 24px', fontSize: '1rem' }}>
                            <i className="fas fa-download" /> Download APK
                        </a>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>v1.3.0 • Android</span>
                    </div>
                </div>

                {/* Features */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    {features.map((f, i) => (
                        <div key={i} className="dash-glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: 14, background: f.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem', fontSize: '1.4rem', color: f.color
                            }}>
                                <i className={`fas ${f.icon}`} />
                            </div>
                            <h4 style={{ color: '#f1f5f9', fontSize: '1rem', marginBottom: 6 }}>{f.title}</h4>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
