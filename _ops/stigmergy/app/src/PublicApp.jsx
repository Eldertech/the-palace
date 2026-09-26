import React, { useCallback, useEffect, useRef, useState } from 'react';
import Shell from './components/Shell.jsx';
import StateDeck from './components/state/StateDeck.jsx';
import PublicWelcome from './components/public/PublicWelcome.jsx';
import { PalaceRefProvider } from './lib/palace-ref.jsx';
import { BASE, dataUrl, setSiteMeta } from './lib/public-mode.js';
import { buildLensSearch, LENSES } from './lib/url-nav.js';

// The public read view — the palace's reader's door (Loudon Live.md: two
// doors, this view or git). STIGMERGY's STATE deck and nothing else: PULSE,
// TOPOLOGY, TREE and the entry reader with its face switch, read from a
// static snapshot. No other decks, no companion, no board, no writes; the
// whole house stays one link away in git. A first visit to the bare address
// is met by the welcome (the BBS dial-in); after it, the palace opens on
// TOPOLOGY, grouped by the Four Pillars.

const WELCOMED = 'palace.read-view.welcomed';
const remember = () => { try { localStorage.setItem(WELCOMED, '1'); } catch { /* private mode */ } };
const remembered = () => { try { return localStorage.getItem(WELCOMED) === '1'; } catch { return false; } };

// Show the welcome on ?welcome, or on a first visit to the bare address.
// A shared link to an entry or a lens always opens straight onto it.
function wantsWelcome() {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search);
  if (q.has('welcome')) return true;
  return window.location.search === '' && !remembered();
}

// Navigate within the read view the way the lenses do, so StateDeck's
// popstate listeners pick it up.
function go(search) {
  window.history.pushState(null, '', `${window.location.pathname}${search}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function PublicApp() {
  const [welcoming, setWelcoming] = useState(wantsWelcome);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetch(dataUrl('meta.json')).then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (m) { setMeta(m); setSiteMeta(m); }
    }).catch(() => {});
  }, []);
  const repo = meta && typeof meta.repo === 'string' ? meta.repo : null;

  const enter = useCallback(() => {
    remember();
    setWelcoming(false);
    if (new URLSearchParams(window.location.search).has('welcome')) window.history.replaceState(null, '', window.location.pathname);
  }, []);
  const reopenWelcome = useCallback(() => {
    window.history.pushState(null, '', `${window.location.pathname}?welcome`);
    setWelcoming(true);
  }, []);

  useEffect(() => {
    function onPop() { setWelcoming(new URLSearchParams(window.location.search).has('welcome')); }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // The lens keys the LensToggle advertises, plus W for the welcome. Typing in
  // a field, or a modified key (Cmd-F), passes by.
  useEffect(() => {
    if (welcoming) return undefined;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (/input|textarea|select/i.test(t.tagName) || t.isContentEditable)) return;
      const lens = { p: 'pulse', t: 'topology', r: 'tree' }[e.key.toLowerCase()];
      if (lens && LENSES.has(lens)) { e.preventDefault(); go(buildLensSearch('', lens)); }
      else if (e.key === 'w' || e.key === 'W') { e.preventDefault(); reopenWelcome(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [welcoming, reopenWelcome]);

  // Cross-links (typed-link chips, body wikilinks) open entries through the
  // same jump StateDeck already honours in STIGMERGY.
  const [jumpTarget, setJumpTarget] = useState(null);
  const jumpNonce = useRef(0);
  const openEntryInState = useCallback((path) => {
    if (!path) return;
    jumpNonce.current += 1;
    setJumpTarget({ path, nonce: jumpNonce.current });
  }, []);

  const link = {
    color: 'var(--link)', textShadow: 'var(--glow)', fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '.04em',
    textDecoration: 'none', borderBottom: '1px dashed currentColor', cursor: 'pointer',
  };

  return (
    <Shell commands={[]} onCommand={() => {}} liveState={meta?.day ? `snapshot:${meta.day}` : 'snapshot'}>
      {welcoming ? (
        <PublicWelcome meta={meta} repo={repo} onEnter={enter} />
      ) : (
        <PalaceRefProvider vault="The Palace" openEntryInState={openEntryInState}>
          <div
            data-testid="public-masthead"
            style={{
              position: 'relative', zIndex: 2,
              display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
              borderBottom: '1px solid var(--phosphor-dim)', paddingBottom: 8, marginBottom: 4,
            }}
          >
            <a
              href={BASE}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '.06em',
                color: 'var(--phosphor-white)', textShadow: 'var(--glow-strong)', textDecoration: 'none',
              }}
            >THE PALACE</a>
            <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, letterSpacing: '.06em' }}>
              LOUDON STEARNS · A READ VIEW
            </span>
            <span style={{ flex: 1 }} />
            <span data-testid="public-welcome-link" role="button" tabIndex={0} onClick={reopenWelcome}
              onKeyDown={(e) => { if (e.key === 'Enter') reopenWelcome(); }} style={link}>
              [W] welcome
            </span>
            {repo ? (
              <a data-testid="public-git-door" href={repo} target="_blank" rel="noopener noreferrer"
                title="every entry, its memory and its history — the whole house, in git" style={link}>
                the whole house, in git ↗
              </a>
            ) : null}
          </div>
          <StateDeck jumpTarget={jumpTarget} onEntryPathChange={() => {}} />
        </PalaceRefProvider>
      )}
    </Shell>
  );
}
