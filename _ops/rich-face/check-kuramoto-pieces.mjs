// check-kuramoto-pieces.mjs — re-run the physics claims of Kuramoto Coupling's
// rich-face pieces, headless, on the pieces' own code.
//
//   node _ops/rich-face/check-kuramoto-pieces.mjs        (~1 minute)
//
// Each interactive piece carries its AudioWorklet processor as a string
// (`const WORKLET = \`…\`;`). This pulls that exact source out of the HTML, runs
// it with a stubbed AudioWorkletProcessor at 48 kHz, and checks the numbers the
// pieces' captions and the entry claim. It prints PASS/FAIL per claim and exits
// non-zero on any FAIL. It reads the pieces; it writes nothing.
//
// The pattern generalizes: to check a new piece, copy makeProc() and write the
// claims its caption makes (README § Making pieces — "Test the claim headless").

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const piece = (q) => join(ROOT, 'Kuramoto Coupling', `Kuramoto Coupling — rich — ${q}.html`);

export function makeProc(htmlPath) {
  const src = readFileSync(htmlPath, 'utf8').match(/const WORKLET = `([\s\S]*?)`;/)[1];
  let Cls;
  class AWP { constructor() { this.port = { onmessage: null, postMessage: (m) => { this.lastMsg = m; } }; } }
  new Function('AudioWorkletProcessor', 'registerProcessor', 'sampleRate', src)(AWP, (_n, C) => { Cls = C; }, 48000);
  const p = new Cls();
  p.send = (d) => p.port.onmessage({ data: d });
  p.run = (sec) => {
    const L = new Float32Array(128), R = new Float32Array(128);
    let peak = 0, nan = false;
    for (let b = 0; b < Math.round((sec * 48000) / 128); b++) {
      p.process([], [[L, R]]);
      for (const v of L) { if (!Number.isFinite(v)) nan = true; peak = Math.max(peak, Math.abs(v)); }
    }
    return { peak, nan, msg: p.lastMsg };
  };
  return p;
}

let fails = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (${detail})`); if (!ok) fails++; };
const spread = (f) => Math.max(...f) - Math.min(...f);

// ── ensemble: 24 voices, uniform spread ±γ → K_c = 4γ/π ─────────────────────
{
  const N = 24, om = (c, g) => Array.from({ length: N }, (_, i) => c + g * (2 * (i + 0.5) / N - 1));
  for (const [mode, c, g, sec] of [['pitch', 220, 2, 6], ['pulse', 1.2, 0.12, 40]]) {
    const Kc = (4 * g) / Math.PI;
    for (const [ratio, expectLock] of [[0.79, false], [1.1, true]]) {
      const p = makeProc(piece('ensemble'));
      p.send({ omegaHz: om(c, g), K: ratio * Kc, mode, gain: mode === 'pitch' ? 0.9 : 5, clickHz: Array(N).fill(1500), scatter: true });
      const out = p.run(sec), s = spread(Array.from(out.msg.freq));
      const ok = expectLock ? s < 0.05 && out.msg.r > 0.8 : s > 0.1;
      check(`ensemble ${mode}: K = ${ratio}·K_c ${expectLock ? 'locks' : 'drifts'}`, ok && !out.nan && out.peak <= 1,
        `pitch spread ${s.toFixed(3)} Hz, |R| ${out.msg.r.toFixed(2)}, peak ${out.peak.toFixed(2)}`);
    }
  }
}

// ── stubbornness: anchor + 6 followers; settle point = Σ(ks/kr)·ω / Σ(ks/kr) ──
{
  const F = 6, om = [223, ...Array.from({ length: F }, (_, i) => 220 + 1.5 * (2 * (i + 0.5) / F - 1))];
  const run = (ks, kr0, K) => {
    const p = makeProc(piece('stubbornness'));
    p.send({ omegaHz: om, K, mode: 'pitch', gain: 0.9, scatter: true, kr: [kr0, 1, 1, 1, 1, 1, 1], ks: [ks, 1, 1, 1, 1, 1, 1], voice: [0.35, 0, 0, 0, 0, 0, 0] });
    const f = Array.from(p.run(8).msg.freq), fol = f.slice(1);
    return { anchor: f[0], group: fol.reduce((a, b) => a + b) / F };
  };
  const settle = (ks, kr0) => { const w = [ks / kr0, 1, 1, 1, 1, 1, 1]; return om.reduce((a, o, i) => a + w[i] * o, 0) / w.reduce((a, b) => a + b); };
  let r = run(1, 1, 8);
  check('stubbornness: symmetric crowd settles at the plain average', Math.abs(r.group - settle(1, 1)) < 0.02, `group ${r.group.toFixed(3)}, predicted ${settle(1, 1).toFixed(3)}`);
  r = run(1, 0.5, 8);
  check('stubbornness: settle point is the K_send/K_receive-weighted average', Math.abs(r.group - settle(1, 0.5)) < 0.02, `group ${r.group.toFixed(3)}, predicted ${settle(1, 0.5).toFixed(3)}`);
  r = run(1, 0, 8);
  check('stubbornness: K_receive = 0 with K_send = 1 does NOT capture the followers', Math.abs(r.group - 223) > 1, `anchor ${r.anchor.toFixed(3)}, followers ${r.group.toFixed(3)}`);
  r = run(4, 0, 8);
  check('stubbornness: K_receive = 0 with K_send = 4 captures them at the anchor', Math.abs(r.group - 223) < 0.02, `anchor ${r.anchor.toFixed(3)}, followers ${r.group.toFixed(3)}`);
}

// ── waveform locking (Path B): locks at m:1 when |Δf| ≤ K·b_m/2 ─────────────
{
  const WAVES = { sine: (k) => (k === 1 ? 1 : 0), saw: (k) => 1 / k, square: (k) => (k % 2 ? 1 / k : 0) };
  const cents = 12, f1 = 110;
  const drift = (w, m, K) => {
    const p = makeProc(piece('waveform-locking'));
    p.send({ b: Array.from({ length: 17 }, (_, k) => (k ? WAVES[w](k) : 0)), m, K, cents, f1 });
    p.run(5);                       // settle from a random starting phase
    return p.run(1).msg.drift;       // the piece's own 0.5 s drift average
  };
  const df = (m) => m * f1 * (2 ** (cents / 1200) - 1);
  const need = (w, m) => (2 * df(m)) / WAVES[w](m);
  const LOCKED = 0.06; // Hz — the piece's own "locked" line
  let d = drift('saw', 2, 0.8 * need('saw', 2));
  check('Path B: saw, octave, K = 0.8·threshold still beats', Math.abs(d) > 0.3, `drift ${d.toFixed(3)} Hz`);
  d = drift('saw', 2, 1.2 * need('saw', 2));
  check('Path B: saw, octave, K = 1.2·threshold locks', Math.abs(d) < LOCKED, `drift ${d.toFixed(3)} Hz`);
  d = drift('square', 2, 24);
  check('Path B: square, octave, never locks on the slider (K = 24)', Math.abs(d) > 0.3, `drift ${d.toFixed(3)} Hz`);
  d = drift('sine', 2, 24);
  check('Path B: sine, octave, never locks on the slider (K = 24)', Math.abs(d) > 0.3, `drift ${d.toFixed(3)} Hz`);
  d = drift('square', 3, 1.2 * need('square', 3));
  check('Path B: square, twelfth, K = 1.2·threshold locks', Math.abs(d) < LOCKED, `drift ${d.toFixed(3)} Hz`);
}

console.log(fails ? `\n${fails} claim(s) FAILED` : '\nall claims hold');
process.exit(fails ? 1 : 0);
