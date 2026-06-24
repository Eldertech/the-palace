import React, { useState, useEffect, useRef } from 'react';
import { Banner } from './primitives.jsx';
import { buildInbox } from '../lib/inbox.js';
import { buildLeanGrants, buildCardGrant } from '../lib/trickster-grants.js';
import { resolveKey, toggleSelection, selectionFor } from '../lib/trickster-keys.js';
import { postMessage } from '../adapters/blackboard.js';
import { t } from '../lib/lexicon.js';
import TricksterCard from './trickster/TricksterCard.jsx';
import QuickBar from './trickster/QuickBar.jsx';
// DigestPanel (the auto-trickster tuning panel) is hidden for the time being —
// see the mount site below. Re-enable by restoring this import + the <DigestPanel />.
// import DigestPanel from './DigestPanel.jsx';
import LaunchModal from './queue/LaunchModal.jsx';
import AgentLaunchModal from './queue/AgentLaunchModal.jsx';
import { fetchStewards } from '../adapters/stewards.js';

// Shape an advanceSteward() result (from a card's FILE & RUN) into a one-line
// deck banner. The grant is already filed by the time this runs, so every
// branch leads with "filed" — a skipped or failed run never means the decision
// was lost. Wording mirrors the stewards deck's advance feedback so the two
// surfaces speak the same language.
export function formatRun(result, name) {
  if (result && result.ok && result.fired) {
    const cyc = result.cycle_n != null ? ` → cycle ${result.cycle_n}` : '';
    return { tone: 'ok', text: `filed · advancing @${name}${cyc}` };
  }
  if (result && (result.status === 409 || result.busy)) {
    return { tone: 'warn', text: `filed · a steward cycle is already running — @${name} will pick it up next` };
  }
  if (result && result.status === 404) {
    return { tone: 'warn', text: `filed · @${name} isn't a registered steward, so nothing ran` };
  }
  const why = (result && (result.error || result.msg))
    || `run failed${result && result.status ? ` (${result.status})` : ''}`;
  return { tone: 'err', text: `filed · but the run didn't start: ${why}` };
}

const RUN_COLOR = { ok: 'var(--phosphor)', warn: 'var(--warn)', err: 'var(--error)' };

