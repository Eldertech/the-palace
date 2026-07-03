import React, { useEffect, useMemo, useState } from 'react';
import { fetchCommitGraph } from '../../adapters/log.js';
import { buildCommitDag } from '../../lib/commit-dag.js';

// The TOPOLOGY graph -- a true commit DAG (real parents, merges, convergence),
// laid out as phosphor railroad lanes by src/lib/commit-dag.js. Read-only.
// Each commit row pairs its graph glyphs with a side label: short sha, branch
// chips, subject, age. Link rows carry only the lane connectors.

const dim = { color: 'var(--phosphor-dim)', textShadow: 'none' };

// One monospace glyph strip, padded to a fixed column count so the side labels
// line up across rows regardless of how many lanes a given row uses.
function GraphStrip({ cells, cols }) {
  const padded = cells.slice(0, cols);
  while (padded.length < cols) padded.push({ ch: ' ', color: null });
  return (
    <span style={{ whiteSpace: 'pre', flex: '0 0 auto' }}>
      {padded.map((c, i) => (
        <span key={i} style={c.color ? { color: c.color, textShadow: 'var(--glow)' } : dim}>{c.ch}</span>
      ))}
    </span>
  );
}

function RefChip({ name, isHost }) {
  return (
    <span style={{
      fontSize: 10, padding: '0 4px', marginRight: 4, textShadow: 'none',
      color: 'var(--bg)', background: isHost ? 'var(--phosphor-bright)' : 'var(--ansi-bright-cyan)',
    }}>{name}</span>
  );
}

export function DagBody({ graph, hostBranch }) {
  const { rows, width } = useMemo(() => buildCommitDag(graph.commits ?? []), [graph]);
  const cols = Math.max(2, width) * 2 + 1;
  if (rows.length === 0) return <div style={{ ...dim, fontStyle: 'italic' }}>no commits above the merge-base.</div>;

  return (
    <div data-testid="commit-dag" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.4 }}>
      {rows.map((row, i) => {
        if (row.type === 'link') {
          return <div key={i} style={{ display: 'flex' }}><GraphStrip cells={row.cells} cols={cols} /></div>;
        }
        const c = row.commit;
        const isConvergence = graph.convergence && c.sha === graph.convergence;
        return (
          <div key={i} data-testid="dag-commit" style={{ display: 'flex', alignItems: 'baseline' }}>
            <GraphStrip cells={row.cells} cols={cols} />
            <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'none', marginRight: 8 }}>{c.shortSha}</span>
            {c.refs.map((r) => <RefChip key={r} name={r} isHost={r === hostBranch} />)}
            <span style={{ color: c.isRoot ? 'var(--phosphor-dim)' : 'var(--phosphor)' }}>
              {c.subject.length > 60 ? c.subject.slice(0, 59) + '…' : c.subject}
            </span>
            {isConvergence && !c.isRoot ? <span style={{ ...dim, marginLeft: 8 }}>· worktrees rejoin here</span> : null}
            {c.isRoot ? <span style={{ ...dim, marginLeft: 8 }}>{graph.moreBelow ? '· trunk continues ↓' : '· root'}</span> : null}
          </div>
        );
      })}
      {graph.truncated ? <div style={{ ...dim, marginTop: 4 }}>… window cap reached; ask for less depth to see the tips.</div> : null}
    </div>
  );
}

const DEPTH_STEP = 40;

export default function CommitDag({ nonce = 0, hostBranch = null, trunk = 'main' }) {
  const [state, setState] = useState({ kind: 'loading' });
  const [depth, setDepth] = useState(0);

  // Reload (nonce) resets to the shallow view; the depth control re-fetches in
  // place. Loading keeps the last graph visible so the view doesn't flash.
  useEffect(() => { setDepth(0); }, [nonce]);
  useEffect(() => {
    let cancelled = false;
    setState((s) => (s.kind === 'ok' ? { ...s, busy: true } : { kind: 'loading' }));
    fetchCommitGraph({ depth }).then((r) => {
      if (cancelled) return;
      if (r.ok) setState({ kind: 'ok', graph: r });
      else setState({ kind: 'err', error: r.error });
    });
    return () => { cancelled = true; };
  }, [nonce, depth]);

  const graph = state.kind === 'ok' ? state.graph : null;
  const commitCount = graph ? (graph.commits ?? []).filter((c) => !c.isRoot).length : 0;

  return (
    <div style={{ border: '1px solid var(--phosphor-dim)', padding: '10px 12px', overflowX: 'auto', background: '#040804' }}>
      {state.kind === 'err' ? (
        <div style={{ color: 'var(--error)', textShadow: 'var(--glow)', fontSize: 12 }}>could not read commit graph: {state.error}</div>
      ) : state.kind === 'loading' ? (
        <div style={{ ...dim }}>reading commit graph…</div>
      ) : (
        <>
          <DagBody graph={graph} hostBranch={hostBranch} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginTop: 8, borderTop: '1px dashed var(--phosphor-dim)', paddingTop: 6, fontSize: 11, ...dim }}>
            <span>{commitCount} commits{depth > 0 ? ` · +${depth} deep` : ''}{state.busy ? ' · loading…' : ''}</span>
            {graph.moreBelow ? (
              <span data-testid="dag-deeper" role="button" onClick={() => setDepth((d) => d + DEPTH_STEP)}
                style={{ cursor: 'pointer', color: 'var(--phosphor)', textShadow: 'var(--glow)', border: '1px solid var(--phosphor-dim)', padding: '0 6px' }}>
                ▼ older
              </span>
            ) : <span style={{ opacity: 0.6 }}>▼ root reached</span>}
            {depth > 0 ? (
              <span role="button" onClick={() => setDepth((d) => Math.max(0, d - DEPTH_STEP))}
                style={{ cursor: 'pointer', color: 'var(--phosphor)', textShadow: 'var(--glow)', border: '1px solid var(--phosphor-dim)', padding: '0 6px' }}>
                ▲ less
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
