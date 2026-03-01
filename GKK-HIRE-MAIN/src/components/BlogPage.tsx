import { useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';

const blogArticles = [
    {
        id: 1,
        category: 'CODING TIPS',
        tags: ['PROGRAMMING', 'BEST PRACTICES', 'CAREER GROWTH'],
        title: 'HOW TO BUILD A STRONG CODING PORTFOLIO',
        description: 'Your portfolio is your proof of skill. Learn how to showcase projects that impress recruiters and land you that dream internship or job.',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2000&auto=format&fit=crop',
        date: 'JANUARY 2026'
    },
    {
        id: 2,
        category: 'TECH INTERVIEW',
        tags: ['DSA', 'SYSTEM DESIGN', 'INTERVIEW PREP'],
        title: 'CRACKING THE TECHNICAL INTERVIEW',
        description: 'Master data structures, algorithms, and system design concepts. Get insider tips on what top tech companies really look for.',
        image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=2000&auto=format&fit=crop',
        date: 'JANUARY 2026'
    },
    {
        id: 3,
        category: 'DEVELOPMENT',
        tags: ['REACT', 'NODE.JS', 'FULL-STACK'],
        title: 'FULL-STACK DEVELOPMENT ROADMAP 2026',
        description: 'Navigate the modern tech stack. From React and Next.js to Node.js and databases - a complete guide to becoming a full-stack developer.',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2000&auto=format&fit=crop',
        date: 'DECEMBER 2025'
    },
    {
        id: 4,
        category: 'OPEN SOURCE',
        tags: ['GITHUB', 'CONTRIBUTIONS', 'COMMUNITY'],
        title: 'GETTING STARTED WITH OPEN SOURCE',
        description: 'Contributing to open source accelerates your learning and builds credibility. Learn how to find projects and make meaningful contributions.',
        image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=2000&auto=format&fit=crop',
        date: 'DECEMBER 2025'
    }
];

export default function BlogPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        // @ts-ignore
        const gsap = window.gsap;
        // @ts-ignore
        const Draggable = window.Draggable;

        if (gsap && Draggable) {
            gsap.registerPlugin(Draggable);
            // InertiaPlugin is automatically registered if loaded via CDN

            const ctx = gsap.context(() => {
                Draggable.create(sliderRef.current, {
                    type: "x",
                    bounds: containerRef.current,
                    inertia: true,
                    edgeResistance: 0.65,
                    dragClickables: true
                });
            }, containerRef);

            return () => ctx.revert();
        }
    }, []);

    // Rotating geometric shape animation
    const rotateAnimation = {
        animate: {
            rotate: 360,
            transition: {
                duration: 20,
                ease: "linear" as const,
                repeat: Infinity
            }
        }
    };

    return (
        <section className="min-h-screen bg-[#F5F5F3] text-black py-16 md:py-24 relative overflow-hidden flex flex-col justify-center">
            {/* Header / Zigzag Pattern */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-[#E5E5E5] flex flex-col justify-end overflow-hidden z-10">
                <div className="flex flex-row absolute -bottom-6 -left-5">
                    {[...Array(40)].map((_, i) => (
                        <div key={i} className="w-12 h-12 bg-[#F5F5F3] transform rotate-45 -mr-6" />
                    ))}
                </div>
            </div>

            {/* Background Geometric Elements */}
            <div className="absolute top-40 right-10 opacity-5 pointer-events-none z-0">
                <motion.div variants={rotateAnimation} animate="animate" className="w-96 h-96 border border-black transform rotate-45" />
            </div>
            <div className="absolute bottom-40 left-10 opacity-5 pointer-events-none z-0">
                <motion.div variants={rotateAnimation} animate="animate" className="w-64 h-64 border border-black rounded-full" />
            </div>

            <div className="w-full relative z-10 pl-4 md:pl-12" ref={containerRef}>
                {/* Hero Section */}
                <div className="mb-16 pr-4 md:pr-12">
                    <div className="flex flex-row items-center gap-4 mb-8">
                        <div className="h-[1px] w-12 bg-neutral-400"></div>
                        <span className="text-xs font-bold tracking-[0.3em] uppercase text-neutral-400 block">
                            GKK / EDITORIAL INSIGHTS
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-6 md:mb-8">
                        Dev Blog &<br />Resources
                    </h1>
                    <p className="text-sm font-bold tracking-widest text-neutral-400 uppercase">
                        DRAG TO EXPLORE →
                    </p>
                </div>

                {/* Slider */}
                <div
                    ref={sliderRef}
                    className="flex gap-16 md:gap-32 w-max cursor-grab active:cursor-grabbing pb-20 items-stretch pl-4 md:pl-0"
                >
                    {blogArticles.map((article) => (
                        <div key={article.id} className="flex gap-6 md:gap-12 flex-shrink-0 items-start">
                            {/* Number beside the slide */}
                            <span className="text-6xl md:text-9xl font-black text-transparent stroke-black-2 md:stroke-black-1 leading-none mt-4 font-outline-2 select-none opacity-20">
                                0{article.id}
                            </span>

                            <div
                                className="w-[80vw] md:w-[600px] group bg-white border border-neutral-200 shadow-sm hover:shadow-xl transition-shadow duration-500 overflow-hidden"
                            >
                                <div className="h-full flex flex-col">
                                    <div className="aspect-[16/9] bg-neutral-200 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 z-10 transition-colors duration-500" />
                                        <img
                                            src={article.image}
                                            alt={article.title}
                                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    </div>

                                    <div className="p-8 md:p-12 border-t border-neutral-100 flex flex-col flex-grow justify-between bg-white relative">
                                        <div className="space-y-6">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-black bg-neutral-100 px-2 py-1">
                                                    {article.category}
                                                </span>
                                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 px-2 py-1">
                                                    {article.date}
                                                </span>
                                            </div>

                                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-[0.95] group-hover:text-neutral-600 transition-colors duration-300">
                                                {article.title}
                                            </h2>

                                            <p className="text-sm text-neutral-600 leading-relaxed font-medium line-clamp-3">
                                                {article.description}
                                            </p>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-neutral-100 flex justify-between items-center">
                                            <div className="flex gap-2">
                                                {article.tags.slice(0, 2).map((tag, idx) => (
                                                    <span key={idx} className="text-[9px] font-bold tracking-widest uppercase text-neutral-400">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <button className="text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2 hover:gap-4 transition-all">
                                                Read <span className="text-lg">→</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Extra space at the end */}
                    <div className="w-[10vw] flex-shrink-0" />
                </div>
            </div>
        </section>
    );
}
