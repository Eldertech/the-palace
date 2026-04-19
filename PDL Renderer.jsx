import { useState, useEffect, useRef } from "react";

// ─── PDL Parser ────────────────────────────────────────────────────────────────
// Syntax:
//   ModuleA -> ModuleB [type]          (audio/cv/gate/pitch/trigger)
//   ModuleA -> ModuleB:PortName [type]
//   ModuleA:PortOut -> ModuleB:PortIn [type]
//   // comment
//   * ModuleName: Param = Value | Param = Value

const SIGNAL_COLORS = {
  audio:   "#f28b6e",
  cv:      "#a78bfa",
  gate:    "#6ee7b7",
  pitch:   "#60a5fa",
  trigger: "#fbbf24",
  default: "#94a3b8",
};

const SIGNAL_LABELS = {
  audio: "Audio",
  cv: "CV",
  gate: "Gate",
  pitch: "Pitch",
  trigger: "Trigger",
};

function parsePDL(text) {
  const connections = [];
  const params = {};
  const moduleSet = new Set();

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;

    // Parameter line: * Module: Key = Val | Key = Val
    if (line.startsWith("*")) {
      const match = line.match(/^\*\s*(\w[\w\s]*?):\s*(.+)$/);
      if (match) {
        const mod = match[1].trim();
        const entries = match[2].split("|").map(s => s.trim()).filter(Boolean);
        params[mod] = params[mod] || [];
        for (const e of entries) params[mod].push(e);
      }
      continue;
    }

    // Connection line: A(:port)? -> B(:port)? [type]
    const connMatch = line.match(
      /^([\w\s]+?)(?::([^->[\]]+))?\s*->\s*([\w\s]+?)(?::([^->[\]]+))?\s*(?:\[(\w+)\])?$/
    );
    if (connMatch) {
      const [, from, fromPort, to, toPort, type] = connMatch;
      const fromId = from.trim();
      const toId = to.trim();
      moduleSet.add(fromId);
      moduleSet.add(toId);
      connections.push({
        from: fromId,
        fromPort: fromPort?.trim() || null,
        to: toId,
        toPort: toPort?.trim() || null,
        type: type?.toLowerCase() || "default",
      });
    }
  }

  return { connections, params, modules: [...moduleSet] };
}

// ─── Layout ────────────────────────────────────────────────────────────────────
// Topological sort → assign columns, then rows within column

