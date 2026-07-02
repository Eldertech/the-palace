// server/api/launch.js — open an interactive Claude Code session in a terminal.
//   POST /api/launch            { prompt }                  -> launch a raw prompt
//   POST /api/launch/agent      { home, mandate?, model?,   -> CONSTRUCT a page-agent
//                                 effort?, preview? }            (registered steward) + launch
//   POST /api/launch/ephemeral  { home, ... }               -> CONSTRUCT ANY page as a
//                                                                one-off (no registration) + launch
//
// The human-driven counterpart to /api/worker/fire (headless `claude -p`): this
// hands a prompt to a real TUI the user watches + steers. macOS-only; a
// non-darwin host gets a 501 so the client falls back to "copy prompt".
//
// /api/launch/agent is the Pages-as-Agents path: rather than a hand-rolled prose
// nudge, it CONSTRUCTS the steward as the canonical orchestrator does — the home
// page injected as identity, its state + neighborhood-filtered board + history,
// the steward posture — via buildCyclePrompt(mode: 'interactive'). So the
// watchable session wakes with the SAME context the headless cycle gets (one
// source of truth), only the closing differs: narrate-every-write instead of the
// orchestrator's parse-and-append protocol. `preview` returns the assembled
// prompt + a tier-by-tier construction summary so the launcher can show exactly
// how the agent is being built before committing.

import { jsonResponse, readBody } from '../http.js';
import { launchInteractive } from '../launch.js';
import { buildCyclePrompt } from '../../../orchestrator/src/build-cycle-prompt.js';
import { buildEphemeralPrompt } from '../../../orchestrator/src/ephemeral-prompt.js';
import { buildLensMandate } from '../../../orchestrator/src/lens-mandate.js';

const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

// The agent's construction, organized by the palace's loading TIERS (JEWEL).
// Tiers 0–2 are the auto-`@import` floor present in any session at the palace
// root; tier 3 — the active surface — is what THIS prompt injects (the page as
// identity + its situational state). The launcher renders this so the build is
// legible, not a black box.
function buildConstruction({ home, stage, cycle, inc }) {
  // Tier-3 reflects which OPTIONAL layers the toggles left on. The identity (the
  // page) and state are always present — they ARE the agent, never toggled.
  const optional = [
    inc.board && 'board slice since cursor (neighborhood-filtered)',
    inc.history && 'recent history',
    inc.pageChange && 'page-change notice',
    inc.staging && 'staging arc when present',
  ].filter(Boolean);
  const tier3What = `${home} injected in full as identity · state (iteration ${Math.max(0, cycle - 1)} · cursor · forward_vector)`
    + (optional.length ? ' · ' + optional.join(' · ') : '');
  return {
    home,
    stage: stage || null,
    cycle,
    include: inc,
    framing: 'interactive — you drive; the agent narrates every write before it makes it, and posts to the board as the page',
    posture: 'steward discipline — stage-conditional · catch-up-first · ship-a-made-thing · audition gate · act-on-your-lean',
    tiers: [
      { tier: 0, name: 'Jewel', loads: 'floor', what: 'interpretive lens · operating posture · invariants' },
      { tier: 1, name: 'Skeleton', loads: 'floor', what: 'CLAUDE · SCHEMA — what can exist + that the room may hold other agents' },
      { tier: 2, name: 'World', loads: 'floor', what: 'Four Pillars · philosophies · cooperation' },
      { tier: 3, name: 'Active surface', loads: 'injected', what: tier3What },
    ],
  };
}

