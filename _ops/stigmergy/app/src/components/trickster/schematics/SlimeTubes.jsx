import React from 'react';

// Slime Mold Delay · tubes become delay lines — two food sources feed a sink
// through plasmodium tubes; tube length sets delay time, thickness sets
// feedback gain. Transcribed from trickster.html (slime-mold-delay-steward-007).
// Reuse/preserved; the live interactive field (the iframe) carries the current
// slime cycle, so this static concept diagram is kept exact-keyed.
export default function SlimeTubes() {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="Slime mold delay: tubes from two food sources to a sink, length is delay time, thickness is feedback gain"
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)' }}
    >
      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="40" textAnchor="middle" fontSize="14" fill="currentColor">slime mold delay · tubes become delay lines</text>
      </g>
      {/* food sources */}
      <g style={{ color: 'var(--warn)' }} fill="currentColor">
        <circle cx="150" cy="180" r="12" /><text x="150" y="210" textAnchor="middle" fontSize="10" fill="currentColor">SOURCE A</text>
        <circle cx="650" cy="180" r="12" /><text x="650" y="210" textAnchor="middle" fontSize="10" fill="currentColor">SOURCE B</text>
      </g>
      {/* sink */}
      <g style={{ color: 'var(--ansi-bright-cyan)' }}>
        <rect x="380" y="380" width="40" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="400" y="420" textAnchor="middle" fontSize="10" fill="currentColor">SINK · OUTPUT</text>
      </g>
      {/* tube paths from sources to sink */}
      <g style={{ color: 'var(--phosphor)' }}>
        <path d="M150,190 Q180,260 250,290 Q310,310 390,380" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.75" />
        <path d="M650,190 Q610,250 540,290 Q470,330 410,380" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.7" />
        <path d="M150,190 Q260,150 380,200 Q500,250 650,190" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <text x="280" y="280" fontSize="11" fill="currentColor">len=L1 · width=W1</text>
        <text x="490" y="320" fontSize="11" fill="currentColor">len=L2 · width=W2</text>
      </g>
      <g style={{ color: 'var(--phosphor-dim)' }}>
        <text x="400" y="180" fontSize="10" fill="currentColor">faint redundant path</text>
        <text x="400" y="470" textAnchor="middle" fontSize="10" fill="currentColor">delay-time = length · feedback gain = thickness · the field already grows — the graph extraction is the next move</text>
      </g>
    </svg>
  );
}
