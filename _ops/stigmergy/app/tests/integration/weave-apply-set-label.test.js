// Integration: applyWeaveProposal applies a set-label op (add a register to an
// existing typed link) to a LIVE entry in a temp git repo, commits it as kind
// `weave`, and posts a valid `weave_applied` PROOF carrying label_change. Real
// git, no mocks on the write path. The in-place edit is the subtle one — it must
// insert the label on the RIGHT link, churn-free, leaving siblings untouched.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { applyWeaveProposal } from '../../server/weave-apply.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('applyWeaveProposal — set-label (enrich a link) end-to-end', () => {
  let root, boardPath;
  function g(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }); }
  const readBoard = () =>
    (existsSync(boardPath) ? readFileSync(boardPath, 'utf8').trim().split('\n').filter(Boolean) : [])
      .map((l) => JSON.parse(l));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'weave-setlabel-'));
    boardPath = join(root, 'board.jsonl');
    g('init', '-q');
    g('config', 'user.email', 'test@palace');
    g('config', 'user.name', 'Test Palace');
    g('config', 'commit.gpgsign', 'false');
    // Foo has a LABEL-LESS mirrors->Bar link and an ALREADY-LABELED deepens->Baz link.
    writeFileSync(
      resolve(root, 'Foo.md'),
      '---\ntitle: Foo\ntype: concept\nstage: growing\npillars: [tools]\nlinks:\n  - target: "[[Bar]]"\n    type: mirrors\n  - target: "[[Baz]]"\n    type: deepens\n    label: grounds\n---\n# Foo\n\nbody.\n',
    );
    g('add', '-A');
    g('commit', '-q', '-m', 'deposit(Foo): seed\n\nPalace-Kind: deposit\nPalace-Verify: verified');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('inserts the label on the right link, commits weave, PROOFs the label_change', async () => {
    const r = await applyWeaveProposal({
      palaceRoot: root,
      boardPath,
      apply: { op: 'set-label', entry: 'Foo', target: 'Bar', type: 'mirrors', label: 'rhymes-with' },
      proposalId: 'label-demo-1',
    });

    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.op).toBe('set-label');
    expect(r.labelChange).toEqual({ target: 'Bar', type: 'mirrors', label: 'rhymes-with' });

    // the Bar/mirrors link now carries the label; the Baz link is untouched
    const file = readFileSync(resolve(root, 'Foo.md'), 'utf8');
    expect(file).toMatch(/- target: "\[\[Bar\]\]"\n {4}type: mirrors\n {4}label: ["']?rhymes-with["']?/);
    expect(file).toMatch(/- target: "\[\[Baz\]\]"\n {4}type: deepens\n {4}label: grounds/); // sibling untouched
    expect((file.match(/label:/g) || []).length).toBe(2); // exactly one new label added

    // committed weave, PROOF carries label_change threaded to the proposal
    expect(g('log', '-1', '--format=%B')).toMatch(/Palace-Kind: weave/);
    expect(r.proofPosted).toBe(true);
    const proof = readBoard()[0];
    expect(validateMessage(proof).valid, JSON.stringify(validateMessage(proof))).toBe(true);
    expect(proof.payload.op).toBe('set-label');
    expect(proof.payload.label_change).toEqual({ target: 'Bar', type: 'mirrors', label: 'rhymes-with' });
    expect(proof.re).toBe('label-demo-1');
  });

  test('refuses a no-op (link already labeled) with 422 and no commit', async () => {
    const before = g('rev-parse', 'HEAD');
    const r = await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-label', entry: 'Foo', target: 'Baz', type: 'deepens', label: 'embodies' } });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
    expect(g('rev-parse', 'HEAD')).toBe(before);
  });

  test('refuses when no matching link exists (422)', async () => {
    const r = await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-label', entry: 'Foo', target: 'Ghost', type: 'mirrors', label: 'haunts' } });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });

  test('422 when the label has whitespace (normalizes to null)', async () => {
    const r = await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-label', entry: 'Foo', target: 'Bar', type: 'mirrors', label: 'two words' } });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });
});
