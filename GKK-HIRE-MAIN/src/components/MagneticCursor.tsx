import React, { useEffect, useState } from 'react';

export const MagneticCursor: React.FC = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPointer, setIsPointer] = useState(false);
    const [isHidden, setIsHidden] = useState(true);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsHidden(false);
            
            const target = e.target as HTMLElement;
            setIsPointer(window.getComputedStyle(target).cursor === 'pointer' || 
                       !!target.closest('button, a, [role="button"]'));
        };

        const handleMouseLeave = () => setIsHidden(true);
        const handleMouseEnter = () => setIsHidden(false);

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, []);

    if (isHidden) return null;

    return (
        <div 
            className="fixed pointer-events-none z-[9999] transition-transform duration-100 ease-out hidden md:block"
            style={{ 
                left: position.x, 
                top: position.y,
                transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`
            }}
        >
            <div className={`w-4 h-4 rounded-full bg-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)] transition-all duration-300 ${isPointer ? 'opacity-20 w-12 h-12' : 'opacity-100'}`} />
            {isPointer && (
                <div className="absolute inset-0 w-12 h-12 rounded-full border border-[var(--accent-glow)] animate-ping opacity-30" />
            )}
        </div>
    );
};
