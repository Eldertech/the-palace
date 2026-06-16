// ResponseModal.jsx — preview + confirm flow for click-to-respond.
//
// Opens over the QUEUE deck (QueuePanel) when the user picks a response that
// needs typed input (deny / grant--limited / custom) on a proposal or flag.
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
import { Banner, Button } from './primitives.jsx';
import { buildResponse, buildRequestOptionResponse } from '../lib/response-builder.js';
import { postMessage, InvalidMessageError } from '../adapters/blackboard.js';

// Human-language label for what the human is about to do. The chrome shows
// this in the modal subtitle so the user sees "granting" / "denying" /
// "responding" rather than the RESOURCE_GRANT wire type.
function decisionVerb(option) {
  if (option.option_id || option.option_label) return 'granting an option';
  if (option.type === 'RESOURCE_DENY') return 'denying';
  if (option.type === 'freetext') return 'responding';
  return 'granting';
}

// Build the preview message given the current state of the modal.
//
// Three response shapes:
//   - asker-supplied option (option.option_id present) -> buildRequestOptionResponse
//     payload: { granted, option_id, option_label, notes }
//   - freetext  -> buildResponse with customText as constraints
//     payload: { granted, constraints, notes? }
//   - generic Grant / Deny / Grant-limited -> buildResponse
//     payload: { granted, constraints | reason, notes? }
function buildPreview({ request, option, notes, sessionId }) {
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
  // For the freetext "custom response" option the notes textarea IS the
  // response -- there was no second "constraints" field to merge from. For
  // generic Grant / Grant-limited / Deny, the option carries its own
  // constraints/reason and notes is the optional addendum.
  const constraints = option.type === 'freetext'
    ? (notes || '')
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
    // For freetext the notes-as-constraints is the whole response; don't
    // duplicate the same text into payload.notes.
    notes: option.type === 'freetext' ? null : notes,
    sessionId: sessionId ?? request._session_id,
  });
}

export default function ResponseModal({ request, option, sessionId, onConfirmed, onCancel }) {
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showPayloadPreview, setShowPayloadPreview] = useState(false);
  const notesRef = useRef(null);        // textarea ref, focused on mount
  const confirmBtnRef = useRef(null);   // ref on the wrapper <div> around the confirm button
  const backdropRef = useRef(null);

  // Build preview on every render — it's cheap and keeps the preview live.
  let preview = null;
  let previewError = null;
  try {
    preview = buildPreview({ request, option, notes, sessionId });
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
      // Always route to the persistent board — same rationale as TricksterCard's
      // fileGrant: session-id-based routing misroutes permanent-agent responses
      // onto session boards where the original request can't see them.
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
        {/* Title bar -- leads with WHO you're responding to and the choice
            you've already made on the card. No "RESPOND --" boilerplate. */}
        <div style={{
          borderBottom: '3px double var(--phosphor-dim)',
          padding: '8px 12px',
          flexShrink: 0,
        }}>
          <Banner strong>{request.from || 'agent'}</Banner>
          <div style={{
            color: 'var(--phosphor-dim)', textShadow: 'none',
            fontSize: 12, marginTop: 2,
          }}>
            {decisionVerb(option)}{option.option_label ? ` · ${option.option_label}` : option.label && !option.option_label ? ` · ${option.label.toLowerCase()}` : ''}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Notes textarea -- the single typing surface. For the freetext
              "custom response" option it IS the response; for everything else
              it's a free-form addendum on top of the option_id / grant / deny
              that came from the card click. Auto-focused; Enter submits. */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {isCustom
                ? 'your response -- Enter to send, Shift+Enter for newline'
                : 'add a note (optional) -- Enter to send, Shift+Enter for newline'}
            </div>
            <textarea
              ref={notesRef}
              data-testid="response-modal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isCustom ? 'type your response...' : 'add a note for the agent...'}
              rows={10}
              style={{
                width: '100%',
                background: 'var(--bg, #000)',
                color: 'var(--phosphor)',
                textShadow: 'var(--glow)',
                border: '1px solid var(--phosphor-dim)',
                padding: '8px 10px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 13,
                lineHeight: 1.45,
                resize: 'vertical',
                boxSizing: 'border-box',
                minHeight: 180,
              }}
            />
          </div>

          {/* JSON payload preview -- collapsed by default; expand on demand. */}
          <div>
            <span
              data-testid="response-modal-preview-toggle"
              onClick={() => setShowPayloadPreview((v) => !v)}
              style={{
                cursor: 'pointer',
                color: 'var(--phosphor-dim)', textShadow: 'none',
                fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase',
                borderBottom: '1px dotted currentColor',
              }}
            >
              {showPayloadPreview ? '[-] hide payload preview' : '[+] show payload preview'}
            </span>
          </div>
          {showPayloadPreview ? (
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
          ) : null}

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
