import React, { useState } from 'react';
import { Box, Button, Tag } from '../primitives.jsx';
import { healthColor, formatTs, parseLinks, hrefFor } from '../../lib/format.js';
import { postMessage, InvalidMessageError } from '../../adapters/blackboard.js';
import { t, pauseShort, pauseLong } from '../../lib/lexicon.js';
import { buildCardGrant } from '../../lib/trickster-grants.js';
import { assetsFor } from '../../lib/trickster-assets.js';
import LeanPanel from './LeanPanel.jsx';
import AuditionStrip from './AuditionStrip.jsx';
import ArtifactSlot from '../ArtifactSlot.jsx';

// Re-exported for unit tests that import the builder from the card module.
export { buildCardGrant };

// TricksterCard — one pending decision in the native [T] deck.
//
// A close cousin of TricksterInbox's <PendingItem> + <InlineResponse>, re-laid
// for the deck per the Phase-1 handoff: header (steward + id + pause pill) →
// headline → ground → options grid + freeform note → file ▶ → a fold that
// carries the longform reasoning + metadata.
//
// Catchup-first (voice rule 6): headline + ground lead in human prose; the
// rationale + field rows fold under "more from the steward". When a steward
// wrote no catchup (legacy data, no override), the fold opens by default and a
// dim pill flags the absence — same behavior as the inbox.
//
// Filing: build a §2.2 RESOURCE_GRANT via buildRequestOptionResponse(), POST it
// to the persistent board, then call onConfirmed(persisted). The card does NOT
// remove itself — the parent re-derives buildInbox() over the optimistic set,
// and a responded request drops out on the next render. One source of truth
// (App), no local list surgery. Per the session calibration: no batches —
// each card files its own grant independently.

// Pad a metadata label to a fixed width so colons align in monospace.
const padLabel = (s) => (s + '          ').slice(0, 9);

// Render a string with markdown links [text](url) and bare URLs as <a> tags.
// Duplicated from TricksterInbox for Phase 1; the two surfaces converge in
// Phase 6, at which point this and the inbox's copy hoist to one helper.
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

