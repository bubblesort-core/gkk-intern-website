import { useRef, Suspense, lazy, useState } from 'react';
import IntroLoader from './components/IntroLoader';
import GKKPage from './components/GKKPage';
import AboutSection from './components/AboutSection';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import SkeletonLoader from './components/SkeletonLoader';
import WorkshopModal from './components/WorkshopModal';
import { PandaaBot } from './components/PandaaBot';
import { MagneticCursor } from './components/MagneticCursor';

const ServicesPage = lazy(() => import('./components/ServicesPage'));
const AlumniSection = lazy(() => import('./components/AlumniSection'));

const AchievementSection = lazy(() => import('./components/AchievementSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));

export default function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [introDone, setIntroDone] = useState(false);

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
            <MagneticCursor />
            {!introDone && <IntroLoader onComplete={() => setIntroDone(true)} />}
            <div
                ref={containerRef}
                className="relative h-screen w-full overflow-y-auto overflow-x-hidden bg-[var(--bg-primary)] scroll-smooth selection:bg-[var(--accent)] selection:text-white"
            >
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
            <section className="h-[300vh] w-full relative">
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
            <PandaaBot />
        </div>
        </>
    );
}
