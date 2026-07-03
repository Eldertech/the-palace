import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '../primitives.jsx';
import QueueItem from './QueueItem.jsx';
import CardItem from './CardItem.jsx';
import LaunchModal from './LaunchModal.jsx';
import ResponseModal from '../ResponseModal.jsx';
import { buildQueue, reconcileQueue, partitionQueue, laneCounts, rankQueue } from '../../lib/queue-model.js';
import { fetchLog } from '../../adapters/log.js';
import { fetchCards, respondToCard } from '../../adapters/cards.js';
import { buildResponse, buildRequestOptionResponse } from '../../lib/response-builder.js';
import { postMessage } from '../../adapters/blackboard.js';
import { buildHandoffPickup } from '../../lib/handoff-builder.js';
import { applyWeaveProposal, emitUnsungAudit, emitHubAudit, emitVectorTuningAudit, emitStageAudit, emitLabelAudit } from '../../adapters/weave.js';

// QueuePanel — the unified, honest, ranked queue (Phase 4).
//
// One ranked inbox of everything open, generalizing the per-board tabs into
// lanes. Items are built from the board messages (resource requests +
// handoff_ready posts) and RECONCILED against git: when a commit satisfies an
// item's stale_if, the item greys with "looks done -- clear it?". This is the
// prospective (QUEUE) -> retrospective (LOG) crossing, made visible.
//
// `messages` is the live board feed (App passes visibleMessages). The LOG
// commits drive reconciliation; we fetch them once on mount and on demand.
// `dismissed` ids are cleared locally (the human's "clear it?" click) -- the
// durable record remains git; this just tidies the live view.

