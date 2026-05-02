import React from 'react';
import { Box, Rule } from './primitives.jsx';
import { buildInbox } from '../lib/inbox.js';
import { healthColor, formatTs } from '../lib/format.js';

function PendingItem({ item }) {
  const ctx = typeof item.agent_context_pct === 'number'
    ? `${Math.round(item.agent_context_pct * 100)}%`
    : '—';
  const titleParts = [
    `req: ${item.request_id || '—'}`,
    item.blocking ? 'blocking' : 'non-blocking',
    item.agent_health || '—',
  ].join(' · ');
  return (
    <div data-testid="inbox-pending-item" style={{ margin: '6px 0' }}>
    <Box tone="single" title={titleParts} pad>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', fontWeight: 600 }}>
          ? from: @{item.from}
        </span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
          ts: {formatTs(item.ts)}
        </span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
          resource:{' '}
          <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>
            {item.resource || '—'}
          </span>
        </span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
          blocking:{' '}
          <span style={{
            color: item.blocking ? 'var(--error)' : 'var(--phosphor-dim)',
            textShadow: item.blocking ? 'var(--glow)' : 'none',
          }}>
            {String(item.blocking)}
          </span>
        </span>
        <span style={{ color: healthColor(item.agent_health), textShadow: 'var(--glow)' }}>
          {item.agent_health || '—'}
        </span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
          ctx {ctx}
        </span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
          status: {item.agent_status}
        </span>
      </div>
      {item.rationale ? (
        <div style={{ margin: '4px 0', color: 'var(--phosphor)' }}>
          <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>rationale:</span>{' '}
          {item.rationale}
        </div>
      ) : null}
      {item.query_intent ? (
        <div style={{ margin: '4px 0', color: 'var(--phosphor-dim)', textShadow: 'none' }}>
          query_intent: {item.query_intent}
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
