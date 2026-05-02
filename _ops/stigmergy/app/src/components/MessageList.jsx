import React from 'react';
import { Rule } from './primitives.jsx';
import { glyphFor, accentFor, formatTs } from '../lib/format.js';

function fmtPayload(payload) {
  if (payload === undefined || payload === null) return '';
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object') {
    if (typeof payload.content === 'string') return payload.content;
    if (typeof payload.message === 'string') return payload.message;
    if (typeof payload.rationale === 'string') return payload.rationale;
    if (typeof payload.conclusion === 'string') return payload.conclusion;
    if (typeof payload.reason === 'string') return payload.reason;
    return JSON.stringify(payload, null, 2);
  }
  return String(payload);
}

function pickBorder({ flagged, type, healthScore }) {
  if (flagged) return '1px solid var(--error)';
  if (type === 'PROOF') return '2px double var(--phosphor-bright)';
  if (type === 'HEALTH_NOTICE') {
    if (healthScore === 'red') return '1px solid var(--error)';
    if (healthScore === 'yellow') return '1px solid var(--warn)';
  }
  return '1px solid var(--phosphor-dim)';
}

function MessageRow({ msg }) {
  const flagged = Array.isArray(msg._warnings) && msg._warnings.length > 0;
  const type = msg.type || 'BROADCAST';
  const healthScore = msg.health?.score;
  const accent = accentFor(type);
  const glyph = glyphFor(type);
  const isSystem = type === 'SESSION_INIT' || type === 'SESSION_CLOSE';
  const isReply = type === 'REPLY';
  const isQuery = type === 'QUERY';

  const rowStyle = {
    margin: '6px 0',
    padding: '6px 10px',
    border: pickBorder({ flagged, type, healthScore }),
    color: 'var(--phosphor)',
    textShadow: 'var(--glow)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    textAlign: isSystem ? 'center' : 'left',
    opacity: isSystem ? 0.85 : 1,
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
    justifyContent: isSystem ? 'center' : 'flex-start',
  };

  const body = fmtPayload(msg.payload);

  return (
    <div
      data-testid="message-row"
      data-type={type}
      data-board={msg.board || ''}
      data-flagged={flagged ? 'true' : 'false'}
      style={rowStyle}
    >
      <div style={meta}>
        {glyph && (
          <span data-testid="type-glyph" style={{
            color: accent, textShadow: 'var(--glow)', fontWeight: 600, minWidth: '1ch',
          }}>{glyph}</span>
        )}
        <span style={{ color: accent, textShadow: 'var(--glow)', fontWeight: 600 }}>
          from: {msg.from ? `@${msg.from}` : '@—'}
        </span>
        <span>·</span>
        <span>ts: {formatTs(msg.ts)}</span>
        <span>·</span>
        <span>type: {type}</span>
        <span>·</span>
        <span>board: {msg.board || '—'}</span>
        {isReply && msg.re && (
          <>
            <span>·</span>
            <span style={{ color: 'var(--phosphor-dim)' }}>re: {msg.re}</span>
          </>
        )}
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

      {type === 'PROOF' && msg.payload && typeof msg.payload === 'object' ? (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--phosphor-bright)', textShadow: 'var(--glow)',
          background: 'transparent', padding: '4px 0',
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(msg.payload, null, 2)}
          </pre>
        </div>
      ) : body ? (
        <pre style={{
          margin: 0,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxWidth: '78ch', fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--phosphor)',
          fontStyle: isQuery ? 'italic' : 'normal',
          textAlign: isSystem ? 'center' : 'left',
        }}>{body}</pre>
      ) : null}
    </div>
  );
}

export default function MessageList({ messages, sessionsEmpty, activeBoard }) {
  const heading = activeBoard
    ? `${activeBoard} BOARD · ${messages.length} traces`
    : `PERSISTENT BOARD · ${messages.length} traces`;
  return (
    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--phosphor)' }}>
      <Rule double>{heading}</Rule>
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
