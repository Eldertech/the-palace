import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Shell from './components/Shell.jsx';
import { PalaceRefProvider } from './lib/palace-ref.jsx';
import MessageList from './components/MessageList.jsx';
import ChannelTabs from './components/ChannelTabs.jsx';
import AgentRoster from './components/AgentRoster.jsx';
import TricksterInbox from './components/TricksterInbox.jsx';
import DigestPanel from './components/DigestPanel.jsx';
import DeckTabs from './components/DeckTabs.jsx';
import { DECKS } from './lib/decks.js';
import StateDeck from './components/state/StateDeck.jsx';
import LogDeck from './components/log/LogDeck.jsx';
import TricksterDeck from './components/TricksterDeck.jsx';
import ActuatorPanel from './components/queue/ActuatorPanel.jsx';
import QueuePanel from './components/queue/QueuePanel.jsx';
import StewardsDeck from './components/stewards/StewardsDeck.jsx';
import CompanionHost from './components/CompanionHost.jsx';
import { Banner } from './components/primitives.jsx';
import { fetchPersistent, fetchSessions } from './adapters/blackboard.js';
import { subscribeLive } from './adapters/live-tail.js';
import { mergeLive } from './lib/live-feed.js';
import { buildInbox } from './lib/inbox.js';
import { BOARDS } from './lib/format.js';
import { DEMO_MESSAGES } from './lib/demo-data.js';
import { validateAll } from './lib/schema.js';

function formatNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Demo mode from the ?demo= query param:
//   '1'     → demo data PREPENDED onto live palace data (the default showcase)
//   'only'  → demo data ONLY, excluding the live board (hermetic + deterministic;
//             used by inbox/click-to-respond e2e so they don't depend on whatever
//             RESOURCE_REQUESTs the live palace board happens to carry)
//   'empty' → no data at all (hermetic empty board for empty-state / no-pending tests)
//   (absent) → live palace data only
function demoMode() {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('demo');
  return v === '1' || v === 'only' || v === 'empty' ? v : null;
}

// Pick the default deck from ?deck= when present (e2e tests use it to land
// directly on a specific deck without keyboard navigation). Falls back to
// STATE -- the v1.0 thesis is that the present is what loads first.
//
// Backwards-compat heuristic: when ?demo= is present (the v0.x board-view
// showcase + most existing e2e tests), default to QUEUE. The demo modes
// only carry board messages, so landing on STATE would render an empty
// PULSE lens; landing on QUEUE keeps the existing tests + showcase usable
// without per-test patches.
function initialDeck() {
  if (typeof window === 'undefined') return 'STATE';
  const params = new URLSearchParams(window.location.search);
  const v = params.get('deck');
  if (typeof v === 'string') {
    const up = v.toUpperCase();
    if (DECKS.includes(up)) return up;
  }
  if (params.get('demo')) return 'QUEUE';
  return 'STATE';
}

