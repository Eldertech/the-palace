// Render tests for the Phase-3 asset components (AuditionStrip, Embed,
// ActionPanel) plus the card integration that surfaces them. renderToStaticMarkup,
// node env — audio playback / play-all sequencing is e2e.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AuditionStrip from '../../src/components/trickster/AuditionStrip.jsx';
import Embed from '../../src/components/trickster/Embed.jsx';
import ActionPanel from '../../src/components/trickster/ActionPanel.jsx';
import TricksterCard from '../../src/components/trickster/TricksterCard.jsx';

const TRACKS = [
  { tag: '1', label: 'flat baseline', src: '/trickster-assets/audio/inharmonic/pass1-flat-harmonic-baseline.wav' },
  { tag: '2', label: 'piano stretch', src: '/trickster-assets/audio/inharmonic/pass2-piano-stretch.wav' },
];

describe('AuditionStrip', () => {
  it('renders one audio element per track and a PLAY ALL button', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditionStrip, { title: 'the audition', blurb: 'listen', tracks: TRACKS })
    );
    expect(html).toContain('data-testid="audition-strip"');
    expect((html.match(/<audio/g) || []).length).toBe(2);
    expect(html).toContain(TRACKS[0].src);
    expect(html.toLowerCase()).toContain('play all');
    expect(html).toContain('2'); // the count in "play all 2 in sequence"
  });

  it('uses the phosphor-styled player, not the browser default chrome', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditionStrip, { title: 'x', tracks: TRACKS })
    );
    // The styled player's control strip is present per track...
    expect(html).toContain('data-testid="audition-audio-0-toggle"');
    expect(html).toContain('data-testid="audition-audio-1-toggle"');
    // ...the native <audio> is the hidden engine, never shown with `controls`...
    expect(html).toMatch(/<audio[^>]*style="display:none/);
    expect(html).not.toMatch(/<audio[^>]*\scontrols/);
    // ...and the dead open-native chip is suppressed for static assets.
    expect(html).not.toContain('audition-audio-0-open-native');
  });

  it('renders nothing without tracks', () => {
    expect(renderToStaticMarkup(React.createElement(AuditionStrip, { tracks: [] }))).toBe('');
    expect(renderToStaticMarkup(React.createElement(AuditionStrip, {}))).toBe('');
  });
});

describe('Embed', () => {
  it('renders a sandboxed, lazy iframe with an open-standalone link', () => {
    const html = renderToStaticMarkup(
      React.createElement(Embed, { src: '/trickster-assets/witness/witness-diagram.html', title: 'the Witness Diagram' })
    );
    expect(html).toContain('data-testid="embed"');
    expect(html).toMatch(/<iframe[^>]*src="\/trickster-assets\/witness\/witness-diagram\.html"/);
    expect(html).toContain('sandbox="allow-scripts allow-same-origin"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('the Witness Diagram');
  });

  it('renders nothing without a src', () => {
    expect(renderToStaticMarkup(React.createElement(Embed, { src: null }))).toBe('');
  });
});

describe('ActionPanel', () => {
  it('renders a download link with an encoded href and the download attr', () => {
    const html = renderToStaticMarkup(
      React.createElement(ActionPanel, {
        hint: 'drop it in Ableton',
        src: '/trickster-assets/preset/Aqueous Pad - dark cutoff.adv',
        buttonLabel: '↓ download .adv',
      })
    );
    expect(html).toContain('data-testid="action-download"');
    expect(html).toContain('/trickster-assets/preset/Aqueous%20Pad%20-%20dark%20cutoff.adv');
    expect(html).toMatch(/<a [^>]*download/);
    expect(html).toContain('drop it in Ableton');
  });

  it('renders nothing without a src', () => {
    expect(renderToStaticMarkup(React.createElement(ActionPanel, { src: null }))).toBe('');
  });
});

describe('TricksterCard — asset integration', () => {
  const card = (request_id) => renderToStaticMarkup(React.createElement(TricksterCard, {
    item: {
      request_id, from: 'X', ts: '2026-06-03T09:00:00Z',
      headline: 'a question?', ground: 'some ground',
      options: [{ id: 'A', label: 'A — go' }],
      _message_id: 'm', _session_id: 's',
    },
  }));

  it('surfaces the gsl drone audition inline on a gsl-steward card', () => {
    const html = card('gsl-steward-026');
    expect(html).toContain('data-testid="card-assets"');
    expect(html).toContain('data-testid="audition-strip"');
    expect((html.match(/<audio/g) || []).length).toBe(12);
  });

  it('surfaces the slime-mold embed on a slime-mold-delay card', () => {
    const html = card('slime-mold-delay-steward-004');
    expect(html).toContain('data-testid="embed"');
    expect(html).toContain('slime-mold/index.html');
  });

  it('renders no asset block for a request with no assets', () => {
    const html = card('meadows-career-steward-007');
    expect(html).not.toContain('data-testid="card-assets"');
  });
});
