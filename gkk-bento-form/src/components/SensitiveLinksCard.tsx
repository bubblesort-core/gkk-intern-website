import { useState, useEffect, useRef } from "react";
import { useFormContext } from '@/context/FormContext';

interface LinkItemProps {
    icon: string;
    label: string;
    savedColor: string;
    fieldName: 'linkedin_url' | 'github_url' | 'portfolio_url';
    required?: boolean;
}

const LinkItem: React.FC<LinkItemProps> = ({ icon, label, savedColor, fieldName, required }) => {
    const { formData, updateFormData } = useFormContext();
    const [showInput, setShowInput] = useState(false);
    const link = formData[fieldName] || '';
    const isSaved = link.trim() !== '';
    const popupRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                showInput &&
                popupRef.current &&
                containerRef.current &&
                !popupRef.current.contains(e.target as Node) &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setShowInput(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showInput]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowInput(!showInput);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && link.trim()) {
            setShowInput(false);
        }
        if (e.key === "Escape") {
            setShowInput(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                className="group flex flex-col items-center gap-2 cursor-pointer focus:outline-none"
                onClick={handleClick}
            >
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSaved
                        ? savedColor
                        : "bg-border text-text-secondary group-hover:bg-primary group-hover:text-text-primary"
                        }`}
                >
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <span
                    className={`text-[10px] font-bold uppercase ${isSaved ? "text-text-primary" : "text-text-muted"
                        }`}
                >
                    {label} {required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
            </button>

            {/* Popup Input */}
            {showInput && (
                <div
                    ref={popupRef}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-background-card rounded-xl shadow-xl border border-border p-4 min-w-62.5"
                >
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-text-primary">
                            {isSaved ? `Edit your ${label} link` : `Add your ${label} link`}
                        </label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => updateFormData({ [fieldName]: e.target.value })}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`https://${label.toLowerCase()}.com/username`}
                            className="w-full text-sm py-2 px-3 rounded-lg border border-[#475569] bg-background-light text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary animate-fadeInFast"
                            autoFocus
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-muted">
                                Press Enter to save
                            </span>
                            {isSaved && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateFormData({ [fieldName]: '' });
                                        setShowInput(false);
                                    }}
                                    className="text-[10px] text-red-400 hover:text-red-300"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SensitiveLinksCard: React.FC = () => {
    const { formData, updateFormData } = useFormContext();
    const hasAnyLink = !!(formData.linkedin_url || formData.github_url || formData.portfolio_url);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateFormData({ linkedin_url: '', github_url: '', portfolio_url: '' });
    };

    return (
        <div
            className="w-full h-full apply-card glass-hub border border-primary/30 p-8 rounded-xl shadow-sm flex flex-col justify-center gap-8 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#10b981]/50 focus-within:border-[#10b981] focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            tabIndex={0}
            onFocus={() => updateFormData({ mascot_emotion: 'thinking' })}
            onBlur={() => updateFormData({ mascot_emotion: 'neutral' })}
            onMouseEnter={() => updateFormData({ mascot_emotion: 'thinking' })}
            onMouseLeave={() => updateFormData({ mascot_emotion: 'neutral' })}
        >
            <div className="flex justify-between items-center pb-4 border-b border-border/30 relative">
                <div className="flex items-center gap-2 flex-1 justify-center">
                    <h3 className="text-xl font-bold text-text-primary">Sensitive Links</h3>
                    <div className="group relative flex items-center justify-center w-5 h-5 rounded-full bg-border text-text-muted cursor-help">
                        <span className="text-[12px] font-bold">?</span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 p-2 bg-background-card border border-primary/30 rounded-lg shadow-xl text-xs text-text-primary text-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 animate-slideUp whitespace-normal">
                            Click on any circle to add your profile link.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary/30"></div>
                        </div>
                    </div>
                </div>
                {hasAnyLink && (
                    <button
                        onClick={handleClear}
                        className="absolute right-0 top-0 text-xs text-red-400 hover:text-red-300 transition-colors font-medium px-2 py-1 bg-red-400/10 hover:bg-red-400/20 rounded-md flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Clear All
                    </button>
                )}
            </div>
            <div className="flex justify-between items-center px-4">
                <LinkItem
                    icon="link"
                    label="LinkedIn"
                    savedColor="bg-[#0077B5] text-white"
                    fieldName="linkedin_url"
                />
                <LinkItem
                    icon="terminal"
                    label="GitHub"
                    savedColor="bg-[#333] text-white"
                    fieldName="github_url"
                />
                <LinkItem
                    icon="language"
                    label="Portfolio"
                    savedColor="bg-[#9333EA] text-white"
                    fieldName="portfolio_url"
                />
            </div>
            <p className="text-center text-xs text-text-muted font-light italic opacity-70 mt-auto">
                Click to add or edit your links
            </p>
        </div>
    );
};

export default SensitiveLinksCard;
