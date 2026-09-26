import React from 'react';
import { Box } from '../primitives.jsx';

// The read view's not-found screen: a dial that never connects. Used when an
// entry link points at something the read view doesn't carry (moved, renamed,
// or memory, which stays in git). The static 404.html the build writes says
// the same words for a path that isn't there at all
// (scripts/build-public.mjs, NO_CARRIER_HTML) — keep them in step.
export default function NoCarrier({ dialed, home, repo }) {
  const dim = { color: 'var(--phosphor-dim)', textShadow: 'none' };
  return (
    <div data-testid="no-carrier" style={{ maxWidth: '80ch', margin: '0 auto', padding: '24px 0' }}>
      <div style={{ ...dim, fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.7 }}>
        <div style={{ overflowWrap: 'anywhere' }}>ATDT {dialed || '???'}</div>
        <div>RING... RING... RING...</div>
        <div>BUSY</div>
      </div>
      <div style={{
        marginTop: 10, fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1,
        color: 'var(--error)', textShadow: '0 0 8px var(--error)', letterSpacing: '.04em',
      }}>
        NO CARRIER
      </div>
      <div style={{ marginTop: 16 }}>
        <Box title="ERR 404 · NOT ON THIS BOARD">
          <div style={{ color: 'var(--phosphor)', fontSize: 14, lineHeight: 1.6 }}>
            the page you dialed isn't in the read view. it may have moved or been renamed,
            or it lives in the palace's memory, which stays in git.
          </div>
        </Box>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        <a href={home} style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', textDecoration: 'none', border: '2px solid var(--phosphor)', padding: '3px 10px' }}>
          [<b style={{ color: 'var(--phosphor-white)' }}>R</b>]&nbsp;redial the palace
        </a>
        {repo ? (
          <a href={repo} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', textDecoration: 'none', border: '2px solid var(--phosphor-dim)', padding: '3px 10px' }}>
            [<b style={{ color: 'var(--phosphor-white)' }}>G</b>]&nbsp;the whole house, in git
          </a>
        ) : null}
      </div>
    </div>
  );
}
