import React, { useEffect, useState } from 'react';

export const MagneticCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPointer, setIsPointer] = useState(false);
    const [isHidden, setIsHidden] = useState(true);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsHidden(false);
            
            const target = e.target;
            setIsPointer(window.getComputedStyle(target).cursor === 'pointer' || 
                       target.closest('button, a, [role="button"], .clickable'));
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
            className="hidden md:block"
            style={{ 
                position: 'fixed',
                pointerEvents: 'none',
                zIndex: 9999,
                left: position.x, 
                top: position.y,
                transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
                transition: 'transform 0.1s ease-out'
            }}
        >
            <div style={{
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 15px var(--accent-glow)',
                transition: 'all 0.3s ease',
                opacity: isPointer ? 0.2 : 1,
                width: isPointer ? '48px' : '16px',
                height: isPointer ? '48px' : '16px'
            }} />
        </div>
    );
};
