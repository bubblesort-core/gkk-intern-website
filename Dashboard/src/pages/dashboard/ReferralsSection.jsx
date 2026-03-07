import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import Swal from 'sweetalert2';
import { ReferralsSkeleton } from '../../components/dashboard/DashboardSkeletons';

export default function ReferralsSection() {
    const { currentUser, currentProfile, isLocked, supabase, awardXP } = useDashboard();
    const [referralCode, setReferralCode] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadReferralData = useCallback(async () => {
        if (!currentProfile) return;
        setLoading(true);
        try {
            setReferralCode(currentProfile.referral_code || '');
            setReferralCount(currentProfile.referral_count || 0);
        } catch (err) {
            console.error('Error loading referral data:', err);
        } finally {
            setLoading(false);
        }
    }, [currentProfile]);

    useEffect(() => { loadReferralData(); }, [loadReferralData]);

    useEffect(() => {
        const handler = () => loadReferralData();
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, [loadReferralData]);

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        Swal.fire({ icon: 'success', title: 'Copied!', text: 'Referral code copied.', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#f1f5f9' });
    };

    const redeemCode = async () => {
        const { value: code } = await Swal.fire({
            title: 'Redeem Referral Code',
            input: 'text', inputPlaceholder: 'Enter referral code',
            showCancelButton: true, confirmButtonText: 'Redeem',
            background: '#1e293b', color: '#f1f5f9',
            inputValidator: (val) => { if (!val) return 'Please enter a code'; }
        });
        if (!code) return;

        try {
            const { data, error } = await supabase.rpc('claim_referral', { code_used: code.trim() });
            if (error) throw error;
            if (data?.success) {
                await awardXP(50, 'Referral code redeemed! +50 XP');
                Swal.fire({ icon: 'success', title: 'Referral Claimed!', text: 'You earned 50 XP!', background: '#1e293b', color: '#f1f5f9' });
            } else {
                Swal.fire({ icon: 'error', title: 'Invalid Code', text: data?.message || 'Could not redeem this code.', background: '#1e293b', color: '#f1f5f9' });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#1e293b', color: '#f1f5f9' });
        }
    };

    const shareWhatsApp = () => {
        const msg = `Hey! I'm interning at GKK Hire and it's been amazing! 🚀\n\nUse my referral code: ${referralCode}\nApply here: https://gkkhire.com/apply\n\nLet's grow together! 💪`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (loading) return <ReferralsSkeleton />;

    // Locked state
    if (isLocked) {
        return (
            <div style={{ position: 'relative', minHeight: 300 }}>
                <div style={{ filter: 'blur(4px)', pointerEvents: 'none', opacity: 0.4 }}>
                    <div className="dash-glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <h3 style={{ color: '#f1f5f9', fontSize: '1.25rem' }}>Referral Program</h3>
                        <p style={{ color: '#94a3b8' }}>Share your code and earn rewards!</p>
                    </div>
                </div>
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '1rem',
                    background: 'rgba(15,23,42,0.6)', borderRadius: 12
                }}>
                    <i className="fas fa-lock" style={{ fontSize: '2rem', color: '#f59e0b' }} />
                    <h3 style={{ color: '#f1f5f9', margin: 0 }}>Complete Registration</h3>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Complete your payment to unlock the referral program.</p>
                </div>
            </div>
        );
    }

    const xpEarned = referralCount * 100;
    const badgeProgress = Math.min(referralCount / 10, 1);

    return (
        <div className="dash-section-ready" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Your Code */}
            <div className="dash-glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', color: '#a78bfa' }}>
                    <i className="fas fa-share-nodes" />
                </div>
                <h3 style={{ color: '#f1f5f9', fontSize: '1.25rem', marginBottom: 4 }}>Your Referral Code</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Share this code with friends and earn XP!</p>

                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                    background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(139,92,246,0.4)',
                    borderRadius: 10, padding: '12px 20px', marginBottom: '1.25rem'
                }}>
                    <code style={{ color: '#a78bfa', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '2px' }}>
                        {referralCode || 'N/A'}
                    </code>
                    {referralCode && (
                        <button onClick={copyCode} style={{
                            background: 'rgba(139,92,246,0.2)', border: 'none', color: '#a78bfa',
                            padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '1rem'
                        }} title="Copy">
                            <i className="fas fa-copy" />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={shareWhatsApp} className="dash-btn-primary" style={{ background: '#25D366', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fab fa-whatsapp" /> Share on WhatsApp
                    </button>
                    <button onClick={redeemCode} className="dash-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-ticket-alt" /> Redeem a Code
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="dash-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                        <i className="fas fa-users" />
                    </div>
                    <div className="dash-stat-value">{referralCount}</div>
                    <div className="dash-stat-label">Referrals</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                        <i className="fas fa-star" />
                    </div>
                    <div className="dash-stat-value">{xpEarned}</div>
                    <div className="dash-stat-label">XP Earned</div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        <i className="fas fa-award" />
                    </div>
                    <div className="dash-stat-value">{referralCount >= 10 ? '✅' : `${referralCount}/10`}</div>
                    <div className="dash-stat-label">Community Builder</div>
                </div>
            </div>

            {/* Progress */}
            <div className="dash-glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>Community Builder Badge</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{Math.round(badgeProgress * 100)}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${badgeProgress * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 8 }}>
                    {referralCount >= 10 ? '🎉 Badge earned! You\u2019re a Community Builder!' : `Refer ${10 - referralCount} more friends to earn the Community Builder badge!`}
                </p>
            </div>
        </div>
    );
}
