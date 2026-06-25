import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
} from 'd3-force';
import { Box } from '../primitives.jsx';
import { fetchTopology, fetchUnsungPaths } from '../../adapters/topology.js';
import { assignRoles, roleCounts } from '../../lib/topology-roles.js';
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

export default function TopologyLens({ onSelect, entries = [] }) {
  const [state, setState] = useState({ kind: 'loading' });
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const graphRef = useRef(null);
  const hoverRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);
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

  // Build the path -> pillars Set lookup once per entries fetch. Stable
  // across lens-switches so we don't re-walk on hover repaints.
  const pillarsByPath = useMemo(() => buildPillarsByPath(entries), [entries]);
  // Path -> bundle-icon lookup, same lifecycle as pillarsByPath.
  const iconByPath = useMemo(() => buildIconByPath(entries), [entries]);

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

    const sim = forceSimulation(graph.nodes)
      .force('link', forceLink(graph.links).id((d) => d.id).distance(50).strength(0.4))
      .force('charge', forceManyBody().strength(-60))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide((d) => (
        d.icon ? avatarRadiusFor(d.role) : (ROLE_STYLE[d.role]?.radius ?? ROLE_STYLE.default.radius)
      ) + 2));
    simRef.current = sim;

    function draw() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      // edges -- three passes, painted bottom-up so the most-ratified
      // layer sits on top:
      //   1. unsung paths (dashed cyan undercoat — the prose's hint)
      //   2. typed default (green tissue — the YAML's ratification)
      //   3. cross-pillar bridges (amber — the rhizome's reaches)
      const us = EDGE_STYLE.unsung;
      ctx.lineWidth = us.width;
      ctx.strokeStyle = us.color;
      ctx.setLineDash(us.dash);
      ctx.beginPath();
      for (const l of graph.unsungLinks ?? []) {
        const s = l.source; const t = l.target;
        if (!s || !t || typeof s.x !== 'number' || typeof t.x !== 'number') continue;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      for (const kind of ['default', 'bridge']) {
        const style = EDGE_STYLE[kind];
        ctx.lineWidth = style.width;
        ctx.strokeStyle = style.color;
        ctx.beginPath();
        for (const l of graph.links) {
          if (!!l.crossPillar !== (kind === 'bridge')) continue;
          const s = l.source; const t = l.target;
          if (!s || !t || typeof s.x !== 'number' || typeof t.x !== 'number') continue;
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
        }
        ctx.stroke();
      }
      // dots — role-driven size + color; hover overrides both. Nodes whose
      // avatar art is ready get skipped here and painted in the avatar pass.
      for (const n of graph.nodes) {
        if (typeof n.x !== 'number') continue;
        if (isAvatarNode(n)) continue;
        const isHover = hoverRef.current && hoverRef.current.id === n.id;
        const style = ROLE_STYLE[n.role] ?? ROLE_STYLE.default;
        const r = isHover ? HOVER_RADIUS : style.radius;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? HOVER_FILL : style.fill;
        ctx.fill();
        const ringColor = isHover ? HOVER_RING : style.ring;
        if (ringColor) {
          ctx.lineWidth = isHover ? 1.5 : 1;
          ctx.strokeStyle = ringColor;
          ctx.stroke();
        }
      }
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
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, n.x - r, n.y - r, r * 2, r * 2);
        ctx.restore();
      }
      ctx.filter = 'none';
      for (const n of graph.nodes) {
        if (typeof n.x !== 'number' || !isAvatarNode(n)) continue;
        const isHover = hoverRef.current && hoverRef.current.id === n.id;
        const r = avatarRadiusFor(n.role) + (isHover ? 4 : 0);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.lineWidth = isHover ? 2 : 1.25;
        ctx.strokeStyle = isHover ? HOVER_RING : (AVATAR_RING[n.role] ?? AVATAR_RING.default);
        ctx.stroke();
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
      if (n !== hoverRef.current) {
        hoverRef.current = n;
        setHoverInfo(n ? {
          id: n.id, type: n.type, stage: n.stage, degree: n.degree, role: n.role, path: n.path,
          pillars: n.pillars ? [...n.pillars] : [],
          icon: n.icon ?? null,
        } : null);
        // re-draw immediately so hover feedback isn't tied to sim tick
        draw();
      }
      canvas.style.cursor = n ? 'pointer' : 'default';
    }

    function handleClick(ev) {
      const n = nodeAt(ev.clientX, ev.clientY);
      if (n && n.path && typeof onSelect === 'function') onSelect(n.path);
    }

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMove);
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
      <div style={{ position: 'relative' }}>
        <canvas
          data-testid="topology-canvas"
          ref={canvasRef}
          style={{ display: 'block', background: 'var(--terminal-black)' }}
        />
        {hoverInfo ? (
          <div data-testid="topology-hover" style={{
            position: 'absolute', left: 8, bottom: 8,
            background: 'rgba(0,0,0,0.7)', border: '1px dashed var(--phosphor-dim)',
            padding: '4px 8px', fontSize: 11, color: 'var(--phosphor)',
            textShadow: 'var(--glow)', pointerEvents: 'none', maxWidth: '60ch',
          }}>
            {hoverInfo.icon ? (
              <img
                src={`/api/file?path=${encodeURIComponent(hoverInfo.icon)}`}
                alt=""
                width={32}
                height={32}
                style={{
                  float: 'right', marginLeft: 8, borderRadius: '50%',
                  border: '1px solid var(--phosphor-dim)', objectFit: 'cover',
                  filter: 'saturate(0.85) brightness(0.92)',
                }}
              />
            ) : null}
            <div><strong>{hoverInfo.id}</strong></div>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
              {hoverInfo.type ?? '--'} · {hoverInfo.stage ?? '--'} · degree {hoverInfo.degree} · {hoverInfo.role}
            </div>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
              pillars: {hoverInfo.pillars.length ? hoverInfo.pillars.join(' / ') : '--'}
            </div>
          </div>
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

function EdgeSwatch({ color, width, dashed }) {
  return (
    <span style={{
      display: 'inline-block', width: 16, height: 0, marginRight: 6, verticalAlign: 'middle',
      borderTop: `${Math.max(1, width * 2)}px ${dashed ? 'dashed' : 'solid'} ${color}`,
    }} />
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
