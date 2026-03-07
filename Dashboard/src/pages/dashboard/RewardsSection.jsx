import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import Swal from 'sweetalert2';
import { RewardsSkeleton } from '../../components/dashboard/DashboardSkeletons';

export default function RewardsSection() {
    const { currentUser, supabase, getProxiedUrl } = useDashboard();
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadRewards = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reward_assignments')
                .select('*, rewards:reward_id(*)')
                .eq('user_id', currentUser.id)
                .order('assigned_at', { ascending: false });
            if (error) throw error;
            setRewards(data || []);
        } catch (err) {
            console.error('Error loading rewards:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, supabase]);

    useEffect(() => { loadRewards(); }, [loadRewards]);

    useEffect(() => {
        const handler = () => loadRewards();
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, [loadRewards]);

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        Swal.fire({ icon: 'success', title: 'Copied!', text: 'Coupon code copied to clipboard.', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#f1f5f9' });
    };

    const markUsed = async (assignmentId) => {
        const result = await Swal.fire({
            title: 'Mark as Used?', text: 'This will mark the reward as redeemed.',
            icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, mark it',
            background: '#1e293b', color: '#f1f5f9'
        });
        if (!result.isConfirmed) return;
        try {
            const { error } = await supabase.from('reward_assignments').update({ redeemed: true }).eq('id', assignmentId);
            if (error) throw error;
            setRewards(prev => prev.map(r => r.id === assignmentId ? { ...r, redeemed: true } : r));
            Swal.fire({ icon: 'success', title: 'Marked!', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#f1f5f9' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#1e293b', color: '#f1f5f9' });
        }
    };

    if (loading) return <RewardsSkeleton />;

    if (rewards.length === 0) {
        return (
            <div className="dash-empty">
                <i className="fas fa-gift" />
                <h3>No Rewards Yet</h3>
                <p>Complete tasks and challenges to earn rewards!</p>
            </div>
        );
    }

    return (
        <div className="dash-section-ready" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {rewards.map(assignment => {
                const reward = assignment.rewards;
                if (!reward) return null;
                const isUsed = assignment.redeemed;

                return (
                    <div key={assignment.id} style={{
                        background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 12, overflow: 'hidden', opacity: isUsed ? 0.6 : 1, transition: 'transform 0.2s',
                        position: 'relative'
                    }}>
                        {isUsed && (
                            <div style={{
                                position: 'absolute', top: 16, right: -28, background: '#10b981',
                                color: 'white', padding: '4px 36px', fontSize: '0.7rem', fontWeight: 700,
                                transform: 'rotate(45deg)', zIndex: 2, letterSpacing: '0.5px'
                            }}>USED</div>
                        )}

                        {/* Image */}
                        {reward.image_path && (
                            <div style={{ height: 140, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                                <img src={getProxiedUrl(`/storage/v1/object/public/${reward.image_path}`)}
                                     alt={reward.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}

                        <div style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>{reward.title}</h4>
                                {reward.value && (
                                    <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {reward.value}
                                    </span>
                                )}
                            </div>

                            {reward.description && (
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.4 }}>{reward.description}</p>
                            )}

                            {/* Coupon code */}
                            {reward.coupon_code && (
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)', border: '1px dashed rgba(139,92,246,0.4)',
                                    borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', marginBottom: 12
                                }}>
                                    <code style={{ color: '#a78bfa', fontSize: '1rem', fontWeight: 700, letterSpacing: '1px' }}>
                                        {reward.coupon_code}
                                    </code>
                                    <button onClick={() => copyCode(reward.coupon_code)} style={{
                                        background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: 4
                                    }} title="Copy code">
                                        <i className="fas fa-copy" />
                                    </button>
                                </div>
                            )}

                            {/* Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>
                                    {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString() : ''}
                                    {reward.expires_at && ` • Expires ${new Date(reward.expires_at).toLocaleDateString()}`}
                                </span>
                                {!isUsed && (
                                    <button onClick={() => markUsed(assignment.id)} style={{
                                        background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none',
                                        padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                    }}>
                                        <i className="fas fa-check" /> Mark Used
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
