import { Link } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="pro-navbar">
            <div className="pro-navbar-inner">
                <a href="/" className="pro-navbar-brand">
                    <img
                        src="/assets/gkk-intern-logo.png"
                        alt="GKK Interns"
                    />
                </a>

                <div className="pro-navbar-links">
                    <a href="#features" className="pro-navbar-link">Benefits</a>
                    <a href="#leaderboard" className="pro-navbar-link">Leaderboard</a>
                    <a href="#fees" className="pro-navbar-link">Fees</a>
                    <a href="#about" className="pro-navbar-link">About</a>
                    <a href="/dashboard/apply/" className="pro-navbar-link">Apply</a>
                </div>

                <div className="pro-navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a href="/" className="nav-action-btn nav-btn-home" title="Back to Home">
                        <i className="fas fa-arrow-left"></i>
                        Home
                    </a>
                    <Link to="/user/login" className="nav-action-btn nav-btn-signin">Sign In</Link>
                    <Link to="/user/signup" className="nav-action-btn nav-btn-signup">Sign Up</Link>
                    <a href="/dashboard/apply/" className="nav-action-btn nav-btn-apply">Apply Now</a>
                    <a href="/community-chat/" className="nav-action-btn nav-btn-community">
                        <i className="fas fa-comments"></i>
                        Community
                    </a>
                </div>
            </div>
        </nav>
    );
}
