import React, {
  useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  forceX, forceY,
} from 'd3-force';
import { Box } from '../primitives.jsx';
import { fetchTopology, fetchUnsungPaths } from '../../adapters/topology.js';
import { assignRoles, roleCounts } from '../../lib/topology-roles.js';
import {
  groupOf, groupAnchors, buildGroupColors, groupSummary,
  pillarCornerPoints, pillarBarycenter, groupCentroids, isBarycentric,
  GROUPINGS, DEFAULT_DIMENSION, DEFAULT_STRENGTH, DEFAULT_SPACING,
} from '../../lib/topology-groups.js';
import { buildPillarsByPath, annotateBridges, bridgeCounts } from '../../lib/topology-bridges.js';
import {
  buildIconByPath, attachIcons, avatarRadiusFor, avatarCount,
} from '../../lib/topology-avatars.js';

// TOPOLOGY -- the typed-link graph lens. Renders the freshest
// palace-map-full-*.json as a force-directed canvas. Clicking a node
// opens that entry in STATE via onSelect(path). Layers, painted bottom-up:
// unsung paths / typed edges / cross-pillar bridges, then hub-orphan-default
// dots, then per-entry avatar art (the bundle `<Title> — icon.png`) for the
// nodes that carry it — toggleable from the legend.

// Resolve ?path / ?id mismatches: the map JSON keys nodes by `id`; the
// EntryReader keys by `path`. We pass node.path through to onSelect.

const WIDTH = 1200;
const HEIGHT = 720;
const NODE_RADIUS = 3;
const HOVER_RADIUS = 6;

// Per-role visual: { fill, ring, radius }. Stays in JS (canvas can't read
// CSS vars directly) — keep aligned with --phosphor / --phosphor-bright /
// --phosphor-dim and the ANSI accent tokens.
const ROLE_STYLE = {
  hub:     { fill: '#aaffaa', ring: '#ccffcc', radius: 6.5 },
  default: { fill: '#3ee07c', ring: null,      radius: 3.0 },
  orphan:  { fill: '#1a4a30', ring: null,      radius: 2.0 },
};
const HOVER_FILL = '#ffffff';
const HOVER_RING = '#aaffff';
// Avatar ring — a phosphor frame around the bundle art so the full-color
// hand-drawn icon reads as part of the BBS terminal, not pasted onto it.
// Hubs wear the brighter frame, matching ROLE_STYLE.
const AVATAR_RING = { hub: '#ccffcc', default: '#2fbf6a' };
// Cross-pillar bridge edges — amber, slightly stronger than the dim
// phosphor used for in-pillar / unaffiliated edges.
const EDGE_STYLE = {
  default: { color: 'rgba(0, 200, 80, 0.18)', width: 0.6 },
  bridge:  { color: 'rgba(255, 184, 64, 0.55)', width: 0.9 },
  // Unsung paths: body wikilinks not in YAML. Dashed dim cyan — visibly
  // distinct from both the typed-link tissue (green) and the cross-pillar
  // bridges (amber). The dash says "the prose claims this; the graph hasn't
  // ratified it."
  unsung:  { color: 'rgba(120, 220, 255, 0.22)', width: 0.5, dash: [2, 3] },
};

function prepareGraph(raw, pillarsByPath, unsungEdges, iconByPath) {
  // d3-force will mutate source/target on the link objects (string -> node
  // object). Clone everything so the input data stays untouched.
  const baseNodes = (raw?.nodes ?? []).map((n) => ({
    id: n.id,
    path: n.path,
    type: n.type ?? null,
    stage: n.stage ?? null,
    outbound: n.outbound_count ?? 0,
    inbound: n.inbound_count ?? 0,
    degree: (n.outbound_count ?? 0) + (n.inbound_count ?? 0),
  }));
  const withRoles = assignRoles(baseNodes);
  // Join each node to its bundle avatar art (or null) so the canvas can paint
  // the entry's icon instead of a bare dot. Role is already assigned, so the
  // avatar size policy (avatarRadiusFor) can read it.
  attachIcons(withRoles, iconByPath);
  const ids = new Set(withRoles.map((n) => n.id));
  // Drop ghost edges (targets that don't exist as nodes) so d3-force doesn't
  // throw on link resolution. The map's meta.ghost_taxonomy explains them.
  const rawLinks = (raw?.edges ?? [])
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ source: e.source, target: e.target, type: e.type, label: e.label }));
  // Annotate each link with crossPillar (computed against the entries
  // catalog's pillar sets). Node objects pick up a `pillars` Set too.
  const annotated = annotateBridges({ nodes: withRoles, links: rawLinks }, pillarsByPath);

  // Unsung paths: body-wikilink edges. Server returns them keyed by path;
  // resolve to the node objects from the annotated graph so the draw loop
  // can read live .x/.y as the simulation ticks them. These are drawn-only
  // — they do NOT feed the force simulation, so they can't distort the
  // typed-link layout.
  const nodeByPath = new Map();
  for (const n of annotated.nodes) if (n.path) nodeByPath.set(n.path, n);
  const unsungLinks = [];
  for (const e of unsungEdges ?? []) {
    const sNode = nodeByPath.get(e.source);
    const tNode = nodeByPath.get(e.target_path);
    if (!sNode || !tNode || sNode === tNode) continue;
    unsungLinks.push({ source: sNode, target: tNode, target_name: e.target_name });
  }
  return { ...annotated, unsungLinks };
}

