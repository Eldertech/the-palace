// live-feed.js — pure merge function for incoming SSE messages.
//
// mergeLive(currentMessages, incoming) → new array
//   - Deduplicates by `id`. If `incoming.id` already exists, replaces it.
//   - Sorted by `ts` ascending (ISO 8601 lexicographic — works for UTC timestamps).
//   - Stable: items with equal `ts` preserve their relative order.
//   - Items with missing/malformed `ts` sort to the end, consistently.
//
// mergeLiveBatch(currentMessages, incomingArray) → new array
//   - Equivalent to incomingArray.reduce(mergeLive, currentMessages).

const EPOCH_FALLBACK = '9999-99-99T99:99:99Z'; // sorts malformed ts to the end

function getTsSortKey(msg) {
  const ts = msg && msg.ts;
  if (typeof ts === 'string' && ts.length > 0) {
    // Validate it's at least ISO-ish; Date.parse returns NaN for garbage.
    if (!isNaN(Date.parse(ts))) return ts;
  }
  return EPOCH_FALLBACK;
}

/**
 * Merge one incoming message into the current list.
 *
 * @param {object[]} currentMessages
 * @param {object}   incoming
 * @returns {object[]} new sorted array
 */
export function mergeLive(currentMessages, incoming) {
  // Build a new array: replace existing entry if ids match, otherwise append.
  let replaced = false;
  const base = currentMessages.map((msg) => {
    if (msg.id !== undefined && msg.id === incoming.id) {
      replaced = true;
      return incoming;
    }
    return msg;
  });
  if (!replaced) {
    base.push(incoming);
  }

  // Stable sort by ts ascending.
  // Use a decorated sort to preserve original indices for stability.
  const decorated = base.map((msg, i) => ({ msg, i, key: getTsSortKey(msg) }));
  decorated.sort((a, b) => {
    if (a.key < b.key) return -1;
    if (a.key > b.key) return 1;
    return a.i - b.i; // stable: preserve original order for equal keys
  });
  return decorated.map((d) => d.msg);
}

/**
 * Merge an array of incoming messages into the current list.
 * Equivalent to incomingArray.reduce(mergeLive, currentMessages).
 *
 * @param {object[]} currentMessages
 * @param {object[]} incomingArray
 * @returns {object[]} new sorted array
 */
export function mergeLiveBatch(currentMessages, incomingArray) {
  return incomingArray.reduce(mergeLive, currentMessages);
}
