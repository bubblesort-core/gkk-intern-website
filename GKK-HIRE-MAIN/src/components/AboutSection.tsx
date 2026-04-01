import { motion } from 'framer-motion';
import SectionCanvas from './SectionCanvas';

export default function AboutSection() {
    return (
        <section className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden flex flex-col justify-center py-12 md:py-20">
            <SectionCanvas dotColor="rgba(240,239,233,0.07)" />
            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full select-none pointer-events-none z-0 overflow-hidden flex justify-center items-center">
                <span className="text-[40vw] font-black text-[rgba(240,239,233,0.03)] leading-none tracking-tighter whitespace-nowrap">
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
                        className="text-[12vw] md:text-[11rem] font-black tracking-tighter leading-[0.85] uppercase bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-muted)] bg-clip-text text-transparent"
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
                <div className="max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-sm md:text-lg text-[var(--text-muted)] leading-relaxed font-medium space-y-6"
                    >
                        <p>
                            GKK Interns represents a paradigm shift in the digital internship landscape. Founded on the principle that the gap between academic learning and industry demands is too wide, we have created an ecosystem where convention collapses and innovation begins. Our platform is not just about learning: it's about doing. We provide students and early-career professionals with the opportunity to work on real-world codebases, ship production-ready features, and build a career portfolio that speaks louder than any resume.
                        </p>
                        <p>
                            At GKK Interns, we dismantle the traditional internship model, fusing clinical precision with the lawless creativity of modern software design. Our residencies are curated experiences within exclusive aesthetic environments, designed for those who understand that coding is a form of art. Whether you're building high-performance web applications, developing complex algorithms, or designing immersive user interfaces, GKK Interns provides the mentorship and resources you need to excel.
                        </p>
                        <p>
                            Join the elite ranks of GKK Interns and start building the future today. Our methodology is rooted in hands-on experience, where every line of code you write contributes to meaningful projects. We believe in the power of "Code. Build. Deploy." and we invite you to be a part of this transformative journey. From skill development to professional networking, GKK Interns is your gateway to the global tech industry.
                        </p>
                        <p>
                            Our curriculum spans across various domains including Full-stack Development, Artificial Intelligence, User Experience Design, and Cloud Architecture. We leverage modern frameworks like React, Next.js, and Supabase to provide our interns with the most relevant skill sets in today's market. By the end of your tenure with GKK Interns, you will not only have gained technical proficiency but also a deep understanding of industry best practices, project management, and collaborative software development.
                        </p>
                        <p>
                            Gkk Intern provides professional internship opportunities and skill development for students, ensuring they are well-equipped to face the challenges of the modern workplace. We are committed to fostering a community of innovators who are passionate about technology and dedicated to excellence. Our mission is to empower the next generation of engineers and designers to realize their full potential and make a lasting impact on the world.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
