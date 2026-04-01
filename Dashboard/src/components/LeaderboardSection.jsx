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
                    .select('full_name, level, current_streak, avatar_url')
                    .not('full_name', 'ilike', '%Test%')
                    .neq('full_name', 'GKK Admin')
                    .order('level', { ascending: false })
                    .order('current_streak', { ascending: false })
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

    const calculateLevel = (streak) => {
        if (!streak || streak <= 0) return 1;
        return 1 + Math.floor(streak / 5);
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
                        See who's leading the pack with the most consistent streaks and levels.
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
                                            Level {leader.level || calculateLevel(leader.current_streak)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                            {leader.current_streak || 0} Days
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
