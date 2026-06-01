// ResponseModal.jsx — preview + confirm flow for click-to-respond.
//
// Opens over TricksterInbox when the user clicks a response option button.
// Shows a §2.2-conformant preview of the message about to be POSTed.
// Confirm → postMessage(); Cancel → close without side effects.
//
// Props:
//   request      {object}  — pending inbox item (from buildInbox)
//   option       {object}  — one of inbox.response_options
//   sessionId    {string}  — optional override; defaults to request._session_id
//   onConfirmed  {fn}      — called with the persisted message on success
//   onCancel     {fn}      — called when the user cancels

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Banner, Button, Field } from './primitives.jsx';
import { buildResponse, buildRequestOptionResponse } from '../lib/response-builder.js';
import { postMessage, InvalidMessageError } from '../adapters/blackboard.js';

const padLabel = (s) => (s + '          ').slice(0, 9);

// Build the preview message given the current state of the modal.
//
// Three response shapes:
//   - asker-supplied option (option.option_id present) -> buildRequestOptionResponse
//     payload: { granted, option_id, option_label, notes }
//   - freetext  -> buildResponse with customText as constraints
//     payload: { granted, constraints, notes? }
//   - generic Grant / Deny / Grant-limited -> buildResponse
//     payload: { granted, constraints | reason, notes? }
function buildPreview({ request, option, customText, notes, sessionId }) {
  if (option.option_id || option.option_label) {
    return buildRequestOptionResponse({
      request: {
        id: request._message_id,
        from: request.from,
        request_id: request.request_id,
        session_id: request._session_id,
      },
      optionId: option.option_id,
      optionLabel: option.option_label,
      notes,
      sessionId: sessionId ?? request._session_id,
    });
  }
  const decision = option.type === 'RESOURCE_DENY' ? 'DENY' : 'GRANT';
  const constraints =
    option.type === 'freetext'
      ? (customText || '')
      : option.constraints ?? option.reason ?? null;

  return buildResponse({
    request: {
      id: request._message_id,
      from: request.from,
      request_id: request.request_id,
      session_id: request._session_id,
    },
    decision,
    constraints,
    notes,
    sessionId: sessionId ?? request._session_id,
  });
}

