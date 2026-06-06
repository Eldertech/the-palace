import React from 'react';

// Generative Preset Development · the write-path proof — the writer pulls a
// factory preset's filter cutoff down (714 Hz → 200 Hz) and the gate is 30
// seconds of you in Ableton confirming it loaded and sounds darker. Transcribed
// from trickster.html (preset-steward-007). Reuse/preserved; the arrowhead keeps
// a palette hex (a 9px marker doesn't benefit from skin-adaptiveness).
export default function PresetCutoff() {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="Preset write-path proof: factory Aqueous Pad cutoff 714 Hz pulled to 200 Hz, then a 30-second Ableton ear-check"
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)' }}
    >
      <defs>
        <marker id="preset-arr" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L9,3 L0,6 Z" fill="#ffb558" /></marker>
      </defs>
      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="40" textAnchor="middle" fontSize="14" fill="currentColor">Generative Preset Development · the write-path proof</text>
      </g>
      <g fontSize="11">
        {/* factory preset */}
        <g style={{ color: 'var(--phosphor-dim)' }} transform="translate(100,90)">
          <rect width="220" height="80" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="110" y="30" textAnchor="middle" fill="var(--phosphor-white)">FACTORY · Aqueous Pad</text>
          <text x="110" y="50" textAnchor="middle" fill="currentColor">filter cutoff: 714 Hz</text>
          <text x="110" y="68" textAnchor="middle" fill="currentColor">.adv binary · gzip + XML</text>
        </g>
        {/* writer arrow */}
        <g style={{ color: 'var(--warn)' }}>
          <path d="M340,130 L460,130" stroke="currentColor" strokeWidth="2" markerEnd="url(#preset-arr)" />
          <text x="400" y="120" textAnchor="middle" fontSize="11" fill="currentColor">writer · pulls cutoff down</text>
        </g>
        {/* mutated preset */}
        <g style={{ color: 'var(--warn)' }} transform="translate(480,90)">
          <rect width="220" height="80" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="110" y="30" textAnchor="middle" fill="currentColor">MUTATED · dark cutoff</text>
          <text x="110" y="50" textAnchor="middle" fill="currentColor">filter cutoff: 200 Hz</text>
          <text x="110" y="68" textAnchor="middle" fill="var(--phosphor-dim)">.adv binary · gzip + XML</text>
        </g>
      </g>
      {/* the gate */}
      <g transform="translate(80,240)">
        <text x="0" y="0" fontSize="12" fill="var(--phosphor-white)">the gate · 30 seconds of you, in Ableton</text>
        <g style={{ color: 'var(--phosphor-dim)' }}>
          <text x="0" y="22" fontSize="11" fill="currentColor">1. drop the .adv into your Ableton User Library</text>
          <text x="0" y="40" fontSize="11" fill="currentColor">2. load it on a Wavetable instance</text>
          <text x="0" y="58" fontSize="11" fill="currentColor">3. play a held note · listen for darker than factory</text>
        </g>
      </g>
      <g style={{ color: 'var(--phosphor-dim)' }}>
        <text x="400" y="450" textAnchor="middle" fontSize="10" fill="currentColor">if it loaded and sounds darker → the writer is proven · the perceptual labeling cycle starts</text>
      </g>
    </svg>
  );
}
