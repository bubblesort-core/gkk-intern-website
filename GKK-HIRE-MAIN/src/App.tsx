import { useRef, Suspense, lazy, useState, useEffect } from 'react';
import IntroLoader from './components/IntroLoader';
import GKKPage from './components/GKKPage';
import AboutSection from './components/AboutSection';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import SkeletonLoader from './components/SkeletonLoader';
import WorkshopModal from './components/WorkshopModal';
// @ts-ignore
import CustomCursor from '../../CustomCursor.jsx';
import { supabase } from './lib/supabase';

const ServicesPage = lazy(() => import('./components/ServicesPage'));
const AlumniSection = lazy(() => import('./components/AlumniSection'));

const AchievementSection = lazy(() => import('./components/AchievementSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));
const BannerDisplay = lazy(() => import('./components/BannerDisplay'));
const PandaaBot = lazy(() => import('./components/PandaaBot').then((module) => ({ default: module.PandaaBot })));

export default function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [introDone, setIntroDone] = useState(false);
    const [showAlumniNudge, setShowAlumniNudge] = useState(true);
    const [alumniThumbs, setAlumniThumbs] = useState<string[]>([]);

    useEffect(() => {
        const fetchThumbs = async () => {
            try {
                const { data } = await supabase
                    .from('alumni_members')
                    .select('image_url')
                    .order('display_order', { ascending: true })
                    .order('created_at', { ascending: false })
                    .limit(4);
                
                if (data) {
                    setAlumniThumbs(data.map(a => a.image_url));
                }
            } catch (err) {
                console.error('Error fetching alumni thumbs:', err);
            }
        };
        fetchThumbs();
    }, []);

    const scrollToAlumniSection = () => {
        if (!containerRef.current) return;
        const alumniSection = containerRef.current.querySelector('#alumni-section') as HTMLElement | null;
        if (!alumniSection) return;

        containerRef.current.scrollTo({
            top: alumniSection.offsetTop,
            behavior: 'smooth',
        });
    };

    const scrollToSection = (index: number) => {
        if (containerRef.current) {
            const height = window.innerHeight;
            containerRef.current.scrollTo({
                top: height * index,
                behavior: 'smooth'
            });
        }
    };

    return (
        <>
            {introDone && <CustomCursor label="You" color="#22c55e" />}
            {!introDone && <IntroLoader onComplete={() => setIntroDone(true)} />}
            {introDone && showAlumniNudge && (
                <div className="fixed bottom-10 md:bottom-12 left-1/2 -translate-x-1/2 z-70">
                    <div className="relative rounded-full p-[1.5px]">
                        <div className="absolute inset-0 rounded-full bg-linear-to-r from-[#22c55e] via-[#06e4f9] to-[#22c55e] opacity-80 blur-[3px] animate-pulse" />
                        <button
                            type="button"
                            onClick={() => {
                                scrollToAlumniSection();
                                setShowAlumniNudge(false);
                            }}
                            className="relative rounded-full border border-(--border) bg-(--bg-elevated)/95 backdrop-blur-md px-3 py-2 md:px-4 md:py-2.5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all hover:scale-[1.02] hover:border-(--accent)"
                            data-cursor-label="Meet our alumni"
                        >
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="flex items-center">
                                    {alumniThumbs.map((img, idx) => (
                                        <img
                                            key={img}
                                            src={img}
                                            alt="Alumni"
                                            className={`size-8 md:size-9 rounded-full object-cover border border-(--bg-primary) ${idx > 0 ? '-ml-2.5' : ''}`}
                                        />
                                    ))}
                                </div>
                                <div className="pr-1">
                                    <p className="text-sm md:text-[15px] font-semibold text-(--text-primary) leading-tight">Meet our alumni</p>
                                    <p className="text-[11px] md:text-xs text-(--text-muted)">Tap to explore their journey</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}
            <div
                ref={containerRef}
                className="relative w-full h-screen overflow-y-auto overflow-x-hidden bg-(--bg-primary) scroll-smooth selection:bg-(--accent) selection:text-white pb-[200px]"
            >
            <Suspense fallback={null}>
                <BannerDisplay />
            </Suspense>
            <WorkshopModal />
            

            <section className="min-h-screen w-full relative">
                <GKKPage
                    onNavigate={scrollToSection}
                />
            </section>

            {/* About Section */}
            <section className="min-h-screen w-full relative">
                <AboutSection />
            </section>

            {/* Services Page */}
            <section className="min-h-screen w-full relative">
                <Suspense fallback={<SkeletonLoader />}>
                    {/* @ts-ignore */}
                    <ServicesPage scrollContainerRef={containerRef} />
                </Suspense>
            </section>


            {/* Alumni Section */}
            <section id="alumni-section" className="h-[300vh] w-full relative">
                <Suspense fallback={<SkeletonLoader />}>
                    {/* @ts-ignore */}
                    <AlumniSection scrollContainerRef={containerRef} />
                </Suspense>
            </section>


            <section className="min-h-screen w-full relative">
                <Suspense fallback={<SkeletonLoader />}>
                    <AchievementSection />
                </Suspense>
            </section>

            <section className="min-h-screen w-full relative">
                <CallToAction />
            </section>

            <section className="min-h-screen w-full relative">
                <Suspense fallback={<SkeletonLoader />}>
                    <ContactSection />
                </Suspense>
            </section>

            <section className="w-full relative">
                <Footer />
            </section>
            <Suspense fallback={null}>
                <PandaaBot />
            </Suspense>
        </div>
        </>
    );
}
