import { useEffect, useRef } from 'react';

/**
 * Custom hook for lazy-loading sections with IntersectionObserver
 * Adds 'visible' class when the element scrolls into view
 */
export function useLazySection() {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                root: null,
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    return ref;
}
