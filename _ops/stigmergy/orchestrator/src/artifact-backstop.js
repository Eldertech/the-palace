// artifact-backstop.js — cycle-finalize guarantees for inline assets.
//
// Layers 2 and 3 of the "Trickster Inline Assets" handoff (2026-06-06). Layer 1
// made the Trickster card render payload.artifacts (the wire), and the steward
// prompt now makes declaring them mandatory — but lowest friction must not
// DEPEND on a steward remembering. This module is the safety net at finalize:
//
//   Layer 2 (backstop): diff the steward's bundle for media modified THIS cycle
//   and inject anything not already declared into the RESOURCE_REQUEST payload,
//   so a file that was rendered always reaches the card.
//
//   Layer 3 (lint): warn — never block — when a RESOURCE_REQUEST declares
//   artifacts but its prose never refers to them, so the players and the words
//   don't silently drift apart.
//
// Conservative by construction: the backstop fires only when a bundle dir
// exists AND a window lower bound is known (the previous cycle's last_active);
// it allowlists media extensions, dedups against everything the steward already
// declared, caps the injection, and reports the dropped count (no silent cap).

import { existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, relative, join, extname, basename } from 'node:path';

// Media the board can render inline (mirrors app/src/lib/artifact.js plus the
// open-native fallback types). Anything not here — .py, .faust, .dsp, .json,
// .md, .txt, .wt, .sh — is a script or intermediate, never auto-injected.
export const MEDIA_EXTENSIONS = new Set([
  'wav', 'mp3', 'ogg', 'm4a', 'flac',
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp',
  'html', 'htm',
  'mp4', 'webm', 'mov',
  'pdf',
]);

// Directories the walk never descends into.
const SKIP_DIRS = new Set(['node_modules', 'Archive', '__pycache__']);
const DEFAULT_CAP = 12;
const MAX_WALK_DEPTH = 6;

// Palace-relative, forward-slashed, no leading "./". The board stores paths
// this way (literal spaces, no percent-encoding), so dedup compares like-for-like.
export function normalizePath(p) {
  return String(p).trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/{2,}/g, '/');
}

export function isMediaPath(p) {
  if (typeof p !== 'string') return false;
  const ext = extname(p).slice(1).toLowerCase();
  return MEDIA_EXTENSIONS.has(ext);
}

// Every palace-relative path a message already declares: payload.artifacts[],
// the legacy payload.artifact_path, and any per-option choice artifact_path.
// These are exactly what Layer 1's card renders, so dedup against all of them.
export function declaredPathsOf(payload) {
  const out = new Set();
  if (!payload || typeof payload !== 'object') return out;
  const add = (p) => { if (typeof p === 'string' && p.trim()) out.add(normalizePath(p)); };
  if (Array.isArray(payload.artifacts)) for (const a of payload.artifacts) if (a && typeof a === 'object') add(a.path);
  add(payload.artifact_path);
  if (Array.isArray(payload.options)) for (const o of payload.options) if (o && typeof o === 'object') add(o.artifact_path);
  return out;
}

/**
 * Pure selection. Given candidate media (palace-relative path + mtimeMs), the
 * cycle window, and the already-declared set, return what to inject (newest
 * first) plus how many were dropped by the cap.
 *
 * Fires only with a real window lower bound — a null/NaN windowStartMs (first
 * cycle, or unparseable last_active) yields no injection, never the whole bundle.
 */
export function selectBackstopMedia({ candidates, windowStartMs, windowEndMs = Infinity, declared = new Set(), cap = DEFAULT_CAP }) {
  if (windowStartMs == null || Number.isNaN(windowStartMs)) {
    return { inject: [], dropped: 0, reason: 'no_window' };
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { inject: [], dropped: 0, reason: 'no_candidates' };
  }
  const inWindow = candidates
    .filter((c) => c && typeof c.path === 'string' && isMediaPath(c.path))
    .filter((c) => typeof c.mtimeMs === 'number' && c.mtimeMs > windowStartMs && c.mtimeMs <= windowEndMs)
    .filter((c) => !declared.has(normalizePath(c.path)))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  const inject = inWindow.slice(0, cap).map((c) => ({ path: normalizePath(c.path), caption: null }));
  return { inject, dropped: Math.max(0, inWindow.length - inject.length), reason: inject.length ? 'ok' : 'none_in_window' };
}

/**
 * Walk a bundle dir and return media files as [{ path (palace-relative),
 * mtimeMs }]. Returns [] if the dir does not exist. Skips dotfiles/dotdirs,
 * SKIP_DIRS, and anything past maxDepth.
 */
