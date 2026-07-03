// ─────────────────────────────────────────────────────────────────────────────
// motion-skills.js — BLUELINE motion-realization registry.
//
// A grand collection of OPTIONS. Every hand-drawn frame already has motion embedded
// in it; each skill here FINDS that motion (reads a motion-intent element) and
// REALIZES it as deterministic, beat-locked ink physics over the held drawing.
// "The arrow becomes the wind" at the granularity of a single frame element.
//
// THE INVARIANT every realizer must keep: it is a PURE FUNCTION OF F.
//   realize(ctx, element, P)  where P = {F, beatPhase, accent, camX, rect, W, H}
// All motion derives from P.F / P.beatPhase / P.accent and a SEEDED prng — never
// Math.random() or Date at draw time — so drawFrame(F) is reproducible. The engine
// skips realizers entirely when motion is OFF, so a frozen panel == the held still.
// ─────────────────────────────────────────────────────────────────────────────
(function (global) {
  'use strict';

  // deterministic prng (mulberry32) — stable particle layouts across reloads
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // normalized (0..1, relative to the held image rect) → canvas pixels
  const NX = (P, x) => P.rect.x + x * P.rect.w;
  const NY = (P, y) => P.rect.y + y * P.rect.h;
  const NS = (P, s) => s * Math.min(P.rect.w, P.rect.h);
  const TWO_PI = Math.PI * 2;

  function inkStroke(ctx, pts, w0, w1, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], seg = pts.length > 2 ? i / (pts.length - 1) : 0;
      ctx.lineWidth = Math.max(0.2, w0 + (w1 - w0) * seg);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    ctx.restore();
  }
  function softPuff(ctx, x, y, r, color, alpha) {
    if (r <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
    ctx.restore();
  }

  // ── CLOUD DRIFT ────────────────────────────────────────────────────────────
  // Sky volumes drift along the wind the artist already drew. Realized as faint
  // dark wind-streaks + light highlights sliding along the wind vector, wrapping.
  function cloudDrift(ctx, el, P) {
    const reg = el.region, wind = el.wind || [1, -0.06], inten = el.intensity == null ? 1 : el.intensity;
    const n = el.count || 28, R = rng(el.seed || 101);
    const wl = Math.hypot(wind[0], wind[1]) || 1, wx = wind[0] / wl, wy = wind[1] / wl;
    const rate = 0.016 * inten;
    for (let i = 0; i < n; i++) {
      const baseF = R(), yb = R(), off = R(), spd = 0.6 + R() * 0.9;
      const t = ((P.F * rate * spd) + off) % 1;                 // life 0..1, pure in F
      const xf = (baseF + t * Math.sign(wx || 1)) % 1;          // wrapped drift fraction
      const px = NX(P, reg.x + ((xf + 1) % 1) * reg.w);
      const py = NY(P, reg.y + yb * reg.h) + wy * t * NS(P, 0.05) + Math.sin(P.F * 0.012 * spd + i) * NS(P, 0.003);
      const len = NS(P, 0.05 + R() * 0.08) * (0.6 + inten * 0.6);
      const fade = Math.sin(t * Math.PI);                        // born + die softly
      inkStroke(ctx, [[px, py], [px + wx * len, py + wy * len]], 1.5, 0.4, '#1b1d22', 0.10 * fade * inten);
      inkStroke(ctx, [[px, py - NS(P, 0.006)], [px + wx * len * 0.7, py - NS(P, 0.006) + wy * len * 0.7]], 1.1, 0.3, '#f4f1ea', 0.07 * fade * inten);
    }
  }

  // ── SMOKE RISE (also serves chimney-smoke) ──────────────────────────────────
  // A stack/fire emits; the column rises, widens, and curls into the wind. Soft
  // ink puffs advected up a buoyant, curling path; each puff a pure function of F.
  function smokeRise(ctx, el, P) {
    const base = el.base, up = el.up || [0, -1];
    const spread = el.spread == null ? 0.07 : el.spread, height = el.height == null ? 0.4 : el.height;
    const curl = el.curl == null ? 1 : el.curl, inten = el.intensity == null ? 1 : el.intensity;
    const n = el.count || 36, R = rng(el.seed || 202), tone = el.tone || 'dark';
    const ul = Math.hypot(up[0], up[1]) || 1, ux = up[0] / ul, uy = up[1] / ul;
    const px0 = NX(P, base[0]), py0 = NY(P, base[1]);
    const perpx = -uy, perpy = ux, rate = 0.012 * inten;
    const c0 = tone === 'dark' ? 'rgba(18,18,22,1)' : 'rgba(150,148,150,1)';
    const c1 = tone === 'dark' ? 'rgba(64,62,68,1)' : 'rgba(210,206,208,1)';
    for (let i = 0; i < n; i++) {
      const off = R(), seed = R() * 1000, spd = 0.7 + R() * 0.6, lat = R() * 2 - 1;
      const t = ((P.F * rate * spd) + off) % 1;                 // life 0..1, pure in F
      const climb = t * height;
      const wob = (Math.sin(t * TWO_PI * curl + seed) + lat * 0.6) * spread * t;
      let sx = px0 + ux * NS(P, climb) + perpx * NS(P, wob);
      let sy = py0 + uy * NS(P, climb) + perpy * NS(P, wob);
      if (P.mask) {                                            // POSE-AWARE: part the plume around the figure's centre-line
        const m = P.mask.at(sx, sy);
        if (m > 0.10) {
          const dir = (sx >= P.mask.cx) ? 1 : -1;              // push horizontally away from the body axis (non-zero everywhere inside)
          sx += dir * NS(P, 0.19) * m;                         // ∝ penetration → a clean left/right split
          sy -= NS(P, 0.025) * m;                              // a touch of lift so it slips up-and-around rather than stall
        }
      }
      const grow = 0.012 + t * 0.055 * (0.6 + inten * 0.6);
      const fade = Math.sin(t * Math.PI) * (0.45 + inten * 0.55);
      softPuff(ctx, sx, sy, NS(P, grow), c0, 0.17 * fade);
      softPuff(ctx, sx + perpx * NS(P, grow * 0.3), sy + perpy * NS(P, grow * 0.3), NS(P, grow * 0.55), c1, 0.10 * fade);
    }
  }

  // ── AMBIENT SHIMMER ─────────────────────────────────────────────────────────
  // The air/dust around a held subject stirs. Sparse motes rising + wavering, very
  // low amplitude — atmosphere, not overt motion.
  function ambientShimmer(ctx, el, P) {
    const reg = el.region, n = el.count || 30, R = rng(el.seed || 404), inten = el.intensity == null ? 1 : el.intensity;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const bx = R(), by = R(), ph = R() * TWO_PI, w = 0.6 + R() * 0.8, amp = 0.004 + R() * 0.006;
      const rise = (P.F * 0.004 * w) % 1;                       // slow rise + wrap, pure in F
      const x = NX(P, reg.x + bx * reg.w) + Math.sin(P.F * 0.02 * w + ph) * NS(P, amp);
      const y = NY(P, reg.y + ((by - rise + 1) % 1) * reg.h);
      const fade = 0.4 + 0.6 * Math.abs(Math.sin(P.F * 0.02 * w + ph));
      ctx.globalAlpha = 0.11 * fade * inten; ctx.fillStyle = '#cfc9be';
      ctx.beginPath(); ctx.arc(x, y, NS(P, 0.0016 + R() * 0.0016), 0, TWO_PI); ctx.fill();
    }
    ctx.restore();
  }

  // ── ACTION-LINE FLOW ────────────────────────────────────────────────────────
  // The dramatic lines the artist drew flow in their implied direction. Radial
  // streaks burst from an impact origin, the tail piercing back toward it; a
  // `bias` vector emphasises one direction (a landing → pierce DOWN); a shockwave
  // ring expands and pulses on the beat accent.
  function actionLineFlow(ctx, el, P) {
    const o = el.origin, n = el.count || 42, R = rng(el.seed || 303);
    const inten = el.intensity == null ? 1 : el.intensity, maxlen = el.length == null ? 0.55 : el.length;
    const a0 = el.arcStart == null ? 0 : el.arcStart, a1 = el.arcEnd == null ? TWO_PI : el.arcEnd;
    const bias = el.bias || null, ring = el.ring !== false;
    const ox = NX(P, o[0]), oy = NY(P, o[1]), rate = 0.05 * inten;
    for (let i = 0; i < n; i++) {
      const ang = a0 + (a1 - a0) * ((i + R() * 0.7) / n);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      let emph = 1;
      if (bias) { const bl = Math.hypot(bias[0], bias[1]) || 1; emph = 0.45 + 0.95 * Math.max(0, (dx * bias[0] + dy * bias[1]) / bl); }
      const off = R(), spd = 0.7 + R() * 0.7;
      const t = ((P.F * rate * spd) + off) % 1;                 // head travels outward, pure in F
      const head = NS(P, 0.04) + t * NS(P, maxlen) * emph;
      const len = NS(P, (0.10 + R() * 0.14) * maxlen) * emph * (0.7 + inten * 0.5);
      const hx = ox + dx * head, hy = oy + dy * head;
      const tx = hx - dx * len, ty = hy - dy * len;             // tail trails back toward origin → piercing
      const fade = Math.sin(t * Math.PI), w = (1.2 + inten * 2.4) * emph;
      inkStroke(ctx, [[tx, ty], [hx, hy]], 0.3 * w, w, '#15161a', 0.55 * fade);
      if (emph > 0.85) inkStroke(ctx, [[tx, ty], [hx, hy]], 0.2 * w, 0.6 * w, '#e0a83a', 0.22 * fade);
    }
    if (ring) {                                                 // shockwave — expands across the beat, pulses on the accent
      const rr = NS(P, 0.05 + maxlen * 0.55 * (P.beatPhase % 1));
      const k = 1 + P.accent * 0.8;
      ctx.save();
      ctx.globalAlpha = 0.30 * P.accent + 0.07; ctx.strokeStyle = '#e0a83a'; ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.arc(ox, oy, rr * k, 0, TWO_PI); ctx.stroke();
      ctx.restore();
    }
  }

  // ── FLAME-SWAY — warp the EXISTING ink (NO new layer): displace the drawn flame/smoke lines with a
  //    slow, fire-like sway, re-sampled from the held raster itself (P.src). Horizontal strips of the
  //    SOURCE drawing are shifted by a slow field — the lines the artist drew are what moves. Anchored
  //    at the base (the horizon doesn't seam); sways most at the tips. Pure function of F. ──
  function flameSway(ctx, el, P){
    if(!P.src) return;
    const rx=NX(P,el.region.x), ry=NY(P,el.region.y), rw=el.region.w*P.rect.w, rh=el.region.h*P.rect.h;
    const n=el.slices||64;
    const ampX=NS(P, el.ampX==null?0.016:el.ampX), ampY=NS(P, el.ampY==null?0.008:el.ampY);
    const waves=el.waves==null?1.7:el.waves, speed=el.speed==null?0.010:el.speed;   // speed is deliberately SLOW
    for(let k=0;k<n;k++){
      const f=k/n, sy=ry+rh*f, sh=rh/n+1.4;
      const env=(el.anchor==='top')?f:(1-f);            // sway grows toward the tips (default: anchored at base/horizon)
      const dx=ampX*env*(Math.sin(f*waves*TWO_PI + P.F*speed) + 0.5*Math.sin(P.F*speed*0.43 + f*2.3));
      const dy=ampY*env*Math.sin(f*waves*0.6*TWO_PI + P.F*speed*0.8);
      ctx.drawImage(P.src, rx, sy-dy, rw, sh, rx+dx, sy, rw, sh);   // shift the existing pixels — no new ink
    }
  }

  // ── the registry — the open catalogue (add members freely) ──────────────────
  const REG = {
    'cloud-drift': cloudDrift,
    'smoke-rise': smokeRise,
    'chimney-smoke': smokeRise,
    'pose-aware-flow': smokeRise,        // smoke that flows AROUND the skeleton (deflects on P.mask)
    'ambient-shimmer': ambientShimmer,
    'action-line-flow': actionLineFlow,
    'flame-sway': flameSway              // WARP: moves the EXISTING drawn lines (no new layer)
  };
  // WARP solvers manipulate the held drawing in place (sample P.src); OVERLAY solvers add ink on top.
  const WARP = { 'flame-sway': true };
  const META = {
    'cloud-drift':     { finds: 'sky volumes drift on the drawn wind',          fails: 'hard-edged shapes' },
    'smoke-rise':      { finds: 'a stack/fire emits, rises, curls',             fails: 'wind unauthored' },
    'chimney-smoke':   { finds: 'a thin column rises off a stack',              fails: 'wind unauthored' },
    'pose-aware-flow': { finds: 'a plume that rises and parts AROUND the figure', fails: 'occluded/ambiguous silhouette' },
    'ambient-shimmer': { finds: 'air/dust stirs around a held subject',         fails: 'asked to be overt' },
    'action-line-flow':{ finds: 'drawn dramatic lines flow + pierce, pulse',    fails: 'no clear vector' },
    'flame-sway':      { finds: 'the EXISTING flame/smoke lines sway, slowly',  fails: 'rigid/architectural lines (smear)' }
  };

  global.MotionSkills = {
    KINDS: Object.keys(REG),
    META,
    isWarp: function (kind) { return !!WARP[kind]; },
    realize: function (kind, ctx, el, P) { const fn = REG[kind]; if (fn) fn(ctx, el, P); }
  };
})(typeof window !== 'undefined' ? window : this);
