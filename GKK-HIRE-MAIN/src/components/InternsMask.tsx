import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

export default function InternsMask() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    anime({
      targets: ref.current,
      clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
      duration: 1000,
      delay: 500,
      easing: 'easeInOutExpo',
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        clipPath: 'inset(0 100% 0 0)',
        fontSize: 64,
        fontWeight: 700,
        color: '#888',
        letterSpacing: '0.05em',
      }}
    >
      INTERNS
    </div>
  );
}
