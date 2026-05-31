import React from 'react';

// Renders the dry-run commit preview: subject + derived Palace-* trailers +
// unified diff. This IS the audition surface for STATE edits -- what you'd
// see in LOG after the commit landed. Reviewing here is reviewing the diff.
//
// Props:
//   preview -- { subject, trailers[], message, udiff, frontmatterChanges,
//               bodyChanged, wasAdded, warnings? }
//   testId  -- root data-testid

export default function CommitPreviewPanel({ preview, testId = 'commit-preview' }) {
  if (!preview) return null;
  return (
    <div data-testid={testId} style={{
      border: '1px solid var(--phosphor)',
      padding: 12,
      background: 'var(--bg, #000)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ color: 'var(--phosphor-dim)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        dry run preview · this commit would be made if stigmergy were armed
      </div>

      <div data-testid={`${testId}-subject`} style={{
        color: 'var(--phosphor-white, var(--phosphor))', textShadow: 'var(--glow)',
        fontFamily: 'var(--font-mono, monospace)', fontSize: 14,
        borderLeft: '3px solid var(--phosphor)', paddingLeft: 8,
      }}>
        {preview.subject}
      </div>

      {preview.trailers && preview.trailers.length > 0 ? (
        <div data-testid={`${testId}-trailers`} style={{
          fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
          color: 'var(--phosphor)', textShadow: 'var(--glow)',
        }}>
          {preview.trailers.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      ) : null}

      {preview.warnings && preview.warnings.length > 0 ? (
        <div data-testid={`${testId}-warnings`} style={{
          color: 'var(--warn)', fontSize: 12, borderLeft: '3px solid var(--warn)', paddingLeft: 8,
        }}>
          {preview.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      ) : null}

      {preview.udiff ? (
        <div>
          <div style={{ color: 'var(--phosphor-dim)', fontSize: 11, marginBottom: 4 }}>
            diff
          </div>
          <pre data-testid={`${testId}-diff`} style={{
            margin: 0,
            padding: 8,
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--phosphor-dim)',
            color: 'var(--phosphor)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            lineHeight: 1.4,
            maxHeight: 360,
            overflow: 'auto',
            whiteSpace: 'pre',
          }}>
            {colorize(preview.udiff)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

// Tiny prose colorizer: green for + lines, red for - lines, dim for @@ and
// header lines. Keeps the diff legible in a BBS phosphor frame.
function colorize(udiff) {
  const lines = udiff.split('\n');
  return lines.map((line, i) => {
    let color = 'var(--phosphor)';
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ')) {
      color = 'var(--phosphor-dim)';
    } else if (line.startsWith('@@')) {
      color = 'var(--warn)';
    } else if (line.startsWith('+')) {
      color = 'var(--ok, #4ade80)';
    } else if (line.startsWith('-')) {
      color = 'var(--error, #f87171)';
    }
    return <span key={i} style={{ color, textShadow: 'none', display: 'block' }}>{line || ' '}</span>;
  });
}
