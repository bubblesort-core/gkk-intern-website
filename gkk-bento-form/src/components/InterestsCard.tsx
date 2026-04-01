import { useState, useEffect } from "react";
import { useFormContext } from '@/context/FormContext';

const DEFAULT_INTERESTS = [
    "UI/UX Design",
    "Frontend Engineering",
    "DevOps",
    "Data Science",
    "Product Management",
    "Cybersecurity",
];

const InterestsCard: React.FC = () => {
    const { formData, updateFormData } = useFormContext();
    const [interests, setInterests] = useState(DEFAULT_INTERESTS);
    const [showAddInput, setShowAddInput] = useState(false);
    const [newInterest, setNewInterest] = useState("");

    // Merge saved interests into the list on load
    useEffect(() => {
        if (formData.interests && formData.interests.length > 0) {
            setInterests((prev) => {
                const newItems = (formData.interests || []).filter(i => !prev.includes(i));
                return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
        }
    }, [formData.interests]);

    const selected = formData.interests || [];

    const toggleInterest = (interest: string) => {
        const newSelected = selected.includes(interest)
            ? selected.filter((i) => i !== interest)
            : [...selected, interest];
        updateFormData({ interests: newSelected });
    };

    const handleAddInterest = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            const trimmedInterest = newInterest.trim();
            setInterests((prev) => [...prev, trimmedInterest]);
            updateFormData({ interests: [...selected, trimmedInterest] });
            setNewInterest("");
            setShowAddInput(false);
        }
    };

    const handleDeleteInterest = (interestToDelete: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setInterests((prev) => prev.filter(i => i !== interestToDelete));
        if (selected.includes(interestToDelete)) {
            updateFormData({ interests: selected.filter(i => i !== interestToDelete) });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleAddInterest();
        }
        if (e.key === "Escape") {
            setShowAddInput(false);
            setNewInterest("");
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateFormData({ interests: [] });
    };

    return (
        <div
            className="md:col-span-12 order-7 md:order-7 apply-card glass-effect border border-border p-8 rounded-xl shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#10b981]/50 focus-within:border-[#10b981] focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            onMouseEnter={() => updateFormData({ mascot_emotion: 'excited' })}
            onMouseLeave={() => updateFormData({ mascot_emotion: 'neutral' })}
            onFocus={() => updateFormData({ mascot_emotion: 'excited' })}
            onBlur={() => updateFormData({ mascot_emotion: 'neutral' })}
            tabIndex={0}
        >
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold text-text-primary">Interests</h3>
                        <p className="text-text-secondary text-sm">
                            Select your areas of expertise
                        </p>
                    </div>
                    {selected.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium px-3 py-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Clear
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    {interests.map((interest) => {
                        const isCustom = !DEFAULT_INTERESTS.includes(interest);
                        return (
                            <button
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 hover:scale-105 active:scale-95 ${selected.includes(interest)
                                    ? "bg-primary text-text-primary shadow-md shadow-primary/30"
                                    : "border border-border hover:border-primary hover:text-primary bg-transparent text-text-primary"
                                    }`}
                            >
                                {interest}
                                {isCustom && (
                                    <span
                                        onClick={(e) => handleDeleteInterest(interest, e)}
                                        className="material-symbols-outlined text-xs opacity-60 hover:opacity-100 hover:text-red-400 transition-colors rounded-full p-0.5"
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
                                onKeyDown={handleKeyDown}
                                placeholder="Type interest..."
                                className="px-4 py-2 rounded-full text-sm border border-[#475569] bg-background-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 w-40"
                                autoFocus
                            />
                            <button
                                onClick={handleAddInterest}
                                className="w-8 h-8 rounded-full bg-primary text-text-primary flex items-center justify-center hover:bg-primary-hover transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">check</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddInput(false);
                                    setNewInterest("");
                                }}
                                className="w-8 h-8 rounded-full bg-border text-text-secondary flex items-center justify-center hover:bg-[#475569] transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddInput(true)}
                            className="px-5 py-2 rounded-full text-sm font-medium border-2 border-dashed border-[#475569] text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Add
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
};

export default InterestsCard;
