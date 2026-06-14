import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import SectionCanvas from './SectionCanvas';

const ContactSection = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9RK4LFMYblIWeQGdQDJpvepjC4FJ22UqkwmQusFxxJF3qSMQDB8JEV1rSJP6GALc/exec";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // We use no-cors mode because Google Apps Script redirects responses 
            // and standard CORS checks often fail on the redirect. 
            // With no-cors, we get an opaque response, but the request is sent.
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(formData),
                mode: 'no-cors',
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
            });

            setSubmitStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            
            // Phase 16: Confetti effect for contact submission
            const confetti = (await import('canvas-confetti')).default;
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#ffffff']
            });

        } catch (error) {
            console.error("Error submitting form:", error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const flipInX = {
        hidden: {
            opacity: 0,
            rotateX: 90,
            y: -20
        },
        visible: {
            opacity: 1,
            rotateX: 0,
            y: 0,
            transition: {
                type: "spring" as const,
                damping: 20,
                stiffness: 100,
                duration: 0.8
            }
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" as const }
        }
    };

    return (
        <section className="min-h-screen bg-(--bg-primary) text-(--text-primary) py-16 md:py-24 px-4 md:px-12 relative overflow-hidden flex items-center justify-center">
            <SectionCanvas dotColor="rgba(240,239,233,0.06)" />
            <div className="max-w-350 w-full mx-auto relative z-10">

                {/* Header */}
                <div className="text-center mb-12 md:mb-20">
                    <motion.h1
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.5 }}
                        variants={flipInX}
                        className="text-3xl md:text-7xl font-light tracking-tight mb-4 md:mb-6 text-(--text-primary)"
                    >
                        Get in Touch with GKK
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: false }}
                        transition={{ delay: 0.4 }}
                        className="text-neutral-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-medium"
                    >
                        Have a question about internships, applications, or collaboration?
                        <br />
                        We're here to help.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

                    {/* Contact Info - Left Column */}
                    <div className="lg:col-span-4 space-y-12 pt-4">
                        {/* Direct Inquiry */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                            transition={{ delay: 0.2 }}
                            className="border-b border-(--border) pb-8"
                        >
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-4">
                                Direct Inquiry
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-(--text-muted) mb-2">Study Enquiry</p>
                                    <a href="mailto:noreplay.gkk26@gmail.com" className="text-xl md:text-2xl font-medium text-(--text-primary) hover:text-neutral-300 transition-colors break-words">
                                        noreplay.gkk26@gmail.com
                                    </a>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-(--text-muted) mb-2">Business Enquiry</p>
                                    <a href="mailto:hello@bubblesort.in" className="text-xl md:text-2xl font-medium text-(--text-primary) hover:text-neutral-300 transition-colors break-words">
                                        hello@bubblesort.in
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* Working Hours */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                            transition={{ delay: 0.3 }}
                            className="border-b border-(--border) pb-8"
                        >
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-4">
                                Working Hours
                            </h3>
                            <p className="text-xl font-medium text-(--text-primary) mb-2">Monday — Friday</p>
                            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-400">
                                10:00 AM — 6:00 PM (IST)
                            </span>
                        </motion.div>

                        {/* Location */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                            transition={{ delay: 0.4 }}
                            className="border-b border-(--border) pb-8"
                        >
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-4">
                                Location
                            </h3>
                            <p className="text-xl font-medium text-(--text-primary)">India</p>
                        </motion.div>

                        {/* Support Note */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                            transition={{ delay: 0.5 }}
                        >
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-4">
                                Support Note
                            </h3>
                            <p className="text-sm text-neutral-400 italic leading-relaxed font-light">
                                For faster communication regarding internship applications, please mention the internship role in your message.
                            </p>
                        </motion.div>
                    </div>

                    {/* Contact Form - Right Column */}
                    <div className="lg:col-span-8 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {submitStatus === 'success' ? (
                                <motion.div
                                    key="success-view"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="bg-(--bg-elevated) p-12 md:p-20 shadow-[0_4px_30px_rgba(0,0,0,0.3)] border border-(--border) flex flex-col items-center justify-center text-center min-h-125"
                                >
                                    <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8 border border-green-400/30">
                                        <motion.svg 
                                            width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.8, ease: "easeInOut" }}
                                        >
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </motion.svg>
                                    </div>
                                    <h2 className="text-3xl font-bold text-(--text-primary) mb-4 tracking-tight">Message Sent Successfully!</h2>
                                    <p className="text-(--text-muted) max-w-md leading-relaxed mb-8">
                                        Thank you for reaching out to GKK. We've received your inquiry and our team will get back to you across your email shortly.
                                    </p>
                                    <button 
                                        onClick={() => setSubmitStatus('idle')}
                                        className="text-[10px] font-black tracking-[0.2em] uppercase bg-(--text-primary) text-(--bg-primary) px-8 py-4 hover:opacity-90 transition-opacity"
                                    >
                                        Send Another Message
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form-view"
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                    className="bg-(--bg-elevated) p-8 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-(--border)"
                                >
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black tracking-[0.2em] uppercase text-(--text-primary) block mb-2">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="E.g. Julian Vost"
                                                    className="w-full border border-(--border) p-4 text-sm text-(--text-primary) focus:outline-none focus:border-(--text-primary) transition-all bg-transparent placeholder:text-(--text-muted)"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black tracking-[0.2em] uppercase text-(--text-primary) block mb-2">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="email@institution.com"
                                                    className="w-full border border-(--border) p-4 text-sm text-(--text-primary) focus:outline-none focus:border-(--text-primary) transition-all bg-transparent placeholder:text-(--text-muted)"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black tracking-[0.2em] uppercase text-(--text-primary) block mb-2">
                                                Subject
                                            </label>
                                            <input
                                                type="text"
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                placeholder="Nature of your inquiry"
                                                className="w-full border border-(--border) p-4 text-sm text-(--text-primary) focus:outline-none focus:border-(--text-primary) transition-all bg-transparent placeholder:text-(--text-muted)"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black tracking-[0.2em] uppercase text-(--text-primary) block mb-2">
                                                Message
                                            </label>
                                            <textarea
                                                rows={6}
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                required
                                                placeholder="Describe your inquiry in detail..."
                                                className="w-full border border-(--border) p-4 text-sm text-(--text-primary) focus:outline-none focus:border-(--text-primary) transition-all bg-transparent resize-none placeholder:text-(--text-muted)"
                                            ></textarea>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
                                            {submitStatus === 'error' && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-red-600 text-sm font-medium"
                                                >
                                                    Something went wrong. Please try again or email us directly.
                                                </motion.p>
                                            )}

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={isSubmitting}
                                                className={`ml-auto bg-(--text-primary) text-(--bg-primary) px-12 py-5 text-[10px] font-black tracking-[0.25em] uppercase flex items-center gap-4 hover:opacity-90 transition-opacity ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {isSubmitting ? 'Sending...' : 'Send Message'}
                                                <span>→</span>
                                            </motion.button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ContactSection;

