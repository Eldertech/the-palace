import React from 'react';

// ActionPanel — the "go try this yourself" affordance: a what-to-do hint plus
// a download link for the artifact (the dark-cutoff .adv). Amber, because it
// asks the human to leave the screen and do something physical (drag it into
// Ableton, play a note) before deciding. The href is encoded so spaced
// filenames download cleanly; `download` forces a save rather than navigation.
export default function ActionPanel({ hint, src, buttonLabel }) {
  if (!src) return null;
  return (
    <div data-testid="action-panel" style={{
      border: '1px solid var(--warn)', padding: '8px 10px', marginBottom: 8,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {hint ? (
        <div style={{
          color: 'var(--phosphor)', textShadow: 'var(--glow)',
          fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.45,
        }}>{hint}</div>
      ) : null}
      <a
        data-testid="action-download"
        href={encodeURI(src)}
        download
        style={{
          alignSelf: 'flex-start',
          color: 'var(--warn)', textShadow: 'var(--glow)',
          border: '1px solid var(--warn)', padding: '3px 10px',
          fontFamily: 'var(--font-mono)', fontSize: 13,
          textDecoration: 'none', letterSpacing: '.04em',
        }}
      >{buttonLabel}</a>
    </div>
  );
}
