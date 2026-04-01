import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

export default function HeroTitle() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    anime({
      targets: ref.current.querySelectorAll('.letter'),
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      delay: anime.stagger(80),
      easing: 'easeOutExpo',
    });
  }, []);

  return (
    <h1 ref={ref} style={{ display: 'flex', gap: 2, margin: 0 }}>
      {'GKK'.split('').map((l, i) => (
        <span key={i} className="letter" style={{ opacity: 0, display: 'inline-block', fontSize: 96, fontWeight: 700, color: '#fff' }}>{l}</span>
      ))}
    </h1>
  );
}
