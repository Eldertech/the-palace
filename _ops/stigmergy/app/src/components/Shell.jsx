import React from 'react';

export default function Shell({ children, user, nodeName, clock, unread, onCommand, commands = [], hidePath }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--phosphor)',
      fontFamily: 'var(--font-mono)', fontSize: 13,
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
        background: 'repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,.26) 2px 3px)',
        mixBlendMode: 'multiply',
      }} data-testid="scanlines" />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.6) 100%)',
      }} data-testid="vignette" />

      <div data-testid="status-bar" style={{
        borderBottom: '1px dashed var(--phosphor-dim)',
        padding: '6px 20px', display: 'flex', gap: 16, flexWrap: 'wrap',
        color: 'var(--phosphor)', textShadow: 'var(--glow)',
      }}>
        <span style={{ color: 'var(--phosphor-white)', textShadow: 'var(--glow-strong)' }}>STIGMERGY</span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, letterSpacing: '.12em' }}>[cracked·tRiCKSTER]</span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>·</span>
        <span>NODE {nodeName}</span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>·</span>
        {user ? (
          <>
            <span style={{ color: 'var(--ansi-bright-cyan)' }}>@{user}</span>
            <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>·</span>
          </>
        ) : null}
        <span>{clock}</span>
        {unread > 0 && (
          <>
            <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>·</span>
            <span style={{ color: 'var(--unread)' }}>* {unread} NEW</span>
          </>
        )}
        {hidePath ? null : (
          <>
            <span style={{ flex: 1 }} />
            <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>● uplink ok</span>
          </>
        )}
      </div>

      <div style={{ flex: 1, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>

      {commands.length > 0 && (
        <div data-testid="command-bar" style={{
          borderTop: '1px dashed var(--phosphor-dim)',
          padding: '6px 20px', display: 'flex', gap: 20, flexWrap: 'wrap',
          position: 'sticky', bottom: 0, background: 'var(--bg)', zIndex: 10,
        }}>
          {commands.map((c) => (
            <span
              key={c.key}
              onClick={() => onCommand?.(c.key)}
              style={{
                cursor: c.disabled ? 'not-allowed' : 'pointer',
                color: c.disabled ? 'var(--fg3)' : 'var(--phosphor)',
                textShadow: c.disabled ? 'none' : 'var(--glow)',
              }}
              onMouseEnter={(e) => {
                if (!c.disabled) {
                  e.currentTarget.style.background = 'var(--phosphor)';
                  e.currentTarget.style.color = 'var(--bg)';
                  e.currentTarget.style.textShadow = 'none';
                }
              }}
              onMouseLeave={(e) => {
                if (!c.disabled) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--phosphor)';
                  e.currentTarget.style.textShadow = 'var(--glow)';
                }
              }}
            >
              [<b style={{ color: c.disabled ? 'var(--fg3)' : 'var(--phosphor-white)' }}>{c.key}</b>]&nbsp;{c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
