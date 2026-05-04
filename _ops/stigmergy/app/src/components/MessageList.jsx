import React from 'react';
import { Rule } from './primitives.jsx';
import { glyphFor, accentFor, formatTs, parseLinks } from '../lib/format.js';

// Pad a label to a fixed width so colons align in monospace.
const padLabel = (s) => (s + '         ').slice(0, 8);

// Render a string with markdown links [text](url) and bare URLs as <a> tags.
function Linkify({ text }) {
  const parts = parseLinks(text);
  return parts.map((p, i) =>
    p.type === 'text'
      ? <React.Fragment key={i}>{p.value}</React.Fragment>
      : (
        <a
          key={i}
          href={p.url}
          style={{
            color: 'var(--ansi-bright-cyan)',
            textShadow: 'var(--glow)',
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
        >
          {p.text}
        </a>
      )
  );
}

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

  const body = fmtPayload(msg.payload);

  // Build the metadata as vertical key:value lines — text-rendered, aligned colons.
  const metaLines = [
    ['from', msg.from ? `@${msg.from}` : '@—'],
    ['ts', formatTs(msg.ts)],
    ['type', type],
    ['board', msg.board || '—'],
  ];
  if (isReply && msg.re) metaLines.push(['re', msg.re]);
  if (msg.health) {
    const h = msg.health;
    const parts = [];
    if (h.score) parts.push(h.score);
    if (typeof h.context_pct === 'number') parts.push(`ctx ${Math.round(h.context_pct * 100)}%`);
    if (h.model) parts.push(h.model);
    if (parts.length > 0) metaLines.push(['health', parts.join(' · ')]);
  }
  if (flagged) metaLines.push(['flags', `! ${msg._warnings.length} warning${msg._warnings.length > 1 ? 's' : ''}`]);

  return (
    <div
      data-testid="message-row"
      data-type={type}
      data-board={msg.board || ''}
      data-flagged={flagged ? 'true' : 'false'}
      style={rowStyle}
    >
      <div style={{ marginBottom: 6 }}>
        {glyph && (
          <span data-testid="type-glyph" style={{
            color: accent, textShadow: 'var(--glow)', fontWeight: 600,
          }}>{glyph} </span>
        )}
        <span style={{ color: accent, textShadow: 'var(--glow)', fontWeight: 600 }}>
          {type}
        </span>
        <div style={{
          color: 'var(--phosphor-dim)', textShadow: 'none', marginTop: 4, lineHeight: 1.4,
        }}>
          {metaLines.map(([k, v]) => (
            <div key={k}>
              <span>{padLabel(k)}: </span>
              <span style={{
                color: k === 'flags' ? 'var(--error)' : 'var(--phosphor)',
                textShadow: k === 'flags' ? 'var(--glow)' : 'var(--glow)',
              }}>{v}</span>
            </div>
          ))}
        </div>
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
        <div style={{
          margin: 0,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxWidth: '78ch', fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--phosphor)',
          fontStyle: isQuery ? 'italic' : 'normal',
          textAlign: isSystem ? 'center' : 'left',
        }}>
          <Linkify text={body} />
        </div>
      ) : null}
    </div>
  );
}

export default function MessageList({ messages, sessionsEmpty, activeBoard }) {
  const heading = activeBoard
    ? `${activeBoard} BOARD · ${messages.length} traces`
    : `PERSISTENT BOARD · ${messages.length} traces`;
  // Newest-first ordering for display. ISO 8601 strings sort lexically; loose
  // date-only ts strings (e.g. "2026-04-01") sort against full ISO consistently.
  const sorted = [...messages].sort((a, b) =>
    String(b?.ts || '').localeCompare(String(a?.ts || ''))
  );
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
      {sorted.length === 0 ? (
        <div style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
          padding: '12px 0', fontSize: 13,
        }} data-testid="empty-board">
          NO TRACES ON THIS BOARD YET.
        </div>
      ) : (
        sorted.map((m, i) => <MessageRow key={m.id ?? `noid-${i}`} msg={m} />)
      )}
      <Rule>end of board</Rule>
    </div>
  );
}
