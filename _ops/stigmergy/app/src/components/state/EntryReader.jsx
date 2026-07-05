import React, { useEffect, useRef, useState } from 'react';
import FrontmatterHeader, { ForwardVectorHero } from './FrontmatterHeader.jsx';
import TypedLinkPanel from './TypedLinkPanel.jsx';
import BundlePanel from './BundlePanel.jsx';
import EntryBody from './EntryBody.jsx';
import AgentLaunchModal from '../queue/AgentLaunchModal.jsx';
import { fetchEntry } from '../../adapters/entries.js';
import { fetchLensSuggestions } from '../../adapters/launch.js';
import { checkPathSafety } from '../../lib/entry-edit.js';

// One entry's full read shape, rendered:
//   - FrontmatterHeader (title, type, stage, pillars, forward_vector,
//     metadata row)
//   - main column: EntryBody (markdown body with body-wikilinks resolved
//     via the parent-passed `index`)
//   - right rail: TypedLinkPanel + BundlePanel (when present)
//
// Loads asynchronously; while loading shows a one-line "loading <path>";
// on failure shows an inline error band and a back button. Errors never
// escape this component -- the deck stays usable.

export default function EntryReader({
  path, index, refIndex, onNavigate, onBack, onEdit, onGoBack, reloadNonce = 0,
}) {
  const [state, setState] = useState({ kind: 'loading' });
  // "enchant" opens the AgentLaunchModal in ephemeral mode: build this page's
  // interactive context and launch a Claude Code terminal on it, without
  // registering a permanent steward. Self-contained — the modal calls the
  // adapters itself, so nothing needs threading through StateDeck.
  const [enchanting, setEnchanting] = useState(false);
  // "lens" runs [[The Lens]]'s procedure: pick a GLASS page from the index,
  // then wake it in the same AgentLaunchModal, with THIS entry handed to it
  // as the subject to read (lensSubject). `picking` holds the inline
  // title-picker's typed value before a glass is chosen; `glass` holds the
  // committed choice that opens the modal.
  const [picking, setPicking] = useState(null); // null | string (in-progress text)
  const [glass, setGlass] = useState(null); // null | chosen glass title
  // Ranked glass candidates for the OPEN entry (link-distance, nearest first —
  // [[The Lens]]'s "lean on the graph to suggest" design). Fetched once when
  // the picker opens; null while loading/unavailable (falls back to the
  // free-text + datalist search, which always works regardless of map freshness).
  const [suggestions, setSuggestions] = useState(null);

  // Navigation (path change): show "loading <path>" then fetch. This blank is
  // correct here — it's a real navigation to a different entry.
  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchEntry(path).then((r) => {
      if (cancelled) return;
      if (r.ok) setState({ kind: 'ok', entry: r });
      else setState({ kind: 'err', error: r.error ?? 'unknown error', status: r.status });
    });
    return () => { cancelled = true; };
  }, [path]);

  // In-place refresh (reloadNonce bump): the Companion just committed an edit to
  // THIS already-open entry. Re-fetch in the BACKGROUND and swap the content in
  // place — never blank to "loading". Blanking would collapse the document height
  // (resetting the reader's window scroll to the top) and tear down the
  // entry-body DOM the Companion's scroll-spy glow is painted on, so both the
  // scroll position and the section glow would vanish on every commit. Skips the
  // initial mount (the path effect already loaded it) and keeps the current entry
  // on a failed refresh. `path` is read from a ref so a nonce bump after a
  // navigation refetches the entry that's actually open, not a stale closure.
  const pathRef = useRef(path);
  pathRef.current = path;
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return undefined; }
    let cancelled = false;
    fetchEntry(pathRef.current).then((r) => {
      if (cancelled || !r.ok) return; // keep the current entry if the refresh fails
      setState({ kind: 'ok', entry: r });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadNonce]);

  // Fetch ranked glass candidates when the picker opens (picking flips from
  // null to a string). Re-fetches per entry (state.entry?.title dep) so
  // navigating to a different entry while a picker is open doesn't show stale
  // suggestions for the wrong subject.
  useEffect(() => {
    if (picking === null || state.kind !== 'ok') return undefined;
    let cancelled = false;
    setSuggestions(null);
    fetchLensSuggestions(state.entry.title).then((r) => {
      if (cancelled) return;
      setSuggestions(r.ok ? r.candidates ?? [] : []);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picking !== null, state.kind === 'ok' ? state.entry.title : null]);

  if (state.kind === 'loading') {
    return (
      <div data-testid="entry-loading" style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
        loading {path}...
      </div>
    );
  }

  if (state.kind === 'err') {
    return (
      <div data-testid="entry-error" style={{
        color: 'var(--error)', textShadow: 'var(--glow)',
        border: '1px solid var(--error)', padding: 12,
      }}>
        could not read entry: {state.error}
        {state.status ? <> ({state.status})</> : null}
        {onBack ? (
          <div style={{ marginTop: 8 }}>
            <span
              onClick={onBack}
              style={{ cursor: 'pointer', color: 'var(--phosphor)', borderBottom: '1px dashed currentColor' }}
            >
              [B] back to index
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  const { entry } = state;
  // Path-safety gates OPENING the editor (canon included — the editor's Trickster
  // Commit button can write it); the careful save vs. trickster distinction is
  // drawn inside the editor, not here.
  const editAllow = checkPathSafety(entry.path);

  // The entry's hero ("<Title> — hero.png" in its bundle) becomes a faint,
  // darkened backdrop behind the top of the reading column — ambient identity,
  // never at the cost of phosphor legibility. Prefer the title-matched hero,
  // else any "* — hero.png". Served by the existing GET /api/file.
  const bundleFiles = entry.bundle?.files || [];
  const heroFile = bundleFiles.find((f) => f.name === `${entry.title} — hero.png`)
    || bundleFiles.find((f) => / — hero\.png$/i.test(f.name));
  const heroPath = heroFile ? heroFile.relPath : null;
  // Cache-buster: a companion regen overwrites the hero PNG in place (same path),
  // so the browser would keep showing the old backdrop after a reload. The file's
  // byte size changes between renders — append it so the new image loads.
  const heroBust = heroFile && typeof heroFile.size === 'number' ? `&v=${heroFile.size}` : '';

  return (
    <div data-testid="entry-reader" data-path={entry.path} style={{ position: 'relative', zIndex: 1 }}>
      {heroPath ? (
        <div
          aria-hidden="true"
          data-testid="entry-hero-backdrop"
          style={{
            // Fixed to the viewport top so it stays put as the entry scrolls —
            // a persistent "which page am I on" reminder. EntryReader is its own
            // stacking context (z-index:1 above), so this z-index:0 sits above
            // the Shell's opaque background but below the entry content (z-index:1).
            position: 'fixed', top: 0, left: 0, right: 0, height: 540,
            zIndex: 0, pointerEvents: 'none',
            // Image under a top-to-bottom veil that fades it into the terminal
            // black before the body text begins; desaturated + dimmed so it
            // reads as ambient, not as a competing surface.
            backgroundImage:
              `linear-gradient(to bottom, color-mix(in srgb, var(--bg) 55%, transparent) 0%, var(--bg) 95%), url("/api/file?path=${encodeURIComponent(heroPath)}${heroBust}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 22%',
            backgroundRepeat: 'no-repeat',
            filter: 'saturate(0.8) brightness(1.2)',
            opacity: 0.72,
          }}
        />
      ) : null}
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: 8 }}>
        {onGoBack ? (
          <span
            data-testid="go-back"
            onClick={onGoBack}
            title="back one step (browser history)"
            style={{
              cursor: 'pointer',
              marginRight: 6,
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              border: '1px solid var(--phosphor-dim)', padding: '2px 8px',
              textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 12,
            }}
          >
            [<b style={{ color: 'var(--phosphor-white)' }}>&lt;</b>]&nbsp;back
          </span>
        ) : null}
        {onBack ? (
          <span
            data-testid="back-to-index"
            onClick={onBack}
            style={{
              cursor: 'pointer',
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              border: '1px solid var(--phosphor-dim)', padding: '2px 8px',
              textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 12,
            }}
          >
            [<b style={{ color: 'var(--phosphor-white)' }}>B</b>]&nbsp;pulse
          </span>
        ) : null}
        {onEdit ? (
          <span
            data-testid="open-editor"
            onClick={editAllow.allowed ? onEdit : undefined}
            title={editAllow.allowed ? 'edit this entry (manual edit + trickster commit)' : editAllow.reason}
            style={{
              marginLeft: 8,
              cursor: editAllow.allowed ? 'pointer' : 'not-allowed',
              opacity: editAllow.allowed ? 1 : 0.4,
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              border: '1px solid var(--phosphor-dim)', padding: '2px 8px',
              textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 12,
            }}
          >
            [<b style={{ color: 'var(--phosphor-white)' }}>E</b>]&nbsp;edit
          </span>
        ) : null}
        <span
          data-testid="enchant-entry"
          onClick={() => setEnchanting(true)}
          title="enchant — build this page's context and launch a Claude Code terminal on it (one-off; no steward registered)"
          style={{
            marginLeft: 8,
            cursor: 'pointer',
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            border: '1px solid var(--phosphor-dim)', padding: '2px 8px',
            textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 12,
          }}
        >
          [<b style={{ color: 'var(--phosphor-white)' }}>A</b>]&nbsp;enchant
        </span>
        <span
          data-testid="lens-entry"
          onClick={() => setPicking((p) => (p === null ? '' : null))}
          title="lens — pick another page to wake as a glass and read this entry through its apparatus (reports a spark score to WEAVE)"
          style={{
            marginLeft: 8,
            cursor: 'pointer',
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            border: '1px solid var(--phosphor-dim)', padding: '2px 8px',
            textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 12,
          }}
        >
          [<b style={{ color: 'var(--phosphor-white)' }}>L</b>]&nbsp;lens
        </span>
        {picking !== null ? (
          <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input
              data-testid="lens-glass-input"
              autoFocus
              list="lens-glass-options"
              value={picking}
              placeholder="read through which page?"
              onChange={(e) => setPicking(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setPicking(null);
                if (e.key === 'Enter' && picking.trim() && picking.trim() !== entry.title) {
                  setGlass(picking.trim());
                  setPicking(null);
                }
              }}
              style={{
                background: 'var(--bg)', color: 'var(--phosphor)', textShadow: 'var(--glow)',
                border: '1px dashed var(--phosphor-dim)', fontFamily: 'var(--font-mono)', fontSize: 12,
                padding: '2px 6px', outline: 'none', width: 220,
              }}
            />
            <datalist id="lens-glass-options">
              {index instanceof Map ? Array.from(index.keys())
                .filter((t) => t !== entry.title)
                .map((t) => <option key={t} value={t} />) : null}
            </datalist>
          </span>
        ) : null}
        {picking !== null ? (
          <div data-testid="lens-suggestions" style={{ width: '100%', marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--phosphor-dim)', textShadow: 'none', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              nearest on the graph{suggestions === null ? '…' : suggestions.length === 0 ? ' — none (no Map Build snapshot yet; search above)' : ''}
            </span>
            {suggestions?.map((c) => (
              <span
                key={c.title}
                data-testid="lens-suggestion"
                onClick={() => { setGlass(c.title); setPicking(null); }}
                title={c.distance === Infinity ? 'not yet linked to this entry' : `${c.distance} hop${c.distance === 1 ? '' : 's'} away on the typed-link graph`}
                style={{
                  cursor: 'pointer', fontSize: 11,
                  color: 'var(--link)', textShadow: 'var(--glow)',
                  border: '1px dashed var(--phosphor-dim)', padding: '1px 6px',
                }}
              >
                {c.title}{c.distance !== Infinity ? <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>·{c.distance}</span> : null}
              </span>
            ))}
          </div>
        ) : null}
        <span style={{
          marginLeft: 12, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
        }}>{entry.path}</span>
        {entry.error ? (
          <span style={{
            marginLeft: 12, color: 'var(--warn)', textShadow: 'var(--glow)',
            border: '1px solid var(--warn)', padding: '0 6px', fontSize: 10,
          }}>
            FRONTMATTER PARSE WARNING: {entry.error}
          </span>
        ) : null}
      </div>

      <FrontmatterHeader
        title={entry.title}
        frontmatter={entry.frontmatter ?? {}}
        summary={entry.summary ?? {}}
      />

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px',
        gap: 24, alignItems: 'flex-start',
      }}>
        <div style={{ minWidth: 0 }}>
          {/* Forward vector hero sits at the top of the body column so the
              right rail (typed links + bundle) starts at the same vertical
              position rather than getting pushed down by a full-width hero. */}
          <ForwardVectorHero forward_vector={entry.frontmatter?.forward_vector} />
          <EntryBody body={entry.body} index={index} refIndex={refIndex} onNavigate={onNavigate} bundleFiles={bundleFiles} />
        </div>
        <div data-testid="entry-rail" style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          minWidth: 0,
        }}>
          <TypedLinkPanel
            links={entry.links}
            index={index}
            refIndex={refIndex}
            onNavigate={onNavigate}
          />
          <BundlePanel bundle={entry.bundle} />
        </div>
      </div>
      </div>
      {enchanting ? (
        <AgentLaunchModal
          home={entry.title}
          mode="ephemeral"
          onClose={() => setEnchanting(false)}
        />
      ) : null}
      {glass ? (
        <AgentLaunchModal
          home={glass}
          mode="ephemeral"
          lensSubject={entry.title}
          onClose={() => setGlass(null)}
        />
      ) : null}
    </div>
  );
}
