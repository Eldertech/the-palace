import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Shell from './components/Shell.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import MessageList from './components/MessageList.jsx';
import ChannelTabs from './components/ChannelTabs.jsx';
import AgentRoster from './components/AgentRoster.jsx';
import { Banner } from './components/primitives.jsx';
import { fetchPersistent, fetchSessions } from './adapters/blackboard.js';
import { BOARDS } from './lib/format.js';
import { DEMO_MESSAGES } from './lib/demo-data.js';
import { validateAll } from './lib/schema.js';

function formatNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isDemoMode() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === '1';
}

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [clock, setClock] = useState(formatNow());
  const [activeBoard, setActiveBoard] = useState('GENERAL');
  const [agentFilter, setAgentFilter] = useState(null);

  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadState, setLoadState] = useState('idle');
  const [loadError, setLoadError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);

  const demo = isDemoMode();

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
      const combined = demo
        ? [...validateAll(DEMO_MESSAGES), ...real]
        : real;
      setMessages(combined);
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
    if (screen === 'board') loadAll();
  }, [screen, loadAll]);

  // Hotkey support: 1-6 select boards, R reloads, Q quits.
  useEffect(() => {
    if (screen !== 'board') return;
    function onKey(e) {
      // Don't intercept while typing in inputs.
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      const k = e.key;
      if (/^[1-6]$/.test(k)) {
        const idx = parseInt(k, 10) - 1;
        if (idx >= 0 && idx < BOARDS.length) setActiveBoard(BOARDS[idx]);
      } else if (k === 'r' || k === 'R') {
        loadAll();
      } else if (k === 'q' || k === 'Q') {
        setUser(null); setScreen('login');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, loadAll]);

  function handleLogin(handle) {
    setUser(handle);
    setScreen('board');
  }

  const totalFlagged = messages.filter((m) => Array.isArray(m._warnings) && m._warnings.length > 0).length;

  // Counts per board (for tab badges) and the currently visible filtered set.
  const counts = useMemo(() => {
    const out = {};
    for (const b of BOARDS) out[b] = 0;
    for (const m of messages) if (m.board && BOARDS.includes(m.board)) out[m.board] += 1;
    return out;
  }, [messages]);

  const filtered = useMemo(
    () => messages.filter((m) =>
      m.board === activeBoard && (agentFilter == null || m.from === agentFilter)
    ),
    [messages, activeBoard, agentFilter]
  );

  // Pending Trickster requests (RESOURCE_REQUESTs without a matching response).
  const pendingTrickster = useMemo(() => {
    const trickster = messages.filter((m) => m.board === 'TRICKSTER');
    const responded = new Set();
    for (const m of trickster) {
      if ((m.type === 'RESOURCE_GRANT' || m.type === 'RESOURCE_DENY') && m.re) {
        responded.add(m.re);
      }
    }
    return trickster.filter((m) => m.type === 'RESOURCE_REQUEST' && !responded.has(m.request_id)).length;
  }, [messages]);

  const cmds = [
    { key: 'R', label: 'reload' },
    { key: '1', label: 'general' },
    { key: '2', label: 'flags' },
    { key: '3', label: 'weave' },
    { key: '4', label: 'system' },
    { key: '5', label: 'trickster' },
    { key: '6', label: 'branches' },
    { key: 'Q', label: 'quit' },
  ];

  function handleCommand(k) {
    if (k === 'R') return loadAll();
    if (k === 'Q') { setUser(null); setScreen('login'); return; }
    const idx = parseInt(k, 10);
    if (idx >= 1 && idx <= 6) setActiveBoard(BOARDS[idx - 1]);
  }

  if (screen === 'login') {
    return (
      <Shell nodeName="01" clock={clock} hidePath commands={[]}>
        <LoginScreen onLogin={handleLogin} />
      </Shell>
    );
  }

  return (
    <Shell user={user} nodeName="01" clock={clock} unread={totalFlagged}
      commands={cmds} onCommand={handleCommand}>
      <div style={{ maxWidth: '110ch', margin: '0 auto', width: '100%' }}>
        <Banner as="h1" strong style={{ fontSize: 32, margin: '0 0 4px' }}>
          {activeBoard.toLowerCase()} board
        </Banner>
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 4 }}>
          welcome,{' '}
          <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)' }}>@{user}</span>
          {`. ${messages.length} total traces · ${totalFlagged} flagged · ${filtered.length} on ${activeBoard}.`}
          {loadedAt ? <> · last loaded <span style={{ color: 'var(--phosphor-dim)' }}>{loadedAt.split('T')[1].split('.')[0]}Z</span></> : null}
          {demo ? <span style={{ color: 'var(--warn)', textShadow: 'var(--glow)', marginLeft: 12 }}>· demo data prepended</span> : null}
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
            (or press R · file is the truth, edit _ops/swarm/persistent/blackboard.jsonl directly)
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
              <MessageList
                messages={filtered}
                sessionsEmpty={sessions.length === 0}
                activeBoard={activeBoard}
              />
            </div>
            <AgentRoster
              messages={messages}
              activeFilter={agentFilter}
              onSelect={setAgentFilter}
            />
          </div>
        )}
      </div>
    </Shell>
  );
}
