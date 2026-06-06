// Unit tests for the [T] deck's pure interaction logic (trickster-keys.js).
//
// The deck's keydown handler is a thin dispatcher over resolveKey(), and both
// the keyboard and the mouse drive selection through toggleSelection(). Pulling
// that logic into a pure module is what lets the FULL key→action map be tested
// in the node env (no DOM) — true keystroke delivery is the Playwright spec's
// job (tests/e2e/trickster-keyboard.spec.js). Mirrors the codebase convention
// of unit-testing the deck's pure pieces (buildInbox, the grant builders).

import { describe, it, expect } from 'vitest';
import {
  toggleSelection,
  selectionFor,
  optionIdForKey,
  resolveKey,
} from '../../src/lib/trickster-keys.js';

// Two pending items in the shape buildInbox() produces. The first carries a
// steward lean; the second is leanless (a deliberately human-only call).
const LEANED = {
  request_id: 'req-A',
  recommended_option: { id: 'SHIP', label: 'SHIP — ship it' },
  options: [
    { id: 'SHIP', label: 'SHIP — ship it', recommended: true },
    { id: 'TWEAK', label: 'TWEAK — adjust' },
    { id: 'REJECT', label: 'REJECT — reject' },
  ],
};
const LEANLESS = {
  request_id: 'req-B',
  recommended_option: null,
  options: [
    { id: 'A', label: 'A — first' },
    { id: 'B', label: 'B — second' },
  ],
};
const LIST = [LEANED, LEANLESS];

describe('toggleSelection', () => {
  it('sets a request’s pick when nothing is chosen', () => {
    expect(toggleSelection({}, 'req-A', 'TWEAK')).toEqual({ 'req-A': 'TWEAK' });
  });

  it('clears the pick when the same option is toggled again (mirrors the click)', () => {
    const once = toggleSelection({}, 'req-A', 'TWEAK');
    expect(toggleSelection(once, 'req-A', 'TWEAK')).toEqual({});
  });

  it('replaces the pick when a different option is chosen', () => {
    const once = toggleSelection({}, 'req-A', 'TWEAK');
    expect(toggleSelection(once, 'req-A', 'SHIP')).toEqual({ 'req-A': 'SHIP' });
  });

  it('keeps other requests’ picks untouched', () => {
    const start = { 'req-A': 'SHIP' };
    expect(toggleSelection(start, 'req-B', 'A')).toEqual({ 'req-A': 'SHIP', 'req-B': 'A' });
  });

  it('returns a new object (does not mutate the input)', () => {
    const start = { 'req-A': 'SHIP' };
    const next = toggleSelection(start, 'req-A', 'TWEAK');
    expect(next).not.toBe(start);
    expect(start).toEqual({ 'req-A': 'SHIP' });
  });

  it('deletes rather than nulls a cleared key (no dead entries)', () => {
    const cleared = toggleSelection({ 'req-A': 'SHIP' }, 'req-A', 'SHIP');
    expect(Object.prototype.hasOwnProperty.call(cleared, 'req-A')).toBe(false);
  });
});

describe('selectionFor', () => {
  it('returns the chosen option id', () => {
    expect(selectionFor({ 'req-A': 'TWEAK' }, 'req-A')).toBe('TWEAK');
  });
  it('returns null when nothing is chosen', () => {
    expect(selectionFor({}, 'req-A')).toBe(null);
    expect(selectionFor(null, 'req-A')).toBe(null);
  });
});

describe('optionIdForKey', () => {
  it('maps 1-based number keys to option ids', () => {
    expect(optionIdForKey(LEANED, '1')).toBe('SHIP');
    expect(optionIdForKey(LEANED, '2')).toBe('TWEAK');
    expect(optionIdForKey(LEANED, '3')).toBe('REJECT');
  });
  it('returns null past the end of the options list', () => {
    expect(optionIdForKey(LEANED, '4')).toBe(null);
    expect(optionIdForKey(LEANLESS, '3')).toBe(null);
  });
  it('returns null for non-number keys and option-less items', () => {
    expect(optionIdForKey(LEANED, 'x')).toBe(null);
    expect(optionIdForKey(LEANED, '0')).toBe(null);
    expect(optionIdForKey({ request_id: 'req-C' }, '1')).toBe(null);
  });
});

describe('resolveKey — focus movement (existing j/k behavior preserved)', () => {
  const st = { list: LIST, focused: 0, selections: {} };
  it('j / ArrowDown → focus-next', () => {
    expect(resolveKey('j', st)).toEqual({ type: 'focus-next' });
    expect(resolveKey('ArrowDown', st)).toEqual({ type: 'focus-next' });
  });
  it('k / ArrowUp → focus-prev', () => {
    expect(resolveKey('k', st)).toEqual({ type: 'focus-prev' });
    expect(resolveKey('ArrowUp', st)).toEqual({ type: 'focus-prev' });
  });
  it('ignores everything when the list is empty', () => {
    expect(resolveKey('j', { list: [], focused: 0, selections: {} })).toBe(null);
    expect(resolveKey('Enter', { list: [], focused: -1, selections: {} })).toBe(null);
  });
});

describe('resolveKey — filing the lean (existing space/f behavior preserved)', () => {
  it('space files the focused card’s lean when it has one', () => {
    expect(resolveKey(' ', { list: LIST, focused: 0, selections: {} }))
      .toEqual({ type: 'file-lean', item: LEANED });
  });
  it('space is ignored on a leanless card (keystroke falls through)', () => {
    expect(resolveKey(' ', { list: LIST, focused: 1, selections: {} })).toBe(null);
  });
  it('f / F files all', () => {
    expect(resolveKey('f', { list: LIST, focused: 0, selections: {} })).toEqual({ type: 'file-all' });
    expect(resolveKey('F', { list: LIST, focused: 0, selections: {} })).toEqual({ type: 'file-all' });
  });
});

describe('resolveKey — 1-N pick (new override path)', () => {
  it('a number key picks the Nth option on the FOCUSED card', () => {
    expect(resolveKey('2', { list: LIST, focused: 0, selections: {} }))
      .toEqual({ type: 'select', requestId: 'req-A', optionId: 'TWEAK' });
    // Focus drives which card the key applies to.
    expect(resolveKey('2', { list: LIST, focused: 1, selections: {} }))
      .toEqual({ type: 'select', requestId: 'req-B', optionId: 'B' });
  });
  it('a number past the option count is ignored (falls through)', () => {
    expect(resolveKey('3', { list: LIST, focused: 1, selections: {} })).toBe(null);
  });
  it('defaults to the first card when focus is unset', () => {
    expect(resolveKey('1', { list: LIST, focused: -1, selections: {} }))
      .toEqual({ type: 'select', requestId: 'req-A', optionId: 'SHIP' });
  });
});

describe('resolveKey — Enter files the pick (new override path)', () => {
  it('Enter files the focused card’s current pick when one is selected', () => {
    expect(resolveKey('Enter', { list: LIST, focused: 0, selections: { 'req-A': 'TWEAK' } }))
      .toEqual({ type: 'file-pick', item: LEANED });
  });
  it('Enter is ignored when the focused card has no pick (falls through)', () => {
    expect(resolveKey('Enter', { list: LIST, focused: 0, selections: {} })).toBe(null);
    // A pick on a DIFFERENT card doesn’t arm Enter on the focused one.
    expect(resolveKey('Enter', { list: LIST, focused: 0, selections: { 'req-B': 'A' } })).toBe(null);
  });
});
