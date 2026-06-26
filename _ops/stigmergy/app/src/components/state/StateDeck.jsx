import React, { useEffect, useMemo, useState } from 'react';
import EntryList from './EntryList.jsx';
import EntryReader from './EntryReader.jsx';
import EntryEditor from './EntryEditor.jsx';
import TopologyLens from './TopologyLens.jsx';
import TreeLens from './TreeLens.jsx';
import { fetchEntries } from '../../adapters/entries.js';
import { buildIndex } from '../../lib/wikilink.js';
import { buildRefIndex } from '../../lib/entry-ref.js';
import { useEntryNavigation, useLensNavigation } from '../../lib/url-nav.js';
import { Banner } from '../primitives.jsx';

// STATE deck shell. Holds the entries index, and toggles between the
// PULSE list view (default) and a single EntryReader when a row is
// clicked. The wikilink index built from the catalog is threaded
// through both views so body-wikilinks resolve to known entries.
//
// On a fresh load, the index fetch happens once; subsequent navigation
// is in-memory (the EntryReader fetches the chosen entry's full read
// shape via /api/entry).

export default function StateDeck({ jumpTarget = null, onEntryPathChange, reloadNonce = 0 }) {
  const [state, setState] = useState({ kind: 'loading' });
  // STATE has two lenses: PULSE (the ranked list, default) and TOPOLOGY
  // (the typed-link graph). Lens choice is URL-driven (?lens=topology), so
  // deep-links land on the right lens and browser back/forward traverses
  // lens switches. PULSE is the implicit default and is omitted from URLs.
  const { lens, setLens } = useLensNavigation();
  // URL drives which entry is open and whether the editor is showing.
  // Browser back/forward traverses the visit sequence for free; deep-linked
  // ?entry=<path> URLs open straight to that entry.
  const nav = useEntryNavigation();
  const selected = nav.path;
  const editing = nav.edit;

  // Report the open entry up to App so the global Companion can ground in it.
  // StateDeck owns the URL-driven entry navigation, so it is the source of
  // truth; App only needs to know which entry (if any) is open.
  useEffect(() => {
    onEntryPathChange?.(selected);
  }, [selected, onEntryPathChange]);

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

  // The richer ref index (name -> { path, hasBundle }) backs the [OBS]/[BUN]
  // chips on typed-link targets and body wikilinks. Same catalog, one extra
  // pass; the has_bundle flag is already in each summary.
  const refIndex = useMemo(() => {
    if (state.kind !== 'ok') return new Map();
    return buildRefIndex(state.entries);
  }, [state]);

  // A cross-deck jump (e.g. clicking [BUN] on a Trickster card's @steward)
  // sets jumpTarget and flips the deck to STATE; open that entry when it
  // arrives. Keyed on the nonce so the same entry can be re-jumped, and so an
  // ordinary StateDeck re-render never re-fires the open.
  useEffect(() => {
    if (jumpTarget && jumpTarget.path) nav.openEntry(jumpTarget.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpTarget?.nonce]);

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
          refIndex={refIndex}
          onNavigate={nav.openEntry}
          onBack={nav.backToPulse}
          onEdit={nav.openEditor}
          onGoBack={nav.goBack}
          reloadNonce={reloadNonce}
        />
      ) : (
        <>
          <LensToggle lens={lens} onChange={setLens} />
          {lens === 'topology' ? (
            <TopologyLens
              onSelect={nav.openEntry}
              entries={state.kind === 'ok' ? state.entries : []}
            />
          ) : lens === 'tree' ? (
            <TreeLens onSelect={nav.openEntry} />
          ) : (
            <EntryList
              entries={state.kind === 'ok' ? state.entries : []}
              loadState={state.kind === 'ok' ? 'ok' : 'loading'}
              error={null}
              onSelect={nav.openEntry}
            />
          )}
        </>
      )}
    </div>
  );
}

function LensToggle({ lens, onChange }) {
  const tabs = [
    { id: 'pulse', key: 'P', label: 'PULSE', sub: 'vitality lens' },
    { id: 'topology', key: 'T', label: 'TOPOLOGY', sub: 'typed-link graph' },
    { id: 'tree', key: 'R', label: 'TREE', sub: 'folder structure' },
  ];
  return (
    <div data-testid="state-lens-toggle" style={{
      display: 'flex', gap: 16, marginBottom: 10,
      borderBottom: '1px solid var(--phosphor-dim)', paddingBottom: 6,
    }}>
      {tabs.map((t) => {
        const active = t.id === lens;
        return (
          <span
            key={t.id}
            data-testid={`state-lens-${t.id}`}
            data-active={active ? '1' : '0'}
            role="button"
            tabIndex={0}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(t.id); }
            }}
            style={{
              cursor: 'pointer', userSelect: 'none',
              fontSize: 12, letterSpacing: '.08em',
              color: active ? 'var(--phosphor)' : 'var(--phosphor-dim)',
              textShadow: active ? 'var(--glow)' : 'none',
              borderBottom: active ? '2px solid var(--phosphor)' : '2px solid transparent',
              paddingBottom: 2,
            }}
          >
            [{t.key}] {t.label}
            <span style={{ marginLeft: 6, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10 }}>
              -- {t.sub}
            </span>
          </span>
        );
      })}
    </div>
  );
}
