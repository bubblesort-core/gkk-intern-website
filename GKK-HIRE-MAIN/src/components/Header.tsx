import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const navItems = [
    { id: 'philosophy', label: 'Philosophy', number: '01' },
    { id: 'duration', label: 'Duration', number: '02' },
    { id: 'apply', label: 'Apply', number: '03' },
];

export default function Header() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
                }`}
        >
            <div className="max-w-[1600px] mx-auto px-8 py-6 flex items-center justify-between">
                {/* Logo */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="cursor-pointer"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <h1 className="text-4xl md:text-5xl font-black font-inter tracking-tighter">
                        GKK
                    </h1>
                </motion.div>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-12">
                    {navItems.map((item, index) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                            whileHover={{ y: -2 }}
                            onClick={() => scrollToSection(item.id)}
                            className="group flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-colors hover:text-olive"
                        >
                            <span className="text-xs opacity-50">{item.number}</span>
                            <span>{item.label}</span>
                            <motion.div
                                className="h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"
                                whileHover={{ width: '100%' }}
                            />
                        </motion.button>
                    ))}
                </nav>

                {/* Mobile Menu Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="md:hidden flex flex-col gap-1.5 p-2"
                    aria-label="Menu"
                >
                    <span className="w-6 h-0.5 bg-black"></span>
                    <span className="w-6 h-0.5 bg-black"></span>
                    <span className="w-6 h-0.5 bg-black"></span>
                </motion.button>
            </div>
        </motion.header>
    );
}
