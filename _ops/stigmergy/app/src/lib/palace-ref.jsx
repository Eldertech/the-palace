import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { fetchEntries } from '../adapters/entries.js';
import { buildRefIndex } from './entry-ref.js';

// PalaceRefProvider — app-wide entry resolution for the [OBS]/[BUN] chips on
// surfaces that don't already hold the entry index.
//
// STATE builds its own ref index from the catalog it already fetches; the
// other decks (a Trickster card's `@steward` header, board agent handles) have
// no index of their own. This provider fetches /api/entries once near the app
// root and exposes { refIndex, openEntryInState, vault } so any name-rendering
// surface can drop in an <EntryRefChips> without prop-drilling.
//
// `openEntryInState(path)` is supplied by App (it owns the deck switch + the
// jump target); the provider just carries it to deep consumers. Consumers call
// usePalaceRef() and guard for null so a surface used outside the provider
// (or before the index loads) renders plain names rather than crashing.
//
// The index is fetched LAZILY, not on mount. /api/entries does a synchronous
// full-palace walk (~485 files) that blocks the dev server's event loop; doing
// it eagerly on every app load competes with the board's own data fetch and
// delays first render. Since the only consumer is a TricksterCard's @steward
// header, the card calls ensureLoaded() when it mounts -- so board-only and
// STATE-only views (STATE builds its own index) never pay the walk.

// Exported so tests (and any advanced consumer) can supply a value directly,
// without the network fetch the provider does.
export const PalaceRefContext = createContext(null);

export function usePalaceRef() {
  return useContext(PalaceRefContext);
}

export function PalaceRefProvider({ vault = 'The Palace', openEntryInState, children }) {
  const [entries, setEntries] = useState(null);
  const started = useRef(false);

  // Idempotent: the first consumer that needs the index triggers the one walk.
  const ensureLoaded = useCallback(() => {
    if (started.current) return;
    started.current = true;
    fetchEntries().then((r) => {
      if (r && r.ok) setEntries(r.entries ?? []);
    });
  }, []);

  const refIndex = useMemo(() => buildRefIndex(entries ?? []), [entries]);
  const value = useMemo(
    () => ({ refIndex, ensureLoaded, openEntryInState, vault }),
    [refIndex, ensureLoaded, openEntryInState, vault],
  );

  return (
    <PalaceRefContext.Provider value={value}>
      {children}
    </PalaceRefContext.Provider>
  );
}
