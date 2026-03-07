import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../contexts/DashboardContext';

export default function ProfileSection() {
    const { currentUser, currentProfile, currentTeam, setCurrentProfile, isLocked, getProxiedUrl, calculateLevel, supabase } = useDashboard();
    const navigate = useNavigate();

    const [linkedIn, setLinkedIn] = useState(currentProfile?.social_links?.linkedin || '');
    const [bio, setBio] = useState(currentProfile?.bio || '');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error'

    const name = currentProfile?.full_name || currentProfile?.email?.split('@')[0] || 'Intern';
    const initial = name[0]?.toUpperCase() || 'I';
    const isPaid = !isLocked;
    const xp = currentProfile?.xp || 0;
    const level = calculateLevel(xp);
    const streak = currentProfile?.current_streak || 0;
    const title = currentProfile?.title || 'Intern';
    const phone = currentProfile?.phone || 'Not set';
    const college = currentProfile?.college || 'Not set';
    const batchName = currentTeam?.batches?.name || 'Not assigned';

    useEffect(() => {
        const handler = () => {
            window.location.reload(); // fallback: reload page to refresh profile
        };
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveStatus(null);

        try {
            const updates = {
                bio,
                social_links: { ...currentProfile?.social_links, linkedin: linkedIn }
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', currentProfile.id);

            if (error) throw error;

            setCurrentProfile(prev => ({ ...prev, bio, social_links: updates.social_links }));
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            console.error('Error saving profile:', err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 2000);
        } finally {
            setSaving(false);
        }
    };

    const uploadAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'error', title: 'Invalid File', text: 'Please select JPEG, PNG, GIF, or WEBP.' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'error', title: 'File too large', text: 'Please upload under 2MB.' });
            return;
        }

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', currentUser.id);
            if (updateError) throw updateError;

            setCurrentProfile(prev => ({ ...prev, avatar_url: publicUrl }));

            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'success', title: 'Profile Updated', text: 'Avatar uploaded successfully.', timer: 2000, showConfirmButton: false });
        } catch (err) {
            console.error('Avatar upload error:', err);
            const Swal = (await import('sweetalert2')).default;
            Swal.fire({ icon: 'error', title: 'Upload Failed', text: err.message || 'Could not upload image.' });
        }
    };

    return (
        <div className="dash-section-ready">
            {/* Profile Header */}
            <div className="dash-profile-header">
                <div className="dash-profile-avatar">
                    {currentProfile?.avatar_url
                        ? <img src={getProxiedUrl(currentProfile.avatar_url)} alt="Profile" />
                        : <div className="dash-profile-avatar-placeholder">{initial}</div>}
                    <label className="dash-avatar-edit" title="Change Profile Picture">
                        <i className="fas fa-camera" />
                        <input type="file" hidden accept="image/*" onChange={uploadAvatar} />
                    </label>
                </div>
                <h2 style={{ color: 'white', marginBottom: '0.25rem' }}>{name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>{title}</p>
                <div>
                    {isPaid ? (
                        <span style={{ background: '#d1fae5', color: '#065f46', padding: '5px 12px', borderRadius: 15, fontSize: '0.85rem' }}>
                            <i className="fas fa-check-circle" style={{ marginRight: 4 }} /> Active Intern
                        </span>
                    ) : (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '5px 12px', borderRadius: 15, fontSize: '0.85rem' }}>
                            <i className="fas fa-clock" style={{ marginRight: 4 }} /> Pending Payment
                        </span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="dash-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--dash-accent)' }}>{xp}</div>
                    <div style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem' }}>Total XP</div>
                </div>
                <div className="dash-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>{level}</div>
                    <div style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem' }}>Level</div>
                </div>
                <div className="dash-card" style={{ textAlign: 'center', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
                        <i className="fas fa-layer-group" style={{ marginRight: 6 }} />
                        {batchName === 'Not assigned' ? 'None' : batchName.replace('BATCH ', '')}
                    </div>
                    <div style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem' }}>Batch</div>
                </div>
                <div className="dash-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f97316' }}>
                        <i className="fas fa-fire" style={{ fontSize: '1.5rem' }} /> {streak}
                    </div>
                    <div style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem' }}>Day Streak</div>
                </div>
                <div className="dash-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: isPaid ? '#10b981' : '#f59e0b' }}>
                        <i className={`fas fa-${isPaid ? 'check-circle' : 'exclamation-circle'}`} />
                    </div>
                    <div style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem' }}>{isPaid ? 'Paid' : 'Pending'}</div>
                </div>
            </div>

            {/* Personal Info Form */}
            <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-user-circle" style={{ color: 'var(--dash-accent)' }} /> Personal Information
                </h3>
                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        <div>
                            <label className="dash-label">Full Name</label>
                            <input className="dash-input" value={name} disabled />
                        </div>
                        <div>
                            <label className="dash-label">Email <span style={{ color: 'var(--dash-text-muted)', fontSize: '0.8rem' }}>(cannot be changed)</span></label>
                            <input className="dash-input" value={currentProfile?.email || ''} disabled />
                        </div>
                        <div>
                            <label className="dash-label">Phone Number</label>
                            <input className="dash-input" value={phone} disabled />
                        </div>
                        <div>
                            <label className="dash-label"><i className="fab fa-linkedin" style={{ color: '#0077b5', marginRight: 4 }} />LinkedIn Profile</label>
                            <input className="dash-input" value={linkedIn} onChange={e => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
                        </div>
                        <div>
                            <label className="dash-label">Title / Role</label>
                            <input className="dash-input" value={title} disabled />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="dash-label">Bio</label>
                            <textarea className="dash-input dash-textarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            className="dash-btn dash-btn-primary"
                            disabled={saving}
                            style={saveStatus === 'success' ? { background: '#10b981' } : saveStatus === 'error' ? { background: '#ef4444' } : {}}
                        >
                            {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</>
                                : saveStatus === 'success' ? <><i className="fas fa-check" /> Saved!</>
                                    : saveStatus === 'error' ? <><i className="fas fa-times" /> Error</>
                                        : <><i className="fas fa-save" /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Payment Info */}
            <div className="dash-card">
                <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="fas fa-credit-card" style={{ color: 'var(--dash-accent)' }} /> Payment Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Status</p>
                        <p style={{ fontWeight: 600, color: isPaid ? '#10b981' : '#f59e0b' }}>
                            <i className={`fas fa-${isPaid ? 'check-circle' : 'clock'}`} /> {isPaid ? 'Payment Completed' : 'Payment Pending'}
                        </p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Amount</p>
                        <p style={{ fontWeight: 600 }}>₹509.29</p>
                    </div>
                    {!isPaid && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <button className="dash-btn dash-btn-primary" onClick={() => navigate('/user/dashboard/payment')} style={{ marginTop: '0.5rem' }}>
                                <i className="fas fa-credit-card" /> Complete Payment
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
