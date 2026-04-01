import React, { useState, useMemo } from 'react';
import { useFormContext } from '@/context/FormContext';
import { submitFormData, uploadFileWithId, updateCvUrl, confirmSlot } from '@/lib/supabase';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

const SubmitSection: React.FC = () => {
    const { formData, updateFormData, resetForm, cvFile, activeBatch } = useFormContext();
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

    // Get missing fields for tooltip
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

    const handleSubmit = async () => {
        // Strict Validation Checks before submission
        if (!formData.full_name || formData.full_name.trim().split(/\s+/).length < 2) {
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

        if (!formData.is_email_verified) {
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

        if (formData.phone && formData.phone.length !== 10) {
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

        if (!isFormValid) return;

        // Confirmation Dialog
        const result = await Swal.fire({
            title: 'Confirm Details',
            html: `
                <div class="text-left bg-[#1e293b] p-4 rounded-lg flex flex-col gap-3 text-sm">
                    <div class="flex flex-col gap-1 border-b border-[#334155] pb-2">
                        <span class="text-[#94a3b8] text-xs uppercase tracking-wider">Identity</span>
                        <div class="flex justify-between items-center">
                            <span class="text-[#f8fafc] font-medium">${formData.full_name || '-'}</span>
                        </div>
                        <span class="text-[#10b981]">${formData.email || '-'}</span>
                    </div>

                    <div class="flex flex-col gap-1 border-b border-[#334155] pb-2">
                        <span class="text-[#94a3b8] text-xs uppercase tracking-wider">Contact</span>
                        <div class="flex justify-between">
                            <span class="text-[#94a3b8]">Phone:</span>
                            <span class="text-[#f8fafc] font-medium">+91 ${formData.phone || '-'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-[#94a3b8]">WhatsApp:</span>
                            <span class="text-[#f8fafc] font-medium">+91 ${formData.whatsapp_number || '-'}</span>
                        </div>
                    </div>

                     <div class="flex flex-col gap-1">
                        <span class="text-[#94a3b8] text-xs uppercase tracking-wider">Education</span>
                         <span class="text-[#f8fafc]">${formData.college || formData.age + ' yo, ' + formData.sex || '-'}</span>
                    </div>

                    <div class="flex flex-col gap-1 border-t border-[#334155] pt-2 mt-1">
                        <span class="text-[#94a3b8] text-xs uppercase tracking-wider">Interview Preference</span>
                        <div class="flex justify-between">
                             <span class="text-[#f8fafc]"><span class="text-[#10b981]">📅</span> ${formData.interview_date || '-'}</span>
                             <span class="text-[#f8fafc]"><span class="text-[#10b981]">⏰</span> ${formData.interview_time || '-'}</span>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1 border-t border-[#334155] pt-2">
                        <span class="text-[#94a3b8] text-xs uppercase tracking-wider">Skills & Interests</span>
                        <div class="flex flex-wrap gap-1">
                            ${(formData.interests || []).map(skill =>
                `<span class="bg-[#334155] text-[#e2e8f0] px-2 py-0.5 rounded text-[10px]">${skill}</span>`
            ).join('') || '<span class="text-text-muted italic">None selected</span>'}
                        </div>
                    </div>
                </div>
                <p class="text-[#94a3b8] text-xs mt-4 text-center">
                    Please ensure all details are correct before submitting.
                </p>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Submit Application',
            cancelButtonText: 'Edit Details',
            background: '#0f172a',
            color: '#f8fafc',
            width: '400px'
        });

        if (!result.isConfirmed) return;

        setIsSubmitting(true);

        // Show loading alert
        Swal.fire({
            title: 'Submitting Application...',
            text: 'Please wait while we process your details',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#0f172a',
            color: '#f8fafc',
            confirmButtonColor: '#10b981'
        });

        // Minimum 2 second delay for UX
        const minDelay = new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // Run submission and minimum delay in parallel
            const submissionPromise = (async () => {
                // Confirm the held slot (convert hold -> confirmed booking)
                // Pass booking details so confirmSlot can re-acquire if hold expired
                if (formData.slot_hold_id) {
                    const confirmResult = await confirmSlot(
                        formData.slot_hold_id,
                        formData.interview_date,
                        formData.interview_time,
                        formData.email,
                        undefined // maxPerSlot — confirmSlot will default to 1
                    );
                    if (!confirmResult.success) {
                        throw new Error(confirmResult.error || 'Your slot hold has expired. Please select the time slot again.');
                    }
                    // Clean up sessionStorage hold ID after successful confirm
                    sessionStorage.removeItem('gkk_slot_hold_id');
                }

                const recordId = await submitFormData({
                    ...formData,
                    batch_number: activeBatch,
                    cv_url: undefined,
                });

                if (cvFile) {
                    const cvUrl = await uploadFileWithId(cvFile, recordId);
                    await updateCvUrl(recordId, cvUrl);
                }
            })();

            // Wait for both minimum delay and submission
            await Promise.all([submissionPromise, minDelay]);

            // --- Send Confirmation Email ---
            // Try importing supabase dynamically or just let it fail gracefully if not imported here
            // We should import supabase at the top if we use it directly: import { supabase } from '@/lib/supabase';
            try {
                const { supabase } = await import('@/lib/supabase');
                await supabase.functions.invoke('send-application-email', {
                    body: {
                        email: formData.email,
                        name: formData.full_name
                    }
                });
            } catch (emailErr) {
                // Silent fail for confirmation email
            }

            // Show Takeoff Animation (Success)
            await Swal.fire({
                title: 'Sending Application...',
                html: `
                    <div class="flex flex-col items-center justify-center overflow-hidden py-6">
                        <span class="material-symbols-outlined text-7xl text-[#10b981] animate-flyRight">send</span>
                    </div>
                `,
                showConfirmButton: false,
                timer: 1500,
                background: '#0f172a',
                color: '#f8fafc',
                allowOutsideClick: false,
            });

            // Trigger Confetti
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#10b981', '#ffffff']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#10b981', '#ffffff']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

            // Show Success Alert
            Swal.fire({
                icon: 'success',
                title: 'Application Submitted! 🎉',
                html: `
                    <p class="mb-2">Thank you for applying to GKK!</p>
                    <div class="text-sm text-[#94a3b8] mt-4 text-left bg-[#1e293b] p-3 rounded-lg">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-red-400 font-bold">Gmail</span> will be sent after selection.
                        </div>
                        <div class="flex items-center gap-2">
                             <span class="text-[#10b981] font-bold">WhatsApp</span> message will also be sent.
                        </div>
                    </div>
                `,
                confirmButtonText: 'Great!',
                confirmButtonColor: '#10b981',
                background: '#0f172a',
                color: '#f8fafc'
            }).then(() => {
                resetForm();
            });

        } catch (err: unknown) {
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: err instanceof Error ? err.message : 'An unknown error occurred.',
                background: '#0f172a',
                color: '#f8fafc',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setIsSubmitting(false);
            updateFormData({ mascot_emotion: 'excited' }); // Make mascot happy on completion attempt
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 glass-hub apply-card border border-border rounded-xl shadow-sm gap-6 relative transition-all z-20 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-primary/50 to-transparent"></div>

            <button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting || !formData.is_email_verified}
                className={`font-bold py-4 px-12 rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 w-full sm:w-auto min-w-75 text-lg ${isFormValid && !isSubmitting && formData.is_email_verified
                    ? "bg-primary hover:bg-primary-hover text-text-primary shadow-primary/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-background-card border border-border text-text-muted cursor-not-allowed opacity-50 shadow-none hover:transform-none select-none pointer-events-none"
                    }`}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                {!isSubmitting && <span className="material-symbols-outlined font-bold text-xl">send</span>}
            </button>

            {!isFormValid && missingFields.length > 0 && (
                <div className="w-full flex justify-center animate-fadeInFast">
                    <p className="text-orange-400 text-sm font-medium text-center bg-orange-400/10 border border-orange-400/20 px-6 py-3 rounded-xl shadow-inner w-full sm:w-auto">
                        <span className="flex items-center gap-2 justify-center">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            Missing: {missingFields.join(", ")}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default SubmitSection;
