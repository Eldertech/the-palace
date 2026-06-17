// server/api/launch.js — open an interactive Claude Code session in a terminal.
//   POST /api/launch        { prompt }                  -> launch a raw prompt
//   POST /api/launch/agent  { home, mandate?, model?,   -> CONSTRUCT a page-agent
//                             effort?, preview? }            (steward) and launch it
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

const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);

// The agent's construction, organized by the palace's loading TIERS (JEWEL).
// Tiers 0–2 are the auto-`@import` floor present in any session at the palace
// root; tier 3 — the active surface — is what THIS prompt injects (the page as
// identity + its situational state). The launcher renders this so the build is
// legible, not a black box.
function buildConstruction({ home, stage, cycle }) {
  return {
    home,
    stage: stage || null,
    cycle,
    framing: 'interactive — you drive; the agent narrates every write before it makes it, and posts to the board as the page',
    posture: 'steward discipline — stage-conditional · catch-up-first · ship-a-made-thing · audition gate · act-on-your-lean',
    tiers: [
      { tier: 0, name: 'Jewel', loads: 'floor', what: 'interpretive lens · operating posture · invariants' },
      { tier: 1, name: 'Skeleton', loads: 'floor', what: 'CLAUDE · SCHEMA — what can exist + that the room may hold other agents' },
      { tier: 2, name: 'World', loads: 'floor', what: 'Four Pillars · philosophies · cooperation' },
      { tier: 3, name: 'Active surface', loads: 'injected', what: `${home} injected in full as identity · state (iteration ${Math.max(0, cycle - 1)} · cursor · forward_vector) · board slice since cursor (neighborhood-filtered) · recent history · page-change notice · staging arc when present` },
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
    }));
  } catch (e) {
    jsonResponse(res, 500, { error: `could not construct the agent: ${e.message}` });
    return true;
  }

  const construction = buildConstruction({ home, stage: row.stage, cycle });

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
  const result = launch(prompt, { palaceRoot, model, effort, ...(opts.launchOpts || {}) });
  if (!result.launched) {
    jsonResponse(res, result.supported === false ? 501 : 500, { ...result, home, cycle });
    return true;
  }
  jsonResponse(res, 200, { ...result, home, cycle, construction });
  return true;
}

export async function launchRoutes(ctx) {
  const { req, res, urlPath, method, palaceRoot, opts } = ctx;
  if (method !== 'POST') return false;

  // The page-agent construction launch (steward).
  if (urlPath === '/api/launch/agent') return handleAgentLaunch(ctx);

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
  const result = launch(prompt, { palaceRoot, ...(opts.launchOpts || {}) });

  if (!result.launched) {
    // not-on-macOS -> 501 (client falls back to copy); any other failure -> 500.
    jsonResponse(res, result.supported === false ? 501 : 500, result);
    return true;
  }
  jsonResponse(res, 200, result);
  return true;
}
