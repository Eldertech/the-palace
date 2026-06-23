// Integration/wiring tests: the real surfaces (MessageList from-header, the
// STATE EntryList) render an EntryAvatar from a resolved bundle icon, and fall
// back gracefully when the sender/entry has no icon. Proves the prop-path from
// the entry index → EntryAvatar without a browser.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PalaceRefContext } from '../../src/lib/palace-ref.jsx';
import { buildRefIndex } from '../../src/lib/entry-ref.js';
import MessageList from '../../src/components/MessageList.jsx';
import EntryList from '../../src/components/state/EntryList.jsx';

const ICON = 'Projects/Quantum Synthesizer/Quantum Synthesizer — icon.png';
const ENCODED = 'src="/api/file?path=Projects%2FQuantum%20Synthesizer%2FQuantum%20Synthesizer%20%E2%80%94%20icon.png"';

const refIndex = buildRefIndex([
  { path: 'Projects/Quantum Synthesizer.md', has_bundle: true, icon: ICON },
]);

const withRef = (node) =>
  renderToStaticMarkup(
    React.createElement(PalaceRefContext.Provider, { value: { refIndex, ensureLoaded() {} } }, node),
  );

describe('MessageList from-header avatar', () => {
  it('shows the sender entry avatar when the from-name resolves to an icon', () => {
    const html = withRef(React.createElement(MessageList, {
      messages: [{ id: 'm1', from: 'Quantum Synthesizer', ts: '2026-06-23T12:00:00Z', type: 'BROADCAST', payload: 'hi' }],
      activeBoard: 'GENERAL',
    }));
    expect(html).toContain('data-testid="from-block"');
    expect(html).toContain('data-has-icon="true"');
    expect(html).toContain(ENCODED);
    expect(html).toContain('@Quantum Synthesizer');
  });

  it('falls back to a monogram for a role handle that is not an entry', () => {
    const html = withRef(React.createElement(MessageList, {
      messages: [{ id: 'm2', from: 'TRICKSTER', ts: '2026-06-23T12:00:00Z', type: 'RESOURCE_GRANT', payload: 'ok' }],
      activeBoard: 'TRICKSTER',
    }));
    expect(html).toContain('data-testid="from-block"');
    expect(html).toContain('data-has-icon="false"');
    expect(html).toContain('@TRICKSTER');
    expect(html).not.toContain('/api/file');
  });
});

describe('STATE EntryList row avatar', () => {
  const entries = [
    { path: 'Projects/Quantum Synthesizer.md', title: 'Quantum Synthesizer', type: 'project', stage: 'fruiting', icon: ICON, activation_count: 3 },
    { path: 'Projects/Bare Thing.md', title: 'Bare Thing', type: 'concept', stage: 'seed', activation_count: 0 },
  ];

  it('renders the avatar only on entries that carry bundle art', () => {
    const html = renderToStaticMarkup(React.createElement(EntryList, { entries }));
    // both entries listed
    expect(html).toContain('Quantum Synthesizer');
    expect(html).toContain('Bare Thing');
    // exactly one avatar image — the enriched one
    expect(html).toContain(ENCODED);
    expect((html.match(/data-testid="entry-avatar"/g) || []).length).toBe(1);
  });
});