export default function ResponseModal({ request, option, sessionId, onConfirmed, onCancel }) {
  const [customText, setCustomText] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState([]);
  const notesRef = useRef(null);        // textarea ref, focused on mount
  const confirmBtnRef = useRef(null);   // ref on the wrapper <div> around the confirm button
  const backdropRef = useRef(null);

  // Build preview on every render — it's cheap and keeps the preview live.
  let preview = null;
  let previewError = null;
  try {
    preview = buildPreview({ request, option, customText, notes, sessionId });
  } catch (e) {
    previewError = e.message;
  }

  // Lock background scroll on mount; restore on unmount.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Focus the notes textarea when the modal opens so Loudon can type
  // immediately. Enter inside the textarea submits; Shift+Enter inserts a
  // newline. Escape on the backdrop cancels.
  useEffect(() => {
    const el = notesRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (!sending) onCancel();
  }, [sending, onCancel]);

  const handleConfirm = useCallback(async () => {
    if (sending || !preview) return;
    setSending(true);
    setErrors([]);
    try {
      // Always route to the persistent board — see TricksterInbox.jsx
      // InlineResponse for the rationale. The session-id-based routing
      // misroutes permanent-agent responses onto session boards where
      // the original request can't see them.
      const persisted = await postMessage(preview, 'persistent');
      onConfirmed(persisted);
    } catch (err) {
      if (err instanceof InvalidMessageError) {
        setErrors(err.errors.length > 0
          ? err.errors.map((e) => (typeof e === 'string' ? e : e.message || JSON.stringify(e)))
          : ['Validation failed (no details)']);
      } else {
        setErrors([err.message || 'Unknown error']);
      }
    } finally {
      setSending(false);
    }
  }, [sending, preview, request, onConfirmed]);

  // Keyboard:
  //   Escape          -> cancel
  //   Enter           -> confirm (also fires from inside the notes textarea
  //                      so Loudon types notes + hits Enter to send)
  //   Shift+Enter     -> newline inside the textarea (does NOT submit)
  //   Cmd/Ctrl+Enter  -> also submits (for parity with chat apps)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { handleCancel(); return; }
      if (e.key === 'Enter' && !e.shiftKey && !sending) {
        // Submit unless this is a multi-line break in the textarea
        // (Shift+Enter is the newline gesture). Default behavior in the
        // textarea is "insert newline" -- preventDefault and confirm.
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCancel, handleConfirm, sending]);

  const isCustom = option.type === 'freetext';

  return (
    // Full-viewport overlay
    <div
      data-testid="response-modal"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) handleCancel(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Modal card */}
      <div style={{
        width: '100%', maxWidth: 720,
        margin: '0 16px',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        border: '3px double var(--phosphor-dim)',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{
          borderBottom: '3px double var(--phosphor-dim)',
          padding: '6px 12px',
          flexShrink: 0,
        }}>
          <Banner strong>RESPOND -- {option.label}</Banner>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Request summary */}
          <div>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              request
            </div>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', lineHeight: 1.5 }}>
              {[
                ['from', `@${request.from || '--'}`],
                ['request_id', request.request_id || '--'],
                ['resource', request.resource || '--'],
                ['blocking', request.blocking ? 'yes' : 'no'],
              ].map(([k, v]) => (
                <div key={k}>
                  <span>{padLabel(k)}: </span>
                  <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Constraints field for freetext option. */}
          {isCustom && (
            <div>
              <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                constraints (posted as RESOURCE_GRANT with your text)
              </div>
              <Field
                prompt=">"
                value={customText}
                onChange={setCustomText}
                placeholder="constraints"
              />
            </div>
          )}

          {/* Notes textarea -- available for every option. Auto-focused on
              modal open; Enter submits, Shift+Enter inserts a newline. */}
          <div>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              notes (optional) -- Enter to send, Shift+Enter for newline
            </div>
            <textarea
              ref={notesRef}
              data-testid="response-modal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="add a note for the agent..."
              rows={3}
              style={{
                width: '100%',
                background: 'var(--bg, #000)',
                color: 'var(--phosphor)',
                textShadow: 'var(--glow)',
                border: '1px solid var(--phosphor-dim)',
                padding: '6px 10px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 13,
                lineHeight: 1.4,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* JSON preview */}
          <div>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              message preview
            </div>
            <div
              data-testid="response-modal-preview"
              style={{
                border: '1px solid var(--phosphor-dim)',
                padding: '8px 10px',
                overflowX: 'auto',
                maxHeight: 260,
                overflowY: 'auto',
                background: 'transparent',
              }}
            >
              {previewError ? (
                <span style={{ color: 'var(--error)' }}>preview error: {previewError}</span>
              ) : (
                <pre style={{
                  margin: 0, padding: 0,
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: 'var(--phosphor)', textShadow: 'var(--glow)',
                  whiteSpace: 'pre',
                }}>
                  {JSON.stringify(preview, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Validation errors (shown after a failed POST) */}
          {errors.length > 0 && (
            <div
              data-testid="response-modal-errors"
              style={{
                border: '1px solid var(--error)',
                padding: '6px 10px',
                color: 'var(--error)',
                lineHeight: 1.5,
                fontSize: 12,
              }}
            >
              {errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>

        {/* Action row */}
        <div style={{
          borderTop: '1px solid var(--phosphor-dim)',
          padding: '8px 12px',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          flexShrink: 0,
        }}>
          <Button tone="default" onClick={handleCancel} disabled={sending}>
            CANCEL
          </Button>
          <div ref={confirmBtnRef} style={{ display: 'inline-block' }}>
            <Button
              tone="primary"
              onClick={handleConfirm}
              disabled={sending || !!previewError}
            >
              {sending ? 'CONFIRM (sending...)' : 'CONFIRM'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
