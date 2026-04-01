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

                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, 'var(--accent)');
                gradient.addColorStop(1, 'var(--accent-glow)');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        const animationId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationId);
    }, [visualizerData]);

    return (
        <div className={`fixed bottom-6 left-6 z-[1000] p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-3">
                <canvas 
                    ref={canvasRef} 
                    width={100} 
                    height={40} 
                    className="w-24 h-10"
                />
                <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--accent-glow)] font-bold uppercase tracking-widest leading-none">Frequency</span>
                    <span className="text-[8px] text-[var(--text-muted)] font-medium leading-none mt-1 text-center">Active Sync</span>
                </div>
            </div>
        </div>
    );
};
