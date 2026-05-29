import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  extractMessagesFromTranscript,
  reconcilePendingRequests,
  buildCycleNote,
  processCycle,
} from '../../src/process-cycle.js';

// Build a one-line assistant transcript record whose text carries `fences`
// (each a fenced json block) plus optional usage.
function assistantLine(fences, usage) {
  const text = fences.map((f) => '```json\n' + JSON.stringify(f) + '\n```').join('\n\nsome prose\n\n');
  return JSON.stringify({ type: 'assistant', message: { usage: usage || {}, content: [{ type: 'text', text: `prose before\n${text}\nprose after` }] } });
}

describe('extractMessagesFromTranscript', () => {
  test('extracts a fenced message and accumulates usage across assistant turns', () => {
    const transcript = [
      assistantLine([{ id: 'm1', type: 'BROADCAST', payload: { x: 1 } }], { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100 }),
      assistantLine([{ id: 'm2', type: 'RESOURCE_REQUEST', payload: { resource: 'r' } }], { input_tokens: 20, output_tokens: 7, cache_read_input_tokens: 200 }),
    ].join('\n');
    const { messages, usage } = extractMessagesFromTranscript(transcript);
    expect(messages.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(usage.n_assistant_turns).toBe(2);
    expect(usage.total_input_tokens).toBe(30);
    expect(usage.total_output_tokens).toBe(12);
    expect(usage.cache_read_input_tokens_sum).toBe(300);
  });

  test('ignores non-assistant records', () => {
    const transcript = [
      JSON.stringify({ type: 'user', message: { content: [{ type: 'text', text: '```json\n{"id":"u1","type":"BROADCAST","payload":{}}\n```' }] } }),
      assistantLine([{ id: 'a1', type: 'BROADCAST', payload: {} }]),
    ].join('\n');
    const { messages, usage } = extractMessagesFromTranscript(transcript);
    expect(messages.map((m) => m.id)).toEqual(['a1']);
    expect(usage.n_assistant_turns).toBe(1);
  });

  test('de-duplicates by id (last occurrence wins)', () => {
    const transcript = [
      assistantLine([{ id: 'm1', type: 'BROADCAST', payload: { v: 'first' } }]),
      assistantLine([{ id: 'm1', type: 'BROADCAST', payload: { v: 'second' } }]),
    ].join('\n');
    const { messages } = extractMessagesFromTranscript(transcript);
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.v).toBe('second');
  });

  test('ignores fenced JSON whose type is not a message type', () => {
    const transcript = assistantLine([{ id: 'x', type: 'NOT_A_MESSAGE', payload: {} }, { id: 'ok', type: 'FLAG', payload: {} }]);
    const { messages } = extractMessagesFromTranscript(transcript);
    expect(messages.map((m) => m.id)).toEqual(['ok']);
  });

  test('drops fenced message objects without an id', () => {
    const transcript = assistantLine([{ type: 'BROADCAST', payload: {} }]);
    const { messages } = extractMessagesFromTranscript(transcript);
    expect(messages).toHaveLength(0);
  });

  test('captures nested braces in the payload (fence anchors the body)', () => {
    const nested = { id: 'n1', type: 'RESOURCE_REQUEST', payload: { options: [{ id: 'A' }, { id: 'B' }], meta: { deep: { x: 1 } } } };
    const { messages } = extractMessagesFromTranscript(assistantLine([nested]));
    expect(messages).toHaveLength(1);
    expect(messages[0].payload.meta.deep.x).toBe(1);
    expect(messages[0].payload.options).toHaveLength(2);
  });

  test('skips malformed transcript lines without throwing', () => {
    const transcript = ['not json at all', '', assistantLine([{ id: 'good', type: 'BROADCAST', payload: {} }])].join('\n');
    const { messages } = extractMessagesFromTranscript(transcript);
    expect(messages.map((m) => m.id)).toEqual(['good']);
  });
});

describe('reconcilePendingRequests', () => {
  const HOME = 'Test Steward';
  function ask(reqId, extra = {}) {
    return { type: 'RESOURCE_REQUEST', from: HOME, board: 'TRICKSTER', request_id: reqId, ts: '2026-05-27T10:00:00Z', payload: { resource: 'r', ...extra } };
  }
  function grant(re, payload = {}) {
    return { type: 'RESOURCE_GRANT', from: 'TRICKSTER', to: HOME, board: 'TRICKSTER', re, id: `grant-${re}`, ts: '2026-05-27T12:00:00Z', payload };
  }

  test('an unanswered ask stays pending', () => {
    const { stillPending, nowResolved } = reconcilePendingRequests([ask('req-1')], HOME);
    expect(nowResolved).toHaveLength(0);
    expect(stillPending.map((p) => p.request_id)).toEqual(['req-1']);
  });

  test('a matching GRANT resolves the ask with an outcome string', () => {
    const board = [ask('req-1'), grant('req-1', { option_id: 'OPT-A', notes: 'go' })];
    const { stillPending, nowResolved } = reconcilePendingRequests(board, HOME);
    expect(stillPending).toHaveLength(0);
    expect(nowResolved).toHaveLength(1);
    expect(nowResolved[0].outcome).toContain('GRANTED');
    expect(nowResolved[0].outcome).toContain('option_id=OPT-A');
    expect(nowResolved[0].outcome).toContain('notes: "go"');
    expect(nowResolved[0].resolved_by).toBe('grant-req-1');
  });

  test('a DENY resolves with a DENIED outcome', () => {
    const deny = { type: 'RESOURCE_DENY', from: 'TRICKSTER', to: HOME, board: 'TRICKSTER', re: 'req-2', id: 'd2', ts: '2026-05-27T12:00:00Z', payload: {} };
    const { nowResolved } = reconcilePendingRequests([ask('req-2'), deny], HOME);
    expect(nowResolved[0].outcome).toContain('DENIED');
    expect(nowResolved[0].outcome).toContain('(no option_id)');
  });

  test('normalizes payload.options to id strings', () => {
    const board = [ask('req-3', { options: [{ id: 'A', label: 'Alpha' }, 'RAW', { label: 'only-label' }] })];
    const { stillPending } = reconcilePendingRequests(board, HOME);
    expect(stillPending[0].options).toEqual(['A', 'RAW', 'only-label']);
  });

  test('only counts this steward\'s asks on the TRICKSTER board', () => {
    const board = [
      ask('mine'),
      { type: 'RESOURCE_REQUEST', from: 'Other Steward', board: 'TRICKSTER', request_id: 'theirs', ts: '2026-05-27T10:00:00Z', payload: {} },
      { type: 'RESOURCE_REQUEST', from: HOME, board: 'GENERAL', request_id: 'wrong-board', ts: '2026-05-27T10:00:00Z', payload: {} },
    ];
    const { stillPending } = reconcilePendingRequests(board, HOME);
    expect(stillPending.map((p) => p.request_id)).toEqual(['mine']);
  });
});