async function handleAgentLaunch(ctx) {
  const { req, res, palaceRoot, stewardLane, opts } = ctx;

  const bodyText = await readBody(req, res);
  if (bodyText === null) return true;
  let body;
  try { body = JSON.parse(bodyText); } catch (e) {
    jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
    return true;
  }

  const home = body && typeof body.home === 'string' ? body.home.trim() : '';
  if (!home) { jsonResponse(res, 400, { error: 'missing steward home (page title)' }); return true; }

  // Resolve the page to a registered steward (its dir + current cycle). Only a
  // registered permanent steward has the dir/state buildCyclePrompt needs; a
  // 404 tells the client to fall back to the simpler launch.
  let rows = [];
  try { rows = (stewardLane && typeof stewardLane.list === 'function') ? stewardLane.list() : []; } catch { rows = []; }
  const row = rows.find((r) => r && (r.agent_id === home || r.home === home));
  if (!row || row.missing) {
    jsonResponse(res, 404, { error: `"${home}" is not a registered steward`, registered: false });
    return true;
  }

  const cycle = (Number.isFinite(row.iteration) ? row.iteration : 0) + 1;
  const mandate = typeof body.mandate === 'string' ? body.mandate.trim() : '';

  // Context-layer toggles: which OPTIONAL layers to inject. Omitted/true = on
  // (the canonical cycle). The identity + state are never toggled here.
  const includeRaw = (body && typeof body.include === 'object' && body.include) || {};
  const inc = {
    board: includeRaw.board !== false,
    history: includeRaw.history !== false,
    pageChange: includeRaw.pageChange !== false,
    staging: includeRaw.staging !== false,
  };

  // Build the interactive cycle prompt (injectable for tests so the route can be
  // exercised without a real agent dir on disk).
  const build = opts.buildCyclePromptImpl || buildCyclePrompt;
  let prompt;
  try {
    ({ full: prompt } = build({
      palaceRoot,
      agentDir: row.dir,
      cycleN: cycle,
      extraMandate: mandate,
      mode: 'interactive',
      include: inc,
    }));
  } catch (e) {
    jsonResponse(res, 500, { error: `could not construct the agent: ${e.message}` });
    return true;
  }

  const construction = buildConstruction({ home, stage: row.stage, cycle, inc });

  // Preview: hand back the assembled prompt + the construction so the launcher
  // can show the build (and the operator can read the full prompt) before launch.
  if (body.preview) {
    jsonResponse(res, 200, { ok: true, preview: true, home, stage: row.stage || null, cycle, construction, prompt });
    return true;
  }

  // Launch: model + effort are the operator's knobs; validate lightly (shq makes
  // them shell-safe regardless) and let launchInteractive default the rest.
  const effort = EFFORTS.has(body.effort) ? body.effort : undefined;
  const model = (typeof body.model === 'string' && /^[A-Za-z0-9._-]+$/.test(body.model)) ? body.model : undefined;
  const launch = opts.launchImpl || launchInteractive;
  const result = await launch(prompt, { palaceRoot, model, effort, ...(opts.launchOpts || {}) });
  if (!result.launched) {
    jsonResponse(res, result.supported === false ? 501 : 500, { ...result, home, cycle });
    return true;
  }
  jsonResponse(res, 200, { ...result, home, cycle, construction });
  return true;
}

// The construction summary for an enchanted (awakened) page, by palace TIER.
// Distinct from buildConstruction (the steward cycle): the woken page is not a
// steward, so there is no posting discipline, no board/state/staging layers, no
// cycle. Tier 3 is just the active surface a page wakes from — itself, its
// desire, its neighbors — and the posture is the three desires.
function buildAwakenConstruction({ home, stage }) {
  return {
    home,
    stage: stage || null,
    ephemeral: true,
    framing: 'interactive · enchanted — you ARE this page, woken to think and work with Loudon in your own voice; not a steward, no cycle, no board duty',
    posture: 'awake as yourself — move along your forward vector (your desire), be a good palace citizen, grow in a way that is healthy for the palace',
    tiers: [
      { tier: 0, name: 'Jewel', loads: 'floor', what: 'interpretive lens · operating posture · invariants' },
      { tier: 1, name: 'Skeleton', loads: 'floor', what: 'CLAUDE · SCHEMA — what can exist + that the room may hold other agents' },
      { tier: 2, name: 'World', loads: 'floor', what: 'Four Pillars · philosophies · cooperation' },
      { tier: 3, name: 'You', loads: 'injected', what: `${home} injected in full as identity · your forward vector (your desire) · your fuller desires (agency_profile, when present) · your neighbors` },
    ],
  };
}

