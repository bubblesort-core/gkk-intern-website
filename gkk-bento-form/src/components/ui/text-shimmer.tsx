import { cn } from '@/lib/utils';

interface TextShimmerProps {
    children: string;
    className?: string;
}

export function TextShimmer({ children, className }: TextShimmerProps) {
    return (
        <span
            className={cn(
                'inline-block animate-shimmer bg-[linear-gradient(110deg,#333_35%,#fff_50%,#333_65%)] bg-[length:200%_100%] bg-clip-text text-transparent',
                className
            )}
        >
            {children}
        </span>
    );
}
