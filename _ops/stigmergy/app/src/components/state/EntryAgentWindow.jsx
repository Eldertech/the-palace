import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { fetchGrounding, postTurn, postUndo } from '../../adapters/entry-agent.js';
import { subscribeLive } from '../../adapters/live-tail.js';
import { contextKey, contextLabel } from '../../lib/companion-context.js';

// Position init wants useLayoutEffect in the browser, but that warns under
// server render (tests use renderToStaticMarkup). Fall back to useEffect where
// there is no window -- the effect is a browser-only no-op there anyway.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// EntryAgentWindow — the companion: a floating palette over an entry.
//
// Decided 2026-06-08 (after driving M1 live): NO text reflow. The text-wraps-
// around-the-window flow only works on a canvas (per-line layout), which costs
// native selection, clickable [[wikilinks]], and rich blocks — not worth it.
// Instead the window is a plain box that floats ABOVE everything (high z-index),
// freely draggable, and the document underneath is untouched. Move the box to
// see what's behind it. EntryBody is never modified, so the feature stays
// perfectly reversible: toggle off → the window unmounts → STATE reads as before.
//
// It is grounded in the WHOLE entry — frontmatter, forward vector, body, and the
// typed-link neighborhood — so it can discuss or edit anything in the doc. The
// section the box currently floats over glows (scroll-spy), and the titlebar
// names it as the conversational "context".
//
// M1a grounding · M1b discuss · M1c honest in-place edits (worker proposes, Node
// writes through the enforced path, PROOF carries the commit).

const MIN_W = 280;
const MIN_H = 220;
const DEFAULT_W = 360;
const DEFAULT_H = 520;
const DEFAULT_TOP = 110;
const MAX_INPUT_H = 200; // composer auto-grows to here, then scrolls inside
const GLOW_CLASS = 'eaw-section-glow';
const GLOW_CARD_CLASS = 'eaw-card-active'; // the TRICKSTER card the box floats over
const Z = 9000;          // float above all app content/chrome (below the CRT overlays)

// Last heading whose top has scrolled above the window's vertical centre is the
// section being read. Headings are EntryBody's direct children, tagged
// data-testid="heading-h{level}".
function findActiveHeading(container, centreY) {
  const headings = container.querySelectorAll('[data-testid^="heading-h"]');
  let active = null;
  for (const h of headings) {
    if (h.getBoundingClientRect().top <= centreY) active = h;
    else break;
  }
  return active;
}

// Glow the active section: the active heading plus every following sibling up to
// (but not including) the next heading. Pure classList toggling on EntryBody's
// own nodes -- React doesn't manage `className` there, so this never fights
// reconciliation, and the cleanup pass removes it all.
function paintGlow(bodyEl, active) {
  bodyEl.querySelectorAll('.' + GLOW_CLASS).forEach((el) => el.classList.remove(GLOW_CLASS));
  if (!active) return;
  const kids = Array.from(bodyEl.children);
  const start = kids.indexOf(active);
  if (start === -1) return;
  for (let i = start; i < kids.length; i += 1) {
    if (i > start && kids[i].matches('[data-testid^="heading-h"]')) break;
    kids[i].classList.add(GLOW_CLASS);
  }
}

function truncate(s, n) {
  if (typeof s !== 'string') return '';
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

// The TRICKSTER card the box is floating over: the one whose vertical span the
// box's centre falls within, or — in a gap between cards — the nearest. The
// analog of findActiveHeading for the decision lane. Returns the element or null.
function findNearestCard(cards, centreY) {
  let best = null;
  let bestDist = Infinity;
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    const d = centreY < r.top ? r.top - centreY : centreY > r.bottom ? centreY - r.bottom : 0;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// Build the conversation history sent to the worker. Spoken turns pass through;
// committed-edit markers (which the worker never sees otherwise) become compact
// first-person notes so the worker KNOWS what it already committed this session
// — without them it can re-propose an edit that already landed in the quarantine
// (e.g. re-issuing a set-vector when Loudon says "approved"), which then no-ops.
// Pure + exported for unit tests.
export function buildTurnHistory(convo) {
  if (!Array.isArray(convo)) return [];
  return convo
    .filter((m) => m && (m.role === 'user' || m.role === 'companion' || m.role === 'edit'))
    .map((m) => {
      if (m.role !== 'edit') return { role: m.role, text: m.text };
      let note;
      if (m.op === 'revert') note = `(I already reverted commit ${m.reverts}; do not redo that.)`;
      else if (m.op === 'set-vector') {
        const to = m.vectorChange?.to;
        note = to
          ? `(I already updated this entry's forward_vector to: "${to}". It is committed — do NOT set it again.)`
          : `(I already updated this entry's forward_vector and committed it — do NOT set it again.)`;
      } else note = `(I already committed a ${m.op}${m.summary ? `: ${m.summary}` : ''}; do NOT repeat it.)`;
      return { role: 'companion', text: note };
    });
}

// One conversation turn. Loudon's turns read as a dim prompt; the Companion's
// (the page speaking as itself) read in bright phosphor.
function ChatBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div data-testid={`eaw-bubble-${role}`} style={{ marginBottom: 8 }}>
      <div style={{
        color: 'var(--phosphor-dim)', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '.06em',
      }}>{isUser ? 'you' : 'companion'}</div>
      <div style={{
        color: isUser ? 'var(--phosphor-dim)' : 'var(--phosphor)',
        textShadow: isUser ? 'none' : 'var(--glow)',
        fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap',
      }}>{text}</div>
    </div>
  );
}

