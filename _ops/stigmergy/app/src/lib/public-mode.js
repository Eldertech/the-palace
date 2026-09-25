// The public read view is STIGMERGY's STATE deck built static — the same code
// behind a build switch (Loudon Live.md, the public surface settled 2026-09-25:
// two doors, this read view or git). This module is the one place that knows
// which build is running. In STIGMERGY, reads go to the /api server on the
// Mac; in the read view they go to the snapshot scripts/build-public.mjs wrote
// beside the page, and nothing can write.
//
// Pure and dependency-free, so the build script imports it too (pathId must
// agree on both sides).

const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};

// True only in a `VITE_PUBLIC=1` build. A build-time constant, so the write
// surfaces behind `!IS_PUBLIC` drop out of the read view's bundle.
export const IS_PUBLIC = ENV.VITE_PUBLIC === '1';

// Where the app is served from ('/' in STIGMERGY; e.g. '/the-palace/' on Pages).
export const BASE = typeof ENV.BASE_URL === 'string' ? ENV.BASE_URL : '/';

// A stable short id for a palace-relative path — the name of an entry's
// snapshot file. FNV-1a 32-bit over UTF-16 code units, as 8 hex digits; the
// build refuses a snapshot with a collision.
export function pathId(relPath) {
  let h = 0x811c9dc5;
  const s = String(relPath);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// A palace-relative path as URL path segments (spaces, em-dashes, arrows).
export function encodeSegments(relPath) {
  return String(relPath).split('/').map(encodeURIComponent).join('/');
}

// Where a palace file is fetched for inline display. `version` (the file's
// byte size, in practice) busts the cache when a file is rewritten in place;
// the snapshot never changes under a page, so the read view ignores it.
export function fileUrl(relPath, version = null) {
  if (IS_PUBLIC) return `${BASE}files/${encodeSegments(relPath)}`;
  const v = version === null || version === undefined || version === '' ? '' : `&v=${encodeURIComponent(version)}`;
  return `/api/file?path=${encodeURIComponent(relPath)}${v}`;
}

// Where "open this file" goes: in STIGMERGY, the Mac opens it natively (or
// reveals it in Finder); in the read view, the browser opens the file itself.
export function openUrl(relPath, { reveal = false } = {}) {
  if (IS_PUBLIC) return fileUrl(relPath);
  const base = `/api/open?path=${encodeURIComponent(relPath)}`;
  return reveal ? `${base}&reveal=1` : base;
}

// A snapshot JSON file in the read view (`data/entries.json`, …).
export function dataUrl(name) {
  return `${BASE}data/${name}`;
}
