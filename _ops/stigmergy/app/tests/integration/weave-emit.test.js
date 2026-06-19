// Integration test for the unsung-path emitter CORE (server/weave-emit.js) — the
// shared scan→plan→post the route reuses. Scans a temp palace, plans against a
// temp board, and (dryRun:false) appends valid promote_unsung proposals through
// the sanctioned validate-then-appendMessage path. The CLI runner is covered
// separately in weave-emit-unsung.test.js; this proves the function the route calls.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { runUnsungEmission } from '../../server/weave-emit.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('runUnsungEmission — scan → plan → post', () => {
  let root, board;
  const readBoard = () =>
    (existsSync(board) ? readFileSync(board, 'utf8').trim().split('\n').filter(Boolean) : []).map((l) => JSON.parse(l));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'weave-emit-'));
    board = join(root, 'board.jsonl');
    // Alpha names [[Beta]] in prose but has no typed link to it (an unsung path);
    // Gamma is already typed to Beta (must NOT be re-proposed); Offpalace Ghost
    // doesn't resolve to an entry (skipped).
    writeFileSync(resolve(root, 'Alpha.md'),
      '---\ntitle: Alpha\ntype: concept\nstage: seed\npillars: [tools]\n---\n# Alpha\n\nAlpha leans on [[Beta]] in the argument, and nods to [[Offpalace Ghost]] too.\n');
    writeFileSync(resolve(root, 'Beta.md'),
      '---\ntitle: Beta\ntype: concept\nstage: seed\npillars: [philosophy]\n---\n# Beta\n\nbody.\n');
    writeFileSync(resolve(root, 'Gamma.md'),
      '---\ntitle: Gamma\ntype: concept\nstage: seed\npillars: [tools]\nlinks:\n  - target: "[[Beta]]"\n    type: mirrors\n---\n# Gamma\n\nGamma also discusses [[Beta]] at length.\n');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('dry run returns honest counts and writes nothing', async () => {
    const r = await runUnsungEmission({ palaceRoot: root, boardPath: board, dryRun: true });
    expect(r.ok).toBe(true);
    expect(r.dryRun).toBe(true);
    expect(r.entriesScanned).toBe(3);     // Alpha, Beta, Gamma
    expect(r.found).toBe(1);              // only Alpha→Beta is unsung
    expect(r.eligible).toBe(1);
    expect(r.planned).toBe(1);           // would post one
    expect(r.posted).toBeUndefined();    // dry run never posts
    expect(r.proposals).toHaveLength(1);
    expect(r.proposals[0]).toMatchObject({ source: 'Alpha.md', target: 'Beta.md' });
    expect(readBoard()).toHaveLength(0); // nothing written
  });

  test('dryRun:false appends one valid promote_unsung proposal for the unsung path only', async () => {
    const r = await runUnsungEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    expect(r.ok).toBe(true);
    expect(r.dryRun).toBe(false);
    expect(r.posted).toBe(1);
    expect(r.skipped).toEqual([]);

    const lines = readBoard();
    expect(lines).toHaveLength(1);
    const m = lines[0];
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.kind).toBe('vector_proposal');
    expect(m.payload.proposal_type).toBe('promote_unsung');
    expect(m.payload.source_entry).toBe('Alpha.md');
    expect(m.payload.target_entry).toBe('Beta.md');
    expect(m.payload.apply).toEqual({ op: 'add-link', entry: 'Alpha', target: 'Beta', type: 'connects-to' });
  });

  test('a second dryRun:false run is idempotent — the open proposal is not duplicated', async () => {
    await runUnsungEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    const after1 = readBoard().length;
    const r2 = await runUnsungEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    expect(r2.deduped).toBe(1);    // the open proposal suppresses the pair
    expect(r2.posted).toBe(0);
    expect(readBoard().length).toBe(after1); // nothing new appended
  });

  test('honest cap: --limit 0 falls back to the default; a tiny limit drops the rest, counted', async () => {
    // Two unsung paths now (Alpha→Beta and Delta→Beta); limit 1 emits one, drops one.
    writeFileSync(resolve(root, 'Delta.md'),
      '---\ntitle: Delta\ntype: concept\nstage: seed\npillars: [tools]\n---\n# Delta\n\nDelta also relies on [[Beta]] without a typed link.\n');
    const r = await runUnsungEmission({ palaceRoot: root, boardPath: board, dryRun: true, limit: 1 });
    expect(r.found).toBe(2);
    expect(r.eligible).toBe(2);
    expect(r.limit).toBe(1);
    expect(r.planned).toBe(1);
    expect(r.dropped).toBe(1);   // the over-limit one is NOT silently swallowed
  });

  test('missing palace root is reported, not thrown', async () => {
    const r = await runUnsungEmission({ palaceRoot: '', boardPath: board });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(500);
  });
});
