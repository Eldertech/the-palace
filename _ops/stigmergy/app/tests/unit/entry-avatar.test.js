// Render tests for EntryAvatar — the per-entry avatar that shows the bundle
// icon when one exists and a monospace monogram otherwise. Markup contract
// only (the onError image fallback is a browser concern, an e2e detail).

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EntryAvatar, { initials } from '../../src/components/EntryAvatar.jsx';

const render = (props) => renderToStaticMarkup(React.createElement(EntryAvatar, props));

describe('initials', () => {
  it('takes first+last initials of a multi-word name', () => {
    expect(initials('Quantum Synthesizer')).toBe('QS');
    expect(initials('Retrospective Delay')).toBe('RD');
  });
  it('takes the first two letters of a single word', () => {
    expect(initials('Murmuration')).toBe('MU');
  });
  it('splits on em-dash and underscores', () => {
    expect(initials('Slime — Mold')).toBe('SM');
  });
  it('is safe on empty/blank input', () => {
    expect(initials('')).toBe('·');
    expect(initials(null)).toBe('·');
  });
});

describe('EntryAvatar', () => {
  it('renders the bundle icon as an <img> from /api/file when an icon is given', () => {
    const html = render({ name: 'Quantum Synthesizer', icon: 'Projects/Quantum Synthesizer/Quantum Synthesizer — icon.png' });
    expect(html).toContain('data-testid="entry-avatar"');
    expect(html).toContain('data-has-icon="true"');
    expect(html).toContain('<img');
    // path is URL-encoded into the /api/file query (spaces, em-dash, slash)
    expect(html).toContain('src="/api/file?path=Projects%2FQuantum%20Synthesizer%2FQuantum%20Synthesizer%20%E2%80%94%20icon.png"');
    expect(html).toContain('alt="Quantum Synthesizer icon"');
  });

  it('falls back to a monogram when no icon is present', () => {
    const html = render({ name: 'Talking Keyboard', icon: null });
    expect(html).toContain('data-has-icon="false"');
    expect(html).not.toContain('<img');
    expect(html).toContain('TK'); // first+last initials
  });

  it('falls back to a monogram for a blank icon string (unresolved / no art yet)', () => {
    const html = render({ name: 'COORDINATOR', icon: '' });
    expect(html).toContain('data-has-icon="false"');
    expect(html).toContain('CO');
  });
});
