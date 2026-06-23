import React, { useEffect, useMemo, useState } from 'react';
import FrontmatterForm from './FrontmatterForm.jsx';
import WikilinkTextarea from './WikilinkTextarea.jsx';
import CommitPreviewPanel from './CommitPreviewPanel.jsx';
import { fetchEntry, previewEntrySave, tricksterSaveEntry } from '../../adapters/entries.js';
import { postUndo } from '../../adapters/entry-agent.js';
import { checkAllowList, checkPathSafety, isDirty, validateFrontmatter } from '../../lib/entry-edit.js';

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
  const [bodyMessage, setBodyMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  // Trickster Commit: the form's one real write. `committed` holds the landed
  // commit (hash + subject) so the success line + [untrick] can show; `reloadNonce`
  // re-pulls the entry from disk after an untrick (the file changed under us).
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(null); // { shortHash, subject }
  const [commitError, setCommitError] = useState(null);
  const [undoing, setUndoing] = useState(false);
  const [undoNote, setUndoNote] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  // Pre-flight is PATH-SAFETY, not the care allow-list: the editor opens for
  // canon too, because the Trickster Commit button can write it. We still hard-
  // refuse genuinely unsafe paths (repo escape, NUL, non-.md, VCS dirs).
  const safety = useMemo(() => checkPathSafety(path), [path]);
  // Whether the CAREFUL path would allow this (false = canon/machinery): drives
  // the "only a trickster commit can write here" notice.
  const careAllowed = useMemo(() => checkAllowList(path).allowed, [path]);

  useEffect(() => {
    if (!safety.allowed) {
      setState({ kind: 'refused', reason: safety.reason });
      return;
    }
    let cancelled = false;
    setState({ kind: 'loading' });
    setCommitted(null);
    setCommitError(null);
    setUndoNote(null);
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
  }, [path, safety.allowed, safety.reason, reloadNonce]);

  const validation = useMemo(() => {
    if (!proposed) return { valid: true, errors: [], warnings: [] };
    return validateFrontmatter(proposed.frontmatter);
  }, [proposed]);

  const dirty = state.kind === 'ok' && proposed
    ? isDirty(state.original, proposed)
    : false;

  // The trickster commit doesn't require schema-valid frontmatter — it writes
  // anyway, branded unverified — only a dirty buffer + a summary. The preview is
  // likewise tolerant (it auditions the same trickster write).
  const hasSummary = summary.trim() !== '';
  const canPreview = dirty && hasSummary && !previewing;
  const canTrickster = dirty && hasSummary && !committing;

  // Any manual edit clears a prior commit's success line (it's now stale).
  function mutate(fn) {
    setProposed(fn);
    if (committed) setCommitted(null);
    if (undoNote) setUndoNote(null);
  }

  function fmWarnings() {
    const map = {};
    for (const w of validation.warnings || []) {
      if (w.includes('forward_vector')) map.forward_vector = w;
      else if (w.includes('foundational')) map.stage = w;
    }
    return map;
  }

  // Optional: audition the exact commit the trickster button would make (diff +
  // trailers), canon included. Tolerant of schema lapses, like the write itself.
  async function handlePreview() {
    setPreview(null);
    setPreviewError(null);
    setPreviewing(true);
    const r = await previewEntrySave({
      path,
      frontmatter: proposed.frontmatter,
      body: proposed.body,
      summary,
      verify: 'unverified',
      body_message: bodyMessage,
      author: 'trickster',
      trickster: true,
    });
    setPreviewing(false);
    if (r.ok) {
      setPreview(r.preview);
    } else {
      setPreviewError(r.error || (r.errors && r.errors.join('; ')) || `HTTP ${r.status}`);
    }
  }

  // The real write: commit the form's hand-edited entry straight to disk as a
  // trickster (canon included), one gesture, no preview gate. On success we
  // rebaseline the buffer so it reads "clean" and surface the hash + [untrick].
  async function handleTrickster() {
    if (!canTrickster) return;
    setCommitError(null);
    setUndoNote(null);
    setCommitting(true);
    const r = await tricksterSaveEntry({
      path,
      frontmatter: proposed.frontmatter,
      body: proposed.body,
      summary,
      body_message: bodyMessage,
    });
    setCommitting(false);
    if (r.ok) {
      setState((s) => (s.kind === 'ok'
        ? { ...s, original: { frontmatter: JSON.parse(JSON.stringify(proposed.frontmatter)), body: proposed.body } }
        : s));
      setCommitted({ shortHash: r.shortHash, subject: r.subject });
      setPreview(null);
    } else {
      setCommitError(r.error || `HTTP ${r.status}`);
    }
  }

  // Untrick: revert the trickster commit as a new inverse commit (the same
  // honest /undo the Companion uses), then re-pull the now-reverted file.
  async function handleUntrick() {
    if (!committed || undoing) return;
    setUndoing(true);
    const r = await postUndo({ path, commit: committed.shortHash });
    setUndoing(false);
    if (r && r.ok) {
      setUndoNote(`untricked — reverted as ${r.revertHash || 'a new commit'}`);
      setCommitted(null);
      setReloadNonce((n) => n + 1);
    } else {
      setCommitError((r && (r.msg || r.error)) || 'could not untrick that commit');
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

      {!careAllowed ? (
        <div data-testid="editor-canon-notice" style={{
          fontSize: 11, marginBottom: 12, color: 'var(--ansi-bright-magenta)', textShadow: 'var(--glow)',
          border: '1px solid var(--ansi-bright-magenta)', padding: '4px 8px', display: 'inline-block',
        }}>
          ※ canon — the careful save refuses this path; only a trickster commit can write here.
        </div>
      ) : null}

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
              onChange={(v) => mutate((p) => ({ ...p, body: v }))}
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
            onChange={(next) => mutate((p) => ({ ...p, frontmatter: next }))}
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
          color: 'var(--ansi-bright-magenta)', textShadow: 'var(--glow)',
          fontSize: 13, textTransform: 'uppercase', letterSpacing: '.04em',
        }}>
          ※ trickster commit
        </div>

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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <TricksterButton
            onClick={handleTrickster}
            disabled={!canTrickster}
            testId="editor-trickster-commit"
          >
            {committing ? 'committing…' : '⚡ trickster commit'}
          </TricksterButton>
          <ActionButton
            onClick={handlePreview}
            disabled={!canPreview}
            testId="editor-save"
          >
            {previewing ? 'computing preview…' : 'preview diff'}
          </ActionButton>
          {!dirty && !committed
            ? <span style={{ color: 'var(--phosphor-dim)', fontSize: 11 }}>(nothing changed)</span>
            : null}
          {dirty && !hasSummary
            ? <span style={{ color: 'var(--phosphor-dim)', fontSize: 11 }}>(summary required)</span>
            : null}
        </div>

        {committed ? (
          <div data-testid="editor-committed" style={{
            color: 'var(--ansi-bright-magenta)', textShadow: 'var(--glow)',
            border: '1px solid var(--ansi-bright-magenta)', padding: 8,
            display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap',
          }}>
            <span>※ tricked — committed <b>{committed.shortHash}</b></span>
            <span style={{ color: 'var(--phosphor-dim)', fontSize: 12 }}>{committed.subject}</span>
            <span
              data-testid="editor-untrick"
              onClick={undoing ? undefined : handleUntrick}
              title="revert this trickster commit (a new inverse commit)"
              style={{
                cursor: undoing ? 'default' : 'pointer', opacity: undoing ? 0.5 : 1,
                marginLeft: 'auto', borderBottom: '1px dashed currentColor',
              }}
            >{undoing ? 'untricking…' : '[untrick]'}</span>
          </div>
        ) : null}

        {undoNote ? (
          <div data-testid="editor-untricked" style={{ color: 'var(--phosphor)', fontSize: 12 }}>
            {undoNote}
          </div>
        ) : null}

        {commitError ? (
          <div data-testid="editor-commit-error" style={{
            color: 'var(--error)', fontSize: 12, border: '1px solid var(--error)', padding: 8,
          }}>
            trickster commit failed: {commitError}
          </div>
        ) : null}

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

// The form's one real write — branded in the trickster's magenta so it never
// hides what it is. Filled when armed, ghosted when there's nothing to commit.
function TricksterButton({ onClick, disabled, children, testId }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      title="write your manual edits straight to the entry (canon included), branded trickster"
      style={{
        background: disabled ? 'transparent' : 'var(--ansi-bright-magenta)',
        color: disabled ? 'var(--ansi-bright-magenta)' : 'var(--bg, #000)',
        textShadow: disabled ? 'var(--glow)' : 'none',
        border: '1px solid var(--ansi-bright-magenta)',
        padding: '4px 14px',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        opacity: disabled ? 0.5 : 1,
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
