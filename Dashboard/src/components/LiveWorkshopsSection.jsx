import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLazySection } from '../hooks/useLazySection';

export default function LiveWorkshopsSection() {
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(true);
    const sectionRef = useLazySection();

    useEffect(() => {
        async function fetchWorkshops() {
            try {
                const { data, error } = await supabase
                    .from('workshops')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setWorkshops(data || []);
            } catch (err) {
                console.error('Error fetching workshops:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchWorkshops();
    }, []);

    const showWorkshopDetails = async (w) => {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire({
            title: `<h2 style="color:white; margin:0; font-size:1.8rem; text-transform:uppercase; letter-spacing:2px; font-family: 'Outfit', sans-serif; font-weight:800; background: linear-gradient(to right, #fff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${w.title}</h2>`,
            html: `
                <div style="text-align:left; color: #e2e8f0; font-family: 'Inter', sans-serif; position:relative;">
                    ${w.hero_image_url ? `
                        <div style="margin-bottom:1.5rem; border-radius:16px; overflow:hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.3); height: 240px;">
                            <img src="${w.hero_image_url}" style="width:100%; height:100%; object-fit:cover; display:block;">
                        </div>
                    ` : ''}
                    
                    <div style="display:flex; gap:10px; margin-bottom:1.5rem; flex-wrap:wrap;">
                        <span style="background:rgba(99,102,241,0.2); color:#a5b4fc; padding:5px 12px; border-radius:30px; font-size:0.75rem; font-weight:700; border:1px solid rgba(99,102,241,0.3); display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-bolt" style="font-size:0.65rem;"></i> LIVE SESSION
                        </span>
                        ${w.instructor_name ? `
                        <span style="background:rgba(16,185,129,0.15); color:#34d399; padding:5px 12px; border-radius:30px; font-size:0.75rem; font-weight:700; border:1px solid rgba(16,185,129,0.2); display:flex; align-items:center; gap:6px;">
                            <i class="fas fa-user-tie" style="font-size:0.65rem;"></i> ${w.instructor_name}
                        </span>
                        ` : ''}
                    </div>

                    <p style="font-size:1rem; line-height:1.7; margin-bottom:1.5rem; color:#94a3b8; font-weight:400;">${w.description}</p>
                    
                    ${(w.session_date || w.session_time) ? `
                    <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(10px); display:grid; grid-template-columns: ${w.session_date && w.session_time ? '1fr 1fr' : '1fr'}; gap:15px;">
                        ${w.session_date ? `
                        <div>
                            <div style="font-size:0.7rem; color:#6366f1; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Date</div>
                            <div style="font-size:0.95rem; font-weight:600; color:white;">${w.session_date}</div>
                        </div>
                        ` : ''}
                        ${w.session_time ? `
                        <div>
                            <div style="font-size:0.7rem; color:#6366f1; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Time</div>
                            <div style="font-size:0.95rem; font-weight:600; color:white;">${w.session_time}</div>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>
            `,
            background: '#0f172a',
            color: '#f8fafc',
            showConfirmButton: !!w.cta_link,
            confirmButtonText: w.cta_text || 'Join Workshop',
            confirmButtonColor: '#6366f1',
            showCloseButton: true,
            width: window.innerWidth > 768 ? '640px' : '95%',
            padding: window.innerWidth > 768 ? '2.5rem' : '1.5rem',
            customClass: {
                container: 'workshop-swal-container',
                popup: 'premium-swal-popup'
            }
        }).then((result) => {
            if (result.isConfirmed && w.cta_link) {
                window.open(w.cta_link, '_blank');
            }
        });
    };

    if (loading || workshops.length === 0) return null;

    const isMobile = window.innerWidth < 768;

    return (
        <section 
            ref={sectionRef} 
            className="section lazy-section visible" 
            id="live-workshops"
            style={{ backgroundColor: 'var(--bg-body)', padding: isMobile ? '3rem 0' : '4rem 0' }}
        >
            <div className="container">
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    marginBottom: '2.5rem',
                    gap: isMobile ? '10px' : '0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="dash-live-pulse" />
                        <h2 style={{ margin: 0, fontSize: isMobile ? '1.8rem' : '2.2rem', letterSpacing: '-0.5px' }}>Live Workshops</h2>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-body)', fontWeight: 500, fontSize: '0.9rem' }}>
                        {workshops.length} Active Sessions
                    </p>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr))', gap: '2rem' }}>
                    {workshops.map(w => (
                        <div 
                            key={w.id} 
                            className="dash-card dash-workshop-card" 
                            onClick={() => showWorkshopDetails(w)}
                            style={{ 
                                cursor: 'pointer', 
                                padding: '0', 
                                overflow: 'hidden', 
                                display: 'flex', 
                                flexDirection: isMobile ? 'column' : 'row',
                                height: isMobile ? 'auto' : '200px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg-subtle)'
                            }}
                        >
                            {w.hero_image_url && (
                                <div style={{ width: isMobile ? '100%' : '40%', height: isMobile ? '180px' : '100%', flexShrink: 0 }}>
                                    <img src={w.hero_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div style={{ flex: 1, padding: isMobile ? '1.5rem' : '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 700 }}>{w.title}</h3>
                                {w.instructor_name && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '6px' }}>
                                        BY {w.instructor_name.toUpperCase()}
                                    </div>
                                )}
                                <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-body)', display: '-webkit-box', WebkitLineClamp: isMobile ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                                    {w.description}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-muted)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                                    {w.session_date && <span style={{ whiteSpace: 'nowrap' }}><i className="fas fa-calendar-alt" style={{ marginRight: '5px' }} /> {w.session_date}</span>}
                                    {w.session_time && <span style={{ whiteSpace: 'nowrap' }}><i className="fas fa-clock" style={{ marginRight: '5px' }} /> {w.session_time}</span>}
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                                    JOIN WORKSHOP <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
