import { createContext, useContext, useState, type ReactNode } from 'react';
import type { FormSubmission } from '@/lib/supabase';

interface FormContextType {
    formData: FormSubmission;
    updateFormData: (data: Partial<FormSubmission>) => void;
    resetForm: () => void;
    cvFile: File | null;
    setCvFile: (file: File | null) => void;
    activeCard: string | null;
    setActiveCard: (card: string | null) => void;
    calculateProgress: () => number;
}

const initialFormData: FormSubmission = {
    full_name: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    age: '',
    sex: '',
    college: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    cv_filename: '',
    cv_url: '',
    interests: [],
    interview_date: '',
    interview_time: '',
    discovery_source: '',
    is_email_verified: false,
    mascot_emotion: 'neutral',
    slot_hold_id: '',
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
    const [formData, setFormData] = useState<FormSubmission>(initialFormData);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [activeCard, setActiveCard] = useState<string | null>(null);

    const updateFormData = (data: Partial<FormSubmission>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setCvFile(null);
    };

    const calculateProgress = () => {
        const requiredFields = [
            !!(formData.full_name?.trim() && formData.email?.trim() && formData.is_email_verified), // Identity
            !!formData.college?.trim(), // Education
            !!(formData.phone?.trim() && formData.phone.length >= 10 && formData.phone.length <= 12), // Phone
            !!(formData.whatsapp_number?.trim() && formData.whatsapp_number.length >= 10 && formData.whatsapp_number.length <= 12), // WhatsApp
            !!formData.age?.trim(), // Age
            !!formData.sex?.trim(), // Sex
            !!(formData.interview_date && formData.interview_time), // Schedule
            !!(formData.interests && formData.interests.length > 0), // Interests
            !!formData.discovery_source, // Discovery
        ];

        const completedCount = requiredFields.filter(Boolean).length;
        return Math.min(100, Math.round((completedCount / requiredFields.length) * 100));
    };

    return (
        <FormContext.Provider value={{
            formData, updateFormData, resetForm, cvFile, setCvFile,
            activeCard, setActiveCard, calculateProgress
        }}>
            {children}
        </FormContext.Provider>
    );
}

export function useFormContext() {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useFormContext must be used within a FormProvider');
    }
    return context;
}
