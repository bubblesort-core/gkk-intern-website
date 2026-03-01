import { motion } from 'framer-motion';
import { useState } from 'react';

const ContactSection = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQ-t9LhhThzJOrTh8KxynTlzmgz6hTUiOB8RdTWrKCc0q1m5S_Hq4mRubtSvK8o85IYQ/exec";

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
        <section className="min-h-screen bg-[#F5F5F3] text-black py-16 md:py-24 px-4 md:px-12 relative overflow-hidden flex items-center justify-center">
            <div className="max-w-[1400px] w-full mx-auto relative z-10">

                {/* Header */}
                <div className="text-center mb-12 md:mb-20">
                    <motion.h1
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.5 }}
                        variants={flipInX}
                        className="text-3xl md:text-7xl font-light tracking-tight mb-4 md:mb-6 text-[#1a1a1a]"
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
                            className="border-b border-neutral-200 pb-8"
                        >
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-4">
                                Direct Inquiry
                            </h3>
                            <a href="mailto:noreplay.gkk26@gmail.com" className="text-2xl font-medium text-[#1a1a1a] hover:text-neutral-500 transition-colors">
                                noreplay.gkk26@gmail.com
                            </a>
                        </motion.div>

                        {/* Working Hours */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInUp}
                            transition={{ delay: 0.3 }}
                            className="border-b border-neutral-200 pb-8"
                        >
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-4">
                                Working Hours
                            </h3>
                            <p className="text-xl font-medium text-[#1a1a1a] mb-2">Monday — Friday</p>
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
                            className="border-b border-neutral-200 pb-8"
                        >
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-4">
                                Location
                            </h3>
                            <p className="text-xl font-medium text-[#1a1a1a]">Bengaluru, India</p>
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
                    <div className="lg:col-span-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="bg-white p-8 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-neutral-100"
                        >
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-[0.2em] uppercase text-black block mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="E.g. Julian Vost"
                                            className="w-full border border-neutral-200 p-4 text-sm focus:outline-none focus:border-black transition-all bg-transparent placeholder:text-neutral-400"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-[0.2em] uppercase text-black block mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="email@institution.com"
                                            className="w-full border border-neutral-200 p-4 text-sm focus:outline-none focus:border-black transition-all bg-transparent placeholder:text-neutral-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-[0.2em] uppercase text-black block mb-2">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nature of your inquiry"
                                        className="w-full border border-neutral-200 p-4 text-sm focus:outline-none focus:border-black transition-all bg-transparent placeholder:text-neutral-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-[0.2em] uppercase text-black block mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        rows={6}
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="Describe your inquiry in detail..."
                                        className="w-full border border-neutral-200 p-4 text-sm focus:outline-none focus:border-black transition-all bg-transparent resize-none placeholder:text-neutral-400"
                                    ></textarea>
                                </div>

                                <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
                                    {submitStatus === 'success' && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-green-600 text-sm font-medium"
                                        >
                                            Message sent successfully! We'll be in touch soon.
                                        </motion.p>
                                    )}
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
                                        className={`ml-auto bg-black text-white px-12 py-5 text-[10px] font-black tracking-[0.25em] uppercase flex items-center gap-4 hover:bg-neutral-800 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Message'}
                                        <span>→</span>
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ContactSection;