function layoutModules(modules, connections) {
  // Build adjacency
  const outEdges = {};
  const inDegree = {};
  for (const m of modules) { outEdges[m] = []; inDegree[m] = 0; }
  for (const c of connections) {
    if (!outEdges[c.from]) { outEdges[c.from] = []; inDegree[c.from] = 0; }
    if (inDegree[c.to] === undefined) inDegree[c.to] = 0;
    outEdges[c.from].push(c.to);
    inDegree[c.to]++;
  }

  // Kahn's algorithm for column assignment
  const col = {};
  const queue = modules.filter(m => (inDegree[m] || 0) === 0);
  queue.forEach(m => (col[m] = 0));

  const visited = new Set(queue);
  let head = 0;
  while (head < queue.length) {
    const m = queue[head++];
    for (const next of (outEdges[m] || [])) {
      col[next] = Math.max(col[next] || 0, (col[m] || 0) + 1);
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  // Any unvisited (cycles) get assigned col 0
  for (const m of modules) if (col[m] === undefined) col[m] = 0;

  // Group by column, sort rows
  const cols = {};
  for (const m of modules) {
    const c = col[m];
    cols[c] = cols[c] || [];
    cols[c].push(m);
  }

  const MODULE_W = 140;
  const MODULE_H = 70;
  const COL_GAP = 80;
  const ROW_GAP = 24;

  const positions = {};
  const colKeys = Object.keys(cols).map(Number).sort((a, b) => a - b);
  let x = 40;
  for (const c of colKeys) {
    const mods = cols[c];
    const totalH = mods.length * MODULE_H + (mods.length - 1) * ROW_GAP;
    let y = 40;
    for (const m of mods) {
      positions[m] = { x, y, w: MODULE_W, h: MODULE_H };
      y += MODULE_H + ROW_GAP;
    }
    x += MODULE_W + COL_GAP;
  }

  const totalW = x + 40;
  const totalH = Math.max(...Object.values(positions).map(p => p.y + p.h)) + 40;

  return { positions, totalW, totalH };
}

// ─── SVG Cable Path (cubic bezier) ────────────────────────────────────────────
function cablePath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) * 0.5 + 40;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// ─── Module Block ──────────────────────────────────────────────────────────────
function ModuleBlock({ id, x, y, w, h, params }) {
  const paramList = params[id] || [];
  return (
    <g>
      {/* Shadow */}
      <rect x={x + 3} y={y + 3} width={w} height={h} rx={8} fill="rgba(0,0,0,0.18)" />
      {/* Body */}
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#1e293b" stroke="#334155" strokeWidth={1.5} />
      {/* Header band */}
      <rect x={x} y={y} width={w} height={26} rx={8} fill="#334155" />
      <rect x={x} y={y + 18} width={w} height={8} fill="#334155" />
      {/* Module name */}
      <text x={x + w / 2} y={y + 17} textAnchor="middle" fill="#f1f5f9" fontSize={12} fontWeight="600" fontFamily="monospace">
        {id}
      </text>
      {/* Params */}
      {paramList.slice(0, 2).map((p, i) => (
        <text key={i} x={x + 8} y={y + 42 + i * 14} fill="#94a3b8" fontSize={9} fontFamily="monospace">
          {p.length > 18 ? p.slice(0, 17) + "…" : p}
        </text>
      ))}
    </g>
  );
}

// ─── Diagram ──────────────────────────────────────────────────────────────────
function Diagram({ pdl }) {
  const { connections, params, modules } = parsePDL(pdl);
  const { positions, totalW, totalH } = layoutModules(modules, connections);

  const MODULE_H = 70;

  return (
    <svg
      width={totalW}
      height={totalH}
      style={{ display: "block", background: "#0f172a", borderRadius: 12 }}
    >
      <defs>
        {Object.entries(SIGNAL_COLORS).map(([type, color]) => (
          <marker
            key={type}
            id={`arrow-${type}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill={color} />
          </marker>
        ))}
      </defs>

      {/* Cables (drawn below modules) */}
      {connections.map((c, i) => {
        const from = positions[c.from];
        const to = positions[c.to];
        if (!from || !to) return null;
        const color = SIGNAL_COLORS[c.type] || SIGNAL_COLORS.default;
        const x1 = from.x + from.w;
        const y1 = from.y + MODULE_H / 2;
        const x2 = to.x;
        const y2 = to.y + MODULE_H / 2;
        return (
          <g key={i}>
            <path
              d={cablePath(x1, y1, x2, y2)}
              stroke={color}
              strokeWidth={2.5}
              fill="none"
              strokeOpacity={0.85}
              markerEnd={`url(#arrow-${c.type})`}
            />
            {/* Port label at source */}
            {c.fromPort && (
              <text x={x1 - 4} y={y1 - 5} textAnchor="end" fill={color} fontSize={8} fontFamily="monospace" opacity={0.8}>
                {c.fromPort}
              </text>
            )}
            {/* Port label at dest */}
            {c.toPort && (
              <text x={x2 + 4} y={y2 - 5} textAnchor="start" fill={color} fontSize={8} fontFamily="monospace" opacity={0.8}>
                {c.toPort}
              </text>
            )}
          </g>
        );
      })}

      {/* Modules */}
      {modules.map(id => {
        const pos = positions[id];
        if (!pos) return null;
        return (
          <ModuleBlock key={id} id={id} x={pos.x} y={pos.y} w={pos.w} h={pos.h} params={params} />
        );
      })}

      {/* Legend */}
      <g transform={`translate(${totalW - 160}, ${totalH - 120})`}>
        <rect x={0} y={0} width={150} height={110} rx={6} fill="#1e293b" stroke="#334155" strokeWidth={1} opacity={0.9} />
        <text x={10} y={18} fill="#64748b" fontSize={9} fontFamily="monospace" fontWeight="600">SIGNAL TYPES</text>
        {Object.entries(SIGNAL_LABELS).map(([type, label], i) => (
          <g key={type} transform={`translate(10, ${30 + i * 16})`}>
            <line x1={0} y1={4} x2={20} y2={4} stroke={SIGNAL_COLORS[type]} strokeWidth={2.5} />
            <text x={26} y={8} fill={SIGNAL_COLORS[type]} fontSize={9} fontFamily="monospace">{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const DEFAULT_PDL = `// Classic Subtractive Voice
// Keyboard drives pitch and triggers the envelope
KEYBOARD -> SAW_OSC:Pitch [pitch]
KEYBOARD -> AMP_ENV:Gate [gate]

// Audio signal chain
SAW_OSC -> LPF [audio]
LPF -> AMP [audio]
AMP -> OUT [audio]

// Envelope controls amplifier level
AMP_ENV -> AMP:Level [cv]

// Module parameters
* SAW_OSC: Waveform = Saw | Tune = 0
* LPF: Cutoff = 2000Hz | Resonance = 20%
* AMP_ENV: Attack = 5ms | Decay = 200ms | Sustain = 70% | Release = 400ms`;

export default function PDLRenderer() {
  const [pdl, setPdl] = useState(DEFAULT_PDL);
  const [parseError, setParseError] = useState(null);
  const textareaRef = useRef(null);

  let diagram = null;
  try {
    diagram = <Diagram pdl={pdl} />;
    if (parseError) setParseError(null);
  } catch (e) {
    if (!parseError) setParseError(e.message);
  }

  return (
    <div style={{ fontFamily: "monospace", background: "#0a0f1e", minHeight: "100vh", color: "#f1f5f9", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9", letterSpacing: 1 }}>
          PDL — Patch Description Language
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
          Edit the spec → diagram updates live &nbsp;·&nbsp;
          <span style={{ color: SIGNAL_COLORS.audio }}>━ audio</span> &nbsp;
          <span style={{ color: SIGNAL_COLORS.pitch }}>━ pitch</span> &nbsp;
          <span style={{ color: SIGNAL_COLORS.gate }}>━ gate</span> &nbsp;
          <span style={{ color: SIGNAL_COLORS.cv }}>━ cv</span> &nbsp;
          <span style={{ color: SIGNAL_COLORS.trigger }}>━ trigger</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Editor */}
        <div style={{ flex: "0 0 340px" }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>
            Patch Spec
          </div>
          <textarea
            ref={textareaRef}
            value={pdl}
            onChange={e => setPdl(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              height: 380,
              background: "#1e293b",
              color: "#e2e8f0",
              border: parseError ? "1px solid #ef4444" : "1px solid #334155",
              borderRadius: 8,
              padding: 14,
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: "monospace",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {parseError && (
            <div style={{ color: "#ef4444", fontSize: 10, marginTop: 4 }}>{parseError}</div>
          )}
          <div style={{ marginTop: 12, fontSize: 10, color: "#475569", lineHeight: 1.8 }}>
            <div style={{ color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Syntax</div>
            <div><span style={{ color: "#94a3b8" }}>A -{">"} B [type]</span> — connection</div>
            <div><span style={{ color: "#94a3b8" }}>A -{">"} B:Port [type]</span> — named port</div>
            <div><span style={{ color: "#94a3b8" }}>* Mod: P = V | P = V</span> — parameters</div>
            <div><span style={{ color: "#94a3b8" }}>// comment</span></div>
          </div>
        </div>

        {/* Diagram */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>
            Signal Flow
          </div>
          <div style={{ overflowX: "auto" }}>
            {diagram}
          </div>
        </div>
      </div>
    </div>
  );
}
