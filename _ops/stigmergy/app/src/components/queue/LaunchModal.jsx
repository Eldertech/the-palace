import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Banner } from '../primitives.jsx';
import { buildLaunchPrompt } from '../../lib/launch-prompt.js';
import { buildHandoffPickup } from '../../lib/handoff-builder.js';
import { postMessage, InvalidMessageError } from '../../adapters/blackboard.js';
import { launchInteractiveSession } from '../../adapters/launch.js';

// LaunchModal — "launch interactive" for a handoff (baton).
//
// Complex work (catching a baton) wants a watchable, steerable session you talk
// to — not a fire-and-forget headless worker. So this hands you a ready prompt
// to paste into a fresh interactive session (Claude Code / Cowork / the
// Companion), where you watch + steer in dialogue. MARK PICKED UP posts the
// paired handoff_picked_up so the QUEUE item self-clears (the baton's own
// On-pickup checklist still governs the actual catch + file deletion).
//
// The general primitive behind a future "launch interactive" on enrichment
// cards and stewards; debuts here on handoffs.

// Raw BBS button so each action carries a stable data-testid (the shared
// primitive Button doesn't forward arbitrary props).
function ModalButton({ children, onClick, tone = 'default', disabled, testId }) {
  const fg = tone === 'primary' ? 'var(--phosphor-white)' : 'var(--phosphor)';
  const border = tone === 'primary' ? 'var(--phosphor)' : 'var(--phosphor-dim)';
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent', color: disabled ? 'var(--phosphor-dim)' : fg,
        textShadow: disabled ? 'none' : 'var(--glow)',
        border: `1px solid ${border}`, padding: '4px 12px',
        fontFamily: 'var(--font-mono)', fontSize: 12, cursor: disabled ? 'default' : 'pointer',
        textTransform: 'uppercase', letterSpacing: '.05em',
      }}
    >{children}</button>
  );
}

export default function LaunchModal({ context, onPickedUp, onClose }) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState([]);
  const [launching, setLaunching] = useState(false);
  const [launchMsg, setLaunchMsg] = useState(null);
  const backdropRef = useRef(null);

  // Only a handoff (a baton) has pickup semantics — it gets the MARK PICKED UP
  // action that posts handoff_picked_up. Cards / stewards just launch a session.
  const isHandoff = context.kind === 'handoff';
  const prompt = buildLaunchPrompt(context);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleClose = useCallback(() => { if (!sending) onClose(); }, [sending, onClose]);

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(prompt);
      } else {
        const ta = document.createElement('textarea');
        ta.value = prompt; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the prompt is selectable in the <pre> */ }
  }, [prompt]);

  // Launch the prompt directly into a real Claude Code terminal (the server
  // spawns Terminal.app, seeded with the prompt, at the palace root) — no paste.
  // Falls back to copy on any failure; a non-macOS host says so plainly.
  const launchTerminal = useCallback(async () => {
    if (launching) return;
    setLaunching(true); setErrors([]); setLaunchMsg(null);
    const r = await launchInteractiveSession(prompt);
    if (r.ok) {
      setLaunchMsg('opening a Claude Code terminal…');
    } else {
      setErrors([r.supported === false ? `${r.error}` : r.error]);
    }
    setLaunching(false);
  }, [launching, prompt]);

  const markPickedUp = useCallback(async () => {
    if (sending) return;
    setSending(true); setErrors([]);
    try {
      const persisted = await postMessage(buildHandoffPickup({ handoffId: context.id }), 'persistent');
      if (onPickedUp) onPickedUp(context, persisted);
    } catch (err) {
      setErrors(err instanceof InvalidMessageError
        ? (err.errors.length ? err.errors.map((e) => (typeof e === 'string' ? e : e.message || JSON.stringify(e))) : ['the palace rejected this'])
        : [err.message || 'could not mark picked up']);
      setSending(false);
    }
  }, [sending, context, onPickedUp]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return (
    <div
      data-testid="launch-modal"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, fontFamily: 'var(--font-mono)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 760, margin: '0 16px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        border: '3px double var(--phosphor-dim)', background: 'var(--bg)', overflow: 'hidden',
      }}>
        <div style={{ borderBottom: '3px double var(--phosphor-dim)', padding: '8px 12px', flexShrink: 0 }}>
          <Banner strong>launch interactive</Banner>
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 12, marginTop: 2 }}>
            {isHandoff
              ? `catch the baton from @${context.from || '--'} in a session you can watch + steer`
              : `work ${context.entry || 'this'} in a session you can watch + steer`}
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            launch a Claude Code terminal at the palace root — or copy the prompt for Cowork / the web
          </div>
          <pre data-testid="launch-prompt" style={{
            margin: 0, border: '1px solid var(--phosphor-dim)', padding: '10px',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5,
            maxHeight: 320, overflowY: 'auto',
          }}>{prompt}</pre>
          {context.sourcePath ? (
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
              {isHandoff ? 'baton' : 'source'}: <span style={{ color: 'var(--ansi-bright-cyan)' }}>{context.sourcePath}</span>
            </div>
          ) : null}
          {errors.length > 0 ? (
            <div data-testid="launch-errors" style={{ border: '1px solid var(--error)', padding: '6px 10px', color: 'var(--error)', fontSize: 12, lineHeight: 1.5 }}>
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          ) : null}
        </div>

        <div style={{ borderTop: '1px solid var(--phosphor-dim)', padding: '8px 12px', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
          {launchMsg ? (
            <span data-testid="launch-ok" style={{ marginRight: 'auto', color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 12 }}>{launchMsg}</span>
          ) : null}
          <ModalButton tone="default" onClick={handleClose} disabled={sending || launching} testId="launch-close">close</ModalButton>
          <ModalButton tone="default" onClick={copy} testId="launch-copy">{copied ? 'copied' : 'copy prompt'}</ModalButton>
          <ModalButton tone="primary" onClick={launchTerminal} disabled={launching || sending} testId="launch-terminal">
            {launching ? 'opening…' : 'launch terminal'}
          </ModalButton>
          {isHandoff ? (
            <ModalButton tone="primary" onClick={markPickedUp} disabled={sending} testId="launch-mark-picked-up">
              {sending ? 'marking...' : 'mark picked up'}
            </ModalButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
