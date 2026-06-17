import React, { useEffect, useState } from 'react';
import { Box, Button } from '../primitives.jsx';
import { healthColor, formatTs } from '../../lib/format.js';
import { postMessage, InvalidMessageError } from '../../adapters/blackboard.js';
import { advanceSteward } from '../../adapters/stewards.js';
import { t } from '../../lib/lexicon.js';
import { buildCardGrant } from '../../lib/trickster-grants.js';
import EntryRefChips from '../EntryRefChips.jsx';
import Linkify from '../../lib/linkify.jsx';
import { usePalaceRef } from '../../lib/palace-ref.jsx';
import { resolveRef } from '../../lib/entry-ref.js';
import { assetsFor } from '../../lib/trickster-assets.js';
import AuditionStrip from './AuditionStrip.jsx';
import Schematic from './schematics/index.jsx';
import ArtifactSlot from '../ArtifactSlot.jsx';

// Re-exported for unit tests that import the builder from the card module.
export { buildCardGrant };

// TricksterCard — one pending decision in the native [T] deck.
//
// The locked reading order (Loudon tuned every beat, 2026-06-16): context loads
// first; the question sits directly on its buttons. Top → bottom:
//   1. who          — the project, a cyan link to its STATE entry. A quiet amber
//                      "waiting on you" ONLY when the steward is blocked.
//   2. orientation  — the steward's catchup ground (or, when it wrote none, its
//                      raw reasoning note). Dim, visible by default, NO pill.
//   3. evidence     — the audio / pictures / schematic to perceive (when any).
//   3b.▸more        — the deep why (rationale), folded, ABOVE the question: the
//                      rationale is context, not metadata, so by the
//                      "context above the question" rule it sits up here.
//   4. question     — the ask, bright, sitting DIRECTLY above the options.
//   5. options      — natural order, never reordered; the steward's recommended
//                      option marked ON its own button (brighter + a dim `rec`),
//                      never a separate yellow lean panel.
//   6. ▸details     — the wire facts (ts · resource · health · id), folded at
//                      the foot. Reference metadata, below the decision.
//
// Interaction is TWO STEP (anti-misclick — Loudon's explicit choice over
// one-click): clicking an option SELECTS it (fills it, no commit), which reveals
// a "how to execute" row — `<label> — how?  file ▶  file & run ▶  cancel`. FILE
// posts the grant; FILE & RUN posts it AND advances the asking steward one cycle;
// CANCEL backs out. Nothing is filed on the first click.
//
// Radical minimalism: only slots with content render. Gone from the old card —
// the request-id, the PARKED/DOING tag, the "no catchup" pill, every field
// label, the freeform-note label + hint, the separate LeanPanel, and the
// duplicated always-visible file buttons.
//
// Selection is CONTROLLED by the deck (TricksterDeck owns a per-request_id
// `selections` map) so the keyboard layer's 1-N/Enter and the mouse clicks drive
// one source of truth. `selectedId` is the deck's pick for this card;
// `onSelectOption(optionId)` reports a click up for the deck to toggle. `notes`
// stays local — the freeform note is a per-card, mouse-only field.
export default function TricksterCard({ item, onConfirmed, onRun, focused = false, selectedId = null, onSelectOption }) {
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState([]);

  // The project (@from) is the title of the palace entry the steward inhabits.
  // Resolve it so the name carries the same [OBS]/[BUN] links as a name in
  // STATE, and so the name itself becomes a click-to-open-in-STATE link.
  // Coordinator handles (KURAMOTO-1, COORDINATOR) won't resolve and render plain.
  const palace = usePalaceRef();
  // Trigger the one-time palace-index walk only now that a card is on screen
  // (lazy: board-only views never pay for it). See palace-ref.jsx.
  useEffect(() => { palace?.ensureLoaded?.(); }, [palace?.ensureLoaded]);
  const fromRef = palace && palace.refIndex ? resolveRef(palace.refIndex, item.from) : null;

  const options = item.options || [];
  const recId = item.recommended_option ? item.recommended_option.id : null;
  // Inline assets, payload-first: artifacts the steward declared on the wire
  // (item.artifacts) render through the shared ArtifactSlot; only when the wire
  // carries nothing does the legacy trickster-assets registry fall in. The
  // registry `schematic` slot renders either way — it's authored art, not a
  // steward-rendered file.
  const payloadArtifacts = item.artifacts || [];
  const hasPayloadArtifacts = payloadArtifacts.length > 0;
  const assets = assetsFor(item.request_id);

  const selectedOption = options.find((o) => o.id === selectedId) || null;
  const hasNote = notes.trim() !== '';
  // Fileable once the human has expressed something: a chosen option, or a
  // freeform note. (Notes-only is valid — buildRequestOptionResponse allows it.)
  const canFile = !sending && (selectedId !== null || hasNote);
  // The two-step execute row appears the instant there's something to file.
  const showExecute = selectedId !== null || hasNote;

  // Orientation: the steward's catchup ground, or — when it wrote none — its raw
  // reasoning note standing in. No pill either way. When ground is present, the
  // rationale becomes the deep "why" under ▸more; when the rationale is already
  // serving as orientation, ▸more carries no separate why (don't repeat it).
  const orientation = item.ground || item.rationale || null;
  const moreRationale = item.ground ? item.rationale : null;

  const ctx = typeof item.agent_context_pct === 'number'
    ? `${Math.round(item.agent_context_pct * 100)}%`
    : '--';

  // The single write path for this card. FILE and FILE & RUN both run through
  // here. Always the persistent board — permanent stewards carry a session_id
  // label even though their requests live on persistent; routing by session_id
  // would misfile the grant where the asker can't see it.
  //
  // `run`: after the grant lands, advance the asking steward (item.from) by one
  // cycle so it consumes this fresh grant immediately. postMessage() awaits the
  // server append, so the grant is on the board before advanceSteward() fires.
  // advanceSteward() never throws (404 / 409 / errors come back as a structured
  // result), so the outcome is reported up via onRun() and the file still counts
  // — a failed run never un-files a landed grant.
  async function fileGrant({ optionId, optionLabel, notes: noteText, run = false }) {
    if (sending) return;
    setSending(true);
    if (run) setRunning(true);
    setErrors([]);
    try {
      const message = buildCardGrant(item, { optionId, optionLabel, notes: noteText });
      const persisted = await postMessage(message, 'persistent');
      if (run) {
        const result = await advanceSteward(item.from);
        if (onRun) onRun(result, item.from);
      }
      if (onConfirmed) onConfirmed(persisted);
      // The parent drops this card on re-derive (and its lifted selection
      // orphans harmlessly — read only by a still-pending request_id). Reset
      // the local note as belt-and-braces.
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
      setRunning(false);
    }
  }

  function handleFile() {
    if (!canFile) return;
    fileGrant({ optionId: selectedId, optionLabel: selectedOption ? selectedOption.label : null, notes });
  }

  // FILE & RUN — file the human's current pick (or note), then advance the asking
  // steward by one cycle so it consumes the grant straight away.
  function handleFileAndRun() {
    if (!canFile) return;
    fileGrant({ optionId: selectedId, optionLabel: selectedOption ? selectedOption.label : null, notes, run: true });
  }

  // CANCEL — back out of the armed step: deselect the option and clear any note,
  // returning the card to neutral. No commit (that's the whole point of step 2).
  function handleCancel() {
    if (sending) return;
    if (selectedId !== null && onSelectOption) onSelectOption(selectedId); // toggles off
    setNotes('');
  }

  const nameResolved = fromRef && fromRef.path;

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
        {/* 1. who — the project, a cyan link to its STATE entry. A quiet amber
            "waiting on you" only when the steward is blocked on this answer. */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
          marginBottom: orientation ? 4 : 8,
        }}>
          <span
            data-testid="card-from"
            onClick={nameResolved ? () => palace.openEntryInState?.(fromRef.path) : undefined}
            title={nameResolved ? `open ${item.from} in STATE` : undefined}
            style={{
              color: nameResolved ? 'var(--link)' : 'var(--phosphor-white)',
              textShadow: 'var(--glow)',
              fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600,
              cursor: nameResolved ? 'pointer' : 'default',
            }}
          >{item.from || '--'}</span>
          <EntryRefChips
            resolved={fromRef}
            onOpen={palace?.openEntryInState}
            vault={palace?.vault}
            size={9}
          />
          {item.blocking ? (
            <span data-testid="card-waiting" style={{
              marginLeft: 'auto',
              color: 'var(--warn)', textShadow: 'var(--glow)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
            }}>{t('trickster.card.waiting')}</span>
          ) : null}
        </div>

        {/* 2. orientation — where the project is / what it's doing. Dim, no pill;
            falls back to the steward's raw reasoning when no catchup was written. */}
        {orientation ? (
          <div data-testid="card-orientation" style={{
            margin: '0 0 10px',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.45,
            color: 'var(--phosphor-dim)', textShadow: 'none',
          }}>{orientation}</div>
        ) : null}

        {/* 3. evidence — perceive what the decision needs: hear the audition, see
            the prototype, open the artifact. Payload artifacts win; the registry
            falls in only when the wire carries none (schematic renders either
            way — authored art). */}
        {(assets || hasPayloadArtifacts) ? (
          <div data-testid="card-assets" style={{ marginBottom: 10 }}>
            {assets?.schematic ? <Schematic name={assets.schematic} /> : null}
            {hasPayloadArtifacts ? (
              <ArtifactSlot payload={{ artifacts: payloadArtifacts }} />
            ) : (
              <>
                {assets?.audition ? <AuditionStrip {...assets.audition} /> : null}
                {assets?.artifacts ? <ArtifactSlot payload={{ artifacts: assets.artifacts }} /> : null}
              </>
            )}
          </div>
        ) : null}

        {/* 3b. ▸ more from the steward (the deep why) — folded, ABOVE the
            question because the rationale is context, not metadata: by the
            "context above the question" rule it belongs up here with the
            orientation. Renders only when the rationale isn't already standing
            in as the orientation line. */}
        {moreRationale ? (
          <details data-testid="card-more-fold" style={{ margin: '0 0 10px' }}>
            <summary style={foldSummary}>{t('trickster.card.more')}</summary>
            <div style={{
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.4,
              margin: '6px 0', whiteSpace: 'pre-wrap',
            }}>
              <Linkify text={moreRationale} />
            </div>
          </details>
        ) : null}

        {/* 4. question — the ask, bright, sitting DIRECTLY above the options so a
            label like "approve stage 2" reads against its own buttons. */}
        {item.headline ? (
          <div data-testid="card-headline" style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: 18, lineHeight: 1.35, color: 'var(--phosphor-white)',
            textShadow: 'var(--glow)',
          }}>{item.headline}</div>
        ) : null}

        {/* 5. options — natural order, never reordered. The steward's
            recommendation is marked on its own button, not in a separate panel. */}
        {options.length > 0 ? (
          <div
            data-testid="card-options"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}
          >
            {options.map((opt, i) => (
              <OptionButton
                key={opt.id}
                hot={String(i + 1)}
                label={opt.label}
                recommended={opt.id === recId}
                selected={opt.id === selectedId}
                disabled={sending}
                onClick={() => onSelectOption && onSelectOption(opt.id)}
              />
            ))}
          </div>
        ) : null}

        {/* Freeform note — quiet, unlabeled. The notes-only path (and a way to
            add nuance to a pick). Typing it arms the same two-step row below. */}
        <textarea
          data-testid="card-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('trickster.card.note.placeholder')}
          rows={2}
          disabled={sending}
          style={{
            width: '100%', background: 'transparent',
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            border: '1px dashed var(--phosphor-dim)',
            fontFamily: 'var(--font-mono)', fontSize: 13,
            padding: '5px 8px', outline: 'none',
            caretColor: 'var(--phosphor-white)',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />

        {/* 6 (step 2). The two-step execute row — revealed only once an option is
            selected (or a note typed). `<label> — how?  file ▶  file & run ▶
            cancel`. Nothing commits until file / file & run is pressed. */}
        {showExecute ? (
          <div data-testid="card-execute" style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            marginTop: 8,
          }}>
            <span style={{
              color: 'var(--phosphor-dim)', textShadow: 'none',
              fontFamily: 'var(--font-mono)', fontSize: 12,
            }}>
              <b style={{ color: 'var(--phosphor-white)', textShadow: 'var(--glow)' }}>
                {selectedOption ? selectedOption.label : t('trickster.card.yourreply')}
              </b>{' '}{t('trickster.card.how')}
            </span>
            <Button tone="primary" onClick={handleFile} disabled={!canFile}>
              {sending && !running ? t('trickster.card.filing') : t('trickster.card.file')}
            </Button>
            <Button tone="warn" onClick={handleFileAndRun} disabled={!canFile}>
              {running ? t('trickster.card.running') : t('trickster.card.fileandrun')}
            </Button>
            <span
              data-testid="card-cancel"
              onClick={handleCancel}
              style={{
                cursor: sending ? 'default' : 'pointer',
                color: 'var(--phosphor-dim)', textShadow: 'none',
                fontSize: 11, textDecoration: 'underline',
              }}
            >{t('trickster.card.cancel')}</span>
          </div>
        ) : null}

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

        {/* ▸ details (the wire facts: ts · resource · health · id) — reference
            metadata, so it stays at the foot, below the decision. Always
            present, collapsed. The rationale moved up to ▸more (above the
            question); details is no longer nested inside it. */}
        <WireDetails item={item} ctx={ctx} />
      </Box>
    </div>
  );
}

