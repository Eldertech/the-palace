// Integration: runStageEmission scans a temp palace for entries that have
// outgrown their §2 stage, plans, and (dryRun:false) appends valid promote_stage
// proposals (carrying set-stage) through the sanctioned validate-then-append path.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { runStageEmission } from '../../server/weave-emit.js';
import { validateMessage } from '@stigmergy/core/schema';

// A body well past the seed band (>900 chars).
const LONG_BODY = 'This entry has grown a real, cross-domain definition well past its seed band. '.repeat(14);

describe('runStageEmission — scan -> plan -> post', () => {
  let root, board;
  const readBoard = () =>
    (existsSync(board) ? readFileSync(board, 'utf8').trim().split('\n').filter(Boolean) : []).map((l) => JSON.parse(l));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'stage-emit-'));
    board = join(root, 'board.jsonl');
    // Grown: stage seed, 1 typed link, body past 900 chars -> seed->sprout candidate.
    writeFileSync(resolve(root, 'Grown.md'),
      `---\ntitle: Grown\ntype: concept\nstage: seed\npillars: [tools]\nlinks:\n  - target: "[[Beta]]"\n    type: connects-to\n---\n# Grown\n\n${LONG_BODY}\n`);
    // Tiny: stage seed, no links, short body -> never a candidate.
    writeFileSync(resolve(root, 'Tiny.md'),
      '---\ntitle: Tiny\ntype: concept\nstage: seed\npillars: [philosophy]\n---\n# Tiny\n\nshort.\n');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('dry run finds the outgrown entry and writes nothing', async () => {
    const r = await runStageEmission({ palaceRoot: root, boardPath: board, dryRun: true });
    expect(r.ok).toBe(true);
    expect(r.found).toBe(1);              // only Grown
    expect(r.eligible).toBe(1);
    expect(r.planned).toBe(1);
    expect(r.proposals[0].entry).toBe('Grown.md');
    expect(r.proposals[0].change).toMatch(/from seed to sprout/);
    expect(readBoard()).toHaveLength(0);
  });

  test('dryRun:false appends one valid promote_stage proposal carrying set-stage', async () => {
    const r = await runStageEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    expect(r.posted).toBe(1);
    const lines = readBoard();
    expect(lines).toHaveLength(1);
    const m = lines[0];
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.proposal_type).toBe('promote_stage');
    expect(m.payload.source_entry).toBe('Grown.md');
    expect(m.payload.apply).toEqual({ op: 'set-stage', entry: 'Grown', stage: 'sprout' });
  });

  test('a second dryRun:false run is idempotent — the open proposal is not duplicated', async () => {
    await runStageEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    const after1 = readBoard().length;
    const r2 = await runStageEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    expect(r2.deduped).toBe(1);
    expect(r2.posted).toBe(0);
    expect(readBoard().length).toBe(after1);
  });
});
