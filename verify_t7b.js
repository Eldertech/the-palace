#!/usr/bin/env node
// verify_t7b.js — Node harness for T7b (archetype library + seeded resolver).
// Mirrors archetypeHash / resolveArchetype and the emit-time precedence merge in
// PDL Renderer.html so the resolution path can be exercised without a browser.
// Same approach as verify_t7a_phase2.js: a pure-JS mirror, run with `node`.
//
// Assertions:
//   1. All 8 archetypes resolve on a happy-path PDL each, zero warnings
//   2. kick: VCO.FREQ in `sub`, ADSR.{A,D,S,R} sample inside their declared regions
//   3. copy constraint: AMP_ENV.D === PITCH_ENV.D, byte-identical
//   4. determinism: two runs of identical PDL → byte-identical resolved params
//   5. seed variance: different seed → different values, all still within regions
//   6. precedence: explicit `* AMP_ENV: D = 0.9` overrides the archetype
//   7. missing required role warns + does not crash
//   8. unknown archetype name warns through the same channel, with a line number
//   9. explicit {role=INST} binding resolves unconventional instance names

const fs   = require("fs");
const path = require("path");

const REGISTRY_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "vcv_fundamental_registry.json"), "utf8"));
const REGISTRY      = REGISTRY_DATA.modules;
const ARCH_DATA     = JSON.parse(fs.readFileSync(path.join(__dirname, "archetypes.json"), "utf8"));
const ARCHETYPES    = ARCH_DATA.archetypes;
const ROLE_CONV     = ARCH_DATA.role_conventions;

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

function clampToParam(modReg, name, v) {
  const spec = resolveParamSpec(modReg, name);
  if (!spec || !spec.range) return v;
  return Math.min(spec.range[1], Math.max(spec.range[0], v));
}

