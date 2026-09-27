import { describe, it, expect } from 'vitest';
import { activeIndex, stepCursor } from '../../src/lib/list-cursor.js';

const ROWS = [{ path: 'a.md' }, { path: 'b.md' }, { path: 'c.md' }];

describe('activeIndex', () => {
  it('highlights nothing on an unfiltered list until the keyboard picks a row', () => {
    expect(activeIndex(ROWS, null, '')).toBe(-1);
  });

  it('highlights the top match as soon as there is a query', () => {
    expect(activeIndex(ROWS, null, 'kur')).toBe(0);
    expect(activeIndex(ROWS, null, '   ')).toBe(-1);
  });

  it('follows the picked path, wherever a sort has moved it', () => {
    expect(activeIndex(ROWS, 'c.md', '')).toBe(2);
    expect(activeIndex([ROWS[2], ROWS[0], ROWS[1]], 'c.md', '')).toBe(0);
  });

  it('falls back when the picked row has been filtered out', () => {
    expect(activeIndex(ROWS, 'gone.md', 'x')).toBe(0);
    expect(activeIndex(ROWS, 'gone.md', '')).toBe(-1);
  });

  it('is -1 for an empty list', () => {
    expect(activeIndex([], 'a.md', 'x')).toBe(-1);
  });
});

describe('stepCursor', () => {
  it('lands on the first row from nothing, whichever arrow', () => {
    expect(stepCursor(-1, 1, 3)).toBe(0);
    expect(stepCursor(-1, -1, 3)).toBe(0);
  });

  it('moves one row and clamps at both ends (no wrap)', () => {
    expect(stepCursor(0, 1, 3)).toBe(1);
    expect(stepCursor(2, 1, 3)).toBe(2);
    expect(stepCursor(1, -1, 3)).toBe(0);
    expect(stepCursor(0, -1, 3)).toBe(0);
  });

  it('is -1 for an empty list', () => {
    expect(stepCursor(0, 1, 0)).toBe(-1);
  });
});
