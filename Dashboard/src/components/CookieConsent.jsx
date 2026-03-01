import React, { useState, useEffect } from 'react';

const STATE_KEY = 'gkk_app_state';

function getState() {
    try {
        const raw = document.cookie
            .split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith(STATE_KEY + '='));
        if (raw) {
            const data = JSON.parse(raw.substring(STATE_KEY.length + 1));
            if (data.version === '2.0') return data;
        }
    } catch { }
    return null;
}

function saveState(features) {
    const data = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        features,
    };
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${STATE_KEY}=${JSON.stringify(data)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [preferences, setPreferences] = useState({
        core_features: true,
        user_settings: true,
        usage_metrics: false,
        promo_content: false,
    });

    useEffect(() => {
        const existing = getState();
        if (!existing) {
            setVisible(true);
        } else {
            setPreferences(existing.features || preferences);
        }
    }, []);

    const acceptAll = () => {
        const all = {
            core_features: true,
            user_settings: true,
            usage_metrics: true,
            promo_content: true,
        };
        saveState(all);
        setVisible(false);
    };

    const rejectNonEssential = () => {
        const core = {
            core_features: true,
            user_settings: false,
            usage_metrics: false,
            promo_content: false,
        };
        saveState(core);
        setVisible(false);
    };

    const savePrefs = () => {
        saveState(preferences);
        setShowModal(false);
        setVisible(false);
    };

    if (!visible && !showModal) return null;

    return (
        <>
            {/* Notice Bar */}
            {visible && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(12px)',
                        borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                        padding: '1rem 2rem',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        animation: 'fadeUp 0.4s ease-out',
                    }}
                >
                    <div style={{ flex: 1, color: '#94a3b8', fontSize: '0.85rem' }}>
                        <i className="fas fa-cookie-bite" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
                        We use cookies and local storage to enhance your experience. You can customize your preferences.
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowModal(true)}
                            className="pro-btn pro-btn-secondary pro-btn-sm"
                        >
                            Customize
                        </button>
                        <button onClick={rejectNonEssential} className="pro-btn pro-btn-secondary pro-btn-sm">
                            Essential Only
                        </button>
                        <button onClick={acceptAll} className="pro-btn pro-btn-primary pro-btn-sm">
                            Accept All
                        </button>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 2100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card, #1e293b)',
                            borderRadius: '16px',
                            width: '90%',
                            maxWidth: '480px',
                            padding: '2rem',
                            border: '1px solid var(--border, rgba(148,163,184,0.15))',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main, #f1f5f9)' }}>
                                <i className="fas fa-sliders-h" style={{ marginRight: '8px' }}></i>
                                Privacy Preferences
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Manage how we store data in your browser.
                        </p>

                        {[
                            { key: 'core_features', label: 'Essential', desc: 'Required for the site to function.', locked: true },
                            { key: 'user_settings', label: 'Preferences', desc: 'Remembers your theme, layout, and language preferences.' },
                            { key: 'usage_metrics', label: 'Analytics', desc: 'Helps us understand how you use the site to improve features.' },
                            { key: 'promo_content', label: 'Marketing', desc: 'Shows relevant promotions and offers.' },
                        ].map((item) => (
                            <div
                                key={item.key}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 0',
                                    borderBottom: '1px solid rgba(148,163,184,0.1)',
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main, #f1f5f9)', fontSize: '0.9rem' }}>
                                        {item.label}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.desc}</div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={preferences[item.key]}
                                    disabled={item.locked}
                                    onChange={(e) =>
                                        setPreferences((prev) => ({ ...prev, [item.key]: e.target.checked }))
                                    }
                                    style={{ width: '18px', height: '18px', cursor: item.locked ? 'not-allowed' : 'pointer' }}
                                />
                            </div>
                        ))}

                        <button
                            onClick={savePrefs}
                            className="pro-btn pro-btn-primary"
                            style={{ width: '100%', marginTop: '1.5rem' }}
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
