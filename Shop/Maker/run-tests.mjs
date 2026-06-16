// run-tests.mjs — the Shop's first real test harness.
//
// Every Specialist declares a test-plan, but until now only host-capability had
// an executable test; the rest were prose. This runner makes the suites *run*:
// for each Specialist it (1) gates on the host-capability check — skip-with-reason
// when the wrapped tool isn't reachable on the dispatching host — and (2) runs a
// registered smoke if one is wired, recording an honest pass/fail. Specialists
// whose smoke isn't auto-wired (heavy local renders, interactive-only, cloud) are
// reported as such, never silently counted as passing.
//
// Run:   node Shop/Maker/run-tests.mjs
//        node Shop/Maker/run-tests.mjs --write-back --date 2026-06-16
//          (updates last_tested: on the entries whose smoke passed this run)
//
// Coverage is deliberately partial and self-reported (see SUMMARY). Wiring more
// smokes is a one-line addition to SMOKES below — that is the growth path.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check, detectHost, loadManifest } from './host-capability-check.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));      // …/Shop/Maker
const SHOP = path.dirname(HERE);
const PALACE = path.dirname(SHOP);
const WEBSMOKE = path.join(HERE, 'web-smoke.mjs');
const args = process.argv.slice(2);
const WRITE_BACK = args.includes('--write-back');
const DATE = (args[args.indexOf('--date') + 1] || '').match(/^\d{4}-\d{2}-\d{2}$/)
  ? args[args.indexOf('--date') + 1] : null;

// --- smoke probes (each returns {ok, detail}) ---------------------------------
function run(tool, argv, opts = {}) {
  const r = spawnSync(tool, argv, { cwd: PALACE, encoding: 'utf8', timeout: 120000, ...opts });
  return r;
}
function have(tool, probe = ['--version']) {
  const r = run(tool, probe);
  return !r.error && (r.status === 0 || r.status === 1); // some tools exit 1 on --version
}
function webSmoke(html) {
  if (!fs.existsSync(path.join(PALACE, html))) return { ok: false, detail: `missing input ${html}` };
  const r = run('node', ['--experimental-vm-modules', WEBSMOKE, html]);
  return { ok: r.status === 0, detail: (r.stdout || r.stderr || '').trim().split('\n').pop() };
}
function ffmpegSmoke() {
  if (!have('ffmpeg', ['-version'])) return { ok: false, detail: 'ffmpeg not installed' };
  const out = path.join(os.tmpdir(), 'shop_ffmpeg_smoke.mp4');
  const enc = run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi',
    '-i', 'testsrc=duration=1:size=320x240:rate=15', '-t', '1', out]);
  if (enc.status !== 0) return { ok: false, detail: 'encode failed' };
  const dec = run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-']);
  try { fs.unlinkSync(out); } catch {}
  return { ok: dec.status === 0, detail: dec.status === 0 ? 'encode+decode ok' : 'decode failed' };
}
function mplSmoke() {
  if (!have('python3', ['-c', 'import matplotlib'])) return { ok: false, detail: 'matplotlib not available' };
  const out = path.join(os.tmpdir(), 'shop_mpl_smoke.png');
  const code = `import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt;plt.plot([0,1,2],[0,1,4]);plt.savefig(${JSON.stringify(out)});print('ok')`;
  const r = run('python3', ['-c', code]);
  try { fs.unlinkSync(out); } catch {}
  return { ok: r.status === 0 && /ok/.test(r.stdout || ''), detail: r.status === 0 ? 'figure rendered' : (r.stderr || '').trim().split('\n').pop() };
}

// title -> smoke fn. Add a line here to wire a new Specialist's smoke.
const SMOKES = {
  'p5.js': () => webSmoke('Flocking/flocking-p5-expressive.html'),
  'D3.js': () => webSmoke('Flocking/flocking-d3-interactive-control.html'),
  'Observable Plot': () => webSmoke('Flocking/flocking-observable-plot-graphite.html'),
  'Tone.js': () => webSmoke('Kuramoto Coupling/two-oscillators-coupling-explorer-audio.html'),
  'ffmpeg': ffmpegSmoke,
  'Matplotlib': mplSmoke,
};

