import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

interface SectionCanvasProps {
    dotColor?: string;
    accentColor?: string;
}

const SectionCanvas: React.FC<SectionCanvasProps> = ({ 
    dotColor = 'rgba(240,239,233,0.08)', 
    accentColor = 'rgba(34,216,122,0.5)' 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;
        
        // Listen on the entire section to capture all mouse movements
        const parent = cvs.closest('section') || cvs.parentElement;
        if (!parent) return;

        console.log('SectionCanvas initialized with anime:', typeof anime);

        let rAF: number, resizeId: any, dots: any[] = [], anims: any[] = [];

        const init = () => {
            anims.forEach(a => a.pause());
            // Fast exit for mobile
            if (window.innerWidth < 768) {
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                return;
            }
            
            cvs.width = parent.offsetWidth;
            cvs.height = parent.offsetHeight;
            
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
            if (window.innerWidth < 768) return;
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            dots.forEach(d => {
                ctx.beginPath(); ctx.arc(d.x, d.y + d.dy, d.r, 0, 2 * Math.PI);
                ctx.fillStyle = d.color;
                ctx.fill();
            });
            rAF = requestAnimationFrame(render);
        };

        let hoverTicking = false;
        let lastE: MouseEvent | null = null;
        const hover = (e?: Event) => {
            if (window.innerWidth < 768) return;
            if (e && e.type === 'mousemove') lastE = e as MouseEvent;
            if (!lastE) return;

            if (!hoverTicking) {
                requestAnimationFrame(() => {
                    const rect = parent.getBoundingClientRect();
                    
                    const out = lastE!.clientX < rect.left || lastE!.clientX > rect.right || 
                                lastE!.clientY < rect.top || lastE!.clientY > rect.bottom;
                                
                    const mx = out ? -999 : lastE!.clientX - rect.left;
                    const my = out ? -999 : lastE!.clientY - rect.top;

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
                    hoverTicking = false;
                });
                hoverTicking = true;
            }
        };

        const click = (e: MouseEvent) => {
            if (window.innerWidth < 768) return;
            const rect = parent.getBoundingClientRect();
            const r = document.createElement('div');
            r.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;left:${e.clientX - rect.left - 100}px;top:${e.clientY - rect.top - 100}px;width:200px;height:200px;background:rgba(34,216,122,0.12);z-index:0; transform:scale(0);`;
            parent.appendChild(r);
            anime({ targets: r, scale: [0, 1], opacity: [0.35, 0], duration: 700, easing: 'easeOutExpo', complete: () => r.remove() });
        };

        const resize = () => { clearTimeout(resizeId); resizeId = setTimeout(init, 150); };
        
        window.addEventListener('resize', resize);
        parent.addEventListener('mousemove', hover as EventListener);
        parent.addEventListener('mouseleave', () => { lastE = null; hover(); });
        parent.addEventListener('click', click as EventListener);
        
        init(); render();
        return () => {
            window.removeEventListener('resize', resize);
            parent.removeEventListener('mousemove', hover as EventListener);
            parent.removeEventListener('mouseleave', () => { lastE = null; hover(); });
            parent.removeEventListener('click', click as EventListener);
            clearTimeout(resizeId); cancelAnimationFrame(rAF); anims.forEach(a => a.pause());
        };
    }, [dotColor, accentColor]);
    
    // Hidden on mobile using Tailwind md:block, pointer-events-none ensures no scroll/click blocking ever.
    return (
        <div className="hidden md:block absolute inset-0 z-0">
            <canvas ref={canvasRef} style={{ pointerEvents: 'none', position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
        </div>
    );
};

export default SectionCanvas;
