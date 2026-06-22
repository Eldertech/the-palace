// weave-generate.js — the GENERATION step of the vector_tuning audit.
//
// The detection types (promote_unsung / promote_hub) emit from a pure SCAN:
// a threshold over the graph, no judgement. vector_tuning is the first
// GENERATIVE type — it needs taste. So this is the one piece that crosses the
// line: it reads ONE entry against its body and asks a model to propose a
// sharper forward_vector, per the palace's "conatus, not stasis" discipline
// (SCHEMA §3, [[Entry Conatus]]). The proposal it feeds into is still shaped by
// the pure builder (weave-propose.js) and applied by the shipped `set-vector`
// op — generation is the only new machinery; the spine is unchanged.
//
// The model call is a SYNCHRONOUS headless `claude -p` capture (Path 2, no API
// key), the same worker mechanism the actuator / companion / steward lanes use,
// here in request/response form rather than fire-and-forget. The spawn is
// injectable (`runImpl`) so unit tests never hit a real model; the default
// runImpl also honors a WEAVE_VT_GENERATE_STUB env var so the CLI — which runs
// as its own subprocess — stays deterministic under integration test.

import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';
import { readEntry } from '../src/lib/entries.js';
import { findEntryFile } from '../../orchestrator/src/entry-paths.js';

// Capability-first: forward-vector tuning is taste-bound, so default to the most
// capable current Opus. The *exact* id, not the `opus` alias — on Claude Code
// v2.1.x that alias resolves to opus-4.7-low-effort (the launch.js calibration);
// the exact id gets the intended model. Override via the CLI --model flag.
export const DEFAULT_MODEL = 'claude-opus-4-8';

// Keep the body the model reads bounded so token cost is predictable on a long
// entry; truncation is announced in the prompt so the model knows it saw a head.
const MAX_BODY_CHARS = 8000;

/** The real (non-stub) synchronous worker argv — a headless one-shot `claude -p`. */
export function generateArgv(prompt, model) {
  return ['claude', '-p', prompt, '--model', model || DEFAULT_MODEL, '--permission-mode', 'bypassPermissions'];
}

// Default run: honor a stub env var (deterministic CLI integration tests), else
// spawn the real headless worker and capture its stdout. Synchronous on purpose
// — the runner wants the proposed vector back in hand to build the proposal.
function defaultRun(argv) {
  const stub = process.env.WEAVE_VT_GENERATE_STUB;
  if (stub != null) return stub;
  return execFileSync(argv[0], argv.slice(1), {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    timeout: 180_000, // a tuning is one short generation; 3 min is generous
  });
}

/**
 * The generation prompt: the forward_vector discipline + the entry to tune.
 * Pure + exported so a test can assert what the model is asked. Asks for a
 * single JSON object so the reply is machine-readable.
 */
export function buildGenerationPrompt({ title, currentVector, body }) {
  const v = currentVector && String(currentVector).trim() ? String(currentVector).trim() : '(none yet)';
  const raw = typeof body === 'string' ? body : '';
  const trimmed = raw.length > MAX_BODY_CHARS;
  const shown = trimmed ? raw.slice(0, MAX_BODY_CHARS) : raw;
  return [
    `You are tuning the \`forward_vector\` of ONE palace entry: "${title}".`,
    '',
    'A forward_vector is a single first-person sentence naming the entry\'s directional desire — its articulated *conatus* (see [[Entry Conatus]], SCHEMA §3). The discipline, "conatus, not stasis":',
    '- Avoid stasis-verbs (remain, stay, continue, be) — "I will remain X" is the failure mode.',
    '- Reach for verbs of striving (teach, spawn, integrate, cast, refuse, hunger-for); name the hunger.',
    '- Mature vectors carry more than direction: teaching to give, ancestry they grew from, awareness of their own obsolescence, a named open question.',
    '- Stay first-person and ONE line. Ground it in what THIS entry actually is — read the body below; do not invent content the entry does not contain.',
    '',
    `CURRENT forward_vector:\n${v}`,
    '',
    `ENTRY BODY${trimmed ? ' (head; truncated for length)' : ''}:\n${shown}`,
    '',
    'Propose a sharper forward_vector. Reply with ONLY a single JSON object, no prose around it:',
    '{"proposed_vector": "<the new one-line first-person vector>", "rationale": "<one or two sentences naming what it sharpens>"}',
  ].join('\n');
}

