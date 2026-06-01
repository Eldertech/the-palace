import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
} from 'd3-force';
import { Box } from '../primitives.jsx';
import { fetchTopology } from '../../adapters/topology.js';
import { assignRoles, roleCounts } from '../../lib/topology-roles.js';

// TOPOLOGY -- the typed-link graph lens. Renders the freshest
// palace-map-full-*.json as a force-directed canvas. Clicking a node
// opens that entry in STATE via onSelect(path). Gate-18 minimum bar:
// nodes + edges + click-to-open. Hubs / orphans / cross-pillar bridges /
// unsung paths are reserved for follow-up commits.

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

function prepareGraph(raw) {
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
  const nodes = assignRoles(baseNodes);
  const ids = new Set(nodes.map((n) => n.id));
  // Drop ghost edges (targets that don't exist as nodes) so d3-force doesn't
  // throw on link resolution. The map's meta.ghost_taxonomy explains them.
  const links = (raw?.edges ?? [])
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ source: e.source, target: e.target, type: e.type, label: e.label }));
  return { nodes, links };
}

export default function TopologyLens({ onSelect }) {
  const [state, setState] = useState({ kind: 'loading' });
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const graphRef = useRef(null);
  const hoverRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchTopology().then((r) => {
      if (cancelled) return;
      if (r.ok) setState({ kind: 'ok', meta: r.meta, source: r.source, raw: r });
      else setState({ kind: 'err', error: r.error ?? 'unknown error' });
    });
    return () => { cancelled = true; };
  }, []);

  // Role counts are derived from the prepared graph; we recompute here
  // (cheap) so the legend renders before the canvas useEffect mounts.
  const roleStats = useMemo(() => {
    if (state.kind !== 'ok') return null;
    const g = prepareGraph(state.raw);
    return roleCounts(g.nodes);
  }, [state]);

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

    const graph = prepareGraph(state.raw);
    graphRef.current = graph;

    const sim = forceSimulation(graph.nodes)
      .force('link', forceLink(graph.links).id((d) => d.id).distance(50).strength(0.4))
      .force('charge', forceManyBody().strength(-60))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide(NODE_RADIUS + 2));
    simRef.current = sim;

    function draw() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      // edges
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(0, 200, 80, 0.18)';
      ctx.beginPath();
      for (const l of graph.links) {
        const s = l.source; const t = l.target;
        if (!s || !t || typeof s.x !== 'number' || typeof t.x !== 'number') continue;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
      }
      ctx.stroke();
      // nodes — role-driven size + color; hover overrides both.
      for (const n of graph.nodes) {
        if (typeof n.x !== 'number') continue;
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
    }
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
        if (d < bestDist && d < 64) { // 8px hit radius
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
    };
  }, [state, onSelect]);

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
      <Legend roleStats={roleStats} />
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
            <div><strong>{hoverInfo.id}</strong></div>
            <div style={{ color: 'var(--phosphor-dim)', textShadow: 'none' }}>
              {hoverInfo.type ?? '--'} · {hoverInfo.stage ?? '--'} · degree {hoverInfo.degree} · {hoverInfo.role}
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

function Legend({ roleStats }) {
  if (!roleStats) return null;
  return (
    <div data-testid="topology-legend" style={{
      display: 'flex', gap: 18, alignItems: 'center',
      fontSize: 11, color: 'var(--phosphor-dim)', textShadow: 'none',
      marginBottom: 8, paddingBottom: 6,
      borderBottom: '1px dashed var(--phosphor-dim)',
    }}>
      <span><Dot style={ROLE_STYLE.hub} /><strong style={{ color: 'var(--phosphor)' }}>{roleStats.hub}</strong> hubs <span style={{ opacity: 0.6 }}>(top 5% by degree, floor 8)</span></span>
      <span><Dot style={ROLE_STYLE.default} /><strong style={{ color: 'var(--phosphor)' }}>{roleStats.default}</strong> connected</span>
      <span><Dot style={ROLE_STYLE.orphan} /><strong style={{ color: 'var(--phosphor)' }}>{roleStats.orphan}</strong> orphans <span style={{ opacity: 0.6 }}>(degree 0)</span></span>
    </div>
  );
}
