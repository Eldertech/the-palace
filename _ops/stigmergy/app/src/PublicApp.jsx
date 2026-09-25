import React, { useCallback, useEffect, useRef, useState } from 'react';
import Shell from './components/Shell.jsx';
import StateDeck from './components/state/StateDeck.jsx';
import { PalaceRefProvider } from './lib/palace-ref.jsx';
import { dataUrl } from './lib/public-mode.js';

// The public read view — the palace's reader's door (Loudon Live.md: two
// doors, this view or git). STIGMERGY's STATE deck and nothing else: PULSE,
// TOPOLOGY, TREE and the entry reader with its face switch, read from a
// static snapshot. No other decks, no companion, no board, no writes; the
// whole house stays one link away in git.

const REPO = 'https://github.com/Eldertech/the-palace';

export default function PublicApp() {
  // Cross-links (typed-link chips, body wikilinks) open entries through the
  // same jump StateDeck already honours in STIGMERGY.
  const [jumpTarget, setJumpTarget] = useState(null);
  const jumpNonce = useRef(0);
  const openEntryInState = useCallback((path) => {
    if (!path) return;
    jumpNonce.current += 1;
    setJumpTarget({ path, nonce: jumpNonce.current });
  }, []);

  // The snapshot's day, for the footer.
  const [snapshot, setSnapshot] = useState(null);
  useEffect(() => {
    fetch(dataUrl('meta.json')).then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (m && typeof m.day === 'string') setSnapshot(m.day);
    }).catch(() => {});
  }, []);

  return (
    <Shell commands={[]} onCommand={() => {}} liveState={snapshot ? `snapshot:${snapshot}` : 'snapshot'}>
      <PalaceRefProvider vault="The Palace" openEntryInState={openEntryInState}>
        <div
          data-testid="public-masthead"
          style={{
            position: 'relative', zIndex: 2,
            display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
            borderBottom: '1px solid var(--phosphor-dim)', paddingBottom: 8, marginBottom: 4,
          }}
        >
          <a
            href={`${import.meta.env.BASE_URL}`}
            style={{
              fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '.06em',
              color: 'var(--phosphor-white)', textShadow: 'var(--glow-strong)', textDecoration: 'none',
            }}
          >THE PALACE</a>
          <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, letterSpacing: '.06em' }}>
            LOUDON STEARNS · A READ VIEW
          </span>
          <span style={{ flex: 1 }} />
          <a
            data-testid="public-git-door"
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            title="every entry, its memory and its history — the whole house, in git"
            style={{
              color: 'var(--link)', textShadow: 'var(--glow)', fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '.04em',
              textDecoration: 'none', borderBottom: '1px dashed currentColor',
            }}
          >the whole house, in git ↗</a>
        </div>
        <StateDeck jumpTarget={jumpTarget} onEntryPathChange={() => {}} />
      </PalaceRefProvider>
    </Shell>
  );
}
