import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

interface InteractiveBackgroundProps {
    dotColor?: string;
    accentColor?: string;
}

const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ 
    dotColor = 'rgba(240,239,233,0.08)', 
    accentColor = 'rgba(34,216,122,0.5)' 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        
        // Listen on the entire body to capture all mouse movements
        const parent = document.body;
        if (!parent) return;

        let rAF: number, resizeId: any, dots: any[] = [], anims: any[] = [];

        const init = () => {
            anims.forEach(a => a.pause());
            
            // Fill full body size
            cvs.width = window.innerWidth;
            cvs.height = window.innerHeight;
            
            dots = [];
            const cols = Math.ceil(cvs.width / 52) + 1;
            const rows = Math.ceil(cvs.height / 52) + 1;
            
            for (let i = 0; i < cols * rows; i++) {
                dots.push({
                    x: (i % cols) * 52 + (cvs.width - cols * 52) / 2,
                    y: Math.floor(i / cols) * 52 + (cvs.height - rows * 52) / 2,
                    dy: 0, 
                    r: 1.2, 
                    color: dotColor, 
                    hover: false
                });
            }

            anims = [anime({
                targets: dots, dy: [-3, 3], duration: 2600, direction: 'alternate',
                loop: true, easing: 'easeInOutSine', delay: anime.stagger(60, { grid: [cols, rows], from: 'center' })
            })];
        };

        const render = () => {
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            dots.forEach(d => {
                ctx.beginPath(); ctx.arc(d.x, d.y + d.dy, d.r, 0, 2 * Math.PI);
                ctx.fillStyle = d.color;
                ctx.fill();
            });
            rAF = requestAnimationFrame(render);
        };

        let lastE: MouseEvent | null = null;
        const hover = (e?: Event) => {
            if (e && e.type === 'mousemove') lastE = e as MouseEvent;
            if (!lastE) return;

            // IGNORE if mouse is over inputs or textareas
            if (lastE.target instanceof HTMLElement) {
                const target = lastE.target;
                if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                    dots.forEach(d => {
                        if (d.hover) {
                            d.hover = false;
                            anime({ targets: d, r: 1.2, color: dotColor, duration: 500, easing: 'easeOutExpo' });
                        }
                    });
                    return;
                }
            }
            
            const mx = lastE.clientX;
            const my = lastE.clientY;

            dots.forEach(d => {
                const dist = Math.hypot(d.x - mx, d.y + d.dy - my);
                const inRange = dist < 110;
                if (d.hover !== inRange) {
                    d.hover = inRange;
                    anime({
                        targets: d, 
                        r: inRange ? 2.2 : 1.2,
                        color: inRange ? accentColor : dotColor,
                        duration: e ? 380 : 500, easing: 'easeOutExpo'
                    });
                }
            });
        };

        const click = (e: MouseEvent) => {
            if (e.target instanceof HTMLElement) {
                const target = e.target;
                if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
                    return;
                }
            }
            const r = document.createElement('div');
            r.style.cssText = `position:fixed;border-radius:50%;pointer-events:none;left:${e.clientX - 100}px;top:${e.clientY - 100}px;width:200px;height:200px;background:rgba(34,216,122,0.12);z-index:0; transform:scale(0);`;
            document.body.appendChild(r);
            anime({ targets: r, scale: [0, 1], opacity: [0.35, 0], duration: 700, easing: 'easeOutExpo', complete: () => r.remove() });
        };

        const resize = () => { clearTimeout(resizeId); resizeId = setTimeout(init, 150); };
        
        const handleScroll = () => hover();
        window.addEventListener('resize', resize);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('mousemove', hover as EventListener);
        window.addEventListener('mouseleave', () => { lastE = null; hover(); });
        window.addEventListener('click', click as EventListener);
        
        init(); render();
        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('mousemove', hover as EventListener);
            window.removeEventListener('mouseleave', () => { lastE = null; hover(); });
            window.removeEventListener('click', click as EventListener);
            clearTimeout(resizeId); cancelAnimationFrame(rAF); anims.forEach(a => a.pause());
        };
    }, [dotColor, accentColor]);
    
    // Hidden on mobile using Tailwind md:block, pointer-events-none ensures no scroll/click blocking ever.
    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <canvas ref={canvasRef} style={{ pointerEvents: 'none', position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
        </div>
    );
};

export default InteractiveBackground;
