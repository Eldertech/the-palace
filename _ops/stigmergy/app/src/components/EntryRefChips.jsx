import React from 'react';

// EntryRefChips — the affordance that rides alongside every entry/agent name
// in the BBS:
//
//   [BUN]  open the entry's bundle     (a navigating <span> -> onOpen(path);
//          shown ONLY when the entry actually has a bundle)
//
// There used to be an [OBS] chip (an obsidian:// anchor) beside it. Retired
// 2026-09-23: Loudon no longer uses Obsidian — "STIGMERGY is my primary
// interface" — so the chip was a door to nowhere. The name itself navigates
// in-deck; obsidianUri stays in lib/entry-ref.js for anything else that wants it.
//
// Additive by design: callers keep their existing name span untouched and drop
// this in right after it. When the name does not resolve to a known entry
// (a coordinator handle like COORDINATOR / KURAMOTO-1, or a missing target),
// the component renders nothing -- no chips, no noise.
//
// `resolved` is { path, hasBundle } | null (from resolveRef). `onOpen(path)`
// is how [BUN] reaches the entry's STATE view -- in STATE that is the in-deck
// navigator; from another deck it is the cross-deck jump. `vault` names the
// Obsidian vault (default "The Palace").

const chipBase = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  lineHeight: 1,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  padding: '0 3px',
  border: '1px solid currentColor',
  borderRadius: 0,
  textDecoration: 'none',
  verticalAlign: 'baseline',
  cursor: 'pointer',
  userSelect: 'none',
};

export default function EntryRefChips({ resolved, onOpen, size }) {
  if (!resolved || !resolved.path) return null;
  const { path, hasBundle } = resolved;
  const fontSize = typeof size === 'number' ? size : chipBase.fontSize;

  // The wrapper is a <small>, not a <span>, on purpose: STATE's typed-link
  // e2e clicks `row.locator('span').last()` and expects in-deck navigation.
  // An inert <span> wrapper would become that trailing span and swallow the
  // click. As a <small>, the last <span> in a resolved row stays the
  // navigating name (no bundle) or the [BUN] span (with bundle).
  return (
    <small
      data-testid="entry-ref-chips"
      data-has-bundle={hasBundle ? 'true' : 'false'}
      style={{ display: 'inline-flex', gap: 3, marginLeft: 5, whiteSpace: 'nowrap' }}
    >
      {hasBundle ? (
        <span
          data-testid="entry-ref-bun"
          role="button"
          tabIndex={0}
          title={`open ${resolved.name || 'entry'}'s bundle`}
          onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(path); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (onOpen) onOpen(path); }
          }}
          style={{
            ...chipBase,
            fontSize,
            color: 'var(--phosphor)',
            textShadow: 'var(--glow)',
          }}
        >bun</span>
      ) : null}
    </small>
  );
}
