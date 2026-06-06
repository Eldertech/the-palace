// Render tests for the Phase-3 inline assets after the ArtifactSlot
// convergence: AuditionStrip (sequenced audio, reusing PhosphorAudio) and the
// card integration that routes embeds/files through the shared ArtifactSlot.
// renderToStaticMarkup, node env — playback / sequencing is e2e.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AuditionStrip from '../../src/components/trickster/AuditionStrip.jsx';
import TricksterCard from '../../src/components/trickster/TricksterCard.jsx';

const PUB = '_ops/stigmergy/app/public/trickster-assets';
const TRACKS = [
  { tag: '1', label: 'flat baseline', path: `${PUB}/audio/inharmonic/pass1-flat-harmonic-baseline.wav` },
  { tag: '2', label: 'piano stretch', path: `${PUB}/audio/inharmonic/pass2-piano-stretch.wav` },
];

describe('AuditionStrip', () => {
  it('renders one audio element per track and a PLAY ALL button', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditionStrip, { title: 'the audition', blurb: 'listen', tracks: TRACKS })
    );
    expect(html).toContain('data-testid="audition-strip"');
    expect((html.match(/<audio/g) || []).length).toBe(2);
    // Served through /api/file (palace-relative path), not a raw static URL.
    expect(html).toContain('/api/file?path=');
    expect(html.toLowerCase()).toContain('play all');
    expect(html).toContain('2'); // the count in "play all 2 in sequence"
  });

  it('uses the phosphor-styled player with a working open-native chip', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuditionStrip, { title: 'x', tracks: TRACKS })
    );
    // The styled player's control strip is present per track...
    expect(html).toContain('data-testid="audition-audio-0-toggle"');
    expect(html).toContain('data-testid="audition-audio-1-toggle"');
    // ...the native <audio> is the hidden engine, never shown with `controls`...
    expect(html).toMatch(/<audio[^>]*style="display:none/);
    expect(html).not.toMatch(/<audio[^>]*\scontrols/);
    // ...and the open-native chip is now present (the /api/file path is
    // /api/open-resolvable, so it opens the clip in the DAW).
    expect(html).toContain('data-testid="audition-audio-0-open-native"');
  });

  it('renders nothing without tracks', () => {
    expect(renderToStaticMarkup(React.createElement(AuditionStrip, { tracks: [] }))).toBe('');
    expect(renderToStaticMarkup(React.createElement(AuditionStrip, {}))).toBe('');
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

  it('renders the slime-mold embed through the shared ArtifactSlot iframe', () => {
    const html = card('slime-mold-delay-steward-004');
    expect(html).toContain('data-testid="artifact-slot"');
    expect(html).toContain('data-testid="artifact-iframe"');
    // Loaded via /api/file (the basename survives encoding unescaped).
    expect(html).toContain('index.html');
    expect(html).toContain('slime mold field'); // the descriptive caption
  });

  it('renders the .adv as a shared ArtifactSlot open-in-native-app file', () => {
    const html = card('preset-steward-007');
    expect(html).toContain('data-testid="artifact-slot"');
    // .adv is not audio/image/html → ArtifactSlot's file fallback (open link).
    expect(html).toContain('data-testid="artifact-link"');
    expect(html).toContain('/api/open?path=');
    expect(html.toLowerCase()).toContain('ableton'); // the try-it caption
  });

  it('renders no asset block for a request with no assets', () => {
    const html = card('meadows-career-steward-007');
    expect(html).not.toContain('data-testid="card-assets"');
  });
});
