// Phase 1 — the sacred hard gate. Auditions and irreversible/destructive
// actions ALWAYS escalate, no matter what (this cannot be a rule).

import { describe, it, expect } from 'vitest';
import { auditionOrIrreversible } from '../../src/audition-gate.js';
import { parseRequest } from '../../src/parse.js';
import { readJsonl } from '../../../orchestrator/src/append.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX = (f) => resolve(__dirname, '../fixtures', f);

describe('audition gate — all 6 real audition resource flavors are blocked', () => {
  for (const resource of ['audition', 'content_audition', 'audition_verification', 'sensory_audition_gate']) {
    it(`blocks resource="${resource}"`, () => {
      const g = auditionOrIrreversible(parseRequest({ request_id: 'x', payload: { resource, blocking: true } }));
      expect(g.blocked).toBe(true);
      expect(g.kind).toBe('audition');
    });
  }

  it('blocks an audition even when blocking:false (gate ignores the blocking flag)', () => {
    const g = auditionOrIrreversible(parseRequest({ request_id: 'x', payload: { resource: 'audition', blocking: false } }));
    expect(g.blocked).toBe(true);
  });

  it('catches a sensory cue in decision text even if resource looks routine', () => {
    const g = auditionOrIrreversible(parseRequest({
      request_id: 'x',
      payload: { resource: 'directional_decision', blocking: false, decision_topic: 'does the sweep sound right — have a listen' },
    }));
    expect(g.blocked).toBe(true);
    expect(g.kind).toBe('audition');
  });
});

describe('audition gate — irreversible/destructive actions blocked (dormant on board)', () => {
  for (const resource of ['delete_files', 'publish_release', 'git_push', 'send_email', 'overwrite_page', 'drop_table_xyz']) {
    it(`blocks resource="${resource}"`, () => {
      const g = auditionOrIrreversible(parseRequest({ request_id: 'x', payload: { resource, blocking: false } }));
      expect(g.blocked).toBe(true);
      expect(g.kind).toBe('irreversible');
    });
  }
});

describe('audition gate — routine directional decisions pass through', () => {
  it('does not block a plain non-blocking directional fork', () => {
    const g = auditionOrIrreversible(parseRequest({
      request_id: 'x',
      payload: { resource: 'directional_decision', blocking: false, decision_topic: 'which sub-vector next', steward_recommendation: 'a' },
    }));
    expect(g.blocked).toBe(false);
  });
});

describe('audition gate — real board: every audition-flavored pending request is caught', () => {
  it('all variance-case auditions are blocked', () => {
    const variance = readJsonl(FIX('variance-cases.jsonl'));
    const auditions = variance
      .map(parseRequest)
      .filter((r) => /audition/i.test(r.resource || ''));
    expect(auditions.length).toBeGreaterThanOrEqual(3);
    for (const a of auditions) {
      expect(auditionOrIrreversible(a).blocked).toBe(true);
    }
  });
});
