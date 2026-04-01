import React from 'react';

const services = [
  'Web Development', '·', 
  'UI/UX Design', '·', 
  'Digital Marketing', '·', 
  'App Development', '·', 
  'SEO Optimization', '·', 
  'E-Commerce Solutions', '·',
  'Graphic Design', '·',
  'Software Internships', '·',
  'Design Internships', '·',
  'Marketing Internships', '·'
];

export default function Marquee() {
  const renderItems = () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', paddingRight: 32, whiteSpace: 'nowrap', width: 'max-content' }}>
      {services.map((r, i) => (
        <span key={i} style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: r === '·' ? 'rgba(255,255,255,0.1)' : i % 8 === 0 || i % 8 === 4 ? '#4ade80' : 'rgba(255,255,255,0.6)',
        }}>
          {r}
        </span>
      ))}
    </div>
  );

  return (
    <div
      style={{
        overflow: 'hidden',
        width: '100%',
        padding: '16px 0',
        display: 'flex',
        background: 'transparent',
      }}
    >
      <style>
        {`
          @keyframes scroll-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: scroll-marquee 40s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}
      </style>
      <div className="marquee-track">
        {renderItems()}
        {renderItems()}
      </div>
    </div>
  );
}
