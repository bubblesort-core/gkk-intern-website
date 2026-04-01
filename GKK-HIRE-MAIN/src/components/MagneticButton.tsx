import React, { useRef, useState, useEffect } from 'react';

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    strength?: number;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({ 
    children, 
    className = "", 
    onClick, 
    strength = 0.3 
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: MouseEvent) => {
        if (!buttonRef.current) return;
        
        const { clientX, clientY } = e;
        const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
        
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const radius = Math.max(width, height) * 1.5;

        if (distance < radius) {
            setPosition({ 
                x: deltaX * strength, 
                y: deltaY * strength 
            });
        } else {
            setPosition({ x: 0, y: 0 });
        }
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <button
            ref={buttonRef}
            onClick={onClick}
            onMouseLeave={handleMouseLeave}
            className={`relative transition-transform duration-300 ease-out cursor-none active:scale-95 ${className}`}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`
            }}
        >
            <div className="relative z-10">{children}</div>
            <div 
                className="absolute inset-0 bg-[var(--accent)] opacity-20 blur-xl rounded-full scale-110 transition-transform duration-500"
                style={{
                    transform: `translate(${position.x * 0.5}px, ${position.y * 0.5}px)`
                }}
            />
        </button>
    );
};
