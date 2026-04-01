import { useState, useEffect } from "react";
import { useFormContext } from '@/context/FormContext';

const DEFAULT_INTERESTS = [
    "Frontend", "Backend", "Fullstack", "UI/UX", "Mobile", "DevOps", "AI/ML", "Data Science"
];

const AdditionalInfoCard: React.FC = () => {
    const { formData, updateFormData } = useFormContext();

    // Interests State
    const [interests, setInterests] = useState<string[]>(DEFAULT_INTERESTS);
    const [newInterest, setNewInterest] = useState("");
    const [showAddInput, setShowAddInput] = useState(false);

    // Initialize from context if exists
    useEffect(() => {
        if (formData.interests && formData.interests.length > 0) {
            setInterests((prev) => {
                const newItems = (formData.interests || []).filter(i => !prev.includes(i));
                return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
        }
    }, [formData.interests]);

    const selectedInterests = formData.interests || [];

    const toggleInterest = (interest: string) => {
        const newSelected = selectedInterests.includes(interest)
            ? selectedInterests.filter((i) => i !== interest)
            : [...selectedInterests, interest];
        updateFormData({ interests: newSelected });
    };

    const handleAddInterest = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            const trimmedInterest = newInterest.trim();
            setInterests((prev) => [...prev, trimmedInterest]);
            updateFormData({ interests: [...selectedInterests, trimmedInterest] });
            setNewInterest("");
            setShowAddInput(false);
        }
    };

    const handleDeleteInterest = (interestToDelete: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setInterests((prev) => prev.filter(i => i !== interestToDelete));
        if (selectedInterests.includes(interestToDelete)) {
            updateFormData({ interests: selectedInterests.filter(i => i !== interestToDelete) });
        }
    };

    const handleKeyDownInterest = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddInterest();
        }
        if (e.key === "Escape") {
            setShowAddInput(false);
            setNewInterest("");
        }
    };

    const options = ["LinkedIn", "Referral", "Social Media", "Other"];
    const selected = formData.discovery_source || '';

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateFormData({ interests: [], discovery_source: '' });
    };

    return (
        <div
            className="w-full h-full apply-card glass-hub border border-border p-6 lg:p-7 rounded-xl shadow-sm flex flex-col gap-4 lg:gap-5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#10b981]/50 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            onFocus={() => updateFormData({ mascot_emotion: 'neutral' })}
            tabIndex={0}
        >
            <div className="flex justify-between items-start pb-3 border-b border-border/30">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl lg:text-2xl font-black text-text-primary tracking-tight">Additional Information</h3>
                    <p className="text-text-secondary text-xs lg:text-sm">
                        Tell us about your interests and how you found us
                    </p>
                </div>
                {(selectedInterests.length > 0 || selected) && (
                    <button
                        onClick={handleClear}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium px-3 py-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Clear
                    </button>
                )}
            </div>


            {/* Interests Section */}
            <div className="flex flex-col gap-3 lg:gap-4">
                <h4 className="text-[10px] lg:text-xs font-black text-text-primary uppercase tracking-widest mb-1 opacity-80">
                    Your Interests
                </h4>
                <div className="flex flex-wrap gap-4">
                    {interests.map((interest) => {
                        const isCustom = !DEFAULT_INTERESTS.includes(interest);
                        const isSelected = selectedInterests.includes(interest);
                        return (
                            <button
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] border-2 ${isSelected
                                    ? "bg-primary border-primary text-text-primary shadow-lg shadow-primary/30"
                                    : "border-border/60 hover:border-primary/50 hover:text-primary bg-background-card/40 text-text-primary"
                                    }`}
                            >
                                {interest}
                                {isCustom && (
                                    <span
                                        onClick={(e) => handleDeleteInterest(interest, e)}
                                        className="material-symbols-outlined text-[14px] opacity-60 hover:opacity-100 hover:text-red-400 transition-colors rounded-full p-0.5"
                                    >
                                        close
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* Add Button / Input */}
                    {showAddInput ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                onKeyDown={handleKeyDownInterest}
                                placeholder="Interest..."
                                className="px-5 py-2.5 rounded-xl text-sm border-2 border-border/60 bg-background-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 w-40 font-bold"
                                autoFocus
                            />
                            <button
                                onClick={handleAddInterest}
                                className="w-10 h-10 rounded-xl bg-primary text-text-primary flex items-center justify-center hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined font-bold">check</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddInput(false);
                                    setNewInterest("");
                                }}
                                className="w-10 h-10 rounded-xl bg-surface border border-border text-text-secondary flex items-center justify-center hover:bg-border/20 transition-colors"
                            >
                                <span className="material-symbols-outlined font-bold">close</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddInput(true)}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold border-2 border-dashed border-border/80 text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-2 hover:scale-[1.03]"
                        >
                            <span className="material-symbols-outlined font-bold">add</span>
                            Add Interest
                        </button>
                    )}
                </div>
            </div>

            {/* Discovery Section */}
            <div className="flex flex-col w-full mt-1">
                <h4 className="text-[10px] lg:text-xs font-black text-text-primary uppercase tracking-widest mb-3 opacity-80">
                    How did you find us?
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-3">
                    {options.map((option) => {
                        const isSelected = selected === option;
                        let icon = "public";
                        if (option === 'LinkedIn') icon = "share";
                        if (option === 'Referral') icon = "group";
                        if (option === 'Social Media') icon = "diversity_3";
                        if (option === 'Other') icon = "more_horiz";

                        return (
                            <button
                                key={option}
                                onClick={() => updateFormData({ discovery_source: option })}
                                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-300 hover:scale-[1.05] group ${isSelected
                                    ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                                    : "bg-background-card/30 border-border/40 hover:border-primary/50"
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-xl lg:text-2xl transition-transform duration-300 group-hover:rotate-12 ${isSelected ? "text-primary scale-110" : "text-text-muted opacity-60"
                                    }`}>
                                    {icon}
                                </span>
                                <span className={`text-xs lg:text-sm font-bold transition-colors ${isSelected ? "text-text-primary" : "text-text-secondary"
                                    }`}>
                                    {option}
                                </span>
                                {isSelected && (
                                    <div className="w-1 h-1 rounded-full bg-primary mt-0.5 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div >
    );
};

export default AdditionalInfoCard;
