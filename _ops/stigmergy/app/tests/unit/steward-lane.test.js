import { describe, test, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  slugFromDir, transcriptNameFor, stewardArgv, grantsWaitingFor, stewardRow,
} from '../../server/steward-lane.js';
import { extractMessagesFromTranscript } from '../../../orchestrator/src/process-cycle.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STUB = resolve(__dirname, '../fixtures/stub-steward-worker.mjs');

describe('steward-lane pure helpers', () => {
  test('slugFromDir takes the dir basename (relative or absolute)', () => {
    expect(slugFromDir('_ops/agents/permanent/shepard-tone-synthesizer')).toBe('shepard-tone-synthesizer');
    expect(slugFromDir('/abs/path/to/crystal-synthesizer')).toBe('crystal-synthesizer');
    expect(slugFromDir('')).toBe('');
  });

  test('transcriptNameFor is filesystem-safe (no colons/dots from the ts)', () => {
    const name = transcriptNameFor('shepard-tone-synthesizer', 5, '2026-06-05T22:00:00.000Z');
    expect(name).toBe('shepard-tone-synthesizer-cycle-5-2026-06-05T22-00-00-000Z.jsonl');
    expect(name).not.toMatch(/[:.](?!jsonl)/); // no stray : or . except the extension
  });

  test('stewardArgv carries the stream-json flags, the model, and the ps-liveness signature', () => {
    const argv = stewardArgv('PROMPT', 'claude-opus-4-7');
    expect(argv).toEqual([
      'claude', '-p', 'PROMPT',
      '--model', 'claude-opus-4-7',
      '--output-format', 'stream-json',
      '--verbose',
      '--permission-mode', 'bypassPermissions',
    ]);
    // a missing model falls back rather than emitting `--model undefined`
    expect(stewardArgv('P').includes('undefined')).toBe(false);
  });

  test('grantsWaitingFor counts grants that landed after the steward last ran (board-native, post-SSOT)', () => {
    const board = [
      { id: 'x-1', type: 'RESOURCE_REQUEST', from: 'X', board: 'TRICKSTER', request_id: 'x-1', payload: {} },
      { id: 'x-2', type: 'RESOURCE_REQUEST', from: 'X', board: 'TRICKSTER', request_id: 'x-2', payload: {} },
      { id: 'g-1', type: 'RESOURCE_GRANT', from: 'TRICKSTER', re: 'x-1', ts: '2026-06-05T00:00:00Z', payload: { option_id: 'A' } },
    ];
    // Never cycled (null last_active): the answered ask is unseen -> 1; x-2 has no grant.
    expect(grantsWaitingFor(board, 'X', { last_active: null })).toBe(1);
    // Last ran BEFORE the grant -> still waiting -> 1.
    expect(grantsWaitingFor(board, 'X', { last_active: '2026-06-04T00:00:00Z' })).toBe(1);
    // Last ran AFTER the grant -> consumed -> 0.
    expect(grantsWaitingFor(board, 'X', { last_active: '2026-06-06T00:00:00Z' })).toBe(0);
    // A foreign steward's grant does not count.
    expect(grantsWaitingFor(board, 'Y', { last_active: null })).toBe(0);
  });

  test('stewardRow maps state + board to a UI row (board-native, post-SSOT), and flags missing state', () => {
    const board = [
      { id: 's-1', type: 'RESOURCE_REQUEST', from: 'Shep', board: 'TRICKSTER', request_id: 's-1', payload: {} },
      { id: 'g-1', type: 'RESOURCE_GRANT', from: 'TRICKSTER', re: 's-1', ts: '2026-06-05T00:00:00Z', payload: { option_id: 'A' } },
    ];
    const entry = { agent_id: 'Shep', home: 'Shep', dir: '_ops/agents/permanent/shep' };
    // Pure-runtime state (post-cutover): no stewardship block, no decision arrays.
    // last_active is before the grant, so it is still waiting.
    const state = {
      iteration: 4, last_active: '2026-06-03T00:00:00Z', last_read_cursor: null,
      health: { score: 'green' },
    };
    // No palaceRoot here, so stage falls back to the manifest spawn snapshot.
    const manifest = { model: { name: 'claude-opus-4-7' }, stewardship: { stage_at_spawn: 'sprout' } };
    const row = stewardRow({ entry, state, manifest, board });
    expect(row).toMatchObject({
      agent_id: 'Shep', stage: 'sprout', iteration: 4,
      pending_count: 0,        // s-1 is granted -> not open (it's a grant waiting)
      grants_waiting: 1,       // s-1 granted, no cursor -> unconsumed
      health: 'green', model: 'claude-opus-4-7',
    });

    const missing = stewardRow({ entry, state: null, manifest: null, board });
    expect(missing.missing).toBe(true);
  });

  test('stewardRow carries due_next_run (same rule as the batch planner)', () => {
    const board = [];
    const entry = { agent_id: 'Shep', home: 'Shep', dir: '_ops/agents/permanent/shep' };
    const manifest = { model: { name: 'claude-opus-4-7' }, stewardship: { stage_at_spawn: 'growing' } };

    // last_active long ago + a non-skip stage (manifest spawn snapshot) -> due.
    const due = stewardRow({ entry, state: { iteration: 4, last_active: '2026-01-01T00:00:00Z' }, manifest, board });
    expect(due.due_next_run).toBe(true);

    // just-cycled -> debounced -> not due. (now-anchored; uses the live clock.)
    const recent = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago
    const fresh = stewardRow({ entry, state: { iteration: 4, last_active: recent }, manifest, board });
    expect(fresh.due_next_run).toBe(false);
  });
});

describe('stub steward worker (transcript contract)', () => {
  // Risk #1 guard: the stub MUST emit a transcript that processCycle's
  // extractMessagesFromTranscript parses to exactly one §2.2 message with no
  // health block (processCycle injects it). If this drifts, the integration
  // proof fails confusingly -- catch it here instead.
  test('emits a single parseable assistant record with one fenced message', () => {
    const res = spawnSync('node', [STUB, '--permission-mode', 'bypassPermissions', '--from', 'Unit Steward', '--msg-id', 'u-1'], { encoding: 'utf8' });
    expect(res.status).toBe(0);
    const { messages } = extractMessagesFromTranscript(res.stdout);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ id: 'u-1', from: 'Unit Steward', type: 'BROADCAST', board: 'GENERAL' });
    expect('health' in messages[0]).toBe(false);
  });
});
