// Runs the page's own replayFrame() (the main-thread half of the replay view)
// headless: pulls the function out of the page, feeds it a recording the
// worklet made under run_worklet.mjs, and asks it for 60 screen frames a
// second, the way requestAnimationFrame would on a 60 Hz display.
//
// usage: node replay_probe.mjs <index.html> <rec.replay.f32> <slow_s> <seconds> <out.f32>
import fs from 'node:fs';

const [,, htmlPath, recPath, slowS, secondsS, outPath] = process.argv;
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/function replayFrame\([\s\S]*?\n}\n/);
if (!m) throw new Error('no replayFrame in ' + htmlPath);
const VIS_N = 180;
const replayFrame = new Function('VIS_N', m[0] + '\nreturn replayFrame;')(VIS_N);

const meta = JSON.parse(fs.readFileSync(recPath.replace(/\.f32$/, '.json'), 'utf8'));
const rec = new Float32Array(fs.readFileSync(recPath).buffer.slice(0));
const slow = +slowS, frames = Math.round(+secondsS * 60);
const out = new Float32Array(frames * VIS_N), row = new Float32Array(VIS_N), pos = [];
for (let j = 0; j < frames; j++) {
  pos.push(replayFrame(rec, meta.rows, meta.period, slow, j / 60, row));
  out.set(row, j * VIS_N);
}
fs.writeFileSync(outPath, Buffer.from(out.buffer));
fs.writeFileSync(outPath + '.json', JSON.stringify({ frames, positions: pos, ...meta }));
console.log(JSON.stringify({ frames, rows: meta.rows, period: meta.period }));
