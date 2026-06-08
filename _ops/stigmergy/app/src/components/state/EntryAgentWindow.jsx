import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { fetchGrounding, postTurn } from '../../adapters/entry-agent.js';
import { subscribeLive } from '../../adapters/live-tail.js';

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
function EditMarker({ op, commit, branch, summary }) {
  return (
    <div data-testid="eaw-edit" style={{
      marginBottom: 8, padding: '5px 7px',
      border: '1px solid var(--phosphor-dim)',
      background: 'color-mix(in srgb, var(--phosphor) 6%, transparent)',
    }}>
      <div style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 11 }}>
        ✎ {op}{summary ? ` — ${summary}` : ''}
      </div>
      <div style={{ color: 'var(--phosphor-dim)', fontSize: 10 }}>
        committed <span style={{ color: 'var(--phosphor-bright)' }}>{commit}</span> on {branch}
      </div>
    </div>
  );
}

export default function EntryAgentWindow({ entry, containerRef, onClose }) {
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
  const sessionTurns = useRef(new Set());
  const currentTurn = useRef(null);

  const path = entry?.path ?? null;
  const drag = useRef(null);
  const inputRef = useRef(null);  // the composer textarea (auto-grow)

  // ── Fetch grounding on entry open / change ─────────────────────────────
  useEffect(() => {
    if (!path) return undefined;
    let cancelled = false;
    setGrounding(null);
    setConvo([]);            // a new entry is a fresh conversation
    setSending(false);
    setTurnError(null);
    sessionTurns.current = new Set();
    currentTurn.current = null;
    fetchGrounding(path).then((r) => {
      if (cancelled) return;
      if (r && r.ok && r.grounding) setGrounding(r.grounding);
    });
    return () => { cancelled = true; };
  }, [path]);

  // ── Read the board for this entry's Companion replies + edits ──────────
  useEffect(() => {
    if (!path) return undefined;
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return undefined;
    const close = subscribeLive({
      target: 'persistent',
      onMessage: (m) => {
        const p = m && m.payload;
        if (!p || p.entry_path !== path) return;
        if (!sessionTurns.current.has(p.turn_id)) return; // only this session's turns
        if (p.kind === 'companion_reply') {
          setConvo((prev) => [...prev, { id: m.id || `r-${p.turn_id}`, role: 'companion', text: p.reply || '' }]);
        } else if (p.kind === 'companion_edit') {
          setConvo((prev) => [...prev, {
            id: m.id || `e-${p.turn_id}`, role: 'edit',
            op: p.op, commit: p.commit, branch: p.branch, summary: p.summary,
          }]);
        } else {
          return;
        }
        if (p.turn_id === currentTurn.current) setSending(false);
      },
      onStateChange: () => {},
    });
    return close;
  }, [path]);

  const sendTurn = useCallback(async () => {
    const message = draft.trim();
    if (!message || sending || !path) return;
    setTurnError(null);
    // history: only the spoken turns (user + companion); edit markers carry no text
    const history = convo.filter((m) => m.role === 'user' || m.role === 'companion').map((m) => ({ role: m.role, text: m.text }));
    setConvo((prev) => [...prev, { id: `u-${prev.length}`, role: 'user', text: message }]);
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = ''; // reset auto-grow
    setSending(true);
    const r = await postTurn({ path, message, history });
    if (r && r.fired && r.turnId) {
      sessionTurns.current.add(r.turnId);
      currentTurn.current = r.turnId;
    } else {
      setSending(false);
      setTurnError(r?.busy ? 'a companion turn is already running — try again in a moment'
        : (r?.msg || r?.error || 'could not start the turn'));
    }
  }, [draft, sending, path, convo]);

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
    const el = containerRef?.current;
    if (!el || typeof window === 'undefined') return undefined;
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
  }, [containerRef, top, height, path]);

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
  const title = entry?.title ?? entry?.path ?? 'this entry';
  const winPos = left == null ? { right: 28 } : { left };

  return (
    <div
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
          over: <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>
            {reading || '— (top)'}
          </span>
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
        ) : (
          <div data-testid="eaw-convo">
            {convo.map((m) => (
              m.role === 'edit'
                ? <EditMarker key={m.id} op={m.op} commit={m.commit} branch={m.branch} summary={m.summary} />
                : <ChatBubble key={m.id} role={m.role} text={m.text} />
            ))}
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
          placeholder={sending ? 'waiting for the companion…' : 'discuss anything here, or ask for an edit…'}
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
        {grounding ? (
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
  );
}