// Deterministic position in [0,1) from (seed, archetype, instance, param).
// xmur3-style string hash → uint32 → normalized. Order- and window-independent:
// the value for a given (seed, archetype, instance, param) never depends on what
// else was resolved, so the same seed always yields the same .vcv.
function archetypeHash(seed, archetypeName, instId, paramName) {
  const str = seed + ":" + archetypeName + ":" + instId + ":" + paramName;
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function inferRole(instId) {
  return ROLE_CONV[instId.toUpperCase()] || null;
}

function resolveArchetype(archDef, archetypeName, seed, instanceTypes, bindings) {
  const out = {};
  const warnings = [];
  const roles    = (archDef.topology && archDef.topology.roles) || {};
  const required = (archDef.topology && archDef.topology.required) || [];
  const roleToInst = {};

  // 1. explicit bindings win
  for (const [role, inst] of Object.entries(bindings || {})) {
    if (instanceTypes[inst]) roleToInst[role] = inst;
    else warnings.push({ source: "archetype", reason: `archetype "${archetypeName}" binding ${role}=${inst} but "${inst}" is not a declared instance` });
  }
  // 2. convention inference for unbound roles (name → role, type must match)
  for (const role of Object.keys(roles)) {
    if (roleToInst[role]) continue;
    for (const [inst, type] of Object.entries(instanceTypes)) {
      if (inferRole(inst) === role && type === roles[role] && !Object.values(roleToInst).includes(inst)) {
        roleToInst[role] = inst;
        break;
      }
    }
  }
  // 3. required roles present?
  for (const role of required) {
    if (!roleToInst[role]) {
      warnings.push({ source: "archetype", reason: `archetype "${archetypeName}" requires role "${role}" (${roles[role]}) but no matching instance was found — its params are skipped` });
    }
  }
  // 4. sample params
  for (const [role, paramMap] of Object.entries(archDef.params || {})) {
    const inst = roleToInst[role];
    if (!inst) continue;
    const modReg = REGISTRY[instanceTypes[inst]];
    out[inst] = out[inst] || {};
    for (const [pname, regionName] of Object.entries(paramMap)) {
      const spec = resolveParamSpec(modReg, pname);
      if (!spec) {
        warnings.push({ source: "archetype", reason: `archetype "${archetypeName}" role ${role}: param "${pname}" not in registry for ${instanceTypes[inst]}` });
        continue;
      }
      const pos = archetypeHash(seed, archetypeName, inst, spec.name);
      const val = sampleRegion(spec, regionName, pos);
      if (val == null) {
        const known = spec.regions ? Object.keys(spec.regions).join(", ") : "<none>";
        warnings.push({ source: "archetype", reason: `archetype "${archetypeName}" role ${role}: region "${regionName}" unknown for ${spec.name} (known: ${known})` });
        continue;
      }
      out[inst][spec.name] = val;
    }
  }
  // 5. constraints (after the per-param sampling pass, in declaration order)
  for (const c of (archDef.constraints || [])) {
    const from = (c.from || "").split(".");
    const to   = (c.to   || "").split(".");
    const fromInst = roleToInst[from[0]];
    const toInst   = roleToInst[to[0]];
    if (!fromInst || !toInst) continue;
    const fromVal = out[fromInst] && out[fromInst][from[1]];
    if (fromVal == null) continue;
    out[toInst] = out[toInst] || {};
    let v = fromVal;
    if (c.kind === "offset")           v = fromVal + (c.delta  || 0);
    else if (c.kind === "proportional") v = fromVal * (c.factor || 1);
    out[toInst][to[1]] = clampToParam(REGISTRY[instanceTypes[toInst]], to[1], v);
  }
  return { params: out, warnings };
}

// Minimal parser: `@INST = Module`, `# archetype: name {role=INST} #seed=N`,
// and `* INST: A = X | B = Y`. Comments (`// ...`) stripped per the renderer.
function parsePDL(text) {
  const instanceTypes = {};
  const params = {};
  const archetypes = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\/\/.*$/, "").trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      const m = line.match(/^#\s*archetype\s*:\s*([A-Za-z0-9_]+)\s*(\{[^}]*\})?\s*(?:#\s*seed\s*=\s*(-?\d+))?\s*$/);
      if (m) {
        const bindings = {};
        if (m[2]) m[2].slice(1, -1).split(",").map(s => s.trim()).filter(Boolean).forEach(pair => {
          const [role, inst] = pair.split("=").map(x => x.trim());
          if (role && inst) bindings[role] = inst;
        });
        archetypes.push({ name: m[1], bindings, seed: m[3] != null ? parseInt(m[3], 10) : 0, lineNumber: i + 1 });
      }
      continue;
    }
    if (line.startsWith("@")) {
      const m = line.match(/^@([\w\s]+?)\s*=\s*(\w+)\s*$/);
      if (m && REGISTRY[m[2].trim()]) instanceTypes[m[1].trim()] = m[2].trim();
      continue;
    }
    if (line.startsWith("*")) {
      const m = line.match(/^\*\s*([\w\s]+?):\s*(.+)$/);
      if (m) {
        const inst = m[1].trim();
        params[inst] = params[inst] || [];
        m[2].split("|").map(s => s.trim()).filter(Boolean).forEach(e => params[inst].push({ entry: e, lineNumber: i + 1 }));
      }
    }
  }
  return { instanceTypes, params, archetypes };
}

// Mirror of emitVcvJson's resolution + precedence merge:
//   archetype overlay first (lower precedence) → explicit `*` lines overwrite.
function resolve(pdl) {
  const { instanceTypes, params, archetypes } = parsePDL(pdl);
  const warnings = [];
  const resolvedParams = {};

  for (const a of archetypes) {
    const def = ARCHETYPES[a.name];
    if (!def) {
      warnings.push({ source: "emitter", lineNumber: a.lineNumber, reason: `unknown archetype "${a.name}" (known: ${Object.keys(ARCHETYPES).join(", ")})` });
      continue;
    }
    const { params: ap, warnings: aw } = resolveArchetype(def, a.name, a.seed, instanceTypes, a.bindings);
    aw.forEach(w => warnings.push({ ...w, lineNumber: a.lineNumber }));
    for (const [inst, pmap] of Object.entries(ap)) {
      resolvedParams[inst] = resolvedParams[inst] || {};
      Object.assign(resolvedParams[inst], pmap);
    }
  }

  for (const [inst, entries] of Object.entries(params)) {
    resolvedParams[inst] = resolvedParams[inst] || {};
    const modReg = REGISTRY[instanceTypes[inst]];
    if (!modReg) { warnings.push({ source: "emitter", reason: `undeclared instance "${inst}"` }); continue; }
    for (const { entry, lineNumber } of entries) {
      const eq = entry.indexOf("=");
      if (eq < 0) { warnings.push({ source: "emitter", lineNumber, reason: `missing "=" in "${entry}"` }); continue; }
      const name = entry.slice(0, eq).trim(), raw = entry.slice(eq + 1).trim();
      const spec = resolveParamSpec(modReg, name);
      if (!spec) { warnings.push({ source: "emitter", lineNumber, reason: `param "${name}" not in registry for ${instanceTypes[inst]}` }); continue; }
      const num = raw === "" ? NaN : Number(raw);
      if (Number.isFinite(num)) { resolvedParams[inst][spec.name] = num; continue; }
      const s = sampleRegion(spec, raw);
      if (s != null) { resolvedParams[inst][spec.name] = s; continue; }
      warnings.push({ source: "emitter", lineNumber, reason: `value "${raw}" for "${name}" is not finite or a known region` });
    }
  }
  return { resolvedParams, warnings, instanceTypes };
}

