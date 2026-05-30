import React from 'react';

// Render the entry's stage as a 7-position lifecycle indicator with the
// current stage filled in. ASCII glyphs only (no emoji per the locked
// aesthetic). Order matches SCHEMA §2:
//
//   seed → sprout → growing → mature → fruiting → dormant → composting
//
// `foundational` is rendered as a single inert chip with no lifecycle row,
// since meta entries do not follow the seed→fruiting arc (SCHEMA §2).
//
// The filled position uses `*` ; unfilled positions use `.` ; `>` after
// each non-last position points along the arrow direction.

const LIFECYCLE = ['seed', 'sprout', 'growing', 'mature', 'fruiting', 'dormant', 'composting'];

export default function StageGlyph({ stage }) {
  const s = typeof stage === 'string' ? stage.toLowerCase() : null;

  if (s === 'foundational') {
    return (
      <span
        data-testid="stage-glyph"
        data-stage="foundational"
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--phosphor-white)', textShadow: 'var(--glow)',
          border: '1px solid var(--phosphor)', padding: '0 6px',
          textTransform: 'uppercase', letterSpacing: '.06em',
        }}
      >
        foundational
      </span>
    );
  }

  const idx = LIFECYCLE.indexOf(s);
  const showLabel = s ?? '(no stage)';
  return (
    <span
      data-testid="stage-glyph"
      data-stage={s ?? 'none'}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: 'var(--phosphor-dim)', textShadow: 'none',
        display: 'inline-flex', gap: 6, alignItems: 'center',
      }}
    >
      <span style={{ letterSpacing: '0.05em' }}>
        {LIFECYCLE.map((name, i) => {
          const filled = i === idx;
          const ahead = idx !== -1 && i < idx;
          const color = filled
            ? 'var(--phosphor-white)'
            : ahead
              ? 'var(--phosphor)'
              : 'var(--phosphor-dim)';
          return (
            <span key={name}>
              <span style={{ color, textShadow: filled ? 'var(--glow)' : 'none' }}>
                {filled ? '*' : ahead ? 'o' : '.'}
              </span>
              {i < LIFECYCLE.length - 1 ? (
                <span style={{ color: 'var(--phosphor-dim)' }}>{ahead ? '>' : '-'}</span>
              ) : null}
            </span>
          );
        })}
      </span>
      <span style={{
        color: idx === -1 ? 'var(--phosphor-dim)' : 'var(--phosphor)',
        textShadow: idx === -1 ? 'none' : 'var(--glow)',
        textTransform: 'uppercase', letterSpacing: '.06em',
      }}>{showLabel}</span>
    </span>
  );
}
