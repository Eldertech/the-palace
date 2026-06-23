import React from 'react';
import CommandBar from './CommandBar.jsx';

function LiveIndicator({ liveState = 'offline' }) {
  let label, color, shadow;
  if (liveState === 'connected') {
    label = 'LIVE';
    color = 'var(--phosphor)';
    shadow = 'var(--glow)';
  } else if (liveState === 'connecting' || liveState === 'reconnecting') {
    label = 'RECONNECTING';
    color = 'var(--warn)';
    shadow = 'var(--glow)';
  } else {
    label = 'OFFLINE';
    color = 'var(--error)';
    shadow = 'var(--glow)';
  }
  return (
    <span
      data-testid="live-indicator"
      data-state={liveState}
      style={{ color, textShadow: shadow }}
    >
      {'● '}{label}
    </span>
  );
}

export default function Shell({
  children, user, nodeName, clock, unread, onCommand, commands = [], hidePath,
  scanlinesOn = true, vfxState, activeBoard, liveState = 'offline',
}) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--phosphor)',
      fontFamily: 'var(--font-mono)', fontSize: 13,
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {scanlinesOn && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
          background: 'repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,.26) 2px 3px)',
          mixBlendMode: 'multiply',
        }} data-testid="scanlines" data-on="true" />
      )}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.6) 100%)',
      }} data-testid="vignette" />

      <div data-testid="status-bar" style={{
        borderBottom: '1px dashed var(--phosphor-dim)',
        padding: '6px 20px', display: 'flex', gap: 16, flexWrap: 'wrap',
        color: 'var(--phosphor)', textShadow: 'var(--glow)',
        // Stay above an entry's fixed hero backdrop (EntryReader z-index:1) so
        // the top chrome reads bright — the hero sits behind everything.
        position: 'relative', zIndex: 2,
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
        {hidePath ? (
          <>
            <span style={{ flex: 1 }} />
            {vfxState ? (
              <span data-testid="vfx-indicator" style={{
                color: vfxState === 'on' ? 'var(--phosphor)' : 'var(--phosphor-dim)',
                textShadow: vfxState === 'on' ? 'var(--glow)' : 'none',
              }}>
                VFX: {vfxState.toUpperCase()}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <span style={{ flex: 1 }} />
            {vfxState ? (
              <span data-testid="vfx-indicator" style={{
                color: vfxState === 'on' ? 'var(--phosphor)' : 'var(--phosphor-dim)',
                textShadow: vfxState === 'on' ? 'var(--glow)' : 'none',
                marginRight: 12,
              }}>
                VFX: {vfxState.toUpperCase()}
              </span>
            ) : null}
            <LiveIndicator liveState={liveState} />
          </>
        )}
      </div>

      <div style={{ flex: 1, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>

      <CommandBar commands={commands} onCommand={onCommand} activeBoard={activeBoard} />
    </div>
  );
}
