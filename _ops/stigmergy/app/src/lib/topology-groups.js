// Topology groups — natural neighborhoods for the force layout, along a
// pickable dimension. Without a grouping force the typed-link graph is one
// undifferentiated cloud; the eye can't find "the Shop" or "the projects."
// A gentle per-group centroid pull (forceX/forceY in TopologyLens) makes like
// things huddle without overriding the typed-link tissue that reaches across
// neighborhoods — huddle, don't wall off.
//
// The *dimension* decides what "like" means: which folder a node lives in, its
// entry type, its lifecycle stage, its pillar, or its degree-role. Each
// dimension names a small set of groups; the layout fans them around a ring
// (with a chosen connective set anchored at the center) and a categorical
// palette tints them so the clusters read at a glance.

// --- dimension: folder -------------------------------------------------------
// The strongest neighborhood signal is the top-level folder a node lives in;
// root-level entries (about half the palace) fall back to their entry type so
// a root `project` still huddles with the Projects/ folder.
const FOLDER_GROUPS = {
  'Shop': 'shop',
  'Projects': 'projects',
  'People': 'people',
  'Palace development': 'palace-dev',
  'Cross-Domain Resonances': 'resonances',
  'Modes of Collaboration': 'ideas',
};
const TYPE_TO_FOLDER = {
  project: 'projects',
  person: 'people',
  specialist: 'shop',
  maker: 'shop',
  meta: 'palace-dev',
  hub: 'hub',
};
function groupByFolder(node) {
  const path = node?.path || '';
  const slash = path.indexOf('/');
  if (slash > 0) {
    const top = path.slice(0, slash);
    if (FOLDER_GROUPS[top]) return FOLDER_GROUPS[top];
  }
  return TYPE_TO_FOLDER[node?.type] ?? 'ideas';
}

// --- dimension: type / stage / role -----------------------------------------
function groupByType(node) { return node?.type ?? '(untyped)'; }
function groupByStage(node) { return node?.stage ?? '(no stage)'; }
function groupByRole(node) { return node?.role ?? 'default'; }

// --- dimension: pillar -------------------------------------------------------
// nodes carry `pillars` as a Set (attached by annotateBridges), insertion-
// ordered from the entry's frontmatter. We group by the *primary* (first-
// listed) pillar: ~88% of palace entries integrate multiple pillars, so a
// "multi" bucket would swallow nearly everything and huddle nothing — and the
// cross-pillar signal is already carried by the amber bridge edges. Primary
// pillar spreads the graph meaningfully across creation / tools / philosophy /
// practice; unaffiliated nodes (ceremony scaffolds, ops) land in '(none)'.
function groupByPillar(node) {
  const p = node?.pillars;
  const arr = p instanceof Set ? [...p] : (Array.isArray(p) ? p : []);
  return arr.length ? arr[0] : '(none)';
}

// Registry. `id` is the control value; `label` the button text; `fn` the
// classifier. `center` groups anchor at the middle (connective tissue); the
// rest fan around a ring in `order` (unknown groups sort after, alphabetically).
const DIMENSIONS = {
  folder: {
    label: 'folder', fn: groupByFolder,
    center: ['ideas', 'hub'],
    order: ['ideas', 'hub', 'shop', 'projects', 'people', 'palace-dev', 'resonances'],
  },
  type: {
    label: 'type', fn: groupByType,
    center: ['hub'],
    order: ['hub', 'concept', 'project', 'person', 'specialist', 'maker',
      'meta', 'practice', 'source', 'breakthrough', 'question', 'spore'],
  },
  stage: {
    label: 'stage', fn: groupByStage,
    center: [], // no core — a lifecycle clock, seed at top, sweeping clockwise
    order: ['seed', 'sprout', 'growing', 'mature', 'fruiting', 'dormant',
      'composting', 'foundational', '(no stage)'],
  },
  pillar: {
    label: 'pillar', fn: groupByPillar,
    center: [],
    order: ['creation', 'tools', 'philosophy', 'practice', '(none)'],
  },
  role: {
    label: 'role', fn: groupByRole,
    center: ['hub'],
    order: ['hub', 'default', 'orphan'],
  },
};

export const GROUPINGS = Object.entries(DIMENSIONS).map(([id, d]) => ({ id, label: d.label }));
export const DEFAULT_DIMENSION = 'folder';
export const DEFAULT_STRENGTH = 0.3;
// Inter-group repulsion default — the mass-weighted push that separates
// clusters (see makeGroupRepel in TopologyLens). 0 = groups may overlap.
export const DEFAULT_SPACING = 1.3;

function dimMeta(dim) { return DIMENSIONS[dim] ?? DIMENSIONS[DEFAULT_DIMENSION]; }

// Classify one node along a dimension. Default 'folder' keeps the original
// single-arg call site working.
export function groupOf(node, dim = DEFAULT_DIMENSION) {
  return dimMeta(dim).fn(node);
}

// Order the distinct groups present: canonical `order` first, then any extras
// sorted alphabetically. Deterministic for a given set + dimension.
function orderedGroups(groups, dim) {
  const present = new Set(groups);
  const meta = dimMeta(dim);
  const ranked = meta.order.filter((g) => present.has(g));
  const extras = [...present].filter((g) => !meta.order.includes(g)).sort();
  return [...ranked, ...extras];
}

