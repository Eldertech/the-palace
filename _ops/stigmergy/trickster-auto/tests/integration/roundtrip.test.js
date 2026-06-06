// Phase 3 verify gate: a granted request produces a §2.2-valid grant message on
// a test board with correct correlation + provenance, and STIGMERGY recognizes
// it as an auto-decided response (the request drops out of the inbox).

import { describe, it, expect, beforeAll } from 'vitest';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, copyFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readJsonl, appendMessage } from '@stigmergy/core/blackboard';
import { validateMessage } from '@stigmergy/core/schema';
import { validateForPosting } from '@stigmergy/core/schema';
import { buildInbox as appBuildInbox } from '../../../app/src/lib/inbox.js';
import { buildInbox } from '../../src/inbox.js';
import { loadRuleset } from '../../src/ruleset.js';
import { evaluateBatch } from '../../src/evaluate.js';
import { buildDecisionMessage, postDecisions } from '../../src/decide.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX = (f) => resolve(__dirname, '../fixtures', f);
const NOW = '2026-05-29T20:00:00Z';
const ruleset = loadRuleset();

describe('buildDecisionMessage — provenance + correlation + schema', () => {
  it('builds a §2.2-valid grant with auto provenance and correct re', () => {
    const board = readJsonl(FIX('mini-board.jsonl'));
    const { pending } = buildInbox(board);
    const reqD = pending.find((p) => p.request_id === 'req-D');
    const results = evaluateBatch([reqD], ruleset, null);
    const verdict = results[0].verdict;
    expect(verdict.verb).toBe('auto-grant');

    const msg = buildDecisionMessage(reqD, verdict, { now: NOW });
    expect(msg.type).toBe('RESOURCE_GRANT');
    expect(msg.re).toBe('req-D');
    expect(msg.from).toBe('TRICKSTER (auto)');
    expect(msg.payload.decided_by).toBe('auto');
    expect(msg.payload.option_id).toBe('prototype-faust');
    expect(msg.payload.granted).toBe(true);

    // Passes BOTH the strict §2.2 validator and the posting-discipline check.
    expect(validateMessage(msg).valid).toBe(true);
    expect(validateForPosting(msg).valid).toBe(true);
  });

  it('builds a §2.2-valid deny with a reason (dormant web_search over budget)', () => {
    const board = readJsonl(FIX('mini-board.jsonl'));
    const { pending } = buildInbox(board);
    const reqF = pending.find((p) => p.request_id === 'req-F'); // web_search
    // Force over-budget so the dormant deny rule fires.
    const results = evaluateBatch([reqF], ruleset, { perResource: { web_search: { used: 5, max: 5 } } });
    const verdict = results[0].verdict;
    expect(verdict.verb).toBe('auto-deny');
    const msg = buildDecisionMessage(reqF, verdict, { now: NOW });
    expect(msg.type).toBe('RESOURCE_DENY');
    expect(msg.payload.granted).toBe(false);
    expect(msg.payload.reason).toBeTruthy();
    expect(validateMessage(msg).valid).toBe(true);
    expect(validateForPosting(msg).valid).toBe(true);
  });
});

describe('postDecisions — round-trip onto a test board', () => {
  let tmpBoard;
  let posted;

  beforeAll(() => {
    const dir = mkdtempSync(join(tmpdir(), 'trickster-auto-'));
    tmpBoard = join(dir, 'board.jsonl');
    copyFileSync(FIX('mini-board.jsonl'), tmpBoard);
    const { pending } = buildInbox(readJsonl(tmpBoard));
    const results = evaluateBatch(pending, ruleset, null);
    posted = postDecisions(results, { boardPath: tmpBoard, now: NOW });
  });

  it('posts exactly the auto-grant decisions (mini-board has 1 grantable: req-D)', () => {
    expect(posted.length).toBe(1);
    expect(posted[0].re).toBe('req-D');
  });

  it('the posted grant is on the board and correlates to req-D with auto provenance', () => {
    const after = readJsonl(tmpBoard);
    const grant = after.find((m) => m.type === 'RESOURCE_GRANT' && m.re === 'req-D' && m.from === 'TRICKSTER (auto)');
    expect(grant).toBeTruthy();
    expect(grant.payload.decided_by).toBe('auto');
    expect(grant.payload.option_id).toBe('prototype-faust');
  });

  it('STIGMERGY (app inbox builder) treats it as answered — req-D drops out of pending', () => {
    const after = readJsonl(tmpBoard);
    const inbox = appBuildInbox(after);
    const stillPending = inbox.pending_requests.map((r) => r.request_id);
    expect(stillPending).not.toContain('req-D'); // auto-decided → resolved
    // req-A (blocking audition) was NEVER granted and remains pending for the human.
    expect(stillPending).toContain('req-A');
  });

  it('every posted message validates strictly (§2.2) — no third write path drift', () => {
    for (const m of posted) {
      expect(validateMessage(m).valid).toBe(true);
    }
  });
});

describe('audition safety on the write path — auditions are NEVER posted', () => {
  it('postDecisions skips every audition/escalation (req-A, req-C never produce a grant/deny)', () => {
    const board = readJsonl(FIX('mini-board.jsonl'));
    const { pending } = buildInbox(board);
    const results = evaluateBatch(pending, ruleset, null);
    const dir = mkdtempSync(join(tmpdir(), 'trickster-auto-safety-'));
    const tb = join(dir, 'board.jsonl');
    copyFileSync(FIX('mini-board.jsonl'), tb);
    const wrote = postDecisions(results, { boardPath: tb, now: NOW });
    const reIds = wrote.map((m) => m.re);
    expect(reIds).not.toContain('req-A'); // blocking audition
    expect(reIds).not.toContain('req-C'); // non-blocking audition
  });
});
