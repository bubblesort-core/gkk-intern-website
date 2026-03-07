import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';

export default function OverviewSection() {
    const { currentProfile, currentTeam, currentProjects, isLocked, calculateLevel } = useDashboard();
    const navigate = useNavigate();

    useEffect(() => {
        const handler = () => {
            // If you have a function to reload data, call it here
            window.location.reload(); // fallback: reload page to refresh all data
        };
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, []);

    const name = currentProfile?.full_name || currentProfile?.email?.split('@')[0] || 'Intern';
    const memberCount = currentTeam?.team_members?.length || 0;
    const projectCount = currentProjects?.length || 0;
    const completedCount = currentProjects?.filter(p => p.status === 'completed' || p.status === 'approved').length || 0;
    const streak = currentProfile?.current_streak || 0;

    // Find active project for "Current Focus"
    const activeProject = currentProjects?.find(p => p.status === 'in_progress')
        || currentProjects?.find(p => p.status === 'assigned')
        || currentProjects?.[0];

    const goTo = (path) => navigate(`/user/dashboard/${path}`);

    const getStatusColor = (status) => {
        switch (status) {
            case 'in_progress': return '#3b82f6';
            case 'completed': return '#10b981';
            case 'changes_requested': return '#f59e0b';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="dash-section-ready">
            {/* Locked Banner */}
            {isLocked && (
                <div className="dash-locked-banner">
                    <div style={{ background: '#f59e0b', color: 'white', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '1.25rem', flexShrink: 0 }}>
                        <i className="fas fa-lock" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3>Registration Pending</h3>
                        <p>Complete your one-time registration fee to unlock Projects, Team Chat, and Live Updates.</p>
                    </div>
                    <button className="dash-btn dash-btn-primary" onClick={() => goTo('payment')}>
                        Unlock Now <i className="fas fa-arrow-right" />
                    </button>
                </div>
            )}

            {/* Welcome Hero */}
            <div className="dash-card" style={{ position: 'relative', overflow: 'hidden', marginBottom: '2rem', borderLeft: '4px solid var(--dash-accent)' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                        Welcome back, <span className="dash-text-gradient">{name}</span> 👋
                    </h1>
                    <p style={{ color: 'var(--dash-text-secondary)', maxWidth: 600, marginBottom: '0.5rem' }}>
                        You're doing great! Check your active projects and connect with your team to keep the momentum going.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-tag" /> {currentProfile?.role?.toUpperCase() || 'INTERN'}
                        </span>
                        {currentTeam?.batches?.name && (
                            <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <i className="fas fa-layer-group" /> {currentTeam.batches.name}
                            </span>
                        )}
                        {currentTeam?.name && (
                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <i className="fas fa-users" /> {currentTeam.name}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="dash-btn dash-btn-primary" onClick={() => goTo('projects')}>
                            <i className="fas fa-play" /> Resume Project
                        </button>
                        <button className="dash-btn dash-btn-secondary" onClick={() => goTo('team')}>
                            <i className="fas fa-users" /> Team Chat
                        </button>
                    </div>
                </div>
                <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            </div>

            {/* Stats Grid */}
            <div className="dash-stats-grid">
                <div className="dash-stat-card" onClick={() => goTo('projects')}>
                    <div className="dash-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <i className="fas fa-layer-group" />
                    </div>
                    <div>
                        <div className="dash-stat-value">{projectCount}</div>
                        <div className="dash-stat-label">Active Projects</div>
                    </div>
                </div>
                <div className="dash-stat-card" onClick={() => goTo('projects')}>
                    <div className="dash-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <i className="fas fa-check-circle" />
                    </div>
                    <div>
                        <div className="dash-stat-value">{completedCount}</div>
                        <div className="dash-stat-label">Completed Tasks</div>
                    </div>
                </div>
                <div className="dash-stat-card" onClick={() => goTo('team')}>
                    <div className="dash-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <i className="fas fa-users" />
                    </div>
                    <div>
                        <div className="dash-stat-value">{memberCount}</div>
                        <div className="dash-stat-label">Team Members</div>
                    </div>
                </div>
                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <i className="fas fa-fire" />
                    </div>
                    <div>
                        <div className="dash-stat-value">{streak}</div>
                        <div className="dash-stat-label">Day Streak</div>
                    </div>
                </div>
            </div>

            {/* Split Grid */}
            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
                {/* Current Focus */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>🚀 Current Focus</h3>
                        <button onClick={() => goTo('projects')} style={{ fontSize: '0.85rem', color: 'var(--dash-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            View All
                        </button>
                    </div>
                    <div className="dash-card" style={{ minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {activeProject ? (
                            <div style={{ width: '100%', textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: getStatusColor(activeProject.status), fontWeight: 700, letterSpacing: 0.5, marginBottom: '0.25rem' }}>
                                            <i className="fas fa-circle" style={{ fontSize: '0.5rem', verticalAlign: 'middle', marginRight: 4 }} />
                                            {(activeProject.status || 'assigned').replace('_', ' ').toUpperCase()}
                                        </div>
                                        <h4 style={{ fontSize: '1.1rem', color: 'white', margin: 0, lineHeight: 1.4 }}>{activeProject.title}</h4>
                                    </div>
                                    <div style={{ width: 40, height: 40, background: 'rgba(59,130,246,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                        <i className="fas fa-rocket" />
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--dash-text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {activeProject.description || 'No description available for this project.'}
                                </p>
                                <button className="dash-btn dash-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => goTo('projects')}>
                                    Continue Work <i className="fas fa-arrow-right" style={{ marginLeft: 8 }} />
                                </button>
                            </div>
                        ) : !currentTeam ? (
                            <div style={{ textAlign: 'center', color: 'var(--dash-text-muted)' }}>
                                <i className="fas fa-users-slash" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>No Team Assigned</p>
                                <p style={{ fontSize: '0.85rem' }}>You will be assigned to a team soon.</p>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--dash-text-muted)', textAlign: 'center' }}>
                                <i className="fas fa-layer-group" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No active projects</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>⚡ Quick Actions</h3>
                    <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button className="dash-action-row" onClick={() => goTo('meetings')}>
                            <div className="dash-action-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                <i className="fas fa-video" />
                            </div>
                            <span>Join Meeting</span>
                            <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', opacity: 0.5 }} />
                        </button>
                        <button className="dash-action-row" onClick={() => goTo('resources')}>
                            <div className="dash-action-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                                <i className="fas fa-book" />
                            </div>
                            <span>Resources</span>
                            <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', opacity: 0.5 }} />
                        </button>
                        <button className="dash-action-row" onClick={() => goTo('profile')}>
                            <div className="dash-action-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                <i className="fas fa-user-edit" />
                            </div>
                            <span>Edit Profile</span>
                            <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', opacity: 0.5 }} />
                        </button>
                    </div>

                    <div className="dash-tip">
                        <h4><i className="fas fa-lightbulb" /> Tip of the Day</h4>
                        <p>Update your daily status in the Team Chat to keep your mentors informed!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
