import React, { useEffect, useState } from 'react';
import FrontmatterHeader from './FrontmatterHeader.jsx';
import TypedLinkPanel from './TypedLinkPanel.jsx';
import BundlePanel from './BundlePanel.jsx';
import EntryBody from './EntryBody.jsx';
import { fetchEntry } from '../../adapters/entries.js';

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

export default function EntryReader({ path, index, onNavigate, onBack }) {
  const [state, setState] = useState({ kind: 'loading' });

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

  return (
    <div data-testid="entry-reader" data-path={entry.path}>
      <div style={{ marginBottom: 8 }}>
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
            [<b style={{ color: 'var(--phosphor-white)' }}>B</b>]&nbsp;back to pulse
          </span>
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
          <EntryBody body={entry.body} index={index} onNavigate={onNavigate} />
        </div>
        <div data-testid="entry-rail" style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          minWidth: 0,
        }}>
          <TypedLinkPanel
            links={entry.links}
            index={index}
            onNavigate={onNavigate}
          />
          <BundlePanel bundle={entry.bundle} />
        </div>
      </div>
    </div>
  );
}
