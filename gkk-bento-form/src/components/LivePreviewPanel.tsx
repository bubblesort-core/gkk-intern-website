import React, { useEffect, useState } from 'react';
import { useFormContext } from '@/context/FormContext';

const LivePreviewPanel: React.FC = () => {
    const {
        currentStep, completedSteps, formData, firstName, lastName, cvFile
    } = useFormContext();

    const [showConfetti, setShowConfetti] = useState(false);

    const isAllComplete = [1, 2, 3, 4].every(s => completedSteps.has(s));

    useEffect(() => {
        if (isAllComplete) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isAllComplete]);

    // Validation helpers
    const s1Complete = !!(firstName && lastName && formData.email && formData.is_email_verified && formData.college && formData.phone && formData.whatsapp_number && formData.age && formData.sex);
    const s1Fields = [firstName, lastName, formData.email, formData.is_email_verified, formData.college, formData.phone, formData.whatsapp_number, formData.age, formData.sex];
    const s1Progress = (s1Fields.filter(Boolean).length / s1Fields.length) * 100;

    const renderIdCard = () => (
        <div className="relative overflow-hidden rounded-2xl bg-[#0f0f0f] border border-border/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300">
            {/* Top green bar */}
            <div className="h-10 bg-primary/20 border-b border-primary/30 flex items-center justify-center">
                <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">GKK Intern</span>
            </div>
            
            <div className="p-4 flex flex-col gap-4 relative">
                {/* Avatar */}
                <div className="absolute top-4 right-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500
                        ${s1Complete ? 'bg-primary/20 text-primary border-2 border-primary box-shadow-glow' : 'bg-border/50 text-text-muted border border-border animate-pulse'}
                    `}>
                        {s1Complete ? `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() : <span className="material-symbols-outlined text-xl">person</span>}
                    </div>
                </div>

                <div className="flex flex-col gap-0.5 mt-2 pr-14">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Candidate</span>
                    <h3 className="text-lg font-bold text-text-primary leading-tight min-h-[1.75rem] transition-all">
                        {firstName || lastName ? `${firstName} ${lastName}`.trim() : <span className="opacity-30">Your Name</span>}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        {formData.college ? (
                            <span className="text-[10px] px-2 py-0.5 bg-border/50 text-text-secondary rounded-full font-medium truncate max-w-full">
                                {formData.college.replace('Dropout: ', '').replace('Other: ', '')}
                            </span>
                        ) : <div className="h-4 w-20 bg-border/30 rounded-full animate-pulse" />}
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                    {/* Email */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-[14px] text-text-muted">mail</span>
                        <span className="text-text-secondary truncate flex-1">{formData.email || 'Email missing'}</span>
                        {formData.email && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide
                                ${formData.is_email_verified ? 'bg-primary/20 text-primary' : 'bg-red-500/10 text-red-400'}
                            `}>
                                {formData.is_email_verified ? 'Verified ✓' : 'Unverified'}
                            </span>
                        )}
                    </div>
                    {/* Phone */}
                    <div className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${formData.phone ? 'opacity-100' : 'opacity-30'}`}>
                        <span className="material-symbols-outlined text-[14px] text-text-muted">phone</span>
                        <span className="text-text-secondary font-medium">{formData.phone ? `+91 ${formData.phone}` : 'Phone missing'}</span>
                    </div>
                    {/* WhatsApp */}
                    <div className={`flex items-center gap-2 text-xs transition-opacity duration-300 ${formData.whatsapp_number ? 'opacity-100' : 'opacity-30'}`}>
                        <span className="material-symbols-outlined text-[14px] text-green-500">chat</span>
                        <span className="text-text-secondary font-medium">{formData.whatsapp_number ? `+91 ${formData.whatsapp_number}` : 'WhatsApp missing'}</span>
                    </div>
                </div>

                {/* Footer Chips */}
                <div className="flex gap-2 mt-2 pt-3 border-t border-border/50">
                    <div className={`px-2 py-1 flex items-center gap-1 rounded text-[10px] font-bold ${formData.age ? 'bg-bg-input text-text-primary border border-border' : 'opacity-30 border border-dashed border-border text-text-muted'}`}>
                        AGE: {formData.age || '--'}
                    </div>
                    <div className={`px-2 py-1 flex items-center gap-1 rounded text-[10px] font-bold ${formData.sex ? 'bg-bg-input text-text-primary border border-border' : 'opacity-30 border border-dashed border-border text-text-muted'}`}>
                        SEX: {formData.sex || '--'}
                    </div>
                </div>
            </div>
        </div>
    );

    // Accordion Section Helper
    const StepSection = ({ stepNum, title, isCompleted, isActive, children, summary }: any) => {
        const isOpen = isActive || (isAllComplete && isCompleted);
        return (
            <div className={`flex flex-col transition-all duration-300 overflow-hidden
                ${isOpen ? 'opacity-100' : 'opacity-40 hover:opacity-70'}
            `}>
                {!isOpen && !isAllComplete && (
                    <div className="flex items-center gap-3 py-3 border-b border-border/50">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                            ${isCompleted ? 'bg-primary text-white' : 'bg-border text-text-muted'}
                        `}>
                            {isCompleted ? '✓' : stepNum}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-secondary">{title}</span>
                            {isCompleted && summary && <span className="text-[10px] text-text-muted truncate max-w-[200px]">{summary}</span>}
                        </div>
                    </div>
                )}
                <div className={`transition-all duration-500 origin-top
                    ${isOpen ? 'max-h-[600px] opacity-100 mt-2 mb-4' : 'max-h-0 opacity-0'}
                `}>
                    {/* Only show header if active AND not all complete */}
                    {isActive && !isAllComplete && (
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">{stepNum}</div>
                            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{title}</span>
                        </div>
                    )}
                    {children}
                </div>
            </div>
        );
    };

    return (
        <aside className="hidden lg:flex flex-col w-[340px] shrink-0 h-full overflow-y-auto bg-[#111111] border-l border-[rgba(255,255,255,0.08)] p-6 custom-scrollbar z-50">
            <div className="flex items-center gap-2 mb-8 shrink-0">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <h2 className="text-sm font-bold text-text-primary tracking-wide uppercase">Live Preview</h2>
            </div>

            <div className="flex flex-col flex-1">
                {isAllComplete && (
                    <div className="mb-6 animate-slideUp text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-3xl text-primary">verified</span>
                        </div>
                        <h3 className="text-lg font-bold text-primary">Ready to Submit</h3>
                        <p className="text-xs text-text-muted mt-1">Your entire application looks great.</p>
                    </div>
                )}

                <div className="relative">
                    {/* Step 1 */}
                    <StepSection 
                        stepNum={1} 
                        title="Identity" 
                        isCompleted={completedSteps.has(1)} 
                        isActive={currentStep === 1}
                        summary={`${firstName} ${lastName}`}
                    >
                        {renderIdCard()}
                        {!isAllComplete && (
                            <div className="mt-4 flex flex-col gap-1.5">
                                <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                                    <span>Step 1 Completion</span>
                                    <span className={s1Progress === 100 ? 'text-primary' : ''}>{Math.round(s1Progress)}%</span>
                                </div>
                                <div className="h-1 bg-border rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-500 rounded-full ${s1Progress === 100 ? 'bg-primary shadow-[0_0_8px_rgba(0,232,123,0.8)]' : 'bg-primary/50'}`} style={{ width: `${s1Progress}%` }} />
                                </div>
                            </div>
                        )}
                    </StepSection>

                    {/* Step 2 */}
                    <StepSection 
                        stepNum={2} 
                        title="Resume & Links" 
                        isCompleted={completedSteps.has(2)} 
                        isActive={currentStep === 2}
                        summary={cvFile?.name || formData.cv_filename || formData.linkedin_url || 'Links provided'}
                    >
                        <div className="flex flex-col gap-2">
                            {/* CV Card */}
                            <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${cvFile || formData.cv_filename ? 'bg-primary/5 border-primary/30' : 'bg-bg-input border-border border-dashed opacity-50'}`}>
                                <div className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">picture_as_pdf</span></div>
                                <div className="flex flex-col overflow-hidden max-w-full">
                                    <span className="text-xs font-bold text-text-primary truncate">{cvFile?.name || formData.cv_filename || 'No Resume Uploaded'}</span>
                                    <span className="text-[10px] text-text-muted">{cvFile ? (cvFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'PDF or DOCX'}</span>
                                </div>
                            </div>
                            
                            {/* Links */}
                            {[
                                { key: 'linkedin_url', icon: 'share', label: 'LinkedIn' },
                                { key: 'github_url', icon: 'terminal', label: 'GitHub' },
                                { key: 'portfolio_url', icon: 'language', label: 'Portfolio' }
                            ].map(({key, icon, label}) => {
                                const val = (formData as any)[key];
                                return (
                                    <div key={key} className={`flex items-center gap-2 p-2 rounded-lg text-xs border transition-all ${val ? 'bg-bg-card border-border' : 'bg-transparent border-border/30 border-dashed opacity-40'}`}>
                                        <span className="material-symbols-outlined text-[14px] text-text-muted">{icon}</span>
                                        <span className="font-semibold text-text-secondary truncate flex-1">{val || `Add ${label}...`}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </StepSection>

                    {/* Step 3 */}
                    <StepSection 
                        stepNum={3} 
                        title="Schedule" 
                        isCompleted={completedSteps.has(3)} 
                        isActive={currentStep === 3}
                        summary={formData.interview_date ? `${formData.interview_date} at ${formData.interview_time}` : ''}
                    >
                        <div className={`p-4 rounded-xl border ${formData.interview_date ? 'bg-primary/5 border-primary/30' : 'bg-bg-input border-border border-dashed opacity-50'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-xl text-primary">calendar_month</span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-text-primary uppercase tracking-wide">Interview Slot</span>
                                    <span className="text-[10px] text-text-muted">{formData.interview_date ? 'Confirmed selection' : 'Pending selection'}</span>
                                </div>
                            </div>
                            {formData.interview_date ? (
                                <div className="flex flex-col gap-1 mt-3">
                                    <div className="flex justify-between items-center bg-bg-card border border-border px-3 py-2 rounded-lg">
                                        <span className="text-xs font-semibold text-text-secondary">Date</span>
                                        <span className="text-xs font-bold text-primary">{formData.interview_date}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-bg-card border border-border px-3 py-2 rounded-lg">
                                        <span className="text-xs font-semibold text-text-secondary">Time</span>
                                        <span className="text-xs font-bold text-primary">{formData.interview_time}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-7 gap-1 mt-3 opacity-30">
                                    {[...Array(14)].map((_, i) => <div key={i} className="aspect-square bg-border rounded-sm" />)}
                                </div>
                            )}
                        </div>
                    </StepSection>

                    {/* Step 4 */}
                    <StepSection 
                        stepNum={4} 
                        title="Additional Info" 
                        isCompleted={completedSteps.has(4)} 
                        isActive={currentStep === 4}
                        summary={formData.interests?.length ? `${formData.interests.length} interests` : ''}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="p-3 bg-bg-input border border-border rounded-xl">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">Selected Interests</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.interests && formData.interests.length > 0 ? (
                                        formData.interests.map((int: string) => (
                                            <span key={int} className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-semibold">{int}</span>
                                        ))
                                    ) : <span className="text-xs text-text-muted italic">None selected</span>}
                                </div>
                            </div>
                            
                            <div className="p-3 bg-bg-input border border-border rounded-xl flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Found us via</span>
                                <span className="text-xs font-bold text-text-primary">{formData.discovery_source || '--'}</span>
                            </div>
                        </div>
                    </StepSection>
                </div>
            </div>

            {/* Confetti Container Overlay (CSS only) */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    {[...Array(30)].map((_, i) => (
                        <div 
                            key={i} 
                            className="confetti-piece"
                            style={{ 
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                backgroundColor: ['#00e87b', '#ffffff', '#22d87a', '#a7f3d0'][Math.floor(Math.random() * 4)]
                            }} 
                        />
                    ))}
                </div>
            )}
        </aside>
    );
};

export default LivePreviewPanel;
