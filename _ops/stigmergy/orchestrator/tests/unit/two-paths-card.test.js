// Stage F Phase 3 verify gate: the emitted choice card passes the STRICT §2.2
// validator + posting discipline, choiceFromPayload normalizes it into two
// options each carrying its artifact, and the buildChoiceResponse round-trip
// (the pick) correlates back to the card — the correlation Phase 4 merges on.

import { describe, test, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildTwoPathsChoiceCard, emitTwoPathsChoiceCard, TWO_PATHS_CARD_BOARD } from '../../src/two-paths-card.js';
import { validateForPosting } from '../../src/posting.js';
import { readJsonl } from '../../src/append.js';
// The v0.4 rich-content `choice` primitive this card is consumed by.
import { choiceFromPayload, buildChoiceResponse } from '../../../app/src/lib/richcontent.js';

const fork = { request_id: 'apo-steward-004', from: 'Action Potential Oscillator', headline: 'Is the Kuramoto coupling audible?' };
const reconciliation = {
  request_id: 'apo-steward-004',
  status: 'complete',
  ready_for_choice: true,
  relation: 'orthogonality',
  built: [
    { option_id: 'K-SWEEP', label: 'K-SWEEP — single-axis sweep', artifact_path: 'Action Potential Oscillator/k-sweep.wav', summary: 'reads as a clear sync transition', from: fork.from },
    { option_id: 'DUAL-SWEEP', label: 'DUAL-SWEEP — two axes', artifact_path: 'Action Potential Oscillator/dual-sweep.wav', summary: 'busier; lock is harder to hear', from: fork.from },
  ],
  fell_back: [],
};

const card = buildTwoPathsChoiceCard({ reconciliation, fork, id: 'two-paths-apo-steward-004-fixed', ts: '2026-05-29T16:30:00-04:00' });

describe('buildTwoPathsChoiceCard — envelope', () => {
  test('lands on TRICKSTER, from the steward page, kind:choice / pick, carries request_id', () => {
    expect(card.board).toBe(TWO_PATHS_CARD_BOARD);
    expect(card.board).toBe('TRICKSTER');
    expect(card.from).toBe('Action Potential Oscillator');
    expect(card.type).toBe('BROADCAST');
    expect(card.payload.kind).toBe('choice');
    expect(card.payload.choice_mode).toBe('pick');
    expect(card.payload.request_id).toBe('apo-steward-004');
    expect(card.payload.options).toHaveLength(2);
  });

  test('passes the STRICT §2.2 validator + posting discipline', () => {
    const res = validateForPosting(card);
    expect(res.valid).toBe(true);
  });

  test('refuses to emit when the fork is not ready', () => {
    expect(() => buildTwoPathsChoiceCard({ reconciliation: { ...reconciliation, ready_for_choice: false }, fork }))
      .toThrow(/not ready_for_choice/);
    expect(() => buildTwoPathsChoiceCard({ reconciliation: { ...reconciliation, built: [reconciliation.built[0]] }, fork }))
      .toThrow(/exactly 2 built/);
  });
});

describe('choiceFromPayload normalizes the card (the rich-content surface consumes it)', () => {
  const norm = choiceFromPayload(card.payload);
  test('two options, each with its artifact + caption, pick mode', () => {
    expect(norm).not.toBeNull();
    expect(norm.mode).toBe('pick');
    expect(norm.options).toHaveLength(2);
    const k = norm.options.find((o) => o.id === 'K-SWEEP');
    expect(k.artifact_path).toBe('Action Potential Oscillator/k-sweep.wav');
    expect(k.caption).toMatch(/sync transition/);
  });
});

describe('the pick round-trips back to the card (Phase 4 correlation)', () => {
  test('buildChoiceResponse correlates re→card.id, to→steward, payload.choice→option', () => {
    const reply = buildChoiceResponse({ card, choice: 'K-SWEEP' });
    expect(reply.type).toBe('REPLY');
    expect(reply.re).toBe('two-paths-apo-steward-004-fixed');
    expect(reply.to).toBe('Action Potential Oscillator');
    expect(reply.payload).toEqual({ kind: 'choice_response', choice: 'K-SWEEP' });
  });
});

describe('emitTwoPathsChoiceCard — validated append to a temp board', () => {
  let dir;
  afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); dir = null; });

  test('appends a card that re-reads and re-validates clean', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'tp-card-'));
    const boardPath = path.join(dir, 'board.jsonl');
    const { posted } = emitTwoPathsChoiceCard({ reconciliation, fork, boardPath, id: 'two-paths-apo-1', ts: '2026-05-29T16:31:00-04:00' });
    expect(posted).toBe(true);
    const back = readJsonl(boardPath);
    expect(back).toHaveLength(1);
    expect(validateForPosting(back[0]).valid).toBe(true);
    expect(choiceFromPayload(back[0].payload).options).toHaveLength(2);
  });
});
