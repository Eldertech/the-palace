import React from 'react';
import { Box, Rule } from './primitives.jsx';
import { buildInbox } from '../lib/inbox.js';
import { healthColor, formatTs, parseLinks } from '../lib/format.js';

// Pad a label to a fixed width so colons align in monospace.
const padLabel = (s) => (s + '          ').slice(0, 9);

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

function PendingItem({ item }) {
  const ctx = typeof item.agent_context_pct === 'number'
    ? `${Math.round(item.agent_context_pct * 100)}%`
    : '—';
  const titleParts = [
    `req: ${item.request_id || '—'}`,
    item.blocking ? 'blocking' : 'non-blocking',
    item.agent_health || '—',
  ].join(' · ');
  // Vertical key:value metadata — text-rendered, aligned colons.
  const metaLines = [
    ['from', `@${item.from || '—'}`],
    ['ts', formatTs(item.ts)],
    ['resource', item.resource || '—'],
    ['blocking', String(item.blocking)],
    ['health', `${item.agent_health || '—'} · ctx ${ctx}`],
    ['status', item.agent_status || '—'],
  ];
  return (
    <div data-testid="inbox-pending-item" style={{ margin: '6px 0' }}>
    <Box tone="single" title={titleParts} pad>
      <div style={{ marginBottom: 6 }}>
        <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', fontWeight: 600 }}>
          ? PENDING TRICKSTER DECISION
        </span>
      </div>
      <div style={{
        color: 'var(--phosphor-dim)', textShadow: 'none', lineHeight: 1.4, marginBottom: 6,
      }}>
        {metaLines.map(([k, v]) => (
          <div key={k}>
            <span>{padLabel(k)}: </span>
            <span style={{
              color: k === 'blocking' && item.blocking ? 'var(--error)' :
                     k === 'health' ? healthColor(item.agent_health) :
                     'var(--phosphor)',
              textShadow: 'var(--glow)',
            }}>{v}</span>
          </div>
        ))}
      </div>
      {item.rationale ? (
        <div style={{ margin: '4px 0', color: 'var(--phosphor)' }}>
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>{padLabel('rationale')}:</div>
          <div style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>
            <Linkify text={item.rationale} />
          </div>
        </div>
      ) : null}
      {item.query_intent ? (
        <div style={{ margin: '4px 0', color: 'var(--phosphor-dim)', textShadow: 'none' }}>
          {padLabel('intent')}: {item.query_intent}
        </div>
      ) : null}

      <div data-testid="inbox-response-options" style={{
        marginTop: 6, fontSize: 12,
        color: 'var(--phosphor-dim)', textShadow: 'none',
      }}>
        <div>response options (read-only in v0.1):</div>
        <ul style={{ margin: '2px 0 0 12px', padding: 0 }}>
          {item.response_options.map((opt, i) => (
            <li key={i}>
              {opt.label}
              {opt.constraints ? ` -- ${opt.constraints}` : ''}
              {opt.reason ? ` -- ${opt.reason}` : ''}
            </li>
          ))}
        </ul>
      </div>
    </Box>
    </div>
  );
}

export default function TricksterInbox({ messages }) {
  const { pending_requests } = buildInbox(messages);
  return (
    <div data-testid="trickster-inbox" style={{ marginBottom: 12 }}>
      <Rule double>{`TRICKSTER INBOX · ${pending_requests.length} pending`}</Rule>
      {pending_requests.length === 0 ? (
        <div data-testid="inbox-empty" style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
          padding: '8px 0', fontSize: 13,
        }}>
          NO PENDING REQUESTS. ALL AGENTS UNBLOCKED.
        </div>
      ) : (
        pending_requests.map((p) => <PendingItem key={p.request_id || p.from + p.ts} item={p} />)
      )}
      <div
        data-testid="inbox-edit-caption"
        style={{
          color: 'var(--warn)', textShadow: 'var(--glow)',
          padding: '4px 8px', fontSize: 12,
          border: '1px dashed var(--warn)',
          margin: '6px 0',
        }}
      >
        EDIT _ops/swarm/persistent/blackboard.jsonl TO RESPOND
      </div>
    </div>
  );
}