// Assign every group present a centroid anchor: `center` groups sit in the
// middle (connective), the rest spread evenly around a ring in canonical
// order. Returns Map<group, {x, y}>.
//
// The ring is an ELLIPSE sized per-axis (not a circle capped by the shorter
// side), so the blobs use the full canvas width instead of bunching in the
// middle third — that opens real space between neighborhoods (people well
// clear of projects) while each group still huddles around its own anchor.
export function groupAnchors(groups, width, height, dim = DEFAULT_DIMENSION) {
  const meta = dimMeta(dim);
  const cx = width / 2;
  const cy = height / 2;
  const anchors = new Map();
  const ordered = orderedGroups(groups, dim);
  const centerSet = new Set(meta.center);
  const ring = ordered.filter((g) => !centerSet.has(g));
  for (const g of ordered) if (centerSet.has(g)) anchors.set(g, { x: cx, y: cy });
  const Rx = width * 0.42;
  const Ry = height * 0.40;
  ring.forEach((g, i) => {
    // Start at the top (−90°) and sweep clockwise; for ordered dimensions
    // (stage) this reads as a clock — seed at 12, composting swinging back.
    const a = (i / Math.max(1, ring.length)) * Math.PI * 2 - Math.PI / 2;
    anchors.set(g, { x: cx + Rx * Math.cos(a), y: cy + Ry * Math.sin(a) });
  });
  return anchors;
}

// --- barycentric placement (pillar dimension) --------------------------------
// Pillar isn't a discrete huddle — it's a *mix*. The four pillars pin the four
// corners of the window, and each node floats to the average of the corners it
// carries: creation-only → creation corner; creation+tools → the top edge;
// all four → dead center. This makes pillar composition legible as position.
const PILLAR_CORNERS = {
  creation: [0.16, 0.18],   // top-left
  tools: [0.84, 0.18],      // top-right
  philosophy: [0.16, 0.82], // bottom-left
  practice: [0.84, 0.82],   // bottom-right
};

// Dimensions that position nodes continuously (barycentric) rather than
// huddling them into discrete groups. Grouping-force + inter-group repulsion
// are skipped for these; a per-node target pull is used instead.
export const BARYCENTRIC_DIMS = new Set(['pillar']);
export function isBarycentric(dim) { return BARYCENTRIC_DIMS.has(dim); }

// Map<pillar, {x, y}> — the four corner attractors in pixel space.
export function pillarCornerPoints(width, height) {
  const m = new Map();
  for (const [k, [fx, fy]] of Object.entries(PILLAR_CORNERS)) {
    m.set(k, { x: fx * width, y: fy * height });
  }
  return m;
}

// A node's barycentric target: the centroid of the corners for the pillars it
// carries. No known pillar → window center (the neutral middle).
export function pillarBarycenter(pillars, width, height) {
  const arr = pillars instanceof Set ? [...pillars] : (Array.isArray(pillars) ? pillars : []);
  const known = arr.filter((p) => PILLAR_CORNERS[p]);
  if (known.length === 0) return { x: width / 2, y: height / 2 };
  let x = 0; let y = 0;
  for (const p of known) { const [fx, fy] = PILLAR_CORNERS[p]; x += fx * width; y += fy * height; }
  return { x: x / known.length, y: y / known.length };
}

// Live centroid + mass (count) per group, from nodes that have positions.
// Feeds the inter-group repulsion force (mass pushes off mass) and the
// floating group labels. Returns Map<group, {x, y, count}>.
export function groupCentroids(nodes) {
  const cen = new Map();
  for (const n of nodes ?? []) {
    if (!n || typeof n.x !== 'number' || typeof n.y !== 'number') continue;
    const g = n.group;
    const c = cen.get(g) ?? { x: 0, y: 0, count: 0 };
    c.x += n.x; c.y += n.y; c.count += 1;
    cen.set(g, c);
  }
  for (const c of cen.values()) { c.x /= c.count; c.y /= c.count; }
  return cen;
}

// Categorical palette — terminal-friendly (phosphor greens, amber, cyan,
// dracula accents). Assigned by canonical group order so the same group keeps
// its color across renders. '(none)'-style groups get a muted gray.
const PALETTE = [
  '#3ee07c', '#ffb840', '#78dcff', '#ff79c6', '#bd93f9', '#8be9fd',
  '#ff6e6e', '#f1fa8c', '#5fa8ff', '#ffa347', '#7be0b0', '#d0d0d0',
];
const MUTED = '#6f7f72';
const isMutedGroup = (g) => g === '(none)' || g === '(no stage)' || g === '(untyped)';

// Map<group, hex> for the groups present along a dimension.
export function buildGroupColors(groups, dim = DEFAULT_DIMENSION) {
  const ordered = orderedGroups(groups, dim);
  const map = new Map();
  let ci = 0;
  for (const g of ordered) {
    map.set(g, isMutedGroup(g) ? MUTED : PALETTE[ci++ % PALETTE.length]);
  }
  return map;
}

// [{ group, count, color }] for the live legend, in canonical order.
export function groupSummary(nodes, dim = DEFAULT_DIMENSION) {
  const groups = (nodes ?? []).map((n) => n.group ?? groupOf(n, dim));
  const counts = new Map();
  for (const g of groups) counts.set(g, (counts.get(g) ?? 0) + 1);
  const colors = buildGroupColors(groups, dim);
  return orderedGroups(groups, dim).map((g) => ({
    group: g, count: counts.get(g) ?? 0, color: colors.get(g),
  }));
}

// Group counts as a plain object (used in tests / debugging).
export function groupCounts(nodes, dim = DEFAULT_DIMENSION) {
  const out = {};
  for (const n of nodes ?? []) {
    const g = n.group ?? groupOf(n, dim);
    out[g] = (out[g] ?? 0) + 1;
  }
  return out;
}
