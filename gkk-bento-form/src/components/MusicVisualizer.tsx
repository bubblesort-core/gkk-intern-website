import React, { useRef, useEffect } from 'react';
import { useMusic } from './MusicContext';

export const MusicVisualizer: React.FC = () => {
    const { visualizerData, isPlaying } = useMusic();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !visualizerData) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            const barWidth = (width / visualizerData.length) * 2.5;
            let x = 0;

            for (let i = 0; i < visualizerData.length; i++) {
                const barHeight = (visualizerData[i] / 255) * height;

                ctx.fillStyle = '#22d87a';
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        const animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, [visualizerData]);

    return (
        <div className={`fixed bottom-6 left-6 z-[1000] transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <canvas ref={canvasRef} width={80} height={30} className="w-20 h-8 opacity-50" />
        </div>
    );
};
