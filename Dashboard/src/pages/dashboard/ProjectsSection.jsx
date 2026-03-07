import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

export default function ProjectsSection() {
    const { currentUser, currentProfile, currentTeam, currentProjects, setCurrentProjects, isLocked, formatDate, supabase } = useDashboard();
    const [activeTab, setActiveTab] = useState('team');
    const [customProjects, setCustomProjects] = useState([]);
    const [loadingCustom, setLoadingCustom] = useState(false);
    const [reportLinks, setReportLinks] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalProjectId, setModalProjectId] = useState(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalGithub, setModalGithub] = useState('');
    const [modalLive, setModalLive] = useState('');
    const [modalNotes, setModalNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Custom project form
    const [cpTitle, setCpTitle] = useState('');
    const [cpDesc, setCpDesc] = useState('');
    const [cpDeployedUrl, setCpDeployedUrl] = useState('');
    const [cpGithubUrl, setCpGithubUrl] = useState('');
    const [cpSubmitting, setCpSubmitting] = useState(false);

    const loadProjects = useCallback(async () => {
        if (!currentTeam) return;
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*, project_submissions(*)')
                .eq('assigned_team_id', currentTeam.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setCurrentProjects(data || []);
        } catch (err) {
            console.error('Error loading projects:', err);
        }
    }, [currentTeam, supabase, setCurrentProjects]);

    const loadCustomProjects = useCallback(async () => {
        if (!currentUser) return;
        setLoadingCustom(true);
        try {
            const { data, error } = await supabase
                .from('custom_project_submissions')
                .select('*')
                .eq('intern_id', currentUser.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setCustomProjects(data || []);
        } catch (err) {
            console.error('Error loading custom projects:', err);
        } finally {
            setLoadingCustom(false);
        }
    }, [currentUser, supabase]);

    const loadReportLinks = useCallback(async () => {
        if (!currentUser) return;
        setLoadingReports(true);
        try {
            const { data, error } = await supabase
                .from('report_submission_links')
                .select('*')
                .eq('is_enabled', true)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setReportLinks(data || []);
        } catch (err) {
            console.error('Error loading report links:', err);
        } finally {
            setLoadingReports(false);
        }
    }, [currentUser, supabase]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        if (activeTab === 'custom') loadCustomProjects();
        if (activeTab === 'reports') loadReportLinks();
    }, [activeTab, loadCustomProjects, loadReportLinks]);

    // Listen for refresh events
    useEffect(() => {
        const handler = () => { loadProjects(); if (activeTab === 'custom') loadCustomProjects(); if (activeTab === 'reports') loadReportLinks(); };
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, [loadProjects, loadCustomProjects, activeTab]);

    const openSubmitModal = (projectId) => {
        const project = currentProjects.find(p => p.id === projectId);
        setModalProjectId(projectId);
        setModalTitle(project?.title || '');
        setModalGithub('');
        setModalLive('');
        setModalNotes('');
        setShowModal(true);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        if (!currentTeam || submitting) return;
        setSubmitting(true);

        try {
            const { data: project, error: pError } = await supabase
                .from('projects').select('id').eq('assigned_team_id', currentTeam.id).single();
            if (pError || !project) throw new Error('No active project found.');

            const { error: subError } = await supabase
                .from('project_submissions')
                .upsert({
                    team_id: currentTeam.id,
                    project_id: project.id,
                    github_url: modalGithub,
                    live_url: modalLive,
                    notes: modalNotes,
                    submitted_by: currentUser.id,
                    submitted_at: new Date().toISOString()
                }, { onConflict: 'project_id,team_id' });
            if (subError) throw subError;

            await supabase.from('projects').update({ status: 'submitted' }).eq('id', project.id);

            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'success', title: 'Project Submitted!', timer: 2000, showConfirmButton: false });
            setShowModal(false);
            loadProjects();
        } catch (err) {
            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'error', title: 'Submission Failed', text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const submitCustomProject = async (e) => {
        e.preventDefault();
        if (cpSubmitting) return;
        setCpSubmitting(true);

        try {
            let deployedUrl = cpDeployedUrl.trim();
            if (deployedUrl && !deployedUrl.startsWith('http')) deployedUrl = 'https://' + deployedUrl;

            let githubUrl = cpGithubUrl.trim();
            if (githubUrl && !githubUrl.startsWith('http')) githubUrl = 'https://' + githubUrl;

            const { error } = await supabase.from('custom_project_submissions').insert({
                intern_id: currentUser.id,
                title: cpTitle.trim(),
                description: cpDesc.trim(),
                deployed_url: deployedUrl,
                github_url: githubUrl || null,
                status: 'submitted'
            });

            if (error) throw error;

            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'success', title: 'Project Submitted!', text: 'Your project is under review.', timer: 2000, showConfirmButton: false });

            setCpTitle(''); setCpDesc(''); setCpDeployedUrl(''); setCpGithubUrl('');
            loadCustomProjects();
        } catch (err) {
            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
        } finally {
            setCpSubmitting(false);
        }
    };

    const getStatusInfo = (project) => {
        const sub = project.project_submissions?.[0];
        let statusClass = 'assigned', statusText = 'Assigned', feedbackHtml = null, actionType = 'submit';

        if (project.status === 'approved' || project.status === 'completed') {
            statusClass = 'completed'; statusText = 'Completed'; actionType = 'completed';
        } else if (project.status === 'rejected') {
            statusClass = 'error'; statusText = 'Rejected'; actionType = 'rejected';
        } else if (project.status === 'changes_requested') {
            statusClass = 'warning'; statusText = 'Changes Requested'; actionType = 'resubmit';
        } else if (project.status === 'under_review') {
            statusClass = 'in_progress'; statusText = 'Under Review'; actionType = 'submitted';
        } else if (project.status === 'in_progress') {
            statusClass = 'in_progress'; statusText = 'In Progress';
        } else if (sub) {
            if (sub.status === 'approved') { statusClass = 'completed'; statusText = 'Completed'; actionType = 'completed'; }
            else if (sub.status === 'rejected') {
                statusClass = 'error'; statusText = 'Rejected'; actionType = 'resubmit';
                if (sub.feedback) feedbackHtml = { color: '#ef4444', label: 'Admin Remarks', text: sub.feedback };
            } else if (sub.status === 'changes_requested') {
                statusClass = 'warning'; statusText = 'Changes Requested'; actionType = 'resubmit';
                if (sub.feedback) feedbackHtml = { color: '#f59e0b', label: 'Admin Feedback', text: sub.feedback };
            } else { statusClass = 'in_progress'; statusText = 'Submitted (Review Pending)'; actionType = 'submitted'; }
        } else if (project.deadline && new Date(project.deadline) < new Date()) {
            statusClass = 'error'; statusText = 'Overdue';
        }

        return { statusClass, statusText, feedbackHtml, actionType, sub };
    };

    const statusColors = { assigned: '#94a3b8', in_progress: '#3b82f6', completed: '#10b981', warning: '#f59e0b', error: '#ef4444' };
    const customStatusColors = {
        submitted: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc', label: 'Pending Review' },
        reviewed: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d', label: 'Reviewed' },
        approved: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7', label: 'Approved' },
        rejected: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5', label: 'Rejected' }
    };

    return (
        <div className="dash-section-ready">
            {/* Tab Bar */}
            <div className="dash-tabs">
                <button className={`dash-tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
                    <i className="fas fa-users" /> Team Projects
                </button>
                <button className={`dash-tab ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>
                    <i className="fas fa-rocket" /> Submit Your Own
                </button>
                <button className={`dash-tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                    <i className="fas fa-file-pdf" /> Submit Your Report
                </button>
            </div>

            {/* Team Projects Tab */}
            {activeTab === 'team' && (
                <div className="dash-projects-grid">
                    {!currentTeam ? (
                        <div className="dash-empty" style={{ gridColumn: '1/-1' }}>
                            <i className="fas fa-users-slash" />
                            <h3>No Team Assigned</h3>
                            <p>You haven't been assigned to a team yet. Teams are usually assigned within 24-48 hours of joining.</p>
                        </div>
                    ) : currentProjects.length === 0 ? (
                        <div className="dash-empty" style={{ gridColumn: '1/-1' }}>
                            <i className="fas fa-folder-open" />
                            <h3>No Projects Assigned</h3>
                            <p>Your mentor will assign a project to you soon.</p>
                        </div>
                    ) : currentProjects.map(project => {
                        const { statusClass, statusText, feedbackHtml, actionType, sub } = getStatusInfo(project);
                        return (
                            <div key={project.id} className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="dash-status-badge" style={{
                                    background: `${statusColors[statusClass] || '#94a3b8'}20`,
                                    color: statusColors[statusClass] || '#94a3b8',
                                    border: `1px solid ${statusColors[statusClass] || '#94a3b8'}30`,
                                    marginBottom: '0.75rem', alignSelf: 'flex-start'
                                }}>{statusText}</span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{project.title}</h3>
                                <p style={{ color: 'var(--dash-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{project.description}</p>
                                {project.deadline && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)', marginBottom: '1rem' }}>
                                        <i className="fas fa-clock" /> Due: {formatDate(project.deadline)}
                                    </div>
                                )}
                                {feedbackHtml && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: `${feedbackHtml.color}15`, borderLeft: `3px solid ${feedbackHtml.color}`, borderRadius: 4 }}>
                                        <div style={{ color: feedbackHtml.color, fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{feedbackHtml.label}:</div>
                                        <div style={{ color: 'var(--dash-text-secondary)', fontSize: '0.85rem' }}>{feedbackHtml.text}</div>
                                    </div>
                                )}
                                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                    {actionType === 'submit' && (
                                        <button className="dash-btn dash-btn-primary" onClick={() => openSubmitModal(project.id)}>Submit Project</button>
                                    )}
                                    {actionType === 'resubmit' && (
                                        <button className="dash-btn dash-btn-primary" style={{ background: '#f59e0b' }} onClick={() => openSubmitModal(project.id)}>Resubmit Project</button>
                                    )}
                                    {actionType === 'completed' && (
                                        <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}><i className="fas fa-check-circle" /> Completed</div>
                                    )}
                                    {actionType === 'rejected' && (
                                        <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}><i className="fas fa-times-circle" /> Rejected</div>
                                    )}
                                    {actionType === 'submitted' && sub && (
                                        <div style={{ color: 'var(--dash-text-secondary)', fontSize: '0.9rem' }}>Submitted on {formatDate(sub.created_at)}</div>
                                    )}
                                </div>
                                {sub?.github_url && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                        <a href={sub.github_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dash-accent)' }}>
                                            <i className="fab fa-github" /> View Submission
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Custom Projects Tab */}
            {activeTab === 'custom' && (
                <>
                    {/* Submission Form */}
                    <div className="dash-card" style={{ marginBottom: '2rem', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-paper-plane" style={{ color: 'var(--dash-accent)', fontSize: '1.1rem' }} />
                            </div>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1.15rem', margin: 0 }}>Submit a Custom Project</h3>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem', margin: 0 }}>Projects personally assigned to you by mentors or admins</p>
                            </div>
                        </div>

                        <form onSubmit={submitCustomProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label className="dash-label">Project Title <span style={{ color: '#ef4444' }}>*</span></label>
                                <input className="dash-input" required value={cpTitle} onChange={e => setCpTitle(e.target.value)} placeholder="e.g. E-commerce Dashboard" />
                            </div>
                            <div>
                                <label className="dash-label">Purpose / Description <span style={{ color: '#ef4444' }}>*</span></label>
                                <textarea className="dash-input dash-textarea" required value={cpDesc} onChange={e => setCpDesc(e.target.value)} placeholder="Describe the project..." rows={4} />
                            </div>
                            <div>
                                <label className="dash-label">Project Deployed Link <span style={{ color: '#ef4444' }}>*</span></label>
                                <input className="dash-input" required value={cpDeployedUrl} onChange={e => setCpDeployedUrl(e.target.value)} placeholder="your-project.vercel.app" />
                            </div>
                            <div>
                                <label className="dash-label">GitHub Repository Link <span style={{ color: 'var(--dash-text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                <input className="dash-input" value={cpGithubUrl} onChange={e => setCpGithubUrl(e.target.value)} placeholder="github.com/username/repo" />
                            </div>
                            <button type="submit" className="dash-btn dash-btn-primary" style={{ alignSelf: 'flex-start' }} disabled={cpSubmitting}>
                                {cpSubmitting ? <><i className="fas fa-spinner fa-spin" /> Submitting...</> : <><i className="fas fa-paper-plane" /> Submit Project</>}
                            </button>
                        </form>
                    </div>

                    {/* Custom Submissions History */}
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-history" style={{ color: 'var(--dash-accent)' }} /> Your Submissions
                    </h3>
                    {customProjects.length === 0 ? (
                        <div className="dash-empty">
                            <i className="fas fa-folder-open" />
                            <h3>No Submissions Yet</h3>
                            <p>Submit your first custom project using the form above.</p>
                        </div>
                    ) : customProjects.map(p => {
                        const s = customStatusColors[p.status] || customStatusColors.submitted;
                        return (
                            <div key={p.id} className="dash-card" style={{ marginBottom: '1rem', borderLeft: `3px solid ${s.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <h4 style={{ color: 'white', fontSize: '1rem', margin: 0 }}>{p.title}</h4>
                                    <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
                                </div>
                                <p style={{ color: 'var(--dash-text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                                    {p.description?.length > 150 ? p.description.substring(0, 150) + '...' : p.description}
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                                    <a href={p.deployed_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dash-accent)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <i className="fas fa-globe" /> Live Demo
                                    </a>
                                    {p.github_url && (
                                        <a href={p.github_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dash-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <i className="fab fa-github" /> GitHub
                                        </a>
                                    )}
                                    <span style={{ color: 'var(--dash-text-muted)', marginLeft: 'auto' }}>
                                        <i className="far fa-calendar-alt" /> {formatDate(p.created_at)}
                                    </span>
                                </div>
                                {p.admin_notes && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `2px solid ${s.border}` }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)', marginBottom: 4 }}>Admin Feedback</div>
                                        <p style={{ color: 'var(--dash-text-secondary)', fontSize: '0.85rem', margin: 0 }}>{p.admin_notes}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </>
            )}

            {/* Submit Your Report Tab */}
            {activeTab === 'reports' && (
                <div>
                    {/* Header */}
                    <div className="dash-card" style={{ marginBottom: '2rem', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.5rem' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(249,115,22,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-file-pdf" style={{ color: '#f87171', fontSize: '1.1rem' }} />
                            </div>
                            <div>
                                <h3 style={{ color: 'white', fontSize: '1.15rem', margin: 0 }}>Submit Your Report</h3>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem', margin: 0 }}>Submit project reports via the forms provided by your admin</p>
                            </div>
                        </div>
                    </div>

                    {/* Report Links */}
                    {loadingReports ? (
                        <div className="dash-empty">
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                            <h3>Loading report links...</h3>
                        </div>
                    ) : reportLinks.length === 0 ? (
                        <div className="dash-empty">
                            <i className="fas fa-file-circle-xmark" />
                            <h3>No Report Links Available</h3>
                            <p>Your admin hasn't published any report submission links yet. Check back later!</p>
                        </div>
                    ) : (
                        <div className="dash-projects-grid">
                            {reportLinks.map(link => (
                                <div key={link.id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', borderLeft: '3px solid #f87171' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <i className="fas fa-file-alt" style={{ color: '#f87171', fontSize: '0.95rem' }} />
                                            </div>
                                            <h4 style={{ color: 'white', fontSize: '1.05rem', margin: 0, fontWeight: 600 }}>{link.title}</h4>
                                        </div>
                                        <span style={{
                                            background: link.target_type === 'all' ? 'rgba(16,185,129,0.1)' : link.target_type === 'batch' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                                            color: link.target_type === 'all' ? '#6ee7b7' : link.target_type === 'batch' ? '#fcd34d' : '#a5b4fc',
                                            border: `1px solid ${link.target_type === 'all' ? 'rgba(16,185,129,0.3)' : link.target_type === 'batch' ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.3)'}`,
                                            padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap'
                                        }}>
                                            {link.target_type === 'all' ? 'Everyone' : link.target_type === 'batch' ? 'Your Batch' : 'You Only'}
                                        </span>
                                    </div>
                                    {link.description && (
                                        <p style={{ color: 'var(--dash-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                                            {link.description}
                                        </p>
                                    )}
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                        <a
                                            href={link.form_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="dash-btn dash-btn-primary"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #ef4444, #f97316)', textDecoration: 'none' }}
                                        >
                                            <i className="fas fa-external-link-alt" /> Open Form
                                        </a>
                                    </div>
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>
                                        <i className="far fa-calendar-alt" style={{ marginRight: 4 }} />
                                        Added {formatDate(link.created_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Submit Modal */}
            {showModal && (
                <div className="dash-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="dash-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Submit Project</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--dash-text-secondary)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleModalSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="dash-label">Project Title</label>
                                <input className="dash-input" value={modalTitle} readOnly style={{ cursor: 'not-allowed' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="dash-label">GitHub Repository URL <span style={{ color: '#ef4444' }}>*</span></label>
                                <input className="dash-input" required value={modalGithub} onChange={e => setModalGithub(e.target.value)} placeholder="https://github.com/username/repo" />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="dash-label">Live Demo URL (Optional)</label>
                                <input className="dash-input" value={modalLive} onChange={e => setModalLive(e.target.value)} placeholder="https://gkkintern.site" />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="dash-label">Notes / Comments</label>
                                <textarea className="dash-input dash-textarea" value={modalNotes} onChange={e => setModalNotes(e.target.value)} rows={3} placeholder="Any details for the reviewer..." />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="dash-btn dash-btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="dash-btn dash-btn-primary" disabled={submitting} style={{ flex: 1 }}>
                                    {submitting ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : <><i className="fas fa-paper-plane" /> Submit</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
