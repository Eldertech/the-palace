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
