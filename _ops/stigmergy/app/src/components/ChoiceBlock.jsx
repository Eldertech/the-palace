import React, { useState } from 'react';
import { Button } from './primitives.jsx';
import ArtifactSlot from './ArtifactSlot.jsx';
import { choiceFromPayload, buildChoiceResponse } from '../lib/richcontent.js';
import { postMessage, InvalidMessageError } from '../adapters/blackboard.js';

// A/B or ranked choice over options that can each carry an inline artifact
// (the audio-audition case: "which K-sweep render reads best?"). Picking posts
// a §2.2 REPLY correlated to the card; the asking agent reads the choice next
// cycle. Posts directly (like InlineResponse) — the SSE live tail brings the
// REPLY back into the board.
export default function ChoiceBlock({ msg }) {
  const choice = choiceFromPayload(msg && msg.payload);
  const [picked, setPicked] = useState(null);   // option id (pick mode)
  const [ranks, setRanks] = useState({});       // { id: ordinal } (rank mode)
  const [sending, setSending] = useState(false);
  const [ack, setAck] = useState(null);
  const [errors, setErrors] = useState([]);

  if (!choice) return null;
  const { mode, options, prompt } = choice;

  function toggleRank(id) {
    setRanks((prev) => {
      if (prev[id]) {
        // Deselect, then renumber the rest preserving their relative order.
        const remaining = Object.entries(prev)
          .filter(([k]) => k !== id)
          .sort((a, b) => a[1] - b[1])
          .map(([k]) => k);
        const out = {};
        remaining.forEach((k, i) => { out[k] = i + 1; });
        return out;
      }
      return { ...prev, [id]: Object.keys(prev).length + 1 };
    });
  }

  const rankingArray = Object.entries(ranks).sort((a, b) => a[1] - b[1]).map(([k]) => k);
  const sent = ack != null;
  const canSend = !sending && !sent && (mode === 'pick' ? picked != null : rankingArray.length > 0);

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setErrors([]);
    try {
      const reply = buildChoiceResponse({
        card: msg,
        choice: mode === 'pick' ? picked : undefined,
        ranking: mode === 'rank' ? rankingArray : undefined,
      });
      await postMessage(reply, 'persistent');
      setAck(mode === 'pick' ? `sent: ${picked}` : `sent ranking: ${rankingArray.join(' > ')}`);
    } catch (err) {
      setErrors(err instanceof InvalidMessageError
        ? err.errors.map((e) => (typeof e === 'string' ? e : e.message || JSON.stringify(e)))
        : [err.message || 'Unknown error']);
    } finally {
      setSending(false);
    }
  }

  return (
    <div data-testid="choice-block" data-choice-mode={mode} style={{ marginTop: 8 }}>
      {prompt ? (
        <div style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', marginBottom: 6 }}>
          {'? '}{prompt}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 8 }}>
        {options.map((opt, i) => {
          const selected = mode === 'pick' ? picked === opt.id : !!ranks[opt.id];
          return (
            <div
              key={opt.id}
              data-testid="choice-option"
              data-option-id={opt.id}
              data-selected={selected ? 'true' : 'false'}
              style={{
                border: `1px solid ${selected ? 'var(--phosphor)' : 'var(--phosphor-dim)'}`,
                background: selected ? 'var(--phosphor-deep)' : 'transparent',
                borderRadius: 0,
                padding: '8px 10px',
              }}
            >
              <Button
                hot={String(i + 1)}
                tone={selected ? 'primary' : 'default'}
                onClick={() => (mode === 'pick' ? setPicked(opt.id) : toggleRank(opt.id))}
                disabled={sending || sent}
              >
                {mode === 'rank' && ranks[opt.id] ? `#${ranks[opt.id]} ` : ''}{opt.label}
              </Button>
              {opt.artifact_path ? <ArtifactSlot payload={{ artifact_path: opt.artifact_path }} /> : null}
              {opt.caption ? (
                <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12, marginTop: 4 }}>
                  {opt.caption}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
        <Button tone="primary" onClick={handleSend} disabled={!canSend}>
          {sending ? 'SENDING...' : mode === 'rank' ? 'SEND RANKING' : 'SEND PICK'}
        </Button>
        {ack ? (
          <span data-testid="choice-ack" style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 12 }}>
            {ack}
          </span>
        ) : null}
      </div>

      {errors.length > 0 ? (
        <div data-testid="choice-errors" style={{
          marginTop: 6, border: '1px solid var(--error)', color: 'var(--error)',
          padding: '6px 10px', fontSize: 12, lineHeight: 1.5,
        }}>
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      ) : null}
    </div>
  );
}
