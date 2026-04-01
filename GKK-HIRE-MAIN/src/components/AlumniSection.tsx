import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import SectionCanvas from './SectionCanvas';

interface AlumniItem {
    id: number;
    name: string;
    role: string;
    image: string;
    video?: string; // Optional video URL — plays on hover
    number: string;
}

const alumniItems: AlumniItem[] = [
    {
        id: 1,
        name: 'Aaditi Srivastava',
        role: 'Intern',
        image: '/alumni_aaditi.png',
        video: '/alumni_aaditi.mp4',
        number: '01'
    },
    {
        id: 2,
        name: 'Manthan Agrawal',
        role: 'Intern',
        image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2000&auto=format&fit=crop',
        video: '/ALUMNI_MANTHAN_GKK.mp4',
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

function AlumniCard({ item }: { item: AlumniItem }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [volume, setVolume] = useState(0.8); // normal volume level (0-1)

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (item.video && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.muted = true;
            videoRef.current.play().then(() => {
                if (videoRef.current) {
                    videoRef.current.muted = false;
                    videoRef.current.volume = volume;
                }
            }).catch(() => {});
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (item.video && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.muted = true;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        if (videoRef.current) {
            videoRef.current.volume = newVol;
            videoRef.current.muted = newVol === 0;
        }
    };

    const isPlaceholder = item.name === 'Open Spot';

    return (
        <div
            className="group relative h-[50vh] w-[90vw] md:h-[70vh] md:w-[40vw] flex-shrink-0 overflow-visible bg-neutral-800"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Photo */}
            <img
                src={item.image}
                alt={item.name}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700
                    ${isPlaceholder ? 'blur-xl grayscale opacity-50' : 'group-hover:scale-105'}`}
                loading="lazy"
            />

            {/* Dark Overlay */}
            <div className={`absolute inset-0 z-20 transition-all duration-500
                ${isPlaceholder ? 'bg-black/60' : isHovered && item.video ? 'bg-black/70' : 'bg-black/30'}`}
            />

            {/* Video popup — landscape droplet that pops up on hover */}
            {item.video && (
                <div
                    className={`absolute z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out
                        ${isHovered
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-50 pointer-events-none'
                        }`}
                    style={{ width: '95%', maxWidth: '1000px' }}
                >
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10">
                        <video
                            ref={videoRef}
                            src={item.video}
                            muted
                            playsInline
                            loop
                            preload="metadata"
                            className="w-full h-auto object-contain bg-black"
                        />
                    </div>

                    {/* Volume slider below video */}
                    <div
                        className={`flex items-center justify-center gap-2 mt-3 transition-opacity duration-300
                            ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="material-symbols-outlined text-white text-[16px] drop-shadow-lg">
                            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-24 h-1 cursor-pointer"
                            style={{ accentColor: 'white' }}
                        />
                    </div>
                </div>
            )}

            {isPlaceholder ? (
                /* Placeholder card — "BE THE NEXT ALUMNI" */
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-8">
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
                        <p className="text-lg md:text-xl text-white/60 font-medium mt-6">{item.role}</p>
                        <a href="/dashboard/" className="mt-8 border border-white/30 px-6 py-3 inline-block hover:bg-white hover:text-black transition-all duration-300 no-underline">
                            <span className="text-sm font-bold tracking-widest uppercase text-white/80 hover:text-black">Apply Now</span>
                        </a>
                    </motion.div>
                </div>
            ) : (
                /* Real alumni card — name/role shift to corner when video plays */
                <div className={`absolute z-30 transition-all duration-500 ease-out
                    ${isHovered && item.video
                        ? 'top-3 left-3 right-auto bottom-auto p-2 bg-black/60 backdrop-blur-sm rounded-lg'
                        : 'bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-black/70 to-transparent'
                    }`}
                >
                    {!isHovered && <span className="block text-4xl md:text-6xl font-bold opacity-20 mb-4">{item.number}</span>}
                    <h3 className={`font-black tracking-tighter text-white uppercase leading-none transition-all duration-500
                        ${isHovered && item.video ? 'text-xs mb-0' : 'text-3xl md:text-5xl mb-2'}`}
                    >
                        {item.name}
                    </h3>
                    <p className={`text-white/70 font-medium transition-all duration-500
                        ${isHovered && item.video ? 'text-[9px]' : 'text-lg md:text-xl'}`}
                    >
                        {item.role}
                    </p>
                    {item.video && !isHovered && (
                        <div className="mt-4 flex items-center gap-2 opacity-70">
                            <span className="material-symbols-outlined text-white text-[18px]">play_circle</span>
                            <span className="text-xs text-white/60 font-bold tracking-widest uppercase">Hover to play</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AlumniSection({ scrollContainerRef }: { scrollContainerRef?: React.RefObject<HTMLElement> }) {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        container: scrollContainerRef
    });

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

    return (
        <section ref={targetRef} id="alumni" className="relative h-[300vh] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <SectionCanvas dotColor="rgba(240,239,233,0.06)" />
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
                        <AlumniCard key={item.id} item={item} />
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

