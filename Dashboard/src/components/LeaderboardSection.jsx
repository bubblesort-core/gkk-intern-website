import React, { useState, useEffect } from 'react';
import { useLazySection } from '../hooks/useLazySection';
import { supabase } from '../lib/supabaseClient';

export default function LeaderboardSection() {
    const sectionRef = useLazySection();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, xp, current_streak, avatar_url')
                    .not('full_name', 'ilike', '%Test%')
                    .neq('full_name', 'GKK Admin')
                    .order('xp', { ascending: false })
                    .limit(10);

                if (error) throw error;
                setLeaders(data || []);
            } catch (err) {
                console.error('Leaderboard fetch error:', err);
                setLeaders([]);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, []);

    const getRankEmoji = (index) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `#${index + 1}`;
    };

    const calculateLevel = (xp) => {
        let level = 1;
        let xpNeeded = 100;
        let totalXp = 0;
        while (totalXp + xpNeeded <= (xp || 0)) {
            totalXp += xpNeeded;
            level++;
            xpNeeded = level * 100;
        }
        return level;
    };

    return (
        <section
            ref={sectionRef}
            className="section lazy-section"
            id="leaderboard"
            style={{ backgroundColor: 'var(--bg-body)' }}
        >
            <div className="container">
                <div className="text-center" style={{ maxWidth: '600px', margin: '0 auto 3rem' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '99px',
                            fontSize: '0.85rem',
                            color: 'var(--text-body)',
                            marginBottom: '1rem',
                        }}
                    >
                        🏆 Hall of Fame
                    </div>
                    <h2>Top Performing Interns</h2>
                    <p style={{ color: 'var(--text-body)' }}>
                        See who's leading the pack with the most XP and longest streaks.
                    </p>
                </div>

                <div id="publicLeaderboardContainer" style={{ maxWidth: '700px', margin: '0 auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}></i>
                            <p>Loading leaderboard...</p>
                        </div>
                    ) : leaders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <p>No leaderboard data available yet.</p>
                        </div>
                    ) : (
                        <div className="leaderboard-card">
                            <div
                                className="leaderboard-header"
                                style={{
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Top Interns</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {leaders.length} shown
                                </span>
                            </div>
                            {leaders.map((leader, index) => (
                                <div
                                    key={index}
                                    className="leaderboard-row"
                                    style={{
                                        background: index < 3 ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                    }}
                                >
                                    <div className="rank-badge" style={{ fontSize: index < 3 ? '1.2rem' : '0.85rem' }}>
                                        {getRankEmoji(index)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                            {leader.full_name || 'Anonymous'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Level {calculateLevel(leader.xp)} • 🔥 {leader.current_streak || 0} day streak
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                            {(leader.xp || 0).toLocaleString()} XP
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
