import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

export default function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Prevent scrolling on the body while the loader is active
    document.body.style.overflow = 'hidden';

    return () => {
        document.body.style.overflow = '';
    };
  }, []);

  const handleComplete = () => {
    if (!wrapperRef.current) return;
    
    // Fade out the entire black wrapper to reveal the site seamlessly
    anime({
      targets: wrapperRef.current,
      opacity: 0,
      duration: 600,
      easing: 'easeOutQuad',
      complete: () => {
        document.body.style.overflow = '';
        onComplete();
      }
    });
  };

  return (
    <div 
        ref={wrapperRef}
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100dvh',
            backgroundColor: '#000',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer' // user can click anywhere to skip
        }}
        onClick={handleComplete}
    >
        <video 
            ref={videoRef}
            src="/Opening_video.mp4" 
            autoPlay 
            muted 
            playsInline 
          preload="metadata"
            onEnded={handleComplete}
            style={{
                width: '100%',
                height: '100%',
                maxWidth: '1200px', // Prevents it from being excessively huge on ultra-wide screens
                maxHeight: '80vh',  // Gives some breathing room vertically
                objectFit: 'contain' // Ensures the entire video is visible without cropping
            }}
        />
        {/* Skip instruction */}
        <div style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '11px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            pointerEvents: 'none',
            userSelect: 'none'
        }}>
            Click anywhere to skip
        </div>
    </div>
  );
}
