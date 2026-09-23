// Runs the *shipped* study-v1 AudioWorklet code headless in node — not a port.
// Extracts the <script id="worklet-src"> block from an index.html, shims the
// three things an AudioWorkletGlobalScope provides (AudioWorkletProcessor,
// registerProcessor, sampleRate), then drives it with a score of port
// messages, 128 samples per process() call, exactly as a browser would.
//
// usage: node run_worklet.mjs <index.html> <score.json> <out.f32> [vis.f32]
import fs from 'node:fs';

const [,, htmlPath, scorePath, outPath, visPath] = process.argv;
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/<script id="worklet-src" type="text\/plain">([\s\S]*?)<\/script>/);
if (!m) throw new Error('no worklet-src block in ' + htmlPath);
const score = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
const SR = score.sampleRate ?? 48000;

let Proc = null;
const visFrames = [];
class AudioWorkletProcessor {
  constructor() {
    this.port = { onmessage: null, postMessage: (d) => { if (d.type === 'wave' && !score.probeEvery) visFrames.push(d.data); } };
  }
}
const registerProcessor = (_name, cls) => { Proc = cls; };
new Function('AudioWorkletProcessor', 'registerProcessor', 'sampleRate', m[1])(
  AudioWorkletProcessor, registerProcessor, SR);

const node = new Proc();
const send = (data) => node.port.onmessage({ data });
const total = Math.round(score.seconds * SR);
const out = new Float32Array(total);
const B = score.blockSize ?? 128;          // browsers use 128; the probe uses small blocks
const block = new Float32Array(B);
const events = [...score.events].sort((a, b) => a.t - b.t);
let ei = 0;
for (let s = 0; s < total; s += B) {
  while (ei < events.length && events[ei].t * SR <= s) send(events[ei++].msg);
  node.process([], [[block]]);
  if (score.probeEvery && s % score.probeEvery === 0 && s / SR < (score.probeSeconds ?? 1)) {
    // Full-rate look at the string itself: r[n] + l[n] across the whole rail.
    const len = node.len, row = new Float32Array(180);
    for (let i = 0; i < 180; i++) {
      const si = Math.min(len - 1, Math.floor(i * len / 180));
      row[i] = node.rBuf[(node.p + si) % len] + node.lBuf[(node.q + si) % len];
    }
    visFrames.push(row);
  }
  out.set(block.subarray(0, Math.min(B, total - s)), s);
}
fs.writeFileSync(outPath, Buffer.from(out.buffer));
if (visPath) {
  const n = visFrames.length ? visFrames[0].length : 0;
  const v = new Float32Array(visFrames.length * n);
  visFrames.forEach((f, i) => v.set(f, i * n));
  fs.writeFileSync(visPath, Buffer.from(v.buffer));
  fs.writeFileSync(visPath + '.json', JSON.stringify({ frames: visFrames.length, points: n }));
}
console.log(JSON.stringify({ samples: total, visFrames: visFrames.length }));
