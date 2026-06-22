// Integration: runVectorTuningEmission (the server-side core behind
// POST /api/weave/emit-vector-tuning). The scan + generation are injected
// (scanImpl / generateImpl), so this never walks a real palace or spawns a
// model — it proves the dry-run/live split, the honest counts, idempotency,
// and that generation runs ONLY on a live run.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runVectorTuningEmission } from '../../server/weave-emit.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('runVectorTuningEmission — scan → select → (generate) → post', () => {
  let root, board;
  const readBoard = () =>
    (existsSync(board) ? readFileSync(board, 'utf8').trim().split('\n').filter(Boolean) : []).map((l) => JSON.parse(l));

  const candidates = [
    { path: 'Alpha.md', title: 'Alpha', currentVector: 'I remain Alpha.', reasons: ['stasis'] },
    { path: 'Beta.md', title: 'Beta', currentVector: '', reasons: ['missing'] },
  ];
  const scanImpl = () => ({ entriesScanned: 42, candidates });
  const generateImpl = (c) => ({
    ok: true, path: c.path, title: c.title, currentVector: c.currentVector,
    proposedVector: `I will keep deepening ${c.title} until it teaches the pattern itself.`, rationale: 'rest -> striving',
  });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'vt-run-'));
    board = join(root, 'board.jsonl');
    writeFileSync(board, '');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('dry run returns candidate counts, generates nothing, writes nothing', async () => {
    let genCalls = 0;
    const r = await runVectorTuningEmission({
      palaceRoot: root, boardPath: board, dryRun: true, scanImpl,
      generateImpl: () => { genCalls += 1; return { ok: true }; },
    });
    expect(r.ok).toBe(true);
    expect(r.entriesScanned).toBe(42);
    expect(r.found).toBe(2);
    expect(r.eligible).toBe(2);
    expect(r.planned).toBe(2);
    expect(r.candidates.map((c) => c.entry)).toEqual(['Alpha.md', 'Beta.md']);
    expect(genCalls).toBe(0);            // generation never runs on a dry run
    expect(readBoard()).toHaveLength(0); // and nothing is written
  });

  test('live run generates per candidate and posts valid vector_tuning proposals', async () => {
    const r = await runVectorTuningEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl });
    expect(r.posted).toBe(2);
    expect(r.genFailed).toBe(0);
    const lines = readBoard();
    expect(lines).toHaveLength(2);
    for (const m of lines) {
      expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
      expect(m.payload.proposal_type).toBe('vector_tuning');
      expect(m.payload.apply.op).toBe('set-vector');
    }
    expect(lines[0].payload.apply).toEqual({
      op: 'set-vector', entry: 'Alpha', text: 'I will keep deepening Alpha until it teaches the pattern itself.',
    });
  });

  test('an async generateImpl is awaited', async () => {
    const asyncGen = async (c) => generateImpl(c);
    const r = await runVectorTuningEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl: asyncGen });
    expect(r.posted).toBe(2);
  });

  test('a generation failure is counted (genFailed), not posted', async () => {
    const failing = (c) => (c.title === 'Beta' ? { ok: false, status: 422, error: 'no-op' } : generateImpl(c));
    const r = await runVectorTuningEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl: failing });
    expect(r.posted).toBe(1);
    expect(r.genFailed).toBe(1);
    expect(readBoard()).toHaveLength(1);
  });

  test('limit caps to the strongest candidates and reports the dropped overflow (no silent cap)', async () => {
    const r = await runVectorTuningEmission({ palaceRoot: root, boardPath: board, dryRun: true, limit: 1, scanImpl, generateImpl });
    expect(r.eligible).toBe(2);
    expect(r.planned).toBe(1);
    expect(r.dropped).toBe(1);
  });

  test('a second live run is idempotent — entries with an open proposal are not re-posted', async () => {
    await runVectorTuningEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl });
    const after1 = readBoard().length;
    const r2 = await runVectorTuningEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl });
    expect(r2.deduped).toBe(2);
    expect(r2.posted).toBe(0);
    expect(readBoard().length).toBe(after1);
  });
});
