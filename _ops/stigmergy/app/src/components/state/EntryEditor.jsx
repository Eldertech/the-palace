import React, { useEffect, useMemo, useState } from 'react';
import FrontmatterForm from './FrontmatterForm.jsx';
import WikilinkTextarea from './WikilinkTextarea.jsx';
import CommitPreviewPanel from './CommitPreviewPanel.jsx';
import { fetchEntry, previewEntrySave } from '../../adapters/entries.js';
import { checkAllowList, isDirty, validateFrontmatter } from '../../lib/entry-edit.js';

// STATE write surface (Phase 5 Stage A — dry-run preview).
//
// Opens an existing entry, lets the user edit frontmatter via forms + body
// via wikilink textarea, and on Save shows the EXACT structured commit
// palace-commit WOULD make (subject + derived Palace-* trailers + udiff).
// No file is written; no commit is made. Stage B (deferred behind
// STIGMERGY_ARM_WRITE=1) will reuse this surface and add the write.
//
// Props:
//   path           -- entry path (palace-relative)
//   index          -- Map(name -> path) for body wikilink + link autocomplete
//   onCancel()     -- close the editor, return to read view
//   onSaved()      -- (deferred) called after a real save in Stage B

export default function EntryEditor({ path, index, onCancel, onSaved }) {
  const [state, setState] = useState({ kind: 'loading' });
  const [proposed, setProposed] = useState(null); // { frontmatter, body }
  const [summary, setSummary] = useState('');
  const [verify, setVerify] = useState('verified');
  const [bodyMessage, setBodyMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Pre-flight allow-list: if this path is canon / machinery, refuse to
  // open the editor at all -- the button on the read view is also disabled,
  // but we hard-check here so deep-linked URLs can't slip through.
  const allow = useMemo(() => checkAllowList(path), [path]);

  useEffect(() => {
    if (!allow.allowed) {
      setState({ kind: 'refused', reason: allow.reason });
      return;
    }
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchEntry(path).then((r) => {
      if (cancelled) return;
      if (r.ok) {
        const orig = { frontmatter: r.frontmatter ?? {}, body: r.body ?? '' };
        setState({ kind: 'ok', original: orig, title: r.title });
        setProposed({
          frontmatter: JSON.parse(JSON.stringify(orig.frontmatter)),
          body: orig.body,
        });
      } else {
        setState({ kind: 'err', error: r.error ?? 'unknown error' });
      }
    });
    return () => { cancelled = true; };
  }, [path, allow.allowed, allow.reason]);

  const validation = useMemo(() => {
    if (!proposed) return { valid: true, errors: [], warnings: [] };
    return validateFrontmatter(proposed.frontmatter);
  }, [proposed]);

  const dirty = state.kind === 'ok' && proposed
    ? isDirty(state.original, proposed)
    : false;

  const canSave = dirty
    && validation.valid
    && summary.trim() !== ''
    && !previewing;

  function fmWarnings() {
    const map = {};
    for (const w of validation.warnings || []) {
      if (w.includes('forward_vector')) map.forward_vector = w;
      else if (w.includes('foundational')) map.stage = w;
    }
    return map;
  }

  async function handlePreview() {
    setPreview(null);
    setPreviewError(null);
    setPreviewing(true);
    const r = await previewEntrySave({
      path,
      frontmatter: proposed.frontmatter,
      body: proposed.body,
      summary,
      verify,
      body_message: bodyMessage,
      author: 'loudon',
    });
    setPreviewing(false);
    if (r.ok) {
      setPreview(r.preview);
    } else {
      setPreviewError(r.error || (r.errors && r.errors.join('; ')) || `HTTP ${r.status}`);
    }
  }

  if (state.kind === 'loading') {
    return <div style={{ color: 'var(--phosphor-dim)' }}>loading {path}...</div>;
  }

  if (state.kind === 'refused') {
    return (
      <RefusedBanner reason={state.reason} path={path} onCancel={onCancel} />
    );
  }

  if (state.kind === 'err') {
    return (
      <div style={{ color: 'var(--error)', textShadow: 'var(--glow)', border: '1px solid var(--error)', padding: 12 }}>
        could not load entry: {state.error}
        <div style={{ marginTop: 8 }}>
          <ActionButton onClick={onCancel}>[B] back</ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="entry-editor" data-path={path}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <ActionButton onClick={onCancel} testId="editor-cancel">
          [B] cancel
        </ActionButton>
        <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 18 }}>
          editing  ·  {state.title || path}
        </span>
        {dirty
          ? <span data-testid="editor-dirty" style={{ color: 'var(--warn)', fontSize: 12 }}>● unsaved</span>
          : <span data-testid="editor-clean" style={{ color: 'var(--phosphor-dim)', fontSize: 12 }}>clean</span>}
      </div>

      <div style={{ color: 'var(--phosphor-dim)', fontSize: 11, marginBottom: 12 }}>
        Stage A · dry run only.  Save shows the structured commit STIGMERGY would make.  Nothing is written.
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px',
        gap: 24, alignItems: 'flex-start',
      }}>
        <div style={{ minWidth: 0 }}>
          {/* Body editor first (visually the writing space). */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em',
              marginBottom: 4,
            }}>body</div>
            <WikilinkTextarea
              testId="editor-body"
              value={proposed?.body || ''}
              onChange={(v) => setProposed((p) => ({ ...p, body: v }))}
              index={index}
              rows={28}
              placeholder="markdown body with [[wikilink]] autocomplete..."
            />
          </div>
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Right rail: frontmatter form. */}
          <FrontmatterForm
            value={proposed?.frontmatter || {}}
            onChange={(next) => setProposed((p) => ({ ...p, frontmatter: next }))}
            index={index}
            warnings={fmWarnings()}
            testId="editor-frontmatter"
          />
        </div>
      </div>

      {/* Save controls + preview at the bottom. */}
      <div style={{
        marginTop: 24,
        padding: 16,
        borderTop: '1px dashed var(--phosphor-dim)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          color: 'var(--phosphor)', textShadow: 'var(--glow)',
          fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em',
        }}>
          commit
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, alignItems: 'start' }}>
          <div>
            <label style={labelStyle()}>summary <span style={{ color: 'var(--warn)' }}>required</span></label>
            <input
              data-testid="editor-summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="observational past tense (what changed and why-it-changed)"
              style={inputStyle()}
            />
          </div>
          <div>
            <label style={labelStyle()}>verify</label>
            <select
              data-testid="editor-verify"
              value={verify}
              onChange={(e) => setVerify(e.target.value)}
              style={inputStyle()}
            >
              <option value="verified">verified</option>
              <option value="unverified">unverified</option>
              <option value="couldnt">couldnt</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle()}>body (optional — the why)</label>
          <textarea
            data-testid="editor-body-message"
            value={bodyMessage}
            onChange={(e) => setBodyMessage(e.target.value)}
            rows={3}
            placeholder="optional commit body for the commit message (not the entry body)"
            style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'var(--font-mono, monospace)' }}
          />
        </div>

        {validation.errors.length > 0 ? (
          <div data-testid="editor-validation-errors" style={{
            color: 'var(--error)', fontSize: 12,
            border: '1px solid var(--error)', padding: 8,
          }}>
            {validation.errors.map((e, i) => <div key={i}>✗ {e}</div>)}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ActionButton
            onClick={handlePreview}
            disabled={!canSave}
            testId="editor-save"
            primary
          >
            {previewing ? 'computing preview...' : 'save · preview commit'}
          </ActionButton>
          {!dirty
            ? <span style={{ color: 'var(--phosphor-dim)', fontSize: 11 }}>(nothing changed)</span>
            : null}
        </div>

        {previewError ? (
          <div data-testid="editor-preview-error" style={{
            color: 'var(--error)', fontSize: 12,
            border: '1px solid var(--error)', padding: 8,
          }}>
            preview failed: {previewError}
          </div>
        ) : null}

        {preview ? <CommitPreviewPanel preview={preview} /> : null}
      </div>
    </div>
  );
}

