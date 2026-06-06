import React from 'react';

// Retrospective Delay · the five-asset imagery brief — Asset 1 built (the
// Witness Diagram), Assets 2-4 sandbox-buildable, Asset 5 waits for a Mac +
// credits. Transcribed from trickster.html (retrospective-delay-steward-009).
// Reuse/preserved; depicts a request not in the current pending set.
export default function RetroFiveAssetBrief() {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="Five-asset imagery brief: one built, three sandbox-buildable, one waiting on a Mac"
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)' }}
    >
      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="50" textAnchor="middle" fontSize="14" fill="currentColor">five-asset imagery brief</text>
      </g>
      <g fontSize="12">
        {/* Asset 1 — built */}
        <g style={{ color: 'var(--warn)' }}>
          <rect x="60" y="100" width="160" height="100" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="140" y="135" textAnchor="middle" fill="currentColor">Asset 1</text>
          <text x="140" y="155" textAnchor="middle" fill="currentColor" fontSize="10">WITNESS DIAGRAM</text>
          <text x="140" y="175" textAnchor="middle" fill="var(--phosphor)" fontSize="10">✓ built — judge it</text>
        </g>
        {/* Assets 2-4 — sandbox-buildable */}
        <g style={{ color: 'var(--phosphor-white)' }}>
          <g>
            <rect x="240" y="100" width="160" height="100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <text x="320" y="135" textAnchor="middle" fill="currentColor">Asset 2</text>
            <text x="320" y="155" textAnchor="middle" fill="currentColor" fontSize="10">phrase-vs-tap</text>
            <text x="320" y="175" textAnchor="middle" fill="var(--phosphor-dim)" fontSize="10">matplotlib · sandbox</text>
          </g>
          <g>
            <rect x="420" y="100" width="160" height="100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <text x="500" y="135" textAnchor="middle" fill="currentColor">Asset 3</text>
            <text x="500" y="155" textAnchor="middle" fill="currentColor" fontSize="10">one-knob device</text>
            <text x="500" y="175" textAnchor="middle" fill="var(--phosphor-dim)" fontSize="10">matplotlib fallback</text>
          </g>
          <g>
            <rect x="600" y="100" width="160" height="100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <text x="680" y="135" textAnchor="middle" fill="currentColor">Asset 4</text>
            <text x="680" y="155" textAnchor="middle" fill="currentColor" fontSize="10">buffer table</text>
            <text x="680" y="175" textAnchor="middle" fill="var(--phosphor-dim)" fontSize="10">matplotlib · sandbox</text>
          </g>
        </g>
        {/* Asset 5 — blocked */}
        <g style={{ color: 'var(--error)' }}>
          <rect x="240" y="240" width="160" height="100" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 8" />
          <text x="320" y="275" textAnchor="middle" fill="currentColor">Asset 5</text>
          <text x="320" y="295" textAnchor="middle" fill="currentColor" fontSize="10">MIDJOURNEY MOOD</text>
          <text x="320" y="315" textAnchor="middle" fill="var(--phosphor-dim)" fontSize="10">waits for Mac · credits</text>
        </g>
      </g>
      <g style={{ color: 'var(--phosphor)' }}>
        <text x="400" y="420" textAnchor="middle" fontSize="12" fill="currentColor">four of five buildable here · zero credit cost</text>
      </g>
      <g style={{ color: 'var(--phosphor-dim)' }}>
        <text x="400" y="450" textAnchor="middle" fontSize="10" fill="currentColor">Asset 1 is below — judge it first or greenlight all four</text>
      </g>
    </svg>
  );
}
