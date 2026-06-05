import React from 'react';

// TricksterDeck — the catchup-first decision lane, embedded as an iframe
// pointing at the standalone /trickster.html page.
//
// The page is the reference implementation of the "Speak Like a Person,
// Log Like a Protocol" + voice-rule-6 catchup-first pattern. Embedding
// it as a deck is the fastest way to surface that experience inside
// STIGMERGY while the same pattern propagates through the native QUEUE
// renderer. When the QUEUE deck reaches parity, this deck can either
// retire or stay as the asset-rich alt skin (audio players, iframes,
// SVG schematics per project — things the QUEUE card-list won't carry).
//
// The iframe sandbox needs five tokens to make the standalone page work:
//   allow-scripts        — the page is dynamic; the inbox, audio play-
//                          all, lean buttons all need JS.
//   allow-same-origin    — same origin is required so the page's POSTs
//                          to /api/persistent succeed (the only way
//                          file ▶ actually files on the BBS).
//   allow-forms          — the freeform notes textarea + form submission.
//   allow-popups         — the per-card "open standalone ↗" / project-
//                          entry deep-links open in a new tab.
//   allow-downloads      — the Preset card's "↓ download .adv" button
//                          uses the HTML download attribute, which
//                          Chrome and Safari block in sandboxed iframes
//                          unless this token is present.
export default function TricksterDeck() {
  return (
    <div
      data-testid="trickster-deck"
      style={{
        display: 'flex', flexDirection: 'column',
        // Subtract the rough height of the deck-tabs + command bar above.
        // The iframe expands to whatever is left so the user gets the
        // standalone page's layout uncropped.
        height: 'calc(100vh - 180px)',
        minHeight: 600,
        border: '1px solid var(--phosphor-dim)',
        background: 'var(--bg, #050706)',
      }}
    >
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid var(--phosphor-dim)',
        color: 'var(--phosphor-dim)', textShadow: 'none',
        fontFamily: 'var(--font-mono)',
        fontSize: 11, letterSpacing: '.06em',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>catchup-first decision lane · the standalone page · embedded</span>
        <a
          href="/trickster.html"
          target="_blank"
          rel="noopener"
          style={{
            color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)',
            textDecoration: 'underline', fontSize: 11,
          }}
        >open standalone ↗</a>
      </div>
      <iframe
        title="Trickster · pending decisions"
        src="/trickster.html"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        style={{
          flex: 1, width: '100%', border: 0, background: 'var(--bg, #050706)',
        }}
      />
    </div>
  );
}
