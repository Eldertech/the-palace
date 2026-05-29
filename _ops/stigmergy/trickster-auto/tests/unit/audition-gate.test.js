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

describe('audition gate — judges the RECOMMENDED OPTION, not the prose', () => {
  it('escalates when the recommended option IS an audition (blood-005 pattern)', () => {
    const g = auditionOrIrreversible(parseRequest({
      request_id: 'x',
      payload: {
        resource: 'directional_decision', blocking: false,
        decision_topic: "What's the next concrete move?",
        steward_recommendation: 'AUDITION-GATE-FIRST — render the smallest unit, pause for human audition',
        options: [{ id: 'AUDITION-GATE-FIRST', label: 'AUDITION-GATE-FIRST — …' }, { id: 'MAKER-DISPATCH', label: 'MAKER-DISPATCH — …' }],
      },
    }));
    expect(g.blocked).toBe(true);
    expect(g.signal).toMatch(/recommended_option/);
  });

  it('PASSES a fork whose recommendation is non-sensory even if its prose mentions a future audition (torus-005 pattern)', () => {
    const g = auditionOrIrreversible(parseRequest({
      request_id: 'x',
      payload: {
        resource: 'directional_decision', blocking: false,
        decision_topic: 'What advances me in cycle 3?',
        steward_recommendation: 'RESOLVE-SEVENTH-SURFACE — real catalog work; gives the eventual audition more to chew on',
        options: [{ id: 'PAUSE-FOR-AUDITION', label: 'PAUSE-FOR-AUDITION — …' }, { id: 'RESOLVE-SEVENTH-SURFACE', label: 'RESOLVE-SEVENTH-SURFACE — …' }],
      },
    }));
    expect(g.blocked).toBe(false); // recommended option is RESOLVE-SEVENTH-SURFACE, not the audition option
  });

  it('escalates when the decision TOPIC names an audition act (portamento topic pattern)', () => {
    const g = auditionOrIrreversible(parseRequest({
      request_id: 'x',
      payload: { resource: 'directional_decision', blocking: false, decision_topic: 'Audition the curated ear set, then pick the next move' },
    }));
    expect(g.blocked).toBe(true);
    expect(g.signal).toMatch(/topic/);
  });

  it('does NOT escalate on a bare audio word in the RATIONALE prose (no longer scanned)', () => {
    const g = auditionOrIrreversible(parseRequest({
      request_id: 'x',
      payload: {
        resource: 'directional_decision', blocking: false,
        decision_topic: 'which parameter is the primary sweep?',
        steward_recommendation: 'CENTROID-FREQ — the cleaner mapping',
        rationale: 'the result will be audible later and we will audition it eventually',
        options: [{ id: 'CENTROID-FREQ', label: 'CENTROID-FREQ — …' }],
      },
    }));
    expect(g.blocked).toBe(false);
  });
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
