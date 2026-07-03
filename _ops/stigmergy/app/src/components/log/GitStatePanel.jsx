import React, { useEffect, useState } from 'react';
import { fetchGitState } from '../../adapters/log.js';
import {
  classifyWorktree, accentFor, stateStyle, formatDivergence, STATE_STYLE,
} from '../../lib/git-state-view.js';
import CommitDag from './CommitDag.jsx';

// The GIT STATE section of the LOG deck -- the worktree topology made visible.
// Three tiers, densest-first:
//   1. RAIL     -- one line: where HEAD is, which branch the next commit lands on
//   2. WORKTREES-- a lane per checkout, colored by state
//   3. TOPOLOGY -- an ASCII lane graph of branch divergence from the base
// Read-only by construction: this never prunes, removes, or mutates a worktree
// (the cross-agent-kill lesson). It only reads /api/git-state.

const dimText = { color: 'var(--phosphor-dim)', textShadow: 'none' };

function Divergence({ ab, upstream }) {
  const base = formatDivergence(ab);
  const up = formatDivergence(upstream);
  if (!base && !up) return <span style={{ ...dimText, fontSize: 11 }}>even</span>;
  return (
    <span style={{ fontSize: 11 }}>
      {ab && ab.ahead > 0 ? <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'none' }}>↑{ab.ahead} </span> : null}
      {ab && ab.behind > 0 ? <span style={{ color: 'var(--error)', textShadow: 'none' }}>↓{ab.behind} </span> : null}
      {up ? <span style={{ ...dimText }} title="vs upstream">({up} up)</span> : null}
    </span>
  );
}

// ---- 1. the you-are-here rail --------------------------------------------
export function Rail({ host, count }) {
  if (!host) return null;
  const branchLabel = host.detached ? `detached @ ${host.shortHead}` : host.branch;
  return (
    <div data-testid="git-rail" style={{
      display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center',
      border: '1px solid var(--phosphor-dim)', padding: '5px 12px', fontSize: 13, marginBottom: 10,
    }}>
      <span><span style={dimText}>worktree </span><span style={{ color: 'var(--phosphor-bright)', textShadow: 'var(--glow)' }}>{host.name}</span></span>
      <span style={dimText}>·</span>
      <span><span style={dimText}>branch </span><span style={{ color: 'var(--phosphor)' }}>{branchLabel}</span></span>
      <span style={dimText}>·</span>
      <span><span style={dimText}>HEAD </span><span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'none' }}>{host.shortHead}</span></span>
      <span style={dimText}>·</span>
      <span><span style={dimText}>vs base </span><Divergence ab={host.aheadBehind} upstream={host.upstream} /></span>
      <span style={dimText}>·</span>
      {count > 0
        ? <span style={{ color: 'var(--warn)' }}>✎ {count} uncommitted</span>
        : <span style={dimText}>✎ clean</span>}
      <span style={{ color: 'var(--bg)', background: 'var(--phosphor-bright)', padding: '0 5px', fontSize: 10, letterSpacing: '.08em', textShadow: 'none', marginLeft: 'auto' }}>YOU ARE HERE</span>
    </div>
  );
}

