import React from 'react';

// GSL · 128-region instrument — twelve Shepard drones, one per pitch class.
// Transcribed from the standalone trickster.html (gsl-steward-028 card).
// Colors come from CSS vars via `color` + currentColor so it follows the
// active skin; geometry is verbatim.
export default function GslKeyboard() {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="128-region instrument: twelve Shepard drones, one per pitch class"
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)' }}
    >
      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="38" textAnchor="middle" fontSize="14" fill="currentColor">128-region instrument · twelve Shepard drones, one per pitch class</text>
      </g>
      <g fontSize="11">
        {/* white keys */}
        <g fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="80" y="120" width="60" height="220" /><text x="110" y="370" textAnchor="middle" fill="currentColor">C</text>
          <rect x="140" y="120" width="60" height="220" /><text x="170" y="370" textAnchor="middle" fill="currentColor">D</text>
          <rect x="200" y="120" width="60" height="220" /><text x="230" y="370" textAnchor="middle" fill="currentColor">E</text>
          <rect x="260" y="120" width="60" height="220" /><text x="290" y="370" textAnchor="middle" fill="currentColor">F</text>
          <rect x="320" y="120" width="60" height="220" /><text x="350" y="370" textAnchor="middle" fill="currentColor">G</text>
          <rect x="380" y="120" width="60" height="220" /><text x="410" y="370" textAnchor="middle" fill="currentColor">A</text>
          <rect x="440" y="120" width="60" height="220" /><text x="470" y="370" textAnchor="middle" fill="currentColor">B</text>
          <rect x="500" y="120" width="60" height="220" /><text x="530" y="370" textAnchor="middle" fill="currentColor">C</text>
          <rect x="560" y="120" width="60" height="220" /><text x="590" y="370" textAnchor="middle" fill="currentColor">D</text>
          <rect x="620" y="120" width="60" height="220" /><text x="650" y="370" textAnchor="middle" fill="currentColor">E</text>
        </g>
        {/* black keys */}
        <g fill="var(--bg, #0a100c)" stroke="currentColor" strokeWidth="1.4">
          <rect x="125" y="120" width="34" height="140" />
          <rect x="185" y="120" width="34" height="140" />
          <rect x="305" y="120" width="34" height="140" />
          <rect x="365" y="120" width="34" height="140" />
          <rect x="425" y="120" width="34" height="140" />
          <rect x="545" y="120" width="34" height="140" />
          <rect x="605" y="120" width="34" height="140" />
        </g>
        {/* the twelve drones */}
        <g style={{ color: 'var(--warn)' }} fill="currentColor" opacity="0.9">
          <circle cx="110" cy="430" r="6" /><circle cx="142" cy="430" r="6" />
          <circle cx="170" cy="430" r="6" /><circle cx="202" cy="430" r="6" />
          <circle cx="230" cy="430" r="6" />
          <circle cx="290" cy="430" r="6" /><circle cx="322" cy="430" r="6" />
          <circle cx="350" cy="430" r="6" /><circle cx="382" cy="430" r="6" />
          <circle cx="410" cy="430" r="6" /><circle cx="442" cy="430" r="6" />
          <circle cx="470" cy="430" r="6" />
        </g>
        <text x="400" y="465" textAnchor="middle" fill="var(--warn)" fontSize="11">12 drones · played below</text>
      </g>
    </svg>
  );
}
