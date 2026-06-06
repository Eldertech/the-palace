// Tests for the Phase-3 inline-asset registry lookup (assetsFor): exact-then-
// prefix resolution, the stable-per-steward audio sets, and the cycle-pinned
// artifacts.

import { describe, it, expect } from 'vitest';
import { assetsFor } from '../../src/lib/trickster-assets.js';

describe('assetsFor — prefix-keyed audio auditions', () => {
  it('attaches the 12-drone audition to any gsl-steward cycle', () => {
    for (const id of ['gsl-steward-026', 'gsl-steward-028', 'gsl-steward-099']) {
      const a = assetsFor(id);
      expect(a, id).toBeTruthy();
      expect(a.audition.kind).toBe('audio-sequence');
      expect(a.audition.tracks).toHaveLength(12);
    }
  });

  it('attaches the five-pass audition to the inharmonic steward', () => {
    const a = assetsFor('inharmonic-wavetable-synthesis-steward-005');
    expect(a.audition.tracks).toHaveLength(5);
    expect(a.audition.tracks[0].src).toMatch(/pass1-flat-harmonic-baseline\.wav$/);
  });

  it('attaches the twelve portamento examples to the portamento steward', () => {
    const a = assetsFor('portamento-steward-006');
    expect(a.audition.tracks).toHaveLength(12);
  });

  it('every audition track has tag, label, and a /trickster-assets src', () => {
    for (const id of ['gsl-steward-026', 'inharmonic-wavetable-synthesis-steward-005', 'portamento-steward-006']) {
      for (const tr of assetsFor(id).audition.tracks) {
        expect(typeof tr.tag).toBe('string');
        expect(typeof tr.label).toBe('string');
        expect(tr.src).toMatch(/^\/trickster-assets\/audio\//);
      }
    }
  });
});

describe('assetsFor — embeds', () => {
  it('attaches the slime-mold prototype to any slime-mold-delay cycle', () => {
    const a = assetsFor('slime-mold-delay-steward-004');
    expect(a.embed.kind).toBe('iframe');
    expect(a.embed.src).toMatch(/slime-mold\/index\.html$/);
    expect(a.embed.tall).toBe(true);
  });

  it('pins the Witness Diagram to the exact request that built it', () => {
    expect(assetsFor('retrospective-delay-steward-009').embed.src).toMatch(/witness-diagram\.html$/);
    // A different retrospective cycle does NOT inherit it (no prefix key).
    expect(assetsFor('retrospective-delay-steward-007')).toBe(null);
  });
});

describe('assetsFor — downloadable artifact', () => {
  it('pins the dark-cutoff .adv to preset-steward-007 exactly', () => {
    const a = assetsFor('preset-steward-007');
    expect(a.action.kind).toBe('download');
    expect(a.action.src).toMatch(/Aqueous Pad - dark cutoff\.adv$/);
    // A different preset cycle must NOT get the .adv.
    expect(assetsFor('preset-steward-004')).toBe(null);
  });
});

describe('assetsFor — misses and edges', () => {
  it('returns null for a request with no registered assets', () => {
    expect(assetsFor('apo-steward-vector-change-2026-06-03')).toBe(null);
    expect(assetsFor('meadows-career-steward-007')).toBe(null);
  });

  it('returns null for empty / non-string input', () => {
    expect(assetsFor('')).toBe(null);
    expect(assetsFor(undefined)).toBe(null);
    expect(assetsFor(null)).toBe(null);
  });

  it('exact match takes precedence over a prefix match', () => {
    // preset-steward-007 is exact-keyed (an action), and there is no
    // preset-steward- prefix key — so a sibling cycle resolves to null,
    // proving exact keys don't leak across the prefix.
    expect(assetsFor('preset-steward-007').action).toBeTruthy();
    expect(assetsFor('preset-steward-004')).toBe(null);
  });
});
