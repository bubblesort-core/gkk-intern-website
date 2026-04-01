import { useState, useRef } from 'react';
import { useFormContext } from '@/context/FormContext';
import { analyzeResume } from '@/lib/gemini';

const StepResumeLinks: React.FC = () => {
    const { formData, updateFormData, setCvFile, cvFile, setCloudyMessage } = useFormContext();
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isParsing, setIsParsing] = useState(false);

    const handleFileChange = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Max 10MB.');
            return;
        }
        updateFormData({ cv_filename: file.name });
        setCvFile(file);
        setError('');
        setCloudyMessage("Great! That's all we need for now 👍");

        // AI parse for PDFs
        if (file.type.includes('pdf')) {
            setIsParsing(true);
            const { data, error: parseError } = await analyzeResume(file);
            setIsParsing(false);
            if (!parseError && data) {
                const updates: Record<string, unknown> = {};
                if (data.full_name) updates.full_name = data.full_name;
                if (data.phone) updates.phone = data.phone;
                if (data.linkedin_url) updates.linkedin_url = data.linkedin_url;
                if (data.github_url) updates.github_url = data.github_url;
                if (data.portfolio_url) updates.portfolio_url = data.portfolio_url;
                if (data.college) updates.college = data.college;
                if (data.interests && data.interests.length > 0) updates.interests = data.interests;
                updateFormData(updates);
            }
        }
    };

    const handleRemove = () => {
        updateFormData({ cv_filename: '', cv_url: '' });
        setCvFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Validate (called by parent via ref or before next)


    return (
        <div className="step-enter flex flex-col gap-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                    Resume & Links
                </h2>
                <p className="text-text-secondary text-sm mt-1">Share your CV or any profile link — at least one is required</p>
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium animate-slideUp">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                </div>
            )}

            {/* CV Upload */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">CV / Resume (PDF or DOCX, max 10MB)</span>
                <div
                    className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 gap-3 transition-all cursor-pointer relative group
                        ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]'
                            : (cvFile || formData.cv_filename) ? 'border-primary bg-primary/5'
                                : 'border-border bg-bg-input hover:border-primary/50 hover:bg-primary/5'
                        }
                    `}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={async (e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const f = e.dataTransfer.files?.[0];
                        if (f && (f.type === 'application/pdf' || f.name.endsWith('.docx'))) {
                            await handleFileChange(f);
                        }
                    }}
                >
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx"
                        onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) await handleFileChange(f);
                        }} className="hidden" />

                    {isParsing ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-primary font-medium">Cloudy is scanning your CV...</p>
                        </div>
                    ) : (cvFile || formData.cv_filename) ? (
                        <>
                            <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                            <div className="text-center">
                                <p className="font-bold text-primary text-sm">{cvFile?.name || formData.cv_filename}</p>
                                <p className="text-xs text-primary/70">File ready</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                                className="mt-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                                Remove file
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-4xl text-text-muted group-hover:text-primary transition-colors">cloud_upload</span>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-text-primary">Drop your CV here or click to browse</p>
                                <p className="text-xs text-text-muted">PDF, DOCX up to 10MB</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 gap-4">
                {([
                    { key: 'linkedin_url' as const, label: 'LinkedIn URL', icon: 'link', placeholder: 'https://linkedin.com/in/username' },
                    { key: 'github_url' as const, label: 'GitHub URL', icon: 'terminal', placeholder: 'https://github.com/username' },
                    { key: 'portfolio_url' as const, label: 'Portfolio URL', icon: 'language', placeholder: 'https://yourportfolio.com' },
                ]).map(({ key, label, icon, placeholder }) => (
                    <label key={key} className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">{icon}</span>
                            {label}
                        </span>
                        <div className="relative">
                            <input
                                type="url"
                                value={formData[key] || ''}
                                onChange={(e) => {
                                    updateFormData({ [key]: e.target.value });
                                    if (e.target.value.trim()) {
                                        setError('');
                                        setCloudyMessage("Great! That's all we need for now 👍");
                                    }
                                }}
                                placeholder={placeholder}
                                className="bg-bg-input !text-text-primary border-white/10 w-full px-4 h-12 rounded-xl !pr-10"
                            />
                            {formData[key] && (
                                <button type="button" onClick={() => updateFormData({ [key]: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default StepResumeLinks;
