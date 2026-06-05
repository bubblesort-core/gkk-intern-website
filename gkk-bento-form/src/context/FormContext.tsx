import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FormSubmission } from '@/lib/supabase';

interface FormContextType {
    formData: FormSubmission;
    updateFormData: (data: Partial<FormSubmission>) => void;
    resetForm: () => void;
    cvFile: File | null;
    setCvFile: (file: File | null) => void;
    activeBatch: string;
    setActiveBatch: (batch: string) => void;
    // Step management
    currentStep: number;
    setCurrentStep: (step: number) => void;
    showPreview: boolean;
    setShowPreview: (show: boolean) => void;
    completedSteps: Set<number>;
    markStepComplete: (step: number) => void;
    termsAccepted: boolean;
    setTermsAccepted: (accepted: boolean) => void;
    // Cloudy
    cloudyMessage: string;
    setCloudyMessage: (msg: string) => void;
    cloudyBounce: boolean;
    triggerCloudyBounce: () => void;
    // Helpers
    getCompletionPercent: () => number;
    firstName: string;
    setFirstName: (name: string) => void;
    lastName: string;
    setLastName: (name: string) => void;
}

const initialFormData: FormSubmission = {
    full_name: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    age: '',
    sex: '',
    state: '',
    city: '',
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

export function FormProvider({ children, initialBatch = 'Phase 1' }: { children: ReactNode; initialBatch?: string }) {
    const [formData, setFormData] = useState<FormSubmission>(initialFormData);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [showPreview, setShowPreview] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [cloudyMessage, setCloudyMessage] = useState("Hey! Let's start with who you are 👋");
    const [cloudyBounce, setCloudyBounce] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [activeBatch, setActiveBatch] = useState(initialBatch);

    const updateFormData = useCallback((data: Partial<FormSubmission>) => {
        setFormData((prev) => {
            let hasChanges = false;
            for (const key in data) {
                if (data[key as keyof FormSubmission] !== prev[key as keyof FormSubmission]) {
                    hasChanges = true;
                    break;
                }
            }
            if (!hasChanges) return prev;
            return { ...prev, ...data };
        });
    }, []);

    const resetForm = () => {
        setFormData(initialFormData);
        setCvFile(null);
        setCurrentStep(1);
        setShowPreview(false);
        setCompletedSteps(new Set());
        setTermsAccepted(false);
        setFirstName('');
        setLastName('');
    };

    const markStepComplete = useCallback((step: number) => {
        setCompletedSteps(prev => {
            const next = new Set(prev);
            next.add(step);
            return next;
        });
    }, []);

    const triggerCloudyBounce = useCallback(() => {
        setCloudyBounce(true);
        setTimeout(() => setCloudyBounce(false), 600);
    }, []);

    const getCompletionPercent = useCallback(() => {
        // Each step is 25%
        return completedSteps.size * 25;
    }, [completedSteps]);

    return (
        <FormContext.Provider value={{
            formData, updateFormData, resetForm, cvFile, setCvFile,
            activeBatch, setActiveBatch,
            currentStep, setCurrentStep,
            showPreview, setShowPreview,
            completedSteps, markStepComplete,
            termsAccepted, setTermsAccepted,
            cloudyMessage, setCloudyMessage,
            cloudyBounce, triggerCloudyBounce,
            getCompletionPercent,
            firstName, setFirstName,
            lastName, setLastName,
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
