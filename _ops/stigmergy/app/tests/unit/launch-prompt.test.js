import { describe, test, expect } from 'vitest';
import { buildLaunchPrompt } from '../../src/lib/launch-prompt.js';

describe('buildLaunchPrompt — handoff', () => {
  const ctx = {
    kind: 'handoff', sourcePath: 'Foo/Foo — baton.md', entry: 'Foo',
    from: 'Foo', id: 'h-1', summary: 'mid-move on Stage C',
  };

  test('references the baton path, the move, and the orient + on-pickup steps', () => {
    const p = buildLaunchPrompt(ctx);
    expect(p).toContain('Foo/Foo — baton.md');
    expect(p).toContain('[[Foo]]');
    expect(p).toContain('mid-move on Stage C');
    expect(p).toContain('CLAUDE.md');
    expect(p).toMatch(/On pickup/i);
    expect(p).toContain('h-1');
  });

  test('defaults kind to handoff', () => {
    expect(buildLaunchPrompt({ sourcePath: 'x — baton.md' })).toContain('catching an in-progress baton');
  });

  test('degrades gracefully when fields are missing', () => {
    const p = buildLaunchPrompt({ kind: 'handoff' });
    expect(p).toContain('baton path missing');
    expect(typeof p).toBe('string');
  });

  test('generic kind for an unrecognized future context (e.g. steward)', () => {
    const p = buildLaunchPrompt({ kind: 'steward', title: 'Kuramoto Coupling', summary: 'a koan card' });
    expect(p).toContain('Kuramoto Coupling');
    expect(p).toContain('CLAUDE.md');
  });
});

describe('buildLaunchPrompt — card', () => {
  test('references the card folder, target entry, purpose, and the enrichment ceremony', () => {
    const p = buildLaunchPrompt({
      kind: 'card', id: 'card-007', entry: 'Kuramoto Coupling',
      purpose: 'forcing compression', summary: 'a 12-word koan',
    });
    expect(p).toContain('Enrichment/card-007/');
    expect(p).toContain('[[Kuramoto Coupling]]');
    expect(p).toContain('forcing compression');
    expect(p).toContain('a 12-word koan');
    expect(p).toContain('Enrichment.md');
    expect(p).toMatch(/deposit/i);
  });
});
