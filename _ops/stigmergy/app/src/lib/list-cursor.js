// Keyboard cursor for a filtered list -- the arithmetic behind ↑ / ↓ / Enter
// in PULSE, kept pure so it can be tested without a DOM.
//
// The cursor is held as the highlighted row's *path*, not its index, so it
// follows the entry when a column sort reorders the list. When nothing has
// been picked by keyboard (or the picked row was filtered out), a non-empty
// query highlights the top match: type, then Enter, opens the best hit --
// the command-palette convention.

export function activeIndex(rows, cursorPath, query = '') {
  if (rows.length === 0) return -1;
  if (cursorPath != null) {
    const i = rows.findIndex((r) => r.path === cursorPath);
    if (i >= 0) return i;
  }
  return query.trim() ? 0 : -1;
}

// Step the cursor by delta, clamped to the list -- no wrap, because in a
// several-hundred-row index a jump from the top to the bottom loses you.
// From "nothing highlighted" either arrow lands on the first row.
export function stepCursor(index, delta, length) {
  if (length === 0) return -1;
  if (index < 0) return 0;
  return Math.max(0, Math.min(length - 1, index + delta));
}
