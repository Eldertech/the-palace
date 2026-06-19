// Integration: applyWeaveProposal applies a set-type op (concept -> hub) to a
// LIVE entry in a temp git repo, commits it as kind `weave`, and posts a valid
// `weave_applied` PROOF carrying type_change. Real git, no mocks on the write path.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { applyWeaveProposal } from '../../server/weave-apply.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('applyWeaveProposal — set-type (promote hub) end-to-end', () => {
  let root, boardPath;
  function g(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }); }
  const readBoard = () =>
    (existsSync(boardPath) ? readFileSync(boardPath, 'utf8').trim().split('\n').filter(Boolean) : [])
      .map((l) => JSON.parse(l));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'weave-settype-'));
    boardPath = join(root, 'board.jsonl');
    g('init', '-q');
    g('config', 'user.email', 'test@palace');
    g('config', 'user.name', 'Test Palace');
    g('config', 'commit.gpgsign', 'false');
    writeFileSync(
      resolve(root, 'Cooperation Yields Agency.md'),
      '---\ntitle: Cooperation Yields Agency\ntype: concept\nstage: growing\npillars: [philosophy]\nforward_vector: "I keep amplifying both conatuses."\nlinks:\n  - target: "[[Kuramoto Coupling]]"\n    type: mirrors\n---\n# Cooperation Yields Agency\n\nbody.\n',
    );
    g('add', '-A');
    g('commit', '-q', '-m', 'deposit(Cooperation Yields Agency): seed\n\nPalace-Kind: deposit\nPalace-Verify: verified');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('retypes concept -> hub, commits weave, PROOFs the type_change', async () => {
    const r = await applyWeaveProposal({
      palaceRoot: root,
      boardPath,
      apply: { op: 'set-type', entry: 'Cooperation Yields Agency', type: 'hub' },
      proposalId: 'hub-demo-1',
    });

    // (1) success + the type change reported
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.commit).toMatch(/^[0-9a-f]{7,40}$/);
    expect(r.op).toBe('set-type');
    expect(r.typeChange).toEqual({ from: 'concept', to: 'hub' });

    // (2) the LIVE entry's type line was rewritten, churn-free (other fields kept)
    const file = readFileSync(resolve(root, 'Cooperation Yields Agency.md'), 'utf8');
    expect(file).toMatch(/^type: hub$/m);
    expect(file).not.toMatch(/^type: concept$/m);
    expect(file).toMatch(/forward_vector: "I keep amplifying both conatuses\."/); // untouched
    expect(file).toContain('  - target: "[[Kuramoto Coupling]]"\n    type: mirrors'); // untouched

    // (3) committed as kind weave
    const head = g('log', '-1', '--format=%B');
    expect(head).toMatch(/^weave\(Cooperation Yields Agency\):/);
    expect(head).toMatch(/Palace-Kind: weave/);

    // (4) a valid weave_applied PROOF carrying type_change, threaded to the proposal
    expect(r.proofPosted).toBe(true);
    const proof = readBoard()[0];
    expect(validateMessage(proof).valid, JSON.stringify(validateMessage(proof))).toBe(true);
    expect(proof.payload.kind).toBe('weave_applied');
    expect(proof.payload.op).toBe('set-type');
    expect(proof.payload.type_change).toEqual({ from: 'concept', to: 'hub' });
    expect(proof.re).toBe('hub-demo-1');
  });

  test('refuses a no-op (already type: hub) with 422 and no commit', async () => {
    // First promotion lands.
    await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-type', entry: 'Cooperation Yields Agency', type: 'hub' } });
    const before = g('rev-parse', 'HEAD');
    // Second identical promotion is a no-op.
    const r = await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-type', entry: 'Cooperation Yields Agency', type: 'hub' } });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
    expect(g('rev-parse', 'HEAD')).toBe(before); // nothing committed
  });

  test('422 when the type is not a §1 entry type (normalizes to null)', async () => {
    const r = await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-type', entry: 'Cooperation Yields Agency', type: 'megahub' } });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });
});