/**
 * Pull {proposed_vector, rationale} out of the worker's raw stdout. A capable
 * model may wrap the JSON in prose or a fence, so scan for the LAST balanced
 * {...} that parses with a string `proposed_vector`. Returns null if none.
 * (Mirrors companion-lane's extractResult brace-scan, specialized to this
 * contract.) Pure.
 */
export function extractGeneration(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const text = raw.trim();
  const objs = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '{') continue;
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < text.length; j += 1) {
      const c = text[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === '{') depth += 1;
      else if (c === '}') { depth -= 1; if (depth === 0) { objs.push(text.slice(i, j + 1)); break; } }
    }
  }
  for (let k = objs.length - 1; k >= 0; k -= 1) {
    try {
      const obj = JSON.parse(objs[k]);
      if (obj && typeof obj.proposed_vector === 'string') {
        return {
          proposedVector: obj.proposed_vector.trim(),
          rationale: typeof obj.rationale === 'string' ? obj.rationale.trim() : '',
        };
      }
    } catch (_) { /* try the next candidate */ }
  }
  return null;
}

// Resolve a candidate (by palace-relative path, preferred, or by title) to the
// full readEntry shape — body + the live forward_vector. Returns null if the
// entry can't be found / read.
function resolveEntry(palaceRoot, candidate) {
  if (candidate && typeof candidate.path === 'string' && candidate.path.trim()) {
    const e = readEntry(palaceRoot, candidate.path.trim());
    if (e) return e;
  }
  const title = candidate && typeof candidate.title === 'string' ? candidate.title.trim() : '';
  if (!title) return null;
  const abs = findEntryFile(palaceRoot, title);
  if (!abs) return null;
  return readEntry(palaceRoot, relative(palaceRoot, abs));
}

/**
 * Generate a sharper forward_vector for ONE entry. Reads it, prompts a model,
 * parses + validates the reply. Never throws; returns a structured result.
 *
 * Validity gates (so the proposal we build is always applicable + meaningful):
 *   - the entry resolves + reads,
 *   - the model returned a parseable {proposed_vector},
 *   - the proposed vector is non-empty and SINGLE-LINE (set-vector refuses a
 *     multi-line value — match that here so the button never offers a reject),
 *   - the proposed vector actually DIFFERS from the current (a no-op tuning is
 *     not worth a proposal).
 *
 * @param {object} args
 * @param {string}  args.palaceRoot
 * @param {{path?:string, title?:string}} args.candidate
 * @param {string}  [args.model]
 * @param {(argv:string[])=>string} [args.runImpl] — test seam; returns raw stdout
 * @returns {{ok:true, path, title, currentVector, proposedVector, rationale} | {ok:false, status, error, path?, title?}}
 */
export function generateVectorTuning({ palaceRoot, candidate, model, runImpl } = {}) {
  if (!palaceRoot) return { ok: false, status: 500, error: 'no palace root configured' };
  const entry = resolveEntry(palaceRoot, candidate);
  if (!entry) {
    const ref = (candidate && (candidate.path || candidate.title)) || '(unknown)';
    return { ok: false, status: 404, error: `entry not found: ${ref}` };
  }

  const title = entry.title;
  const currentVector = typeof entry.frontmatter?.forward_vector === 'string'
    ? entry.frontmatter.forward_vector.trim() : '';
  const prompt = buildGenerationPrompt({ title, currentVector, body: entry.body });

  let raw;
  try {
    raw = (runImpl || defaultRun)(generateArgv(prompt, model));
  } catch (e) {
    return { ok: false, status: 502, error: `generation worker failed: ${e.message}`, path: entry.path, title };
  }

  const parsed = extractGeneration(raw);
  if (!parsed) {
    return { ok: false, status: 422, error: 'generation returned no parseable {proposed_vector}', path: entry.path, title };
  }
  const proposedVector = parsed.proposedVector;
  if (!proposedVector) {
    return { ok: false, status: 422, error: 'generation returned an empty proposed_vector', path: entry.path, title };
  }
  if (proposedVector.includes('\n')) {
    return { ok: false, status: 422, error: 'proposed_vector must be a single line (set-vector refuses multi-line)', path: entry.path, title };
  }
  if (currentVector && proposedVector === currentVector) {
    return { ok: false, status: 422, error: 'proposed_vector is identical to the current one (no-op)', path: entry.path, title };
  }

  return {
    ok: true,
    path: entry.path,
    title,
    currentVector,
    proposedVector,
    rationale: parsed.rationale,
  };
}

