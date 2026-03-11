import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';

export default function OverviewSection() {
    const { currentProfile, currentTeam, currentProjects, isLocked, calculateLevel, supabase } = useDashboard();
    const navigate = useNavigate();
    const [activeWorkshops, setActiveWorkshops] = React.useState([]);

    useEffect(() => {
        const handler = () => {
            window.location.reload(); 
        };
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, []);

    useEffect(() => {
        const fetchWorkshops = async () => {
            try {
                const { data } = await supabase
                    .from('workshops')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });
                setActiveWorkshops(data || []);
            } catch (err) {
                console.error('Error fetching workshops:', err);
            }
        };
        fetchWorkshops();
    }, [supabase]);

    const name = currentProfile?.full_name || currentProfile?.email?.split('@')[0] || 'Intern';
    const memberCount = currentTeam?.team_members?.length || 0;
    const projectCount = currentProjects?.length || 0;
    const workshopCount = activeWorkshops.length;
    const completedCount = currentProjects?.filter(p => p.status === 'completed' || p.status === 'approved').length || 0;
    const streak = currentProfile?.current_streak || 0;

    // Find active project for "Current Focus"
    const activeProject = currentProjects?.find(p => p.status === 'in_progress')
        || currentProjects?.find(p => p.status === 'assigned')
        || currentProjects?.[0];

    const goTo = (path) => navigate(`/user/dashboard/${path}`);

    const showWorkshopDetails = async (w) => {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire({
            title: `<h2 style="color:white; margin:0; text-transform:uppercase; letter-spacing:1px;">${w.title}</h2>`,
            html: `
                <div style="text-align:left; color: #cbd5e1; font-family: 'Inter', sans-serif;">
                    ${w.hero_image_url ? `<div style="margin-bottom:1.5rem; border-radius:12px; overflow:hidden; border: 1px solid rgba(255,255,255,0.1);"><img src="${w.hero_image_url}" style="width:100%; height:auto; display:block;"></div>` : ''}
                    <p style="font-size:1rem; line-height:1.6; margin-bottom:1.5rem;">${w.description}</p>
                    <div style="background: rgba(59,130,246,0.1); padding: 1rem; border-radius: 10px; border: 1px solid rgba(59,130,246,0.2);">
                        <div style="font-size:0.85rem; color:#93c5fd; font-weight:600; margin-bottom:5px;">WORKSHOP DETAILS</div>
                        <div style="font-size:0.9rem;">Timer Duration: ${w.timer_duration} seconds</div>
                    </div>
                </div>
            `,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#f8fafc',
            showConfirmButton: !!w.cta_link,
            confirmButtonText: w.cta_text || 'Join Now',
            confirmButtonColor: '#3b82f6',
            showCloseButton: true,
            width: '600px',
            padding: '2rem'
        }).then((result) => {
            if (result.isConfirmed && w.cta_link) {
                window.open(w.cta_link, '_blank');
            }
        });
    };

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
                <div className="dash-stat-card">
                    <div className="dash-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <i className="fas fa-calendar-star" />
                    </div>
                    <div>
                        <div className="dash-stat-value">{workshopCount}</div>
                        <div className="dash-stat-label">Live Workshops</div>
                    </div>
                </div>
                <div className="dash-stat-card" onClick={() => goTo('team')}>
                    <div className="dash-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
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
                {/* Current Focus & Workshops */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--dash-text-muted)' }}>
                                    <i className="fas fa-layer-group" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>No active projects</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Workshops Spotlight */}
                    {activeWorkshops.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem' }}>🎁 Special Workshops</h3>
                                <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold' }}>LIVE</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {activeWorkshops.slice(0, 2).map(w => (
                                    <div key={w.id} className="dash-card dash-workshop-card" onClick={() => showWorkshopDetails(w)} style={{ cursor: 'pointer', padding: '1.25rem', transition: 'transform 0.2s', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                            {w.hero_image_url && (
                                                <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                                                    <img src={w.hero_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'white' }}>{w.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dash-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {w.description}
                                                </p>
                                            </div>
                                            <i className="fas fa-chevron-right" style={{ opacity: 0.3 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

                    <div className="dash-tip" style={{ marginTop: '2rem' }}>
                        <h4><i className="fas fa-lightbulb" /> Tip of the Day</h4>
                        <p>Update your daily status in the Team Chat to keep your mentors informed!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
