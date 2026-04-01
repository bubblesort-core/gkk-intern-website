import { useState, useEffect } from 'react';
import { useFormContext } from '@/context/FormContext';
import { supabase } from '@/lib/supabase';

const StepIdentity: React.FC = () => {
    const { formData, updateFormData, firstName, setFirstName, lastName, setLastName, setCloudyMessage } = useFormContext();
    const [status, setStatus] = useState<'college' | 'dropout' | 'other'>('college');
    const [shakeEmail, setShakeEmail] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [userOTP, setUserOTP] = useState('');
    const [otpError, setOtpError] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyToken, setVerifyToken] = useState('');

    // Sync names to full_name
    useEffect(() => {
        const full = [firstName, lastName].filter(Boolean).join(' ');
        if (formData.full_name !== full) {
            updateFormData({ full_name: full });
        }
    }, [firstName, lastName]);

    // Education status init
    useEffect(() => {
        if (formData.college?.startsWith('Dropout:')) setStatus('dropout');
        else if (formData.college?.startsWith('Other:')) setStatus('other');
        else setStatus('college');
    }, []);

    const handleStatusChange = (s: 'college' | 'dropout' | 'other') => {
        setStatus(s);
        if (s === 'college') updateFormData({ college: '' });
        else if (s === 'dropout') updateFormData({ college: 'Dropout: ' });
        else updateFormData({ college: 'Other: ' });
    };

    const handleSendOTP = async () => {
        if (!formData.email) return;
        setIsSending(true);
        setCloudyMessage("Check your inbox! Enter the OTP to verify ✉️");
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('gkk-intern-form-verification', {
                body: { action: 'send-otp', email: formData.email }
            });
            if (data?.success) {
                setVerifyToken(data.verifyToken);
                setIsSending(false);
                setShowOTPInput(true);
            } else {
                throw new Error(invokeError?.message || data?.error || "Failed to send OTP.");
            }
        } catch (error: any) {
            setIsSending(false);
            alert(error.message || "Failed to send OTP.");
        }
    };

    const handleVerifyOTP = async (code: string) => {
        setIsVerifying(true);
        setOtpError(false);
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('gkk-intern-form-verification', {
                body: { action: 'verify-otp', email: formData.email, code, token: verifyToken }
            });
            if (data?.success) {
                updateFormData({ is_email_verified: true });
                setShowOTPInput(false);
                setCloudyMessage("Email verified! You're off to a great start ✅");
            } else {
                setOtpError(true);
                alert(invokeError?.message || data?.error || "Invalid code.");
                setTimeout(() => setOtpError(false), 2000);
            }
        } catch (error: any) {
            setOtpError(true);
            alert(error.message || "Verification failed.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="step-enter flex flex-col gap-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                    Who are you?
                </h2>
                <p className="text-text-secondary text-sm mt-1">Tell us about yourself to get started</p>
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">First Name <span className="text-red-500">*</span></span>
                    <div className="relative">
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Aditya" className="bg-bg-input !text-text-primary border-white/10 w-full px-4 h-12 rounded-xl !pr-10" />
                        {firstName && <button type="button" onClick={() => setFirstName('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                    </div>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Last Name <span className="text-red-500">*</span></span>
                    <div className="relative">
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sharma" className="bg-bg-input !text-text-primary border-white/10 w-full px-4 h-12 rounded-xl !pr-10" />
                        {lastName && <button type="button" onClick={() => setLastName('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                    </div>
                </label>
            </div>

            {/* Email + OTP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Email <span className="text-red-500">*</span></span>
                    <div className="relative">
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => updateFormData({ email: e.target.value, is_email_verified: false })}
                            onBlur={() => {
                                if (formData.email && !formData.email.endsWith('@gmail.com')) {
                                    setShakeEmail(true);
                                    setTimeout(() => setShakeEmail(false), 400);
                                }
                            }}
                            placeholder="name@gmail.com"
                            className={`bg-bg-input !text-text-primary border-white/10 w-full px-4 h-12 rounded-xl !pr-10 ${shakeEmail ? 'animate-shake' : ''} ${formData.email && !formData.email.endsWith('@gmail.com') ? '!border-red-400 focus:!border-red-400' : ''}`}
                        />
                        {formData.email && <button type="button" onClick={() => updateFormData({ email: '', is_email_verified: false })} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                    </div>
                    {formData.email && !formData.email.endsWith('@gmail.com') && (
                        <span className="text-xs text-red-500 font-medium flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            Must be a @gmail.com address
                        </span>
                    )}
                </label>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Email Verification <span className="text-red-500">*</span></span>
                    {!formData.is_email_verified ? (
                        !showOTPInput ? (
                            <button
                                onClick={handleSendOTP}
                                disabled={!formData.email || !formData.email.endsWith('@gmail.com') || isSending}
                                className="h-12 flex items-center justify-center gap-2 bg-primary/10 border border-primary text-primary rounded-xl font-bold hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                            >
                                <span className="material-symbols-outlined text-lg">{isSending ? 'hourglass_empty' : 'verified_user'}</span>
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
                                        placeholder="••••••"
                                        maxLength={6}
                                        className={`bg-bg-input !text-text-primary border-white/10 w-full h-12 rounded-xl text-center tracking-[0.5em] font-black text-lg ${otpError ? '!border-red-400' : ''}`}
                                    />
                                    {isVerifying && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => { setShowOTPInput(false); setUserOTP(''); }} className="text-[10px] text-text-muted hover:text-primary transition-colors underline self-start">
                                    Change Email / Resend
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="h-12 flex items-center gap-2 px-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-600 animate-fadeIn">
                            <span className="material-symbols-outlined text-lg">verified</span>
                            <span className="text-sm font-bold uppercase tracking-wider">Email Verified</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Education Status */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Education Status <span className="text-red-500">*</span></span>
                <div className="flex gap-2">
                    {([
                        { key: 'college' as const, label: 'College / University', icon: 'school' },
                        { key: 'dropout' as const, label: 'Dropout', icon: 'trending_down' },
                        { key: 'other' as const, label: 'Other', icon: 'more_horiz' },
                    ]).map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => handleStatusChange(key)}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-bold transition-all border-2
                                ${status === key
                                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                    : 'border-border bg-bg-input text-text-secondary hover:border-primary/40 hover:text-primary'}
                            `}
                        >
                            <span className="material-symbols-outlined text-lg">{icon}</span>
                            {label}
                        </button>
                    ))}
                </div>
                {/* Conditional inputs */}
                {status === 'college' && (
                    <div className="relative mt-2">
                        <input
                            value={formData.college || ''}
                            onChange={(e) => updateFormData({ college: e.target.value })}
                            placeholder="Indian Institute of Technology, Delhi"
                            className="bg-bg-input !text-text-primary border-white/10 w-full px-4 h-12 rounded-xl !pr-10"
                        />
                        {(formData.college || '') !== '' && <button type="button" onClick={() => updateFormData({ college: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                    </div>
                )}
                {status === 'dropout' && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {['0-1 years', '1-2 years', '2+ years', 'Start-up Dropout'].map((opt) => {
                            const value = `Dropout: ${opt}`;
                            return (
                                <button key={opt} onClick={() => updateFormData({ college: value })}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                                        ${formData.college === value ? 'bg-primary text-white border-primary' : 'bg-bg-input border-border text-text-secondary hover:border-primary/40'}
                                    `}>{opt}</button>
                            );
                        })}
                    </div>
                )}
                {status === 'other' && (
                    <div className="relative mt-2">
                        <textarea
                            value={formData.college?.startsWith('Other:') ? formData.college.replace('Other: ', '') : ''}
                            onChange={(e) => updateFormData({ college: `Other: ${e.target.value}` })}
                            placeholder="Briefly describe your current status."
                            rows={2}
                            className="!pr-10"
                        />
                        {(formData.college || '') !== 'Other: ' && (formData.college || '') !== '' && <button type="button" onClick={() => updateFormData({ college: 'Other: ' })} className="absolute right-3 top-3 text-text-muted hover:text-text-primary"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                    </div>
                )}
            </div>

            {/* Phone, WhatsApp, Age, Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Phone <span className="text-red-500">*</span></span>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">+91</span>
                        <input type="tel" value={formData.phone || ''} onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                            updateFormData({ phone: v });
                        }} placeholder="9876543210" className="bg-bg-input !text-text-primary border-white/10 w-full h-12 rounded-xl !pl-10 !pr-10" />
                        {formData.phone && <button type="button" onClick={() => updateFormData({ phone: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                    </div>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">WhatsApp <span className="text-red-500">*</span></span>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">+91</span>
                        <input type="tel" value={formData.whatsapp_number || ''} onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                            updateFormData({ whatsapp_number: v });
                        }} placeholder="9876543210" className="bg-bg-input !text-text-primary border-white/10 w-full h-12 rounded-xl !pl-10 !pr-10" />
                        {formData.whatsapp_number && <button type="button" onClick={() => updateFormData({ whatsapp_number: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                    </div>
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Age <span className="text-red-500">*</span></span>
                    <div className="relative">
                        <input type="number" value={formData.age || ''} onChange={(e) => updateFormData({ age: e.target.value })} placeholder="21" min="16" max="40" className="bg-bg-input !text-text-primary border-white/10 w-full px-4 h-12 rounded-xl !pr-10" />
                        {formData.age && <button type="button" onClick={() => updateFormData({ age: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"><span className="material-symbols-outlined text-[18px]">close</span></button>}
                    </div>
                </label>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Gender <span className="text-red-500">*</span></span>
                    <div className="flex gap-2">
                        {['Male', 'Female', 'Other'].map(g => (
                            <button key={g} onClick={() => updateFormData({ sex: formData.sex === g ? '' : g })}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all
                                    ${formData.sex === g ? 'bg-primary/10 border-primary text-primary' : 'border-border bg-bg-input text-text-secondary hover:border-primary/40'}
                                `}>{g}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepIdentity;