// Inter-group repulsion — a custom d3 force so each group's *mass* pushes off
// the others: the people-blob shoulders away from the projects-blob, opening
// space between clusters (and letting the edges between them breathe) while the
// per-node anchor pull still huddles each group internally. Each tick we take
// the live group centroids and, for every node, add a velocity nudge away from
// every *other* group's centroid, scaled by that group's node count (mass),
// inverse distance, and alpha (so it cools with the sim and settles instead of
// oscillating). Strength 0 disables it (barycentric dims turn it off).
function makeGroupRepel() {
  let nodes = [];
  let strength = 0;
  function force(alpha) {
    if (strength <= 0 || nodes.length === 0) return;
    const cen = groupCentroids(nodes);
    if (cen.size < 2) return;
    for (const n of nodes) {
      if (typeof n.x !== 'number') continue;
      for (const [g, c] of cen) {
        if (g === n.group) continue;
        let dx = n.x - c.x;
        let dy = n.y - c.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = (n.index % 2 ? 1 : -1); dy = 1; d2 = 2; }
        const d = Math.sqrt(d2);
        // mass / distance, tuned so the default (~0.7) opens clear lanes
        // between groups without flinging them off-canvas.
        const f = (strength * c.count) / d * 0.9 * alpha;
        n.vx += (dx / d) * f;
        n.vy += (dy / d) * f;
      }
    }
  }
  force.initialize = (n) => { nodes = n; };
  force.strength = (s) => {
    if (s === undefined) return strength;
    strength = s;
    return force;
  };
  return force;
}