function RefusedBanner({ reason, path, onCancel }) {
  return (
    <div data-testid="entry-editor-refused" style={{
      color: 'var(--error)', textShadow: 'var(--glow)',
      border: '1px solid var(--error)', padding: 12,
    }}>
      <div style={{ marginBottom: 8 }}>
        STIGMERGY refuses to edit <code style={{ fontFamily: 'monospace' }}>{path}</code>
      </div>
      <div style={{ color: 'var(--phosphor)', fontSize: 13, marginBottom: 8 }}>
        reason: {reason}
      </div>
      <ActionButton onClick={onCancel}>[B] back</ActionButton>
    </div>
  );
}

function ActionButton({ onClick, disabled, children, testId, primary }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: primary && !disabled ? 'var(--phosphor)' : 'transparent',
        color: primary && !disabled ? 'var(--bg, #000)' : 'var(--phosphor)',
        textShadow: primary && !disabled ? 'none' : 'var(--glow)',
        border: '1px solid var(--phosphor)',
        padding: '4px 12px',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        opacity: disabled ? 0.45 : 1,
      }}
    >{children}</button>
  );
}

function labelStyle() {
  return {
    display: 'block',
    color: 'var(--phosphor)', textShadow: 'var(--glow)',
    fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: '.04em',
    marginBottom: 4,
  };
}

function inputStyle() {
  return {
    width: '100%',
    background: 'var(--bg, #000)',
    color: 'var(--phosphor)',
    textShadow: 'var(--glow)',
    border: '1px solid var(--phosphor-dim)',
    padding: '6px 10px',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 13,
    boxSizing: 'border-box',
  };
}
