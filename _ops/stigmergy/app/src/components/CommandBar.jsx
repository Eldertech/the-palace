import React from 'react';
import { BOARDS } from '../lib/format.js';

// Map numeric key '1'..'6' to the corresponding board name.
// key '1' → BOARDS[0] = 'GENERAL', key '2' → BOARDS[1] = 'FLAGS', etc.
function boardForKey(key) {
  const idx = parseInt(key, 10);
  if (isNaN(idx) || idx < 1 || idx > 6) return null;
  return BOARDS[idx - 1] || null;
}

// LIVE / connection indicator — relocated here from the (removed) top status
// bar. connected → LIVE (phosphor); connecting/reconnecting → RECONNECTING
// (warn); offline → OFFLINE (error). Keeps data-testid/data-state for the
// live-tail tests. `marginLeft:auto` floats it flush-right in the command bar.
function LiveIndicator({ liveState = 'offline' }) {
  let label, color;
  if (liveState === 'connected') { label = 'LIVE'; color = 'var(--phosphor)'; }
  else if (liveState === 'connecting' || liveState === 'reconnecting') { label = 'RECONNECTING'; color = 'var(--warn)'; }
  else { label = 'OFFLINE'; color = 'var(--error)'; }
  return (
    <span
      data-testid="live-indicator"
      data-state={liveState}
      style={{ marginLeft: 'auto', color, textShadow: 'var(--glow)' }}
    >
      {'● '}{label}
    </span>
  );
}

// CommandBar renders the sticky bottom command bar.
// - commands: Array of { key, label, disabled? }
// - onCommand: (key) => void
// - activeBoard: string (the current active board name, e.g. 'FLAGS')
// - liveState: SSE connection state, shown flush-right as the LIVE indicator.
//
// Numeric-key commands (1..6) get an inverted active state when their board
// matches activeBoard — same inversion treatment as the top ChannelTabs.
export default function CommandBar({ commands = [], onCommand, activeBoard, liveState = 'offline' }) {
  if (commands.length === 0) return null;

  return (
    <div data-testid="command-bar" style={{
      borderTop: '1px dashed var(--phosphor-dim)',
      padding: '6px 20px', display: 'flex', gap: 20, flexWrap: 'wrap',
      position: 'sticky', bottom: 0, background: 'var(--bg)', zIndex: 10,
    }}>
      {commands.map((c) => {
        const board = boardForKey(c.key);
        const isActive = board != null && board === activeBoard;

        return (
          <span
            key={c.key}
            data-key={c.key}
            data-active={isActive ? 'true' : 'false'}
            onClick={() => onCommand?.(c.key)}
            style={{
              cursor: c.disabled ? 'not-allowed' : 'pointer',
              color: isActive
                ? 'var(--bg)'
                : c.disabled ? 'var(--fg3)' : 'var(--phosphor)',
              background: isActive ? 'var(--phosphor)' : 'transparent',
              textShadow: isActive || c.disabled ? 'none' : 'var(--glow)',
            }}
            onMouseEnter={(e) => {
              if (!c.disabled && !isActive) {
                e.currentTarget.style.background = 'var(--phosphor)';
                e.currentTarget.style.color = 'var(--bg)';
                e.currentTarget.style.textShadow = 'none';
              }
            }}
            onMouseLeave={(e) => {
              if (!c.disabled && !isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--phosphor)';
                e.currentTarget.style.textShadow = 'var(--glow)';
              }
            }}
          >
            [<b style={{ color: isActive ? 'var(--bg)' : c.disabled ? 'var(--fg3)' : 'var(--phosphor-white)' }}>{c.key}</b>]&nbsp;{c.label}
          </span>
        );
      })}
      <LiveIndicator liveState={liveState} />
    </div>
  );
}
