import React, { useEffect, useState } from 'react';
import { Box } from '../primitives.jsx';
import ArtifactSlot from '../ArtifactSlot.jsx';
import { kindColor } from '../../lib/commit-parse.js';
import { changeLabel } from '../../lib/frontmatter-diff.js';
import { formatTs } from '../../lib/format.js';
import { fetchCommit } from '../../adapters/log.js';

// The palace-aware diff for a single commit -- the audition surface
// ([[Closing Well]]'s "review the diff" made native). NOT a raw text diff:
//   - frontmatter changes render as field-level changes (stage: a→b, +N links)
//   - body changes render as a "body changed" flag (full prose diff deferred)
//   - media additions render inline via the existing rich-content engine

function FieldChange({ change }) {
  const tone = change.kind === 'added' ? 'var(--phosphor)'
    : change.kind === 'removed' ? 'var(--error)'
    : 'var(--ansi-bright-yellow)';
  return (
    <div data-testid="fm-change" style={{
      fontFamily: 'var(--font-mono)', fontSize: 12, padding: '1px 0',
      color: 'var(--phosphor)', textShadow: 'var(--glow)',
    }}>
      <span style={{ color: tone, marginRight: 6 }}>
        {change.kind === 'added' ? '+' : change.kind === 'removed' ? '-' : '~'}
      </span>
      {change.field === 'forward_vector' && change.kind === 'changed' ? (
        <ForwardVectorChange change={change} />
      ) : (
        <span>{changeLabel(change)}</span>
      )}
    </div>
  );
}

// forward_vector changes get the before/after both shown (it's the conatus --
// the most meaningful thing a steward or weave can move).
function ForwardVectorChange({ change }) {
  return (
    <span>
      <span style={{ color: 'var(--phosphor-white)' }}>forward_vector changed</span>
      <div style={{ marginLeft: 16, marginTop: 2 }}>
        <div style={{ color: 'var(--error)', textShadow: 'none', fontSize: 11 }}>
          - {String(change.before ?? '').slice(0, 160)}
        </div>
        <div style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', fontSize: 11 }}>
          + {String(change.after ?? '').slice(0, 160)}
        </div>
      </div>
    </span>
  );
}

