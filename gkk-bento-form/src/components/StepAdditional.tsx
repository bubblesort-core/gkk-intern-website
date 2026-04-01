import { useState, useEffect } from 'react';
import { useFormContext } from '@/context/FormContext';

const DEFAULT_INTERESTS = ['Frontend', 'Backend', 'Fullstack', 'UI/UX', 'Mobile', 'DevOps', 'AI/ML'];
const DISCOVERY_OPTIONS = ['LinkedIn', 'Referral', 'Social Media', 'Other'];

const StepAdditional: React.FC = () => {
    const { formData, updateFormData, termsAccepted, setTermsAccepted } = useFormContext();
    const [interests, setInterests] = useState<string[]>(DEFAULT_INTERESTS);
    const [newInterest, setNewInterest] = useState('');
    const [showAddInput, setShowAddInput] = useState(false);

    useEffect(() => {
        if (formData.interests && formData.interests.length > 0) {
            setInterests(prev => {
                const newItems = (formData.interests || []).filter(i => !prev.includes(i));
                return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
        }
    }, []);

    const selected = formData.interests || [];
    const discoverySource = formData.discovery_source || '';

    const toggleInterest = (interest: string) => {
        const next = selected.includes(interest)
            ? selected.filter(i => i !== interest)
            : [...selected, interest];
        updateFormData({ interests: next });
    };

    const addCustom = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            const trimmed = newInterest.trim();
            setInterests(prev => [...prev, trimmed]);
            updateFormData({ interests: [...selected, trimmed] });
            setNewInterest('');
            setShowAddInput(false);
        }
    };

    const deleteInterest = (interest: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setInterests(prev => prev.filter(i => i !== interest));
        if (selected.includes(interest)) {
            updateFormData({ interests: selected.filter(i => i !== interest) });
        }
    };

    return (
        <div className="step-enter flex flex-col gap-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                    Almost there!
                </h2>
                <p className="text-text-secondary text-sm mt-1">Tell us about your interests and how you found us</p>
            </div>

            {/* Interests */}
            <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Your Interests</span>
                <div className="flex flex-wrap gap-2">
                    {interests.map(interest => {
                        const isCustom = !DEFAULT_INTERESTS.includes(interest);
                        const isSel = selected.includes(interest);
                        return (
                            <button key={interest} onClick={() => toggleInterest(interest)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.97]
                                    ${isSel ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 tag-pop' : 'border-border bg-bg-input text-text-secondary hover:border-primary/40 hover:text-primary'}
                                `}>
                                {interest}
                                {isCustom && (
                                    <span onClick={(e) => deleteInterest(interest, e)}
                                        className="material-symbols-outlined text-xs opacity-60 hover:opacity-100 hover:text-red-400 transition-colors">close</span>
                                )}
                            </button>
                        );
                    })}

                    {showAddInput ? (
                        <div className="flex items-center gap-2">
                            <input type="text" value={newInterest} onChange={(e) => setNewInterest(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') { setShowAddInput(false); setNewInterest(''); } }}
                                placeholder="Type interest..."
                                className="!w-36 !h-10 rounded-xl text-sm bg-bg-input !text-text-primary border-white/10 px-3" autoFocus />
                            <button onClick={addCustom}
                                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors">
                                <span className="material-symbols-outlined">check</span>
                            </button>
                            <button onClick={() => { setShowAddInput(false); setNewInterest(''); }}
                                className="w-10 h-10 rounded-xl bg-bg-input border border-border text-text-muted flex items-center justify-center hover:bg-border/30 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowAddInput(true)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-border text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">add</span>
                            Add
                        </button>
                    )}
                </div>
            </div>

            {/* Discovery */}
            <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">How did you find us?</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DISCOVERY_OPTIONS.map(opt => {
                        const isSel = discoverySource === opt;
                        let icon = 'public';
                        if (opt === 'LinkedIn') icon = 'share';
                        if (opt === 'Referral') icon = 'group';
                        if (opt === 'Social Media') icon = 'diversity_3';
                        if (opt === 'Other') icon = 'more_horiz';
                        return (
                            <button key={opt} onClick={() => updateFormData({ discovery_source: opt })}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:scale-[1.03]
                                    ${isSel ? 'bg-primary/10 border-primary shadow-sm' : 'bg-bg-input border-border hover:border-primary/40'}
                                `}>
                                <span className={`material-symbols-outlined text-xl transition-colors ${isSel ? 'text-primary' : 'text-text-muted'}`}>{icon}</span>
                                <span className={`text-xs font-bold ${isSel ? 'text-primary' : 'text-text-secondary'}`}>{opt}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Terms */}
            <div className="mt-2 flex flex-col gap-4">
                <label className="flex items-start gap-3 cursor-pointer group" onClick={() => setTermsAccepted(!termsAccepted)}>
                    <div className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all shrink-0
                        ${termsAccepted ? 'bg-primary border-primary' : 'border-border bg-bg-input group-hover:border-primary/40'}
                    `}>
                        {termsAccepted && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                                <path d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm text-text-secondary leading-snug select-none">
                        I agree to the <a href="/terms.html" target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>Terms & Conditions</a> and confirm all information is accurate
                    </span>
                </label>

                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Your data is secure 🔒
                </div>
            </div>
        </div>
    );
};

export default StepAdditional;
