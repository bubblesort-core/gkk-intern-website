import { useState } from "react";
import { useFormContext } from '@/context/FormContext';
interface QuickInfoCardProps {
    icon: string;
    label: string;
    placeholder: string;
    type?: string;
    fieldName: 'phone' | 'whatsapp_number' | 'age' | 'sex';
    options?: string[];
}

const QuickInfoCard: React.FC<QuickInfoCardProps> = ({ icon, label, placeholder, type = "text", fieldName, options }) => {
    const { formData, updateFormData } = useFormContext();
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const value = formData[fieldName] || '';
    const isSaved = value.trim() !== '';
    const isFlipped = isHovered || isFocused;
    const [shakeError, setShakeError] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && value.trim()) {
            (document.activeElement as HTMLElement)?.blur();
        }
    };

    const handleClick = () => {
        setIsFocused(true);
    };

    return (
        <div
            className="flex flex-col items-center justify-center p-4 bg-background-card/50 border border-border rounded-xl shadow-sm cursor-pointer transition-all duration-300 relative overflow-hidden h-full hover:bg-primary/10 perspective-1000 hover:scale-[1.02] hover:shadow-md focus-within:ring-2 focus-within:ring-[#10b981]/50 focus-within:border-[#10b981] focus-within:shadow-[0_0_15px_rgba(16,185,129,0.15)] glass-hub"
            onClick={handleClick}
            onMouseEnter={() => {
                setIsHovered(true);
                updateFormData({ mascot_emotion: 'curious' });
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                updateFormData({ mascot_emotion: 'neutral' });
            }}
            onFocus={() => {
                setIsFocused(true);
                updateFormData({ mascot_emotion: 'curious' });
            }}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsFocused(false);
                    updateFormData({ mascot_emotion: 'neutral' });
                }
            }}
            tabIndex={0}
        >
            <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d`}
                style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transition: "transform 0.5s ease",
                }}
            >
                {/* Front Side */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-2 backface-hidden ${isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
                        }`}
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <span
                        className={`material-symbols-outlined text-3xl transition-all ${isSaved ? "text-primary" : "text-text-primary"
                            } group-hover:scale-110`}
                    >
                        {icon}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                        {isSaved ? value : label}
                    </span>
                </div>

                {/* Back Side */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    {options ? (
                        <select
                            value={value}
                            onChange={(e) => {
                                updateFormData({ [fieldName]: e.target.value });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-center text-sm py-2 px-2 rounded-lg border border-[#475569] bg-background-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer animate-fadeInFast"
                        >
                            <option value="" disabled>{placeholder}</option>
                            {options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="relative w-full flex items-center">
                            {(fieldName === 'phone' || fieldName === 'whatsapp_number') && (
                                <span className="absolute left-2 text-sm text-text-secondary font-medium pointer-events-none">
                                    +91
                                </span>
                            )}
                            <input
                                type={type}
                                value={value}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    // Numeric restriction for phone fields
                                    if (fieldName === 'phone' || fieldName === 'whatsapp_number') {
                                        val = val.replace(/\D/g, ''); // Remove non-digits
                                        if (val.length > 12) val = val.slice(0, 12); // Limit to 12
                                    }
                                    updateFormData({ [fieldName]: val });
                                }}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={fieldName === 'phone' || fieldName === 'whatsapp_number' ? '9876543210' : placeholder}
                                className={`w-full text-center text-sm py-2 px-2 rounded-lg border bg-background-card text-text-primary focus:outline-none focus:ring-2 animate-fadeInFast transition-all duration-300 ${(fieldName === 'phone' || fieldName === 'whatsapp_number') ? 'pl-10' : ''} ${shakeError ? 'animate-shake border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-[#475569] focus:ring-primary/30 focus:border-primary'}`}
                                autoFocus={isFlipped}
                                onBlur={() => {
                                    if ((fieldName === 'phone' || fieldName === 'whatsapp_number') && value.length > 0 && value.length < 10) {
                                        setShakeError(true);
                                        setTimeout(() => setShakeError(false), 500);
                                    }
                                }}
                            />
                            {/* Validation Icon for Text Inputs */}
                            {value.length > 0 && !shakeError && !options && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-sm bg-background-card">check_circle</span>
                            )}
                        </div>
                    )}
                    <span className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-full text-center text-[10px] ${shakeError ? 'text-red-500 font-bold animate-shake' : 'text-text-muted'}`}>
                        {options ? "Select an option" : (
                            (fieldName === 'phone' || fieldName === 'whatsapp_number') && value.length < 10
                                ? `${10 - value.length} digits left`
                                : "Press Enter to save"
                        )}
                    </span>
                </div>
            </div >
        </div >
    );
};

const QuickInfoCards: React.FC = () => {
    const { formData, updateFormData } = useFormContext();
    const hasAnyField = !!(formData.phone || formData.whatsapp_number || formData.age || formData.sex);

    const handleClearAll = () => {
        updateFormData({ phone: '', whatsapp_number: '', age: '', sex: '' });
    };

    return (
        <div className="w-full h-full flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
                <span className="text-sm font-bold text-text-primary">Quick Info</span>
                {hasAnyField && (
                    <button
                        onClick={handleClearAll}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-medium px-2 py-1 bg-red-400/10 hover:bg-red-400/20 rounded-md flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[12px]">delete</span>
                        Clear All
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1">
                <QuickInfoCard icon="phone" label="Phone" placeholder="+91 9876543210" type="tel" fieldName="phone" />
                <QuickInfoCard icon="chat" label="WhatsApp" placeholder="+91 9876543210" type="tel" fieldName="whatsapp_number" />
                <QuickInfoCard icon="cake" label="Age" placeholder="25" type="number" fieldName="age" />
                <QuickInfoCard icon="diversity_3" label="Sex" placeholder="Select" fieldName="sex" options={["Male", "Female", "Other"]} />
            </div>
            <p className="text-xs text-center text-text-secondary italic mt-2">
                Hover or click on any card to add details
            </p>
        </div>
    );
};

export default QuickInfoCards;
