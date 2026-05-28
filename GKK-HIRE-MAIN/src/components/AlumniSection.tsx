import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import SectionCanvas from './SectionCanvas';
import { supabase } from '../lib/supabase';

// Define the shape of our alumni items
export interface AlumniItem {
    id: string | number;
    name: string;
    role: string;
    image: string;
    video?: string;
    number: string;
    isPortrait?: boolean;
}

// --- YouTube API Loader ---
let apiLoaded = false;
const loadYoutubeApi = () => {
    if (apiLoaded) return Promise.resolve();
    return new Promise<void>((resolve) => {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        (window as any).onYouTubeIframeAPIReady = () => {
            apiLoaded = true;
            resolve();
        };
    });
};

function CustomVideoPlayer({ videoId, image, onPlayStateChange }: { videoId: string, image: string, onPlayStateChange?: (playing: boolean) => void }) {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isApiReady, setIsApiReady] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [volume, setVolume] = useState(50);
    const [isMuted, setIsMuted] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        if (isPlaying) {
            hideTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        resetHideTimer();
        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, [isPlaying, resetHideTimer]);

    useEffect(() => {
        loadYoutubeApi().then(() => setIsApiReady(true));
    }, []);

    useEffect(() => {
        if (!isApiReady || !containerRef.current || playerRef.current) return;

        playerRef.current = new (window as any).YT.Player(containerRef.current, {
            videoId: videoId,
            host: 'https://www.youtube-nocookie.com',
            playerVars: {
                autoplay: 1,
                controls: 0,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3,
                enablejsapi: 1,
                disablekb: 1,
                fs: 0,
                origin: window.location.origin
            },
            events: {
                onStateChange: (event: any) => {
                    if (!playerRef.current) return;
                    const state = event.data;
                    const playing = state === (window as any).YT.PlayerState.PLAYING;
                    setIsPlaying(playing);
                    onPlayStateChange?.(playing);
                },
                onReady: (event: any) => {
                    if (!playerRef.current) return;
                    setIsPlayerReady(true);
                    setDuration(event.target.getDuration());
                    // Set default volume to 50%
                    event.target.setVolume(50);
                    // Force play attempt on ready
                    try {
                        event.target.playVideo();
                    } catch (e) {
                        console.warn('Initial play effort failed:', e);
                    }
                }
            }
        });

        const interval = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getPlayerState === 'function' && isPlayerReady) {
                try {
                    const state = playerRef.current.getPlayerState();
                    if (state === (window as any).YT.PlayerState.PLAYING && playerRef.current.getCurrentTime) {
                        const current = playerRef.current.getCurrentTime();
                        const total = playerRef.current.getDuration();
                        setCurrentTime(current);
                        setDuration(total);
                        if (total > 0) setProgress((current / total) * 100);
                    }
                } catch (e) {
                    // Ignore transient cross-origin errors during init/destroy
                }
            }
        }, 500);

        return () => {
            clearInterval(interval);
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {}
                playerRef.current = null;
            }
        };
    }, [isApiReady, videoId, isPlayerReady]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playerRef.current || !isPlayerReady) return;
        
        try {
            if (isPlaying && typeof playerRef.current.pauseVideo === 'function') {
                playerRef.current.pauseVideo();
            } else if (!isPlaying && typeof playerRef.current.playVideo === 'function') {
                playerRef.current.playVideo();
            }
        } catch (e) {
            console.error('Playback toggle error:', e);
        }
        resetHideTimer();
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seekTo = parseFloat(e.target.value);
        if (playerRef.current && isPlayerReady && typeof playerRef.current.seekTo === 'function') {
            const time = (seekTo / 100) * duration;
            playerRef.current.seekTo(time, true);
            setProgress(seekTo);
        }
        resetHideTimer();
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseInt(e.target.value);
        setVolume(newVolume);
        if (playerRef.current && isPlayerReady) {
            playerRef.current.setVolume(newVolume);
            if (newVolume > 0 && isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            } else if (newVolume === 0 && !isMuted) {
                playerRef.current.mute();
                setIsMuted(true);
            }
        }
        resetHideTimer();
    };

    const toggleMute = () => {
        if (!playerRef.current || !isPlayerReady) return;
        if (isMuted) {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume > 0 ? volume : 50);
            if (volume === 0) setVolume(50);
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
        resetHideTimer();
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div 
            className="relative w-full h-full overflow-hidden flex flex-col items-center"
            onMouseMove={resetHideTimer}
        >
            {/* The Cropping Shell */}
            <div className="relative w-full h-full scale-[1.15] bg-black">
                <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                
                {/* Visual Fix Overlay (Catches mouse events for custom cursor + play toggle) */}
                <div 
                    className="absolute inset-0 z-10 cursor-none" 
                    onClick={togglePlay}
                    data-cursor="click"
                />
            </div>

            {/* Custom Interface Overlay */}
            <AnimatePresence>
                {(!isPlayerReady || !isPlaying || showControls) && (
                    <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none"
                    >
                        {!isPlayerReady ? (
                             <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Initializing...</span>
                             </div>
                        ) : !isPlaying ? (
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
                                <span className="material-symbols-outlined text-white text-5xl">play_arrow</span>
                            </div>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Controls Bar */}
            <div 
                className={`absolute bottom-4 left-4 right-4 z-30 flex flex-col gap-2 p-3 transition-opacity duration-500 ease-in-out
                    ${(showControls || !isPlaying) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <button 
                        onClick={togglePlay}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                    </button>

                    <div className="flex items-center gap-1 group/volume">
                        <button 
                            onClick={toggleMute}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {isMuted || volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
                            </span>
                        </button>
                        <div className="w-0 overflow-hidden group-hover/volume:w-16 transition-all duration-300 ease-in-out flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-16 h-1 cursor-pointer accent-white"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1 pr-2">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            className="w-full h-1 cursor-pointer accent-[#22c55e] drop-shadow-lg"
                        />
                        <div className="flex justify-between items-center text-[10px] font-bold text-white tracking-tighter drop-shadow-md">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AlumniCard({ item }: { item: AlumniItem }) {
    const [isHovered, setIsHovered] = useState(false);
    const [hasClicked, setHasClicked] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setHasClicked(false);
    };

    const isPlaceholder = item.name === 'Open Spot';
    
    // Helper to extract YouTube Video ID
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/\?|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYouTubeId(item.video || '');
    const isPortrait = item.isPortrait || item.video?.includes('/shorts/') || (item.video?.includes('vi/') && !item.video?.includes('watch'));

    return (
        <div
            className="group relative h-[50vh] w-[90vw] md:h-[70vh] md:w-[40vw] shrink-0 overflow-visible bg-neutral-800"
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

            {/* Video popup */}
            {item.video && !isPlaceholder && (
                <div
                    className={`absolute z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out flex flex-col items-center
                        ${isHovered
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-50 pointer-events-none'
                        }`}
                    style={{ width: '95%', maxWidth: isPortrait ? '400px' : '1000px' }}
                >
                    <div 
                        className={`relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 bg-black cursor-pointer ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setHasClicked(true);
                        }}
                    >
                        {!hasClicked ? (
                            <div className="relative w-full h-full">
                                <img 
                                    src={item.image} 
                                    alt="Video thumbnail" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group/play">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover/play:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-white text-4xl md:text-5xl">
                                            play_arrow
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            videoId && <CustomVideoPlayer videoId={videoId} image={item.image} />
                        )}
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
                        : 'bottom-0 left-0 right-0 p-8 md:p-12 bg-linear-to-t from-black/70 to-transparent'
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
    const [alumniItems, setAlumniItems] = useState<AlumniItem[]>([]);
    const [loading, setLoading] = useState(true);

    const { scrollYProgress } = useScroll({
        target: targetRef,
        container: scrollContainerRef
    });

    useEffect(() => {
        const fetchAlumni = async () => {
            try {
                const { data, error } = await supabase
                    .from('alumni_members')
                    .select('*')
                    .order('display_order', { ascending: true })
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Base static placeholders
                const placeholders: AlumniItem[] = [
                    {
                        id: 'p1',
                        name: 'Open Spot',
                        role: 'Backend Developer',
                        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop',
                        number: '' 
                    },
                    {
                        id: 'p2',
                        name: 'Open Spot',
                        role: 'Mobile Developer',
                        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=2000&auto=format&fit=crop',
                        number: '' 
                    }
                ];

                const fetched: AlumniItem[] = (data || []).map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    role: a.role,
                    image: a.image_url,
                    video: a.video_url,
                    isPortrait: a.is_portrait,
                    number: '' 
                }));

                const allItems = [...fetched, ...placeholders];
                const formattedItems = allItems.map((item, idx) => ({
                    ...item,
                    number: (idx + 1).toString().padStart(2, '0')
                }));

                setAlumniItems(formattedItems);
            } catch (err) {
                console.error('Error fetching alumni:', err);
                setAlumniItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAlumni();
    }, []);

    const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

    return (
        <section ref={targetRef} id="alumni" className="relative h-[300vh] bg-(--bg-primary) text-(--text-primary)">
            <SectionCanvas dotColor="rgba(240,239,233,0.06)" />
            <div className="sticky top-0 flex h-screen items-center overflow-hidden">
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
                    {!loading ? (
                        alumniItems.map((item) => (
                            <AlumniCard key={item.id} item={item} />
                        ))
                    ) : (
                        <div className="flex items-center justify-center p-20 min-w-[50vw]">
                           <div className="text-white/20 text-4xl font-black italic tracking-widest animate-pulse whitespace-nowrap">LOADING EXPERIENCE...</div>
                        </div>
                    )}
                    <div className="w-[10vw] shrink-0" />
                </motion.div>

                <div className="absolute bottom-12 right-12 z-20 mix-blend-difference">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold tracking-widest uppercase text-white">Scroll to Explore</span>
                        <div className="h-px w-12 bg-white"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
