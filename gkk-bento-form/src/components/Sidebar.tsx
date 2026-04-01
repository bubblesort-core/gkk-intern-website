import { useFormContext } from '@/context/FormContext';

const STEPS = [
    { num: 1, name: 'Identity', desc: 'Verify email & enter personal details' },
    { num: 2, name: 'Resume & Links', desc: 'Upload CV & provide portfolio links' },
    { num: 3, name: 'Schedule', desc: 'Pick a date and time for your interview' },
    { num: 4, name: 'Additional Info', desc: 'Select interests and accept terms' },
];

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" className="check-draw" />
    </svg>
);

const Sidebar: React.FC = () => {
    const { currentStep, completedSteps, setCurrentStep, setShowPreview, setCloudyMessage } = useFormContext();

    const progressPercent = (() => {
        let filled = 0;
        for (let i = 1; i <= 4; i++) {
            if (completedSteps.has(i)) filled++;
        }
        return filled;
    })();

    const handleStepClick = (step: typeof STEPS[0], isClickable: boolean) => {
        setShowPreview(false);
        setCurrentStep(step.num);
        if (!isClickable) {
            setCloudyMessage(`Navigating to ${step.name}, but you must complete previous steps first!`);
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 min-h-full bg-bg-sidebar border-r border-border p-6 pt-10 sticky top-0 shrink-0 z-50">
                <div className="relative flex flex-col gap-0">
                    {/* Vertical progress track */}
                    <div className="absolute left-[15px] top-[40px] bottom-[40px] w-[2px] z-0 overflow-hidden rounded-full">
                        <div className="w-full h-full bg-white/5" />
                        <div
                            className="absolute top-0 w-full bg-primary transition-all duration-500 ease-out shadow-[0_0_15px_rgba(34,216,122,0.4)]"
                            style={{ height: `${Math.min(progressPercent, 3) / 3 * 100}%` }}
                        />
                    </div>

                    {STEPS.map((step) => {
                        const isActive = currentStep === step.num;
                        const isCompleted = completedSteps.has(step.num);
                        const isClickable = true; // All steps clickable now

                        return (
                            <button
                                key={step.num}
                                onClick={() => handleStepClick(step, isClickable)}
                                className={`relative flex items-center gap-4 py-5 pl-0 pr-2 text-left transition-all group
                                    ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                                `}
                            >
                                {/* Tooltip */}
                                <div className="absolute left-[105%] top-1/2 -translate-y-1/2 w-48 p-3 bg-bg-card border border-border shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none translate-x-[-10px] group-hover:translate-x-0 duration-200">
                                    <p className="text-xs font-medium leading-relaxed">
                                        {isClickable ? (
                                            <span className="text-text-primary">{step.desc}</span>
                                        ) : (
                                            <span className="flex flex-col gap-1 text-text-muted">
                                                <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                                                    <span className="material-symbols-outlined text-[14px]">lock</span>
                                                    Preview Mode
                                                </span>
                                                Click to preview this step.
                                            </span>
                                        )}
                                    </p>
                                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-bg-card border-l border-b border-border rotate-45" />
                                </div>

                                {/* Step circle */}
                                <div className={`relative z-10 w-[32px] h-[32px] rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0
                                    ${isCompleted
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : isActive
                                            ? 'bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/15'
                                            : !isClickable
                                                ? 'bg-bg-body text-text-muted/40 border border-border/50'
                                                : 'bg-bg-input text-text-muted border border-border'
                                    }
                                `}>
                                    {!isClickable ? <span className="material-symbols-outlined text-[14px]">lock</span> : isCompleted ? <CheckIcon /> : step.num}
                                </div>

                                {/* Step label */}
                                <div className="flex flex-col">
                                    <span className={`text-[11px] uppercase tracking-wider font-semibold
                                        ${isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : !isClickable ? 'text-text-muted/40' : 'text-text-muted'}
                                    `}>
                                        Step {step.num}
                                    </span>
                                    <span className={`text-sm font-semibold
                                        ${isActive ? 'text-text-primary' : isCompleted ? 'text-text-secondary' : !isClickable ? 'text-text-muted/40' : 'text-text-muted'}
                                    `}>
                                        {step.name}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* Mobile Top Stepper */}
            <div className="md:hidden flex items-center justify-between bg-bg-card border-b border-border px-4 py-3">
                {STEPS.map((step) => {
                    const isActive = currentStep === step.num;
                    const isCompleted = completedSteps.has(step.num);
                    const isClickable = true; // All steps clickable now
                    return (
                        <button
                            key={step.num}
                            onClick={() => handleStepClick(step, isClickable)}
                            className={`flex flex-col items-center gap-1 flex-1 relative group ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-70'}`}
                        >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                                ${isCompleted
                                    ? 'bg-primary text-white'
                                    : isActive
                                        ? 'bg-primary text-white ring-2 ring-primary/20'
                                        : !isClickable
                                            ? 'bg-bg-body text-text-muted/40 border border-border/50'
                                            : 'bg-bg-input text-text-muted border border-border'
                                }
                            `}>
                                {!isClickable ? <span className="material-symbols-outlined text-[12px]">lock</span> : isCompleted ? <CheckIcon /> : step.num}
                            </div>
                            <span className={`text-[9px] font-semibold leading-tight text-center
                                ${isActive ? 'text-primary' : isCompleted ? 'text-text-secondary' : !isClickable ? 'text-text-muted/40' : 'text-text-muted'}
                            `}>
                                {step.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default Sidebar;
