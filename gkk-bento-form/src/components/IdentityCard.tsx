import { useState, useEffect, useRef } from 'react';
import { useFormContext } from '@/context/FormContext';
import { supabase } from '@/lib/supabase';

interface IdentityCardProps {
    onFocus: () => void;
    onBlur: () => void;
}

const IdentityCard: React.FC<IdentityCardProps> = ({ onFocus, onBlur }) => {
    const { formData, updateFormData } = useFormContext();
    const [status, setStatus] = useState<'college' | 'dropout' | 'other'>('college');
    const [shakeEmail, setShakeEmail] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [userOTP, setUserOTP] = useState('');
    const [otpError, setOtpError] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyToken, setVerifyToken] = useState('');

    const handleSendOTP = async () => {
        if (!formData.email) return;

        setIsSending(true);
        updateFormData({ mascot_emotion: 'thinking' });

        try {
            const { data, error: invokeError } = await supabase.functions.invoke('gkk-intern-form-verification', {
                body: { action: 'send-otp', email: formData.email }
            });

            if (data && data.success) {
                setVerifyToken(data.verifyToken);
                setIsSending(false);
                setShowOTPInput(true);
                updateFormData({ mascot_emotion: 'curious' });
            } else {
                const errorMsg = invokeError?.message || data?.error || data?.message || "Failed to send OTP. Please try again.";
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            setIsSending(false);
            updateFormData({ mascot_emotion: 'angry' });
            alert(error.message || "Failed to send OTP. Please try again later.");
        }
    };

    const handleVerifyOTP = async (code: string) => {
        setIsVerifying(true);
        setOtpError(false);

        try {
            const { data, error: invokeError } = await supabase.functions.invoke('gkk-intern-form-verification', {
                body: {
                    action: 'verify-otp',
                    email: formData.email,
                    code: code,
                    token: verifyToken
                }
            });

            if (data && data.success) {
                updateFormData({
                    is_email_verified: true,
                    mascot_emotion: 'excited'
                });
                setShowOTPInput(false);
            } else {
                setOtpError(true);
                updateFormData({ mascot_emotion: 'neutral' });
                const errorMsg = invokeError?.message || data?.error || data?.message || "Invalid or expired code.";
                alert(errorMsg);
                setTimeout(() => setOtpError(false), 2000);
            }
        } catch (error: any) {
            setOtpError(true);
            updateFormData({ mascot_emotion: 'neutral' });
            alert(error.message || "An unexpected error occurred during verification.");
        } finally {
            setIsVerifying(false);
        }
    };

    // Initialize status based on existing data
    useEffect(() => {
        if (formData.college?.startsWith('Dropout:')) {
            setStatus('dropout');
        } else if (formData.college?.startsWith('Other:')) {
            setStatus('other');
        } else {
            setStatus('college');
        }
    }, [formData.college]);

    const handleStatusChange = (newStatus: 'college' | 'dropout' | 'other') => {
        setStatus(newStatus);
        // Clear value when switching statuses to avoid confusion
        if (newStatus === 'college') {
            updateFormData({ college: '' });
        } else if (newStatus === 'dropout') {
            updateFormData({ college: 'Dropout: ' });
        } else if (newStatus === 'other') {
            updateFormData({ college: 'Other: ' });
        }
    };

    // Local state for split names
    const [firstName, setFirstName] = useState(() => {
        const parts = formData.full_name?.split(' ') || [];
        return parts[0] || '';
    });
    const [lastName, setLastName] = useState(() => {
        const parts = formData.full_name?.split(' ') || [];
        return parts.slice(1).join(' ') || '';
    });

    // Guard ref to prevent sync loops between local state ↔ formData
    const syncingFromExternal = useRef(false);

    // Sync local firstName/lastName → formData.full_name (only when user types)
    useEffect(() => {
        if (syncingFromExternal.current) return; // Skip if external sync triggered this
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        if (formData.full_name !== fullName) {
            updateFormData({ full_name: fullName });
        }
    }, [firstName, lastName]);

    // Sync formData.full_name → local firstName/lastName (when AI auto-fill or clear sets it)
    useEffect(() => {
        const currentLocal = [firstName, lastName].filter(Boolean).join(' ');
        if (formData.full_name === currentLocal) return; // Already in sync

        syncingFromExternal.current = true;
        if (!formData.full_name) {
            setFirstName('');
            setLastName('');
        } else {
            const parts = formData.full_name.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
        }
        // Reset guard after React processes the state updates
        requestAnimationFrame(() => { syncingFromExternal.current = false; });
    }, [formData.full_name]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateFormData({ full_name: '', email: '', is_email_verified: false, college: '' });
        setFirstName('');
        setLastName('');
        setStatus('college');
        setShowOTPInput(false);
        setUserOTP('');
        setOtpError(false);
    };

    return (
        <div
            className="w-full h-full apply-card glass-hub p-4 md:p-8 rounded-xl shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#10b981]/50 flex flex-col gap-4 md:gap-6"
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-text-primary">Identity</h3>
                    <p className="text-text-secondary text-sm">
                        Cloudy wants to know who you are
                    </p>
                </div>
                {(formData.full_name || formData.email || formData.college) && (
                    <button
                        onClick={handleClear}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium px-3 py-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Clear
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-text-secondary">First Name</span>
                    <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        className="p-3 bg-background-card border border-border rounded-lg text-text-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all animate-fadeInFast"
                        placeholder="Aditya"
                    />
                </label>
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-text-secondary">Last Name</span>
                    <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        className="p-3 bg-background-card border border-border rounded-lg text-text-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all animate-fadeInFast"
                        placeholder="Sharma"
                    />
                </label>
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-text-secondary">Email Address</span>
                    <input
                        value={formData.email || ''}
                        onChange={(e) => {
                            updateFormData({ email: e.target.value });
                        }}
                        onFocus={onFocus}
                        onBlur={() => {
                            onBlur();
                            if (formData.email && !formData.email.endsWith('@gmail.com')) {
                                setShakeEmail(true);
                                setTimeout(() => setShakeEmail(false), 400);
                            }
                        }}
                        className={`p-3 bg-background-card border border-border rounded-lg text-text-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all animate-fadeInFast ${shakeEmail ? 'animate-shake' : ''} ${formData.email && !formData.email.endsWith('@gmail.com') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}`}
                        placeholder="okay@gmail.com"
                    />
                    {formData.email && !formData.email.endsWith('@gmail.com') && (
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1 animate-slideUp">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            Must be a @gmail.com address
                        </span>
                    )}
                </label>
                {/* Email Verification Logic replacement for Phone Number */}
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-text-secondary">Email Verification</span>
                    {!formData.is_email_verified ? (
                        <div className="flex flex-col gap-3">
                            {!showOTPInput ? (
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={!formData.email || !formData.email.endsWith('@gmail.com') || isSending}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-primary/10 border border-primary text-primary rounded-lg font-bold hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <span className="material-symbols-outlined transition-transform group-hover:rotate-12">
                                        {isSending ? 'hourglass_empty' : 'verified_user'}
                                    </span>
                                    {isSending ? 'Sending OTP...' : 'Send Verification OTP'}
                                </button>
                            ) : (
                                <div className="flex flex-col gap-2 animate-slideUp">
                                    <div className="relative">
                                        <input
                                            value={userOTP}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setUserOTP(val);
                                                if (val.length === 6) handleVerifyOTP(val);
                                            }}
                                            onFocus={onFocus}
                                            onBlur={onBlur}
                                            className={`w-full p-3 bg-background-card border ${otpError ? 'border-red-500' : 'border-border'} rounded-lg text-text-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center tracking-[0.5em] font-black text-lg`}
                                            placeholder="••••••"
                                            maxLength={6}
                                        />
                                        {isVerifying && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowOTPInput(false)}
                                            className="text-[10px] text-text-muted hover:text-text-primary transition-colors underline"
                                        >
                                            Change Email / Resend
                                        </button>
                                        {otpError && (
                                            <span className="text-[10px] text-red-500 font-bold animate-shake">
                                                Invalid Code
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-500 animate-fadeInScale">
                            <span className="material-symbols-outlined text-[20px]">verified</span>
                            <span className="text-sm font-bold uppercase tracking-wider">Email Verified Successfully</span>
                        </div>
                    )}
                </div>

                {/* College / Education Section */}
                <div className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-text-secondary">Education Status <span className="text-red-500">*</span></span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Selector - Simple Buttons */}
                        <div className="flex gap-2">
                            {([
                                { key: 'college' as const, label: 'College / University', icon: 'school' },
                                { key: 'dropout' as const, label: 'Dropout', icon: 'trending_down' },
                                { key: 'other' as const, label: 'Other', icon: 'more_horiz' },
                            ]).map(({ key, label, icon }) => {
                                const isSelected = status === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleStatusChange(key)}
                                        className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-bold transition-all duration-200 border-2 ${isSelected
                                            ? 'bg-primary/15 border-primary text-primary shadow-md'
                                            : 'border-border bg-background-card text-text-secondary hover:border-primary/50 hover:text-primary'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{icon}</span>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Conditional Inputs */}
                        <div className="w-full">
                            {/* COLLEGE INPUT */}
                            {status === 'college' && (
                                <input
                                    value={formData.college || ''}
                                    onChange={(e) => updateFormData({ college: e.target.value })}
                                    placeholder="Indian Institute of Technology, Delhi"
                                    type="text"
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    className="animate-slideUp transition-all duration-300 hover:shadow-md focus:scale-[1.01] focus:shadow-lg transform origin-center"
                                />
                            )}

                            {/* DROPOUT TAGS */}
                            {status === 'dropout' && (
                                <div className="flex flex-wrap gap-2 animate-slideUp min-h-14 items-center">
                                    {['0-1 years', '1-2 years', '2+ years', 'Start-up Dropout'].map((opt) => {
                                        const value = `Dropout: ${opt}`;
                                        const isSelected = formData.college === value;
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => {
                                                    updateFormData({ college: value });
                                                    onFocus(); // Trigger focus state for mascot
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${isSelected
                                                    ? 'bg-[#10b981] text-white border-[#10b981] shadow-lg shadow-emerald-900/20 transform scale-105'
                                                    : 'bg-background-light border-border text-text-secondary hover:border-primary/50 hover:text-primary'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                    {formData.college === 'Dropout: Start-up Dropout' && (
                                        <p className="text-xs text-[#10b981] italic ml-2 animate-slideUp">
                                            * Dropped out to build a startup? We value builders.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* OTHER TEXTAREA */}
                            {status === 'other' && (
                                <textarea
                                    value={formData.college?.startsWith('Other:') ? formData.college.replace('Other: ', '') : ''}
                                    onChange={(e) => updateFormData({ college: `Other: ${e.target.value}` })}
                                    placeholder="Briefly describe your current educational or professional status."
                                    rows={1}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    className="w-full bg-background-card border border-border rounded-xl h-14 px-4 py-3.5 text-text-primary focus:border-primary focus:ring-4 focus:ring-primary/15 outline-none transition-all duration-300 resize-none text-sm animate-fadeIn hover:shadow-md focus:scale-[1.01] focus:shadow-lg transform origin-center"
                                    style={{ lineHeight: '1.5' }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default IdentityCard;
