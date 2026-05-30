// The three decks of STIGMERGY v1.0.
//
// STATE = present, what is (the palace as it stands).
// QUEUE = future, what is waiting (the board, reconsidered as a decision queue).
// LOG   = past,    what happened (git as the record).
//
// Kept in its own module so Vite Fast Refresh treats DeckTabs.jsx as a
// single-export component file (the warning otherwise: "DECKS export
// is incompatible" with Fast Refresh in a mixed-export module).

export const DECKS = ['STATE', 'QUEUE', 'LOG'];

export const DECK_HOTKEYS = { STATE: 'S', QUEUE: 'Q', LOG: 'L' };

export const DECK_SUBTITLES = {
  STATE: 'PRESENT -- WHAT IS',
  QUEUE: 'FUTURE -- WHAT IS WAITING',
  LOG:   'PAST -- WHAT HAPPENED',
};