// Is `value` inside the named region (clamped to the param's native range)?
function inRegion(modType, paramName, regionName, value) {
  const spec = resolveParamSpec(REGISTRY[modType], paramName);
  if (!spec || !spec.regions || !spec.regions[regionName]) return false;
  let [lo, hi] = spec.regions[regionName];
  const [rmin, rmax] = spec.range;
  lo = Math.min(rmax, Math.max(rmin, lo));
  hi = Math.min(rmax, Math.max(rmin, hi));
  return value >= Math.min(lo, hi) - 1e-9 && value <= Math.max(lo, hi) + 1e-9;
}

// ─── Happy-path PDL per archetype (conventional instance names) ───────────────
const HAPPY = {
  kick:        "@AMP_ENV = ADSR\n@PITCH_ENV = ADSR\n@OSC = VCO\n@AMP = VCA\n# archetype: kick",
  sub_bass:    "@OSC = VCO\n@FILT = VCF\n@AMP_ENV = ADSR\n@AMP = VCA\n# archetype: sub_bass",
  warm_pad:    "@OSC = VCO\n@FILT = VCF\n@AMP_ENV = ADSR\n@LFO = LFO\n@AMP = VCA\n# archetype: warm_pad",
  pluck:       "@OSC = VCO\n@FILT = VCF\n@AMP_ENV = ADSR\n@AMP = VCA\n# archetype: pluck",
  bright_lead: "@OSC = VCO\n@FILT = VCF\n@AMP_ENV = ADSR\n@AMP = VCA\n# archetype: bright_lead",
  acid_lead:   "@OSC = VCO\n@FILT = VCF\n@AMP_ENV = ADSR\n@AMP = VCA\n# archetype: acid_lead",
  stab:        "@OSC = VCO\n@FILT = VCF\n@AMP_ENV = ADSR\n@AMP = VCA\n# archetype: stab",
  drone:       "@OSC = VCO\n@FILT = VCF\n@LFO = LFO\n@AMP = VCA\n# archetype: drone",
};

// ─── Tests ───────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ok   ${msg}`); }
  else      { fail++; console.log(`  FAIL ${msg}`); }
}

console.log(`T7b — archetypes v${ARCH_DATA.version}, registry v${REGISTRY_DATA.version}`);

// 1. every archetype resolves clean on its happy path
for (const name of Object.keys(ARCHETYPES)) {
  const { warnings } = resolve(HAPPY[name]);
  assert(warnings.length === 0, `${name}: happy-path resolves with zero warnings (got ${warnings.length}${warnings.length ? " — " + warnings[0].reason : ""})`);
}

// 2. kick regions
{
  const { resolvedParams } = resolve(HAPPY.kick);
  assert(inRegion("VCO", "FREQ", "sub", resolvedParams.OSC.FREQ), `kick VCO.FREQ in sub region (got ${resolvedParams.OSC.FREQ})`);
  assert(inRegion("ADSR", "A", "instant", resolvedParams.AMP_ENV.A), `kick AMP_ENV.A in instant region (got ${resolvedParams.AMP_ENV.A})`);
  assert(inRegion("ADSR", "S", "plucked", resolvedParams.AMP_ENV.S), `kick AMP_ENV.S in plucked region (got ${resolvedParams.AMP_ENV.S})`);
  assert(inRegion("ADSR", "R", "gated", resolvedParams.AMP_ENV.R), `kick AMP_ENV.R in gated region (got ${resolvedParams.AMP_ENV.R})`);
}

