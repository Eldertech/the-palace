// Pure view-model for the LOG deck's GIT STATE section. Turns the raw
// /api/git-state worktrees into render-ready classification, colors, glyphs,
// and the ASCII lane-graph layout. Kept pure so the visual grammar is
// unit-testable without a DOM.

// One state per worktree, in precedence order (worst-wins), EXCEPT host which
// is orthogonal and handled by the caller (a host can also be dirty).
//   prunable  — the checkout dir is gone; `git worktree prune` would clear it
//   detached  — HEAD is a bare sha, not on a branch
//   dirty     — uncommitted changes present
//   behind    — strictly behind the base branch, tree clean
//   clean     — on a branch, tree clean, not behind
export function classifyWorktree(wt) {
  if (!wt) return 'clean';
  if (wt.prunable) return 'prunable';
  if (wt.detached) return 'detached';
  if (typeof wt.dirty === 'number' && wt.dirty > 0) return 'dirty';
  if (wt.aheadBehind && wt.aheadBehind.behind > 0) return 'behind';
  return 'clean';
}

// State → { accent (CSS var), glyph, label }. `host` overrides accent so
// "you are here" always pops, whatever the underlying state.
export const STATE_STYLE = {
  host:     { accent: 'var(--phosphor-bright)',    glyph: '●', label: 'host' },
  clean:    { accent: 'var(--phosphor)',           glyph: '●', label: 'clean' },
  dirty:    { accent: 'var(--warn)',               glyph: '◐', label: 'dirty' },
  behind:   { accent: 'var(--error)',              glyph: '●', label: 'behind' },
  detached: { accent: 'var(--ansi-bright-magenta)', glyph: '◆', label: 'detached' },
  prunable: { accent: 'var(--phosphor-dim)',       glyph: '⊘', label: 'prunable' },
};

export function stateStyle(state) {
  return STATE_STYLE[state] ?? STATE_STYLE.clean;
}

// The accent a worktree row/lane paints with: host wins for the "here" pop,
// otherwise the state color.
export function accentFor(wt) {
  return wt?.isHost ? STATE_STYLE.host.accent : stateStyle(classifyWorktree(wt)).accent;
}

// "↑3 ↓2" style compact divergence, or null when there's nothing to show.
// `zero` renders "even" when both are 0 (used for the rail); the roster passes
// zero=false so a clean lane stays quiet.
export function formatDivergence(ab, { zero = false } = {}) {
  if (!ab) return null;
  const { ahead = 0, behind = 0 } = ab;
  if (ahead === 0 && behind === 0) return zero ? 'even' : null;
  const parts = [];
  if (ahead > 0) parts.push(`↑${ahead}`);
  if (behind > 0) parts.push(`↓${behind}`);
  return parts.join(' ');
}

// Build the ASCII lane graph rows from a git-state payload. The base branch is
// the trunk; every other branch forks from it and carries `ahead` nodes. Node
// counts are the REAL ahead/behind numbers (capped for width), so the picture
// never lies about divergence even though it isn't a full commit DAG. Returns
// [{ branch, name, isHost, state, accent, forkCol, nodes, behind, ahead,
// shortHead, detached, prunable }], base lane first.
export function buildLanes(state, { maxNodes = 8 } = {}) {
  if (!state || !Array.isArray(state.worktrees)) return [];
  const base = state.base ?? 'main';
  const rows = [];

  for (const wt of state.worktrees) {
    const isBase = wt.branch === base;
    const cls = classifyWorktree(wt);
    const ahead = wt.aheadBehind?.ahead ?? 0;
    const behind = wt.aheadBehind?.behind ?? 0;
    rows.push({
      branch: wt.branch ?? (wt.detached ? `detached @ ${wt.shortHead}` : '(bare)'),
      name: wt.name,
      isHost: !!wt.isHost,
      isBase,
      state: cls,
      accent: accentFor(wt),
      // Base is the trunk (fork at col 0); forks step in one column each so
      // lanes read as a cascade rather than overlapping.
      forkCol: isBase ? 0 : 1,
      nodes: isBase ? maxNodes : Math.max(1, Math.min(maxNodes - 1, ahead || 1)),
      behind, ahead,
      shortHead: wt.shortHead,
      detached: !!wt.detached,
      prunable: !!wt.prunable,
    });
  }

  // Base trunk first, then forks ordered most-ahead first (busiest lanes top).
  rows.sort((a, b) => {
    if (a.isBase !== b.isBase) return a.isBase ? -1 : 1;
    return b.ahead - a.ahead;
  });
  return rows;
}