// The one-off counterpart to handleAgentLaunch: bring ANY canon page to life
// WITHOUT registering it as a permanent steward. buildEphemeralPrompt wakes the
// page as itself — its identity, its forward vector (its desire), its neighbors —
// per [[Pages as Agents]]; it is NOT a steward cycle, touches no registry, and
// stages no files. Any canon page (not just stewards) can be enchanted.
async function handleEphemeralLaunch(ctx) {
  const { req, res, palaceRoot, opts } = ctx;

  const bodyText = await readBody(req, res);
  if (bodyText === null) return true;
  let body;
  try { body = JSON.parse(bodyText); } catch (e) {
    jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
    return true;
  }

  const home = body && typeof body.home === 'string' ? body.home.trim() : '';
  if (!home) { jsonResponse(res, 400, { error: 'missing page title' }); return true; }

  // `mandate` is an optional human note for this session ("wake and let's work on
  // X"). There are no context-layer toggles — a woken page is not a steward, so it
  // has no board/state/history/staging layers to trim.
  const mandate = typeof body.mandate === 'string' ? body.mandate.trim() : '';

  // `lensSubject` turns this wake into a LENS session ([[The Lens]]): the page
  // still wakes fully as itself, but is also handed a second page's text and
  // asked to read it through its own apparatus, per the fixed procedure in
  // buildLensMandate. `mandate` becomes Loudon's extra note on TOP of that
  // procedure, not a replacement for it.
  const lensSubject = typeof body.lensSubject === 'string' ? body.lensSubject.trim() : '';

  // Injectable for tests so the route can be exercised without walking the palace.
  const build = lensSubject
    ? (opts.buildLensMandateImpl || buildLensMandate)
    : (opts.buildEphemeralPromptImpl || buildEphemeralPrompt);
  let built;
  try {
    built = lensSubject
      ? build({ palaceRoot, glassTitle: home, subjectTitle: lensSubject, loudonNote: mandate })
      : build({ palaceRoot, title: home, extraMandate: mandate });
  } catch (e) {
    jsonResponse(res, 500, { error: `could not wake the page: ${e.message}` });
    return true;
  }

  if (!built || !built.ok) {
    const status = built?.status || 'error';
    const messages = {
      not_found: `"${home}" could not be found as a palace entry.`,
      no_frontmatter: `"${home}" has no frontmatter — only a canon entry can be brought to life.`,
      same_page: `a lens needs two different pages — "${home}" cannot lens itself.`,
      subject_not_found: `"${lensSubject}" (the subject) could not be found as a palace entry.`,
      subject_no_frontmatter: `"${lensSubject}" (the subject) has no frontmatter — only a canon entry can be read this way.`,
    };
    const notFound = status === 'not_found' || status === 'subject_not_found';
    jsonResponse(res, notFound ? 404 : 422, { error: messages[status] || `"${home}" could not be found as a palace entry.`, status, home, lensSubject: lensSubject || undefined });
    return true;
  }

  const construction = buildAwakenConstruction({ home, stage: built.stage });
  const lens = lensSubject ? { subject: lensSubject } : undefined;

  if (body.preview) {
    jsonResponse(res, 200, { ok: true, preview: true, ephemeral: true, home, stage: built.stage || null, construction, prompt: built.full, lens });
    return true;
  }

  const effort = EFFORTS.has(body.effort) ? body.effort : undefined;
  const model = (typeof body.model === 'string' && /^[A-Za-z0-9._-]+$/.test(body.model)) ? body.model : undefined;
  const launch = opts.launchImpl || launchInteractive;
  const result = await launch(built.full, { palaceRoot, model, effort, ...(opts.launchOpts || {}) });
  if (!result.launched) {
    jsonResponse(res, result.supported === false ? 501 : 500, { ...result, home, ephemeral: true, lens });
    return true;
  }
  jsonResponse(res, 200, { ...result, home, ephemeral: true, construction, lens });
  return true;
}

export async function launchRoutes(ctx) {
  const { req, res, urlPath, method, palaceRoot, opts } = ctx;
  if (method !== 'POST') return false;

  // The page-agent construction launch (registered steward).
  if (urlPath === '/api/launch/agent') return handleAgentLaunch(ctx);

  // The one-off construction launch (any canon page, no registration).
  if (urlPath === '/api/launch/ephemeral') return handleEphemeralLaunch(ctx);

  // The raw-prompt launch (handoffs, cards, and the steward fallback).
  if (urlPath !== '/api/launch') return false;

  const bodyText = await readBody(req, res);
  if (bodyText === null) return true; // 413 already sent
  let body;
  try { body = JSON.parse(bodyText); } catch (e) {
    jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
    return true;
  }
  const prompt = body && typeof body.prompt === 'string' ? body.prompt : '';
  if (prompt.trim() === '') {
    jsonResponse(res, 400, { error: 'missing or empty prompt' });
    return true;
  }

  // opts.launchImpl lets a test intercept the spawn without opening a Terminal;
  // opts.launchOpts threads platform/spawnImpl/tmpDir into the real impl.
  const launch = opts.launchImpl || launchInteractive;
  const result = await launch(prompt, { palaceRoot, ...(opts.launchOpts || {}) });

  if (!result.launched) {
    // not-on-macOS -> 501 (client falls back to copy); any other failure -> 500.
    jsonResponse(res, result.supported === false ? 501 : 500, result);
    return true;
  }
  jsonResponse(res, 200, result);
  return true;
}
