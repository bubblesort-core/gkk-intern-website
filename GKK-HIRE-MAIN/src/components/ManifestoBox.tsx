import { motion } from 'framer-motion';

export default function ManifestoBox() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative p-8 md:p-12"
        >
            {/* Offset border frame */}
            <div className="absolute top-4 left-4 right-0 bottom-0 border-l-2 border-b-2 border-black"></div>

            {/* Content */}
            <div className="relative bg-white p-8 md:p-12">
                <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-2xl md:text-3xl font-cormorant italic mb-6"
                >
                    The Manifesto
                </motion.h3>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="space-y-4 text-sm md:text-base leading-relaxed"
                >
                    <p className="font-inter">
                        We reject the ordinary. We dismantle convention. We build from the fragments of what was, creating what will be.
                    </p>
                    <p className="font-cormorant italic text-black/70">
                        This is not an internship. This is an awakening.
                    </p>
                    <p className="font-inter">
                        Join us in the collapse. Rise in the reconstruction.
                    </p>
                </motion.div>

                {/* Decorative element */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-8 h-[2px] w-24 bg-black origin-left"
                />
            </div>
        </motion.div>
    );
}
