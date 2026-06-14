import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container">
                <div
                    className="grid"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}
                >
                    {/* Brand */}
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                            }}
                        >
                            <div style={{ width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                            GKK Interns
                        </div>
                        <p style={{ fontSize: '0.9rem', maxWidth: '250px' }}>
                            Empowering the next generation of tech talent through real-world experience.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <div className="footer-title">Platform</div>
                        <a href="#features" className="footer-link" style={{ fontSize: '0.9rem' }}>Features</a>
                        <a href="/dashboard/apply/" className="footer-link" style={{ fontSize: '0.9rem' }}>Apply</a>
                        <Link to="/user/login" className="footer-link" style={{ fontSize: '0.9rem' }}>Login</Link>
                    </div>

                    {/* Connect */}
                    <div>
                        <div className="footer-title">Connect</div>
                        <a href="https://www.linkedin.com/company/gkk-intern/" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.9rem' }}>LinkedIn</a>
                        <a href="https://x.com/gkkintern" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.9rem' }}>Twitter (X)</a>
                        <a href="https://www.instagram.com/gkkintern?igsh=MWV1ZWwza3NoeGNndg==" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.9rem' }}>Instagram</a>
                        <a href="https://www.facebook.com/share/1Ar1Giv2Vw/" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.9rem' }}>Facebook</a>
                    </div>

                    {/* Contact */}
                    <div>
                        <div className="footer-title">Contact</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '0.8rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.2rem' }}>Study Enquiry</div>
                                <a href="mailto:noreplay.gkk26@gmail.com" className="footer-link" style={{ fontSize: '0.9rem', margin: 0 }}>
                                    <i className="fas fa-envelope" style={{ marginRight: '0.5rem' }}></i>noreplay.gkk26@gmail.com
                                </a>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.2rem' }}>Business Enquiry</div>
                                <a href="mailto:hello@bubblesort.in" className="footer-link" style={{ fontSize: '0.9rem', margin: 0 }}>
                                    <i className="fas fa-envelope" style={{ marginRight: '0.5rem' }}></i>hello@bubblesort.in
                                </a>
                            </div>
                        </div>
                        <a href="tel:+919477564633" className="footer-link" style={{ fontSize: '0.9rem' }}>
                            <i className="fas fa-phone" style={{ marginRight: '0.5rem' }}></i>+91 9477564633
                        </a>
                    </div>
                </div>

                {/* Bottom bar */}
                <div
                    style={{
                        borderTop: '1px solid var(--border)',
                        paddingTop: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                    }}
                >
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        &copy; 2025 GKK Interns. All rights reserved.
                        <br />
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                            GKK Interns - A GKK (Global Kompass Krew) venture, under{' '}
                            <a
                                href="https://bubblesort.in"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                            >
                                Bubblesort
                            </a>.
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <a href="/privacy.html" className="footer-link" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Privacy
                        </a>
                        <a href="/terms.html" className="footer-link" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Terms
                        </a>
                        <a
                            href="/admin/login.html"
                            className="footer-link"
                            style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                        >
                            Admin
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
