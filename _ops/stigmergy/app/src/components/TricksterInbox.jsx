import React, { useState } from 'react';
import { Box, Rule, Button } from './primitives.jsx';
import { buildInbox } from '../lib/inbox.js';
import { healthColor, formatTs, parseLinks, hrefFor } from '../lib/format.js';
import { buildRequestOptionResponse } from '../lib/response-builder.js';
import { postMessage, InvalidMessageError } from '../adapters/blackboard.js';
import { t, pauseShort, pauseLong } from '../lib/lexicon.js';
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
          href={hrefFor(p.url)}
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

// Inline response form for requests that carry their own payload.options[].
// Renders the request's options as togglable buttons plus an always-visible
// freeform textarea. SEND posts a RESOURCE_GRANT carrying option_id and notes.
// SEND is disabled until at least one of (option selected, notes non-empty).
function InlineResponse({ request, onConfirmed }) {
  const [selectedId, setSelectedId] = useState(null);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState([]);

  const options = request.options || [];
  const selectedOption = options.find((o) => o.id === selectedId) || null;
  const canSend = !sending && (selectedId !== null || notes.trim() !== '');

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setErrors([]);
    try {
      const message = buildRequestOptionResponse({
        request: {
          id: request._message_id,
          from: request.from,
          request_id: request.request_id,
          session_id: request._session_id,
        },
        optionId: selectedId,
        optionLabel: selectedOption ? selectedOption.label : null,
        notes,
        sessionId: request._session_id,
      });
      // Always route to the persistent board. The current `messages`
      // pipeline (App.jsx) only fetches /api/persistent and SSE only
      // subscribes to persistent — so every visible message originated
      // there, regardless of whether its session_id field is set.
      // Permanent agents (Stewards) carry a session_id label even though
      // their messages live on the persistent board; routing by session_id
      // misroutes those responses onto a session board where the original
      // request can never see them.
      const persisted = await postMessage(message, 'persistent');
      if (onConfirmed) onConfirmed(persisted);
      // Reset form on success — though the parent will likely unmount this
      // pending item entirely as soon as the response lands in `messages`.
      setSelectedId(null);
      setNotes('');
    } catch (err) {
      if (err instanceof InvalidMessageError) {
        setErrors(
          err.errors.length > 0
            ? err.errors.map((e) => (typeof e === 'string' ? e : e.message || JSON.stringify(e)))
            : ['Validation failed (no details)']
        );
      } else {
        setErrors([err.message || 'Unknown error']);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div data-testid="inline-response" style={{ marginTop: 8 }}>
      {/* Option buttons (request-supplied) */}
      <div
        data-testid="inline-response-options"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}
      >
        {options.map((opt, i) => (
          <Button
            key={opt.id}
            hot={String(i + 1)}
            tone={opt.id === selectedId ? 'primary' : 'default'}
            onClick={() => setSelectedId(opt.id === selectedId ? null : opt.id)}
            disabled={sending}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Always-visible freeform textarea */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
          fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em',
          marginBottom: 4,
        }}>
          freeform reply (use on its own, or to add depth to a chosen option)
        </div>
        <textarea
          data-testid="inline-response-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="type a reply, or leave blank if a button alone says it"
          rows={3}
          disabled={sending}
          style={{
            width: '100%',
            background: 'transparent',
            color: 'var(--phosphor)',
            textShadow: 'var(--glow)',
            border: '1px dashed var(--phosphor-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            padding: '6px 8px',
            outline: 'none',
            caretColor: 'var(--phosphor-white)',
            resize: 'vertical',
            minHeight: '60px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* SEND row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
        <Button tone="primary" onClick={handleSend} disabled={!canSend}>
          {sending ? 'SENDING...' : 'SEND'}
        </Button>
      </div>

      {/* Errors from a failed POST */}
      {errors.length > 0 && (
        <div
          data-testid="inline-response-errors"
          style={{
            marginTop: 8,
            border: '1px solid var(--error)',
            padding: '6px 10px',
            color: 'var(--error)',
            lineHeight: 1.5,
            fontSize: 12,
          }}
        >
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}
    </div>
  );
}

function PendingItem({ item, onOptionClick, onConfirmed }) {
  const ctx = typeof item.agent_context_pct === 'number'
    ? `${Math.round(item.agent_context_pct * 100)}%`
    : '--';
  const titleParts = [
    `req: ${item.request_id || '--'}`,
    pauseShort(item.blocking),
    item.agent_health || '--',
  ].join(' · ');
  // Vertical key:value metadata -- text-rendered, aligned colons.
  // Field names + values both go through the lexicon so the wire schema
  // (payload.blocking, msg.type, etc.) never leaks to Loudon's eyes.
  const metaLines = [
    [t('field.from'), `@${item.from || '--'}`],
    [t('field.ts'), formatTs(item.ts)],
    [t('field.resource'), item.resource || '--'],
    [t('pause.field.label'), pauseLong(item.blocking)],
    [t('field.health'), `${item.agent_health || '--'} · ctx ${ctx}`],
    [t('field.status'), item.agent_status || '--'],
  ];
  return (
    <div data-testid="inbox-pending-item" style={{ margin: '6px 0' }}>
    <Box tone="single" title={titleParts} pad>
      {/* Catchup-first layout (voice rule 6): headline + ground render at
          the top in human prose; the longform rationale + field rows fold
          under "more from the steward". When a steward hasn't written
          headline+ground (legacy data, no override), the renderer surfaces
          a dim "no catchup written" pill and falls back to rationale
          full-width below. */}
      <div style={{ marginBottom: 6 }}>
        <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', fontWeight: 600 }}>
          {t('trickster.pending.heading')}
        </span>
        {!item.headline && !item.ground ? (
          <span data-testid="no-catchup-pill" style={{
            marginLeft: 10, color: 'var(--phosphor-dim)', textShadow: 'none',
            fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
            border: '1px solid var(--phosphor-dim)', padding: '1px 5px',
          }}>steward emitted no catchup — using rationale</span>
        ) : null}
      </div>

      {/* Headline: the question in one sentence. Large body font.
          Falls back to absent — the dim pill above is the cue. */}
      {item.headline ? (
        <div data-testid="inbox-headline" style={{
          margin: '4px 0 4px',
          fontFamily: 'var(--font-body, "Cormorant Garamond", Georgia, serif)',
          fontSize: 19, lineHeight: 1.35, color: 'var(--phosphor-white)',
          textShadow: 'var(--glow)',
        }}>{item.headline}</div>
      ) : null}

      {/* Ground: the breadcrumb. State · what's pinned · steward's lean.
          Small mono dim. The fastest read-and-scroll line. */}
      {item.ground ? (
        <div data-testid="inbox-ground" style={{
          margin: '0 0 8px',
          fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.4,
          color: 'var(--phosphor-dim)', textShadow: 'none',
        }}>{item.ground}</div>
      ) : null}

      {/* Folded longform: opens to show the original rationale + metadata
          rows. Default-collapsed when catchup fields are present, so the
          card stays scannable; default-open when no catchup exists so the
          legacy data still reads as before. */}
      <details
        data-testid="inbox-more-fold"
        open={!item.headline && !item.ground}
        style={{ margin: '4px 0' }}
      >
        <summary style={{
          cursor: 'pointer',
          color: 'var(--phosphor-dim)', textShadow: 'none',
          fontFamily: 'var(--font-ui, "Manrope", sans-serif)',
          fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
          padding: '2px 0',
        }}>▸ more from the steward</summary>

        <div style={{
          color: 'var(--phosphor-dim)', textShadow: 'none', lineHeight: 1.4,
          marginTop: 6, marginBottom: 6,
        }}>
          {metaLines.map(([k, v]) => (
            <div key={k}>
              <span>{padLabel(k)}: </span>
              <span style={{
                color: k === t('pause.field.label') && item.blocking ? 'var(--error)' :
                       k === t('field.health') ? healthColor(item.agent_health) :
                       'var(--phosphor)',
                textShadow: 'var(--glow)',
              }}>{v}</span>
            </div>
          ))}
        </div>
        {item.rationale ? (
          <div style={{ margin: '4px 0', color: 'var(--phosphor)' }}>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>{padLabel(t('field.rationale', 'reasoning'))}:</div>
            <div style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>
              <Linkify text={item.rationale} />
            </div>
          </div>
        ) : null}
        {item.query_intent ? (
          <div style={{ margin: '4px 0', color: 'var(--phosphor-dim)', textShadow: 'none' }}>
            {padLabel(t('field.intent', 'intent'))}: {item.query_intent}
          </div>
        ) : null}
      </details>

      {/* Response area: inline if the request supplied its own options[],
          otherwise the existing modal-driven Grant/Deny/Custom flow. */}
      {item.options ? (
        <InlineResponse request={item} onConfirmed={onConfirmed} />
      ) : (
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
      )}
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
      <Rule double>{`${t('trickster.inbox.title')} · ${pending_requests.length}`}</Rule>
      {pending_requests.length === 0 ? (
        <div data-testid="inbox-empty" style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
          padding: '8px 0', fontSize: 13,
        }}>
          {t('trickster.inbox.empty')}
        </div>
      ) : (
        pending_requests.map((p) => (
          <PendingItem
            key={p.request_id || p.from + p.ts}
            item={p}
            onOptionClick={handleOptionClick}
            onConfirmed={onConfirmed}
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