// ---- 2. the worktree roster ----------------------------------------------
export function WorktreeRow({ wt }) {
  const state = classifyWorktree(wt);
  const accent = accentFor(wt);
  const style = wt.isHost ? STATE_STYLE.host : stateStyle(state);
  return (
    <div data-testid="worktree-row" data-state={wt.isHost ? 'host' : state} style={{
      display: 'grid',
      gridTemplateColumns: '16px minmax(14ch, 24ch) minmax(16ch, 30ch) 8ch 10ch 1fr',
      gap: '0 14px', alignItems: 'baseline',
      borderLeft: `3px solid ${accent}`, padding: '5px 10px',
      background: 'var(--phosphor-deep)', marginBottom: 5,
    }}>
      <span style={{ color: accent }}>{style.glyph}</span>
      <span style={{ color: 'var(--phosphor)' }}>
        {wt.name}
        {wt.isHost ? <span style={{ color: 'var(--bg)', background: 'var(--phosphor-bright)', padding: '0 4px', fontSize: 10, textShadow: 'none', marginLeft: 6 }}>HOST</span> : null}
      </span>
      <span style={dimText}>{wt.detached ? `detached @ ${wt.shortHead}` : wt.branch}</span>
      <span style={{ color: 'var(--ansi-bright-cyan)', textShadow: 'none', fontSize: 12 }}>{wt.shortHead}</span>
      <span><Divergence ab={wt.aheadBehind} upstream={null} /></span>
      <span style={{ fontSize: 11 }}>
        {wt.prunable
          ? <span style={{ color: 'var(--phosphor-dim)', border: '1px solid currentColor', padding: '0 5px', textShadow: 'none' }}>PRUNABLE</span>
          : typeof wt.dirty === 'number' && wt.dirty > 0
            ? <span style={{ color: 'var(--warn)' }}>✎{wt.dirty}</span>
            : <span style={dimText}>clean</span>}
        {wt.last ? <span style={{ ...dimText, marginLeft: 10 }}>{wt.last.subject} <span style={{ opacity: 0.7 }}>· {wt.last.relative}</span></span> : null}
      </span>
    </div>
  );
}

const LEGEND = ['host', 'clean', 'dirty', 'behind', 'detached', 'prunable'];

export default function GitStatePanel({ nonce = 0, uncommittedCount = 0 }) {
  const [state, setState] = useState({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState((s) => (s.kind === 'ok' ? s : { kind: 'loading' }));
    fetchGitState().then((r) => {
      if (cancelled) return;
      if (r.ok) setState({ kind: 'ok', ...r });
      else setState({ kind: 'err', error: r.error });
    });
    return () => { cancelled = true; };
  }, [nonce]);

  const worktrees = state.kind === 'ok' ? (state.worktrees ?? []) : [];
  const host = state.kind === 'ok' ? state.host : null;
  const hostCount = host && typeof host.dirty === 'number' ? host.dirty : uncommittedCount;

  return (
    <div data-testid="git-state-panel" style={{ marginBottom: 12 }}>
      <div style={{ ...dimText, fontSize: 11, letterSpacing: '.2em', borderBottom: '1px solid var(--phosphor-dim)', paddingBottom: 4, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span><span style={{ color: 'var(--phosphor)' }}>◈ GIT STATE</span>{state.kind === 'ok' ? ` · ${worktrees.length} worktree${worktrees.length === 1 ? '' : 's'}` : ''}</span>
        <span style={{ opacity: 0.7 }}>read-only · never prunes</span>
      </div>

      {state.kind === 'err' ? (
        <div data-testid="git-state-error" style={{ color: 'var(--error)', textShadow: 'var(--glow)', border: '1px solid var(--error)', padding: 8, fontSize: 12 }}>
          could not read worktree state: {state.error}
        </div>
      ) : state.kind === 'loading' ? (
        <div data-testid="git-state-loading" style={{ ...dimText }}>reading worktree topology…</div>
      ) : (
        <>
          <Rail host={host} count={hostCount} />

          <div style={{ ...dimText, fontSize: 10, letterSpacing: '.16em', marginBottom: 4 }}>▚ WORKTREES</div>
          <div data-testid="worktree-roster">
            {worktrees.map((wt) => <WorktreeRow key={wt.path} wt={wt} />)}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 11, ...dimText, margin: '8px 0' }}>
            {LEGEND.map((s) => (
              <span key={s}><span style={{ display: 'inline-block', width: 9, height: 9, background: stateStyle(s).accent, marginRight: 5, verticalAlign: 'middle' }} />{s}</span>
            ))}
          </div>

          <div style={{ ...dimText, fontSize: 10, letterSpacing: '.16em', margin: '10px 0 2px' }}>⑃ TOPOLOGY · commit graph since merge-base with {state.base ?? 'main'}</div>
          <CommitDag nonce={nonce} hostBranch={host?.branch} trunk={state.base} />
        </>
      )}
    </div>
  );
}
