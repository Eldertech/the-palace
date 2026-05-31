import React from 'react';
import { vantage } from '../../lib/queue-model.js';

// One honest QUEUE item. It asserts an act at a time from a vantage, names its
// stale_if git-condition, and points to live state -- it never declares present
// truth. When git has satisfied its stale_if, it greys with a "looks done --
// clear it?" affordance (the human confirms; nothing self-deletes silently).

const KIND_LABEL = {
  resource_request: 'RESOURCE REQUEST',
  handoff_ready: 'HANDOFF READY',
};
const KIND_COLOR = {
  resource_request: 'var(--ansi-bright-cyan)',
  handoff_ready: 'var(--warn)',
};

export default function QueueItem({ item, onJump, onClear }) {
  const resolved = item.resolved?.done;
  const accent = KIND_COLOR[item.kind] || 'var(--phosphor)';

  return (
    <div
      data-testid="queue-item"
      data-kind={item.kind}
      data-resolved={resolved ? 'true' : 'false'}
      style={{
        border: '1px solid var(--phosphor-dim)',
        borderLeft: `3px solid ${resolved ? 'var(--phosphor-dim)' : accent}`,
        padding: '8px 12px',
        marginBottom: 8,
        background: 'var(--phosphor-deep)',
        opacity: resolved ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{
          color: resolved ? 'var(--phosphor-dim)' : accent, textShadow: resolved ? 'none' : 'var(--glow)',
          border: `1px solid ${resolved ? 'var(--phosphor-dim)' : accent}`, padding: '0 6px',
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em',
        }}>
          {KIND_LABEL[item.kind] || item.kind}
        </span>
        <span style={{ color: 'var(--phosphor)', textShadow: resolved ? 'none' : 'var(--glow)', flex: 1, minWidth: '20ch', textDecoration: resolved ? 'line-through' : 'none' }}>
          {item.summary}
        </span>
        {item.blocking && !resolved ? (
          <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11 }}>blocking</span>
        ) : null}
      </div>

      {/* The honest vantage: an act at a time, from a source -- never "is true now". */}
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, marginTop: 3 }}>
        {vantage(item)}
      </div>

      {/* The stale_if condition that would retire this item. */}
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, fontStyle: 'italic' }}>
        stale if: {item.stale_if}
      </div>

      {item.handoff_path ? (
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
          handoff: <span style={{ color: 'var(--ansi-bright-cyan)' }}>{item.handoff_path}</span>
        </div>
      ) : null}

      <div style={{ marginTop: 6, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {item.pointer ? (
          <span
            data-testid="queue-item-jump"
            onClick={() => onJump?.(item.pointer)}
            style={{
              cursor: onJump ? 'pointer' : 'default',
              color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', fontSize: 11,
              border: '1px dashed var(--phosphor-dim)', padding: '0 6px',
            }}
            title={item.pointer.type === 'entry' ? `open ${item.pointer.target} in STATE` : `go to ${item.pointer.target}`}
          >
            {item.pointer.type === 'entry' ? `STATE: ${item.pointer.target}` : `board: ${item.pointer.target}`}
          </span>
        ) : null}

        {resolved ? (
          <span data-testid="queue-item-resolved" style={{
            color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 11,
          }}>
            looks done -- {item.resolved.reason}.{' '}
            <span
              data-testid="queue-item-clear"
              onClick={() => onClear?.(item)}
              style={{ cursor: onClear ? 'pointer' : 'default', textDecoration: 'underline' }}
            >
              clear it?
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
