import React from 'react';
import { obsidianUri } from '../lib/entry-ref.js';

// EntryRefChips — the two affordances Loudon asked to ride alongside every
// entry/agent name in the BBS:
//
//   [OBS]  open the entry in Obsidian  (an <a href="obsidian://...">, so it
//          leaves the terminal for the vault; it is an anchor, NOT a <span>,
//          on purpose -- STATE's e2e clicks `span.last()` to navigate in-deck,
//          and the anchor must be skipped by that selector)
//   [BUN]  open the entry's bundle     (a navigating <span> -> onOpen(path);
//          shown ONLY when the entry actually has a bundle)
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

export default function EntryRefChips({ resolved, onOpen, vault = 'The Palace', size }) {
  if (!resolved || !resolved.path) return null;
  const { path, hasBundle } = resolved;
  const href = obsidianUri(vault, path);
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
      {href ? (
        <a
          data-testid="entry-ref-obs"
          href={href}
          title={`open ${resolved.name || 'entry'} in Obsidian`}
          onClick={(e) => { e.stopPropagation(); }}
          style={{
            ...chipBase,
            fontSize,
            color: 'var(--link)',
            textShadow: 'var(--glow)',
          }}
        >obs</a>
      ) : null}
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
