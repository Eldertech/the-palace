// Render tests for the master QuickBar (deck-level FILE ALL). The per-card
// LeanPanel was retired in the v2.0 redesign — the steward's recommendation is
// now marked on its own option button (see trickster-card.test.js) — so only
// the QuickBar remains here. renderToStaticMarkup, node env; interaction
// (click/keyboard) is an e2e concern.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QuickBar from '../../src/components/trickster/QuickBar.jsx';
import { t } from '../../src/lib/lexicon.js';

describe('QuickBar', () => {
  const LEANS = [
    { id: 'CONFIRM-NEW-VECTOR', label: 'CONFIRM-NEW-VECTOR — yes' },
    { id: 'ARCHITECTURE-VERIFIED', label: 'ARCHITECTURE-VERIFIED — looks right' },
  ];

  it('shows FILE ALL with the lean count and an id summary', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickBar, { leans: LEANS, remainder: 0 })
    );
    expect(html).toContain('data-testid="trickster-quickbar"');
    expect(html.toLowerCase()).toContain('file all');
    expect(html).toContain('2'); // N
    expect(html).toContain('1) CONFIRM-NEW-VECTOR');
    expect(html).toContain('2) ARCHITECTURE-VERIFIED');
  });

  it('surfaces the leanless remainder (no silent caps)', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickBar, { leans: LEANS, remainder: 5 })
    );
    expect(html).toContain('data-testid="quickbar-remainder"');
    expect(html).toContain('5');
    expect(html).toContain(t('trickster.quickbar.remainder.many'));
  });

  it('uses the singular remainder label for exactly one leanless card', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickBar, { leans: LEANS, remainder: 1 })
    );
    expect(html).toContain(t('trickster.quickbar.remainder.one'));
  });

  it('renders nothing when no card has a lean', () => {
    const html = renderToStaticMarkup(React.createElement(QuickBar, { leans: [], remainder: 3 }));
    expect(html).toBe('');
  });

  it('reflects the busy state on the button', () => {
    const html = renderToStaticMarkup(
      React.createElement(QuickBar, { leans: LEANS, remainder: 0, busy: true })
    );
    expect(html).toContain(t('trickster.quickbar.filing'));
  });
});
