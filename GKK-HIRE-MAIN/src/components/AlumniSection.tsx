import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const alumniItems = [
    {
        id: 1,
        name: 'Open Spot',
        role: 'Full-Stack Developer',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2000&auto=format&fit=crop',
        number: '01'
    },
    {
        id: 2,
        name: 'Open Spot',
        role: 'Frontend Engineer',
        image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2000&auto=format&fit=crop',
        number: '02'
    },
    {
        id: 3,
        name: 'Open Spot',
        role: 'Backend Developer',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop',
        number: '03'
    },
    {
        id: 4,
        name: 'Open Spot',
        role: 'Mobile Developer',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2000&auto=format&fit=crop',
        number: '04'
    }
];

export default function AlumniSection({ scrollContainerRef }: { scrollContainerRef?: React.RefObject<HTMLElement> }) {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        container: scrollContainerRef
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

    return (
        <section ref={targetRef} id="alumni" className="relative h-[300vh] bg-[#1a1a1a] text-white">
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
                {/* Section Header Fixed */}
                <div className="absolute top-12 left-8 md:top-20 md:left-20 z-20 mix-blend-difference">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
                            OUR ALUMNI
                        </h2>
                        <p className="text-sm md:text-base text-white/60 mt-4 max-w-md">
                            Your spot is waiting. Join GKK and become our next success story.
                        </p>
                    </motion.div>
                </div>

                <motion.div style={{ x }} className="flex gap-4 md:gap-20 pl-4 md:pl-[40vw]">
                    {alumniItems.map((item) => (
                        <div key={item.id} className="group relative h-[50vh] w-[90vw] md:h-[70vh] md:w-[40vw] flex-shrink-0 overflow-hidden bg-neutral-800">
                            {/* Blurred Image */}
                            <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover blur-xl grayscale opacity-50"
                                loading="lazy"
                            />

                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-black/60" />

                            {/* BE THE NEXT ALUMNI - Big Text Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-center"
                                >
                                    <span className="block text-6xl md:text-8xl font-black text-white/10 mb-4">{item.number}</span>
                                    <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none mb-4">
                                        BE THE<br />NEXT<br />ALUMNI
                                    </h3>
                                    <p className="text-lg md:text-xl text-white/60 font-medium mt-6">
                                        {item.role}
                                    </p>
                                    <a href="/Dashboard/" className="mt-8 border border-white/30 px-6 py-3 inline-block hover:bg-white hover:text-black transition-all duration-300 no-underline">
                                        <span className="text-sm font-bold tracking-widest uppercase text-white/80 hover:text-black">
                                            Apply Now
                                        </span>
                                    </a>
                                </motion.div>
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
                        <div className="h-[1px] w-12 bg-white"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
