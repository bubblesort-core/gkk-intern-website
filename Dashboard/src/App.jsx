import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

import InternProfile from './pages/InternProfile';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
import DashboardLayout from './components/dashboard/DashboardLayout';

const OverviewSection = lazy(() => import('./pages/dashboard/OverviewSection'));
const PaymentSection = lazy(() => import('./pages/dashboard/PaymentSection'));
const ProfileSection = lazy(() => import('./pages/dashboard/ProfileSection'));
const ProjectsSection = lazy(() => import('./pages/dashboard/ProjectsSection'));
const TeamSection = lazy(() => import('./pages/dashboard/TeamSection'));
const AnnouncementsSection = lazy(() => import('./pages/dashboard/AnnouncementsSection'));
const MeetingsSection = lazy(() => import('./pages/dashboard/MeetingsSection'));
const RecordingsSection = lazy(() => import('./pages/dashboard/RecordingsSection'));
const LeaderboardSection = lazy(() => import('./pages/dashboard/LeaderboardSection'));
const ResourcesSection = lazy(() => import('./pages/dashboard/ResourcesSection'));
const RewardsSection = lazy(() => import('./pages/dashboard/RewardsSection'));
const ReferralsSection = lazy(() => import('./pages/dashboard/ReferralsSection'));
const MobileAppSection = lazy(() => import('./pages/dashboard/MobileAppSection'));

function LandingPage() {
    return (
        <>
            <Sidebar />
            <div className="main-content" style={{ padding: 0 }}>
                <HeroSection />
                <Footer />
            </div>
            <CookieConsent />
            <div id="streak-toast-container"></div>
        </>
    );
}

function DashboardHomeRedirect() {
    const { profileSlug, loading } = useDashboard();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!loading && profileSlug) {
            navigate(`/${profileSlug}/overview`, { replace: true });
        }
    }, [profileSlug, loading, navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            background: '#0e0e12', 
            color: 'white' 
        }}>
            <div className="dash-loader-icon" style={{ width: 60, height: 60, marginBottom: '1.5rem' }} />
            <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>Redirecting to your dashboard...</div>
        </div>
    );
}

function DashboardFallback() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }} />
                Loading...
            </div>
        </div>
    );
}

import { AudioProvider } from './contexts/AudioContext';
import { PandaaBot } from './components/PandaaBot';


export default function App() {
    return (
        <AudioProvider>

            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/index.html" element={<Navigate to="/" replace />} />
                
                {/* Auth Routes */}
                <Route path="/user/login" element={<LoginPage />} />
                <Route path="/user/signup" element={<SignupPage />} />
                
                {/* Generic Entry Points */}
                <Route path="/user/dashboard" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<DashboardProvider><DashboardHomeRedirect /></DashboardProvider>} />
                
                {/* QR Profile */}
                <Route path="/intern-profile" element={<InternProfile />} />

                {/* Personalized Professional Dashboard */}
                <Route path="/:slug" element={<DashboardProvider><DashboardLayout /></DashboardProvider>}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<Suspense fallback={<DashboardFallback />}><OverviewSection /></Suspense>} />
                    <Route path="payment" element={<Suspense fallback={<DashboardFallback />}><PaymentSection /></Suspense>} />
                    <Route path="profile" element={<Suspense fallback={<DashboardFallback />}><ProfileSection /></Suspense>} />
                    <Route path="projects" element={<Suspense fallback={<DashboardFallback />}><ProjectsSection /></Suspense>} />
                    <Route path="team" element={<Suspense fallback={<DashboardFallback />}><TeamSection /></Suspense>} />
                    <Route path="announcements" element={<Suspense fallback={<DashboardFallback />}><AnnouncementsSection /></Suspense>} />
                    <Route path="meetings" element={<Suspense fallback={<DashboardFallback />}><MeetingsSection /></Suspense>} />
                    <Route path="recordings" element={<Suspense fallback={<DashboardFallback />}><RecordingsSection /></Suspense>} />
                    <Route path="leaderboard" element={<Suspense fallback={<DashboardFallback />}><LeaderboardSection /></Suspense>} />
                    <Route path="resources" element={<Suspense fallback={<DashboardFallback />}><ResourcesSection /></Suspense>} />
                    <Route path="rewards" element={<Suspense fallback={<DashboardFallback />}><RewardsSection /></Suspense>} />
                    <Route path="referrals" element={<Suspense fallback={<DashboardFallback />}><ReferralsSection /></Suspense>} />
                    <Route path="mobileapp" element={<Suspense fallback={<DashboardFallback />}><MobileAppSection /></Suspense>} />
                    <Route path="*" element={<Navigate to="overview" replace />} />
                </Route>
            </Routes>
        </AudioProvider>
    );
}
