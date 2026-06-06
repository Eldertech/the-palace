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

  test('grantsWaitingFor counts answered asks not yet in resolved_requests', () => {
    const board = [
      { type: 'RESOURCE_REQUEST', from: 'X', board: 'TRICKSTER', request_id: 'x-1', payload: {} },
      { type: 'RESOURCE_REQUEST', from: 'X', board: 'TRICKSTER', request_id: 'x-2', payload: {} },
      { type: 'RESOURCE_GRANT', re: 'x-1', payload: { option_id: 'A' } },
    ];
    // x-1 answered + unconsumed -> 1; x-2 has no grant.
    expect(grantsWaitingFor(board, 'X', { resolved_requests: [] })).toBe(1);
    // once x-1 is recorded resolved, it stops counting.
    expect(grantsWaitingFor(board, 'X', { resolved_requests: [{ request_id: 'x-1' }] })).toBe(0);
    // a foreign steward's grant does not count.
    expect(grantsWaitingFor(board, 'Y', { resolved_requests: [] })).toBe(0);
  });

  test('stewardRow maps state + board to a UI row, and flags missing state', () => {
    const board = [
      { type: 'RESOURCE_REQUEST', from: 'Shep', board: 'TRICKSTER', request_id: 's-1', payload: {} },
      { type: 'RESOURCE_GRANT', re: 's-1', payload: { option_id: 'A' } },
    ];
    const entry = { agent_id: 'Shep', home: 'Shep', dir: '_ops/agents/permanent/shep' };
    const state = {
      iteration: 4, last_active: '2026-06-03T00:00:00Z',
      stewardship: { stage_at_last_activation: 'sprout' },
      pending_requests: [{ request_id: 's-1' }], resolved_requests: [], health: { score: 'green' },
    };
    const manifest = { model: { name: 'claude-opus-4-7' } };
    const row = stewardRow({ entry, state, manifest, board });
    expect(row).toMatchObject({
      agent_id: 'Shep', stage: 'sprout', iteration: 4, pending_count: 1,
      grants_waiting: 1, health: 'green', model: 'claude-opus-4-7',
    });

    const missing = stewardRow({ entry, state: null, manifest: null, board });
    expect(missing.missing).toBe(true);
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
