import React from 'react';

export default function NewsTicker({ items }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--foreground)', color: 'var(--background)', height: '40px', overflow: 'hidden', borderBottom: '1px solid var(--borderLight)' }} role="region" aria-label="Live health information ticker">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--primary)', padding: '0 1.5rem', height: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', zIndex: 10, position: 'relative' }}>
        <div style={{ width: '6px', height: '6px', background: '#4ADE80' }}></div>
        LIVE STATUS
      </div>
      <div className="np-ticker-track" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div className="np-ticker-content" style={{ opacity: 0.9 }}>
          {doubled.map((it, i) => (
            <span key={i} className="np-ticker-item">{it}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
