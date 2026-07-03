import { describe, it, expect } from 'vitest';
import { buildCommitDag, laneColor } from '../../src/lib/commit-dag.js';
import { parseGraphLog, GRAPH_FORMAT, FIELD_SEP, RECORD_SEP } from '../../src/lib/git-log-parse.js';

// A hand-built merge DAG (newest first):
//   A ── B ─┬─ C ─┐
//           └─ D ─┴─ E(root)
// B is a merge of C and D; C and D both reparent to E; E is the convergence
// root. Expected columns: A0 B0 C0 D1 E0.
const node = (sha, parents, over = {}) => ({
  sha, shortSha: sha, parents, refs: [], subject: `commit ${sha}`, date: '', ...over,
});
const DAG = [
  node('A', ['B']),
  node('B', ['C', 'D']),
  node('C', ['E']),
  node('D', ['E']),
  node('E', [], { isRoot: true }),
];

const commitRows = (rows) => rows.filter((r) => r.type === 'commit');

describe('buildCommitDag', () => {
  it('assigns the expected lane columns', () => {
    const { rows } = buildCommitDag(DAG);
    const byСha = Object.fromEntries(commitRows(rows).map((r) => [r.commit.sha, r.col]));
    expect(byСha).toEqual({ A: 0, B: 0, C: 0, D: 1, E: 0 });
  });

  it('marks the root node with a distinct glyph', () => {
    const { rows } = buildCommitDag(DAG);
    const eRow = commitRows(rows).find((r) => r.commit.sha === 'E');
    expect(eRow.cells[eRow.col * 2].ch).toBe('◎');
    const aRow = commitRows(rows).find((r) => r.commit.sha === 'A');
    expect(aRow.cells[aRow.col * 2].ch).toBe('●');
  });

  it('opens a second lane at the merge with a fork connector (├──╮)', () => {
    const { rows, width } = buildCommitDag(DAG);
    expect(width).toBeGreaterThanOrEqual(2);
    const bIdx = rows.findIndex((r) => r.type === 'commit' && r.commit.sha === 'B');
    const link = rows[bIdx + 1];
    expect(link.type).toBe('link');
    expect(link.cells.some((c) => c.ch === '├')).toBe(true);
    expect(link.cells.some((c) => c.ch === '╮')).toBe(true);
  });

  it('converges D back into the E lane with a join connector (╯)', () => {
    const { rows } = buildCommitDag(DAG);
    const dIdx = rows.findIndex((r) => r.type === 'commit' && r.commit.sha === 'D');
    const link = rows[dIdx + 1];
    expect(link.type).toBe('link');
    expect(link.cells.some((c) => c.ch === '╯')).toBe(true);
  });

  it('emits no link row after the root', () => {
    const { rows } = buildCommitDag(DAG);
    const eIdx = rows.findIndex((r) => r.type === 'commit' && r.commit.sha === 'E');
    expect(rows[eIdx + 1]).toBeUndefined();
  });

  it('is empty-safe and gives the trunk phosphor green', () => {
    expect(buildCommitDag([]).rows).toEqual([]);
    expect(laneColor(0)).toBe('var(--phosphor)');
  });
});

describe('parseGraphLog (fixture round-trip)', () => {
  it('parses hash/parents/refs/subject and strips HEAD-> and origin decoration', () => {
    const rec = ['abc1234', 'def5678 99aa11', 'HEAD -> feature/x, origin/feature/x', 'merge: foo', '2026-07-03T10:00:00-04:00']
      .join(FIELD_SEP) + RECORD_SEP;
    const [n] = parseGraphLog(rec);
    expect(n.sha).toBe('abc1234');
    expect(n.parents).toEqual(['def5678', '99aa11']);
    expect(n.refs).toContain('feature/x');
    expect(n.refs).not.toContain('HEAD');
    expect(GRAPH_FORMAT).toContain('%P');
  });
  it('handles a root commit with no parents', () => {
    const rec = ['root123', '', '', 'initial', '2026-01-01T00:00:00Z'].join(FIELD_SEP) + RECORD_SEP;
    const [n] = parseGraphLog(rec);
    expect(n.parents).toEqual([]);
  });
});
