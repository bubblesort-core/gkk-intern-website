import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { AnnouncementsSkeleton } from '../../components/dashboard/DashboardSkeletons';

export default function AnnouncementsSection() {
    const { currentUser, currentTeam, supabase, formatDate, formatDateTime } = useDashboard();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAnnouncements = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_targeted_announcements', {
                p_user_id: currentUser.id,
                p_team_id: currentTeam?.id || null,
                p_batch: currentTeam?.batch_id || null
            });
            if (error) throw error;
            setAnnouncements(data || []);
        } catch (err) {
            console.error('Error loading announcements:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, currentTeam, supabase]);

    useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

    useEffect(() => {
        const handler = () => loadAnnouncements();
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, [loadAnnouncements]);

    // Mark as viewed
    useEffect(() => {
        localStorage.setItem('lastViewed_announcements', Date.now().toString());
    }, []);

    const typeColors = {
        info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', accent: '#3b82f6', icon: 'fa-info-circle' },
        success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', accent: '#10b981', icon: 'fa-check-circle' },
        warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', accent: '#f59e0b', icon: 'fa-exclamation-triangle' },
        alert: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', accent: '#ef4444', icon: 'fa-exclamation-circle' }
    };

    const getTargetBadge = (a) => {
        if (a.target_type === 'personal') return { label: 'Personal', color: '#a855f7' };
        if (a.target_type === 'team') return { label: 'Team', color: '#3b82f6' };
        if (a.target_type === 'batch') return { label: 'Batch', color: '#f59e0b' };
        return { label: 'Global', color: '#10b981' };
    };

    if (loading) return <AnnouncementsSkeleton />;

    if (announcements.length === 0) {
        return (
            <div className="dash-empty">
                <i className="fas fa-bullhorn" />
                <h3>No Announcements</h3>
                <p>You're all caught up! Check back later for updates.</p>
            </div>
        );
    }

    return (
        <div className="dash-section-ready" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.map(a => {
                const tc = typeColors[a.type] || typeColors.info;
                const target = getTargetBadge(a);
                return (
                    <div key={a.id} className="dash-card" style={{ borderLeft: `3px solid ${tc.accent}`, background: tc.bg }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${tc.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tc.accent }}>
                                    <i className={`fas ${tc.icon}`} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>{a.title}</h4>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>
                                        <i className="far fa-clock" style={{ marginRight: 4 }} />
                                        {formatDateTime ? formatDateTime(a.created_at) : formatDate(a.created_at)}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {a.is_pinned && (
                                    <span style={{ fontSize: '0.7rem', color: '#fbbf24' }} title="Pinned">
                                        <i className="fas fa-thumbtack" />
                                    </span>
                                )}
                                <span style={{
                                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12,
                                    background: `${target.color}15`, color: target.color,
                                    border: `1px solid ${target.color}30`
                                }}>
                                    {target.label}
                                </span>
                            </div>
                        </div>
                        <p style={{ color: 'var(--dash-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                            {a.content || a.message}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
