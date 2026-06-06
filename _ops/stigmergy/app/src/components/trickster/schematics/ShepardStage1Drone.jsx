import React from 'react';

// Shepard · Stage 1 drone — does it read as one note? A stack of partials at
// octave intervals under a Gaussian amplitude window: the bare octave-fusion
// illusion. Transcribed from trickster.html (shepard-steward-012); the cycle-
// specific "no audio yet" footnote is intentionally dropped so the diagram is
// generic to the Stage-1 fusion question (it also fits the current shepard
// cycle, where the drone has shipped and the ear-check is the ask).
export default function ShepardStage1Drone() {
  return (
    <svg
      viewBox="0 0 800 380"
      role="img"
      aria-label="Stage 1 drone: partials stacked across octaves under a Gaussian amplitude window — does it read as one note?"
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)' }}
    >
      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="50" textAnchor="middle" fontSize="14" fill="currentColor">the Stage 1 drone — does it read as one note?</text>
      </g>
      <text x="60" y="100" fontSize="11" fill="currentColor">partials stacked across octaves · the bare illusion</text>
      {/* partials */}
      <g style={{ color: 'var(--phosphor-white)' }} stroke="currentColor" strokeWidth="2" fill="none">
        <line x1="100" y1="200" x2="100" y2="160" opacity="0.4" />
        <line x1="180" y1="200" x2="180" y2="100" opacity="0.75" />
        <line x1="260" y1="200" x2="260" y2="50" opacity="1" />
        <line x1="340" y1="200" x2="340" y2="40" opacity="1" />
        <line x1="420" y1="200" x2="420" y2="55" opacity="1" />
        <line x1="500" y1="200" x2="500" y2="105" opacity="0.75" />
        <line x1="580" y1="200" x2="580" y2="165" opacity="0.4" />
      </g>
      {/* axis */}
      <g style={{ color: 'var(--phosphor-dim)' }}>
        <line x1="60" y1="200" x2="700" y2="200" stroke="currentColor" />
        <text x="60" y="218" fontSize="10" fill="currentColor">f / 8</text>
        <text x="700" y="218" textAnchor="end" fontSize="10" fill="currentColor">f · 8</text>
      </g>
      {/* Gaussian envelope */}
      <g style={{ color: 'var(--warn)' }}>
        <path d="M100,200 Q260,40 420,40 Q500,40 580,165 L580,200 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
        <text x="340" y="20" textAnchor="middle" fontSize="11" fill="currentColor">Gaussian-windowed amplitude</text>
      </g>
    </svg>
  );
}
