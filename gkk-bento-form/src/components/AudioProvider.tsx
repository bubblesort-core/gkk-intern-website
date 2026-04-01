import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface AudioContextType {
    isMuted: boolean;
    toggleMute: () => void;
    playClick: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error('useAudio must be used within AudioProvider');
    return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMuted, setIsMuted] = useState(() => localStorage.getItem('isMuted') === 'true');
    const clickAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio('/mouse click.mp3');
        audio.preload = 'auto';
        clickAudioRef.current = audio;

        const handleGlobalClick = (e: MouseEvent) => {
            if (isMuted) return;

            const target = e.target as HTMLElement;
            const interactiveSelectors = [
                'button', 
                'a', 
                '[role="button"]', 
                'input[type="submit"]', 
                'input[type="button"]',
                '.magnetic-btn',
                '.clickable'
            ];

            const isInteractive = interactiveSelectors.some(selector => 
                target.closest(selector)
            );

            if (isInteractive) {
                playClick();
            }
        };

        document.addEventListener('click', handleGlobalClick, { capture: true });
        
        return () => {
            document.removeEventListener('click', handleGlobalClick, { capture: true });
        };
    }, [isMuted]);

    const playClick = () => {
        if (isMuted || !clickAudioRef.current) return;
        
        clickAudioRef.current.currentTime = 0;
        clickAudioRef.current.play().catch(err => {
            console.warn('Audio playback failed:', err);
        });
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        localStorage.setItem('isMuted', String(newMuted));
    };

    return (
        <AudioContext.Provider value={{ isMuted, toggleMute, playClick }}>
            {children}
        </AudioContext.Provider>
    );
};
