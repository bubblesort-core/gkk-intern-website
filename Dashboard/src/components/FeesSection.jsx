import React from 'react';
import { useLazySection } from '../hooks/useLazySection';

export default function FeesSection() {
    const sectionRef = useLazySection();

    return (
        <section
            ref={sectionRef}
            className="section lazy-section"
            id="fees"
            style={{ backgroundColor: 'var(--bg-body)' }}
        >
            <div className="container text-center">
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Start?</h2>
                <p
                    style={{
                        fontSize: '1.1rem',
                        color: 'var(--text-body)',
                        marginBottom: '1.5rem',
                        maxWidth: '500px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}
                >
                    Join hundreds of other interns building their future with GKK Interns.
                </p>
                <div>
                    <a href="/apply/" className="pro-btn pro-btn-primary pro-btn-lg">
                        Apply Now
                    </a>
                </div>
            </div>
        </section>
    );
}
