import React, { useEffect, useMemo, useState } from 'react';
import EntryList from './EntryList.jsx';
import EntryReader from './EntryReader.jsx';
import EntryEditor from './EntryEditor.jsx';
import TopologyLens from './TopologyLens.jsx';
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
  // STATE has two lenses: PULSE (the ranked list, default) and TOPOLOGY
  // (the typed-link graph). The lens choice is local UI state -- entry nav
  // (?entry=, ?edit=) survives a lens switch but the lens itself does not
  // persist across reloads (deliberate for v1).
  const [lens, setLens] = useState('pulse');
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
              ? lens === 'pulse'
                ? `${state.count} entries indexed. click a column to sort.`
                : `typed-link graph of the freshest palace map. click a node to open it.`
              : 'walking the palace...'}
          </div>
          <LensToggle lens={lens} onChange={setLens} />
          {lens === 'topology' ? (
            <TopologyLens
              onSelect={nav.openEntry}
              entries={state.kind === 'ok' ? state.entries : []}
            />
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
    { id: 'pulse', label: 'PULSE', sub: 'vitality lens' },
    { id: 'topology', label: 'TOPOLOGY', sub: 'typed-link graph' },
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
            [{t.id === 'pulse' ? 'P' : 'T'}] {t.label}
            <span style={{ marginLeft: 6, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10 }}>
              -- {t.sub}
            </span>
          </span>
        );
      })}
    </div>
  );
}
