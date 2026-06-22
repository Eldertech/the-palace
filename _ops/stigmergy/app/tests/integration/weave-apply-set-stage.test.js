// Integration: applyWeaveProposal applies a set-stage op (growing -> mature) to
// a LIVE entry in a temp git repo, commits it as kind `weave`, and posts a valid
// `weave_applied` PROOF carrying stage_change. Real git, no mocks on the write path.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { applyWeaveProposal } from '../../server/weave-apply.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('applyWeaveProposal — set-stage (stage advance) end-to-end', () => {
  let root, boardPath;
  function g(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }); }
  const readBoard = () =>
    (existsSync(boardPath) ? readFileSync(boardPath, 'utf8').trim().split('\n').filter(Boolean) : [])
      .map((l) => JSON.parse(l));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'weave-setstage-'));
    boardPath = join(root, 'board.jsonl');
    g('init', '-q');
    g('config', 'user.email', 'test@palace');
    g('config', 'user.name', 'Test Palace');
    g('config', 'commit.gpgsign', 'false');
    writeFileSync(
      resolve(root, 'Kuramoto Coupling.md'),
      '---\ntitle: Kuramoto Coupling\ntype: concept\nstage: growing\npillars: [tools]\nforward_vector: "I keep pulling oscillators into phase."\nlinks:\n  - target: "[[Spinoza Conatus]]"\n    type: mirrors\n---\n# Kuramoto Coupling\n\nbody.\n',
    );
    g('add', '-A');
    g('commit', '-q', '-m', 'deposit(Kuramoto Coupling): seed\n\nPalace-Kind: deposit\nPalace-Verify: verified');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('advances growing -> mature, commits weave, PROOFs the stage_change', async () => {
    const r = await applyWeaveProposal({
      palaceRoot: root,
      boardPath,
      apply: { op: 'set-stage', entry: 'Kuramoto Coupling', stage: 'mature' },
      proposalId: 'stage-demo-1',
    });

    // (1) success + the stage change reported
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.commit).toMatch(/^[0-9a-f]{7,40}$/);
    expect(r.op).toBe('set-stage');
    expect(r.stageChange).toEqual({ from: 'growing', to: 'mature' });

    // (2) the LIVE entry's stage line was rewritten, churn-free (other fields kept)
    const file = readFileSync(resolve(root, 'Kuramoto Coupling.md'), 'utf8');
    expect(file).toMatch(/^stage: mature$/m);
    expect(file).not.toMatch(/^stage: growing$/m);
    expect(file).toMatch(/^type: concept$/m); // untouched
    expect(file).toMatch(/forward_vector: "I keep pulling oscillators into phase\."/); // untouched
    expect(file).toContain('  - target: "[[Spinoza Conatus]]"\n    type: mirrors'); // untouched

    // (3) committed as kind weave
    const head = g('log', '-1', '--format=%B');
    expect(head).toMatch(/^weave\(Kuramoto Coupling\):/);
    expect(head).toMatch(/Palace-Kind: weave/);

    // (4) a valid weave_applied PROOF carrying stage_change, threaded to the proposal
    expect(r.proofPosted).toBe(true);
    const proof = readBoard()[0];
    expect(validateMessage(proof).valid, JSON.stringify(validateMessage(proof))).toBe(true);
    expect(proof.payload.kind).toBe('weave_applied');
    expect(proof.payload.op).toBe('set-stage');
    expect(proof.payload.stage_change).toEqual({ from: 'growing', to: 'mature' });
    expect(proof.re).toBe('stage-demo-1');
  });

  test('refuses a no-op (already stage: mature) with 422 and no commit', async () => {
    await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-stage', entry: 'Kuramoto Coupling', stage: 'mature' } });
    const before = g('rev-parse', 'HEAD');
    const r = await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-stage', entry: 'Kuramoto Coupling', stage: 'mature' } });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
    expect(g('rev-parse', 'HEAD')).toBe(before); // nothing committed
  });

  test('422 when the stage is not a §2 stage (normalizes to null)', async () => {
    const r = await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { op: 'set-stage', entry: 'Kuramoto Coupling', stage: 'megamature' } });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });
});
