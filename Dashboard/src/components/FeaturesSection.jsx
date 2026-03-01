import React from 'react';
import { useLazySection } from '../hooks/useLazySection';
import UseAnimations from 'react-useanimations';
import codepen from 'react-useanimations/lib/codepen';
import infinity from 'react-useanimations/lib/infinity';
import star from 'react-useanimations/lib/star';
import explore from 'react-useanimations/lib/explore';

const features = [
    {
        animation: codepen,
        title: 'Real Projects',
        description: 'Work on industry-level projects with modern technologies.',
    },
    {
        animation: infinity,
        title: 'Collaboration',
        description: 'Join dynamic teams and build professional networks.',
    },
    {
        animation: star,
        title: 'Certification',
        description: 'Earn verified certificates upon successful completion.',
    },
    {
        animation: explore,
        title: 'Career Growth',
        description: 'Get mentorship and guidance to kickstart your career.',
    },
];

export default function FeaturesSection() {
    const sectionRef = useLazySection();

    return (
        <section
            ref={sectionRef}
            className="section lazy-section"
            id="features"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
            <div className="container">
                <div className="text-center" style={{ maxWidth: '600px', margin: '0 auto 4rem' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            background: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '99px',
                            fontSize: '0.85rem',
                            color: 'var(--text-body)',
                            marginBottom: '1rem',
                        }}
                    >
                        Why Choose Us
                    </div>
                    <h2>Everything You Need</h2>
                    <p style={{ color: 'var(--text-body)' }}>
                        We provide all the tools, guidance, and support you need to launch your career in tech.
                    </p>
                </div>

                <div
                    className="grid"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}
                >
                    {features.map((feature) => (
                        <div key={feature.title} className="feature-card">
                            <div className="card-icon">
                                <UseAnimations
                                    animation={feature.animation}
                                    size={28}
                                    strokeColor="currentColor"
                                    autoplay={true}
                                    loop={true}
                                    speed={0.5}
                                />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
