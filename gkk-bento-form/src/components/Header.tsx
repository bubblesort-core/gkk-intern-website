import { useFormContext } from '@/context/FormContext';
import logo from '../assets/gkk-intern-logo.png';

interface HeaderProps {
    isLocked?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isLocked = false }) => {
    const { activeBatch } = useFormContext();

    return (
        <header className="grid grid-cols-[1fr_auto_1fr] items-center w-full border-b border-border px-4 md:px-10 py-3 bg-[#0c0c0f] min-h-[5rem]">
            {/* Left: Logo */}
            <div className="flex justify-start">
                <a href="/" className="hover:opacity-80 transition-opacity">
                    <img
                        src={logo}
                        alt="GKK"
                        className="h-14 md:h-[4.5rem] w-auto"
                        style={{ filter: "drop-shadow(0 0 15px rgba(0, 0, 0, 0.2))" }}
                    />
                </a>
            </div>

            {/* Center: Title and Phase */}
            <div className="flex justify-center items-center gap-2 whitespace-nowrap">
                <span className="text-xs md:text-sm uppercase font-extrabold text-primary tracking-widest bg-primary/10 px-3 py-1 rounded border border-primary/20">
                    Application
                </span>
                {activeBatch && !isLocked && (
                    <span className="text-xs md:text-sm font-medium text-slate-400">
                        — {activeBatch}
                    </span>
                )}
            </div>

            {/* Right: Home Button */}
            <div className="flex justify-end">
                <a
                    href="/Dashboard/"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-400 rounded-md font-medium text-xs border border-slate-600 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-500 transition-all"
                >
                    <i className="fas fa-arrow-left text-[10px]"></i>
                    Home
                </a>
            </div>
        </header>
    );
};

export default Header;