// ── label_enrichment: generate a register `label` for an existing typed link ──

// The per-family register vocabulary, lifted verbatim from [[Resonant Link
// Labels]] § Vocabulary per Family — that entry's own forward_vector asks to
// "become the first thing a Weave worker reads before proposing new links", so
// the generator is grounded in it. Starting points, not a closed set: the model
// may coin a fresh register if it fits better. Taxonomy types (exemplifies /
// member-of) have no resonance family — the prompt falls back to a generic ask.
export const LABEL_FAMILY_VOCAB = {
  mirrors: ['rhymes-with', 'echoes', 'refracts', 'harmonizes', 'shadows', 'is-the-water-of', 'is-the-music-of', 'haunts'],
  enables: ['unlocked', 'pressured-into', 'seduced-toward', 'cleared-the-path-for', 'metabolized-into', 'is-the-engine-of', 'made-room-for', 'scaffolds'],
  spawned: ['midwifed', 'crystallized-into', 'precipitated', 'was-born-as', 'forced-into-existence', 'hatched'],
  'emerged-from': ['fermented-from', 'distilled-from', 'escaped-from', 'grew-through', 'was-waiting-in', 'crystallized-from'],
  deepens: ['unfolds-within', 'makes-precise', 'gives-body-to', 'operationalizes', 'embodies', 'grounds'],
  'couples-with': ['dances-with', 'feeds', 'requires', 'completes', 'entangles-with', 'beats-with', 'resonates-with'],
  contradicts: ['refuses', 'mourns', 'corrects', 'argues-with-love', 'exceeds', 'breaks-open', 'is-the-shadow-of', 'troubles'],
  'connects-to': ['orbits', 'touches', 'gestures-toward', 'notices', 'is-in-conversation-with', 'rhymes-at-a-distance', 'echoes-faintly'],
};

// Each body is capped tighter than the single-entry vector case — a label read
// weighs two entries at once.
const LABEL_BODY_CHARS = 3000;
const excerpt = (body) => {
  const raw = typeof body === 'string' ? body : '';
  return raw.length > LABEL_BODY_CHARS ? `${raw.slice(0, LABEL_BODY_CHARS)}\n…(truncated)` : raw;
};

/**
 * The label-generation prompt: the two-layer (type/label) discipline + the
 * link's register family + both entries. Pure + exported so a test can assert
 * what the model is asked. Asks for a single JSON object.
 */
export function buildLabelPrompt({ sourceTitle, sourceBody, targetTitle, targetBody, type }) {
  const fam = LABEL_FAMILY_VOCAB[type];
  const vocabLine = fam
    ? `The "${type}" family's registers (starting points, not exhaustive — coin a sharper one if it fits): ${fam.join(', ')}.`
    : `("${type}" has no preset register family — name the specific register in its spirit.)`;
  return [
    'You are choosing a `label` for ONE typed link in the palace knowledge graph.',
    `The link: [[${sourceTitle}]] --(${type})--> [[${targetTitle}]].`,
    '',
    'Every palace link has two layers (see [[Resonant Link Labels]]): the `type` is the SKELETON — what KIND of relationship holds, handled by traversal. The `label` is the FLESH — a single word or hyphenated phrase naming the relationship\'s specific REGISTER: its emotional temperature and cultural resonance. `father` / `pop` / `dad` are one relationship in three registers. Your job is to name THIS link\'s register.',
    '',
    vocabLine,
    '',
    'Rules: lower-case; ONE word or a hyphenated phrase (no spaces); evocative over clinical; it must NOT merely restate the type — it should say something the type alone cannot. Ground it in what the two entries actually are (below); never invent a relationship the text does not support.',
    '',
    `SOURCE — ${sourceTitle}:\n${excerpt(sourceBody)}`,
    '',
    `TARGET — ${targetTitle}:\n${excerpt(targetBody)}`,
    '',
    'Reply with ONLY a single JSON object, no prose around it:',
    '{"label": "<the register word>", "rationale": "<one sentence: what it names that the type cannot>"}',
  ].join('\n');
}

