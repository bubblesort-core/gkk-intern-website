import { motion } from 'framer-motion';

export default function AboutSection() {
    return (
        <section className="min-h-screen bg-[#F5F5F3] text-black relative overflow-hidden flex flex-col justify-center py-12 md:py-20">
            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full select-none pointer-events-none z-0 overflow-hidden flex justify-center items-center">
                <span className="text-[40vw] font-black text-[#EDEDEB] leading-none tracking-tighter whitespace-nowrap">
                    GKK
                </span>
            </div>

            <div className="max-w-[1400px] w-full mx-auto px-4 md:px-12 relative z-10 h-full flex flex-col justify-center">

                {/* Main Typography */}
                <div className="relative z-10 mb-12 md:mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-[12vw] md:text-[11rem] font-black tracking-tighter leading-[0.85] uppercase"
                    >
                        CODE<br />BUILD
                    </motion.h2>
                    <motion.h2
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="text-[9vw] md:text-[8rem] font-serif italic font-light tracking-tight leading-[0.9]"
                    >
                        deploy & grow.
                    </motion.h2>
                </div>

                {/* Floating Manifesto Card */}
                {/* Floating Manifesto Card Removed */}

                {/* Bottom Text / Description */}
                <div className="max-w-xl">
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-sm md:text-lg text-neutral-500 leading-relaxed font-medium"
                    >
                        GKK Interns bridges the gap between academic learning and industry demands. Work on real codebases, ship production features, and build a portfolio that speaks louder than any resume.
                    </motion.p>
                </div>
            </div>
        </section>
    );
}