export default function QueuePanel({ messages, onJumpEntry }) {
  const [commits, setCommits] = useState([]);
  const [laneFilter, setLaneFilter] = useState(null);
  const [dismissed, setDismissed] = useState(() => new Set());
  const [showResolved, setShowResolved] = useState(true);
  // Response modal state: { item, verb, detail, request, option } when open,
  // null when closed. Only deny / grant--limited / custom open it now.
  const [respondingTo, setRespondingTo] = useState(null);
  // The normalized context whose "launch interactive" modal is open — a handoff
  // baton or an enrichment card (stewards next). See buildLaunchPrompt for kinds.
  const [launchContext, setLaunchContext] = useState(null);
  // Decisions made this session: itemId -> { verb, detail, pending, error }.
  // buildQueue drops an answered request (it is no longer "open"), so we keep
  // a snapshot + the decision and re-attach it below, so the chosen verdict
  // (GRANTED / DENIED / RESPONDED) stays visible until the human clears it.
  const [decisions, setDecisions] = useState(() => new Map());
  const [snapshots, setSnapshots] = useState(() => new Map());
  const [decisionNote, setDecisionNote] = useState(null); // grant-error feedback
  // Pending auto-clear timers (itemId -> timeout). Once a verdict is confirmed,
  // the card lingers ~10s so you can read it, then tidies itself away.
  const autoClearTimers = useRef(new Map());
  const AUTO_CLEAR_MS = 10_000;
  // Enrichment cards (Phase 4.5): the absorbed Enrichment card queue.
  const [cards, setCards] = useState([]);
  const [cardBusy, setCardBusy] = useState(false);
  const [cardNote, setCardNote] = useState(null); // last response feedback
  // Unsung-path audit (the Weave's posting half, in the terminal). `audit` holds
  // the last result: a dry-run plan (phase 'dry'), a live post ('posted'), or an
  // error. `auditBusy` guards the two clicks while a request is in flight.
  const [audit, setAudit] = useState(null);
  const [auditBusy, setAuditBusy] = useState(false);
  // The audit kind chosen in the collapsed audit pulldown (run on the button).
  const [auditKindSel, setAuditKindSel] = useState('unsung');

  // Record (or update) the verdict badge for an item, snapshotting the item so
  // it keeps rendering after buildQueue drops the now-answered request.
  function recordDecision(item, patch) {
    setDecisions((prev) => {
      const next = new Map(prev);
      next.set(item.id, { ...(next.get(item.id) || {}), ...patch });
      return next;
    });
    setSnapshots((prev) => {
      if (prev.has(item.id)) return prev;
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });
  }

  // Drop an optimistic decision (a failed POST) so the action row returns.
  function revertDecision(item) {
    setDecisions((prev) => {
      if (!prev.has(item.id)) return prev;
      const next = new Map(prev);
      next.delete(item.id);
      return next;
    });
    setSnapshots((prev) => {
      if (!prev.has(item.id)) return prev;
      const next = new Map(prev);
      next.delete(item.id);
      return next;
    });
  }

  // The verb the card shows once an item is answered.
  function decisionVerb(option) {
    if (option.type === 'RESOURCE_DENY') return 'DENIED';
    if (option.type === 'freetext') return 'RESPONDED';
    return 'GRANTED'; // plain grant, grant--limited, or an asker-supplied option
  }
  function decisionDetail(option) {
    if (option.option_label) return option.option_label;
    if (option.type === 'RESOURCE_GRANT' && option.constraints != null) return 'limited';
    return null;
  }

  // A "complete" grant needs no typed input -- plain grant, or an asker-
  // supplied a/b/c option. These fire immediately, no modal. Deny /
  // grant--limited / custom carry a placeholder the human must fill, so they
  // still open the ResponseModal (kept for its typing surface + payload preview).
  function isInstantGrant(option) {
    return option.type === 'RESOURCE_GRANT' && option.constraints == null;
  }

  // Build the §2.2 response for an instant grant straight from the item.
  function buildInstantResponse(item, option) {
    const raw = item.raw || {};
    const request = {
      id: raw.id,
      from: item.from,
      request_id: item.id, // the value buildQueue's `responded` set keys on
      session_id: item.sessionId || raw.session_id || null,
    };
    if (option.option_id || option.option_label) {
      return buildRequestOptionResponse({
        request,
        optionId: option.option_id ?? null,
        optionLabel: option.option_label ?? null,
        notes: '',
        sessionId: request.session_id,
      });
    }
    return buildResponse({
      request, decision: 'GRANT', constraints: null, notes: null,
      sessionId: request.session_id,
    });
  }

  // The single action handler QueueItem calls. Complete grants POST straight
  // away (optimistic badge); anything needing typed input opens the modal.
  async function respondToItem(item, option) {
    const verb = decisionVerb(option);
    const detail = decisionDetail(option);
    if (!isInstantGrant(option)) {
      const raw = item.raw || {};
      setRespondingTo({
        item, verb, detail,
        request: {
          _message_id: raw.id,
          _session_id: item.sessionId || raw.session_id || null,
          request_id: item.id,
          from: item.from,
        },
        option,
      });
      return;
    }
    setDecisionNote(null);
    recordDecision(item, { verb, detail, pending: true, error: null });
    try {
      await postMessage(buildInstantResponse(item, option), 'persistent');
      recordDecision(item, { pending: false, error: null });
      // The new message will arrive via SSE; reconcile against the new log too.
      loadCommits();
    } catch (err) {
      revertDecision(item);
      setDecisionNote({ tone: 'err', text: `grant failed -- ${err.message || 'post error'}` });
    }
  }

  // Grant & apply — for a proposal/flag carrying a structured `apply` op. Posts
  // the grant (closing the item) AND runs the executor, which edits the live
  // entry through the enforced honest-write path and posts a weave_applied
  // PROOF. Two stages with distinct failure handling: a failed GRANT means
  // nothing landed (revert the badge); a failed APPLY keeps the granted verdict
  // (the grant is real) and reports that the change itself didn't land.
  async function grantAndApply(item) {
    if (!item.apply) return;
    setDecisionNote(null);
    recordDecision(item, { verb: 'GRANTED', detail: 'applying...', pending: true, error: null });
    try {
      await postMessage(buildInstantResponse(item, { type: 'RESOURCE_GRANT', constraints: null }), 'persistent');
    } catch (err) {
      revertDecision(item);
      setDecisionNote({ tone: 'err', text: `grant failed -- ${err.message || 'post error'}` });
      return;
    }
    const r = await applyWeaveProposal({ apply: item.apply, proposalId: item.id });
    if (r.ok) {
      recordDecision(item, { verb: 'GRANTED', detail: `applied -- ${r.commit}`, pending: false, error: null });
    } else {
      recordDecision(item, { verb: 'GRANTED', detail: 'apply did not land', pending: false, error: null });
      setDecisionNote({ tone: 'err', text: `granted, but apply failed -- ${r.error}` });
    }
    loadCommits();
  }

  // Run a Weave audit — the posting half, from the terminal. `kind` selects the
  // detector: 'unsung' (body wikilinks not yet typed), 'hub' (concept entries
  // over the inbound-link threshold), 'stage' (entries that have outgrown their
  // §2 stage) — the mechanical three — or the GENERATIVE ones: 'vector-tuning'
  // (forward_vectors that want sharpening) and 'label' (typed links missing a
  // register). Step 1 is always a DRY RUN: scan, surface honest counts, write
  // nothing. If any are eligible, the result exposes a confirm (postAudit) — a
  // write needs the second, explicit click. For the detection kinds the dry run
  // already builds the proposals; for the generative kinds it does NOT
  // (generation is an LLM call), so their second click GENERATES then posts.
  // Posted proposals arrive via SSE into the WEAVE lane, each with grant & apply.
  const auditAdapter = (kind) =>
    (kind === 'hub' ? emitHubAudit
      : kind === 'vector-tuning' ? emitVectorTuningAudit
        : kind === 'stage' ? emitStageAudit
          : kind === 'label' ? emitLabelAudit
            : emitUnsungAudit);
  async function runAudit(kind) {
    if (auditBusy) return;
    setAuditBusy(true);
    const r = await auditAdapter(kind)({ dryRun: true });
    setAuditBusy(false);
    setAudit(r.ok ? { kind, phase: 'dry', ...r } : { kind, phase: 'error', error: r.error });
  }
  async function postAudit() {
    if (auditBusy || !audit) return;
    const kind = audit.kind || 'unsung';
    setAuditBusy(true);
    const r = await auditAdapter(kind)({ dryRun: false });
    setAuditBusy(false);
    setAudit(r.ok ? { kind, phase: 'posted', ...r } : { kind, phase: 'error', error: r.error });
  }

  function closeRespond() { setRespondingTo(null); }
  function handleResponded() {
    // The modal posted a deny / grant--limited / custom response. Stamp the
    // badge from the intent captured when the modal opened.
    if (respondingTo?.item) {
      recordDecision(respondingTo.item, {
        verb: respondingTo.verb, detail: respondingTo.detail, pending: false, error: null,
      });
    }
    setRespondingTo(null);
    // The new message will arrive via SSE; reconcile against the new log too.
    loadCommits();
  }

  const loadCommits = () => {
    fetchLog({ limit: 200 }).then((r) => { if (r.ok) setCommits(r.commits || []); });
  };
  const loadCards = () => {
    fetchCards().then((r) => { if (r.ok) setCards(r.cards || []); });
  };
  useEffect(() => { loadCommits(); loadCards(); }, []);

  // Auto-clear: once a verdict is confirmed (not pending, no error), schedule
  // the decided card to tidy itself ~10s later -- long enough to read it.
  // Manual "clear" still works and cancels the timer (see clearItem).
  useEffect(() => {
    for (const [id, d] of decisions) {
      const settled = d && d.pending === false && !d.error;
      if (settled && !autoClearTimers.current.has(id) && !dismissed.has(id)) {
        const t = setTimeout(() => {
          autoClearTimers.current.delete(id);
          setDismissed((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
          });
        }, AUTO_CLEAR_MS);
        autoClearTimers.current.set(id, t);
      }
    }
  }, [decisions, dismissed]);

  // Clear any pending auto-clear timers on unmount.
  useEffect(() => {
    const timers = autoClearTimers.current;
    return () => { for (const t of timers.values()) clearTimeout(t); timers.clear(); };
  }, []);

  // Respond to a card: POST writes the inbox block + fires the supervisor
  // through the actuator. On success we refresh cards after a beat (the worker
  // drains the inbox + tops the queue asynchronously).
  const respondCard = async (response) => {
    setCardBusy(true);
    setCardNote(null);
    const r = await respondToCard(response);
    if (r.ok) {
      setCardNote({ tone: 'ok', text: `${response.action} sent${r.fired ? ' -- supervisor fired' : ' -- queued (worker busy)'}` });
    } else {
      setCardNote({ tone: 'err', text: r.error || `respond failed (${r.status ?? '?'})` });
    }
    setCardBusy(false);
    // Give the worker a moment, then refresh the card list.
    setTimeout(loadCards, 1500);
  };

  const items = useMemo(() => {
    // Decisions (RESOURCE_REQUESTs) live on the TRICKSTER deck, not here. QUEUE
    // is the open-WORK board: proposals, flags, to-dos, ready handoffs — things
    // you might act on, none of which a steward is blocked waiting on. buildQueue
    // still models resource_requests (the model is complete + unit-tested); this
    // view simply doesn't surface them, so a decision never appears twice.
    const built = buildQueue(messages).filter((it) => it.kind !== 'resource_request');
    // Staleness (git auto-resolution via reconcileQueue) is DISABLED for now —
    // the heuristic was mis-firing. Items stay OPEN until the human clears them
    // with the card's clear button; nothing greys or self-retires off a git
    // guess. reconcileQueue + the `commits` feed are still imported/fetched, so
    // re-enabling is a one-line change once the heuristic is fixed.
    // Re-attach decided items buildQueue has since dropped (a GRANT/DENY landed
    // on the board), so their verdict badge survives until the human clears it.
    const present = new Set(built.map((it) => it.id));
    const merged = [...built];
    for (const [id, snap] of snapshots) {
      if (!present.has(id) && !dismissed.has(id)) merged.push(snap);
    }
    return rankQueue(merged)
      .filter((it) => !dismissed.has(it.id))
      .map((it) => (decisions.has(it.id) ? { ...it, decision: decisions.get(it.id) } : it));
  }, [messages, dismissed, decisions, snapshots]);

  const lanes = useMemo(() => laneCounts(items), [items]);
  // Lanes are filters. The board chips slice by `board`; the handoffs chip
  // slices by `kind` (a different axis, same row — from the queue's view it's
  // just another slice). The sentinel can't collide with a board name.
  const HANDOFF_LANE = '@handoffs';
  const handoffCount = useMemo(() => items.filter((i) => i.kind === 'handoff_ready').length, [items]);
  const laneFiltered = laneFilter
    ? (laneFilter === HANDOFF_LANE
        ? items.filter((i) => i.kind === 'handoff_ready')
        : items.filter((i) => i.board === laneFilter))
    : items;
  const { open, resolved } = partitionQueue(laneFiltered);
  // Decided items still partition as "open" (not git-resolved); split them out
  // for the status counts so "open" means genuinely-awaiting-you.
  const liveOpen = open.filter((it) => !it.decision);
  const decidedOpen = open.filter((it) => it.decision);
  // Handoffs get their own lane PINNED at the top of the open list. Batons
  // aren't `blocking`, so newest-first ranking would sink them below every
  // request — but a baton is the one item that should be seen and caught first
  // (Two Batons, One Board). Pinning them here decouples "ready to continue"
  // from recency. They are lifted out of the main list so they show once.
  const openHandoffs = open.filter((it) => it.kind === 'handoff_ready');
  const openRest = open.filter((it) => it.kind !== 'handoff_ready');

  const clearItem = (item) => {
    const t = autoClearTimers.current.get(item.id);
    if (t) { clearTimeout(t); autoClearTimers.current.delete(item.id); }
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  // Durably clear a baton: post the paired handoff_picked_up (buildQueue drops
  // it for good on the next board read, so it does NOT return on reload), then
  // dismiss locally so it leaves the view now. On a post failure (offline/demo),
  // fall back to a local-only dismiss and say so — that one WOULD return on
  // reload. This is why "clear" now writes: a local dismiss alone can't retire a
  // handoff_ready that still sits on the board.
  const clearHandoff = async (item) => {
    setDecisionNote(null);
    try {
      await postMessage(
        buildHandoffPickup({ handoffId: item.id, note: 'cleared from QUEUE', sessionId: item.sessionId || undefined }),
        'persistent',
      );
    } catch (err) {
      setDecisionNote({ tone: 'err', text: `clear didn't reach the board — dismissed locally, may return on reload (${err.message || 'post error'})` });
    }
    clearItem(item);
  };

  const jump = (pointer) => {
    if (pointer?.type === 'entry' && onJumpEntry) onJumpEntry(pointer.target);
  };

  // Map a queue handoff item / an enrichment card into the normalized launch
  // context the LaunchModal renders. Same primitive, two surfaces — stewards
  // and steward-requested sessions plug in here next.
  const launchHandoff = (it) => setLaunchContext({
    kind: 'handoff', id: it.id, entry: it.entry, from: it.from,
    sourcePath: it.handoff_path, summary: it.summary,
    // Carry the sharper move + the ready invocation so the launch prompt leads
    // with the real move (not the generic summary) and hands over the exact
    // first action. Both are undefined for move-less batons — the prompt falls
    // back to summary and omits the invocation line.
    move: it.move, invocation: it.invocation,
  });
  const launchCard = (card) => setLaunchContext({
    kind: 'card', id: card.id, entry: card.target_name, from: card.target_name,
    sourcePath: `Enrichment/${card.id}/`, purpose: card.purpose, summary: card.summary,
  });

  // Per-kind labels for the audit-result panel. vector-tuning is GENERATIVE: its
  // dry run scans (no proposals built yet), so it reads "would generate" and its
  // confirm "generate & post" (each post is an LLM call), vs. the detection
  // kinds' "would post".
  const auditKind = audit ? (audit.kind || 'unsung') : 'unsung';
  const auditIsGenerative = auditKind === 'vector-tuning' || auditKind === 'label';
  const auditName = auditKind === 'hub' ? 'hub-promotion' : auditKind === 'vector-tuning' ? 'vector-tuning' : auditKind === 'stage' ? 'stage-transition' : auditKind === 'label' ? 'label-enrichment' : 'unsung-path';
  const auditNoun = auditKind === 'hub' ? 'hub candidate(s)' : auditKind === 'vector-tuning' ? 'vector candidate(s)' : auditKind === 'stage' ? 'stage candidate(s)' : auditKind === 'label' ? 'label candidate(s)' : 'unsung';

  return (
    <Box title="queue -- the ranked inbox" tone="double" style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8,
        color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12,
      }}>
        <span><strong style={{ color: 'var(--phosphor)' }}>{liveOpen.length}</strong> open</span>
        {decidedOpen.length > 0 ? (
          <span data-testid="queue-decided-count"><strong style={{ color: 'var(--phosphor)' }}>{decidedOpen.length}</strong> decided</span>
        ) : null}
        {resolved.length > 0 ? (
          <span><strong style={{ color: 'var(--phosphor-dim)' }}>{resolved.length}</strong> looks-done</span>
        ) : null}
        {decisionNote ? (
          <span data-testid="queue-decision-note" style={{ color: 'var(--error)', textShadow: 'var(--glow)' }}>
            {decisionNote.text}
          </span>
        ) : null}
        {/* Weave audits collapsed into a pulldown + one button to reclaim
            header space. Pick a kind, click run — the dry run for that kind
            fires; the result panel (keyed by kind) still carries the explicit
            post/confirm, so nothing is written on a dry run. */}
        <span data-testid="audit-controls" style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}>
          <label htmlFor="audit-select" style={{ color: 'var(--phosphor-dim)' }}>audit:</label>
          <select
            id="audit-select"
            data-testid="audit-select"
            value={auditKindSel}
            onChange={(e) => setAuditKindSel(e.target.value)}
            disabled={auditBusy}
            style={{
              background: 'var(--phosphor-deep)', color: 'var(--phosphor)',
              border: '1px solid var(--phosphor-dim)', fontFamily: 'var(--font-mono)',
              fontSize: 11, padding: '1px 4px', textShadow: 'var(--glow)',
            }}
            title="choose which Weave audit to run"
          >
            <option value="unsung">unsung-path</option>
            <option value="hub">hub-promotion</option>
            <option value="vector-tuning">vector-tuning</option>
            <option value="stage">stage-transition</option>
            <option value="label">label-enrichment</option>
          </select>
          <span
            data-testid="run-audit"
            onClick={auditBusy ? undefined : () => runAudit(auditKindSel)}
            style={{ cursor: auditBusy ? 'wait' : 'pointer', color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', textDecoration: 'underline' }}
            title="run the selected Weave audit — a dry run (nothing is written until you confirm in the result)"
          >
            {auditBusy ? 'auditing...' : 'run audit'}
          </span>
        </span>

        {/* lanes: the six boards become filters, not tabs */}
        <span style={{ marginLeft: 8 }}>lanes:</span>
        <span
          data-testid="queue-lane-all"
          onClick={() => setLaneFilter(null)}
          style={{
            cursor: 'pointer', fontSize: 11, padding: '0 5px',
            background: laneFilter === null ? 'var(--phosphor)' : 'transparent',
            color: laneFilter === null ? 'var(--bg)' : 'var(--phosphor-dim)',
            border: '1px solid var(--phosphor-dim)',
          }}
        >all ({items.length})</span>
        {handoffCount > 0 ? (
          <span
            data-testid="queue-lane-handoffs"
            onClick={() => setLaneFilter(laneFilter === HANDOFF_LANE ? null : HANDOFF_LANE)}
            style={{
              cursor: 'pointer', fontSize: 11, padding: '0 5px',
              background: laneFilter === HANDOFF_LANE ? 'var(--warn)' : 'transparent',
              color: laneFilter === HANDOFF_LANE ? 'var(--bg)' : 'var(--warn)',
              textShadow: laneFilter === HANDOFF_LANE ? 'none' : 'var(--glow)',
              border: '1px solid var(--warn)',
            }}
            title="show only handoffs -- batons ready to catch"
          >handoffs ({handoffCount})</span>
        ) : null}
        {[...lanes.entries()].map(([board, n]) => (
          <span
            key={board}
            data-testid={`queue-lane-${board}`}
            onClick={() => setLaneFilter(board === laneFilter ? null : board)}
            style={{
              cursor: 'pointer', fontSize: 11, padding: '0 5px',
              background: laneFilter === board ? 'var(--phosphor)' : 'transparent',
              color: laneFilter === board ? 'var(--bg)' : 'var(--phosphor-dim)',
              border: '1px solid var(--phosphor-dim)',
            }}
          >{board.toLowerCase()} ({n})</span>
        ))}
      </div>

      {/* Weave audit result (unsung-path, hub-promotion, or vector-tuning): the
          dry-run plan (honest counts + an explicit confirm, since posting
          writes), the post outcome, or an error. No silent caps —
          found/eligible/over-limit are all named. vector-tuning is GENERATIVE:
          its dry run scans only, so it reads "would generate" + "generate &
          post". Keyed by audit.kind. */}
      {audit ? (
        <div
          data-testid={`${auditKind}-audit-result`}
          style={{
            display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap',
            marginBottom: 8, fontSize: 12, color: 'var(--phosphor-dim)', textShadow: 'none',
            borderLeft: '2px solid var(--phosphor-dim)', paddingLeft: 8,
          }}
        >
          {audit.phase === 'error' ? (
            <span style={{ color: 'var(--error)', textShadow: 'var(--glow)' }}>
              {auditName} audit failed -- {audit.error}
            </span>
          ) : audit.phase === 'posted' ? (
            <span>
              posted <strong style={{ color: 'var(--phosphor)' }}>{audit.posted}</strong> proposal(s) to the weave lane
              {audit.genFailed ? ` -- ${audit.genFailed} generation failure(s)` : ''}
              {audit.skipped && audit.skipped.length ? ` -- ${audit.skipped.length} skipped (invalid)` : ''}
              {' '}-- grant &amp; apply each below.
            </span>
          ) : (
            <>
              <span>
                <strong style={{ color: 'var(--phosphor)' }}>{audit.entriesScanned}</strong> entries scanned --{' '}
                <strong style={{ color: 'var(--phosphor)' }}>{audit.found}</strong> {auditNoun} --{' '}
                {audit.deduped} already proposed -- {audit.eligible} eligible --{' '}
                <strong style={{ color: 'var(--phosphor)' }}>{audit.planned}</strong> {auditIsGenerative ? 'would generate' : 'would post'}
                {audit.dropped ? ` -- ${audit.dropped} over limit ${audit.limit} NOT ${auditIsGenerative ? 'generated' : 'emitted'}` : ''}
              </span>
              {audit.planned > 0 ? (
                <span
                  data-testid={`post-${auditKind}-audit`}
                  onClick={auditBusy ? undefined : postAudit}
                  style={{
                    cursor: auditBusy ? 'wait' : 'pointer', color: 'var(--ansi-bright-yellow)',
                    textShadow: 'var(--glow)', textDecoration: 'underline',
                  }}
                  title={auditIsGenerative
                    ? 'generate a sharper forward_vector for each candidate, then post them to the WEAVE board (this writes; each is a model call, so give it a moment)'
                    : 'append these proposals to the WEAVE board (this writes)'}
                >
                  {auditIsGenerative ? 'generate & post' : 'post'} {audit.planned} proposal{audit.planned === 1 ? '' : 's'}
                </span>
              ) : (
                <span style={{ fontStyle: 'italic' }}>{auditIsGenerative ? 'nothing to tune.' : 'nothing to post.'}</span>
              )}
            </>
          )}
          <span
            data-testid={`${auditKind}-audit-dismiss`}
            onClick={() => setAudit(null)}
            style={{ cursor: 'pointer', color: 'var(--phosphor-dim)', textDecoration: 'underline' }}
          >
            dismiss
          </span>
        </div>
      ) : null}

      {open.length === 0 && resolved.length === 0 ? (
        <div data-testid="queue-empty" style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontStyle: 'italic' }}>
          nothing open. the queue is quiet.
        </div>
      ) : null}

      <div data-testid="queue-open">
        {/* HANDOFFS — pinned at the top, ahead of the ranked list. A baton is
            the one open item meant to be caught first, so it does not wait on
            recency. The warn accent matches the handoff badge. */}
        {openHandoffs.length > 0 ? (
          <div
            data-testid="queue-handoff-lane"
            style={{
              marginBottom: 12,
              border: '1px solid var(--warn)',
              padding: '8px 10px 4px',
            }}
          >
            <div style={{
              color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8,
            }}>
              handoffs &mdash; batons ready to catch ({openHandoffs.length})
            </div>
            {openHandoffs.map((it) => (
              <QueueItem key={it.id} item={it} onJump={jump} onClear={clearItem} onDismissHandoff={clearHandoff} onRespond={respondToItem} onLaunch={launchHandoff} onApply={grantAndApply} />
            ))}
          </div>
        ) : null}
        {openRest.map((it) => (
          <QueueItem key={it.id} item={it} onJump={jump} onClear={clearItem} onDismissHandoff={clearHandoff} onRespond={respondToItem} onLaunch={launchHandoff} onApply={grantAndApply} />
        ))}
      </div>

      {resolved.length > 0 ? (
        <div style={{ marginTop: 6 }}>
          <div
            onClick={() => setShowResolved((s) => !s)}
            style={{ cursor: 'pointer', color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}
          >
            {showResolved ? '[-]' : '[+]'} {resolved.length} looks-done (git resolved)
          </div>
          {showResolved ? (
            <div data-testid="queue-resolved">
              {resolved.map((it) => (
                <QueueItem key={it.id} item={it} onJump={jump} onClear={clearItem} onDismissHandoff={clearHandoff} onRespond={respondToItem} onLaunch={launchHandoff} onApply={grantAndApply} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Enrichment cards (Phase 4.5): the absorbed Enrichment card queue.
          Render-and-act -- deposit/revise/discard write the inbox block and
          fire the supervisor through the actuator. */}
      <div data-testid="card-queue" style={{ marginTop: 10, borderTop: '1px solid var(--phosphor-dim)', paddingTop: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ color: 'var(--ansi-bright-magenta)', textShadow: 'var(--glow)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            enrichment cards
          </span>
          <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>{cards.length} in queue</span>
          <span
            onClick={loadCards}
            style={{ cursor: 'pointer', color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', textDecoration: 'underline', fontSize: 11 }}
          >refresh</span>
          {cardNote ? (
            <span data-testid="card-feedback" style={{ color: cardNote.tone === 'ok' ? 'var(--phosphor)' : 'var(--error)', textShadow: 'var(--glow)', fontSize: 11 }}>
              {cardNote.text}
            </span>
          ) : null}
        </div>
        {cards.length === 0 ? (
          <div data-testid="card-queue-empty" style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontStyle: 'italic', fontSize: 12 }}>
            no enrichment cards in the queue.
          </div>
        ) : (
          cards.map((c) => (
            <CardItem key={c.id} card={c} onRespond={respondCard} busy={cardBusy} onLaunch={launchCard} />
          ))
        )}
      </div>

      {/* Response modal: opens only for the answers that need typed input --
          deny, grant--limited, and custom. (Plain grant and asker-supplied
          options post immediately, no modal.) On confirm it POSTs a
          RESOURCE_GRANT or RESOURCE_DENY to the persistent blackboard, and
          handleResponded stamps the verdict badge on the card. */}
      {respondingTo ? (
        <ResponseModal
          request={respondingTo.request}
          option={respondingTo.option}
          sessionId={respondingTo.request._session_id}
          onConfirmed={handleResponded}
          onCancel={closeRespond}
        />
      ) : null}

      {/* Launch interactive: hand a baton (handoff_ready) to a watchable,
          steerable session. On pickup we clear the item locally — the durable
          handoff_picked_up is already on the board. */}
      {launchContext ? (
        <LaunchModal
          context={launchContext}
          onPickedUp={(ctx) => { clearItem({ id: ctx.id }); setLaunchContext(null); }}
          onClose={() => setLaunchContext(null)}
        />
      ) : null}
    </Box>
  );
}
