import React from 'react';
import { Rule } from './primitives.jsx';

export default function BoardIndex({ traces, onOpen, selectedId }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--phosphor)' }}>
      <Rule double>BOARD INDEX · /main</Rule>
      <div style={{
        display: 'grid', gridTemplateColumns: '30px 110px 1fr 140px 70px', gap: 10,
        padding: '6px 0', color: 'var(--phosphor-dim)', textShadow: 'none',
        borderBottom: '1px dashed var(--phosphor-dim)', fontSize: 11,
        textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        <span>st</span><span>#id</span><span>subject</span><span>from</span><span>when</span>
      </div>
      {traces.map((t) => {
        const sel = t.id === selectedId;
        return (
          <div key={t.id}
            onClick={() => onOpen?.(t)}
            style={{
              display: 'grid', gridTemplateColumns: '30px 110px 1fr 140px 70px', gap: 10,
              padding: '4px 6px', margin: '0 -6px',
              cursor: 'pointer', alignItems: 'center',
              background: sel ? 'var(--phosphor)' : 'transparent',
              color: sel ? 'var(--bg)' : 'var(--phosphor)',
              textShadow: sel ? 'none' : 'var(--glow)',
            }}
            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = 'var(--phosphor-deep)'; }}
            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{
              color: sel ? 'var(--bg)' : t.unread ? 'var(--unread)' : 'var(--phosphor-dim)',
              textShadow: 'none',
            }}>
              {t.pinned ? '!' : t.locked ? '#' : t.unread ? '*' : ' '}
            </span>
            <span>{t.id}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.unread && !sel ? <span style={{ color: 'var(--unread)', marginRight: 6 }}>NEW</span> : null}
              {t.subject}
            </span>
            <span style={{ color: sel ? 'var(--bg)' : 'var(--ansi-bright-cyan)', textShadow: 'none' }}>
              @{t.author}
            </span>
            <span style={{ color: sel ? 'var(--bg)' : 'var(--phosphor-dim)', textShadow: 'none' }}>
              {t.when}
            </span>
          </div>
        );
      })}
      <Rule>end of index — {traces.length} traces</Rule>
    </div>
  );
}
