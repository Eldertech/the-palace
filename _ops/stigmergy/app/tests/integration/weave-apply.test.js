// Integration test for the Weave executor: applyWeaveProposal applies a granted
// proposal's `apply` op to a LIVE entry in a temp git repo, commits it as kind
// `weave`, and posts a valid `weave_applied` PROOF to a temp board. Mirrors the
// palace-commit harness (real git, no mocks for the write/commit path).

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { applyWeaveProposal } from '../../server/weave-apply.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('applyWeaveProposal — set-vector end-to-end', () => {
  let root, boardPath;
  function g(...args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }); }
  const readBoard = () =>
    (existsSync(boardPath) ? readFileSync(boardPath, 'utf8').trim().split('\n').filter(Boolean) : [])
      .map((l) => JSON.parse(l));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'weave-apply-'));
    boardPath = join(root, 'board.jsonl');
    g('init', '-q');
    g('config', 'user.email', 'test@palace');
    g('config', 'user.name', 'Test Palace');
    g('config', 'commit.gpgsign', 'false');
    writeFileSync(
      resolve(root, 'Kuramoto Coupling.md'),
      '---\ntitle: Kuramoto Coupling\ntype: concept\nstage: growing\npillars: [tools]\nforward_vector: "I want to explore oscillator sync."\nlinks:\n  - target: "[[Cooperation Yields Agency]]"\n    type: mirrors\n---\n# Kuramoto Coupling\n\nbody.\n',
    );
    g('add', '-A');
    g('commit', '-q', '-m', 'deposit(Kuramoto Coupling): seed\n\nPalace-Kind: deposit\nPalace-Verify: verified');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('applies the set-vector op, commits as kind weave, and posts a weave_applied PROOF', async () => {
    const r = await applyWeaveProposal({
      palaceRoot: root,
      boardPath,
      apply: { op: 'set-vector', entry: 'Kuramoto Coupling', text: 'I will keep teaching coupling as the shape of cooperation.' },
      proposalId: 'demo-vector-proposal-1',
    });

    // (1) the executor reports success with a real commit + the vector move
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.commit).toMatch(/^[0-9a-f]{7,40}$/);
    expect(r.vectorChange).toEqual({
      from: 'I want to explore oscillator sync.',
      to: 'I will keep teaching coupling as the shape of cooperation.',
    });

    // (2) the LIVE entry's forward_vector was actually rewritten on disk
    const file = readFileSync(resolve(root, 'Kuramoto Coupling.md'), 'utf8');
    expect(file).toMatch(/forward_vector: "I will keep teaching coupling as the shape of cooperation\."/);
    expect(file).not.toMatch(/explore oscillator sync/);

    // (3) the commit landed as kind `weave` with the entry + vector trailers
    const head = g('log', '-1', '--format=%B');
    expect(head).toMatch(/^weave\(Kuramoto Coupling\):/);
    expect(head).toMatch(/Palace-Kind: weave/);
    expect(head).toMatch(/Palace-Entry: Kuramoto Coupling/);
    expect(head).toMatch(/Palace-Vector: Kuramoto Coupling: changed/);

    // (4) a valid weave_applied PROOF is on the board, threaded to the proposal
    expect(r.proofPosted).toBe(true);
    const board = readBoard();
    expect(board).toHaveLength(1);
    const proof = board[0];
    expect(validateMessage(proof).valid, JSON.stringify(validateMessage(proof))).toBe(true);
    expect(proof.type).toBe('PROOF');
    expect(proof.board).toBe('WEAVE');
    expect(proof.re).toBe('demo-vector-proposal-1');
    expect(proof.payload.kind).toBe('weave_applied');
    expect(proof.payload.entry).toBe('Kuramoto Coupling');
    expect(proof.payload.commit).toBe(r.commit);
    expect(proof.payload.proposal_id).toBe('demo-vector-proposal-1');
    expect(proof.payload.vector_change.to).toMatch(/shape of cooperation/);
  });

  test('applies an add-link op: appends the typed link, commits weave, PROOFs the link', async () => {
    const r = await applyWeaveProposal({
      palaceRoot: root,
      boardPath,
      apply: { op: 'add-link', entry: 'Kuramoto Coupling', target: 'Spinoza Conatus', type: 'deepens', label: 'fermented-from' },
      proposalId: 'demo-vector-proposal-3',
    });

    // (1) success + the link change reported
    expect(r.ok, JSON.stringify(r)).toBe(true);
    expect(r.commit).toMatch(/^[0-9a-f]{7,40}$/);
    expect(r.linkChange).toEqual({ target: 'Spinoza Conatus', type: 'deepens', label: 'fermented-from' });

    // (2) the LIVE entry's links array gained the typed link (the pre-existing
    // one preserved, churn-free)
    const file = readFileSync(resolve(root, 'Kuramoto Coupling.md'), 'utf8');
    expect(file).toContain('  - target: "[[Cooperation Yields Agency]]"\n    type: mirrors');
    expect(file).toContain('  - target: "[[Spinoza Conatus]]"\n    type: deepens\n    label: fermented-from');

    // (3) committed as kind weave, both entries named in the trailers
    const head = g('log', '-1', '--format=%B');
    expect(head).toMatch(/^weave\(Kuramoto Coupling\):/);
    expect(head).toMatch(/Palace-Kind: weave/);
    expect(head).toMatch(/Palace-Entry: Kuramoto Coupling/);

    // (4) the PROOF carries the link_change (no vector_change)
    const proof = readBoard()[0];
    expect(validateMessage(proof).valid).toBe(true);
    expect(proof.payload.kind).toBe('weave_applied');
    expect(proof.payload.op).toBe('add-link');
    expect(proof.payload.link_change).toEqual({ target: 'Spinoza Conatus', type: 'deepens', label: 'fermented-from' });
    expect(proof.payload.vector_change).toBeUndefined();
  });

  test('refuses a duplicate add-link (422, no commit) — same target + type already present', async () => {
    const before = g('rev-parse', 'HEAD');
    const r = await applyWeaveProposal({
      palaceRoot: root,
      boardPath,
      apply: { op: 'add-link', entry: 'Kuramoto Coupling', target: 'Cooperation Yields Agency', type: 'mirrors' },
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
    expect(g('rev-parse', 'HEAD')).toBe(before); // nothing committed
  });

  test('404 when the entry does not exist (no write, no commit)', async () => {
    const before = g('rev-parse', 'HEAD');
    const r = await applyWeaveProposal({
      palaceRoot: root,
      boardPath,
      apply: { op: 'set-vector', entry: 'No Such Entry', text: 'x.' },
    });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(404);
    expect(g('rev-parse', 'HEAD')).toBe(before); // nothing committed
    expect(readBoard()).toHaveLength(0);
  });

  test('422 when the proposal carries no applicable change', async () => {
    const r = await applyWeaveProposal({ palaceRoot: root, boardPath, apply: { proposed_change: 'just prose' } });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(422);
  });
});
