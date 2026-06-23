// Tests for entry-ref.js — the name -> {path, hasBundle} resolver and the
// obsidian:// URL builder that back the [OBS]/[BUN] chips.

import { describe, it, expect } from 'vitest';
import { buildRefIndex, resolveRef, obsidianUri } from '../../src/lib/entry-ref.js';

const ENTRIES = [
  { path: 'Kuramoto Coupling.md', has_bundle: false },
  { path: 'Projects/Retrospective Delay.md', has_bundle: true },
  { path: 'Projects/Semantic Delay.md', has_bundle: true },
  { path: 'FOUR PILLARS.md' }, // has_bundle absent -> false
  // an enriched entry carrying a bundle avatar
  { path: 'Projects/Quantum Synthesizer.md', has_bundle: true, icon: 'Projects/Quantum Synthesizer/Quantum Synthesizer — icon.png' },
];

describe('buildRefIndex', () => {
  it('maps each entry basename to { path, hasBundle, icon }', () => {
    const idx = buildRefIndex(ENTRIES);
    expect(idx.get('Kuramoto Coupling')).toEqual({ path: 'Kuramoto Coupling.md', hasBundle: false, icon: null });
    expect(idx.get('Retrospective Delay')).toEqual({ path: 'Projects/Retrospective Delay.md', hasBundle: true, icon: null });
  });

  it('carries the bundle icon path when present, null otherwise', () => {
    const idx = buildRefIndex(ENTRIES);
    expect(idx.get('Quantum Synthesizer')).toEqual({
      path: 'Projects/Quantum Synthesizer.md', hasBundle: true,
      icon: 'Projects/Quantum Synthesizer/Quantum Synthesizer — icon.png',
    });
    // a non-string / blank icon normalizes to null
    expect(buildRefIndex([{ path: 'X.md', has_bundle: true, icon: '' }]).get('X').icon).toBeNull();
    expect(buildRefIndex([{ path: 'Y.md', has_bundle: true, icon: 42 }]).get('Y').icon).toBeNull();
  });

  it('treats a missing has_bundle as false', () => {
    const idx = buildRefIndex(ENTRIES);
    expect(idx.get('FOUR PILLARS')).toEqual({ path: 'FOUR PILLARS.md', hasBundle: false, icon: null });
  });

  it('keeps the first occurrence on a basename collision', () => {
    const idx = buildRefIndex([
      { path: 'A/Delay.md', has_bundle: true },
      { path: 'B/Delay.md', has_bundle: false },
    ]);
    expect(idx.get('Delay')).toEqual({ path: 'A/Delay.md', hasBundle: true, icon: null });
  });

  it('is safe on non-array / malformed input', () => {
    expect(buildRefIndex(null).size).toBe(0);
    expect(buildRefIndex([null, {}, { path: 42 }]).size).toBe(0);
  });
});

describe('resolveRef', () => {
  const idx = buildRefIndex(ENTRIES);

  it('resolves a bare entry/agent name', () => {
    expect(resolveRef(idx, 'Retrospective Delay')).toEqual({
      name: 'Retrospective Delay', path: 'Projects/Retrospective Delay.md', hasBundle: true, icon: null,
    });
  });

  it('returns the bundle icon path on a resolved entry that has one', () => {
    expect(resolveRef(idx, 'Quantum Synthesizer')).toEqual({
      name: 'Quantum Synthesizer', path: 'Projects/Quantum Synthesizer.md', hasBundle: true,
      icon: 'Projects/Quantum Synthesizer/Quantum Synthesizer — icon.png',
    });
    expect(resolveRef(idx, 'Kuramoto Coupling').icon).toBeNull();
  });

  it('strips [[ ]] wrappers and |aliases before resolving', () => {
    expect(resolveRef(idx, '[[Kuramoto Coupling]]')?.path).toBe('Kuramoto Coupling.md');
    expect(resolveRef(idx, 'Kuramoto Coupling|the sync model')?.path).toBe('Kuramoto Coupling.md');
  });

  it('returns null for an unknown name (a coordinator handle, say)', () => {
    expect(resolveRef(idx, 'KURAMOTO-1')).toBeNull();
    expect(resolveRef(idx, 'COORDINATOR')).toBeNull();
  });

  it('is null-safe', () => {
    expect(resolveRef(idx, null)).toBeNull();
    expect(resolveRef(null, 'Kuramoto Coupling')).toBeNull();
    expect(resolveRef(idx, '   ')).toBeNull();
  });
});

describe('obsidianUri', () => {
  it('builds an open-in-vault URL with the .md stripped and the path encoded', () => {
    expect(obsidianUri('The Palace', 'Projects/Retrospective Delay.md'))
      .toBe('obsidian://open?vault=The%20Palace&file=Projects%2FRetrospective%20Delay');
  });

  it('handles a root-level entry', () => {
    expect(obsidianUri('The Palace', 'Kuramoto Coupling.md'))
      .toBe('obsidian://open?vault=The%20Palace&file=Kuramoto%20Coupling');
  });

  it('falls back to "The Palace" when the vault is missing', () => {
    expect(obsidianUri('', 'Foo.md')).toBe('obsidian://open?vault=The%20Palace&file=Foo');
    expect(obsidianUri(undefined, 'Foo.md')).toBe('obsidian://open?vault=The%20Palace&file=Foo');
  });

  it('returns empty string for an unusable path', () => {
    expect(obsidianUri('The Palace', '')).toBe('');
    expect(obsidianUri('The Palace', null)).toBe('');
  });
});
