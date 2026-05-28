import { memo } from 'react';
import { motion } from 'framer-motion';
import type { MousePosition } from '../types';

interface FloatingCardProps {
    index: number;
    mousePosition: MousePosition;
}

const FloatingCard = ({ index, mousePosition }: FloatingCardProps) => {
    // Calculate movement based on mouse position and index
    const x = (mousePosition.x * (index + 1) * 2) / 100;
    const y = (mousePosition.y * (index + 1) * 2) / 100;

    const colors = [
        'bg-red-500/10',
        'bg-blue-500/10',
        'bg-green-500/10',
        'bg-yellow-500/10',
    ];

    const sizes = [
        'w-64 h-80',
        'w-56 h-72',
        'w-48 h-64',
        'w-40 h-56',
    ];

    const positions = [
        'top-20 left-20',
        'top-40 right-40',
        'bottom-20 left-40',
        'bottom-40 right-20',
    ];

    return (
        <motion.div
            className={`absolute ${positions[index % positions.length]} ${sizes[index % sizes.length]} ${colors[index % colors.length]} border border-white/20 rounded-xl pointer-events-none will-change-transform`}
            animate={{
                x,
                y,
                rotate: [0, 3, -3, 0],
            }}
            transition={{
                x: { type: 'spring', damping: 28, stiffness: 90 },
                y: { type: 'spring', damping: 28, stiffness: 90 },
                rotate: { duration: 14, repeat: Infinity, ease: 'linear' },
            }}
        />
    );
};

export default memo(FloatingCard);