function FileDiff({ fd }) {
  if (fd.kind === 'md') {
    const hasFm = fd.frontmatterChanges && fd.frontmatterChanges.length > 0;
    return (
      <div data-testid="file-diff" data-kind="md" style={{
        border: '1px solid var(--phosphor-dim)', padding: '6px 10px', marginBottom: 8,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>{fd.path}</span>
          {fd.wasAdded ? <span style={{ color: 'var(--phosphor-bright)', fontSize: 10, border: '1px solid var(--phosphor)', padding: '0 4px' }}>ADDED</span> : null}
          {fd.wasRemoved ? <span style={{ color: 'var(--error)', fontSize: 10, border: '1px solid var(--error)', padding: '0 4px' }}>REMOVED</span> : null}
          <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
            +{fd.added} -{fd.deleted}
          </span>
        </div>
        {hasFm ? (
          <div data-testid="fm-changes" style={{ marginTop: 4 }}>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              frontmatter
            </div>
            {fd.frontmatterChanges.map((c, i) => <FieldChange key={i} change={c} />)}
          </div>
        ) : null}
        {fd.bodyChanged ? (
          <div data-testid="body-changed" style={{ marginTop: 4, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
            body changed (prose diff in obsidian / git)
          </div>
        ) : null}
        {!hasFm && !fd.bodyChanged ? (
          <div style={{ marginTop: 4, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
            no field-level frontmatter or body change detected
          </div>
        ) : null}
      </div>
    );
  }
  if (fd.kind === 'media') {
    // Enrichment additions render as the *rendered* enrichment (the spec's
    // "enrichment additions as the rendered enrichment").
    return (
      <div data-testid="file-diff" data-kind="media" style={{
        border: '1px solid var(--phosphor-dim)', padding: '6px 10px', marginBottom: 8,
      }}>
        <div style={{ color: 'var(--ansi-bright-magenta)', textShadow: 'var(--glow)', marginBottom: 4 }}>
          {fd.path} <span style={{ color: 'var(--phosphor-dim)', fontSize: 10 }}>(media)</span>
        </div>
        <ArtifactSlot payload={{ artifacts: [{ path: fd.path, caption: null }] }} />
      </div>
    );
  }
  return (
    <div data-testid="file-diff" data-kind="file" style={{
      display: 'flex', gap: 10, padding: '2px 10px',
      borderBottom: '1px dashed var(--phosphor-dim)',
    }}>
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>{fd.path}</span>
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
        +{fd.added} -{fd.deleted}{fd.binary ? ' (binary)' : ''}
      </span>
    </div>
  );
}

export default function CommitDiff({ sha, onBack, onGoBack, onFilterEntry }) {
  const [state, setState] = useState({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchCommit(sha).then((r) => {
      if (cancelled) return;
      if (r.ok) setState({ kind: 'ok', commit: r });
      else setState({ kind: 'err', error: r.error });
    });
    return () => { cancelled = true; };
  }, [sha]);

  if (state.kind === 'loading') {
    return <div data-testid="commit-loading" style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>loading commit {sha?.slice(0, 7)}...</div>;
  }
  if (state.kind === 'err') {
    return (
      <div data-testid="commit-error" style={{ color: 'var(--error)', textShadow: 'var(--glow)', border: '1px solid var(--error)', padding: 12 }}>
        could not read commit: {state.error}
        {onBack ? <div style={{ marginTop: 8 }}><span onClick={onBack} style={{ cursor: 'pointer', color: 'var(--phosphor)' }}>[B] back to log</span></div> : null}
      </div>
    );
  }

  const c = state.commit;
  const kc = kindColor(c.kind);

  return (
    <div data-testid="commit-diff" data-hash={c.shortHash}>
      <div style={{ marginBottom: 8 }}>
        {onGoBack ? (
          <span
            data-testid="commit-go-back"
            onClick={onGoBack}
            title="back one step (browser history)"
            style={{
              cursor: 'pointer',
              marginRight: 6,
              color: 'var(--phosphor)', textShadow: 'var(--glow)',
              border: '1px solid var(--phosphor-dim)', padding: '2px 8px',
              textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 12,
            }}
          >
            [<b style={{ color: 'var(--phosphor-white)' }}>&lt;</b>]&nbsp;back
          </span>
        ) : null}
        {onBack ? (
          <span data-testid="back-to-log" onClick={onBack} style={{
            cursor: 'pointer', color: 'var(--phosphor)', textShadow: 'var(--glow)',
            border: '1px solid var(--phosphor-dim)', padding: '2px 8px',
            textTransform: 'uppercase', letterSpacing: '.04em', fontSize: 12,
          }}>
            [<b style={{ color: 'var(--phosphor-white)' }}>B</b>]&nbsp;log
          </span>
        ) : null}
        <span style={{ marginLeft: 12, color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11 }}>
          {c.hash}
        </span>
      </div>

      <Box title={`COMMIT  ${c.shortHash}`} tone="double">
        <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ color: kc, textShadow: 'var(--glow)', border: `1px solid ${kc}`, padding: '0 6px', fontSize: 11, textTransform: 'uppercase' }}>
            {c.kind}{c.scope ? `(${c.scope})` : ''}
          </span>
          <span style={{ color: 'var(--phosphor-white)', textShadow: 'var(--glow)', fontSize: 16 }}>{c.summary}</span>
        </div>
        <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none', fontSize: 11, marginBottom: 6 }}>
          {c.author} · {(c.date ?? '').split('T')[0]} {formatTs(c.date)} · {c.fileCount} files · +{c.added} -{c.deleted}
          {c.verify ? ` · verify: ${c.verify}` : ''}
        </div>
        {c.body && c.body.trim() ? (
          <pre style={{
            whiteSpace: 'pre-wrap', color: 'var(--phosphor)', textShadow: 'var(--glow)',
            fontSize: 12, maxWidth: '78ch', margin: '0 0 6px', borderLeft: '1px solid var(--phosphor-dim)', paddingLeft: 10,
          }}>{c.body.trim()}</pre>
        ) : null}
        {c.entries?.length ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            {c.entries.map((e) => (
              <span key={e} onClick={() => onFilterEntry?.(e)} style={{
                color: 'var(--phosphor)', textShadow: 'none', fontSize: 11,
                border: '1px dashed var(--phosphor-dim)', padding: '0 5px',
                cursor: onFilterEntry ? 'pointer' : 'default',
              }}>{e}</span>
            ))}
          </div>
        ) : null}
      </Box>

      <div data-testid="commit-filediffs" style={{ marginTop: 12 }}>
        {c.fileDiffs.map((fd, i) => <FileDiff key={`${fd.path}-${i}`} fd={fd} />)}
      </div>
    </div>
  );
}
