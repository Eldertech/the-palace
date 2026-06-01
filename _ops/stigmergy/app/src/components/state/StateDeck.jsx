import React, { useEffect, useMemo, useState } from 'react';
import EntryList from './EntryList.jsx';
import EntryReader from './EntryReader.jsx';
import EntryEditor from './EntryEditor.jsx';
import { fetchEntries } from '../../adapters/entries.js';
import { buildIndex } from '../../lib/wikilink.js';
import { useEntryNavigation } from '../../lib/url-nav.js';
import { Banner } from '../primitives.jsx';

// STATE deck shell. Holds the entries index, and toggles between the
// PULSE list view (default) and a single EntryReader when a row is
// clicked. The wikilink index built from the catalog is threaded
// through both views so body-wikilinks resolve to known entries.
//
// On a fresh load, the index fetch happens once; subsequent navigation
// is in-memory (the EntryReader fetches the chosen entry's full read
// shape via /api/entry).

export default function StateDeck() {
  const [state, setState] = useState({ kind: 'loading' });
  // URL drives which entry is open and whether the editor is showing.
  // Browser back/forward traverses the visit sequence for free; deep-linked
  // ?entry=<path> URLs open straight to that entry.
  const nav = useEntryNavigation();
  const selected = nav.path;
  const editing = nav.edit;

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchEntries().then((r) => {
      if (cancelled) return;
      if (r.ok) setState({ kind: 'ok', entries: r.entries ?? [], count: r.count ?? 0 });
      else setState({ kind: 'err', error: r.error ?? 'unknown error' });
    });
    return () => { cancelled = true; };
  }, []);

  // The wikilink index is built once per catalog fetch and reused across
  // all entry reads.
  const wikilinkIndex = useMemo(() => {
    if (state.kind !== 'ok') return new Map();
    return buildIndex(state.entries);
  }, [state]);

  if (state.kind === 'err') {
    return (
      <div data-testid="state-deck-error" style={{
        color: 'var(--error)', textShadow: 'var(--glow)',
        border: '1px solid var(--error)', padding: 12,
      }}>
        could not index palace entries: {state.error}
      </div>
    );
  }

  return (
    <div data-testid="state-deck">
      {selected && editing ? (
        <EntryEditor
          path={selected}
          index={wikilinkIndex}
          onCancel={nav.closeEditor}
        />
      ) : selected ? (
        <EntryReader
          path={selected}
          index={wikilinkIndex}
          onNavigate={nav.openEntry}
          onBack={nav.backToPulse}
          onEdit={nav.openEditor}
          onGoBack={nav.goBack}
        />
      ) : (
        <>
          <Banner as="h1" strong style={{ fontSize: 32, margin: '0 0 4px' }}>
            state -- the palace as it stands
          </Banner>
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 12 }}>
            {state.kind === 'ok'
              ? `${state.count} entries indexed. pulse-sorted, most alive first.`
              : 'walking the palace...'}
          </div>
          <EntryList
            entries={state.kind === 'ok' ? state.entries : []}
            loadState={state.kind === 'ok' ? 'ok' : 'loading'}
            error={null}
            onSelect={nav.openEntry}
          />
        </>
      )}
    </div>
  );
}
