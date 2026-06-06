import React from 'react';
import { Button } from '../primitives.jsx';
import { t } from '../../lib/lexicon.js';

// QuickBar — the master "file every steward's lean at once" affordance.
//
// Sits at the top of the deck when at least one pending card has a detected
// lean. "▶ FILE ALL N ▶" files exactly those N cards; the summary names each
// lean by its short id. Per the no-silent-caps rule, a remainder line states
// how many leanless cards it is deliberately NOT touching — those are the
// human's call and stay on the board.
export default function QuickBar({ leans, remainder = 0, onFileAll, busy = false }) {
  if (!leans || leans.length === 0) return null;
  const n = leans.length;
  const summary = leans.map((l, i) => `${i + 1}) ${l.id}`).join(' · ');
  const remLabel = remainder === 1
    ? t('trickster.quickbar.remainder.one')
    : t('trickster.quickbar.remainder.many');

  return (
    <div data-testid="trickster-quickbar" style={{
      border: '1px solid var(--warn)', padding: '8px 12px', marginBottom: 12,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button tone="warn" onClick={onFileAll} disabled={busy}>
          {busy ? t('trickster.quickbar.filing') : `▶ ${t('trickster.quickbar.file')} ${n} ▶`}
        </Button>
        {remainder > 0 ? (
          <span data-testid="quickbar-remainder" style={{
            color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12,
          }}>{remainder} {remLabel}</span>
        ) : null}
      </div>
      <div data-testid="quickbar-summary" style={{
        color: 'var(--phosphor-dim)', textShadow: 'none',
        fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.4,
      }}>{t('trickster.quickbar.summary')} {summary}</div>
    </div>
  );
}