export function scanBundleMedia(palaceRoot, bundleRelDir, { maxDepth = MAX_WALK_DEPTH } = {}) {
  const absRoot = resolve(palaceRoot, bundleRelDir);
  if (!existsSync(absRoot)) return [];
  const out = [];
  const walk = (absDir, depth) => {
    if (depth > maxDepth) return;
    let entries;
    try { entries = readdirSync(absDir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      if (SKIP_DIRS.has(e.name)) continue;
      const abs = join(absDir, e.name);
      if (e.isDirectory()) { walk(abs, depth + 1); continue; }
      if (!e.isFile() || !isMediaPath(e.name)) continue;
      let st;
      try { st = statSync(abs); } catch { continue; }
      out.push({ path: normalizePath(relative(palaceRoot, abs)), mtimeMs: st.mtimeMs });
    }
  };
  walk(absRoot, 0);
  return out;
}

/**
 * Apply the backstop to one message. Only RESOURCE_REQUESTs with a payload are
 * touched; everything else passes through. Returns { payload, added, dropped,
 * reason }. Merges injected media after the steward's own declared artifacts,
 * promoting a lone artifact_path into the array so nothing is lost.
 */
export function applyArtifactBackstop(message, { candidates, windowStartMs, windowEndMs, cap } = {}) {
  if (!message || message.type !== 'RESOURCE_REQUEST' || !message.payload || typeof message.payload !== 'object') {
    return { payload: message?.payload, added: [], dropped: 0, reason: 'not_applicable' };
  }
  const declared = declaredPathsOf(message.payload);
  const { inject, dropped, reason } = selectBackstopMedia({ candidates, windowStartMs, windowEndMs, declared, cap });
  if (inject.length === 0) return { payload: message.payload, added: [], dropped, reason };

  const existing = Array.isArray(message.payload.artifacts) ? message.payload.artifacts.slice() : [];
  if (existing.length === 0 && typeof message.payload.artifact_path === 'string' && message.payload.artifact_path.trim()) {
    existing.push({ path: message.payload.artifact_path, caption: null });
  }
  const payload = { ...message.payload, artifacts: [...existing, ...inject] };
  return { payload, added: inject.map((a) => a.path), dropped, reason: 'injected' };
}

// Basename without its extension, lowercased. "01_dry_click.wav" → "01_dry_click".
function basenameStem(p) {
  const b = basename(String(p || ''));
  const dot = b.lastIndexOf('.');
  return (dot > 0 ? b.slice(0, dot) : b).toLowerCase();
}

/**
 * Layer 3 lint — warn-only. A RESOURCE_REQUEST that declares artifacts whose
 * prose (headline + ground + rationale) never refers to them. An artifact is
 * "referenced" generously, to keep false positives low: its basename stem, any
 * numeric token from the basename (e.g. "01"), or any caption word ≥ 4 chars
 * appearing in the prose all count. Returns null when there is nothing to lint
 * (not a RESOURCE_REQUEST, or no artifacts). `warn` is true only when artifacts
 * exist and NONE are referenced.
 */
export function lintArtifactReferences(message) {
  if (!message || message.type !== 'RESOURCE_REQUEST' || !message.payload) return null;
  const arts = Array.isArray(message.payload.artifacts) ? message.payload.artifacts : [];
  if (arts.length === 0) return null;

  const reqId = message.request_id || message.id || null;
  const prose = [message.payload.headline, message.payload.ground, message.payload.rationale]
    .filter((s) => typeof s === 'string')
    .join('\n')
    .toLowerCase();

  if (!prose.trim()) {
    return { request_id: reqId, artifact_count: arts.length, referenced: 0, warn: true, note: 'artifacts declared but no headline/ground/rationale prose' };
  }

  let referenced = 0;
  for (const a of arts) {
    const path = a && typeof a === 'object' ? a.path : a;
    const stem = basenameStem(path);
    const numTokens = (basename(String(path || '')).match(/\d+/g) || []);
    const captionWords = typeof (a && a.caption) === 'string'
      ? a.caption.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4)
      : [];
    const anchored =
      (stem && prose.includes(stem)) ||
      numTokens.some((n) => n.length >= 2 && prose.includes(n)) ||
      captionWords.some((w) => prose.includes(w));
    if (anchored) referenced += 1;
  }
  return { request_id: reqId, artifact_count: arts.length, referenced, warn: referenced === 0 };
}