// --- roster scan (same membership source as build-roster) ---------------------
function specialists() {
  return fs.readdirSync(SHOP).filter((f) => f.endsWith('.md')).flatMap((f) => {
    const t = fs.readFileSync(path.join(SHOP, f), 'utf8');
    if (!t.startsWith('---')) return [];
    const fm = t.slice(3, t.indexOf('\n---', 3));
    if (!/^type:[ \t]*specialist[ \t]*$/m.test(fm)) return [];
    return [{ file: f, title: (fm.match(/^title:[ \t]*(.+)$/m) || [, f.replace(/\.md$/, '')])[1].trim(),
              status: (fm.match(/^status:[ \t]*(.+)$/m) || [, '?'])[1].trim() }];
  });
}

// --- run ----------------------------------------------------------------------
const host = detectHost();
const manifest = loadManifest();
const results = [];
for (const s of specialists().sort((a, b) => a.title.localeCompare(b.title))) {
  const reach = check(s.title, { host, manifest });
  let row = { specialist: s.title, status: s.status, host, reachable: reach.reachable, via: reach.via || null };
  if (!reach.reachable) {
    row.result = 'skip'; row.detail = `unreachable on '${host}'${reach.fallback ? `; fallback ${reach.fallback}` : ''}`;
  } else if (SMOKES[s.title]) {
    const r = SMOKES[s.title]();
    row.result = r.ok ? 'pass' : 'fail'; row.detail = r.detail;
  } else {
    row.result = 'not-wired'; row.detail = 'reachable; no auto-smoke wired (heavy/interactive — runs by hand)';
  }
  results.push(row);
}

// harness self-test: the host-capability suite itself
const selfTest = run('node', ['--test', path.join(HERE, 'host-capability-check.test.js')]);
const selfOk = selfTest.status === 0;

// --- report -------------------------------------------------------------------
const w = Math.max(...results.map((r) => r.specialist.length), 12);
const pad = (s) => s.padEnd(w);
const mark = { pass: 'PASS ', fail: 'FAIL ', skip: 'skip ', 'not-wired': '·    ' };
console.log(`Shop test run — host '${host}'\n`);
for (const r of results) console.log(`  ${mark[r.result]} ${pad(r.specialist)}  ${r.detail}`);
const tally = results.reduce((a, r) => ((a[r.result] = (a[r.result] || 0) + 1), a), {});
console.log(`\n  harness self-test (host-capability): ${selfOk ? 'PASS' : 'FAIL'}`);
console.log(`\nSUMMARY: ${tally.pass || 0} passed · ${tally.fail || 0} failed · ${tally.skip || 0} skipped(unreachable) · ${tally['not-wired'] || 0} reachable-but-not-wired  (of ${results.length} Specialists)`);

const report = { host, date: DATE, self_test_host_capability: selfOk, summary: tally, results };
fs.writeFileSync(path.join(HERE, 'test-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`\nWrote Shop/Maker/test-results.json`);

// --- optional write-back of last_tested for passed smokes ---------------------
if (WRITE_BACK) {
  if (!DATE) { console.error('--write-back requires --date YYYY-MM-DD'); process.exit(2); }
  let n = 0;
  for (const r of results.filter((x) => x.result === 'pass')) {
    const file = path.join(SHOP, specialists().find((s) => s.title === r.specialist).file);
    const txt = fs.readFileSync(file, 'utf8');
    if (/^last_tested:[ \t]*.+$/m.test(txt)) {
      fs.writeFileSync(file, txt.replace(/^last_tested:[ \t]*.+$/m, `last_tested: ${DATE}`));
      n++;
    }
  }
  console.log(`Write-back: updated last_tested: ${DATE} on ${n} passing Specialist entr${n === 1 ? 'y' : 'ies'}.`);
}

process.exit(results.some((r) => r.result === 'fail') || !selfOk ? 1 : 0);
