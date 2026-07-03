// A true commit-DAG layout engine — turns a list of commits (each with its
// parent shas) into a "railroad" graph of lane columns, the way `git log
// --graph` does, but as structured cells the phosphor renderer can paint.
//
// The algorithm is the standard lane-tracking walk. Processing commits newest
// -> oldest (git --topo-order guarantees a child appears before its parents):
//
//   lanes[] holds, per column, the sha that column is currently "reaching down
//   toward" (its next expected commit), or null for an empty column.
//
//   For each commit c:
//     1. its column = the lane already expecting c.sha; if none (a branch tip),
//        claim the first empty column.
//     2. emit a COMMIT row: ● at c's column, │ in every other active lane.
//     3. rewire lanes to c's parents: the first parent inherits c's column
//        (the trunk flows straight down); extra parents (a merge) fan out to
//        their own columns; a parent already expected elsewhere means this lane
//        CONVERGES into that one.
//     4. emit a LINK row drawing the verticals + the fork/merge diagonals from
//        c's column to each parent column.
//
// A commit flagged `isRoot` (the merge-base anchor) stops here: its parents are
// left undrawn because the trunk continues below the window.
//
// Pure and deterministic — unit-tested on a hand-built merge DAG.

const GLYPH = { node: '●', root: '◎', vert: '│' };

// Assign a stable color to each lane. Palette cycles through the phosphor/ANSI
// vars already in tokens.css; the trunk (first lane) is always phosphor green.
const LANE_COLORS = [
  'var(--phosphor)',
  'var(--ansi-bright-cyan)',
  'var(--ansi-bright-magenta)',
  'var(--warn)',
  'var(--phosphor-bright)',
  'var(--ansi-bright-blue)',
];
export function laneColor(col) {
  return LANE_COLORS[col % LANE_COLORS.length];
}

function firstEmpty(lanes) {
  const i = lanes.findIndex((l) => l === null);
  return i === -1 ? lanes.length : i;
}

// Build the DAG layout. `commits` newest-first, each { sha, shortSha, parents,
// refs, subject, date, isRoot? }. Returns { rows, width } where each row is:
//   { type:'commit', col, cells:[{ch,color}], commit }   OR
//   { type:'link', cells:[{ch,color}] }
// `cells` are laid out at 2 chars per lane (glyph + gap) so diagonals have room.
export function buildCommitDag(commits) {
  const rows = [];
  const known = new Set(commits.map((c) => c.sha));
  const lanes = []; // sha | null, indexed by column
  let width = 1;

  const cellW = (n) => n * 2; // 2 columns of text per lane

  for (const c of commits) {
    // 1. find/claim this commit's column.
    let col = lanes.findIndex((l) => l === c.sha);
    if (col === -1) { col = firstEmpty(lanes); lanes[col] = c.sha; }

    const activeBefore = lanes.map((l, i) => ({ i, sha: l })).filter((l) => l.sha);
    width = Math.max(width, lanes.length);

    // 2. COMMIT row.
    const nodeCells = new Array(cellW(lanes.length)).fill(null).map(() => ({ ch: ' ', color: null }));
    for (const { i } of activeBefore) {
      nodeCells[cellW(i)] = { ch: i === col ? (c.isRoot ? GLYPH.root : GLYPH.node) : GLYPH.vert, color: laneColor(i) };
    }
    nodeCells[cellW(col)] = { ch: c.isRoot ? GLYPH.root : GLYPH.node, color: laneColor(col) };
    rows.push({ type: 'commit', col, cells: nodeCells, commit: c });

    // 3. rewire lanes to parents. Root: stop (trunk continues below). Parents
    // outside the window (below the merge-base) are dropped so we never draw a
    // lane reaching a commit that never emits.
    const parents = c.isRoot ? [] : c.parents.filter((p) => known.has(p));
    // Free this commit's lane; we re-fill from parents below.
    lanes[col] = null;
    const parentCols = []; // [{ sha, col, from }] for the link row

    parents.forEach((p, idx) => {
      let pcol = lanes.findIndex((l) => l === p);
      if (pcol === -1) {
        // First parent prefers to inherit this commit's freed column (straight
        // trunk); extra parents take a fresh column (fan out to the right).
        pcol = idx === 0 && lanes[col] === null ? col : firstEmpty(lanes);
        lanes[pcol] = p;
      }
      parentCols.push({ sha: p, col: pcol, from: col });
    });
    // Drop trailing empty lanes to keep the graph from drifting right forever.
    while (lanes.length && lanes[lanes.length - 1] === null) lanes.pop();
    width = Math.max(width, lanes.length, ...parentCols.map((p) => p.col + 1));

    // 4. LINK row — box-drawing connectors between the commit column and its
    // parent columns, git-graph style:
    //   straight first parent   → │
    //   merge to a new lane right → ├──╮
    //   join into a lane on the left → │ (receiver) … ╯ (this lane ends)
    const laneCount = Math.max(lanes.length, ...parentCols.map((p) => p.col + 1), col + 1);
    const link = new Array(cellW(laneCount)).fill(null).map(() => ({ ch: ' ', color: null }));
    // ongoing verticals first; connectors overwrite them where they cross.
    lanes.forEach((l, i) => { if (l) link[cellW(i)] = { ch: GLYPH.vert, color: laneColor(i) }; });
    for (const p of parentCols) {
      if (p.col === col) {
        link[cellW(col)] = { ch: GLYPH.vert, color: laneColor(col) };
      } else if (p.col > col) {
        link[cellW(col)] = { ch: '├', color: laneColor(col) };
        for (let x = cellW(col) + 1; x < cellW(p.col); x += 1) link[x] = { ch: '─', color: laneColor(p.col) };
        link[cellW(p.col)] = { ch: '╮', color: laneColor(p.col) };
      } else {
        link[cellW(p.col)] = { ch: GLYPH.vert, color: laneColor(p.col) };
        for (let x = cellW(p.col) + 1; x < cellW(col); x += 1) link[x] = { ch: '─', color: laneColor(col) };
        link[cellW(col)] = { ch: '╯', color: laneColor(col) };
      }
    }
    if (parents.length > 0) rows.push({ type: 'link', cells: link });
  }

  return { rows, width };
}
