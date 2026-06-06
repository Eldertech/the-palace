// The decks of STIGMERGY v1.0.
//
// STATE     = present, what is (the palace as it stands).
// QUEUE     = future, what is waiting (the board, reconsidered as a decision queue).
// LOG       = past,    what happened (git as the record).
// TRICKSTER = decide,  what needs you (the catchup-first decision lane;
//             added 2026-06-05 as an iframe of /trickster.html, rebuilt
//             native 2026-06-05 so the deck reads the live board directly).
//
// Kept in its own module so Vite Fast Refresh treats DeckTabs.jsx as a
// single-export component file (the warning otherwise: "DECKS export
// is incompatible" with Fast Refresh in a mixed-export module).

export const DECKS = ['STATE', 'QUEUE', 'LOG', 'TRICKSTER'];

export const DECK_HOTKEYS = { STATE: 'S', QUEUE: 'Q', LOG: 'L', TRICKSTER: 'T' };

export const DECK_SUBTITLES = {
  STATE:     'PRESENT -- WHAT IS',
  QUEUE:     'FUTURE -- WHAT IS WAITING',
  LOG:       'PAST -- WHAT HAPPENED',
  TRICKSTER: 'DECIDE -- WHAT NEEDS YOU',
};
