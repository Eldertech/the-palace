// server/workers.js — explicit construction of the two long-lived worker lanes
// (the Enrichment actuator + the steward lane), lifted out of the middleware
// factory so the dependency is visible rather than a side effect of plugin
// creation, and so tests keep a single, obvious injection point (audit §4).

import { resolve } from 'node:path';
import { createActuator } from './actuator.js';
import { createStewardLane } from './steward-lane.js';
import { createCompanionLane } from './companion-lane.js';

/**
 * Build — or accept injected — the Enrichment actuator and the steward lane.
 *
 * `opts.actuator` / `opts.stewardLane` let tests inject stub-backed lanes so the
 * test path NEVER spawns a real `claude -p` worker. The STIGMERGY_STUB_WORKER
 * gate fires a harmless stub instead (and dryReap for the steward) so an e2e run
 * or smoke-test can exercise the full fire->log->reap cycle without spawning an
 * autonomous agent or mutating the real palace. Env unset → the real worker.
 *
 * @param {string} palaceRoot
 * @param {{ actuator?: object, stewardLane?: object, companionLane?: object }} [opts]
 * @returns {{ actuator: object, stewardLane: object, companionLane: object }}
 */
export function buildWorkers(palaceRoot, opts = {}) {
  // One global actuator per palace root (scar #4: single global worker per lane).
  // The lane state lives under _ops/stigmergy/.actuator/.
  let actuator = opts.actuator;
  if (!actuator) {
    if (process.env.STIGMERGY_STUB_WORKER) {
      const stub = resolve(palaceRoot, '_ops/stigmergy/app/tests/fixtures/stub-worker.mjs');
      actuator = createActuator({
        palaceRoot,
        buildArgv: () => ['node', stub, '--permission-mode', 'bypassPermissions', '--sleep', '700', '--emit', 'success'],
      });
    } else {
      actuator = createActuator({ palaceRoot });
    }
  }

  // The steward lane: a SEPARATE actuator lane (.actuator-steward/) that fires a
  // permanent-steward cycle and reaps it with the orchestrator's processCycle.
  // Same STIGMERGY_STUB_WORKER gate; when stubbed it fires the stub worker AND
  // sets dryReap so a live e2e fire never mutates the real palace. Tests inject
  // opts.stewardLane (a temp-palace lane) to prove the genuine consume.
  let stewardLane = opts.stewardLane;
  if (!stewardLane) {
    if (process.env.STIGMERGY_STUB_WORKER) {
      const stewardStub = resolve(palaceRoot, '_ops/stigmergy/app/tests/fixtures/stub-steward-worker.mjs');
      stewardLane = createStewardLane({
        palaceRoot,
        buildArgv: () => ['node', stewardStub, '--permission-mode', 'bypassPermissions', '--sleep', '800'],
        dryReap: true,
      });
    } else {
      stewardLane = createStewardLane({ palaceRoot });
    }
  }

  // The companion lane: a SEPARATE actuator lane (.actuator-companion/) that
  // fires an interactive entry-agent turn and reaps it by posting the reply to
  // the board. Same STIGMERGY_STUB_WORKER gate; when stubbed it fires a stub
  // that emits a canned reply AND sets dryReap so a live e2e fire never mutates
  // the real board. Tests inject opts.companionLane (a temp-palace lane) to
  // prove the genuine reap → post cycle.
  let companionLane = opts.companionLane;
  if (!companionLane) {
    if (process.env.STIGMERGY_STUB_WORKER) {
      const companionStub = resolve(palaceRoot, '_ops/stigmergy/app/tests/fixtures/stub-companion-worker.mjs');
      companionLane = createCompanionLane({
        palaceRoot,
        buildArgv: (prompt) => ['node', companionStub, '--permission-mode', 'bypassPermissions', '--sleep', '500'],
        dryReap: true,
      });
    } else {
      companionLane = createCompanionLane({ palaceRoot });
    }
  }

  return { actuator, stewardLane, companionLane };
}
