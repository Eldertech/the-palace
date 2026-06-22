// Integration: the vector-tuning emitter CLI end-to-end. Generation is stubbed
// via WEAVE_VT_GENERATE_STUB (the CLI runs as its own subprocess), so the test
// is deterministic and never spawns a real `claude -p`. Proves scan → select →
// generate → build → (--post) append + the idempotent re-run.

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMessage } from '@stigmergy/core/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, '..', '..');
const SCRIPT = join(APP_ROOT, 'scripts', 'weave-emit-vector-tuning.mjs');

const STUB_VECTOR = 'I will keep sharpening Alpha until it teaches the pattern itself.';
const STUB = JSON.stringify({ proposed_vector: STUB_VECTOR, rationale: 'rest → striving' });

describe('weave-emit-vector-tuning CLI', () => {
  let root, board;
  const run = (...args) => execFileSync('node', [SCRIPT, '--root', root, '--board', board, ...args], {
    cwd: APP_ROOT, encoding: 'utf8', env: { ...process.env, WEAVE_VT_GENERATE_STUB: STUB },
  });
  const readBoard = () =>
    (existsSync(board) ? readFileSync(board, 'utf8').trim().split('\n').filter(Boolean) : []).map((l) => JSON.parse(l));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'vt-emit-'));
    board = join(root, 'board.jsonl');
    // Alpha has a stasis + thin vector (a candidate); Beta has a healthy striving
    // vector (must NOT be flagged), so --scan finds exactly one.
    writeFileSync(resolve(root, 'Alpha.md'),
      '---\ntitle: Alpha\ntype: concept\nstage: seed\npillars: [tools]\nforward_vector: "I remain the Alpha placeholder."\n---\n# Alpha\n\nAlpha couples to Beta.\n');
    writeFileSync(resolve(root, 'Beta.md'),
      '---\ntitle: Beta\ntype: concept\nstage: growing\npillars: [philosophy]\nforward_vector: "I will keep weaving Beta across domains so every learner can feel the connection and carry it onward."\n---\n# Beta\n\nbody.\n');
  });
  afterEach(() => { rmSync(root, { recursive: true, force: true }); });

  test('--scan dry run generates + shows the before→after but writes nothing', () => {
    const out = run('--scan');
    expect(out).toMatch(/dry run/);
    expect(out).toMatch(/Alpha\.md/);
    expect(out).toContain(STUB_VECTOR);     // the proposed "to:" line
    expect(readBoard()).toHaveLength(0);    // no --post → no write
  });

  test('--scan --post emits a valid vector_tuning proposal for the candidate only', () => {
    run('--scan', '--post');
    const b = readBoard();
    expect(b).toHaveLength(1);              // Alpha only (Beta is healthy)
    const m = b[0];
    expect(validateMessage(m).valid, JSON.stringify(validateMessage(m))).toBe(true);
    expect(m.payload.kind).toBe('vector_proposal');
    expect(m.payload.proposal_type).toBe('vector_tuning');
    expect(m.payload.source_entry).toBe('Alpha.md');
    expect(m.payload.apply).toEqual({ op: 'set-vector', entry: 'Alpha', text: STUB_VECTOR });
  });

  test('a second --scan --post run is idempotent — the open proposal is not duplicated', () => {
    run('--scan', '--post');
    const after1 = readBoard().length;
    const out2 = run('--scan', '--post');
    expect(out2).toMatch(/1 already proposed/);
    expect(readBoard().length).toBe(after1);
  });

  test('--entry targets one named entry directly', () => {
    const out = run('--entry', 'Alpha');
    expect(out).toMatch(/targeted entry "Alpha"/);
    expect(out).toContain(STUB_VECTOR);
    expect(readBoard()).toHaveLength(0);
  });
});
