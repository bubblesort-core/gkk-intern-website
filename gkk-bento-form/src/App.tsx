import { useState, useEffect, useCallback, useRef } from "react";
import Header from "./components/Header";
import Mascot from "./components/Mascot";
import IdentityCard from "./components/IdentityCard";
import QuickInfoCards from "./components/QuickInfoCards";
import SensitiveLinksCard from "./components/SensitiveLinksCard";
import DocumentUploadCard from "./components/DocumentUploadCard";
import CalendarCard from "./components/CalendarCard";
import TimeCard from "./components/TimeCard";
import DiscoveryCard from "./components/DiscoveryCard";
import ProgressBar from "./components/ProgressBar";
import { FormProvider } from "./context/FormContext";
import { getFormSettings } from "./lib/supabase";

function App() {
  // Force build update - timestamp: 2026-02-09
  // Force build update - timestamp: 2026-02-09
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [activeBatch, setActiveBatch] = useState("Batch 1");
  const [checkingLock, setCheckingLock] = useState(true);

  // For smooth random movement
  const targetPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | undefined>(undefined);

  // Check form lock status on mount
  useEffect(() => {
    async function checkFormStatus() {
      const { data: settings, error } = await getFormSettings();
      if (error) {
        setIsFormLocked(true);
        setLockMessage("Technical error, Currently under fixing.");
      } else if (settings) {
        setIsFormLocked(settings.is_form_locked);
        setLockMessage(settings.lock_message || "Applications are currently closed.");
        setActiveBatch(settings.active_batch || "Batch 1");
      }
      setCheckingLock(false);
    }
    checkFormStatus();
  }, []);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Smooth random eye movement for mobile devices
  useEffect(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = undefined;
    }

    if (!isMobile) {
      return;
    }

    const generateNewTarget = () => {
      targetPosition.current = {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 6,
      };
    };

    const animate = () => {
      setEyePosition((prev) => {
        const dx = targetPosition.current.x - prev.x;
        const dy = targetPosition.current.y - prev.y;
        const easing = 0.03;
        return {
          x: prev.x + dx * easing,
          y: prev.y + dy * easing,
        };
      });
      animationFrame.current = requestAnimationFrame(animate);
    };

    generateNewTarget();
    animationFrame.current = requestAnimationFrame(animate);

    const interval = setInterval(() => {
      generateNewTarget();
    }, 2000);

    return () => {
      clearInterval(interval);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = undefined;
      }
    };
  }, [isMobile]);

  // Track mouse movement for eye following (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX = ((e.clientX - centerX) / centerX) * 5;
      const offsetY = ((e.clientY - centerY) / centerY) * 3;
      const clampedX = Math.max(-5, Math.min(5, offsetX));
      const clampedY = Math.max(-3, Math.min(3, offsetY));
      setEyePosition({ x: clampedX, y: clampedY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  // Form focus handlers
  const handleFormFocus = useCallback(() => {
    setIsFormFocused(true);
  }, []);

  const handleFormBlur = useCallback(() => {
    setIsFormFocused(false);
  }, []);

  useEffect(() => {
    if (isFormFocused && !isMobile) {
      setEyePosition({ x: 3, y: 2 });
    }
  }, [isFormFocused, isMobile]);

  // Show loading state while checking lock
  if (checkingLock) {
    return (
      <div className="bg-background-light text-text-primary min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-fly text-6xl text-[#10b981] rotate-45">flight</span>
          <p className="text-text-secondary text-lg font-medium animate-fadeInFast">Taking off...</p>
        </div>
      </div>
    );
  }

  // Show locked message if form is closed
  if (isFormLocked) {
    return (
      <div className="bg-background-light text-text-primary min-h-screen">
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center py-10 px-4 md:px-10 lg:px-40">
              <div className="max-w-xl w-full text-center">
                <div className="bg-linear-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-10 shadow-xl">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-red-500">lock</span>
                  </div>
                  <h1 className="text-3xl font-black text-text-primary mb-4">
                    Applications Closed
                  </h1>
                  <p className="text-text-secondary text-lg mb-6">
                    {lockMessage}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="https://gkkintern.in"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#10b981] text-white font-semibold rounded-xl hover:bg-[#0d9668] transition-colors"
                    >
                      <span className="material-symbols-outlined">home</span>
                      Back to Homepage
                    </a>
                    <a
                      href="mailto:contact@gkkhire.com"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-text-primary font-semibold rounded-xl hover:border-[#10b981] transition-colors"
                    >
                      <span className="material-symbols-outlined">mail</span>
                      Contact Admin
                    </a>
                  </div>
                </div>

                <footer className="w-full text-center py-6 text-sm text-text-secondary mt-8">
                  <p>© 2026 GKK Hire. A <a href="https://bubblesort.in" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline">Bubblesort</a> Initiative.</p>
                </footer>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider initialBatch={activeBatch}>
      <ProgressBar />
      <div className="bg-background-light text-text-primary min-h-screen flex flex-col">
        <div className="relative flex-1 flex w-full flex-col overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            <Header />

            <main className="flex-1 flex justify-center py-10 px-4 md:px-10 lg:px-40 overflow-hidden">
              <div className="max-w-350 w-full flex flex-col gap-8 form-container h-full">
                {/* Hero Section */}
                <div className="flex flex-col gap-3 text-center shrink-0">
                  <h1 className="text-text-primary text-2xl sm:text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
                    GKK Internship Application - {activeBatch}
                  </h1>
                  <p className="text-text-secondary text-lg font-normal leading-normal">
                    Join our team of innovators. Complete the form below to apply. Our mascot watches for quality!
                  </p>
                </div>

                {/* Main Form Layout (Centered Bento) */}
                <div className="relative w-full flex-1">

                  <div
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 relative z-10 w-full pb-20"
                    onInput={() => {
                      setIsTyping(true);
                      if ((window as any).typingTimeout) clearTimeout((window as any).typingTimeout);
                      (window as any).typingTimeout = setTimeout(() => setIsTyping(false), 2000);
                    }}
                  >
                    {/* Row 1 - Top */}
                    <div className="md:col-span-8 w-full flex"><IdentityCard onFocus={handleFormFocus} onBlur={handleFormBlur} /></div>
                    <div className="md:col-span-4 w-full flex min-h-57.5"><QuickInfoCards /></div>

                    {/* Row 2 - Center Mascot */}
                    <div className="md:col-span-4 w-full flex"><DocumentUploadCard /></div>
                    <div className="md:col-span-4 w-full flex">
                      <Mascot eyesClosed={false} eyePosition={eyePosition} isTyping={isTyping} />
                    </div>
                    <div className="md:col-span-4 w-full flex"><SensitiveLinksCard /></div>

                    {/* Row 3 - Bottom */}
                    <div className="md:col-span-4 w-full flex"><CalendarCard /></div>
                    <div className="md:col-span-4 w-full flex"><TimeCard /></div>
                    <div className="md:col-span-4 w-full flex"><DiscoveryCard /></div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        <footer className="w-full text-center py-6 text-sm text-text-secondary flex gap-4 justify-center items-center shrink-0 border-t border-border/20 z-20 bg-background-light mt-auto">
          <p>© 2026 GKK Hire.</p>
          <div className="flex gap-4">
            <a href="/privacy.html" className="hover:text-amber-600 transition-colors">Privacy</a>
            <a href="/terms.html" className="hover:text-amber-600 transition-colors">Terms</a>
          </div>
        </footer>
      </div>
    </FormProvider>
  );
}

export default App;
