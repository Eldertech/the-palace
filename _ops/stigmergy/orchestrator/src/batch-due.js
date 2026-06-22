// batch-due.js — the single per-steward "is it due for a cycle?" predicate.
//
// Shared by the two readers that must never disagree:
//   - batch-plan.js  — the cron's actual due-set (which stewards a heartbeat run
//     would cycle).
//   - steward-lane.js stewardRow.due_next_run — the STIGMERGY STEWARDS deck's
//     "due next run?" column (the watch surface).
//
// Extracting it means the terminal's column and the scheduler's behavior come
// from ONE rule. The reason strings are kept byte-identical to batch-plan's
// historical output (the CLI test asserts on them), so this is a pure
// refactor-with-reuse, not a behavior change.

export const SKIP_STAGES = new Set(['dormant', 'composting']);
export const DEFAULT_DEBOUNCE_HOURS = 12;

/**
 * Decide whether a steward is due for a cycle, applying the stage floor (never
 * wake a dormant/composting page), the project-status gate (only active /
 * unknown), and the recency debounce (skip if cycled within `debounceHours`).
 *
 * status is optional: when absent (a caller that has no project `status` field,
 * e.g. the STEWARDS row) the status gate is simply not applied — only the stage
 * floor + debounce decide. batch-plan always passes a string ('unknown' floor),
 * so its behavior is unchanged.
 *
 * @returns {{ due: boolean, reason: string }}
 */
export function dueForCycle({ stage, status, lastActive, now = Date.now(), debounceHours = DEFAULT_DEBOUNCE_HOURS, ignoreDebounce = false } = {}) {
  if (SKIP_STAGES.has(stage)) return { due: false, reason: `stage_${stage}_do_not_touch` };
  if (status && status !== 'active' && status !== 'unknown') return { due: false, reason: `status_${status}` };
  if (lastActive && !ignoreDebounce) {
    const ageH = (now - Date.parse(lastActive)) / 3.6e6;
    if (isFinite(ageH) && ageH < debounceHours) {
      return { due: false, reason: `cycled_${ageH.toFixed(1)}h_ago_within_debounce` };
    }
  }
  return { due: true, reason: 'due' };
}
