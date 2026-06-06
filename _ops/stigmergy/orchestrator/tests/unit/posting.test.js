// posting.test.js — outgoing-message validation against §2.2 + posting discipline §3.4.
//
// Critical: re-uses the imported v0.2 STIGMERGY validator. The 14 messages in
// the songline-2026-05-04-001 fixture must all pass.

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateForPosting, validateMessage } from '@stigmergy/core/schema';
import { readJsonl } from '@stigmergy/core/blackboard';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SONGLINE_FIXTURE = resolve(__dirname, '..', 'fixtures', 'blackboard', 'songline-2026-05-04-001.jsonl');

function makeMsg(over = {}) {
  return {
    schema_version: '1.0',
    id: 'test-001',
    ts: '2026-05-04T08:00:00Z',
    session_id: 'test-session',
    from: 'COOPERATION-1',
    to: '*',
    type: 'BROADCAST',
    board: 'GENERAL',
    health: {
      context_pct: 0.22,
      stop_reason: 'end_turn',
      iteration: 1,
      tokens_this_call: 310,
      model: 'claude-sonnet-4-6',
      score: 'green',
    },
    payload: { content: 'hello' },
    ...over,
  };
}

describe('imported v0.2 validator against songline fixture', () => {
  it('accepts every line of songline-2026-05-04-001 (14 messages, all §2.2-conformant)', () => {
    const messages = readJsonl(SONGLINE_FIXTURE);
    expect(messages.length).toBe(14);
    for (const m of messages) {
      const result = validateMessage(m);
      if (!result.valid) {
        // Surface the first failure with the offending message id for easy debugging.
        throw new Error(`§2.2 rejected ${m.id}: ${JSON.stringify(result.errors)}`);
      }
      expect(result.valid).toBe(true);
    }
  });
});

describe('validateForPosting — §3.4 posting discipline', () => {
  it('passes a clean BROADCAST', () => {
    const r = validateForPosting(makeMsg());
    expect(r.valid).toBe(true);
  });

  it('rejects a RESOURCE_REQUEST without top-level request_id (Gap 9)', () => {
    const r = validateForPosting(makeMsg({
      type: 'RESOURCE_REQUEST',
      board: 'TRICKSTER',
      to: 'TRICKSTER',
      payload: { rationale: 'test', request_id: 'req-001' }, // request_id only in payload — INVALID
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'request_id')).toBe(true);
  });

  it('accepts a RESOURCE_REQUEST with top-level request_id', () => {
    const r = validateForPosting(makeMsg({
      type: 'RESOURCE_REQUEST',
      board: 'TRICKSTER',
      to: 'TRICKSTER',
      request_id: 'req-001',
      payload: { rationale: 'test' },
    }));
    expect(r.valid).toBe(true);
  });

  it('rejects RESOURCE_REQUEST not on TRICKSTER board (board routing)', () => {
    const r = validateForPosting(makeMsg({
      type: 'RESOURCE_REQUEST',
      board: 'GENERAL',
      to: 'TRICKSTER',
      request_id: 'req-001',
      payload: { rationale: 'test' },
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'board')).toBe(true);
  });

  it('rejects RESOURCE_GRANT without re correlation', () => {
    const r = validateForPosting(makeMsg({
      type: 'RESOURCE_GRANT',
      board: 'TRICKSTER',
      from: 'TRICKSTER',
      to: 'COOPERATION-1',
      payload: { granted: true },
    }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 're')).toBe(true);
  });

  it('requires SPINNING UP as the first message of a session for an agent', () => {
    const priorMessages = []; // agent has never posted
    const r = validateForPosting(
      makeMsg({ type: 'FLAG', board: 'FLAGS', payload: { claim: 'x' } }),
      { priorMessages, agentId: 'COOPERATION-1' }
    );
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => /SPINNING UP|first message/.test(e.message))).toBe(true);
  });

  it('allows non-BROADCAST first message when prior messages exist', () => {
    const priorMessages = [makeMsg({ id: 'prior-spawn', type: 'BROADCAST', board: 'GENERAL' })];
    const r = validateForPosting(
      makeMsg({ id: 'next-flag', type: 'FLAG', board: 'FLAGS', payload: { claim: 'x', target_entries: ['Y'], confidence: 'high' } }),
      { priorMessages, agentId: 'COOPERATION-1' }
    );
    expect(r.valid).toBe(true);
  });

  it('rejects a duplicate FLAG with same claim+target_entries', () => {
    const f = makeMsg({ id: 'flag-1', type: 'FLAG', board: 'FLAGS', payload: { claim: 'X resonates with Y', target_entries: ['X', 'Y'], confidence: 'high' } });
    const dup = makeMsg({ id: 'flag-2', type: 'FLAG', board: 'FLAGS', payload: { claim: 'X resonates with Y', target_entries: ['X', 'Y'], confidence: 'medium' } });
    const r = validateForPosting(dup, { priorMessages: [makeMsg({ id: 'spawn', type: 'BROADCAST', board: 'GENERAL' }), f], agentId: 'COOPERATION-1' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => /duplicate FLAG/.test(e.message))).toBe(true);
  });

  it('rejects when underlying §2.2 validator rejects (forwarded errors)', () => {
    const r = validateForPosting(makeMsg({ schema_version: '0.legacy' }));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'schema_version')).toBe(true);
  });

  it('rejects messageVersion field (rejects schema-drift variant)', () => {
    const r = validateForPosting({ ...makeMsg(), messageVersion: 'audit-result' });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.path === 'messageVersion')).toBe(true);
  });
});