export default function TopologyLens({ onSelect, entries = [] }) {
  const [state, setState] = useState({ kind: 'loading' });
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const graphRef = useRef(null);
  const hoverRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  // The hover card floats to the cursor. It lives permanently in the DOM
  // (visibility toggled by hoverInfo) so the pointer handler can position it
  // imperatively without waiting on a React mount; positionTooltipRef holds the
  // placement fn set inside the canvas effect. Placement flips to the other
  // side of the cursor near a viewport edge so the card is never clipped.
  const tooltipRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const positionTooltipRef = useRef(null);
  positionTooltipRef.current = (clientX, clientY) => {
    mouseRef.current = { x: clientX, y: clientY };
    const el = tooltipRef.current;
    if (!el) return;
    const pad = 16;
    const w = el.offsetWidth || 280;
    const h = el.offsetHeight || 140;
    let left = clientX + pad;
    let top = clientY + pad;
    if (left + w > window.innerWidth - 8) left = clientX - w - pad;
    if (top + h > window.innerHeight - 8) top = clientY - h - pad;
    el.style.left = `${Math.max(8, left)}px`;
    el.style.top = `${Math.max(8, top)}px`;
  };
  // Position the card the moment it mounts on a new hover (using the last known
  // cursor spot) so it never flashes at a stale corner before the next move.
  useLayoutEffect(() => {
    if (hoverInfo && positionTooltipRef.current) {
      positionTooltipRef.current(mouseRef.current.x, mouseRef.current.y);
    }
  }, [hoverInfo]);
  // Avatar image cache (icon path -> HTMLImageElement), persisted across
  // effect re-runs so we never re-fetch art. drawRef always points at the
  // latest draw() so a late image load repaints the current canvas (not a
  // stale closure). showAvatars is a live toggle read through a ref, so
  // flipping it repaints without re-running the whole simulation.
  const imgCacheRef = useRef(new Map());
  const drawRef = useRef(null);
  const [showAvatars, setShowAvatars] = useState(true);
  const showAvatarsRef = useRef(true);
  function toggleAvatars() {
    setShowAvatars((v) => {
      const next = !v;
      showAvatarsRef.current = next;
      if (drawRef.current) drawRef.current();
      return next;
    });
  }

  // --- grouping controls -----------------------------------------------------
  // The active grouping dimension, its pull strength, and the two paint
  // toggles (tint clusters by group / float group labels). All are read inside
  // the sim + draw loop through refs, so a control change updates the running
  // simulation live — no teardown, no position reset. applyGroupingRef is set
  // by the canvas effect and re-tags + re-anchors + restarts the sim;
  // groupColorsRef feeds the paint; groupSummaryState feeds the chip legend.
  const [groupDim, setGroupDim] = useState(DEFAULT_DIMENSION);
  const groupDimRef = useRef(DEFAULT_DIMENSION);
  const [groupStrength, setGroupStrength] = useState(DEFAULT_STRENGTH);
  const groupStrengthRef = useRef(DEFAULT_STRENGTH);
  const [groupSpacing, setGroupSpacing] = useState(DEFAULT_SPACING);
  const groupSpacingRef = useRef(DEFAULT_SPACING);
  const [tintByGroup, setTintByGroup] = useState(true);
  const tintRef = useRef(true);
  const [showGroupLabels, setShowGroupLabels] = useState(true);
  const labelsRef = useRef(true);
  const groupColorsRef = useRef(new Map());
  const anchorsRef = useRef(new Map());
  const applyGroupingRef = useRef(null);
  const [groupSummaryState, setGroupSummaryState] = useState([]);
  // Isolate-by-chip: the set of groups the user has clicked to focus. When
  // non-empty, the canvas dims everything outside the focus (see draw()).
  const [focusedGroups, setFocusedGroups] = useState(() => new Set());
  const focusedRef = useRef(focusedGroups);
  function toggleFocus(group) {
    setFocusedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      focusedRef.current = next;
      if (drawRef.current) drawRef.current();
      return next;
    });
  }
  function clearFocus() {
    setFocusedGroups(() => {
      const next = new Set();
      focusedRef.current = next;
      if (drawRef.current) drawRef.current();
      return next;
    });
  }

  function pickDim(id) {
    setGroupDim(id);
    groupDimRef.current = id;
    clearFocus(); // groups differ across dimensions — a stale focus is meaningless
    if (applyGroupingRef.current) applyGroupingRef.current();
  }
  function changeStrength(v) {
    const s = Number(v);
    setGroupStrength(s);
    groupStrengthRef.current = s;
    if (applyGroupingRef.current) applyGroupingRef.current();
  }
  function changeSpacing(v) {
    const s = Number(v);
    setGroupSpacing(s);
    groupSpacingRef.current = s;
    if (applyGroupingRef.current) applyGroupingRef.current();
  }
  function toggleTint() {
    setTintByGroup((v) => { const n = !v; tintRef.current = n; if (drawRef.current) drawRef.current(); return n; });
  }
  function toggleLabels() {
    setShowGroupLabels((v) => { const n = !v; labelsRef.current = n; if (drawRef.current) drawRef.current(); return n; });
  }

  // Build the path -> pillars Set lookup once per entries fetch. Stable
  // across lens-switches so we don't re-walk on hover repaints.
  const pillarsByPath = useMemo(() => buildPillarsByPath(entries), [entries]);
  // Path -> bundle-icon lookup, same lifecycle as pillarsByPath.
  const iconByPath = useMemo(() => buildIconByPath(entries), [entries]);
  // Path -> full entry record, so the hover card can show the entry's real
  // detail (forward vector, born, activity) beyond the map node's fields.
  const entryByPath = useMemo(() => {
    const m = new Map();
    for (const e of entries) if (e && e.path) m.set(e.path, e);
    return m;
  }, [entries]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchTopology(), fetchUnsungPaths()]).then(([topo, unsung]) => {
      if (cancelled) return;
      if (!topo.ok) {
        setState({ kind: 'err', error: topo.error ?? 'unknown error' });
        return;
      }
      setState({
        kind: 'ok',
        meta: topo.meta,
        source: topo.source,
        raw: topo,
        // Unsung paths are best-effort -- if the endpoint errors (e.g. some
        // entry can't be read), the lens still works without them.
        unsungEdges: unsung.ok ? (unsung.edges ?? []) : [],
      });
    });
    return () => { cancelled = true; };
  }, []);

  // Role + bridge + unsung counts are derived from the prepared graph;
  // we recompute here (cheap) so the legend renders before the canvas
  // useEffect mounts.
  const legendStats = useMemo(() => {
    if (state.kind !== 'ok') return null;
    const g = prepareGraph(state.raw, pillarsByPath, state.unsungEdges, iconByPath);
    return {
      roles: roleCounts(g.nodes),
      bridges: bridgeCounts(g.links),
      unsung: g.unsungLinks.length,
      avatars: avatarCount(g.nodes),
    };
  }, [state, pillarsByPath, iconByPath]);

  useEffect(() => {
    if (state.kind !== 'ok') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const graph = prepareGraph(state.raw, pillarsByPath, state.unsungEdges, iconByPath);
    graphRef.current = graph;

    // Preload avatar art. Each load (or failure) repaints via drawRef so the
    // node flips from dot to art the moment its image arrives. Cached across
    // effect re-runs in imgCacheRef, so re-mounts don't re-fetch.
    const imgCache = imgCacheRef.current;
    function ensureImage(iconPath) {
      let img = imgCache.get(iconPath);
      if (img) return img;
      img = new Image();
      img.decoding = 'async';
      img.onload = () => { if (drawRef.current) drawRef.current(); };
      img.onerror = () => { img._failed = true; if (drawRef.current) drawRef.current(); };
      img.src = `/api/file?path=${encodeURIComponent(iconPath)}`;
      imgCache.set(iconPath, img);
      return img;
    }
    function imageReady(iconPath) {
      const img = imgCache.get(iconPath);
      return img && !img._failed && img.complete && img.naturalWidth > 0 ? img : null;
    }
    for (const n of graph.nodes) if (n.icon) ensureImage(n.icon);

    // A node draws as an avatar when avatars are on, it has art, and that art
    // has finished loading; otherwise it falls back to the phosphor dot. The
    // collide force below reserves the larger avatar footprint up front (keyed
    // on `icon`, not load state) so the art doesn't pile up once it arrives.
    const isAvatarNode = (n) => showAvatarsRef.current && n.icon && imageReady(n.icon);

    // Natural neighborhoods: tag each node with its group along the active
    // dimension and give it a target position. Two positioning modes:
    //   • anchor mode (folder / type / stage / role): each group has a fixed
    //     anchor on an elliptical ring (a connective set at the middle, the
    //     rest fanned around); nodes are pulled to their group's anchor
    //     (gravity, default 0.3) while the inter-group repulsion below pushes
    //     the group masses apart and the link force is eased (see below) so the
    //     blobs travel out to their anchors — coherent inside, well separated.
    //   • barycentric mode (pillar): the four pillars pin the four window
    //     corners and each node's target is the average of the corners it
    //     carries — all-four → center. No discrete anchors, repulsion off.
    // Each node caches its target in _ax/_ay; the forceX/forceY accessors read
    // them, so reGroup() can retarget the running sim live on any control change.
    const anchorX = (d) => (typeof d._ax === 'number' ? d._ax : WIDTH / 2);
    const anchorY = (d) => (typeof d._ay === 'number' ? d._ay : HEIGHT / 2);
    const groupRepel = makeGroupRepel();

    const sim = forceSimulation(graph.nodes)
      .force('link', forceLink(graph.links).id((d) => d.id).distance(50).strength(0.4))
      .force('charge', forceManyBody().strength(-60))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('groupX', forceX(anchorX).strength(groupStrengthRef.current))
      .force('groupY', forceY(anchorY).strength(groupStrengthRef.current))
      .force('groupRepel', groupRepel)
      .force('collide', forceCollide((d) => (
        d.icon ? avatarRadiusFor(d.role) : (ROLE_STYLE[d.role]?.radius ?? ROLE_STYLE.default.radius)
      ) + 2));
    simRef.current = sim;

    // (Re)tag nodes for the current dimension, recompute each node's target
    // (ring anchor or pillar barycenter), refresh colors + the chip-legend
    // summary, push the live pull + spacing into the forces, and reheat so the
    // layout glides into place. Called once at setup and on every control
    // change via applyGroupingRef.
    function reGroup(reheat = true) {
      const dim = groupDimRef.current;
      const bary = isBarycentric(dim);
      for (const n of graph.nodes) n.group = groupOf(n, dim);
      const groups = graph.nodes.map((n) => n.group);
      groupColorsRef.current = buildGroupColors(groups, dim);
      setGroupSummaryState(groupSummary(graph.nodes, dim));
      const s = groupStrengthRef.current;
      if (bary) {
        // pillar: continuous placement by pillar composition. The corners must
        // WIN over the graph's cohesion, so we de-emphasize the links (they'd
        // otherwise collapse the giant connected component into a central
        // blob), drop the centering force (targets are absolute canvas
        // positions), and ease the charge so same-pillar nodes settle together
        // at their corner. collide still keeps the art from overlapping.
        // Most entries blend several pillars, so their true barycenter sits
        // mid-window and the map would bunch up in the center. Amplify each
        // node's offset from center (all-four still resolves to dead center,
        // since its offset is zero) and clamp to the window, so composition
        // reads across the whole space and the corners get used.
        const AMP = 1.6;
        const cxw = WIDTH / 2;
        const cyw = HEIGHT / 2;
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        anchorsRef.current = new Map();
        for (const n of graph.nodes) {
          const t = pillarBarycenter(n.pillars, WIDTH, HEIGHT);
          n._ax = clamp(cxw + (t.x - cxw) * AMP, 0.05 * WIDTH, 0.95 * WIDTH);
          n._ay = clamp(cyw + (t.y - cyw) * AMP, 0.06 * HEIGHT, 0.94 * HEIGHT);
        }
        sim.force('link').strength(0.03);
        sim.force('charge').strength(-20);
        sim.force('center').strength(0);
        sim.force('groupRepel').strength(0);
        // A floor on the corner pull so the placement reads even at low PULL;
        // the slider still tightens it further above the floor.
        const p = Math.max(s, 0.32);
        sim.force('groupX').strength(p);
        sim.force('groupY').strength(p);
      } else {
        const anchors = groupAnchors(groups, WIDTH, HEIGHT, dim);
        anchorsRef.current = anchors;
        for (const n of graph.nodes) {
          const a = anchors.get(n.group);
          n._ax = a?.x ?? WIDTH / 2; n._ay = a?.y ?? HEIGHT / 2;
        }
        // Ease the link force well below its natural strength: at full strength
        // the 2436 edges tether every group back toward the center and the
        // blobs bunch. A gentle link pull (0.12) lets the group anchors + the
        // inter-group repulsion drive position — so neighborhoods separate
        // (people well clear of projects) — while edges are still fully DRAWN;
        // only their pull as a layout force is dialed down. Measured on the
        // 300-node map: easing links 0.4→0.12 with pull 0.3 roughly doubles the
        // closest-blob gap and pushes the graph across the full canvas width,
        // with groups staying internally coherent.
        sim.force('link').strength(0.12);
        sim.force('charge').strength(-60);
        sim.force('center').strength(1);
        sim.force('groupX').strength(s);
        sim.force('groupY').strength(s);
        // Inter-group repulsion: each group's mass pushes off the others.
        sim.force('groupRepel').strength(groupSpacingRef.current);
      }
      if (reheat) sim.alpha(Math.max(sim.alpha(), 0.6)).restart();
      if (drawRef.current) drawRef.current();
    }
    applyGroupingRef.current = reGroup;
    reGroup(false); // initial tag/anchor/colors before the first tick

    // Isolate-by-chip: when a focus set is active, in-focus nodes and the edges
    // that touch them paint at full strength; everything else fades to DIM_ALPHA
    // so the chosen neighborhood (and what it reaches) reads against the rest.
    const DIM_ALPHA = 0.08;
    const nodeInFocus = (n) => { const f = focusedRef.current; return f.size === 0 || f.has(n.group); };
    const edgeInFocus = (l) => {
      const f = focusedRef.current;
      if (f.size === 0) return true;
      return (l.source && f.has(l.source.group)) || (l.target && f.has(l.target.group));
    };

    function draw() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const focusing = focusedRef.current.size > 0;
      // Stroke a set of edges (optionally filtered) as one batched path.
      const strokeEdges = (list, color, width, dash, predicate) => {
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.setLineDash(dash || []);
        ctx.beginPath();
        for (const l of list) {
          if (predicate && !predicate(l)) continue;
          const s = l.source; const t = l.target;
          if (!s || !t || typeof s.x !== 'number' || typeof t.x !== 'number') continue;
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
        }
        ctx.stroke();
      };
      // edges -- three layers, painted bottom-up so the most-ratified sits on
      // top: unsung (dashed cyan) → typed default (green) → cross-pillar (amber).
      // Under focus, each layer draws a dim pass (out-of-focus edges) then a
      // full pass (in-focus edges).
      const us = EDGE_STYLE.unsung;
      const edgeLayers = [
        { list: graph.unsungLinks ?? [], color: us.color, width: us.width, dash: us.dash },
        { list: graph.links, color: EDGE_STYLE.default.color, width: EDGE_STYLE.default.width, dash: null, base: (l) => !l.crossPillar },
        { list: graph.links, color: EDGE_STYLE.bridge.color, width: EDGE_STYLE.bridge.width, dash: null, base: (l) => !!l.crossPillar },
      ];
      for (const L of edgeLayers) {
        if (focusing) {
          ctx.globalAlpha = DIM_ALPHA;
          strokeEdges(L.list, L.color, L.width, L.dash, (l) => (!L.base || L.base(l)) && !edgeInFocus(l));
          ctx.globalAlpha = 1;
          strokeEdges(L.list, L.color, L.width, L.dash, (l) => (!L.base || L.base(l)) && edgeInFocus(l));
        } else {
          strokeEdges(L.list, L.color, L.width, L.dash, L.base);
        }
      }
      ctx.setLineDash([]);
      // dots — role-driven size; color is role by default, or the node's group
      // hue when "tint by group" is on. Hover overrides both. Nodes whose
      // avatar art is ready get skipped here and painted in the avatar pass.
      const tint = tintRef.current;
      const colors = groupColorsRef.current;
      for (const n of graph.nodes) {
        if (typeof n.x !== 'number') continue;
        if (isAvatarNode(n)) continue;
        const isHover = hoverRef.current && hoverRef.current.id === n.id;
        const style = ROLE_STYLE[n.role] ?? ROLE_STYLE.default;
        const r = isHover ? HOVER_RADIUS : style.radius;
        const groupFill = tint ? colors.get(n.group) : null;
        ctx.globalAlpha = (focusing && !nodeInFocus(n)) ? DIM_ALPHA : 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? HOVER_FILL : (groupFill ?? style.fill);
        ctx.fill();
        const ringColor = isHover ? HOVER_RING : style.ring;
        if (ringColor) {
          ctx.lineWidth = isHover ? 1.5 : 1;
          ctx.strokeStyle = ringColor;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      // avatars — the entry's hand-drawn bundle art, clipped to a circle and
      // settled onto the phosphor (slight desaturate, like EntryAvatar).
      // Painted last so the art sits above link tissue and dots; hover
      // enlarges. Two sub-passes: filtered art, then an unfiltered ring.
      ctx.filter = 'saturate(0.85) brightness(0.92)';
      for (const n of graph.nodes) {
        if (typeof n.x !== 'number' || !isAvatarNode(n)) continue;
        const img = imageReady(n.icon);
        const isHover = hoverRef.current && hoverRef.current.id === n.id;
        const r = avatarRadiusFor(n.role) + (isHover ? 4 : 0);
        ctx.globalAlpha = (focusing && !nodeInFocus(n)) ? DIM_ALPHA : 1;
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, n.x - r, n.y - r, r * 2, r * 2);
        ctx.restore();
      }
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      for (const n of graph.nodes) {
        if (typeof n.x !== 'number' || !isAvatarNode(n)) continue;
        const isHover = hoverRef.current && hoverRef.current.id === n.id;
        const r = avatarRadiusFor(n.role) + (isHover ? 4 : 0);
        const groupRing = tint ? colors.get(n.group) : null;
        ctx.globalAlpha = (focusing && !nodeInFocus(n)) ? DIM_ALPHA : 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.lineWidth = isHover ? 2 : 1.25;
        ctx.strokeStyle = isHover ? HOVER_RING : (groupRing ?? AVATAR_RING[n.role] ?? AVATAR_RING.default);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // group labels — the group's name in its hue on a dark backing. In anchor
      // mode each label floats on its cluster's live centroid, riding it as the
      // sim settles; in barycentric (pillar) mode the four pillar names pin the
      // window corners instead. Toggled from the controls.
      if (labelsRef.current) {
        ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const drawLabel = (text, cx, cy, color, dim) => {
          ctx.globalAlpha = dim ? 0.25 : 1;
          const w = ctx.measureText(text).width;
          ctx.fillStyle = 'rgba(0,0,0,0.72)';
          ctx.fillRect(cx - w / 2 - 5, cy - 9, w + 10, 18);
          ctx.fillStyle = color ?? '#3ee07c';
          ctx.fillText(text, cx, cy + 1);
          ctx.globalAlpha = 1;
        };
        const f = focusedRef.current;
        if (isBarycentric(groupDimRef.current)) {
          for (const [pillar, pt] of pillarCornerPoints(WIDTH, HEIGHT)) {
            drawLabel(pillar.toUpperCase(), pt.x, pt.y, colors.get(pillar), f.size > 0 && !f.has(pillar));
          }
        } else {
          for (const [g, c] of groupCentroids(graph.nodes)) {
            drawLabel(String(g).toUpperCase(), c.x, c.y, colors.get(g), f.size > 0 && !f.has(g));
          }
        }
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }
    }
    drawRef.current = draw;
    sim.on('tick', draw);

    // Hit-test helpers shared by mousemove + click.
    function nodeAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      let best = null; let bestDist = Infinity;
      for (const n of graph.nodes) {
        if (typeof n.x !== 'number') continue;
        const dx = n.x - x; const dy = n.y - y;
        const d = dx * dx + dy * dy;
        // Hit radius tracks the node's drawn size (+4px margin) so the larger
        // avatars are clickable to their edge, not just their 8px core.
        const baseR = n.icon
          ? avatarRadiusFor(n.role)
          : (ROLE_STYLE[n.role]?.radius ?? ROLE_STYLE.default.radius);
        const hitR = baseR + 4;
        if (d < bestDist && d < hitR * hitR) {
          best = n; bestDist = d;
        }
      }
      return best;
    }

    function handleMove(ev) {
      const n = nodeAt(ev.clientX, ev.clientY);
      if (n) positionTooltipRef.current?.(ev.clientX, ev.clientY);
      if (n !== hoverRef.current) {
        hoverRef.current = n;
        setHoverInfo(n ? {
          id: n.id, type: n.type, stage: n.stage, degree: n.degree, role: n.role, path: n.path,
          outbound: n.outbound, inbound: n.inbound,
          pillars: n.pillars ? [...n.pillars] : [],
          group: n.group ?? null, groupColor: groupColorsRef.current.get(n.group) ?? null,
          icon: n.icon ?? null,
        } : null);
        // re-draw immediately so hover feedback isn't tied to sim tick
        draw();
      }
      canvas.style.cursor = n ? 'pointer' : 'default';
    }
    function handleLeave() {
      if (hoverRef.current) { hoverRef.current = null; setHoverInfo(null); draw(); }
    }

    function handleClick(ev) {
      const n = nodeAt(ev.clientX, ev.clientY);
      if (n && n.path && typeof onSelect === 'function') onSelect(n.path);
    }

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      canvas.removeEventListener('click', handleClick);
      sim.stop();
      simRef.current = null;
      graphRef.current = null;
      drawRef.current = null;
    };
  }, [state, onSelect, pillarsByPath, iconByPath]);

  if (state.kind === 'loading') {
    return (
      <div data-testid="topology-loading" style={{ color: 'var(--phosphor-dim)' }}>
        reading the freshest palace map...
      </div>
    );
  }
  if (state.kind === 'err') {
    return (
      <div data-testid="topology-error" style={{
        color: 'var(--error)', textShadow: 'var(--glow)',
        border: '1px solid var(--error)', padding: 12,
      }}>
        could not read palace map: {state.error}
      </div>
    );
  }

  const nodeCount = state.meta?.node_count ?? '?';
  const edgeCount = state.meta?.edge_count ?? '?';
  return (
    <Box title={`TOPOLOGY  --  typed-link graph  (${nodeCount} nodes, ${edgeCount} edges from ${state.source ?? '?'})`} tone="double">
      <Legend stats={legendStats} showAvatars={showAvatars} onToggleAvatars={toggleAvatars} />
      <GroupControls
        dim={groupDim}
        onPickDim={pickDim}
        strength={groupStrength}
        onStrength={changeStrength}
        spacing={groupSpacing}
        onSpacing={changeSpacing}
        tint={tintByGroup}
        onToggleTint={toggleTint}
        labels={showGroupLabels}
        onToggleLabels={toggleLabels}
        summary={groupSummaryState}
        focused={focusedGroups}
        onToggleFocus={toggleFocus}
        onClearFocus={clearFocus}
      />
      <div style={{ position: 'relative' }}>
        <canvas
          data-testid="topology-canvas"
          ref={canvasRef}
          style={{ display: 'block', background: 'var(--terminal-black)' }}
        />
        {hoverInfo ? (
          <HoverCard tooltipRef={tooltipRef} info={hoverInfo} entry={entryByPath.get(hoverInfo.path)} />
        ) : null}
      </div>
    </Box>
  );
}

