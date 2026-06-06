import React from 'react';

// GWL · what does the wavetable Position knob do? Three candidate behaviours
// (centroid-freq / centroid-width / octave-comb) drawn as partial spectra at
// three Position points. Transcribed from trickster.html (gwl-steward-018);
// depicts the same A/B/C fork the current gwl cycle is asking.
export default function GwlPosition() {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="What does the wavetable Position knob do: centroid frequency, centroid width, or octave comb"
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)' }}
    >
      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="40" textAnchor="middle" fontSize="14" fill="currentColor">Generative Wavetable Libraries · what does Position do?</text>
      </g>
      {/* Position axis */}
      <g style={{ color: 'var(--phosphor-dim)' }}>
        <line x1="60" y1="450" x2="740" y2="450" stroke="currentColor" strokeWidth="1.5" />
      </g>
      <text x="60" y="475" fontSize="11" fill="var(--phosphor-white)">Position 0</text>
      <text x="740" y="475" textAnchor="end" fontSize="11" fill="var(--phosphor-white)">Position 1</text>

      {/* A · CENTROID-FREQ (lean) */}
      <g style={{ color: 'var(--warn)' }}>
        <text x="60" y="100" fontSize="11" fill="currentColor">A · CENTROID-FREQ (lean) — bright zone slides up</text>
        <g fill="currentColor" opacity="0.75">
          <rect x="80" y="130" width="6" height="40" /><rect x="92" y="130" width="6" height="30" /><rect x="104" y="130" width="6" height="20" />
          <rect x="116" y="130" width="6" height="14" /><rect x="128" y="130" width="6" height="8" />
          <rect x="260" y="130" width="6" height="20" /><rect x="272" y="130" width="6" height="30" /><rect x="284" y="130" width="6" height="40" />
          <rect x="296" y="130" width="6" height="30" /><rect x="308" y="130" width="6" height="20" />
          <rect x="440" y="130" width="6" height="10" /><rect x="452" y="130" width="6" height="14" /><rect x="464" y="130" width="6" height="20" />
          <rect x="476" y="130" width="6" height="30" /><rect x="488" y="130" width="6" height="40" />
        </g>
      </g>

      {/* B · CENTROID-WIDTH */}
      <g style={{ color: 'var(--ansi-bright-cyan)' }}>
        <text x="60" y="220" fontSize="11" fill="currentColor">B · CENTROID-WIDTH — cloud widens/narrows</text>
        <g fill="currentColor" opacity="0.55">
          <rect x="80" y="250" width="6" height="14" /><rect x="92" y="250" width="6" height="20" /><rect x="104" y="250" width="6" height="25" /><rect x="116" y="250" width="6" height="20" /><rect x="128" y="250" width="6" height="14" />
          <rect x="260" y="250" width="6" height="6" /><rect x="272" y="250" width="6" height="18" /><rect x="284" y="250" width="6" height="40" /><rect x="296" y="250" width="6" height="18" /><rect x="308" y="250" width="6" height="6" />
          <rect x="440" y="250" width="6" height="40" /><rect x="452" y="250" width="6" height="40" /><rect x="464" y="250" width="6" height="40" /><rect x="476" y="250" width="6" height="40" /><rect x="488" y="250" width="6" height="40" />
        </g>
      </g>

      {/* C · OCTAVE-COMB */}
      <g>
        <text x="60" y="340" fontSize="11" fill="currentColor">C · OCTAVE-COMB — comb rakes the octave stack</text>
        <g fill="currentColor" opacity="0.7">
          <rect x="80" y="370" width="6" height="40" /><rect x="116" y="370" width="6" height="40" /><rect x="152" y="370" width="6" height="40" />
          <rect x="260" y="370" width="6" height="20" /><rect x="296" y="370" width="6" height="40" /><rect x="332" y="370" width="6" height="20" />
          <rect x="440" y="370" width="6" height="40" /><rect x="476" y="370" width="6" height="20" /><rect x="512" y="370" width="6" height="40" />
        </g>
      </g>
    </svg>
  );
}
