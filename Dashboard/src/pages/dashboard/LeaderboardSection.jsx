import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { LeaderboardSkeleton } from '../../components/dashboard/DashboardSkeletons';

export default function LeaderboardSection() {
    const { currentTeam, supabase, calculateLevel } = useDashboard();
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const batchId = currentTeam?.batch_id || null;
            let users = [];

            if (batchId) {
                const { data: batchTeams } = await supabase.from('teams').select('id').eq('batch_id', batchId);
                if (batchTeams?.length > 0) {
                    const teamIds = batchTeams.map(t => t.id);
                    const { data: members } = await supabase.from('team_members').select('user_id').in('team_id', teamIds);
                    if (members?.length > 0) {
                        const userIds = [...new Set(members.map(m => m.user_id))];
                        const { data } = await supabase
                            .from('profiles')
                            .select('full_name, xp, level, avatar_url')
                            .in('id', userIds)
                            .not('full_name', 'ilike', '%Test%')
                            .neq('full_name', 'GKK Admin')
                            .order('xp', { ascending: false })
                            .limit(4);
                        if (data) users = data;
                    }
                }
            }

            // Fallback to global
            if (users.length === 0) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, xp, level, avatar_url')
                    .not('full_name', 'ilike', '%Test%')
                    .neq('full_name', 'GKK Admin')
                    .order('xp', { ascending: false })
                    .limit(4);
                if (data) users = data;
            }

            setTopUsers(users);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
        } finally {
            setLoading(false);
        }
    }, [currentTeam, supabase]);

    useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

    useEffect(() => {
        const handler = () => loadLeaderboard();
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, [loadLeaderboard]);

    const rankColors = ['#fbbf24', '#94a3b8', '#cd7f32', '#64748b']; // gold, silver, bronze, default

    if (loading) return <LeaderboardSkeleton />;

    if (topUsers.length === 0) {
        return (
            <div className="dash-empty">
                <i className="fas fa-trophy" />
                <h3>No Interns Found</h3>
                <p>The leaderboard will populate as interns earn XP.</p>
            </div>
        );
    }

    return (
        <div className="dash-section-ready" style={{ maxWidth: 600 }}>
            {/* Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--dash-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Rank</span>
                <span>Intern</span>
                <span style={{ textAlign: 'right' }}>XP</span>
            </div>

            {/* Rows */}
            {topUsers.map((user, index) => {
                const rank = index + 1;
                const name = user.full_name || 'Anonymous User';
                const xp = user.xp || 0;
                const level = calculateLevel(xp);
                const color = rankColors[index] || rankColors[3];

                return (
                    <div key={index} className="dash-card" style={{
                        display: 'grid', gridTemplateColumns: '60px 1fr 80px', alignItems: 'center',
                        marginBottom: '0.5rem', padding: '1rem',
                        borderLeft: rank <= 3 ? `3px solid ${color}` : 'none'
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '1rem',
                            background: rank <= 3 ? `${color}20` : 'rgba(255,255,255,0.05)',
                            color: rank <= 3 ? color : 'var(--dash-text-secondary)'
                        }}>
                            {rank}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 600, color: 'var(--dash-accent)', fontSize: '1rem'
                            }}>
                                {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 500, color: 'var(--dash-text-primary)' }}>{name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>Lvl {level}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--dash-accent)' }}>
                            {xp} XP
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
