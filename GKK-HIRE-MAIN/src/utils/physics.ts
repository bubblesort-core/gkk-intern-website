import type { MousePosition, CardPhysics } from '../types';

/**
 * Calculate distance between two points
 */
export const calculateDistance = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Calculate card physics based on mouse position
 */
export const calculateCardPhysics = (
    cardX: number,
    cardY: number,
    mousePosition: MousePosition,
    maxDistance: number = 300
): CardPhysics => {
    const distance = calculateDistance(cardX, cardY, mousePosition.x, mousePosition.y);

    if (distance > maxDistance) {
        return { x: 0, y: 0, rotation: 0, scale: 1 };
    }

    // Calculate influence (closer = stronger)
    const influence = 1 - (distance / maxDistance);

    // Calculate direction
    const angle = Math.atan2(mousePosition.y - cardY, mousePosition.x - cardX);

    // Calculate movement (cards move away from cursor)
    const moveDistance = influence * 40;
    const x = -Math.cos(angle) * moveDistance;
    const y = -Math.sin(angle) * moveDistance;

    // Calculate rotation based on position relative to mouse
    const rotation = (mousePosition.x - cardX) / 50 * influence;

    // Scale slightly when mouse is near
    const scale = 1 + (influence * 0.05);

    return { x, y, rotation, scale };
};

/**
 * Smooth easing function
 */
export const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
};

/**
 * Spring physics constants
 */
export const SPRING_CONFIG = {
    stiffness: 150,
    damping: 20,
    mass: 1,
};

/**
 * Calculate scroll progress (0 to 1)
 */
export const getScrollProgress = (element: HTMLElement): number => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Element is fully visible when top is at bottom of viewport
    // and fully hidden when bottom is at top of viewport
    const start = windowHeight;
    const end = -rect.height;
    const current = rect.top;

    const progress = (start - current) / (start - end);
    return Math.max(0, Math.min(1, progress));
};
