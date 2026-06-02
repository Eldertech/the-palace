import React, { useState } from 'react';
import { vantage } from '../../lib/queue-model.js';
import InlineProse from '../../lib/inline-prose.jsx';

// One honest QUEUE item. The hierarchy leads with WHO is asking, then the
// human-language ASK, then a small dim row for the technical resource type
// and metadata. The action row exposes Grant/Deny (and request-supplied
// a/b/c options when present) so the human can answer the request without
// leaving the deck.
//
// The item stays honest about its own staleness: it asserts an act at a
// time from a vantage, names its stale_if git-condition, points to live
// state -- it never declares present truth. When git resolves it, it
// greys with "looks done -- clear it?".

const KIND_LABEL = {
  resource_request: 'RESOURCE REQUEST',
  handoff_ready: 'HANDOFF READY',
  vector_proposal: 'WEAVE PROPOSAL',
};
const KIND_COLOR = {
  resource_request: 'var(--ansi-bright-cyan)',
  handoff_ready: 'var(--warn)',
  vector_proposal: 'var(--ansi-bright-magenta)',
};

const PROPOSAL_TYPE_LABEL = {
  promote_unsung: 'promote unsung path',
  new_typed_link: 'new typed link',
  label_enrichment: 'label enrichment',
  stage_transition: 'stage transition',
  vector_tuning: 'forward-vector tuning',
};

