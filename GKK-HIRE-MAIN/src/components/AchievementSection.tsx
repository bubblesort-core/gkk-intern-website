import { motion, Variants } from 'framer-motion';
import SectionCanvas from './SectionCanvas';

const AchievementSection = () => {
    const stats = [
        { label: 'PROJECTS SHIPPED', value: '50+' },
        { label: 'INTERNS TRAINED', value: '30+' },
        { label: 'TECH STACKS', value: '10+' },
        { label: 'SATISFACTION RATE', value: '92%' },
    ];

    const fadeIn: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <section className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] py-16 md:py-24 px-4 md:px-12 relative">
            <SectionCanvas dotColor="rgba(240,239,233,0.06)" />
            <div className="max-w-[1400px] mx-auto">

                {/* Header */}
                <div className="mb-16 md:mb-24 relative">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false }}
                        className="text-[11vw] md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-6 md:mb-8 break-words"
                    >
                        WHY
                        <br />
                        GKK
                        <br />
                        <span className="text-[var(--text-muted)]">INTERNS?</span>
                    </motion.h1>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <p className="max-w-xl text-sm md:text-base text-[var(--text-muted)] font-medium leading-relaxed">
                            GKK helps aspiring developers build real-world coding skills through hands-on projects, mentorship from experienced engineers, and a structured curriculum focused on modern tech stacks.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false }}
                    variants={{
                        visible: { transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-2 md:grid-cols-4 border-y border-[var(--border)] mb-16 md:mb-32"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            variants={fadeIn}
                            className={`py-8 md:py-12 px-4 md:px-6 ${index !== 3 ? 'md:border-r border-[var(--border)]' : ''} ${index % 2 === 0 ? 'border-r md:border-r-0 border-[var(--border)]' : ''}`}
                        >
                            <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">{stat.value}</h3>
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Feature 1 - Tech Stack Expertise */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-24 mb-16 md:mb-32 items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="md:col-span-5"
                    >
                        <div className="aspect-[4/3] bg-[var(--bg-surface)] relative overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
                            <img
                                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2000&auto=format&fit=crop"
                                alt="Modern Tech Stack"
                                className="w-full h-full object-cover opacity-80"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                                <h3 className="text-4xl font-black text-white/20 uppercase tracking-tighter text-center leading-none">
                                    MODERN
                                    <br />
                                    TECH STACK
                                </h3>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        variants={fadeIn}
                        className="md:col-span-7"
                    >
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-600 mb-4 block">
                            01 / TECHNOLOGY
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">
                            Industry-Grade Tools
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm md:text-lg leading-relaxed max-w-xl mb-8">
                            Work with the same tools and technologies used by top tech companies. From React and TypeScript to Docker, AWS, and CI/CD pipelines - learn by building production-ready applications.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">REACT, NEXT.JS, NODE.JS</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">GIT, DOCKER, AWS</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Feature 2 - Mentorship & Code Review */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-24 mb-16 md:mb-32 items-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        variants={fadeIn}
                        className="md:col-span-5 order-2 md:order-1"
                    >
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-4 block">
                            02 / MENTORSHIP
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">
                            Code Review Culture
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm md:text-lg leading-relaxed max-w-xl mb-12">
                            Learn from experienced developers through detailed code reviews, pair programming sessions, and weekly tech talks. Your code gets reviewed just like at top tech companies.
                        </p>
                        <div className="flex items-end gap-16 border-t border-[var(--border)] pt-8">
                            <div>
                                <h4 className="text-3xl font-black mb-1">75+</h4>
                                <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-400">Code Reviews</span>
                            </div>
                            <div>
                                <h4 className="text-3xl font-black mb-1">4.4/5</h4>
                                <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-400">Mentor Rating</span>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="md:col-span-7 order-1 md:order-2"
                    >
                        <div className="aspect-video md:aspect-[21/9] bg-[var(--bg-surface)] overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2664&auto=format&fit=crop"
                                alt="Team Collaboration"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Feature 3 - Real Projects */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-24 items-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="md:col-span-6"
                    >
                        <div className="aspect-square bg-neutral-600 overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-500">
                            <img
                                src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2000&auto=format&fit=crop"
                                alt="Real Projects"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </motion.div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        variants={fadeIn}
                        className="md:col-span-6"
                    >
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-600 mb-4 block">
                            03 / PROJECTS
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">
                            Ship Real Products
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm md:text-lg leading-relaxed max-w-xl mb-8">
                            No toy projects here. Work on actual products used by real users. Contribute to codebases with thousands of lines, write tests, deploy to production, and see your code make an impact.
                        </p>
                        <button className="text-[10px] font-bold tracking-[0.25em] uppercase text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2">
                            View Projects <span>→</span>
                        </button>
                    </motion.div>
                </div>

            </div>
        </section>
    );
};

export default AchievementSection;
