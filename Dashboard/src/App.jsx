import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';

import FeesSection from './components/FeesSection';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import CookieConsent from './components/CookieConsent';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

import InternProfile from './pages/InternProfile';

function LandingPage() {
    return (
        <>
            <Sidebar />
            <div className="main-content">
                <HeroSection />
                <FeaturesSection />

                <FeesSection />
                <Footer />
            </div>
            <ChatbotWidget />
            <CookieConsent />
            <div id="streak-toast-container"></div>
        </>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/index.html" element={<Navigate to="/" replace />} />
            <Route path="/user/login" element={<LoginPage />} />
            <Route path="/user/signup" element={<SignupPage />} />
            <Route path="/intern-profile" element={<InternProfile />} />

        </Routes>
    );
}
