// Integration test for the unsung-path emitter CLI: scans a temp palace, plans,
// and (with --post) appends valid promote_unsung proposals to a temp board.
// Proves the whole runner end-to-end + its idempotent re-run.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMessage } from '@stigmergy/core/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..', '..');
const SCRIPT = join(APP_ROOT, 'scripts', 'weave-emit-unsung.mjs');

describe('weave-emit-unsung CLI', () => {
  let root, board;
  const run = (...args) => execFileSync('node', [SCRIPT, '--root', root, '--board', board, ...args], { cwd: APP_ROOT, encoding: 'utf8' });
  const readBoard = () =>
    (existsSync(board) ? readFileSync(board, 'utf8').trim().split('\n').filter(Boolean) : []).map((l) => JSON.parse(l));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'unsung-emit-'));
    board = join(root, 'board.jsonl');
    // Alpha names [[Beta]] in prose but has no typed link to it (an unsung path);
    // Gamma is already typed to Beta (must NOT be re-proposed).
    writeFileSync(resolve(root, 'Alpha.md'),
      '---\ntitle: Alpha\ntype: concept\nstage: seed\npillars: [tools]\n---\n# Alpha\n\nAlpha leans on [[Beta]] in the argument, and nods to [[Offpalace Ghost]] too.\n');
    writeFileSync(resolve(root, 'Beta.md'),
      '---\ntitle: Beta\ntype: concept\nstage: seed\npillars: [philosophy]\n---\n# Beta\n\nbody.\n');
    writeFileSync(resolve(root, 'Gamma.md'),
      '---\ntitle: Gamma\ntype: concept\nstage: seed\npillars: [tools]\nlinks:\n  - target: "[[Beta]]"\n    type: mirrors\n---\n# Gamma\n\nGamma also discusses [[Beta]] at length.\n');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('dry run finds the unsung path but writes nothing', () => {
    const out = run();
    expect(out).toMatch(/dry run/);
    expect(out).toMatch(/Alpha\.md\s+→\s+Beta\.md/);
    expect(readBoard()).toHaveLength(0); // no --post → no write
  });

  test('--post emits a valid promote_unsung proposal for the unsung path only', () => {
    run('--post');
    const board1 = readBoard();
    // Alpha→Beta is unsung; Gamma→Beta is already typed (skipped); Offpalace Ghost
    // doesn't resolve to an entry (skipped). So exactly one proposal.
    expect(board1).toHaveLength(1);
    const m = board1[0];
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.kind).toBe('vector_proposal');
    expect(m.payload.proposal_type).toBe('promote_unsung');
    expect(m.payload.source_entry).toBe('Alpha.md');
    expect(m.payload.target_entry).toBe('Beta.md');
    expect(m.payload.apply).toEqual({ op: 'add-link', entry: 'Alpha', target: 'Beta', type: 'connects-to' });
  });

  test('a second --post run is idempotent — the open proposal is not duplicated', () => {
    run('--post');
    const after1 = readBoard().length;
    const out2 = run('--post');
    expect(out2).toMatch(/1 already proposed \(open\)/);
    expect(readBoard().length).toBe(after1); // no new proposal appended
  });
});
