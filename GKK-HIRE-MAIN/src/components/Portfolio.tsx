import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import SectionCanvas from './SectionCanvas';

const portfolioItems = [
    {
        id: 1,
        title: 'Full-Stack Development',
        subtitle: 'React, Node.js, PostgreSQL',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2000&auto=format&fit=crop',
        number: '01'
    },
    {
        id: 2,
        title: 'Mobile Development',
        subtitle: 'React Native, Flutter',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2000&auto=format&fit=crop',
        number: '02'
    },
    {
        id: 3,
        title: 'Backend Engineering',
        subtitle: 'APIs, Microservices, Cloud',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2000&auto=format&fit=crop',
        number: '03'
    },
    {
        id: 4,
        title: 'UI/UX Engineering',
        subtitle: 'Design Systems, Figma',
        image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?q=80&w=2000&auto=format&fit=crop',
        number: '04'
    }
];

export default function Portfolio({ scrollContainerRef }: { scrollContainerRef?: React.RefObject<HTMLElement> }) {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        container: scrollContainerRef
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

    return (
        <section ref={targetRef} id="portfolio" className="relative h-[300vh] bg-[var(--bg-surface)] text-white">
            <SectionCanvas dotColor="rgba(240,239,233,0.06)" />
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                {/* Section Header Fixed */}
                <div className="absolute top-12 left-8 md:top-20 md:left-20 z-20 mix-blend-difference">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
                            INTERNSHIP TRACKS
                        </h2>
                    </motion.div>
                </div>

                <motion.div style={{ x }} className="flex gap-4 md:gap-20 pl-4 md:pl-[40vw]">
                    {portfolioItems.map((item) => (
                        <div key={item.id} className="group relative h-[50vh] w-[90vw] md:h-[70vh] md:w-[45vw] flex-shrink-0 overflow-hidden bg-[var(--bg-surface)] grayscale hover:grayscale-0 transition-all duration-700 ease-out">
                            <div className="absolute inset-0 z-10 bg-[var(--bg-primary)]/20 group-hover:bg-transparent transition-colors duration-500" />

                            <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={(e) => {
                                    console.error('Image failed to load:', item.image);
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.style.backgroundColor = 'red';
                                }}
                                loading="lazy"
                            />

                            <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20">
                                <span className="block text-4xl md:text-6xl font-bold opacity-30 mb-4">{item.number}</span>
                                <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">{item.title}</h3>
                                <p className="text-lg md:text-xl font-light tracking-wide opacity-80">{item.subtitle}</p>
                            </div>
                        </div>
                    ))}
                    {/* Extra padding at the end */}
                    <div className="w-[10vw] flex-shrink-0" />
                </motion.div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-12 right-12 z-20 mix-blend-difference">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold tracking-widest uppercase text-white">Scroll to Explore</span>
                        <div className="h-[1px] w-12 bg-[var(--bg-primary)]"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
