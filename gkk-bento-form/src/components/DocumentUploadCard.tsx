import { useState, useRef } from "react";
import { useFormContext } from '@/context/FormContext';
import { analyzeResume } from '@/lib/gemini';
import Swal from 'sweetalert2';

const DocumentUploadCard: React.FC = () => {
    const { formData, updateFormData, setCvFile } = useFormContext();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileName = formData.cv_filename || '';

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const parseResumeWithAI = async (file: File) => {
        // Only parse PDFs — Gemini vision doesn't support DOCX natively
        if (!file.type.includes('pdf')) {
            Swal.fire({
                icon: 'info',
                title: 'CV Uploaded!',
                html: '<span style="font-size:13px">AI auto-fill works best with <b>PDF files</b>. Your DOCX has been saved, but fields won\'t be auto-populated.</span>',
                timer: 3500,
                showConfirmButton: false,
                background: '#0f172a',
                color: '#f8fafc',
            });
            return;
        }

        Swal.fire({
            title: '☁️ Cloudy is Scanning CV...',
            html: '<span style="font-size:13px">Cloudy is extracting your details magically ✨</span>',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            background: '#0f172a',
            color: '#f8fafc',
        });

        const { data, error } = await analyzeResume(file);

        if (error || !data) {
            Swal.fire({
                icon: 'warning',
                title: 'AI Parsing Skipped',
                html: `<span style="font-size:13px">${error || 'Could not extract data from this CV.'}<br/>Your file has been saved. Please fill in the details manually.</span>`,
                timer: 4000,
                showConfirmButton: false,
                background: '#0f172a',
                color: '#f8fafc',
            });
            return;
        }

        // Count how many fields were extracted
        const filledFields = Object.entries(data).filter(([key, val]) => {
            if (key === 'interests') return Array.isArray(val) && val.length > 0;
            return typeof val === 'string' && val.trim() !== '';
        }).length;

        // Only update non-empty fields so we don't overwrite user's existing data
        const updates: Record<string, unknown> = {};
        if (data.full_name) updates.full_name = data.full_name;
        if (data.email) updates.email = data.email;
        if (data.phone) updates.phone = data.phone;
        if (data.whatsapp_number) updates.whatsapp_number = data.whatsapp_number;
        if (data.age) updates.age = data.age;
        if (data.sex) updates.sex = data.sex;
        if (data.college) updates.college = data.college;
        if (data.linkedin_url) updates.linkedin_url = data.linkedin_url;
        if (data.github_url) updates.github_url = data.github_url;
        if (data.portfolio_url) updates.portfolio_url = data.portfolio_url;
        if (data.interests && data.interests.length > 0) updates.interests = data.interests;

        updateFormData(updates);

        Swal.fire({
            icon: 'success',
            title: '✅ CV Analyzed!',
            html: `<span style="font-size:13px">Cloudy extracted <b>${filledFields} fields</b> from your resume.<br/>Please review the auto-filled details.</span>`,
            timer: 3000,
            showConfirmButton: false,
            background: '#0f172a',
            color: '#f8fafc',
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            updateFormData({ cv_filename: file.name });
            setCvFile(file);
            await parseResumeWithAI(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === "application/pdf" || file.name.endsWith(".docx"))) {
            updateFormData({ cv_filename: file.name });
            setCvFile(file);
            await parseResumeWithAI(file);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateFormData({ cv_filename: '', cv_url: '' });
        setCvFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        handleRemove(e);
    };

    return (
        <div
            className="w-full h-full apply-card glass-hub border border-border p-6 lg:p-7 rounded-xl shadow-sm flex flex-col gap-4 lg:gap-5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#10b981]/50 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            tabIndex={0}
            onFocus={() => updateFormData({ mascot_emotion: 'thinking' })}
            onMouseEnter={() => updateFormData({ mascot_emotion: 'thinking' })}
            onBlur={() => updateFormData({ mascot_emotion: 'neutral' })}
            onMouseLeave={() => updateFormData({ mascot_emotion: 'neutral' })}
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">description</span>
                            Resume / CV
                        </h3>
                        <div className="group relative flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px] text-text-secondary cursor-help">help</span>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-background-light text-text-primary text-[11px] rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-center border border-border whitespace-normal">
                                We will automatically magically parse your CV data down this form soon!
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-background-light"></div>
                            </div>
                        </div>
                    </div>
                    <p className="text-text-secondary text-sm">
                        Upload your resume or CV. This is optional but recommended.
                    </p>
                </div>
                {fileName && (
                    <button
                        onClick={handleClear}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium px-2 py-1 bg-red-400/10 hover:bg-red-400/20 rounded-md flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Clear
                    </button>
                )}
            </div>
            <div
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 md:p-8 gap-3 md:gap-4 transition-all cursor-pointer relative overflow-hidden group duration-300 hover:scale-[1.01] hover:bg-primary/5 active:scale-[0.99] ${isDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : fileName
                        ? "border-primary bg-primary/10"
                        : "border-[#475569] bg-background-card/50 hover:border-primary"
                    }`}
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {fileName ? (
                    <>
                        <span className="material-symbols-outlined text-5xl text-primary">
                            check_circle
                        </span>
                        <div className="text-center z-10">
                            <p className="font-bold text-primary">{fileName}</p>
                            <p className="text-sm text-primary/80">File ready to upload</p>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="mt-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                        >
                            Remove file
                        </button>
                    </>
                ) : (
                    <>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="material-symbols-outlined text-5xl text-text-secondary group-hover:text-primary group-hover:scale-110 transition-all">
                            cloud_upload
                        </span>
                        <div className="text-center z-10">
                            <p className="text-base font-semibold text-text-primary mb-1">
                                Drop your CV here
                            </p>
                            <p className="text-sm text-text-secondary">
                                PDF, DOCX up to 10MB
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DocumentUploadCard;