export default function QueueItem({ item, onJump, onClear, onRespond }) {
  const resolved = item.resolved?.done;
  const accent = KIND_COLOR[item.kind] || 'var(--phosphor)';
  const [showRationale, setShowRationale] = useState(false);

  const canRespond = !resolved
    && (item.kind === 'resource_request' || item.kind === 'vector_proposal')
    && typeof onRespond === 'function';

  return (
    <div
      data-testid="queue-item"
      data-kind={item.kind}
      data-resolved={resolved ? 'true' : 'false'}
      style={{
        border: '1px solid var(--phosphor-dim)',
        borderLeft: `3px solid ${resolved ? 'var(--phosphor-dim)' : accent}`,
        padding: '10px 14px',
        marginBottom: 10,
        background: 'var(--phosphor-deep)',
        opacity: resolved ? 0.55 : 1,
      }}
    >
      {/* Top strip: kind chip on the left, blocking on the right. */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{
          color: resolved ? 'var(--phosphor-dim)' : accent,
          textShadow: resolved ? 'none' : 'var(--glow)',
          border: `1px solid ${resolved ? 'var(--phosphor-dim)' : accent}`,
          padding: '0 6px',
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em',
        }}>
          {KIND_LABEL[item.kind] || item.kind}
        </span>
        <span style={{ flex: 1 }} />
        {item.blocking && !resolved ? (
          <span style={{
            color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11,
            border: '1px solid var(--warn)', padding: '0 6px',
            textTransform: 'uppercase', letterSpacing: '.05em',
          }}>blocking</span>
        ) : null}
      </div>

      {/* HERO 1: who is asking. */}
      <div
        data-testid="queue-item-from"
        style={{
          color: 'var(--phosphor-white, var(--phosphor))',
          textShadow: resolved ? 'none' : 'var(--glow)',
          fontSize: 18,
          fontFamily: 'var(--font-display, var(--font-mono))',
          textTransform: 'uppercase',
          letterSpacing: '.02em',
          marginBottom: 4,
        }}
      >
        {item.from || 'unknown'}
      </div>

      {/* HERO 2: what they are asking. */}
      <div
        data-testid="queue-item-ask"
        style={{
          color: 'var(--phosphor)', textShadow: resolved ? 'none' : 'var(--glow)',
          fontSize: 14, lineHeight: 1.45, marginBottom: 8,
          maxWidth: '78ch',
          textDecoration: resolved ? 'line-through' : 'none',
        }}
      >
        {item.ask || item.summary}
      </div>

      {/* Demoted metadata row: resource type chip + board lane. */}
      {item.kind === 'resource_request' ? (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none',
          marginBottom: 6,
        }}>
          {item.resourceType ? (
            <span data-testid="queue-item-resource-type" style={{
              border: '1px dotted var(--phosphor-dim)', padding: '0 6px',
              fontFamily: 'var(--font-mono)',
            }}>
              resource: {item.resourceType}
            </span>
          ) : null}
          <span>{vantage(item)}</span>
        </div>
      ) : item.kind === 'vector_proposal' ? (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none',
          marginBottom: 6,
        }}>
          {item.proposal_type ? (
            <span data-testid="queue-item-proposal-type" style={{
              border: '1px dotted var(--phosphor-dim)', padding: '0 6px',
              fontFamily: 'var(--font-mono)',
            }}>
              proposal: {PROPOSAL_TYPE_LABEL[item.proposal_type] || item.proposal_type}
            </span>
          ) : null}
          {item.source_entry || item.target_entry ? (
            <span data-testid="queue-item-proposal-edge" style={{ fontFamily: 'var(--font-mono)' }}>
              {item.source_entry ? item.source_entry.replace(/\.md$/, '') : '?'}
              {item.target_entry ? ` --> ${item.target_entry.replace(/\.md$/, '')}` : ''}
            </span>
          ) : null}
          <span>{vantage(item)}</span>
        </div>
      ) : (
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, marginBottom: 6 }}>
          {vantage(item)}
        </div>
      )}

      {/* Optional collapsed rationale (full prose context). */}
      {item.rationale && item.rationale !== item.ask ? (
        <div style={{ marginBottom: 6 }}>
          <span
            data-testid="queue-item-rationale-toggle"
            onClick={() => setShowRationale((v) => !v)}
            style={{
              cursor: 'pointer', color: 'var(--phosphor-dim)', fontSize: 11,
              borderBottom: '1px dotted currentColor',
            }}
          >
            {showRationale ? '[-] hide context' : '[+] show context'}
          </span>
          {showRationale ? (
            <div data-testid="queue-item-rationale" style={{
              marginTop: 4, padding: '6px 10px',
              borderLeft: '2px solid var(--phosphor-dim)',
              color: 'var(--phosphor)', textShadow: 'none',
              fontSize: 12, lineHeight: 1.45, maxWidth: '78ch',
            }}>
              <InlineProse text={item.rationale} keyPrefix={`rat-${item.id}`} />
              {item.recommendation ? (
                <div style={{
                  marginTop: 8, padding: '4px 8px',
                  borderLeft: '2px solid var(--ansi-bright-cyan)',
                  color: 'var(--ansi-bright-cyan)', fontSize: 11,
                }}>
                  steward recommends: <InlineProse
                    text={item.recommendation}
                    keyPrefix={`rec-${item.id}`}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* stale_if + handoff path are dim footer metadata. */}
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, fontStyle: 'italic' }}>
        stale if: {item.stale_if}
      </div>
      {item.handoff_path ? (
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
          handoff: <span style={{ color: 'var(--ansi-bright-cyan)' }}>{item.handoff_path}</span>
        </div>
      ) : null}

      {/* Action row: Grant / Deny / asker options + (when meaningful) jump.
          The jump chip is only meaningful for handoff_ready items pointing
          at a palace entry -- for resource_request items the pointer is
          back to the current board, which is redundant since the QUEUE
          deck IS that board. Hiding it keeps the action row about action. */}
      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {item.pointer && item.pointer.type === 'entry' ? (
          <span
            data-testid="queue-item-jump"
            onClick={() => onJump?.(item.pointer)}
            style={{
              cursor: onJump ? 'pointer' : 'default',
              color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', fontSize: 11,
              border: '1px dashed var(--phosphor-dim)', padding: '2px 8px',
            }}
            title={`open ${item.pointer.target} in STATE`}
          >
            STATE: {item.pointer.target}
          </span>
        ) : null}

        {canRespond ? (
          <>
            {/* Asker-supplied a/b/c options take priority -- they are how the
                asker designed the response shape. Each becomes a Grant with
                option_id baked into the response. */}
            {item.options && item.options.length > 0 ? (
              item.options.map((opt, i) => (
                <ActionChip
                  key={`opt-${i}`}
                  testId={`queue-item-option-${i}`}
                  onClick={() => onRespond(item, {
                    type: 'RESOURCE_GRANT',
                    option_id: opt.id,
                    option_label: opt.label,
                    constraints: null,
                  })}
                  label={`[${i + 1}] ${truncate(opt.label, 60)}`}
                  tone="ok"
                />
              ))
            ) : (
              <>
                <ActionChip
                  testId="queue-item-grant"
                  onClick={() => onRespond(item, { type: 'RESOURCE_GRANT', constraints: null })}
                  label="grant"
                  tone="ok"
                />
                <ActionChip
                  testId="queue-item-grant-limited"
                  onClick={() => onRespond(item, { type: 'RESOURCE_GRANT', constraints: '<constraints>' })}
                  label="grant -- limited"
                  tone="ok-dim"
                />
                <ActionChip
                  testId="queue-item-deny"
                  onClick={() => onRespond(item, { type: 'RESOURCE_DENY', reason: '<reason>' })}
                  label="deny"
                  tone="warn"
                />
              </>
            )}
            <ActionChip
              testId="queue-item-custom"
              onClick={() => onRespond(item, { type: 'freetext' })}
              label="custom..."
              tone="dim"
            />
          </>
        ) : null}

        {resolved ? (
          <span data-testid="queue-item-resolved" style={{
            color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 11,
            marginLeft: 'auto',
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

function ActionChip({ onClick, label, tone = 'default', testId }) {
  const palette = {
    ok: { fg: 'var(--ok, var(--phosphor))', border: 'var(--ok, var(--phosphor))' },
    'ok-dim': { fg: 'var(--phosphor)', border: 'var(--phosphor-dim)' },
    warn: { fg: 'var(--warn)', border: 'var(--warn)' },
    dim: { fg: 'var(--phosphor-dim)', border: 'var(--phosphor-dim)' },
    default: { fg: 'var(--phosphor)', border: 'var(--phosphor-dim)' },
  }[tone] || { fg: 'var(--phosphor)', border: 'var(--phosphor-dim)' };
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      style={{
        background: 'transparent',
        color: palette.fg,
        textShadow: 'var(--glow)',
        border: `1px solid ${palette.border}`,
        padding: '3px 10px',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 11,
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '.04em',
      }}
    >{label}</button>
  );
}

function truncate(s, n) {
  if (typeof s !== 'string') return '';
  return s.length > n ? `${s.slice(0, n - 1)}...` : s;
}
