// Tests for public-mode.js — the one place that knows STIGMERGY from the read
// view. Under vitest VITE_PUBLIC is unset, so these pin the live-mode URLs and
// the pure helpers the build script shares with the page.

import { describe, it, expect } from 'vitest';
import { IS_PUBLIC, pathId, encodeSegments, fileUrl, openUrl, dataUrl } from '../../src/lib/public-mode.js';

describe('pathId', () => {
  it('is a stable 8-hex id for a path', () => {
    expect(pathId('Kuramoto Coupling.md')).toMatch(/^[0-9a-f]{8}$/);
    expect(pathId('Kuramoto Coupling.md')).toBe(pathId('Kuramoto Coupling.md'));
    expect(pathId('Kuramoto Coupling.md')).not.toBe(pathId('Kuramoto Coupling/Kuramoto Coupling — scroll.md'));
  });

  it('has no collision across a realistic set of paths', () => {
    const paths = [];
    for (let i = 0; i < 2000; i++) paths.push(`Projects/Entry ${i}/Entry ${i} — scroll.md`, `Entry ${i}.md`);
    expect(new Set(paths.map(pathId)).size).toBe(paths.length);
  });
});

describe('URLs in STIGMERGY (live mode)', () => {
  it('is not the public build under test', () => {
    expect(IS_PUBLIC).toBe(false);
  });

  it('serves files through /api/file, with an optional version', () => {
    expect(fileUrl('Kuramoto Coupling/Kuramoto Coupling — hero.png'))
      .toBe('/api/file?path=Kuramoto%20Coupling%2FKuramoto%20Coupling%20%E2%80%94%20hero.png');
    expect(fileUrl('a.png', 1234)).toBe('/api/file?path=a.png&v=1234');
    expect(fileUrl('a.png', '')).toBe('/api/file?path=a.png');
  });

  it('opens files natively through /api/open, revealing on request', () => {
    expect(openUrl('Projects/Foo/bar.wav')).toBe('/api/open?path=Projects%2FFoo%2Fbar.wav');
    expect(openUrl('x.wav', { reveal: true })).toBe('/api/open?path=x.wav&reveal=1');
  });
});

describe('path helpers', () => {
  it('encodes each segment but keeps the slashes', () => {
    expect(encodeSegments('Cross-Domain Resonances/Saturation ↔ Richness.md'))
      .toBe('Cross-Domain%20Resonances/Saturation%20%E2%86%94%20Richness.md');
  });

  it('names snapshot files under data/', () => {
    expect(dataUrl('entries.json')).toBe('/data/entries.json');
  });
});
