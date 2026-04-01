import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const MusicContext = createContext(undefined);

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (!context) throw new Error('useMusic must be used within MusicProvider');
    return context;
};

export const MusicProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [visualizerData, setVisualizerData] = useState(null);
    
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        const initAudio = () => {
            if (audioContextRef.current) return;

            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = ac.createAnalyser();
            analyser.fftSize = 256;
            
            const audio = new Audio('https://res.cloudinary.com/dzt6v9d7t/video/upload/v1711200000/cyberpunk_music.mp3');
            audio.loop = true;
            audio.crossOrigin = "anonymous";
            
            const source = ac.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(ac.destination);
            
            audioRef.current = audio;
            audioContextRef.current = ac;
            analyserRef.current = analyser;
            sourceRef.current = source;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const updateVisualizer = () => {
                analyser.getByteFrequencyData(dataArray);
                setVisualizerData(new Uint8Array(dataArray));
                animationFrameRef.current = requestAnimationFrame(updateVisualizer);
            };
            
            updateVisualizer();
        };

        const handleInteraction = () => {
            initAudio();
            document.removeEventListener('click', handleInteraction);
        };

        document.addEventListener('click', handleInteraction);
        
        return () => {
            document.removeEventListener('click', handleInteraction);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current || !audioContextRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    return (
        <MusicContext.Provider value={{ isPlaying, volume, setVolume, togglePlay, visualizerData }}>
            {children}
        </MusicContext.Provider>
    );
};