// One request-supplied option as a click-to-select chip. Three visual states in
// the BBS phosphor grammar:
//   normal       — outline, dim border
//   recommended  — brighter outline + text + a trailing dim `rec` (the steward's
//                  lean, marked on the button itself, never a separate panel)
//   selected     — filled / inverted (the two-step's step-1 "armed" look)
// Hover inverts an unselected option, matching the shared Button primitive.
function OptionButton({ hot, label, recommended = false, selected = false, disabled = false, onClick }) {
  const [hover, setHover] = useState(false);
  const inverted = selected || (hover && !disabled);
  const baseColor = disabled
    ? 'var(--fg3)'
    : recommended ? 'var(--phosphor-white)' : 'var(--phosphor)';
  const borderColor = disabled
    ? 'var(--fg3)'
    : recommended ? 'var(--phosphor)' : 'var(--phosphor-dim)';
  return (
    <button
      data-testid="card-option"
      data-recommended={recommended ? 'true' : 'false'}
      data-selected={selected ? 'true' : 'false'}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        background: inverted ? baseColor : 'transparent',
        color: inverted ? 'var(--bg)' : baseColor,
        border: `2px solid ${inverted ? baseColor : borderColor}`,
        textShadow: inverted || disabled ? 'none' : 'var(--glow)',
        fontFamily: 'var(--font-mono)', fontSize: 13,
        padding: '3px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textTransform: 'uppercase', letterSpacing: '.04em',
        borderRadius: 0, outline: 'none', appearance: 'none',
        WebkitAppearance: 'none', MozAppearance: 'none',
      }}
    >
      {hot ? <>[<b style={{ color: inverted ? 'var(--bg)' : 'var(--phosphor-white)', textShadow: inverted ? 'none' : 'var(--glow)' }}>{hot}</b>]&nbsp;</> : null}
      {label}
      {recommended ? (
        <span style={{
          marginLeft: 7, fontSize: 9, letterSpacing: '.1em',
          opacity: inverted ? 0.7 : 1,
          color: inverted ? 'var(--bg)' : 'var(--phosphor-dim)',
          textShadow: 'none',
        }}>{t('trickster.card.rec')}</span>
      ) : null}
    </button>
  );
}

