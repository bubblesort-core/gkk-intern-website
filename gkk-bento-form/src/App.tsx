import { useEffect, useState, useCallback } from 'react';
import { FormProvider, useFormContext } from '@/context/FormContext';
import { getFormSettings, submitFormData, uploadFileWithId } from '@/lib/supabase';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

import Header from '@/components/Header';
import LivePreviewPanel from '@/components/LivePreviewPanel';
import InteractiveBackground from '@/components/InteractiveBackground';
import Sidebar from '@/components/Sidebar';
import CloudyGuide from '@/components/CloudyGuide';
import StepPreview from '@/components/StepPreview';
import StepIdentity from '@/components/StepIdentity';
import StepResumeLinks from '@/components/StepResumeLinks';
import StepSchedule from '@/components/StepSchedule';
import StepAdditional from '@/components/StepAdditional';
import { PandaaBot } from '@/components/PandaaBot';
import { MagneticCursor } from '@/components/MagneticCursor';

const cloudyMessages: Record<number, string> = {
    1: "Hey! Let's start with who you are 👋",
    2: "Now show us what you've got! Share a CV or link 📎",
    3: "Pick a day and time for your interview 📅",
    4: "Last stretch! Tell us your interests 🎯",
};

function FormApp() {
    const {
        formData, currentStep, setCurrentStep,
        showPreview, setShowPreview, completedSteps, markStepComplete,
        termsAccepted, setCloudyMessage, triggerCloudyBounce,
        getCompletionPercent, firstName, lastName, cvFile, activeBatch, setActiveBatch
    } = useFormContext();


    const [isFormLocked, setIsFormLocked] = useState(false);
    const [isCheckingLock, setIsCheckingLock] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [animDir, setAnimDir] = useState<'enter' | 'exit'>('enter');

    // Check form lock
    useEffect(() => {
        async function checkLock() {
            const { data } = await getFormSettings();
            if (data?.is_form_locked === true) setIsFormLocked(true);
            if (data?.active_batch) setActiveBatch(data.active_batch);
            setIsCheckingLock(false);
        }
        checkLock();
    }, []);

    // Update Cloudy message per step
    useEffect(() => {
        if (!showPreview) {
            setCloudyMessage(cloudyMessages[currentStep] || '');
        }
    }, [currentStep, showPreview]);

    // Check if step is complete enough to preview
    const canPreviewStep = useCallback((step: number): boolean => {
        switch (step) {
            case 1: return !!(firstName && lastName && formData.email && formData.is_email_verified && formData.college && formData.phone && formData.whatsapp_number && formData.age && formData.sex);
            case 2: return !!(cvFile || formData.cv_filename || formData.linkedin_url?.trim() || formData.github_url?.trim() || formData.portfolio_url?.trim());
            case 3: return !!(formData.interview_date && formData.interview_time);
            case 4: return termsAccepted;
            default: return false;
        }
    }, [formData, firstName, lastName, cvFile, termsAccepted]);

    const handleNext = () => {
        if (!canPreviewStep(currentStep)) {
            triggerCloudyBounce();
            let errorMsg = "Please complete all required fields.";
            
            // Show step-specific errors
            if (currentStep === 1) {
                errorMsg = "Fill in all the required fields first! Look for the red stars ⭐";
            } else if (currentStep === 2) {
                errorMsg = "You need at least one — a CV or any profile link 📎";
            } else if (currentStep === 3) {
                errorMsg = "Make sure you've picked both a date AND time! ⏰";
            } else if (currentStep === 4) {
                errorMsg = "Don't forget to accept the Terms & Conditions ✅";
            }
            
            setCloudyMessage(errorMsg);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: errorMsg,
                showConfirmButton: false,
                timer: 3000,
                background: '#13131a',
                color: '#f0efe9',
                iconColor: '#f59e0b'
            });
            return;
        }
        // Show preview for this step
        setShowPreview(true);
        setCloudyMessage("Take a quick look at your details 👀");
    };

    const handlePreviewContinue = () => {
        markStepComplete(currentStep);
        triggerCloudyBounce();
        setShowPreview(false);

        if (currentStep < 4) {
            setAnimDir('exit');
            setTimeout(() => {
                setCurrentStep(currentStep + 1);
                setAnimDir('enter');
            }, 250);
        }
    };

    const handlePreviewEdit = () => {
        setShowPreview(false);
        setCloudyMessage(cloudyMessages[currentStep] || '');
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setAnimDir('exit');
            setTimeout(() => {
                setCurrentStep(currentStep - 1);
                setShowPreview(false);
                setAnimDir('enter');
            }, 250);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (!termsAccepted) {
            setCloudyMessage("Please accept the Terms & Conditions first ✅");
            return;
        }

        setIsSubmitting(true);
        setCloudyMessage("Submitting your application... 🚀");

        try {
            // Build full name
            const fullName = [firstName, lastName].filter(Boolean).join(' ');
            const submission = { ...formData, full_name: fullName, batch_number: activeBatch };

            const applicationId = await submitFormData(submission);

            // Upload CV if present
            if (cvFile && applicationId) {
                await uploadFileWithId(cvFile, applicationId);
            }

            // Success!
            confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
            Swal.fire({
                icon: 'success',
                title: '🎉 Application Submitted!',
                html: `
                    <p style="margin-top:8px;font-size:14px;color:rgba(240,239,233,0.7)">
                        We've received your application. You'll hear from us soon!
                    </p>
                    ${formData.interview_date ? `<p style="margin-top:8px;font-size:13px;color:#22d87a;font-weight:600">📅 Interview: ${formData.interview_date} at ${formData.interview_time}</p>` : ''}
                `,
                confirmButtonColor: '#22d87a',
                background: '#13131a',
                color: '#f0efe9',
            });
            setCloudyMessage("You did it! Welcome aboard! 🎉🎉");
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Oops!',
                text: err.message || 'Something went wrong. Please try again.',
                confirmButtonColor: '#ef4444',
                background: '#13131a',
                color: '#f0efe9',
            });
            setCloudyMessage("Hmm, something went wrong. Try again? 😬");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckingLock) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-body">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isFormLocked) {
        return (
            <div className="min-h-screen flex flex-col bg-bg-body">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 gap-6">
                    <span className="material-symbols-outlined text-6xl text-text-muted">lock</span>
                    <h2 className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>Applications are closed</h2>
                    <p className="text-text-secondary max-w-md">The application form is currently closed. Please check back later or follow us on social media for updates.</p>
                    <a href="/Dashboard/" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-colors">Back to Dashboard</a>
                </div>
            </div>
        );
    }

    const percent = getCompletionPercent();

    return (
        <div className="h-screen flex flex-col relative overflow-hidden bg-[#0c0c0f]">
            <MagneticCursor />
            <PandaaBot />
            {/* Background Layers */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
                <InteractiveBackground />
            </div>
            
            <div className="relative z-10 flex flex-col h-full overflow-hidden pt-1 px-3 pb-3 md:pt-2 md:px-6 md:pb-6 lg:pt-2 lg:px-8 lg:pb-8">
                <div className="flex items-center justify-between gap-4">
                    <Header />
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative mt-1 md:mt-2 lg:mt-3 gap-4 md:gap-6 lg:gap-8">
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative bg-transparent">
                    {/* Progress Bar */}
                    <div className="sticky top-0 z-20 bg-bg-body border-b border-border">
                        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Step {currentStep} of 4</span>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${percent}%` }} />
                                </div>
                                <span className="text-xs font-bold text-primary">{percent}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32">
                        {showPreview ? (
                            <StepPreview
                                stepNum={currentStep}
                                onContinue={handlePreviewContinue}
                                onEdit={handlePreviewEdit}
                            />
                        ) : (
                            <div key={currentStep} className={`relative ${animDir === 'enter' ? 'step-enter' : 'step-exit'}`}>
                                {currentStep === 1 && <StepIdentity />}
                                {currentStep === 2 && <StepResumeLinks />}
                                {currentStep === 3 && <StepSchedule />}
                                {currentStep === 4 && <StepAdditional />}
                                
                                {currentStep > 1 && !completedSteps.has(currentStep - 1) && (
                                    <div className="absolute -inset-x-4 -top-8 -bottom-12 sm:-inset-x-8 sm:-top-10 sm:-bottom-20 z-[100] bg-bg-body/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl flex items-start justify-center pt-24 sm:pt-32">
                                        <div className="bg-bg-card/90 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center max-w-[320px] animate-in fade-in zoom-in duration-300">
                                            <span className="material-symbols-outlined text-amber-500 text-5xl mb-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">lock</span>
                                            <p className="text-lg font-bold text-text-primary">Step Locked</p>
                                            <p className="text-sm text-text-muted leading-relaxed">Please complete Step {currentStep - 1} to unlock this section.</p>
                                            <button 
                                                onClick={() => {
                                                    setAnimDir('exit');
                                                    setTimeout(() => {
                                                        setCurrentStep(currentStep - 1);
                                                        setAnimDir('enter');
                                                    }, 250);
                                                }}
                                                className="mt-4 px-6 py-2.5 bg-bg-input hover:bg-border/50 text-text-secondary rounded-xl text-sm font-bold transition-all border border-border/50"
                                            >
                                                Go to Step {currentStep - 1}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        {!showPreview && (
                            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 1}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold border border-border transition-all
                                        ${currentStep === 1 ? 'opacity-30 cursor-not-allowed' : 'text-text-secondary hover:bg-bg-input'}
                                    `}
                                >
                                    ← Back
                                </button>

                                {currentStep === 4 && completedSteps.has(4) ? (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!termsAccepted || isSubmitting}
                                        className={`px-8 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg
                                            ${termsAccepted && !isSubmitting ? 'bg-primary hover:bg-primary-hover submit-pulse' : 'bg-primary/40 cursor-not-allowed'}
                                        `}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Submitting...
                                            </span>
                                        ) : '🚀 Submit Application'}
                                    </button>
                                ) : (
                                    <button onClick={handleNext}
                                        className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all shadow-md shadow-primary/20">
                                        Next →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <CloudyGuide />
                </main>
                <LivePreviewPanel />
            </div>
            {/* Noise Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1] bg-[url('https://res.cloudinary.com/dzt6v9d7t/image/upload/v1711311000/noise_nt9p4c.png')]"></div>
            </div>
        </div>
    );
}

function App() {
    return (
        <FormProvider initialBatch="Phase 1">
            <FormApp />
        </FormProvider>
    );
}

export default App;
