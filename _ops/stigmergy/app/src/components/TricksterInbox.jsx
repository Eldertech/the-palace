import React, { useState } from 'react';
import { Box, Rule, Button } from './primitives.jsx';
import { buildInbox } from '../lib/inbox.js';
import { healthColor, formatTs, parseLinks } from '../lib/format.js';
import ResponseModal from './ResponseModal.jsx';

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

function PendingItem({ item, onOptionClick }) {
  const ctx = typeof item.agent_context_pct === 'number'
    ? `${Math.round(item.agent_context_pct * 100)}%`
    : '--';
  const titleParts = [
    `req: ${item.request_id || '--'}`,
    item.blocking ? 'blocking' : 'non-blocking',
    item.agent_health || '--',
  ].join(' · ');
  // Vertical key:value metadata -- text-rendered, aligned colons.
  const metaLines = [
    ['from', `@${item.from || '--'}`],
    ['ts', formatTs(item.ts)],
    ['resource', item.resource || '--'],
    ['blocking', String(item.blocking)],
    ['health', `${item.agent_health || '--'} · ctx ${ctx}`],
    ['status', item.agent_status || '--'],
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

      {/* Response option buttons — interactive in v0.2 */}
      <div
        data-testid="inbox-response-options"
        style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}
      >
        {item.response_options.map((opt, i) => (
          <Button
            key={i}
            hot={String(i + 1)}
            tone="default"
            onClick={() => onOptionClick(item, opt)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </Box>
    </div>
  );
}

export default function TricksterInbox({ messages, onConfirmed }) {
  // Modal state: null when closed, { request, option } when open.
  const [openFor, setOpenFor] = useState(null);

  // The parent (App) is the source of truth for optimistic state — it
  // merges the persisted message into visibleMessages and re-derives the
  // tab badge count along with everything else. This component just
  // re-derives the inbox from the messages prop; when App appends, the
  // pending list re-renders with the responded-to request removed.
  const { pending_requests } = buildInbox(messages || []);

  function handleOptionClick(request, option) {
    setOpenFor({ request, option });
  }

  function handleConfirmed(persistedMessage) {
    if (onConfirmed) onConfirmed(persistedMessage);
    setOpenFor(null);
  }

  function handleCancel() {
    setOpenFor(null);
  }

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
        pending_requests.map((p) => (
          <PendingItem
            key={p.request_id || p.from + p.ts}
            item={p}
            onOptionClick={handleOptionClick}
          />
        ))
      )}

      {openFor && (
        <ResponseModal
          request={openFor.request}
          option={openFor.option}
          onConfirmed={handleConfirmed}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
