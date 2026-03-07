import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { ResourcesSkeleton } from '../../components/dashboard/DashboardSkeletons';

export default function ResourcesSection() {
    const { currentUser, currentTeam, supabase } = useDashboard();
    const [resources, setResources] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    const loadResources = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_targeted_resources', {
                p_user_id: currentUser.id,
                p_team_id: currentTeam?.id || null,
                p_batch: currentTeam?.batch_id || null
            });
            if (error) throw error;
            setResources(data || []);
            setFiltered(data || []);
        } catch (err) {
            console.error('Error loading resources:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, currentTeam, supabase]);

    useEffect(() => { loadResources(); }, [loadResources]);

    useEffect(() => {
        localStorage.setItem('lastViewed_resources', Date.now().toString());
    }, []);

    useEffect(() => {
        const handler = () => loadResources();
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, [loadResources]);

    // Filter logic
    useEffect(() => {
        let result = resources;
        if (activeCategory !== 'all') {
            result = result.filter(r => r.type === activeCategory);
        }
        if (searchQuery.trim()) {
            result = result.filter(r => r.title?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFiltered(result);
    }, [searchQuery, activeCategory, resources]);

    const categories = [
        { key: 'all', label: 'All', icon: 'fas fa-th' },
        { key: 'pdf', label: 'PDFs', icon: 'fas fa-file-pdf' },
        { key: 'video', label: 'Videos', icon: 'fas fa-play-circle' },
        { key: 'link', label: 'Links', icon: 'fas fa-link' }
    ];

    const typeStyles = {
        pdf: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', icon: 'fa-file-pdf' },
        doc: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', icon: 'fa-file-word' },
        video: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', icon: 'fa-play-circle' },
        link: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', icon: 'fa-link' }
    };

    const isNew = (createdAt) => {
        if (!createdAt) return false;
        return (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
    };

    if (loading) return <ResourcesSkeleton />;

    return (
        <div className="dash-section-ready">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: 400 }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--dash-text-muted)', fontSize: '0.85rem' }} />
                    <input
                        type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search resources..."
                        className="dash-input" style={{ paddingLeft: 38 }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <button key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            style={{
                                padding: '0.4rem 0.85rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500,
                                border: '1px solid',
                                background: activeCategory === cat.key ? 'var(--dash-accent)' : 'transparent',
                                color: activeCategory === cat.key ? 'white' : 'var(--dash-text-secondary)',
                                borderColor: activeCategory === cat.key ? 'var(--dash-accent)' : 'rgba(255,255,255,0.1)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                            }}>
                            <i className={cat.icon} style={{ fontSize: '0.75rem' }} /> {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resources Grid */}
            {filtered.length === 0 ? (
                <div className="dash-empty">
                    <i className="fas fa-book-open" />
                    <h3>No Resources Found</h3>
                    <p>{searchQuery || activeCategory !== 'all' ? 'Try changing your filters.' : 'No resources available for you yet.'}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {filtered.map(res => {
                        const ts = typeStyles[res.type] || typeStyles.link;
                        const isNewRes = isNew(res.created_at);
                        const isDownload = res.type === 'pdf' || res.type === 'doc';

                        return (
                            <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer"
                               style={{
                                   textDecoration: 'none', background: 'rgba(30,41,59,0.4)',
                                   border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12,
                                   padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                                   transition: 'transform 0.2s, background 0.2s', position: 'relative'
                               }}
                               onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; }}
                               onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = 'rgba(30,41,59,0.4)'; }}
                            >
                                {isNewRes && (
                                    <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                                        NEW
                                    </span>
                                )}
                                <div style={{ width: 48, height: 48, borderRadius: 10, background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: ts.color }}>
                                    <i className={`fas ${ts.icon}`} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{res.category || res.type}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {res.title}
                                    </div>
                                    {res.description && (
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {res.description}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>
                                        {res.created_at ? new Date(res.created_at).toLocaleDateString() : ''}
                                    </span>
                                    <span style={{
                                        padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500,
                                        background: isDownload ? 'var(--dash-accent)' : 'rgba(255,255,255,0.1)',
                                        color: 'white', display: 'inline-flex', alignItems: 'center', gap: 6
                                    }}>
                                        <i className={`fas fa-${isDownload ? 'download' : 'external-link-alt'}`} />
                                        {isDownload ? 'Download' : res.type === 'video' ? 'Watch' : 'Open'}
                                    </span>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
