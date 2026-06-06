import React from 'react';

// Semantic (voice-haunting) delay · the Stage 2 standalone: mic → RPC daemon
// (v0.1 stub) → delayed voice, with the build-order fork below. Transcribed
// from trickster.html (semantic-delay-steward-007); exact-keyed to the 004/007
// build-order fork — a later semantic-delay cycle asks a different question, so
// it must not ride a steward prefix onto it. The two arrowheads keep palette
// hex fills (a 9px marker doesn't benefit from skin-adaptiveness).
export default function SemanticStage2() {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="Voice-haunting delay Stage 2: mic into RPC daemon stub into delayed voice, plus the build-order fork"
      style={{ width: '100%', height: 'auto', display: 'block', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)' }}
    >
      <defs>
        <marker id="sem-arr" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L9,3 L0,6 Z" fill="#9affb1" /></marker>
        <marker id="sem-arr2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L9,3 L0,6 Z" fill="#ffb558" /></marker>
      </defs>

      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="48" textAnchor="middle" fontSize="14" fill="currentColor">voice-haunting delay · the Stage 2 standalone</text>
      </g>

      {/* mic in */}
      <g style={{ color: 'var(--ansi-bright-cyan)' }} transform="translate(70,130)">
        <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="40" y1="20" x2="40" y2="60" stroke="currentColor" strokeWidth="2" />
        <text x="40" y="100" textAnchor="middle" fontSize="11" fill="currentColor">MIC</text>
      </g>

      {/* arrow → daemon */}
      <path d="M180,170 L280,170" stroke="currentColor" strokeWidth="2" markerEnd="url(#sem-arr)" />
      <g transform="translate(290,120)">
        <rect width="200" height="100" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="100" y="40" textAnchor="middle" fontSize="12" fill="currentColor">DAEMON · RPC v0.1</text>
        <text x="100" y="62" textAnchor="middle" fontSize="10" fill="currentColor">stub (passes through)</text>
        <text x="100" y="80" textAnchor="middle" fontSize="10" fill="var(--phosphor-dim)">19/19 contract tests green</text>
      </g>

      {/* arrow → speaker out */}
      <g style={{ color: 'var(--warn)' }}>
        <path d="M500,170 L600,170" stroke="currentColor" strokeWidth="2" markerEnd="url(#sem-arr2)" />
        <g transform="translate(620,135)">
          <path d="M0,15 L25,15 L50,0 L50,60 L25,45 L0,45 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M60,15 Q75,30 60,45" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="40" y="90" textAnchor="middle" fontSize="11" fill="currentColor">DELAYED VOICE</text>
        </g>
      </g>

      {/* the fork */}
      <g style={{ color: 'var(--phosphor-white)' }}>
        <text x="400" y="320" textAnchor="middle" fontSize="13" fill="currentColor">the fork: which branch wakes first?</text>
      </g>
      <g fontSize="11">
        <g style={{ color: 'var(--warn)' }}><circle cx="160" cy="380" r="6" fill="currentColor" /><text x="180" y="384" fill="currentColor">BUILD-INSTRUMENT-FIRST · playable soonest</text></g>
        <g><circle cx="160" cy="410" r="5" fill="var(--phosphor-dim)" /><text x="180" y="414" fill="currentColor">MODEL-NOW · only audible voice-swap path</text></g>
        <g><circle cx="160" cy="440" r="5" fill="var(--phosphor-dim)" /><text x="180" y="444" fill="currentColor">PROMPT-PIPELINE · silent until something plays</text></g>
      </g>
    </svg>
  );
}