// 3. copy constraint: AMP_ENV.D === PITCH_ENV.D byte-identical
{
  const { resolvedParams } = resolve(HAPPY.kick);
  assert(resolvedParams.AMP_ENV.D === resolvedParams.PITCH_ENV.D,
    `kick copy: AMP_ENV.D === PITCH_ENV.D (${resolvedParams.AMP_ENV.D} vs ${resolvedParams.PITCH_ENV.D})`);
}

// 4. determinism
{
  const a = JSON.stringify(resolve(HAPPY.warm_pad).resolvedParams);
  const b = JSON.stringify(resolve(HAPPY.warm_pad).resolvedParams);
  assert(a === b, "determinism: two runs byte-identical");
}

// 5. seed variance, still in-region
{
  const s1 = resolve("@AMP_ENV = ADSR\n@PITCH_ENV = ADSR\n@OSC = VCO\n@AMP = VCA\n# archetype: kick #seed=1").resolvedParams;
  const s2 = resolve("@AMP_ENV = ADSR\n@PITCH_ENV = ADSR\n@OSC = VCO\n@AMP = VCA\n# archetype: kick #seed=2").resolvedParams;
  assert(JSON.stringify(s1) !== JSON.stringify(s2), "seed 1 vs 2 produce different values");
  assert(inRegion("VCO", "FREQ", "sub", s1.OSC.FREQ) && inRegion("VCO", "FREQ", "sub", s2.OSC.FREQ),
    "both seeds keep VCO.FREQ inside sub region (variance is bounded)");
}

// 6. precedence: explicit * overrides archetype
{
  const { resolvedParams } = resolve("@AMP_ENV = ADSR\n@PITCH_ENV = ADSR\n@OSC = VCO\n@AMP = VCA\n# archetype: kick\n* AMP_ENV: D = 0.9");
  assert(resolvedParams.AMP_ENV.D === 0.9, `explicit * AMP_ENV: D = 0.9 overrides archetype (got ${resolvedParams.AMP_ENV.D})`);
}

// 7. missing required role warns, no crash
{
  const { resolvedParams, warnings } = resolve("@AMP_ENV = ADSR\n@PITCH_ENV = ADSR\n@OSC = VCO\n# archetype: kick");
  assert(warnings.some(w => /requires role "amp"/.test(w.reason)), "missing VCA warns about required role amp");
  assert(resolvedParams.OSC && inRegion("VCO", "FREQ", "sub", resolvedParams.OSC.FREQ), "other params still resolve when a required role is missing");
}

// 8. unknown archetype warns with a line number
{
  const { warnings } = resolve("@OSC = VCO\n# archetype: nonesuch");
  const w = warnings.find(x => /unknown archetype "nonesuch"/.test(x.reason));
  assert(!!w, "unknown archetype warns");
  assert(w && w.lineNumber === 2, `unknown-archetype warning carries the line number (got ${w && w.lineNumber})`);
}

// 9. explicit binding resolves unconventional instance names
{
  const pdl = "@E1 = ADSR\n@E2 = ADSR\n@SAWOSC = VCO\n@OUTAMP = VCA\n# archetype: kick {amp_env=E1, pitch_env=E2, vco=SAWOSC, amp=OUTAMP}";
  const { resolvedParams, warnings } = resolve(pdl);
  assert(warnings.length === 0, `explicit binding resolves clean (got ${warnings.length}${warnings.length ? " — " + warnings[0].reason : ""})`);
  assert(resolvedParams.E1 && resolvedParams.E1.D === resolvedParams.E2.D, "bound roles honor the copy constraint");
}

// 10. region coverage on two more archetypes
{
  const acid = resolve(HAPPY.acid_lead).resolvedParams;
  assert(inRegion("VCF", "RES", "screaming", acid.FILT.RES), `acid_lead FILT.RES in screaming region (got ${acid.FILT.RES})`);
  const pad = resolve(HAPPY.warm_pad).resolvedParams;
  assert(inRegion("ADSR", "A", "pad", pad.AMP_ENV.A), `warm_pad AMP_ENV.A in pad region (got ${pad.AMP_ENV.A})`);
  assert(inRegion("LFO", "FREQ", "subtle", pad.LFO.FREQ), `warm_pad LFO.FREQ in subtle region (got ${pad.LFO.FREQ})`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
