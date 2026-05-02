import React, { useState, useEffect, useCallback } from 'react';
import Shell from './components/Shell.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import MessageList from './components/MessageList.jsx';
import { Banner } from './components/primitives.jsx';
import { fetchPersistent, fetchSessions } from './adapters/blackboard.js';

function formatNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [clock, setClock] = useState(formatNow());

  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadState, setLoadState] = useState('idle'); // idle | loading | ok | error
  const [loadError, setLoadError] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);

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
      setMessages(persistent.messages || []);
      setSessions(sessionList.sessions || []);
      setLoadedAt(new Date().toISOString());
      setLoadState('ok');
      setLoadError(null);
    } catch (err) {
      setLoadError(err?.message || String(err));
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    if (screen === 'board') loadAll();
  }, [screen, loadAll]);

  function handleLogin(handle) {
    setUser(handle);
    setScreen('board');
  }

  const flagged = messages.filter((m) => Array.isArray(m._warnings) && m._warnings.length > 0).length;

  const cmds = [
    { key: 'R', label: 'reload' },
    { key: 'Q', label: 'quit' },
  ];

  function handleCommand(k) {
    if (k === 'R') loadAll();
    if (k === 'Q') { setUser(null); setScreen('login'); }
  }

  if (screen === 'login') {
    return (
      <Shell nodeName="01" clock={clock} hidePath commands={[]}>
        <LoginScreen onLogin={handleLogin} />
      </Shell>
    );
  }

  return (
    <Shell user={user} nodeName="01" clock={clock} unread={flagged}
      commands={cmds} onCommand={handleCommand}>
      <div style={{ maxWidth: '110ch', margin: '0 auto', width: '100%' }}>
        <Banner as="h1" strong style={{ fontSize: 32, margin: '0 0 4px' }}>persistent board</Banner>
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 4 }}>
          welcome,{' '}
          <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)' }}>@{user}</span>
          {`. ${messages.length} traces · ${flagged} flagged.`}
          {loadedAt ? <> · last loaded <span style={{ color: 'var(--phosphor-dim)' }}>{loadedAt.split('T')[1].split('.')[0]}Z</span></> : null}
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
          <MessageList messages={messages} sessionsEmpty={sessions.length === 0} />
        )}
      </div>
    </Shell>
  );
}
