import React from 'react';
import { DECKS, DECK_HOTKEYS as HOTKEYS, DECK_SUBTITLES as SUBTITLES } from '../lib/decks.js';

// Top-level navigation: STATE / QUEUE / LOG = present / future / past.
// The retro/prospective discipline as the literal shape of the screen
// (STIGMERGY v1.0 thesis). Boards are demoted from top-level tabs to
// lanes inside QUEUE; this strip carries the three decks instead.
//
// Hotkeys: [S]TATE  [Q]UEUE  [L]OG. The `[N] LABEL` inversion idiom
// mirrors ChannelTabs.

export default function DeckTabs({ active = 'STATE', onSelect }) {
  return (
    <div
      data-testid="deck-tabs"
      style={{
        display: 'flex', gap: 10, flexWrap: 'wrap',
        padding: '6px 0 8px',
        borderBottom: '3px double var(--phosphor-dim)',
        marginBottom: 10,
        fontFamily: 'var(--font-mono)', fontSize: 14,
      }}
    >
      {DECKS.map((d) => {
        const isActive = d === active;
        const hot = HOTKEYS[d];
        const sub = SUBTITLES[d];
        return (
          <span
            key={d}
            data-testid={`deck-${d.toLowerCase()}`}
            data-active={isActive ? 'true' : 'false'}
            onClick={() => onSelect?.(d)}
            style={{
              cursor: 'pointer',
              background: isActive ? 'var(--phosphor)' : 'transparent',
              color: isActive ? 'var(--bg)' : 'var(--phosphor-dim)',
              padding: '4px 12px',
              border: '1px solid var(--phosphor-dim)',
              borderRadius: 0,
              textTransform: 'uppercase', letterSpacing: '.06em',
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              minWidth: 140,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1.1 }}>
              <span style={{
                color: isActive ? 'var(--bg)' : 'var(--phosphor)',
                textShadow: isActive ? 'none' : 'var(--glow)',
              }}>[</span>
              <b style={{
                color: isActive ? 'var(--bg)' : 'var(--phosphor-white)',
                textShadow: isActive ? 'none' : 'var(--glow)',
              }}>{hot}</b>
              <span style={{
                color: isActive ? 'var(--bg)' : 'var(--phosphor)',
                textShadow: isActive ? 'none' : 'var(--glow)',
              }}>]</span>&nbsp;{d}
            </span>
            <span style={{
              fontSize: 10, letterSpacing: '.10em', opacity: 0.85,
              color: isActive ? 'var(--bg)' : 'var(--phosphor-dim)',
              textShadow: 'none',
            }}>{sub}</span>
          </span>
        );
      })}
    </div>
  );
}
