// Integration: runHubEmission scans a temp palace for hub candidates (concept
// entries over the inbound-degree threshold), plans, and (dryRun:false) appends
// valid promote_hub proposals through the sanctioned validate-then-append path.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { runHubEmission } from '../../server/weave-emit.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('runHubEmission — scan → plan → post', () => {
  let root, board;
  const readBoard = () =>
    (existsSync(board) ? readFileSync(board, 'utf8').trim().split('\n').filter(Boolean) : []).map((l) => JSON.parse(l));

  const concept = (name, targets = []) => {
    const links = targets.length
      ? 'links:\n' + targets.map((t) => `  - target: "[[${t}]]"\n    type: connects-to`).join('\n') + '\n'
      : '';
    writeFileSync(resolve(root, `${name}.md`),
      `---\ntitle: ${name}\ntype: concept\nstage: seed\npillars: [tools]\n${links}---\n# ${name}\n\nbody.\n`);
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'hub-emit-'));
    board = join(root, 'board.jsonl');
    // Center (concept) is pointed at by six concept entries → inbound 6 ≥ 5.
    concept('Center');
    for (const n of ['A', 'B', 'C', 'D', 'E', 'F']) concept(n, ['Center']);
    // Lonely has no inbound; never a candidate.
    concept('Lonely');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('dry run finds the over-threshold concept and writes nothing', async () => {
    const r = await runHubEmission({ palaceRoot: root, boardPath: board, dryRun: true });
    expect(r.ok).toBe(true);
    expect(r.found).toBe(1);                 // only Center
    expect(r.eligible).toBe(1);
    expect(r.planned).toBe(1);
    expect(r.proposals[0].entry).toBe('Center.md');
    expect(r.proposals[0].change).toMatch(/6 entries point to it/);
    expect(readBoard()).toHaveLength(0);
  });

  test('dryRun:false appends one valid promote_hub proposal carrying set-type', async () => {
    const r = await runHubEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    expect(r.posted).toBe(1);
    const lines = readBoard();
    expect(lines).toHaveLength(1);
    const m = lines[0];
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.proposal_type).toBe('promote_hub');
    expect(m.payload.source_entry).toBe('Center.md');
    expect(m.payload.apply).toEqual({ op: 'set-type', entry: 'Center', type: 'hub' });
  });

  test('a second dryRun:false run is idempotent — the open proposal is not duplicated', async () => {
    await runHubEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    const after1 = readBoard().length;
    const r2 = await runHubEmission({ palaceRoot: root, boardPath: board, dryRun: false });
    expect(r2.deduped).toBe(1);
    expect(r2.posted).toBe(0);
    expect(readBoard().length).toBe(after1);
  });

  test('threshold is honored (no candidate when set above the degree)', async () => {
    const r = await runHubEmission({ palaceRoot: root, boardPath: board, dryRun: true, threshold: 7 });
    expect(r.found).toBe(0);
    expect(r.proposals).toHaveLength(0);
  });
});
