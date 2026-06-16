#!/usr/bin/env node
// T6 emitter-oracle — judges generated PDL by running the REAL emitVcvJson from
// PDL Renderer.html. Reads agent output (the CANDIDATE/```pdl fenced format the
// prompt mandates) from a file arg or stdin, extracts every candidate, emits each
// through the real pipeline, and reports a per-candidate verdict + a per-input
// distinctness check. No self-grading — the emitter is the oracle.
//
// Lives in this Specialist's bundle (relocated 2026-06-16 from the gitignored
// _tools/; git is now its home). Reads `PDL Renderer.html` from the palace root,
// two levels up from this bundle. The grading prompt is [[PDL Generation Prompt]];
// sample runs are in ./t6-runs/.
//
// Usage:  node "Shop/VCV Patch Generator/t6-oracle.js" <agent-output-file> [<label>]
//         cat output.txt | node "Shop/VCV Patch Generator/t6-oracle.js"

const fs   = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");   // bundle is <root>/Shop/VCV Patch Generator/
const html = fs.readFileSync(path.join(ROOT, "PDL Renderer.html"), "utf8");

function between(s, a, b) { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); return s.slice(i + a.length, j); }
const regText  = between(html, '<script type="application/json" id="vcv-registry">', "</script>").trim();
const archText = between(html, '<script type="application/json" id="archetypes">', "</script>").trim();
const REG = JSON.parse(regText).modules;
const ARCH = JSON.parse(archText).archetypes;
const bs = html.indexOf('<script type="text/babel">'); const body = html.indexOf(">", bs) + 1;
const code = html.slice(body, html.indexOf("// ─── Port Map", body));
const docShim = { getElementById: (id) => ({ textContent: id === "vcv-registry" ? regText : id === "archetypes" ? archText : "{}" }) };
const { emitVcvJson, parsePDL } = new Function("document", "React", code + "\n return { emitVcvJson, parsePDL };")(docShim, { useState: () => [undefined, () => {}] });

// Extract candidates: each "=== CANDIDATE: name ===" followed by a ```pdl ... ``` block.
function extractCandidates(text) {
  const out = [];
  const re = /===\s*CANDIDATE:\s*(.+?)\s*===([\s\S]*?)```pdl\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    // Skip the grammar-spec placeholder template (literal "<short name>" etc.).
    if (/^<.*>$/.test(name) || /<the complete PDL block>/.test(m[3])) continue;
    out.push({ name, rationale: m[2].trim().split("\n").map(s=>s.trim()).filter(Boolean)[0] || "", pdl: m[3].trim() });
  }
  // Fallback: bare ```pdl blocks with no CANDIDATE header.
  if (out.length === 0) {
    const re2 = /```pdl\s*\n([\s\S]*?)```/g;
    let i = 0;
    while ((m = re2.exec(text)) !== null) out.push({ name: "candidate-" + (++i), rationale: "", pdl: m[1].trim() });
  }
  return out;
}

// Topology signature for distinctness: sorted module-type multiset + sorted
// registered cable set (by resolved port) + applied archetype names.
function signature(pdl) {
  const parsed = parsePDL(pdl);
  const types = Object.values(parsed.instanceTypes).sort();
  const cables = (parsed.connections || [])
    .filter(c => parsed.instanceTypes[c.from] && parsed.instanceTypes[c.to])
    .map(c => `${parsed.instanceTypes[c.from]}:${c.fromPort}->${parsed.instanceTypes[c.to]}:${c.toPort}`)
    .sort();
  const arch = (parsed.archetypes || []).map(a => a.name).sort();
  return JSON.stringify({ types, cables, arch });
}

function judge(cand) {
  let res;
  try { res = emitVcvJson(cand.pdl); }
  catch (e) { return { ok: false, fatal: String(e && e.message || e), checks: [] }; }
  const parsed = parsePDL(cand.pdl);
  const usedTypes = Object.values(parsed.instanceTypes);
  const archNames = (parsed.archetypes || []).map(a => a.name);
  const unknownArch = archNames.filter(n => !ARCH[n]);
  const reachesOut = (parsed.connections || []).some(c => c.to === "OUT");

  // recommended-cable warnings come through the emitter's amber channel
  const recWarn = res.warnings.filter(w => /recommends a cable/.test(w.reason));

  const checks = [
    ["parses: 0 warnings", res.warnings.length === 0, res.warnings.map(w => w.reason).join(" | ")],
    ["0 skipped cables", res.skipped.length === 0, res.skipped.map(s => s.line).join(" | ")],
    ["only registry modules", usedTypes.every(t => REG[t]), usedTypes.filter(t => !REG[t]).join(", ")],
    ["applies an archetype", archNames.length > 0 && unknownArch.length === 0, unknownArch.length ? "unknown: " + unknownArch.join(",") : "(none applied)"],
    ["recommended cables present", recWarn.length === 0, recWarn.map(w => w.reason.split("—")[0].trim()).join(" | ")],
    ["reaches OUT", reachesOut, reachesOut ? "" : "no cable into OUT"],
  ];
  const ok = checks.every(c => c[1]);
  return { ok, checks, modules: res.patch.modules.length, cables: res.patch.cables.length, archNames, sig: signature(cand.pdl) };
}

const input = process.argv[2] && fs.existsSync(process.argv[2])
  ? fs.readFileSync(process.argv[2], "utf8")
  : fs.readFileSync(0, "utf8");
const label = process.argv[3] || (process.argv[2] || "stdin");

const cands = extractCandidates(input);
console.log(`\n######## ${label} — ${cands.length} candidate(s) ########`);
let allPass = cands.length > 0;
const sigs = new Set();
for (const c of cands) {
  const v = judge(c);
  allPass = allPass && v.ok;
  console.log(`\n  ── ${c.name} ──  ${v.ok ? "PASS" : "FAIL"}${v.fatal ? " (fatal: " + v.fatal + ")" : ""}`);
  if (c.rationale) console.log(`     rationale: ${c.rationale}`);
  if (!v.fatal) {
    console.log(`     modules=${v.modules} cables=${v.cables} archetype=${v.archNames.join(",") || "—"}`);
    for (const [name, pass, detail] of v.checks) console.log(`       ${pass ? "ok  " : "FAIL"} ${name}${pass || !detail ? "" : "  →  " + detail}`);
    if (v.sig) sigs.add(v.sig);
  }
}
const distinct = sigs.size;
console.log(`\n  distinct topologies among candidates: ${distinct} (need ≥2)`);
const inputPass = allPass && distinct >= 2;
console.log(`  ${label}: ${inputPass ? "PASS" : "FAIL"} (all candidates clean: ${allPass}; ≥2 distinct: ${distinct >= 2})`);
process.exit(inputPass ? 0 : 1);
