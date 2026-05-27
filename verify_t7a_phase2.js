#!/usr/bin/env node
// verify_t7a_phase2.js — Node harness for T7a phase 2 (perceptual parameter
// vocabulary). Mirrors the pure-JS resolver+sampler in PDL Renderer.html so
// the emission path can be exercised without a browser.
//
// Assertions:
//   1. `* VCF: FREQ = dark` emits 0.275 (midpoint of [0.15, 0.4])
//   2. `* VCF: CUTOFF = dark` resolves via the FREQ alias to the same 0.275
//   3. The resolved key is the canonical `FREQ`, not the alias
//   4. Numeric literals (`* VCF: FREQ = 0.42`) pass through unchanged
//   5. Unknown region (`FREQ = chartreuse`) warns and falls back (no value set)
//   6. Determinism — two runs of identical PDL produce byte-identical results
//   7. VCF.RES, ADSR.{A,D,S,R} regions resolve to their documented midpoints
//   8. Downstream params[] for VCF has params[0].value = 0.275 after CUTOFF=dark

const fs   = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(__dirname, "vcv_fundamental_registry.json");
const REGISTRY_DATA = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
const REGISTRY      = REGISTRY_DATA.modules;

// ─── Ports of helpers from PDL Renderer.html ─────────────────────────────────

function resolveParamSpec(modReg, name) {
  const params = (modReg && modReg.params) || [];
  for (const spec of params) {
    if (spec.name === name) return spec;
    if (Array.isArray(spec.aliases) && spec.aliases.includes(name)) return spec;
  }
  return null;
}

function sampleRegion(spec, regionName, pos) {
  const region = spec && spec.regions && spec.regions[regionName];
  if (!region) return null;
  const [lo, hi] = region;
  const p = (pos == null) ? 0.5 : pos;
  const v = lo + (hi - lo) * p;
  const [rmin, rmax] = spec.range;
  return Math.min(rmax, Math.max(rmin, v));
}

// Minimal parser: enough for `@INST = Module` and `* INST: A = X | B = Y`.
// Comments (`// ...`) are stripped per the renderer's parser fix (2026-04-19).
function parsePDL(text) {
  const instanceTypes = {};
  const params = {};
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const cIdx = line.indexOf("//");
    if (cIdx >= 0) line = line.slice(0, cIdx);
    line = line.trim();
    if (!line) continue;
    if (line.startsWith("@")) {
      const m = line.match(/^@\s*([\w\s\/]+?)\s*=\s*(\w+)\s*$/);
      if (m) instanceTypes[m[1].trim()] = m[2].trim();
      continue;
    }
    if (line.startsWith("*")) {
      const rest = line.slice(1).trim();
      const colonIdx = rest.indexOf(":");
      if (colonIdx < 0) continue;
      const inst = rest.slice(0, colonIdx).trim();
      const body = rest.slice(colonIdx + 1).trim();
      const entries = body.split("|").map(e => e.trim()).filter(Boolean)
        .map(e => ({ entry: e, lineNumber: i + 1 }));
      if (!params[inst]) params[inst] = [];
      params[inst].push(...entries);
    }
  }
  return { instanceTypes, params };
}

// Port of the param-resolution branch inside emitVcvJson.
function resolveParams(pdlParams, instanceTypes) {
  const resolvedParams = {};
  const warnings = [];
  for (const [instId, entries] of Object.entries(pdlParams || {})) {
    resolvedParams[instId] = {};
    const modType = instanceTypes[instId];
    const modReg  = modType && REGISTRY[modType];
    if (!modReg) {
      const firstLine = entries[0]?.lineNumber ?? null;
      warnings.push({
        source: "emitter", lineNumber: firstLine, instId,
        reason: `undeclared instance "${instId}"`,
      });
      continue;
    }
    for (const { entry, lineNumber } of entries) {
      const eqIdx = entry.indexOf("=");
      if (eqIdx < 0) {
        warnings.push({ source: "emitter", lineNumber, content: `* ${instId}: ${entry}`,
          reason: `param entry missing "=": "${entry}"` });
        continue;
      }
      const name   = entry.slice(0, eqIdx).trim();
      const rawVal = entry.slice(eqIdx + 1).trim();

      const spec = resolveParamSpec(modReg, name);
      if (!spec) {
        const known = (modReg.params || []).map(p => p.name).join(", ") || "<none>";
        warnings.push({ source: "emitter", lineNumber, content: `* ${instId}: ${entry}`,
          reason: `param "${name}" is not in registry for ${modType} (known: ${known})` });
        continue;
      }

      const num = rawVal === "" ? NaN : Number(rawVal);
      if (Number.isFinite(num)) {
        resolvedParams[instId][spec.name] = num;
        continue;
      }

      const sampled = sampleRegion(spec, rawVal);
      if (sampled != null) {
        resolvedParams[instId][spec.name] = sampled;
        continue;
      }

      const known = spec.regions ? Object.keys(spec.regions).join(", ") : "<none>";
      warnings.push({ source: "emitter", lineNumber, content: `* ${instId}: ${entry}`,
        reason: `param "${name}" value "${rawVal}" is not a finite number or known region (known regions for ${spec.name}: ${known}) — falling back to registry default` });
    }
  }
  return { resolvedParams, warnings };
}

