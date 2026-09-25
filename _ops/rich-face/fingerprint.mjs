// fingerprint.mjs — read an entry's section fingerprints; stamp a manifest.
//
//   node fingerprint.mjs "Kuramoto Coupling"              list sections, fingerprints, drift
//   node fingerprint.mjs "Kuramoto Coupling" --stamp      stamp every manifest section with the text as it is now
//   node fingerprint.mjs "Kuramoto Coupling" --stamp "The Fine-Tuning Insight"
//                                                          re-stamp one section — the "still true" verdict
//
// Uses parse.js, the same code the page runs, so a stamp written here is the
// stamp the page compares against. Writes only the manifest, never the entry.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEntry, sectionProse, sectionKey, fingerprint } from './parse.js';
import { findEntry } from './palace-find.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const [name, flag, ...only] = process.argv.slice(2);
if (!name) { console.error('usage: node fingerprint.mjs "<Entry>" [--stamp [section …]]'); process.exit(2); }

const mdPath = findEntry(name);
if (!mdPath) { console.error(`no entry named "${name}"`); process.exit(1); }
const title = mdPath.split('/').pop().replace(/\.md$/, '');
const bundle = mdPath.replace(/\.md$/, '');
const manifestPath = [join(bundle, `${title} — rich.json`), join(HERE, 'manifests', `${title} — rich.json`)].find(existsSync);

const entry = parseEntry(readFileSync(mdPath, 'utf8'));
const fps = new Map();
for (const s of entry.sections) fps.set(s.key, { heading: s.heading, fp: await fingerprint(sectionProse(s)) });

const manifest = manifestPath ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
const bySection = new Map((manifest?.sections || []).map((m) => [sectionKey(m.heading), m]));

if (flag === '--stamp') {
  if (!manifest) { console.error('no manifest to stamp'); process.exit(1); }
  const want = new Set(only.map(sectionKey));
  const today = new Date().toLocaleDateString('en-CA');   // local date, YYYY-MM-DD
  let n = 0;
  for (const m of manifest.sections) {
    const k = sectionKey(m.heading);
    if (want.size && !want.has(k)) continue;
    const cur = fps.get(k);
    if (!cur) { console.log(`  skip  "${m.heading}" — the text has no such heading (lost its place)`); continue; }
    if (m.made_against !== cur.fp) { m.made_against = cur.fp; m.stamped = today; n++; console.log(`  stamp "${m.heading}" → ${cur.fp}`); }
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${n} section(s) stamped in ${manifestPath.replace(HERE + '/', '')}`);
} else {
  for (const [k, { heading, fp }] of fps) {
    const m = bySection.get(k);
    const state = !m ? '' : !m.made_against ? '  (unstamped)' : m.made_against === fp ? '  in step' : `  ◐ drifted (stamped ${m.made_against})`;
    console.log(`${fp}  ${heading}${m ? `  · ${m.pieces.length} piece(s)` : ''}${state}`);
  }
  const byFp = new Map([...fps.values()].map((v) => [v.fp, v.heading]));
  for (const [k, m] of bySection) {
    if (fps.has(k)) continue;
    const renamed = m.made_against && byFp.get(m.made_against);
    console.log(`   lost   ${m.heading}  · ${m.pieces.length} piece(s) — heading gone${renamed ? `; same words now under "${renamed}" (probably a rename)` : ''}`);
  }
}
