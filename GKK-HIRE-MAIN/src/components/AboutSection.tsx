import { motion } from 'framer-motion';
import SectionCanvas from './SectionCanvas';

const aboutCards = [
    {
        title: 'Why GKK Exists',
        text: "GKK Interns was built to close the gap between classroom theory and industry execution. This is a do-first ecosystem where interns ship real features, contribute to active products, and graduate with proof of work, not just certificates.",
    },
    {
        title: 'How We Train',
        text: "We blend structure with creative freedom. Interns work inside design-forward product environments, guided by mentors through practical workflows: planning, coding, reviews, deployment, and iteration.",
    },
    {
        title: 'What You Build',
        text: "You build production-grade apps, UI systems, automation logic, and data-driven features across full-stack development, AI, UX, and cloud. Every task is selected to grow both technical depth and product thinking.",
    },
    {
        title: 'Career Outcome',
        text: "By the end of the residency, you gain technical confidence, collaboration habits, and a portfolio mapped to modern hiring expectations. You learn how teams actually ship software in real timelines.",
    },
    {
        title: 'Our Mission',
        text: "We are committed to building a high-standard community of engineers and creators who value craft, discipline, and impact. GKK Interns is where ambitious learners transform into industry-ready builders.",
    },
];

export default function AboutSection() {
    return (
        <section className="min-h-screen bg-(--bg-primary) text-(--text-primary) relative overflow-hidden flex flex-col justify-center py-12 md:py-20">
            <SectionCanvas dotColor="rgba(240,239,233,0.07)" />
            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full select-none pointer-events-none z-0 overflow-hidden flex justify-center items-center">
                <span className="text-[40vw] font-black text-[rgba(240,239,233,0.03)] leading-none tracking-tighter whitespace-nowrap">
                    GKK
                </span>
            </div>

            <div className="max-w-350 w-full mx-auto px-4 md:px-12 relative z-10 h-full flex flex-col justify-center">

                {/* Main Typography */}
                <div className="relative z-10 mb-12 md:mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-[11vw] md:text-[8rem] font-black tracking-tighter leading-[0.88] uppercase bg-linear-to-b from-(--text-primary) to-(--text-muted) bg-clip-text text-transparent"
                    >
                        CODE<br />BUILD
                    </motion.h2>
                    <motion.h2
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="text-[8vw] md:text-[6rem] font-serif italic font-light tracking-tight leading-[0.9]"
                    >
                        deploy & grow.
                    </motion.h2>
                </div>

                {/* Floating Manifesto Card */}
                {/* Floating Manifesto Card Removed */}

                {/* About Cards */}
                <div className="max-w-300">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
                    >
                        {aboutCards.map((card, index) => (
                            <motion.article
                                key={card.title}
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.2 }}
                                transition={{ duration: 0.45, delay: 0.05 * index }}
                                className="rounded-2xl border border-(--border) bg-(--bg-elevated)/70 backdrop-blur-sm p-5 md:p-6"
                            >
                                <h3 className="text-lg md:text-xl font-bold mb-3 text-(--text-primary)">
                                    {card.title}
                                </h3>
                                <p className="text-sm md:text-base text-(--text-muted) leading-relaxed font-medium">
                                    {card.text}
                                </p>
                            </motion.article>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