// The read-only grounding view: the page's own forward vector, then each typed-
// link neighbor with how it relates and what it wants (its forward vector).
// Ghost (unresolved) neighbors render dim — a missing connection is an
// invitation, not an error.
function GroundingView({ grounding }) {
  const { entry, neighbors, counts } = grounding;
  return (
    <div data-testid="eaw-grounding-view">
      {entry.forward_vector ? (
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: 'var(--phosphor-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            its vector
          </div>
          <div style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 11, fontStyle: 'italic' }}>
            {truncate(entry.forward_vector, 160)}
          </div>
        </div>
      ) : null}
      <div style={{ color: 'var(--phosphor-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
        neighborhood · {counts.neighbors_resolved} resolved{counts.neighbors_ghost > 0 ? ` · ${counts.neighbors_ghost} ghost` : ''}
      </div>
      {neighbors.length === 0 ? (
        <div style={{ fontSize: 11 }}>no typed links yet — a growing edge.</div>
      ) : (
        <ul data-testid="eaw-neighbors" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {neighbors.map((n, i) => (
            <li
              key={`${n.path || n.name}-${i}`}
              data-resolved={n.resolved ? '1' : '0'}
              style={{
                marginBottom: 6, paddingBottom: 6,
                borderBottom: i < neighbors.length - 1 ? '1px solid var(--phosphor-deep)' : 'none',
                opacity: n.resolved ? 1 : 0.55,
              }}
            >
              <div style={{ fontSize: 11 }}>
                <span style={{
                  color: 'var(--phosphor-dim)', fontFamily: 'var(--font-mono)', fontSize: 10,
                }}>{n.label || n.type}</span>
                {' '}
                <span style={{ color: 'var(--phosphor-bright)', textShadow: 'var(--glow)' }}>{n.name}</span>
                {!n.resolved ? <span style={{ color: 'var(--phosphor-dim)', fontSize: 10 }}> (ghost)</span> : null}
              </div>
              {n.forward_vector ? (
                <div style={{ color: 'var(--phosphor-dim)', fontSize: 10, lineHeight: 1.35 }}>
                  {truncate(n.forward_vector, 110)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// A committed edit. Honest by construction: it names the op, the quarantine
// branch, and the commit hash — the proof the write landed in LOG. The live
// entry text is unchanged (the edit is quarantined until a human merges), so we
// report the edit rather than mutate the body, which would lie.
//
// Undo (M1d) is post-commit and honest: [undo] reverts the commit as a NEW
// inverse commit on the quarantine branch (never a silent rollback). A revert
// arrives as its own marker (op:'revert'), and the original is shown 'reverted'.
export function EditMarker({ op, commit, branch, summary, reverts, vectorChange, onUndo, undone, undoing }) {
  if (op === 'revert') {
    return (
      <div data-testid="eaw-edit" data-op="revert" style={{
        marginBottom: 8, padding: '5px 7px',
        border: '1px solid var(--phosphor-dim)',
        background: 'color-mix(in srgb, var(--phosphor) 4%, transparent)',
      }}>
        <div style={{ color: 'var(--phosphor-dim)', fontSize: 11 }}>
          ↩ reverted <span style={{ color: 'var(--phosphor)' }}>{reverts}</span>{summary ? ` — ${summary}` : ''}
        </div>
        <div style={{ color: 'var(--phosphor-dim)', fontSize: 10 }}>
          new commit <span style={{ color: 'var(--phosphor-bright)' }}>{commit}</span> on {branch}
        </div>
      </div>
    );
  }
  return (
    <div data-testid="eaw-edit" data-op={op} style={{
      marginBottom: 8, padding: '5px 7px',
      border: '1px solid var(--phosphor-dim)',
      background: 'color-mix(in srgb, var(--phosphor) 6%, transparent)',
      opacity: undone ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          flex: 1, minWidth: 0,
          color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 11,
          textDecoration: undone ? 'line-through' : 'none',
        }}>
          ✎ {op === 'set-vector' ? 'forward vector' : op}{summary ? ` — ${summary}` : ''}
        </span>
        {undone ? (
          <span style={{ color: 'var(--phosphor-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            reverted
          </span>
        ) : onUndo ? (
          <span
            data-testid="eaw-edit-undo"
            role="button"
            onClick={undoing ? undefined : onUndo}
            title="revert this edit (a new inverse commit)"
            style={{
              cursor: undoing ? 'default' : 'pointer', opacity: undoing ? 0.5 : 1,
              color: 'var(--ansi-bright-yellow)', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap',
            }}
          >{undoing ? 'undoing…' : '[undo]'}</span>
        ) : null}
      </div>
      {vectorChange ? (
        // A forward-vector change is never silent — surface from → to prominently
        // (the standing palace rule, made visible). Amber = "look at this".
        <div data-testid="eaw-vector-flag" style={{
          margin: '4px 0', padding: '4px 7px',
          borderLeft: '2px solid var(--ansi-bright-yellow)',
          background: 'color-mix(in srgb, var(--ansi-bright-yellow) 8%, transparent)',
        }}>
          <div style={{
            color: 'var(--ansi-bright-yellow)', textShadow: '0 0 6px currentColor',
            fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2,
          }}>⟲ forward vector changed</div>
          {vectorChange.from ? (
            <div style={{ color: 'var(--phosphor-dim)', fontSize: 10, fontStyle: 'italic', textDecoration: 'line-through' }}>
              {vectorChange.from}
            </div>
          ) : null}
          <div style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 11, fontStyle: 'italic' }}>
            {vectorChange.to}
          </div>
        </div>
      ) : null}
      <div style={{ color: 'var(--phosphor-dim)', fontSize: 10 }}>
        committed <span style={{ color: 'var(--phosphor-bright)' }}>{commit}</span> on {branch}
      </div>
    </div>
  );
}

// A captured STIGMERGY-dev to-do (Stage 1). The companion files feedback as a
// FLAG on the board; this marker confirms it landed and where it lives now (the
// QUEUE · FLAGS lane). Amber, like the companion's other "look at this" accents.
export function TodoMarker({ title, area, severity }) {
  return (
    <div data-testid="eaw-todo" style={{
      marginBottom: 8, padding: '5px 7px',
      border: '1px solid var(--ansi-bright-yellow)',
      background: 'color-mix(in srgb, var(--ansi-bright-yellow) 8%, transparent)',
    }}>
      <div style={{
        color: 'var(--ansi-bright-yellow)', textShadow: '0 0 6px currentColor',
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2,
      }}>✓ filed to QUEUE · FLAGS</div>
      <div style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 12 }}>
        {title || 'feedback captured'}
      </div>
      {(area || severity) ? (
        <div style={{ color: 'var(--phosphor-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
          {area ? `area: ${area}` : ''}{area && severity ? ' · ' : ''}{severity || ''}
        </div>
      ) : null}
    </div>
  );
}

export default function EntryAgentWindow({ entry, context, containerRef, onClose }) {
  // Context-driven (Stage 0). The window used to be bound to a single `entry`;
  // it now grounds in a `context` descriptor that follows the user across decks.
  // A bare `entry` prop is still accepted (the original call + the unit tests):
  // it becomes the entry context. `isEntry` gates the entry-only surfaces — the
  // grounding view, the scroll-spy glow, and the "discuss this" pin.
  const ctx = (context && context.kind)
    ? context
    : (entry ? { kind: 'entry', path: entry?.path ?? null, title: entry?.title } : { kind: 'app_feedback', deck: null });
  const isEntry = ctx.kind === 'entry';
  const isTrickster = ctx.kind === 'trickster_request';
  const cKey = contextKey(ctx);

  // TRICKSTER: the box scroll-spies the card it floats over and answers AS that
  // project. The context carries the whole pending list (`ctx.requests`); a
  // single-request context (tests / the wire shape) is treated as a one-item
  // list. `activeReqId` is set by the card scroll-spy; the active request drives
  // the titlebar, the intro, and what the next turn grounds in.
  const [activeReqId, setActiveReqId] = useState(null);
  const tricksterList = isTrickster
    ? (Array.isArray(ctx.requests) ? ctx.requests : [ctx])
    : [];
  const activeRequest = isTrickster
    ? (tricksterList.find((r) => r && r.request_id === activeReqId) || tricksterList[0] || null)
    : null;

  // Latest context + active card, read by callbacks without re-binding each render.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const activeReqIdRef = useRef(activeReqId);
  activeReqIdRef.current = activeReqId;

  const [width, setWidth] = useState(DEFAULT_W);
  const [height, setHeight] = useState(DEFAULT_H);
  const [top, setTop] = useState(DEFAULT_TOP);
  // Viewport X of the window's left edge. Null until the position-init effect
  // runs (SSR / first paint) -> we fall back to a right offset so the box still
  // renders, then it becomes a real number the user can drag freely.
  const [left, setLeft] = useState(null);
  const [reading, setReading] = useState(null);
  // Real grounding (page + typed-link neighborhood + floor), fetched per entry.
  const [grounding, setGrounding] = useState(null);

  // Conversation: user turns are local-optimistic; the Companion's reply
  // (companion_reply) and any edit (companion_edit PROOF) arrive on the board
  // over SSE. sessionTurns are the turn ids we started THIS session — we accept
  // board messages for them (a turn yields a reply and maybe an edit, so we do
  // NOT drop the id on the reply) and ignore replayed/foreign ones. `sending`
  // clears when a message for the most recent turn lands.
  const [convo, setConvo] = useState([]);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [turnError, setTurnError] = useState(null);
  // Undo (M1d): commits the user has asked to revert (in flight) and commits
  // confirmed reverted (a revert PROOF landed). Both keyed by the edit's hash.
  const [undoingCommits, setUndoingCommits] = useState(() => new Set());
  const [revertedCommits, setRevertedCommits] = useState(() => new Set());
  const [undoError, setUndoError] = useState(null);
  const sessionTurns = useRef(new Set());
  const currentTurn = useRef(null);

  // The "discussing" pin: a SECOND selection (CSS Custom Highlight API). focusText
  // is the pinned passage (threaded to the companion as the exact text under
  // discussion); `chip` positions the floating "◎ discuss this" affordance that
  // appears on a normal selection. pendingRange holds the cloned Range to pin.
  const [focusText, setFocusText] = useState(null);
  const [chip, setChip] = useState(null);
  const pendingRange = useRef(null);
  const winRef = useRef(null);

  const path = isEntry ? (ctx.path ?? null) : null;
  const drag = useRef(null);
  const inputRef = useRef(null);  // the composer textarea (auto-grow)

  // The entry surface the scroll-spy + "discuss this" measure against. When a
  // ref is passed (the old EntryReader mount) use it; otherwise — the global
  // App-level mount — find the open EntryReader in the DOM. Entry-only.
  const resolveContainer = useCallback(() => {
    if (containerRef?.current) return containerRef.current;
    if (typeof document !== 'undefined') return document.querySelector('[data-testid="entry-reader"]');
    return null;
  }, [containerRef]);

  const highlightSupported = typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined';

  // Pin / clear the discussing highlight. Pins a cloned Range into the
  // ::highlight(eaw-discussing) registry — it survives focus moving to the chat
  // box because it is a registered Highlight, not the live selection. Clearing
  // the native selection after pinning leaves only the amber mark.
  const pinFocus = useCallback((range, text) => {
    if (!range || !text) return;
    if (highlightSupported) {
      try { CSS.highlights.set('eaw-discussing', new Highlight(range)); } catch (_) { /* ignore */ }
    }
    setFocusText(text);
    setChip(null);
    try { window.getSelection()?.removeAllRanges(); } catch (_) { /* ignore */ }
  }, [highlightSupported]);

  const clearFocus = useCallback(() => {
    if (highlightSupported) {
      try { CSS.highlights.delete('eaw-discussing'); } catch (_) { /* ignore */ }
    }
    setFocusText(null);
    setChip(null);
  }, [highlightSupported]);

  // ── Fresh conversation on context change; fetch grounding for an entry ──
  // Re-keyed on the context (entry→entry, or entry→deck), the generalization of
  // the old per-entry reset. Grounding is fetched only for the entry kind.
  useEffect(() => {
    let cancelled = false;
    setGrounding(null);
    setConvo([]);            // a new context is a fresh conversation
    setSending(false);
    setTurnError(null);
    setUndoingCommits(new Set());
    setRevertedCommits(new Set());
    setUndoError(null);
    sessionTurns.current = new Set();
    currentTurn.current = null;
    if (isEntry && path) {
      fetchGrounding(path).then((r) => {
        if (cancelled) return;
        if (r && r.ok && r.grounding) setGrounding(r.grounding);
      });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cKey]);

  // ── Read the board for this context's Companion replies + edits ────────
  // Correlation is by turn id alone: sessionTurns holds the ids THIS window
  // started, so a reply/edit/revert is ours iff its turn_id is in that set. (The
  // old `entry_path` pre-filter was redundant — and absent for non-entry
  // contexts — so it is dropped; turn-id scoping was always the real guard.)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return undefined;
    const close = subscribeLive({
      target: 'persistent',
      onMessage: (m) => {
        const p = m && m.payload;
        if (!p) return;
        if (!sessionTurns.current.has(p.turn_id)) return; // only this session's turns
        if (p.kind === 'companion_reply') {
          setConvo((prev) => [...prev, { id: m.id || `r-${p.turn_id}`, role: 'companion', text: p.reply || '' }]);
        } else if (p.kind === 'companion_edit') {
          setConvo((prev) => [...prev, {
            id: m.id || `e-${p.turn_id}-${p.commit || p.op}`, role: 'edit',
            op: p.op, commit: p.commit, branch: p.branch, summary: p.summary,
            reverts: p.reverts || null, turnId: p.turn_id,
            vectorChange: p.vector_change || null,
          }]);
          // A revert landed: mark the original reverted and clear its in-flight flag.
          if (p.op === 'revert' && p.reverts) {
            setRevertedCommits((prev) => { const n = new Set(prev); n.add(p.reverts); return n; });
            setUndoingCommits((prev) => {
              if (!prev.has(p.reverts)) return prev;
              const n = new Set(prev); n.delete(p.reverts); return n;
            });
          }
        } else if (p.kind === 'stigmergy_todo') {
          setConvo((prev) => [...prev, {
            id: m.id || `t-${p.turn_id}`, role: 'todo',
            title: p.title, area: p.area, severity: p.severity,
          }]);
        } else {
          return;
        }
        if (p.turn_id === currentTurn.current) setSending(false);
      },
      onStateChange: () => {},
    });
    return close;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cKey]);

  // ── "discuss this": a second selection over the entry text ──────────────
  // On mouseup with a non-empty selection inside the entry (but not inside this
  // window), show a "◎ discuss this" chip; Option/Alt+drag pins it immediately.
  // Shift+drag is intentionally NOT used — the browser owns it (extend select).
  useEffect(() => {
    if (typeof window === 'undefined' || !isEntry) return undefined;
    const onMouseUp = (e) => {
      const container = resolveContainer();
      const sel = window.getSelection();
      if (!container || !sel || sel.isCollapsed || sel.rangeCount === 0) { setChip(null); return; }
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      // inside the entry surface, but not inside the companion window itself
      if (!container.contains(node) || (winRef.current && winRef.current.contains(node))) { setChip(null); return; }
      const text = sel.toString().trim();
      if (!text) { setChip(null); return; }
      pendingRange.current = range.cloneRange();
      if (e.altKey) { pinFocus(pendingRange.current, text); return; } // Option+drag pins
      const rect = range.getBoundingClientRect();
      setChip({ x: Math.max(8, Math.min(window.innerWidth - 140, rect.right - 8)), y: rect.bottom + 6, text });
    };
    const onSelChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setChip((c) => (c ? null : c));
    };
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectionchange', onSelChange);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('selectionchange', onSelChange);
    };
  }, [isEntry, resolveContainer, cKey, pinFocus]);

  // Clear the highlight when the context changes or the window unmounts — its
  // Range belongs to the old DOM.
  useEffect(() => clearFocus, [cKey, clearFocus]);

  const sendTurn = useCallback(async () => {
    const message = draft.trim();
    if (!message || sending) return;
    const sendCtx = ctxRef.current;
    if (sendCtx.kind === 'entry' && !sendCtx.path) return; // an entry with nothing to ground in
    // TRICKSTER carries the whole pending list; the turn grounds in the card the
    // box is over right now (or the top one before any scroll). Send that single
    // request as the wire context — the backend grounds one project per turn.
    let wireCtx = sendCtx;
    if (sendCtx.kind === 'trickster_request') {
      const list = Array.isArray(sendCtx.requests) ? sendCtx.requests : [sendCtx];
      const ar = list.find((r) => r && r.request_id === activeReqIdRef.current) || list[0];
      if (!ar) return; // no pending decision to ground in
      wireCtx = { kind: 'trickster_request', ...ar };
    }
    setTurnError(null);
    // history: spoken turns + notes for edits already committed (so the worker
    // doesn't re-propose an edit that already landed — the "approved" no-op bug).
    const history = buildTurnHistory(convo);
    setConvo((prev) => [...prev, { id: `u-${prev.length}`, role: 'user', text: message }]);
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = ''; // reset auto-grow
    setSending(true);
    const r = await postTurn({ context: wireCtx, message, history, focus: wireCtx.kind === 'entry' ? focusText : null });
    if (r && r.fired && r.turnId) {
      sessionTurns.current.add(r.turnId);
      currentTurn.current = r.turnId;
    } else {
      setSending(false);
      setTurnError(r?.busy ? 'a companion turn is already running — try again in a moment'
        : (r?.msg || r?.error || 'could not start the turn'));
    }
  }, [draft, sending, convo, focusText]);

  // Revert a committed edit (post-commit undo). The revert lands as its own
  // PROOF on the board (same turn), so on success the SSE handler marks it
  // reverted and clears the in-flight flag; here we only handle the failure.
  const doUndo = useCallback(async (commit, turnId) => {
    if (!commit || !path) return;
    setUndoError(null);
    setUndoingCommits((prev) => { const n = new Set(prev); n.add(commit); return n; });
    const r = await postUndo({ path, commit, turnId });
    if (!r || !r.ok) {
      setUndoingCommits((prev) => { const n = new Set(prev); n.delete(commit); return n; });
      setUndoError(r?.msg || r?.error || 'could not undo that edit');
    }
  }, [path]);

  // ── Position: default to the right, keep on-screen on resize ────────────
  useIsoLayoutEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const place = () => {
      setLeft((cur) => {
        const base = cur == null ? window.innerWidth - width - 28 : cur;
        return Math.max(8, Math.min(window.innerWidth - 80, base));
      });
      setTop((cur) => Math.max(8, Math.min(window.innerHeight - 80, cur)));
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [width]);

  // ── Scroll-spy: the section the box floats over glows + names the context ─
  useEffect(() => {
    if (!isEntry || typeof window === 'undefined') return undefined;
    const el = resolveContainer();
    if (!el) return undefined;
    const bodyEl = el.querySelector('[data-testid="entry-body"]') || el;
    let raf = 0;
    const update = () => {
      raf = 0;
      const centreY = top + height / 2;
      const active = findActiveHeading(el, centreY);
      setReading(active ? active.textContent.trim() : null);
      paintGlow(bodyEl, active);
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      bodyEl.querySelectorAll('.' + GLOW_CLASS).forEach((n) => n.classList.remove(GLOW_CLASS));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEntry, resolveContainer, top, height, cKey]);

  // ── TRICKSTER scroll-spy: the card the box floats over glows + answers ──────
  // The decision-lane analog of the entry scroll-spy: as Loudon scrolls (or
  // drags the box), the nearest pending card glows (amber bar) and becomes the
  // project the NEXT turn is grounded in. One conversation, re-aimed by position.
  useEffect(() => {
    if (!isTrickster || typeof window === 'undefined') return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const cards = document.querySelectorAll('[data-testid="trickster-card"]');
      if (!cards.length) return;
      const centreY = top + height / 2;
      const active = findNearestCard(cards, centreY);
      cards.forEach((c) => c.classList.remove(GLOW_CARD_CLASS));
      if (active) {
        active.classList.add(GLOW_CARD_CLASS);
        const rid = active.getAttribute('data-request-id');
        if (rid) setActiveReqId((cur) => (cur === rid ? cur : rid));
      }
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.querySelectorAll('.' + GLOW_CARD_CLASS).forEach((c) => c.classList.remove(GLOW_CARD_CLASS));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrickster, top, height, cKey]);

  // ── Drag / resize ──────────────────────────────────────────────────────
  // Titlebar = free 2D move; left edge = width (right edge fixed); bottom =
  // height. The box floats above everything, so it moves anywhere on screen.
  const startDrag = useCallback((mode) => (e) => {
    e.preventDefault();
    drag.current = { mode, x: e.clientX, y: e.clientY, w: width, h: height, t: top, l: left ?? 0 };
    const onMove = (ev) => {
      const d = drag.current;
      if (!d) return;
      if (d.mode === 'move') {
        setLeft(Math.max(8, Math.min(window.innerWidth - 80, d.l + (ev.clientX - d.x))));
        setTop(Math.max(8, Math.min(window.innerHeight - 80, d.t + (ev.clientY - d.y))));
      } else if (d.mode === 'width') {
        const right = d.l + d.w; // keep the right edge fixed; move the left edge
        const nl = Math.max(8, Math.min(right - MIN_W, d.l + (ev.clientX - d.x)));
        setLeft(nl);
        setWidth(right - nl);
      } else if (d.mode === 'height') {
        const maxH = window.innerHeight - d.t - 16;
        setHeight(Math.max(MIN_H, Math.min(maxH, d.h + (ev.clientY - d.y))));
      }
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [width, height, top, left]);

  const linkCount = Array.isArray(entry?.links) ? entry.links.length : 0;
  const title = isEntry
    ? (grounding?.entry?.title || ctx.title || entry?.title || ctx.path || entry?.path || 'this entry')
    : isTrickster
      ? (activeRequest?.project || 'a pending decision')
      : contextLabel(ctx);
  const winPos = left == null ? { right: 28 } : { left };

  return (
    <>
    {/* "◎ discuss this" — appears on a normal selection in the entry; pins on
        mousedown (preventDefault keeps the selection until we clone it). */}
    {chip ? (
      <div
        data-testid="eaw-discuss-chip"
        onMouseDown={(e) => { e.preventDefault(); pinFocus(pendingRange.current, chip.text); }}
        style={{
          position: 'fixed', left: chip.x, top: chip.y, zIndex: Z + 1,
          cursor: 'pointer', userSelect: 'none',
          background: 'var(--bg)',
          color: 'var(--ansi-bright-yellow)', textShadow: '0 0 6px currentColor',
          border: '1px solid var(--ansi-bright-yellow)', padding: '2px 7px',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.04em',
          whiteSpace: 'nowrap',
        }}
      >◎ discuss this</div>
    ) : null}
    <div
      ref={winRef}
      data-testid="eaw-window"
      style={{
        position: 'fixed',
        top,
        width,
        height,
        ...winPos,
        zIndex: Z,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--phosphor-deep)',
        border: '1px solid var(--phosphor-dim)',
        boxShadow: '0 0 0 1px var(--bg), 0 0 18px rgba(0,0,0,.65)',
        color: 'var(--phosphor)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
      }}
    >
      {/* Left-edge width grip */}
      <div
        data-testid="eaw-grip-width"
        onPointerDown={startDrag('width')}
        title="drag to resize width"
        style={{ position: 'absolute', left: -3, top: 0, bottom: 0, width: 6, cursor: 'ew-resize' }}
      />

      {/* Titlebar: grab to move the box anywhere; shows the context it floats over. */}
      <div
        data-testid="eaw-titlebar"
        onPointerDown={startDrag('move')}
        style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          padding: '6px 8px',
          borderBottom: '1px solid var(--phosphor-dim)',
          background: 'var(--bg)',
          cursor: 'move', userSelect: 'none',
        }}
      >
        <span style={{
          color: 'var(--phosphor-white)', textShadow: 'var(--glow)',
          textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 11,
        }}>
          companion
        </span>
        <span
          data-testid="eaw-reading"
          style={{
            flex: 1, minWidth: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
          }}
        >
          {isEntry ? (
            <>over: <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>
              {reading || '— (top)'}
            </span></>
          ) : isTrickster ? (
            <>as: <span style={{ color: 'var(--ansi-bright-yellow)', textShadow: '0 0 6px currentColor' }}>
              {activeRequest?.project || '—'}
            </span></>
          ) : (
            <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{contextLabel(ctx)}</span>
          )}
        </span>
        <span
          data-testid="eaw-close"
          role="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          title="close the companion window"
          style={{ cursor: 'pointer', color: 'var(--phosphor)', textShadow: 'var(--glow)', padding: '0 2px' }}
        >[×]</span>
      </div>

      {/* The pinned passage — what the chat and I are discussing. Persists while
          you type; [×] clears it. */}
      {focusText ? (
        <div
          data-testid="eaw-discussing"
          style={{
            display: 'flex', alignItems: 'baseline', gap: 6,
            padding: '4px 8px',
            borderBottom: '1px solid var(--phosphor-dim)',
            background: 'color-mix(in srgb, var(--ansi-bright-yellow) 10%, var(--bg))',
            fontSize: 10,
          }}
        >
          <span style={{ color: 'var(--ansi-bright-yellow)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            ◎ discussing
          </span>
          <span style={{
            flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            color: 'var(--phosphor)', textShadow: 'var(--glow)', fontStyle: 'italic',
          }}>
            “{truncate(focusText, 80)}”
          </span>
          <span
            data-testid="eaw-discussing-clear"
            role="button"
            onClick={clearFocus}
            title="stop discussing this passage"
            style={{ cursor: 'pointer', color: 'var(--ansi-bright-yellow)' }}
          >[×]</span>
        </div>
      ) : null}

      {/* Body: the conversation. Before the first turn it shows the grounding
          (the page's neighborhood) as orientation; once you talk, it becomes
          the chat. Companion replies + edits arrive over SSE from the board. */}
      <div
        data-testid="eaw-body"
        className="bbs-scroll"
        style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          overscrollBehavior: 'contain', // reaching the end must not scroll the page
          padding: '10px 10px', lineHeight: 1.5,
          color: 'var(--phosphor-dim)', textShadow: 'none',
        }}
      >
        {convo.length === 0 ? (
          isEntry ? (
            <>
              <div style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', marginBottom: 8 }}>
                I float over this entry — ask me about anything in it (its body, its
                frontmatter, its forward vector), or say what to change. The section
                behind me glows as my context.
              </div>
              {grounding ? (
                <GroundingView grounding={grounding} />
              ) : (
                <div>reading the neighborhood…</div>
              )}
            </>
          ) : isTrickster ? (
            <div data-testid="eaw-trickster-intro" style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>
              I answer as the decision you're nearest — right now{' '}
              <span style={{ color: 'var(--phosphor-white)' }}>{activeRequest?.project || 'this project'}</span>,
              the steward in front of you. Scroll the lane to point me at another;
              ask what I'm asking for, why, or where the project stands.
              {activeRequest?.ask ? (
                <div style={{
                  marginTop: 8, paddingLeft: 8, borderLeft: '2px solid var(--phosphor-dim)',
                  color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11,
                }}>
                  the ask: <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{activeRequest.ask}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div data-testid="eaw-app-intro" style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>
              I'm the STIGMERGY companion. Ask me about this terminal — its decks,
              boards, and how it operates the palace — or tell me what to change,
              and I'll capture it as a tracked to-do.
            </div>
          )
        ) : (
          <div data-testid="eaw-convo">
            {convo.map((m) => (
              m.role === 'edit'
                ? <EditMarker
                    key={m.id}
                    op={m.op} commit={m.commit} branch={m.branch} summary={m.summary}
                    reverts={m.reverts} vectorChange={m.vectorChange}
                    onUndo={m.op !== 'revert' && m.commit ? () => doUndo(m.commit, m.turnId) : undefined}
                    undone={revertedCommits.has(m.commit)}
                    undoing={undoingCommits.has(m.commit)}
                  />
                : m.role === 'todo'
                  ? <TodoMarker key={m.id} title={m.title} area={m.area} severity={m.severity} />
                  : <ChatBubble key={m.id} role={m.role} text={m.text} />
            ))}
            {undoError ? (
              <div data-testid="eaw-undo-error" style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11, marginTop: 4 }}>
                {undoError}
              </div>
            ) : null}
            {sending ? (
              <div data-testid="eaw-thinking" style={{ color: 'var(--phosphor-dim)', fontSize: 11, fontStyle: 'italic' }}>
                …thinking (a capable turn takes a moment)
              </div>
            ) : null}
          </div>
        )}
        {turnError ? (
          <div data-testid="eaw-turn-error" style={{ color: 'var(--warn)', textShadow: 'var(--glow)', fontSize: 11, marginTop: 8 }}>
            {turnError}
          </div>
        ) : null}
      </div>

      {/* Composer: type a turn. Enter sends; Shift+Enter is a newline. */}
      <div
        data-testid="eaw-composer"
        style={{
          display: 'flex', gap: 6, alignItems: 'flex-end',
          borderTop: '1px solid var(--phosphor-dim)', padding: '6px',
        }}
      >
        <textarea
          ref={inputRef}
          data-testid="eaw-input"
          className="bbs-scroll"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const el = e.target; // auto-grow up to a cap, then scroll inside
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_H)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTurn(); }
          }}
          placeholder={sending ? 'waiting for the companion…' : (isEntry ? 'discuss anything here, or ask for an edit…' : isTrickster ? 'ask about this project or its decision…' : 'discuss STIGMERGY, or give feedback…')}
          rows={3}
          disabled={sending}
          style={{
            flex: 1, resize: 'none',
            minHeight: 64, maxHeight: MAX_INPUT_H, overflowY: 'auto',
            overscrollBehavior: 'contain',
            background: 'var(--bg)', color: 'var(--phosphor)',
            border: '1px solid var(--phosphor-dim)', padding: '5px 7px',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.45,
            outline: 'none',
          }}
        />
        <span
          data-testid="eaw-send"
          role="button"
          onClick={sendTurn}
          title="send (Enter)"
          style={{
            cursor: sending || !draft.trim() ? 'default' : 'pointer',
            opacity: sending || !draft.trim() ? 0.4 : 1,
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            border: '1px solid var(--phosphor-dim)', padding: '4px 8px',
            textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 11,
            whiteSpace: 'nowrap',
          }}
        >[send]</span>
      </div>

      {/* Footer: grounding readout — what the box is grounded in. */}
      <div
        data-testid="eaw-grounding"
        style={{
          borderTop: '1px solid var(--phosphor-dim)',
          padding: '5px 8px',
          color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        grounded in <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{title}</span>
        {isTrickster ? (
          <>{' · '}pending decision{' · '}read-only</>
        ) : !isEntry ? (
          <>{' · '}development feedback</>
        ) : grounding ? (
          <>
            {' · '}frontmatter + body
            {' · '}{grounding.counts.neighbors_resolved}/{grounding.counts.links} neighbors
            {grounding.counts.neighbors_ghost > 0 ? ` (${grounding.counts.neighbors_ghost} ghost)` : ''}
            {' · '}palace floor
          </>
        ) : (
          <>
            {' · '}{linkCount} typed link{linkCount === 1 ? '' : 's'}
            {' · '}neighborhood{' · '}palace floor
          </>
        )}
      </div>

      {/* Bottom-edge height grip */}
      <div
        data-testid="eaw-grip-height"
        onPointerDown={startDrag('height')}
        title="drag to resize height"
        style={{ position: 'absolute', left: 0, right: 0, bottom: -3, height: 6, cursor: 'ns-resize' }}
      />
    </div>
    </>
  );
}