export default function App() {
  const [clock, setClock] = useState(formatNow());
  // Top-level deck: STATE (present, default), QUEUE (future), LOG (past).
  // The retro/prospective discipline as navigation, per the v1.0 thesis.
  const [deck, setDeck] = useState(initialDeck());
  // Default board (when QUEUE is active) is TRICKSTER -- the inbox is the
  // page that earns its keep moment-to-moment.
  const [activeBoard, setActiveBoard] = useState('TRICKSTER');
  const [agentFilter, setAgentFilter] = useState(null);
  const [scanlinesOn, setScanlinesOn] = useState(true);
  // The Companion window is opt-in and now GLOBAL (Stage 0): one floating
  // collaborator, available on every deck via a launcher in the command bar
  // ([~]) and a hotkey. The host below resolves what it grounds in from the
  // active deck + the open entry. Off = the window does not exist; the app
  // reads exactly as before.
  const [agentOpen, setAgentOpen] = useState(false);
  const toggleAgent = useCallback(() => setAgentOpen((o) => !o), []);
  // The open entry path, reported up from StateDeck (which owns the URL-driven
  // entry navigation). The Companion grounds in it when the STATE deck is
  // active; ignored on other decks. null when no entry is open.
  const [currentEntryPath, setCurrentEntryPath] = useState(null);
  // Cross-deck entry jump: clicking [BUN] on a name outside STATE (e.g. a
  // Trickster card's @steward) flips to STATE and opens that entry. The nonce
  // lets the same entry be re-jumped and keeps StateDeck's open-effect from
  // firing on ordinary re-renders.
  const [jumpTarget, setJumpTarget] = useState(null);
  const jumpNonce = useRef(0);
  const openEntryInState = useCallback((path) => {
    if (!path) return;
    jumpNonce.current += 1;
    setJumpTarget({ path, nonce: jumpNonce.current });
    setDeck('STATE');
  }, []);

  const [messages, setMessages] = useState([]);
  // Optimistic responses: persisted messages from the click-to-respond flow
  // since the last full reload. Merged into the canonical messages array
  // for ALL derived state — counts, filters, inbox, tab badges — so the UI
  // updates immediately on confirm. Phase 5 SSE also pushes the same
  // message; live-feed.mergeLive dedupes by id, and we prune optimistic
  // entries as SSE confirms them.
  const [optimistic, setOptimistic] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadState, setLoadState] = useState('idle');
  const [loadError, setLoadError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);
  // SSE connection state: 'connecting' | 'connected' | 'reconnecting' | 'offline'
  const [liveState, setLiveState] = useState('offline');

  const demo = demoMode();

  useEffect(() => {
    const t = setInterval(() => setClock(formatNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadAll = useCallback(async () => {
    setLoadState('loading');
    try {
      const [persistent, sessionList] = await Promise.all([
        fetchPersistent(),
        fetchSessions(),
      ]);
      const real = persistent.messages || [];
      let combined;
      if (demo === 'empty') {
        combined = [];
      } else if (demo === 'only') {
        combined = validateAll(DEMO_MESSAGES);
      } else if (demo === '1') {
        combined = [...validateAll(DEMO_MESSAGES), ...real];
      } else {
        combined = real;
      }
      setMessages(combined);
      // A fresh reload subsumes any optimistic state — the persisted
      // messages are now in the canonical set.
      setOptimistic([]);
      setSessions(sessionList.sessions || []);
      setLoadedAt(new Date().toISOString());
      setLoadState('ok');
      setLoadError(null);
    } catch (err) {
      setLoadError(err?.message || String(err));
      setLoadState('error');
    }
  }, [demo]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Phase 5: subscribe to SSE live tail on mount. Incoming messages flow
  // through mergeLive into the canonical messages array. If a message that
  // arrived via SSE was already in the optimistic set (same id), we prune
  // it from optimistic to keep the set tight.
  useEffect(() => {
    const close = subscribeLive({
      target: 'persistent',
      onMessage: (incoming) => {
        setMessages((prev) => mergeLive(prev, incoming));
        // Prune from optimistic once SSE confirms the message is on-disk.
        setOptimistic((prev) => prev.filter((m) => m.id !== incoming.id));
      },
      onStateChange: setLiveState,
    });
    return close;
  }, []);

  // Hotkey support:
  //   S / Q / L → switch deck (STATE / QUEUE / LOG)
  //   1-6 → select board (only meaningful when QUEUE is active)
  //   R → reload (deck-aware: reloads board on QUEUE, no-op stub elsewhere
  //       until the deck adds its own reload affordance)
  //   V → toggle scanlines
  useEffect(() => {
    function onKey(e) {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      const k = e.key;
      if (k === 's' || k === 'S') return setDeck('STATE');
      if (k === 'q' || k === 'Q') return setDeck('QUEUE');
      if (k === 'l' || k === 'L') return setDeck('LOG');
      if (k === 't' || k === 'T') return setDeck('TRICKSTER');
      if (k === 'w' || k === 'W') return setDeck('STEWARDS');
      if (k === '`' || k === '~') return toggleAgent();
      if (deck === 'QUEUE' && /^[1-6]$/.test(k)) {
        const idx = parseInt(k, 10) - 1;
        if (idx >= 0 && idx < BOARDS.length) setActiveBoard(BOARDS[idx]);
      } else if (k === 'r' || k === 'R') {
        loadAll();
      } else if (k === 'v' || k === 'V') {
        setScanlinesOn((on) => !on);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loadAll, deck, toggleAgent]);

  // Canonical view: persisted messages plus any optimistic responses
  // posted in this session but not yet covered by a reload. Dedup by id
  // so a reload-then-optimistic edge case doesn't double-count.
  const visibleMessages = useMemo(() => {
    if (optimistic.length === 0) return messages;
    const seen = new Set(messages.map((m) => m.id).filter(Boolean));
    const extra = optimistic.filter((m) => !seen.has(m.id));
    return extra.length === 0 ? messages : [...messages, ...extra];
  }, [messages, optimistic]);

  const totalFlagged = visibleMessages.filter((m) => Array.isArray(m._warnings) && m._warnings.length > 0).length;

  // Counts per board (for tab badges) and the currently visible filtered set.
  const counts = useMemo(() => {
    const out = {};
    for (const b of BOARDS) out[b] = 0;
    for (const m of visibleMessages) if (m.board && BOARDS.includes(m.board)) out[m.board] += 1;
    return out;
  }, [visibleMessages]);

  const filtered = useMemo(
    () => visibleMessages.filter((m) =>
      m.board === activeBoard && (agentFilter == null || m.from === agentFilter)
    ),
    [visibleMessages, activeBoard, agentFilter]
  );

  // Pending Trickster requests (RESOURCE_REQUESTs without a matching response).
  const pendingTrickster = useMemo(() => {
    const trickster = visibleMessages.filter((m) => m.board === 'TRICKSTER');
    const responded = new Set();
    for (const m of trickster) {
      if ((m.type === 'RESOURCE_GRANT' || m.type === 'RESOURCE_DENY') && m.re) {
        responded.add(m.re);
      }
    }
    return trickster.filter((m) => m.type === 'RESOURCE_REQUEST' && !responded.has(m.request_id)).length;
  }, [visibleMessages]);

  // The pending decisions the Companion can ground in on the TRICKSTER deck. The
  // window scroll-spies the card it floats over and answers AS that project (its
  // `from` is the project entry's title — the page IS the agent). We pass the
  // whole ranked list so the window can pick the nearest one live; null elsewhere
  // (then the companion grounds in STIGMERGY). Order matches the rendered cards
  // (buildInbox, newest-first) so index alignment is exact.
  const currentTricksterRequests = useMemo(() => {
    if (deck !== 'TRICKSTER') return null;
    const list = buildInbox(visibleMessages).pending_requests;
    if (!list.length) return null;
    return list.map((p) => ({
      request_id: p.request_id,
      project: p.from,
      ask: p.headline || p.resource || null,
      ground: p.ground || null,
      rationale: p.rationale || null,
      options: Array.isArray(p.options)
        ? p.options.map((o) => ({ id: o.id, label: o.label, recommended: !!o.recommended }))
        : null,
      recommended: p.recommended_option || null,
    }));
  }, [deck, visibleMessages]);

  const handleOptimisticAppend = useCallback((persistedMessage) => {
    setOptimistic((prev) => {
      if (prev.some((m) => m.id === persistedMessage.id)) return prev;
      return [...prev, persistedMessage];
    });
  }, []);

  // Deck-aware command bar:
  //   S / Q / L always available (and inverted when active to match the
  //   ChannelTabs idiom); 1-6 only when QUEUE is active; R + V always.
  // CommandBar's `activeBoard` is reused as the inversion signal — we pass
  // the active deck label when on STATE/LOG so the deck button highlights.
  const cmds = useMemo(() => {
    const deckCmds = [
      { key: 'S', label: 'state' },
      { key: 'Q', label: 'queue' },
      { key: 'L', label: 'log' },
    ];
    const trailing = [
      { key: '~', label: agentOpen ? 'close companion' : 'companion' },
      { key: 'R', label: 'reload' },
      { key: 'V', label: scanlinesOn ? 'visual off' : 'visual on' },
    ];
    if (deck === 'QUEUE') {
      const boardCmds = [
        { key: '1', label: 'general' },
        { key: '2', label: 'flags' },
        { key: '3', label: 'weave' },
        { key: '4', label: 'system' },
        { key: '5', label: 'trickster' },
        { key: '6', label: 'branches' },
      ];
      return [...deckCmds, ...boardCmds, ...trailing];
    }
    return [...deckCmds, ...trailing];
  }, [deck, scanlinesOn, agentOpen]);

  function handleCommand(k) {
    if (k === 'S') return setDeck('STATE');
    if (k === 'Q') return setDeck('QUEUE');
    if (k === 'L') return setDeck('LOG');
    if (k === 'T') return setDeck('TRICKSTER');
    if (k === '~') return toggleAgent();
    if (k === 'R') return loadAll();
    if (k === 'V') return setScanlinesOn((on) => !on);
    if (deck === 'QUEUE') {
      const idx = parseInt(k, 10);
      if (idx >= 1 && idx <= 6) setActiveBoard(BOARDS[idx - 1]);
    }
  }

  // The CommandBar inverts the entry whose key matches its `activeBoard` prop.
  // For STATE/LOG decks we surface the deck letter (S/L); for QUEUE we keep
  // the existing board-letter behavior so the active board stays inverted.
  const commandBarActive = deck === 'QUEUE' ? activeBoard
    : deck === 'STATE' ? 'S'
    : deck === 'TRICKSTER' ? 'T'
    : 'L';

  return (
    <Shell nodeName="01" clock={clock} unread={totalFlagged}
      commands={cmds} onCommand={handleCommand} scanlinesOn={scanlinesOn}
      vfxState={scanlinesOn ? 'on' : 'off'} activeBoard={commandBarActive}
      liveState={liveState}>
      <PalaceRefProvider vault="The Palace" openEntryInState={openEntryInState}>
      <DeckTabs active={deck} onSelect={setDeck} />

      {deck === 'STATE' && (
        <StateDeck
          jumpTarget={jumpTarget}
          onEntryPathChange={setCurrentEntryPath}
        />
      )}
      {deck === 'LOG' && <LogDeck />}
      {deck === 'STEWARDS' && <StewardsDeck />}
      {deck === 'TRICKSTER' && (
        <TricksterDeck
          messages={visibleMessages}
          onConfirmed={handleOptimisticAppend}
          loadState={loadState}
          loadError={loadError}
          onReload={loadAll}
        />
      )}
      {deck === 'QUEUE' && (
        <div data-testid="board-screen" style={{ width: '100%' }}>
          <Banner as="h1" strong style={{ fontSize: 32, margin: '0 0 4px' }}>
            queue -- {activeBoard.toLowerCase()} board
          </Banner>
          <div style={{ marginBottom: 10 }}>
            <ActuatorPanel />
            <QueuePanel messages={visibleMessages} onJumpEntry={() => setDeck('STATE')} />
          </div>
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 4 }}>
            {`${messages.length} total traces · ${totalFlagged} flagged · ${filtered.length} on ${activeBoard}.`}
            {loadedAt ? <> · last loaded <span style={{ color: 'var(--phosphor-dim)' }}>{loadedAt.split('T')[1].split('.')[0]}Z</span></> : null}
            {demo === '1' ? <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', marginLeft: 12 }}>· demo data prepended</span> : null}
          </div>
          <div style={{ marginBottom: 12, fontSize: 14 }} data-testid="inline-actions">
            <span
              onClick={() => loadAll()}
              style={{
                color: 'var(--phosphor)', textShadow: 'var(--glow)',
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.04em',
                border: '1px solid var(--phosphor-dim)', padding: '2px 8px',
              }}
            >
              [<b style={{ color: 'var(--phosphor-white)' }}>R</b>]&nbsp;RELOAD
            </span>
            <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginLeft: 16 }}>
              (or press R)
            </span>
          </div>

          <ChannelTabs
            active={activeBoard}
            onSelect={setActiveBoard}
            counts={counts}
            pendingTrickster={pendingTrickster}
          />

          {loadState === 'loading' && (
            <div data-testid="loading" style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
              loading...
            </div>
          )}
          {loadState === 'error' && (
            <div data-testid="load-error" style={{
              color: 'var(--error)', textShadow: 'var(--glow)',
              border: '1px solid var(--error)', padding: '8px',
            }}>
              failed to load palace data: {loadError}
            </div>
          )}
          {loadState === 'ok' && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24,
              alignItems: 'flex-start',
            }}>
              <div style={{ minWidth: 0 }}>
                {agentFilter && (
                  <div
                    data-testid="agent-filter-banner"
                    style={{
                      color: 'var(--warn)', textShadow: 'var(--glow)',
                      border: '1px dashed var(--warn)', padding: '4px 8px',
                      margin: '0 0 8px', fontSize: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => setAgentFilter(null)}
                  >
                    filtered by @{agentFilter} · click to clear
                  </div>
                )}
                {activeBoard === 'TRICKSTER' && (
                  <>
                    <DigestPanel />
                    <TricksterInbox
                      messages={visibleMessages}
                      onConfirmed={handleOptimisticAppend}
                    />
                  </>
                )}
                <MessageList
                  messages={filtered}
                  sessionsEmpty={sessions.length === 0}
                  activeBoard={activeBoard}
                />
              </div>
              <AgentRoster
                messages={visibleMessages}
                activeFilter={agentFilter}
                onSelect={setAgentFilter}
              />
            </div>
          )}
        </div>
      )}

      {/* The global Companion: one floating window, available on every deck.
          Grounds in the open entry on STATE, in STIGMERGY itself elsewhere. */}
      <CompanionHost
        open={agentOpen}
        deck={deck}
        entryPath={currentEntryPath}
        tricksterRequests={currentTricksterRequests}
        onClose={toggleAgent}
      />
      </PalaceRefProvider>
    </Shell>
  );
}
