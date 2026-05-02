import React from 'react';
import { BOARDS } from '../lib/format.js';

export default function ChannelTabs({ active, onSelect, counts = {}, pendingTrickster = 0 }) {
  return (
    <div data-testid="channel-tabs" style={{
      display: 'flex', gap: 12, flexWrap: 'wrap',
      padding: '4px 0',
      borderBottom: '1px dashed var(--phosphor-dim)',
      marginBottom: 8,
      fontFamily: 'var(--font-mono)', fontSize: 14,
    }}>
      {BOARDS.map((b, i) => {
        const isActive = b === active;
        const hot = String(i + 1);
        const count = counts[b] ?? 0;
        const showPending = b === 'TRICKSTER' && pendingTrickster > 0;
        return (
          <span
            key={b}
            data-testid={`tab-${b.toLowerCase()}`}
            data-active={isActive ? 'true' : 'false'}
            onClick={() => onSelect?.(b)}
            style={{
              cursor: 'pointer',
              background: isActive ? 'var(--phosphor)' : 'transparent',
              color: isActive ? 'var(--bg)' : 'var(--phosphor-dim)',
              textShadow: isActive ? 'none' : 'none',
              padding: '2px 8px',
              border: '1px solid var(--phosphor-dim)',
              borderRadius: 0,
              textTransform: 'uppercase', letterSpacing: '.04em',
            }}
          >
            <span style={{
              color: isActive ? 'var(--bg)' : 'var(--phosphor)',
              textShadow: isActive ? 'none' : 'var(--glow)',
            }}>[</span>
            <b style={{
              color: isActive ? 'var(--bg)' : 'var(--phosphor-white)',
              textShadow: isActive ? 'none' : 'var(--glow)',
            }}>{hot}</b>
            <span style={{
              color: isActive ? 'var(--bg)' : 'var(--phosphor)',
              textShadow: isActive ? 'none' : 'var(--glow)',
            }}>]</span>&nbsp;{b}
            {showPending ? (
              <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', marginLeft: 6 }}>
                ({pendingTrickster} PENDING)
              </span>
            ) : count > 0 ? (
              <span style={{
                color: isActive ? 'var(--bg)' : 'var(--phosphor-dim)',
                textShadow: 'none', marginLeft: 6,
              }}>
                ({count})
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
