import React from 'react';

/* ── Primitive building blocks ── */
const Bone = ({ w = '100%', h = 16, r = 8, style, className = '' }) => (
    <div
        className={`skel-bone ${className}`}
        style={{ width: w, height: h, borderRadius: r, ...style }}
    />
);

const Circle = ({ size = 48, style }) => (
    <Bone w={size} h={size} r="50%" style={{ flexShrink: 0, ...style }} />
);

const Card = ({ children, style }) => (
    <div className="skel-card" style={style}>{children}</div>
);

/* ── Section-specific skeletons ── */

export function OverviewSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Welcome hero */}
            <Card style={{ borderLeft: '4px solid var(--dash-accent)', marginBottom: '2rem' }}>
                <Bone w={280} h={28} style={{ marginBottom: 12 }} />
                <Bone w="80%" h={14} style={{ marginBottom: 8 }} />
                <Bone w="60%" h={14} style={{ marginBottom: 20 }} />
                <div style={{ display: 'flex', gap: 12 }}>
                    <Bone w={140} h={40} r={10} />
                    <Bone w={120} h={40} r={10} />
                </div>
            </Card>

            {/* Stats grid */}
            <div className="skel-stats-grid">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <Bone w={48} h={48} r={12} />
                            <div style={{ flex: 1 }}>
                                <Bone w={50} h={24} style={{ marginBottom: 6 }} />
                                <Bone w={90} h={12} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Current focus card */}
            <Card style={{ marginTop: '1.5rem' }}>
                <Bone w={140} h={18} style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <Bone w="70%" h={16} style={{ marginBottom: 8 }} />
                        <Bone w="40%" h={12} style={{ marginBottom: 12 }} />
                        <Bone w="100%" h={6} r={3} />
                    </div>
                    <Bone w={80} h={36} r={8} style={{ marginLeft: 20 }} />
                </div>
            </Card>
        </div>
    );
}

export function PaymentSkeleton() {
    return (
        <div className="skel-fade-in" style={{ maxWidth: 520, margin: '0 auto' }}>
            <Card style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
                <Circle size={72} style={{ margin: '0 auto 20px' }} />
                <Bone w={200} h={22} style={{ margin: '0 auto 12px' }} />
                <Bone w={280} h={14} style={{ margin: '0 auto 8px' }} />
                <Bone w={220} h={14} style={{ margin: '0 auto 24px' }} />
                <div className="skel-divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Bone w={100} h={14} />
                    <Bone w={60} h={14} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <Bone w={80} h={14} />
                    <Bone w={70} h={14} />
                </div>
                <Bone w="100%" h={48} r={12} />
            </Card>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Avatar + info */}
            <Card style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <Circle size={80} />
                    <div style={{ flex: 1 }}>
                        <Bone w={180} h={22} style={{ marginBottom: 8 }} />
                        <Bone w={220} h={14} style={{ marginBottom: 6 }} />
                        <Bone w={100} h={12} />
                    </div>
                </div>
            </Card>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[1, 2, 3].map(i => (
                    <Card key={i} style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <Bone w={40} h={24} style={{ margin: '0 auto 6px' }} />
                        <Bone w={60} h={12} style={{ margin: '0 auto' }} />
                    </Card>
                ))}
            </div>

            {/* Form fields */}
            <Card>
                <Bone w={80} h={14} style={{ marginBottom: 8 }} />
                <Bone w="100%" h={40} r={10} style={{ marginBottom: 20 }} />
                <Bone w={100} h={14} style={{ marginBottom: 8 }} />
                <Bone w="100%" h={80} r={10} style={{ marginBottom: 20 }} />
                <Bone w={120} h={42} r={10} />
            </Card>
        </div>
    );
}

export function ProjectsSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
                <Bone w={100} h={36} r={10} />
                <Bone w={120} h={36} r={10} />
            </div>

            {/* Project cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {[1, 2, 3].map(i => (
                    <Card key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Bone w={140} h={18} />
                            <Bone w={70} h={24} r={12} />
                        </div>
                        <Bone w="90%" h={12} style={{ marginBottom: 6 }} />
                        <Bone w="70%" h={12} style={{ marginBottom: 16 }} />
                        <Bone w="100%" h={6} r={3} style={{ marginBottom: 12 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Bone w={80} h={12} />
                            <Bone w={90} h={32} r={8} />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function TeamSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Team info header */}
            <Card style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <Bone w={44} h={44} r={12} />
                    <div>
                        <Bone w={160} h={18} style={{ marginBottom: 6 }} />
                        <Bone w={100} h={12} />
                    </div>
                </div>
                {/* Member list */}
                <div style={{ display: 'flex', gap: -8, marginBottom: 12 }}>
                    {[1, 2, 3, 4].map(i => <Circle key={i} size={36} style={{ marginLeft: i > 1 ? -8 : 0 }} />)}
                </div>
            </Card>

            {/* Chat area */}
            <Card style={{ minHeight: 320 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: i % 2 === 0 ? 'flex-end' : 'flex-start', flexDirection: i % 2 === 0 ? 'row-reverse' : 'row' }}>
                            <Circle size={32} />
                            <div>
                                <Bone w={60} h={10} style={{ marginBottom: 4 }} />
                                <Bone w={i % 2 === 0 ? 180 : 220} h={36} r={12} />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Input bar */}
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                    <Bone w="100%" h={42} r={12} style={{ flex: 1 }} />
                    <Bone w={42} h={42} r={12} />
                </div>
            </Card>
        </div>
    );
}