describe('buildCycleNote', () => {
  test('summarizes turns and tokens and names Path 2', () => {
    const note = buildCycleNote({ n_assistant_turns: 3, total_output_tokens: 900, cache_read_input_tokens_sum: 300 }, 'my-steward', 4);
    expect(note).toContain('my-steward cycle 4');
    expect(note).toContain('3 assistant turn');
    expect(note).toContain('Path 2');
  });
});

describe('processCycle (integration)', () => {
  let root;
  afterEach(() => { if (root) rmSync(root, { recursive: true, force: true }); root = null; });

  function makePalace() {
    root = mkdtempSync(path.join(tmpdir(), 'palace-pc-'));
    const agentDir = path.join(root, '_ops/agents/permanent/test-steward');
    mkdirSync(agentDir, { recursive: true });
    mkdirSync(path.join(root, '_ops/swarm/persistent'), { recursive: true });
    writeFileSync(path.join(agentDir, 'manifest.json'), JSON.stringify({
      agent_id: 'Test Steward', home: 'Test Steward', mode: 'long_duration_background',
      session_id: 'sess-1', model: { name: 'claude-opus-4-7' },
    }));
    writeFileSync(path.join(agentDir, 'state.json'), JSON.stringify({
      iteration: 0, last_active: null, last_read_cursor: null, pending_requests: [], resolved_requests: [],
    }));
    writeFileSync(path.join(agentDir, 'history.jsonl'), '');
    writeFileSync(path.join(root, '_ops/swarm/persistent/blackboard.jsonl'), '');
    return { agentDir: '_ops/agents/permanent/test-steward' };
  }

  test('extracts, validates, appends, updates state + history', () => {
    const { agentDir } = makePalace();
    const broadcast = {
      schema_version: '1.0', id: 'bc-1', ts: '2026-05-27T16:00:00-04:00',
      session_id: 'sess-1', from: 'Test Steward', to: '*', type: 'BROADCAST', board: 'GENERAL',
      payload: { subject: 'spinning up', content: 'hello' },
    };
    const transcriptPath = path.join(root, 'transcript.jsonl');
    writeFileSync(transcriptPath, assistantLine([broadcast], { output_tokens: 50, cache_read_input_tokens: 1000 }));

    const summary = processCycle({
      palaceRoot: root, transcriptPath, agentDir, cycleN: 1, iteration: 1, tsNow: '2026-05-27T16:05:00-04:00',
    });

    expect(summary.posted_ids).toEqual(['bc-1']);
    expect(summary.valid_count).toBe(1);
    expect(summary.invalid_ids).toHaveLength(0);

    const board = readFileSync(path.join(root, '_ops/swarm/persistent/blackboard.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(board).toHaveLength(1);
    expect(board[0].health.score).toBe('green');
    expect(board[0].health._orchestrator_metadata.dispatch_mode).toBe('claude-code-subagent');

    const state = JSON.parse(readFileSync(path.join(root, agentDir, 'state.json'), 'utf8'));
    expect(state.iteration).toBe(1);
    expect(state.last_active).toBe('2026-05-27T16:05:00-04:00');
    expect(state.last_read_cursor).toBe('bc-1');

    const history = readFileSync(path.join(root, agentDir, 'history.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(history.some((e) => e.event === 'CYCLE_1_SPAWN')).toBe(true);
    expect(history.some((e) => e.event === 'CYCLE_COMPLETE')).toBe(true);
  });

  test('an invalid emitted message is reported, not appended', () => {
    const { agentDir } = makePalace();
    const bad = { schema_version: '1.0', id: 'bad-1', type: 'BROADCAST', board: 'GENERAL', payload: {} }; // missing ts/from/to/session_id
    const transcriptPath = path.join(root, 'transcript.jsonl');
    writeFileSync(transcriptPath, assistantLine([bad]));

    const summary = processCycle({
      palaceRoot: root, transcriptPath, agentDir, cycleN: 1, iteration: 1, tsNow: '2026-05-27T16:05:00-04:00',
    });
    expect(summary.posted_ids).toHaveLength(0);
    expect(summary.invalid_ids).toEqual(['bad-1']);
    const board = readFileSync(path.join(root, '_ops/swarm/persistent/blackboard.jsonl'), 'utf8').trim();
    expect(board).toBe('');
  });
});
