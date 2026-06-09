import React from 'react';
import { kindColor } from '../../lib/commit-parse.js';
import { formatTs } from '../../lib/format.js';

// One commit as a semantic card: kind badge, scope, summary, author, time,
// a one-glance diffstat, and the structured trailers. Color-coded by kind.
// Big sweeps (> ~10 touched entries) collapse their file list to a summary
// with a drill-down (the full diff opens in CommitDiff on click).

const BIG_SWEEP = 10;

function VerifyTag({ verify }) {
  if (!verify) return null;
  const tone = verify === 'verified' ? 'var(--phosphor)'
    : verify === 'unverified' ? 'var(--warn)'
    : 'var(--error)';
  return (
    <span style={{
      border: `1px solid ${tone}`, color: tone, textShadow: 'var(--glow)',
      fontSize: 10, padding: '0 5px', textTransform: 'uppercase', letterSpacing: '.05em',
    }}>{verify}</span>
  );
}

function Diffstat({ added, deleted, fileCount }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, whiteSpace: 'nowrap' }}>
      <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>{fileCount}f</span>
      {added > 0 ? <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)', marginLeft: 6 }}>+{added}</span> : null}
      {deleted > 0 ? <span style={{ color: 'var(--error)', textShadow: 'var(--glow)', marginLeft: 4 }}>-{deleted}</span> : null}
    </span>
  );
}

export default function CommitCard({ commit, onOpen, onFilterEntry, compact = false }) {
  const c = commit;
  const kc = kindColor(c.kind);
  const inferred = c.kindSource === 'inferred';
  const entriesShown = (c.entries ?? []).slice(0, BIG_SWEEP);
  const overflow = (c.entries ?? []).length - entriesShown.length;

  return (
    <div
      data-testid="commit-card"
      data-kind={c.kind}
      data-hash={c.shortHash}
      style={{
        border: '1px solid var(--phosphor-dim)',
        borderLeft: `3px solid ${kc}`,
        padding: '6px 12px',
        marginBottom: 8,
        background: 'var(--phosphor-deep)',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span
          data-testid="commit-kind"
          style={{
            color: kc, textShadow: 'var(--glow)',
            border: `1px solid ${kc}`, padding: '0 6px',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em',
            opacity: inferred ? 0.7 : 1,
          }}
          title={inferred ? 'kind inferred from touched paths (pre-spec commit)' : `kind from ${c.kindSource}`}
        >
          {c.kind}{c.scope ? <span style={{ opacity: 0.7 }}>({c.scope})</span> : null}{inferred ? '?' : ''}
        </span>
        <span
          data-testid="commit-summary"
          onClick={() => onOpen?.(c.hash)}
          style={{
            color: 'var(--phosphor)', textShadow: 'var(--glow)',
            cursor: onOpen ? 'pointer' : 'default', flex: 1, minWidth: '20ch',
          }}
        >
          {c.summary}
        </span>
        <Diffstat added={c.added} deleted={c.deleted} fileCount={c.fileCount} />
      </div>

      <div style={{
        display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap',
        marginTop: 4, fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none',
      }}>
        <span
          onClick={() => onOpen?.(c.hash)}
          style={{ cursor: onOpen ? 'pointer' : 'default', color: 'var(--ansi-bright-cyan)', textShadow: 'var(--glow)' }}
          title="open this commit's palace-aware diff"
        >
          {c.shortHash}
        </span>
        {c.author === 'trickster' ? (
          <span
            data-testid="commit-author-trickster"
            title="trickster commit — write-anywhere, branded so a later pass can harvest it"
            style={{
              color: 'var(--ansi-bright-magenta)', textShadow: 'var(--glow)',
              border: '1px solid var(--ansi-bright-magenta)', padding: '0 5px',
              letterSpacing: '.05em',
            }}
          >※ {c.author}</span>
        ) : (
          <span>{c.author}</span>
        )}
        <span>{(c.date ?? '').split('T')[0]} {formatTs(c.date)}</span>
        <VerifyTag verify={c.verify} />
        {c.campaign ? (
          <span style={{
            color: 'var(--ansi-bright-yellow)', textShadow: 'var(--glow)',
            border: '1px solid var(--ansi-bright-yellow)', padding: '0 5px', fontSize: 10,
          }}>campaign: {c.campaign}</span>
        ) : null}
        {c.resolves?.length ? (
          <span style={{ color: 'var(--phosphor)', textShadow: 'var(--glow)' }}>
            resolves: {c.resolves.join(', ')}
          </span>
        ) : null}
      </div>

      {!compact && entriesShown.length > 0 ? (
        <div data-testid="commit-entries" style={{
          marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11,
        }}>
          {entriesShown.map((e) => (
            <span
              key={e}
              data-testid="commit-entry-chip"
              onClick={() => onFilterEntry?.(e)}
              style={{
                color: 'var(--phosphor)', textShadow: 'none',
                border: '1px dashed var(--phosphor-dim)', padding: '0 5px',
                cursor: onFilterEntry ? 'pointer' : 'default',
              }}
              title={onFilterEntry ? `filter LOG to ${e}` : e}
            >
              {e}
            </span>
          ))}
          {overflow > 0 ? (
            <span style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
              +{overflow} more
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
