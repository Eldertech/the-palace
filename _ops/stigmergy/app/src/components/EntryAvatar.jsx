import React, { useState } from 'react';

// EntryAvatar — a small round avatar for a palace entry/agent.
//
// Shows the entry's bundle icon (the per-entry hand-drawn avatar art deposited
// at `<bundle>/<Title> — icon.png`) when one exists, framed to sit on the
// phosphor terminal; falls back to a monospace monogram when the entry has no
// icon yet, or when the name doesn't resolve to an entry at all (a role handle
// like TRICKSTER / COORDINATOR). A missing icon is never an error — the
// monogram keeps the surface aligned and named.
//
// `icon` is a palace-relative path (e.g. "Projects/Quantum Synthesizer/Quantum
// Synthesizer — icon.png") served inline by GET /api/file. `name` drives the
// monogram fallback and the alt/title text. Full-color art is desaturated a
// touch and ringed in phosphor so it reads as part of the BBS, not pasted onto
// it. Pure + SSR-safe: the onError fallback only fires in a browser.

export function initials(name) {
  if (typeof name !== 'string' || !name.trim()) return '·';
  const words = name.trim().split(/[\s_\-—·]+/).filter(Boolean);
  if (words.length === 0) return '·';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function EntryAvatar({ name, icon, size = 20 }) {
  const [failed, setFailed] = useState(false);
  const hasIcon = typeof icon === 'string' && icon.trim() !== '' && !failed;

  const frame = {
    width: size,
    height: size,
    flex: `0 0 ${size}px`,
    boxSizing: 'border-box',
    borderRadius: '50%',
    border: '1px solid var(--phosphor-dim)',
    boxShadow: 'var(--glow)',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    verticalAlign: 'middle',
    background: 'var(--bg)',
  };

  if (hasIcon) {
    return (
      <span data-testid="entry-avatar" data-has-icon="true" title={name || ''} style={frame}>
        <img
          src={`/api/file?path=${encodeURIComponent(icon)}`}
          alt={name ? `${name} icon` : 'entry icon'}
          width={size}
          height={size}
          onError={() => setFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            // settle full-color art onto the phosphor terminal
            filter: 'saturate(0.88) brightness(0.95)',
          }}
        />
      </span>
    );
  }

  return (
    <span
      data-testid="entry-avatar"
      data-has-icon="false"
      title={name || ''}
      style={{
        ...frame,
        fontFamily: 'var(--font-mono)',
        fontSize: Math.max(8, Math.round(size * 0.42)),
        lineHeight: 1,
        color: 'var(--phosphor-dim)',
        textShadow: 'none',
        letterSpacing: '.02em',
      }}
    >
      {initials(name)}
    </span>
  );
}
