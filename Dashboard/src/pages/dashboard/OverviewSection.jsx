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

    const getStatusLabel = (status) => {
        if (!status) return 'Pending';
        if (status === 'completed' || status === 'approved') return 'Completed';
        if (status === 'changes_requested') return 'Pending';
        if (status === 'in_progress') return 'Active';
        return 'Pending';
    };

    const timelineEvents = [
        {
            id: 'streak',
            title: 'Consistency streak',
            value: `${streak} day${streak === 1 ? '' : 's'}`,
            status: streak > 0 ? 'Active' : 'Pending'
        },
        {
            id: 'project',
            title: activeProject ? activeProject.title : 'Project assignment',
            value: activeProject ? (activeProject.status || 'assigned').replace('_', ' ') : 'Awaiting assignment',
            status: getStatusLabel(activeProject?.status)
        },
        {
            id: 'completion',
            title: 'Completed projects',
            value: `${completedCount} completed`,
            status: completedCount > 0 ? 'Completed' : 'Pending'
        },
        {
            id: 'workshops',
            title: 'Workshop activity',
            value: `${workshopCount} live sessions`,
            status: workshopCount > 0 ? 'Active' : 'Locked'
        }
    ];

    return (
        <div className="dash-section-ready">
            {isLocked && (
                <div className="dash-locked-banner">
                    <div className="dash-locked-icon-wrap">
                        <i className="fas fa-lock" />
                    </div>
                    <div>
                        <h3>Registration Pending</h3>
                        <p>Complete your one-time registration fee to unlock Projects, Team Chat, and Live Updates.</p>
                    </div>
                    <button className="dash-btn dash-btn-primary" onClick={() => goTo('payment')}>
                        Unlock Now <i className="fas fa-arrow-right" />
                    </button>
                </div>
            )}

            <div className="dash-bento-grid">
                <section className="dash-bento-tile dash-bento-hero dash-bento-w2" data-tone="sky">
                    <div className="dash-tile-header">
                        <h2>Welcome back, {name}</h2>
                        <span className="dash-status-badge active">Active</span>
                    </div>
                    <p className="dash-tile-subtitle">
                        You're doing great. Keep momentum by staying aligned with your projects and team.
                    </p>
                    <div className="dash-hero-tags">
                        <span className="dash-pill chip-role">{currentProfile?.role?.toUpperCase() || 'INTERN'}</span>
                        {currentTeam?.batches?.name && <span className="dash-pill chip-batch">{currentTeam.batches.name}</span>}
                        {currentTeam?.name && <span className="dash-pill chip-team">{currentTeam.name}</span>}
                    </div>
                    <div className="dash-hero-actions">
                        <button className="dash-btn dash-btn-primary" onClick={() => goTo('projects')}>
                            <i className="fas fa-play" /> Resume Project
                        </button>
                        <button className="dash-btn dash-btn-secondary" onClick={() => goTo('team')}>
                            <i className="fas fa-users" /> Team Chat
                        </button>
                    </div>
                </section>

                <button className="dash-bento-tile dash-bento-stat" data-tone="blue" onClick={() => goTo('projects')}>
                    <div className="dash-stat-icon"><i className="fas fa-layer-group" /></div>
                    <div className="dash-stat-value">{projectCount}</div>
                    <div className="dash-stat-label">Active Projects</div>
                </button>

                <div className="dash-bento-tile dash-bento-stat" data-tone="violet">
                    <div className="dash-stat-icon"><i className="fas fa-calendar-star" /></div>
                    <div className="dash-stat-value">{workshopCount}</div>
                    <div className="dash-stat-label">Live Workshops</div>
                </div>

                <button className="dash-bento-tile dash-bento-stat" data-tone="mint" onClick={() => goTo('team')}>
                    <div className="dash-stat-icon"><i className="fas fa-users" /></div>
                    <div className="dash-stat-value">{memberCount}</div>
                    <div className="dash-stat-label">Team Members</div>
                </button>

                <div className="dash-bento-tile dash-bento-stat" data-tone="amber">
                    <div className="dash-stat-icon"><i className="fas fa-fire" /></div>
                    <div className="dash-stat-value">{streak}</div>
                    <div className="dash-stat-label">Day Streak</div>
                </div>

                <section className="dash-bento-tile dash-bento-focus dash-bento-h2" data-tone="sky">
                    <div className="dash-tile-header">
                        <h3>Current Focus</h3>
                        <button className="dash-link-btn" onClick={() => goTo('projects')}>View All</button>
                    </div>

                    {activeProject ? (
                        <>
                            <div className="dash-project-state" style={{ color: getStatusColor(activeProject.status) }}>
                                <i className="fas fa-circle" /> {(activeProject.status || 'assigned').replace('_', ' ').toUpperCase()}
                            </div>
                            <h4 className="dash-focus-title">{activeProject.title}</h4>
                            <p className="dash-focus-description">
                                {activeProject.description || 'No description available for this project.'}
                            </p>
                            <button className="dash-btn dash-btn-primary" onClick={() => goTo('projects')}>
                                Continue Work <i className="fas fa-arrow-right" />
                            </button>
                        </>
                    ) : (
                        <div className="dash-empty-focus">
                            <i className="fas fa-layer-group" />
                            <p>No active projects</p>
                        </div>
                    )}
                </section>

                <section className="dash-bento-tile dash-bento-timeline dash-bento-h2" data-tone="peach">
                    <div className="dash-tile-header">
                        <h3>Progress Timeline</h3>
                        <span className="dash-status-badge pending">Activity</span>
                    </div>
                    <div className="dash-vertical-timeline">
                        {timelineEvents.map((event) => (
                            <div key={event.id} className="dash-timeline-item">
                                <div className={`dash-timeline-dot ${event.status.toLowerCase()}`} />
                                <div className="dash-timeline-content">
                                    <div className="dash-timeline-head">
                                        <strong>{event.title}</strong>
                                        <span className={`dash-status-badge ${event.status.toLowerCase()}`}>{event.status}</span>
                                    </div>
                                    <p>{event.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="dash-bento-tile dash-bento-workshops dash-bento-w2" data-tone="lavender">
                    <div className="dash-tile-header">
                        <h3>Special Workshops</h3>
                        <span className={`dash-status-badge ${workshopCount > 0 ? 'active' : 'locked'}`}>
                            {workshopCount > 0 ? 'Live' : 'Locked'}
                        </span>
                    </div>

                    {activeWorkshops.length > 0 ? (
                        <div className="dash-workshop-list">
                            {activeWorkshops.slice(0, 2).map((w) => (
                                <button
                                    key={w.id}
                                    className="dash-workshop-row"
                                    onClick={() => showWorkshopDetails(w)}
                                >
                                    {w.hero_image_url && (
                                        <div className="dash-workshop-thumb">
                                            <img src={w.hero_image_url} alt={w.title} />
                                        </div>
                                    )}
                                    <div className="dash-workshop-meta">
                                        <h4>{w.title}</h4>
                                        <p>{w.description}</p>
                                    </div>
                                    <i className="fas fa-chevron-right" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="dash-empty-focus">
                            <i className="fas fa-calendar-star" />
                            <p>No workshops available right now</p>
                        </div>
                    )}
                </section>

                <section className={`dash-bento-tile dash-bento-actions ${isLocked ? 'is-locked' : ''}`} data-tone="mint">
                    <div className="dash-tile-header">
                        <h3>Quick Actions</h3>
                        <span className={`dash-status-badge ${isLocked ? 'locked' : 'active'}`}>
                            {isLocked ? 'Locked' : 'Active'}
                        </span>
                    </div>
                    <div className="dash-actions-list">
                        <button className="dash-action-row" onClick={() => goTo('meetings')}>
                            <div className="dash-action-icon"><i className="fas fa-video" /></div>
                            <span>Join Meeting</span>
                            <i className="fas fa-chevron-right" />
                        </button>
                        <button className="dash-action-row" onClick={() => goTo('resources')}>
                            <div className="dash-action-icon"><i className="fas fa-book" /></div>
                            <span>Resources</span>
                            <i className="fas fa-chevron-right" />
                        </button>
                        <button className="dash-action-row" onClick={() => goTo('profile')}>
                            <div className="dash-action-icon"><i className="fas fa-user-edit" /></div>
                            <span>Edit Profile</span>
                            <i className="fas fa-chevron-right" />
                        </button>
                    </div>
                    {isLocked && <div className="dash-lock-overlay"><i className="fas fa-lock" /> Access after payment</div>}
                </section>

                <section className="dash-bento-tile dash-bento-tip" data-tone="cream">
                    <div className="dash-tile-header">
                        <h3>Tip of the Day</h3>
                        <span className="dash-status-badge completed">Completed</span>
                    </div>
                    <p className="dash-tip-text">
                        Update your daily status in the Team Chat to keep your mentors informed.
                    </p>
                </section>
            </div>
        </div>
    );
}
