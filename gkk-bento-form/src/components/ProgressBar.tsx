import { useEffect, useState } from 'react';
import { useFormContext } from '../context/FormContext';

const ProgressBar: React.FC = () => {
    const { calculateProgress } = useFormContext();
    const [progress, setProgress] = useState(0);

    // Update progress when data changes
    useEffect(() => {
        setProgress(calculateProgress());
    }, [calculateProgress]);

    return (
        <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
            {/* Background track */}
            <div className="h-1.5 w-full bg-background-light opacity-50"></div>
            {/* Progress fill */}
            <div
                className="h-1.5 bg-gradient-to-r from-emerald-400 to-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
            ></div>

            {/* Optional Floating badge showing completion status */}
            <div className={`absolute top-4 right-4 bg-[#1e293b]/80 backdrop-blur-md border border-[#334155] text-text-secondary px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-500 ease-out ${progress > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                {progress === 100 ? (
                    <>
                        <span className="material-symbols-outlined text-[#10b981] text-sm">check_circle</span>
                        <span className="text-[#10b981]">Ready to Submit</span>
                    </>
                ) : (
                    <>
                        <span className="text-emerald-400">{progress}%</span>
                        <span>Completed</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProgressBar;