/**
 * Pull {label, rationale} out of the worker's raw stdout — the last balanced
 * {...} that parses with a string `label`. Pure. (Same brace-scan as
 * extractGeneration, specialized to this contract.)
 */
export function extractLabel(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const text = raw.trim();
  const objs = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== '{') continue;
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < text.length; j += 1) {
      const c = text[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === '{') depth += 1;
      else if (c === '}') { depth -= 1; if (depth === 0) { objs.push(text.slice(i, j + 1)); break; } }
    }
  }
  for (let k = objs.length - 1; k >= 0; k -= 1) {
    try {
      const obj = JSON.parse(objs[k]);
      if (obj && typeof obj.label === 'string') {
        return { label: obj.label.trim(), rationale: typeof obj.rationale === 'string' ? obj.rationale.trim() : '' };
      }
    } catch (_) { /* try the next candidate */ }
  }
  return null;
}

/**
 * Generate a register `label` for ONE typed link. Reads BOTH ends, prompts a
 * model grounded in the link's register family, parses + validates. Never
 * throws; returns a structured result.
 *
 * Validity gates: both entries resolve; a parseable {label}; the label is
 * non-empty, a single token / hyphenated phrase (no whitespace — set-label /
 * §4 require it), and NOT a bare restatement of the `type` (which would add
 * nothing). The label is lower-cased to the §4 convention.
 *
 * @param {object} args
 * @param {string}  args.palaceRoot
 * @param {{source:string, target:string, type:string}} args.candidate — source/target are palace paths
 * @param {string}  [args.model]
 * @param {(argv:string[])=>string} [args.runImpl] — test seam; returns raw stdout
 * @returns {{ok:true, source, sourceTitle, target, targetTitle, type, label, rationale} | {ok:false, status, error}}
 */
export function generateLabel({ palaceRoot, candidate, model, runImpl } = {}) {
  if (!palaceRoot) return { ok: false, status: 500, error: 'no palace root configured' };
  const type = candidate && typeof candidate.type === 'string' ? candidate.type.trim() : '';
  if (!type) return { ok: false, status: 422, error: 'no link type to label' };
  const src = candidate && typeof candidate.source === 'string' ? readEntry(palaceRoot, candidate.source) : null;
  const tgt = candidate && typeof candidate.target === 'string' ? readEntry(palaceRoot, candidate.target) : null;
  if (!src || !tgt) {
    return { ok: false, status: 404, error: `link endpoint not found: ${(candidate && (candidate.source + ' -> ' + candidate.target)) || '(unknown)'}` };
  }

  const prompt = buildLabelPrompt({ sourceTitle: src.title, sourceBody: src.body, targetTitle: tgt.title, targetBody: tgt.body, type });

  let raw;
  try {
    raw = (runImpl || defaultRun)(generateArgv(prompt, model));
  } catch (e) {
    return { ok: false, status: 502, error: `generation worker failed: ${e.message}`, source: src.path, target: tgt.path, type };
  }

  const parsed = extractLabel(raw);
  if (!parsed || !parsed.label) {
    return { ok: false, status: 422, error: 'generation returned no parseable {label}', source: src.path, target: tgt.path, type };
  }
  const label = parsed.label.toLowerCase();
  if (/\s/.test(label)) {
    return { ok: false, status: 422, error: 'label must be a single word or hyphenated phrase (no spaces)', source: src.path, target: tgt.path, type };
  }
  if (label === type.toLowerCase()) {
    return { ok: false, status: 422, error: 'label merely restates the type (no register added)', source: src.path, target: tgt.path, type };
  }

  return {
    ok: true,
    source: src.path,
    sourceTitle: src.title,
    target: tgt.path,
    targetTitle: tgt.title,
    type,
    label,
    rationale: parsed.rationale,
  };
}
