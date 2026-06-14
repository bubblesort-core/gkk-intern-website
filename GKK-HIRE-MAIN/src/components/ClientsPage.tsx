import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    clientProjects,
    clientTestimonials,
    clientMedia,
    type ClientProject,
    type ClientTestimonial,
    type ClientMedia,
} from '../data/clients';

// ╭───────────────────────────────────────────────────────────────────────────╮
// │ Clients — dedicated full page at /clients.html                            │
// │ Layout (top → bottom):                                                    │
// │   1. PageHeader (logo + back link + menu nav)                             │
// │   2. ClientsHero  — title + tagline + stats                               │
// │   3. ProjectsGrid — filterable cards, hover live preview                  │
// │   4. TestimonialsMarquee — dual-row infinite scroll                       │
// │   5. PhotosGallery — masonry + lightbox                                   │
// │   6. VideosBlock — YT/native player                                       │
// │   7. ClientApplyForm — frontend-only project request                      │
// │   8. PageFooter                                                           │
// ╰───────────────────────────────────────────────────────────────────────────╯

// ─── Reusable bits ──────────────────────────────────────────────────────────
function SectionHeader({
    tag,
    title,
    sub,
}: {
    tag: string;
    title: string;
    sub?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="mb-12 md:mb-16"
        >
            <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-(--accent) mb-3">
                [ {tag} ]
            </p>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.95]">
                {title}
            </h2>
            {sub && (
                <p className="text-base md:text-lg text-(--text-muted) mt-6 max-w-2xl leading-relaxed">
                    {sub}
                </p>
            )}
        </motion.div>
    );
}

