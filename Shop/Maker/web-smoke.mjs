// Shared smoke probe for web-Specialist HTML artifacts (p5.js, D3.js,
// Observable Plot, Tone.js). Extracts inline <script> blocks, syntax-checks
// them via Node's vm module. Pass = no SyntaxError raised.
//
// Run:  node --experimental-vm-modules Shop/Maker/web-smoke.mjs <path-to-html>
// Exit: 0 if all inline scripts parse; 1 otherwise.
//
// This is a *parse-time* smoke, not a runtime smoke — it can't catch missing
// CDN libs or DOM access at runtime. Pair with the Specialist's own runtime
// verification (open in a browser; check console for errors) for full coverage.

import fs from 'node:fs';
import vm from 'node:vm';

const file = process.argv[2];
if (!file) {
  console.error('usage: node web-smoke.mjs <html-file>');
  process.exit(2);
}

const html = fs.readFileSync(file, 'utf8');

// Use *? not +? so a self-closing <script src=...></script> (empty body)
// doesn't glue together with the next inline script's body via the lazy
// match. The src= filter then drops any tag that actually loads an external
// script.
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m => !/\bsrc\s*=/.test(m[1]))
  .filter(m => m[2].trim().length > 0)
  .map(m => ({
    isModule: /\btype\s*=\s*["']module["']/i.test(m[1]),
    src: m[2],
  }));

if (!scripts.length) {
  console.log('NO inline scripts to check');
  process.exit(0);
}

let ok = 0, fail = 0;
for (const [i, s] of scripts.entries()) {
  try {
    if (s.isModule) new vm.SourceTextModule(s.src);
    else new vm.Script(s.src);
    ok++;
  } catch (err) {
    fail++;
    console.error(`  script[${i}] ${s.isModule ? 'module' : 'classic'}: ${err.message.split('\n')[0]}`);
  }
}
console.log(`smoke: ${ok} ok, ${fail} fail (${scripts.length} inline ${scripts.length === 1 ? 'script' : 'scripts'})`);
process.exit(fail ? 1 : 0);
