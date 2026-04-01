import { motion } from 'framer-motion';
import { useRef } from 'react';
import SectionCanvas from './SectionCanvas';

const services = [
    {
        id: '01',
        title: 'FULL-STACK DEVELOPMENT',
        description: 'Build complete web applications from frontend to backend. Master React, Node.js, databases, and deployment pipelines.',
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2564&auto=format&fit=crop', // Coding screen
    },
    {
        id: '02',
        title: 'MOBILE APP DEVELOPMENT',
        description: 'Create cross-platform mobile apps with React Native and Flutter. Ship to both iOS and Android app stores.',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2588&auto=format&fit=crop', // Mobile app
    },
    {
        id: '03',
        title: 'UI/UX ENGINEERING',
        description: 'Design and implement beautiful, accessible interfaces. Learn Figma, design systems, and frontend architecture.',
        image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?q=80&w=2564&auto=format&fit=crop', // UI Design
    },
    {
        id: '04',
        title: 'BACKEND & APIs',
        description: 'Architect scalable APIs and microservices. Work with REST, GraphQL, authentication, and cloud infrastructure.',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2670&auto=format&fit=crop', // Server/Data
    },
    {
        id: '05',
        title: 'AI & MACHINE LEARNING',
        description: 'Integrate AI into real products. Build chatbots, recommendation systems, and intelligent automation tools.',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2550&auto=format&fit=crop', // AI/Neural
    },
];

export default function ServicesPage({ scrollContainerRef }: { scrollContainerRef?: React.RefObject<HTMLElement> }) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
        }
    };

    return (
        <section id="services" className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] py-16 md:py-24 px-4 md:px-12 overflow-hidden">
            <SectionCanvas dotColor="rgba(240,239,233,0.06)" />
            {/* Header / Zigzag Pattern */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-[var(--border)] flex flex-col justify-end overflow-hidden z-10">
                <div className="flex flex-row absolute -bottom-6 -left-5">
                    {[...Array(40)].map((_, i) => (
                        <div key={i} className="w-12 h-12 bg-[var(--bg-primary)] transform rotate-45 -mr-6" />
                    ))}
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto pt-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8 relative z-20">
                    <div>
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: false, amount: 0.2 }}
                            className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-4 block"
                        >
                            PROGRAM CURRICULUM
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            viewport={{ once: false, amount: 0.2 }}
                            className="text-4xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-primary)]"
                        >
                            What You Will Master
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        viewport={{ once: false, amount: 0.2 }}
                        className="text-sm md:text-base text-neutral-500 max-w-sm text-right font-medium"
                    >
                        Master in-demand tech skills through real projects. Build, ship, and grow with expert mentorship.
                    </motion.p>
                </div>

                {/* Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-x-8 md:gap-y-20"
                >
                    {services.map((service) => (
                        <motion.div key={service.id} variants={itemVariants} className="group cursor-pointer">
                            <div className="relative aspect-square bg-[var(--bg-surface)] mb-6 overflow-hidden">
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
                                    loading="lazy"
                                />
                                <span className="absolute bottom-4 right-4 text-6xl font-bold text-black/10 transition-colors group-hover:text-black/20">
                                    {service.id}
                                </span>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:underline decoration-2 underline-offset-4">
                                {service.title}
                            </h3>
                            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}

                    {/* Final Card - CTA */}
                    <motion.div variants={itemVariants} className="relative aspect-square bg-black p-8 flex flex-col justify-between group overflow-hidden">

                        <div className="relative z-10">
                            <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4 md:mb-6">
                                Ready to<br />Start<br />Coding?
                            </h3>
                            <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-8">
                                Join our internship program and build real-world projects that matter.
                            </p>
                        </div>

                        <div className="relative z-10">
                            <a href="/dashboard/" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors inline-block no-underline">
                                Apply Now
                            </a>
                        </div>

                        {/* Background GKK Watermark */}
                        <span className="absolute -bottom-4 -right-4 text-[120px] font-black text-white/5 whitespace-nowrap leading-none select-none pointer-events-none">
                            GKK
                        </span>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
