import React from 'react';

// 5-position dot meter — compact, monospace-friendly. Shared by PULSE and the
// TREE lens so an entry's vitality reads the same in either view.
export default function PulseDot({ score }) {
  const filled = Math.max(0, Math.min(5, Math.round((score ?? 0) * 5)));
  return (
    <span
      data-testid="pulse-dot"
      data-score={filled}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: 'var(--phosphor-dim)', textShadow: 'none', letterSpacing: '0.1em',
      }}
    >
      {Array.from({ length: 5 }, (_, i) => (i < filled ? '*' : '.')).map((g, i) => (
        <span key={i} style={{
          color: i < filled ? 'var(--phosphor)' : 'var(--phosphor-dim)',
          textShadow: i < filled ? 'var(--glow)' : 'none',
        }}>{g}</span>
      ))}
    </span>
  );
}