function StatusPill({ status }: { status: ClientProject['status'] }) {
    const live = status === 'live';
    return (
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full">
            <span className={`relative flex h-2 w-2 ${live ? '' : 'opacity-60'}`}>
                {live && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--accent) opacity-75" />
                )}
                <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                        live ? 'bg-(--accent)' : 'bg-yellow-400'
                    }`}
                />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                {live ? 'Live' : 'In Progress'}
            </span>
        </div>
    );
}

// ─── 1. Page header ─────────────────────────────────────────────────────────
function PageHeader() {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-(--bg-primary)/85 border-b border-(--border)">
            <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2 no-underline">
                    <img src="/gkk-intern-logo.png" alt="GKK" className="h-7 w-7 object-contain" />
                    <span className="text-sm font-black uppercase tracking-widest text-(--text-primary)">
                        GKK Interns
                    </span>
                </a>
                <nav className="flex items-center gap-4 md:gap-6 text-xs font-bold uppercase tracking-widest">
                    <a href="/" className="text-(--text-muted) hover:text-(--accent) transition-colors no-underline">
                        ← Home
                    </a>
                    <a
                        href="#apply"
                        className="hidden sm:inline px-4 py-2 bg-(--accent) text-black hover:brightness-110 transition-all rounded-sm no-underline"
                    >
                        Start a project
                    </a>
                </nav>
            </div>
        </header>
    );
}

// ─── 2. Hero ────────────────────────────────────────────────────────────────
function ClientsHero({ count }: { count: number }) {
    const stats = [
        { num: count, label: 'Projects shipped' },
        { num: '100%', label: 'Production live' },
        { num: '6+', label: 'Industries served' },
        { num: '48h', label: 'Response time' },
    ];

    return (
        <section className="relative w-full overflow-hidden bg-(--bg-primary) text-(--text-primary) pt-20 pb-16 md:pt-32 md:pb-24 border-b border-(--border)">
            <div className="max-w-7xl mx-auto px-4 md:px-10 relative z-10">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-(--accent) mb-4"
                >
                    [ 01 / Clients & Work ]
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.05 }}
                    className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-[0.9] mb-6"
                >
                    Real work.
                    <br />
                    Real launches<span className="text-(--accent)">.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="text-lg md:text-2xl text-(--text-muted) max-w-3xl mb-12 leading-relaxed"
                >
                    Production websites, web apps, and AR experiences — built end-to-end
                    by GKK Interns and shipping live for clients across India.
                </motion.p>

                {/* Stats strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden"
                >
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="bg-(--bg-primary) p-5 md:p-7"
                        >
                            <p className="text-3xl md:text-5xl font-black tracking-tighter text-(--accent) leading-none mb-2">
                                {s.num}
                            </p>
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-(--text-muted)">
                                {s.label}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ─── 3. Projects grid (filterable) ──────────────────────────────────────────
function ProjectCard({ project }: { project: ClientProject }) {
    const [hovered, setHovered] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    return (
        <motion.a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false);
                setIframeLoaded(false);
            }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -6 }}
            data-cursor-label={`Visit ${project.name}`}
            className="group relative block border border-(--border) bg-(--bg-elevated)/40 backdrop-blur-sm overflow-hidden rounded-sm hover:border-(--accent) transition-colors duration-300 no-underline text-(--text-primary)"
        >
            <div className="relative aspect-video overflow-hidden bg-black/40">
                <img
                    src={project.thumbnail}
                    alt={project.name}
                    loading="lazy"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                        hovered && iframeLoaded
                            ? 'opacity-0 scale-110'
                            : 'opacity-100 group-hover:scale-105'
                    }`}
                />
                {hovered && (
                    <iframe
                        src={project.url}
                        title={project.name}
                        loading="lazy"
                        onLoad={() => setIframeLoaded(true)}
                        sandbox="allow-scripts allow-same-origin"
                        className={`absolute inset-0 w-full h-full border-0 pointer-events-none transition-opacity duration-500 ${
                            iframeLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                )}
                <div className="absolute top-3 left-3 z-10">
                    <StatusPill status={project.status} />
                </div>
                <span className="absolute top-3 right-3 z-10 text-xs font-mono text-white/80 bg-black/60 px-2 py-1 rounded">
                    #{project.number}
                </span>
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <span className="absolute bottom-3 left-3 z-10 text-[10px] font-bold tracking-widest uppercase text-white/80">
                    {hovered ? (iframeLoaded ? 'Live preview' : 'Loading…') : 'Hover for live preview'}
                </span>
            </div>

            <div className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight group-hover:text-(--accent) transition-colors">
                        {project.name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted) shrink-0 mt-1">
                        {project.category}
                    </span>
                </div>
                <p className="text-sm text-(--text-muted) line-clamp-3 mb-4 leading-relaxed">
                    {project.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {project.tech.map((t) => (
                        <span
                            key={t}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 border border-(--border) text-(--text-muted) rounded-sm group-hover:border-(--accent)/40 transition-colors"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        </motion.a>
    );
}

function ProjectsGrid({ projects }: { projects: ClientProject[] }) {
    const categories = useMemo(() => {
        const set = new Set<string>(['All']);
        projects.forEach((p) => set.add(p.category));
        return Array.from(set);
    }, [projects]);

    const [filter, setFilter] = useState('All');
    const filtered = useMemo(
        () => (filter === 'All' ? projects : projects.filter((p) => p.category === filter)),
        [filter, projects],
    );

    return (
        <section id="projects" className="w-full bg-(--bg-primary) text-(--text-primary) py-20 md:py-28">
            <div className="max-w-7xl mx-auto px-4 md:px-10">
                <SectionHeader
                    tag="02 / Projects"
                    title="Our portfolio."
                    sub="Each project below is shipping in production. Hover any card to load the actual live site in-place — no screenshots, no fakery."
                />

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2 mb-10">
                    {categories.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setFilter(c)}
                            className={`text-xs font-bold uppercase tracking-widest px-4 py-2 border rounded-sm transition-colors ${
                                filter === c
                                    ? 'border-(--accent) bg-(--accent) text-black'
                                    : 'border-(--border) text-(--text-muted) hover:border-(--accent) hover:text-(--accent)'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filtered.map((p) => (
                        <ProjectCard key={p.id} project={p} />
                    ))}
                </div>

                {filtered.length === 0 && (
                    <p className="text-center text-(--text-muted) py-16 text-sm">
                        No projects in this category yet.
                    </p>
                )}
            </div>
        </section>
    );
}

// ─── 4. Testimonials marquee ────────────────────────────────────────────────
function TestimonialsMarquee({ items }: { items: ClientTestimonial[] }) {
    if (!items.length) return null;

    const renderRow = (data: ClientTestimonial[]) => (
        <div className="flex gap-6 pr-6 shrink-0">
            {data.map((t) => (
                <div
                    key={t.id}
                    className="w-[300px] md:w-[400px] shrink-0 border border-(--border) bg-(--bg-elevated)/60 backdrop-blur-sm p-6 md:p-7 rounded-sm hover:border-(--accent) transition-colors"
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-(--accent) text-4xl font-black leading-none">"</span>
                        {t.rating ? (
                            <div className="flex gap-0.5">
                                {Array.from({ length: t.rating }).map((_, i) => (
                                    <span key={i} className="text-(--accent) text-sm">★</span>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <p className="text-sm md:text-base text-(--text-primary) leading-relaxed mb-6 line-clamp-5">
                        {t.quote}
                    </p>
                    <div className="border-t border-(--border) pt-4">
                        <p className="text-sm font-bold uppercase tracking-tight">{t.clientName}</p>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-(--text-muted) mt-1">
                            {t.role}
                            {t.company ? ` · ${t.company}` : ''}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <section className="w-full bg-(--bg-elevated)/30 text-(--text-primary) py-20 md:py-28 overflow-hidden border-y border-(--border)">
            <div className="max-w-7xl mx-auto px-4 md:px-10 mb-12 md:mb-16">
                <SectionHeader
                    tag="03 / Voices"
                    title="What clients say."
                    sub="Direct words from founders, mentors, and clinical leads who shipped products with us."
                />
            </div>

            <style>{`
                @keyframes cm-l { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                @keyframes cm-r { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
                .cm-l { animation: cm-l 45s linear infinite; }
                .cm-r { animation: cm-r 55s linear infinite; }
                .cm-l:hover, .cm-r:hover { animation-play-state: paused; }
            `}</style>

            <div className="flex flex-col gap-6">
                <div className="flex w-max cm-l">
                    {renderRow(items)}
                    {renderRow(items)}
                </div>
                <div className="flex w-max cm-r">
                    {renderRow([...items].reverse())}
                    {renderRow([...items].reverse())}
                </div>
            </div>
        </section>
    );
}

// ─── 5. Photos gallery + lightbox ───────────────────────────────────────────
function Lightbox({ media, onClose }: { media: ClientMedia | null; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <AnimatePresence>
            {media && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                        className="relative max-w-6xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute -top-10 right-0 text-white/80 hover:text-(--accent) text-xs font-bold tracking-widest uppercase"
                        >
                            Close ✕
                        </button>
                        <img
                            src={media.url}
                            alt={media.caption || 'Client media'}
                            className="w-full h-auto max-h-[80vh] object-contain rounded-sm border border-white/10"
                        />
                        {media.caption && (
                            <p className="mt-4 text-center text-sm text-white/70">{media.caption}</p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function PhotosGallery({ media }: { media: ClientMedia[] }) {
    const photos = media.filter((m) => m.type === 'photo');
    const [active, setActive] = useState<ClientMedia | null>(null);

    if (!photos.length) return null;

    return (
        <section className="w-full bg-(--bg-primary) text-(--text-primary) py-20 md:py-28">
            <div className="max-w-7xl mx-auto px-4 md:px-10">
                <SectionHeader
                    tag="04 / Gallery"
                    title="Moments."
                    sub="Screens, screenshots, and snapshots from the projects above."
                />

                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
                    {photos.map((p, i) => (
                        <motion.button
                            type="button"
                            key={p.id}
                            onClick={() => setActive(p)}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
                            whileHover={{ y: -4 }}
                            data-cursor-label="Open photo"
                            className="group relative block w-full break-inside-avoid border border-(--border) overflow-hidden rounded-sm hover:border-(--accent) transition-colors cursor-zoom-in"
                        >
                            <img
                                src={p.url}
                                alt={p.caption || 'Client photo'}
                                loading="lazy"
                                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {p.caption && (
                                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/90">
                                        {p.caption}
                                    </p>
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            <Lightbox media={active} onClose={() => setActive(null)} />
        </section>
    );
}

// ─── 6. Videos ──────────────────────────────────────────────────────────────
const getYouTubeId = (url: string) => {
    const re = /^.*(youtu.be\/\?|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const m = url.match(re);
    return m && m[2].length === 11 ? m[2] : null;
};

function VideosBlock({ media }: { media: ClientMedia[] }) {
    const videos = media.filter((m) => m.type === 'video');

    return (
        <section className="w-full bg-(--bg-elevated)/30 text-(--text-primary) py-20 md:py-28 border-y border-(--border)">
            <div className="max-w-7xl mx-auto px-4 md:px-10">
                <SectionHeader
                    tag="05 / Stories"
                    title="Client videos."
                    sub={
                        videos.length
                            ? 'Walkthroughs, demos, and behind-the-scenes from delivered projects.'
                            : 'Walkthroughs and demos coming soon. Add YouTube or hosted video URLs to clientMedia with type=\'video\' in src/data/clients.ts to populate this section.'
                    }
                />

                {videos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {videos.map((v, i) => {
                            const ytId = getYouTubeId(v.url);
                            return (
                                <motion.div
                                    key={v.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-50px' }}
                                    transition={{ duration: 0.6, delay: (i % 4) * 0.08 }}
                                    className="group border border-(--border) overflow-hidden rounded-sm hover:border-(--accent) transition-colors"
                                >
                                    <div className="relative aspect-video bg-black">
                                        {ytId ? (
                                            <iframe
                                                src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                                                title={v.caption || 'Client video'}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                loading="lazy"
                                                className="absolute inset-0 w-full h-full border-0"
                                            />
                                        ) : (
                                            <video
                                                src={v.url}
                                                poster={v.thumbnail}
                                                controls
                                                preload="metadata"
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    {v.caption && (
                                        <div className="p-4 md:p-5">
                                            <p className="text-sm font-bold uppercase tracking-tight">
                                                {v.caption}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

// ─── 7. Apply form (frontend only) ──────────────────────────────────────────
interface ClientApplyFormState {
    name: string;
    company: string;
    email: string;
    phone: string;
    whatsapp: string;
    projectType: string;
    budget: string;
    timeline: string;
    message: string;
}

const emptyForm: ClientApplyFormState = {
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    projectType: 'Website',
    budget: '',
    timeline: '',
    message: '',
};

function ClientApplyForm() {
    const [form, setForm] = useState<ClientApplyFormState>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const onChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus('idle');

        // TODO(backend): wire to your endpoint. Frontend-only for now.
        const payload = {
            formType: 'client_apply',
            subject: `New client work request — ${form.company || form.name}`,
            ...form,
        };
        console.log('[ClientApplyForm] payload', payload);
        await new Promise((r) => setTimeout(r, 600));

        setStatus('success');
        setForm(emptyForm);
        setSubmitting(false);

        try {
            const confetti = (await import('canvas-confetti')).default;
            confetti({
                particleCount: 140,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#22c55e', '#06e4f9', '#ffffff'],
            });
        } catch {
            /* optional cosmetic */
        }
    };

    const projectTypes = [
        'Website',
        'Web App',
        'Mobile App',
        'AR / 3D',
        'AI / Chatbot',
        'E-commerce',
        'Branding / Design',
        'Other',
    ];

    return (
        <section id="apply" className="w-full bg-(--bg-primary) text-(--text-primary) py-20 md:py-28">
            <div className="max-w-5xl mx-auto px-4 md:px-10">
                <SectionHeader
                    tag="06 / Work With Us"
                    title="Got a project?"
                    sub="Drop your project details below. We'll reach out via Gmail, phone, or WhatsApp within 48 hours to discuss scope, timeline, and pricing."
                />

                <motion.form
                    onSubmit={onSubmit}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6 }}
                    className="border border-(--border) bg-(--bg-elevated)/40 backdrop-blur-sm p-6 md:p-10 rounded-sm space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Your Name *" name="name" required value={form.name} onChange={onChange} placeholder="Full name" />
                        <Field label="Company / Brand" name="company" value={form.company} onChange={onChange} placeholder="Optional" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Email *" name="email" type="email" required value={form.email} onChange={onChange} placeholder="you@example.com" />
                        <Field label="Phone *" name="phone" type="tel" required value={form.phone} onChange={onChange} placeholder="+91 ..." />
                        <Field label="WhatsApp" name="whatsapp" type="tel" value={form.whatsapp} onChange={onChange} placeholder="Same as phone or other" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-(--text-muted) mb-2">
                                Project Type
                            </label>
                            <select
                                name="projectType"
                                value={form.projectType}
                                onChange={onChange}
                                className="w-full bg-transparent border-b border-(--border) py-3 px-1 text-(--text-primary) focus:outline-none focus:border-(--accent) transition-colors appearance-none cursor-pointer"
                            >
                                {projectTypes.map((t) => (
                                    <option key={t} value={t} className="bg-(--bg-primary)">
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Field label="Budget (INR)" name="budget" value={form.budget} onChange={onChange} placeholder="e.g. 50k – 1L" />
                        <Field label="Timeline" name="timeline" value={form.timeline} onChange={onChange} placeholder="e.g. 4 weeks" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-(--text-muted) mb-2">
                            Project Brief *
                        </label>
                        <textarea
                            name="message"
                            required
                            value={form.message}
                            onChange={onChange}
                            rows={5}
                            placeholder="Tell us about your idea, target users, must-have features..."
                            className="w-full bg-transparent border border-(--border) p-4 text-(--text-primary) focus:outline-none focus:border-(--accent) transition-colors resize-none rounded-sm"
                        />
                    </div>

                    <div className="flex items-start gap-3 text-xs text-(--text-muted) leading-relaxed">
                        <span className="text-(--accent) text-base leading-none mt-0.5">✓</span>
                        <p>
                            By submitting, you consent to GKK Interns contacting you via Gmail,
                            phone, or WhatsApp regarding this project request.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                        <motion.button
                            type="submit"
                            disabled={submitting}
                            whileHover={{ scale: submitting ? 1 : 1.02 }}
                            whileTap={{ scale: submitting ? 1 : 0.98 }}
                            data-cursor-label="Send request"
                            className="px-8 py-4 bg-(--accent) text-black text-sm font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
                        >
                            {submitting ? 'Sending…' : 'Submit project request →'}
                        </motion.button>

                        <AnimatePresence mode="wait">
                            {status === 'success' && (
                                <motion.div
                                    key="ok"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-2 text-(--accent) text-sm font-bold uppercase tracking-wider"
                                >
                                    <span>✓</span> Request received. We'll reply within 48h.
                                </motion.div>
                            )}
                            {status === 'error' && (
                                <motion.div
                                    key="err"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-2 text-red-400 text-sm font-bold uppercase tracking-wider"
                                >
                                    <span>✕</span> Failed. Try noreplay.gkk26@gmail.com.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.form>

                {/* Direct contact rails */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center"
                >
                    <ContactCard label="Study Enquiry" value="noreplay.gkk26@gmail.com" href="mailto:noreplay.gkk26@gmail.com" cursor="Email us" />
                    <ContactCard label="Business Enquiry" value="hello@bubblesort.in" href="mailto:hello@bubblesort.in" cursor="Email us" />
                    <ContactCard label="WhatsApp" value="+91 94775 64633" href="https://wa.me/919477564633" cursor="WhatsApp us" external />
                    <ContactCard label="Phone" value="+91 94775 64633" href="tel:+919477564633" cursor="Call us" />
                </motion.div>
            </div>
        </section>
    );
}

function Field({
    label,
    ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-(--text-muted) mb-2">
                {label}
            </label>
            <input
                {...props}
                className="w-full bg-transparent border-b border-(--border) py-3 px-1 text-(--text-primary) focus:outline-none focus:border-(--accent) transition-colors"
            />
        </div>
    );
}

function ContactCard({
    label,
    value,
    href,
    cursor,
    external,
}: {
    label: string;
    value: string;
    href: string;
    cursor: string;
    external?: boolean;
}) {
    return (
        <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            data-cursor-label={cursor}
            className="border border-(--border) p-5 hover:border-(--accent) hover:text-(--accent) transition-colors rounded-sm no-underline text-(--text-primary) block"
        >
            <p className="text-[10px] font-bold uppercase tracking-widest text-(--text-muted) mb-1">
                {label}
            </p>
            <p className="text-sm font-bold">{value}</p>
        </a>
    );
}

// ─── 8. Footer ──────────────────────────────────────────────────────────────
function PageFooter() {
    return (
        <footer className="w-full bg-(--bg-primary) text-(--text-muted) border-t border-(--border) py-10">
            <div className="max-w-7xl mx-auto px-4 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                <p className="font-bold uppercase tracking-widest">
                    © {new Date().getFullYear()} GKK Interns
                </p>
                <div className="flex items-center gap-5">
                    <a href="/" className="hover:text-(--accent) transition-colors no-underline">Home</a>
                    <a href="#apply" className="hover:text-(--accent) transition-colors no-underline">Start a project</a>
                    <a href="https://www.linkedin.com/company/gkk-intern/" target="_blank" rel="noopener noreferrer" className="hover:text-(--accent) transition-colors no-underline">LinkedIn</a>
                    <a href="https://www.instagram.com/gkkintern" target="_blank" rel="noopener noreferrer" className="hover:text-(--accent) transition-colors no-underline">Instagram</a>
                </div>
            </div>
        </footer>
    );
}

// ─── Default export ─────────────────────────────────────────────────────────
export default function ClientsPage() {
    return (
        <div className="min-h-screen w-full bg-(--bg-primary) text-(--text-primary) selection:bg-(--accent) selection:text-black">
            <PageHeader />
            <main>
                <ClientsHero count={clientProjects.length} />
                <ProjectsGrid projects={clientProjects} />
                <TestimonialsMarquee items={clientTestimonials} />
                <PhotosGallery media={clientMedia} />
                <VideosBlock media={clientMedia} />
                <ClientApplyForm />
            </main>
            <PageFooter />
        </div>
    );
}