function Dot({ style }) {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: style.fill,
      border: style.ring ? `1px solid ${style.ring}` : 'none',
      marginRight: 6, verticalAlign: 'middle',
    }} />
  );
}

// The floating hover card — a detail panel that rides the cursor. Always in the
// DOM (visibility toggled) so the pointer handler can place it without a mount
// wait. Merges the map node's structural fields (degree, role, group) with the
// entry's own record (forward vector, born, activity) for a real read of what
// you're pointing at.
function HoverCard({ tooltipRef, info, entry }) {
  const dimStyle = { color: 'var(--phosphor-dim)', textShadow: 'none' };
  const title = (entry && entry.title) || info.id || '';
  const lifecycle = info.stage ?? (entry && entry.status) ?? '--';
  return (
    <div
      ref={tooltipRef}
      data-testid="topology-hover"
      style={{
        position: 'fixed', left: -9999, top: -9999, zIndex: 60,
        width: 300, maxWidth: '80vw',
        background: 'rgba(4, 10, 6, 0.94)', border: '1px solid var(--phosphor-dim)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
        padding: '8px 10px', fontSize: 11, lineHeight: 1.5, color: 'var(--phosphor)',
        pointerEvents: 'none',
      }}
    >
      {info.icon ? (
            <img
              src={`/api/file?path=${encodeURIComponent(info.icon)}`}
              alt=""
              width={38}
              height={38}
              style={{
                float: 'right', marginLeft: 8, borderRadius: '50%',
                border: '1px solid var(--phosphor-dim)', objectFit: 'cover',
                filter: 'saturate(0.85) brightness(0.92)',
              }}
            />
          ) : null}
          <div style={{ fontWeight: 700, textShadow: 'var(--glow)', paddingRight: 44 }}>{title}</div>
          <div style={dimStyle}>
            {(info.type ?? '--')} · {lifecycle} · {info.role}
          </div>
          <div style={dimStyle}>
            degree {info.degree}
            {typeof info.outbound === 'number' ? ` (${info.outbound}↑ out · ${info.inbound}↓ in)` : ''}
          </div>
          <div style={dimStyle}>
            pillars: {info.pillars.length ? info.pillars.join(' / ') : '--'}
          </div>
          {info.group ? (
            <div style={dimStyle}>
              group: <span style={{ color: info.groupColor ?? 'var(--phosphor)' }}>{info.group}</span>
            </div>
          ) : null}
          {entry && entry.forward_vector ? (
            <div style={{
              marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--phosphor-dim)',
              fontStyle: 'italic', color: 'var(--phosphor)', textShadow: 'none',
            }}>
              &ldquo;{entry.forward_vector}&rdquo;
            </div>
          ) : null}
          {entry ? (
            <div style={{ ...dimStyle, marginTop: 6, opacity: 0.75, fontSize: 10 }}>
              {[
                entry.born ? `born ${entry.born}` : null,
                entry.last_activated ? `active ${entry.last_activated}` : null,
                typeof entry.activation_count === 'number' && entry.activation_count > 0 ? `×${entry.activation_count}` : null,
                typeof entry.link_count === 'number' ? `${entry.link_count} typed links` : null,
                entry.energy ? `energy ${entry.energy}` : null,
              ].filter(Boolean).join('  ·  ')}
            </div>
          ) : null}
          <div style={{ ...dimStyle, marginTop: 6, opacity: 0.5, fontSize: 10 }}>click to open in STATE</div>
    </div>
  );
}

