// Integration: runLabelEmission (the core behind POST /api/weave/emit-label).
// Scan + generation are injected, so this never walks a real palace or spawns a
// model — it proves the dry-run/live split, honest counts, idempotency, and that
// generation runs ONLY on a live run.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runLabelEmission } from '../../server/weave-emit.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('runLabelEmission — scan -> select -> (generate) -> post', () => {
  let root, board;
  const readBoard = () =>
    (existsSync(board) ? readFileSync(board, 'utf8').trim().split('\n').filter(Boolean) : []).map((l) => JSON.parse(l));

  const candidates = [
    { source: 'A.md', target: 'B.md', type: 'mirrors' },
    { source: 'A.md', target: 'C.md', type: 'deepens' },
  ];
  const scanImpl = () => ({ entriesScanned: 12, candidates });
  const generateImpl = (c) => ({
    ok: true, source: c.source, sourceTitle: c.source.replace(/\.md$/, ''),
    target: c.target, targetTitle: c.target.replace(/\.md$/, ''), type: c.type,
    label: c.type === 'mirrors' ? 'rhymes-with' : 'grounds', rationale: 'r',
  });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'label-run-'));
    board = join(root, 'board.jsonl');
    writeFileSync(board, '');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('dry run returns candidate counts, generates nothing, writes nothing', async () => {
    let genCalls = 0;
    const r = await runLabelEmission({
      palaceRoot: root, boardPath: board, dryRun: true, scanImpl,
      generateImpl: () => { genCalls += 1; return { ok: true }; },
    });
    expect(r.ok).toBe(true);
    expect(r.entriesScanned).toBe(12);
    expect(r.found).toBe(2);
    expect(r.planned).toBe(2);
    expect(r.candidates.map((c) => `${c.source}->${c.target}`)).toEqual(['A.md->B.md', 'A.md->C.md']);
    expect(genCalls).toBe(0);
    expect(readBoard()).toHaveLength(0);
  });

  test('live run generates per link and posts valid label_enrichment proposals', async () => {
    const r = await runLabelEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl });
    expect(r.posted).toBe(2);
    expect(r.genFailed).toBe(0);
    const lines = readBoard();
    expect(lines).toHaveLength(2);
    for (const m of lines) {
      expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
      expect(m.payload.proposal_type).toBe('label_enrichment');
      expect(m.payload.apply.op).toBe('set-label');
    }
    expect(lines[0].payload.apply).toEqual({ op: 'set-label', entry: 'A', target: 'B', type: 'mirrors', label: 'rhymes-with' });
  });

  test('a generation failure is counted (genFailed), not posted', async () => {
    const failing = (c) => (c.type === 'deepens' ? { ok: false, status: 422, error: 'no label' } : generateImpl(c));
    const r = await runLabelEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl: failing });
    expect(r.posted).toBe(1);
    expect(r.genFailed).toBe(1);
    expect(readBoard()).toHaveLength(1);
  });

  test('a second live run is idempotent — open links are not re-posted', async () => {
    await runLabelEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl });
    const after1 = readBoard().length;
    const r2 = await runLabelEmission({ palaceRoot: root, boardPath: board, dryRun: false, scanImpl, generateImpl });
    expect(r2.deduped).toBe(2);
    expect(r2.posted).toBe(0);
    expect(readBoard().length).toBe(after1);
  });
});
