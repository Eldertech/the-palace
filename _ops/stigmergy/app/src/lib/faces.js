// An entry's faces (CLAUDE.md § A page and its folder) — the text, the rich
// face, the scroll — as the reader's face switch sees them. The server reads
// which faces exist from the bundle (src/lib/bundle.js facesFor); this module
// only orders them, cycles them, and names where each one opens. The rich
// face's own top strip (_ops/rich-face/rich.html) carries the same switch in
// plain script; keep the order and words in step with it.

export const FACE_ORDER = ['text', 'rich', 'scroll'];

// Normalize a faces list: known faces only, in FACE_ORDER, text always first.
export function orderFaces(faces) {
  const have = new Set(Array.isArray(faces) ? faces : []);
  have.add('text');
  return FACE_ORDER.filter((f) => have.has(f));
}

// The face after `current`, wrapping — what F moves to.
export function nextFace(faces, current) {
  const list = orderFaces(faces);
  const i = list.indexOf(current);
  return list[(i + 1) % list.length];
}

// Where the rich face of an entry opens: `<base>rich/?entry=<Name>`, named by
// the entry's file stem (the rich handler's lookup key), under the app's base
// so the same link works in STIGMERGY and in the public read view.
export function richHref(entryPath, base = '/') {
  const stem = String(entryPath || '').split('/').pop().replace(/\.md$/, '');
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}rich/?entry=${encodeURIComponent(stem)}`;
}
