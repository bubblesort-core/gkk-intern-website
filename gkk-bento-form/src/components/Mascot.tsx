import React, { useState, useMemo } from "react";
import { useFormContext } from '@/context/FormContext';
import { submitFormData, uploadFileWithId, updateCvUrl } from '@/lib/supabase';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

interface MascotProps {
    eyesClosed: boolean;
    eyePosition: { x: number; y: number };
    isTyping?: boolean;
}

const Mascot: React.FC<MascotProps> = ({ eyesClosed, eyePosition, isTyping = false }) => {
    const { formData, updateFormData, cvFile, resetForm, activeBatch } = useFormContext();
    const emotion = formData.mascot_emotion || 'neutral';

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation - check if all mandatory fields are filled
    const isFormValid = useMemo(() => {
        const hasIdentity = !!(formData.full_name?.trim() && formData.email?.trim());
        const hasPhone = !!formData.phone?.trim();
        const hasWhatsApp = !!formData.whatsapp_number?.trim();
        const hasAge = !!formData.age?.trim();
        const hasSex = !!formData.sex?.trim();
        const hasSchedule = !!(formData.interview_date && formData.interview_time);
        const hasInterests = !!(formData.interests && formData.interests.length > 0);
        const hasDiscovery = !!formData.discovery_source;
        const hasCollege = !!formData.college?.trim();
        const isEmailVerified = !!formData.is_email_verified;

        return hasIdentity && hasPhone && hasWhatsApp && hasAge && hasSex && hasSchedule && hasInterests && hasDiscovery && hasCollege && isEmailVerified;
    }, [formData]);

    // Get missing fields for tooltip/angry message
    const missingFields = useMemo(() => {
        const missing: string[] = [];
        if (!formData.full_name?.trim()) missing.push("Full Name");
        if (!formData.email?.trim()) missing.push("Email");
        if (!formData.phone?.trim()) missing.push("Phone");
        if (!formData.whatsapp_number?.trim()) missing.push("WhatsApp");
        if (!formData.age?.trim()) missing.push("Age");
        if (!formData.sex?.trim()) missing.push("Sex");
        if (!formData.college?.trim()) missing.push("College/Status");
        if (!formData.interview_date || !formData.interview_time) missing.push("Interview Schedule");
        if (!formData.interests || formData.interests.length === 0) missing.push("Interests");
        if (!formData.discovery_source) missing.push("Discovery Source");
        if (!formData.is_email_verified) missing.push("Email Verification");
        return missing;
    }, [formData]);

    const handleFormSubmit = async () => {
        if (!isFormValid) {
            updateFormData({ mascot_emotion: 'angry' });
            return;
        }

        // Strict Validation Checks before submission
        if (!formData.full_name || formData.full_name.trim().split(/\s+/).length < 2) {
            updateFormData({ mascot_emotion: 'angry' });
            await Swal.fire({
                icon: 'error',
                title: 'Incomplete Name',
                text: 'Please enter both First Name and Last Name.',
                confirmButtonColor: '#ef4444',
                background: '#0f172a',
                color: '#f8fafc'
            });
            return;
        }

        if (formData.email && !formData.email.endsWith('@gmail.com')) {
            updateFormData({ mascot_emotion: 'angry' });
            await Swal.fire({
                icon: 'error',
                title: 'Invalid Email',
                text: 'Please use a valid @gmail.com address.',
                confirmButtonColor: '#ef4444',
                background: '#0f172a',
                color: '#f8fafc'
            });
            return;
        }

        if (formData.phone && formData.phone.length !== 10) {
            updateFormData({ mascot_emotion: 'angry' });
            await Swal.fire({
                icon: 'error',
                title: 'Invalid Phone Number',
                text: 'Phone number must be exactly 10 digits.',
                confirmButtonColor: '#ef4444',
                background: '#0f172a',
                color: '#f8fafc'
            });
            return;
        }

        if (!formData.college?.trim()) {
            updateFormData({ mascot_emotion: 'angry' });
            await Swal.fire({
                icon: 'warning',
                title: 'Education Missing',
                text: 'Please specify your College or Status.',
                confirmButtonColor: '#f59e0b',
                background: '#0f172a',
                color: '#f8fafc'
            });
            return;
        }

        if (!formData.is_email_verified) {
            updateFormData({ mascot_emotion: 'angry' });
            await Swal.fire({
                icon: 'warning',
                title: 'Email Not Verified',
                text: 'Please verify your email address in the Identity section before submitting.',
                confirmButtonColor: '#f59e0b',
                background: '#0f172a',
                color: '#f8fafc'
            });
            return;
        }

        // Confirmation Dialog
        const result = await Swal.fire({
            title: 'Confirm Details',
            html: `
                <div class="text-left bg-background-card p-4 rounded-lg flex flex-col gap-3 text-sm">
                    <div class="flex flex-col gap-1 border-b border-border pb-2">
                        <span class="text-text-secondary text-xs uppercase tracking-wider">Identity</span>
                        <div class="flex justify-between items-center">
                            <span class="text-text-primary font-medium">${formData.full_name || '-'}</span>
                        </div>
                        <span class="text-[#10b981]">${formData.email || '-'}</span>
                    </div>

                    <div class="flex flex-col gap-1 border-b border-border pb-2">
                        <span class="text-text-secondary text-xs uppercase tracking-wider">Contact</span>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">Phone:</span>
                            <span class="text-text-primary font-medium">+91 ${formData.phone || '-'}</span>
                        </div>
                    </div>

                     <div class="flex flex-col gap-1">
                        <span class="text-text-secondary text-xs uppercase tracking-wider">Education</span>
                         <span class="text-text-primary">${formData.college || formData.age + ' yo, ' + formData.sex || '-'}</span>
                    </div>

                    <div class="flex flex-col gap-1 border-t border-border pt-2 mt-1">
                        <span class="text-text-secondary text-xs uppercase tracking-wider">Interview Preference</span>
                        <div class="flex justify-between">
                             <span class="text-text-primary"><span class="text-[#10b981]">📅</span> ${formData.interview_date || '-'}</span>
                             <span class="text-text-primary"><span class="text-[#10b981]">⏰</span> ${formData.interview_time || '-'}</span>
                        </div>
                    </div>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Submit',
            background: '#0f172a',
            color: '#f8fafc'
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        updateFormData({ mascot_emotion: 'typing' });

        Swal.fire({
            title: 'Submitting...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            background: '#0f172a',
            color: '#f8fafc'
        });

        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const submissionPromise = (async () => {
                const recordId = await submitFormData({ ...formData, batch_number: activeBatch, cv_url: undefined });
                if (cvFile) {
                    const cvUrl = await uploadFileWithId(cvFile, recordId);
                    await updateCvUrl(recordId, cvUrl);
                }
            })();

            await Promise.all([submissionPromise, minDelay]);

            try {
                const { supabase } = await import('@/lib/supabase');
                await supabase.functions.invoke('send-application-email', {
                    body: { email: formData.email, name: formData.full_name }
                });
            } catch (emailErr) {
                // Silent fail for mascot trigger
            }

            Swal.fire({
                title: 'Sending...',
                html: '<span class="material-symbols-outlined text-7xl text-[#10b981] animate-flyRight">send</span>',
                showConfirmButton: false,
                timer: 1500,
                background: '#0f172a'
            });

            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

            Swal.fire({
                icon: 'success',
                title: 'Submitted! 🎉',
                text: 'Thank you for applying to GKK!',
                confirmButtonColor: '#10b981',
                background: '#0f172a',
                color: '#f8fafc'
            }).then(() => resetForm());

        } catch (err: unknown) {
            updateFormData({ mascot_emotion: 'angry' });
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: err instanceof Error ? err.message : 'An unknown error occurred.',
                background: '#0f172a',
                color: '#f8fafc'
            });
        } finally {
            setIsSubmitting(false);
            updateFormData({ mascot_emotion: 'excited' });
        }
    };

    // Determine if we should show standard pupils or special emotion eyes
    const isExcited = emotion === 'excited';

    // Adjust eye position based on emotion
    let currentEyePosition = eyePosition;
    if (emotion === 'thinking') {
        currentEyePosition = { x: -3, y: -4 }; // Look up and left
    } else if (emotion === 'typing') {
        currentEyePosition = { x: 0, y: 2 }; // Look slightly down/focused
    }

    // Adjust blush based on emotion
    const isBlushing = isTyping || emotion === 'excited' || emotion === 'typing';
    const blushOpacity = isBlushing ? 'opacity-80' : 'opacity-30';

    // Adjust smile based on emotion
    const isSmiling = isTyping || emotion === 'excited' || emotion === 'neutral' || emotion === 'typing';
    const smileScale = isSmiling && !eyesClosed ? 'scale-100 opacity-100' : 'scale-50 opacity-0';

    // Angry state variables
    const isAngry = emotion === 'angry';
    const cloudColor = isAngry ? 'text-red-500/90 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-text-primary drop-shadow-xl';
    const boxGlow = isAngry ? 'ring-2 ring-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-border focus-within:ring-2 focus-within:border-primary/50';

    return (
        <div className={`flex flex-col items-center justify-center gap-4 mascot-tile h-full min-h-87.5 transition-all duration-500 w-full bento-card glass-hub border rounded-xl shadow-sm p-8 ${boxGlow}`}>
            <div className={`relative w-44 h-44 mascot-container flex items-center justify-center transition-transform duration-300 ${isAngry ? 'animate-shake' : 'animate-cloudy-float'}`}>
                {/* Aura glow */}
                {!isAngry && (
                    <div className="absolute inset-2 rounded-full bg-primary/20 blur-2xl animate-cloudy-glow -z-20" />
                )}

                {/* Sparkles */}
                {!isAngry && (
                    <>
                        <span className="absolute -top-1 left-3 w-1.5 h-1.5 bg-white/80 rounded-full animate-cloudy-twinkle" />
                        <span className="absolute top-4 -right-1 w-1 h-1 bg-primary/80 rounded-full animate-cloudy-twinkle [animation-delay:0.8s]" />
                        <span className="absolute bottom-6 -left-1 w-1.5 h-1.5 bg-white/70 rounded-full animate-cloudy-twinkle [animation-delay:1.4s]" />
                        <span className="absolute bottom-10 -right-2 w-1 h-1 bg-primary/60 rounded-full animate-cloudy-twinkle [animation-delay:2s]" />
                    </>
                )}

                {/* Cloud SVG Body – rounder, cuter shape */}
                <svg
                    className={`absolute inset-0 w-full h-full transition-colors duration-500 ${cloudColor}`}
                    fill="currentColor"
                    viewBox="0 0 220 160"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Soft highlight layer */}
                    <defs>
                        <radialGradient id="cloudHighlight" cx="40%" cy="30%" r="50%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    {/* Main cloud body */}
                    <path d="
                        M60,130
                        Q10,130 10,95
                        Q10,68 35,58
                        Q28,35 55,25
                        Q72,18 90,25
                        Q100,5 125,5
                        Q155,5 165,30
                        Q185,20 200,45
                        Q215,70 195,95
                        Q210,130 170,130
                        Z
                    " />
                    {/* Highlight overlay */}
                    <path d="
                        M60,130
                        Q10,130 10,95
                        Q10,68 35,58
                        Q28,35 55,25
                        Q72,18 90,25
                        Q100,5 125,5
                        Q155,5 165,30
                        Q185,20 200,45
                        Q215,70 195,95
                        Q210,130 170,130
                        Z
                    " fill="url(#cloudHighlight)" />
                </svg>

                {/* === Face elements – absolutely positioned relative to h-44 w-44 container === */}

                {/* Eyes Container */}
                <div className={`absolute z-10 flex gap-5 transition-transform duration-300 ${emotion === 'curious' ? 'rotate-12' : ''}`}
                    style={{ top: '38%', left: '50%', transform: `translateX(-50%) translateY(-50%)${emotion === 'curious' ? ' rotate(12deg)' : ''}` }}>
                    {/* Left Eye */}
                    <div className={`bg-background-light rounded-full border-2 ${isAngry ? 'border-red-900' : 'border-border'} flex items-center justify-center overflow-hidden shadow-md transition-all duration-300 ${emotion === 'curious' ? 'w-11 h-13' : 'w-10 h-12'} ${isAngry ? 'rotate-12' : 'animate-cloudy-blink'}`}>
                        {!eyesClosed ? (
                            isExcited ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#10b981" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                            ) : isAngry ? (
                                <div className="w-7 h-1.5 bg-red-900 transform -rotate-45 rounded-full" />
                            ) : (
                                <div className="w-full h-full relative">
                                    <div
                                        className="absolute w-5 h-5 rounded-full transition-transform duration-200 bg-linear-to-br from-emerald-300 to-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        style={{
                                            top: '50%', left: '50%',
                                            marginTop: '-10px', marginLeft: '-10px',
                                            transform: `translate(${currentEyePosition.x}px, ${currentEyePosition.y}px)`
                                        }}
                                    >
                                        <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-white/90 rounded-full" />
                                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/60 rounded-full" />
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="w-7 h-0.5 bg-primary rounded-full" />
                        )}
                    </div>

                    {/* Right Eye */}
                    <div className={`bg-background-light rounded-full border-2 ${isAngry ? 'border-red-900' : 'border-border'} flex items-center justify-center overflow-hidden shadow-md transition-all duration-300 ${emotion === 'curious' ? 'w-8 h-10 mt-1' : 'w-10 h-12'} ${isAngry ? '-rotate-12' : 'animate-cloudy-blink [animation-delay:0.25s]'}`}>
                        {!eyesClosed ? (
                            isExcited ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#10b981" xmlns="http://www.w3.org/2000/svg" className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                            ) : isAngry ? (
                                <div className="w-7 h-1.5 bg-red-900 transform rotate-45 rounded-full" />
                            ) : (
                                <div className="w-full h-full relative">
                                    <div
                                        className="absolute w-5 h-5 rounded-full transition-transform duration-200 bg-linear-to-br from-emerald-300 to-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        style={{
                                            top: '50%', left: '50%',
                                            marginTop: '-10px', marginLeft: '-10px',
                                            transform: `translate(${currentEyePosition.x}px, ${currentEyePosition.y}px)`
                                        }}
                                    >
                                        <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-white/90 rounded-full" />
                                        <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/60 rounded-full" />
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="w-7 h-0.5 bg-primary rounded-full" />
                        )}
                    </div>
                </div>

                {/* Blush cheeks – centered below eyes */}
                <div className={`absolute z-10 flex transition-opacity duration-300 ${blushOpacity}`}
                    style={{ top: '60%', left: '50%', transform: 'translateX(-50%)', gap: '40px' }}>
                    <div className="w-5 h-2.5 bg-pink-400 rounded-full blur-[3px] animate-cloudy-blush" />
                    <div className="w-5 h-2.5 bg-pink-400 rounded-full blur-[3px] animate-cloudy-blush [animation-delay:0.35s]" />
                </div>

                {/* Mouth / Smile – centered below blush */}
                <div className={`absolute z-10 transition-all duration-300 transform ${isAngry ? 'scale-100 opacity-100' : smileScale}`}
                    style={{ top: '66%', left: '50%', transform: `translateX(-50%) ${isAngry ? '' : (isSmiling && !eyesClosed ? 'scale(1)' : 'scale(0.5)')}` }}>
                    {emotion === 'excited' ? (
                        <div className="w-5 h-5 bg-background-light rounded-full border border-background-light/50" />
                    ) : isAngry ? (
                        <div className="w-7 h-2 bg-red-900 rounded-lg" />
                    ) : (
                        <svg width="22" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 2C2 2 6 10 12 10C18 10 22 2 22 2" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    )}
                </div>
            </div>

            <div className="text-center flex flex-col items-center justify-center z-10 mt-2 animate-cloudy-nameBob">
                <h2 className={`text-2xl font-black tracking-tight ${isAngry ? 'text-red-500' : 'text-text-primary'} leading-tight transition-colors`}>
                    Cloudy
                </h2>
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isAngry ? 'text-red-400 bg-red-900/20 border-red-500/50' : 'text-text-secondary bg-background-card/80 border-border/50'}  px-3 py-1 rounded-full border backdrop-blur-sm shadow-sm transition-colors mt-1`}>
                    {isAngry ? 'Mad Security' : 'Head of Security'}
                </div>
            </div>

            {/* Custom angry message popup */}
            {isAngry && missingFields.length > 0 && (
                <div className="w-full mt-3 bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-center animate-fadeInFast">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-red-500 text-base">error</span>
                        <span className="text-red-400 text-[11px] font-bold uppercase tracking-wider">Required Details Missing</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        {missingFields.map(field => (
                            <span key={field} className="bg-red-500/10 border border-red-500/20 text-red-300 px-2 py-1 rounded-md text-[10px] whitespace-nowrap">
                                {field}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div className="w-full mt-auto pt-5">
                <button
                    onClick={handleFormSubmit}
                    disabled={isSubmitting}
                    onMouseEnter={() => {
                        if (isFormValid && !isSubmitting) updateFormData({ mascot_emotion: 'excited' });
                    }}
                    onMouseLeave={() => {
                        if (emotion === 'excited') updateFormData({ mascot_emotion: 'neutral' });
                    }}
                    className={`font-bold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 w-full text-base ${isFormValid && !isSubmitting
                        ? "bg-primary hover:bg-primary-hover text-text-primary shadow-primary/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                        : isAngry ? "bg-red-500 hover:bg-red-600 text-white animate-shake shadow-red-500/20"
                            : "bg-background-card text-text-muted hover:bg-background-card/80 border border-border"
                        }`}
                >
                    {isSubmitting ? 'Submitting...' : isAngry ? 'Fix Errors' : 'Submit Application'}
                    {!isSubmitting && <span className="material-symbols-outlined font-bold text-xl">{isAngry ? 'warning' : 'send'}</span>}
                </button>
            </div>
        </div>
    );
};

export default Mascot;
