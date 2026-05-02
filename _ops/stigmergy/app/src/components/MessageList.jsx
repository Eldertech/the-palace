import React from 'react';
import { Rule } from './primitives.jsx';

function fmtPayload(payload) {
  if (payload === undefined || payload === null) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    if (typeof payload.content === 'string') return payload.content;
    if (typeof payload.message === 'string') return payload.message;
    return JSON.stringify(payload, null, 2);
  }
  return String(payload);
}

function MessageRow({ msg }) {
  const flagged = Array.isArray(msg._warnings) && msg._warnings.length > 0;
  const rowStyle = {
    margin: '6px 0',
    padding: '6px 10px',
    border: flagged ? '1px solid var(--error)' : '1px solid var(--phosphor-dim)',
    color: 'var(--phosphor)',
    textShadow: 'var(--glow)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
  };
  const meta = {
    color: 'var(--phosphor-dim)',
    textShadow: 'none',
    fontSize: 13,
    display: 'flex',
    gap: 12,
    marginBottom: 6,
    flexWrap: 'wrap',
    lineHeight: 1.4,
  };
  const body = fmtPayload(msg.payload);

  return (
    <div data-testid="message-row" data-flagged={flagged ? 'true' : 'false'} style={rowStyle}>
      <div style={meta}>
        <span style={{
          color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)',
          fontWeight: 600,
        }}>
          from: {msg.from ? `@${msg.from}` : '@—'}
        </span>
        <span>·</span>
        <span>ts: {msg.ts || '—'}</span>
        <span>·</span>
        <span>type: {msg.type || '—'}</span>
        <span>·</span>
        <span>board: {msg.board || '—'}</span>
        {flagged && (
          <>
            <span>·</span>
            <span style={{ color: 'var(--error)', textShadow: 'var(--glow)' }}>
              ! flagged ({msg._warnings.length})
            </span>
          </>
        )}
      </div>
      {flagged && (
        <div style={{
          color: 'var(--error)', textShadow: 'none',
          fontSize: 10, marginBottom: 4, opacity: 0.9,
        }}>
          warnings: {msg._warnings.join(', ')}
        </div>
      )}
      {body ? (
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxWidth: '78ch', fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--phosphor)',
        }}>{body}</pre>
      ) : null}
    </div>
  );
}

export default function MessageList({ messages, sessionsEmpty }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--phosphor)' }}>
      <Rule double>{`PERSISTENT BOARD · ${messages.length} traces`}</Rule>
      {sessionsEmpty && (
        <div style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
          margin: '6px 0', fontSize: 12,
        }} data-testid="no-sessions">
          NO SESSIONS YET. PERSISTENT BOARD ONLY.
        </div>
      )}
      {messages.length === 0 ? (
        <div style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
          padding: '12px 0', fontSize: 13,
        }} data-testid="empty-board">
          NO TRACES ON THIS BOARD YET.
        </div>
      ) : (
        messages.map((m, i) => <MessageRow key={m.id ?? `noid-${i}`} msg={m} />)
      )}
      <Rule>end of board</Rule>
    </div>
  );
}
