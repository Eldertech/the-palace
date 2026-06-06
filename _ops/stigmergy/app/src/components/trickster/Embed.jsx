import React from 'react';
import { t } from '../../lib/lexicon.js';

// Embed — an interactive prototype rendered inline (the Witness Diagram, the
// slime-mold field). Sandboxed to scripts + same-origin so the prototype runs
// but can't reach out; lazy-loaded so off-screen cards don't pay for it. A
// title bar carries an "open standalone" escape hatch for a full-size look.
export default function Embed({ src, title, tall = false }) {
  if (!src) return null;
  return (
    <div data-testid="embed" style={{
      border: '1px solid var(--phosphor-dim)', marginBottom: 8,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 10px', borderBottom: '1px solid var(--phosphor-dim)',
        fontFamily: 'var(--font-mono)', fontSize: 11,
      }}>
        <b style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{title}</b>
        <a
          href={src}
          target="_blank"
          rel="noopener"
          style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', textDecoration: 'underline' }}
        >{t('trickster.embed.open')}</a>
      </div>
      <iframe
        title={title}
        src={src}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
        style={{
          display: 'block', width: '100%', border: 0,
          height: tall ? 520 : 320, background: 'var(--bg, #050706)',
        }}
      />
    </div>
  );
}
