// URL-driven entry navigation for STATE.
//
// Stage A's smoke test surfaced a real navigation gap: following a wikilink
// dropped the previous entry from any history STIGMERGY tracked, the chrome
// only offered "back to pulse," and the browser back button did nothing
// because nothing was ever pushed to history.
//
// The fix routes navigation through the URL: `?entry=<rel-path>` (with an
// optional `&edit=1`) IS the source of truth for which entry is open. The
// React state mirrors the URL, popstate updates the React state, and clicks
// pushState. Browser back/forward then work for free; entries are bookmark-
// able; deep-links land.
//
// Pure helpers + a hook. The hook intentionally keeps the URL surface
// minimal (only `entry` and `edit`); other query params (?deck=, ?demo=)
// pass through untouched so the existing e2e tests don't break.

import { useCallback, useEffect, useRef, useState } from 'react';

// Parse `?commit=<sha>` from the URL. Returns the sha or null. SSR-safe.
export function parseCommitFromUrl(searchString) {
  if (typeof searchString !== 'string') return null;
  const sha = new URLSearchParams(searchString).get('commit');
  return sha && sha !== '' ? sha : null;
}

// Build a new search string preserving all params except `commit`, which is
// overwritten by `sha` (or cleared when sha is null).
export function buildCommitSearch(searchString, sha) {
  const params = new URLSearchParams(searchString || '');
  params.delete('commit');
  if (sha) params.set('commit', sha);
  const s = params.toString();
  return s === '' ? '' : `?${s}`;
}

// React hook: keeps `commit` in sync with the URL. pushState on open, native
// history.back() for the [<] back chip in commit-detail chrome.
export function useCommitNavigation() {
  const initial = typeof window === 'undefined'
    ? null
    : parseCommitFromUrl(window.location.search);
  const [sha, setSha] = useState(initial);
  const fromPop = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    function onPop() {
      fromPop.current = true;
      setSha(parseCommitFromUrl(window.location.search));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (fromPop.current) { fromPop.current = false; return; }
    const nextSearch = buildCommitSearch(window.location.search, sha);
    const currentSearch = window.location.search || '';
    if (nextSearch === currentSearch) return;
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    window.history.pushState({ commit: sha }, '', nextUrl);
  }, [sha]);

  const openCommit = useCallback((nextSha) => setSha(nextSha || null), []);
  const closeCommit = useCallback(() => setSha(null), []);
  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') window.history.back();
  }, []);

  return { commit: sha, openCommit, closeCommit, goBack };
}

// Parse the current location into { path, edit } where path is the entry
// rel-path or null and edit is a boolean. SSR-safe (returns nulls).
export function parseEntryFromUrl(searchString) {
  if (typeof searchString !== 'string') return { path: null, edit: false };
  const params = new URLSearchParams(searchString);
  const path = params.get('entry');
  const edit = params.get('edit') === '1';
  return { path: path && path !== '' ? path : null, edit };
}

// Build a new search string preserving every existing param except `entry`
// and `edit`, which are overwritten by the next state. Empty path clears
// both; falsy edit clears just the edit flag.
export function buildEntrySearch(searchString, { path, edit }) {
  const params = new URLSearchParams(searchString || '');
  params.delete('entry');
  params.delete('edit');
  if (path) {
    params.set('entry', path);
    if (edit) params.set('edit', '1');
  }
  const s = params.toString();
  return s === '' ? '' : `?${s}`;
}

