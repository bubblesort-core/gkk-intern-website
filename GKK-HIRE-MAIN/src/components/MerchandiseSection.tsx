import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const products = [
    {
        id: 1,
        title: "Classic T-Shirt",
        desc: "Customized on demand with premium fabric.",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
        price: "Coming Soon"
    },
    {
        id: 2,
        title: "Sticker Pack",
        desc: "Die-cut, waterproof, and extremely durable.",
        image: "https://images.unsplash.com/photo-1572454652230-189f81cc7539?q=80&w=1000&auto=format&fit=crop",
        price: "Coming Soon"
    },
    {
        id: 3,
        title: "Limited Poster",
        desc: "High quality art prints for your workspace.",
        image: "https://images.unsplash.com/photo-1581335108422-54d924d54641?q=80&w=1000&auto=format&fit=crop",
        price: "Coming Soon"
    }
];

export default function MerchandiseSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={containerRef} className="min-h-screen w-full bg-[#0c0c0f] relative overflow-hidden flex flex-col justify-center items-center py-24">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#22d87a]/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#06e4f9]/10 rounded-full blur-[100px] pointer-events-none" />
            </div>

            <motion.div style={{ y, opacity }} className="relative z-10 w-full max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-[clamp(40px,8vw,100px)] font-black text-[#f0efe9] uppercase tracking-tighter leading-none mb-4">
                        Merchandise
                    </h2>
                    <p className="text-[#22d87a] font-bold tracking-[0.2em] uppercase text-sm md:text-base">
                        Products • Customized On Demand • T-Shirts • Stickers • Posters
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {products.map((product, i) => (
                        <motion.div 
                            key={product.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: i * 0.2 }}
                            className="group relative rounded-2xl bg-[#13131a] border border-white/5 overflow-hidden hover:border-[#22d87a]/50 transition-colors duration-500"
                        >
                            <div className="aspect-[4/5] overflow-hidden relative">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                <img 
                                    src={product.image} 
                                    alt={product.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0c0c0f] via-[#0c0c0f]/80 to-transparent z-20">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                                        {product.title}
                                    </h3>
                                    <p className="text-white/60 text-sm mb-4">
                                        {product.desc}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#22d87a] font-bold">
                                            {product.price}
                                        </span>
                                        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#22d87a] group-hover:text-black transition-colors duration-300">
                                            <i className="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                
                <div className="mt-20 flex justify-center">
                    <button className="px-12 py-4 rounded-full border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-300 text-sm">
                        View All Products
                    </button>
                </div>
            </motion.div>
        </section>
    );
}
