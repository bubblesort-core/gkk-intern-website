import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import UseAnimations from 'react-useanimations';
import loading from 'react-useanimations/lib/loading';
import alertCircle from 'react-useanimations/lib/alertCircle';
import checkmark from 'react-useanimations/lib/checkmark';
import heart from 'react-useanimations/lib/heart';
import star from 'react-useanimations/lib/star';
import activity from 'react-useanimations/lib/activity';
import arrowLeftCircle from 'react-useanimations/lib/arrowLeftCircle';
import lock from 'react-useanimations/lib/lock';
import github from 'react-useanimations/lib/github';
import link from 'react-useanimations/lib/maximizeMinimize2'; // Using as a generic link icon

// Helper to determine Level based on Streak
const calculateLevel = (streak) => {
    if (!streak || streak <= 0) return 1;
    // Level up every 5 days of streak to match dashboard logic
    return 1 + Math.floor(streak / 5);
};

export default function InternProfile() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loadingState, setLoadingState] = useState(true);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (!token) {
            setError('No token provided');
            setLoadingState(false);
            return;
        }

        async function fetchProfile() {
            try {
                // 1. Validate Token & Get Application ID
                const { data: tokenData, error: tokenError } = await supabase
                    .from('intern_qr_tokens')
                    .select('application_id, is_active, id_card_url')
                    .eq('token', token)
                    .single();

                if (tokenError || !tokenData) throw new Error('Invalid or expired token');
                if (!tokenData.is_active) throw new Error('This QR code has been deactivated');

                // 2. Get Application Email
                const { data: appData, error: appError } = await supabase
                    .from('applications')
                    .select('email, full_name')
                    .eq('id', tokenData.application_id)
                    .single();

                if (appError || !appData) throw new Error('Application data not found');

                // 3. Get Profile Data
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('email', appData.email)
                    .single();

                if (profileError) throw new Error('Profile not found');

                // 4. Get Project Submissions
                const { data: submissionsData, error: submissionsError } = await supabase
                    .from('project_submissions')
                    .select('*, projects(title, description, tech_stack)')
                    .eq('submitted_by', profileData.id);
                // .eq('status', 'approved'); // Showing all for verification

                // Transform submissions to match UI expectation
                const formattedProjects = (submissionsData || []).map(sub => ({
                    title: sub.projects?.title || 'Untitled Project',
                    description: sub.projects?.description || sub.description || 'No description',
                    link: sub.live_url || sub.github_url,
                    status: sub.status
                }));

                if (profileData) {
                    setProfile({
                        ...profileData,
                        id_card_url: tokenData.id_card_url,
                        application_name: appData.full_name,
                        projects: formattedProjects
                    });
                } else {
                    throw new Error('Intern profile not initialized');
                }

            } catch (err) {
                console.error('Profile fetch error:', err);
                if (err.message.includes('JSON')) setError('Connection error. Please try again.');
                else setError(err.message || 'Failed to load profile');
            } finally {
                setTimeout(() => setLoadingState(false), 800);
            }
        }

        fetchProfile();
    }, [token]);

    // --- Loading State ---
    if (loadingState) {
        return (
            <div style={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                background: 'var(--bg-body)',
                color: 'var(--text-main)',
                padding: '1rem'
            }}>
                {/* Animating logos */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', opacity: 1 }}>
                    <img src="/assets/gkk-intern-logo.png" alt="GKK" style={{ height: '48px', objectFit: 'contain' }} />
                    <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                    <img src="/assets/bubblesort-logo.png" alt="Bubblesort" style={{ height: '42px', objectFit: 'contain', filter: 'grayscale(0%) opacity(1)' }} />
                </div>

                <div style={{ transform: 'scale(1.5)', margin: '1rem 0' }}>
                    <UseAnimations animation={loading} size={56} strokeColor="var(--primary)" />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>Verifying Identity</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Securely fetching intern profile...</p>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: '2rem', textAlign: 'center', background: 'var(--bg-body)', color: 'var(--text-main)' }}>
                <div style={{ color: 'var(--error)', marginBottom: '1.5rem', transform: 'scale(1.5)' }}>
                    <UseAnimations animation={alertCircle} size={64} strokeColor="currentColor" />
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Verification Failed</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px' }}>
                    {error}. If you believe this is a mistake, please contact support.
                </p>
                <Link to="/" className="pro-btn pro-btn-primary">
                    Return to Home
                </Link>
            </div>
        );
    }

    // --- Success State ---
    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-body)',
            paddingBottom: '4rem',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Header Logos */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid var(--border)',
                backdropFilter: 'blur(10px)'
            }}>
                    <img src="/assets/gkk-intern-logo.png" alt="GKK" style={{ height: '48px', objectFit: 'contain' }} />
                <div style={{ width: '1px', height: '32px', background: 'var(--border)' }}></div>
                <img src="/assets/bubblesort-logo.png" alt="Bubblesort" style={{ height: '42px', objectFit: 'contain', filter: 'grayscale(0%) opacity(1)' }} />
            </div>

            <div className="container" style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>

                {/* Profile Card */}
                <div className="card-premium" style={{ overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.08)' }}>

                    {/* Verified Badge */}
                    <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 10,
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: '#fff',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '99px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}>
                        <UseAnimations animation={checkmark} size={20} strokeColor="#fff" autoplay={true} loop={true} />
                        VERIFIED
                    </div>

                    {/* Image Area */}
                    <div style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '3rem 1rem',
                        position: 'relative'
                    }}>
                        <div style={{ position: 'absolute', top: '20%', left: '20%', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>

                        {profile.id_card_url ? (
                            <img
                                src={profile.id_card_url}
                                alt="ID Card"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '250px',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                                    transform: 'rotate(-2deg)'
                                }}
                            />
                        ) : (
                            <div className="avatar-lg" style={{ width: '120px', height: '120px', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: 'var(--text-muted)' }}>
                                        {profile.full_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Info Area */}
                    <div style={{ padding: '2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                {profile.full_name || profile.application_name || 'GKK Intern'}
                            </h1>
                            {(profile.role || profile.title || 'Intern') && (
                                <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                    {profile.role || profile.title || 'Intern'}
                                </p>
                            )}
                            <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                GKK INTERN • LEVEL {calculateLevel(profile.current_streak)}
                            </p>
                        </div>

                        {/* Bio */}
                        {profile.bio ? (
                            <div style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                "{profile.bio}"
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                No bio available
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div className="stat-card" style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem', color: 'var(--primary)' }}>
                                    <UseAnimations animation={star} size={28} strokeColor="currentColor" autoplay={true} loop={true} />
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{calculateLevel(profile.current_streak)}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Level</div>
                            </div>
                            <div className="stat-card" style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem', color: '#f59e0b' }}>
                                    <UseAnimations animation={activity} size={28} strokeColor="currentColor" autoplay={true} loop={true} />
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{profile.current_streak || 0}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Day Streak</div>
                            </div>
                            <div className="stat-card" style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem', color: '#ec4899' }}>
                                    <UseAnimations animation={heart} size={28} strokeColor="currentColor" autoplay={true} loop={true} />
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Active</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                            </div>
                        </div>

                        {/* Projects Section */}
                        {profile.projects && profile.projects.length > 0 ? (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Featured Projects</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {profile.projects.map((project, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{project.title}</h4>
                                                {project.link && (
                                                    <a href={project.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex' }}>
                                                        <UseAnimations animation={link} size={20} strokeColor="currentColor" autoplay={true} loop={true} />
                                                    </a>
                                                )}
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                                                {project.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '2rem', textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No projects showcased yet.</p>
                            </div>
                        )}

                        {/* Details List */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Member Since</span>
                                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Organization</span>
                                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>GKK INTERN</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <Link to="/" className="magnetic-btn" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '2rem',
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                }}>
                    <UseAnimations animation={arrowLeftCircle} size={24} strokeColor="currentColor" autoplay={true} loop={true} />
                    <span>Back to Home</span>
                </Link>

                {/* Trust & Compliance Footer */}
                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1rem' }}>Trust & Compliance</p>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <UseAnimations animation={lock} size={20} strokeColor="#94a3b8" autoplay={true} loop={true} />
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>SSL Secured</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <UseAnimations animation={checkmark} size={20} strokeColor="#94a3b8" autoplay={true} loop={true} />
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>ISO Certified</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <img src="/assets/gkk-intern-logo.png" alt="GKK" style={{ height: '16px', filter: 'grayscale(100%) opacity(0.6)' }} />
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Official Verification</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                        UID: {token ? `${token.substring(0, 8)}...` : 'N/A'} • Generated by GKK Platform
                    </div>
                </div>

            </div>
        </div>
    );
}
