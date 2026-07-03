import { describe, test, expect } from 'vitest';
import { buildLaunchPrompt, handoffLaunchContext } from '../../src/lib/launch-prompt.js';

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

  test('receives the baton with skepticism — a freshness/live gate before acting', () => {
    const p = buildLaunchPrompt(ctx);
    expect(p).toMatch(/skepticism/i);
    expect(p).toMatch(/still LIVE/);
    expect(p).toMatch(/moved past it/i);
    // It must tell the catcher to STOP on a stale move, not execute it.
    expect(p).toMatch(/stale move/i);
    expect(p).toMatch(/superseded/i);
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

describe('buildLaunchPrompt — handoff worktree coordinate', () => {
  const wtCtx = {
    kind: 'handoff', sourcePath: 'Closing Well/Closing Well — baton.md', entry: 'Closing Well',
    from: 'Closing Well', id: 'cw-1', move: 'Build the Agent; Phase 2 next.',
    worktree: {
      branch: 'feature/closing-well-agent',
      dir: '../palace-feature-closing-well-agent',
      profile: 'docs',
    },
  };

  test('sends the catcher into the worktree, not the palace root', () => {
    const p = buildLaunchPrompt(wtCtx);
    expect(p).toContain('lives in a git worktree');
    expect(p).toContain('cd "../palace-feature-closing-well-agent"');
    expect(p).toContain('branch feature/closing-well-agent');
    expect(p).toContain('profile docs');
    // It must NOT tell a worktree catcher to work at the palace root.
    expect(p).not.toContain('session at the palace root');
  });

  test('gives the recreate command when the worktree dir is gone', () => {
    const p = buildLaunchPrompt(wtCtx);
    expect(p).toContain('node _ops/worktree/new-worktree.mjs --name feature/closing-well-agent --profile docs');
  });

  test('without a worktree, keeps the palace-root wording and no cd line', () => {
    const p = buildLaunchPrompt({ ...wtCtx, worktree: null });
    expect(p).toContain('session at the palace root');
    expect(p).not.toContain('lives in a git worktree');
    expect(p).not.toContain('cd "');
  });

  test('still degrades: a worktree with only a dir omits the recreate command', () => {
    const p = buildLaunchPrompt({ ...wtCtx, worktree: { dir: '../somewhere' } });
    expect(p).toContain('cd "../somewhere"');
    expect(p).not.toContain('new-worktree.mjs');
  });
});

describe('handoffLaunchContext — item → launch context', () => {
  test('maps a queue item, carrying the worktree coordinate through', () => {
    const item = {
      id: 'cw-1', entry: 'Closing Well', from: 'Closing Well',
      handoff_path: 'Closing Well/Closing Well — baton.md', summary: 's',
      move: 'm', invocation: 'i',
      worktree: { branch: 'feature/x', dir: '../x', profile: 'docs' },
    };
    const ctx = handoffLaunchContext(item);
    expect(ctx.kind).toBe('handoff');
    expect(ctx.sourcePath).toBe('Closing Well/Closing Well — baton.md');
    expect(ctx.worktree).toEqual({ branch: 'feature/x', dir: '../x', profile: 'docs' });
    // The mapped context must round-trip through the prompt builder.
    expect(buildLaunchPrompt(ctx)).toContain('cd "../x"');
  });

  test('worktree defaults to null when the item has none', () => {
    expect(handoffLaunchContext({ id: 'a' }).worktree).toBeNull();
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