// The wire facts, folded — ts · resource · health · id (+ query_intent). No
// field labels: the values stand on their own under a single ▸details disclosure.
function WireDetails({ item, ctx }) {
  const facts = [];
  if (item.ts) facts.push({ text: formatTs(item.ts) });
  if (item.resource) facts.push({ text: item.resource });
  if (item.agent_health) facts.push({ text: `${item.agent_health} · ctx ${ctx}`, color: healthColor(item.agent_health) });
  if (item.request_id) facts.push({ text: item.request_id });
  return (
    <details data-testid="card-details-fold" style={{ marginTop: 8 }}>
      <summary style={foldSummary}>{t('trickster.card.details')}</summary>
      <div style={{
        color: 'var(--phosphor-dim)', textShadow: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5,
        marginTop: 6,
      }}>
        {facts.map((f, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <span>{'  ·  '}</span> : null}
            <span style={f.color ? { color: f.color, textShadow: 'var(--glow)' } : undefined}>{f.text}</span>
          </React.Fragment>
        ))}
        {item.query_intent ? (
          <div style={{ marginTop: 4 }}>{item.query_intent}</div>
        ) : null}
      </div>
    </details>
  );
}

const foldSummary = {
  cursor: 'pointer',
  color: 'var(--phosphor-dim)', textShadow: 'none',
  fontFamily: 'var(--font-mono)',
  fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
  padding: '2px 0',
};
