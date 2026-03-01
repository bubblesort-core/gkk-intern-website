import logo from '../assets/gkk-intern-logo.png';

const Header: React.FC = () => {
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-border px-10 py-3 bg-background-light/95 backdrop-blur-md sticky top-0 z-50">
            <a href="/" className="flex items-center gap-4 text-text-primary hover:opacity-80 transition-opacity">
                <div className="flex items-center">
                    <img
                        src={logo}
                        alt="GKK"
                        className="h-20 w-auto"
                        style={{ filter: "drop-shadow(0 0 15px rgba(0, 0, 0, 0.2))" }}
                    />
                </div>
            </a>
            <a
                href="/Dashboard/"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    background: "transparent",
                    color: "#94a3b8",
                    borderRadius: "6px",
                    fontWeight: 500,
                    fontSize: "0.8rem",
                    textDecoration: "none",
                    transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                    border: "1px solid #334155",
                    lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1e293b";
                    e.currentTarget.style.color = "#e2e8f0";
                    e.currentTarget.style.borderColor = "#475569";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.borderColor = "#334155";
                }}
            >
                <i className="fas fa-arrow-left" style={{ fontSize: "0.7rem" }}></i>
                Home
            </a>
        </header>
    );
};

export default Header;
