// Focused tests for the small pure helpers inside PhosphorAudio.
//
// The component itself binds to the <audio> media element's events and
// would need jsdom shimming to test end-to-end at the unit layer; the
// Playwright suite covers the rendered structure. What we DO want
// asserted here are the pure helpers that decide the visible time string
// and the open-native URL.
//
// Re-exported from the component for testability.

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PhosphorAudio from '../../src/components/PhosphorAudio.jsx';

describe('PhosphorAudio — initial render', () => {
  it('emits the phosphor control strip with button, scrubber, time, native-open chip', () => {
    const html = renderToStaticMarkup(
      React.createElement(PhosphorAudio, { src: '/api/file?path=Foo/bar.wav' }),
    );
    expect(html).toContain('data-testid="phosphor-audio"');
    expect(html).toContain('data-testid="phosphor-audio-toggle"');
    expect(html).toContain('data-testid="phosphor-audio-scrubber"');
    expect(html).toContain('data-testid="phosphor-audio-time"');
    expect(html).toContain('data-testid="phosphor-audio-open-native"');
    // Time defaults to --:-- before metadata loads.
    expect(html).toContain('0:00 / --:--');
    // Button starts in the "> play" state.
    expect(html).toContain('&gt; play');
  });

  it('extracts the palace-relative path for the native-open chip', () => {
    const html = renderToStaticMarkup(
      React.createElement(PhosphorAudio, { src: '/api/file?path=Kuramoto%20Coupling%2Fintro.wav' }),
    );
    // The decoded path travels back through the open-native href.
    expect(html).toMatch(/href="\/api\/open\?path=Kuramoto%20Coupling%2Fintro\.wav"/);
  });

  it('falls back to the raw src when no ?path= is present', () => {
    const html = renderToStaticMarkup(
      React.createElement(PhosphorAudio, { src: '/static/clip.wav' }),
    );
    expect(html).toContain('href="/api/open?path=%2Fstatic%2Fclip.wav"');
  });

  it('the underlying <audio> element is hidden (display: none)', () => {
    const html = renderToStaticMarkup(
      React.createElement(PhosphorAudio, { src: '/api/file?path=x.wav' }),
    );
    expect(html).toMatch(/<audio[^>]*style="display:none[^>]*>/);
    // The button shows it's controlling the audio: starts disabled until
    // metadata loads (ready: false on initial render).
    expect(html).toMatch(/aria-pressed="false"/);
  });
});
