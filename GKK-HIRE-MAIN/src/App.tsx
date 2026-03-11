import { useRef, Suspense, lazy } from 'react';
import GKKPage from './components/GKKPage';
import AboutSection from './components/AboutSection';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import SkeletonLoader from './components/SkeletonLoader';
import WorkshopModal from './components/WorkshopModal';

// Lazy load heavy sections
const ServicesPage = lazy(() => import('./components/ServicesPage'));
const Portfolio = lazy(() => import('./components/Portfolio'));
const AlumniSection = lazy(() => import('./components/AlumniSection'));
const BlogPage = lazy(() => import('./components/BlogPage'));
const AchievementSection = lazy(() => import('./components/AchievementSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));

export default function App() {
    const containerRef = useRef<HTMLDivElement>(null);

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
        <div
            ref={containerRef}
            className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#E5E5E5] scroll-smooth"
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

            {/* Curation / Portfolio Page */}
            <section className="h-[300vh] w-full relative">
                <Suspense fallback={<SkeletonLoader />}>
                    {/* @ts-ignore */}
                    <Portfolio scrollContainerRef={containerRef} />
                </Suspense>
            </section>

            {/* Alumni Section */}
            <section className="h-[300vh] w-full relative">
                <Suspense fallback={<SkeletonLoader />}>
                    {/* @ts-ignore */}
                    <AlumniSection scrollContainerRef={containerRef} />
                </Suspense>
            </section>

            {/* Blog Page */}
            <section className="min-h-screen w-full relative">
                <Suspense fallback={<SkeletonLoader />}>
                    <BlogPage />
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
        </div>
    );
}
