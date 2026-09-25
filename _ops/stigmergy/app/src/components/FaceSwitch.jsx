import React from 'react';
import { orderFaces } from '../lib/faces.js';

// FaceSwitch — one switch between an entry's faces: the text, the rich face,
// the scroll. It sits at the right of every face's top bar (the entry reader,
// the scroll view, the rich face's strip), shows only the faces the entry's
// bundle carries, lights the one you're on, and draws nothing when the text is
// the only face. F cycles (wired by the host view). `signal` is the scroll's
// live row signal (needs you / ready / stalled), shown beside SCROLL.
export default function FaceSwitch({ faces, current, onSelect, signal = null }) {
  const list = orderFaces(faces);
  if (list.length < 2) return null;
  return (
    <span
      data-testid="face-switch"
      data-current={current}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 12,
      }}
    >
      <span
        title="this entry's faces — F cycles"
        style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}
      >
        [<b style={{ color: 'var(--phosphor-white)' }}>F</b>]&nbsp;face
      </span>
      {list.map((f) => {
        const active = f === current;
        return (
          <span
            key={f}
            data-testid={`face-${f}`}
            data-active={active ? '1' : '0'}
            role="button"
            tabIndex={active ? -1 : 0}
            aria-pressed={active}
            onClick={active ? undefined : () => onSelect?.(f)}
            onKeyDown={active ? undefined : (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(f); }
            }}
            style={{
              cursor: active ? 'default' : 'pointer',
              padding: '2px 8px',
              color: active ? 'var(--phosphor)' : 'var(--phosphor-dim)',
              textShadow: active ? 'var(--glow)' : 'none',
              border: `1px solid ${active ? 'var(--phosphor)' : 'var(--phosphor-dim)'}`,
              borderStyle: active ? 'solid' : 'dashed',
            }}
          >
            {f}
            {f === 'scroll' && signal ? (
              <span
                data-testid="face-scroll-signal"
                style={{
                  marginLeft: 6, fontSize: 10,
                  color: signal.tone === 'err' ? 'var(--error)' : signal.tone === 'warn' ? 'var(--warn)' : 'var(--phosphor-dim)',
                  textShadow: signal.tone === 'dim' ? 'none' : 'var(--glow)',
                }}
              >· {signal.text}</span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
