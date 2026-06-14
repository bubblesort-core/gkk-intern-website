import { motion } from 'framer-motion';
import SectionCanvas from './SectionCanvas';

export default function Footer() {
    return (
        <footer className="relative bg-[var(--bg-primary)] text-[var(--text-primary)] border-t border-[var(--border)] py-16 md:py-40 min-h-[60vh] md:min-h-[80vh] flex flex-col justify-center">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    {/* Brand */}
                    <div>
                        <motion.h3
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-3xl md:text-5xl font-black font-inter mb-4"
                        >
                            GKK
                        </motion.h3>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="text-sm font-cormorant italic text-[var(--text-muted)]"
                        >
                            Learn. Build. Ship.
                            <br />
                            Launch your tech career.
                        </motion.p>
                    </div>

                    {/* Links */}
                    <div>
                        <motion.h4
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-sm font-bold uppercase tracking-widest mb-6"
                        >
                            Connect
                        </motion.h4>
                        <motion.ul
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="space-y-3"
                        >
                            {[
                                { name: 'LinkedIn', url: 'https://www.linkedin.com/company/gkk-intern/' },
                                { name: 'X (Twitter)', url: 'https://x.com/gkkintern' },
                                { name: 'Instagram', url: 'https://www.instagram.com/gkkintern?igsh=MWV1ZWwza3NoeGNndg==' },
                                { name: 'Facebook', url: 'https://www.facebook.com/share/1Ar1Giv2Vw/' },
                                { name: 'Email', url: 'mailto:noreplay.gkk26@gmail.com' }
                            ].map((item) => (
                                <li key={item.name}>
                                    <motion.a
                                        whileHover={{ x: 5 }}
                                        href={item.url}
                                        target={item.name === 'Email' ? '_self' : '_blank'}
                                        rel={item.name === 'Email' ? undefined : "noopener noreferrer"}
                                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2"
                                    >
                                        <span className="w-4 h-[1px] bg-[var(--bg-primary)]/60"></span>
                                        {item.name}
                                    </motion.a>
                                </li>
                            ))}
                        </motion.ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <motion.h4
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-sm font-bold uppercase tracking-widest mb-6"
                        >
                            Contact
                        </motion.h4>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="space-y-4 text-[var(--text-muted)] text-sm"
                        >
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--text-primary)]/60 mb-1">Study Enquiry</p>
                                <a href="mailto:noreplay.gkk26@gmail.com" className="hover:text-[var(--text-primary)] transition-colors">noreplay.gkk26@gmail.com</a>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wider text-[var(--text-primary)]/60 mb-1">Business Enquiry</p>
                                <a href="mailto:hello@bubblesort.in" className="hover:text-[var(--text-primary)] transition-colors">hello@bubblesort.in</a>
                            </div>
                            <div className="pt-2">
                                <p>+91 9477564633</p>
                                <p>India</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[var(--text-primary)]/40"
                >
                    <div className="flex flex-col gap-1">
                        <p>© 2025 GKK Interns. All rights reserved.</p>
                        <p className="text-[10px] uppercase tracking-wider opacity-60">
                            GKK Interns - A GKK (Global Kompass Krew) venture, under <a href="https://bubblesort.in" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] underline decoration-white/30 underline-offset-2">Bubblesort</a>.
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <a href="/privacy.html" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a>
                        <a href="/terms.html" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</a>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}
