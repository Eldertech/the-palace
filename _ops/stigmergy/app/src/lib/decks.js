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

// PROJECTS  = advance,  where everything stands (every project on one screen
//             with what it is waiting for; click one to open its SCROLL — Now
//             on top, Standing Orders, the making trail — and answer, steer,
//             or advance it there. Replaced the STEWARDS roster 2026-09-23:
//             the roster showed stewards and cycle counts; this shows projects
//             and their state. Hotkey P; W still lands here for old habits.)

export const DECKS = ['STATE', 'QUEUE', 'LOG', 'TRICKSTER', 'PROJECTS'];

export const DECK_HOTKEYS = { STATE: 'S', QUEUE: 'Q', LOG: 'L', TRICKSTER: 'T', PROJECTS: 'P' };

export const DECK_SUBTITLES = {
  STATE:     'PRESENT -- WHAT IS',
  QUEUE:     'FUTURE -- WHAT IS WAITING',
  LOG:       'PAST -- WHAT HAPPENED',
  TRICKSTER: 'DECIDE -- WHAT NEEDS YOU',
  PROJECTS:  'ADVANCE -- WHERE EVERYTHING STANDS',
};

// Legacy deck names still accepted in ?deck= and as hotkeys.
export const DECK_ALIASES = { STEWARDS: 'PROJECTS' };
