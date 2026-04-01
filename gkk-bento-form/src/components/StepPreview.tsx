import { useFormContext } from '@/context/FormContext';

interface StepPreviewProps {
    stepNum: number;
    onContinue: () => void;
    onEdit: () => void;
}

const StepPreview: React.FC<StepPreviewProps> = ({ stepNum, onContinue, onEdit }) => {
    const { formData, cvFile, firstName, lastName } = useFormContext();

    const renderRow = (label: string, value: string | undefined | null) => {
        if (!value) return null;
        return (
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2 border-b border-border/50 last:border-b-0">
                <span className="text-xs uppercase tracking-wider text-text-muted font-semibold w-36 shrink-0">{label}</span>
                <span className="text-sm text-text-primary font-medium break-all">{value}</span>
            </div>
        );
    };

    const renderStep1 = () => (
        <>
            {renderRow('Name', [firstName, lastName].filter(Boolean).join(' '))}
            {renderRow('Email', formData.email)}
            {renderRow('Email Verified', formData.is_email_verified ? '✅ Verified' : '❌ Not verified')}
            {renderRow('Education', formData.college)}
            {renderRow('Phone', formData.phone ? `+91 ${formData.phone}` : undefined)}
            {renderRow('WhatsApp', formData.whatsapp_number ? `+91 ${formData.whatsapp_number}` : undefined)}
            {renderRow('Age', formData.age)}
            {renderRow('Gender', formData.sex)}
        </>
    );

    const renderStep2 = () => (
        <>
            {renderRow('CV', cvFile ? cvFile.name : formData.cv_filename || 'Not uploaded')}
            {renderRow('LinkedIn', formData.linkedin_url || '—')}
            {renderRow('GitHub', formData.github_url || '—')}
            {renderRow('Portfolio', formData.portfolio_url || '—')}
        </>
    );

    const renderStep3 = () => (
        <>
            {renderRow('Interview Date', formData.interview_date || '—')}
            {renderRow('Interview Time', formData.interview_time || '—')}
        </>
    );

    const renderStep4 = () => (
        <>
            {renderRow('Interests', formData.interests && formData.interests.length > 0 ? formData.interests.join(', ') : '—')}
            {renderRow('Found us via', formData.discovery_source || '—')}
        </>
    );

    const stepRenderers: Record<number, () => React.ReactNode> = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4 };
    const stepNames: Record<number, string> = { 1: 'Identity', 2: 'Resume & Links', 3: 'Schedule', 4: 'Additional Info' };

    return (
        <div className="preview-enter">
            <div className="bg-bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8 max-w-lg mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-lg">fact_check</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                            Step {stepNum}: {stepNames[stepNum]}
                        </h3>
                        <p className="text-xs text-text-muted">Review your details before continuing</p>
                    </div>
                </div>

                <div className="flex flex-col">
                    {stepRenderers[stepNum]?.()}
                </div>

                <div className="flex items-center gap-3 mt-8">
                    <button
                        onClick={onEdit}
                        className="px-5 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:bg-bg-input transition-colors"
                    >
                        ← Edit
                    </button>
                    <button
                        onClick={onContinue}
                        className="flex-1 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
                    >
                        Looks good, continue →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepPreview;