function EdgeSwatch({ color, width, dashed }) {
  return (
    <span style={{
      display: 'inline-block', width: 16, height: 0, marginRight: 6, verticalAlign: 'middle',
      borderTop: `${Math.max(1, width * 2)}px ${dashed ? 'dashed' : 'solid'} ${color}`,
    }} />
  );
}

// The grouping instrument: pick the dimension nodes cluster along, drag the
// pull strength (0 = free float), and toggle the two paints (tint clusters by
// group / float group labels). The chip row below mirrors the active grouping
// with live colors + counts, so the legend and the canvas always agree.
function GroupControls({
  dim, onPickDim, strength, onStrength, spacing, onSpacing,
  tint, onToggleTint, labels, onToggleLabels, summary,
  focused, onToggleFocus, onClearFocus,
}) {
  const bary = dim === 'pillar';
  const btn = (active) => ({
    font: 'inherit', fontSize: 11, cursor: 'pointer', padding: '2px 8px',
    background: active ? 'var(--phosphor)' : 'transparent',
    color: active ? 'var(--terminal-black)' : 'var(--phosphor-dim)',
    border: `1px solid ${active ? 'var(--phosphor)' : 'var(--phosphor-dim)'}`,
    borderRadius: 2,
  });
  return (
    <div data-testid="topology-group-controls" style={{
      display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
      fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none',
      marginBottom: 8, paddingBottom: 6, borderBottom: '1px dashed var(--phosphor-dim)',
    }}>
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <strong style={{ color: 'var(--phosphor)' }}>GROUP BY</strong>
        {GROUPINGS.map((g) => (
          <button
            key={g.id}
            type="button"
            data-testid={`topology-group-dim-${g.id}`}
            aria-pressed={dim === g.id}
            onClick={() => onPickDim(g.id)}
            style={btn(dim === g.id)}
          >{g.label}</button>
        ))}
      </span>
      <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <span style={{ color: 'var(--phosphor)' }}>PULL</span>
        <input
          type="range"
          data-testid="topology-group-strength"
          min={0} max={0.5} step={0.01}
          value={strength}
          onChange={(e) => onStrength(e.target.value)}
          style={{ accentColor: 'var(--phosphor)', cursor: 'pointer', width: 120 }}
        />
        <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: '3ch' }}>
          {Number(strength).toFixed(2)}
        </span>
      </label>
      <label style={{
        display: 'inline-flex', gap: 8, alignItems: 'center',
        opacity: bary ? 0.35 : 1,
      }} title={bary ? 'pillar mode spreads by mix — spacing n/a' : 'push group masses apart'}>
        <span style={{ color: 'var(--phosphor)' }}>SPACING</span>
        <input
          type="range"
          data-testid="topology-group-spacing"
          min={0} max={2} step={0.05}
          value={spacing}
          disabled={bary}
          onChange={(e) => onSpacing(e.target.value)}
          style={{ accentColor: 'var(--phosphor)', cursor: bary ? 'default' : 'pointer', width: 120 }}
        />
        <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: '3ch' }}>
          {Number(spacing).toFixed(2)}
        </span>
      </label>
      <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
        <input type="checkbox" data-testid="topology-group-tint" checked={!!tint} onChange={onToggleTint}
          style={{ accentColor: 'var(--phosphor)', cursor: 'pointer', margin: 0 }} />
        tint by group
      </label>
      <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
        <input type="checkbox" data-testid="topology-group-labels" checked={!!labels} onChange={onToggleLabels}
          style={{ accentColor: 'var(--phosphor)', cursor: 'pointer', margin: 0 }} />
        labels
      </label>
      {summary && summary.length ? (
        <span data-testid="topology-group-chips" style={{
          display: 'inline-flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        }}>
          {summary.map((s) => {
            const isFocused = focused && focused.has(s.group);
            const anyFocus = focused && focused.size > 0;
            return (
              <button
                key={s.group}
                type="button"
                data-testid={`topology-chip-${s.group}`}
                aria-pressed={isFocused}
                onClick={() => onToggleFocus(s.group)}
                title="click to isolate this group (click again to release)"
                style={{
                  font: 'inherit', fontSize: 11, cursor: 'pointer',
                  display: 'inline-flex', gap: 5, alignItems: 'center',
                  padding: '1px 7px', borderRadius: 10,
                  background: isFocused ? 'rgba(62,224,124,0.16)' : 'transparent',
                  border: `1px solid ${isFocused ? 'var(--phosphor)' : 'transparent'}`,
                  color: 'var(--phosphor-dim)',
                  opacity: anyFocus && !isFocused ? 0.45 : 1,
                }}
              >
                <span style={{
                  display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
                  background: s.color, verticalAlign: 'middle',
                }} />
                {s.group} <strong style={{ color: 'var(--phosphor)' }}>{s.count}</strong>
              </button>
            );
          })}
          {focused && focused.size > 0 ? (
            <button
              type="button"
              data-testid="topology-chip-clear"
              onClick={onClearFocus}
              style={{
                font: 'inherit', fontSize: 11, cursor: 'pointer', padding: '1px 7px',
                background: 'transparent', border: '1px solid var(--phosphor-dim)',
                borderRadius: 10, color: 'var(--phosphor-dim)',
              }}
            >clear ✕</button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function Legend({ stats, showAvatars, onToggleAvatars }) {
  if (!stats) return null;
  const { roles, bridges } = stats;
  return (
    <div data-testid="topology-legend" style={{
      display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center',
      fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none',
      marginBottom: 8, paddingBottom: 6,
      borderBottom: '1px dashed var(--phosphor-dim)',
    }}>
      <span><Dot style={ROLE_STYLE.hub} /><strong style={{ color: 'var(--phosphor)' }}>{roles.hub}</strong> hubs <span style={{ opacity: 0.6 }}>(top 5% by degree, floor 8)</span></span>
      <span><Dot style={ROLE_STYLE.default} /><strong style={{ color: 'var(--phosphor)' }}>{roles.default}</strong> connected</span>
      <span><Dot style={ROLE_STYLE.orphan} /><strong style={{ color: 'var(--phosphor)' }}>{roles.orphan}</strong> orphans <span style={{ opacity: 0.6 }}>(degree 0)</span></span>
      <span data-testid="topology-legend-bridges">
        <EdgeSwatch color={EDGE_STYLE.bridge.color} width={EDGE_STYLE.bridge.width} />
        <strong style={{ color: 'var(--phosphor)' }}>{bridges.cross}</strong> cross-pillar bridges
        <span style={{ opacity: 0.6 }}> / {bridges.total} edges</span>
      </span>
      <span data-testid="topology-legend-unsung">
        <EdgeSwatch color={EDGE_STYLE.unsung.color} width={EDGE_STYLE.unsung.width} dashed />
        <strong style={{ color: 'var(--phosphor)' }}>{stats.unsung}</strong> unsung paths
        <span style={{ opacity: 0.6 }}> (body wikilinks not in YAML)</span>
      </span>
      <label
        data-testid="topology-legend-avatars"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          data-testid="topology-avatars-toggle"
          checked={!!showAvatars}
          onChange={onToggleAvatars}
          style={{ accentColor: 'var(--phosphor)', cursor: 'pointer', margin: 0 }}
        />
        <strong style={{ color: 'var(--phosphor)' }}>{stats.avatars}</strong> avatars
        <span style={{ opacity: 0.6 }}> (bundle art)</span>
      </label>
    </div>
  );
}