export function AnnouncementsSkeleton() {
    return (
        <div className="skel-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
                <Card key={i} style={{ borderLeft: `3px solid ${['#3b82f6', '#10b981', '#f59e0b'][i - 1]}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Bone w={28} h={28} r="50%" />
                            <Bone w={150} h={16} />
                        </div>
                        <Bone w={60} h={22} r={12} />
                    </div>
                    <Bone w="95%" h={13} style={{ marginBottom: 6 }} />
                    <Bone w="75%" h={13} style={{ marginBottom: 10 }} />
                    <Bone w={100} h={11} />
                </Card>
            ))}
        </div>
    );
}

export function MeetingsSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Section label */}
            <Bone w={140} h={18} style={{ marginBottom: 16 }} />

            {/* Live meeting card */}
            <Card style={{ marginBottom: '1.5rem', borderLeft: '3px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Bone w={200} h={18} />
                    <Bone w={50} h={22} r={12} />
                </div>
                <Bone w="80%" h={13} style={{ marginBottom: 12 }} />
                <Bone w={120} h={36} r={10} />
            </Card>

            {/* Scheduled meetings */}
            <Bone w={170} h={18} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2].map(i => (
                    <Card key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Bone w={180} h={16} />
                            <Bone w={80} h={12} />
                        </div>
                        <Bone w="70%" h={12} />
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function RecordingsSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Search bar */}
            <Bone w="100%" h={42} r={12} style={{ marginBottom: '1.5rem' }} />

            {/* Recording cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {[1, 2, 3].map(i => (
                    <Card key={i}>
                        {/* Thumbnail */}
                        <Bone w="100%" h={160} r={10} style={{ marginBottom: 12 }} />
                        <Bone w="80%" h={16} style={{ marginBottom: 6 }} />
                        <Bone w="50%" h={12} style={{ marginBottom: 10 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Bone w={80} h={11} />
                            <Bone w={80} h={32} r={8} />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function LeaderboardSkeleton() {
    return (
        <div className="skel-fade-in" style={{ maxWidth: 600 }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="skel-leaderboard-row">
                    <Bone w={28} h={28} r="50%" />
                    <Circle size={40} />
                    <div style={{ flex: 1 }}>
                        <Bone w={120} h={15} style={{ marginBottom: 4 }} />
                        <Bone w={70} h={11} />
                    </div>
                    <Bone w={50} h={20} r={8} />
                </div>
            ))}
        </div>
    );
}

export function ResourcesSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Search + filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <Bone w={200} h={40} r={10} style={{ flex: '1 1 200px' }} />
                {[1, 2, 3, 4].map(i => <Bone key={i} w={70} h={36} r={10} />)}
            </div>

            {/* Resource cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {[1, 2, 3].map(i => (
                    <Card key={i}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <Bone w={48} h={48} r={12} />
                            <div style={{ flex: 1 }}>
                                <Bone w="80%" h={15} style={{ marginBottom: 6 }} />
                                <Bone w="50%" h={11} />
                            </div>
                        </div>
                        <Bone w="90%" h={12} style={{ marginBottom: 5 }} />
                        <Bone w="65%" h={12} style={{ marginBottom: 14 }} />
                        <Bone w={100} h={32} r={8} />
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function RewardsSkeleton() {
    return (
        <div className="skel-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <Bone w={56} h={56} r={14} />
                        <div style={{ flex: 1 }}>
                            <Bone w={140} h={16} style={{ marginBottom: 6 }} />
                            <Bone w={80} h={22} r={8} />
                        </div>
                    </div>
                    <Bone w="90%" h={12} style={{ marginBottom: 5 }} />
                    <Bone w="60%" h={12} style={{ marginBottom: 16 }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Bone w={100} h={36} r={8} />
                        <Bone w={100} h={36} r={8} />
                    </div>
                </Card>
            ))}
        </div>
    );
}

export function ReferralsSkeleton() {
    return (
        <div className="skel-fade-in" style={{ maxWidth: 520, margin: '0 auto' }}>
            <Card style={{ textAlign: 'center', padding: '2rem' }}>
                <Circle size={64} style={{ margin: '0 auto 16px' }} />
                <Bone w={180} h={20} style={{ margin: '0 auto 10px' }} />
                <Bone w={240} h={13} style={{ margin: '0 auto 24px' }} />
                {/* Code box */}
                <Bone w="100%" h={50} r={12} style={{ marginBottom: 16 }} />
                {/* Stats row */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                        <Bone w={36} h={22} style={{ margin: '0 auto 4px' }} />
                        <Bone w={60} h={11} style={{ margin: '0 auto' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Bone w={36} h={22} style={{ margin: '0 auto 4px' }} />
                        <Bone w={60} h={11} style={{ margin: '0 auto' }} />
                    </div>
                </div>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <Bone w={120} h={40} r={10} />
                    <Bone w={120} h={40} r={10} />
                </div>
            </Card>
        </div>
    );
}

export function MobileAppSkeleton() {
    return (
        <div className="skel-fade-in">
            {/* Hero */}
            <Card style={{ textAlign: 'center', padding: '2.5rem 2rem', marginBottom: '1.5rem' }}>
                <Bone w={80} h={80} r={20} style={{ margin: '0 auto 20px' }} />
                <Bone w={200} h={22} style={{ margin: '0 auto 10px' }} />
                <Bone w={320} h={13} style={{ margin: '0 auto 20px' }} />
                <Bone w={160} h={44} r={10} style={{ margin: '0 auto' }} />
            </Card>

            {/* Feature cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {[1, 2, 3].map(i => (
                    <Card key={i} style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <Bone w={56} h={56} r={14} style={{ margin: '0 auto 14px' }} />
                        <Bone w={120} h={15} style={{ margin: '0 auto 8px' }} />
                        <Bone w="85%" h={12} style={{ margin: '0 auto 4px' }} />
                        <Bone w="65%" h={12} style={{ margin: '0 auto' }} />
                    </Card>
                ))}
            </div>
        </div>
    );
}
