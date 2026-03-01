export interface MousePosition {
    x: number;
    y: number;
}

export interface CardPhysics {
    x: number;
    y: number;
    rotation: number;
    scale: number;
}

export interface FloatingCardProps {
    index: number;
    mousePosition: MousePosition;
    children?: React.ReactNode;
}

export interface NavItem {
    id: string;
    label: string;
    number: string;
}

export interface SectionProps {
    id?: string;
    className?: string;
    children?: React.ReactNode;
}