// React hook: keeps {path, edit} in sync with the URL, exposes setters that
// push history entries so the browser back button traverses the visit
// sequence. Each navigation pushes; `goBack()` uses native history.back so
// forward stays reachable.
export function useEntryNavigation() {
  const initial = typeof window === 'undefined'
    ? { path: null, edit: false }
    : parseEntryFromUrl(window.location.search);
  const [state, setState] = useState(initial);
  // Track whether the next state change came from popstate so we don't
  // double-push when the URL changes externally.
  const fromPop = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    function onPop() {
      fromPop.current = true;
      setState(parseEntryFromUrl(window.location.search));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Push to URL when local state changes -- except when the change came
  // from popstate (which already updated the URL).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (fromPop.current) { fromPop.current = false; return; }
    const nextSearch = buildEntrySearch(window.location.search, state);
    const currentSearch = window.location.search || '';
    if (nextSearch === currentSearch) return;
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    window.history.pushState({ entry: state.path, edit: state.edit }, '', nextUrl);
  }, [state.path, state.edit]);

  const openEntry = useCallback((path) => {
    setState({ path: path || null, edit: false });
  }, []);

  const openEditor = useCallback(() => {
    setState((s) => ({ path: s.path, edit: true }));
  }, []);

  const closeEditor = useCallback(() => {
    setState((s) => ({ path: s.path, edit: false }));
  }, []);

  const backToPulse = useCallback(() => {
    setState({ path: null, edit: false });
  }, []);

  // Use the browser's native back so forward stays reachable. The popstate
  // listener will resync local state when it fires.
  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') window.history.back();
  }, []);

  return {
    path: state.path,
    edit: state.edit,
    openEntry,
    openEditor,
    closeEditor,
    backToPulse,
    goBack,
  };
}

// The STATE lenses. Pulse is the implicit default (omitted from the URL);
// topology and tree are named. Unknown values fall back to pulse.
export const LENSES = new Set(['pulse', 'topology', 'tree']);

// Parse `?lens=topology` / `?lens=tree` from the URL. Returns a known lens id
// or 'pulse' (the default). SSR-safe.
export function parseLensFromUrl(searchString) {
  if (typeof searchString !== 'string') return 'pulse';
  const v = new URLSearchParams(searchString).get('lens');
  return LENSES.has(v) ? v : 'pulse';
}

// Build a new search string preserving all params except `lens`. Pulse is
// the implicit default, so we omit `lens=pulse` to keep URLs clean.
export function buildLensSearch(searchString, lens) {
  const params = new URLSearchParams(searchString || '');
  params.delete('lens');
  if (lens && lens !== 'pulse' && LENSES.has(lens)) params.set('lens', lens);
  const s = params.toString();
  return s === '' ? '' : `?${s}`;
}

// Parse `?tree=<path>` — the TREE lens deep-link target (an entry path to
// reveal: its ancestor folders open, the row scrolled into view). SSR-safe.
export function parseTreeTargetFromUrl(searchString) {
  if (typeof searchString !== 'string') return null;
  const v = new URLSearchParams(searchString).get('tree');
  return v && v !== '' ? v : null;
}

// Build a search string with `tree` set to `path` (or cleared when falsy),
// preserving every other param. Lets a future "locate in tree" affordance link
// straight to a focused TREE view.
export function buildTreeTargetSearch(searchString, path) {
  const params = new URLSearchParams(searchString || '');
  params.delete('tree');
  if (path) params.set('tree', path);
  const s = params.toString();
  return s === '' ? '' : `?${s}`;
}

// React hook: keeps `lens` in sync with the URL. pushState on switch so
// browser back/forward traverses lens changes. Default landing is PULSE.
export function useLensNavigation() {
  const initial = typeof window === 'undefined'
    ? 'pulse'
    : parseLensFromUrl(window.location.search);
  const [lens, setLens] = useState(initial);
  const fromPop = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    function onPop() {
      fromPop.current = true;
      setLens(parseLensFromUrl(window.location.search));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (fromPop.current) { fromPop.current = false; return; }
    const nextSearch = buildLensSearch(window.location.search, lens);
    const currentSearch = window.location.search || '';
    if (nextSearch === currentSearch) return;
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    window.history.pushState({ lens }, '', nextUrl);
  }, [lens]);

  return { lens, setLens };
}
