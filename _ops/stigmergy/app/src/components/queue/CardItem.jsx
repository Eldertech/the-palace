import React, { useState } from 'react';
import ArtifactSlot from '../ArtifactSlot.jsx';
import { verdictTone } from '../../lib/card-model.js';
import { cardAge } from '../../lib/queue-model.js';

// CardItem — one Enrichment card as a QUEUE item (Phase 4.5).
//
// Renders the card's target, purpose, fv, summary, the validator-verdict strip
// (verbose mode), and the artifact inline via the existing rich-content engine
// (ArtifactSlot). Below: the deposit/revise/discard response controls. Acting
// posts to /api/cards/respond (writes the inbox block + fires the supervisor
// through the actuator); the parent handles the POST and refreshes.

const ACTIONS = [
  { id: 'deposit', label: 'DEPOSIT', tone: 'var(--phosphor)', note: false },
  { id: 'revise', label: 'REVISE', tone: 'var(--warn)', note: true },
  { id: 'discard', label: 'DISCARD', tone: 'var(--error)', note: false },
  { id: 'more-like-this', label: 'MORE LIKE THIS', tone: 'var(--ansi-bright-cyan)', note: false },
];

export default function CardItem({ card, onRespond, busy, onLaunch }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null); // action id awaiting note
  const [note, setNote] = useState('');

  const fire = (action) => {
    onRespond?.({ cardId: card.id, action, note: note.trim() || undefined, targetName: card.target_name, purpose: card.purpose });
    setPending(null);
    setNote('');
  };

  const onAction = (a) => {
    if (a.note) { setPending(a.id); return; }
    fire(a.id);
  };

  const vtone = verdictTone(card.validator_verdict);
  const age = cardAge(card.created);

  return (
    <div
      data-testid="card-item"
      data-card-id={card.id}
      style={{
        border: '1px solid var(--phosphor-dim)',
        borderLeft: '3px solid var(--ansi-bright-magenta)',
        padding: '6px 12px', marginBottom: 8, background: 'var(--phosphor-deep)',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{
          color: 'var(--ansi-bright-magenta)', textShadow: 'var(--glow)',
          border: '1px solid var(--ansi-bright-magenta)', padding: '0 6px',
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em',
        }}>enrichment</span>
        <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>{card.id}</span>
        <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', flex: 1, minWidth: '18ch' }}>
          {card.target_name || 'untargeted'}
        </span>
        {card.validator_verdict ? (
          <span
            data-testid="card-verdict"
            style={{ color: vtone, textShadow: 'var(--glow)', border: `1px solid ${vtone}`, padding: '0 5px', fontSize: 10, textTransform: 'uppercase' }}
            title={card.validator_note || ''}
          >
            {card.validator_verdict}
          </span>
        ) : null}
        {/* Age readout — same instrument as the queue cards: dim by default,
            amber when stale (>= 3 days). */}
        {age.label ? (
          <span
            data-testid="card-item-age"
            title={`created ${age.label}${age.label === 'just now' ? '' : ' ago'}${age.stale ? ' — old enough to be stale' : ''}`}
            style={{
              color: age.stale ? 'var(--warn)' : 'var(--phosphor-dim)',
              textShadow: age.stale ? 'var(--glow)' : 'none',
              border: `1px solid ${age.stale ? 'var(--warn)' : 'var(--phosphor-dim)'}`,
              padding: '0 5px', fontSize: 10, letterSpacing: '.04em',
            }}
          >{age.label}{age.stale ? ' old' : ''}</span>
        ) : null}
      </div>

      {card.purpose ? (
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
          purpose: {card.purpose}
        </div>
      ) : null}

      {card.summary ? (
        <div style={{ color: 'var(--phosphor)', textShadow: 'none', fontSize: 12, marginTop: 4, maxWidth: '78ch' }}>
          {card.summary}
        </div>
      ) : null}

      {/* The artifact, rendered inline by the rich-content engine. Text cards
          carry their body inline; media (image/audio/iframe) load via /api/file. */}
      <div style={{ marginTop: 6 }}>
        {card.artifact_type === 'text' && card.artifact_text ? (
          <pre data-testid="card-artifact-text" style={{
            margin: 0, border: '1px solid var(--phosphor-dim)', background: 'var(--bg)',
            color: 'var(--phosphor)', textShadow: 'none', fontSize: 12, lineHeight: 1.4,
            padding: '6px 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: '78ch',
          }}>{card.artifact_text}</pre>
        ) : card.artifact ? (
          <ArtifactSlot payload={{ artifacts: [{ path: `Enrichment/${card.id}/${card.artifact}`, caption: card.artifact }] }} />
        ) : null}
      </div>

      {card.validator_note ? (
        <div
          onClick={() => setOpen((o) => !o)}
          style={{ cursor: 'pointer', color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, marginTop: 4 }}
        >
          {open ? '[-]' : '[+]'} validator note{card.validator_iterations ? ` (iter ${card.validator_iterations})` : ''}
        </div>
      ) : null}
      {open && card.validator_note ? (
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, marginTop: 2, maxWidth: '78ch', borderLeft: '1px solid var(--phosphor-dim)', paddingLeft: 8 }}>
          {card.validator_note}
        </div>
      ) : null}

      {/* Response controls. */}
      <div data-testid="card-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
        {ACTIONS.map((a) => (
          <span
            key={a.id}
            data-testid={`card-action-${a.id}`}
            onClick={() => !busy && onAction(a)}
            style={{
              cursor: busy ? 'not-allowed' : 'pointer',
              color: busy ? 'var(--fg3)' : a.tone, textShadow: busy ? 'none' : 'var(--glow)',
              border: `1px solid ${busy ? 'var(--fg3)' : a.tone}`, padding: '0 8px',
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em',
            }}
          >{a.label}</span>
        ))}
        {/* Launch interactive: open a session on this card you can watch +
            steer — the same primitive as handoff pickup, for when a card wants
            dialogue rather than a one-click deposit/revise/discard. */}
        {typeof onLaunch === 'function' ? (
          <span
            data-testid="card-action-launch"
            onClick={() => onLaunch(card)}
            style={{
              cursor: 'pointer',
              color: 'var(--phosphor-white)', textShadow: 'var(--glow)',
              border: '1px solid var(--phosphor)', padding: '0 8px',
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em',
            }}
            title="open an interactive session on this card you can watch and steer"
          >launch interactive</span>
        ) : null}
      </div>

      {pending ? (
        <div data-testid="card-note-field" style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text" value={note} autoFocus
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fire(pending); if (e.key === 'Escape') setPending(null); }}
            placeholder={`${pending} note (the one lever for v2)...`}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: '1px dashed var(--phosphor-dim)', color: 'var(--phosphor)',
              textShadow: 'var(--glow)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', padding: '2px 0',
            }}
          />
          <span data-testid="card-note-send" onClick={() => fire(pending)} style={{
            cursor: 'pointer', color: 'var(--phosphor)', textShadow: 'var(--glow)',
            border: '1px solid var(--phosphor-dim)', padding: '0 8px', fontSize: 11, textTransform: 'uppercase',
          }}>send</span>
        </div>
      ) : null}
    </div>
  );
}
