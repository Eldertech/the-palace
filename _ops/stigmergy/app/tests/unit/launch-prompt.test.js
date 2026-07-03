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

  test('leads with the move and surfaces the invocation when present', () => {
    const p = buildLaunchPrompt({
      ...ctx,
      summary: 'demo: open handoff, awaiting pickup',
      move: 'Wire the feedback-path saturation stage; decide pre/post filter placement.',
      invocation: 'Read Foo.md and the baton, then pick up the move.',
    });
    // The move (not the generic summary) is what the prompt names as "the move".
    expect(p).toContain('The move (handoff h-1, from Foo): "Wire the feedback-path saturation stage; decide pre/post filter placement."');
    // The verbatim invocation is surfaced as the first action.
    expect(p).toContain('First action (the baton\'s invocation): Read Foo.md and the baton, then pick up the move.');
    // The generic summary is NOT used as the move when a move exists.
    expect(p).not.toContain('The move (handoff h-1, from Foo): "demo: open handoff, awaiting pickup"');
  });

  test('a move-less baton falls back to summary and omits the invocation line', () => {
    const p = buildLaunchPrompt(ctx); // no move, no invocation
    expect(p).toContain('mid-move on Stage C');
    expect(p).not.toContain('First action');
  });

  test('generic kind for an unrecognized future context', () => {
    const p = buildLaunchPrompt({ kind: 'mystery', title: 'Kuramoto Coupling', summary: 'a koan card' });
    expect(p).toContain('Kuramoto Coupling');
    expect(p).toContain('CLAUDE.md');
  });
});

describe('buildLaunchPrompt — steward', () => {
  test('references the steward page, its dir, the cycle/stage, and how to continue + close', () => {
    const p = buildLaunchPrompt({
      kind: 'steward', entry: 'Generative Wavetable Libraries',
      sourcePath: '_ops/agents/permanent/generative-wavetable-libraries',
      iteration: 9, stage: 'growing', summary: 'mid-way through the dispersion recipe',
    });
    expect(p).toContain('[[Generative Wavetable Libraries]]');
    expect(p).toContain('_ops/agents/permanent/generative-wavetable-libraries');
    expect(p).toContain('cycle 9');
    expect(p).toContain('growing');
    expect(p).toContain('mid-way through the dispersion recipe');
    expect(p).toContain('CLAUDE.md');            // orient
    expect(p).toContain('blackboard.jsonl');     // read where it stands
    expect(p).toMatch(/RESOURCE_REQUEST/);       // post back when it needs Loudon
    expect(p).toMatch(/commit is the record/i);  // honesty close
  });

  test('degrades gracefully when optional fields are missing', () => {
    const p = buildLaunchPrompt({ kind: 'steward', entry: 'Semantic Delay' });
    expect(p).toContain('[[Semantic Delay]]');
    expect(p).toContain('_ops/agents/permanent/<slug>/'); // dir fallback
    expect(typeof p).toBe('string');
    expect(p).not.toContain('cycle undefined');           // no undefined leakage
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
