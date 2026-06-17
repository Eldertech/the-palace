// Surface (a) wiring: the Trickster card's @steward header carries the
// [OBS]/[BUN] chips when the steward handle resolves to a palace entry, and
// renders no chips for an unresolved coordinator handle. Driven through the
// real PalaceRefContext (no network) via renderToStaticMarkup.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TricksterCard from '../../src/components/trickster/TricksterCard.jsx';
import { PalaceRefContext } from '../../src/lib/palace-ref.jsx';
import { buildRefIndex } from '../../src/lib/entry-ref.js';

const refIndex = buildRefIndex([
  { path: 'Projects/Retrospective Delay.md', has_bundle: true },
  { path: 'Kuramoto Coupling.md', has_bundle: false },
]);

function renderCard(item) {
  return renderToStaticMarkup(
    React.createElement(
      PalaceRefContext.Provider,
      { value: { refIndex, openEntryInState: () => {}, vault: 'The Palace' } },
      React.createElement(TricksterCard, { item }),
    ),
  );
}

const baseItem = { request_id: 'rd-012', headline: 'q?', ground: 'g', options: [] };

describe('TricksterCard project-name header chips', () => {
  it('shows [OBS] + [BUN] when the steward inhabits an entry with a bundle', () => {
    const html = renderCard({ ...baseItem, from: 'Retrospective Delay' });
    // The project name reads plainly now (a cyan STATE link, no '@' handle).
    expect(html).toContain('Retrospective Delay');
    expect(html).not.toContain('@Retrospective Delay');
    expect(html).toContain('data-testid="entry-ref-obs"');
    expect(html).toContain('data-testid="entry-ref-bun"');
    expect(html).toContain('file=Projects%2FRetrospective%20Delay');
  });

  it('shows [OBS] only when the entry has no bundle', () => {
    const html = renderCard({ ...baseItem, from: 'Kuramoto Coupling' });
    expect(html).toContain('data-testid="entry-ref-obs"');
    expect(html).not.toContain('data-testid="entry-ref-bun"');
  });

  it('renders no chips for an unresolved coordinator handle', () => {
    const html = renderCard({ ...baseItem, from: 'KURAMOTO-1' });
    expect(html).toContain('KURAMOTO-1');
    expect(html).not.toContain('data-testid="entry-ref-chips"');
  });
});
