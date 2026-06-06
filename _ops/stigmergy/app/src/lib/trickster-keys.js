// trickster-keys.js — the [T] deck's pure interaction logic.
//
// No React, no DOM, no I/O — so the keyboard layer and the lifted selection
// model are unit-testable in the node env, the same way buildInbox() and the
// grant builders already are. The deck's keydown handler is a thin dispatcher
// over resolveKey(); the selection helpers are shared by BOTH the keyboard and
// the mouse path, so the toggle behavior has ONE definition (single source of
// truth) regardless of which input drove it.
//
// Selection model: the deck owns a plain object `selections` keyed by
// request_id → chosen option id. Lifting it out of TricksterCard is what lets
// `1`-`N` (pick the Nth option) and `Enter` (file the current pick) drive the
// same state a mouse click drives. (See the Phase-2 handoff: 1-N/Enter is the
// override path; the steward's lean + `space` stays the primary one.)

// Toggle a request's chosen option. Choosing the already-chosen option clears
// it (mirrors the option button's click-to-deselect), so a repeated number key
// behaves exactly like clicking the same option twice. Returns a NEW object;
// the cleared key is deleted rather than set to null so the map never carries
// dead entries.
export function toggleSelection(selections, requestId, optionId) {
  const prev = selections || {};
  const next = { ...prev };
  if (next[requestId] === optionId) delete next[requestId];
  else next[requestId] = optionId;
  return next;
}

// The current pick for a request (option id, or null when nothing is chosen).
export function selectionFor(selections, requestId) {
  const v = selections && selections[requestId];
  return v == null ? null : v;
}

// Map a number key ('1'..'9') to the option id at that 1-based position on an
// item, or null when the key is out of range / the item has no such option.
// This is the `1`-`N` pick: key '1' → options[0].id, etc.
export function optionIdForKey(item, key) {
  if (!item || !Array.isArray(item.options)) return null;
  if (!/^[1-9]$/.test(key)) return null;
  const opt = item.options[parseInt(key, 10) - 1];
  return opt && opt.id != null ? opt.id : null;
}

// Resolve a keydown into a deck action (or null to ignore). Keeping this pure
// means the FULL key→action mapping is covered by unit tests; the deck only
// owns the side effects (focus state, POSTs). The caller is responsible for the
// "don't hijack typing in a textarea/input" guard and for calling
// preventDefault() whenever this returns a non-null action.
//
// state: { list: pending_requests[], focused: int, selections: object }
// Actions:
//   { type: 'focus-next' }                          j / ArrowDown
//   { type: 'focus-prev' }                          k / ArrowUp
//   { type: 'file-lean', item }                     space — file the lean
//   { type: 'file-all' }                            f — file every leaned card
//   { type: 'select', requestId, optionId }         1-N — pick the Nth option
//   { type: 'file-pick', item }                     Enter — file the current pick
//   null                                            anything else / nothing to do
export function resolveKey(key, state) {
  const list = state && state.list;
  if (!Array.isArray(list) || list.length === 0) return null;
  const len = list.length;
  // Clamp focus into range (the list shrinks as cards are filed); default to
  // the first card when focus is unset, matching the space handler.
  const focused = state.focused < 0 ? 0 : Math.min(state.focused, len - 1);
  const item = list[focused];

  if (key === 'j' || key === 'ArrowDown') return { type: 'focus-next' };
  if (key === 'k' || key === 'ArrowUp') return { type: 'focus-prev' };
  if (key === ' ') {
    // Space files the steward's lean — only meaningful on a leaned card, so a
    // leanless card lets the keystroke fall through (no preventDefault).
    return item && item.recommended_option ? { type: 'file-lean', item } : null;
  }
  if (key === 'f' || key === 'F') return { type: 'file-all' };
  if (/^[1-9]$/.test(key)) {
    const optionId = optionIdForKey(item, key);
    return optionId ? { type: 'select', requestId: item.request_id, optionId } : null;
  }
  if (key === 'Enter') {
    // Enter files the focused card's current pick — the override path. With no
    // pick there's nothing to file, so the keystroke falls through.
    const pick = item && selectionFor(state.selections, item.request_id);
    return pick ? { type: 'file-pick', item } : null;
  }
  return null;
}
