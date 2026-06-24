import React, { useEffect, useRef, useState } from 'react';
import FrontmatterHeader, { ForwardVectorHero } from './FrontmatterHeader.jsx';
import TypedLinkPanel from './TypedLinkPanel.jsx';
import BundlePanel from './BundlePanel.jsx';
import EntryBody from './EntryBody.jsx';
import AgentLaunchModal from '../queue/AgentLaunchModal.jsx';
import { fetchEntry } from '../../adapters/entries.js';
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
              `linear-gradient(to bottom, color-mix(in srgb, var(--bg) 55%, transparent) 0%, var(--bg) 95%), url("/api/file?path=${encodeURIComponent(heroPath)}")`,
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
          <EntryBody body={entry.body} index={index} refIndex={refIndex} onNavigate={onNavigate} />
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
    </div>
  );
}
