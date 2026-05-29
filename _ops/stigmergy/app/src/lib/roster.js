// Agent roster derivation — reduce a flat message list to per-agent state.

import { healthColor, tsCompare } from './format.js';

/**
 * Build an agent-roster entry per unique `from` field across messages.
 *
 * Returns an array of:
 *   {
 *     agent_id,
 *     last_ts,           // ISO ts of the agent's most recent message
 *     latest_score,      // 'green'|'yellow'|'red' or undefined
 *     latest_context_pct,// 0..1 or undefined
 *     latest_model,      // string or undefined
 *     message_count,
 *     context_trend      // last 3 context_pct values, only if monotonically
 *                        //   non-decreasing across the agent's last 3 messages
 *                        //   AND the climb across them is at least +5%
 *                        //   (else: undefined)
 *   }
 *
 * Sorted by last_ts descending (most recent first). Anonymous messages
 * (no `from`) are skipped.
 */
export function buildRoster(messages) {
  if (!Array.isArray(messages)) return [];
  const byAgent = new Map();
  for (const m of messages) {
    if (!m || typeof m.from !== 'string' || m.from === '') continue;
    if (!byAgent.has(m.from)) byAgent.set(m.from, []);
    byAgent.get(m.from).push(m);
  }
  const entries = [];
  for (const [agent_id, msgs] of byAgent) {
    // Sort agent's messages chronologically by ts (parsed epoch, tz-safe), so
    // the last entry is the agent's genuinely most-recent message.
    msgs.sort((a, b) => tsCompare(a.ts, b.ts));
    const last = msgs[msgs.length - 1];
    const lastThree = msgs.slice(-3);
    const ctxs = lastThree
      .map((m) => m?.health?.context_pct)
      .filter((v) => typeof v === 'number');
    let context_trend;
    if (ctxs.length >= 3) {
      const climbing = ctxs.every((v, i) => i === 0 || v >= ctxs[i - 1]);
      const rise = ctxs[ctxs.length - 1] - ctxs[0];
      if (climbing && rise >= 0.05) context_trend = ctxs;
    }
    entries.push({
      agent_id,
      last_ts: last?.ts,
      latest_score: last?.health?.score,
      latest_context_pct: last?.health?.context_pct,
      latest_model: last?.health?.model,
      message_count: msgs.length,
      context_trend,
    });
  }
  entries.sort((a, b) => tsCompare(b.last_ts, a.last_ts));
  return entries;
}

export { healthColor };
