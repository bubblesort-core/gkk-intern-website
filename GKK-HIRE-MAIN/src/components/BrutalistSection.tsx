import { motion } from 'framer-motion';
import ManifestoBox from './ManifestoBox';

export default function BrutalistSection() {
    return (
        <section id="philosophy" className="relative min-h-screen bg-white py-24 md:py-32 overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-8">
                {/* Large overlapping typography */}
                <div className="relative mb-24">
                    {/* Background text */}
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        whileInView={{ opacity: 0.05, x: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute -left-8 top-0 pointer-events-none"
                    >
                        <h2 className="text-[8rem] md:text-[12rem] lg:text-[16rem] font-black font-inter leading-none tracking-tighter">
                            THE
                        </h2>
                    </motion.div>

                    {/* Main text - breaking the grid */}
                    <motion.div
                        initial={{ opacity: 0, rotate: 0 }}
                        whileInView={{ opacity: 1, rotate: -2 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="relative z-10 break-grid pt-32 md:pt-48"
                    >
                        <h2 className="text-6xl md:text-8xl lg:text-9xl font-black font-inter leading-[0.9] tracking-tighter mb-4">
                            THE COLLAPSE
                        </h2>
                        <h2 className="text-6xl md:text-8xl lg:text-9xl font-black font-inter leading-[0.9] tracking-tighter">
                            OF CONVENTION
                        </h2>
                    </motion.div>

                    {/* Accent text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mt-12 ml-4 md:ml-12"
                    >
                        <p className="text-2xl md:text-4xl font-cormorant italic text-black/60 max-w-2xl">
                            Where traditional structures crumble, innovation emerges from the debris.
                        </p>
                    </motion.div>
                </div>

                {/* Grid of content blocks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-24">
                    {/* Left column */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div>
                            <h3 className="text-4xl md:text-5xl font-black font-inter mb-4">
                                DECONSTRUCTED
                            </h3>
                            <p className="text-lg leading-relaxed text-black/70">
                                We strip away the unnecessary. Every element serves a purpose. Every decision is intentional. This is design reduced to its essence.
                            </p>
                        </div>

                        <div className="border-l-4 border-black pl-6">
                            <p className="text-xl font-cormorant italic">
                                "Form follows function, but function follows vision."
                            </p>
                        </div>
                    </motion.div>

                    {/* Right column - Manifesto Box */}
                    <div>
                        <ManifestoBox />
                    </div>
                </div>

                {/* Bottom accent */}
                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-1 bg-black origin-left"
                />
            </div>
        </section>
    );
}
