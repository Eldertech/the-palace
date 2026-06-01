// Focused tests for ArtifactSlot: human-readable type label + open-external chip.
//
// Loudon noted that "iframe" is a DOM term, not a reader's term, and that
// HTML artifacts deserve an "open in default browser" affordance so the
// dossier-style media can be read at full size outside the BBS sandbox.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ArtifactSlot from '../../src/components/ArtifactSlot.jsx';

function renderSlot(payload) {
  return renderToStaticMarkup(React.createElement(ArtifactSlot, { payload }));
}

describe('ArtifactSlot — human labels', () => {
  it('renders an html artifact with the WEB label (not IFRAME)', () => {
    const html = renderSlot({ artifacts: [{ path: 'Foo/dossier.html' }] });
    expect(html.toLowerCase()).toContain('web');
    expect(html.toLowerCase()).not.toContain('iframe ·');
    expect(html.toLowerCase()).not.toContain('iframe&nbsp;·');
  });

  it('renders an audio artifact with the AUDIO label', () => {
    const html = renderSlot({ artifacts: [{ path: 'Foo/clip.wav' }] });
    expect(html.toLowerCase()).toContain('audio');
  });

  it('renders an image artifact with the IMAGE label', () => {
    const html = renderSlot({ artifacts: [{ path: 'Foo/still.png' }] });
    expect(html.toLowerCase()).toContain('image');
  });

  it('renders an unknown extension with the ARTIFACT label', () => {
    const html = renderSlot({ artifacts: [{ path: 'Foo/notes.unknown-ext' }] });
    expect(html.toLowerCase()).toContain('artifact');
  });
});

describe('ArtifactSlot — open-external chip', () => {
  it('every artifact carries an open-external chip pointing at /api/open', () => {
    const html = renderSlot({ artifacts: [{ path: 'Foo/dossier.html' }] });
    expect(html).toContain('data-testid="artifact-open-external"');
    expect(html).toContain('/api/open?path=Foo%2Fdossier.html');
    // Default-browser hint for html.
    expect(html).toContain('open in your default browser');
  });

  it('non-html artifacts get a "native <type> app" tooltip', () => {
    const html = renderSlot({ artifacts: [{ path: 'Foo/clip.wav' }] });
    expect(html).toContain('open in native audio app');
  });

  it('the chip is an <a href> so right-click / cmd-click work for copy / power users', () => {
    const html = renderSlot({ artifacts: [{ path: 'Foo/dossier.html' }] });
    expect(html).toMatch(/<a [^>]*href="\/api\/open\?path=[^"]+"/);
  });
});
