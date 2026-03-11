import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import Swal from 'sweetalert2';

export default function WorkshopsSection() {
    const { supabase, currentUser, currentProfile } = useDashboard();
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWorkshop, setEditingWorkshop] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        hero_image_url: '',
        cta_link: '',
        cta_text: 'Learn More',
        is_active: false,
        timer_duration: 5,
        instructor_name: '',
        session_date: '',
        session_time: ''
    });

    const isMasterAdmin = currentUser?.email === 'noreplay.gkk26@gmail.com';

    const loadWorkshops = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workshops')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setWorkshops(data || []);
        } catch (err) {
            console.error('Error loading workshops:', err);
            Swal.fire('Error', 'Failed to load workshops', 'error');
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadWorkshops();
    }, [loadWorkshops]);

    const handleEdit = (w) => {
        setEditingWorkshop(w);
        setFormData({
            title: w.title,
            description: w.description || '',
            hero_image_url: w.hero_image_url || '',
            cta_link: w.cta_link || '',
            cta_text: w.cta_text || 'Learn More',
            is_active: w.is_active,
            timer_duration: w.timer_duration || 5,
            instructor_name: w.instructor_name || '',
            session_date: w.session_date || '',
            session_time: w.session_time || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#3b82f6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const { error } = await supabase.from('workshops').delete().eq('id', id);
                if (error) throw error;
                Swal.fire('Deleted!', 'Workshop has been deleted.', 'success');
                loadWorkshops();
            } catch (err) {
                Swal.fire('Error', 'Failed to delete workshop', 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        if (!formData.title || !formData.description) {
            Swal.fire({
                title: 'Error',
                text: 'Title and Description are mandatory!',
                icon: 'error',
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#6366f1',
            });
            setSaving(false);
            return;
        }

        try {
            if (editingWorkshop) {
                const { error } = await supabase
                    .from('workshops')
                    .update(formData)
                    .eq('id', editingWorkshop.id);
                if (error) throw error;
                Swal.fire('Success', 'Workshop updated successfully', 'success');
            } else {
                const { error } = await supabase
                    .from('workshops')
                    .insert([{ ...formData, created_by: currentProfile.id }]);
                if (error) throw error;
                Swal.fire('Success', 'Workshop created successfully', 'success');
            }
            setShowForm(false);
            setEditingWorkshop(null);
            setFormData({
                title: '',
                description: '',
                hero_image_url: '',
                cta_link: '',
                cta_text: 'Learn More',
                is_active: false,
                timer_duration: 5,
                instructor_name: '',
                session_date: '',
                session_time: ''
            });
            loadWorkshops();
        } catch (err) {
            Swal.fire('Error', 'Failed to save workshop', 'error');
        }
    };

    if (!isMasterAdmin) {
        return (
            <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fas fa-lock" style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }} />
                <h3>Access Denied</h3>
                <p>You do not have permission to access workshop management.</p>
            </div>
        );
    }

    return (
        <div className="dash-section-ready">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Workshop Management</h2>
                    <p style={{ color: 'var(--dash-text-secondary)', margin: '0.25rem 0 0' }}>Manage landing page workshop popups</p>
                </div>
                {!showForm && (
                    <button className="dash-btn dash-btn-primary" onClick={() => setShowForm(true)}>
                        <i className="fas fa-plus" style={{ marginRight: 8 }} /> Create Workshop
                    </button>
                )}
            </div>

            {showForm ? (
                <div className="dash-card">
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>Workshop Title</label>
                                <input
                                    type="text"
                                    required
                                    className="dash-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>Hero Image URL</label>
                                <input
                                    type="url"
                                    className="dash-input"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.hero_image_url}
                                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>Description</label>
                            <textarea
                                className="dash-input"
                                rows="3"
                                style={{ minHeight: '100px' }}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>Instructor Name</label>
                                <input
                                    type="text"
                                    className="dash-input"
                                    placeholder="e.g. John Doe"
                                    value={formData.instructor_name}
                                    onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>Session Date</label>
                                <input
                                    type="text"
                                    className="dash-input"
                                    placeholder="e.g. Sunday, Oct 24"
                                    value={formData.session_date}
                                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>Session Time</label>
                                <input
                                    type="text"
                                    className="dash-input"
                                    placeholder="e.g. 5:00 PM IST"
                                    value={formData.session_time}
                                    onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>CTA Link</label>
                                <input
                                    type="url"
                                    className="dash-input"
                                    placeholder="https://example.com/apply"
                                    value={formData.cta_link}
                                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>CTA Button Text</label>
                                <input
                                    type="text"
                                    className="dash-input"
                                    value={formData.cta_text}
                                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--dash-text-secondary)' }}>Lock Duration (sec)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="dash-input"
                                    value={formData.timer_duration}
                                    onChange={(e) => setFormData({ ...formData, timer_duration: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <span style={{ color: 'var(--dash-text-primary)' }}>Set as Active (Visible on landing page)</span>
                            </label>
                        </div>

                        {formData.hero_image_url && (
                            <div style={{ marginTop: '1rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--dash-text-secondary)', marginBottom: '0.5rem' }}>Image Preview:</p>
                                <img 
                                    src={formData.hero_image_url} 
                                    alt="Preview" 
                                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className="dash-btn dash-btn-primary">
                                {editingWorkshop ? 'Update Workshop' : 'Create Workshop'}
                            </button>
                            <button type="button" className="dash-btn dash-btn-secondary" onClick={() => { setShowForm(false); setEditingWorkshop(null); }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {loading ? (
                        <p>Loading workshops...</p>
                    ) : workshops.length === 0 ? (
                        <div className="dash-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                            <i className="fas fa-calendar-times" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                            <p>No workshops found. Create your first one!</p>
                        </div>
                    ) : (
                        workshops.map(w => (
                            <div key={w.id} className="dash-card" style={{ borderTop: w.is_active ? '4px solid #10b981' : '4px solid #4b5563' }}>
                                {w.hero_image_url && (
                                    <div style={{ height: '140px', margin: '-1rem -1rem 1rem -1rem', overflow: 'hidden', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                                        <img src={w.hero_image_url} alt={w.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{w.title}</h3>
                                    <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        background: w.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(75,85,99,0.1)',
                                        color: w.is_active ? '#10b981' : '#9ca3af'
                                    }}>
                                        {w.is_active ? 'Active' : 'Draft'}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--dash-text-secondary)', margin: '1rem 0 0.5rem' }}>{w.description?.substring(0, 80)}{w.description?.length > 80 ? '...' : ''}</p>
                                
                                {w.instructor_name && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--dash-accent)', fontWeight: 600, marginBottom: '0.25rem' }}>
                                        <i className="fas fa-user-tie" style={{ marginRight: 6 }} /> {w.instructor_name}
                                    </div>
                                )}
                                {(w.session_date || w.session_time) && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', marginBottom: '1rem' }}>
                                        <i className="fas fa-clock" style={{ marginRight: 6 }} /> {w.session_date} {w.session_time && `@ ${w.session_time}`}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                                    <button className="dash-btn dash-btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => handleEdit(w)}>
                                        <i className="fas fa-edit" /> Edit
                                    </button>
                                    <button className="dash-btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', flex: 1, padding: '0.5rem' }} onClick={() => handleDelete(w.id)}>
                                        <i className="fas fa-trash" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