// Downstream params[] shape, matching the modules-array build step.
function paramsArrayFor(modType, pvals) {
  const mod = REGISTRY[modType];
  return (mod.params || []).map(p => ({
    id: p.index,
    value: Object.prototype.hasOwnProperty.call(pvals, p.name)
      ? pvals[p.name]
      : (p.default ?? 0),
  }));
}

function run(pdl) {
  const { instanceTypes, params } = parsePDL(pdl);
  return resolveParams(params, instanceTypes);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ok   ${msg}`); }
  else      { fail++; console.log(`  FAIL ${msg}`); }
}
function approx(a, b, eps = 1e-9) { return Math.abs(a - b) < eps; }

console.log(`T7a phase 2 — registry v${REGISTRY_DATA.version}`);

// 1. canonical region name
{
  const { resolvedParams, warnings } = run("@FILT = VCF\n* FILT: FREQ = dark");
  assert(approx(resolvedParams.FILT.FREQ, 0.275),
    `* FILT: FREQ = dark → 0.275 (got ${resolvedParams.FILT.FREQ})`);
  assert(warnings.length === 0, `no warnings on canonical region (got ${warnings.length})`);
}

// 2. alias resolution
{
  const { resolvedParams, warnings } = run("@FILT = VCF\n* FILT: CUTOFF = dark");
  assert(approx(resolvedParams.FILT.FREQ, 0.275),
    `* FILT: CUTOFF = dark → FREQ=0.275 via alias (got ${resolvedParams.FILT.FREQ})`);
  assert(!("CUTOFF" in resolvedParams.FILT),
    "resolved key is canonical FREQ, not alias CUTOFF");
  assert(warnings.length === 0, "no warnings on alias resolution");
}

// 3. numeric literal pass-through
{
  const { resolvedParams, warnings } = run("@FILT = VCF\n* FILT: FREQ = 0.42");
  assert(resolvedParams.FILT.FREQ === 0.42,
    `* FILT: FREQ = 0.42 → 0.42 (got ${resolvedParams.FILT.FREQ})`);
  assert(warnings.length === 0, "no warnings on numeric literal");
}

// 4. unknown region warns + is NOT recorded (caller will fall back to default)
{
  const { resolvedParams, warnings } = run("@FILT = VCF\n* FILT: FREQ = chartreuse");
  assert(!("FREQ" in (resolvedParams.FILT || {})),
    "unknown region 'chartreuse' is not recorded");
  assert(warnings.length === 1, `one warning fired (got ${warnings.length})`);
  assert(warnings[0].reason.includes("chartreuse"),
    "warning mentions the offending value");
  assert(warnings[0].reason.includes("known regions for FREQ"),
    "warning mentions the canonical param name 'FREQ', not the alias");
}

// 5. determinism: two runs byte-identical
{
  const pdl = "@FILT = VCF\n* FILT: FREQ = dark | RES = vocal";
  const a = JSON.stringify(run(pdl));
  const b = JSON.stringify(run(pdl));
  assert(a === b, "two runs of identical PDL produce byte-identical results");
}

// 6. VCF.RES regions
{
  const { resolvedParams } = run("@FILT = VCF\n* FILT: RES = vocal");
  assert(approx(resolvedParams.FILT.RES, 0.65),
    `* FILT: RES = vocal → 0.65 (got ${resolvedParams.FILT.RES})`);
}

// 7. ADSR.{A,D,S,R} regions
{
  const { resolvedParams } = run("@ENV = ADSR\n* ENV: A = pluck | D = snappy | S = full | R = ambient");
  assert(approx(resolvedParams.ENV.A, 0.2),    `ADSR A=pluck → 0.2 (got ${resolvedParams.ENV.A})`);
  assert(approx(resolvedParams.ENV.D, 0.1),    `ADSR D=snappy → 0.1 (got ${resolvedParams.ENV.D})`);
  assert(approx(resolvedParams.ENV.S, 0.875),  `ADSR S=full → 0.875 (got ${resolvedParams.ENV.S})`);
  assert(approx(resolvedParams.ENV.R, 0.95),   `ADSR R=ambient → 0.95 (got ${resolvedParams.ENV.R})`);
}

// 8. downstream params[] reflects alias-resolved value
{
  const { resolvedParams } = run("@FILT = VCF\n* FILT: CUTOFF = dark");
  const out = paramsArrayFor("VCF", resolvedParams.FILT);
  const freqEntry = out.find(e => e.id === 0);
  assert(approx(freqEntry.value, 0.275),
    `downstream .vcv params[0] (FREQ) = 0.275 after CUTOFF=dark (got ${freqEntry.value})`);
}

// 9. legacy: unknown param name still warns as before
{
  const { resolvedParams, warnings } = run("@FILT = VCF\n* FILT: NONESUCH = 0.5");
  assert(!("NONESUCH" in (resolvedParams.FILT || {})), "unknown param not recorded");
  assert(warnings.length === 1 && warnings[0].reason.includes("not in registry"),
    "unknown param produces the existing 'not in registry' warning");
}

// 10. boundary: bright region midpoint = 0.875 (top region)
{
  const { resolvedParams } = run("@FILT = VCF\n* FILT: FREQ = bright");
  assert(approx(resolvedParams.FILT.FREQ, 0.875),
    `* FILT: FREQ = bright → 0.875 (got ${resolvedParams.FILT.FREQ})`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
