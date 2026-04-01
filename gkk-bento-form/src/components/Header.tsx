import logo from '../assets/gkk-intern-logo.png';

const Header: React.FC = () => {
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-border px-4 md:px-10 py-3 bg-[#0c0c0f]">
            <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="flex items-center">
                    <img
                        src={logo}
                        alt="GKK"
                        className="h-16 md:h-20 w-auto"
                        style={{ filter: "drop-shadow(0 0 15px rgba(0, 0, 0, 0.2))" }}
                    />
                </div>
            </a>
            <a
                href="/Dashboard/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-400 rounded-md font-medium text-xs border border-slate-600 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-500 transition-all"
            >
                <i className="fas fa-arrow-left text-[10px]"></i>
                Home
            </a>
        </header>
    );
};

export default Header;
