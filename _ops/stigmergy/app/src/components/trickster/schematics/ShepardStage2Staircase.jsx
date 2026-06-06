import React from 'react';

// Shepard · the infinite-staircase synth — two forks for Stage 2: how it climbs
// (discrete steps vs continuous glide) × how it wraps (expose the seam or hide
// it). Transcribed from trickster.html (shepard-steward-013). Reuse/preserved;
// depicts a Stage-2 request not in the current pending set.
export default function ShepardStage2Staircase() {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="The infinite-staircase synth: discrete steps vs continuous glide, seam exposed vs hidden"
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)' }}
    >
      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="40" textAnchor="middle" fontSize="14" fill="currentColor">the infinite-staircase synth · two forks for Stage 2</text>
      </g>
      {/* the staircase */}
      <g stroke="currentColor" strokeWidth="2" fill="none">
        <path d="M60,420 L140,420 L140,380 L220,380 L220,340 L300,340 L300,300 L380,300 L380,260 L460,260 L460,220 L540,220 L540,180 L620,180 L620,140 L700,140" />
      </g>
      {/* step labels */}
      <g style={{ color: 'var(--phosphor-dim)' }} fontSize="10" fill="currentColor">
        <text x="100" y="440">C</text><text x="180" y="400">D</text><text x="260" y="360">E</text>
        <text x="340" y="320">F♯</text><text x="420" y="280">G♯</text><text x="500" y="240">A♯</text>
        <text x="580" y="200">C</text><text x="660" y="160">D</text>
      </g>
      {/* the wrap seam — exposed in STEP-AND-SHOW */}
      <g style={{ color: 'var(--warn)' }}>
        <line x1="700" y1="100" x2="700" y2="450" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x="710" y="80" fontSize="11" fill="currentColor">the seam</text>
        <text x="710" y="95" fontSize="10" fill="currentColor">(briefly exposed)</text>
      </g>
      {/* alternative glide path, faded */}
      <g style={{ color: 'var(--ansi-bright-cyan)' }}>
        <path d="M60,420 Q380,260 700,140" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
        <text x="380" y="200" fontSize="11" fill="currentColor" opacity="0.8" textAnchor="middle">GLIDE-AND-HIDE alternative</text>
      </g>
      <g style={{ color: 'var(--phosphor-dim)' }}>
        <text x="400" y="478" textAnchor="middle" fontSize="10" fill="currentColor">how it climbs × how it wraps · two knobs, four corners</text>
      </g>
    </svg>
  );
}
