import { describe, it, expect } from 'vitest';
import {
  tableFromPayload,
  equationsFromPayload,
  choiceFromPayload,
  buildChoiceResponse,
} from '../../src/lib/richcontent.js';
import { validateMessage } from '@stigmergy/core/schema';

describe('tableFromPayload', () => {
  it('normalizes a well-formed table', () => {
    const t = tableFromPayload({
      table: { caption: 'sweep', columns: ['K', 'R'], rows: [['0', '0.0'], ['1', '0.9']] },
    });
    expect(t).toEqual({ caption: 'sweep', columns: ['K', 'R'], rows: [['0', '0.0'], ['1', '0.9']] });
  });
  it('coerces non-string cells and pads/truncates ragged rows to the column count', () => {
    const t = tableFromPayload({
      table: { columns: ['a', 'b', 'c'], rows: [[1, 2], ['x', 'y', 'z', 'extra']] },
    });
    expect(t.rows).toEqual([['1', '2', ''], ['x', 'y', 'z']]);
    expect(t.caption).toBeNull();
  });
  it('returns null for missing / malformed tables', () => {
    expect(tableFromPayload({})).toBeNull();
    expect(tableFromPayload(null)).toBeNull();
    expect(tableFromPayload({ table: { columns: [], rows: [['x']] } })).toBeNull();
    expect(tableFromPayload({ table: { columns: ['a'], rows: [] } })).toBeNull();
    expect(tableFromPayload({ table: { columns: ['a'] } })).toBeNull();
  });
});

describe('equationsFromPayload', () => {
  it('keeps entries with at least one of symbolic/worded', () => {
    const eqs = equationsFromPayload({
      equations: [
        { label: 'L', symbolic: 'a = b', worded: 'alpha = beta', where: [{ sym: 'a', def: 'alpha' }] },
        { worded: 'only worded' },
        { symbolic: 'only symbolic' },
      ],
    });
    expect(eqs).toHaveLength(3);
    expect(eqs[0]).toEqual({ label: 'L', symbolic: 'a = b', worded: 'alpha = beta', where: [{ sym: 'a', def: 'alpha' }] });
    expect(eqs[1].symbolic).toBeNull();
    expect(eqs[2].worded).toBeNull();
  });
  it('drops entries with neither form, and filters malformed where rows', () => {
    const eqs = equationsFromPayload({
      equations: [
        { label: 'empty' },
        { symbolic: 'x', where: [{ sym: 'x' }, { sym: 'y', def: 'why' }, 'junk'] },
      ],
    });
    expect(eqs).toHaveLength(1);
    expect(eqs[0].where).toEqual([{ sym: 'y', def: 'why' }]);
  });
  it('returns [] for absent / non-array', () => {
    expect(equationsFromPayload({})).toEqual([]);
    expect(equationsFromPayload(null)).toEqual([]);
    expect(equationsFromPayload({ equations: 'nope' })).toEqual([]);
  });
});

describe('choiceFromPayload', () => {
  it('normalizes a pick choice with per-option artifacts', () => {
    const c = choiceFromPayload({
      kind: 'choice',
      prompt: 'which?',
      options: [
        { id: 'A', label: 'first', artifact_path: 'x/a.wav', caption: 'cap' },
        { id: 'B', label: 'second' },
      ],
    });
    expect(c.mode).toBe('pick');
    expect(c.prompt).toBe('which?');
    expect(c.options).toEqual([
      { id: 'A', label: 'first', artifact_path: 'x/a.wav', caption: 'cap' },
      { id: 'B', label: 'second', artifact_path: null, caption: null },
    ]);
  });
  it('honors choice_mode: rank', () => {
    const c = choiceFromPayload({ kind: 'choice', choice_mode: 'rank', options: [{ id: 'A', label: 'a' }] });
    expect(c.mode).toBe('rank');
  });
  it('drops options missing id or label', () => {
    const c = choiceFromPayload({ kind: 'choice', options: [{ id: 'A' }, { label: 'x' }, { id: 'B', label: 'ok' }] });
    expect(c.options.map((o) => o.id)).toEqual(['B']);
  });
  it('returns null unless kind==="choice" with usable options', () => {
    expect(choiceFromPayload({ options: [{ id: 'A', label: 'a' }] })).toBeNull();
    expect(choiceFromPayload({ kind: 'choice', options: [] })).toBeNull();
    expect(choiceFromPayload({ kind: 'choice' })).toBeNull();
    expect(choiceFromPayload(null)).toBeNull();
  });
});

describe('buildChoiceResponse', () => {
  const card = {
    id: 'card-1', request_id: 'req-1', from: 'Action Potential Oscillator',
    session_id: 's-1', board: 'GENERAL',
  };

  it('builds a §2.2-valid REPLY for a pick', () => {
    const msg = buildChoiceResponse({ card, choice: 'ARRIVING' });
    expect(validateMessage(msg)).toEqual({ valid: true });
    expect(msg.type).toBe('REPLY');
    expect(msg.board).toBe('GENERAL');
    expect(msg.to).toBe('Action Potential Oscillator');
    expect(msg.re).toBe('card-1');
    expect(msg.payload).toEqual({ kind: 'choice_response', choice: 'ARRIVING' });
  });

  it('builds a §2.2-valid REPLY for a ranking, with notes', () => {
    const msg = buildChoiceResponse({ card, ranking: ['B', 'A', 'C'], notes: 'B is cleanest' });
    expect(validateMessage(msg)).toEqual({ valid: true });
    expect(msg.payload.ranking).toEqual(['B', 'A', 'C']);
    expect(msg.payload.notes).toBe('B is cleanest');
  });

  it('falls back to request_id for re, and stays valid with sparse cards', () => {
    const msg = buildChoiceResponse({ card: { request_id: 'req-9', from: 'X', board: 'TRICKSTER' }, choice: 'A' });
    expect(validateMessage(msg)).toEqual({ valid: true });
    expect(msg.re).toBe('req-9');
  });
});