export default function TricksterCard({ item, onConfirmed, focused = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState([]);

  const options = item.options || [];
  const assets = assetsFor(item.request_id);
  const selectedOption = options.find((o) => o.id === selectedId) || null;
  // Fileable once the human has expressed something: a chosen option, or a
  // freeform note. (Notes-only is valid — buildRequestOptionResponse allows it.)
  const canFile = !sending && (selectedId !== null || notes.trim() !== '');

  const ctx = typeof item.agent_context_pct === 'number'
    ? `${Math.round(item.agent_context_pct * 100)}%`
    : '--';

  const metaLines = [
    [t('field.from'), `@${item.from || '--'}`],
    [t('field.ts'), formatTs(item.ts)],
    [t('field.resource'), item.resource || '--'],
    [t('pause.field.label'), pauseLong(item.blocking)],
    [t('field.health'), `${item.agent_health || '--'} · ctx ${ctx}`],
    [t('field.status'), item.agent_status || '--'],
  ];

  // The single write path for this card. Both the options-grid FILE button and
  // the LeanPanel's FILE LEAN flow through here. Always the persistent board —
  // permanent stewards carry a session_id label even though their requests live
  // on persistent; routing by session_id would misfile the grant where the
  // asker can't see it. (Same rationale as TricksterInbox's InlineResponse.)
  async function fileGrant({ optionId, optionLabel, notes: noteText }) {
    if (sending) return;
    setSending(true);
    setErrors([]);
    try {
      const message = buildCardGrant(item, { optionId, optionLabel, notes: noteText });
      const persisted = await postMessage(message, 'persistent');
      if (onConfirmed) onConfirmed(persisted);
      // The parent will drop this card on re-derive; reset is belt-and-braces.
      setSelectedId(null);
      setNotes('');
    } catch (err) {
      if (err instanceof InvalidMessageError) {
        setErrors(
          err.errors.length > 0
            ? err.errors.map((e) => (typeof e === 'string' ? e : e.message || JSON.stringify(e)))
            : ['the palace rejected this — no details given']
        );
      } else {
        setErrors([err.message || 'something went wrong filing this']);
      }
    } finally {
      setSending(false);
    }
  }

  function handleFile() {
    if (!canFile) return;
    fileGrant({
      optionId: selectedId,
      optionLabel: selectedOption ? selectedOption.label : null,
      notes,
    });
  }

  // FILE LEAN — file the steward's recommended option, no note.
  function handleFileLean() {
    const rec = item.recommended_option;
    if (!rec) return;
    fileGrant({ optionId: rec.id, optionLabel: rec.label, notes: '' });
  }

  return (
    <div
      data-testid="trickster-card"
      data-request-id={item.request_id}
      data-focused={focused ? 'true' : 'false'}
      style={{
        margin: '10px 0',
        outline: focused ? '2px solid var(--phosphor-white)' : 'none',
        outlineOffset: 2,
      }}
    >
      <Box tone="double" pad>
        {/* Header: steward + correlation id + pause pill */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
          marginBottom: 8,
        }}>
          <span style={{
            color: 'var(--phosphor-white)', textShadow: 'var(--glow)',
            fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
          }}>@{item.from || '--'}</span>
          <span style={{
            color: 'var(--phosphor-dim)', textShadow: 'none',
            fontFamily: 'var(--font-mono)', fontSize: 11,
          }}>{item.request_id || '--'}</span>
          <span style={{ marginLeft: 'auto' }}>
            <Tag tone={item.blocking ? 'err' : 'default'}>{pauseShort(item.blocking)}</Tag>
          </span>
        </div>

        {/* No-catchup cue when the steward wrote neither headline nor ground. */}
        {!item.headline && !item.ground ? (
          <div data-testid="no-catchup-pill" style={{
            marginBottom: 6, color: 'var(--phosphor-dim)', textShadow: 'none',
            fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase',
            border: '1px solid var(--phosphor-dim)', padding: '1px 5px',
            display: 'inline-block',
          }}>{t('trickster.card.nocatchup')}</div>
        ) : null}

        {/* Headline: the question in one sentence. Large body font. */}
        {item.headline ? (
          <div data-testid="card-headline" style={{
            margin: '2px 0 6px',
            fontFamily: 'var(--font-body, "Cormorant Garamond", Georgia, serif)',
            fontSize: 21, lineHeight: 1.3, color: 'var(--phosphor-white)',
            textShadow: 'var(--glow)',
          }}>{item.headline}</div>
        ) : null}

        {/* Ground: the breadcrumb. State · what's pinned · steward's lean. */}
        {item.ground ? (
          <div data-testid="card-ground" style={{
            margin: '0 0 10px',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.45,
            color: 'var(--phosphor-dim)', textShadow: 'none',
          }}>{item.ground}</div>
        ) : null}

        {/* Inline assets — the evidence the decision needs, surfaced between
            the question and the affordances: hear the audition, see the
            prototype, open the artifact to try. Embeds/files go through the
            shared ArtifactSlot (sandboxed iframe / open-in-native-app);
            sequenced audio keeps AuditionStrip for the play-all + note labels. */}
        {assets ? (
          <div data-testid="card-assets">
            {assets.audition ? <AuditionStrip {...assets.audition} /> : null}
            {assets.artifacts ? <ArtifactSlot payload={{ artifacts: assets.artifacts }} /> : null}
          </div>
        ) : null}

        {/* Lean panel — the steward's recommended option as the one-click
            default. Renders only when a lean was detected; the grid below
            stays the override path. */}
        {item.recommended_option ? (
          <LeanPanel
            optionLabel={item.recommended_option.label}
            onFileLean={handleFileLean}
            disabled={sending}
          />
        ) : null}

        {/* Options grid (request-supplied a/b/c choices), when present. */}
        {options.length > 0 ? (
          <div
            data-testid="card-options"
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
        ) : null}

        {/* Freeform note — always available, on its own or to add depth. */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            color: 'var(--phosphor-dim)', textShadow: 'none',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em',
            marginBottom: 4,
          }}>{t('trickster.card.freeform')}</div>
          <textarea
            data-testid="card-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('trickster.card.freeform.hint')}
            rows={2}
            disabled={sending}
            style={{
              width: '100%', background: 'transparent',
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              border: '1px dashed var(--phosphor-dim)',
              fontFamily: 'var(--font-mono)', fontSize: 13,
              padding: '6px 8px', outline: 'none',
              caretColor: 'var(--phosphor-white)',
              resize: 'vertical', minHeight: '48px', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* File row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
          <Button tone="primary" onClick={handleFile} disabled={!canFile}>
            {sending ? t('trickster.card.filing') : t('trickster.card.file')}
          </Button>
        </div>

        {/* Errors from a failed POST */}
        {errors.length > 0 ? (
          <div
            data-testid="card-errors"
            style={{
              marginTop: 8, border: '1px solid var(--error)', padding: '6px 10px',
              color: 'var(--error)', lineHeight: 1.5, fontSize: 12,
            }}
          >
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        ) : null}

        {/* Folded longform: reasoning + metadata. Open by default only when
            there's no catchup, so a catchup card stays scannable. */}
        <details
          data-testid="card-more-fold"
          open={!item.headline && !item.ground}
          style={{ marginTop: 8 }}
        >
          <summary style={{
            cursor: 'pointer',
            color: 'var(--phosphor-dim)', textShadow: 'none',
            fontFamily: 'var(--font-ui, "Manrope", sans-serif)',
            fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
            padding: '2px 0',
          }}>{t('trickster.card.more')}</summary>

          <div style={{
            color: 'var(--phosphor-dim)', textShadow: 'none', lineHeight: 1.4,
            marginTop: 6, marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 12,
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
            <div style={{ margin: '4px 0', color: 'var(--phosphor)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>{padLabel(t('field.rationale'))}:</div>
              <div style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>
                <Linkify text={item.rationale} />
              </div>
            </div>
          ) : null}
          {item.query_intent ? (
            <div style={{ margin: '4px 0', color: 'var(--phosphor-dim)', textShadow: 'none', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {padLabel(t('field.intent'))}: {item.query_intent}
            </div>
          ) : null}
        </details>
      </Box>
    </div>
  );
}