// TricksterDeck — the native catchup-first decision lane (the [T] deck).
//
// Phase 1 replaced the iframe of /trickster.html with a native card list.
// Phase 2 adds the ergonomics the standalone page proved: a per-card lean
// panel (in TricksterCard), a master FILE ALL quickbar, and a keyboard layer.
//
// Data ownership: this deck is PRESENTATIONAL, not self-fetching. App owns the
// persistent-message store (fetch + SSE + optimistic merge) and keeps the SSE
// stream open at all times for the QUEUE badge. A self-fetching deck would open
// a SECOND EventSource to the same stream whenever it mounted, so App feeds
// `messages` + `onConfirmed` down instead. One data owner, one stream, one
// source of truth — a filed grant updates this deck AND the QUEUE badge at once.
//
// Card removal is automatic: onConfirmed appends the grant to App's optimistic
// set, App re-derives buildInbox() over it, and a responded request drops out
// of pending_requests on the next render.
//
// Write paths: per-card mouse filing lives in TricksterCard (it owns its own
// sending/error state). Bulk + keyboard filing lives HERE (fileItems) — the
// deck owns the list, so FILE ALL and space-to-file are deck concerns. Both
// build the same wire-grant via the shared trickster-grants builders, so the
// message shape never forks. Per the session calibration: no batches — each
// card POSTs its own grant; FILE ALL just walks them one at a time.
export default function TricksterDeck({
  messages = [],
  onConfirmed,
  loadState = 'ok',
  loadError = null,
  onReload,
}) {
  const { pending_requests } = buildInbox(messages);
  const n = pending_requests.length;
  const countLabel = n === 1 ? t('trickster.deck.count.one') : t('trickster.deck.count.many');

  // The leaned subset (cards with a detected recommended option) and the
  // remainder FILE ALL deliberately won't touch.
  const leans = pending_requests
    .filter((p) => p.recommended_option)
    .map((p) => p.recommended_option);
  const remainder = n - leans.length;

  const [filingAll, setFilingAll] = useState(false);
  const [fileErrors, setFileErrors] = useState([]);
  // Outcome of the most recent card FILE & RUN, shown as a deck banner. Lives
  // here (not on the card) because the card unmounts the instant its grant is
  // filed — the steward-advance result would vanish with it.
  const [runStatus, setRunStatus] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  // Clamp focus to the current list (it shrinks as cards are filed).
  const focused = n === 0 ? -1 : Math.min(focusedIndex, n - 1);

  // Lifted option-selection: request_id → chosen option id. Owned here (not in
  // each TricksterCard) so the keyboard layer's 1-N/Enter and the cards' mouse
  // clicks drive ONE source of truth. Entries for filed cards orphan harmlessly
  // — only read by a still-pending request_id. See trickster-keys.js.
  const [selections, setSelections] = useState({});
  const selectOption = (requestId, optionId) =>
    setSelections((prev) => toggleSelection(prev, requestId, optionId));

  // The card whose "open interactive" modal is open. A trickster launch drives
  // the ASKING steward (item.from) to RESOLVE this specific decision in a
  // watch+steer session — an alternative to filing a grant. When `from` is a
  // REGISTERED steward we open the construct-agent panel (the real page-agent
  // wake via buildCyclePrompt, with the decision pre-filled as the mandate);
  // otherwise we fall back to the simpler prompt launch, so a non-steward asker
  // (a coordinator handle, a one-off page) still gets a watchable session. The
  // deck owns the modals (like StewardsDeck / QueuePanel).
  const [launchContext, setLaunchContext] = useState(null);      // simple LaunchModal (fallback)
  const [agentLaunch, setAgentLaunch] = useState(null);          // { home, seed } -> AgentLaunchModal
  const [registered, setRegistered] = useState(null);            // Set of registered steward agent_ids

  // Resolve which askers are registered stewards (so we can route). One lazy
  // fetch on mount; until it loads, openLaunch falls back to the simple launch.
  useEffect(() => {
    let alive = true;
    fetchStewards().then((r) => {
      if (alive && r && r.ok) setRegistered(new Set((r.stewards || []).filter((s) => !s.missing).map((s) => s.agent_id)));
    });
    return () => { alive = false; };
  }, []);

  const openLaunch = (item) => {
    const ask = item.headline || item.resource || 'a parked decision';
    // A session request (the steward asked to be launched) gets a mandate that
    // resumes its OWN request — it wanted a live session for this work, and
    // Loudon said yes. A plain parked decision gets the resolve-this-decision
    // mandate. Both wake the same construct-agent panel.
    const wantsSession = item.kind === 'interactive_session';
    if (registered && registered.has(item.from)) {
      setAgentLaunch({
        home: item.from,
        seed: wantsSession
          ? `You asked Loudon to open this live session${item.headline ? `: "${item.headline}"` : ''}, and he said yes. Pick up exactly where your request left off${item.ground || item.rationale ? ` — ${item.ground || item.rationale}` : ''} and drive it forward with him, narrating each move before you make it. When the work reaches a natural stopping point, file the grant on your own request so the card clears.`
          : `Resolve the decision you parked for Loudon${item.headline ? `: "${item.headline}"` : ''}. Read your pending request on the TRICKSTER board, work it through, then file the grant (or steer) and continue the cycle.`,
      });
      return;
    }
    setLaunchContext({
      kind: 'steward',
      id: item.request_id,
      entry: item.from,
      from: item.from,
      summary: `It paused on a decision it left you — "${ask}". Read its request on the TRICKSTER board, work it through, then resolve it (file the grant) and continue the cycle.`,
    });
  };

  // Sequentially file the leaned grants among `items`, ~350 ms apart so each
  // card's drop-out registers one at a time. Items without a lean are skipped
  // by buildLeanGrants — never auto-filed.
  async function fileItems(items) {
    if (filingAll) return;
    const grants = buildLeanGrants(items);
    if (grants.length === 0) return;
    setFilingAll(true);
    setFileErrors([]);
    const errs = [];
    for (const { item, message } of grants) {
      try {
        const persisted = await postMessage(message, 'persistent');
        if (onConfirmed) onConfirmed(persisted);
      } catch (err) {
        errs.push(`${item.request_id}: ${err.message || 'could not file'}`);
      }
      await new Promise((r) => setTimeout(r, 350));
    }
    if (errs.length) setFileErrors(errs);
    setFilingAll(false);
  }

  // File a single card's current pick — the Enter override path. Unlike
  // fileItems (which files the steward's lean), this files whatever option the
  // human selected via 1-N or a click. No note: the freeform note is the
  // mouse-driven card FILE button's job; Enter is the fast option path.
  async function fileSelected(item) {
    if (filingAll || !item) return;
    const optionId = selectionFor(selections, item.request_id);
    if (!optionId) return;
    const opt = (item.options || []).find((o) => o.id === optionId) || null;
    setFilingAll(true);
    setFileErrors([]);
    try {
      const message = buildCardGrant(item, { optionId, optionLabel: opt ? opt.label : null });
      const persisted = await postMessage(message, 'persistent');
      if (onConfirmed) onConfirmed(persisted);
    } catch (err) {
      setFileErrors([`${item.request_id}: ${err.message || 'could not file'}`]);
    } finally {
      setFilingAll(false);
    }
  }

  // Keyboard layer. A ref carries the latest list/focus/selection so the
  // listener stays stable (one add/remove for the deck's lifetime) without
  // going stale. resolveKey() is the pure key→action map (unit-tested); this
  // handler only owns the side effects.
  const kbRef = useRef({});
  kbRef.current = { pending_requests, focused, filingAll, selections, fileItems, fileSelected, selectOption };
  useEffect(() => {
    function onKey(e) {
      // Don't hijack typing in the freeform note field.
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      const st = kbRef.current;
      const action = resolveKey(e.key, {
        list: st.pending_requests,
        focused: st.focused,
        selections: st.selections,
      });
      if (!action) return;
      e.preventDefault();
      const len = st.pending_requests.length;
      switch (action.type) {
        case 'focus-next': setFocusedIndex((i) => Math.min(i + 1, len - 1)); break;
        case 'focus-prev': setFocusedIndex((i) => Math.max(i - 1, 0)); break;
        case 'file-lean': st.fileItems([action.item]); break;
        case 'file-all': st.fileItems(st.pending_requests); break;
        case 'select': st.selectOption(action.requestId, action.optionId); break;
        case 'file-pick': st.fileSelected(action.item); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div data-testid="trickster-deck">
      <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 10 }}>
        {loadState === 'ok' ? <>{n} {countLabel}</> : null}
        {onReload ? (
          <span
            data-testid="trickster-reload"
            onClick={onReload}
            style={{
              marginLeft: 12, cursor: 'pointer',
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              border: '1px solid var(--phosphor-dim)', padding: '0 6px', fontSize: 11,
            }}
          >[R] RELOAD</span>
        ) : null}
      </div>

      {/* FILE & RUN outcome — lives outside the n===0 branch so it stays up
          even when running the last card empties the deck. */}
      {runStatus ? (
        <div data-testid="trickster-run-status" style={{
          border: `1px solid ${RUN_COLOR[runStatus.tone]}`,
          color: RUN_COLOR[runStatus.tone], textShadow: 'var(--glow)',
          padding: '6px 10px', marginBottom: 10, fontSize: 12,
        }}>
          {runStatus.text}
        </div>
      ) : null}

      {loadState === 'error' ? (
        <div data-testid="trickster-error" style={{
          color: 'var(--error)', textShadow: 'var(--glow)',
          border: '1px solid var(--error)', padding: 12,
        }}>
          {t('trickster.deck.error')}: {loadError}
        </div>
      ) : loadState === 'loading' && n === 0 ? (
        <div data-testid="trickster-loading" style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
        }}>{t('trickster.deck.loading')}</div>
      ) : n === 0 ? (
        <div data-testid="trickster-empty" style={{
          color: 'var(--phosphor-dim)', textShadow: 'none',
          padding: '8px 0', fontSize: 14,
        }}>{t('trickster.inbox.empty')}</div>
      ) : (
        <>
          <QuickBar
            leans={leans}
            remainder={remainder}
            onFileAll={() => fileItems(pending_requests)}
            busy={filingAll}
          />
          {leans.length > 0 ? (
            <div style={{
              color: 'var(--phosphor-dim)', textShadow: 'none',
              fontSize: 10, letterSpacing: '.06em', marginBottom: 10,
            }}>{t('trickster.deck.keyhint')}</div>
          ) : null}
          {fileErrors.length > 0 ? (
            <div data-testid="trickster-file-errors" style={{
              border: '1px solid var(--error)', color: 'var(--error)',
              textShadow: 'var(--glow)', padding: '6px 10px', marginBottom: 10, fontSize: 12,
            }}>
              {fileErrors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          ) : null}
          {pending_requests.map((p, i) => (
            <TricksterCard
              key={p.request_id || p.from + p.ts}
              item={p}
              onConfirmed={onConfirmed}
              onRun={(result, name) => setRunStatus(formatRun(result, name))}
              focused={i === focused}
              selectedId={selections[p.request_id] ?? null}
              onSelectOption={(optId) => selectOption(p.request_id, optId)}
              onLaunch={openLaunch}
            />
          ))}
        </>
      )}

      {/* The auto-trickster tuning panel (DigestPanel) — the calls a rule-engine
          WOULD make, with agree/differ to teach it whether to trust it. HIDDEN
          for the time being (2026-06-22, Loudon): not a useful feature right now.
          The engine, its rules, the digest writer, and DigestPanel.jsx all remain
          intact — this only un-mounts the UI. Re-enable: restore the import at the
          top of this file and uncomment the line below. */}
      {/* <DigestPanel /> */}

      {/* Open-interactive — drive the asking steward to resolve a decision. A
          registered steward opens the construct-agent panel (page-agent wake,
          decision pre-filled as the mandate); a non-steward asker falls back to
          the simpler prompt launch. The card opens it via onLaunch. */}
      {agentLaunch ? (
        <AgentLaunchModal home={agentLaunch.home} mandateSeed={agentLaunch.seed} onClose={() => setAgentLaunch(null)} />
      ) : null}
      {launchContext ? (
        <LaunchModal context={launchContext} onClose={() => setLaunchContext(null)} />
      ) : null}
    </div>
  );
}
