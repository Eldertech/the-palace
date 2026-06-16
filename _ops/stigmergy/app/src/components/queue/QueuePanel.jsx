import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '../primitives.jsx';
import QueueItem from './QueueItem.jsx';
import CardItem from './CardItem.jsx';
import ResponseModal from '../ResponseModal.jsx';
import { buildQueue, reconcileQueue, partitionQueue, laneCounts, rankQueue } from '../../lib/queue-model.js';
import { fetchLog } from '../../adapters/log.js';
import { fetchCards, respondToCard } from '../../adapters/cards.js';
import { buildResponse, buildRequestOptionResponse } from '../../lib/response-builder.js';
import { postMessage } from '../../adapters/blackboard.js';

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
    const reconciled = reconcileQueue(built, commits);
    // Re-attach decided items buildQueue has since dropped (a GRANT/DENY landed
    // on the board), so their verdict badge survives until the human clears it.
    const present = new Set(reconciled.map((it) => it.id));
    const merged = [...reconciled];
    for (const [id, snap] of snapshots) {
      if (!present.has(id) && !dismissed.has(id)) merged.push(snap);
    }
    return rankQueue(merged)
      .filter((it) => !dismissed.has(it.id))
      .map((it) => (decisions.has(it.id) ? { ...it, decision: decisions.get(it.id) } : it));
  }, [messages, commits, dismissed, decisions, snapshots]);

  const lanes = useMemo(() => laneCounts(items), [items]);
  const laneFiltered = laneFilter ? items.filter((i) => i.board === laneFilter) : items;
  const { open, resolved } = partitionQueue(laneFiltered);
  // Decided items still partition as "open" (not git-resolved); split them out
  // for the status counts so "open" means genuinely-awaiting-you.
  const liveOpen = open.filter((it) => !it.decision);
  const decidedOpen = open.filter((it) => it.decision);

  const clearItem = (item) => {
    const t = autoClearTimers.current.get(item.id);
    if (t) { clearTimeout(t); autoClearTimers.current.delete(item.id); }
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const jump = (pointer) => {
    if (pointer?.type === 'entry' && onJumpEntry) onJumpEntry(pointer.target);
  };

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
        <span
          onClick={loadCommits}
          style={{ cursor: 'pointer', color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)', textDecoration: 'underline' }}
          title="re-check git for resolving commits"
        >
          reconcile
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

      {open.length === 0 && resolved.length === 0 ? (
        <div data-testid="queue-empty" style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontStyle: 'italic' }}>
          nothing open. the queue is quiet.
        </div>
      ) : null}

      <div data-testid="queue-open">
        {open.map((it) => (
          <QueueItem key={it.id} item={it} onJump={jump} onClear={clearItem} onRespond={respondToItem} />
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
                <QueueItem key={it.id} item={it} onJump={jump} onClear={clearItem} onRespond={respondToItem} />
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
            <CardItem key={c.id} card={c} onRespond={respondCard} busy={cardBusy} />
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
    </Box>
  );
}
